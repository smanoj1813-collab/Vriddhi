import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { DEFAULT_LIBRARY_SETTINGS } from '../utils/libraryEngine'
import { DEFAULT_BRANDING, fetchBranding } from '@/modules/admin/api/financeApi'
import {
  fetchActiveLoans,
  fetchCopies,
  fetchFines,
  fetchLibraryMembers,
  fetchLibrarySettings,
  fetchOpenReservations,
  fetchTitles,
} from '../api/libraryApi'

export function useCollegeId(): string {
  const { user } = useAuth()
  return user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''
}

export const libraryKeys = {
  all: (cid: string) => ['library', cid] as const,
  settings: (cid: string) => ['library', cid, 'settings'] as const,
  titles: (cid: string) => ['library', cid, 'titles'] as const,
  copies: (cid: string) => ['library', cid, 'copies'] as const,
  members: (cid: string) => ['library', cid, 'members'] as const,
  loans: (cid: string) => ['library', cid, 'loans'] as const,
  reservations: (cid: string) => ['library', cid, 'reservations'] as const,
  fines: (cid: string, status: string) => ['library', cid, 'fines', status] as const,
}

export function useLibrarySettings() {
  const cid = useCollegeId()
  const q = useQuery({
    queryKey: libraryKeys.settings(cid),
    queryFn: () => fetchLibrarySettings(cid),
    enabled: !!cid,
    staleTime: 5 * 60 * 1000,
  })
  return { settings: q.data ?? DEFAULT_LIBRARY_SETTINGS, loading: q.isLoading, error: q.error, refetch: q.refetch }
}

export function useLibraryTitles(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: libraryKeys.titles(cid), queryFn: () => fetchTitles(cid), enabled: enabled && !!cid, staleTime: 60 * 1000 })
}

export function useLibraryCopies(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: libraryKeys.copies(cid), queryFn: () => fetchCopies(), enabled: enabled && !!cid, staleTime: 60 * 1000 })
}

export function useLibraryMembers(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: libraryKeys.members(cid), queryFn: fetchLibraryMembers, enabled: enabled && !!cid, staleTime: 10 * 60 * 1000 })
}

export function useActiveLoans(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: libraryKeys.loans(cid), queryFn: fetchActiveLoans, enabled: enabled && !!cid, staleTime: 30 * 1000 })
}

export function useOpenReservations(enabled = true) {
  const cid = useCollegeId()
  return useQuery({ queryKey: libraryKeys.reservations(cid), queryFn: fetchOpenReservations, enabled: enabled && !!cid, staleTime: 30 * 1000 })
}

export function useLibraryFines(status: 'open' | 'all' = 'open', enabled = true) {
  const cid = useCollegeId()
  return useQuery({
    queryKey: libraryKeys.fines(cid, status),
    queryFn: () => fetchFines(status === 'all' ? undefined : 'open'),
    enabled: enabled && !!cid,
    staleTime: 30 * 1000,
  })
}

/** Invalidate everything library-related after a desk action. */
export function useLibraryRefresh() {
  const qc = useQueryClient()
  const cid = useCollegeId()
  return () => qc.invalidateQueries({ queryKey: libraryKeys.all(cid) })
}

/** College letterhead (config/branding) for labels, receipts and reports. */
export function useBranding() {
  const cid = useCollegeId()
  const q = useQuery({
    queryKey: ['branding', cid],
    queryFn: () => fetchBranding(cid).catch(() => DEFAULT_BRANDING),
    enabled: !!cid,
    staleTime: 10 * 60 * 1000,
  })
  return q.data ?? DEFAULT_BRANDING
}
