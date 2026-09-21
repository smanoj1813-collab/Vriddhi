// Stub for the toast provider: the real one throws outside its Provider, and a
// render check only needs to know which toast a button asked for.
export const toasts: string[] = [];

export function useNotification() {
  return {
    showNotification: (options?: { message?: string }) => { toasts.push(`notify:${options?.message ?? ''}`); },
    showSuccess: (message: string) => { toasts.push(`success:${message}`); },
    showError: (message: string) => { toasts.push(`error:${message}`); },
    showWarning: (message: string) => { toasts.push(`warning:${message}`); },
    showInfo: (message: string) => { toasts.push(`info:${message}`); },
  } as any;
}

export default function NotificationProvider({ children }: { children: any }) {
  return children;
}
