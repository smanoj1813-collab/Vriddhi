// src/api/feeApi.ts
// Firestore API for fee management — ZERO composite indexes

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/Firebase/config'

const MAX_READS = 500

function getCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id')
  if (!id) throw new Error('No college ID found')
  return id
}

function collegeRef(path: string) {
  return collection(db, 'colleges', getCollegeId(), path)
}

function collegeDocRef(path: string) {
  return doc(db, 'colleges', getCollegeId(), path)
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
}

// ─── Read Budget Tracker ────────────────────────────────

let sessionReadCount = 0

function trackRead(count: number): boolean {
  sessionReadCount += count
  if (sessionReadCount > MAX_READS) {
    console.warn(`Read budget exceeded: ${sessionReadCount}/${MAX_READS}`)
    return false
  }
  return true
}

export function getReadCount(): number {
  return sessionReadCount
}

export function resetReadCount(): void {
  sessionReadCount = 0
}

// ─── Fetchers (NO orderBy + where combo) ──────────────

export async function fetchFeeStructures(): Promise<FeeStructure[]> {
  const snap = await getDocs(query(collegeRef('feeStructures'), limit(MAX_READS)))
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as FeeStructure)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export async function fetchFeePayments(filters?: Partial<FeeFilters>): Promise<FeePayment[]> {
  const constraints: any[] = [limit(MAX_READS)]

  if (filters?.course && filters.course !== 'all') {
    constraints.push(where('course', '==', filters.course))
  }
  if (filters?.batch && filters.batch !== 'all') {
    constraints.push(where('batch', '==', filters.batch))
  }
  if (filters?.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status))
  }
  if (filters?.category && filters.category !== 'all') {
    constraints.push(where('category', '==', filters.category))
  }

  const snap = await getDocs(query(collegeRef('feePayments'), ...constraints))
  if (!trackRead(snap.size)) return []

  let payments = snap.docs.map(d => ({ id: d.id, ...d.data() }) as FeePayment)

  // Client-side filtering for search and date range
  if (filters?.search) {
    const search = filters.search.toLowerCase()
    payments = payments.filter(p =>
      p.studentName.toLowerCase().includes(search) ||
      p.regNo.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search)
    )
  }
  if (filters?.dateFrom && filters.dateFrom !== '') {
    payments = payments.filter(p => p.dueDate >= filters.dateFrom!)
  }
  if (filters?.dateTo && filters.dateTo !== '') {
    payments = payments.filter(p => p.dueDate <= filters.dateTo!)
  }

  return payments.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

// ─── Mutations ──────────────────────────────────────────

export async function collectPayment(paymentId: string, amount: number, mode: PaymentMode): Promise<boolean> {
  const paymentRef = collegeDocRef(`feePayments/${paymentId}`)
  const paymentSnap = await getDoc(paymentRef)
  if (!paymentSnap.exists()) return false

  const payment = paymentSnap.data() as FeePayment
  const newPaidAmount = payment.paidAmount + amount
  const newStatus: FeeStatus = newPaidAmount >= payment.amount ? 'paid' : 'partial'

  await updateDoc(paymentRef, {
    paidAmount: newPaidAmount,
    status: newStatus,
    paidDate: new Date().toISOString().split('T')[0],
    paymentMode: mode,
    transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
    receiptNo: `RCP${100000 + Math.floor(Math.random() * 90000)}`,
    collectedBy: 'Admin Office',
    updatedAt: serverTimestamp(),
  })

  return true
}

export async function waiveFee(paymentId: string, remarks: string): Promise<boolean> {
  const paymentRef = collegeDocRef(`feePayments/${paymentId}`)
  await updateDoc(paymentRef, {
    status: 'waived',
    remarks,
    updatedAt: serverTimestamp(),
  })
  return true
}

export async function createFeeStructure(data: Omit<FeeStructure, 'id'>): Promise<FeeStructure | null> {
  const docData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const docRef = await addDoc(collegeRef('feeStructures'), docData)
  return { id: docRef.id, ...data } as FeeStructure
}

// ─── Computed Helpers (Client-side only) ────────────────

export function calculateSummary(payments: FeePayment[]): FeeSummary {
  return {
    totalDue: payments.reduce((sum, p) => sum + p.amount, 0),
    totalPaid: payments.reduce((sum, p) => sum + p.paidAmount, 0),
    totalPending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    totalOverdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    totalWaived: payments.filter(p => p.status === 'waived').reduce((sum, p) => sum + p.amount, 0),
    countPaid: payments.filter(p => p.status === 'paid').length,
    countPending: payments.filter(p => p.status === 'pending').length,
    countOverdue: payments.filter(p => p.status === 'overdue').length,
    countPartial: payments.filter(p => p.status === 'partial').length,
  }
}

export function getCourseWiseSummary(payments: FeePayment[]) {
  const courses = Array.from(new Set(payments.map(p => p.course)))
  return courses.map(course => {
    const coursePayments = payments.filter(p => p.course === course)
    const uniqueStudents = new Set(coursePayments.map(p => p.studentId))
    return {
      course,
      totalDue: coursePayments.reduce((sum, p) => sum + p.amount, 0),
      totalPaid: coursePayments.reduce((sum, p) => sum + p.paidAmount, 0),
      totalPending: coursePayments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + (p.amount - p.paidAmount), 0),
      studentCount: uniqueStudents.size,
    }
  })
}

export function getCategoryWiseSummary(payments: FeePayment[]) {
  const categories: FeeCategory[] = ['tuition', 'exam', 'library', 'lab', 'hostel', 'transport', 'misc']
  return categories.map(category => {
    const catPayments = payments.filter(p => p.category === category)
    return {
      category,
      totalDue: catPayments.reduce((sum, p) => sum + p.amount, 0),
      totalPaid: catPayments.reduce((sum, p) => sum + p.paidAmount, 0),
      count: catPayments.length,
    }
  }).filter(c => c.count > 0)
}

export function getMonthlyCollection(payments: FeePayment[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthMap: Record<string, number> = {}

  payments.forEach(p => {
    if (p.paidDate) {
      const month = new Date(p.paidDate).toLocaleString('en-US', { month: 'short' })
      monthMap[month] = (monthMap[month] || 0) + p.paidAmount
    }
  })

  return months.map(month => ({
    month,
    collected: monthMap[month] || 0,
    target: 100000,
  }))
}

export function getOverduePayments(payments: FeePayment[]): FeePayment[] {
  return payments.filter(p => p.status === 'overdue')
}
