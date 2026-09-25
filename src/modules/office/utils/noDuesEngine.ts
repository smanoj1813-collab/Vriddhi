// src/modules/office/utils/noDuesEngine.ts
//
// No-dues (clearance) certificate rules. Each college defines its checklist
// in colleges/{id}/config/nodues — which offices must clear a student and
// which role owns each section. A request stores only the sections an
// office has acted on; everything else is "pending". Pure + unit tested.

export type SectionOwner = 'operations' | 'accounts' | 'hod' | 'principal'
/** Live checks the page can run for a section. */
export type AutoCheck = 'library' | 'fees' | 'none'

export interface NoDuesSectionDef {
  key: string
  label: string
  ownerRole: SectionOwner
  auto: AutoCheck
}

export interface NoDuesSettings {
  sections: NoDuesSectionDef[]
  purposes: string[]
  certificatePrefix: string
  allowStudentApply: boolean
  certificateNote: string
}

export const DEFAULT_NODUES_SETTINGS: NoDuesSettings = {
  sections: [
    { key: 'library', label: 'Library', ownerRole: 'operations', auto: 'library' },
    { key: 'accounts', label: 'Accounts / Fees', ownerRole: 'accounts', auto: 'fees' },
    { key: 'department', label: 'Department & Laboratory', ownerRole: 'hod', auto: 'none' },
    { key: 'stores', label: 'Stores / Sports', ownerRole: 'operations', auto: 'none' },
  ],
  purposes: ['Course completion', 'Transfer certificate', 'Discontinuation', 'Scholarship / loan', 'Hostel vacating'],
  certificatePrefix: 'NDC',
  allowStudentApply: true,
  certificateNote: 'This is to certify that the above student has no dues outstanding with any section of the college as on the date of issue.',
}

const OWNERS: SectionOwner[] = ['operations', 'accounts', 'hod', 'principal']
const AUTOS: AutoCheck[] = ['library', 'fees', 'none']

export function normalizeNoDuesSettings(raw: Record<string, unknown> | null | undefined): NoDuesSettings {
  const r = raw || {}
  const d = DEFAULT_NODUES_SETTINGS
  const seen = new Set<string>()
  const sections = Array.isArray(r.sections)
    ? (r.sections as Array<Record<string, unknown>>)
        .map(s => ({
          key: String(s?.key || s?.label || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
          label: String(s?.label || s?.key || '').trim(),
          ownerRole: (OWNERS.includes(s?.ownerRole as SectionOwner) ? s.ownerRole : 'operations') as SectionOwner,
          auto: (AUTOS.includes(s?.auto as AutoCheck) ? s.auto : 'none') as AutoCheck,
        }))
        .filter(s => s.key && s.label && !seen.has(s.key) && seen.add(s.key))
    : d.sections
  return {
    sections: sections.length ? sections : d.sections,
    purposes: Array.isArray(r.purposes) ? (r.purposes as unknown[]).map(String).filter(Boolean) : d.purposes,
    certificatePrefix: (typeof r.certificatePrefix === 'string' && r.certificatePrefix.trim() ? r.certificatePrefix : d.certificatePrefix).toUpperCase().replace(/[^A-Z0-9-]/g, '') || d.certificatePrefix,
    allowStudentApply: r.allowStudentApply !== false,
    certificateNote: typeof r.certificateNote === 'string' ? r.certificateNote : d.certificateNote,
  }
}

export type SectionStatus = 'pending' | 'cleared' | 'blocked'

export interface SectionState {
  status: SectionStatus
  note: string
  dues: number
  by: string
  at: string
}

export type NoDuesStatus = 'open' | 'cleared' | 'issued' | 'cancelled'

/** Merge stored section states with the college's checklist (missing ⇒ pending). */
export function effectiveSections(defs: NoDuesSectionDef[], stored: Record<string, Partial<SectionState>>): Array<NoDuesSectionDef & SectionState> {
  return defs.map(d => {
    const s = stored[d.key] || {}
    return { ...d, status: (s.status as SectionStatus) || 'pending', note: s.note || '', dues: Number(s.dues) || 0, by: s.by || '', at: s.at || '' }
  })
}

export function overallStatus(defs: NoDuesSectionDef[], stored: Record<string, Partial<SectionState>>): 'open' | 'cleared' {
  return effectiveSections(defs, stored).every(s => s.status === 'cleared') ? 'cleared' : 'open'
}

export function progress(defs: NoDuesSectionDef[], stored: Record<string, Partial<SectionState>>): { cleared: number; blocked: number; total: number } {
  const e = effectiveSections(defs, stored)
  return { cleared: e.filter(s => s.status === 'cleared').length, blocked: e.filter(s => s.status === 'blocked').length, total: e.length }
}

/**
 * May this user act on a section? Principal/superadmin: any. HOD/admin:
 * 'hod' sections of their own department only. Office roles: their own.
 */
export function canActOnSection(def: Pick<NoDuesSectionDef, 'ownerRole'>, role: string, userDept: string | undefined, studentDept: string): boolean {
  if (role === 'superadmin' || role === 'principal') return true
  if (def.ownerRole === 'hod') return (role === 'hod' || role === 'admin') && !!userDept && userDept.trim().toLowerCase() === studentDept.trim().toLowerCase()
  return def.ownerRole === role
}
