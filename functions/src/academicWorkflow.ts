import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { sanitizeScheduleProposalSlot, canTransitionCurriculumApproval, canTransitionScheduleApproval } from './academicWorkflowCore'

const db = () => admin.firestore()
const clean = (value: unknown) => String(value ?? '').trim()

function identity(request: { auth?: { uid: string; token: Record<string, unknown> } | null }, requireCollege = true) {
  const auth = request.auth
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Sign in is required')
  const role = clean(auth.token.role).toLowerCase()
  const collegeId = clean(auth.token.collegeId)
  if (requireCollege && !collegeId) throw new HttpsError('permission-denied', 'Your account is not linked to a college')
  return { uid: auth.uid, role, collegeId }
}

function programScopeMatches(profile: Record<string, unknown>, branch: string): boolean {
  const normalize = (value: unknown) => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '')
  const scopes: unknown[] = [profile.branch, profile.programme, profile.program, profile.department, profile.departmentName]
  for (const key of ['branches', 'programmes', 'programs', 'departments']) {
    if (Array.isArray(profile[key])) scopes.push(...profile[key] as unknown[])
  }
  const specified = scopes.map(normalize).filter(Boolean)
  // Legacy HOD records without programme metadata remain assignable by
  // Operations; whenever scope is recorded, enforce it server-side.
  return specified.length === 0 || specified.includes(normalize(branch))
}

async function enqueueRoleTask(input: {
  collegeId: string; role: 'operations' | 'principal' | 'hod'; title: string; message: string; path: string; sourceId: string
}) {
  const snapshot = await db().collection('users')
    .where('collegeId', '==', input.collegeId)
    .where('role', '==', input.role)
    .limit(100)
    .get()
  const recipients = new Set(snapshot.docs.map((doc) => doc.id))
  // Legacy office identities can be present only in the college roster.
  if (input.role === 'operations' && recipients.size === 0) {
    const office = await db().collection('colleges').doc(input.collegeId).collection('officeStaff')
      .where('role', '==', 'operations').limit(100).get()
    office.docs.forEach((doc) => recipients.add(clean(doc.data().uid || doc.id)))
  }
  if (input.role === 'hod' && recipients.size === 0) {
    const hods = await db().collection('hods').where('collegeId', '==', input.collegeId).limit(100).get()
    hods.docs.forEach((doc) => recipients.add(clean(doc.data().uid || doc.id)))
  }
  const batch = db().batch()
  recipients.forEach((uid) => {
    if (!uid) return
    const ref = db().collection('workflowTasks').doc()
    batch.create(ref, {
      collegeId: input.collegeId,
      recipientUid: uid,
      role: input.role,
      title: input.title,
      message: input.message,
      path: input.path,
      sourceId: input.sourceId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  })
  await batch.commit()
}

export const notifyCurriculumAssignment = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30 },
  async (request) => {
    const who = identity(request, false)
    if (who.role !== 'superadmin') throw new HttpsError('permission-denied', 'Superadmin access is required')
    const curriculumId = clean(request.data?.curriculumId)
    const curriculum = await db().collection('curriculum').doc(curriculumId).get()
    if (!curriculum.exists || curriculum.data()?.approvalStatus !== 'pending_principal') {
      throw new HttpsError('failed-precondition', 'Curriculum assignment is not awaiting approval')
    }
    const data = curriculum.data()!
    try {
      await enqueueRoleTask({
        collegeId: clean(data.collegeId), role: 'principal', title: 'Curriculum approval requested',
        message: `${clean(data.title) || clean(data.branch)} is awaiting your review.`,
        path: '/admin/curriculum-approvals', sourceId: curriculumId,
      })
    } catch (error) { console.error('[AcademicWorkflow] Principal task enqueue failed', error) }
    return { notified: true }
  }
)

export const reviewCurriculumAssignment = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30 },
  async (request) => {
    const who = identity(request)
    if (who.role !== 'principal') throw new HttpsError('permission-denied', 'Only the college principal can approve assigned curriculum')
    const curriculumId = clean(request.data?.curriculumId)
    const decision = request.data?.decision === 'approved' ? 'approved' : request.data?.decision === 'returned' ? 'returned' : ''
    const note = clean(request.data?.note).slice(0, 1000)
    if (!curriculumId || !decision) throw new HttpsError('invalid-argument', 'Curriculum and decision are required')
    if (decision === 'returned' && !note) throw new HttpsError('invalid-argument', 'Add a note explaining the requested curriculum changes')
    const ref = db().collection('curriculum').doc(curriculumId)
    let ownerUid = ''
    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists || clean(snap.data()?.collegeId) !== who.collegeId) throw new HttpsError('not-found', 'Curriculum assignment not found')
      const current = snap.data()?.approvalStatus
      ownerUid = clean(snap.data()?.assignedBy || snap.data()?.createdBy)
      if (!canTransitionCurriculumApproval(current, decision)) throw new HttpsError('failed-precondition', 'This curriculum is not awaiting review')
      tx.update(ref, {
        approvalStatus: decision,
        approvalNote: note,
        approvedBy: who.uid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })
    if (decision === 'approved') {
      try {
        await enqueueRoleTask({
          collegeId: who.collegeId, role: 'operations', title: 'Curriculum approved — map faculty',
          message: 'The Principal approved a curriculum assignment. Map faculty and prepare the timetable.',
          path: '/admin/curriculum', sourceId: curriculumId,
        })
      } catch (error) { console.error('[AcademicWorkflow] Operations task enqueue failed', error) }
    } else if (ownerUid) {
      await db().collection('workflowTasks').doc().create({
        collegeId: who.collegeId, recipientUid: ownerUid, role: 'superadmin',
        title: 'Curriculum assignment returned',
        message: note || 'The Principal returned the curriculum assignment for revision.',
        path: '/superadmin/curriculum', sourceId: curriculumId, read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
    return { curriculumId, decision }
  }
)

export const submitScheduleProposal = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30 },
  async (request) => {
    const who = identity(request)
    if (who.role !== 'operations') throw new HttpsError('permission-denied', 'Operations access is required to prepare class schedules')
    const reviewerUid = clean(request.data?.reviewerUid)
    const slotInput = request.data?.slot
    const targetWeeklyScheduleId = clean(request.data?.targetWeeklyScheduleId)
    if (!reviewerUid) throw new HttpsError('invalid-argument', 'Select the programme HOD for review')
    const reviewer = await db().collection('users').doc(reviewerUid).get()
    let reviewerData: Record<string, unknown> | undefined = reviewer.data()
    if (!reviewer.exists || clean(reviewerData?.role).toLowerCase() !== 'hod' || clean(reviewerData?.collegeId) !== who.collegeId) {
      const hodSnapshot = await db().collection('hods').where('collegeId', '==', who.collegeId).limit(200).get()
      const hodDoc = hodSnapshot.docs.find((doc) => clean(doc.data().uid || doc.id) === reviewerUid)
      reviewerData = hodDoc ? { ...hodDoc.data(), uid: clean(hodDoc.data().uid || hodDoc.id), role: clean(hodDoc.data().role || 'hod') } : undefined
    }
    if (!reviewerData || (clean(reviewerData.role).toLowerCase() !== 'hod' && !reviewerData.uid) || clean(reviewerData.collegeId) !== who.collegeId) {
      throw new HttpsError('invalid-argument', 'The selected reviewer is not a HOD in this college')
    }
    let slot: ReturnType<typeof sanitizeScheduleProposalSlot>
    try { slot = sanitizeScheduleProposalSlot((slotInput || {}) as Record<string, unknown>, who.collegeId) }
    catch (error) { throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Schedule details are invalid') }
    if (!programScopeMatches(reviewerData, slot.branch)) {
      throw new HttpsError('invalid-argument', 'The selected HOD is not assigned to this programme. Select the HOD whose programme scope matches the class.')
    }
    if (targetWeeklyScheduleId) {
      const existing = await db().collection('weeklySchedules').doc(targetWeeklyScheduleId).get()
      if (!existing.exists || clean(existing.data()?.collegeId) !== who.collegeId || existing.data()?.isActive === false) {
        throw new HttpsError('not-found', 'The live schedule being revised was not found')
      }
    }
    const ref = db().collection('scheduleProposals').doc()
    await ref.create({
      collegeId: who.collegeId,
      slot,
      reviewerUid,
      reviewerName: clean(reviewerData?.name || reviewerData?.displayName || reviewerData?.email),
      targetWeeklyScheduleId: targetWeeklyScheduleId || null,
      status: 'pending_hod',
      createdBy: who.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    try {
      await db().collection('workflowTasks').doc().create({
        collegeId: who.collegeId,
        recipientUid: reviewerUid,
        role: 'hod',
        title: 'Class schedule awaiting your approval',
        message: `${slot.branch}, Semester ${slot.semester}: ${slot.subject}`,
        path: '/admin/schedule-workflow',
        sourceId: ref.id,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    } catch (error) { console.error('[AcademicWorkflow] HOD task enqueue failed', error) }
    return { proposalId: ref.id, status: 'pending_hod' }
  }
)

export const reviewScheduleProposal = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    const who = identity(request)
    if (who.role !== 'hod') throw new HttpsError('permission-denied', 'Only the assigned programme HOD can review this schedule')
    const proposalId = clean(request.data?.proposalId)
    const decision = request.data?.decision === 'approved' ? 'approved' : request.data?.decision === 'returned' ? 'returned' : ''
    const note = clean(request.data?.note).slice(0, 1000)
    if (!proposalId || !decision) throw new HttpsError('invalid-argument', 'Schedule proposal and decision are required')
    if (decision === 'returned' && !note) throw new HttpsError('invalid-argument', 'Add a note explaining the requested schedule changes')
    const proposalRef = db().collection('scheduleProposals').doc(proposalId)
    let opsUid = ''
    let publishedId = ''
    await db().runTransaction(async (tx) => {
      const proposal = await tx.get(proposalRef)
      const data = proposal.data()
      if (!proposal.exists || clean(data?.collegeId) !== who.collegeId) throw new HttpsError('not-found', 'Schedule proposal not found')
      if (clean(data?.reviewerUid) !== who.uid) throw new HttpsError('permission-denied', 'This schedule was assigned to a different HOD')
      if (!canTransitionScheduleApproval(data?.status, decision)) throw new HttpsError('failed-precondition', 'This schedule is not awaiting review')
      opsUid = clean(data?.createdBy)
      const targetId = clean(data?.targetWeeklyScheduleId)
      publishedId = `approved_${proposalId}`
      let sessionsToRetire: admin.firestore.QueryDocumentSnapshot[] = []
      if (decision === 'approved' && targetId) {
        const oldScheduleRef = db().collection('weeklySchedules').doc(targetId)
        const oldSchedule = await tx.get(oldScheduleRef)
        if (!oldSchedule.exists || clean(oldSchedule.data()?.collegeId) !== who.collegeId) {
          throw new HttpsError('not-found', 'The live schedule being revised no longer exists')
        }
        const sessions = await tx.get(db().collection('classSessions')
          .where('weeklyScheduleId', '==', targetId).limit(400))
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
        sessionsToRetire = sessions.docs.filter((session) => {
          const row = session.data()
          return clean(row.date) >= today && clean(row.status).toLowerCase() === 'scheduled'
        })
        if (sessions.docs.length === 400) {
          throw new HttpsError('resource-exhausted', 'Too many dated sessions are attached to this schedule revision; ask an administrator to archive old sessions first.')
        }
        tx.update(oldScheduleRef, { isActive: false, supersededBy: publishedId, supersededAt: admin.firestore.FieldValue.serverTimestamp() })
        sessionsToRetire.forEach((session) => tx.update(session.ref, {
          status: 'cancelled', cancellationReason: 'Schedule revised and approved',
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        }))
      }
      tx.update(proposalRef, {
        status: decision,
        reviewNote: note,
        reviewedBy: who.uid,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(decision === 'approved' ? { publishedWeeklyScheduleId: publishedId } : {}),
      })
      if (decision === 'approved') {
        const slot = sanitizeScheduleProposalSlot((data?.slot || {}) as Record<string, unknown>, who.collegeId)
        const scheduleRef = db().collection('weeklySchedules').doc(publishedId)
        tx.set(scheduleRef, {
          ...slot,
          approvalStatus: 'approved',
          approvedBy: who.uid,
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          workflowProposalId: proposalId,
          createdBy: clean(data?.createdBy),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true })
      }
    })
    if (opsUid) {
      try {
        await db().collection('workflowTasks').doc().create({
          collegeId: who.collegeId,
          recipientUid: opsUid,
          role: 'operations',
          title: decision === 'approved' ? 'Class schedule approved' : 'Schedule returned for changes',
          message: decision === 'approved' ? 'The HOD approved the schedule. Generate dated class sessions to make it visible in student class lists.' : note || 'The HOD requested changes to the schedule.',
          path: '/admin/schedule-workflow', sourceId: proposalId, read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      } catch (error) { console.error('[AcademicWorkflow] Operations task enqueue failed', error) }
    }
    return { proposalId, decision, weeklyScheduleId: decision === 'approved' ? publishedId : null }
  }
)
