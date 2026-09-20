// src/modules/faculty/components/PaperAcademicInsights.tsx
// ------------------------------------------------------------------
// Deterministic paper-authoring insights for the Faculty Paper Generator,
// powered by the `getPaperAcademicContext` callable.
//
// Shows only metadata about the APPROVED question pool for the selected
// course: counts, difficulty/Blooms distributions, recently-used ids and the
// stored blueprint. The typed contract guarantees no question text and no
// answer keys ever reach this component (see academicContext.ts), and the
// panel states that explicitly so nobody expects answer material here.
//
// Controlled UI feature: renders nothing while `enabled` is false and gets
// out of the way entirely when the backend feature gate returns
// `{ enabled: false }`.
// ------------------------------------------------------------------
import {
  BarChart3, Layers, Loader2, ShieldCheck, TriangleAlert,
} from 'lucide-react';
import { usePaperAcademicContext } from '../hooks/usePaperAcademicContext';

function DistributionChips({ title, counts, palette }: {
  title: string;
  counts: Record<string, number>;
  palette: Record<string, string>;
}) {
  const entries = Object.entries(counts).filter(([, count]) => count > 0);
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Not recorded yet</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {entries.map(([key, count]) => (
            <span
              key={key}
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${palette[key] || 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700'}`}
            >
              {key}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const DIFFICULTY_PALETTE: Record<string, string> = {
  easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  hard: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
};

export default function PaperAcademicInsights({
  courseId,
  enabled = true,
}: {
  courseId: string | undefined;
  /** Controlled UI switch — false keeps the panel out of the workflow. */
  enabled?: boolean;
}) {
  const { context, disabled, loading, error, refetch } = usePaperAcademicContext(courseId, enabled);

  // Controlled feature off, backend gate off, or nothing to show yet: stay
  // out of the way — the paper generator works exactly as before.
  if (!enabled || (disabled && !error)) return null;
  if (!courseId) return null;
  if (!context) {
    if (!loading) return null;
    return (
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
        Loading approved question pool…
      </div>
    );
  }

  const total = context.candidates.length;

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-500" />
          Approved question pool{context.course ? ` — ${context.course.courseCode}` : ''}
        </h3>
        <button
          type="button"
          onClick={refetch}
          className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-100">
          <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{total}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            approved candidate{total === 1 ? '' : 's'} in the bank
          </p>
          {context.recentlyUsedQuestionIds.length > 0 && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {context.recentlyUsedQuestionIds.length} used in recent papers
            </p>
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Coverage</span>
          </div>
          <DistributionChips title="By difficulty" counts={context.distributions.difficulty} palette={DIFFICULTY_PALETTE} />
          <div className="mt-2">
            <DistributionChips title="By Blooms level" counts={context.distributions.blooms} palette={{}} />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Stored blueprint</p>
          {context.blueprint ? (
            <div className="mt-1 space-y-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {context.blueprint.totalQuestions ?? '—'} questions · {context.blueprint.totalMarks ?? '—'} marks
              </p>
              {(context.blueprint.sections || []).slice(0, 3).map((section, index) => (
                <p key={index} className="text-[11px] text-slate-500 dark:text-slate-400">
                  {section.name}: {section.count} question{section.count === 1 ? '' : 's'}
                  {section.marks ? ` · ${section.marks} marks` : ''}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No blueprint stored for this course.</p>
          )}
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        Metadata only — question text and answer keys are never included in this context.
      </p>
    </div>
  );
}
