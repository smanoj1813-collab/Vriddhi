import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Lock, Mail, ArrowRight, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      await login(email, password);
      // AuthContext resolves role via getUserData; navigate based on role
      // We navigate to a generic dashboard and let ProtectedRoute handle role-based routing
      // Or you can read user.role after login and navigate accordingly
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('ACCOUNT_NOT_FOUND')) {
        setLocalError('Account not found in system. Contact your administrator.');
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setLocalError('Invalid email or password.');
      } else if (msg.includes('auth/user-not-found')) {
        setLocalError('No account found with this email.');
      } else if (msg.includes('auth/invalid-email')) {
        setLocalError('Please enter a valid email address.');
      } else if (msg.includes('auth/too-many-requests')) {
        setLocalError('Too many failed attempts. Please try again later.');
      } else {
        setLocalError(msg || 'Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm md:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-8"
        >
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-4">
            <GraduationCap size={28} className="text-slate-900 dark:text-white md:hidden" />
            <GraduationCap size={32} className="text-slate-900 dark:text-white hidden md:block" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Vriddhi Portal</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">Sign in to your dashboard</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-700/30 p-5 md:p-8 bg-slate-50 dark:bg-slate-900/50 backdrop-blur"
        >
          <div className="flex items-center gap-2 mb-5 md:mb-6 p-2.5 md:p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Users size={16} className="text-violet-400" />
            <span className="text-sm text-violet-400 font-medium">Staff & Faculty Portal</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 md:mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@vriddhi.edu"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 md:py-3 min-h-[48px] rounded-lg glass-card/30 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 md:mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-2.5 md:py-3 min-h-[48px] rounded-lg glass-card/30 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {localError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400"
              >
                {localError}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 min-h-[48px] rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-900 dark:text-white font-medium transition-colors flex items-center justify-center gap-2 text-base"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 md:mt-6 flex flex-col gap-3 text-center">
            {/* CRITICAL FIX: Use Link (not <a>) and correct path /student-login */}
            <Link
              to="/student/login"
              className="text-sm text-teal-600 hover:text-teal-700 transition-colors flex items-center justify-center gap-1 font-semibold"
            >
              <GraduationCap size={14} /> Student Login <ArrowRight size={14} />
            </Link>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-600 dark:text-slate-400 transition-colors">
              Forgot password?
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
