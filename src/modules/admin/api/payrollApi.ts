// src/modules/admin/api/payrollApi.ts
//
// Faculty payroll data layer (all tenant-scoped under colleges/{collegeId}):
//   salaryStructures/{facultyProfileId}   — basic pay, per-person overrides, bank/PAN
//   payslips/{month_facultyProfileId}     — immutable-once-paid monthly payslip snapshot
//   salaryCertificates/{autoId}           — issued certificate log (re-downloadable)
//
// Rules: admin / principal (and superadmin) manage everything; a faculty
// member can read only their own payslips and certificates (facultyUid).
// The app records payroll; salary disbursement happens in the bank — marking
// a payslip "paid" stamps the date + bank reference for the ledger.

import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '@/Firebase/config'
import { stripUndefined } from '@/shared/utils/firestoreClean'
import {
  canTransitionPayslip,
  type PayAdjustment,
  type PayslipLine,
  type PayslipStatus,
} from '../utils/payrollEngine'

// ─── Types ────────────────────────────────────────────────
export interface SalaryStructure {
  id: string
  facultyProfileId: string
  facultyUid: string
  name: string
  staffCode: string
  department: string
  designation: string
  employmentType: string
  joiningDate: string
  gender?: string
  basic: number
  /** componentId → flat monthly amount replacing the college default (0 = not applicable). */
  overrides: Record<string, number>
  pan?: string
  uan?: string
  bankName?: string
  accountNo?: string
  ifsc?: string
  effectiveFrom?: string
  active: boolean
  notes?: string
  updatedAt?: string
}

export interface PayslipHistoryEntry { at: string; by: string; action: string; note?: string }

export interface Payslip {
  id: string
  month: string
  payslipNo: string
  facultyProfileId: string
  facultyUid: string
  name: string
  staffCode: string
  department: string
  designation: string
  employmentType: string
  joiningDate: string
  pan?: string
  uan?: string
  bankName?: string
  accountNo?: string
  basic: number
  lopDays: number
  adjustments: PayAdjustment[]
  daysInPeriod: number
  paidDays: number
  earnings: PayslipLine[]
  deductions: PayslipLine[]
  gross: number
  totalDeductions: number
  net: number
  status: PayslipStatus
  paidOn?: string
  paymentRef?: string
  history: PayslipHistoryEntry[]
  updatedAt?: string
}

export type PayslipDraft = Omit<Payslip, 'id' | 'status' | 'history' | 'updatedAt'>

export interface SalaryCertificateRecord {
  id: string
  certificateNo: string
  facultyProfileId: string
  facultyUid: string
  name: string
  purpose: string
  issuedOn: string
  issuedBy: string
  title: string
  body: string
  breakdown?: { earnings: PayslipLine[]; deductions: PayslipLine[]; gross: number; net: number; monthLabel?: string } | null
  signatoryName?: string
  signatoryDesignation?: string
}

// ─── Helpers ──────────────────────────────────────────────
function collegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id')
  if (!id) throw new Error('No college in this session. Sign out and back in.')
  return id
}

function col(name: string, cid = collegeId()) {
  return collection(db, 'colleges', cid, name)
}

function actor(): string {
  return auth.currentUser?.displayName || auth.currentUser?.email || 'Finance office'
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function str(v: unknown): string {
  return v == null ? '' : String(v)
}

function iso(v: unknown): string | undefined {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: unknown }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString()
  }
  return v == null ? undefined : String(v)
}

function mapStructure(id: string, r: Record<string, unknown>): SalaryStructure {
  return {
    id,
    facultyProfileId: str(r.facultyProfileId || id),
    facultyUid: str(r.facultyUid),
    name: str(r.name),
    staffCode: str(r.staffCode),
    department: str(r.department),
    designation: str(r.designation),
    employmentType: str(r.employmentType || 'FULL_TIME'),
    joiningDate: str(r.joiningDate),
    gender: r.gender ? str(r.gender) : undefined,
    basic: num(r.basic),
    overrides: r.overrides && typeof r.overrides === 'object' ? (r.overrides as Record<string, number>) : {},
    pan: r.pan ? str(r.pan) : undefined,
    uan: r.uan ? str(r.uan) : undefined,
    bankName: r.bankName ? str(r.bankName) : undefined,
    accountNo: r.accountNo ? str(r.accountNo) : undefined,
    ifsc: r.ifsc ? str(r.ifsc) : undefined,
    effectiveFrom: r.effectiveFrom ? str(r.effectiveFrom) : undefined,
    active: r.active !== false,
    notes: r.notes ? str(r.notes) : undefined,
    updatedAt: iso(r.updatedAt),
  }
}

function mapPayslip(id: string, r: Record<string, unknown>): Payslip {
  return {
    id,
    month: str(r.month),
    payslipNo: str(r.payslipNo),
    facultyProfileId: str(r.facultyProfileId),
    facultyUid: str(r.facultyUid),
    name: str(r.name),
    staffCode: str(r.staffCode),
    department: str(r.department),
    designation: str(r.designation),
    employmentType: str(r.employmentType),
    joiningDate: str(r.joiningDate),
    pan: r.pan ? str(r.pan) : undefined,
    uan: r.uan ? str(r.uan) : undefined,
    bankName: r.bankName ? str(r.bankName) : undefined,
    accountNo: r.accountNo ? str(r.accountNo) : undefined,
    basic: num(r.basic),
    lopDays: num(r.lopDays),
    adjustments: Array.isArray(r.adjustments) ? (r.adjustments as PayAdjustment[]) : [],
    daysInPeriod: num(r.daysInPeriod),
    paidDays: num(r.paidDays),
    earnings: Array.isArray(r.earnings) ? (r.earnings as PayslipLine[]) : [],
    deductions: Array.isArray(r.deductions) ? (r.deductions as PayslipLine[]) : [],
    gross: num(r.gross),
    totalDeductions: num(r.totalDeductions),
    net: num(r.net),
    status: (r.status as PayslipStatus) || 'draft',
    paidOn: r.paidOn ? str(r.paidOn) : undefined,
    paymentRef: r.paymentRef ? str(r.paymentRef) : undefined,
    history: Array.isArray(r.history) ? (r.history as PayslipHistoryEntry[]) : [],
    updatedAt: iso(r.updatedAt),
  }
}

function mapCertificate(id: string, r: Record<string, unknown>): SalaryCertificateRecord {
  return {
    id,
    certificateNo: str(r.certificateNo),
    facultyProfileId: str(r.facultyProfileId),
    facultyUid: str(r.facultyUid),
    name: str(r.name),
    purpose: str(r.purpose),
    issuedOn: str(r.issuedOn),
    issuedBy: str(r.issuedBy),
    title: str(r.title),
    body: str(r.body),
    breakdown: (r.breakdown as SalaryCertificateRecord['breakdown']) ?? null,
    signatoryName: r.signatoryName ? str(r.signatoryName) : undefined,
    signatoryDesignation: r.signatoryDesignation ? str(r.signatoryDesignation) : undefined,
  }
}

export function payslipId(month: string, profileId: string): string {
  return `${month}_${String(profileId).replace(/[^A-Za-z0-9_-]/g, '')}`
}

// ─── Salary structures ────────────────────────────────────
export async function fetchSalaryStructures(): Promise<SalaryStructure[]> {
  const snap = await getDocs(col('salaryStructures'))
  return snap.docs.map(d => mapStructure(d.id, d.data() as Record<string, unknown>))
}

export async function saveSalaryStructure(s: Omit<SalaryStructure, 'id' | 'updatedAt'>): Promise<void> {
  const cid = collegeId()
  await setDoc(doc(col('salaryStructures', cid), s.facultyProfileId), {
    ...stripUndefined(s),
    collegeId: cid,
    updatedBy: actor(),
    updatedAt: serverTimestamp(),
  })
}

// ─── Payslips ─────────────────────────────────────────────
export async function fetchPayslips(month: string): Promise<Payslip[]> {
  const snap = await getDocs(query(col('payslips'), where('month', '==', month)))
  return snap.docs.map(d => mapPayslip(d.id, d.data() as Record<string, unknown>))
}

export async function fetchMyPayslips(uid: string): Promise<Payslip[]> {
  if (!uid) return []
  const snap = await getDocs(query(col('payslips'), where('facultyUid', '==', uid)))
  return snap.docs
    .map(d => mapPayslip(d.id, d.data() as Record<string, unknown>))
    .filter(p => p.status === 'approved' || p.status === 'paid')
    .sort((a, b) => b.month.localeCompare(a.month))
}

/** Create/refresh a draft payslip. Approved/paid payslips are locked. */
export async function savePayslipDraft(draft: PayslipDraft, note = 'Saved draft'): Promise<void> {
  const cid = collegeId()
  const ref = doc(col('payslips', cid), payslipId(draft.month, draft.facultyProfileId))
  const entry = { at: new Date().toISOString(), by: actor(), action: note }
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    if (snap.exists()) {
      const status = (snap.data().status as PayslipStatus) || 'draft'
      if (status !== 'draft') throw new Error(`This payslip is ${status}. Revert it to draft before editing.`)
      tx.update(ref, { ...stripUndefined(draft), updatedAt: serverTimestamp(), history: arrayUnion(entry) })
    } else {
      tx.set(ref, {
        ...stripUndefined(draft),
        collegeId: cid,
        status: 'draft',
        history: [entry],
        createdBy: actor(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  })
}

export async function setPayslipStatus(
  id: string,
  to: PayslipStatus,
  opts: { requireApproval: boolean; paidOn?: string; paymentRef?: string; note?: string },
): Promise<void> {
  const ref = doc(col('payslips'), id)
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Payslip not found.')
    const from = (snap.data().status as PayslipStatus) || 'draft'
    if (!canTransitionPayslip(from, to, opts.requireApproval)) {
      throw new Error(
        to === 'paid' && from === 'draft'
          ? 'This college requires payslips to be approved before they are marked paid.'
          : `A ${from} payslip cannot be moved to ${to}.`,
      )
    }
    const by = actor()
    const patch: Record<string, unknown> = {
      status: to,
      updatedAt: serverTimestamp(),
      history: arrayUnion({ at: new Date().toISOString(), by, action: `Status → ${to}`, ...(opts.note ? { note: opts.note } : {}) }),
    }
    if (to === 'approved') { patch.approvedBy = by; patch.approvedAt = serverTimestamp() }
    if (to === 'paid') {
      patch.paidOn = (opts.paidOn || new Date().toISOString().slice(0, 10)).slice(0, 10)
      if (opts.paymentRef) patch.paymentRef = opts.paymentRef
      patch.markedPaidBy = by
    }
    tx.update(ref, patch)
  })
}

export async function deletePayslip(p: Payslip): Promise<void> {
  if (p.status !== 'draft' && p.status !== 'cancelled') throw new Error('Only draft or cancelled payslips can be deleted.')
  await deleteDoc(doc(col('payslips'), p.id))
}

// ─── Salary certificates ──────────────────────────────────
export async function fetchSalaryCertificates(): Promise<SalaryCertificateRecord[]> {
  const snap = await getDocs(col('salaryCertificates'))
  return snap.docs
    .map(d => mapCertificate(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.issuedOn.localeCompare(a.issuedOn) || b.certificateNo.localeCompare(a.certificateNo))
}

export async function fetchMySalaryCertificates(uid: string): Promise<SalaryCertificateRecord[]> {
  if (!uid) return []
  const snap = await getDocs(query(col('salaryCertificates'), where('facultyUid', '==', uid)))
  return snap.docs
    .map(d => mapCertificate(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.issuedOn.localeCompare(a.issuedOn))
}

export async function issueSalaryCertificate(rec: Omit<SalaryCertificateRecord, 'id' | 'issuedBy'>): Promise<SalaryCertificateRecord> {
  const cid = collegeId()
  const issuedBy = actor()
  const ref = await addDoc(col('salaryCertificates', cid), {
    ...stripUndefined(rec),
    collegeId: cid,
    issuedBy,
    createdAt: serverTimestamp(),
  })
  return { ...rec, id: ref.id, issuedBy }
}
