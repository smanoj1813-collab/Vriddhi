// College staff: the previous-year papers the platform assigned to this
// college (colleges/{id}/config/pyqPapers). Online-ready papers can be turned
// into a college assessment paper (createPyqAssessmentPaper) and scheduled
// straight away; PDF-only papers open the original file.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  PlayCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { fetchPrepPaper, fetchPrepPapers, type PrepPaper, type PrepPaperSummary } from '@/shared/services/prepContentService';
import { createPyqAssessmentPaper, loadPyqAssignments, type CreatePyqAssessmentResult } from '@/shared/pyq/pyqAssignments';
import {
  allPyqQuestionKeys,
  assignedPyqIds,
  filterPyqRows,
  isAssessmentReadyRow,
  pyqProgramOptions,
  pyqQuestionKey,
  pyqQuestionMarks,
  rubricPyqQuestionKeys,
  sortPyqRows,
  summarizePyqSelection,
  type PyqRowFilters,
} from '@/shared/pyq/pyqAssignmentModel';

interface AssignedPyqPapersPanelProps {
  collegeId: string;
  /** Where "Schedule test" goes: /admin/schedule-tests or /faculty/assessments. */
  schedulePath: string;
  /** Superadmins act on behalf of the college; the callable needs the id. */
  actAsSuperadmin?: boolean;
}

const inputClass = 'text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700 dark:bg-slate-950';

function errorText(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return String((err as { message: string }).message).replace(/^FirebaseError:\s*/, '') || fallback;
  }
  return fallback;
}

function ConductAssessmentDialog({
  row,
  collegeId,
  actAsSuperadmin,
  schedulePath,
  onClose,
}: {
  row: PrepPaperSummary;
  collegeId: string;
  actAsSuperadmin?: boolean;
  schedulePath: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [paper, setPaper] = useState<PrepPaper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState(`PYQ: ${row.subjectName}${row.examLabel ? ` (${row.examLabel})` : ''}`);
  const [duration, setDuration] = useState<number>(row.durationMinutes || 60);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatePyqAssessmentResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPrepPaper(row.id)
      .then((full) => {
        if (cancelled) return;
        setPaper(full);
        setSelected(new Set(allPyqQuestionKeys(full.sections || [])));
        if (full.durationMinutes) setDuration(full.durationMinutes);
      })
      .catch((err) => { if (!cancelled) setError(errorText(err, 'Could not load the paper.')); });
    return () => { cancelled = true; };
  }, [row.id]);

  const sections = paper?.sections || [];
  const summary = useMemo(() => summarizePyqSelection(sections, selected), [sections, selected]);
  const toggle = (key: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const result = await createPyqAssessmentPaper({
        prepPaperId: row.id,
        selectedKeys: [...selected],
        title: title.trim() || undefined,
        durationMinutes: duration,
        ...(actAsSuperadmin ? { collegeId } : {}),
      });
      setCreated(result);
    } catch (err) {
      setError(errorText(err, 'Could not create the assessment paper.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/50 p-3" role="dialog" aria-modal="true" aria-label={`Conduct assessment: ${row.subjectName}`}>
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">Conduct an assessment</p>
            <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">{row.subjectName}</h3>
            <p className="text-xs text-slate-500">{row.programLabel}{row.semester ? ` · Semester ${row.semester}` : ''}{row.examLabel ? ` · ${row.examLabel}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>

        {created ? (
          <div className="space-y-4 px-5 py-6">
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Assessment paper created</p>
                <p className="mt-0.5">“{created.title}” — {created.totalQuestions} questions, {created.totalMarks} marks, {created.duration} minutes. It is now in your college’s approved papers.</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Next, schedule it for a class: pick the window, the sections or students, and proctoring options. Descriptive answers are marked in Assessments → Manual grading.</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Close</button>
              <button type="button" onClick={() => navigate(`${schedulePath}?paperId=${encodeURIComponent(created.id)}`)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700">
                <CalendarClock className="h-3.5 w-3.5" /> Schedule test now
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {!paper && !error && <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading questions…</div>}
              {paper && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
                    <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>Paper title</span>
                      <input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} block w-full text-sm`} />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>Duration (minutes)</span>
                      <input type="number" min={1} max={480} value={duration} onChange={(e) => setDuration(Math.max(1, Math.min(480, Number(e.target.value) || 1)))} className={`${inputClass} block w-full text-sm`} />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Questions:</span>
                    <button type="button" onClick={() => setSelected(new Set(allPyqQuestionKeys(sections)))} className="font-semibold text-teal-700 hover:underline dark:text-teal-300">Select all</button>
                    <button type="button" onClick={() => setSelected(new Set(rubricPyqQuestionKeys(sections)))} className="font-semibold text-teal-700 hover:underline dark:text-teal-300" title="First N questions of every “answer any N” section">Match the paper’s rubric</button>
                    <button type="button" onClick={() => setSelected(new Set())} className="font-semibold text-slate-500 hover:underline">Clear</button>
                  </div>
                  {sections.map((section) => {
                    const stats = summary.sections.find((s) => s.id === section.id);
                    const overRubric = stats && stats.answerCount > 0 && stats.selected > stats.answerCount;
                    return (
                      <div key={section.id} className="rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{section.title || `Section ${section.id}`} <span className="font-normal text-slate-500">· {stats?.selected || 0} of {stats?.total || 0} selected</span></p>
                          {section.instruction && <p className="text-[11px] text-slate-500">{section.instruction}</p>}
                          {overRubric && (
                            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                              The paper says answer any {stats!.answerCount}; the online test asks students to answer every selected question. Select {stats!.answerCount} to match.
                            </p>
                          )}
                        </div>
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(section.questions || []).map((question, index) => {
                            if (!String(question.text || '').trim()) return null;
                            const key = pyqQuestionKey(section.id, index);
                            const checked = selected.has(key);
                            return (
                              <li key={key}>
                                <label className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <input type="checkbox" checked={checked} onChange={() => toggle(key)} className="mt-1 accent-teal-600" />
                                  <span className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-100">
                                    {question.label && <span className="mr-1 font-semibold text-slate-500">{question.label}.</span>}
                                    <span className="whitespace-pre-line">{question.text}</span>
                                    {question.parts?.length ? (
                                      <span className="mt-1 block space-y-0.5 pl-4 text-[13px] text-slate-600 dark:text-slate-300">
                                        {question.parts.map((part, partIndex) => <span key={partIndex} className="block">{part}</span>)}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="shrink-0 text-[11px] font-semibold text-slate-500">{pyqQuestionMarks(section, question)} m</span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </>
              )}
              {error && <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
              <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">{summary.questions}</span> questions · <span className="font-bold">{summary.marks}</span> marks</p>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                <button type="button" disabled={!paper || creating || summary.questions === 0} onClick={() => void create()} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                  {creating ? 'Creating…' : 'Create assessment paper'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AssignedPyqPapersPanel({ collegeId, schedulePath, actAsSuperadmin }: AssignedPyqPapersPanelProps) {
  const [rows, setRows] = useState<PrepPaperSummary[]>([]);
  const [assignedCount, setAssignedCount] = useState(0);
  const [filters, setFilters] = useState<PyqRowFilters>({ readiness: 'all' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<PrepPaperSummary | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await loadPyqAssignments(collegeId);
      const ids = new Set(assignedPyqIds(settings));
      setAssignedCount(ids.size);
      if (ids.size === 0) {
        setRows([]);
        return;
      }
      const catalogue = await fetchPrepPapers();
      setRows(sortPyqRows(catalogue.papers.filter((paper) => ids.has(paper.id))));
    } catch (err) {
      setError(errorText(err, 'Could not load previous year papers.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const programs = useMemo(() => pyqProgramOptions(rows), [rows]);
  const semesters = useMemo(
    () => [...new Set(rows.filter((r) => !filters.program || r.program === filters.program).map((r) => r.semester).filter(Boolean))].sort((a, b) => a - b),
    [rows, filters.program],
  );
  const shown = useMemo(() => filterPyqRows(rows, filters), [rows, filters]);
  const readyCount = rows.filter(isAssessmentReadyRow).length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><FileText className="h-4 w-4 text-teal-600" /> Previous year question papers</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Papers assigned to your college by the Vriddhi platform team. Pick one, choose the questions and run it as an online assessment.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading assigned papers…</div>
      ) : error ? (
        <div role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>
      ) : assignedCount === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">
          No previous year papers have been assigned to your college yet. Papers are assigned by the Vriddhi platform team — contact them to get papers for your programmes.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select aria-label="Programme" value={filters.program || ''} onChange={(e) => setFilters((f) => ({ ...f, program: e.target.value || undefined, semester: undefined }))} className={inputClass}>
              <option value="">All programmes</option>
              {programs.map((p) => <option key={p.value} value={p.value}>{p.label} ({p.count})</option>)}
            </select>
            <select aria-label="Semester" value={filters.semester || ''} onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value || undefined }))} className={inputClass}>
              <option value="">All semesters</option>
              {semesters.map((s) => <option key={s} value={String(s)}>Semester {s}</option>)}
            </select>
            <select aria-label="Format" value={filters.readiness || 'all'} onChange={(e) => setFilters((f) => ({ ...f, readiness: e.target.value as PyqRowFilters['readiness'] }))} className={inputClass}>
              <option value="all">All formats</option>
              <option value="ready">Online-ready</option>
              <option value="pdf">PDF only</option>
            </select>
            <input aria-label="Search papers" value={filters.q || ''} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Search subject…" className={`${inputClass} min-w-[160px] flex-1`} />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">{rows.length} assigned · {readyCount} online-ready · {shown.length} shown</p>

          {shown.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">No assigned papers match these filters.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
              {shown.map((row) => {
                const ready = isAssessmentReadyRow(row);
                return (
                  <li key={row.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.subjectName}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ready ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                          {ready ? 'Online-ready' : 'PDF only'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {row.programLabel}{row.semester ? ` · Semester ${row.semester}` : ''}{row.examLabel ? ` · ${row.examLabel}` : ''}
                        {ready ? ` · ${row.questionCount} questions${row.maxMarks ? ` · ${row.maxMarks} marks` : ''}` : ' · questions not transcribed yet'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {ready ? (
                        <button type="button" onClick={() => setActive(row)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700">
                          <PlayCircle className="h-3.5 w-3.5" /> Conduct assessment
                        </button>
                      ) : row.sourceFile?.url ? (
                        <a href={row.sourceFile.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                          <ExternalLink className="h-3.5 w-3.5" /> Open original PDF
                        </a>
                      ) : null}
                      <a href={`/prep/papers/${encodeURIComponent(row.id)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        View
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {active && (
        <ConductAssessmentDialog
          row={active}
          collegeId={collegeId}
          actAsSuperadmin={actAsSuperadmin}
          schedulePath={schedulePath}
          onClose={() => setActive(null)}
        />
      )}
    </section>
  );
}
