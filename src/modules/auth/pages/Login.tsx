import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Lock, Mail, ArrowRight, Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = React.useRef(false);

  React.useEffect(() => {
    console.log('[Login] useEffect check — isAuthenticated:', isAuthenticated, 'user.role:', user?.role, 'hasRedirected:', hasRedirected.current);
    if (hasRedirected.current) return;
    if (isAuthenticated && user) {
      hasRedirected.current = true;
      const from = (location.state as any)?.from?.pathname;
      const target = from || ROLE_DASHBOARD[user.role] || '/admin/dashboard';
      console.log('[Login] Navigating to:', target);
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('[Login] Submitting...', email);
    try {
      await login(email, password);
      console.log('[Login] login() resolved successfully');
    } catch (err: any) {
      console.error('[Login] login() threw:', err);
      const msg = err?.message || err?.code || '';
      if (msg === 'ACCOUNT_NOT_FOUND') {
        setError('Account not found in the system. Please contact your administrator.');
      } else if (
        msg.includes('user-not-found') ||
        msg.includes('wrong-password') ||
        msg.includes('invalid-credential') ||
        msg.includes('invalid-login-credentials')
      ) {
        setError('Invalid email or password');
      } else if (msg.includes('too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else if (msg.includes('user-disabled')) {
        setError('This account has been disabled. Contact support.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
      console.log('[Login] loading set to false');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Vriddhi Portal</h1>
          <p className="text-slate-400 mt-1">Sign in to your dashboard</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl border border-slate-700/30 p-8 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Users size={16} className="text-indigo-400" />
            <span className="text-sm text-indigo-400 font-medium">Staff & Faculty Portal</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@vriddhi.edu" required
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" required
                  className="w-full pl-10 pr-12 py-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 text-white font-medium transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center">
            {/* ═══════ FIX: Link to /student/login ═══════ */}
            <Link
              to="/student/login"
              className="text-sm text-teal-400 hover:text-teal-300 transition-colors flex items-center justify-center gap-1"
            >
              <Shield size={14} />Student Login →
            </Link>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">Forgot password?</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}