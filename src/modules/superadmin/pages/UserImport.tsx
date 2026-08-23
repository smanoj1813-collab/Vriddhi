import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useColleges, useImportUsers } from '../hooks/useSuperAdmin'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import { Upload, ArrowLeft, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, Key } from 'lucide-react'
import { parseCSV, validateCSV, generateCSVTemplate } from '../../../shared/utils/parseCSV'
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
  const [showPasswords, setShowPasswords] = useState(false)

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
      showSuccess(`Successfully imported ${result.success} users`)
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
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-500/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{importResult.success}</p>
              <p className="text-xs text-slate-400">Successful</p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{importResult.failed}</p>
              <p className="text-xs text-slate-400">Failed</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{importResult.imported?.length || 0}</p>
              <p className="text-xs text-slate-400">Accounts Created</p>
            </div>
          </div>

          {/* Credentials Table */}
          {importResult.imported && importResult.imported.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-teal-400" />
                  <h3 className="text-white font-medium">Login Credentials Generated</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded bg-slate-700/50 transition-colors"
                  >
                    {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showPasswords ? 'Hide' : 'Show'} Passwords
                  </button>
                  <button
                    onClick={() => {
                      const headers = ['Email', 'Password', 'Document ID']
                      const rows = importResult.imported.map((item: any) => [
                        item.email,
                        item.password || '',
                        item.id,
                      ])
                      const csv = [
                        headers.join(','),
                        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                      ].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'student-credentials.csv'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="flex items-center gap-1 text-teal-400 hover:text-teal-300 text-sm px-3 py-1.5 rounded bg-teal-500/10 border border-teal-500/30 transition-colors"
                  >
                    <Download size={14} />
                    Download CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-700 max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-400 text-xs">Email</th>
                      <th className="px-3 py-2 text-left text-slate-400 text-xs">Password</th>
                      <th className="px-3 py-2 text-left text-slate-400 text-xs">Document ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {importResult.imported.map((item: any, i: number) => (
                      <tr key={i} className="bg-slate-900/50">
                        <td className="px-3 py-2 text-slate-300 text-xs">{item.email}</td>
                        <td className="px-3 py-2 text-teal-400 font-mono text-xs">
                          {showPasswords ? (item.password || '—') : '••••••••••'}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs font-mono truncate max-w-[200px]">
                          {item.id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importResult.errors && importResult.errors.length > 0 && (
            <div>
              <p className="text-sm text-red-400 mb-2">Errors:</p>
              <ul className="space-y-1">
                {importResult.errors.map((err: string, i: number) => (
                  <li key={i} className="text-xs text-red-400/70">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserImport
