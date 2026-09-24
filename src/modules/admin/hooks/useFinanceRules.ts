// src/modules/admin/hooks/useFinanceRules.ts
//
// Loads/saves the college's finance configuration (discount rules, late-fine
// policy, payment terms). Backed by colleges/{id}/config/finance.

import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_FINANCE_RULES,
  fetchFinanceRules,
  saveFinanceRules,
  type FinanceRulesDoc,
} from '../api/financeApi'

export function useFinanceRules() {
  const [rules, setRules] = useState<FinanceRulesDoc>(DEFAULT_FINANCE_RULES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRules(await fetchFinanceRules())
    } catch (error) {
      console.error('[useFinanceRules] Failed to load finance rules:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(async (next: FinanceRulesDoc) => {
    setSaving(true)
    try {
      await saveFinanceRules(next)
      setRules(next)
    } finally {
      setSaving(false)
    }
  }, [])

  return { rules, loading, saving, save, reload: load }
}
