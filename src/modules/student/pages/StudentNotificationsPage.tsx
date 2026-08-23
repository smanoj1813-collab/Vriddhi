import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, Trash2, ArrowLeft,
  Calendar, BookOpen, AlertTriangle, Info, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'event' | 'academic';
  read: boolean;
  createdAt: string;
  link?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
  success: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  event: <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
  academic: <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
};

const typeColors: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  event: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  academic: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
};

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile?.collegeId || !profile?.id) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const q = query(
          collection(db, 'colleges', profile.collegeId!, 'notifications'),
          where('recipientId', 'in', [profile.id, 'all', profile.batch || ''])
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const items: Notification[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || new Date().toISOString(),
        } as Notification));

        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(items);
      } catch (err) {
        console.error('[StudentNotifications] load failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.collegeId, profile?.id, profile?.batch]);

  const markAsRead = async (id: string) => {
    if (!profile?.collegeId) return;
    try {
      await updateDoc(doc(db, 'colleges', profile.collegeId, 'notifications', id), { read: true });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('[StudentNotifications] markAsRead failed:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.collegeId) return;
    try {
      const batch = writeBatch(db);
      notifications.filter((n) => !n.read).forEach((n) => {
        batch.update(doc(db, 'colleges', profile.collegeId!, 'notifications', n.id), { read: true });
      });
      await batch.commit();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('[StudentNotifications] markAllAsRead failed:', err);
    }
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Notifications</h1>
            <p className="text-xs text-slate-500">{unreadCount} unread announcements and reminders</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200/80 dark:border-teal-800 transition-colors"
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-4 md:p-5 rounded-2xl border transition-all ${
                notification.read
                  ? 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-slate-800'
                  : 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/80 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 ${typeColors[notification.type] || 'bg-slate-100 text-slate-600'}`}>
                  {typeIcons[notification.type] || <Bell className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {notification.title}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {new Date(notification.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {notification.message}
                  </p>

                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="mt-3 text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <Check size={12} /> Mark as read
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] p-8 shadow-sm">
            <Bell className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-900 dark:text-white font-bold text-sm">No notifications found</p>
            <p className="text-xs text-slate-500 mt-0.5">You're all caught up with your updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
