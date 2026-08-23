import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { School, Eye, EyeOff, Lock, Mail, ArrowRight, Shield, Users, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../../../shared/contexts/ThemeProvider';

const ROLE_DASHBOARD: Record<string, string> = {
  superadmin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  principal: '/admin/dashboard',
  faculty: '/faculty/dashboard',
  hod: '/faculty/dashboard',
  mentor: '/faculty/dashboard',
  student: '/student/dashboard',
  parent: '/student/dashboard',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, user } = useAuth();
  const { resolvedMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = React.useRef(false);

  React.useEffect(() => {
    if (hasRedirected.current) return;
    if (isAuthenticated && user) {
      hasRedirected.current = true;
      const from = (location.state as any)?.from?.pathname;
      const target = from || ROLE_DASHBOARD[user.role] || '/admin/dashboard';
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const msg = err?.message || err?.code || '';
      if (msg === 'ACCOUNT_NOT_FOUND') {
        setError('Account not found in the system. Please contact your administrator.');
      } else if (
        msg.includes('user-not-found') ||
        msg.includes('wrong-password') ||
        msg.includes('invalid-credential') ||
        msg.includes('invalid-login-credentials')
      ) {
        setError('Invalid email address or password.');
      } else if (msg.includes('too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else if (msg.includes('user-disabled')) {
        setError('This account has been disabled. Contact support.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center p-4 transition-colors duration-200">
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Vriddhi Portal
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Academic Management & Assessment System
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
            <button
              type="button"
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm flex items-center justify-center gap-1.5"
            >
              <Users size={14} />
              Staff & Faculty
            </button>
            <Link
              to="/student/login"
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5"
            >
              <Shield size={14} />
              Student Portal
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
                Academic Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Password
                </label>
                <a href="#" className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Staff Portal <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Bottom hint */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students should sign in using the{' '}
              <Link to="/student/login" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                Student Portal →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
