// src/pages/admin/CollegeOnboarding.tsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useNotification } from '../../../shared/providers/NotificationProvider';
import { useAuth } from '../../auth/context/AuthContext';
import { importUsers, importFaculty } from '../../superadmin/api/superAdminApi';
import CredentialsTable from '../../superadmin/components/CredentialsTable';
import {
  describeIdentityError,
  type CredentialRow,
} from '@/shared/services/identityBackend';
import {
  Upload,
  Download,
  FileText,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Trash2,
  Eye,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import {
  STUDENT_TEMPLATE,
  FACULTY_TEMPLATE,
  SCHEDULE_TEMPLATE,
  ASSESSMENT_TEMPLATE,
  downloadTemplate,
  parseCSV,
  type ParseResult,
} from '../services/onboardingService';
import type { UploadTemplate, OnboardingError, TemplateField } from '../types/onboarding';

const TABS = [
  { id: 'students', label: 'Students', icon: Users, template: STUDENT_TEMPLATE, importable: true },
  { id: 'faculty', label: 'Faculty', icon: GraduationCap, template: FACULTY_TEMPLATE, importable: true },
  { id: 'schedule', label: 'Class Schedule', icon: FileText, template: SCHEDULE_TEMPLATE, importable: false },
  { id: 'assessments', label: 'Assessments', icon: FileText, template: ASSESSMENT_TEMPLATE, importable: false },
];

export default function CollegeOnboarding() {
  const { showInfo, showSuccess } = useNotification();
  const [activeTab, setActiveTab] = useState('students');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult<Record<string, string>> | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTab = TABS.find(t => t.id === activeTab)!;
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [credentialRows, setCredentialRows] = useState<CredentialRow[]>([]);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsParsing(true);
    setParseResult(null);

    const result = await parseCSV(file, currentTab.template);
    setParseResult(result);
    setIsParsing(false);
    setShowPreview(true);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(currentTab.template);
  };

  /**
   * This button used to be a `showInfo(...)` toast in front of a `TODO: Call API`
   * comment. An admin could watch "Processing 240 students..." appear, close the
   * tab, and find nothing in Firestore and nothing in Authentication — which is
   * indistinguishable from "the upload is broken". It is now wired to the same
   * identity callables the superadmin importers use, so an Auth account, the
   * role/college claims and the profile document are created together.
   *
   * Schedules and assessments have no bulk importer on the platform yet, so they
   * stay a validation-only preview rather than pretending to import.
   */
  const handleProcessUpload = async () => {
    if (!parseResult?.valid || !currentTab.importable) return;
    if (!user?.collegeId) {
      setImportError(
        'No college is attached to your account, so nothing can be imported. Sign out and back in to ' +
          'refresh the session, and if it persists ask a superadmin to run Access Control → Identity repair.'
      );
      return;
    }
    setImporting(true);
    setImportError(null);
    setCredentialRows([]);
    setImportSummary(null);
    try {
      const rows = parseResult.data as Record<string, string>[];
      const result =
        activeTab === 'students'
          ? await importUsers({
              collegeId: user.collegeId,
              // Reset links by default: the person setting up a college should not
              // be reading passwords off a screen they might screenshot.
              deliveryMode: 'reset-email',
              users: rows.map(row => ({
                name: row.name || row.fullName || '',
                email: (row.email || '').trim().toLowerCase(),
                regNo: row.regNo || row.registrationNumber || undefined,
                role: 'student' as const,
                batch: row.batch || undefined,
                division: row.division || undefined,
                phone: row.phone || undefined,
                department: row.department || undefined,
                semester: row.semester ? Number(row.semester) : undefined,
                dob: row.dateOfBirth || undefined,
                gender: row.gender || undefined,
              })),
            })
          : await importFaculty({
              collegeId: user.collegeId,
              deliveryMode: 'reset-email',
              faculty: rows.map(row => {
                const [firstName, ...rest] = String(row.name || '').trim().split(/\s+/);
                return {
                  facultyId: row.facultyId || undefined,
                  firstName: firstName || row.email,
                  lastName: rest.join(' ') || undefined,
                  email: (row.email || '').trim().toLowerCase(),
                  phone: row.phone || undefined,
                  collegeCode: row.collegeCode || '',
                  department: row.department || undefined,
                  designation: row.designation || undefined,
                  specialization: row.specialization || undefined,
                  qualification: row.qualification || undefined,
                  experienceYears: row.experience ? Number(row.experience) : undefined,
                  subjectsUG: row.subjects
                    ? String(row.subjects).split(',').map(s => s.trim()).filter(Boolean)
                    : undefined,
                };
              }),
            });

      setCredentialRows(result.imported as CredentialRow[]);
      setImportSummary(
        `${result.success} account(s) ready` +
          (result.skipped ? `, ${result.skipped} left unchanged` : '') +
          (result.failed ? `, ${result.failed} failed` : '')
      );
      if (result.failed > 0) setImportError(result.errors.join('\n'));
      if (result.success > 0) showSuccess(`Imported ${result.success} ${currentTab.label.toLowerCase()} row(s)`);
    } catch (error: unknown) {
      // Raw `functions/not-found` means the backend is older than this page, not
      // that the data is bad; describeIdentityError says so and prints the command.
      setImportError(describeIdentityError(error, activeTab === 'students' ? 'bulkCreateStudentAccounts' : 'bulkProvisionStaff'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Onboarding Center</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Bulk upload students, faculty, schedules & assessments</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">College Admin</span>
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setUploadedFile(null); setParseResult(null); setShowPreview(false); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-500 text-slate-900 dark:text-white shadow-lg shadow-teal-500/20'
                    : 'bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Info Card */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl border border-slate-700/30 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{currentTab.template.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{currentTab.template.description}</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-teal-400 text-sm font-medium transition-colors"
                >
                  <Download size={14} />
                  Download Template
                </button>
              </div>

              {/* Required Fields */}
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Required Fields</p>
                <div className="flex flex-wrap gap-2">
                  {currentTab.template.fields.filter((f: TemplateField) => f.required).map((field: TemplateField) => (
                    <span key={field.key} className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-md border border-red-500/20">
                      {field.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Optional Fields */}
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Optional Fields</p>
                <div className="flex flex-wrap gap-2">
                  {currentTab.template.fields.filter((f: TemplateField) => !f.required).map((field: TemplateField) => (
                    <span key={field.key} className="px-2.5 py-1 text-xs font-medium bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-md">
                      {field.name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                uploadedFile
                  ? 'border-teal-500 bg-teal-500/5'
                  : 'border-slate-700 hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload size={36} className={`mx-auto mb-3 ${uploadedFile ? 'text-teal-400' : 'text-slate-600'}`} />
              {uploadedFile ? (
                <>
                  <p className="text-sm font-medium text-teal-600 dark:text-teal-400">{uploadedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Drop CSV/Excel file here or click to browse</p>
                  <p className="text-xs text-slate-500 mt-1">Download the template above for correct format</p>
                </>
              )}
            </div>

            {/* Parse Results */}
            <AnimatePresence>
              {parseResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card rounded-xl border border-slate-700/30 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-700/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {parseResult.valid ? (
                        <CheckCircle2 size={20} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                      )}
                      <span className={`text-sm font-medium ${parseResult.valid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {parseResult.valid ? 'All records valid!' : `${parseResult.errors.length} errors found`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        <span className="text-slate-900 dark:text-white font-medium">{parseResult.data.length}</span> valid
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        <span className="text-red-400 font-medium">{parseResult.errors.length}</span> errors
                      </span>
                    </div>
                  </div>

                  {/* Error Details */}
                  {parseResult.errors.length > 0 && (
                    <div className="max-h-48 overflow-y-auto">
                      {parseResult.errors.slice(0, 20).map((error: OnboardingError, i: number) => (
                        <div key={i} className="px-4 py-2.5 border-b border-slate-700/30 flex items-start gap-3">
                          <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Row {error.rowNumber} • {error.regNoOrId}</p>
                            <p className="text-sm text-red-600 dark:text-red-400">{error.field}: {error.message}</p>
                          </div>
                        </div>
                      ))}
                      {parseResult.errors.length > 20 && (
                        <p className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">...and {parseResult.errors.length - 20} more errors</p>
                      )}
                    </div>
                  )}

                  {/* Data Preview */}
                  {parseResult.data.length > 0 && showPreview && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700/30">
                            {currentTab.template.fields.slice(0, 6).map((f: TemplateField) => (
                              <th key={f.key} className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase">{f.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                          {parseResult.data.slice(0, 5).map((row: Record<string, string>, i: number) => (
                            <tr key={i}>
                              {currentTab.template.fields.slice(0, 6).map((f: TemplateField) => (
                                <td key={f.key} className="px-4 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{row[f.key] || '-'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parseResult.data.length > 5 && (
                        <p className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">...and {parseResult.data.length - 5} more rows</p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-slate-700/30 flex justify-end gap-3">
                    <button
                      onClick={() => { setUploadedFile(null); setParseResult(null); }}
                      className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Clear
                    </button>
                    <div className="flex flex-col items-end gap-1.5">
                      {!currentTab.importable && (
                        <span className="text-xs text-amber-500">
                          Validation only — {currentTab.label.toLowerCase()} import is not available from here yet.
                        </span>
                      )}
                      <button
                        onClick={handleProcessUpload}
                        disabled={!parseResult.valid || !currentTab.importable || importing}
                        title={
                          currentTab.importable
                            ? 'Creates Firebase Auth accounts, role claims and profile records in one step'
                            : 'No bulk importer exists for this template'
                        }
                        className="px-6 py-2 rounded-lg text-sm font-medium bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 dark:text-white transition-colors inline-flex items-center gap-2"
                      >
                        {importing && (
                          <span className="w-3.5 h-3.5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                        )}
                        {importing
                          ? 'Provisioning…'
                          : `Process ${parseResult.data.length} ${currentTab.label}`}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {(importError || importSummary || credentialRows.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-4 space-y-3"
                >
                  {importSummary && (
                    <p className="text-sm text-emerald-400">{importSummary}</p>
                  )}
                  {importError && (
                    <pre className="text-xs text-red-400 whitespace-pre-wrap font-mono bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {importError}
                    </pre>
                  )}
                  {credentialRows.length > 0 && (
                    <CredentialsTable
                      rows={credentialRows}
                      title={`${currentTab.label} — login credentials`}
                      filename={`vriddhi-${activeTab}-credentials`}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Panel - Instructions */}
          <div className="space-y-6">
            <div className="glass-card rounded-xl border border-slate-700/30 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">How to Onboard</h3>
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Download Template', desc: 'Get the correct CSV format for your data' },
                  { step: 2, title: 'Fill the Data', desc: 'Add all records following the field guidelines' },
                  { step: 3, title: 'Upload File', desc: 'Drag & drop or select your CSV file' },
                  { step: 4, title: 'Review & Process', desc: 'Check validation results and confirm upload' },
                ].map(item => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl border border-slate-700/30 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Field Guidelines</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {currentTab.template.fields.map((field: TemplateField) => (
                  <div key={field.key} className="p-3 rounded-lg bg-slate-800/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{field.name}</span>
                      {field.required && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded">REQUIRED</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{field.description}</p>
                    <p className="text-xs text-teal-400 mt-1">Example: {field.example}</p>
                    {field.type === 'select' && field.options && (
                      <p className="text-xs text-slate-500 mt-1">Options: {field.options.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}