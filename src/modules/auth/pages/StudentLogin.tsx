import { useState } from 'react';
import { motion } from 'framer-motion';
import { School, Eye, EyeOff, Lock, Mail, ArrowRight, BookOpen, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../../../shared/contexts/LanguageProvider';
import LanguageSwitcher from '../../../shared/components/LanguageSwitcher';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, logout, isLoading } = useAuth();
  const navigate = useNavigate();
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
      navigate('/student/dashboard', { replace: true });
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher compact showLabel={false} />
      </div>
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/25 mb-4">
            <School size={34} className="text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-900 dark:text-white tracking-tight">
            {t('auth.studentPortal')}
          </h1>
          <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400 mt-1 text-sm font-medium">
            {t('auth.studentSubtitle')}
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200 dark:border-slate-800 p-7 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none"
        >
          {/* Portal Switcher Tabs */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-900/60 p-1 mb-6 border border-slate-200/80 dark:border-slate-800">
            <Link
              to="/login"
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white transition-all flex items-center justify-center gap-1.5"
            >
              <Users size={14} />
              {t('auth.staffFaculty')}
            </Link>
            <button
              type="button"
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm flex items-center justify-center gap-1.5"
            >
              <BookOpen size={14} />
              {t('auth.studentPortal')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-700 dark:text-slate-300 mb-1.5 block">
                {t('auth.studentEmail')}
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@vriddhi.edu"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-700 dark:text-slate-300">
                  {t('auth.password')}
                </label>
                <a href="#" className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">
                  {t('auth.forgot')}
                </a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your student password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {localError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                {localError}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In as Student <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Bottom link */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">
              {t('auth.staffHint')}{' '}
              <Link to="/login" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                {t('auth.staffLoginLink')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
