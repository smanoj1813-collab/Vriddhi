// Digital student ID card. Front: college logo/name/photo strip, student
// photo, name, reg. no, programme, batch, validity and a Code 39 barcode of
// the reg. no — the same symbology the library desk and gate register scan,
// so the phone screen doubles as a library card. Back: college contact and
// return instructions. Downloadable as PNG or PDF (credit-card size).

import { useRef, useState } from 'react'
import { Download, FileDown, Loader2, RotateCcw, ShieldCheck } from 'lucide-react'
import { useStudentData } from '../hooks/useStudentData'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useCollegeBranding } from '@/shared/hooks/useCollegeBranding'
import { code39Widths } from '@/modules/office/utils/libraryEngine'
import { loadPdfLibs } from '@/shared/utils/pdfRuntime'

function Barcode({ value, height = 44 }: { value: string; height?: number }) {
  const safe = value.toUpperCase().replace(/[^A-Z0-9\-. $/+%]/g, '-')
  let widths: number[] = []
  try { widths = code39Widths(safe) } catch { widths = [] }
  const total = widths.reduce((s, w) => s + w, 0)
  let x = 0
  return (
    <svg viewBox={`0 0 ${total || 1} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label={`Barcode ${safe}`}>
      <rect width={total} height={height} fill="#fff" />
      {widths.map((w, i) => {
        const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={height} fill="#000" /> : null
        x += w
        return r
      })}
    </svg>
  )
}

/** "2027" / "2024-2027" / "2024-27" → the graduation year, else +1 from today. */
function validTill(batch?: string): string {
  const years = String(batch || '').match(/\d{2,4}/g) || []
  let y = years.length ? Number(years[years.length - 1]) : new Date().getFullYear() + 1
  if (y < 100) y += 2000
  return `June ${y}`
}

export default function StudentIdCard() {
  const { profile } = useStudentData()
  const { user } = useAuth()
  const collegeId = profile?.collegeId || user?.collegeId || ''
  const { data: branding } = useCollegeBranding(collegeId)
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [busy, setBusy] = useState<'' | 'png' | 'pdf'>('')
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  const collegeName = branding?.collegeName || (user as { collegeName?: string } | null)?.collegeName || 'College'
  const code = profile?.regNo || profile?.rollNumber || ''
  const programme = [profile?.course || profile?.branch, profile?.semester ? `Sem ${profile.semester}` : '', [profile?.division, profile?.section].filter(Boolean).join(' ')].filter(Boolean).join(' · ')

  async function capture(el: HTMLElement) {
    const { html2canvas } = await loadPdfLibs()
    return html2canvas(el, { scale: 3, backgroundColor: null, useCORS: true })
  }

  async function download(kind: 'png' | 'pdf') {
    if (!frontRef.current || !backRef.current) return
    setBusy(kind)
    try {
      const [front, back] = await Promise.all([capture(frontRef.current), capture(backRef.current)])
      const name = `ID-card-${code || 'student'}`
      if (kind === 'png') {
        const a = document.createElement('a')
        a.href = front.toDataURL('image/png')
        a.download = `${name}.png`
        a.click()
      } else {
        const { jsPDF } = await loadPdfLibs()
        // CR80 card: 85.6 × 54 mm, portrait layout → 54 × 85.6
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [54, 85.6] })
        pdf.addImage(front.toDataURL('image/png'), 'PNG', 0, 0, 54, 85.6)
        pdf.addPage([54, 85.6], 'portrait')
        pdf.addImage(back.toDataURL('image/png'), 'PNG', 0, 0, 54, 85.6)
        pdf.save(`${name}.pdf`)
      }
    } finally {
      setBusy('')
    }
  }

  // Both faces are always rendered (so downloads include both); only one is visible.
  const cardBase = 'w-[300px] h-[476px] rounded-[20px] overflow-hidden shadow-xl bg-white text-slate-900 relative'

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My ID Card</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Show this at the library desk, gate or exam hall. The barcode scans like your physical card.</p>
      </div>

      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          {/* FRONT */}
          <div ref={frontRef} className={`${cardBase} ${side === 'front' ? '' : 'absolute -left-[9999px] top-0'}`}>
            <div className="relative h-[120px] bg-teal-600">
              {branding?.coverImageUrl && <img src={branding.coverImageUrl} crossOrigin="anonymous" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
              <div className="relative flex items-center gap-2 p-3">
                {branding?.logoUrl ? (
                  <img src={branding.logoUrl} crossOrigin="anonymous" alt="" className="h-10 w-10 rounded-lg bg-white p-1 object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-white text-teal-700 font-black flex items-center justify-center">{collegeName.charAt(0)}</div>
                )}
                <div className="min-w-0 text-white">
                  <p className="text-[13px] font-extrabold leading-tight line-clamp-2">{collegeName}</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] opacity-90">Student Identity Card</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center -mt-12 relative">
              {profile?.avatar ? (
                <img src={profile.avatar} crossOrigin="anonymous" alt="" className="w-24 h-28 rounded-xl object-cover border-4 border-white shadow bg-slate-100" />
              ) : (
                <div className="w-24 h-28 rounded-xl border-4 border-white shadow bg-teal-50 text-teal-700 text-4xl font-bold flex items-center justify-center">{profile?.name?.charAt(0) || 'S'}</div>
              )}
            </div>
            <div className="text-center px-4 mt-3">
              <p className="text-lg font-extrabold leading-tight">{profile?.name || 'Student'}</p>
              <p className="text-xs font-semibold text-teal-700 mt-0.5">{programme || '—'}</p>
            </div>
            <div className="mx-4 mt-3 grid grid-cols-2 gap-y-1.5 text-[11px]">
              <span className="text-slate-500">Reg. No</span><span className="font-bold text-right font-mono">{code || '—'}</span>
              <span className="text-slate-500">Batch</span><span className="font-semibold text-right">{profile?.batch || '—'}</span>
              <span className="text-slate-500">Valid till</span><span className="font-semibold text-right">{validTill(profile?.batch)}</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 px-5 pb-3">
              {code && <Barcode value={code} />}
              <p className="text-center font-mono text-[10px] tracking-widest mt-0.5">{code}</p>
            </div>
          </div>

          {/* BACK */}
          <div ref={backRef} className={`${cardBase} ${side === 'back' ? '' : 'absolute -left-[9999px] top-0'}`}>
            <div className="h-3 bg-teal-600" />
            <div className="p-5 space-y-4 text-[11px]">
              <div className="grid grid-cols-[80px_1fr] gap-y-1.5">
                <span className="text-slate-500">Email</span><span className="font-medium break-all">{profile?.email || '—'}</span>
                <span className="text-slate-500">Phone</span><span className="font-medium">{profile?.phone || '—'}</span>
                <span className="text-slate-500">Mentor</span><span className="font-medium">{(profile as { mentor?: string } | null)?.mentor || '—'}</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <p className="font-bold text-slate-800">If found, please return to</p>
                <p className="font-semibold">{collegeName}</p>
                {branding?.address && <p className="text-slate-600">{branding.address}</p>}
                {(branding?.phone || branding?.email) && <p className="text-slate-600">{[branding?.phone, branding?.email].filter(Boolean).join(' · ')}</p>}
              </div>
              <ul className="list-disc pl-4 text-slate-500 space-y-0.5 text-[10px]">
                <li>This card is the property of the college and must be carried on campus.</li>
                <li>It is non-transferable. Report loss to the college office immediately.</li>
              </ul>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-5">
              <div className="flex items-end justify-between">
                <div className="text-[10px] text-slate-500 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Digitally issued via Vriddhi</div>
                <div className="text-center">
                  <div className="w-24 border-b border-slate-400 mb-0.5" />
                  <p className="text-[9px] text-slate-500">{branding?.signatoryDesignation && branding.signatoryDesignation !== 'Accounts Officer' ? branding.signatoryDesignation : 'Principal'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={() => setSide(s => (s === 'front' ? 'back' : 'front'))} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200">
            <RotateCcw className="w-4 h-4" /> Show {side === 'front' ? 'back' : 'front'}
          </button>
          <button onClick={() => download('png')} disabled={!!busy || !profile} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50">
            {busy === 'png' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Image
          </button>
          <button onClick={() => download('pdf')} disabled={!!busy || !profile} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50">
            {busy === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} PDF (print-ready)
          </button>
        </div>
        {!profile?.avatar && <p className="text-xs text-slate-500 text-center max-w-sm">No photo on file — ask the college office to add your photo to your student record.</p>}
      </div>
    </div>
  )
}
