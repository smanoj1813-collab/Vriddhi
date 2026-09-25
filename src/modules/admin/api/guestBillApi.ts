// src/modules/admin/api/guestBillApi.ts
//
// Guest Faculty Billing ledger — colleges/{collegeId}/guestBills/{month_profileId}.
// One bill per guest per month (deterministic id), moved through
// draft → approved → recorded (or cancelled). A BILLING LEDGER ONLY: recording
// a bill stamps the date/reference of the payment made outside the app; no
// money is moved here. Firestore rules: finance roles write; the guest reads
// their own bills (facultyUid == auth.uid).

import {
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
  canTransitionBill,
  guestBillId,
  type BillAdjustment,
  type GuestBillStatus,
} from '../utils/guestBilling'

export interface BillHistoryEntry {
  at: string
  by: string
  action: string
  note?: string
}

export interface GuestBill {
  id: string
  collegeId: string
  month: string
  billNo: string
  facultyProfileId: string
  facultyUid: string
  staffCode: string
  name: string
  department: string
  employmentType: string
  periodRate: number
  scheduledPeriods: number
  extraPeriods: number
  absentPeriods: number
  billablePeriods: number
  periodAmount: number
  adjustments: BillAdjustment[]
  adjustmentsTotal: number
  grossAmount: number
  deductionPercent: number
  deductionLabel: string
  deductionAmount: number
  netAmount: number
  status: GuestBillStatus
  remarks?: string
  recordedOn?: string
  recordedRef?: string
  history: BillHistoryEntry[]
  createdAt?: string
  updatedAt?: string
}

export type GuestBillDraft = Omit<GuestBill, 'id' | 'status' | 'history' | 'createdAt' | 'updatedAt' | 'collegeId'>

function collegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id')
  if (!id) throw new Error('No college in this session. Sign out and back in.')
  return id
}

function billsCol(cid = collegeId()) {
  return collection(db, 'colleges', cid, 'guestBills')
}

function actor(): string {
  return auth.currentUser?.displayName || auth.currentUser?.email || 'Finance office'
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function iso(v: unknown): string | undefined {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: unknown }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString()
  }
  return v == null ? undefined : String(v)
}

function mapBill(id: string, raw: Record<string, unknown>): GuestBill {
  return {
    id,
    collegeId: String(raw.collegeId ?? ''),
    month: String(raw.month ?? ''),
    billNo: String(raw.billNo ?? ''),
    facultyProfileId: String(raw.facultyProfileId ?? ''),
    facultyUid: String(raw.facultyUid ?? ''),
    staffCode: String(raw.staffCode ?? ''),
    name: String(raw.name ?? ''),
    department: String(raw.department ?? ''),
    employmentType: String(raw.employmentType ?? ''),
    periodRate: num(raw.periodRate),
    scheduledPeriods: num(raw.scheduledPeriods),
    extraPeriods: num(raw.extraPeriods),
    absentPeriods: num(raw.absentPeriods),
    billablePeriods: num(raw.billablePeriods),
    periodAmount: num(raw.periodAmount),
    adjustments: Array.isArray(raw.adjustments) ? (raw.adjustments as BillAdjustment[]) : [],
    adjustmentsTotal: num(raw.adjustmentsTotal),
    grossAmount: num(raw.grossAmount),
    deductionPercent: num(raw.deductionPercent),
    deductionLabel: String(raw.deductionLabel ?? 'Deduction'),
    deductionAmount: num(raw.deductionAmount),
    netAmount: num(raw.netAmount),
    status: (raw.status as GuestBillStatus) || 'draft',
    remarks: raw.remarks ? String(raw.remarks) : undefined,
    recordedOn: raw.recordedOn ? String(raw.recordedOn) : undefined,
    recordedRef: raw.recordedRef ? String(raw.recordedRef) : undefined,
    history: Array.isArray(raw.history) ? (raw.history as BillHistoryEntry[]) : [],
    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
  }
}

export async function fetchGuestBills(month: string): Promise<GuestBill[]> {
  const snap = await getDocs(query(billsCol(), where('month', '==', month)))
  return snap.docs.map(d => mapBill(d.id, d.data() as Record<string, unknown>))
}

/** A guest faculty member's own bills (faculty self-service). */
export async function fetchMyGuestBills(uid: string): Promise<GuestBill[]> {
  if (!uid) return []
  const snap = await getDocs(query(billsCol(), where('facultyUid', '==', uid)))
  return snap.docs
    .map(d => mapBill(d.id, d.data() as Record<string, unknown>))
    .filter(b => b.status !== 'cancelled')
    .sort((a, b) => b.month.localeCompare(a.month))
}

/**
 * Create or update a bill while it is still a draft. Refuses to touch an
 * approved/recorded bill (revert it to draft first) so the ledger stays honest.
 */
export async function saveGuestBillDraft(draft: GuestBillDraft, note = 'Saved draft'): Promise<string> {
  const cid = collegeId()
  const id = guestBillId(draft.month, draft.facultyProfileId)
  const ref = doc(billsCol(cid), id)
  const entry: BillHistoryEntry = { at: new Date().toISOString(), by: actor(), action: note }
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    if (snap.exists()) {
      const status = (snap.data().status as GuestBillStatus) || 'draft'
      if (status !== 'draft') throw new Error(`This bill is ${status}. Revert it to draft before editing.`)
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
  return id
}

export interface StatusChangeOptions {
  requireApproval: boolean
  recordedOn?: string
  recordedRef?: string
  note?: string
}

export async function setGuestBillStatus(id: string, to: GuestBillStatus, opts: StatusChangeOptions): Promise<void> {
  const ref = doc(billsCol(), id)
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Bill not found.')
    const from = (snap.data().status as GuestBillStatus) || 'draft'
    if (!canTransitionBill(from, to, opts.requireApproval)) {
      throw new Error(
        to === 'recorded' && from === 'draft'
          ? 'This college requires bills to be approved before they are recorded.'
          : `A ${from} bill cannot be moved to ${to}.`,
      )
    }
    const by = actor()
    const patch: Record<string, unknown> = {
      status: to,
      updatedAt: serverTimestamp(),
      history: arrayUnion({ at: new Date().toISOString(), by, action: `Status → ${to}`, ...(opts.note ? { note: opts.note } : {}) }),
    }
    if (to === 'approved') { patch.approvedBy = by; patch.approvedAt = serverTimestamp() }
    if (to === 'recorded') {
      patch.recordedBy = by
      patch.recordedOn = (opts.recordedOn || new Date().toISOString().slice(0, 10)).slice(0, 10)
      if (opts.recordedRef) patch.recordedRef = opts.recordedRef
    }
    tx.update(ref, patch)
  })
}

export async function deleteGuestBill(bill: GuestBill): Promise<void> {
  if (bill.status !== 'draft' && bill.status !== 'cancelled') {
    throw new Error('Only draft or cancelled bills can be deleted.')
  }
  await deleteDoc(doc(billsCol(), bill.id))
}

/** Upsert many drafts at once (Generate bills for the month). Existing non-draft bills are skipped. */
export async function generateGuestBillDrafts(drafts: GuestBillDraft[], existing: GuestBill[]): Promise<number> {
  const cid = collegeId()
  const locked = new Set(existing.filter(b => b.status !== 'draft').map(b => b.id))
  const known = new Set(existing.map(b => b.id))
  let written = 0
  for (const d of drafts) {
    const id = guestBillId(d.month, d.facultyProfileId)
    if (locked.has(id) || known.has(id)) continue
    await setDoc(doc(billsCol(cid), id), {
      ...stripUndefined(d),
      collegeId: cid,
      status: 'draft',
      history: [{ at: new Date().toISOString(), by: actor(), action: 'Generated from timetable' }],
      createdBy: actor(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    written++
  }
  return written
}
