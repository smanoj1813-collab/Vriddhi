// src/pages/student/StudentNotificationsPage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, ArrowLeft, BookOpen, DollarSign, Info, AlertCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from './../types/student';

const typeConfig = {
  academic: { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Academic' },
  fee: { icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Fee' },
  general: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'General' },
  alert: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Alert' },
  success: { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Success' },
};

const priorityConfig = {
  low: 'border-l-slate-500',
  medium: 'border-l-amber-500',
  high: 'border-l-red-500',
};

export default function StudentNotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'NOT001',
      title: 'Mid-Term Exam Schedule',
      message: 'Mid-term exams for Semester 4 will start from July 15, 2026.',
      type: 'academic',
      timestamp: '2026-07-01T09:00:00Z',
      read: false,
      priority: 'high',
    },
    {
      id: 'NOT002',
      title: 'Fee Payment Reminder',
      message: 'Please pay the pending installment of ₹37,500 before July 15.',
      type: 'fee',
      timestamp: '2026-07-02T10:00:00Z',
      read: false,
      priority: 'high',
    },
    {
      id: 'NOT003',
      title: 'Assignment Deadline Extended',
      message: 'The case study deadline has been extended to July 10.',
      type: 'academic',
      timestamp: '2026-07-01T14:00:00Z',
      read: false,
      priority: 'medium',
    },
    {
      id: 'NOT004',
      title: 'College Fest Registration',
      message: 'Register for the annual cultural fest "Utsav 2026" by July 5.',
      type: 'general',
      createdAt: '2026-06-28T11:00:00Z',
      read: true,
      priority: 'low',
    },
  ]);

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Bell size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No notifications</p>
            </div>
          )}

          {filtered.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-lg bg-slate-800/50 border-l-2 ${priorityConfig[notification.priority]} hover:bg-slate-800 transition-colors ${
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
                            {new Date(notification.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
