// Scholarship desk — domain model (pure, unit-tested).
//
// For Karnataka degree colleges the yearly scholarship cycle is: student
// applies on SSP (State Scholarship Portal) or NSP → the college verifies
// / e-attests the application → the department sanctions → money reaches
// the student's Aadhaar-seeded bank account via DBT. Colleges lose
// students' scholarships mostly to missed last dates and un-verified
// applications, so this desk tracks every application through that
// pipeline and keeps an "eligible but not applied" worklist.

export type ScholarshipPortal = 'SSP' | 'NSP' | 'College' | 'Private' | 'Other'

export interface ScholarshipScheme {
  id: string
  name: string
  portal: ScholarshipPortal
  /** Social categories this scheme serves; empty = everyone. */
  categories: string[]
  /** Max annual family income in ₹ (0 = no income limit published). */
  incomeLimit: number
  /** Portal last date (yyyy-mm-dd) for this academic year; '' = unset. */
  lastDate: string
  enabled: boolean
}

export interface ScholarshipSettings {
  schemes: ScholarshipScheme[]
  /** Institute nodal officer name shown to students. */
  nodalOfficer: string
  allowStudentApply: boolean
}

export const SCHOLARSHIP_CATEGORIES = ['SC', 'ST', 'Cat-I', 'IIA', 'IIB', 'IIIA', 'IIIB', 'Minority', 'EWS', 'General'] as const

export const DEFAULT_SCHOLARSHIP_SETTINGS: ScholarshipSettings = {
  nodalOfficer: '',
  allowStudentApply: true,
  schemes: [
    { id: 'ssp-postmatric-scst', name: 'SSP Post-Matric Scholarship (SC/ST)', portal: 'SSP', categories: ['SC', 'ST'], incomeLimit: 250000, lastDate: '', enabled: true },
    { id: 'ssp-fee-concession-obc', name: 'SSP Fee Concession (OBC — Cat I, IIA, IIB, IIIA, IIIB)', portal: 'SSP', categories: ['Cat-I', 'IIA', 'IIB', 'IIIA', 'IIIB'], incomeLimit: 100000, lastDate: '', enabled: true },
    { id: 'ssp-minority', name: 'SSP Minority Scholarship', portal: 'SSP', categories: ['Minority'], incomeLimit: 250000, lastDate: '', enabled: true },
    { id: 'nsp-csss', name: 'NSP Central Sector Scheme (CSSS)', portal: 'NSP', categories: [], incomeLimit: 450000, lastDate: '', enabled: true },
    { id: 'nsp-pms', name: 'NSP Post-Matric Scholarship', portal: 'NSP', categories: ['SC', 'ST', 'Cat-I', 'IIA', 'IIB', 'IIIA', 'IIIB', 'Minority'], incomeLimit: 250000, lastDate: '', enabled: true },
    { id: 'nsp-merit-minority', name: 'NSP Merit-cum-Means (Minority)', portal: 'NSP', categories: ['Minority'], incomeLimit: 250000, lastDate: '', enabled: true },
  ],
}

export type ScholarshipStatus =
  | 'applied'            // student submitted on the portal / to the office
  | 'verified'           // college verified / e-attested
  | 'forwarded'          // sent to district/department (where applicable)
  | 'sanctioned'         // approved by the department
  | 'disbursed'          // DBT received in the student's bank account
  | 'rejected'
  | 'withdrawn'

export const SCHOLARSHIP_STATUS_LABELS: Record<ScholarshipStatus, string> = {
  applied: 'Applied — awaiting college verification',
  verified: 'Verified / e-attested by college',
  forwarded: 'Forwarded to department',
  sanctioned: 'Sanctioned',
  disbursed: 'Disbursed (DBT received)',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export const SCHOLARSHIP_NEXT: Record<ScholarshipStatus, ScholarshipStatus[]> = {
  applied: ['verified', 'rejected', 'withdrawn'],
  verified: ['forwarded', 'sanctioned', 'rejected', 'withdrawn'],
  forwarded: ['sanctioned', 'rejected', 'withdrawn'],
  sanctioned: ['disbursed', 'withdrawn'],
  disbursed: [],
  rejected: [],
  withdrawn: [],
}

/** Documents a student must keep ready (SSP/NSP standard checklist). */
export const SCHOLARSHIP_DOCUMENTS: { key: string; label: string }[] = [
  { key: 'aadhaar', label: 'Aadhaar card copy' },
  { key: 'aadhaarBankSeeded', label: 'Bank account seeded with Aadhaar (for DBT)' },
  { key: 'incomeCertificate', label: 'Income certificate (valid for this year)' },
  { key: 'casteCertificate', label: 'Caste certificate (if applicable)' },
  { key: 'previousMarksCard', label: 'Previous year/semester marks card' },
  { key: 'bonafide', label: 'Bonafide / study certificate from college' },
  { key: 'feeReceipt', label: 'Current year fee receipt' },
  { key: 'bankPassbook', label: 'Bank passbook first page / cancelled cheque' },
]

const str = (v: unknown) => String(v ?? '').trim()
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const bool = (v: unknown) => v === true || v === 'true'
const slug = (v: unknown) => str(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

export function normalizeScholarshipSettings(raw: unknown): ScholarshipSettings {
  const base = structuredClone(DEFAULT_SCHOLARSHIP_SETTINGS)
  if (!raw || typeof raw !== 'object') return base
  const d = raw as Record<string, unknown>
  const out: ScholarshipSettings = {
    nodalOfficer: str(d.nodalOfficer).slice(0, 80),
    allowStudentApply: d.allowStudentApply === undefined ? true : bool(d.allowStudentApply),
    schemes: base.schemes,
  }
  if (Array.isArray(d.schemes) && d.schemes.length) {
    out.schemes = (d.schemes as Record<string, unknown>[]).slice(0, 40).map(s => ({
      id: slug(s.id) || slug(s.name) || `scheme-${Math.random().toString(36).slice(2, 7)}`,
      name: str(s.name).slice(0, 120) || 'Untitled scheme',
      portal: (['SSP', 'NSP', 'College', 'Private', 'Other'].includes(str(s.portal)) ? str(s.portal) : 'Other') as ScholarshipPortal,
      categories: Array.isArray(s.categories) ? (s.categories as unknown[]).map(str).filter(Boolean).slice(0, 12) : [],
      incomeLimit: Math.max(0, Math.round(num(s.incomeLimit))),
      lastDate: /^\d{4}-\d{2}-\d{2}$/.test(str(s.lastDate)) ? str(s.lastDate) : '',
      enabled: s.enabled === undefined ? true : bool(s.enabled),
    })).filter(s => s.name)
    if (!out.schemes.length) out.schemes = base.schemes
  }
  return out
}

export function schemeById(settings: ScholarshipSettings, id: string): ScholarshipScheme | undefined {
  return settings.schemes.find(s => s.id === id)
}

/**
 * Is this student plausibly eligible for the scheme? Used for the
 * "eligible but not applied" worklist — deliberately permissive (unknown
 * category/income counts as "check with student", not as ineligible).
 */
export function isLikelyEligible(
  scheme: ScholarshipScheme,
  student: { category?: string; annualIncome?: number },
): 'eligible' | 'unlikely' | 'unknown' {
  const cat = str(student.category)
  if (scheme.categories.length && cat) {
    const match = scheme.categories.some(c => c.toLowerCase() === cat.toLowerCase())
    if (!match) return 'unlikely'
  }
  const income = num(student.annualIncome)
  if (scheme.incomeLimit > 0 && income > 0 && income > scheme.incomeLimit) return 'unlikely'
  if ((scheme.categories.length && !cat) || (scheme.incomeLimit > 0 && income <= 0)) return 'unknown'
  return 'eligible'
}

/** Days until the scheme's last date (negative = overdue, null = unset). */
export function daysToDeadline(scheme: ScholarshipScheme, today = new Date()): number | null {
  if (!scheme.lastDate) return null
  const [y, m, d] = scheme.lastDate.split('-').map(Number)
  const due = new Date(y, (m || 1) - 1, d || 1)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((due.getTime() - start.getTime()) / 86_400_000)
}

export function validateApplication(input: {
  schemeId: string
  academicYear: string
  applicationNo: string
}): string[] {
  const errors: string[] = []
  if (!str(input.schemeId)) errors.push('Choose a scholarship scheme.')
  if (!/^\d{4}-\d{2}$/.test(str(input.academicYear))) errors.push('Academic year must look like 2026-27.')
  if (str(input.applicationNo).length > 60) errors.push('Application number looks too long.')
  return errors
}

/** One live application per student per scheme per academic year. */
export function hasDuplicateApplication(
  existing: { schemeId: string; academicYear: string; status: ScholarshipStatus }[],
  schemeId: string, academicYear: string,
): boolean {
  return existing.some(a => a.schemeId === schemeId && a.academicYear === academicYear && !['rejected', 'withdrawn'].includes(a.status))
}

/** June–May academic year (2026-06 → 2026-27). */
export function academicYearOf(date = new Date()): string {
  const start = date.getMonth() >= 5 ? date.getFullYear() : date.getFullYear() - 1
  return `${start}-${String(start + 1).slice(2)}`
}
