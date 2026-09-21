import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle,
  Loader2, Database, GraduationCap, TrendingUp, Users, Award,
  FileText, BarChart3, Eye, RefreshCw
} from 'lucide-react';
import { parseResultFile, groupResultsByStudent, importResults, downloadResultTemplate } from '../api/resultImportApi';
import type { ResultImportPreview, ParsedResult } from '../types/resultImport';
import { checkBCUPassCriteria, getGradeFromMarks } from '@/shared/utils/bcuCompliance';

export default function ResultImporter() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'import' | 'preview' | 'history'>('import');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ResultImportPreview | null>(null);
  const [parsedResults, setParsedResults] = useState<ParsedResult[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; failed: number; errors: any[] } | null>(null);
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [examType, setExamType] = useState<'regular' | 'supplementary' | 'revaluation'>('regular');
  const [scheme, setScheme] = useState('SEP 2024');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setPreview(null);
    setParsedResults([]);
    setImportResult(null);

    try {
      const result = await parseResultFile(selectedFile);
      setPreview(result);
      const grouped = groupResultsByStudent(result.rows);
      setParsedResults(grouped);
      setActiveTab('preview');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedResults.length === 0) return;
    setIsImporting(true);
    try {
      const result = await importResults(parsedResults, academicYear, examType, scheme);
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['gradeRecords'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="text-teal-600" />
          University Result Importer
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Import BCU, BNU, Davangere, Rani Channamma results - Auto SGPA/CGPA, BCU Pass Criteria, Grade Records
        </p>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Database size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Beat Uniclare + Manual Entry</h3>
            <p className="text-sm text-teal-50 mt-1">
              Uniclare only showed results. Vriddhi auto-imports from university Excel, calculates SGPA/CGPA per NEP, checks BCU pass criteria (35% uni + 40% aggregate), creates official grade records, and notifies students.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-teal-100 uppercase font-bold">Auto SGPA</p>
                <p className="font-bold">Calculated</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-teal-100 uppercase font-bold">BCU Pass Check</p>
                <p className="font-bold">35% + 40%</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-teal-100 uppercase font-bold">Grade Records</p>
                <p className="font-bold">Auto Published</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-teal-100 uppercase font-bold">Time Saved</p>
                <p className="font-bold">~90% vs Manual</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'import', label: 'Import Results', icon: Upload },
          { id: 'preview', label: `Preview (${parsedResults.length} students)`, icon: Eye },
          { id: 'history', label: 'Import History', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Config */}
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold mb-4">Import Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Academic Year</label>
                <select
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option>2024-25</option>
                  <option>2023-24</option>
                  <option>2025-26</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Exam Type</label>
                <select
                  value={examType}
                  onChange={e => setExamType(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="regular">Regular</option>
                  <option value="supplementary">Supplementary</option>
                  <option value="revaluation">Revaluation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Scheme</label>
                <select
                  value={scheme}
                  onChange={e => setScheme(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option>SEP 2024</option>
                  <option>SEP 2024-25</option>
                  <option>NEP 2020</option>
                  <option>CBCS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload */}
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Upload University Result File</h3>
              <button
                onClick={downloadResultTemplate}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                <Download size={14} />
                Download Template
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Upload Excel/CSV from University</h4>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                BCU/BNU portal export or manual Excel with regNo, subjectCode, internal, external, total, grade
              </p>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="result-file" />
              <label
                htmlFor="result-file"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold cursor-pointer"
              >
                <Upload size={16} />
                Choose Excel/CSV
              </label>
              {file && (
                <p className="text-sm text-teal-600 font-medium mt-3">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB) {isParsing && '- Parsing...'}
                </p>
              )}
              {isParsing && <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mt-3" />}
            </div>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm">Expected Columns</h4>
              <p className="text-xs font-mono bg-white dark:bg-slate-900 p-3 rounded-xl mt-2 overflow-x-auto">
                regNo, name, semester, subjectCode, subjectName, credits, internal (0-20), external (0-80), total (0-100), grade (O,A+,A,B+...), gradePoint, result (P/F), course, batch, sgpa
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-2">
                • internal+external auto-calculated to total if total missing<br />
                • grade/gradePoint auto-calculated from total if missing<br />
                • BCU pass check: 35% in external (28/80) + 40% aggregate<br />
                • SGPA auto-calculated from credits × gradePoint
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="space-y-6">
          {!preview ? (
            <div className="text-center py-12 bg-white dark:bg-[#131b2e] rounded-2xl border border-dashed">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold">No file uploaded yet</p>
              <p className="text-sm text-slate-500">Go to Import tab and upload Excel/CSV</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users size={18} className="text-blue-600" />
                    <span className="text-xs font-bold uppercase text-slate-500">Students</span>
                  </div>
                  <p className="text-2xl font-black">{preview.summary.uniqueStudents}</p>
                  <p className="text-xs text-slate-500">{preview.summary.totalSubjects} subject entries</p>
                </div>
                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle size={18} className="text-emerald-600" />
                    <span className="text-xs font-bold uppercase text-slate-500">Pass %</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-600">{preview.summary.passPercentage.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500">{preview.summary.passCount} pass, {preview.summary.failCount} fail</p>
                </div>
                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp size={18} className="text-teal-600" />
                    <span className="text-xs font-bold uppercase text-slate-500">Avg Marks</span>
                  </div>
                  <p className="text-2xl font-black">{preview.summary.averageMarks.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">Out of 100</p>
                </div>
                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle size={18} className={preview.errors.length > 0 ? 'text-rose-600' : 'text-emerald-600'} />
                    <span className="text-xs font-bold uppercase text-slate-500">Errors</span>
                  </div>
                  <p className={`text-2xl font-black ${preview.errors.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{preview.errors.length}</p>
                  <p className="text-xs text-slate-500">{preview.warnings.length} warnings</p>
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h3 className="font-bold mb-3">Grade Distribution</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(preview.summary.gradeDistribution).map(([grade, count]) => (
                    <span key={grade} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-bold border">
                      {grade}: {count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4">
                  <h4 className="font-bold text-rose-900 dark:text-rose-100 text-sm">Errors ({preview.errors.length})</h4>
                  <div className="max-h-32 overflow-y-auto mt-2 space-y-1">
                    {preview.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-rose-700 dark:text-rose-300">Row {err.rowNumber}: {err.message}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Parsed Results Preview */}
              <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold">Parsed Results - Student Wise (SGPA Calculated)</h3>
                  <span className="text-xs text-slate-500">{parsedResults.length} students</span>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 border-b sticky top-0">
                      <tr className="text-left text-xs font-bold uppercase text-slate-500">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Reg No</th>
                        <th className="py-3 px-4">Subjects</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">%</th>
                        <th className="py-3 px-4">SGPA</th>
                        <th className="py-3 px-4">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedResults.slice(0, 20).map((result, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-medium">{result.studentName}</td>
                          <td className="py-3 px-4 font-mono text-xs">{result.regNo}</td>
                          <td className="py-3 px-4">{result.subjects.length} subs</td>
                          <td className="py-3 px-4">{result.totalMarks}/{result.maxTotalMarks}</td>
                          <td className="py-3 px-4">{result.percentage.toFixed(1)}%</td>
                          <td className="py-3 px-4 font-bold text-teal-600">{result.sgpa.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              result.result === 'PASS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              result.result === 'ATKT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {result.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Button */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setActiveTab('import')}
                  className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                >
                  Back to Import
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting || preview.errors.length > 5}
                  className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                  {isImporting ? 'Importing...' : `Import ${parsedResults.length} Students - Auto Publish Grade Records`}
                </button>
              </div>

              {importResult && (
                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="text-emerald-600" size={20} />
                    Import Completed
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
                      <p className="text-2xl font-black text-emerald-600">{importResult.imported}</p>
                      <p className="text-xs">Imported</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                      <p className="text-2xl font-black text-blue-600">{importResult.updated}</p>
                      <p className="text-xs">Updated</p>
                    </div>
                    <div className="text-center p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                      <p className="text-2xl font-black text-rose-600">{importResult.failed}</p>
                      <p className="text-xs">Failed</p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto bg-rose-50 dark:bg-rose-950/20 rounded-xl p-3">
                      {importResult.errors.map((err: any, idx: number) => (
                        <p key={idx} className="text-xs text-rose-700">{err.regNo}: {err.message}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold">Import History</p>
          <p className="text-sm text-slate-500 mt-1">Previous imports will appear here with stats: pass %, avg SGPA, grade distribution</p>
        </div>
      )}
    </div>
  );
}
