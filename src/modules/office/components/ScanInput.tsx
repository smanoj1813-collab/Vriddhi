// Scan-or-type input used at the library desk, gate register, stock
// verification and asset audits.
//
// • USB / Bluetooth barcode scanners act as keyboards ("keyboard wedge"):
//   they type the code and press Enter — handled by the plain input.
// • Phones: the camera button uses the browser's BarcodeDetector (Chrome on
//   Android, Edge, Samsung Internet). Where it is missing, we say so and the
//   desk types the number instead — no third-party scanning service involved.

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Camera, ClipboardList, CornerDownLeft, Loader2, ScanLine, X } from 'lucide-react'

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>
}
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike

function getDetectorCtor(): BarcodeDetectorCtor | null {
  const w = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
  return typeof w.BarcodeDetector === 'function' ? w.BarcodeDetector : null
}

export interface ScanInputHandle {
  focus: () => void
}

interface Props {
  placeholder?: string
  onScan: (code: string) => void
  busy?: boolean
  autoFocus?: boolean
  /** Keep scanning after a hit (stock verification). */
  continuous?: boolean
  className?: string
  /** Show a "Paste list" button to enter many codes at once (defaults to `continuous`). */
  bulk?: boolean
}

export const ScanInput = forwardRef<ScanInputHandle, Props>(function ScanInput(
  { placeholder = 'Scan or type, then Enter', onScan, busy, autoFocus, continuous, className = '', bulk },
  ref,
) {
  const [value, setValue] = useState('')
  const [camOpen, setCamOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const showBulk = bulk ?? !!continuous
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }))

  const submit = (code: string) => {
    const c = code.trim()
    if (!c) return
    onScan(c)
    setValue('')
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <ScanLine className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" />
        <input
          ref={inputRef}
          value={value}
          autoFocus={autoFocus}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit(value)
            }
          }}
          placeholder={placeholder}
          className="input-field !pl-9 font-mono"
          autoComplete="off"
          spellCheck={false}
        />
        {busy && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-vriddhi-muted" />}
      </div>
      {/* Manual entry: typing works like a scanner, this makes it obvious and tappable. */}
      <button
        type="button"
        onClick={() => submit(value)}
        disabled={!value.trim()}
        title="Enter / look up typed code"
        className="px-3 rounded-xl bg-vriddhi-accent text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
      >
        <CornerDownLeft className="w-4 h-4" /> <span className="hidden sm:inline">Enter</span>
      </button>
      {showBulk && (
        <button type="button" onClick={() => setBulkOpen(true)} title="Paste a list of codes" className="px-3 rounded-xl bg-vriddhi-card border border-vriddhi-border text-vriddhi-text hover:bg-vriddhi-border/50">
          <ClipboardList className="w-4 h-4" />
        </button>
      )}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setBulkOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-slate-900 dark:text-white">Paste codes</p>
            <p className="text-xs text-vriddhi-muted">One code per line (or separated by commas) — e.g. copied from Excel.</p>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8} className="input-field font-mono" placeholder={'ACC0001\nACC0002'} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setBulkOpen(false)} className="px-3 py-1.5 rounded-xl text-sm text-vriddhi-muted">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const codes = bulkText.split(/[\n,;\t]+/).map(c => c.trim()).filter(Boolean)
                  codes.forEach(c => onScan(c))
                  setBulkText('')
                  setBulkOpen(false)
                }}
                className="px-3 py-1.5 rounded-xl bg-vriddhi-accent text-white text-sm font-semibold"
              >
                Add {bulkText.split(/[\n,;\t]+/).filter(c => c.trim()).length || ''} codes
              </button>
            </div>
          </div>
        </div>
      )}
      <button type="button" onClick={() => setCamOpen(true)} title="Scan with camera" className="px-3 rounded-xl bg-vriddhi-card border border-vriddhi-border text-vriddhi-text hover:bg-vriddhi-border/50">
        <Camera className="w-4 h-4" />
      </button>
      {camOpen && (
        <CameraScanner
          continuous={continuous}
          onClose={() => {
            setCamOpen(false)
            inputRef.current?.focus()
          }}
          onDetect={code => {
            onScan(code)
            if (!continuous) setCamOpen(false)
          }}
        />
      )}
    </div>
  )
})

function CameraScanner({ onDetect, onClose, continuous }: { onDetect: (code: string) => void; onClose: () => void; continuous?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [last, setLast] = useState('')
  const onDetectRef = useRef(onDetect)
  onDetectRef.current = onDetect

  useEffect(() => {
    const Ctor = getDetectorCtor()
    if (!Ctor) {
      setError('This browser cannot read barcodes with the camera. Use Chrome on Android, a USB scanner, or type the number.')
      return
    }
    let stream: MediaStream | null = null
    let stopped = false
    let lastCode = ''
    let lastAt = 0
    const detector = new Ctor({ formats: ['code_39', 'code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a'] })
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stopped || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        const tick = async () => {
          if (stopped || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            const code = codes[0]?.rawValue?.trim()
            // de-bounce the same code for 2 s in continuous mode
            if (code && (code !== lastCode || Date.now() - lastAt > 2000)) {
              lastCode = code
              lastAt = Date.now()
              setLast(code)
              if (navigator.vibrate) navigator.vibrate(60)
              onDetectRef.current(code)
              if (!continuous) return
            }
          } catch {
            /* frame not ready */
          }
          setTimeout(tick, 250)
        }
        tick()
      } catch {
        setError('Camera permission was denied or no camera is available.')
      }
    })()
    return () => {
      stopped = true
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [continuous])

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 text-white">
          <span className="text-sm font-medium">Point the camera at the barcode</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        {error ? (
          <p className="p-6 text-sm text-amber-300">{error}</p>
        ) : (
          <div className="relative">
            <video ref={videoRef} className="w-full aspect-[4/3] object-cover bg-black" muted playsInline />
            <div className="absolute inset-x-10 top-1/2 h-0.5 bg-red-500/80" />
          </div>
        )}
        {continuous && last && <p className="px-4 py-2 text-xs text-teal-300 font-mono">Last: {last}</p>}
      </div>
    </div>
  )
}
