// src/hooks/useAIAgent.ts
// ─── AI Agent Hook ──────────────────────────────────────

import { useState, useCallback } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  getAggregatedAttendance,
  getAggregatedPerformance,
  getAggregatedFees,
  getAggregatedFaculty,
  getCollegeSnapshot,
  generateInsights,
  processAIQuery,
  type AggregatedAttendance,
  type AggregatedPerformance,
  type AggregatedFees,
  type AggregatedFaculty,
  type CollegeSnapshot,
  type AIInsight,
  type AIQueryResult,
} from '../api/aiAgentApi'

export interface AIAgentState {
  loading: boolean
  error: string | null
  attendance: AggregatedAttendance | null
  performance: AggregatedPerformance | null
  fees: AggregatedFees | null
  faculty: AggregatedFaculty | null
  snapshot: CollegeSnapshot | null
  insights: AIInsight[]
  queryResult: AIQueryResult | null
}

export function useAIAgent() {
  const { user } = useAuth()
  const collegeId = user?.collegeId

  const [state, setState] = useState<AIAgentState>({
    loading: false,
    error: null,
    attendance: null,
    performance: null,
    fees: null,
    faculty: null,
    snapshot: null,
    insights: [],
    queryResult: null,
  })

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading, error: null }))
  }, [])

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, loading: false, error }))
  }, [])

  const fetchAttendance = useCallback(async () => {
    if (!collegeId) return
    setLoading(true)
    try {
      const data = await getAggregatedAttendance(collegeId)
      setState((prev) => ({ ...prev, attendance: data, loading: false }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance')
    }
  }, [collegeId, setLoading, setError])

  const fetchPerformance = useCallback(async () => {
    if (!collegeId) return
    setLoading(true)
    try {
      const data = await getAggregatedPerformance(collegeId)
      setState((prev) => ({ ...prev, performance: data, loading: false }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance')
    }
  }, [collegeId, setLoading, setError])

  const fetchFees = useCallback(async () => {
    if (!collegeId) return
    setLoading(true)
    try {
      const data = await getAggregatedFees(collegeId)
      setState((prev) => ({ ...prev, fees: data, loading: false }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fees')
    }
  }, [collegeId, setLoading, setError])

  const fetchFaculty = useCallback(async () => {
    if (!collegeId) return
    setLoading(true)
    try {
      const data = await getAggregatedFaculty(collegeId)
      setState((prev) => ({ ...prev, faculty: data, loading: false }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch faculty')
    }
  }, [collegeId, setLoading, setError])

  const fetchSnapshot = useCallback(async () => {
    if (!collegeId) return
    setLoading(true)
    try {
      const data = await getCollegeSnapshot(collegeId)
      setState((prev) => ({ ...prev, snapshot: data, loading: false }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch snapshot')
    }
  }, [collegeId, setLoading, setError])

  const fetchInsights = useCallback(async () => {
    if (!collegeId) return
    setLoading(true)
    try {
      const data = await generateInsights(collegeId)
      setState((prev) => ({ ...prev, insights: data, loading: false }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
    }
  }, [collegeId, setLoading, setError])

  const askQuery = useCallback(async (query: string) => {
    if (!collegeId) return
    setLoading(true)
    try {
      const data = await processAIQuery(query, collegeId)
      setState((prev) => ({ ...prev, queryResult: data, loading: false }))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed')
      throw err
    }
  }, [collegeId, setLoading, setError])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    fetchAttendance,
    fetchPerformance,
    fetchFees,
    fetchFaculty,
    fetchSnapshot,
    fetchInsights,
    askQuery,
    clearError,
  }
}