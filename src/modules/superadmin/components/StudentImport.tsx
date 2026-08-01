// src/components/superadmin/StudentImport.tsx
// Component to import students via CSV upload

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { parseCSV, validateStudentCSV, generateCSVTemplate } from '../../../shared/utils/parseCSV';
import { importStudents, getAllColleges } from '../../../shared/services/collegeService';
import type { ImportResult } from '../../../shared/services/collegeService';

export default function StudentImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [colleges, setColleges] = useState<any[]>([]);

  // Load colleges on mount
  React.useEffect(() => {
    getAllColleges().then(setColleges);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { rows } = parseCSV(text);
        const { validRows, errors } = validateStudentCSV(rows);

        setParsedData(validRows);
        setValidationErrors(errors);
      } catch (err: any) {
        setValidationErrors([err.message]);
      }
    };
    reader.readAsText(uploadedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  const handleImport = async () => {
    if (!selectedCollege || parsedData.length === 0) return;

    setIsImporting(true);
    try {
      const result = await importStudents(
        selectedCollege,
        parsedData.map(row => ({
          reg_no: row.reg_no,
          name: row.name,
          email: row.email,
          phone: row.phone || '',
          department: row.department,
          batch: row.batch,
          division: row.division,
          semester: row.semester || '1',
          dob: row.dob || '',
          gender: row.gender || '',
          address: row.address || ''
        })),
        selectedMentor || undefined
      );
      setImportResult(result);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Import Students</h1>
        <p className="text-slate-400">Upload a CSV file to bulk import students into a college</p>
      </div>

      {/* College Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Select College *</label>
        <select
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">-- Select a College --</option>
          {colleges.map(college => (
            <option key={college.id} value={college.id}>
              {college.name} ({college.code})
            </option>
          ))}
        </select>
      </div>

      {/* CSV Upload */}
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

      {/* Download Template */}
      <button
        onClick={downloadTemplate}
        className="mt-4 flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm"
      >
        <Download size={16} />
        Download CSV Template
      </button>

      {/* File Info */}
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

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-red-400 font-medium">Validation Errors ({validationErrors.length})</h3>
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

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-white font-medium mb-3">Preview ({parsedData.length} students)</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  {Object.keys(parsedData[0]).map(header => (
                    <th key={header} className="px-4 py-2 text-left text-slate-400 font-medium uppercase text-xs">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {parsedData.slice(0, 5).map((row, i) => (
                  <tr key={i} className="bg-slate-900/50">
                    {Object.values(row).map((value, j) => (
                      <td key={j} className="px-4 py-2 text-slate-300">{value}</td>
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

      {/* Import Button */}
      {parsedData.length > 0 && (
        <button
          onClick={handleImport}
          disabled={!selectedCollege || isImporting}
          className="mt-6 w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isImporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Importing {parsedData.length} students...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Import {parsedData.length} Students
            </>
          )}
        </button>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`mt-6 p-4 rounded-lg border ${
          importResult.success 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <h3 className={`font-medium mb-2 ${importResult.success ? 'text-green-400' : 'text-yellow-400'}`}>
            Import {importResult.success ? 'Successful' : 'Completed with Errors'}
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-2xl font-bold text-green-400">{importResult.imported}</p>
              <p className="text-slate-400 text-sm">Imported</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-2xl font-bold text-red-400">{importResult.failed}</p>
              <p className="text-slate-400 text-sm">Failed</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-400">{importResult.duplicates.length}</p>
              <p className="text-slate-400 text-sm">Duplicates</p>
            </div>
          </div>
          {importResult.errors.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto">
              {importResult.errors.map((err, i) => (
                <p key={i} className="text-red-300 text-sm">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
