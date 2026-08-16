// src/modules/superadmin/components/StudentImport.tsx
// Bulk student import with Firebase Auth account creation

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  KeyRound,
  ShieldCheck,
  Users,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { parseCSV, validateCSV, generateCSVTemplate } from '@/shared/utils/parseCSV';
import { getAllColleges } from '@/shared/services/collegeService';
import {
  bulkCreateStudentAccounts,
  downloadCredentialsCSV,
  type BulkImportResponse,
  type StudentImportResult,
  type PasswordStrategy,
} from '../services/studentImportService';

export default function StudentImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [colleges, setColleges] = useState<any[]>([]);

  const [passwordStrategy, setPasswordStrategy] = useState<PasswordStrategy>('auto');
  const [defaultPassword, setDefaultPassword] = useState('');

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResponse | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  React.useEffect(() => {
    getAllColleges().then(setColleges);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportResult(null);
    setValidationErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text, 'students');
        const validated = validateCSV(parsed, 'students');

        setParsedData(validated.validRows);
        setValidationErrors(validated.errors);
      } catch (err: any) {
        setValidationErrors([err.message]);
        setParsedData([]);
      }
    };
    reader.readAsText(uploadedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!selectedCollege || parsedData.length === 0) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const students = parsedData.map((row) => ({
        regNo: row.regNo || row.reg_no || '',
        name: row.name || '',
        email: row.email || '',
        phone: row.phone || '',
        department: row.department || '',
        batch: row.batch || '',
        division: row.division || '',
        semester: row.semester || '1',
        dob: row.dob || '',
        gender: row.gender || '',
        address: row.address || '',
      }));

      const result = await bulkCreateStudentAccounts(selectedCollege, students, {
        passwordStrategy,
        defaultPassword: passwordStrategy === 'default' ? defaultPassword : undefined,
      });

      setImportResult(result);
    } catch (error: any) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        total: parsedData.length,
        created: 0,
        failed: parsedData.length,
        errors: [{ row: 0, regNo: 'N/A', message: error.message || 'Unknown error' }],
        students: [],
        collegeId: selectedCollege,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = generateCSVTemplate('students');
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const successfulStudents: StudentImportResult[] = importResult?.students.filter((s: StudentImportResult) => s.success) || [];
  const failedStudents: StudentImportResult[] = importResult?.students.filter((s: StudentImportResult) => !s.success) || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Import Students</h1>
        <p className="text-slate-400">
          Upload a CSV to bulk-create Firebase Auth accounts + Firestore student records
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select College <span className="text-red-400">*</span>
        </label>
        <select
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">-- Select a College --</option>
          {colleges.map((college: any) => (
            <option key={college.id} value={college.id}>
              {college.name} ({college.code})
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-5 h-5 text-teal-400" />
          <h3 className="text-white font-medium">Password Strategy</h3>
        </div>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="passwordStrategy"
              value="auto"
              checked={passwordStrategy === 'auto'}
              onChange={() => setPasswordStrategy('auto')}
              className="accent-teal-500"
            />
            <span className="text-slate-300 text-sm">Auto-generated (secure, 10 chars)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="passwordStrategy"
              value="default"
              checked={passwordStrategy === 'default'}
              onChange={() => setPasswordStrategy('default')}
              className="accent-teal-500"
            />
            <span className="text-slate-300 text-sm">Default password</span>
          </label>
        </div>
        {passwordStrategy === 'default' && (
          <input
            type="text"
            placeholder="e.g. RegNo@123 or Welcome2024"
            value={defaultPassword}
            onChange={(e) => setDefaultPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-teal-500"
          />
        )}
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-teal-500 bg-teal-500/10'
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-teal-400 font-medium">Drop the CSV file here</p>
        ) : (
          <>
            <p className="text-slate-300 font-medium mb-2">
              Drag & drop a CSV file here, or click to select
            </p>
            <p className="text-slate-500 text-sm">Only .csv files are accepted</p>
          </>
        )}
      </div>

      <button
        onClick={downloadTemplate}
        className="mt-4 flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm"
      >
        <Download size={16} />
        Download CSV Template
      </button>

      {file && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <FileText className="w-5 h-5 text-teal-400" />
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{file.name}</p>
            <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs rounded-full">
            {parsedData.length} valid rows
          </span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-red-400 font-medium">
              Validation Errors ({validationErrors.length})
            </h3>
          </div>
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {validationErrors.map((error, i) => (
              <li key={i} className="text-red-300 text-sm flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {parsedData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-white font-medium mb-3">
            Preview ({parsedData.length} students)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  {Object.keys(parsedData[0]).map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-left text-slate-400 font-medium uppercase text-xs"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {parsedData.slice(0, 5).map((row, i) => (
                  <tr key={i} className="bg-slate-900/50">
                    {Object.values(row).map((value, j) => (
                      <td key={j} className="px-4 py-2 text-slate-300">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 5 && (
              <p className="p-3 text-center text-slate-500 text-sm">
                ... and {parsedData.length - 5} more rows
              </p>
            )}
          </div>
        </div>
      )}

      {parsedData.length > 0 && (
        <button
          onClick={handleImport}
          disabled={!selectedCollege || isImporting || validationErrors.length > 0}
          className="mt-6 w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isImporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating {parsedData.length} accounts...
            </>
          ) : (
            <>
              <ShieldCheck size={20} />
              Create {parsedData.length} Student Accounts
            </>
          )}
        </button>
      )}

      {importResult && (
        <div className="mt-6 space-y-4">
          <div
            className={`p-4 rounded-lg border ${
              importResult.success
                ? 'bg-green-500/10 border-green-500/30'
                : importResult.created > 0
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <h3
              className={`font-medium mb-3 ${
                importResult.success
                  ? 'text-green-400'
                  : importResult.created > 0
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {importResult.success
                ? 'All Accounts Created Successfully'
                : importResult.created > 0
                ? 'Partially Completed'
                : 'Import Failed'}
            </h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-bold text-white">{importResult.total}</p>
                <p className="text-slate-400 text-sm">Total</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-bold text-green-400">{importResult.created}</p>
                <p className="text-slate-400 text-sm">Created</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-bold text-red-400">{importResult.failed}</p>
                <p className="text-slate-400 text-sm">Failed</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-bold text-teal-400">
                  {importResult.total > 0
                    ? Math.round((importResult.created / importResult.total) * 100)
                    : 0}
                  %
                </p>
                <p className="text-slate-400 text-sm">Success</p>
              </div>
            </div>
          </div>

          {successfulStudents.length > 0 && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" />
                  <h3 className="text-white font-medium">
                    {successfulStudents.length} Credentials Generated
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded bg-slate-700/50"
                  >
                    {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showPasswords ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => downloadCredentialsCSV(successfulStudents)}
                    className="flex items-center gap-1 text-teal-400 hover:text-teal-300 text-sm px-3 py-1.5 rounded bg-teal-500/10 border border-teal-500/30"
                  >
                    <Download size={14} />
                    Download CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-700 max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-400 text-xs">Reg No</th>
                      <th className="px-3 py-2 text-left text-slate-400 text-xs">Name</th>
                      <th className="px-3 py-2 text-left text-slate-400 text-xs">Email</th>
                      <th className="px-3 py-2 text-left text-slate-400 text-xs">Password</th>
                      <th className="px-3 py-2 text-left text-slate-400 text-xs">UID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {successfulStudents.map((s: StudentImportResult, i: number) => (
                      <tr key={i} className="bg-slate-900/50">
                        <td className="px-3 py-2 text-slate-300 font-mono text-xs">{s.regNo}</td>
                        <td className="px-3 py-2 text-slate-300">{s.name}</td>
                        <td className="px-3 py-2 text-slate-300 text-xs">{s.email}</td>
                        <td className="px-3 py-2 text-teal-400 font-mono text-xs">
                          {showPasswords ? s.password : '••••••••••'}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs truncate max-w-[120px]">
                          {s.uid}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {failedStudents.length > 0 && (
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
              <button
                onClick={() =>
                  setExpandedSection(expandedSection === 'failed' ? null : 'failed')
                }
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <h3 className="text-red-400 font-medium">
                    {failedStudents.length} Failed
                  </h3>
                </div>
                {expandedSection === 'failed' ? (
                  <ChevronUp className="w-4 h-4 text-red-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-red-400" />
                )}
              </button>
              {expandedSection === 'failed' && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {failedStudents.map((s: StudentImportResult, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 bg-slate-800/50 rounded text-sm"
                    >
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-300">
                          <span className="font-mono text-xs">{s.regNo}</span> — {s.name}
                        </p>
                        <p className="text-red-300 text-xs">{s.error}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}