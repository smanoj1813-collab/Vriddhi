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
  CollectPaymentOptions,
  CollectPaymentResult,
  SubmitProofInput,
  PaymentSubmissionStatus,
} from '../api/feeApi'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  classifyOfficeLinkageFailure,
  describeErrorDetail,
  describeOfficeLinkageFailure,
} from '../utils/officeLinkage'
import { isPermissionDeniedError } from '../../../shared/utils/identityClaims'
import { currentTokenClaims, ensureIdentityClaims } from '../../../shared/services/identitySelfHeal'
import {
  calculateSummary,
  applyDiscount,
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
  submitPaymentProof,
  verifyPaymentProof,
  waiveFee,
  type ApplyDiscountInput,
  type CollectPaymentOptions,
  type CreateFeePaymentInput,
  type FeeFilters,
  type FeePayment,
  type FeeStudent,
  type FeeStructure,
  type FeeSummary,
  type PaymentMode,
  type SubmitProofInput,
} from '../api/feeApi'

/**
 * A refusal that knows WHICH read was refused.
 *
 * `isPermissionDeniedError` reads `code` and `message`, both of which this
 * preserves, so the existing classifier and the self-heal behave exactly as
 * before — but the message a human reads now names the collection instead of
 * describing three reads that happen to live in one `Promise.all`.
 */
class LabelledReadError extends Error {
  readonly code: string;
  readonly details: string[];

  constructor(details: string[]) {
    super(
      `The ${details.length === 1 ? 'read' : 'reads'} failed: ${details.join('; ')}`
    );
    this.name = 'LabelledReadError';
    this.code = 'permission-denied';
    this.details = details;
  }
}

export function useFeeData(studentId?: string) {
  const { user } = useAuth()
  // The finance desk is the ONE surface whose tenant used to come from
  // localStorage alone. The signed-in identity is the verified value the
  // rules compare against, so it is what the queries are scoped by; the
  // localStorage copy stays as the fallback for callers that have no session
  // context (the student portal resolves its own college explicitly).
  const identityCollegeId = user?.collegeId || ''
  const [loading, setLoading] = useState(true)
  /**
   * WHY THIS EXISTS: every load error used to be `console.error`-ed and
   * dropped, so a permission denial — an account whose collegeId claim was
   * never issued, or deployed rules older than the office roles — rendered as
   * an empty college, and the Record Payment modal told the accounts team
   * "No students found for this college." The desk then went to audit student
   * imports instead of the account. An unread college and a college with
   * nothing in it are different facts and must look different.
   */
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FeeFilters>({
    course: 'all', batch: 'all', status: 'all', category: 'all', search: '', dateFrom: '', dateTo: '',
  })
  const [allPayments, setAllPayments] = useState<FeePayment[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [students, setStudents] = useState<FeeStudent[]>([])
  const loadedRef = useRef(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /**
   * The fee ledger is authorised from the ID-token CLAIM (`isFinance(cid)`
   * compares `collegeId() == cid`), so an accounts account whose collegeId
   * claim was never issued reads nothing at all — while its profile document
   * still supplies the college name the header shows. The repair already
   * exists in the app (`ensureIdentityClaims` → `syncMyIdentity`); the faculty
   * pages call it on demand and this hook did not, so the desk's only remedy
   * was a manual sign-out. One attempt per mount, then one retry — the retry
   * cannot double-count anything, it only re-reads.
   */
  const healAttempted = useRef(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Each read is labelled and settled independently. `Promise.all` would
      // report only the FIRST rejection and drop the other two, so a desk that
      // reads payments + structures + students could not tell the accounts team
      // WHICH query the rules refused — and the copy had to guess. The label
      // travels into the error message, so the answer is on screen.
      const [payments, structures, students] = await Promise.allSettled([
        fetchFeePayments({
          course: filters.course,
          batch: filters.batch,
          status: filters.status,
          category: filters.category,
          search: filters.search,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          ...(studentId ? { studentId } : {}),
        }, identityCollegeId),
        fetchFeeStructures(identityCollegeId),
        studentId ? Promise.resolve([] as FeeStudent[]) : fetchFeeStudents(identityCollegeId),
      ])

      const failed = [
        { label: 'fee payments', result: payments },
        { label: 'fee structures', result: structures },
        { label: 'the student list', result: students },
      ].filter((entry) => entry.result.status === 'rejected') as Array<{
        label: string
        result: PromiseRejectedResult
      }>

      if (failed.length > 0) {
        // Report EVERY refused read, not just the first: one fault is common,
        // but two of them are two different rules and two different fixes.
        //
        // The scope matters as much as the label. The top-level `students`
        // list is authorised per document against the CLAIM, while the query
        // is pinned to the profile's collegeId — so if those two ever
        // disagree, the query matches documents the rules then refuse, and
        // the denial is indistinguishable from a broken account. Printing all
        // three ends makes that difference visible instead of a guess.
        const tokenClaim = await currentTokenClaims()
        const scope = [
          `query scope: ${identityCollegeId || '(empty)'}`,
          `token claim: ${tokenClaim?.collegeId ?? '(none)'}`,
          `profile: ${user?.collegeId || '(none)'}`,
        ].join(', ')
        throw new LabelledReadError(
          failed.map(
            (entry) =>
              `${entry.label} — ${describeErrorDetail(entry.result.reason, { withCode: false })} (${scope})`
          )
        )
      }

      setAllPayments((payments as PromiseFulfilledResult<FeePayment[]>).value)
      setFeeStructures((structures as PromiseFulfilledResult<FeeStructure[]>).value)
      setStudents((students as PromiseFulfilledResult<FeeStudent[]>).value)
      loadedRef.current = true
    } catch (err) {
      console.error('[useFeeData] Failed to load fee ledger:', err)
      if (isPermissionDeniedError(err) && user && !healAttempted.current) {
        healAttempted.current = true
        try {
          const outcome = await ensureIdentityClaims({
            role: user.role,
            collegeId: user.collegeId ?? null,
          })
          if (outcome === 'refreshed') {
            // The token now carries the college the rules check; read again.
            // Awaited (not returned) so this frame's `finally` cannot clear
            // `loading` while the retry is still in flight.
            await fetchData()
            return
          }
          console.warn('[useFeeData] claim refresh did not repair the read:', outcome)
        } catch (healErr) {
          console.warn('[useFeeData] claim refresh failed:', healErr)
        }
      }
      // Reaching here on a permission denial means the self-heal ran (or was
      // already spent) and the read is STILL refused — so the message must say
      // so, instead of sending the reader round the sign-out loop a second time.
      const healRan = isPermissionDeniedError(err) && !!user
      // Keep the last good data on screen and say WHY it may be missing,
      // rather than replacing a working desk with an empty one.
      setError(
        describeOfficeLinkageFailure(
          classifyOfficeLinkageFailure({
            code: (err as { code?: unknown })?.code,
            message: err instanceof Error ? err.message : String(err),
            collegeId: identityCollegeId,
          }),
          { desk: 'fee ledger', detail: err, healAttempted: healRan }
        )
      )
    } finally {
      setLoading(false)
    }
  }, [filters.batch, filters.category, filters.course, filters.dateFrom, filters.dateTo, filters.search, filters.status, studentId, identityCollegeId, user])

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

  const handleCollectPayment = useCallback(async (paymentId: string, amount: number, mode: PaymentMode, remarks?: string, options?: CollectPaymentOptions) => {
    try {
      const result = await collectPayment(paymentId, amount, mode, remarks, options)
      refreshData()
      return result
    } catch (error) {
      console.error('[useFeeData] Payment collection failed:', error)
      throw error
    }
  }, [refreshData])

  const handleSubmitProof = useCallback(async (paymentId: string, input: SubmitProofInput) => {
    try {
      const success = await submitPaymentProof(paymentId, input)
      if (success) refreshData()
      return success
    } catch (error) {
      console.error('[useFeeData] Proof submission failed:', error)
      throw error
    }
  }, [refreshData])

  const handleVerifyProof = useCallback(async (paymentId: string, transactionId: string, decision: 'approve' | 'reject', reason?: string) => {
    try {
      const success = await verifyPaymentProof(paymentId, transactionId, decision, reason)
      if (success) refreshData()
      return success
    } catch (error) {
      console.error('[useFeeData] Proof verification failed:', error)
      throw error
    }
  }, [refreshData])

  const handleApplyDiscount = useCallback(async (paymentId: string, input: ApplyDiscountInput) => {
    try {
      const success = await applyDiscount(paymentId, input)
      if (success) refreshData()
      return success
    } catch (error) {
      console.error('[useFeeData] Discount application failed:', error)
      throw error
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
    /**
     * Non-null when the ledger could not be READ. Exposed as `loadError`
     * because these pages also own a per-action `error` (modal/form), and two
     * unrelated `error` names in one destructure is how a real failure gets
     * rendered by the wrong banner.
     */
    loadError: error,
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
    submitPaymentProof: handleSubmitProof,
    verifyPaymentProof: handleVerifyProof,
    applyDiscount: handleApplyDiscount,
    waiveFee: handleWaiveFee,
    createFeePayment: handleCreateFeePayment,
    createFeeStructure: handleCreateFeeStructure,
  }
}
