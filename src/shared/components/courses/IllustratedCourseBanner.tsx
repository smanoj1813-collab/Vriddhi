import { ArrowUpRight, Check, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CourseManifest } from '@/shared/courses/types'
import CourseLearningArtwork from './CourseLearningArtwork'

/** A self-contained vector illustration: no remote images or paid media assets. */
function MarketingSystemIllustration() {
  return (
    <svg viewBox="0 0 440 280" className="mx-auto w-full max-w-md" role="img" aria-label="A connected marketing system: discovery leads to trust, action and a repeat relationship. Measurement feeds the next campaign.">
      <rect x="31" y="30" width="378" height="222" rx="18" fill="#1e293b" stroke="#475569" />
      <path d="M31 69H409" stroke="#475569" />
      <circle cx="51" cy="49" r="4" fill="#2dd4bf" /><circle cx="65" cy="49" r="4" fill="#fbbf24" /><circle cx="79" cy="49" r="4" fill="#818cf8" />
      <rect x="128" y="41" width="154" height="17" rx="8" fill="#0f172a" />
      <text x="205" y="53" fill="#cbd5e1" fontSize="9" textAnchor="middle" letterSpacing="1.4">THE MARKETING SYSTEM</text>
      <path d="M117 125H158M249 125H288M326 151V207H110V156" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M150 120L157 125L150 130M280 120L287 125L280 130M105 163L110 156L115 163" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <rect x="65" y="93" width="76" height="64" rx="12" fill="#134e4a" stroke="#2dd4bf" />
      <circle cx="103" cy="114" r="9" fill="none" stroke="#99f6e4" strokeWidth="2" /><path d="M110 121L116 127" stroke="#99f6e4" strokeWidth="2" />
      <text x="103" y="144" fill="#f0fdfa" textAnchor="middle" fontSize="11" fontWeight="700">Discover</text>
      <rect x="178" y="93" width="76" height="64" rx="12" fill="#312e81" stroke="#818cf8" />
      <path d="M207 109H224V126H207ZM211 114H220M211 119H220" fill="none" stroke="#c7d2fe" strokeWidth="1.8" />
      <text x="216" y="144" fill="#eef2ff" textAnchor="middle" fontSize="11" fontWeight="700">Build trust</text>
      <rect x="291" y="93" width="76" height="64" rx="12" fill="#78350f" stroke="#fbbf24" />
      <path d="M319 108L335 118L327 120L323 127Z" fill="none" stroke="#fde68a" strokeWidth="1.8" />
      <text x="329" y="144" fill="#fffbeb" textAnchor="middle" fontSize="11" fontWeight="700">Take action</text>
      <rect x="174" y="187" width="124" height="38" rx="10" fill="#0f172a" stroke="#475569" />
      <path d="M188 213V205M196 213V199M204 213V202" stroke="#5eead4" strokeWidth="3" />
      <text x="247" y="204" fill="#e2e8f0" textAnchor="middle" fontSize="10" fontWeight="700">Measure.</text>
      <text x="247" y="217" fill="#5eead4" textAnchor="middle" fontSize="10" fontWeight="700">Learn. Repeat.</text>
      <circle cx="392" cy="35" r="18" fill="#2dd4bf" /><path d="M385 35L390 40L400 29" fill="none" stroke="#042f2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DeliverySystemIllustration({ generic = false }: { generic?: boolean }) {
  const steps = generic ? ['Explore', 'Practise', 'Review', 'Apply'] : ['Authorise', 'Plan', 'Deliver', 'Hand over']
  return (
    <svg viewBox="0 0 440 280" className="mx-auto w-full max-w-md" role="img" aria-label={generic ? 'An illustrated learning path connecting exploration, practice, review and application.' : 'An illustrative project delivery dashboard: authorisation, planning, delivery and handover connect to a timeline, a work board and an evidence-led decision.'}>
      <rect x="25" y="26" width="390" height="230" rx="18" fill="#1e293b" stroke="#475569" />
      <path d="M25 65H415" stroke="#475569" /><circle cx="47" cy="46" r="4" fill="#2dd4bf" /><circle cx="61" cy="46" r="4" fill="#fbbf24" /><circle cx="75" cy="46" r="4" fill="#818cf8" />
      <text x="245" y="50" textAnchor="middle" fill="#cbd5e1" fontSize="10" letterSpacing="1.4">{generic ? 'SEE IT. TRY IT. UNDERSTAND IT.' : 'THE PROJECT DELIVERY SYSTEM'}</text>
      {steps.map((step, index) => <g key={step}><rect x={43 + index * 91} y="82" width="80" height="32" rx="9" fill={['#134e4a', '#312e81', '#78350f', '#0c4a6e'][index]} stroke={['#2dd4bf', '#818cf8', '#fbbf24', '#38bdf8'][index]} /><text x={83 + index * 91} y="102" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">{step}</text>{index < 3 ? <path d={`M${124 + index * 91} 98h9m-4 -3l4 3l-4 3`} stroke="#94a3b8" fill="none" /> : null}</g>)}
      <rect x="43" y="130" width="192" height="105" rx="11" fill="#0f172a" stroke="#334155" />
      <text x="57" y="149" fill="#94a3b8" fontSize="8" letterSpacing="1">{generic ? 'CONNECT THE IDEAS' : 'DEPENDENCIES + TIMELINE'}</text>
      <path d="M60 160V220M100 160V220M140 160V220M180 160V220M220 160V220" stroke="#334155" strokeDasharray="2 3" />
      <rect x="60" y="165" width="43" height="12" rx="4" fill="#2dd4bf" /><rect x="105" y="184" width="58" height="12" rx="4" fill="#818cf8" /><rect x="105" y="203" width="42" height="12" rx="4" fill="#38bdf8" /><path d="M103 171H109V185M164 190H196V211" fill="none" stroke="#94a3b8" /><rect x="184" y="204" width="34" height="12" rx="4" fill="#2dd4bf" />
      <rect x="249" y="130" width="148" height="64" rx="11" fill="#0f172a" stroke="#334155" /><text x="263" y="148" fill="#94a3b8" fontSize="8" letterSpacing="1">{generic ? 'PRACTISE WITH EVIDENCE' : 'MAKE THE WORK VISIBLE'}</text>
      {[0, 1, 2].map((column) => <g key={column}><rect x={261 + column * 43} y="157" width="37" height="25" rx="4" fill="#1e293b" /><rect x={266 + column * 43} y="162" width="27" height="5" rx="2" fill={['#818cf8', '#fbbf24', '#2dd4bf'][column]} /><path d={`M${266 + column * 43} 173h20`} stroke="#64748b" strokeWidth="2" /></g>)}
      <rect x="249" y="205" width="148" height="30" rx="9" fill="#134e4a" stroke="#2dd4bf" /><path d="M262 219l4 4l7 -8" stroke="#99f6e4" strokeWidth="2" fill="none" /><text x="332" y="224" textAnchor="middle" fill="#ccfbf1" fontSize="9" fontWeight="700">Evidence → decision</text>
      <circle cx="397" cy="29" r="17" fill="#2dd4bf" /><path d="M390 29l5 5l9 -11" fill="none" stroke="#042f2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function IllustratedCourseBanner({ manifest, firstLessonPath }: { manifest: CourseManifest; firstLessonPath?: string }) {
  if (!manifest.illustrations) return null
  const lessons = manifest.modules.flatMap((module) => module.topics)
  const marketing = manifest.id === 'digital-marketing'
  const projects = manifest.id === 'project-management'
  const genai = manifest.id === 'genai-certification'
  const people = manifest.id === 'hr-analytics'
  const visualForms = genai ? 'Prompt maps, RAG pipelines & learner-controlled animations'
    : people ? 'Cohort funnels, worked charts & learner-controlled animations'
      : 'Step-by-step diagrams, worked charts & decision maps'
  const practice = marketing ? 'Interactive funnel lab and quick understanding checks'
    : projects ? 'Interactive schedule lab, work boards & responsibility tables'
      : genai ? 'CO-STAR prompt lab, source checks & responsible-AI practice'
        : people ? 'Workforce denominator lab, metric definitions & privacy checks'
          : 'Visual practice and quick understanding checks'
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-lg" aria-label="Illustrated course edition">
      <div className="pointer-events-none absolute -right-10 -top-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" aria-hidden="true" />
      <div className="relative grid items-center gap-3 p-6 sm:p-8 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-200"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Illustrated edition · included</p>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{manifest.illustrations.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{manifest.illustrations.description}</p>
          <ul className="mt-4 space-y-2 text-xs font-medium text-slate-200">
            {[`${lessons.length} illustrated topics, including project briefs`, visualForms, practice].map((item) => <li key={item} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-300" aria-hidden="true" />{item}</li>)}
          </ul>
          {firstLessonPath ? <Link to={firstLessonPath} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-300 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-teal-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200">Explore the illustrated lesson <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link> : null}
          <p className="mt-3 text-[10px] leading-5 text-slate-400">A new visual layer. The original explanations, assessments and course requirements are unchanged.</p>
        </div>
        {marketing ? <MarketingSystemIllustration /> : genai || people ? <CourseLearningArtwork course={genai ? 'genai' : 'hr'} /> : <DeliverySystemIllustration generic={!projects} />}
      </div>
    </section>
  )
}
