// src/hooks/useTopics.ts
// ─── Cost-Optimized Hook for Faculty Topics ──────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  fetchTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getReadCount,
  type FacultyTopic,
  type TopicInput,
  type TopicStatus,
} from '../api/topicApi'

// ─── Debounce ─────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ─── Hook ─────────────────────────────────────────────────
export function useTopics() {
  const { user } = useAuth()
  const collegeId = user?.collegeId
  const facultyId = user?.id
  const facultyName = user?.name || 'Faculty'

  // Search & filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all')

  // Debounced (300ms)
  const debouncedSearch = useDebounce(search, 300)

  const [topics, setTopics] = useState<FacultyTopic[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [readStats, setReadStats] = useState({ used: 0, remaining: 500 })
  const lastFetchRef = useRef('')

  // ─── Fetch Effect ─────────────────────────────────────
  useEffect(() => {
    if (!collegeId || !facultyId) { setTopics([]); return }

    const filterKey = JSON.stringify({ collegeId, facultyId, search: debouncedSearch, statusFilter })
    if (filterKey === lastFetchRef.current) return
    lastFetchRef.current = filterKey

    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const data = await fetchTopics(facultyId)
        if (!cancelled) {
          // Client-side filter
          let filtered = data
          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase()
            filtered = filtered.filter(t =>
              t.title.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q) ||
              t.subject.toLowerCase().includes(q)
            )
          }
          if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter)
          }
          setTopics(filtered)
          setReadStats({ used: getReadCount(), remaining: 500 - getReadCount() })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load topics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [collegeId, facultyId, debouncedSearch, statusFilter])

  // ─── Manual Refresh ─────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!collegeId || !facultyId) return
    lastFetchRef.current = ''
    setLoading(true)
    try {
      const data = await fetchTopics(facultyId)
      let filtered = data
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        filtered = filtered.filter(t =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
        )
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === statusFilter)
      }
      setTopics(filtered)
      setReadStats({ used: getReadCount(), remaining: 500 - getReadCount() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed')
    } finally { setLoading(false) }
  }, [collegeId, facultyId, debouncedSearch, statusFilter])

  // ─── Actions ────────────────────────────────────────────
  const addTopic = useCallback(async (data: Omit<TopicInput, 'facultyId' | 'facultyName'>) => {
    if (!collegeId || !facultyId) throw new Error('Not authenticated')
    const created = await createTopic({ ...data, facultyId, facultyName })
    setTopics(prev => [...prev, created].sort((a, b) => (a.plannedDate || '').localeCompare(b.plannedDate || '')))
    return created
  }, [collegeId, facultyId, facultyName])

  const editTopic = useCallback(async (id: string, data: Partial<TopicInput>) => {
    if (!collegeId) throw new Error('Not authenticated')
    await updateTopic(id, data)
    setTopics(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
  }, [collegeId])

  const removeTopic = useCallback(async (id: string) => {
    if (!collegeId) throw new Error('Not authenticated')
    await deleteTopic(id)
    setTopics(prev => prev.filter(t => t.id !== id))
  }, [collegeId])

  // ─── Derived ────────────────────────────────────────────
  const stats = {
    total: topics.length,
    planned: topics.filter(t => t.status === 'planned').length,
    inProgress: topics.filter(t => t.status === 'in-progress').length,
    completed: topics.filter(t => t.status === 'completed').length,
    delayed: topics.filter(t => t.status === 'delayed').length,
  }

  return {
    topics, stats, loading, error, readStats,
    search, setSearch,
    statusFilter, setStatusFilter,
    refresh,
    addTopic, editTopic, removeTopic,
  }
}