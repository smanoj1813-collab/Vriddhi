// Route gate for the shared /admin shell. The parent RoleRoute admits every
// staff role that uses this shell (department heads, principal, office
// roles); this gate then decides page by page from the permission matrix, so
// e.g. an HOD deep-linking /admin/fee-management or the accounts team opening
// /admin/attendance lands on their own desk instead.
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { canAccessAdminPath } from '@/modules/auth/permissions'
import { dashboardPathFor } from '@/modules/auth/roleRoutes'
import { useAccessSettings } from '../hooks/useAccessSettings'

export function AdminPathGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { access, loading } = useAccessSettings()

  if (!user) return <>{children}</>
  if (canAccessAdminPath(user.role, pathname, access)) return <>{children}</>
  // Payroll visibility depends on the college setting: wait for it.
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-slate-500">Loading…</div>
  }
  const home = dashboardPathFor(user.role)
  if (home !== pathname && home.startsWith('/admin') && canAccessAdminPath(user.role, home, access)) {
    return <Navigate to={home} replace />
  }
  if (!home.startsWith('/admin')) return <Navigate to={home} replace />
  return <Navigate to="/unauthorized" replace />
}
