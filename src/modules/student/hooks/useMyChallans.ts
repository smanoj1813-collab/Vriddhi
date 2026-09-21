// Student-scoped challan feed for "My Challans".
//
// Why not reuse the admin hook? `useChallanData` is written for the finance
// desk: it reads the whole college collection, resolves the tenant from a
// localStorage key the admin module owns, and swallows failures into
// console.error. A student whose read was denied by the rules therefore saw a
// confident "No challans yet" — the one response that was never true. This hook
// queries only the rows addressed to the signed-in student (which is also what
// the Firestore rule requires: an unbounded LIST is refused per document) and
// surfaces the failure as text the student can act on.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchChallans, type Challan, type ChallanStatus } from '@/modules/admin/api/feeApi'
import { useStudentData } from './useStudentData'

export interface MyChallansSummary {
  total: number
  toPay: number
  verifying: number
  verified: number
  rejected: number
  totalAmount: number
  amountDue: number
  overdue: number
}

/** `dueDate` is stored as YYYY-MM-DD; compare on the date, not the timestamp. */
function isOverdue(challan: Challan): boolean {
  if (challan.status === 'verified' || challan.status === 'expired') return false
  const due = new Date(`${challan.dueDate}T23:59:59`)
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now()
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/permission-denied|Missing or insufficient permissions/i.test(message)) {
    return 'Your college has not enabled challan reads for students yet (Firestore rules need to be deployed). Your challans are not lost — ask the finance office to publish the updated rules.'
  }
  if (/unavailable|offline|network|Failed to fetch|deadline/i.test(message)) {
    return 'Could not reach Firestore. Check your connection and pull to refresh — challans are only readable online.'
  }
  return message || 'Challans could not be loaded.'
}

export function useMyChallans() {
  const { studentId, collegeId, profile, loading: profileLoading } = useStudentData()
  const [challans, setChallans] = useState<Challan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ChallanStatus | 'all' | 'overdue'>('all')

  const load = useCallback(async () => {
    if (profileLoading) return
    if (!studentId) {
      // Without a resolved student record there is nothing to scope the query
      // to, and an unscoped query is denied by the rules — say so instead of
      // firing a request that is guaranteed to fail.
      setChallans([])
      setError('Your student profile is still loading, or is not linked to this login. Refresh once your profile is linked.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchChallans({ studentId, collegeId })
      // Newest generation first; `createdAt` is a server timestamp mapped to ISO.
      setChallans(rows)
    } catch (err) {
      setChallans([])
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }, [studentId, collegeId, profileLoading])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    if (statusFilter === 'all') return challans
    if (statusFilter === 'overdue') return challans.filter(isOverdue)
    return challans.filter((challan) => challan.status === statusFilter)
  }, [challans, statusFilter])

  const summary = useMemo<MyChallansSummary>(() => {
    const byStatus = (status: ChallanStatus) => challans.filter((c) => c.status === status)
    const payable = challans.filter((c) => c.status === 'generated' || c.status === 'rejected')
    return {
      total: challans.length,
      toPay: byStatus('generated').length,
      verifying: byStatus('paid_at_bank').length,
      verified: byStatus('verified').length,
      rejected: byStatus('rejected').length,
      totalAmount: challans.reduce((sum, c) => sum + c.amount, 0),
      amountDue: payable.reduce((sum, c) => sum + c.amount, 0),
      overdue: payable.filter(isOverdue).length,
    }
  }, [challans])

  return {
    loading,
    error,
    challans: visible,
    allChallans: challans,
    summary,
    statusFilter,
    setStatusFilter,
    refresh: load,
    isOverdue,
    student: profile ? { name: profile.name, regNo: profile.regNo, course: profile.course, batch: profile.batch } : null,
  }
}
