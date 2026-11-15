import { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../../Firebase/config';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../../../shared/contexts/LanguageProvider';
import AuthPageLayout from '../components/AuthPageLayout';
import { IDLE_SIGNOUT_FLAG } from '../../../shared/utils/idleTimeout';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [idleSignOut, setIdleSignOut] = useState(false);
  // Self-service password recovery — the "Forgot?" link was a dead `href="#"`.
  // Student accounts are bulk-provisioned with one-time passwords that are
  // shown once and never stored, so a lost password must be recoverable
  // without an admin: Firebase emails a reset link.
  const [forgotMsg, setForgotMsg] = useState<{ kind: 'info' | 'ok' | 'err'; text: string } | null>(null);
  const [forgotSending, setForgotSending] = useState(false);

  // Auto-logout leaves a flag so the student is told WHY the session ended
  // (see IdleSessionTimeout). Read-and-clear — a refresh must not repeat it.
  useEffect(() => {
    if (sessionStorage.getItem(IDLE_SIGNOUT_FLAG) === '1') {
      sessionStorage.removeItem(IDLE_SIGNOUT_FLAG);
      setIdleSignOut(true);
    }
  }, []);

  const { login, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // The homepage's course CTA uses a fixed destination, never an arbitrary
  // return URL. All course access checks still run after authentication.
  const wantsCourses = new URLSearchParams(location.search).get('next') === 'courses';
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      const appUser = await login(email, password);
      if (appUser.role !== 'student') {
        await logout();
        setLocalError(t('auth.notStudent'));
        return;
      }
      navigate(wantsCourses ? '/student/courses' : '/student/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.startsWith('AUTHORIZATION_STALE')) {
        setLocalError(t('auth.identityStale'));
      } else if (msg.includes('ACCOUNT_NOT_FOUND')) {
        setLocalError(t('auth.noStudentProfile'));
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setLocalError(t('auth.invalidCredentials'));
      } else if (msg.includes('auth/user-not-found')) {
        setLocalError(t('auth.noAccountEmail'));
      } else if (msg.includes('auth/invalid-email')) {
        setLocalError(t('auth.invalidEmail'));
      } else if (msg.includes('auth/too-many-requests')) {
        setLocalError(t('auth.tooManyAttempts'));
      } else {
        setLocalError(msg || t('auth.loginFailed'));
      }
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target) {
      setForgotMsg({ kind: 'info', text: t('auth.forgotEnterEmail') });
      return;
    }
    setForgotSending(true);
    setForgotMsg({ kind: 'info', text: t('auth.forgotSending') });
    try {
      await sendPasswordResetEmail(auth, target);
      setForgotMsg({ kind: 'ok', text: t('auth.forgotSent', { email: target }) });
    } catch (err: any) {
      // Same generic message for unknown addresses and send failures — the
      // login page must not become an account enumerator.
      console.warn('[StudentLogin] password reset email failed:', err?.code || err?.message);
      setForgotMsg({ kind: 'err', text: t('auth.forgotError') });
    } finally {
      setForgotSending(false);
    }
  };

  return (
    <AuthPageLayout portal="student">
      {wantsCourses && (
        <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-3 dark:border-teal-800 dark:bg-teal-950/30">
          <strong className="block text-xs font-bold text-teal-800 dark:text-teal-200">Your next skill starts here.</strong>
          <p className="mt-1 text-xs leading-relaxed text-teal-700 dark:text-teal-300">Sign in to explore the upskill courses assigned to your college.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="student-login-email" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
            {t('auth.studentEmail')}
          </label>
          <div className="relative">
            <Mail size={18} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="student-login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@vriddhi.edu"
              autoComplete="email"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm font-medium transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="student-login-password" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t('auth.password')}
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotSending}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium disabled:opacity-60"
            >
              {t('auth.forgot')}
            </button>
          </div>
          <div className="relative">
            <Lock size={18} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="student-login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your student password"
              autoComplete="current-password"
              required
              className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm font-medium transition-all"
            />
            <button
              type="button"
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {forgotMsg && (
          <div
            role="status"
            className={`auth-message p-3 rounded-xl border text-xs font-medium ${
              forgotMsg.kind === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : forgotMsg.kind === 'err'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
            }`}
          >
            {forgotMsg.text}
          </div>
        )}

        {idleSignOut && !localError && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-200">
            Signed out for inactivity — your session ended automatically after a period without
            activity. Please sign in again.
          </div>
        )}

        {localError && (
          <div
            role="alert"
            className="auth-message p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300"
          >
            {localError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="auth-submit w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <span className="sr-only" role="status">{t('common.loading')}</span>
              <span aria-hidden="true" className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </>
          ) : (
            <>
              {t('auth.signInStudent')} <ArrowRight size={17} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      {/* Bottom link */}
      <div className="auth-other-portal mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('auth.staffHint')}{' '}
          <Link to="/login" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
            {t('auth.staffLoginLink')}
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
