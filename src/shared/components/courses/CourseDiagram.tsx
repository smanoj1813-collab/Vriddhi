import { useId, useState } from 'react'
import {
  ArrowDown, ArrowRight, BarChart3, BookOpen, BriefcaseBusiness, Check,
  Clock3, FileText, Filter, Globe2, Heart, Layers3, Link2, Mail, Megaphone,
  MessageCircle, MousePointer2, RotateCcw, Search, ShieldCheck, Sparkles,
  Target, Users,
} from 'lucide-react'
import type { CourseDiagram, CourseDiagramIcon, CourseDiagramItem } from '@/shared/courses/illustrationTypes'
import { costPerAcquisition, forecastFunnel } from '@/shared/courses/courseIllustrations'
import { ProjectBoardDiagram, ProjectRaciDiagram, ProjectScheduleDiagram } from './CourseProjectDiagram'

const icons = {
  target: Target, users: Users, search: Search, globe: Globe2, message: MessageCircle,
  mail: Mail, chart: BarChart3, shield: ShieldCheck, check: Check, clock: Clock3,
  heart: Heart, file: FileText, layers: Layers3, filter: Filter, repeat: RotateCcw,
  megaphone: Megaphone, cursor: MousePointer2, sparkles: Sparkles,
  briefcase: BriefcaseBusiness, link: Link2,
}
const tones = [
  'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200',
  'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200',
  'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
]
const fills = ['#0f766e', '#4f46e5', '#b45309', '#0369a1', '#7e22ce', '#be123c']
const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export function DiagramIcon({ name, className = 'h-5 w-5' }: { name?: CourseDiagramIcon; className?: string }) {
  const Icon = name ? icons[name] : BookOpen
  return <Icon className={className} aria-hidden="true" />
}

function DiagramLegend({ items }: { items: CourseDiagramItem[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <li key={item.label} className="flex gap-2.5">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${tones[index % tones.length]}`} aria-hidden="true">{index + 1}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.label}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function LinearDiagram({ diagram }: { diagram: Extract<CourseDiagram, { kind: 'flow' | 'cycle' | 'hub' | 'compare' }> }) {
  const flow = diagram.kind === 'flow'
  return (
    <ol className={`grid gap-3 ${flow ? 'sm:grid-cols-2' : 'sm:grid-cols-2'} ${diagram.items.length === 3 ? 'xl:grid-cols-3' : ''}`}>
      {diagram.items.map((item, index) => (
        <li key={item.label} className={`relative min-w-0 rounded-xl border p-4 ${tones[index % tones.length]}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-slate-900/70"><DiagramIcon name={item.icon} /></span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              {flow ? `Step ${index + 1}` : `0${index + 1}`}
              {flow && index < diagram.items.length - 1 ? <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            </span>
          </div>
          <p className="mt-3 text-sm font-extrabold">{item.label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-700 dark:text-slate-300">{item.detail}</p>
        </li>
      ))}
    </ol>
  )
}

/** Vector relationship map; its numbered HTML legend is the full text equivalent. */
function OrbitDiagram({ diagram }: { diagram: Extract<CourseDiagram, { kind: 'flow' | 'cycle' | 'hub' | 'compare' }> }) {
  const id = useId().replace(/:/g, '')
  const isCycle = diagram.kind === 'cycle'
  const points = diagram.items.map((_, index) => {
    const angle = (index / diagram.items.length) * 2 * Math.PI - Math.PI / 2
    return { x: 260 + Math.cos(angle) * 167, y: 144 + Math.sin(angle) * 99 }
  })
  return (
    <div className="space-y-5">
      <svg viewBox="0 0 520 290" className="mx-auto w-full max-w-md" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>{isCycle ? 'Continuous improvement cycle' : 'Connected system map'}: {diagram.center ?? 'The shared goal'}</title>
        <desc id={`${id}-desc`}>{isCycle ? 'Follow the arrows in numbered order and return to the first step.' : 'Every numbered idea connects to the central goal.'} {diagram.items.map((item, index) => `${index + 1}. ${item.label}: ${item.detail}`).join(' ')}</desc>
        <defs>
          <marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="none" stroke="#64748b" strokeWidth="1.5" /></marker>
        </defs>
        <ellipse cx="260" cy="144" rx="167" ry="99" fill="none" stroke="currentColor" strokeDasharray="3 7" className="text-slate-300 dark:text-slate-600" />
        {points.map((point, index) => {
          const next = points[(index + 1) % points.length]
          const dx = next.x - point.x
          const dy = next.y - point.y
          const distance = Math.hypot(dx, dy)
          return isCycle ? (
            <line key={`line-${index}`} x1={point.x + dx / distance * 34} y1={point.y + dy / distance * 34} x2={next.x - dx / distance * 39} y2={next.y - dy / distance * 39} stroke="#64748b" strokeWidth="2" markerEnd={`url(#${id}-arrow)`} />
          ) : <line key={`line-${index}`} x1="260" y1="144" x2={point.x} y2={point.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5" />
        })}
        <rect x="201" y="113" width="118" height="62" rx="18" fill="#0f172a" />
        <text x="260" y="140" textAnchor="middle" fill="#99f6e4" fontSize="11" fontWeight="700" letterSpacing="1.2">{isCycle ? 'THE LOOP' : 'THE GOAL'}</text>
        <text x="260" y="160" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">{diagram.center ?? 'Customer value'}</text>
        {points.map((point, index) => {
          const Icon = icons[diagram.items[index].icon ?? 'target']
          return (
            <g key={`node-${index}`}>
              <circle cx={point.x} cy={point.y} r="29" fill={fills[index % fills.length]} />
              <Icon x={point.x - 11} y={point.y - 11} width="22" height="22" color="white" strokeWidth="1.7" aria-hidden="true" />
              <circle cx={point.x + 24} cy={point.y - 21} r="11" fill="white" stroke={fills[index % fills.length]} strokeWidth="2" />
              <text x={point.x + 24} y={point.y - 17} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="800">{index + 1}</text>
            </g>
          )
        })}
      </svg>
      <DiagramLegend items={diagram.items} />
    </div>
  )
}

function DataTable({ items, unit, rates }: { items: (CourseDiagramItem & { value: number })[]; unit: string; rates?: number[] }) {
  return (
    <details className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
      <summary className="cursor-pointer font-semibold text-teal-800 focus-visible:outline-teal-600 dark:text-teal-200">View chart data</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Chart values in {unit}</caption>
          <thead><tr className="border-b border-slate-200 dark:border-slate-700"><th scope="col" className="py-2 pr-3">Stage / measure</th><th scope="col" className="py-2 pr-3">{unit}</th>{rates ? <th scope="col" className="py-2">From previous stage</th> : null}</tr></thead>
          <tbody>{items.map((item, index) => <tr key={item.label} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><th scope="row" className="py-2 pr-3 font-medium">{item.label}</th><td className="py-2 pr-3 tabular-nums">{number.format(item.value)}</td>{rates ? <td className="py-2 tabular-nums">{index === 0 ? '—' : `${number.format(rates[index - 1])}%`}</td> : null}</tr>)}</tbody>
        </table>
      </div>
    </details>
  )
}

function BarDiagram({ diagram }: { diagram: Extract<CourseDiagram, { kind: 'bars' }> }) {
  const maximum = Math.max(1, ...diagram.items.map((item) => item.value))
  return (
    <div>
      <div className="mb-4 flex justify-between gap-2 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400"><span>Zero-based scale · {diagram.unit}</span><span>0 — {number.format(maximum)}</span></div>
      <dl className="space-y-4">
        {diagram.items.map((item, index) => (
          <div key={item.label}>
            <div className="flex items-start justify-between gap-3 text-sm"><dt className="font-semibold text-slate-800 dark:text-slate-100">{item.label}</dt><dd className="shrink-0 font-extrabold tabular-nums text-slate-900 dark:text-white">{number.format(item.value)} <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{diagram.unit}</span></dd></div>
            <div className="mt-1.5 h-7 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800" aria-hidden="true"><div className="h-full rounded-r-md" style={{ width: `${item.value / maximum * 100}%`, backgroundColor: fills[index % fills.length] }} /></div>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</p>
          </div>
        ))}
      </dl>
      <DataTable items={diagram.items} unit={diagram.unit} />
    </div>
  )
}

function FunnelDiagram({ diagram }: { diagram: Extract<CourseDiagram, { kind: 'funnel' }> }) {
  const initialRates = diagram.items.slice(1).map((item, index) => diagram.items[index].value > 0 ? item.value / diagram.items[index].value * 100 : 0)
  const [rates, setRates] = useState(initialRates)
  const [budget, setBudget] = useState(3000)
  const counts = diagram.interactive ? forecastFunnel(diagram.items[0].value, rates) : diagram.items.map((item) => item.value)
  const items = diagram.items.map((item, index) => ({ ...item, value: counts[index] }))
  const cpa = costPerAcquisition(budget, counts[counts.length - 1])
  const id = useId()
  return (
    <div>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Schematic funnel · widths are not to scale</p>
      <ol className="space-y-2.5">
        {items.map((item, index) => (
          <li key={item.label}>
            <div className="relative flex min-h-16 items-center justify-between gap-3 overflow-hidden rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
              <div aria-hidden="true" className="absolute inset-y-0 left-0 opacity-10 dark:opacity-20" style={{ width: `${100 - index / items.length * 65}%`, backgroundColor: fills[index % fills.length], clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }} />
              <div className="relative min-w-0"><p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p><p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{diagram.interactive && index > 0 ? `${number.format(rates[index - 1])}% of the previous stage` : item.detail}</p></div>
              <span className="relative shrink-0 text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{number.format(item.value)}</span>
            </div>
            {index < items.length - 1 ? <ArrowDown className="mx-auto mt-2 h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
      {diagram.interactive ? (
        <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/30">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-200">Try the numbers</p><button type="button" onClick={() => { setRates(initialRates); setBudget(3000) }} className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-teal-800 underline underline-offset-2 focus-visible:outline-teal-600 dark:text-teal-200"><RotateCcw className="h-3 w-3" aria-hidden="true" /> Reset scenario</button></div>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Keep traffic fixed. Change a stage rate to see its effect on expected customers and acquisition cost.</p>
          <div className="mt-4 space-y-3">
            {rates.map((rate, index) => (
              <div key={items[index + 1].label}>
                <label htmlFor={`${id}-rate-${index}`} className="flex justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200"><span>{items[index + 1].label} rate</span><span className="tabular-nums">{number.format(rate)}%</span></label>
                <input id={`${id}-rate-${index}`} type="range" min="0" max="100" step="1" value={rate} onChange={(event) => setRates((current) => current.map((value, itemIndex) => itemIndex === index ? Number(event.target.value) : value))} className="mt-1 h-6 w-full accent-teal-700" />
              </div>
            ))}
            <label className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200"><span>Scenario media budget (₹)</span><input type="number" min="0" max="1000000" step="100" value={budget} onChange={(event) => setBudget(Math.max(0, Math.min(1000000, Number(event.target.value) || 0)))} className="w-32 rounded-lg border border-teal-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-teal-600 dark:border-teal-800 dark:bg-slate-900 dark:text-white" /></label>
          </div>
          <output className="mt-4 block rounded-lg bg-slate-900 p-3 text-sm font-bold leading-6 text-white" aria-live="polite">{number.format(counts[counts.length - 1])} expected customers · CPA {cpa === null ? 'not defined (no customers)' : rupees.format(cpa)}</output>
          <p className="mt-2 text-[11px] leading-5 text-slate-600 dark:text-slate-300">Synthetic forecast, not a performance promise. Fractional customers are expected values. CPA uses media spend only; profitability also depends on margin and other costs.</p>
        </div>
      ) : null}
      <DataTable items={items} unit={diagram.unit} rates={diagram.interactive ? rates : initialRates} />
    </div>
  )
}

function MatrixDiagram({ diagram }: { diagram: Extract<CourseDiagram, { kind: 'matrix' }> }) {
  return (
    <div>
      <p className="mb-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">{diagram.xLabel}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></p>
      <div className="grid grid-cols-2 gap-2 pb-2 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300">{diagram.columns.map((column) => <span key={column}>{column}</span>)}</div>
      <div className="space-y-3">
        {diagram.rows.map((row, rowIndex) => (
          <div key={row}>
            <p className="mb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{diagram.yLabel}: {row}</p>
            <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
              {diagram.items.slice(rowIndex * 2, rowIndex * 2 + 2).map((item, columnIndex) => <div key={item.label} className={`min-w-0 rounded-xl border p-3 ${tones[rowIndex * 2 + columnIndex]}`}><p className="mb-2 text-[10px] font-semibold text-slate-700 dark:text-slate-200">{diagram.columns[columnIndex]} · {row}</p><DiagramIcon name={item.icon} /><p className="mt-2 text-sm font-extrabold">{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-700 dark:text-slate-300">{item.detail}</p></div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CourseDiagramView({ diagram }: { diagram: CourseDiagram }) {
  switch (diagram.kind) {
    case 'flow':
    case 'compare': return <LinearDiagram diagram={diagram} />
    case 'hub':
    case 'cycle': return <OrbitDiagram diagram={diagram} />
    case 'bars': return <BarDiagram diagram={diagram} />
    case 'funnel': return <FunnelDiagram diagram={diagram} />
    case 'matrix': return <MatrixDiagram diagram={diagram} />
    case 'schedule': return <ProjectScheduleDiagram diagram={diagram} />
    case 'board': return <ProjectBoardDiagram diagram={diagram} />
    case 'raci': return <ProjectRaciDiagram diagram={diagram} />
  }
}
