import React, { useMemo, useState } from 'react';
import { KeyRound, Download, AlertTriangle, CheckCircle2, XCircle, Loader2, Search } from 'lucide-react';
import { useBlockUnload } from '@/shared/hooks/useBlockUnload';
import ImportProgressOverlay from './ImportProgressOverlay';
import CredentialsTable from './CredentialsTable';
import type { BatchProgress } from '@/shared/utils/batchedImport';
import type { BulkResetItem, BulkResetOutcome } from '../api/superAdminApi';
import { useBulkResetStudentPasswords, useBulkResetFacultyPasswords } from '../hooks/useSuperAdmin';
import type { CredentialRow } from '@/shared/services/identityBackend';
import { credentialsToCsv, downloadCsv } from '@/shared/services/identityBackend';

interface BulkCredentialResetProps {
  collegeId: string;
  collegeName?: string;
  collection: 'students' | 'faculty';
  items: Array<{ id: string; name: string; email: string; regNo?: string; department?: string }>;
  onClose?: () => void;
  title?: string;
}

const BulkCredentialReset: React.FC<BulkCredentialResetProps> = ({
  collegeId,
  collegeName,
  collection,
  items,
  onClose,
  title,
}) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map((i) => i.id)));
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [outcome, setOutcome] = useState<BulkResetOutcome | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetStudents = useBulkResetStudentPasswords();
  const resetFaculty = useBulkResetFacultyPasswords();

  useBlockUnload(isProcessing);

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

  const allFilteredSelected = filtered.length > 0 && filtered.every((it) => selected.has(it.id));
  const toggleAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((it) => next.delete(it.id));
      } else {
        filtered.forEach((it) => next.add(it.id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedItems: BulkResetItem[] = useMemo(() => {
    return items.filter((it) => selected.has(it.id)).map((it) => ({ id: it.id, name: it.name, email: it.email }));
  }, [items, selected]);

  const handleReset = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Regenerate credentials for ${selectedItems.length} ${collection}? This will sign them out everywhere and issue new one-time passwords.`)) {
      return;
    }
    setIsProcessing(true);
    setProgress(null);
    setOutcome(null);
    try {
      const opts = { items: selectedItems, onProgress: setProgress };
      const result = collection === 'students'
        ? await resetStudents.mutateAsync(opts)
        : await resetFaculty.mutateAsync(opts);
      setOutcome(result);
    } catch (err: any) {
      // The hook's error is already surfaced via SuperAdminApiError, but we also
      // want to show a partial outcome if any.
      console.error('[BulkReset] error', err);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const credentialRows: CredentialRow[] = useMemo(() => {
    if (!outcome) return [];
    return outcome.results
      .filter((r) => r.success)
      .map((r) => ({
        email: r.email,
        name: r.name,
        role: collection === 'students' ? 'student' : 'faculty',
        docId: r.id,
        uid: r.uid,
        password: r.temporaryPassword,
        resetLink: r.resetLink || undefined,
        status: 'created' as const,
        authVerified: true,
      }));
  }, [outcome, collection]);

  const failedRows = outcome?.results.filter((r) => !r.success) || [];

  const handleDownloadAll = () => {
    if (!outcome) return;
    const rows: CredentialRow[] = outcome.results.map((r) => ({
      email: r.email,
      name: r.name,
      role: collection,
      docId: r.id,
      uid: r.uid,
      password: r.temporaryPassword,
      resetLink: r.resetLink || undefined,
      status: r.success ? ('created' as const) : ('failed' as const),
      error: r.error,
    }));
    downloadCsv(
      `${collection}-credentials-${collegeId}-${new Date().toISOString().slice(0, 10)}.csv`,
      credentialsToCsv(rows)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {title || `Regenerate ${collection} credentials`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {collegeName ? `${collegeName} · ` : ''}
                {items.length} {collection} in this college · {selected.size} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!outcome ? (
            <>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">This will issue new one-time passwords.</p>
                    <p className="text-xs opacity-90">
                      Every selected account will be signed out everywhere (refresh tokens revoked) and
                      flagged with <code>mustChangePassword</code>. The new password is shown once and
                      never stored — if you lose it, run this again. Use the CSV export to hand them out
                      securely. Accounts created by a timed-out import that never showed their password
                      are exactly the case this fixes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, reg no..."
                    className="input-field pl-10"
                  />
                </div>
                <button onClick={toggleAllFiltered} className="btn-secondary text-xs">
                  {allFilteredSelected ? 'Deselect filtered' : 'Select filtered'}
                </button>
                <span className="text-xs text-slate-500">
                  {selected.size} / {items.length} selected
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                      <tr className="text-slate-600 dark:text-slate-400 text-xs">
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected && filtered.length > 0}
                            onChange={toggleAllFiltered}
                            className="rounded"
                          />
                        </th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">RegNo / Dept</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filtered.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selected.has(it.id)}
                              onChange={() => toggleOne(it.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-slate-900 dark:text-white">{it.name}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 font-mono text-xs">{it.email}</td>
                          <td className="px-3 py-2 text-slate-500 text-xs">
                            {it.regNo || it.department || '—'}
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-slate-500 text-sm">
                            No {collection} match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Regeneration complete</h3>
                  <p className="text-xs text-slate-500">
                    {outcome.succeeded} succeeded · {outcome.failed} failed · {outcome.total} total
                    {outcome.failures.length > 0 && ` · ${outcome.failures.length} batch(es) failed`}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <button onClick={handleDownloadAll} className="btn-secondary text-xs">
                    <Download className="w-4 h-4" /> Download CSV (all)
                  </button>
                </div>
              </div>

              <CredentialsTable
                rows={credentialRows}
                filename={`${collection}-credentials-${collegeId}`}
                title={`New ${collection} credentials — one-time only`}
              />

              {failedRows.length > 0 && (
                <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                  <div className="bg-red-50 dark:bg-red-950/30 px-4 py-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      Failed ({failedRows.length})
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr className="text-slate-600 dark:text-slate-400">
                          <th className="text-left px-3 py-2">Name</th>
                          <th className="text-left px-3 py-2">Email</th>
                          <th className="text-left px-3 py-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {failedRows.map((r) => (
                          <tr key={r.id}>
                            <td className="px-3 py-2 text-slate-900 dark:text-white">{r.name}</td>
                            <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">{r.email}</td>
                            <td className="px-3 py-2 text-red-600 dark:text-red-400">{r.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {outcome.failures.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                    Batch failures (no response from backend):
                  </p>
                  <ul className="space-y-1">
                    {outcome.failures.map((f, i) => (
                      <li key={i} className="text-xs text-amber-700/80 dark:text-amber-300/80">
                        Rows {f.fromRow}–{f.toRow}: {f.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Regenerating — keep this open
              </span>
            ) : outcome ? (
              <span>
                Passwords are shown once. If you close this without downloading, run the reset again.
              </span>
            ) : (
              <span>{selected.size} selected — batches of 10, 300s per batch</span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isProcessing} className="btn-secondary">
              {outcome ? 'Close' : 'Cancel'}
            </button>
            {!outcome && (
              <button
                onClick={handleReset}
                disabled={isProcessing || selected.size === 0}
                className="btn-primary disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {isProcessing ? 'Regenerating...' : `Regenerate ${selected.size} credential(s)`}
              </button>
            )}
          </div>
        </div>
      </div>

      {isProcessing && <ImportProgressOverlay progress={progress} subject={`${collection} credentials`} />}
    </div>
  );
};

export default BulkCredentialReset;
