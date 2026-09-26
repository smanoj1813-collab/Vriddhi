// src/modules/office/api/noDuesApi.ts
//
//   colleges/{cid}/noDues/{id}   one clearance request per student/purpose
//   colleges/{cid}/config/nodues NoDuesSettings (checklist, purposes, prefix)
//
// Students apply (empty checklist, status open); each office clears or
// blocks its own section; when every section is cleared the request turns
// "cleared" and an office issues the numbered certificate.

import { addDoc, getDoc, getDocs, limit, query, runTransaction, setDoc, where, type DocumentData } from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { actor, clean, formatDocNo, financialYear, nextCounter, nowIso, officeCol, officeDoc, str } from './officeDb'
import { loadPdfLibs } from '@/shared/utils/pdfRuntime'
import { normalizeNoDuesSettings, overallStatus, type NoDuesSettings, type NoDuesStatus, type SectionState, type SectionStatus } from '../utils/noDuesEngine'

export async function fetchNoDuesSettings(cid?: string): Promise<NoDuesSettings> {
  const snap = await getDoc(officeDoc('config', 'nodues', cid))
  return normalizeNoDuesSettings(snap.exists() ? (snap.data() as Record<string, unknown>) : null)
}
export async function saveNoDuesSettings(s: NoDuesSettings): Promise<void> {
  await setDoc(officeDoc('config', 'nodues'), clean({ ...normalizeNoDuesSettings(s as unknown as Record<string, unknown>), updatedAt: nowIso(), updatedBy: actor().name }))
}

export interface NoDuesRequest {
  id: string
  studentId: string
  studentUid: string
  studentName: string
  regNo: string
  course: string
  batch: string
  department: string
  purpose: string
  status: NoDuesStatus
  sections: Record<string, SectionState>
  requestedBy: string
  createdAt: string
  clearedAt: string
  certificateNo: string
  issuedAt: string
  issuedBy: string
}

function mapReq(id: string, r: DocumentData): NoDuesRequest {
  const secs = (r.sections && typeof r.sections === 'object' ? r.sections : {}) as Record<string, Record<string, unknown>>
  return {
    id,
    studentId: str(r.studentId),
    studentUid: str(r.studentUid),
    studentName: str(r.studentName),
    regNo: str(r.regNo),
    course: str(r.course),
    batch: str(r.batch),
    department: str(r.department),
    purpose: str(r.purpose),
    status: str(r.status, 'open') as NoDuesStatus,
    sections: Object.fromEntries(Object.entries(secs).map(([k, v]) => [k, { status: str(v?.status, 'pending') as SectionStatus, note: str(v?.note), dues: Number(v?.dues) || 0, by: str(v?.by), at: str(v?.at) }])),
    requestedBy: str(r.requestedBy),
    createdAt: str(r.createdAt),
    clearedAt: str(r.clearedAt),
    certificateNo: str(r.certificateNo),
    issuedAt: str(r.issuedAt),
    issuedBy: str(r.issuedBy),
  }
}

export async function fetchNoDuesRequests(cid?: string): Promise<NoDuesRequest[]> {
  const snap = await getDocs(query(officeCol('noDues', cid), limit(5000)))
  return snap.docs.map(d => mapReq(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function fetchMyNoDues(uid: string, cid?: string): Promise<NoDuesRequest[]> {
  const snap = await getDocs(query(officeCol('noDues', cid), where('studentUid', '==', uid), limit(50)))
  return snap.docs.map(d => mapReq(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export interface NoDuesStudent {
  studentId: string
  uid: string
  name: string
  regNo: string
  course: string
  batch: string
  department: string
}

/** Office- or student-initiated request. Sections start empty (all pending). */
export async function createNoDuesRequest(s: NoDuesStudent, purpose: string, existing: NoDuesRequest[]): Promise<string> {
  if (!purpose.trim()) throw new Error('Choose the purpose.')
  const dup = existing.find(r => (r.studentId === s.studentId || (s.uid && r.studentUid === s.uid)) && r.purpose === purpose && (r.status === 'open' || r.status === 'cleared'))
  if (dup) throw new Error('A request for this purpose is already in progress.')
  const ref = await addDoc(
    officeCol('noDues'),
    clean({
      studentId: s.studentId,
      studentUid: s.uid,
      studentName: s.name,
      regNo: s.regNo,
      course: s.course,
      batch: s.batch,
      department: s.department,
      purpose: purpose.trim(),
      status: 'open',
      sections: {},
      requestedBy: actor().name,
      createdAt: nowIso(),
    }),
  )
  return ref.id
}

/** Clear / block / reopen one section; the overall status follows the checklist. */
export async function setNoDuesSection(reqId: string, key: string, status: SectionStatus, note: string, dues: number, settings: NoDuesSettings): Promise<void> {
  if (status === 'blocked' && !note.trim()) throw new Error('Say what is pending (e.g. 2 books not returned).')
  const ref = officeDoc('noDues', reqId)
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Request not found.')
    const cur = mapReq(reqId, snap.data())
    if (cur.status === 'issued' || cur.status === 'cancelled') throw new Error('This request is closed.')
    const sections = { ...cur.sections, [key]: { status, note: note.trim(), dues: Math.max(0, dues || 0), by: actor().name, at: nowIso() } }
    const overall = overallStatus(settings.sections, sections)
    tx.update(ref, clean({ sections, status: overall, clearedAt: overall === 'cleared' ? nowIso() : '', updatedAt: nowIso() }))
  })
}

export async function issueNoDuesCertificate(req: NoDuesRequest, settings: NoDuesSettings): Promise<string> {
  if (req.status !== 'cleared') throw new Error('All sections must be cleared first.')
  const certificateNo = formatDocNo(settings.certificatePrefix, await nextCounter(`nodues_${financialYear()}`))
  const ref = officeDoc('noDues', req.id)
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    const cur = mapReq(req.id, snap.data() || {})
    if (cur.status !== 'cleared') throw new Error('This request is no longer cleared.')
    tx.update(ref, { status: 'issued', certificateNo, issuedAt: nowIso(), issuedBy: actor().name, updatedAt: nowIso() })
  })
  return certificateNo
}

export async function cancelNoDues(reqId: string): Promise<void> {
  const ref = officeDoc('noDues', reqId)
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    if (str(snap.data()?.status) === 'issued') throw new Error('An issued certificate cannot be cancelled.')
    tx.update(ref, { status: 'cancelled', updatedAt: nowIso(), updatedBy: actor().name })
  })
}

/** Certificate PDF — shared by the office page and the student page. */
export async function downloadNoDuesCertificate(req: NoDuesRequest, settings: NoDuesSettings, college: { collegeName: string; address: string }): Promise<void> {
  const { jsPDF } = await loadPdfLibs()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let y = 22
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(college.collegeName || 'College', W / 2, y, { align: 'center' })
  y += 6
  if (college.address) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(doc.splitTextToSize(college.address, W - 40), W / 2, y, { align: 'center' })
    y += 8
  }
  doc.setDrawColor(40)
  doc.line(20, y, W - 20, y)
  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('NO DUES CERTIFICATE', W / 2, y, { align: 'center' })
  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Certificate No: ${req.certificateNo}`, 20, y)
  doc.text(`Date: ${(req.issuedAt || nowIso()).slice(0, 10).split('-').reverse().join('-')}`, W - 20, y, { align: 'right' })
  y += 10
  const rows: Array<[string, string]> = [
    ['Name', req.studentName],
    ['Register No.', req.regNo || '—'],
    ['Course / Batch', [req.course, req.batch].filter(Boolean).join(' / ') || '—'],
    ['Department', req.department || '—'],
    ['Purpose', req.purpose],
  ]
  for (const [k, v] of rows) {
    doc.setFont('helvetica', 'bold')
    doc.text(k, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(`: ${v}`, 60, y)
    y += 7
  }
  y += 4
  doc.text(doc.splitTextToSize(settings.certificateNote, W - 40), 20, y)
  y += 16
  doc.setFont('helvetica', 'bold')
  doc.text('Section', 20, y)
  doc.text('Cleared by', 90, y)
  doc.text('On', W - 20, y, { align: 'right' })
  y += 2
  doc.line(20, y, W - 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  for (const def of settings.sections) {
    const s = req.sections[def.key]
    doc.text(def.label, 20, y)
    doc.text(s?.by || '—', 90, y)
    doc.text(s?.at ? s.at.slice(0, 10).split('-').reverse().join('-') : '—', W - 20, y, { align: 'right' })
    y += 7
  }
  y += 24
  doc.text('Issued by: ' + (req.issuedBy || ''), 20, y)
  doc.text('Principal', W - 20, y, { align: 'right' })
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('Generated by Vriddhi. Verify the certificate number with the college office.', W / 2, 287, { align: 'center' })
  doc.save(`no-dues-${req.certificateNo.replace(/\//g, '-')}.pdf`)
}
