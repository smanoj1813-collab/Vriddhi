// College branding (name, logo, cover image) for any portal. Reads
// colleges/{id}/config/branding, which every member of the college may read.
import { useQuery } from '@tanstack/react-query'
import { fetchBranding } from '@/modules/admin/api/financeApi'

export const collegeBrandingKey = (collegeId: string) => ['collegeBranding', collegeId]

export function useCollegeBranding(collegeId?: string | null) {
  return useQuery({
    queryKey: collegeBrandingKey(collegeId || ''),
    queryFn: () => fetchBranding(collegeId),
    enabled: !!collegeId,
    staleTime: 10 * 60 * 1000,
  })
}
