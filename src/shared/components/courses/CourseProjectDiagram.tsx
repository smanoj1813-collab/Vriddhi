import { useId, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, RotateCcw } from 'lucide-react'
import type { CourseDiagram, CourseScheduleDiagram } from '@/shared/courses/illustrationTypes'
import { analyseCourseSchedule, applyCourseResourceConstraint, summariseCourseBoard } from '@/shared/courses/projectDiagrams'
import type { CourseScheduleAnalysis } from '@/shared/courses/projectDiagrams'

const criticalTone = 'border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-100'
const floatTone = 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-100'

function ScheduleTimeline({ analysis }: { analysis: CourseScheduleAnalysis }) {
  const ticks = [...new Set([0, ...[1, 2, 3].map((part) => Math.round(analysis.duration * part / 4)), analysis.duration])]
  return (
    <div role="region" aria-label="Working-day timeline, scroll horizontally if needed" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-900">
      <div className="min-w-[360px]" aria-hidden="true">
        <div className="mb-3 grid grid-cols-[4.5rem_1fr] gap-3 text-[10px] font-bold text-slate-600 dark:text-slate-300">
          <span>Task · days</span><div className="relative h-5 border-b border-slate-300 dark:border-slate-600">{ticks.map((day) => <span key={day} className="absolute top-0" style={{ left: `${day / analysis.duration * 100}%`, transform: day === 0 ? undefined : 'translateX(-100%)' }}>{day}</span>)}</div>
        </div>
        <div className="space-y-2.5">
          {analysis.tasks.map((task) => (
            <div key={task.id} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{task.id} · {task.duration}d</span>
              <div className="relative h-8 rounded bg-slate-100 dark:bg-slate-800">
                {task.totalFloat > 0 ? <div className="absolute inset-y-1 rounded-r border border-dashed border-indigo-500 bg-indigo-100 dark:bg-indigo-950" style={{ left: `${task.earliestFinish / analysis.duration * 100}%`, width: `${task.totalFloat / analysis.duration * 100}%` }} /> : null}
                <div className={`absolute inset-y-0 flex items-center justify-center rounded text-[10px] font-extrabold text-white ${task.critical ? 'bg-teal-700' : 'bg-indigo-600'}`} style={{ left: `${task.earliestStart / analysis.duration * 100}%`, width: `${task.duration / analysis.duration * 100}%` }}>{task.id}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-slate-600 dark:text-slate-300">Day zero → day {analysis.duration} · filled bar = task duration · dashed extension = total float</p>
      </div>
      <p className="sr-only">Earliest-start schedule, proportional to working days. {analysis.tasks.map((task) => `${task.id}, ${task.label}: starts day ${task.earliestStart}, finishes day ${task.earliestFinish}, duration ${task.duration} working days, total float ${task.totalFloat} days, ${task.critical ? 'critical' : 'not critical'}.`).join(' ')}</p>
    </div>
  )
}

function ScheduleNetwork({ analysis }: { analysis: CourseScheduleAnalysis }) {
  const id = useId().replace(/:/g, '')
  const maxDepth = Math.max(...analysis.tasks.map((task) => task.depth))
  const width = (maxDepth + 1) * 126 + 28
  const levels = Array.from({ length: maxDepth + 1 }, (_, depth) => analysis.tasks.filter((task) => task.depth === depth))
  const height = Math.max(160, Math.max(...levels.map((level) => level.length)) * 92 + 26)
  const positions = new Map(analysis.tasks.map((task) => {
    const level = levels[task.depth]
    return [task.id, { x: 14 + task.depth * 126, y: height / 2 + (level.indexOf(task) - (level.length - 1) / 2) * 92 - 27 }]
  }))
  return (
    <div role="region" aria-label="Dependency network, scroll horizontally if needed" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 bg-white focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-900">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>Finish-to-start dependency network</title>
        <desc id={`${id}-desc`}>Arrows show dependencies, not a time scale. {analysis.tasks.map((task) => `${task.id}, ${task.label}, ${task.duration} working days, after ${task.predecessors.join(' and ') || 'project start'}, ${task.critical ? 'critical' : `${task.totalFloat} days total float`}.`).join(' ')}</desc>
        <defs><marker id={`${id}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#64748b" /></marker></defs>
        {analysis.tasks.flatMap((task) => task.predecessors.map((predecessor) => {
          const from = positions.get(predecessor)!
          const to = positions.get(task.id)!
          const middle = (from.x + 94 + to.x) / 2
          return <path key={`${predecessor}-${task.id}`} d={`M${from.x + 94},${from.y + 27} C${middle},${from.y + 27} ${middle},${to.y + 27} ${to.x - 3},${to.y + 27}`} fill="none" stroke="#64748b" strokeWidth="1.8" markerEnd={`url(#${id}-arrow)`} />
        }))}
        {analysis.tasks.map((task) => {
          const point = positions.get(task.id)!
          return <g key={task.id}><rect x={point.x} y={point.y} width="94" height="54" rx="10" fill={task.critical ? '#0f766e' : '#4f46e5'} /><text x={point.x + 47} y={point.y + 22} textAnchor="middle" fill="white" fontSize="14" fontWeight="800">{task.id} · {task.duration}d</text><text x={point.x + 47} y={point.y + 41} textAnchor="middle" fill="white" fontSize="10">{task.critical ? 'Critical · 0 float' : `${task.totalFloat}d float`}</text></g>
        })}
      </svg>
    </div>
  )
}

function ScheduleData({ analysis }: { analysis: CourseScheduleAnalysis }) {
  return (
    <details className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900">
      <summary className="cursor-pointer font-bold text-teal-800 focus-visible:outline-teal-600 dark:text-teal-200">View schedule calculations and task details</summary>
      <div role="region" aria-label="Schedule calculation table, scroll horizontally if needed" tabIndex={0} className="mt-3 overflow-x-auto focus-visible:outline-teal-600">
        <table className="w-full min-w-[620px] text-left text-xs">
          <caption className="mb-3 text-left leading-5 text-slate-600 dark:text-slate-300">All values are working days from day zero. ES/EF = earliest start/finish; LS/LF = latest start/finish without moving this model’s finish. Total float = LS − ES. Critical tasks have zero float.</caption>
          <thead><tr className="border-b border-slate-200 dark:border-slate-700">{['Task', 'Duration', 'After', 'ES', 'EF', 'LS', 'LF', 'Float'].map((heading) => <th key={heading} scope="col" className="px-2 py-2 first:pl-0">{heading}</th>)}</tr></thead>
          <tbody>{analysis.tasks.map((task) => <tr key={task.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><th scope="row" className="py-3 pr-3 font-semibold"><span className="block">{task.id} · {task.label}</span><span className="mt-1 block text-[11px] font-normal leading-5 text-slate-600 dark:text-slate-300">{task.detail}</span></th>{[task.duration, task.predecessors.join(', ') || 'Start', task.earliestStart, task.earliestFinish, task.latestStart, task.latestFinish, task.totalFloat].map((value, index) => <td key={index} className="px-2 py-3 tabular-nums">{value}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  )
}

export function ProjectScheduleDiagram({ diagram }: { diagram: CourseScheduleDiagram }) {
  const [durations, setDurations] = useState(() => Object.fromEntries(diagram.items.map((task) => [task.id, task.duration])))
  const [levelResources, setLevelResources] = useState(false)
  const [view, setView] = useState(diagram.view ?? 'timeline')
  const id = useId()
  const tasks = diagram.items.map((task) => ({ ...task, duration: durations[task.id] }))
  const analysis = analyseCourseSchedule(levelResources && diagram.resourceConstraint ? applyCourseResourceConstraint(tasks, diagram.resourceConstraint) : tasks)
  return (
    <div className="course-schedule space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">{view === 'timeline' ? 'To-scale timeline' : 'Dependency network · not to time scale'}</p>
        {diagram.interactive ? <div role="group" aria-label="Schedule diagram view" className="inline-flex gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-700">{(['timeline', 'network'] as const).map((choice) => <button key={choice} type="button" aria-pressed={view === choice} onClick={() => setView(choice)} className={`min-h-9 rounded-md px-3 text-xs font-bold focus-visible:outline-teal-600 ${view === choice ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`}>{choice === 'timeline' ? 'Timeline' : 'Dependencies'}</button>)}</div> : null}
      </div>
      <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">On narrow screens, scroll the diagram sideways to see the full plan. Task names, dependencies and exact day values are in the calculations below.</p>
      {view === 'timeline' ? <ScheduleTimeline analysis={analysis} /> : <ScheduleNetwork analysis={analysis} />}
      <div className="flex flex-wrap gap-2 text-[10px] font-bold"><span className={`rounded-md border px-2 py-1 ${criticalTone}`}>Critical · zero float</span><span className={`rounded-md border px-2 py-1 ${floatTone}`}>Non-critical · has float</span></div>
      <output className="block rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold leading-6 text-white" aria-live={diagram.interactive ? 'polite' : undefined}>Earliest finish: day {analysis.duration} · Critical tasks: {analysis.criticalTaskIds.join(', ')}</output>
      <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">Finish-to-start, no lag, day zero, working days only; holidays ignored. {levelResources ? `Resource order applied: ${diagram.resourceConstraint?.before} before ${diagram.resourceConstraint?.after}.` : 'Unlimited resources in this dependency-only model.'} Critical tasks can span more than one path. This is a teaching model, not a promised launch date.</p>
      {diagram.interactive ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-800 dark:bg-teal-950/30">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-extrabold uppercase tracking-wider text-teal-900 dark:text-teal-100">Schedule sandbox</p><button type="button" onClick={() => { setDurations(Object.fromEntries(diagram.items.map((task) => [task.id, task.duration]))); setLevelResources(false); setView(diagram.view ?? 'timeline') }} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-teal-900 underline underline-offset-2 focus-visible:outline-teal-600 dark:text-teal-100"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Reset schedule</button></div>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Change one assumption at a time. Recalculate the finish and float; do not overwrite the published fixture in your submitted workbook.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{diagram.items.map((task) => <div key={task.id}><label htmlFor={`${id}-${task.id}`} className="flex items-start justify-between gap-2 text-xs font-semibold leading-5 text-slate-800 dark:text-slate-100"><span>{task.id} · {task.label} duration</span><span className="shrink-0 tabular-nums">{durations[task.id]}d</span></label><input id={`${id}-${task.id}`} type="range" min="1" max="20" step="1" value={durations[task.id]} onChange={(event) => setDurations((current) => ({ ...current, [task.id]: Number(event.target.value) }))} className="mt-1 h-7 w-full accent-teal-700" /></div>)}</div>
          {diagram.resourceConstraint ? <label className="mt-4 flex min-h-10 cursor-pointer items-start gap-2 rounded-lg border border-teal-200 bg-white p-3 text-xs font-semibold leading-5 text-slate-800 dark:border-teal-800 dark:bg-slate-900 dark:text-slate-100"><input type="checkbox" checked={levelResources} onChange={(event) => setLevelResources(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700" /><span>{diagram.resourceConstraint.label}</span></label> : null}
          <p className="mt-2 text-[11px] leading-5 text-slate-600 dark:text-slate-300">The resource switch adds only the stated task order. It is not a general resource optimiser and does not model part-time calendars, effort, costs or other resource conflicts.</p>
        </div>
      ) : null}
      <ScheduleData analysis={analysis} />
    </div>
  )
}

export function ProjectBoardDiagram({ diagram }: { diagram: Extract<CourseDiagram, { kind: 'board' }> }) {
  const summary = summariseCourseBoard(diagram.items)
  return (
    <div className="course-board space-y-3">
      <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">Illustrative work board <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></p>
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{diagram.items.map((column, index) => <li key={column.label} className={`min-w-0 rounded-xl border p-3 ${summary[index].overLimit ? 'border-amber-400 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-950/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'}`}><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold text-slate-900 dark:text-white">{column.label}</p><span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{summary[index].count}{column.wipLimit ? ` / limit ${column.wipLimit}` : column.complete ? ' complete' : ' items'}</span></div><p className="mt-2 text-[11px] leading-5 text-slate-600 dark:text-slate-300">{column.detail}</p>{summary[index].overLimit ? <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-200"><AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />WIP limit exceeded · help finish work</p> : null}<ul className="mt-3 space-y-2">{column.cards.map((card) => <li key={card.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"><p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{card.id}</p><p className="mt-1 text-xs font-bold leading-5 text-slate-900 dark:text-white">{card.label}</p><p className="mt-1 text-[11px] leading-5 text-slate-600 dark:text-slate-300">{card.detail}</p>{card.blocked ? <p className="mt-2 inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"><AlertTriangle className="h-3 w-3" aria-hidden="true" />Blocked · still counts in WIP</p> : null}{column.complete ? <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-teal-800 dark:text-teal-200"><Check className="h-3 w-3" aria-hidden="true" />Complete under this board’s policy</p> : null}</li>)}{column.cards.length === 0 ? <li className="rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">No items in this example</li> : null}</ul></li>)}</ol>
      <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">Counts describe this snapshot, not individual productivity. Active WIP here: {summary.reduce((total, column) => total + column.activeCount, 0)} items, including {summary.reduce((total, column) => total + (column.activeCount ? column.blocked : 0), 0)} blocked. The displayed non-complete columns define this example’s WIP boundary; your board may use a different start point.</p>
    </div>
  )
}

export function ProjectRaciDiagram({ diagram }: { diagram: Extract<CourseDiagram, { kind: 'raci' }> }) {
  return (
    <div className="course-raci">
      <p className="mb-3 text-xs leading-5 text-slate-600 dark:text-slate-300">On narrow screens, scroll the table sideways to compare all roles. Keyboard users can focus the table region and use the arrow keys.</p>
      <div role="region" aria-label="RACI responsibility table, scroll horizontally if needed" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full min-w-[500px] text-left text-xs">
          <caption className="mb-3 text-left text-xs leading-5 text-slate-600 dark:text-slate-300">Illustrative role agreement, not an actual appointment or approval. One accountable role and at least one responsible role per row.</caption>
          <thead><tr className="border-b border-slate-200 dark:border-slate-700"><th scope="col" className="py-3 pr-3">Deliverable / decision</th>{diagram.roles.map((role) => <th key={role} scope="col" className="px-2 py-3 text-center">{role}</th>)}</tr></thead>
          <tbody>{diagram.items.map((row) => <tr key={row.label} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><th scope="row" className="py-3 pr-3 font-semibold"><span className="block">{row.label}</span><span className="mt-1 block text-[11px] font-normal leading-5 text-slate-600 dark:text-slate-300">{row.detail}</span></th>{row.assignments.map((code, index) => <td key={diagram.roles[index]} className="px-2 py-3 text-center"><span className={`inline-flex min-h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[10px] font-extrabold ${code.includes('A') ? criticalTone : code === 'R' ? floatTone : 'text-slate-600 dark:text-slate-300'}`} aria-label={code === 'RA' ? 'Responsible and Accountable' : ({ R: 'Responsible', A: 'Accountable', C: 'Consulted', I: 'Informed', '—': 'No assigned involvement' } as const)[code]}>{code}</span></td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-600 dark:text-slate-300"><strong>R</strong> does the work · <strong>A</strong> is answerable for the result · <strong>C</strong> gives input · <strong>I</strong> receives updates · <strong>RA</strong> combines R and A · <strong>—</strong> no assigned involvement. Confirm the agreement with the roles concerned; separate unrelated approvals into different rows.</p>
    </div>
  )
}
