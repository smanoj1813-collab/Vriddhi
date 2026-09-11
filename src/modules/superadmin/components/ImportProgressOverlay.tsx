import React from 'react';
import { Loader2 } from 'lucide-react';
import type { BatchProgress } from '../../../shared/utils/batchedImport';

interface ImportProgressOverlayProps {
  progress: BatchProgress | null;
  /** What is being imported, e.g. "students" or "faculty". */
  subject?: string;
}

/**
 * Full-screen progress shown for the duration of a bulk import.
 *
 * It is deliberately modal. Bulk provisioning runs one row at a time
 * server-side, so a large file takes minutes — and the response is the only
 * place the generated one-time passwords ever exist. Navigating away
 * unmounts the page and throws that response away, leaving accounts nobody
 * can log into. The overlay sits above the sidebar so in-app navigation is
 * physically blocked for the few minutes the import takes. Browser tabs are
 * unaffected: switching away and coming back is safe.
 */
const ImportProgressOverlay: React.FC<ImportProgressOverlayProps> = ({
  progress,
  subject = 'rows',
}) => {
  const total = progress?.total ?? 0;
  const processed = progress?.processed ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const batchLabel =
    progress && progress.batchCount > 1
      ? `Batch ${progress.batch} of ${progress.batchCount}`
      : 'Working';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Import in progress"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-spin shrink-0" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Importing {subject}…
          </h2>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {batchLabel}
          {total > 0 && (
            <>
              {' · '}
              <span className="font-medium text-slate-900 dark:text-white">{processed}</span>
              {' of '}
              <span className="font-medium text-slate-900 dark:text-white">{total}</span>
              {' rows sent'}
            </>
          )}
        </p>

        <div
          className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-4"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-teal-500 transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Keep this page open until it finishes. Accounts are created as each batch is sent, but the
          generated passwords only exist in the response — leaving now means those students cannot
          be given their credentials. Switching to another browser tab is fine.
        </p>
      </div>
    </div>
  );
};

export default ImportProgressOverlay;
