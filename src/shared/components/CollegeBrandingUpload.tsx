// Upload / replace / remove the college logo and campus (cover) image.
// Files go to Storage at colleges/{id}/branding/, URLs are merged into
// colleges/{id}/config/branding so every portal (and the digital ID card)
// can show them.

import { useRef, useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Loader2, Trash2, Building2 } from 'lucide-react'
import { db, storage } from '@/Firebase/config'
import { useCollegeBranding, collegeBrandingKey } from '@/shared/hooks/useCollegeBranding'

type Kind = 'logoUrl' | 'coverImageUrl'

const MAX_BYTES = 3 * 1024 * 1024

export default function CollegeBrandingUpload({ collegeId }: { collegeId: string }) {
  const { data: branding } = useCollegeBranding(collegeId)
  const qc = useQueryClient()
  const [busy, setBusy] = useState<Kind | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const logoInput = useRef<HTMLInputElement>(null)
  const coverInput = useRef<HTMLInputElement>(null)

  async function save(kind: Kind, url: string) {
    await setDoc(doc(db, 'colleges', collegeId, 'config', 'branding'), { [kind]: url, updatedAt: serverTimestamp() }, { merge: true })
    await qc.invalidateQueries({ queryKey: collegeBrandingKey(collegeId) })
  }

  async function upload(kind: Kind, file: File) {
    setMsg(null)
    if (!file.type.startsWith('image/')) return setMsg({ ok: false, text: 'Please choose an image (PNG, JPG, SVG or WebP).' })
    if (file.size > MAX_BYTES) return setMsg({ ok: false, text: 'Image must be 3 MB or smaller.' })
    setBusy(kind)
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const path = `colleges/${collegeId}/branding/${kind === 'logoUrl' ? 'logo' : 'cover'}-${Date.now()}.${ext}`
      const r = ref(storage, path)
      await uploadBytes(r, file, { contentType: file.type, cacheControl: 'public, max-age=86400' })
      await save(kind, await getDownloadURL(r))
      setMsg({ ok: true, text: kind === 'logoUrl' ? 'College logo updated.' : 'College image updated.' })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Upload failed' })
    } finally {
      setBusy(null)
    }
  }

  async function remove(kind: Kind) {
    setBusy(kind)
    try {
      await save(kind, '')
    } finally {
      setBusy(null)
    }
  }

  const Tile = ({ kind, label, hint, url, input, aspect }: { kind: Kind; label: string; hint: string; url?: string; input: React.RefObject<HTMLInputElement | null>; aspect: string }) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
      <div className={`relative ${aspect} rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-center overflow-hidden`}>
        {url ? (
          <img src={url} alt={label} className={kind === 'logoUrl' ? 'max-h-full max-w-full object-contain p-3' : 'w-full h-full object-cover'} />
        ) : (
          <div className="text-center text-slate-400 text-xs p-3">
            <Building2 className="w-6 h-6 mx-auto mb-1" />
            No {kind === 'logoUrl' ? 'logo' : 'image'} yet
          </div>
        )}
        {busy === kind && <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-teal-600" /></div>}
      </div>
      <p className="text-[11px] text-slate-500">{hint}</p>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(kind, f) }} />
      <div className="flex gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={!!busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium disabled:opacity-50">
          <ImagePlus className="w-3.5 h-3.5" /> {url ? 'Replace' : 'Upload'}
        </button>
        {url && (
          <button type="button" onClick={() => remove(kind)} disabled={!!busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 text-xs font-medium disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-[180px_1fr] gap-5">
        <Tile kind="logoUrl" label="College Logo" hint="Square PNG/SVG with transparent background works best. Max 3 MB." url={branding?.logoUrl} input={logoInput} aspect="aspect-square" />
        <Tile kind="coverImageUrl" label="College Image" hint="Campus photo shown on the dashboard and ID cards. Landscape, max 3 MB." url={branding?.coverImageUrl} input={coverInput} aspect="aspect-[16/7]" />
      </div>
      {msg && <p className={`text-xs ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p>}
    </div>
  )
}
