import { useEffect, useId, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Settings2 } from 'lucide-react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { DEFAULT_RISK_SETTINGS, RISK_SETTING_RANGES, validateRiskSettings, type RiskSettings } from '../../../functions/src/riskCore';
import { getAcademicRiskConfiguration, saveAcademicRiskConfiguration, saveFacultyRiskWorkSchedule, type FacultyRiskWorkSchedule } from '../services/riskAlertsApi';
import { riskErrorMessage } from '../utils/riskAlertPresentation';

const FIELDS: Array<{ key: keyof typeof RISK_SETTING_RANGES; label: string; hint: string }> = [
  { key: 'attendanceWarningBuffer', label: 'Attendance warning buffer (percentage points)', hint: 'Warn this far above the assigned scheme minimum. The university requirement itself is never overridden.' },
  { key: 'deadlineWarningHours', label: 'Upcoming deadline warning (hours)', hint: 'Assignment due dates and assessment start windows.' },
  { key: 'registerGraceHours', label: 'Unmarked class register buffer (hours)', hint: 'Measured after the class ends, using the published timetable.' },
  { key: 'staffGraceMinutes', label: 'Faculty check-in/out buffer (minutes)', hint: 'Only for faculty with an explicit working schedule below.' },
  { key: 'curriculumLagDays', label: 'Curriculum delay tolerance (days)', hint: 'Dated topics must belong to an active approved curriculum assignment.' },
  { key: 'curriculumLagPercent', label: 'Curriculum lag buffer (%)', hint: 'Allowed share of past-due dated topics still uncovered. Undated syllabus topics are a coverage warning.' },
  { key: 'gradingBacklogDays', label: 'Grading deadline (days)', hint: 'Measured after the later of the assignment/test closing time and actual submission.' },
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const input = 'mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600';
const button = 'portal-motion-target inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed';
const emptySchedule = (): Omit<FacultyRiskWorkSchedule, 'facultyUid'> => ({ days: [], startTime: '', endTime: '', effectiveFrom: '', effectiveTo: '', excludedDates: [] });

export default function AcademicRiskSettings() {
  const id = useId();
  const client = useQueryClient();
  const { user } = useAuth();
  const configKey = ['academic-risk-configuration', user?.uid || user?.id, user?.collegeId];
  const config = useQuery({ queryKey: configKey, queryFn: getAcademicRiskConfiguration, retry: false, staleTime: Infinity, refetchOnWindowFocus: false });
  const [settings, setSettings] = useState<RiskSettings>({ ...DEFAULT_RISK_SETTINGS });
  const [revision, setRevision] = useState(0);
  const [facultyUid, setFacultyUid] = useState('');
  const [schedule, setSchedule] = useState(emptySchedule);
  const [exclusions, setExclusions] = useState('');
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState('');
  useEffect(() => { if (config.data) { setSettings(config.data.settings); setRevision(config.data.revision); } }, [config.data]);
  useEffect(() => {
    const existing = config.data?.schedules.find(s => s.facultyUid === facultyUid);
    setSchedule(existing ? { days: existing.days, startTime: existing.startTime, endTime: existing.endTime, effectiveFrom: existing.effectiveFrom, effectiveTo: existing.effectiveTo, excludedDates: existing.excludedDates } : emptySchedule());
    setExclusions(existing?.excludedDates.join(', ') || '');
  }, [facultyUid, config.data]);
  const saved = async (text: string) => { setMessage(text); await client.invalidateQueries({ queryKey: configKey }); };
  const save = useMutation({ mutationFn: async () => saveAcademicRiskConfiguration(validateRiskSettings(settings), revision), onSuccess: () => saved('Warning settings saved. They apply to the next monthly review; saving does not start a check.') });
  const work = useMutation({ mutationFn: (remove: boolean) => saveFacultyRiskWorkSchedule(facultyUid, remove ? null : { ...schedule, excludedDates: exclusions.split(/[\s,]+/).filter(Boolean) }), onSuccess: (_data, remove) => saved(remove ? 'Working schedule removed for the next monthly review. Previously saved alerts are unchanged until then.' : 'Working schedule saved for the next monthly review. Missing check-in/out is only checked within its effective dates.') });
  const error = validation || (save.error ? riskErrorMessage(save.error) : work.error ? riskErrorMessage(work.error) : '');
  if (config.isPending) return <p role="status" className="text-sm text-slate-600 dark:text-slate-400">Loading college warning settings…</p>;
  if (config.isError) return <div role="alert" className="text-sm text-rose-800 dark:text-rose-300">{riskErrorMessage(config.error)} <button type="button" onClick={() => void config.refetch()} className="underline">Retry settings</button></div>;
  return <section aria-labelledby={`${id}-title`} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-6">
    <h2 id={`${id}-title`} className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white"><Settings2 size={20} aria-hidden="true" />College warning settings</h2>
    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Principal-managed · revision {revision} · times and working dates use IST. Changes apply to the next monthly review; saving cannot start a check. Settings do not change academic policy, exam eligibility or recorded marks.</p>
    {config.data?.truncated && <p className="mt-3 text-sm text-amber-900 dark:text-amber-200">The staff/schedule directory is limited to 500 entries. Contact your platform administrator to manage entries not listed here.</p>}
    <form className="mt-5 space-y-5" onSubmit={event => { event.preventDefault(); setValidation(''); setMessage(''); save.reset(); work.reset(); try { validateRiskSettings(settings); save.mutate(); } catch (e) { setValidation(riskErrorMessage(e)); } }}>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><input type="checkbox" checked={settings.enabled} onChange={e => setSettings({ ...settings, enabled: e.target.checked })} className="h-4 w-4 accent-teal-700" />Enable monthly academic reviews</label>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(field => <div key={field.key}>
          <label htmlFor={`${id}-${field.key}`} className="text-xs font-bold text-slate-800 dark:text-slate-200">{field.label}</label>
          <input id={`${id}-${field.key}`} type="number" min={RISK_SETTING_RANGES[field.key][0]} max={RISK_SETTING_RANGES[field.key][1]} step={1} required value={Number.isNaN(settings[field.key]) ? '' : settings[field.key]} aria-describedby={`${id}-${field.key}-hint`} onChange={e => setSettings({ ...settings, [field.key]: e.target.value === '' ? NaN : Number(e.target.value) })} className={input} />
          <p id={`${id}-${field.key}-hint`} className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{field.hint}</p>
        </div>)}
      </div>
      <button type="submit" disabled={save.isPending} className={button}><Save size={15} aria-hidden="true" className="portal-interactive-icon" />{save.isPending ? 'Saving…' : 'Save warning settings'}</button>
    </form>
    <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
      <h3 className="font-bold text-slate-900 dark:text-white">Faculty working schedules</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">Separate from the class timetable. No schedule means no check-in/out risk is inferred. Leave, medical leave, on-duty/WFH records, excluded dates and public/college holidays are skipped.</p>
      <form className="mt-4 space-y-4" onSubmit={event => { event.preventDefault(); setMessage(''); setValidation(''); save.reset(); work.reset(); if (!facultyUid) { setValidation('Choose a faculty member.'); return; } work.mutate(false); }}>
        <div><label htmlFor={`${id}-faculty`} className="text-xs font-bold text-slate-800 dark:text-slate-200">Faculty member</label>
          <select id={`${id}-faculty`} value={facultyUid} required onChange={e => setFacultyUid(e.target.value)} className={input}><option value="">Choose verified staff</option>{config.data?.faculty.map(f => <option key={f.uid} value={f.uid}>{f.name}</option>)}</select></div>
        <fieldset><legend className="text-xs font-bold text-slate-800 dark:text-slate-200">Working weekdays</legend><div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">{DAYS.map((day, n) => <label key={day} className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"><input type="checkbox" checked={schedule.days.includes(n)} onChange={e => setSchedule({ ...schedule, days: e.target.checked ? [...schedule.days, n] : schedule.days.filter(d => d !== n) })} className="accent-teal-700 h-4 w-4" />{day}</label>)}</div></fieldset>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">{([
          ['startTime', 'Check-in time (IST)', 'time'], ['endTime', 'Check-out time (IST)', 'time'],
          ['effectiveFrom', 'Effective from', 'date'], ['effectiveTo', 'Effective to (optional)', 'date'],
        ] as const).map(([field, label, type]) => <div key={field}><label htmlFor={`${id}-${field}`} className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</label><input id={`${id}-${field}`} type={type} required={field !== 'effectiveTo'} value={schedule[field]} onChange={e => setSchedule({ ...schedule, [field]: e.target.value })} className={`${input} min-w-0`} /></div>)}</div>
        <div><label htmlFor={`${id}-exclusions`} className="text-xs font-bold text-slate-800 dark:text-slate-200">Excluded working dates (comma-separated yyyy-mm-dd)</label><textarea id={`${id}-exclusions`} rows={2} value={exclusions} onChange={e => setExclusions(e.target.value)} className={input} /></div>
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={!facultyUid || work.isPending} className={button}>{work.isPending ? 'Saving…' : 'Save faculty schedule'}</button>
          <button type="button" disabled={work.isPending || !config.data?.schedules.some(s => s.facultyUid === facultyUid)} onClick={() => { setMessage(''); setValidation(''); work.mutate(true); }} className="portal-motion-target rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40">Remove schedule</button></div>
      </form>
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-rose-800 dark:text-rose-300">{error}</p>}
    {message && <p role="status" className="mt-4 text-sm text-teal-800 dark:text-teal-200">{message}</p>}
  </section>;
}
