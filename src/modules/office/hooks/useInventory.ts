import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DEFAULT_INVENTORY_SETTINGS } from '../utils/inventoryEngine'
import { fetchAssets, fetchInventorySettings, fetchItems } from '../api/inventoryApi'
import { useCollegeId } from './useLibrary'

export const inventoryKeys = {
  all: (cid: string) => ['inventory', cid] as const,
  settings: (cid: string) => ['inventory', cid, 'settings'] as const,
  assets: (cid: string) => ['inventory', cid, 'assets'] as const,
  items: (cid: string) => ['inventory', cid, 'items'] as const,
}

export function useInventorySettings() {
  const cid = useCollegeId()
  const q = useQuery({ queryKey: inventoryKeys.settings(cid), queryFn: () => fetchInventorySettings(cid), enabled: !!cid, staleTime: 5 * 60 * 1000 })
  return { settings: q.data ?? DEFAULT_INVENTORY_SETTINGS, loading: q.isLoading }
}

export function useAssets(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: inventoryKeys.assets(cid), queryFn: fetchAssets, enabled: enabled && !!cid, staleTime: 60 * 1000 })
}

export function useItems(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: inventoryKeys.items(cid), queryFn: fetchItems, enabled: enabled && !!cid, staleTime: 60 * 1000 })
}

export function useInventoryRefresh() {
  const qc = useQueryClient()
  const cid = useCollegeId()
  return () => qc.invalidateQueries({ queryKey: inventoryKeys.all(cid) })
}
