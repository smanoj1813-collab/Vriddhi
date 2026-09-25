import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DEFAULT_PROCUREMENT_SETTINGS } from '../utils/procurementEngine'
import { fetchGoodsReceipts, fetchProcurementSettings, fetchPurchaseOrders, fetchPurchaseRequests, fetchVendorBills, fetchVendors } from '../api/procurementApi'
import { useCollegeId } from './useLibrary'

export const procurementKeys = {
  all: (cid: string) => ['procurement', cid] as const,
  settings: (cid: string) => ['procurement', cid, 'settings'] as const,
  vendors: (cid: string) => ['procurement', cid, 'vendors'] as const,
  prs: (cid: string) => ['procurement', cid, 'prs'] as const,
  pos: (cid: string) => ['procurement', cid, 'pos'] as const,
  grns: (cid: string) => ['procurement', cid, 'grns'] as const,
  bills: (cid: string) => ['procurement', cid, 'bills'] as const,
}

export function useProcurementSettings() {
  const cid = useCollegeId()
  const q = useQuery({ queryKey: procurementKeys.settings(cid), queryFn: () => fetchProcurementSettings(cid), enabled: !!cid, staleTime: 5 * 60 * 1000 })
  return { settings: q.data ?? DEFAULT_PROCUREMENT_SETTINGS, loading: q.isLoading }
}

export function useVendors(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: procurementKeys.vendors(cid), queryFn: () => fetchVendors(cid), enabled: enabled && !!cid, staleTime: 60 * 1000 })
}
export function usePurchaseRequests(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: procurementKeys.prs(cid), queryFn: () => fetchPurchaseRequests(cid), enabled: enabled && !!cid, staleTime: 30 * 1000 })
}
export function usePurchaseOrders(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: procurementKeys.pos(cid), queryFn: () => fetchPurchaseOrders(cid), enabled: enabled && !!cid, staleTime: 30 * 1000 })
}
export function useGoodsReceipts(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: procurementKeys.grns(cid), queryFn: () => fetchGoodsReceipts(cid), enabled: enabled && !!cid, staleTime: 30 * 1000 })
}
export function useVendorBills(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: procurementKeys.bills(cid), queryFn: () => fetchVendorBills(cid), enabled: enabled && !!cid, staleTime: 30 * 1000 })
}

export function useProcurementRefresh() {
  const qc = useQueryClient()
  const cid = useCollegeId()
  return () => qc.invalidateQueries({ queryKey: procurementKeys.all(cid) })
}
