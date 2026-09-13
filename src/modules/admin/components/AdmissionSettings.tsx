// src/modules/admin/components/AdmissionSettings.tsx
// ------------------------------------------------------------------
// Admission Center settings: merit weights and Google Form intake.
//
// Both halves are per-college, so every value here is read from and written
// back to `colleges/{id}/config/admission` — nothing is a built-in assumption
// about how a particular college scores applicants or what its form asks.
//
// The ingest token is shown exactly once, immediately after it is generated.
// Only its hash is stored, so there is no later screen that can display it
// again; rotating produces a new token and kills the old one.
// ------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import {
  X, Loader2, Save, RotateCw, Copy, Check, KeyRound, Power, PowerOff, SlidersHorizontal,
  Link2, AlertTriangle,
} from 'lucide-react';
import {
  MAPPABLE_FIELDS,
  describeError,
  disableIntake,
  getAdmissionConfig,
  rotateIngestToken,
  saveAdmissionConfig,
  type AdmissionConfig,
  type FieldMapping,
  type IntakeDefaults,
  type MappableField,
} from '../api/admissionApi';

/** Human label + help text for each field a form question can be mapped to. */
const FIELD_HELP: Record<MappableField, { label: string; required?: boolean }> = {
  applicantName: { label: 'Applicant name', required: true },
  email: { label: 'Email' },
  phone: { label: 'Phone' },
  dateOfBirth: { label: 'Date of birth' },
  gender: { label: 'Gender' },
  guardianName: { label: 'Guardian name' },
  guardianPhone: { label: 'Guardian phone' },
  city: { label: 'City' },
  program: { label: 'Program applied for' },
  batch: { label: 'Batch' },
  previousSchool: { label: 'Previous school / college' },
  previousQualification: { label: 'Previous qualification' },
  yearOfPassing: { label: 'Year of passing' },
  qualifyingPercentage: { label: 'Qualifying percentage' },
  entranceExamType: { label: 'Entrance exam' },
  entranceRegistrationNo: { label: 'Entrance registration no.' },
  entranceScore: { label: 'Entrance score' },
  entranceMaxScore: { label: 'Entrance max score' },
};

const inputClass =
  'w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500';

const labelClass = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          },
          () => setDone(false)
        );
      }}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {done ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
      {done ? 'Copied' : label}
    </button>
  );
}

export default function AdmissionSettings({
  collegeId,
  onClose,
  onChanged,
}: {
  collegeId: string;
  onClose: () => void;
  /** Fired after a save so the parent can re-fetch the list it is showing. */
  onChanged: () => void;
}) {
  const [config, setConfig] = useState<AdmissionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [weights, setWeights] = useState({ qualifying: 50, entrance: 40, interview: 10 });
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [defaults, setDefaults] = useState<IntakeDefaults>({
    program: '',
    batch: '',
    source: 'Google Form',
    department: '',
  });
  const [intakeEnabled, setIntakeEnabled] = useState(false);

  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [tokenResult, setTokenResult] = useState<{ token: string; script: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getAdmissionConfig(collegeId || undefined);
      setConfig(data);
      setWeights(data.weights);
      setMapping(data.intake.fieldMapping);
      setDefaults(data.intake.defaults);
      setIntakeEnabled(data.intake.enabled);
    } catch (err) {
      setLoadError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = weights.qualifying + weights.entrance + weights.interview;
  const weightsValid = Math.abs(total - 100) < 0.01;

  const handleSave = async () => {
    if (!weightsValid) {
      setError(`Weights must add up to 100 — currently ${Math.round(total * 100) / 100}.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveAdmissionConfig({
        collegeId: collegeId || undefined,
        weights,
        fieldMapping: mapping,
        intakeDefaults: defaults,
        intakeEnabled,
      });
      setNotice('Settings saved. Merit scores have been recomputed with the new weights.');
      onChanged();
      await load();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRotate = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await rotateIngestToken(collegeId || undefined);
      setTokenResult({ token: result.token, script: result.script });
      setIntakeEnabled(true);
      setNotice('New ingest token generated. The previous token no longer works.');
      await load();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setError('');
    try {
      await disableIntake(collegeId || undefined);
      setTokenResult(null);
      setIntakeEnabled(false);
      setNotice('Form intake disabled. The token has been revoked.');
      await load();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const mappedCount = MAPPABLE_FIELDS.filter((field) => (mapping[field] || '').trim()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admission settings</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Applies to this college only
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-7">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading settings…
            </div>
          )}

          {!loading && loadError && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{loadError}</p>
          )}

          {!loading && !loadError && (
            <>
              {/* ── Merit weights ── */}
              <section>
                <div className="flex items-center gap-2 mb-1">
                  <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Merit weights</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  How the merit score is composed. A component no applicant has been scored on is
                  excluded and the rest are re-normalised — it is never counted as zero.
                  {!config?.weightsCustomised && ' Currently using the Vriddhi defaults.'}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ['qualifying', 'Qualifying exam'],
                      ['entrance', 'Entrance exam'],
                      ['interview', 'Interview'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className={labelClass} htmlFor={`weight-${key}`}>
                        {label} (%)
                      </label>
                      <input
                        id={`weight-${key}`}
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={weights[key]}
                        onChange={(event) => {
                          const raw = event.target.value;
                          const parsed = raw === '' ? 0 : Math.min(100, Math.max(0, Number(raw)));
                          setWeights((prev) => ({ ...prev, [key]: Number.isNaN(parsed) ? 0 : parsed }));
                        }}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
                <p
                  className={`mt-2 text-xs font-semibold ${
                    weightsValid
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  Total {Math.round(total * 100) / 100}%
                  {weightsValid ? ' — valid' : ' — must be exactly 100%'}
                </p>
              </section>

              {/* ── Google Form intake ── */}
              <section>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Google Form intake
                    </h3>
                  </div>
                  {config && (
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        intakeEnabled
                          ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {intakeEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Build the form yourself in Google Forms, paste the script below into its Apps
                  Script editor and add an <em>On form submit</em> trigger. Every submission arrives
                  here as a new enquiry — no Google sign-in or API setup required.
                </p>

                {config && (
                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    {[
                      ['Submissions received', config.intake.submissionCount],
                      ['Rejected', config.intake.rejectedCount],
                      ['Questions mapped', mappedCount],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60"
                      >
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Endpoint + token */}
                <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className={labelClass}>Ingest endpoint</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 break-all">
                        {config?.intake.endpoint || '—'}
                      </code>
                      {config?.intake.endpoint && (
                        <CopyButton text={config.intake.endpoint} label="Copy URL" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => void handleRotate()}
                      disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      {config?.intake.hasToken ? 'Rotate token' : 'Generate token'}
                    </button>
                    {config?.intake.hasToken && (
                      <button
                        onClick={() => void handleDisable()}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                      >
                        {intakeEnabled ? (
                          <PowerOff className="w-3.5 h-3.5" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                        Revoke &amp; disable
                      </button>
                    )}
                  </div>

                  {tokenResult && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
                      <p className="flex items-start gap-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Copy this token now — it is shown only once and cannot be retrieved
                          later. Anyone holding it can create enquiries for this college.
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-100 break-all">
                          {tokenResult.token}
                        </code>
                        <CopyButton text={tokenResult.token} label="Copy token" />
                      </div>
                      <div>
                        <label className={labelClass}>Apps Script — paste into the form</label>
                        <pre className="max-h-56 overflow-auto text-[11px] leading-relaxed p-3 rounded-lg bg-slate-900 text-slate-100 whitespace-pre-wrap break-all">
                          {tokenResult.script}
                        </pre>
                        <div className="mt-2">
                          <CopyButton text={tokenResult.script} label="Copy script" />
                        </div>
                      </div>
                    </div>
                  )}

                  {!tokenResult && config?.intake.hasToken && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      A token is active. Its value was shown once when it was created; rotate it to
                      see a new one.
                    </p>
                  )}

                  {config?.intake.lastSubmissionAt && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Link2 className="w-3.5 h-3.5" />
                      Last submission {new Date(config.intake.lastSubmissionAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Field mapping */}
                <div className="mt-5">
                  <label className={labelClass}>Map form questions to Vriddhi fields</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Enter the question title <strong>exactly as it appears on your form</strong>
                    (spacing and capitalisation are ignored). Unmapped questions are ignored —
                    nothing is guessed.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {MAPPABLE_FIELDS.map((field) => (
                      <div key={field}>
                        <label className={labelClass} htmlFor={`map-${field}`}>
                          {FIELD_HELP[field].label}
                          {FIELD_HELP[field].required && (
                            <span className="text-rose-500"> *</span>
                          )}
                        </label>
                        <input
                          id={`map-${field}`}
                          type="text"
                          placeholder="e.g. Full name"
                          value={mapping[field] || ''}
                          onChange={(event) =>
                            setMapping((prev) => ({ ...prev, [field]: event.target.value }))
                          }
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Defaults */}
                <div className="mt-5">
                  <label className={labelClass}>Defaults for form submissions</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Applied when the form does not ask the question — for example a single-program
                    college can set the program once instead of adding it to the form.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(
                      [
                        ['program', 'Program'],
                        ['department', 'Department'],
                        ['batch', 'Batch'],
                        ['source', 'Source label'],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className={labelClass} htmlFor={`default-${key}`}>
                          {label}
                        </label>
                        <input
                          id={`default-${key}`}
                          type="text"
                          value={defaults[key] || ''}
                          onChange={(event) =>
                            setDefaults((prev) => ({ ...prev, [key]: event.target.value }))
                          }
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {notice && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-sm">
                  <span>{notice}</span>
                  <button onClick={() => setNotice('')} aria-label="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !loadError && (
          <div className="sticky bottom-0 flex justify-end gap-2 px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
