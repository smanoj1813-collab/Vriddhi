export const PWA_INSTALL_REQUEST_EVENT = 'vriddhi:pwa-install-request'

/** True when Vriddhi is already running from its installed app icon. */
export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * Opens the global install flow captured by PwaPrompts. Any screen can call
 * this, including after the automatic banner's "Not now" was selected.
 */
export function requestPwaInstall(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PWA_INSTALL_REQUEST_EVENT))
}

export function pwaInstallGuidance(userAgent: string): string {
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return 'On iPhone or iPad, tap Share in Safari, then choose Add to Home Screen.'
  }
  return 'Open your browser menu and choose Install app or Add to Home screen. On Android, use Chrome if that option is not shown.'
}
