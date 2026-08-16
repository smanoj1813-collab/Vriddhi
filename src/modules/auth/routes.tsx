import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './guards/ProtectedRoute';
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';

export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <ProtectedRoute redirectIfAuth>
        <Login />
      </ProtectedRoute>
    ),
  },
  {
    path: '/student/login',
    element: (
      <ProtectedRoute redirectIfAuth>
        <StudentLogin />
      </ProtectedRoute>
    ),
  },
];