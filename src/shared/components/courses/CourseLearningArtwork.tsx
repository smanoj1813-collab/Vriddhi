import { useId } from 'react'
import './courseVisuals.css'

/** Locally bundled original vector art. No remote media, generated claims or tool screenshots. */
export default function CourseLearningArtwork({ course }: { course: 'genai' | 'hr' }) {
  const id = useId().replace(/:/g, '')
  const ai = course === 'genai'
  const label = ai
    ? 'A conceptual GenAI studio: an evidence-based brief connects to a fallible AI draft, then a human checks sources and approves or rejects the result.'
    : 'A conceptual people-analytics studio: a defined question connects to synthetic data, checked metrics and a privacy-aware human review. People are not reduced to individual scores.'
  return (
    <svg viewBox="0 0 440 300" className="course-learning-art mx-auto w-full max-w-md" role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`}>
      <title id={`${id}-title`}>{ai ? 'The responsible GenAI studio' : 'The responsible HR analytics studio'}</title>
      <desc id={`${id}-desc`}>{label}</desc>
      <defs>
        <linearGradient id={`${id}-panel`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1e293b" /><stop offset="1" stopColor="#0f172a" /></linearGradient>
      </defs>
      <ellipse cx="220" cy="271" rx="188" ry="14" fill="#020617" opacity=".7" />
      <rect x="22" y="24" width="396" height="230" rx="22" fill={`url(#${id}-panel)`} stroke="#475569" />
      <path d="M22 65H418" stroke="#475569" />
      <circle cx="44" cy="45" r="4" fill="#2dd4bf" /><circle cx="58" cy="45" r="4" fill="#fbbf24" /><circle cx="72" cy="45" r="4" fill="#a5b4fc" />
      <text x="255" y="49" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700" letterSpacing="1.2">{ai ? 'BRIEF. CREATE. VERIFY.' : 'DEFINE. MEASURE. REVIEW.'}</text>
      <path className="course-art-path" d="M113 145H180M264 145H326" fill="none" stroke="#5eead4" strokeWidth="2" strokeDasharray="5 5" />
      <path d="M171 140l7 5l-7 5M317 140l7 5l-7 5" fill="none" stroke="#5eead4" strokeWidth="2" />
      <g className="course-art-first">
        <rect x="41" y="88" width="95" height="109" rx="13" fill="#134e4a" stroke="#2dd4bf" />
        <rect x="59" y="104" width="58" height="55" rx="7" fill="#f0fdfa" />
        {ai ? <><path d="M69 116h35M69 125h27M69 134h35M69 143h20" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" /><rect x="102" y="140" width="22" height="22" rx="6" fill="#2dd4bf" /><path d="M107 151l4 4l8 -9" stroke="#042f2e" strokeWidth="2" fill="none" /></> : <><path d="M68 115h40M68 127h40M68 139h40M80 110v39M95 110v39" stroke="#0f766e" strokeWidth="2" /><circle cx="112" cy="152" r="12" fill="#2dd4bf" /><path d="M107 152l4 4l7 -8" stroke="#042f2e" strokeWidth="2" fill="none" /></>}
        <text x="88" y="178" textAnchor="middle" fill="#ccfbf1" fontSize="12" fontWeight="800">{ai ? 'The brief' : 'Safe data'}</text>
        <text x="88" y="190" textAnchor="middle" fill="#99f6e4" fontSize="8">{ai ? 'source + purpose' : 'synthetic practice'}</text>
      </g>
      <g className="course-art-second">
        <rect x="174" y="89" width="99" height="108" rx="15" fill="#312e81" stroke="#a5b4fc" />
        {ai ? <><path d="M223 105l6 17l18 6l-18 6l-6 18l-6 -18l-18 -6l18 -6Z" fill="#c7d2fe" /><path d="M249 102l3 7l7 3l-7 3l-3 7l-3 -7l-7 -3l7 -3Z" fill="#5eead4" /><path d="M193 159h60" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 4" /></> : <><path d="M191 153h63M192 112v41" stroke="#a5b4fc" strokeWidth="2" /><rect x="200" y="133" width="10" height="18" rx="2" fill="#5eead4" /><rect x="218" y="118" width="10" height="33" rx="2" fill="#a5b4fc" /><rect x="236" y="126" width="10" height="25" rx="2" fill="#fbbf24" /></>}
        <text x="223" y="178" textAnchor="middle" fill="#eef2ff" fontSize="12" fontWeight="800">{ai ? 'AI draft' : 'Metrics'}</text>
        <text x="223" y="190" textAnchor="middle" fill="#c7d2fe" fontSize="8">{ai ? 'not verified truth' : 'defined denominators'}</text>
      </g>
      <g className="course-art-third">
        <rect x="311" y="87" width="89" height="111" rx="14" fill="#0c4a6e" stroke="#7dd3fc" />
        <circle cx="356" cy="119" r="15" fill="#fde68a" /><path d="M342 117c0 -20 29 -21 29 0c-7 -1 -14 -6 -18 -10c-2 5 -6 9 -11 10Z" fill="#0f172a" />
        <path d="M332 161c0 -28 48 -28 48 0" fill="#7dd3fc" /><path d="M345 143l11 11l11 -11" fill="#e0f2fe" />
        <circle cx="379" cy="151" r="12" fill="#2dd4bf" /><path d="M373 151l4 4l8 -9" stroke="#042f2e" strokeWidth="2" fill="none" />
        <text x="356" y="179" textAnchor="middle" fill="#e0f2fe" fontSize="11" fontWeight="800">Human review</text>
        <text x="356" y="191" textAnchor="middle" fill="#bae6fd" fontSize="8">{ai ? 'check, revise, decide' : 'context + safeguards'}</text>
      </g>
      <rect x="84" y="213" width="272" height="27" rx="9" fill="#0f172a" stroke="#475569" />
      <path d="M99 222l6 -3l6 3v5c0 4 -6 7 -6 7s-6 -3 -6 -7Z" fill="none" stroke="#5eead4" strokeWidth="1.5" />
      <text x="230" y="230" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="600">{ai ? 'Sources matter. “Not stated” is a valid answer.' : 'Counts + context. No individual risk labels.'}</text>
      <circle cx="403" cy="31" r="17" fill="#fbbf24" /><path d="M396 31h14M403 24v14" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
