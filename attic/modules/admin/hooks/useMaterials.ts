// src/hooks/useMaterials.ts
// ─── Cost-Optimized Hook for Faculty Materials ──────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  fetchMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  incrementMaterialViews,
  incrementMaterialDownloads,
  getReadCount,
  type Material,
  type MaterialInput,
  type MaterialType,
} from '../api/materialApi'

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
export function useMaterials() {
  const { user } = useAuth()
  const collegeId = user?.collegeId
  const facultyId = user?.id
  const facultyName = user?.name || 'Faculty'

  // Search & filter states
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<MaterialType | 'all'>('all')

  // Debounced (300ms)
  const debouncedSearch = useDebounce(search, 300)

  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [readStats, setReadStats] = useState({ used: 0, remaining: 500 })
  const lastFetchRef = useRef('')

  // ─── Fetch Effect ─────────────────────────────────────
  useEffect(() => {
    if (!collegeId || !facultyId) { setMaterials([]); return }

    const filterKey = JSON.stringify({ collegeId, facultyId, search: debouncedSearch, filterType })
    if (filterKey === lastFetchRef.current) return
    lastFetchRef.current = filterKey

    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const data = await fetchMaterials(facultyId)
        if (!cancelled) {
          // Client-side filter
          let filtered = data
          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase()
            filtered = filtered.filter(m =>
              m.title.toLowerCase().includes(q) ||
              m.topic.toLowerCase().includes(q) ||
              m.subject.toLowerCase().includes(q)
            )
          }
          if (filterType !== 'all') {
            filtered = filtered.filter(m => m.type === filterType)
          }
          setMaterials(filtered)
          setReadStats({ used: getReadCount(), remaining: 500 - getReadCount() })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load materials')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [collegeId, facultyId, debouncedSearch, filterType])

  // ─── Manual Refresh ─────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!collegeId || !facultyId) return
    lastFetchRef.current = ''
    setLoading(true)
    try {
      const data = await fetchMaterials(facultyId)
      let filtered = data
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        filtered = filtered.filter(m =>
          m.title.toLowerCase().includes(q) ||
          m.topic.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q)
        )
      }
      if (filterType !== 'all') {
        filtered = filtered.filter(m => m.type === filterType)
      }
      setMaterials(filtered)
      setReadStats({ used: getReadCount(), remaining: 500 - getReadCount() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed')
    } finally { setLoading(false) }
  }, [collegeId, facultyId, debouncedSearch, filterType])

  // ─── Actions ────────────────────────────────────────────
  const addMaterial = useCallback(async (data: Omit<MaterialInput, 'facultyId' | 'facultyName'>) => {
    if (!collegeId || !facultyId) throw new Error('Not authenticated')
    const created = await createMaterial({ ...data, facultyId, facultyName })
    setMaterials(prev => [created, ...prev])
    return created
  }, [collegeId, facultyId, facultyName])

  const editMaterial = useCallback(async (id: string, data: Partial<MaterialInput>) => {
    if (!collegeId) throw new Error('Not authenticated')
    await updateMaterial(id, data)
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
  }, [collegeId])

  const removeMaterial = useCallback(async (id: string) => {
    if (!collegeId) throw new Error('Not authenticated')
    await deleteMaterial(id)
    setMaterials(prev => prev.filter(m => m.id !== id))
  }, [collegeId])

  const trackView = useCallback(async (id: string) => {
    await incrementMaterialViews(id)
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, views: m.views + 1 } : m))
  }, [])

  const trackDownload = useCallback(async (id: string) => {
    await incrementMaterialDownloads(id)
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, downloads: m.downloads + 1 } : m))
  }, [])

  // ─── Derived ────────────────────────────────────────────
  const stats = {
    total: materials.length,
    pdf: materials.filter(m => m.type === 'pdf').length,
    video: materials.filter(m => m.type === 'video').length,
    link: materials.filter(m => m.type === 'link').length,
    doc: materials.filter(m => m.type === 'doc').length,
    ppt: materials.filter(m => m.type === 'ppt').length,
  }

  return {
    materials, stats, loading, error, readStats,
    search, setSearch,
    filterType, setFilterType,
    refresh,
    addMaterial, editMaterial, removeMaterial,
    trackView, trackDownload,
  }
}