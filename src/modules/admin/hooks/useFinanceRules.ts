// src/modules/admin/hooks/useFinanceRules.ts
//
// Loads/saves the college's finance configuration (discount rules, late-fine
// policy, payment terms, payment modes, guest billing and payroll settings —
// colleges/{id}/config/finance) plus the letterhead / receipt branding
// (colleges/{id}/config/branding).

import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_BRANDING,
  DEFAULT_FINANCE_RULES,
  fetchBranding,
  fetchFinanceRules,
  saveBranding,
  saveFinanceRules,
  type BrandingSettings,
  type FinanceRulesDoc,
} from '../api/financeApi'

export function useFinanceRules() {
  const [rules, setRules] = useState<FinanceRulesDoc>(DEFAULT_FINANCE_RULES)
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, b] = await Promise.all([
        fetchFinanceRules().catch((error) => {
          console.error('[useFinanceRules] Failed to load finance rules:', error)
          return DEFAULT_FINANCE_RULES
        }),
        fetchBranding().catch((error) => {
          console.error('[useFinanceRules] Failed to load branding:', error)
          return DEFAULT_BRANDING
        }),
      ])
      setRules(r)
      setBranding(b)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(async (next: FinanceRulesDoc, nextBranding?: BrandingSettings) => {
    setSaving(true)
    try {
      await saveFinanceRules(next)
      setRules(next)
      if (nextBranding) {
        await saveBranding(nextBranding)
        setBranding(nextBranding)
      }
    } finally {
      setSaving(false)
    }
  }, [])

  return { rules, branding, loading, saving, save, reload: load }
}

/**
 * Read-only letterhead for pages that render documents (student receipts,
 * faculty payslips). Never throws — falls back to defaults.
 */
export function useCollegeBranding(collegeId?: string | null) {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING)
  useEffect(() => {
    let active = true
    fetchBranding(collegeId)
      .then(b => { if (active) setBranding(b) })
      .catch(() => { /* defaults */ })
    return () => { active = false }
  }, [collegeId])
  return branding
}
