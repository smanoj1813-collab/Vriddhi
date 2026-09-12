// src/modules/admin/hooks/useFeeData.ts
// Shared fee-ledger data hook for college finance staff and the student portal.

export type {
  FeePayment,
  FeeStatus,
  FeeCategory,
  PaymentMode,
  FeeStructure,
  FeeSummary,
  FeeFilters,
  FeeStudent,
  FeeTransaction,
  CreateFeePaymentInput,
} from '../api/feeApi'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  calculateSummary,
  collectPayment,
  createFeePayment,
  createFeeStructure,
  fetchFeePayments,
  fetchFeeStudents,
  fetchFeeStructures,
  getCategoryWiseSummary,
  getCourseWiseSummary,
  getMonthlyCollection,
  getOverduePayments,
  waiveFee,
  type CreateFeePaymentInput,
  type FeeFilters,
  type FeePayment,
  type FeeStudent,
  type FeeStructure,
  type FeeSummary,
  type PaymentMode,
} from '../api/feeApi'

export function useFeeData(studentId?: string) {
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FeeFilters>({
    course: 'all', batch: 'all', status: 'all', category: 'all', search: '', dateFrom: '', dateTo: '',
  })
  const [allPayments, setAllPayments] = useState<FeePayment[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [students, setStudents] = useState<FeeStudent[]>([])
  const loadedRef = useRef(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [paymentsData, structuresData, studentsData] = await Promise.all([
        fetchFeePayments({
          course: filters.course,
          batch: filters.batch,
          status: filters.status,
          category: filters.category,
          search: filters.search,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          ...(studentId ? { studentId } : {}),
        }),
        fetchFeeStructures(),
        studentId ? Promise.resolve([] as FeeStudent[]) : fetchFeeStudents(),
      ])
      setAllPayments(paymentsData)
      setFeeStructures(structuresData)
      setStudents(studentsData)
      loadedRef.current = true
    } catch (error) {
      console.error('[useFeeData] Failed to load fee ledger:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.batch, filters.category, filters.course, filters.dateFrom, filters.dateTo, filters.search, filters.status, studentId])

  useEffect(() => {
    if (!loadedRef.current) void fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!loadedRef.current) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => void fetchData(), 300)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [fetchData])

  const summary = useMemo(() => calculateSummary(allPayments), [allPayments])
  const courseSummary = useMemo(() => getCourseWiseSummary(allPayments), [allPayments])
  const categorySummary = useMemo(() => getCategoryWiseSummary(allPayments), [allPayments])
  const monthlyCollection = useMemo(() => getMonthlyCollection(allPayments), [allPayments])
  const overduePayments = useMemo(() => getOverduePayments(allPayments), [allPayments])
  const studentPayments = useMemo(() => studentId ? allPayments.filter(p => p.studentId === studentId) : [], [allPayments, studentId])
  const studentSummary = useMemo(() => studentId ? calculateSummary(studentPayments) : null, [studentId, studentPayments])

  const updateFilters = useCallback((newFilters: Partial<FeeFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    loadedRef.current = true
  }, [])

  const refreshData = useCallback(() => {
    loadedRef.current = false
    void fetchData()
  }, [fetchData])

  const handleCollectPayment = useCallback(async (paymentId: string, amount: number, mode: PaymentMode, remarks?: string) => {
    try {
      const success = await collectPayment(paymentId, amount, mode, remarks)
      if (success) refreshData()
      return success
    } catch (error) {
      console.error('[useFeeData] Payment collection failed:', error)
      return false
    }
  }, [refreshData])

  const handleWaiveFee = useCallback(async (paymentId: string, remarks: string) => {
    try {
      const success = await waiveFee(paymentId, remarks)
      if (success) refreshData()
      return success
    } catch (error) {
      console.error('[useFeeData] Fee waiver failed:', error)
      return false
    }
  }, [refreshData])

  const handleCreateFeePayment = useCallback(async (data: CreateFeePaymentInput) => {
    try {
      const result = await createFeePayment(data)
      refreshData()
      return result
    } catch (error) {
      console.error('[useFeeData] Fee assignment failed:', error)
      return null
    }
  }, [refreshData])

  const handleCreateFeeStructure = useCallback(async (data: Omit<FeeStructure, 'id'>) => {
    try {
      const result = await createFeeStructure(data)
      refreshData()
      return result
    } catch (error) {
      console.error('[useFeeData] Fee structure creation failed:', error)
      return null
    }
  }, [refreshData])

  return {
    loading,
    filters,
    allPayments,
    summary,
    courseSummary,
    categorySummary,
    monthlyCollection,
    overduePayments,
    studentPayments,
    studentSummary,
    feeStructures,
    students,
    updateFilters,
    refreshData,
    collectPayment: handleCollectPayment,
    waiveFee: handleWaiveFee,
    createFeePayment: handleCreateFeePayment,
    createFeeStructure: handleCreateFeeStructure,
  }
}
