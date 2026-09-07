import { WifiOff } from 'lucide-react'

/**
 * Honest placeholder banner for screens that are routed and styled but have no
 * data source wired up yet. It replaces silently-empty `MOCK_* = []` arrays so
 * a figure of "0" (or "NaN%") can no longer be mistaken for a real measurement.
 */
export default function NotConnectedBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
      <WifiOff size={18} className="text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-amber-600 dark:text-amber-400">Not connected to a data source</p>
        <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-sm">{message}</p>
      </div>
    </div>
  )
}
