import { Minus, Plus, RotateCcw, Type } from 'lucide-react'
import { useTextScale } from '../hooks/useTextScale'

interface TextSizeControlProps {
  /** Extra wrapper classes (the control is used in a header and in a sheet). */
  className?: string
  /** Hides the "Text size" caption for tight rows. */
  showLabel?: boolean
  /** MUI-friendly dense variant used inside the result page header. */
  dense?: boolean
}

/**
 * Bigger / smaller reader text. The percentage shown is the root font size the
 * portal is rendering at, so "85%" means every block is 15% smaller — long
 * section names and score lines then fit inside their card instead of
 * overflowing it.
 */
export default function TextSizeControl({ className = '', showLabel = true, dense = false }: TextSizeControlProps) {
  const { index, label, step, canIncrease, canDecrease, increase, decrease, reset } = useTextScale()
  const percent = Math.round(step * 100)

  const buttonClass = `flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ${
    dense ? 'h-8 w-8' : 'h-9 w-9'
  }`

  return (
    <div className={`flex items-center gap-2 ${className}`} role="group" aria-label="Text size">
      {showLabel && (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Type className="h-3.5 w-3.5" /> Text size
        </span>
      )}
      <button
        type="button"
        onClick={decrease}
        disabled={!canDecrease}
        aria-label="Decrease text size"
        title="Decrease text size"
        className={buttonClass}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={reset}
        aria-label={`Text size ${percent} percent. Reset to normal`}
        title={`${label} (${percent}%) — tap to reset`}
        className="min-w-[54px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold tabular-nums text-slate-600 transition-colors dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
      >
        {percent}%
      </button>
      <button
        type="button"
        onClick={increase}
        disabled={!canIncrease}
        aria-label="Increase text size"
        title="Increase text size"
        className={buttonClass}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      {index !== 1 && (
        <button
          type="button"
          onClick={reset}
          aria-label="Reset text size"
          title="Reset text size"
          className={buttonClass}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
