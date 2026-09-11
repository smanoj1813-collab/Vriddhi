import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Building2, Users, GraduationCap, Search } from 'lucide-react';
import { useColleges, useStudents, useFacultyList } from '../hooks/useSuperAdmin';
import BulkCredentialReset from '../components/BulkCredentialReset';
import type { College } from '../types/superAdmin';

/**
 * Dedicated page for bulk credential regeneration.
 *
 * This is the recovery tool for the `deadline-exceeded` incident: an import
 * that timed out created Auth accounts server-side but threw the passwords
 * away. Re-importing cannot recover them because the duplicate check reports
 * "already exists". This page rotates the credentials in place, batched 10 at
 * a time with a 300 s client deadline so a large college does not hit the 70 s
 * SDK default again.
 *
 * Flow:
 *  - pick a college
 *  - pick students or faculty
 *  - search / select the affected cohort
 *  - regenerate — progress overlay, CSV export
 */
const BulkCredentialResetPage: React.FC = () => {
  const navigate = useNavigate();
  const [collegeId, setCollegeId] = useState('');
  const [collection, setCollection] = useState<'students' | 'faculty'>('students');
  const [search, setSearch] = useState('');
  const [showReset, setShowReset] = useState(false);

  const { data: collegesData, isLoading: collegesLoading } = useColleges({ status: 'active' });
  const colleges = collegesData?.items || [];
  const selectedCollege = colleges.find((c: College) => c.id === collegeId);

  const { data: studentsData, isLoading: studentsLoading } = useStudents(
    { collegeId: collegeId || '' },
    { enabled: !!collegeId && collection === 'students' }
  );
  const { data: facultyData, isLoading: facultyLoading } = useFacultyList(
    { collegeId: collegeId || '' },
    { enabled: !!collegeId && collection === 'faculty' }
  );

  const students = studentsData?.items || [];
  const faculty = facultyData?.items || [];

  const items = useMemo((): Array<{ id: string; name: string; email: string; regNo?: string; department?: string }> => {
    if (collection === 'students') {
      return students.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        regNo: s.regNo,
        department: s.department,
      }));
    }
    return faculty.map((f: any) => ({
      id: f.id,
      name: `${f.firstName} ${f.lastName}`.trim() || f.email,
      email: f.email,
      regNo: undefined,
      department: f.department,
    }));
  }, [collection, students, faculty]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(lower) ||
        it.email.toLowerCase().includes(lower) ||
        (it.regNo && it.regNo.toLowerCase().includes(lower))
    );
  }, [items, search]);

  const isLoading = collegesLoading || (collegeId && (studentsLoading || facultyLoading));

  return (
    <div className="page-container">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <KeyRound className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Regenerate Credentials</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Recover accounts created by a timed-out import — rotates passwords in place, batched to survive the 70 s deadline
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">College</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={collegeId}
                  onChange={(e) => {
                    setCollegeId(e.target.value);
                    setShowReset(false);
                  }}
                  className="input-field pl-10"
                >
                  <option value="">{collegesLoading ? 'Loading colleges...' : 'Select a college...'}</option>
                  {colleges.map((c: College) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.studentCount || 0} students, {c.facultyCount || 0} faculty
                    </option>
                  ))}
                </select>
              </div>
              {selectedCollege && (
                <p className="mt-2 text-xs text-slate-500">
                  {selectedCollege.name} has {selectedCollege.studentCount || students.length} students and{' '}
                  {selectedCollege.facultyCount || faculty.length} faculty. If an import timed out, those rows now exist
                  but nobody knows their password — this tool re-issues them.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">What to regenerate</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCollection('students');
                    setShowReset(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    collection === 'students'
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Users className="w-4 h-4" /> Students ({students.length})
                </button>
                <button
                  onClick={() => {
                    setCollection('faculty');
                    setShowReset(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    collection === 'faculty'
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" /> Faculty ({faculty.length})
                </button>
              </div>
            </div>
          </div>

          {collegeId && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                  {collection === 'students' ? 'Students' : 'Faculty'} in this college — {filtered.length} of {items.length}
                </h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter by name, email, reg no..."
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                      <tr className="text-slate-600 dark:text-slate-400 text-xs">
                        <th className="text-left px-3 py-2">Name</th>
                        <th className="text-left px-3 py-2">Email</th>
                        <th className="text-left px-3 py-2">RegNo / Dept</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filtered.map((it) => (
                        <tr key={it.id}>
                          <td className="px-3 py-2 text-slate-900 dark:text-white">{it.name}</td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">{it.email}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{it.regNo || it.department || '—'}</td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-8 text-center text-slate-500 text-sm">
                            No {collection} found. {isLoading ? 'Loading...' : 'Try another college or import first.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowReset(true)}
                  disabled={items.length === 0}
                  className="btn-primary disabled:opacity-50 flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" /> Regenerate {filtered.length} {collection} credential(s)
                </button>
              </div>

              <div className="mt-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <strong>How to size the recovery:</strong> The handoff asked for three numbers — rows in the CSV that was imported,
                  students now present in that college, and how many were there before the import. If the overlap is small,
                  resetting the college's data and re-importing cleanly may be cheaper than regenerating cohort by cohort.
                  This page shows the current count ({items.length}) — compare it to your CSV row count to decide.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Why this exists</h3>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              Before the batched sender, a bulk import sent every row in one <code>httpsCallable</code> request. The Firebase JS SDK
              abandons a callable after 70 s, while the Cloud Function keeps running — accounts are created, but the response carrying
              every generated password is discarded.
            </p>
            <p>
              The operator sees <code>deadline-exceeded</code>, assumes nothing happened, and is left with provisioned students nobody can
              log into. Re-importing does not help — students have no <code>onExisting: 'reset'</code> option, so every already-created row
              reports as <code>already exists</code>.
            </p>
            <p>
              This tool calls <code>resetUserPassword</code> (temp password + <code>mustChangePassword: true</code> + session revocation) for
              each selected doc, in batches of 10 with a 300 s client deadline, and exports the new passwords to CSV.
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              Keep the page open until it finishes — the passwords only exist in the response. Switching browser tabs is safe.
            </p>
          </div>
        </div>
      </div>

      {showReset && collegeId && (
        <BulkCredentialReset
          collegeId={collegeId}
          collegeName={selectedCollege?.name}
          collection={collection}
          items={filtered.map((it) => ({ id: it.id, name: it.name, email: it.email, regNo: it.regNo, department: it.department }))}
          onClose={() => setShowReset(false)}
          title={`Regenerate ${filtered.length} ${collection} credential(s)`}
        />
      )}
    </div>
  );
};

export default BulkCredentialResetPage;
