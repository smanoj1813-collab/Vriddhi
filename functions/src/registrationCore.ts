// functions/src/registrationCore.ts
//
// Pure course-registration logic: does a student's basket of choices
// satisfy the window's rules (one from each DSE basket, two SEC…), and
// is there still a seat? Settings live in colleges/{cid}/config/
// registration and are edited in the admin Course Registration screen.

export interface RegOption {
  id: string
  code: string
  name: string
  department: string
  credits: number
  /** 0 = unlimited seats. */
  capacity: number
}

export interface RegGroup {
  id: string
  label: string
  /** DSE | OE | GE | SEC | VAC | AEC | DSC-optional | Other */
  category: string
  /** How many options the student must pick from this basket. */
  choose: number
  options: RegOption[]
  /** Restrict to programmes (course names); empty = every student in the window. */
  programmes: string[]
}

export interface RegWindow {
  id: string
  title: string
  semester: number
  /** Batches this window serves; empty = all batches in that semester. */
  batches: string[]
  opensOn: string  // yyyy-mm-dd or ''
  closesOn: string // yyyy-mm-dd or ''
  status: 'draft' | 'open' | 'closed'
  groups: RegGroup[]
}

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

export function windowMatchesStudent(
  w: RegWindow,
  student: { semester?: number; batch?: string },
): boolean {
  if (Number(student.semester) !== w.semester) return false
  if (w.batches.length && !w.batches.includes(str(student.batch))) return false
  return true
}

/** Groups this student must answer (programme-restricted baskets filtered). */
export function applicableGroups(w: RegWindow, programme: string): RegGroup[] {
  const p = str(programme).toLowerCase()
  return w.groups.filter(g => !g.programmes.length || g.programmes.some(x => x.toLowerCase() === p))
}

export type Selections = Record<string, string[]>

export function validateSelections(w: RegWindow, programme: string, selections: Selections): string[] {
  const errors: string[] = []
  const groups = applicableGroups(w, programme)
  const picked = new Set<string>()
  for (const g of groups) {
    const raw = Array.isArray(selections[g.id]) ? selections[g.id].map(String) : []
    const chosen = [...new Set(raw)]
    if (chosen.length !== g.choose) {
      errors.push(`"${g.label}": choose ${g.choose} subject${g.choose === 1 ? '' : 's'} (you picked ${chosen.length}).`)
      continue
    }
    for (const id of chosen) {
      if (!g.options.some(o => o.id === id)) errors.push(`"${g.label}" has an unknown subject in your selection.`)
      if (picked.has(id)) errors.push('The same subject is picked in two baskets.')
      picked.add(id)
    }
  }
  for (const key of Object.keys(selections)) {
    if (!groups.some(g => g.id === key)) errors.push('Your selection includes a basket that does not apply to your programme.')
  }
  return errors
}

/** Seats taken per option across submitted registrations of a window. */
export function computeSeatCounts(
  registrations: { selections?: Selections; status?: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const r of registrations) {
    if (r.status === 'rejected') continue
    for (const optionIds of Object.values(r.selections || {})) {
      for (const id of optionIds) counts[id] = (counts[id] || 0) + 1
    }
  }
  return counts
}

/** Options in `selections` that are now full (caller's own seats already excluded from counts). */
export function fullOptions(w: RegWindow, selections: Selections, counts: Record<string, number>): { optionId: string; name: string }[] {
  const out: { optionId: string; name: string }[] = []
  for (const g of w.groups) {
    for (const id of selections[g.id] || []) {
      const opt = g.options.find(o => o.id === id)
      if (opt && opt.capacity > 0 && (counts[id] || 0) >= opt.capacity) {
        out.push({ optionId: id, name: opt.name || opt.code })
      }
    }
  }
  return out
}
