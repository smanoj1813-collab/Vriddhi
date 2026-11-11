// College branding (name, logo, cover image) for any portal. Reads
// colleges/{id}/config/branding, which every member of the college may read.
import { useQuery } from '@tanstack/react-query'

// The API module is imported inside the query function, not at the top of the
// file. This hook is called by Layout.tsx, which every module's route table
// imports statically — so a static import here put Firestore (and with it
// Storage, RTDB and Functions, 183 kB gzip) on the login screen's preload list.
// The fetch only runs for a signed-in user, by which point the chunk is needed.
const loadFetchBranding = () => import('@/modules/admin/api/financeApi').then((m) => m.fetchBranding)

export const collegeBrandingKey = (collegeId: string) => ['collegeBranding', collegeId]

export function useCollegeBranding(collegeId?: string | null) {
  return useQuery({
    queryKey: collegeBrandingKey(collegeId || ''),
    queryFn: async () => (await loadFetchBranding())(collegeId),
    enabled: !!collegeId,
    staleTime: 10 * 60 * 1000,
  })
}
