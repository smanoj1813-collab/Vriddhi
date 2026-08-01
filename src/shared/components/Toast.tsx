import { useEffect, useState } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let listeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notifyListeners() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message: string, type: Toast['type'] = 'info') {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, type }];
  notifyListeners();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, 3000);
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast[]) => setCurrentToasts(t);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {currentToasts.map((t) => (
        <div
          key={t.id}
          className={`
            transform rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300
            ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-slate-700'}
          `}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}