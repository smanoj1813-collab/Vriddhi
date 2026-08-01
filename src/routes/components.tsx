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

// ── Student route guard ───────────────────────────────────────────────
export function StudentRoute({ children }: { children: React.ReactNode }) {
  const studentToken = localStorage.getItem('studentToken')
  const studentRole = localStorage.getItem('studentRole')
  if (!studentToken || studentRole !== 'student') return <Navigate to="/student/login" replace />
  return <>{children}</>
}