// Course (elective) registration — client model. Mirrors
// functions/src/registrationCore.ts: both sides normalize windows the
// same way; the server is authoritative for submission/capacity.

export interface RegOption { id: string; code: string; name: string; department: string; credits: number; capacity: number }
export interface RegGroup { id: string; label: string; category: string; choose: number; programmes: string[]; options: RegOption[] }
export interface RegWindow {
  id: string
  title: string
  semester: number
  batches: string[]
  opensOn: string
  closesOn: string
  status: 'draft' | 'open' | 'closed'
  groups: RegGroup[]
}

export const REG_CATEGORIES = ['DSC', 'DSE', 'OE', 'GE', 'SEC', 'VAC', 'AEC', 'Other'] as const

const str = (v: unknown) => String(v ?? '').trim()
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const slug = (v: unknown, fb: string) => str(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || fb

export function normalizeWindow(raw: unknown, index = 0): RegWindow | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  const groups = (Array.isArray(d.groups) ? d.groups : []).slice(0, 12).map((g, gi): RegGroup => {
    const gd = (g || {}) as Record<string, unknown>
    return {
      id: slug(gd.id, `g${gi + 1}`),
      label: str(gd.label).slice(0, 80) || `Basket ${gi + 1}`,
      category: str(gd.category).slice(0, 30) || 'DSE',
      choose: Math.max(1, Math.min(6, Math.round(num(gd.choose) || 1))),
      programmes: Array.isArray(gd.programmes) ? (gd.programmes as unknown[]).map(str).filter(Boolean).slice(0, 20) : [],
      options: (Array.isArray(gd.options) ? gd.options : []).slice(0, 30).map((o, oi): RegOption => {
        const od = (o || {}) as Record<string, unknown>
        return {
          id: slug(od.id || od.code || od.name, `o${oi + 1}`),
          code: str(od.code).slice(0, 30),
          name: str(od.name).slice(0, 120),
          department: str(od.department).slice(0, 60),
          credits: Math.max(0, Math.min(10, num(od.credits))),
          capacity: Math.max(0, Math.round(num(od.capacity))),
        }
      }).filter(o => o.name || o.code),
    }
  }).filter(g => g.options.length)
  return {
    id: slug(d.id, `w${index + 1}`),
    title: str(d.title).slice(0, 100) || 'Course registration',
    semester: Math.max(1, Math.min(12, Math.round(num(d.semester) || 1))),
    batches: Array.isArray(d.batches) ? (d.batches as unknown[]).map(str).filter(Boolean).slice(0, 10) : [],
    opensOn: /^\d{4}-\d{2}-\d{2}$/.test(str(d.opensOn)) ? str(d.opensOn) : '',
    closesOn: /^\d{4}-\d{2}-\d{2}$/.test(str(d.closesOn)) ? str(d.closesOn) : '',
    status: (['draft', 'open', 'closed'].includes(str(d.status)) ? str(d.status) : 'draft') as RegWindow['status'],
    groups,
  }
}

export function normalizeWindows(raw: unknown): RegWindow[] {
  const list = (raw as { windows?: unknown })?.windows
  return (Array.isArray(list) ? list : []).map((w, i) => normalizeWindow(w, i)).filter((w): w is RegWindow => !!w)
}

export function isWindowOpen(w: RegWindow, today = new Date()): boolean {
  if (w.status !== 'open') return false
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (w.opensOn && ymd < w.opensOn) return false
  if (w.closesOn && ymd > w.closesOn) return false
  return true
}
