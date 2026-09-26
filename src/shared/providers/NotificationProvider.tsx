import React, { createContext, useContext, useCallback, useState, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

// ==================== TYPES ====================

export interface NotificationOptions {
  message: string;
  title?: string;
  severity?: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface NotificationState extends NotificationOptions {
  id: string;
  open: boolean;
}

interface NotificationContextType {
  showNotification: (options: NotificationOptions) => void;
  showSuccess: (message: string, options?: Omit<NotificationOptions, "message" | "severity">) => void;
  showError: (message: string, options?: Omit<NotificationOptions, "message" | "severity">) => void;
  showWarning: (message: string, options?: Omit<NotificationOptions, "message" | "severity">) => void;
  showInfo: (message: string, options?: Omit<NotificationOptions, "message" | "severity">) => void;
}

// ==================== CONTEXT ====================

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Dual-mode toast palette: light-first solid tints with readable text,
// keeping the glassy saturated look in dark mode. (The old config was
// dark-only — green-400 titles and slate-300 bodies were unreadable on a
// light background.)
const severityConfig = {
  success: { icon: CheckCircle, bg: "bg-emerald-50/95 dark:bg-green-500/10", border: "border-emerald-300 dark:border-green-500/30", text: "text-emerald-800 dark:text-green-400", iconColor: "text-emerald-600 dark:text-green-400" },
  error: { icon: AlertCircle, bg: "bg-red-50/95 dark:bg-red-500/10", border: "border-red-300 dark:border-red-500/30", text: "text-red-800 dark:text-red-400", iconColor: "text-red-600 dark:text-red-400" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50/95 dark:bg-amber-500/10", border: "border-amber-300 dark:border-amber-500/30", text: "text-amber-800 dark:text-amber-400", iconColor: "text-amber-600 dark:text-amber-400" },
  info: { icon: Info, bg: "bg-blue-50/95 dark:bg-blue-500/10", border: "border-blue-300 dark:border-blue-500/30", text: "text-blue-800 dark:text-blue-400", iconColor: "text-blue-600 dark:text-blue-400" },
};

// ==================== PROVIDER ====================

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const showNotification = useCallback((options: NotificationOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setNotifications((prev) => [
      ...prev,
      {
        ...options,
        id,
        open: true,
        severity: options.severity || "info",
        duration: options.duration || 5000,
      },
    ]);

    // Auto-dismiss
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, options.duration || 5000);
  }, []);

  const showSuccess = useCallback(
    (message: string, options?: Omit<NotificationOptions, "message" | "severity">) => {
      showNotification({ ...options, message, severity: "success", duration: options?.duration || 4000 });
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string, options?: Omit<NotificationOptions, "message" | "severity">) => {
      showNotification({ ...options, message, severity: "error", duration: options?.duration || 7000 });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, options?: Omit<NotificationOptions, "message" | "severity">) => {
      showNotification({ ...options, message, severity: "warning", duration: options?.duration || 6000 });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, options?: Omit<NotificationOptions, "message" | "severity">) => {
      showNotification({ ...options, message, severity: "info", duration: options?.duration || 5000 });
    },
    [showNotification]
  );

  const handleClose = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ showNotification, showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      {/* Toast Container — full-width sheets on phones (a fixed 320px toast
          anchored right-4 overflows a 360px screen once the container padding
          is counted), compact bottom-right stack from sm: up. Bottom offset
          respects the gesture-bar safe area in the installed PWA. */}
      <div
        className="fixed right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2 items-stretch sm:items-end"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {notifications.map((notification) => {
          const config = severityConfig[notification.severity || "info"];
          const Icon = config.icon;

          return (
            <div
              key={notification.id}
              className={`flex items-start gap-3 w-full sm:w-auto sm:min-w-[320px] max-w-[420px] p-4 rounded-xl border ${config.bg} ${config.border} backdrop-blur-xl animate-in slide-in-from-right-full duration-300`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconColor}`} />
              <div className="flex-1 min-w-0">
                {notification.title && (
                  <p className={`font-medium text-sm ${config.text}`}>{notification.title}</p>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
              </div>
              <button
                onClick={() => handleClose(notification.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-slate-900/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

// ==================== HOOK ====================

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};