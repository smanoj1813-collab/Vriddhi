import { useId, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { CourseDiagram, CourseWorkforceScenario } from '@/shared/courses/illustrationTypes'
import { assembleCoursePrompt, calculateCourseWorkforce } from '@/shared/courses/courseVisualLabs'

const format = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
const buttonStyle = 'inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-bold text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-teal-700 dark:bg-slate-900 dark:text-teal-200'

export function CoursePromptLab({ diagram, activeItem }: { diagram: Extract<CourseDiagram, { kind: 'prompt' }>; activeItem?: number | null }) {
  const [included, setIncluded] = useState(() => diagram.items.map(() => true))
  const id = useId()
  const prompt = assembleCoursePrompt(diagram.items, included)
  return (
    <div className="course-prompt-lab">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-200">Build a CO-STAR brief</p>
        <button type="button" className={buttonStyle} onClick={() => setIncluded(diagram.items.map(() => true))}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset prompt</button>
      </div>
      <fieldset>
        <legend className="mb-3 text-xs leading-6 text-slate-600 dark:text-slate-300">Include or remove a part. Notice which instruction disappears from the assembled prompt.</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {diagram.items.map((item, index) => (
            <label key={item.label} className="course-diagram-item flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 dark:border-indigo-900 dark:bg-indigo-950/30" data-active={activeItem === index || undefined}>
              <input type="checkbox" checked={included[index]} aria-label={`Include ${item.label}`} onChange={(event) => setIncluded((current) => current.map((value, part) => part === index ? event.target.checked : value))} className="mt-1 h-4 w-4 shrink-0 accent-teal-700" />
              <span className="min-w-0"><span className="block text-sm font-extrabold text-slate-900 dark:text-white">{item.label}</span><span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor={`${id}-prompt`} className="mb-2 mt-5 block text-xs font-bold text-slate-800 dark:text-slate-200">Assembled practice prompt · editable work happens in your own copy</label>
      <textarea id={`${id}-prompt`} aria-label="Assembled practice prompt" readOnly rows={14} value={prompt || 'No parts selected. Add a brief component above.'} className="w-full min-w-0 rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:border-slate-700" />
      <output aria-live="polite" className="mt-2 block text-xs font-semibold text-teal-800 dark:text-teal-200">{included.filter(Boolean).length} of 6 brief parts included — not a truth or quality score.</output>
      <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">Local demonstration only: no AI request is sent and no learner text is collected. The scenario is fictional. Replace placeholders with authorised evidence, test the response and check facts yourself; a complete brief cannot guarantee correctness.</p>
    </div>
  )
}

const workforceFields: { key: keyof CourseWorkforceScenario; label: string; hint: string }[] = [
  { key: 'opening', label: 'Opening headcount', hint: 'The fixed cohort at the start of this one period.' },
  { key: 'joiners', label: 'Joiners in period', hint: 'New people who enter during this same period.' },
  { key: 'openingLeavers', label: 'Leavers from opening cohort', hint: 'Only departures from the original cohort.' },
  { key: 'joinerLeavers', label: 'Leavers among period joiners', hint: 'New joiners who also leave before period end.' },
]

export function CourseWorkforceLab({ diagram, activeItem }: { diagram: Extract<CourseDiagram, { kind: 'workforce' }>; activeItem?: number | null }) {
  const [scenario, setScenario] = useState({ ...diagram.scenario })
  const id = useId()
  const result = calculateCourseWorkforce(scenario)
  const values = [scenario.opening, scenario.joiners, result.leavers, result.closing]
  const percentage = (value: number | null) => value === null ? 'Not defined (zero denominator)' : `${format.format(value)}%`
  const update = (key: keyof CourseWorkforceScenario, value: number) => setScenario((current) => {
    const next = { ...current, [key]: value }
    next.openingLeavers = Math.min(next.openingLeavers, next.opening)
    next.joinerLeavers = Math.min(next.joinerLeavers, next.joiners)
    return next
  })
  return (
    <div className="course-workforce-lab">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-200">Explore the denominators</p><button type="button" className={buttonStyle} onClick={() => setScenario({ ...diagram.scenario })}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset workforce</button></div>
      <p className="mb-4 text-xs leading-6 text-slate-600 dark:text-slate-300">One synthetic period, not an annual forecast. Each person can join and leave at most once; rehires and transfers are outside this model.</p>
      <ol className="grid gap-3 sm:grid-cols-2">
        {diagram.items.map((item, index) => <li key={item.label} data-active={activeItem === index || undefined} className="course-diagram-item min-w-0 rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/30"><p className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-200">{index === 1 ? '+ ' : index === 2 ? '− ' : index === 3 ? '= ' : ''}{item.label}</p><p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-950 dark:text-white">{format.format(values[index])} <span className="text-xs font-medium text-slate-600 dark:text-slate-300">people</span></p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</p></li>)}
      </ol>
      <fieldset className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <legend className="px-1 text-xs font-bold text-slate-800 dark:text-slate-100">Change a count · whole people only</legend>
        <div className="space-y-4">
          {workforceFields.map(({ key, label, hint }) => {
            const maximum = key === 'openingLeavers' ? scenario.opening : key === 'joinerLeavers' ? scenario.joiners : 200
            return <div key={key}><label htmlFor={`${id}-${key}`} className="flex justify-between gap-3 text-xs font-semibold text-slate-800 dark:text-slate-100"><span>{label}</span><span aria-hidden="true" className="tabular-nums">{scenario[key]}</span></label><input id={`${id}-${key}`} type="range" min="0" max={maximum} step="1" value={scenario[key]} aria-label={label} aria-describedby={`${id}-${key}-hint`} onChange={(event) => update(key, Number(event.target.value))} className="mt-1 h-6 w-full accent-teal-700" /><p id={`${id}-${key}-hint`} className="text-[11px] leading-5 text-slate-600 dark:text-slate-300">{hint}{key === 'opening' || key === 'joiners' ? ' Reducing this cohort also caps its leavers.' : ''}</p></div>
          })}
        </div>
      </fieldset>
      <output aria-live="polite" className="mt-4 block rounded-xl bg-slate-950 p-4 text-sm font-bold leading-7 text-white">Period turnover: {percentage(result.turnover)} · Opening-cohort retention: {percentage(result.retention)}</output>
      <dl className="mt-3 space-y-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
        <div><dt className="inline font-bold text-slate-800 dark:text-slate-100">Turnover: </dt><dd className="inline">{result.leavers} exits ÷ {format.format(result.average)} approximate average headcount × 100. Average = ({scenario.opening} + {result.closing}) ÷ 2.</dd></div>
        <div><dt className="inline font-bold text-slate-800 dark:text-slate-100">Retention: </dt><dd className="inline">{result.retained} original members remaining ÷ {scenario.opening} opening members × 100. New joiners are not in this denominator.</dd></div>
      </dl>
      <p className="mt-3 text-xs leading-6 text-slate-600 dark:text-slate-300">Opening/closing average is an approximation, not person-time exposure. Turnover can exceed 100%; retention cannot. Zero denominators are undefined, not 0%. These measures are not complements, diagnoses or individual employment-risk scores. This is a separate interactive scenario, not a change to the lesson’s worked values.</p>
    </div>
  )
}
