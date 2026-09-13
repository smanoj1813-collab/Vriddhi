// functions/src/admissions.ts
// ------------------------------------------------------------------
// Admission Center — the funnel that exists before a student record does.
//
// WHY THIS MODULE EXISTS
// A student only ever came into being through `bulkCreateStudentAccounts`
// (CSV upload) or `provisionUser`. Everything before that — the walk-in
// enquiry, the application, the entrance score, the offer, the fee — lived in
// a register on someone's desk. There was no applicant, enquiry or admission
// concept anywhere in the codebase.
//
// This closes the front of the funnel and hands off to the existing, proven
// provisioning path by exporting the admitted applicants as the
// `STUDENT_TEMPLATE` CSV the college already uploads. It deliberately does not
// create student documents or auth accounts itself: one path into `students`
// is safer than two.
//
// Staff-entered only. There is no public applicant surface, so no unauthenticated
// write path and no new auth role.
// ------------------------------------------------------------------

import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

// ─── Stages ─────────────────────────────────────────────────────────────────

export const ADMISSION_STAGES = [
  'enquiry',
  'application',
  'screening',
  'offer',
  'fee',
  'enrolled',
] as const

export type AdmissionStage = (typeof ADMISSION_STAGES)[number]

/** Terminal outcomes. Not part of the forward pipeline. */
export const ADMISSION_OUTCOMES = ['rejected', 'withdrawn'] as const
export type AdmissionOutcome = (typeof ADMISSION_OUTCOMES)[number]

export type AdmissionStatus = AdmissionStage | AdmissionOutcome

/**
 * Legal moves. Enforced server-side so the funnel cannot be skipped — an
 * applicant must not be able to reach `enrolled` without an offer and a fee,
 * because that is what the CSV export trusts.
 */
const TRANSITIONS: Record<AdmissionStatus, AdmissionStatus[]> = {
  enquiry: ['application', 'rejected', 'withdrawn'],
  application: ['screening', 'rejected', 'withdrawn'],
  screening: ['offer', 'rejected', 'withdrawn'],
  offer: ['fee', 'rejected', 'withdrawn'],
  fee: ['enrolled', 'withdrawn'],
  enrolled: [],
  // Re-opening is deliberate: a rejected applicant who reapplies next cycle is
  // a real case, and deleting the record would lose the audit trail.
  rejected: ['application'],
  withdrawn: ['enquiry'],
}

export function canTransition(from: AdmissionStatus, to: AdmissionStatus): boolean {
  return (TRANSITIONS[from] || []).includes(to)
}

export function allowedTransitions(from: AdmissionStatus): AdmissionStatus[] {
  return TRANSITIONS[from] || []
}

// ─── Merit ──────────────────────────────────────────────────────────────────

export interface MeritWeights {
  qualifying: number
  entrance: number
  interview: number
}

/**
 * Default weighting, applied only until the college sets its own in
 * `colleges/{id}/config/admission`. This is policy, not student data: it is
 * shown in the UI and editable, and no applicant's merit is derived from a
 * weight they cannot see.
 */
export const DEFAULT_MERIT_WEIGHTS: MeritWeights = {
  qualifying: 50,
  entrance: 40,
  interview: 10,
}

export interface MeritInput {
  /** Qualifying exam percentage, 0–100. */
  qualifyingPercentage: number | null
  /** Entrance score and its maximum, so different exams stay comparable. */
  entranceScore: number | null
  entranceMaxScore: number | null
  /** Interview rating, 0–10. */
  interviewRating: number | null
}

export interface MeritResult {
  /** 0–100, or null when nothing has been recorded yet. */
  score: number | null
  /** Which components actually contributed. */
  components: Array<{ key: string; label: string; normalized: number; weight: number }>
  /** Components the weights ask for but that were never recorded. */
  missing: string[]
}

/**
 * Weighted merit over the components that were actually recorded.
 *
 * A component that was never recorded is EXCLUDED and the remaining weights
 * are re-normalised. Treating a missing entrance exam as zero would silently
 * rank an applicant last for paperwork nobody filed, and that number would
 * then drive the offer — so absence is reported, never scored.
 */
export function computeMeritScore(input: MeritInput, weights: MeritWeights): MeritResult {
  const candidates: Array<{ key: string; label: string; normalized: number | null; weight: number }> = [
    {
      key: 'qualifying',
      label: 'Qualifying exam',
      normalized:
        input.qualifyingPercentage !== null && input.qualifyingPercentage >= 0
          ? Math.min(100, input.qualifyingPercentage)
          : null,
      weight: weights.qualifying,
    },
    {
      key: 'entrance',
      label: 'Entrance exam',
      normalized:
        input.entranceScore !== null &&
        input.entranceMaxScore !== null &&
        input.entranceMaxScore > 0 &&
        input.entranceScore >= 0
          ? Math.min(100, (input.entranceScore / input.entranceMaxScore) * 100)
          : null,
      weight: weights.entrance,
    },
    {
      key: 'interview',
      label: 'Interview',
      normalized:
        input.interviewRating !== null && input.interviewRating >= 0
          ? Math.min(100, input.interviewRating * 10)
          : null,
      weight: weights.interview,
    },
  ]

  const present = candidates.filter((c) => c.normalized !== null && c.weight > 0)
  const missing = candidates
    .filter((c) => c.normalized === null && c.weight > 0)
    .map((c) => c.label)

  if (present.length === 0) return { score: null, components: [], missing }

  const totalWeight = present.reduce((sum, c) => sum + c.weight, 0)
  if (totalWeight <= 0) return { score: null, components: [], missing }

  const score = present.reduce((sum, c) => sum + (c.normalized as number) * c.weight, 0) / totalWeight

  return {
    score: Math.round(score * 100) / 100,
    components: present.map((c) => ({
      key: c.key,
      label: c.label,
      normalized: Math.round((c.normalized as number) * 100) / 100,
      weight: Math.round((c.weight / totalWeight) * 1000) / 10,
    })),
    missing,
  }
}

// ─── CSV hand-off ───────────────────────────────────────────────────────────

/**
 * Column order of `STUDENT_TEMPLATE` in
 * src/modules/admin/services/onboardingService.ts. Kept in step with it so the
 * exported file drops straight into the existing bulk upload.
 */
export const STUDENT_CSV_COLUMNS = [
  'regNo',
  'name',
  'email',
  'phone',
  'dateOfBirth',
  'gender',
  'bloodGroup',
  'course',
  'department',
  'batch',
  'semester',
  'division',
  'mentorId',
] as const

export interface ApplicantLike {
  applicationNo?: string
  applicantName?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  program?: string
  department?: string
  batch?: string
  division?: string
  mentorId?: string
  regNo?: string
}

export interface StudentCsvRowResult {
  row: Record<(typeof STUDENT_CSV_COLUMNS)[number], string> | null
  /** Why the row could not be produced. Empty when it could. */
  blocked: string[]
}

/**
 * Maps one admitted applicant onto the student CSV columns.
 *
 * Returns the blocking reasons instead of a row with invented values: a
 * missing registration number or division is the admissions office's decision,
 * and guessing one would create a student record that has to be found and
 * fixed later.
 */
export function toStudentCsvRow(applicant: ApplicantLike): StudentCsvRowResult {
  const blocked: string[] = []
  const label = applicant.applicationNo || applicant.applicantName || 'applicant'

  if (!applicant.regNo || !applicant.regNo.trim()) blocked.push(`${label}: no registration number assigned`)
  if (!applicant.applicantName || !applicant.applicantName.trim()) blocked.push(`${label}: no applicant name`)
  if (!applicant.email || !applicant.email.trim()) blocked.push(`${label}: no email`)
  if (!applicant.phone || !applicant.phone.trim()) blocked.push(`${label}: no phone`)
  if (!applicant.program || !applicant.program.trim()) blocked.push(`${label}: no program selected`)
  if (!applicant.batch || !applicant.batch.trim()) blocked.push(`${label}: no batch selected`)
  if (!applicant.division || !applicant.division.trim()) blocked.push(`${label}: no division assigned`)

  if (blocked.length > 0) return { row: null, blocked }

  return {
    row: {
      regNo: applicant.regNo!.trim(),
      name: applicant.applicantName!.trim(),
      email: applicant.email!.trim(),
      phone: applicant.phone!.trim(),
      dateOfBirth: applicant.dateOfBirth || '',
      gender: (applicant.gender || '').toLowerCase(),
      bloodGroup: applicant.bloodGroup || '',
      course: applicant.program!.trim(),
      department: applicant.department || '',
      batch: applicant.batch!.trim(),
      // A fresh admission always starts in semester 1.
      semester: '1',
      division: applicant.division!.trim(),
      mentorId: applicant.mentorId || '',
    },
    blocked: [],
  }
}

/** RFC 4180 escaping — values here routinely contain commas and quotes. */
export function toCsv(rows: Array<Record<string, string>>): string {
  const escape = (value: string) => {
    const text = String(value ?? '')
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const header = STUDENT_CSV_COLUMNS.join(',')
  const body = rows.map((row) => STUDENT_CSV_COLUMNS.map((column) => escape(row[column] ?? '')).join(','))
  return [header, ...body].join('\n')
}

// ─── Identity ───────────────────────────────────────────────────────────────

interface AdmissionStaff {
  uid: string
  role: string
  collegeId: string
  name: string
}

const STAFF_ROLES = ['superadmin', 'admin', 'principal', 'hod']

async function resolveStaff(uid: string, token: Record<string, unknown>): Promise<AdmissionStaff> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  const user = userDoc.data()
  const role = String(token.role || user?.role || '')
  const collegeId = String(token.collegeId || user?.collegeId || '')
  if (!userDoc.exists || !STAFF_ROLES.includes(role) || (role !== 'superadmin' && !collegeId)) {
    throw new HttpsError('permission-denied', 'College administration access is required')
  }
  return { uid, role, collegeId, name: String(user?.name || '') }
}

async function resolveCollegeId(staff: AdmissionStaff, requested: unknown): Promise<string> {
  const collegeId = staff.role === 'superadmin' ? String(requested || '') : staff.collegeId
  if (!collegeId) throw new HttpsError('invalid-argument', 'collegeId is required')
  return collegeId
}

function iso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const converted = (value as { toDate: () => Date }).toDate()
    if (converted instanceof Date) return converted.toISOString()
  }
  if (typeof value === 'string') return value
  return null
}

function text(value: unknown, max = 200): string {
  return String(value ?? '').trim().slice(0, max)
}

function optionalNumber(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.min(max, Math.max(min, parsed))
}

async function loadWeights(collegeId: string): Promise<MeritWeights> {
  const doc = await admin.firestore().collection('colleges').doc(collegeId).collection('config').doc('admission').get()
  const data = doc.data()
  if (!data) return { ...DEFAULT_MERIT_WEIGHTS }
  const weights = {
    qualifying: optionalNumber(data.qualifyingWeight, 0, 100) ?? DEFAULT_MERIT_WEIGHTS.qualifying,
    entrance: optionalNumber(data.entranceWeight, 0, 100) ?? DEFAULT_MERIT_WEIGHTS.entrance,
    interview: optionalNumber(data.interviewWeight, 0, 100) ?? DEFAULT_MERIT_WEIGHTS.interview,
  }
  if (weights.qualifying + weights.entrance + weights.interview <= 0) return { ...DEFAULT_MERIT_WEIGHTS }
  return weights
}

const STATUSES: string[] = [...ADMISSION_STAGES, ...ADMISSION_OUTCOMES]

// ─── Serialisation ──────────────────────────────────────────────────────────

function serialize(id: string, data: admin.firestore.DocumentData) {
  const meritInput: MeritInput = {
    qualifyingPercentage: optionalNumber(data.qualifyingPercentage, 0, 100),
    entranceScore: optionalNumber(data.entranceScore, 0, 100000),
    entranceMaxScore: optionalNumber(data.entranceMaxScore, 0, 100000),
    interviewRating: optionalNumber(data.interviewRating, 0, 10),
  }
  const weights = (data.meritWeights && typeof data.meritWeights === 'object'
    ? data.meritWeights
    : DEFAULT_MERIT_WEIGHTS) as MeritWeights

  return {
    id,
    applicationNo: String(data.applicationNo || ''),
    status: STATUSES.includes(String(data.status)) ? (String(data.status) as AdmissionStatus) : 'enquiry',
    applicantName: String(data.applicantName || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    dateOfBirth: String(data.dateOfBirth || ''),
    gender: String(data.gender || ''),
    bloodGroup: String(data.bloodGroup || ''),
    guardianName: String(data.guardianName || ''),
    guardianPhone: String(data.guardianPhone || ''),
    city: String(data.city || ''),
    program: String(data.program || ''),
    department: String(data.department || ''),
    batch: String(data.batch || ''),
    division: String(data.division || ''),
    regNo: String(data.regNo || ''),
    mentorId: String(data.mentorId || ''),
    previousSchool: String(data.previousSchool || ''),
    previousQualification: String(data.previousQualification || ''),
    yearOfPassing: String(data.yearOfPassing || ''),
    source: String(data.source || ''),
    assignedTo: String(data.assignedTo || ''),
    assignedToName: String(data.assignedToName || ''),
    entranceExamType: String(data.entranceExamType || ''),
    entranceRegistrationNo: String(data.entranceRegistrationNo || ''),
    interviewNotes: String(data.interviewNotes || ''),
    merit: computeMeritScore(meritInput, weights),
    meritWeights: weights,
    feeAmount: optionalNumber(data.feeAmount, 0, 10000000) ?? 0,
    feePaid: optionalNumber(data.feePaid, 0, 10000000) ?? 0,
    offerIssuedAt: iso(data.offerIssuedAt),
    enrolledStudentId: String(data.enrolledStudentId || ''),
    notes: Array.isArray(data.notes)
      ? data.notes.slice(0, 50).map((note) => {
          const entry = (note || {}) as Record<string, unknown>
          return { at: iso(entry.at), by: String(entry.by || ''), text: String(entry.text || '') }
        })
      : [],
    stageHistory: Array.isArray(data.stageHistory)
      ? data.stageHistory.slice(0, 50).map((entry) => {
          const stage = (entry || {}) as Record<string, unknown>
          return { stage: String(stage.stage || ''), at: iso(stage.at), by: String(stage.by || '') }
        })
      : [],
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
    createdByName: String(data.createdByName || ''),
  }
}

export type SerializedApplication = ReturnType<typeof serialize>

// ─── Callables ──────────────────────────────────────────────────────────────

async function nextApplicationNo(db: admin.firestore.Firestore, collegeId: string, year: number): Promise<string> {
  const snap = await db
    .collection('admissionApplications')
    .where('collegeId', '==', collegeId)
    .where('cycleYear', '==', year)
    .limit(1000)
    .get()
  const used = snap.docs
    .map((doc) => Number(String(doc.data().applicationNo || '').split('-').pop()))
    .filter((value) => Number.isFinite(value))
  const next = (used.length > 0 ? Math.max(...used) : 0) + 1
  return `ADM-${year}-${String(next).padStart(4, '0')}`
}

export const saveAdmissionApplication = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    const input = (request.data || {}) as Record<string, unknown>
    const db = admin.firestore()
    const collegeId = await resolveCollegeId(staff, input.collegeId)

    const applicantName = text(input.applicantName)
    if (!applicantName) throw new HttpsError('invalid-argument', 'Applicant name is required')

    const payload: admin.firestore.DocumentData = {
      applicantName,
      email: text(input.email, 160).toLowerCase(),
      phone: text(input.phone, 32),
      dateOfBirth: text(input.dateOfBirth, 32),
      gender: text(input.gender, 32),
      bloodGroup: text(input.bloodGroup, 16),
      guardianName: text(input.guardianName),
      guardianPhone: text(input.guardianPhone, 32),
      city: text(input.city),
      program: text(input.program, 80),
      department: text(input.department, 80),
      batch: text(input.batch, 32),
      division: text(input.division, 32),
      regNo: text(input.regNo, 64),
      mentorId: text(input.mentorId, 64),
      previousSchool: text(input.previousSchool),
      previousQualification: text(input.previousQualification, 120),
      yearOfPassing: text(input.yearOfPassing, 16),
      source: text(input.source, 60),
      assignedTo: text(input.assignedTo, 64),
      assignedToName: text(input.assignedToName),
      entranceExamType: text(input.entranceExamType, 60),
      entranceRegistrationNo: text(input.entranceRegistrationNo, 64),
      interviewNotes: text(input.interviewNotes, 2000),
      qualifyingPercentage: optionalNumber(input.qualifyingPercentage, 0, 100),
      entranceScore: optionalNumber(input.entranceScore, 0, 100000),
      entranceMaxScore: optionalNumber(input.entranceMaxScore, 0, 100000),
      interviewRating: optionalNumber(input.interviewRating, 0, 10),
      feeAmount: optionalNumber(input.feeAmount, 0, 10000000),
      feePaid: optionalNumber(input.feePaid, 0, 10000000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const applicationId = text(input.applicationId, 200)
    if (applicationId && !applicationId.includes('/')) {
      const ref = db.collection('admissionApplications').doc(applicationId)
      const existing = await ref.get()
      if (!existing.exists) throw new HttpsError('not-found', 'Application not found')
      if (staff.role !== 'superadmin' && existing.data()?.collegeId !== collegeId) {
        throw new HttpsError('permission-denied', 'This application belongs to another college')
      }
      await ref.update(payload)

      const note = text(input.note, 1000)
      if (note) {
        await ref.update({
          notes: admin.firestore.FieldValue.arrayUnion({
            at: admin.firestore.FieldValue.serverTimestamp(),
            by: staff.name,
            text: note,
          }),
        })
      }
      const updated = await ref.get()
      return { application: serialize(ref.id, updated.data() as admin.firestore.DocumentData) }
    }

    const cycleYear = new Date().getFullYear()
    const applicationNo = await nextApplicationNo(db, collegeId, cycleYear)
    const weights = await loadWeights(collegeId)
    const ref = db.collection('admissionApplications').doc()
    await ref.create({
      ...payload,
      collegeId,
      cycleYear,
      applicationNo,
      status: 'enquiry' as AdmissionStatus,
      meritWeights: weights,
      feeAmount: payload.feeAmount ?? 0,
      feePaid: 0,
      notes: [],
      stageHistory: [
        { stage: 'enquiry', at: admin.firestore.FieldValue.serverTimestamp(), by: staff.name },
      ],
      createdBy: uid,
      createdByName: staff.name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    const created = await ref.get()
    return { application: serialize(ref.id, created.data() as admin.firestore.DocumentData) }
  }
)

export const transitionAdmissionStage = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    const input = (request.data || {}) as Record<string, unknown>
    const db = admin.firestore()
    const collegeId = await resolveCollegeId(staff, input.collegeId)

    const applicationId = text(input.applicationId, 200)
    const to = text(input.to, 32) as AdmissionStatus
    if (!applicationId || applicationId.includes('/')) {
      throw new HttpsError('invalid-argument', 'A valid applicationId is required')
    }
    if (!STATUSES.includes(to)) throw new HttpsError('invalid-argument', 'Unknown stage')

    const ref = db.collection('admissionApplications').doc(applicationId)
    const doc = await ref.get()
    if (!doc.exists) throw new HttpsError('not-found', 'Application not found')
    const data = doc.data() as admin.firestore.DocumentData
    if (staff.role !== 'superadmin' && data.collegeId !== collegeId) {
      throw new HttpsError('permission-denied', 'This application belongs to another college')
    }

    const from = String(data.status || 'enquiry') as AdmissionStatus
    if (!canTransition(from, to)) {
      throw new HttpsError(
        'failed-precondition',
        `Cannot move from "${from}" to "${to}". Allowed: ${allowedTransitions(from).join(', ') || 'none'}.`
      )
    }

    // An offer is the point where the college commits a seat, so the fields the
    // CSV hand-off depends on must exist by then rather than at export time.
    if (to === 'offer') {
      const missing: string[] = []
      if (!text(data.program)) missing.push('program')
      if (!text(data.batch)) missing.push('batch')
      if (!text(data.regNo)) missing.push('registration number')
      if (missing.length > 0) {
        throw new HttpsError('failed-precondition', `Complete before issuing an offer: ${missing.join(', ')}`)
      }
    }

    const update: admin.firestore.DocumentData = {
      status: to,
      stageHistory: admin.firestore.FieldValue.arrayUnion({
        stage: to,
        at: admin.firestore.FieldValue.serverTimestamp(),
        by: staff.name,
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    if (to === 'offer') update.offerIssuedAt = admin.firestore.FieldValue.serverTimestamp()
    const reason = text(input.reason, 500)
    if (reason) {
      update.notes = admin.firestore.FieldValue.arrayUnion({
        at: admin.firestore.FieldValue.serverTimestamp(),
        by: staff.name,
        text: `${from} → ${to}: ${reason}`,
      })
    }

    await ref.update(update)
    const updated = await ref.get()
    return { application: serialize(ref.id, updated.data() as admin.firestore.DocumentData) }
  }
)

export const listAdmissionApplications = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    const input = (request.data || {}) as Record<string, unknown>
    const collegeId = await resolveCollegeId(staff, input.collegeId)

    const snap = await admin
      .firestore()
      .collection('admissionApplications')
      .where('collegeId', '==', collegeId)
      .limit(1000)
      .get()

    const applications = snap.docs
      .map((doc) => serialize(doc.id, doc.data()))
      .sort((left, right) => (right.updatedAt || '').localeCompare(left.updatedAt || ''))

    // Funnel counts come from the same read as the list, so the board and the
    // table can never disagree about how many applicants are in a stage.
    const counts: Record<string, number> = {}
    for (const status of STATUSES) counts[status] = 0
    applications.forEach((application) => {
      counts[application.status] = (counts[application.status] || 0) + 1
    })

    const reachedOffer = applications.filter((application) =>
      application.stageHistory.some((entry) => entry.stage === 'offer')
    ).length

    return {
      applications,
      counts,
      totals: {
        total: applications.length,
        inPipeline: STATUSES.filter((s) => !ADMISSION_OUTCOMES.includes(s as AdmissionOutcome))
          .reduce((sum, status) => sum + (counts[status] || 0), 0),
        reachedOffer,
        enrolled: counts.enrolled || 0,
        conversionRate: reachedOffer > 0 ? Math.round(((counts.enrolled || 0) / reachedOffer) * 1000) / 10 : 0,
      },
    }
  }
)

export const deleteAdmissionApplication = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    const input = (request.data || {}) as Record<string, unknown>
    const collegeId = await resolveCollegeId(staff, input.collegeId)

    const applicationId = text(input.applicationId, 200)
    if (!applicationId || applicationId.includes('/')) {
      throw new HttpsError('invalid-argument', 'A valid applicationId is required')
    }
    const ref = admin.firestore().collection('admissionApplications').doc(applicationId)
    const doc = await ref.get()
    if (!doc.exists) throw new HttpsError('not-found', 'Application not found')
    if (staff.role !== 'superadmin' && doc.data()?.collegeId !== collegeId) {
      throw new HttpsError('permission-denied', 'This application belongs to another college')
    }
    // An enrolled applicant already became a student record; deleting the
    // application would orphan the audit trail behind it.
    if (String(doc.data()?.status) === 'enrolled') {
      throw new HttpsError('failed-precondition', 'An enrolled application cannot be deleted')
    }
    await ref.delete()
    return { deleted: true }
  }
)

export const exportAdmittedApplicants = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    const input = (request.data || {}) as Record<string, unknown>
    const collegeId = await resolveCollegeId(staff, input.collegeId)

    const wantedStatus = text(input.status, 32) || 'fee'
    if (!STATUSES.includes(wantedStatus)) {
      throw new HttpsError('invalid-argument', 'Unknown status filter')
    }

    const snap = await admin
      .firestore()
      .collection('admissionApplications')
      .where('collegeId', '==', collegeId)
      .where('status', '==', wantedStatus)
      .limit(500)
      .get()

    const rows: Array<Record<string, string>> = []
    const blocked: string[] = []
    const exportedIds: string[] = []

    snap.docs.forEach((doc) => {
      const application = serialize(doc.id, doc.data())
      const result = toStudentCsvRow(application)
      if (result.row) {
        rows.push(result.row)
        exportedIds.push(doc.id)
      } else {
        blocked.push(...result.blocked)
      }
    })

    return {
      csv: toCsv(rows),
      rowCount: rows.length,
      blocked,
      exportedIds,
      columns: [...STUDENT_CSV_COLUMNS],
    }
  }
)

export const markAdmissionExported = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    const input = (request.data || {}) as Record<string, unknown>
    const collegeId = await resolveCollegeId(staff, input.collegeId)

    const ids = Array.isArray(input.applicationIds)
      ? [...new Set(input.applicationIds.map((value) => text(value, 200)).filter(Boolean))].slice(0, 500)
      : []
    if (ids.length === 0) throw new HttpsError('invalid-argument', 'No applications selected')

    const db = admin.firestore()
    const refs = ids.map((id) => db.collection('admissionApplications').doc(id))
    const docs = await db.getAll(...refs)

    const batch = db.batch()
    let marked = 0
    docs.forEach((doc) => {
      if (!doc.exists) return
      if (staff.role !== 'superadmin' && doc.data()?.collegeId !== collegeId) return
      batch.update(doc.ref, {
        exportedAt: admin.firestore.FieldValue.serverTimestamp(),
        exportedBy: staff.name,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      marked += 1
    })
    await batch.commit()
    return { marked }
  }
)
