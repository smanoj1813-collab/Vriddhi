// src/pages/student/StudentNotificationsPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, ArrowLeft, BookOpen, DollarSign, Info, AlertCircle, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from './../types/student';
import { useStudentData } from '../hooks/useStudentData';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type StudentNotificationData,
} from '../api/studentDataApi';

const typeConfig: Record<string, { icon: typeof Info; color: string; bg: string; label: string }> = {
  academic: { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Academic' },
  fee: { icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Fee' },
  general: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'General' },
  alert: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Alert' },
  success: { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Success' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Info' },
  warning: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Warning' },
};

const priorityConfig: Record<string, string> = {
  low: 'border-l-slate-500',
  medium: 'border-l-amber-500',
  high: 'border-l-red-500',
};

function getPriorityClass(priority: string | undefined): string {
  return priorityConfig[priority ?? 'medium'] ?? priorityConfig.medium;
}

function getTypeConfig(type: string) {
  return typeConfig[type] ?? typeConfig.general;
}

function toNotification(n: StudentNotificationData): Notification {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    timestamp: n.timestamp,
    read: n.read,
    priority: n.priority,
  };
}

export default function StudentNotificationsPage() {
  const navigate = useNavigate();
  const { studentId, loading: dataLoading } = useStudentData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async () => {
    if (!studentId) {
      if (!dataLoading) setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchNotifications(studentId);
      setNotifications(data.map(toNotification));
    } catch (err) {
      console.error('[Notifications] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, dataLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    // Optimistically mark read, persist to Firestore.
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (studentId) await markAllNotificationsRead(studentId);
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/student')}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-sm text-slate-400">{unreadCount} unread</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors text-sm font-medium"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {f === 'all' ? 'All' : 'Unread'}
              {f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="text-teal-400 animate-spin" />
            </div>
          ) : filtered.length === 0 && (
            <div className="text-center py-12">
              <Bell size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No notifications</p>
            </div>
          )}

          {!loading && filtered.map((notification) => {
            const config = getTypeConfig(notification.type);
            const Icon = config.icon;
            const priorityClass = getPriorityClass(notification.priority);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-lg bg-slate-800/50 border-l-2 ${priorityClass} hover:bg-slate-800 transition-colors ${
                  notification.read ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                    <Icon size={18} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-teal-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {notification.createdAt
                              ? new Date(notification.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : notification.timestamp
                                ? new Date(notification.timestamp).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                          </span>
                        </div>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-teal-400 transition-colors shrink-0"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}