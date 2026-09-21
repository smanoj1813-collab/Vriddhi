import { useState, useEffect, useRef } from 'react'
import { Download, Smartphone, CheckCircle, Bell, WifiOff, Zap, QrCode, Share, Chrome, Apple } from 'lucide-react'
import { isPwaStandalone, requestPwaInstall, pwaInstallGuidance } from '../pwa/install'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallCard({ variant = 'card' }: { variant?: 'card' | 'banner' | 'page' }) {
  const [isStandalone, setIsStandalone] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const installEventRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    setIsStandalone(isPwaStandalone())
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
    setIsAndroid(/android/i.test(navigator.userAgent))

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      installEventRef.current = promptEvent
      setInstallEvent(promptEvent)
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setIsStandalone(true)
      setCanInstall(false)
      setInstallEvent(null)
      installEventRef.current = null
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if already installable (Chrome may have already fired)
    // For demo, allow install button even without event (will show guidance)
    setCanInstall(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (isStandalone) return

    const event = installEvent || installEventRef.current
    if (event) {
      try {
        await event.prompt()
        const { outcome } = await event.userChoice
        if (outcome === 'accepted') {
          setIsStandalone(true)
        }
      } catch {
        // Fallback to manual guidance
        requestPwaInstall()
      }
    } else {
      // No native prompt available - show manual guidance via PwaPrompts
      requestPwaInstall()
    }
  }

  if (isStandalone) {
    return (
      <div className={`${variant === 'banner' ? 'p-4' : 'p-6'} rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-emerald-900 dark:text-emerald-100">App Installed ✓</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Vriddhi is running as an installed app. You get offline access and push notifications.</p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold">Install Vriddhi App</p>
            <p className="text-xs text-teal-100">Get hall ticket alerts, room allotment, results push - like Uniclare app</p>
          </div>
        </div>
        <button onClick={handleInstall} className="px-5 py-2.5 bg-white text-teal-700 rounded-xl font-bold text-sm hover:bg-teal-50 transition-colors flex items-center gap-2 shrink-0">
          <Download size={16} /> Install App
        </button>
      </div>
    )
  }

  return (
    <div className={`${variant === 'page' ? '' : 'bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm'} p-6`}>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
          <Smartphone className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black">Install Vriddhi App</h2>
          <p className="text-sm text-slate-500 mt-1">Get Uniclare-like mobile experience - hall ticket download alert, room allotment alert, exam fee last date alert, results announcement, all with push notifications</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <Bell className="w-5 h-5 text-blue-600 mb-2" />
          <p className="font-bold text-sm">Push Notifications</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Hall ticket ready, room allotted, fee last date, results published - instant alerts like Uniclare</p>
        </div>
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <WifiOff className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="font-bold text-sm">Offline Access</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">View hall tickets, timetable, fees even without internet. Auto-sync when online.</p>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <Zap className="w-5 h-5 text-amber-600 mb-2" />
          <p className="font-bold text-sm">Fast & Native</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Opens like a native app, no browser UI, fast loading, home screen icon</p>
        </div>
      </div>

      {/* Install Button */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={handleInstall}
          className="flex-1 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02]"
        >
          <Download size={18} /> Install Vriddhi App Now
        </button>
        <button
          onClick={() => requestPwaInstall()}
          className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          How to Install
        </button>
      </div>

      {/* Platform Specific Instructions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Chrome size={16} className="text-blue-600" /> Android / Chrome / Edge
          </h4>
          <ol className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1.5 list-decimal list-inside">
            <li>Tap the Install button above</li>
            <li>Or open browser menu (⋮) → Install app / Add to Home screen</li>
            <li>Tap Install in the prompt</li>
            <li>Find Vriddhi icon on home screen, open like native app</li>
          </ol>
          <p className="text-[11px] text-slate-500 mt-3 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg">
            {pwaInstallGuidance('android')}
          </p>
        </div>
        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Apple size={16} className="text-slate-800 dark:text-white" /> iPhone / iPad (Safari)
          </h4>
          <ol className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1.5 list-decimal list-inside">
            <li>Open Vriddhi in Safari (not Chrome)</li>
            <li>Tap Share button <Share size={12} className="inline" /> at bottom</li>
            <li>Scroll and tap Add to Home Screen</li>
            <li>Tap Add, find Vriddhi icon on home screen</li>
          </ol>
          <p className="text-[11px] text-slate-500 mt-3 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg">
            {pwaInstallGuidance('iphone')}
          </p>
        </div>
      </div>

      {/* QR Code Placeholder */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-4">
        <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
          <QrCode className="w-10 h-10 text-slate-400" />
        </div>
        <div>
          <p className="font-bold text-sm">Scan to Install on Mobile</p>
          <p className="text-xs text-slate-500 mt-1">Open camera, scan QR, open link in browser, then install. Or share this URL: <span className="font-mono text-xs bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border">{window.location.origin}</span></p>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mt-4 text-center">
        PWA manifest: id '/', name 'Vriddhi Academic Cloud', display standalone, scope '/', start_url '/', icons 192 & 512. Service worker caches JS/CSS/HTML, offline fallback /index.html, never intercepts /api/ /__/ Firebase traffic. Update check every hour, prompt reload when new version available.
      </p>
    </div>
  )
}
