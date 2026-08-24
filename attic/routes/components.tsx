import React, { Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../modules/auth/context/AuthContext'

// ── Loading fallback ──────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
  </div>
)

// ── Role-based route guard ────────────────────────────────────────────
export function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}

