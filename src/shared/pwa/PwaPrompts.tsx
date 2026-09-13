// ═══════════════════════════════════════════════════════════════════════
// PwaPrompts — service-worker registration + "update available" and
// "install app" banners. Frontend-only; safe on every route.
// ═══════════════════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const INSTALL_DISMISSED_KEY = 'vriddhi.pwa.installDismissedAt'
const DISMISS_FOR_DAYS = 14

function installRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(INSTALL_DISMISSED_KEY)
    if (!raw) return false
    return Date.now() - Number(raw) < DISMISS_FOR_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

const bannerStyle: React.CSSProperties = {
  position: 'fixed',
  left: 16,
  right: 16,
  bottom: 'calc(16px + env(safe-area-inset-bottom))',
  zIndex: 2000,
  margin: '0 auto',
  maxWidth: 520,
  background: '#0f172a',
  color: '#fff',
  borderRadius: 14,
  padding: '12px 16px',
  boxShadow: '0 10px 30px rgba(0,0,0,.25)',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
}

const btn = (primary: boolean): React.CSSProperties => ({
  border: 'none',
  borderRadius: 10,
  padding: '8px 14px',
  fontWeight: 600,
  cursor: 'pointer',
  background: primary ? '#14b8a6' : 'transparent',
  color: primary ? '#052e2b' : '#cbd5e1',
})

export const PwaPrompts: React.FC = () => {
  // Update flow: a new SW is waiting; user reloads when convenient.
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for a new build every hour while the tab stays open.
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  // Install flow (Chrome/Edge/Android). iOS has no event; Safari users use
  // Share → Add to Home Screen.
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    if (isStandalone() || installRecentlyDismissed()) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      setShowInstall(true)
    }
    const onInstalled = () => { setShowInstall(false); setInstallEvent(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismissInstall = () => {
    setShowInstall(false)
    try { localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now())) } catch { /* ignore */ }
  }

  const doInstall = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'dismissed') dismissInstall()
    else setShowInstall(false)
    setInstallEvent(null)
  }

  if (needRefresh) {
    return (
      <div role="status" style={bannerStyle}>
        <span style={{ flex: 1 }}>A new version of Vriddhi is available.</span>
        <button style={btn(false)} onClick={() => setNeedRefresh(false)}>Later</button>
        <button style={btn(true)} onClick={() => updateServiceWorker(true)}>Reload</button>
      </div>
    )
  }

  if (showInstall && installEvent) {
    return (
      <div role="dialog" aria-label="Install Vriddhi" style={bannerStyle}>
        <img src="/icons/icon-192.png" alt="" width={36} height={36} style={{ borderRadius: 9 }} />
        <span style={{ flex: 1 }}>Install Vriddhi on this device for quick access.</span>
        <button style={btn(false)} onClick={dismissInstall}>Not now</button>
        <button style={btn(true)} onClick={doInstall}>Install</button>
      </div>
    )
  }

  return null
}

export default PwaPrompts
