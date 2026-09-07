// src/modules/auth/roleRoutes.ts
// Single source of truth for "where does this role land after sign-in?".
//
// This map used to be duplicated in Login.tsx and routes/index.tsx with
// different contents (HOD went to /faculty/dashboard in one and
// /admin/hod-dashboard in the other; `parent` existed in one only). Two maps
// means the landing page depends on which component handled the navigation, so
// the same account can be redirected to different dashboards — and an unmapped
// role simply never navigates, which reads as "login did nothing".

import type { UserRole } from './context/auth'

/** Landing route per role. Every role in VALID_ROLES must appear here. */
export const ROLE_DASHBOARD: Record<UserRole, string> = {
  superadmin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  // A principal is not a faculty member: it uses the college-admin surface,
  // which is the only place its cross-department view exists.
  principal: '/admin/dashboard',
  hod: '/admin/hod-dashboard',
  faculty: '/faculty/dashboard',
  mentor: '/faculty/dashboard',
  student: '/student/dashboard',
  // No parent portal is built yet. The student shell is a safe, read-only
  // landing that explains why there is no data, rather than /unauthorized.
  parent: '/student/dashboard',
}

/**
 * Resolve the landing route. Unknown or missing roles fall back to the staff
 * login so a user is never dropped on a blank page.
 */
export function dashboardPathFor(role: string | null | undefined): string {
  if (role && role in ROLE_DASHBOARD) return ROLE_DASHBOARD[role as UserRole]
  return '/login'
}

/**
 * Which portal a role belongs to — used by the two login screens to warn when a
 * person used the wrong door, instead of failing with a generic error.
 */
export function portalForRole(role: string | null | undefined): 'student' | 'staff' {
  return role === 'student' || role === 'parent' ? 'student' : 'staff'
}
