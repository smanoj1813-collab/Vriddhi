// src/modules/employee/routes.tsx
//
// The employee shell. Only the dashboard lives under /employee: the academic
// pages themselves are the shared /admin academic surface (see
// permissions.ts → ACADEMIC_ADMIN_ROLES), so there is exactly one
// implementation of scheduling, curriculum, assessments, papers and grading.
import { lazy, Suspense, Component, type ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RoleRoute } from '@/routes/components/RoleRoute'
import Layout from '@/shared/components/Layout'

const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'))

class LazyErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) {
      return (
        <div style={{ padding: 32 }}>
          <h2>This page failed to load.</h2>
          <p>Reload the page; if it persists, report it to the platform team.</p>
        </div>
      )
    }
    return this.props.children
  }
}

const LazyPage = ({ children }: { children: ReactNode }) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div style={{ padding: 32 }}>Loading…</div>}>{children}</Suspense>
  </LazyErrorBoundary>
)

export const employeeRoutes: RouteObject[] = [
  {
    path: '/employee',
    element: (
      <RoleRoute allowedRoles={['employee', 'superadmin']}>
        <Layout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <LazyPage><EmployeeDashboard /></LazyPage> },
      { path: 'dashboard', element: <LazyPage><EmployeeDashboard /></LazyPage> },
    ],
  },
]
