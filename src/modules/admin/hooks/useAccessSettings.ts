import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { DEFAULT_ACCESS_SETTINGS, type AccessSettings } from '@/modules/auth/permissions'
import { fetchAccessSettings } from '../api/accessApi'

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
    queryFn: () => fetchAccessSettings(collegeId).catch(() => DEFAULT_ACCESS_SETTINGS),
    enabled: needs && !!collegeId,
    staleTime: 5 * 60 * 1000,
  })
  return { access: q.data ?? DEFAULT_ACCESS_SETTINGS, loading: needs && !!collegeId && q.isLoading }
}
