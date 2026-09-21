import { Suspense, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import StudentSidebar from './StudentSidebar';
import StudentTopBar from './StudentTopBar';
import StudentBottomNav from './StudentBottomNav';
import StudentMoreSheet from './StudentMoreSheet';
import DesktopViewNotice from '../../../shared/components/DesktopViewNotice';
import { useStudentData } from '../hooks/useStudentData';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../../shared/contexts/LanguageProvider';
import FloatingAIChatWidget from '../../../shared/components/FloatingAIChatWidget';

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
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();
  const { profile, unreadNotifications } = useStudentData();
  const [moreOpen, setMoreOpen] = useState(false);

  // While a student is actively taking a test, the app chrome (sidebar, top
  // padding, floating chat) is removed so there is nothing to navigate away
  // to. The test page is route-scoped, so this is robust to test state.
  const inActiveTest = /\/(test|assessments)\/[^/]+\/take$/.test(location.pathname);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/student/login', { replace: true });
    }
  }, [loading, user, navigate]);

  // Any route change closes the sheet — a student tapping a tile should land
  // on the page, not on a menu that is still covering it.
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const handleSignOut = useCallback(async () => {
    setMoreOpen(false);
    await logout();
    navigate('/student/login', { replace: true });
  }, [logout, navigate]);

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

  if (inActiveTest) {
    // Full-bleed test surface: no sidebar, no app padding, no floating widget.
    // The clipboard lockdown lives on the test page itself, so nothing here is
    // needed for exam integrity.
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <StudentTopBar unreadNotifications={unreadNotifications} />
      <StudentSidebar onSignOut={() => void handleSignOut()} />
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-0 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-12">
        <div className="px-3 py-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <StudentBottomNav
        onOpenMore={() => setMoreOpen(true)}
        moreOpen={moreOpen}
        unreadNotifications={unreadNotifications}
      />
      <StudentMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        onSignOut={() => void handleSignOut()}
        studentName={profile?.name}
        studentMeta={[profile?.regNo, profile?.course, profile?.batch].filter(Boolean).join(' • ')}
        unreadNotifications={unreadNotifications}
      />
      <DesktopViewNotice />
      <FloatingAIChatWidget />
    </div>
  );
}
