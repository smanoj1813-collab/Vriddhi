import { useMemo, useState } from 'react';
import {
  Users, UserPlus, Search, X, Loader2, Download, Trash2, RefreshCw,
  ChevronRight, AlertTriangle, CheckCircle2, FileSpreadsheet, ArrowRight,
  Inbox, ClipboardList, Filter as FilterIcon, HandCoins, GraduationCap, Star,
  Settings,
} from 'lucide-react';
import {
  ADMISSION_STAGES,
  ADMISSION_OUTCOMES,
  describeError,
  deleteApplication,
  exportAdmitted,
  markExported,
  saveApplication,
  transitionStage,
  type AdmissionApplication,
  type AdmissionApplicationInput,
  type AdmissionStatus,
} from '../api/admissionApi';
import {
  EMPTY_FILTERS,
  STAGE_LABELS,
  rankByMerit,
  useAdmissionCohorts,
  useAdmissions,
  useFilteredAdmissions,
  type AdmissionFilters,
} from '../hooks/useAdmissions';
import { DEFAULT_PROGRAMS } from '@/shared/constants/academicPrograms';
import AdmissionSettings from '../components/AdmissionSettings';

// ------------------------------------------------------------------
// Admission Center — the funnel in front of enrolment.
//
// Staff-entered only: there is no public applicant form, so every record here
// was typed by someone in the admissions office. Stage moves, merit maths and
// the CSV hand-off all happen server-side; this page only renders what the
// callables return and reports the reasons they give back.
// ------------------------------------------------------------------

const STAGE_META: Record<string, { icon: React.ReactNode; tone: string; bar: string }> = {
  enquiry: { icon: <Inbox className="w-4 h-4" />, tone: 'text-slate-600 dark:text-slate-300', bar: 'bg-slate-400' },
  application: { icon: <ClipboardList className="w-4 h-4" />, tone: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
  screening: { icon: <FilterIcon className="w-4 h-4" />, tone: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500' },
  offer: { icon: <Star className="w-4 h-4" />, tone: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  fee: { icon: <HandCoins className="w-4 h-4" />, tone: 'text-teal-600 dark:text-teal-400', bar: 'bg-teal-500' },
  enrolled: { icon: <GraduationCap className="w-4 h-4" />, tone: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  rejected: { icon: <X className="w-4 h-4" />, tone: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' },
  withdrawn: { icon: <X className="w-4 h-4" />, tone: 'text-slate-500 dark:text-slate-400', bar: 'bg-slate-500' },
};

const SOURCES = ['Walk-in', 'Referral', 'Phone', 'Website', 'Education fair', 'Social media', 'Other'];
const GENDERS = ['male', 'female', 'other'];

const BLANK_INPUT: AdmissionApplicationInput = {
  applicantName: '',
  email: '',
  phone: '',
  program: '',
  batch: '',
  source: 'Walk-in',
  gender: '',
};

function meritTone(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-teal-600 dark:text-teal-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      {children}
      {hint ? <p className="text-[11px] text-slate-400 mt-1">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  'w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500';

export default function AdmissionCenter() {
  const { applications, counts, totals, loading, error, collegeId, refresh } = useAdmissions();
  const [filters, setFilters] = useState<AdmissionFilters>(EMPTY_FILTERS);
  const filtered = useFilteredAdmissions(applications, filters);
  const cohorts = useAdmissionCohorts(applications);

  const [selected, setSelected] = useState<AdmissionApplication | null>(null);
  const [composing, setComposing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');

  // Keep the open drawer in step with the refreshed list.
  const currentSelected = useMemo(
    () => (selected ? applications.find((item) => item.id === selected.id) || selected : null),
    [selected, applications]
  );

  const ranked = useMemo(() => rankByMerit(filtered), [filtered]);

  const programs = cohorts.programs.length > 0 ? cohorts.programs : [...DEFAULT_PROGRAMS];
  const batches = cohorts.batches;

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setFormError('');
    try {
      await action();
    } catch (err) {
      setFormError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleTransition = async (to: AdmissionStatus, reason?: string) => {
    if (!currentSelected) return;
    await runAction(async () => {
      const updated = await transitionStage(currentSelected.id, to, reason, collegeId);
      setSelected(updated);
      setNotice(`${updated.applicationNo} moved to ${STAGE_LABELS[to] || to}.`);
      refresh();
    });
  };

  const handleDelete = async (application: AdmissionApplication) => {
    await runAction(async () => {
      await deleteApplication(application.id, collegeId);
      if (selected?.id === application.id) setSelected(null);
      setNotice(`${application.applicationNo} deleted.`);
      refresh();
    });
  };

  const handleExport = async () => {
    await runAction(async () => {
      const result = await exportAdmitted('fee', collegeId);
      if (result.rowCount === 0) {
        setNotice(
          result.blocked.length > 0
            ? `Nothing exported — ${result.blocked.length} application(s) are missing required fields.`
            : 'No applications are at the fee stage yet.'
        );
        return;
      }
      download(`admitted_students_${new Date().toISOString().slice(0, 10)}.csv`, result.csv);
      await markExported(result.exportedIds, collegeId);
      setNotice(
        `Exported ${result.rowCount} student${result.rowCount === 1 ? '' : 's'}.` +
          (result.blocked.length > 0 ? ` ${result.blocked.length} blocked (see details).` : '') +
          ' Upload the CSV from Student Onboarding.'
      );
      refresh();
    });
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admission Center</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enquiry to enrolment — everything before a student record exists
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button
            onClick={() => void handleExport()}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 text-sm font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export admitted
          </button>
          <button
            onClick={() => {
              setComposing(true);
              setFormError('');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> New enquiry
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-sm">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Funnel */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ADMISSION_STAGES.map((stage) => {
          const meta = STAGE_META[stage];
          const count = counts[stage] || 0;
          const share = totals.total > 0 ? Math.round((count / totals.total) * 100) : 0;
          return (
            <button
              key={stage}
              onClick={() => setFilters((prev) => ({ ...prev, stage: prev.stage === stage ? 'all' : stage }))}
              className={`p-4 rounded-2xl bg-white dark:bg-[#131b2e] border text-left transition-all ${
                filters.stage === stage
                  ? 'border-teal-400 dark:border-teal-600 ring-2 ring-teal-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${meta.tone}`}>
                {meta.icon}
                {STAGE_LABELS[stage]}
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{count}</p>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
                <div className={`h-full ${meta.bar}`} style={{ width: `${share}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Outcomes + conversion */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">In pipeline</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">{totals.inPipeline}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Reached offer</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">{totals.reachedOffer}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Rejected / withdrawn
          </p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {(counts.rejected || 0) + (counts.withdrawn || 0)}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Offer → enrol rate
          </p>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {totals.reachedOffer > 0 ? `${totals.conversionRate}%` : '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search name, email, phone, reg no…"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
          />
        </div>
        <select
          value={filters.program}
          onChange={(e) => setFilters((prev) => ({ ...prev, program: e.target.value }))}
          className={inputClass}
        >
          <option value="all">All programs</option>
          {programs.map((program) => (
            <option key={program} value={program}>
              {program}
            </option>
          ))}
        </select>
        <select
          value={filters.batch}
          onChange={(e) => setFilters((prev) => ({ ...prev, batch: e.target.value }))}
          className={inputClass}
        >
          <option value="all">All batches</option>
          {batches.map((batch) => (
            <option key={batch} value={batch}>
              {batch}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-teal-500" />
        </div>
      ) : ranked.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e]">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="font-bold text-slate-900 dark:text-white text-sm">No applications yet</p>
          <p className="text-xs text-slate-500 mt-1">Record a walk-in enquiry to start the funnel.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 font-bold">Rank</th>
                <th className="px-4 py-3 font-bold">Application</th>
                <th className="px-4 py-3 font-bold">Program / Batch</th>
                <th className="px-4 py-3 font-bold">Merit</th>
                <th className="px-4 py-3 font-bold">Stage</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ranked.map(({ application, rank }) => {
                const meta = STAGE_META[application.status] || STAGE_META.enquiry;
                return (
                  <tr
                    key={application.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => {
                      setSelected(application);
                      setFormError('');
                    }}
                  >
                    <td className="px-4 py-3">
                      {rank !== null ? (
                        <span className="text-xs font-bold text-slate-500">#{rank}</span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">not scored</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{application.applicantName}</p>
                      <p className="text-[11px] text-slate-500">
                        {application.applicationNo} · {application.phone || application.email || 'no contact'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {application.program || '—'}
                      <span className="text-slate-400"> · {application.batch || '—'}</span>
                    </td>
                    <td className={`px-4 py-3 font-bold ${meritTone(application.merit.score)}`}>
                      {application.merit.score !== null ? application.merit.score : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${meta.tone}`}>
                        {meta.icon}
                        {STAGE_LABELS[application.status] || application.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(application);
                        }}
                        disabled={busy || application.status === 'enrolled'}
                        aria-label={`Delete ${application.applicationNo}`}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Applicant drawer */}
      {currentSelected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full overflow-y-auto p-6 bg-white dark:bg-[#131b2e] border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {currentSelected.applicationNo}
                </p>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {currentSelected.applicantName}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {formError}
              </div>
            )}

            {/* Merit breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Merit</h3>
                <span className={`text-2xl font-extrabold ${meritTone(currentSelected.merit.score)}`}>
                  {currentSelected.merit.score !== null ? currentSelected.merit.score : '—'}
                </span>
              </div>
              {currentSelected.merit.components.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No screening components recorded yet. Enter qualifying marks, an entrance score or an
                  interview rating.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {currentSelected.merit.components.map((component) => (
                      <div key={component.key}>
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {component.label}
                          </span>
                          <span className="text-slate-500">
                            {component.normalized} × {component.weight}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-teal-500"
                            style={{ width: `${Math.min(100, component.normalized)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {currentSelected.merit.missing.length > 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-3 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Not scored: {currentSelected.merit.missing.join(', ')}. Weights were re-normalised
                      across what was recorded — missing items are excluded, never counted as zero.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-5">
              {[
                ['Email', currentSelected.email],
                ['Phone', currentSelected.phone],
                ['Program', currentSelected.program],
                ['Batch', currentSelected.batch],
                ['Reg no', currentSelected.regNo],
                ['Division', currentSelected.division],
                ['Previous school', currentSelected.previousSchool],
                ['Qualifying %', String(currentSelected.merit.components.find((c) => c.key === 'qualifying')?.normalized ?? '—')],
                ['Entrance', currentSelected.entranceExamType],
                ['Interview notes', currentSelected.interviewNotes],
                ['Fee paid', `${currentSelected.feePaid} / ${currentSelected.feeAmount}`],
                ['Source', currentSelected.source],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <p className="text-[11px] text-slate-500">{label}</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 break-words">
                    {String(value) || '—'}
                  </p>
                </div>
              ))}
            </div>

            {/* Stage history */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Stage history</h3>
              <div className="space-y-1.5">
                {currentSelected.stageHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">No history recorded.</p>
                ) : (
                  currentSelected.stageHistory.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold">{STAGE_LABELS[entry.stage] || entry.stage}</span>
                      <span className="text-slate-400">
                        {entry.at ? new Date(entry.at).toLocaleDateString('en-IN') : '—'} · {entry.by || 'system'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Advance */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Move to</h3>
              <div className="flex flex-wrap gap-2">
                {[...ADMISSION_STAGES, ...ADMISSION_OUTCOMES].map((status) => {
                  const allowed = nextStages(currentSelected.status).includes(status);
                  return (
                    <button
                      key={status}
                      disabled={!allowed || busy}
                      onClick={() => void handleTransition(status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        allowed
                          ? 'border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      {STAGE_LABELS[status]}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Only legal moves are enabled. An offer requires program, batch and registration number;
                the funnel cannot be skipped.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compose */}
      {composing && (
        <ComposeModal
          busy={busy}
          error={formError}
          programs={programs}
          batches={batches}
          onCancel={() => setComposing(false)}
          onSubmit={async (input) => {
            await runAction(async () => {
              const created = await saveApplication({ ...input, collegeId });
              setComposing(false);
              setSelected(created);
              setNotice(`${created.applicationNo} created.`);
              refresh();
            });
          }}
        />
      )}

      {settingsOpen && (
        <AdmissionSettings
          collegeId={collegeId}
          onClose={() => setSettingsOpen(false)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

/** The legal next stages, mirroring the server-side machine for button state. */
function nextStages(from: AdmissionStatus): AdmissionStatus[] {
  const map: Record<AdmissionStatus, AdmissionStatus[]> = {
    enquiry: ['application', 'rejected', 'withdrawn'],
    application: ['screening', 'rejected', 'withdrawn'],
    screening: ['offer', 'rejected', 'withdrawn'],
    offer: ['fee', 'rejected', 'withdrawn'],
    fee: ['enrolled', 'withdrawn'],
    enrolled: [],
    rejected: ['application'],
    withdrawn: ['enquiry'],
  };
  return map[from] || [];
}

function ComposeModal({
  busy,
  error,
  programs,
  batches,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  error: string;
  programs: string[];
  batches: string[];
  onCancel: () => void;
  onSubmit: (input: AdmissionApplicationInput) => Promise<void>;
}) {
  const [form, setForm] = useState<AdmissionApplicationInput>(BLANK_INPUT);
  const set = <K extends keyof AdmissionApplicationInput>(key: K, value: AdmissionApplicationInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const valid = form.applicantName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">New enquiry</h2>
          <button onClick={onCancel} disabled={busy} aria-label="Close">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Applicant name *">
            <input className={inputClass} value={form.applicantName} onChange={(e) => set('applicantName', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={inputClass} value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Date of birth">
            <input type="date" className={inputClass} value={form.dateOfBirth || ''} onChange={(e) => set('dateOfBirth', e.target.value)} />
          </Field>
          <Field label="Program">
            <select className={inputClass} value={form.program || ''} onChange={(e) => set('program', e.target.value)}>
              <option value="">Select…</option>
              {programs.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Batch">
            <input
              className={inputClass}
              value={form.batch || ''}
              onChange={(e) => set('batch', e.target.value)}
              placeholder="e.g. 2026"
            />
            {batches.length > 0 && (
              <p className="text-[11px] text-slate-400 mt-1">
                In use: {batches.join(', ')}
              </p>
            )}
          </Field>
          <Field label="Gender">
            <select className={inputClass} value={form.gender || ''} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Select…</option>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <select className={inputClass} value={form.source || ''} onChange={(e) => set('source', e.target.value)}>
              {SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City">
            <input className={inputClass} value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="Guardian name">
            <input className={inputClass} value={form.guardianName || ''} onChange={(e) => set('guardianName', e.target.value)} />
          </Field>
          <Field label="Previous school">
            <input className={inputClass} value={form.previousSchool || ''} onChange={(e) => set('previousSchool', e.target.value)} />
          </Field>
          <Field label="Qualifying qualification">
            <input
              className={inputClass}
              value={form.previousQualification || ''}
              onChange={(e) => set('previousQualification', e.target.value)}
              placeholder="e.g. PUC II"
            />
          </Field>
          <Field label="Qualifying percentage" hint="0–100. Leave blank if not yet known.">
            <input
              type="number"
              min={0}
              max={100}
              className={inputClass}
              value={form.qualifyingPercentage ?? ''}
              onChange={(e) => set('qualifyingPercentage', e.target.value === '' ? null : Number(e.target.value))}
            />
          </Field>
          <Field label="Note">
            <input className={inputClass} value={form.note || ''} onChange={(e) => set('note', e.target.value)} />
          </Field>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => void onSubmit(form)}
            disabled={busy || !valid}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Create enquiry
          </button>
        </div>
      </div>
    </div>
  );
}
