// src/hooks/useFeeData.ts
// React hook for fee management — one-time fetch, manual refresh
// Re-exports types from feeApi for convenience

export type { FeePayment, FeeStatus, FeeCategory, PaymentMode, FeeStructure, FeeSummary, FeeFilters } from '../api/feeApi'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  fetchFeeStructures,
  fetchFeePayments,
  collectPayment,
  waiveFee,
  createFeeStructure,
  calculateSummary,
  getCourseWiseSummary,
  getCategoryWiseSummary,
  getMonthlyCollection,
  getOverduePayments,
  FeePayment,
  FeeStructure,
  FeeFilters,
  FeeSummary,
  PaymentMode,
} from '../api/feeApi'

export function useFeeData(studentId?: string) {
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FeeFilters>({
    course: 'all',
    batch: 'all',
    status: 'all',
    category: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
  })

  const [allPayments, setAllPayments] = useState<FeePayment[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const loadedRef = useRef(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── FETCH DATA ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [paymentsData, structuresData] = await Promise.all([
        fetchFeePayments({
          course: filters.course,
          batch: filters.batch,
          status: filters.status,
          category: filters.category,
        }),
        fetchFeeStructures(),
      ])
      setAllPayments(paymentsData)
      setFeeStructures(structuresData)
      loadedRef.current = true
    } catch (error) {
      console.error('Error fetching fee data:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.course, filters.batch, filters.status, filters.category])

  useEffect(() => {
    if (!loadedRef.current) {
      fetchData()
    }
  }, [fetchData])

  // Refetch when filters change (debounce search & dates)
  useEffect(() => {
    if (loadedRef.current) {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      searchTimerRef.current = setTimeout(() => {
        fetchData()
      }, 300)
      return () => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      }
    }
  }, [filters.search, filters.dateFrom, filters.dateTo, fetchData])

  // ─── COMPUTED DATA ───────────────────────────────────
  const summary = useMemo(() => calculateSummary(allPayments), [allPayments])
  const courseSummary = useMemo(() => getCourseWiseSummary(allPayments), [allPayments])
  const categorySummary = useMemo(() => getCategoryWiseSummary(allPayments), [allPayments])
  const monthlyCollection = useMemo(() => getMonthlyCollection(allPayments), [allPayments])
  const overduePayments = useMemo(() => getOverduePayments(allPayments), [allPayments])

  const studentPayments = useMemo(() => {
    if (!studentId) return []
    return allPayments.filter(p => p.studentId === studentId)
  }, [allPayments, studentId])

  const studentSummary = useMemo(() => {
    if (!studentId) return null
    return calculateSummary(studentPayments)
  }, [studentPayments, studentId])

  // ─── ACTIONS ─────────────────────────────────────────
  const updateFilters = useCallback((newFilters: Partial<FeeFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const refreshData = useCallback(() => {
    loadedRef.current = false
    fetchData()
  }, [fetchData])

  const handleCollectPayment = useCallback(async (paymentId: string, amount: number, mode: PaymentMode): Promise<boolean> => {
    try {
      const success = await collectPayment(paymentId, amount, mode)
      if (success) refreshData()
      return success
    } catch (error) {
      console.error('Error collecting payment:', error)
      return false
    }
  }, [refreshData])

  const handleWaiveFee = useCallback(async (paymentId: string, remarks: string): Promise<boolean> => {
    try {
      const success = await waiveFee(paymentId, remarks)
      if (success) refreshData()
      return success
    } catch (error) {
      console.error('Error waiving fee:', error)
      return false
    }
  }, [refreshData])

  const handleCreateFeeStructure = useCallback(async (data: Omit<FeeStructure, 'id'>): Promise<FeeStructure | null> => {
    try {
      const result = await createFeeStructure(data)
      refreshData()
      return result
    } catch (error) {
      console.error('Error creating fee structure:', error)
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
    updateFilters,
    refreshData,
    collectPayment: handleCollectPayment,
    waiveFee: handleWaiveFee,
    createFeeStructure: handleCreateFeeStructure,
  }
}