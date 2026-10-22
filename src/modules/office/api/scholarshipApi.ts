// Scholarship desk — Firestore access.
//   Settings: colleges/{cid}/config/scholarships
//   Applications: colleges/{cid}/scholarships/{id}
import {
  addDoc, doc, getDoc, getDocs, limit, query, runTransaction, setDoc, where,
} from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { actor, clean, officeCol, officeDoc, nowIso } from './officeDb'
import {
  SCHOLARSHIP_NEXT, academicYearOf, hasDuplicateApplication, normalizeScholarshipSettings,
  schemeById, validateApplication,
  type ScholarshipSettings, type ScholarshipStatus,
} from '../utils/scholarshipEngine'

export interface ScholarshipApplication {
  id: string
  studentId: string
  studentUid: string
  studentName: string
  regNo: string
  programme: string
  semester: number
  batch: string
  category: string
  annualIncome: number
  schemeId: string
  schemeName: string
  portal: string
  academicYear: string
  applicationNo: string
  status: ScholarshipStatus
  appliedOn: string
  sanctionedAmount: number
  disbursedAmount: number
  documents: Record<string, boolean>
  officeNote: string
  createdAt: string
  updatedAt: string
}

const str = (v: unknown) => String(v ?? '').trim()
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }

function toApp(id: string, d: Record<string, unknown>): ScholarshipApplication {
  return {
    id,
    studentId: str(d.studentId), studentUid: str(d.studentUid),
    studentName: str(d.studentName), regNo: str(d.regNo), programme: str(d.programme),
    semester: num(d.semester), batch: str(d.batch), category: str(d.category),
    annualIncome: num(d.annualIncome),
    schemeId: str(d.schemeId), schemeName: str(d.schemeName), portal: str(d.portal),
    academicYear: str(d.academicYear), applicationNo: str(d.applicationNo),
    status: (str(d.status) || 'applied') as ScholarshipStatus,
    appliedOn: str(d.appliedOn),
    sanctionedAmount: num(d.sanctionedAmount), disbursedAmount: num(d.disbursedAmount),
    documents: (d.documents && typeof d.documents === 'object' ? d.documents : {}) as Record<string, boolean>,
    officeNote: str(d.officeNote),
    createdAt: str(d.createdAt), updatedAt: str(d.updatedAt),
  }
}

export async function fetchScholarshipSettings(collegeId: string): Promise<ScholarshipSettings> {
  if (!collegeId) return normalizeScholarshipSettings(null)
  const snap = await getDoc(doc(db, 'colleges', collegeId, 'config', 'scholarships'))
  return normalizeScholarshipSettings(snap.exists() ? snap.data() : null)
}

export async function saveScholarshipSettings(settings: ScholarshipSettings): Promise<void> {
  const normalized = normalizeScholarshipSettings(settings)
  await setDoc(officeDoc('config', 'scholarships'), clean({ ...normalized, updatedAt: nowIso(), updatedBy: actor().uid }), { merge: true })
}

export async function fetchScholarshipApplications(): Promise<ScholarshipApplication[]> {
  const snap = await getDocs(query(officeCol('scholarships'), limit(2000)))
  return snap.docs.map(d => toApp(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function fetchMyScholarships(studentUid: string, collegeId: string): Promise<ScholarshipApplication[]> {
  if (!studentUid || !collegeId) return []
  const snap = await getDocs(query(officeCol('scholarships'), where('studentUid', '==', studentUid), limit(50)))
  return snap.docs.map(d => toApp(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export interface ApplyInput {
  studentId: string
  uid: string
  name: string
  regNo: string
  programme: string
  semester: number
  batch: string
  category: string
  annualIncome: number
  schemeId: string
  applicationNo: string
  appliedOn: string
  documents: Record<string, boolean>
}

export async function createScholarshipApplication(
  input: ApplyInput, settings: ScholarshipSettings, existingMine: ScholarshipApplication[],
): Promise<string> {
  const academicYear = academicYearOf()
  const errors = validateApplication({ schemeId: input.schemeId, academicYear, applicationNo: input.applicationNo })
  if (errors.length) throw new Error(errors[0])
  const scheme = schemeById(settings, input.schemeId)
  if (!scheme || !scheme.enabled) throw new Error('This scheme is not open. Contact the scholarship desk.')
  if (hasDuplicateApplication(existingMine, scheme.id, academicYear)) {
    throw new Error(`You already have a live application for ${scheme.name} (${academicYear}).`)
  }
  const now = nowIso()
  const ref = await addDoc(officeCol('scholarships'), clean({
    studentId: input.studentId, studentUid: input.uid, studentName: input.name, regNo: input.regNo,
    programme: input.programme, semester: input.semester, batch: input.batch,
    category: input.category, annualIncome: Math.max(0, Math.round(input.annualIncome || 0)),
    schemeId: scheme.id, schemeName: scheme.name, portal: scheme.portal,
    academicYear, applicationNo: str(input.applicationNo), appliedOn: input.appliedOn || now.slice(0, 10),
    status: 'applied', sanctionedAmount: 0, disbursedAmount: 0,
    documents: input.documents || {}, officeNote: '',
    createdAt: now, updatedAt: now,
  } as unknown as Record<string, unknown>))
  return ref.id
}

export async function updateScholarshipStatus(
  id: string, status: ScholarshipStatus,
  extras: { officeNote?: string; sanctionedAmount?: number; disbursedAmount?: number; applicationNo?: string } = {},
): Promise<void> {
  const ref = officeDoc('scholarships', id)
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Application not found.')
    const current = toApp(id, snap.data())
    if (!SCHOLARSHIP_NEXT[current.status].includes(status) && status !== current.status) {
      throw new Error(`Cannot move from "${current.status}" to "${status}".`)
    }
    tx.set(ref, clean({
      status,
      ...(extras.officeNote !== undefined ? { officeNote: str(extras.officeNote) } : {}),
      ...(extras.applicationNo !== undefined ? { applicationNo: str(extras.applicationNo) } : {}),
      ...(extras.sanctionedAmount !== undefined ? { sanctionedAmount: Math.max(0, num(extras.sanctionedAmount)) } : {}),
      ...(extras.disbursedAmount !== undefined ? { disbursedAmount: Math.max(0, num(extras.disbursedAmount)) } : {}),
      [`statusAt_${status}`]: nowIso(),
      updatedAt: nowIso(), updatedBy: actor().uid,
    } as unknown as Record<string, unknown>), { merge: true })
  })
}
