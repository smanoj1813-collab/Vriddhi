// APAAR / ABC desk — a tab inside UUCMS Integration.
//
// Every student's APAAR ID (12 digits) must be on record before the
// university can upload their credits to NAD-ABC; some universities also
// block exam forms without it. This desk answers three questions:
//   1. How complete are we? (overall, per semester, per programme)
//   2. Who is missing / invalid / duplicated? (a workable named list,
//      with inline correction and a regNo→APAAR CSV import)
//   3. Give me the NAD-ABC file (published grade records joined to
//      APAAR IDs) — and tell me whose records were held back and why.
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, IdCard, Loader2, Save, Search, Upload } from 'lucide-react'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/Firebase/config'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { apaarCompleteness, apaarDuplicates, apaarWorklist, formatApaarId, isValidApaarId, normalizeApaarId } from '@/shared/utils/apaar'
import { downloadCsv } from '@/shared/utils/parseCSV'

interface StudentRow {
  id: string
  name: string
  regNo: string
  email: string
  semester: number
  course: string
  apaarId: string
}

interface SetResult { updated: number; total: number; results: Array<{ studentId: string; regNo: string; ok: boolean; error?: string }> }
interface NadRow {
  apaarId: string; studentName: string; registrationNo: string; dateOfBirth: string; gender: string
  programme: string; semester: number; courseCode: string; courseName: string; credits: number
  grade: string; gradePoint: number | ''; creditsEarned: number; result: string; examYear: string
}
interface NadResult {
  rows: NadRow[]
  skipped: Array<{ studentId: string; registrationNo: string; studentName: string; records: number }>
  publishedRecords: number
  studentsWithRecords: number
}

const setApaarFn = httpsCallable<{ entries: Array<{ studentId?: string; regNo?: string; apaarId: string }> }, SetResult>(functions, 'setStudentApaarIds')
const exportNadFn = httpsCallable<{ examYear: string; semester?: number }, NadResult>(functions, 'exportNadAbcRecords')

const NAD_HEADERS = ['APAAR ID', 'Student Name', 'Registration No', 'Date of Birth', 'Gender', 'Programme', 'Semester', 'Course Code', 'Course Name', 'Credits', 'Grade', 'Grade Point', 'Credits Earned', 'Result', 'Exam Year']

async function fetchStudents(collegeId: string): Promise<StudentRow[]> {
  const snap = await getDocs(query(collection(db, 'students'), where('collegeId', '==', collegeId), limit(5000)))
  return snap.docs.map(d => {
    const s = d.data() as Record<string, unknown>
    return {
      id: d.id,
      name: String(s.name || ''),
      regNo: String(s.regNo || ''),
      email: String(s.email || ''),
      semester: Number(s.semester) || 0,
      course: String(s.course || s.department || s.branch || ''),
      apaarId: String(s.apaarId || ''),
    }
  }).sort((a, b) => a.regNo.localeCompare(b.regNo))
}

export default function ApaarTab({ collegeId }: { collegeId: string }) {
  const qc = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'missing' | 'invalid' | 'ok'>('missing')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [examYear, setExamYear] = useState(String(new Date().getFullYear() - 1))
  const [examSemester, setExamSemester] = useState('')
  const [nadResult, setNadResult] = useState<NadResult | null>(null)
  const [importReport, setImportReport] = useState<string>('')

  const studentsQ = useQuery({ queryKey: ['apaarStudents', collegeId], queryFn: () => fetchStudents(collegeId), enabled: !!collegeId })
  const students = useMemo(() => studentsQ.data || [], [studentsQ.data])
  const completeness = useMemo(() => apaarCompleteness(students), [students])
  const worklist = useMemo(() => apaarWorklist(students), [students])
  const duplicates = useMemo(() => apaarDuplicates(students), [students])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter(s => {
      const id = normalizeApaarId(s.apaarId)
      if (filter === 'missing' && id) return false
      if (filter === 'invalid' && !(id && !isValidApaarId(id))) return false
      if (filter === 'ok' && !isValidApaarId(id)) return false
      if (q && !(s.name.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))) return false
      return true
    })
  }, [students, search, filter])

  const saveOne = useMutation({
    mutationFn: async (s: StudentRow) => {
      const apaarId = normalizeApaarId(drafts[s.id] ?? s.apaarId)
      if (apaarId && !isValidApaarId(apaarId)) throw new Error('APAAR/ABC ID must be 12 digits.')
      const res = await setApaarFn({ entries: [{ studentId: s.id, apaarId }] })
      const first = res.data.results[0]
      if (!first?.ok) throw new Error(first?.error || 'Could not save.')
    },
    onSuccess: () => { showSuccess('APAAR ID saved'); qc.invalidateQueries({ queryKey: ['apaarStudents', collegeId] }) },
    onError: (e: Error) => showError(e.message),
  })

  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) throw new Error('The file needs a header row and at least one data row.')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''))
      const regIdx = headers.findIndex(h => ['regno', 'registrationno', 'usn', 'rollno'].includes(h))
      const apaarIdx = headers.findIndex(h => ['apaarid', 'apaar', 'abcid', 'abc'].includes(h))
      if (regIdx < 0 || apaarIdx < 0) throw new Error('Expected columns: regNo (or USN) and apaarId (or ABC ID).')
      const entries: Array<{ regNo: string; apaarId: string }> = []
      let badRows = 0
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(c => c.trim())
        const regNo = cells[regIdx] || ''
        const apaarId = normalizeApaarId(cells[apaarIdx] || '')
        if (!regNo || !apaarId) continue
        if (!isValidApaarId(apaarId)) { badRows += 1; continue }
        entries.push({ regNo, apaarId })
      }
      if (!entries.length) throw new Error('No valid rows found (APAAR IDs must be 12 digits).')
      let updated = 0
      let failed = 0
      for (let i = 0; i < entries.length; i += 400) {
        const res = await setApaarFn({ entries: entries.slice(i, i + 400) })
        updated += res.data.updated
        failed += res.data.results.filter(r => !r.ok).length
      }
      return { updated, failed, badRows, total: entries.length }
    },
    onSuccess: r => {
      setImportReport(`Imported ${r.updated} of ${r.total} ID(s)${r.failed ? ` · ${r.failed} not matched to a student` : ''}${r.badRows ? ` · ${r.badRows} row(s) skipped (not 12 digits)` : ''}.`)
      showSuccess('APAAR import complete')
      qc.invalidateQueries({ queryKey: ['apaarStudents', collegeId] })
    },
    onError: (e: Error) => showError(e.message),
  })

  const exportNad = useMutation({
    mutationFn: async () => {
      const res = await exportNadFn({ examYear, ...(examSemester ? { semester: Number(examSemester) } : {}) })
      return res.data
    },
    onSuccess: data => {
      setNadResult(data)
      if (data.rows.length) {
        downloadCsv(
          `nad-abc-${examYear}${examSemester ? `-sem${examSemester}` : ''}.csv`,
          NAD_HEADERS,
          data.rows.map(r => [r.apaarId, r.studentName, r.registrationNo, r.dateOfBirth, r.gender, r.programme, r.semester, r.courseCode, r.courseName, r.credits, r.grade, r.gradePoint, r.creditsEarned, r.result, r.examYear]),
        )
        showSuccess(`NAD-ABC file downloaded — ${data.rows.length} course record(s)`)
      } else {
        showError('No uploadable records: either no published grades or no APAAR IDs on those students.')
      }
    },
    onError: (e: Error) => showError(e.message),
  })

  if (studentsQ.isLoading) return <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} /> Loading students…</div>

  const card = 'bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5'
  const input = 'w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-teal-500'

  return (
    <div className="grid gap-5">
      {/* Completeness */}
      <div className={card}>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400"><IdCard size={20} /></span>
            <div>
              <h3 className="font-bold">APAAR / ABC completeness</h3>
              <p className="text-xs text-slate-500 mt-0.5">The 12-digit ID your university needs to upload each student's credits to NAD-ABC.</p>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-black text-slate-900 dark:text-white">{completeness.percent}%</p>
            <p className="text-xs text-slate-500">{completeness.withValidId} of {completeness.total} students</p>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-4 overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${completeness.percent}%` }} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3"><p className="text-2xl font-black">{completeness.missing}</p><p className="text-xs text-slate-500">No APAAR ID yet</p></div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3"><p className="text-2xl font-black">{completeness.withInvalidId}</p><p className="text-xs text-slate-500">Invalid (not 12 digits)</p></div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3"><p className="text-2xl font-black">{duplicates.length}</p><p className="text-xs text-slate-500">Duplicate IDs (same ID on 2+ students)</p></div>
        </div>
        {(completeness.bySemester.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {completeness.bySemester.map(s => (
              <span key={s.semester} className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.percent === 100 ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
                Sem {s.semester || '—'}: {s.withValidId}/{s.total} ({s.percent}%)
              </span>
            ))}
          </div>
        )}
        {duplicates.length > 0 && (
          <p className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 mt-3"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> Duplicate APAAR IDs found ({duplicates.map(d => formatApaarId(d.apaarId)).join(', ')}) — correct them in the list below before exporting.</p>
        )}
      </div>

      {/* Bulk import */}
      <div className={card}>
        <h3 className="font-bold mb-1">Bulk-map APAAR IDs (CSV)</h3>
        <p className="text-xs text-slate-500 mb-3">Two columns: <span className="font-mono">regNo, apaarId</span>. Students can also add their own ID from Student Portal → Settings.</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer hover:bg-teal-500">
            {importCsv.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload CSV
            <input type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importCsv.mutate(f); e.target.value = '' }} />
          </label>
          <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex items-center gap-2" onClick={() => downloadCsv('apaar-mapping-template.csv', ['regNo', 'apaarId'], worklist.missing.slice(0, 5000).map(s => [s.regNo, '']))}>
            <Download size={14} /> Template with missing students ({worklist.missing.length})
          </button>
        </div>
        {importReport && <p className="text-xs text-teal-700 dark:text-teal-300 mt-3">{importReport}</p>}
      </div>

      {/* NAD export */}
      <div className={card}>
        <h3 className="font-bold mb-1">NAD-ABC credit export</h3>
        <p className="text-xs text-slate-500 mb-3">Builds the award file from <strong>published</strong> grade records for students with a valid APAAR ID. Review the columns against your university's current NAD template before uploading — credits are earned only on pass grades.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="text-xs font-bold text-slate-500">Exam year</label><input className={input} style={{ width: 110 }} value={examYear} onChange={e => setExamYear(e.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
          <div><label className="text-xs font-bold text-slate-500">Semester (optional)</label>
            <select className={input} style={{ width: 140 }} value={examSemester} onChange={e => setExamSemester(e.target.value)}>
              <option value="">All semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>Semester {n}</option>)}
            </select></div>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50" disabled={exportNad.isPending || examYear.length !== 4} onClick={() => exportNad.mutate()}>
            {exportNad.isPending ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Build & download CSV
          </button>
        </div>
        {nadResult && (
          <div className="mt-4 text-sm grid gap-2">
            <p className="flex items-center gap-2"><CheckCircle2 size={15} className="text-teal-500" /> {nadResult.rows.length} course record(s) exported from {nadResult.publishedRecords} published record(s).</p>
            {nadResult.skipped.length > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
                <p className="font-bold text-amber-800 dark:text-amber-200 text-xs">Held back — no valid APAAR ID ({nadResult.skipped.length} student(s)):</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{nadResult.skipped.slice(0, 25).map(s => `${s.studentName || s.registrationNo} (${s.records})`).join(', ')}{nadResult.skipped.length > 25 ? '…' : ''}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Worklist */}
      <div className={card}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-bold">Students</h3>
          <div className="flex gap-1.5 ml-auto">
            {([['missing', `Missing (${worklist.missing.length})`], ['invalid', `Invalid (${worklist.invalid.length})`], ['ok', `Mapped (${completeness.withValidId})`], ['all', 'All']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === id ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{label}</button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${input} pl-9`} placeholder="Search name, reg no, email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <th className="py-2 pr-3">Reg No</th><th className="py-2 pr-3">Student</th><th className="py-2 pr-3">Programme · Sem</th><th className="py-2 pr-3">APAAR ID</th><th className="py-2">Save</th>
            </tr></thead>
            <tbody>
              {visible.slice(0, 200).map(s => {
                const draft = drafts[s.id] ?? s.apaarId
                const valid = isValidApaarId(draft)
                const dirty = normalizeApaarId(draft) !== normalizeApaarId(s.apaarId)
                return (
                  <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2 pr-3 font-mono text-xs">{s.regNo}</td>
                    <td className="py-2 pr-3"><p className="font-semibold">{s.name}</p><p className="text-xs text-slate-500">{s.email}</p></td>
                    <td className="py-2 pr-3 text-xs">{s.course} · Sem {s.semester || '—'}</td>
                    <td className="py-2 pr-3">
                      <input className={`${input} font-mono text-xs ${draft && !valid ? '!border-rose-400' : ''}`} style={{ width: 170 }} inputMode="numeric" placeholder="12-digit APAAR ID"
                        value={draft} onChange={e => setDrafts(d => ({ ...d, [s.id]: e.target.value }))} />
                      {valid && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatApaarId(draft)}</p>}
                    </td>
                    <td className="py-2">
                      <button className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                        disabled={!dirty || (draft !== '' && !valid) || saveOne.isPending} onClick={() => saveOne.mutate(s)}>
                        <Save size={12} /> Save
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!visible.length && <p className="text-sm text-slate-500 py-6 text-center">No students in this view.</p>}
          {visible.length > 200 && <p className="text-xs text-slate-400 mt-3">Showing the first 200 — refine the search, or use the CSV import for bulk mapping.</p>}
        </div>
      </div>
    </div>
  )
}
