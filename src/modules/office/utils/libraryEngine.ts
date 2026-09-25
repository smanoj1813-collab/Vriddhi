// src/modules/office/utils/libraryEngine.ts
//
// Pure library policy engine — no Firebase imports, fully unit tested.
// Every number here comes from the college's own Library Settings
// (colleges/{id}/config/library): loan periods and limits per member type,
// fine per day, grace days, fine cap, closed days, lost-book charges,
// reservation holds and accession-number format.

export type MemberType = 'student' | 'faculty' | 'staff'

export interface MemberPolicy {
  /** Books a member may hold at once. */
  maxBooks: number
  /** Loan period in days. */
  loanDays: number
  /** Renewals allowed per loan. */
  maxRenewals: number
  /** Days added per renewal. */
  renewDays: number
  /** Fine per overdue day (₹). 0 = no fines for this member type. */
  finePerDay: number
  /** Cap per loan (₹). 0 = no cap. */
  maxFine: number
  /** Days after the due date before fines start. */
  graceDays: number
}

export type LostBookPolicy = 'price' | 'price_plus_fee' | 'multiple'
export type FineHandling = 'desk' | 'fee_account' | 'both'

export interface LibrarySettings {
  libraryName: string
  openingHours: string
  policies: Record<MemberType, MemberPolicy>
  /** Sundays are closed days (no due dates, no fine days when skipClosedDaysInFines). */
  sundayClosed: boolean
  /** Additional closed dates (YYYY-MM-DD) — holidays, vacations. */
  holidays: string[]
  /** Push a due date that falls on a closed day to the next open day. */
  dueDateSkipsClosedDays: boolean
  /** Do not charge fines for closed days. */
  skipClosedDaysInFines: boolean
  lostBookPolicy: LostBookPolicy
  lostProcessingFee: number
  lostMultiplier: number
  /** Default charge suggested for a damaged book (₹). */
  damageCharge: number
  /** How fines are settled: at the library desk, on the student fee account, or either. */
  fineHandling: FineHandling
  /** Refuse new issues while unpaid fines exceed this (₹). 0 = never block. */
  blockIssueAboveFine: number
  reservationHoldDays: number
  maxReservationsPerMember: number
  allowReservations: boolean
  allowRenewalRequests: boolean
  accessionPrefix: string
  accessionPadding: number
  categories: string[]
  /** Library receipt number prefix for fines collected at the desk. */
  receiptPrefix: string
}

export const DEFAULT_POLICIES: Record<MemberType, MemberPolicy> = {
  student: { maxBooks: 3, loanDays: 14, maxRenewals: 1, renewDays: 14, finePerDay: 2, maxFine: 200, graceDays: 0 },
  faculty: { maxBooks: 10, loanDays: 60, maxRenewals: 3, renewDays: 30, finePerDay: 0, maxFine: 0, graceDays: 0 },
  staff: { maxBooks: 5, loanDays: 30, maxRenewals: 2, renewDays: 15, finePerDay: 1, maxFine: 100, graceDays: 0 },
}

export const DEFAULT_LIBRARY_SETTINGS: LibrarySettings = {
  libraryName: 'Central Library',
  openingHours: 'Mon–Sat, 9:00 AM – 5:30 PM',
  policies: DEFAULT_POLICIES,
  sundayClosed: true,
  holidays: [],
  dueDateSkipsClosedDays: true,
  skipClosedDaysInFines: true,
  lostBookPolicy: 'price_plus_fee',
  lostProcessingFee: 100,
  lostMultiplier: 2,
  damageCharge: 100,
  fineHandling: 'both',
  blockIssueAboveFine: 100,
  reservationHoldDays: 3,
  maxReservationsPerMember: 3,
  allowReservations: true,
  allowRenewalRequests: true,
  accessionPrefix: 'ACC',
  accessionPadding: 6,
  categories: ['Textbook', 'Reference', 'Journal', 'Magazine', 'Novel / General', 'Competitive Exams', 'E-Book', 'Thesis / Project', 'CD / DVD'],
  receiptPrefix: 'LIB',
}

const nonNeg = (v: unknown, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function normalizePolicy(raw: unknown, fallback: MemberPolicy): MemberPolicy {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    maxBooks: Math.floor(nonNeg(r.maxBooks, fallback.maxBooks)),
    loanDays: Math.max(1, Math.floor(nonNeg(r.loanDays, fallback.loanDays))),
    maxRenewals: Math.floor(nonNeg(r.maxRenewals, fallback.maxRenewals)),
    renewDays: Math.max(1, Math.floor(nonNeg(r.renewDays, fallback.renewDays))),
    finePerDay: nonNeg(r.finePerDay, fallback.finePerDay),
    maxFine: nonNeg(r.maxFine, fallback.maxFine),
    graceDays: Math.floor(nonNeg(r.graceDays, fallback.graceDays)),
  }
}

/** Merge a stored config doc over the defaults, dropping junk values. */
export function normalizeLibrarySettings(raw: Record<string, unknown> | null | undefined): LibrarySettings {
  const r = raw || {}
  const d = DEFAULT_LIBRARY_SETTINGS
  const pol = (r.policies && typeof r.policies === 'object' ? r.policies : {}) as Record<string, unknown>
  const str = (v: unknown, f: string) => (typeof v === 'string' && v.trim() ? v : f)
  const bool = (v: unknown, f: boolean) => (typeof v === 'boolean' ? v : f)
  const list = (v: unknown, f: string[]) => (Array.isArray(v) ? v.map(String).map(s => s.trim()).filter(Boolean) : f)
  return {
    libraryName: str(r.libraryName, d.libraryName),
    openingHours: str(r.openingHours, d.openingHours),
    policies: {
      student: normalizePolicy(pol.student, d.policies.student),
      faculty: normalizePolicy(pol.faculty, d.policies.faculty),
      staff: normalizePolicy(pol.staff, d.policies.staff),
    },
    sundayClosed: bool(r.sundayClosed, d.sundayClosed),
    holidays: list(r.holidays, d.holidays).filter(h => /^\d{4}-\d{2}-\d{2}$/.test(h)).sort(),
    dueDateSkipsClosedDays: bool(r.dueDateSkipsClosedDays, d.dueDateSkipsClosedDays),
    skipClosedDaysInFines: bool(r.skipClosedDaysInFines, d.skipClosedDaysInFines),
    lostBookPolicy: (['price', 'price_plus_fee', 'multiple'] as const).includes(r.lostBookPolicy as LostBookPolicy) ? (r.lostBookPolicy as LostBookPolicy) : d.lostBookPolicy,
    lostProcessingFee: nonNeg(r.lostProcessingFee, d.lostProcessingFee),
    lostMultiplier: Math.max(1, nonNeg(r.lostMultiplier, d.lostMultiplier)),
    damageCharge: nonNeg(r.damageCharge, d.damageCharge),
    fineHandling: (['desk', 'fee_account', 'both'] as const).includes(r.fineHandling as FineHandling) ? (r.fineHandling as FineHandling) : d.fineHandling,
    blockIssueAboveFine: nonNeg(r.blockIssueAboveFine, d.blockIssueAboveFine),
    reservationHoldDays: Math.max(1, Math.floor(nonNeg(r.reservationHoldDays, d.reservationHoldDays))),
    maxReservationsPerMember: Math.floor(nonNeg(r.maxReservationsPerMember, d.maxReservationsPerMember)),
    allowReservations: bool(r.allowReservations, d.allowReservations),
    allowRenewalRequests: bool(r.allowRenewalRequests, d.allowRenewalRequests),
    accessionPrefix: str(r.accessionPrefix, d.accessionPrefix).toUpperCase().replace(/[^A-Z0-9-]/g, ''),
    accessionPadding: Math.min(10, Math.max(1, Math.floor(nonNeg(r.accessionPadding, d.accessionPadding)))),
    categories: list(r.categories, d.categories),
    receiptPrefix: str(r.receiptPrefix, d.receiptPrefix).toUpperCase().replace(/[^A-Z0-9-]/g, ''),
  }
}

// ─── Dates (YYYY-MM-DD, timezone-free) ────────────────────
function parse(d: string): Date {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, day || 1))
}
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}
export function addDays(date: string, days: number): string {
  const d = parse(date)
  d.setUTCDate(d.getUTCDate() + days)
  return fmt(d)
}
export function daysBetween(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86400000)
}

export function isClosedDay(date: string, s: Pick<LibrarySettings, 'sundayClosed' | 'holidays'>): boolean {
  if (s.sundayClosed && parse(date).getUTCDay() === 0) return true
  return s.holidays.includes(date.slice(0, 10))
}

/** Due date = issue date + loan days, moved to the next open day when configured. */
export function computeDueDate(issueDate: string, days: number, s: Pick<LibrarySettings, 'sundayClosed' | 'holidays' | 'dueDateSkipsClosedDays'>): string {
  let due = addDays(issueDate, days)
  if (s.dueDateSkipsClosedDays) {
    let guard = 0
    while (isClosedDay(due, s) && guard++ < 60) due = addDays(due, 1)
  }
  return due
}

/** Chargeable overdue days between the due date and the return date. */
export function chargeableOverdueDays(
  dueDate: string,
  returnDate: string,
  graceDays: number,
  s: Pick<LibrarySettings, 'sundayClosed' | 'holidays' | 'skipClosedDaysInFines'>,
): number {
  const late = daysBetween(dueDate, returnDate)
  if (late <= graceDays) return 0
  let days = 0
  for (let i = graceDays + 1; i <= late; i++) {
    const d = addDays(dueDate, i)
    if (s.skipClosedDaysInFines && isClosedDay(d, s)) continue
    days++
  }
  return days
}

export function computeOverdueFine(
  dueDate: string,
  returnDate: string,
  policy: Pick<MemberPolicy, 'finePerDay' | 'maxFine' | 'graceDays'>,
  s: Pick<LibrarySettings, 'sundayClosed' | 'holidays' | 'skipClosedDaysInFines'>,
): { days: number; amount: number } {
  const days = chargeableOverdueDays(dueDate, returnDate, policy.graceDays, s)
  let amount = days * policy.finePerDay
  if (policy.maxFine > 0) amount = Math.min(amount, policy.maxFine)
  return { days, amount: Math.round(amount * 100) / 100 }
}

export function lostBookCharge(price: number, s: Pick<LibrarySettings, 'lostBookPolicy' | 'lostProcessingFee' | 'lostMultiplier'>): number {
  const p = Math.max(0, Number(price) || 0)
  switch (s.lostBookPolicy) {
    case 'price': return p
    case 'multiple': return Math.round(p * s.lostMultiplier * 100) / 100
    default: return p + s.lostProcessingFee
  }
}

// ─── Circulation decisions ────────────────────────────────
export function canIssue(args: {
  activeLoans: number
  unpaidFines: number
  policy: MemberPolicy
  settings: Pick<LibrarySettings, 'blockIssueAboveFine'>
  alreadyHasTitle?: boolean
}): { ok: boolean; reason?: string } {
  if (args.policy.maxBooks <= 0) return { ok: false, reason: 'This member type is not allowed to borrow.' }
  if (args.activeLoans >= args.policy.maxBooks) return { ok: false, reason: `Limit reached (${args.policy.maxBooks} books).` }
  if (args.settings.blockIssueAboveFine > 0 && args.unpaidFines > args.settings.blockIssueAboveFine) {
    return { ok: false, reason: `Unpaid fines ₹${args.unpaidFines} exceed ₹${args.settings.blockIssueAboveFine}.` }
  }
  if (args.alreadyHasTitle) return { ok: false, reason: 'Member already holds a copy of this title.' }
  return { ok: true }
}

export function canRenew(args: {
  renewals: number
  dueDate: string
  today: string
  policy: MemberPolicy
  waitingReservations: number
}): { ok: boolean; reason?: string } {
  if (args.renewals >= args.policy.maxRenewals) return { ok: false, reason: `Renewal limit reached (${args.policy.maxRenewals}).` }
  if (args.waitingReservations > 0) return { ok: false, reason: 'Another member has reserved this title.' }
  return { ok: true }
}

/** New due date on renewal: from the later of today and the current due date. */
export function renewedDueDate(currentDue: string, today: string, policy: MemberPolicy, s: Pick<LibrarySettings, 'sundayClosed' | 'holidays' | 'dueDateSkipsClosedDays'>): string {
  const base = currentDue > today ? currentDue : today
  return computeDueDate(base, policy.renewDays, s)
}

// ─── Identifiers ──────────────────────────────────────────
export function formatAccession(prefix: string, n: number, padding: number): string {
  return `${prefix || ''}${String(Math.max(0, Math.floor(n))).padStart(padding, '0')}`
}

export function normalizeIsbn(raw: string): string {
  return String(raw || '').toUpperCase().replace(/[^0-9X]/g, '')
}

export function isValidIsbn(raw: string): boolean {
  const s = normalizeIsbn(raw)
  if (s.length === 10) {
    if (!/^\d{9}[\dX]$/.test(s)) return false
    let sum = 0
    for (let i = 0; i < 10; i++) sum += (s[i] === 'X' ? 10 : Number(s[i])) * (10 - i)
    return sum % 11 === 0
  }
  if (s.length === 13) {
    if (!/^\d{13}$/.test(s)) return false
    let sum = 0
    for (let i = 0; i < 13; i++) sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3)
    return sum % 10 === 0
  }
  return false
}

export function isbn10to13(raw: string): string {
  const s = normalizeIsbn(raw)
  if (s.length !== 10) return s
  const core = `978${s.slice(0, 9)}`
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3)
  return core + ((10 - (sum % 10)) % 10)
}

// ─── Code 39 barcode (for spine / accession labels) ───────
// Each character: 9 elements (5 bars, 4 spaces), '1' = wide.
const CODE39: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000', '4': '000110001',
  '5': '100110000', '6': '001110000', '7': '000100101', '8': '100100100', '9': '001100100',
  A: '100001001', B: '001001001', C: '101001000', D: '000011001', E: '100011000', F: '001011000',
  G: '000001101', H: '100001100', I: '001001100', J: '000011100', K: '100000011', L: '001000011',
  M: '101000010', N: '000010011', O: '100010010', P: '001010010', Q: '000000111', R: '100000110',
  S: '001000110', T: '000010110', U: '110000001', V: '011000001', W: '111000000', X: '010010001',
  Y: '110010000', Z: '011010000', '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
  $: '010101000', '/': '010100010', '+': '010001010', '%': '000101010',
}

/**
 * Encode text as Code 39 bar/space widths (narrow = 1, wide = 3), with start/
 * stop '*' and a narrow gap between characters. Returns alternating
 * [bar, space, bar, …] widths. Unsupported characters throw.
 */
export function code39Widths(text: string, wide = 3): number[] {
  const payload = `*${String(text).toUpperCase()}*`
  const out: number[] = []
  for (let c = 0; c < payload.length; c++) {
    const pattern = CODE39[payload[c]]
    if (!pattern) throw new Error(`Character "${payload[c]}" cannot be encoded in Code 39`)
    for (let i = 0; i < 9; i++) out.push(pattern[i] === '1' ? wide : 1)
    if (c < payload.length - 1) out.push(1) // inter-character gap (a space)
  }
  return out
}

// ─── Status helpers ───────────────────────────────────────
export function loanState(dueDate: string, today: string): 'overdue' | 'due_soon' | 'ok' {
  const d = daysBetween(today, dueDate)
  if (d < 0) return 'overdue'
  if (d <= 2) return 'due_soon'
  return 'ok'
}
