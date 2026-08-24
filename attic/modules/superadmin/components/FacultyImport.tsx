import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useColleges, useImportFaculty } from '../hooks/useSuperAdmin'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import { Upload, ArrowLeft, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, GraduationCap } from 'lucide-react'
import type { College, ImportResult } from '../api/superAdminApi'

interface FacultyImportRow {
  facultyId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  collegeName: string
  collegeCode: string
  department: string
  designation: string
  employmentType: string
  joiningDate: string
  qualification: string
  specialization: string
  subjectsUG: string
  subjectsPG: string
  experienceYears: string
  isHOD: string
}

// Map flexible CSV headers to internal fields
const HEADER_MAP: Record<string, string> = {
  'faculty id': 'facultyId',
  'facultyid': 'facultyId',
  'id': 'facultyId',
  'employee id': 'facultyId',
  'first name': 'firstName',
  'firstname': 'firstName',
  'name': 'firstName',
  'last name': 'lastName',
  'lastname': 'lastName',
  'surname': 'lastName',
  'email': 'email',
  'email address': 'email',
  'phone': 'phone',
  'phone number': 'phone',
  'mobile': 'phone',
  'contact': 'phone',
  'gender': 'gender',
  'sex': 'gender',
  'college name': 'collegeName',
  'college': 'collegeName',
  'institution': 'collegeName',
  'college code': 'collegeCode',
  'code': 'collegeCode',
  'department': 'department',
  'branch': 'department',
  'designation': 'designation',
  'post': 'designation',
  'role': 'designation',
  'employment type': 'employmentType',
  'type': 'employmentType',
  'job type': 'employmentType',
  'joining date': 'joiningDate',
  'date of joining': 'joiningDate',
  'doj': 'joiningDate',
  'qualification': 'qualification',
  'education': 'qualification',
  'degree': 'qualification',
  'specialization': 'specialization',
  'specialisation': 'specialization',
  'expertise': 'specialization',
  'subjects ug': 'subjectsUG',
  'ug subjects': 'subjectsUG',
  'undergraduate subjects': 'subjectsUG',
  'subjects pg': 'subjectsPG',
  'pg subjects': 'subjectsPG',
  'postgraduate subjects': 'subjectsPG',
  'experience years': 'experienceYears',
  'years of experience': 'experienceYears',
  'experience': 'experienceYears',
  'is hod': 'isHOD',
  'hod': 'isHOD',
  'head of department': 'isHOD',
}

const FacultyImport: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<FacultyImportRow[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedCollege, setSelectedCollege] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseErrors, setParseErrors] = useState<string[]>([])

  const { data: collegesData, isLoading: collegesLoading } = useColleges({ status: 'all' })
  const importFaculty = useImportFaculty()

  const colleges = collegesData?.items || []

  const parseCSV = (text: string): { rows: FacultyImportRow[]; errors: string[] } => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { rows: [], errors: ['Empty file'] }

    const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''))

    const headerMap: Record<number, string> = {}
    const unknownHeaders: string[] = []

    rawHeaders.forEach((h, idx) => {
      const mapped = HEADER_MAP[h]
      if (mapped) {
        headerMap[idx] = mapped
      } else {
        unknownHeaders.push(h)
      }
    })

    const errors: string[] = []
    if (unknownHeaders.length > 0) {
      errors.push(`Unknown columns ignored: ${unknownHeaders.join(', ')}`)
    }
    if (!rawHeaders.some(h => HEADER_MAP[h] === 'firstName')) {
      errors.push('Warning: No "First Name" column found')
    }
    if (!rawHeaders.some(h => HEADER_MAP[h] === 'email')) {
      errors.push('Warning: No "Email" column found')
    }
    if (!rawHeaders.some(h => HEADER_MAP[h] === 'collegeCode')) {
      errors.push('Warning: No "College Code" column found — college assignment required')
    }

    const rows: FacultyImportRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values: string[] = []
      let current = ''
      let inQuotes = false
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      if (values.length >= 3) {
        const row: any = {
          facultyId: '', firstName: '', lastName: '', email: '', phone: '',
          gender: '', collegeName: '', collegeCode: '', department: '',
          designation: '', employmentType: '', joiningDate: '', qualification: '',
          specialization: '', subjectsUG: '', subjectsPG: '', experienceYears: '',
          isHOD: 'FALSE',
        }
        values.forEach((val, idx) => {
          const field = headerMap[idx]
          if (field) {
            row[field] = val.replace(/^["']|["']$/g, '')
          }
        })
        rows.push(row)
      }
    }

    return { rows, errors }
  }

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setImportResult(null)
    setParseErrors([])

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const { rows, errors } = parseCSV(text)
      setPreviewData(rows)
      setParseErrors(errors)
    }
    reader.readAsText(uploadedFile)
  }, [])

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
      const validRows = previewData.filter(r => r.firstName && r.email && r.collegeCode)
      const result = await importFaculty.mutateAsync({
        collegeId: selectedCollege,
        faculty: validRows.map(r => ({
          facultyId: r.facultyId || undefined,
          firstName: r.firstName,
          lastName: r.lastName || undefined,
          email: r.email,
          phone: r.phone || undefined,
          gender: r.gender || undefined,
          collegeName: r.collegeName || undefined,
          collegeCode: r.collegeCode,
          department: r.department || undefined,
          designation: r.designation || 'Assistant Professor',
          employmentType: (r.employmentType as any) || 'FULL_TIME',
          joiningDate: r.joiningDate || undefined,
          qualification: r.qualification || undefined,
          specialization: r.specialization || undefined,
          subjectsUG: r.subjectsUG ? r.subjectsUG.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          subjectsPG: r.subjectsPG ? r.subjectsPG.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          experienceYears: r.experienceYears ? parseInt(r.experienceYears) || 0 : undefined,
          isHOD: r.isHOD?.toUpperCase() === 'TRUE',
        })),
      })
      setImportResult(result)
      showSuccess(`Successfully imported ${result.success} faculty members`)
    } catch (err: any) {
      showError(err?.message || 'Import failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const csv = `Faculty ID,First Name,Last Name,Email Address,Phone Number,Gender,College Name,College Code,Department,Designation,Employment Type,Joining Date,Qualification,Specialization,Subjects UG,Subjects PG,Experience Years,Is HOD
FAC001,Rajesh,Kumar,rajesh.kumar@srcc.edu,+91-9876543210,MALE,Shri Ram College of Commerce,SRCC,Commerce,Assistant Professor,FULL_TIME,2020-06-01,M.Com UGC-NET,Financial Accounting,BCom101 BCom102 BCom201,,8,FALSE
FAC002,Priya,Sharma,priya.sharma@xlri.ac.in,+91-9876543211,FEMALE,XLRI Jamshedpur,XLRI,Management,Associate Professor,FULL_TIME,2018-01-15,Ph.D. Finance MBA,Corporate Finance,,MBA501 MBA602 MBA701,12,FALSE
FAC003,Amitabh,Verma,amitabh.verma@nmims.edu,+91-9876543212,MALE,NMIMS Mumbai,NMIMS,Management,Professor,FULL_TIME,2010-03-10,Ph.D. Marketing MBA,Digital Marketing,BBA101 BBA201 BBA301,MBA501 MBA601,18,TRUE
FAC004,Sunita,Patel,sunita.patel@christuniversity.in,+91-9876543213,FEMALE,Christ University Bangalore,CHRIST,Finance,Lecturer,VISITING,2024-07-01,M.Com CFA Level 2,Financial Analysis,BScFin101 BScFin102,,4,FALSE
FAC005,Vikram,Rao,vikram.rao@symbiosis.edu,+91-9876543214,MALE,Symbiosis Pune,SYM,Commerce,Professor,ADJUNCT,2023-08-15,Ph.D. Taxation CA,Direct Indirect Taxation,,MCom501 MCom601 MCom701,22,FALSE
FAC006,Neha,Gupta,neha.gupta@amity.edu,+91-9876543215,FEMALE,Amity University Noida,AMITY,Management,Assistant Professor,FULL_TIME,2024-06-01,MBA UGC-NET,Human Resource Management,BBA101 BBA201,,2,FALSE`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'faculty-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <GraduationCap className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-bold text-white">Import Faculty</h1>
            </div>
            <p className="text-slate-400 text-sm">Bulk import faculty with college assignment and subject mapping</p>
          </div>
        </div>
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
          <Download className="w-4 h-4" /> Download Template
        </button>
      </div>

      {/* College Selection */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-6">
        <label className="block text-sm text-slate-400 mb-2">Select Target College</label>
        <select
          value={selectedCollege}
          onChange={e => setSelectedCollege(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">{collegesLoading ? 'Loading colleges...' : 'Select a college...'}</option>
          {colleges.map((college: College) => (
            <option key={college.id} value={college.id}>{college.name} ({college.code})</option>
          ))}
        </select>
        {colleges.length === 0 && !collegesLoading && (
          <p className="mt-2 text-xs text-yellow-400">No colleges found. Please create a college first.</p>
        )}
      </div>

      {/* File Upload */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-6">
        <label className="block text-sm text-slate-400 mb-2">Upload CSV File</label>
        <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-amber-500 transition-colors">
          <FileSpreadsheet className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-2">Drag and drop or click to upload</p>
          <p className="text-xs text-slate-500 mb-3">
            Supports: Faculty ID, First Name, Last Name, Email, Phone, Gender, College Code, Department, Designation, Employment Type, Joining Date, Qualification, Specialization, Subjects UG, Subjects PG, Experience, Is HOD
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="faculty-csv-upload"
          />
          <label htmlFor="faculty-csv-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> Select File
          </label>
          {file && <p className="mt-3 text-sm text-green-400">{file.name}</p>}
        </div>
      </div>

      {/* Parse Errors */}
      {parseErrors.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-medium text-yellow-400">CSV Parsing Notes</p>
          </div>
          <ul className="space-y-1">
            {parseErrors.map((err, i) => (
              <li key={i} className="text-xs text-yellow-400/80">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {previewData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Preview ({previewData.length} rows)</h2>
            <button
              onClick={handleImport}
              disabled={isProcessing || !selectedCollege}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
            >
              {isProcessing ? 'Importing...' : 'Import Faculty'}
            </button>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left px-4 py-3 font-medium">Faculty ID</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-center px-4 py-3 font-medium">College Code</th>
                  <th className="text-left px-4 py-3 font-medium">Department</th>
                  <th className="text-left px-4 py-3 font-medium">Designation</th>
                  <th className="text-left px-4 py-3 font-medium">UG Subjects</th>
                  <th className="text-left px-4 py-3 font-medium">PG Subjects</th>
                  <th className="text-center px-4 py-3 font-medium">HOD</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="px-4 py-2 text-slate-400 font-mono text-xs">{row.facultyId}</td>
                    <td className="px-4 py-2 text-white">{row.firstName} {row.lastName}</td>
                    <td className="px-4 py-2 text-slate-300">{row.email}</td>
                    <td className="px-4 py-2 text-slate-400">{row.phone}</td>
                    <td className="px-4 py-2 text-center text-amber-400 font-mono text-xs">{row.collegeCode}</td>
                    <td className="px-4 py-2 text-slate-400">{row.department}</td>
                    <td className="px-4 py-2 text-slate-400">{row.designation}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs max-w-[150px] truncate">{row.subjectsUG}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs max-w-[150px] truncate">{row.subjectsPG}</td>
                    <td className="px-4 py-2 text-center">
                      {row.isHOD?.toUpperCase() === 'TRUE' ? (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">HOD</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 50 && (
              <p className="text-center text-xs text-slate-500 py-3">...and {previewData.length - 50} more rows</p>
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
          <div className="grid grid-cols-3 gap-4">
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
              <p className="text-xs text-slate-400">Imported</p>
            </div>
          </div>
          {importResult.errors && importResult.errors.length > 0 && (
            <div className="mt-4">
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

export default FacultyImport
