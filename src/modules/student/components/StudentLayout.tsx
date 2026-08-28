import { Suspense, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import StudentSidebar from './StudentSidebar';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../../shared/contexts/LanguageProvider';

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium"><LoadingContentLabel /></p>
      </div>
    </div>
  );
}

function LoadingContentLabel() {
  const { t } = useTranslation();
  return <>{t('common.loadingContent')}</>;
}

export default function StudentLayout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/student/login', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center text-slate-500 text-sm">
        {t('auth.redirectingLogin')}
      </div>
    );
  }

  if (user.role && user.role !== 'student') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md text-center shadow-md">
          <p className="text-slate-800 dark:text-white font-bold text-lg mb-2">{t('auth.studentAccessRequired')}</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            {t('auth.signedInAs')} <span className="font-semibold capitalize text-teal-600">{user.role}</span>.
          </p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            {t('auth.goStaffDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <StudentSidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto pb-12 pt-16 md:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
