import React from 'react'
import { Download } from 'lucide-react'

import { downloadCsv } from '../../../shared/utils/parseCSV'
import type { ValidationResult } from '../../../shared/utils/parseCSV'
import type { ImportResult } from '../types/superAdmin'

/**
 * Counts and export buttons for a bulk import.
 *
 * Both import pages previously buried the outcome in a list of strings, so a
 * file that lost most of its rows gave no way to find out which ones or why.
 * This renders the same breakdown everywhere and, more importantly, produces
 * three CSVs: what was rejected before sending, what the server rejected, and
 * what landed — the last carrying the generated one-time password.
 */
export interface ImportExportsProps {
  /** Rows read from the uploaded file, before any validation. */
  uploadedCount: number
  /** Result of the pre-flight check, or null if the file has not been parsed. */
  preflight: ValidationResult | null
  /** Result of the provisioning call, or null before an import has run. */
  result: ImportResult | null
  /** Filename prefix, e.g. 'student' or 'faculty'. */
  filePrefix: string
  /**
   * The original uploaded rows. Used to recover columns the result object does
   * not carry (registration number, phone) when exporting successes.
   */
  uploadedRows?: Record<string, string>[]
  /** Which uploaded column holds the per-person identifier. */
  idField?: string
}

const stamp = () => new Date().toISOString().slice(0, 10)

export const ImportExports: React.FC<ImportExportsProps> = ({
  uploadedCount,
  preflight,
  result,
  filePrefix,
  uploadedRows = [],
  idField = 'regNo',
}) => {
  if (!result) return null

  const validationFailures = preflight?.invalidRows || []
  const importFailures = result.failedRows || []
  const imported = result.imported || []

  const uploadedByEmail = new Map(
    uploadedRows.map((r) => [String(r.email || '').trim().toLowerCase(), r] as const)
  )

  const exportValidationFailures = () => {
    if (validationFailures.length === 0) return
    downloadCsv(
      `${filePrefix}-validation-failed-${stamp()}.csv`,
      ['Row', 'Name', 'Email', idField, 'Phone', 'Reasons'],
      validationFailures.map((r) => [
        r.rowNumber,
        r.row.name,
        r.row.email,
        r.row[idField],
        r.row.phone,
        r.reasons.join('; '),
      ])
    )
  }

  const exportImportFailures = () => {
    if (importFailures.length === 0) return
    downloadCsv(
      `${filePrefix}-import-failed-${stamp()}.csv`,
      ['Name', 'Email', idField, 'Reason'],
      importFailures.map((f) => [f.name, f.email, f.regNo, f.reason])
    )
  }

  /**
   * Includes the generated one-time password. This file is a credential dump:
   * it exists because distributing logins is the point of a bulk import, and
   * should be deleted once it has served that purpose.
   */
  const exportSuccessful = () => {
    if (imported.length === 0) return
    downloadCsv(
      `${filePrefix}-import-successful-${stamp()}.csv`,
      ['Name', 'Email', idField, 'Phone', 'UID', 'Status', 'Temporary Password', 'Reset Link', 'Auth Verified'],
      imported.map((r) => {
        const original = uploadedByEmail.get(String(r.email || '').trim().toLowerCase())
        return [
          r.name || original?.name,
          r.email,
          original?.[idField],
          original?.phone,
          r.uid || r.id,
          r.status,
          r.password,
          r.resetLink,
          r.authVerified === false ? 'NO' : 'yes',
        ]
      })
    )
  }

  const card = (value: number, label: string, tone: string) => (
    <div className={`${tone} rounded-lg p-4 text-center`}>
      <p className={`text-2xl font-bold ${tone.replace('/10', '-400')}`}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )

  const button = (
    onClick: () => void,
    disabled: boolean,
    label: string,
    count: number,
    tone: string
  ) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border ${tone} disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
    >
      <Download size={14} />
      {label} ({count})
    </button>
  )

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {card(uploadedCount, 'Rows Uploaded', 'bg-blue-500/10')}
        {card(validationFailures.length, 'Rejected Pre-check', 'bg-amber-500/10')}
        {card(result.success ?? 0, 'Provisioned', 'bg-green-500/10')}
        {card(result.failed ?? 0, 'Failed', 'bg-red-500/10')}
        {card(result.authVerified ?? 0, 'Verified in Auth', 'bg-emerald-500/10')}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {button(exportValidationFailures, validationFailures.length === 0, 'Validation Failed', validationFailures.length, 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20')}
        {button(exportImportFailures, importFailures.length === 0, 'Import Failed', importFailures.length, 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20')}
        {button(exportSuccessful, imported.length === 0, 'Successful + Passwords', imported.length, 'bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20')}
      </div>

      {result.skipped ? (
        <p className="text-xs text-slate-400 mt-2">
          {result.skipped} row(s) were left unchanged because a working account already existed.
        </p>
      ) : null}
    </div>
  )
}

export default ImportExports
