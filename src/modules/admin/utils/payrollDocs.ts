// src/modules/admin/utils/payrollDocs.ts
//
// Pure mappers from payroll records → PDF models (payslip, salary
// certificate), shared by the admin Payroll page and the faculty "My Salary"
// page so both print identical documents.

import type { BrandingSettings } from '../api/financeApi'
import type { Payslip, SalaryCertificateRecord, SalaryStructure } from '../api/payrollApi'
import type { Letterhead, PayslipPdfModel, SalaryCertificatePdfModel } from '../../../shared/utils/financePdf'
import {
  amountInWords,
  formatINR,
  pronounsFor,
  type PayslipComputation,
  type SalaryCertificateSettings,
} from './payrollEngine'

export function monthLabel(key: string): string {
  const [y, m] = String(key || '').split('-').map(Number)
  if (!y || !m) return key
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function letterheadFrom(b: BrandingSettings): Letterhead {
  return {
    collegeName: b.collegeName || 'College',
    collegeCode: b.collegeCode || undefined,
    address: b.address || undefined,
    contact: [b.phone && `Ph: ${b.phone}`, b.email, b.website].filter(Boolean).join(' · ') || undefined,
    registrationLine: b.registrationLine || undefined,
  }
}

export function payslipToPdfModel(p: Payslip, branding: BrandingSettings, footer?: string): PayslipPdfModel {
  return {
    letterhead: letterheadFrom(branding),
    payslipNo: p.payslipNo,
    monthLabel: monthLabel(p.month),
    status: p.status,
    employee: {
      name: p.name,
      staffCode: p.staffCode,
      designation: p.designation,
      department: p.department,
      employmentType: p.employmentType,
      joiningDate: p.joiningDate,
      pan: p.pan,
      uan: p.uan,
      bankName: p.bankName,
      accountNo: p.accountNo,
    },
    daysInPeriod: p.daysInPeriod,
    paidDays: p.paidDays,
    lopDays: p.lopDays,
    earnings: p.earnings.map(l => ({ label: l.label, amount: l.amount })),
    deductions: p.deductions.map(l => ({ label: l.label, amount: l.amount })),
    gross: p.gross,
    totalDeductions: p.totalDeductions,
    net: p.net,
    netInWords: amountInWords(p.net),
    footer,
  }
}

function maskAccount(acc?: string): string {
  if (!acc) return ''
  return acc.length > 4 ? `XXXX${acc.slice(-4)}` : acc
}

/** Placeholder values for the certificate template. */
export function certificateVars(args: {
  structure: Pick<SalaryStructure, 'name' | 'staffCode' | 'designation' | 'department' | 'employmentType' | 'joiningDate' | 'gender' | 'pan' | 'bankName' | 'accountNo' | 'basic'>
  pay: Pick<PayslipComputation, 'gross' | 'net' | 'totalDeductions'>
  branding: BrandingSettings
  purpose: string
  certificateNo: string
  date: string
  salaryMonth: string
}): Record<string, string> {
  const { structure: s, pay, branding } = args
  const pr = pronounsFor(s.gender)
  return {
    name: s.name,
    staffCode: s.staffCode || '',
    designation: s.designation || 'Faculty',
    department: s.department || '',
    employmentType: (s.employmentType || '').replace(/_/g, ' ').toLowerCase(),
    joiningDate: s.joiningDate || '',
    collegeName: branding.collegeName || 'the college',
    collegeAddress: branding.address || '',
    basic: formatINR(s.basic),
    monthlyGross: formatINR(pay.gross),
    monthlyNet: formatINR(pay.net),
    monthlyDeductions: formatINR(pay.totalDeductions),
    annualGross: formatINR(pay.gross * 12),
    annualNet: formatINR(pay.net * 12),
    monthlyGrossWords: amountInWords(pay.gross),
    annualGrossWords: amountInWords(pay.gross * 12),
    purpose: args.purpose,
    date: args.date,
    certificateNo: args.certificateNo,
    pan: s.pan || '',
    bankName: s.bankName || '',
    accountNo: maskAccount(s.accountNo),
    salaryMonth: args.salaryMonth,
    pronoun: pr.pronoun,
    possessive: pr.possessive,
    salutation: pr.salutation,
  }
}

/** Next sequential certificate number for the year: SC/2026/0007. */
export function nextCertificateNo(prefix: string, existing: { certificateNo: string }[], year = new Date().getFullYear()): string {
  const p = (prefix || 'SC').trim().toUpperCase()
  const stem = `${p}/${year}/`
  let max = 0
  for (const e of existing) {
    if (!e.certificateNo.startsWith(stem)) continue
    const n = Number(e.certificateNo.slice(stem.length))
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${stem}${String(max + 1).padStart(4, '0')}`
}

export function certificateToPdfModel(rec: SalaryCertificateRecord, branding: BrandingSettings, settings?: Pick<SalaryCertificateSettings, 'signatoryName' | 'signatoryDesignation'>): SalaryCertificatePdfModel {
  return {
    letterhead: letterheadFrom(branding),
    title: rec.title || 'SALARY CERTIFICATE',
    certificateNo: rec.certificateNo,
    date: rec.issuedOn,
    body: rec.body,
    breakdown: rec.breakdown
      ? {
          earnings: rec.breakdown.earnings.map(l => ({ label: l.label, amount: l.amount })),
          deductions: rec.breakdown.deductions.map(l => ({ label: l.label, amount: l.amount })),
          gross: rec.breakdown.gross,
          net: rec.breakdown.net,
          monthLabel: rec.breakdown.monthLabel,
        }
      : undefined,
    signatoryName: rec.signatoryName || settings?.signatoryName || branding.signatoryName || undefined,
    signatoryDesignation: rec.signatoryDesignation || settings?.signatoryDesignation || undefined,
    fileTag: `${rec.name}-${rec.certificateNo}`,
  }
}
