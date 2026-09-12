// src/modules/admin/api/feeApi.ts
// Firestore API for the college fee ledger.
//
// Fee data is tenant-scoped below colleges/{collegeId}. The browser never
// chooses a college from a form: AuthContext refreshes the verified claim and
// stores the id only as a path selector for this API. Firestore rules remain
// the authorization boundary.

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '@/Firebase/config'

const MAX_READS = 500

function getCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id')
  if (!id) {
    throw new Error(
      'This sign-in carries no college to scope fee queries to. Sign out and back in so the token is refreshed; if it persists, ask an administrator to link this profile to a college.'
    )
  }
  return id
}

function collegeRef(path: string) {
  return collection(db, 'colleges', getCollegeId(), path)
}

function collegeDocRef(path: string) {
  return doc(db, 'colleges', getCollegeId(), path)
}

function asString(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return value == null ? '' : String(value)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function numeric(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

// ─── Types ──────────────────────────────────────────────

export type FeeStatus = 'paid' | 'pending' | 'overdue' | 'partial' | 'waived'
export type FeeCategory = 'tuition' | 'exam' | 'library' | 'lab' | 'hostel' | 'transport' | 'misc'
export type PaymentMode = 'cash' | 'card' | 'upi' | 'netbanking' | 'cheque' | 'dd'

export interface FeeStructure {
  id: string
  category: FeeCategory
  name: string
  amount: number
  course: string
  batch: string
  dueDate: string
  academicYear: string
  semester: string
  description?: string
  lateFeePerDay?: number
  createdAt?: string
  updatedAt?: string
}

export interface FeePayment {
  id: string
  studentId: string
  studentName: string
  regNo: string
  course: string
  batch: string
  structureId: string
  category: FeeCategory
  amount: number
  paidAmount: number
  status: FeeStatus
  dueDate: string
  paidDate?: string
  paymentMode?: PaymentMode
  transactionId?: string
  receiptNo?: string
  remarks?: string
  collectedBy?: string
  createdAt: string
  updatedAt: string
}

export interface FeeStudent {
  id: string
  name: string
  regNo: string
  course: string
  batch: string
  collegeId: string
}

export interface CreateFeePaymentInput {
  studentId: string
  studentName: string
  regNo: string
  course: string
  batch: string
  structureId?: string
  category: FeeCategory
  amount: number
  dueDate: string
  remarks?: string
}

export interface FeeTransaction {
  id: string
  type: 'payment' | 'waiver'
  amount: number
  paymentMode?: PaymentMode
  transactionId?: string
  receiptNo?: string
  remarks?: string
  performedBy?: string
  createdAt: string
}

export interface FeeSummary {
  totalDue: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  totalWaived: number
  countPaid: number
  countPending: number
  countOverdue: number
  countPartial: number
}

export interface FeeFilters {
  course: string
  batch: string
  status: FeeStatus | 'all'
  category: FeeCategory | 'all'
  search: string
  dateFrom: string
  dateTo: string
  studentId?: string
}

function mapPayment(id: string, raw: Record<string, unknown>): FeePayment {
  const amount = numeric(raw.amount)
  const paidAmount = Math.min(Math.max(numeric(raw.paidAmount), 0), amount)
  const storedStatus = (raw.status || 'pending') as FeeStatus
  const dueDate = asString(raw.dueDate).slice(0, 10)
  const derivedStatus: FeeStatus =
    storedStatus === 'waived' || storedStatus === 'paid'
      ? storedStatus
      : paidAmount >= amount && amount > 0
        ? 'paid'
        : dueDate && dueDate < today()
          ? 'overdue'
          : paidAmount > 0
            ? 'partial'
            : 'pending'

  return {
    id,
    studentId: String(raw.studentId || ''),
    studentName: String(raw.studentName || 'Unknown student'),
    regNo: String(raw.regNo || ''),
    course: String(raw.course || ''),
    batch: String(raw.batch || ''),
    structureId: String(raw.structureId || ''),
    category: (raw.category || 'misc') as FeeCategory,
    amount,
    paidAmount,
    status: derivedStatus,
    dueDate,
    paidDate: raw.paidDate ? asString(raw.paidDate).slice(0, 10) : undefined,
    paymentMode: raw.paymentMode as PaymentMode | undefined,
    transactionId: raw.transactionId ? String(raw.transactionId) : undefined,
    receiptNo: raw.receiptNo ? String(raw.receiptNo) : undefined,
    remarks: raw.remarks ? String(raw.remarks) : undefined,
    collectedBy: raw.collectedBy ? String(raw.collectedBy) : undefined,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  }
}

function mapStructure(id: string, raw: Record<string, unknown>): FeeStructure {
  return {
    id,
    category: (raw.category || 'misc') as FeeCategory,
    name: String(raw.name || 'Fee'),
    amount: numeric(raw.amount),
    course: String(raw.course || ''),
    batch: String(raw.batch || ''),
    dueDate: asString(raw.dueDate).slice(0, 10),
    academicYear: String(raw.academicYear || ''),
    semester: String(raw.semester || ''),
    description: raw.description ? String(raw.description) : undefined,
    lateFeePerDay: raw.lateFeePerDay == null ? undefined : numeric(raw.lateFeePerDay),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  }
}

// ─── Reads ──────────────────────────────────────────────

export async function fetchFeeStructures(): Promise<FeeStructure[]> {
  const snap = await getDocs(query(collegeRef('feeStructures'), limit(MAX_READS)))
  return snap.docs
    .map(d => mapStructure(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export async function fetchFeeStudents(): Promise<FeeStudent[]> {
  const collegeId = getCollegeId()
  const snap = await getDocs(query(collection(db, 'students'), where('collegeId', '==', collegeId), limit(MAX_READS)))
  return snap.docs
    .map(d => {
      const raw = d.data() as Record<string, unknown>
      return {
        id: d.id,
        name: String(raw.name || 'Unnamed student'),
        regNo: String(raw.regNo || raw.registrationNumber || raw.usn || ''),
        course: String(raw.course || raw.department || raw.branch || ''),
        batch: String(raw.batch || raw.academicYear || ''),
        collegeId: String(raw.collegeId || collegeId),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchFeePayments(filters?: Partial<FeeFilters>): Promise<FeePayment[]> {
  const constraints = filters?.studentId
    ? [where('studentId', '==', filters.studentId), limit(MAX_READS)]
    : [limit(MAX_READS)]
  const snap = await getDocs(query(collegeRef('feePayments'), ...constraints))

  let payments = snap.docs.map(d => mapPayment(d.id, d.data() as Record<string, unknown>))
  if (filters?.course && filters.course !== 'all') payments = payments.filter(p => p.course === filters.course)
  if (filters?.batch && filters.batch !== 'all') payments = payments.filter(p => p.batch === filters.batch)
  if (filters?.category && filters.category !== 'all') payments = payments.filter(p => p.category === filters.category)
  if (filters?.status && filters.status !== 'all') payments = payments.filter(p => p.status === filters.status)
  if (filters?.search) {
    const search = filters.search.toLowerCase().trim()
    payments = payments.filter(p => `${p.studentName} ${p.regNo} ${p.category} ${p.receiptNo || ''}`.toLowerCase().includes(search))
  }
  if (filters?.dateFrom) payments = payments.filter(p => p.dueDate >= filters.dateFrom!)
  if (filters?.dateTo) payments = payments.filter(p => p.dueDate <= filters.dateTo!)

  return payments.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export async function fetchFeeTransactions(paymentId: string): Promise<FeeTransaction[]> {
  const snap = await getDocs(query(collection(collegeDocRef(`feePayments/${paymentId}`), 'transactions'), limit(100)))
  return snap.docs
    .map(d => {
      const raw = d.data() as Record<string, unknown>
      return {
        id: d.id,
        type: (raw.type || 'payment') as FeeTransaction['type'],
        amount: numeric(raw.amount),
        paymentMode: raw.paymentMode as PaymentMode | undefined,
        transactionId: raw.transactionId ? String(raw.transactionId) : undefined,
        receiptNo: raw.receiptNo ? String(raw.receiptNo) : undefined,
        remarks: raw.remarks ? String(raw.remarks) : undefined,
        performedBy: raw.performedBy ? String(raw.performedBy) : undefined,
        createdAt: asString(raw.createdAt),
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// ─── Mutations ──────────────────────────────────────────

export async function createFeePayment(input: CreateFeePaymentInput): Promise<FeePayment | null> {
  const amount = numeric(input.amount)
  if (!input.studentId || !input.studentName || amount <= 0 || !input.dueDate) {
    throw new Error('Student, amount and due date are required.')
  }

  const dueDate = input.dueDate.slice(0, 10)
  const docRef = await addDoc(collegeRef('feePayments'), {
    studentId: input.studentId,
    studentName: input.studentName,
    regNo: input.regNo,
    course: input.course,
    batch: input.batch,
    category: input.category,
    ...(input.remarks ? { remarks: input.remarks } : {}),
    amount,
    dueDate,
    structureId: input.structureId || '',
    paidAmount: 0,
    status: dueDate < today() ? 'overdue' : 'pending',
    collegeId: getCollegeId(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    ...input,
    amount,
    dueDate,
    structureId: input.structureId || '',
    paidAmount: 0,
    status: dueDate < today() ? 'overdue' : 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function collectPayment(paymentId: string, amount: number, mode: PaymentMode, remarks?: string): Promise<boolean> {
  const paymentRef = collegeDocRef(`feePayments/${paymentId}`)
  const requestedAmount = numeric(amount)
  if (requestedAmount <= 0) throw new Error('Payment amount must be greater than zero.')

  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const receiptNo = `RCP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  const actor = auth.currentUser?.displayName || auth.currentUser?.email || 'College finance office'

  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(paymentRef)
    if (!snapshot.exists()) throw new Error('This fee record no longer exists.')
    const payment = snapshot.data() as Record<string, unknown>
    const total = numeric(payment.amount)
    const paid = numeric(payment.paidAmount)
    const remaining = Math.max(0, total - paid)
    if (payment.status === 'waived') throw new Error('A waived fee cannot receive a payment.')
    if (requestedAmount > remaining) throw new Error(`Payment exceeds the remaining balance of ₹${remaining.toLocaleString('en-IN')}.`)

    const newPaidAmount = paid + requestedAmount
    const newStatus: FeeStatus = newPaidAmount >= total
      ? 'paid'
      : String(payment.dueDate || '').slice(0, 10) < today() ? 'overdue' : 'partial'
    const transactionRef = doc(collection(paymentRef, 'transactions'))

    transaction.update(paymentRef, {
      paidAmount: newPaidAmount,
      status: newStatus,
      paidDate: today(),
      paymentMode: mode,
      transactionId,
      receiptNo,
      collectedBy: actor,
      ...(remarks ? { remarks } : {}),
      updatedAt: serverTimestamp(),
    })
    transaction.set(transactionRef, {
      type: 'payment',
      amount: requestedAmount,
      paymentMode: mode,
      transactionId,
      receiptNo,
      remarks: remarks || '',
      performedBy: actor,
      createdAt: serverTimestamp(),
    })
  })

  return true
}

export async function waiveFee(paymentId: string, remarks: string): Promise<boolean> {
  const paymentRef = collegeDocRef(`feePayments/${paymentId}`)
  const actor = auth.currentUser?.displayName || auth.currentUser?.email || 'College finance office'

  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(paymentRef)
    if (!snapshot.exists()) throw new Error('This fee record no longer exists.')
    const payment = snapshot.data() as Record<string, unknown>
    if (payment.status === 'paid') throw new Error('A fully paid fee cannot be waived.')
    const remaining = Math.max(0, numeric(payment.amount) - numeric(payment.paidAmount))
    const transactionRef = doc(collection(paymentRef, 'transactions'))
    transaction.update(paymentRef, {
      status: 'waived',
      remarks: remarks.trim() || 'Fee waived by administration',
      waivedAmount: remaining,
      waivedAt: serverTimestamp(),
      waivedBy: actor,
      updatedAt: serverTimestamp(),
    })
    transaction.set(transactionRef, {
      type: 'waiver',
      amount: remaining,
      remarks: remarks.trim() || 'Fee waived by administration',
      performedBy: actor,
      createdAt: serverTimestamp(),
    })
  })
  return true
}

export async function createFeeStructure(data: Omit<FeeStructure, 'id'>): Promise<FeeStructure | null> {
  const docRef = await addDoc(collegeRef('feeStructures'), {
    category: data.category,
    name: data.name,
    amount: data.amount,
    course: data.course,
    batch: data.batch,
    dueDate: data.dueDate,
    academicYear: data.academicYear,
    semester: data.semester,
    ...(data.description ? { description: data.description } : {}),
    ...(data.lateFeePerDay != null ? { lateFeePerDay: data.lateFeePerDay } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...data } as FeeStructure
}

// ─── Computed helpers ───────────────────────────────────

export function calculateSummary(payments: FeePayment[]): FeeSummary {
  const outstanding = (p: FeePayment) => Math.max(0, p.amount - p.paidAmount)
  return {
    totalDue: payments.reduce((sum, p) => sum + p.amount, 0),
    totalPaid: payments.reduce((sum, p) => sum + p.paidAmount, 0),
    totalPending: payments.filter(p => p.status === 'pending' || p.status === 'partial').reduce((sum, p) => sum + outstanding(p), 0),
    totalOverdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + outstanding(p), 0),
    totalWaived: payments.filter(p => p.status === 'waived').reduce((sum, p) => sum + outstanding(p), 0),
    countPaid: payments.filter(p => p.status === 'paid').length,
    countPending: payments.filter(p => p.status === 'pending').length,
    countOverdue: payments.filter(p => p.status === 'overdue').length,
    countPartial: payments.filter(p => p.status === 'partial').length,
  }
}

export function getCourseWiseSummary(payments: FeePayment[]) {
  return Array.from(new Set(payments.map(p => p.course))).map(course => {
    const rows = payments.filter(p => p.course === course)
    return {
      course,
      totalDue: rows.reduce((sum, p) => sum + p.amount, 0),
      totalPaid: rows.reduce((sum, p) => sum + p.paidAmount, 0),
      totalPending: rows.filter(p => p.status !== 'paid' && p.status !== 'waived').reduce((sum, p) => sum + Math.max(0, p.amount - p.paidAmount), 0),
      studentCount: new Set(rows.map(p => p.studentId)).size,
    }
  })
}

export function getCategoryWiseSummary(payments: FeePayment[]) {
  const categories: FeeCategory[] = ['tuition', 'exam', 'library', 'lab', 'hostel', 'transport', 'misc']
  return categories.map(category => {
    const rows = payments.filter(p => p.category === category)
    return {
      category,
      totalDue: rows.reduce((sum, p) => sum + p.amount, 0),
      totalPaid: rows.reduce((sum, p) => sum + p.paidAmount, 0),
      count: rows.length,
    }
  }).filter(c => c.count > 0)
}

export function getMonthlyCollection(payments: FeePayment[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthMap: Record<string, number> = {}
  payments.forEach(p => {
    if (p.paidDate) {
      const month = new Date(`${p.paidDate}T12:00:00`).toLocaleString('en-US', { month: 'short' })
      monthMap[month] = (monthMap[month] || 0) + p.paidAmount
    }
  })
  return months.map(month => ({ month, collected: monthMap[month] || 0, target: 0 }))
}

export function getOverduePayments(payments: FeePayment[]): FeePayment[] {
  return payments.filter(p => p.status === 'overdue')
}

export function getOutstandingAmount(payment: FeePayment): number {
  return Math.max(0, payment.amount - payment.paidAmount)
}
