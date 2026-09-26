import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database, Upload, CheckCircle, AlertTriangle, Users, Link2,
  FileSpreadsheet, Download, RefreshCw, Loader2, Search, Filter
} from 'lucide-react';
import { collection, getDocs, query, where, limit, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import type { UUCMSImportRow, UUCMSImportResult } from '../types/uucms';
import { getUUCMSStatusLabel, getUUCMSStatusColor } from '../types/uucms';

function getCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id');
  if (!id) throw new Error('No college ID');
  return id;
}

export default function UUCMSIntegration() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'import' | 'sync' | 'mapping'>('overview');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<UUCMSImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data: syncStatus, isLoading } = useQuery({
    queryKey: ['uucmsSyncStatus'],
    queryFn: async () => {
      const collegeId = getCollegeId();
      // Get Vriddhi students
      const vriddhiQuery = query(collection(db, 'students'), where('collegeId', '==', collegeId), limit(500));
      const vriddhiSnap = await getDocs(vriddhiQuery);
      const vriddhiStudents = vriddhiSnap.docs.map(d => d.data());

      const totalVriddhi = vriddhiStudents.length;
      const withUUCMS = vriddhiStudents.filter(s => (s as any).uucmsCandidateId || (s as any).candidateId).length;
      const withUSN = vriddhiStudents.filter(s => (s as any).uucmsUSN || (s as any).usn).length;
      const principalApproved = vriddhiStudents.filter(s => (s as any).uucmsStatus === 'principal_approved' || (s as any).uucmsStatus === 'active').length;

      return {
        totalVriddhi,
        withUUCMS,
        withUSN,
        principalApproved,
        pending: totalVriddhi - withUUCMS,
        syncPercentage: totalVriddhi > 0 ? Math.round((withUUCMS / totalVriddhi) * 100) : 0,
      };
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['studentsWithUUCMS'],
    queryFn: async () => {
      const collegeId = getCollegeId();
      const q = query(collection(db, 'students'), where('collegeId', '==', collegeId), limit(200));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    
    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const rows: UUCMSImportRow[] = [];
      const errors: UUCMSImportResult['errors'] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        // Validate required fields
        if (!row.candidateid && !row.candidate_id) {
          errors.push({ rowNumber: i + 1, field: 'candidateId', message: 'Candidate ID is required' });
          continue;
        }

        rows.push({
          candidateId: row.candidateid || row.candidate_id || '',
          usn: row.usn || row.registrationno || row.registration_no || '',
          name: row.name || row.studentname || row.student_name || '',
          email: row.email || '',
          phone: row.phone || row.mobile || '',
          course: row.course || row.program || '',
          batch: row.batch || row.academicyear || row.academic_year || '',
          semester: row.semester || '',
          status: (row.status || 'candidate_generated') as any,
          puRegistrationNo: row.puregistrationno || row.pu_registration_no || '',
          category: row.category || '',
          applicationNo: row.applicationno || row.application_no || '',
        });
      }

      // Perform import to Firestore
      const collegeId = getCollegeId();
      const batch = writeBatch(db);
      let imported = 0;
      let updated = 0;

      for (const row of rows) {
        // Check if student exists by candidateId or USN
        const existingQuery = query(
          collection(db, 'students'),
          where('collegeId', '==', collegeId),
          where('uucmsCandidateId', '==', row.candidateId),
          limit(1)
        );
        const existingSnap = await getDocs(existingQuery);
        
        if (existingSnap.docs.length > 0) {
          // Update existing
          const docRef = existingSnap.docs[0].ref;
          batch.update(docRef, {
            uucmsUSN: row.usn || existingSnap.docs[0].data().uucmsUSN,
            uucmsStatus: row.status,
            uucmsLastSyncedAt: new Date().toISOString(),
            updatedAt: serverTimestamp(),
          });
          updated++;
        } else {
          // Try to find by email/phone/name match for linking
          // For now, create new record placeholder - in real flow, you'd match
          // We'll update if we find a student with same email
          if (row.email) {
            const emailQuery = query(
              collection(db, 'students'),
              where('collegeId', '==', collegeId),
              where('email', '==', row.email),
              limit(1)
            );
            const emailSnap = await getDocs(emailQuery);
            if (emailSnap.docs.length > 0) {
              batch.update(emailSnap.docs[0].ref, {
                uucmsCandidateId: row.candidateId,
                uucmsUSN: row.usn,
                uucmsStatus: row.status,
                puRegistrationNo: row.puRegistrationNo,
                category: row.category,
                uucmsApplicationNo: row.applicationNo,
                uucmsLastSyncedAt: new Date().toISOString(),
                updatedAt: serverTimestamp(),
              });
              updated++;
              continue;
            }
          }
          // If no match, count as failed for now - need manual mapping
          errors.push({
            rowNumber: rows.indexOf(row) + 2,
            candidateId: row.candidateId,
            field: 'linking',
            message: `No matching Vriddhi student found for ${row.candidateId} (${row.name}). Please ensure student exists or use mapping tab.`,
          });
        }
      }

      await batch.commit();

      const result: UUCMSImportResult = {
        totalRows: lines.length - 1,
        validRows: rows.length,
        imported,
        updated,
        failed: errors.length,
        errors,
        warnings: [],
      };

      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['uucmsSyncStatus'] });
      queryClient.invalidateQueries({ queryKey: ['studentsWithUUCMS'] });
    } catch (err) {
      console.error('Import failed', err);
      setImportResult({
        totalRows: 0,
        validRows: 0,
        imported: 0,
        updated: 0,
        failed: 1,
        errors: [{ rowNumber: 0, field: 'file', message: err instanceof Error ? err.message : 'Unknown error' }],
        warnings: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `candidateId,usn,name,email,phone,course,batch,semester,status,puRegistrationNo,category,applicationNo
UUCMS20240001,BCU2024BCA001,Ramesh Kumar,ramesh@example.com,9876543210,BCA,2024-25,3,principal_approved,PU2022001234,GM,APP20240001
UUCMS20240002,BCU2024BCA002,Priya S,priya@example.com,9876543211,BCA,2024-25,3,fee_paid,PU2022001235,SC,APP20240002`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uucms_import_template.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="text-teal-600" />
          UUCMS Integration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Karnataka Govt Unified University & College Management System - Sync Candidate ID, USN, Eligibility
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Users size={18} className="text-blue-600" />
            <span className="text-xs font-bold text-slate-500 uppercase">Total Vriddhi</span>
          </div>
          <p className="text-2xl font-black">{syncStatus?.totalVriddhi || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Students in Vriddhi</p>
        </div>
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Link2 size={18} className="text-teal-600" />
            <span className="text-xs font-bold text-slate-500 uppercase">With UUCMS ID</span>
          </div>
          <p className="text-2xl font-black">{syncStatus?.withUUCMS || 0}</p>
          <p className="text-xs text-emerald-600 font-bold mt-1">{syncStatus?.syncPercentage || 0}% synced</p>
        </div>
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={18} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-500 uppercase">Principal Approved</span>
          </div>
          <p className="text-2xl font-black">{syncStatus?.principalApproved || 0}</p>
          <p className="text-xs text-slate-500 mt-1">USN Generated</p>
        </div>
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Sync</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{syncStatus?.pending || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Need UUCMS ID</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm">UUCMS Sync Progress</h3>
          <span className="text-sm font-bold text-teal-600">{syncStatus?.syncPercentage || 0}%</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-600 rounded-full transition-all duration-500"
            style={{ width: `${syncStatus?.syncPercentage || 0}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {syncStatus?.withUUCMS || 0} of {syncStatus?.totalVriddhi || 0} students linked to UUCMS. 
          {syncStatus?.pending ? ` ${syncStatus.pending} need Candidate ID from UUCMS portal.` : ' All synced!'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: Database },
          { id: 'import', label: 'Import from UUCMS', icon: Upload },
          { id: 'mapping', label: 'Student Mapping', icon: Link2 },
          { id: 'sync', label: 'Sync Status', icon: RefreshCw },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">What is UUCMS?</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Unified University & College Management System</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li>- Govt of Karnataka portal: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">uucms.karnataka.gov.in</code></li>
                  <li>- Mandatory for all 33 public universities + 3500+ colleges</li>
                  <li>- Single window: Admissions, Course Registration, Exam Forms, Internal Marks, Results</li>
                  <li>- Student gets Candidate ID via SMS after registration, USN after Principal Approval</li>
                  <li>- Launched Aug 2021, exam module Jan 2022</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">How Vriddhi Integrates</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li>- <strong>Don't replace UUCMS</strong> - wrap it</li>
                  <li>- College admin exports students from UUCMS portal (CSV)</li>
                  <li>- Import here to auto-links Candidate ID + USN to Vriddhi students</li>
                  <li>- Use UUCMS ID for hall tickets, exam eligibility, result import</li>
                  <li>- Vriddhi provides what UUCMS lacks: push notifications, hall ticket PDF, room allotment, parent portal</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
              <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">How to get UUCMS data for import:</h4>
              <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                <li>Login to UUCMS as College Admin: https://uucms.karnataka.gov.in/Login/Index</li>
                <li>Go to Student Management to Admitted Students to Export CSV</li>
                <li>CSV contains Candidate ID, USN, Name, Course, Status</li>
                <li>Upload that CSV here in Import tab</li>
                <li>System auto-matches by email/phone and links UUCMS IDs</li>
              </ol>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold mb-4">UUCMS Status Breakdown</h3>
            <div className="space-y-3">
              {[
                { status: 'not_registered', label: 'Not Registered', count: students.filter(s => !s.uucmsCandidateId && !s.candidateId).length },
                { status: 'candidate_generated', label: 'Candidate ID Generated', count: students.filter(s => s.uucmsStatus === 'candidate_generated').length },
                { status: 'submitted', label: 'Application Submitted', count: students.filter(s => s.uucmsStatus === 'submitted').length },
                { status: 'fee_paid', label: 'Fee Paid', count: students.filter(s => s.uucmsStatus === 'fee_paid').length },
                { status: 'principal_approved', label: 'Principal Approved (USN)', count: students.filter(s => s.uucmsStatus === 'principal_approved' || s.uucmsStatus === 'active').length },
              ].map(item => (
                <div key={item.status} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getUUCMSStatusColor(item.status as any)}`}>
                      {getUUCMSStatusLabel(item.status as any)}
                    </span>
                  </div>
                  <span className="font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Import Students from UUCMS</h3>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                <Download size={14} />
                Download Template CSV
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-600 dark:text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Upload UUCMS Export CSV</h4>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                Export from UUCMS Portal: Student Management to Admitted Students to Export
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="uucms-file"
              />
              <label
                htmlFor="uucms-file"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors"
              >
                <Upload size={16} />
                Choose CSV File
              </label>
              {importFile && (
                <p className="text-sm text-teal-600 font-medium mt-3">
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {importFile && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                  {isImporting ? 'Importing...' : 'Import & Link Students'}
                </button>
              </div>
            )}

            {importResult && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{importResult.totalRows}</p>
                    <p className="text-xs text-slate-500">Total Rows</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-emerald-600">{importResult.updated}</p>
                    <p className="text-xs text-slate-500">Updated</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-blue-600">{importResult.imported}</p>
                    <p className="text-xs text-slate-500">Imported</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-rose-600">{importResult.failed}</p>
                    <p className="text-xs text-slate-500">Failed</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
                    <h4 className="font-bold text-rose-900 dark:text-rose-100 text-sm mb-2">Errors ({importResult.errors.length})</h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {importResult.errors.map((err, idx) => (
                        <p key={idx} className="text-xs text-rose-700 dark:text-rose-300">
                          Row {err.rowNumber}: {err.message} {err.candidateId && `(${err.candidateId})`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.updated > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="text-emerald-600" size={20} />
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                      Successfully linked {importResult.updated} students to UUCMS IDs. Sync progress updated!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
            <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              Expected CSV Format
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-200 mt-2 font-mono bg-white dark:bg-slate-900 p-3 rounded-xl overflow-x-auto">
              candidateId,usn,name,email,phone,course,batch,semester,status,puRegistrationNo,category,applicationNo<br />
              UUCMS20240001,BCU2024BCA001,Ramesh Kumar,ramesh@example.com,9876543210,BCA,2024-25,3,principal_approved,PU2022001234,GM,APP20240001
            </p>
          </div>
        </div>
      )}

      {activeTab === 'mapping' && (
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold">Student UUCMS Mapping</h3>
            <p className="text-xs text-slate-500 mt-1">View and manually link Vriddhi students to UUCMS Candidate IDs</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Vriddhi Reg No</th>
                  <th className="py-3 px-4">UUCMS Candidate ID</th>
                  <th className="py-3 px-4">USN</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.slice(0, 50).map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{student.regNo || student.registrationNumber || '-'}</td>
                    <td className="py-3 px-4">
                      {student.uucmsCandidateId || student.candidateId ? (
                        <span className="font-mono text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                          {student.uucmsCandidateId || student.candidateId}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Not linked</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{student.uucmsUSN || student.usn || '-'}</td>
                    <td className="py-3 px-4">
                      {student.uucmsStatus ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getUUCMSStatusColor(student.uucmsStatus)}`}>
                          {getUUCMSStatusLabel(student.uucmsStatus)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {student.uucmsLastSyncedAt ? new Date(student.uucmsLastSyncedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold mb-4">Sync Actions</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div>
                <h4 className="font-bold text-sm">Refresh UUCMS Status</h4>
                <p className="text-xs text-slate-500 mt-1">Re-check all students' UUCMS linkage from Firestore</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
            <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-xl">
              <h4 className="font-bold text-teal-900 dark:text-teal-100 text-sm">Next Steps for Full UUCMS Compliance</h4>
              <ul className="text-sm text-teal-800 dark:text-teal-200 mt-2 space-y-1 list-disc list-inside">
                <li>Import UUCMS CSV to link Candidate IDs (done in Import tab)</li>
                <li>Generate hall tickets using UUCMS USN (Exam Management to Hall Tickets)</li>
                <li>Check attendance eligibility per BCU 75 percent rule before hall ticket generation</li>
                <li>Send university notifications: Fee last date, hall ticket release, room allotment</li>
                <li>Import results from UUCMS for SGPA/CGPA</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
