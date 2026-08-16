import { Suspense, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import StudentSidebar from './StudentSidebar';
import { Loader2 } from 'lucide-react';

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400" />
    </div>
  );
}

export default function StudentLayout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/student/login', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Redirecting to login…
      </div>
    );
  }

  if (user.role && user.role !== 'student') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Access denied. Student role required.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <StudentSidebar />
      <main className="flex-1 overflow-auto pb-20 md:pb-0 pt-16 md:pt-0">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}