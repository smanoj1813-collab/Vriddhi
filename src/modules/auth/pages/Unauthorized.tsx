// src/modules/auth/pages/Unauthorized.tsx
//
// Shown when RoleRoute denies access (a signed-in user hitting a route their
// role isn't allowed on). Previously the guard redirected to `/unauthorized`,
// which had no route/component, so the user silently bounced home. This gives a
// clear message and a one-tap path back to their own dashboard.

import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardPathFor } from '../roleRoutes';

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const home = dashboardPathFor(user?.role);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1120] p-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          You don&apos;t have access to this page
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Your role
          {user?.role ? (
            <>
              {' '}
              (<span className="font-semibold capitalize">{user.role}</span>)
            </>
          ) : null}{' '}
          isn&apos;t permitted to view this section. If you believe this is a mistake, contact your
          administrator.
        </p>
        <button
          onClick={() => navigate(home, { replace: true })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my dashboard
        </button>
      </div>
    </div>
  );
}
