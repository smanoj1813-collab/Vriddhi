// src/modules/office/api/certificateApi.ts
//
//   colleges/{cid}/certificateRequests/{id}  one certificate request
//   colleges/{cid}/config/certificates       CertificateSettings
//
// Students apply (or the office creates for a walk-in); the office issues
// with a counter-based certificate number and the rendered body is stored
// on the request, so a reprint is byte-identical even if the college
// later edits its template wording.

import { addDoc, collection, getDoc, getDocs, limit, query, runTransaction, setDoc, where, type DocumentData } from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { actor, clean, formatDocNo, nextCounter, nowIso, officeCol, officeDoc, str, num, todayIso } from './officeDb'
import {
  canTransitionCertificate, certificateType, certificateVars, feeLinesTotal, hasOpenRequest,
  normalizeCertificateSettings, renderCertificateBody, validateIssue,
  type CertificateSettings, type CertificateStatus, type IssueExtras,
} from '../utils/certificateEngine'
import { letterheadFrom } from '@/modules/admin/utils/payrollDocs'
import type { BrandingSettings } from '@/modules/admin/api/financeApi'
import { downloadStudentCertificatePdf } from '@/shared/utils/financePdf'

export async function fetchCertificateSettings(cid?: string): Promise<CertificateSettings> {
  const snap = await getDoc(officeDoc('config', 'certificates', cid))
  return normalizeCertificateSettings(snap.exists() ? (snap.data() as Record<string, unknown>) : null)
}
export async function saveCertificateSettings(s: CertificateSettings): Promise<void> {
  await setDoc(officeDoc('config', 'certificates'), clean({ ...normalizeCertificateSettings(s as unknown as Record<string, unknown>), updatedAt: nowIso(), updatedBy: actor().name }))
}

export interface CertificateRequest {
  id: string
  kind: string
  kindLabel: string
  studentId: string
  studentUid: string
  studentName: string
  regNo: string
  programme: string
  semester: number
  batch: string
  gender: string
  dateOfBirth: string
  apaarId: string
  purpose: string
  status: CertificateStatus
  requestedBy: string
  createdAt: string
  certificateNo: string
  title: string
  body: string
  feeLines: Array<{ label: string; amount: number }>
  issuedAt: string
  issuedBy: string
  decidedNote: string
}

function mapReq(id: string, r: DocumentData): CertificateRequest {
  const lines = Array.isArray(r.feeLines) ? (r.feeLines as Array<Record<string, unknown>>) : []
  return {
    id,
    kind: str(r.kind),
    kindLabel: str(r.kindLabel),
    studentId: str(r.studentId),
    studentUid: str(r.studentUid),
    studentName: str(r.studentName),
    regNo: str(r.regNo),
    programme: str(r.programme),
    semester: num(r.semester),
    batch: str(r.batch),
    gender: str(r.gender),
    dateOfBirth: str(r.dateOfBirth),
    apaarId: str(r.apaarId),
    purpose: str(r.purpose),
    status: str(r.status, 'requested') as CertificateStatus,
    requestedBy: str(r.requestedBy),
    createdAt: str(r.createdAt),
    certificateNo: str(r.certificateNo),
    title: str(r.title),
    body: str(r.body),
    feeLines: lines.map(l => ({ label: str(l.label), amount: num(l.amount) })),
    issuedAt: str(r.issuedAt),
    issuedBy: str(r.issuedBy),
    decidedNote: str(r.decidedNote),
  }
}

export async function fetchCertificateRequests(cid?: string): Promise<CertificateRequest[]> {
  const snap = await getDocs(query(officeCol('certificateRequests', cid), limit(5000)))
  return snap.docs.map(d => mapReq(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function fetchMyCertificates(uid: string, cid?: string): Promise<CertificateRequest[]> {
  const snap = await getDocs(query(officeCol('certificateRequests', cid), where('studentUid', '==', uid), limit(100)))
  return snap.docs.map(d => mapReq(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export interface CertificateStudent {
  category?: string
  studentId: string
  uid: string
  name: string
  regNo: string
  programme: string
  semester: number
  batch: string
  gender: string
  dateOfBirth: string
  apaarId: string
}

/** Roster for the office student picker (canonical /students records). */
export async function fetchCertificateStudents(cid: string): Promise<CertificateStudent[]> {
  const snap = await getDocs(query(collection(db, 'students'), where('collegeId', '==', cid), limit(5000)))
  return snap.docs.map(d => {
    const s = d.data() as Record<string, unknown>
    return {
      studentId: d.id,
      uid: str(s.userId),
      name: str(s.name),
      regNo: str(s.regNo),
      programme: str(s.course || s.department || s.branch),
      semester: num(s.semester),
      batch: str(s.batch),
      gender: str(s.gender),
      dateOfBirth: str(s.dob || s.dateOfBirth),
      apaarId: str(s.apaarId), category: str(s.category),
    }
  }).sort((a, b) => a.regNo.localeCompare(b.regNo))
}

function requestDoc(s: CertificateStudent, settings: CertificateSettings, kind: string, purpose: string) {
  const def = certificateType(settings, kind)
  if (!def || !def.enabled) throw new Error('Choose a certificate type.')
  return {
    def,
    doc: clean({
      kind: def.kind, kindLabel: def.label,
      studentId: s.studentId, studentUid: s.uid, studentName: s.name, regNo: s.regNo,
      programme: s.programme, semester: s.semester, batch: s.batch, gender: s.gender,
      dateOfBirth: s.dateOfBirth, apaarId: s.apaarId,
      purpose: purpose.trim(), status: 'requested',
      requestedBy: actor().name, createdAt: nowIso(),
    }),
  }
}

/** Student- or office-initiated request (one open request per kind). */
export async function createCertificateRequest(s: CertificateStudent, settings: CertificateSettings, kind: string, purpose: string, existing: CertificateRequest[]): Promise<string> {
  const def = certificateType(settings, kind)
  if (def?.needsPurpose && !purpose.trim()) throw new Error('State the purpose (e.g. SSP scholarship, education loan).')
  if (hasOpenRequest(existing, s.studentId, s.uid, kind)) throw new Error('A request for this certificate is already in progress.')
  const { doc } = requestDoc(s, settings, kind, purpose)
  const ref = await addDoc(officeCol('certificateRequests'), doc)
  return ref.id
}

/** "21 Oct 2026" for the printed certificate. */
export function longDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`)
  return Number.isNaN(d.getTime()) ? isoDate : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Issue: reserve the next certificate number, render the body from the
 * college's template and freeze title/body/fee lines onto the request.
 */
export async function issueCertificate(reqId: string, extras: IssueExtras, settings: CertificateSettings, branding: BrandingSettings): Promise<CertificateRequest> {
  const ref = officeDoc('certificateRequests', reqId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Request not found.')
  const cur = mapReq(reqId, snap.data())
  if (!canTransitionCertificate(cur.status, 'issued')) throw new Error(`This request is already ${cur.status}.`)
  const def = certificateType(settings, cur.kind)
  if (!def) throw new Error('This certificate type no longer exists in settings.')
  const issueError = validateIssue(def, { ...extras, purpose: extras.purpose || cur.purpose })
  if (issueError) throw new Error(issueError)

  const seq = await nextCounter(`certificate-${def.kind}`)
  const certificateNo = formatDocNo(def.prefix, seq)
  const issuedDate = todayIso()
  const feeLines = def.needsFeeLines ? (extras.feeLines || []).filter(l => l.label.trim() && Number(l.amount) > 0) : []
  const vars = certificateVars({
    student: { name: cur.studentName, regNo: cur.regNo, programme: cur.programme, semester: cur.semester, batch: cur.batch, gender: cur.gender, dateOfBirth: cur.dateOfBirth, apaarId: cur.apaarId },
    collegeName: branding.collegeName,
    collegeAddress: branding.address,
    extras: { ...extras, purpose: extras.purpose || cur.purpose },
    certificateNo,
    date: longDate(issuedDate),
  })
  const body = renderCertificateBody(def, vars)

  await runTransaction(db, async tx => {
    const fresh = await tx.get(ref)
    if (!fresh.exists()) throw new Error('Request not found.')
    const now = mapReq(reqId, fresh.data())
    if (!canTransitionCertificate(now.status, 'issued')) throw new Error(`This request is already ${now.status}.`)
    tx.update(ref, clean({
      status: 'issued', certificateNo, title: def.title, body, feeLines,
      purpose: extras.purpose || cur.purpose,
      issuedAt: nowIso(), issuedBy: actor().name,
    }))
  })
  const after = await getDoc(ref)
  return mapReq(reqId, after.data()!)
}

/** Walk-in: create + issue in one step. */
export async function issueDirectCertificate(s: CertificateStudent, kind: string, extras: IssueExtras, settings: CertificateSettings, branding: BrandingSettings): Promise<CertificateRequest> {
  const { doc } = requestDoc(s, settings, kind, extras.purpose)
  const ref = await addDoc(officeCol('certificateRequests'), doc)
  return issueCertificate(ref.id, extras, settings, branding)
}

export async function decideCertificateRequest(reqId: string, to: 'rejected' | 'cancelled', note: string): Promise<void> {
  const ref = officeDoc('certificateRequests', reqId)
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Request not found.')
    const cur = mapReq(reqId, snap.data())
    if (!canTransitionCertificate(cur.status, to)) throw new Error(`This request is already ${cur.status}.`)
    tx.update(ref, clean({ status: to, decidedNote: note.trim(), issuedBy: actor().name, issuedAt: nowIso() }))
  })
}

/** Print/download the issued certificate exactly as frozen at issue time. */
export async function downloadIssuedCertificate(req: CertificateRequest, branding: BrandingSettings, settings: CertificateSettings): Promise<void> {
  await downloadStudentCertificatePdf({
    letterhead: letterheadFrom(branding),
    title: req.title || 'CERTIFICATE',
    certificateNo: req.certificateNo,
    date: longDate(req.issuedAt.slice(0, 10) || todayIso()),
    body: req.body,
    lines: req.feeLines.length ? req.feeLines : undefined,
    linesTotal: req.feeLines.length ? feeLinesTotal(req.feeLines) : undefined,
    signatoryName: settings.signatoryName || branding.signatoryName || undefined,
    signatoryDesignation: settings.signatoryDesignation || branding.signatoryDesignation || 'Principal',
    fileTag: `${req.regNo}-${req.certificateNo}`,
  })
}
