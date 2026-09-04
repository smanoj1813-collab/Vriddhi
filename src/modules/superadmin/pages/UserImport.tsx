import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useColleges, useImportUsers } from '../hooks/useSuperAdmin'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import { Upload, ArrowLeft, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, Key } from 'lucide-react'
import { parseCSV, validateCSV, generateCSVTemplate } from '../../../shared/utils/parseCSV'
import CredentialsTable from '../components/CredentialsTable'
import type { College, ImportResult } from '../api/superAdminApi'

const UserImport: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedCollege, setSelectedCollege] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseWarnings, setParseWarnings] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [deliveryMode, setDeliveryMode] = useState<'temp-password' | 'reset-email'>('temp-password')

  const { data: collegesData, isLoading: collegesLoading } = useColleges({ status: 'all' })
  const importUsers = useImportUsers()

  const colleges = collegesData?.items || []

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setImportResult(null)
    setParseWarnings([])
    setValidationErrors([])

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = parseCSV(text, 'students')
        setParseWarnings(parsed.warnings)
        setPreviewData(parsed.rows)

        const validation = validateCSV(parsed, 'students')
        setValidationErrors(validation.errors)

        if (validation.validRows.length === 0 && parsed.rows.length > 0) {
          showError(`All ${parsed.rows.length} rows have validation errors. Check the error list below.`)
        }
      } catch (err: any) {
        showError(err.message || 'Failed to parse CSV')
        setPreviewData([])
      }
    }
    reader.readAsText(uploadedFile)
  }, [showError])

  const handleImport = async () => {
    if (!selectedCollege) {
      showError('Please select a college')
      return
    }
    if (previewData.length === 0) {
      showError('No valid data to import')
      return
    }

    setIsProcessing(true)
    try {
      const parsed = { headers: [], rows: previewData, rowCount: previewData.length, mappedHeaders: {}, unknownHeaders: [], warnings: [] }
      const validation = validateCSV(parsed, 'students')

      if (validation.validRows.length === 0) {
        showError('No valid rows to import. Please fix the errors shown above.')
        setIsProcessing(false)
        return
      }

      const result = await importUsers.mutateAsync({
        collegeId: selectedCollege,
        deliveryMode,
        users: validation.validRows.map((r: Record<string, string>) => ({
          name: r.name,
          email: r.email,
          role: 'student' as const,
          regNo: r.regNo || undefined,
          phone: r.phone || undefined,
          division: r.division || undefined,
          batch: r.batch || undefined,
          mentor: r.mentor || undefined,
          department: r.department || undefined,
          semester: r.semester ? parseInt(r.semester) : undefined,
          dob: r.dob || undefined,
          gender: r.gender || undefined,
          address: r.address || undefined,
        })),
      })
      setImportResult(result)
      const unverified = (result.imported || []).filter((r) => r.authVerified === false).length
      showSuccess(
        `Imported ${result.success} student account(s)` +
          (result.failed ? `, ${result.failed} failed` : '') +
          (unverified ? ` — ${unverified} NOT verified in Firebase Authentication` : '')
      )
    } catch (err: any) {
      showError(err.message || 'Import failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const csv = generateCSVTemplate('students')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Upload className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Import Users</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Bulk import students from CSV file</p>
          </div>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary">
          <Download className="w-4 h-4" /> Download Template
        </button>
      </div>

      {/* College Selection */}
      <div className="glass-card p-5 mb-6">
        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Select College</label>
        <select
          value={selectedCollege}
          onChange={e => setSelectedCollege(e.target.value)}
          className="input-field"
        >
          <option value="">{collegesLoading ? 'Loading colleges...' : 'Select a college...'}</option>
          {colleges.map((college: College) => (
            <option key={college.id} value={college.id}>{college.name} ({college.code})</option>
          ))}
        </select>
        {colleges.length === 0 && !collegesLoading && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">No colleges found. Please create a college first.</p>
        )}
      </div>

      {/* Credential delivery */}
      <div className="glass-card p-5 mb-6">
        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Credential delivery</label>
        <select
          value={deliveryMode}
          onChange={e => setDeliveryMode(e.target.value as 'temp-password' | 'reset-email')}
          className="input-field"
        >
          <option value="temp-password">Generate a one-time password (shown here once)</option>
          <option value="reset-email">Password-reset link (recommended: no shared secret)</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Either way the password is never written to Firestore. Rows the backend could not confirm in
          Firebase Authentication are flagged below.
        </p>
      </div>

      {/* File Upload */}
      <div className="glass-card p-5 mb-6">
        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Upload CSV File</label>
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-teal-500 dark:hover:border-teal-400 transition-colors">
          <FileSpreadsheet className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Drag and drop or click to upload</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">Supports: Student Name, Email Address, Registration Number, Phone Number, Division, Batch, Mentor Name, Department</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="btn-primary cursor-pointer">
            <Upload className="w-4 h-4" /> Select File
          </label>
          {file && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{file.name}</p>}
        </div>
      </div>

      {/* Parse Warnings */}
      {parseWarnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">CSV Parsing Notes</p>
          </div>
          <ul className="space-y-1">
            {parseWarnings.map((err, i) => (
              <li key={i} className="text-xs text-amber-600 dark:text-amber-400/80">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Validation Errors ({validationErrors.length})</p>
          </div>
          <div className="max-h-40 overflow-y-auto">
            <ul className="space-y-1">
              {validationErrors.map((err, i) => (
                <li key={i} className="text-xs text-red-600 dark:text-red-400/80">{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewData.length > 0 && (
        <div className="glass-card overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Preview ({previewData.length} rows)</h2>
            <div className="flex items-center gap-3">
              {validationErrors.length > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400">{validationErrors.length} errors found</span>
              )}
              <button
                onClick={handleImport}
                disabled={isProcessing || !selectedCollege || validationErrors.length === previewData.length}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Importing...' : 'Import Users'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/80">
                <tr className="text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Reg No</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-center px-4 py-3 font-medium">Division</th>
                  <th className="text-center px-4 py-3 font-medium">Batch</th>
                  <th className="text-left px-4 py-3 font-medium">Mentor</th>
                  <th className="text-left px-4 py-3 font-medium">Department</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 50).map((row, i) => {
                  const hasError = validationErrors.some(e => e.includes(`Row ${i + 2}:`))
                  return (
                    <tr key={i} className={`border-b border-slate-100 dark:border-slate-800 ${hasError ? 'bg-red-50 dark:bg-red-950/10' : ''}`}>
                      <td className="px-4 py-2 text-slate-900 dark:text-white">{row.name || '—'}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{row.email || '—'}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400 font-mono text-xs">{row.regNo || '—'}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{row.phone || '—'}</td>
                      <td className="px-4 py-2 text-center text-slate-600 dark:text-slate-400">{row.division || '—'}</td>
                      <td className="px-4 py-2 text-center text-slate-600 dark:text-slate-400">{row.batch || '—'}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{row.mentor || '—'}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{row.department || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {previewData.length > 50 && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-3">...and {previewData.length - 50} more rows</p>
            )}
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            {importResult.failed === 0 ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            )}
            <h2 className="text-lg font-semibold text-white">Import Complete</h2>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-500/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{importResult.success}</p>
              <p className="text-xs text-slate-400">Provisioned</p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{importResult.failed}</p>
              <p className="text-xs text-slate-400">Failed</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{importResult.authVerified ?? 0}</p>
              <p className="text-xs text-slate-400">Verified in Auth</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{(importResult.imported?.length || 0) + importResult.failed}</p>
              <p className="text-xs text-slate-400">Total Rows</p>
            </div>
          </div>

          <CredentialsTable
            rows={(importResult.imported || []).map((row) => ({
              email: row.email,
              name: row.name,
              role: row.role || 'student',
              docId: row.docId || row.id,
              uid: row.uid,
              password: row.password,
              resetLink: row.resetLink,
              status: row.status,
              authVerified: row.authVerified,
              delivery: row.delivery,
            }))}
            filename={`student-credentials-${new Date().toISOString().slice(0, 10)}`}
            title="Student login credentials"
          />

          {importResult.warnings && importResult.warnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Warnings</p>
              <ul className="space-y-1">
                {importResult.warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-amber-700/90 dark:text-amber-300/80 whitespace-pre-line">{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {(importResult.success ?? 0) === 0 && (importResult.failed ?? 0) === 0 && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mb-4">
              Nothing was created and nothing failed — the provisioning function did not run. Check the
              deployed Cloud Functions (they are deployed separately from hosting).
            </p>
          )}

          {importResult.errors && importResult.errors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-red-400 font-medium">Failed / Issues ({importResult.failed})</p>
                {importResult.failedStudents && importResult.failedStudents.length > 0 && (
                  <button
                    onClick={() => {
                      const list = importResult.failedStudents || []
                      const headers = ['Name', 'Email', 'Reg No', 'Reason']
                      const rows = list.map((f) => [f.name, f.email, f.regNo, f.reason])
                      const csv = [
                        headers.join(','),
                        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
                      ].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'student-import-failures.csv'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 transition-colors"
                  >
                    <Download size={14} />
                    Download Failed CSV
                  </button>
                )}
              </div>
              {importResult.failedStudents && importResult.failedStudents.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-red-900/50 max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-red-950/40 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-red-300 text-xs">Name</th>
                        <th className="px-3 py-2 text-left text-red-300 text-xs">Email</th>
                        <th className="px-3 py-2 text-left text-red-300 text-xs">Reg No</th>
                        <th className="px-3 py-2 text-left text-red-300 text-xs">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-900/40">
                      {importResult.failedStudents.map((f, i) => (
                        <tr key={i} className="bg-slate-900/50">
                          <td className="px-3 py-2 text-slate-300 text-xs">{f.name || '—'}</td>
                          <td className="px-3 py-2 text-slate-400 text-xs">{f.email || '—'}</td>
                          <td className="px-3 py-2 text-slate-500 text-xs font-mono">{f.regNo || '—'}</td>
                          <td className="px-3 py-2 text-red-300/90 text-xs">{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ul className="space-y-1">
                  {importResult.errors.map((err: string, i: number) => (
                    <li key={i} className="text-xs text-red-400/90 whitespace-pre-line">{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserImport
