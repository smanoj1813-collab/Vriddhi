// src/modules/office/utils/certificateEngine.ts
//
// Student certificate desk rules: bonafide/study, transfer, conduct,
// course-completion and fee-structure certificates — the daily
// office-counter paperwork of a degree college (bonafide + fee receipt
// are mandatory attachments for SSP/NSP scholarships, bus passes and
// education loans). Each college defines its types, prefixes and
// wording in colleges/{id}/config/certificates; requests live in
// colleges/{id}/certificateRequests. Pure + unit tested.

import { pronounsFor, renderTemplate } from '../../admin/utils/payrollEngine'

export type CertificateStatus = 'requested' | 'issued' | 'rejected' | 'cancelled'

export interface CertificateTypeDef {
  kind: string
  label: string
  prefix: string
  title: string
  bodyTemplate: string
  /** Ask for a purpose line (scholarship, bank loan, bus pass…). */
  needsPurpose: boolean
  /** Issue form collects fee head lines printed as a table (fee structure). */
  needsFeeLines: boolean
  /** Issue form collects a leaving reason + conduct remark (transfer). */
  needsLeavingReason: boolean
  enabled: boolean
}

export interface CertificateSettings {
  types: CertificateTypeDef[]
  allowStudentApply: boolean
  signatoryName: string
  signatoryDesignation: string
  note: string
}

export const CERTIFICATE_PLACEHOLDERS = [
  'name', 'regNo', 'programme', 'semester', 'batch', 'academicYear',
  'collegeName', 'collegeAddress', 'purpose', 'date', 'certificateNo',
  'salutation', 'pronoun', 'possessive', 'dateOfBirth', 'apaarId',
  'leavingReason', 'conduct',
] as const

export const DEFAULT_CERTIFICATE_SETTINGS: CertificateSettings = {
  allowStudentApply: true,
  signatoryName: '',
  signatoryDesignation: 'Principal',
  note: '',
  types: [
    {
      kind: 'bonafide', label: 'Bonafide / Study Certificate', prefix: 'BC', title: 'BONAFIDE CERTIFICATE',
      bodyTemplate:
        'This is to certify that {{salutation}} {{name}}, bearing Registration No. {{regNo}}, is a bonafide student of {{collegeName}}, studying in {{programme}}, Semester {{semester}}, during the academic year {{academicYear}}.\n\nThis certificate is issued at {{possessive}} request for the purpose of {{purpose}}.',
      needsPurpose: true, needsFeeLines: false, needsLeavingReason: false, enabled: true,
    },
    {
      kind: 'transfer', label: 'Transfer Certificate', prefix: 'TC', title: 'TRANSFER CERTIFICATE',
      bodyTemplate:
        'This is to certify that {{salutation}} {{name}}, Registration No. {{regNo}}, was a student of {{collegeName}} in {{programme}} (admitted in batch {{batch}}) and has left the college on {{date}}.\n\nReason for leaving: {{leavingReason}}.\n\n{{possessive}} conduct and character during the period of study in this institution was {{conduct}}. All dues to the college have been cleared as on the date of issue.',
      needsPurpose: false, needsFeeLines: false, needsLeavingReason: true, enabled: true,
    },
    {
      kind: 'conduct', label: 'Conduct Certificate', prefix: 'CC', title: 'CONDUCT CERTIFICATE',
      bodyTemplate:
        'This is to certify that {{salutation}} {{name}}, Registration No. {{regNo}}, is/was a student of {{collegeName}} in {{programme}}, Semester {{semester}}, during the academic year {{academicYear}}.\n\n{{possessive}} conduct and character during the period of study in this institution was {{conduct}}.',
      needsPurpose: true, needsFeeLines: false, needsLeavingReason: false, enabled: true,
    },
    {
      kind: 'course_completion', label: 'Course Completion Certificate', prefix: 'CCC', title: 'COURSE COMPLETION CERTIFICATE',
      bodyTemplate:
        'This is to certify that {{salutation}} {{name}}, Registration No. {{regNo}}, has successfully completed the {{programme}} programme at {{collegeName}} in the academic year {{academicYear}}.\n\nThis certificate is provisional and is issued pending the award of the degree by the affiliating university.',
      needsPurpose: false, needsFeeLines: false, needsLeavingReason: false, enabled: true,
    },
    {
      kind: 'fee_structure', label: 'Fee Structure Certificate', prefix: 'FSC', title: 'FEE STRUCTURE CERTIFICATE',
      bodyTemplate:
        'This is to certify that {{salutation}} {{name}}, Registration No. {{regNo}}, is a student of {{collegeName}} studying in {{programme}}, Semester {{semester}}, during the academic year {{academicYear}}.\n\nThe fee payable for the academic year is as per the particulars below. This certificate is issued for the purpose of {{purpose}}.',
      needsPurpose: true, needsFeeLines: true, needsLeavingReason: false, enabled: true,
    },
  ],
}

const cleanKind = (v: unknown) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '')
const cleanPrefix = (v: unknown, fallback: string) => String(v || fallback).trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') || fallback

export function normalizeCertificateSettings(raw: Record<string, unknown> | null | undefined): CertificateSettings {
  const r = raw || {}
  const d = DEFAULT_CERTIFICATE_SETTINGS
  const seen = new Set<string>()
  const types = Array.isArray(r.types)
    ? (r.types as Array<Record<string, unknown>>)
        .map(t => ({
          kind: cleanKind(t.kind || t.label),
          label: String(t.label || t.kind || '').trim(),
          prefix: cleanPrefix(t.prefix, 'CERT'),
          title: String(t.title || t.label || 'CERTIFICATE').trim().toUpperCase(),
          bodyTemplate: String(t.bodyTemplate || ''),
          needsPurpose: t.needsPurpose === true,
          needsFeeLines: t.needsFeeLines === true,
          needsLeavingReason: t.needsLeavingReason === true,
          enabled: t.enabled !== false,
        }))
        .filter(t => t.kind && t.label && t.bodyTemplate.trim() && !seen.has(t.kind) && seen.add(t.kind))
    : d.types
  return {
    types: types.length ? types : d.types,
    allowStudentApply: r.allowStudentApply !== false,
    signatoryName: typeof r.signatoryName === 'string' ? r.signatoryName : '',
    signatoryDesignation: typeof r.signatoryDesignation === 'string' && r.signatoryDesignation.trim() ? r.signatoryDesignation : 'Principal',
    note: typeof r.note === 'string' ? r.note : '',
  }
}

export function certificateType(settings: CertificateSettings, kind: string): CertificateTypeDef | undefined {
  return settings.types.find(t => t.kind === cleanKind(kind))
}

const TRANSITIONS: Record<CertificateStatus, CertificateStatus[]> = {
  requested: ['issued', 'rejected', 'cancelled'],
  issued: [],
  rejected: [],
  cancelled: [],
}

export function canTransitionCertificate(from: CertificateStatus, to: CertificateStatus): boolean {
  return (TRANSITIONS[from] || []).includes(to)
}

/**
 * Karnataka degree-college academic year label (June–May cycle):
 * 21 Oct 2026 → "2026-27"; 12 Mar 2027 → "2026-27".
 */
export function academicYearLabel(date = new Date()): string {
  const y = date.getMonth() >= 5 ? date.getFullYear() : date.getFullYear() - 1
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`
}

export interface CertificateStudent {
  name: string
  regNo: string
  programme: string
  semester: number | string
  batch: string
  gender?: string
  dateOfBirth?: string
  apaarId?: string
}

export interface IssueExtras {
  purpose: string
  leavingReason?: string
  conduct?: string
  feeLines?: Array<{ label: string; amount: number }>
}

/** Why this certificate cannot be issued yet, or null when it can. */
export function validateIssue(def: CertificateTypeDef, extras: IssueExtras): string | null {
  if (def.needsPurpose && !extras.purpose.trim()) return 'State the purpose (e.g. scholarship, education loan, bus pass).'
  if (def.needsLeavingReason && !String(extras.leavingReason || '').trim()) return 'State the reason for leaving.'
  if (def.needsFeeLines) {
    const lines = (extras.feeLines || []).filter(l => l.label.trim() && Number(l.amount) > 0)
    if (!lines.length) return 'Add at least one fee head with an amount.'
  }
  return null
}

export function certificateVars(args: {
  student: CertificateStudent
  collegeName: string
  collegeAddress?: string
  extras: IssueExtras
  certificateNo: string
  date: string
  on?: Date
}): Record<string, string> {
  const s = args.student
  const pr = pronounsFor(s.gender)
  return {
    name: s.name,
    regNo: s.regNo,
    programme: s.programme || '',
    semester: String(s.semester || ''),
    batch: s.batch || '',
    academicYear: academicYearLabel(args.on || new Date()),
    collegeName: args.collegeName || 'the college',
    collegeAddress: args.collegeAddress || '',
    purpose: args.extras.purpose || '',
    date: args.date,
    certificateNo: args.certificateNo,
    salutation: pr.salutation,
    pronoun: pr.pronoun,
    possessive: pr.possessive,
    dateOfBirth: s.dateOfBirth || '',
    apaarId: s.apaarId || '',
    leavingReason: args.extras.leavingReason || '',
    conduct: args.extras.conduct || 'Good',
  }
}

export function renderCertificateBody(def: CertificateTypeDef, vars: Record<string, string>): string {
  return renderTemplate(def.bodyTemplate, vars)
}

/** True when this student already has an open request of the same kind. */
export function hasOpenRequest<T extends { studentId: string; studentUid: string; kind: string; status: CertificateStatus }>(
  existing: T[], studentId: string, studentUid: string, kind: string,
): boolean {
  return existing.some(r => (r.studentId === studentId || (studentUid && r.studentUid === studentUid)) && r.kind === kind && r.status === 'requested')
}

export function feeLinesTotal(lines: Array<{ label: string; amount: number }> = []): number {
  return lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)
}
