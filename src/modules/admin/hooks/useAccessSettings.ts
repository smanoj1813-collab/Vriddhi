import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { DEFAULT_ACCESS_SETTINGS, type AccessSettings } from '@/modules/auth/permissions'
// Imported inside the query function for the same reason as useCollegeBranding:
// Layout.tsx calls this hook and is imported statically by every route table, so
// a static import dragged the Firestore SDK onto the login screen's preload.
const loadFetchAccessSettings = () =>
  import('../api/accessApi').then((m) => m.fetchAccessSettings)

/**
 * Legacy access document loader. `payrollRoles` is retained for compatibility
 * but no longer controls the accounts/principal payroll workflow. Never throws.
 */
export function useAccessSettings(): { access: AccessSettings; loading: boolean } {
  const { user } = useAuth()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''
  const needs = user?.role === 'accounts' || user?.role === 'principal' || user?.role === 'superadmin'
  const q = useQuery({
    queryKey: ['accessSettings', collegeId],
    queryFn: async () =>
      (await loadFetchAccessSettings())(collegeId).catch(() => DEFAULT_ACCESS_SETTINGS),
    enabled: needs && !!collegeId,
    staleTime: 5 * 60 * 1000,
  })
  return { access: q.data ?? DEFAULT_ACCESS_SETTINGS, loading: needs && !!collegeId && q.isLoading }
}
