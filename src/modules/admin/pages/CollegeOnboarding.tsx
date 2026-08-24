// src/pages/admin/CollegeOnboarding.tsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useNotification } from '../../../shared/providers/NotificationProvider';
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
  { id: 'students', label: 'Students', icon: Users, template: STUDENT_TEMPLATE },
  { id: 'faculty', label: 'Faculty', icon: GraduationCap, template: FACULTY_TEMPLATE },
  { id: 'schedule', label: 'Class Schedule', icon: FileText, template: SCHEDULE_TEMPLATE },
  { id: 'assessments', label: 'Assessments', icon: FileText, template: ASSESSMENT_TEMPLATE },
];

export default function CollegeOnboarding() {
  const { showInfo } = useNotification();
  const [activeTab, setActiveTab] = useState('students');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult<Record<string, string>> | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTab = TABS.find(t => t.id === activeTab)!;

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

  const handleProcessUpload = async () => {
    if (!parseResult?.valid) return;
    // TODO: Call API to bulk upload
    showInfo(`Processing ${parseResult.data.length} ${currentTab.label.toLowerCase()}...`);
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
                    <button
                      onClick={handleProcessUpload}
                      disabled={!parseResult.valid}
                      className="px-6 py-2 rounded-lg text-sm font-medium bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 dark:text-white transition-colors"
                    >
                      Process {parseResult.data.length} {currentTab.label}
                    </button>
                  </div>
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