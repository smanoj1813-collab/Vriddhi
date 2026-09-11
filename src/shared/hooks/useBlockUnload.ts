import { useEffect } from 'react';

/**
 * Warns before the tab is closed or reloaded while `active` is true.
 *
 * Covers closing the tab, reloading and navigating to another origin. It does
 * NOT cover client-side navigation: this app mounts a plain `<BrowserRouter>`,
 * and react-router's `useBlocker` only works under a data router
 * (`createBrowserRouter`). In-app navigation is blocked by the modal overlay
 * the import pages render instead — see `ImportProgressOverlay`.
 */
export function useBlockUnload(active: boolean, message?: string): void {
  useEffect(() => {
    if (!active) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy assignment is still what makes Chrome show its own dialog;
      // the custom message is ignored by every current browser.
      event.returnValue = message || '';
      return message || '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active, message]);
}
