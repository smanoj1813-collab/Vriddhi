// Course registration — Firestore + callable access.
//   Windows: colleges/{cid}/config/registration { windows: [...] }
//   Registrations: colleges/{cid}/courseRegistrations/{windowId_studentId}
//   Student window state + submission run through callables (capacity
//   must be computed server-side; students cannot read other students).
import { doc, getDoc, getDocs, limit, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/Firebase/config'
import { actor, clean, officeCol, officeDoc, nowIso } from './officeDb'
import { normalizeWindows, type RegWindow } from '../utils/registrationEngine'

export type RegSelections = Record<string, string[]>

export interface CourseRegistrationDoc {
  id: string
  windowId: string
  windowTitle: string
  studentId: string
  studentUid: string
  name: string
  regNo: string
  programme: string
  batch: string
  semester: number
  selections: RegSelections
  status: 'submitted' | 'confirmed' | 'rejected'
  createdAt: string
  updatedAt: string
}

const str = (v: unknown) => String(v ?? '').trim()
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }

export async function fetchRegWindows(collegeId: string): Promise<RegWindow[]> {
  if (!collegeId) return []
  const snap = await getDoc(doc(db, 'colleges', collegeId, 'config', 'registration'))
  return normalizeWindows(snap.exists() ? snap.data() : null)
}

export async function saveRegWindows(windows: RegWindow[]): Promise<void> {
  await setDoc(officeDoc('config', 'registration'), clean({ windows: normalizeWindows({ windows }), updatedAt: nowIso(), updatedBy: actor().uid }), { merge: true })
}

export async function fetchRegistrations(windowId: string): Promise<CourseRegistrationDoc[]> {
  const snap = await getDocs(query(officeCol('courseRegistrations'), where('windowId', '==', windowId), limit(5000)))
  return snap.docs.map(d => {
    const x = d.data()
    return {
      id: d.id, windowId: str(x.windowId), windowTitle: str(x.windowTitle),
      studentId: str(x.studentId), studentUid: str(x.studentUid),
      name: str(x.name), regNo: str(x.regNo), programme: str(x.programme),
      batch: str(x.batch), semester: num(x.semester),
      selections: (x.selections && typeof x.selections === 'object' ? x.selections : {}) as RegSelections,
      status: (str(x.status) || 'submitted') as CourseRegistrationDoc['status'],
      createdAt: str(x.createdAt), updatedAt: str(x.updatedAt),
    }
  }).sort((a, b) => a.regNo.localeCompare(b.regNo) || a.name.localeCompare(b.name))
}

export async function setRegistrationStatus(id: string, status: CourseRegistrationDoc['status']): Promise<void> {
  await updateDoc(officeDoc('courseRegistrations', id), clean({ status, updatedAt: nowIso(), updatedBy: actor().uid }))
}

// ── Student callables ──────────────────────────────────────────────────────────
export interface MyRegWindowResult {
  window: RegWindow | null
  open: boolean
  counts: Record<string, number>
  mine: { selections: RegSelections; status: string; updatedAt: string } | null
  student?: { name: string; regNo: string; programme: string; batch: string; semester: number }
}

const myWindowFn = httpsCallable<Record<string, never>, MyRegWindowResult>(functions, 'getMyRegistrationWindow')
const submitFn = httpsCallable<{ windowId: string; selections: RegSelections }, { ok: boolean; status: string }>(functions, 'submitCourseRegistration')

export async function getMyRegistrationWindow(): Promise<MyRegWindowResult> {
  const res = await myWindowFn({})
  return res.data
}

export async function submitCourseRegistration(windowId: string, selections: RegSelections) {
  const res = await submitFn({ windowId, selections })
  return res.data
}
