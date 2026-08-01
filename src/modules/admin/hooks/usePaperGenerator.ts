// src/hooks/usePaperGenerator.ts
// ─── Paper Generator Hook ───────────────────────────────

import { useState, useCallback } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  generatePaper,
  fetchPapers,
  getPaperById,
  updatePaper,
  publishPaper,
  archivePaper,
  deletePaper,
  duplicatePaper,
  createPaper,
} from '../../../modules/admin/api/paperApi'
import type {
  Paper,
  PaperConfig,
  GenerationConfig,
  GeneratedPaperResult,
} from '../../admin/types/questionBank'

export function usePaperGenerator() {
  const { user } = useAuth()
  const collegeId = user?.collegeId

  const [papers, setPapers] = useState<Paper[]>([])
  const [currentPaper, setCurrentPaper] = useState<Paper | null>(null)
  const [generatedResult, setGeneratedResult] = useState<GeneratedPaperResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // ─── Generate Paper (The Agent) ───────────────────────
  const generate = useCallback(async (config: GenerationConfig): Promise<GeneratedPaperResult & { paper: Paper }> => {
    if (!collegeId) throw new Error('Not authenticated')

    setGenerating(true)
    setError(null)

    try {
      const result = await generatePaper(
        collegeId,
        config as any,
        user?.id || '',
        user?.name || user?.email || 'Unknown'
      )
      setGeneratedResult(result)
      setCurrentPaper(result.paper)
      setPapers(prev => [result.paper, ...prev])
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Paper generation failed'
      setError(msg)
      throw err
    } finally {
      setGenerating(false)
    }
  }, [collegeId, user])

  // ─── Create Manual Paper ──────────────────────────────
  const createManualPaper = useCallback(async (
    config: PaperConfig,
    questionIds: string[]
  ): Promise<Paper> => {
    if (!collegeId) throw new Error('Not authenticated')

    setLoading(true)
    setError(null)

    try {
      const paper = await createPaper(
        collegeId,
        config,
        questionIds,
        user?.id || '',
        user?.name || user?.email || 'Unknown',
        false
      )
      setCurrentPaper(paper)
      setPapers(prev => [paper, ...prev])
      return paper
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create paper'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [collegeId, user])

  // ─── Fetch Papers ─────────────────────────────────────
  const loadPapers = useCallback(async (filters?: Parameters<typeof fetchPapers>[1]) => {
    if (!collegeId) {
      setPapers([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetchPapers(collegeId, filters)
      setPapers(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load papers')
    } finally {
      setLoading(false)
    }
  }, [collegeId])

  // ─── Get Single Paper ─────────────────────────────────
  const getPaper = useCallback(async (paperId: string): Promise<Paper | null> => {
    setLoading(true)
    try {
      const paper = await getPaperById(paperId)
      if (paper) setCurrentPaper(paper)
      return paper
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load paper')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Update ───────────────────────────────────────────
  const update = useCallback(async (paperId: string, updates: Partial<Paper>) => {
    await updatePaper(paperId, updates)
    setPapers(prev =>
      prev.map(p => (p.id === paperId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    )
    if (currentPaper?.id === paperId) {
      setCurrentPaper(prev => (prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null))
    }
  }, [currentPaper])

  // ─── Publish ──────────────────────────────────────────
  const publish = useCallback(async (paperId: string) => {
    await publishPaper(paperId)
    setPapers(prev =>
      prev.map(p => (p.id === paperId ? { ...p, status: 'published' as const, updatedAt: new Date().toISOString() } : p))
    )
    if (currentPaper?.id === paperId) {
      setCurrentPaper(prev => (prev ? { ...prev, status: 'published', updatedAt: new Date().toISOString() } : null))
    }
  }, [currentPaper])

  // ─── Archive ──────────────────────────────────────────
  const archive = useCallback(async (paperId: string) => {
    await archivePaper(paperId)
    setPapers(prev =>
      prev.map(p => (p.id === paperId ? { ...p, status: 'archived' as const, updatedAt: new Date().toISOString() } : p))
    )
    if (currentPaper?.id === paperId) {
      setCurrentPaper(prev => (prev ? { ...prev, status: 'archived', updatedAt: new Date().toISOString() } : null))
    }
  }, [currentPaper])

  // ─── Delete ───────────────────────────────────────────
  const remove = useCallback(async (paperId: string) => {
    await deletePaper(paperId)
    setPapers(prev => prev.filter(p => p.id !== paperId))
    if (currentPaper?.id === paperId) setCurrentPaper(null)
  }, [currentPaper])

  // ─── Duplicate ────────────────────────────────────────
  const duplicate = useCallback(async (paperId: string, newTitle?: string) => {
    if (!collegeId) throw new Error('Not authenticated')
    const copy = await duplicatePaper(paperId, collegeId, user?.id || '', user?.name || user?.email || 'Unknown', newTitle)
    setPapers(prev => [copy, ...prev])
    return copy
  }, [collegeId, user])

  // ─── Clear Generated Result ───────────────────────────
  const clearGenerated = useCallback(() => {
    setGeneratedResult(null)
  }, [])

  return {
    papers,
    currentPaper,
    generatedResult,
    loading,
    generating,
    error,
    generate,
    createManualPaper,
    loadPapers,
    getPaper,
    update,
    publish,
    archive,
    remove,
    duplicate,
    clearGenerated,
  }
}