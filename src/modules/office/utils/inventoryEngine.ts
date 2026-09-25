// src/modules/office/utils/inventoryEngine.ts
//
// Pure inventory logic — asset tags, depreciation (SLM / WDV, per Indian
// financial year), moving-average stock valuation, reorder alerts and
// AMC / warranty reminders. Every rate and category comes from the college's
// Inventory Settings (colleges/{id}/config/inventory). Unit tested.

export type DepMethod = 'SLM' | 'WDV' | 'none'

export interface AssetCategory {
  name: string
  /** Short code used in asset tags, e.g. COMP, FURN, LAB. */
  code: string
  method: DepMethod
  /** Annual rate in % (e.g. SLM 10 → 10 years; WDV 40 for computers). */
  rate: number
}

export interface InventorySettings {
  assetTagPrefix: string
  tagPadding: number
  categories: AssetCategory[]
  locations: string[]
  departments: string[]
  stores: string[]
  fundSources: string[]
  consumableCategories: string[]
  units: string[]
  /** Warn this many days before warranty / AMC expiry. */
  expiryAlertDays: number
  /** Assets not verified within this many days show as due for verification. */
  verificationCycleDays: number
  /** Stock issues need an approving officer's name recorded. */
  requireIssueApproval: boolean
  /** Depreciation below this cost is charged fully in the year of purchase (₹, 0 = off). */
  fullWriteOffBelow: number
}

export const DEFAULT_INVENTORY_SETTINGS: InventorySettings = {
  assetTagPrefix: 'AST',
  tagPadding: 5,
  categories: [
    { name: 'Computers & IT', code: 'IT', method: 'WDV', rate: 40 },
    { name: 'Furniture & fixtures', code: 'FUR', method: 'WDV', rate: 10 },
    { name: 'Laboratory equipment', code: 'LAB', method: 'WDV', rate: 15 },
    { name: 'Electrical & appliances', code: 'ELE', method: 'WDV', rate: 15 },
    { name: 'Sports equipment', code: 'SPT', method: 'WDV', rate: 15 },
    { name: 'Vehicles', code: 'VEH', method: 'WDV', rate: 15 },
    { name: 'Library books (capital)', code: 'BKS', method: 'WDV', rate: 40 },
    { name: 'Building & civil', code: 'BLD', method: 'SLM', rate: 3.34 },
    { name: 'Other', code: 'OTH', method: 'WDV', rate: 15 },
  ],
  locations: ['Office', 'Staff room', 'Computer lab', 'Library', 'Seminar hall'],
  departments: ['Administration', 'Commerce', 'Management', 'Science', 'Arts', 'Library', 'Sports'],
  stores: ['Main store'],
  fundSources: ['College fund', 'UGC', 'RUSA', 'State grant', 'Donation', 'CSR'],
  consumableCategories: ['Stationery', 'Lab consumables', 'Housekeeping', 'Printing & toner', 'Electrical spares', 'Sports consumables'],
  units: ['nos', 'box', 'pkt', 'ream', 'kg', 'litre', 'set', 'pair', 'roll', 'bottle'],
  expiryAlertDays: 30,
  verificationCycleDays: 365,
  requireIssueApproval: false,
  fullWriteOffBelow: 5000,
}

const list = (v: unknown, f: string[]) => (Array.isArray(v) ? v.map(String).map(s => s.trim()).filter(Boolean) : f)
const nonNeg = (v: unknown, f: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : f
}

export function normalizeInventorySettings(raw: Record<string, unknown> | null | undefined): InventorySettings {
  const r = raw || {}
  const d = DEFAULT_INVENTORY_SETTINGS
  const cats = Array.isArray(r.categories)
    ? (r.categories as unknown[])
        .map(c => (c && typeof c === 'object' ? (c as Record<string, unknown>) : null))
        .filter((c): c is Record<string, unknown> => !!c && typeof c.name === 'string' && !!String(c.name).trim())
        .map(c => ({
          name: String(c.name).trim(),
          code: String(c.code || String(c.name).slice(0, 3)).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'OTH',
          method: (['SLM', 'WDV', 'none'] as const).includes(c.method as DepMethod) ? (c.method as DepMethod) : 'WDV',
          rate: Math.min(100, nonNeg(c.rate, 15)),
        }))
    : d.categories
  return {
    assetTagPrefix: (typeof r.assetTagPrefix === 'string' && r.assetTagPrefix.trim() ? r.assetTagPrefix : d.assetTagPrefix).toUpperCase().replace(/[^A-Z0-9-]/g, ''),
    tagPadding: Math.min(8, Math.max(2, Math.floor(nonNeg(r.tagPadding, d.tagPadding)))),
    categories: cats.length ? cats : d.categories,
    locations: list(r.locations, d.locations),
    departments: list(r.departments, d.departments),
    stores: list(r.stores, d.stores).length ? list(r.stores, d.stores) : d.stores,
    fundSources: list(r.fundSources, d.fundSources),
    consumableCategories: list(r.consumableCategories, d.consumableCategories),
    units: list(r.units, d.units),
    expiryAlertDays: Math.floor(nonNeg(r.expiryAlertDays, d.expiryAlertDays)),
    verificationCycleDays: Math.max(1, Math.floor(nonNeg(r.verificationCycleDays, d.verificationCycleDays))),
    requireIssueApproval: typeof r.requireIssueApproval === 'boolean' ? r.requireIssueApproval : d.requireIssueApproval,
    fullWriteOffBelow: nonNeg(r.fullWriteOffBelow, d.fullWriteOffBelow),
  }
}

/** AST/IT/00042 */
export function formatAssetTag(prefix: string, categoryCode: string, n: number, padding: number): string {
  return [prefix, categoryCode, String(Math.max(0, Math.floor(n))).padStart(padding, '0')].filter(Boolean).join('/')
}

// ─── Depreciation (Indian financial year, April–March) ────
export function fyStartYear(date: string): number {
  const [y, m] = date.slice(0, 10).split('-').map(Number)
  return m >= 4 ? y : y - 1
}
const fyStart = (y: number) => `${y}-04-01`
const fyEnd = (y: number) => `${y + 1}-03-31`
const days = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000)
const round2 = (n: number) => Math.round(n * 100) / 100

export interface DepreciationYear {
  fy: string
  opening: number
  addition: number
  depreciation: number
  closing: number
}

/**
 * Year-by-year depreciation schedule from the purchase year to `asOfFy`
 * (inclusive). The purchase year is charged pro-rata by days used; an asset
 * disposed of stops depreciating in the disposal year (pro-rata).
 * Salvage value is a floor. Items costing below `fullWriteOffBelow` are
 * written off in the purchase year.
 */
export function depreciationSchedule(args: {
  cost: number
  purchaseDate: string
  method: DepMethod
  rate: number
  salvage?: number
  asOfFy: number
  disposedOn?: string
  fullWriteOffBelow?: number
}): DepreciationYear[] {
  const cost = Math.max(0, Number(args.cost) || 0)
  const salvage = Math.min(cost, Math.max(0, Number(args.salvage) || 0))
  if (!args.purchaseDate || cost <= 0) return []
  const startFy = fyStartYear(args.purchaseDate)
  const endFy = args.disposedOn ? Math.min(args.asOfFy, fyStartYear(args.disposedOn)) : args.asOfFy
  const out: DepreciationYear[] = []
  let value = 0
  for (let y = startFy; y <= endFy; y++) {
    const opening = value
    const addition = y === startFy ? cost : 0
    const base = opening + addition
    let dep = 0
    if (args.method !== 'none' && base > salvage) {
      const from = y === startFy ? args.purchaseDate.slice(0, 10) : fyStart(y)
      const to = args.disposedOn && fyStartYear(args.disposedOn) === y ? args.disposedOn.slice(0, 10) : fyEnd(y)
      const yearDays = days(fyStart(y), fyEnd(y)) + 1
      const fraction = Math.max(0, Math.min(1, (days(from, to) + 1) / yearDays))
      if (y === startFy && args.fullWriteOffBelow && cost < args.fullWriteOffBelow) {
        dep = base - salvage
      } else if (args.method === 'SLM') {
        dep = cost * (args.rate / 100) * fraction
      } else {
        dep = base * (args.rate / 100) * fraction
      }
      dep = Math.min(dep, base - salvage)
    }
    value = base - dep
    out.push({ fy: `${y}-${String((y + 1) % 100).padStart(2, '0')}`, opening: round2(opening), addition: round2(addition), depreciation: round2(dep), closing: round2(value) })
  }
  return out
}

export function bookValue(args: Parameters<typeof depreciationSchedule>[0]): number {
  const s = depreciationSchedule(args)
  return s.length ? s[s.length - 1].closing : Math.max(0, Number(args.cost) || 0)
}

// ─── Consumable stock (moving-average cost) ───────────────
export interface StockState {
  qty: number
  avgCost: number
}

/** Apply a receipt (+qty at rate), an issue (−qty at avg cost) or an adjustment. */
export function applyMovement(state: StockState, move: { type: 'in' | 'out' | 'adjust'; qty: number; rate?: number }): StockState & { value: number } {
  const q = Number(move.qty) || 0
  if (move.type === 'in') {
    if (q <= 0) throw new Error('Received quantity must be positive.')
    const rate = Math.max(0, Number(move.rate) || 0)
    const totalQty = state.qty + q
    const avg = totalQty > 0 ? (state.qty * state.avgCost + q * rate) / totalQty : rate
    return { qty: round2(totalQty), avgCost: round2(avg), value: round2(q * rate) }
  }
  if (move.type === 'out') {
    if (q <= 0) throw new Error('Issued quantity must be positive.')
    if (q > state.qty + 1e-9) throw new Error(`Only ${state.qty} in stock.`)
    return { qty: round2(state.qty - q), avgCost: state.avgCost, value: round2(q * state.avgCost) }
  }
  // adjust: q is the signed difference (physical − book)
  const next = state.qty + q
  if (next < 0) throw new Error('Stock cannot go below zero.')
  return { qty: round2(next), avgCost: state.avgCost, value: round2(q * state.avgCost) }
}

export function needsReorder(item: { qty: number; reorderLevel: number }): boolean {
  return item.reorderLevel > 0 && item.qty <= item.reorderLevel
}

/** 'expired' | 'expiring' (within alertDays) | 'ok' | 'none' */
export function expiryState(until: string, today: string, alertDays: number): 'expired' | 'expiring' | 'ok' | 'none' {
  if (!until) return 'none'
  const d = days(today, until.slice(0, 10))
  if (d < 0) return 'expired'
  if (d <= alertDays) return 'expiring'
  return 'ok'
}

export function verificationDue(lastVerifiedOn: string, today: string, cycleDays: number): boolean {
  if (!lastVerifiedOn) return true
  return days(lastVerifiedOn.slice(0, 10), today) > cycleDays
}
