// Hook for challan management - BCU/BNU university exam fees
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchChallans,
  createChallan,
  createBulkChallans,
  verifyChallan,
  markChallanPaidAtBank,
  rejectChallan,
  type Challan,
  type ChallanStatus,
  type ChallanType,
  type CreateChallanInput,
} from '../api/feeApi'

export function useChallanData(studentId?: string) {
  const [loading, setLoading] = useState(true)
  const [challans, setChallans] = useState<Challan[]>([])
  // An empty challan table used to be indistinguishable from a denied read:
  // every failure went to console.error, so the finance desk saw "no challans"
  // and students saw the same on their own page. Keep the reason attachable.
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ status: ChallanStatus | 'all'; type: ChallanType | 'all'; search: string }>({
    status: 'all',
    type: 'all',
    search: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchChallans({
        ...(studentId ? { studentId } : {}),
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.type !== 'all' ? { type: filters.type } : {}),
      })
      let filtered = data
      if (filters.search) {
        const term = filters.search.toLowerCase()
        filtered = filtered.filter(c =>
          `${c.challanNo} ${c.studentName} ${c.regNo} ${c.course} ${c.examTitle || ''}`.toLowerCase().includes(term)
        )
      }
      setChallans(filtered)
      setError(null)
    } catch (e) {
      console.error('[useChallanData] Failed:', e)
      const message = e instanceof Error ? e.message : String(e)
      setError(/permission|insufficient/i.test(message)
        ? 'Firestore refused the read (permission-denied). The colleges/{collegeId}/challans rules must be deployed for this collection to be visible.'
        : message)
    } finally {
      setLoading(false)
    }
  }, [studentId, filters.status, filters.type, filters.search])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const refresh = useCallback(() => {
    void fetchData()
  }, [fetchData])

  const summary = useMemo(() => {
    return {
      total: challans.length,
      generated: challans.filter(c => c.status === 'generated').length,
      paidAtBank: challans.filter(c => c.status === 'paid_at_bank').length,
      verified: challans.filter(c => c.status === 'verified').length,
      rejected: challans.filter(c => c.status === 'rejected').length,
      totalAmount: challans.reduce((sum, c) => sum + c.amount, 0),
      verifiedAmount: challans.filter(c => c.status === 'verified').reduce((sum, c) => sum + c.amount, 0),
      pendingAmount: challans.filter(c => c.status === 'generated' || c.status === 'paid_at_bank').reduce((sum, c) => sum + c.amount, 0),
    }
  }, [challans])

  const handleCreate = useCallback(async (input: CreateChallanInput) => {
    try {
      const result = await createChallan(input)
      refresh()
      return result
    } catch (e) {
      console.error('[useChallanData] Create failed:', e)
      return null
    }
  }, [refresh])

  const handleBulkCreate = useCallback(async (inputs: CreateChallanInput[]) => {
    try {
      const result = await createBulkChallans(inputs)
      refresh()
      return result
    } catch (e) {
      console.error('[useChallanData] Bulk create failed:', e)
      return { created: 0, failed: inputs.length, errors: [String(e)] }
    }
  }, [refresh])

  const handleVerify = useCallback(async (id: string, bankRef: string, remarks?: string) => {
    try {
      const success = await verifyChallan(id, bankRef, remarks)
      if (success) refresh()
      return success
    } catch (e) {
      console.error('[useChallanData] Verify failed:', e)
      return false
    }
  }, [refresh])

  const handleMarkPaid = useCallback(async (id: string, stampUrl?: string) => {
    try {
      const success = await markChallanPaidAtBank(id, stampUrl)
      if (success) refresh()
      return success
    } catch (e) {
      console.error('[useChallanData] Mark paid failed:', e)
      return false
    }
  }, [refresh])

  const handleReject = useCallback(async (id: string, reason: string) => {
    try {
      const success = await rejectChallan(id, reason)
      if (success) refresh()
      return success
    } catch (e) {
      console.error('[useChallanData] Reject failed:', e)
      return false
    }
  }, [refresh])

  return {
    loading,
    challans,
    error,
    filters,
    summary,
    updateFilters,
    refresh,
    createChallan: handleCreate,
    createBulkChallans: handleBulkCreate,
    verifyChallan: handleVerify,
    markPaidAtBank: handleMarkPaid,
    rejectChallan: handleReject,
  }
}
