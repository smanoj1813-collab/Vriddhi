// src/modules/student/components/NotificationsPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertCircle, BookOpen, DollarSign, Info, CheckCheck } from 'lucide-react';
import type { Notification } from '../types/student';

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const typeConfig: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  academic: { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  fee: { icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  general: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  alert: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  success: { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  warning: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
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

export default function NotificationsPanel({ notifications, onMarkRead, onMarkAllRead, isOpen, onClose }: NotificationsPanelProps) {
  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/30 z-50 flex flex-col"
          >
            <div className="p-5 border-b border-slate-700/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <Bell size={18} className="text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  <p className="text-sm text-slate-400">{unread.length} unread</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unread.length > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-teal-400 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={18} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {unread.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">New</p>
                  {unread.map((notification) => {
                    const config = getTypeConfig(notification.type);
                    const Icon = config.icon;
                    const priorityClass = getPriorityClass(notification.priority);
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 mb-2 rounded-lg bg-slate-800/50 border-l-2 ${priorityClass} hover:bg-slate-800 transition-colors cursor-pointer group`}
                        onClick={() => onMarkRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-md ${config.bg} shrink-0`}>
                            <Icon size={14} className={config.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                              <span className="text-xs text-slate-500 shrink-0">
                                {notification.timestamp
                                  ? new Date(notification.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                  : ''}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{notification.message}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {read.length > 0 && (
                <div className="p-3 pt-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Earlier</p>
                  {read.slice(0, 10).map((notification) => {
                    const config = getTypeConfig(notification.type);
                    const Icon = config.icon;
                    return (
                      <div
                        key={notification.id}
                        className="p-3 mb-2 rounded-lg hover:bg-slate-800/30 transition-colors opacity-60 hover:opacity-100"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-md ${config.bg} shrink-0`}>
                            <Icon size={14} className={config.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-medium text-slate-300">{notification.title}</h4>
                              <span className="text-xs text-slate-600 shrink-0">
                                {notification.createdAt
                                  ? new Date(notification.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                  : ''}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {notifications.length === 0 && (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No notifications yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}