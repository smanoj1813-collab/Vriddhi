import * as admin from 'firebase-admin'
import { HttpsError } from 'firebase-functions/v2/https'
import { sanitizeScheduleProposalSlot } from './academicWorkflowCore'

const db = () => admin.firestore()
const clean = (value: unknown) => String(value ?? '').trim()
const normalizeScope = (value: unknown) => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '')

type ScheduleSlotInput = Record<string, unknown>

function hodScopes(profile: Record<string, unknown>): string[] {
  const values: unknown[] = [profile.branch, profile.programme, profile.program, profile.department, profile.departmentName]
  for (const key of ['branches', 'programmes', 'programs', 'departments']) {
    if (Array.isArray(profile[key])) values.push(...profile[key] as unknown[])
  }
  return values.map(normalizeScope).filter(Boolean)
}

export function selectScheduleReviewer<T extends { uid: string; data: Record<string, unknown> }>(hods: T[], branch: string): T | null {
  const branchKey = normalizeScope(branch)
  const scoped = hods.filter((hod) => {
    const scopes = hodScopes(hod.data)
    return scopes.length > 0 && scopes.includes(branchKey)
  })
  const unscoped = hods.filter((hod) => hodScopes(hod.data).length === 0)
  const candidates = scoped.length ? scoped : (unscoped.length === 1 ? unscoped : [])
  return candidates.length === 1 ? candidates[0] : null
}

/** Selects a unique HOD for every programme and stores drafts, never live schedules. */
export async function createScheduleProposals(input: {
  collegeId: string
  createdBy: string
  slots: ScheduleSlotInput[]
}): Promise<string[]> {
  if (input.slots.length > 500) throw new HttpsError('invalid-argument', 'At most 500 schedule proposals can be submitted at once')
  if (!input.slots.length) return []

  const hodSnapshot = await db().collection('hods').where('collegeId', '==', input.collegeId).limit(200).get()
  const hods = hodSnapshot.docs.map((doc) => ({
    uid: clean(doc.data().uid || doc.id),
    data: doc.data() as Record<string, unknown>,
  })).filter((hod) => hod.uid)
  if (!hods.length) throw new HttpsError('failed-precondition', 'No programme HOD is registered for this college; schedule drafts cannot be routed for approval')

  const prepared = input.slots.map((source) => {
    let slot: ReturnType<typeof sanitizeScheduleProposalSlot>
    try { slot = sanitizeScheduleProposalSlot(source, input.collegeId) }
    catch (error) { throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Schedule details are invalid') }
    const reviewer = selectScheduleReviewer(hods, slot.branch)
    if (!reviewer) {
      throw new HttpsError('failed-precondition', `Could not identify one programme HOD for ${slot.branch}. Assign a unique HOD programme scope, then retry the timetable submission.`)
    }
    return { slot, reviewerUid: reviewer.uid, reviewerName: clean(reviewer.data.name || reviewer.data.displayName || reviewer.data.email) }
  })

  const proposals = prepared.map((entry) => ({ ...entry, ref: db().collection('scheduleProposals').doc() }))
  const proposalBatch = db().batch()
  proposals.forEach(({ slot, reviewerUid, reviewerName, ref }) => proposalBatch.create(ref, {
    collegeId: input.collegeId,
    slot,
    reviewerUid,
    reviewerName,
    targetWeeklyScheduleId: null,
    status: 'pending_hod',
    createdBy: input.createdBy,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }))
  await proposalBatch.commit()

  // Task creation is best-effort, like the primary workflow callable: a
  // notification outage must not make a successfully submitted draft appear
  // to have failed (and prompt a duplicate submission).
  try {
    const taskBatch = db().batch()
    proposals.forEach(({ slot, reviewerUid, ref }) => taskBatch.create(db().collection('workflowTasks').doc(), {
      collegeId: input.collegeId,
      recipientUid: reviewerUid,
      role: 'hod',
      title: 'Class schedule awaiting your approval',
      message: `${slot.branch}, Semester ${slot.semester}: ${slot.subject}`,
      path: '/admin/schedule-workflow',
      sourceId: ref.id,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }))
    await taskBatch.commit()
  } catch (error) {
    console.error('[AcademicWorkflow] Bulk HOD task enqueue failed', error)
  }
  return proposals.map(({ ref }) => ref.id)
}
