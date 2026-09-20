// Stub for `virtual:pwa-register/react` (the app's Vite PWA plugin provides
// the real virtual module; the render-check server has no plugin chain).
// A never-refreshing no-op keeps PwaPrompts' update flow dormant.
export function useRegisterSW(_options?: unknown) {
  return {
    offlineReady: [false, () => {}],
    needRefresh: [false, () => {}],
    updateServiceWorker: (_reloadPage?: boolean) => {},
    onRegisteredSW: undefined,
    onRegisterError: undefined,
  } as const;
}
export function registerSW(_options?: unknown) {
  return () => {};
}
export default { useRegisterSW, registerSW };
