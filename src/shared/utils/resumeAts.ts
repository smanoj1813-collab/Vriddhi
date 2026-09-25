// src/shared/utils/resumeAts.ts
//
// Rule-based "ATS readiness" checker for the Resume Builder. It runs entirely
// in the browser (free, instant) and mirrors what applicant-tracking parsers
// and campus recruiters actually trip over: missing contact fields, an
// unquantified bullet list, first-person prose, a two-line summary, a resume
// that spills onto page three, or a job description whose keywords the resume
// never mentions.
//
// Scoring: every check has a weight; pass = full weight, warn = half, fail =
// nothing. The score is the weighted share of the checks that applied. It is
// guidance, not a certification — the wording in the UI says so.

import type { ResumeData } from '../types/resume'

export type AtsStatus = 'pass' | 'warn' | 'fail'

export interface AtsCheck {
  id: string
  label: string
  status: AtsStatus
  detail: string
  weight: number
}

export interface AtsKeywordReport {
  matched: string[]
  missing: string[]
  coverage: number
}

export type AtsGrade = 'Excellent' | 'Good' | 'Needs work' | 'Weak'

export interface AtsReport {
  score: number
  grade: AtsGrade
  checks: AtsCheck[]
  keywords: AtsKeywordReport | null
  wordCount: number
  estimatedPages: number
}

const ACTION_VERBS = new Set(
  (
    'accelerated achieved administered advised analysed analyzed anchored architected assisted audited automated awarded boosted briefed budgeted built ' +
    'calculated campaigned chaired classified cleaned cleared coached co-founded collaborated collected compiled completed computed conducted configured ' +
    'consolidated contributed converted coordinated counselled counseled created curated customised customized cut delivered deployed designed developed ' +
    'documented drafted drove earned edited engineered established evaluated exceeded executed facilitated filed filmed forecasted forecast founded ' +
    'fundraised generated grew guided handled headed hosted identified illustrated implemented improved increased initiated integrated interviewed ' +
    'launched led liaised maintained managed marketed mentored migrated modelled modeled modernised modernized monitored negotiated onboarded optimised ' +
    'optimized organised organized oversaw participated partnered performed photographed pioneered planned prepared presented processed produced ' +
    'programmed published qualified raised ranked recommended reconciled recruited redesigned reduced represented researched resolved restructured ' +
    'revamped reviewed saved scheduled scripted secured simplified sold spearheaded standardised standardized streamlined supervised supported surveyed ' +
    'taught tested tracked trained transformed translated tutored upgraded validated verified visualised visualized volunteered won wrote'
  ).split(/\s+/),
)

const STOPWORDS = new Set(
  (
    'a an and are as at be been being but by can could did do does doing for from had has have having he her hers him his how i if in into is it its ' +
    'itself just may me might more most must my no nor not of off on once only or other our ours out over own same she should so some such than that ' +
    'the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why ' +
    'will with would you your yours about above across after again against all also am any because before below between both down during each few ' +
    'further here job role work experience skills required requirements responsibilities ability able strong good excellent knowledge candidate ' +
    'candidates preferred plus years year team company looking join opportunity position including etc within using use used well new'
  ).split(/\s+/),
)

const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*'
const DATE_MONTH_YEAR = new RegExp(`^${MONTH}\\.?\\s+\\d{4}$`, 'i')
const DATE_YEAR = /^\d{4}$/
const DATE_NUMERIC = /^\d{1,2}[/-]\d{4}$/

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

function allBullets(data: ResumeData): string[] {
  return [
    ...data.experience.flatMap((x) => x.bullets),
    ...data.projects.flatMap((p) => p.bullets),
    ...data.education.flatMap((e) => e.highlights),
    ...data.achievements,
  ].filter((b) => b.trim().length > 0)
}

export function resumePlainText(data: ResumeData): string {
  return [
    data.contact.fullName, data.contact.headline, data.summary,
    ...data.education.flatMap((e) => [e.institution, e.degree, e.field, e.score, ...e.highlights]),
    ...data.experience.flatMap((x) => [x.organisation, x.role, ...x.bullets]),
    ...data.projects.flatMap((p) => [p.name, p.role, p.techStack.join(' '), ...p.bullets]),
    ...data.skills.flatMap((s) => [s.name, s.skills.join(' ')]),
    ...data.certifications.flatMap((c) => [c.name, c.issuer]),
    ...data.achievements,
    ...data.languages,
  ]
    .filter(Boolean)
    .join('\n')
}

export function countResumeWords(data: ResumeData): number {
  return words(resumePlainText(data)).length
}

/** ≈ 480 words per A4 page at 10.5 pt with the templates' spacing. */
export function estimateResumePages(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 480))
}

function dateShape(value: string): 'month-year' | 'year' | 'numeric' | 'other' | 'empty' {
  const v = value.trim()
  if (!v || /^present$/i.test(v)) return 'empty'
  if (DATE_MONTH_YEAR.test(v)) return 'month-year'
  if (DATE_YEAR.test(v)) return 'year'
  if (DATE_NUMERIC.test(v)) return 'numeric'
  return 'other'
}

function startsWithActionVerb(bullet: string): boolean {
  const first = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z-]/g, '') || ''
  return ACTION_VERBS.has(first)
}

const NUMBERISH = /(\d|%|₹|\$|\bone\b|\btwo\b|\bthree\b|\bfive\b|\bten\b|\bhundred\b|\bthousand\b|\blakh\b|\bcrore\b)/i
const FIRST_PERSON = /\b(i|i'm|i've|me|my|mine|myself)\b/i
// Letters and combining marks (any script — Kannada vowel signs are marks), digits,
// ordinary punctuation, currency and the dashes the templates use are fine.
const SUSPICIOUS = /[^\p{L}\p{M}\p{N}\p{Zs}\n\r\t.,;:!?'"()[\]{}/\\@#&*+=%<>_|~^`$₹€£—–-]/u

export function extractKeywords(jobDescription: string, limit = 25): string[] {
  const counts = new Map<string, number>()
  for (const raw of jobDescription.toLowerCase().split(/[^a-z0-9+#.]+/)) {
    const token = raw.replace(/^[.]+|[.]+$/g, '')
    if (token.length < 3 || STOPWORDS.has(token) || /^\d+$/.test(token)) continue
    counts.set(token, (counts.get(token) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token)
}

export function keywordCoverage(data: ResumeData, jobDescription: string): AtsKeywordReport | null {
  const keywords = extractKeywords(jobDescription)
  if (!keywords.length) return null
  const haystack = ` ${resumePlainText(data).toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ')} `
  const matched: string[] = []
  const missing: string[] = []
  for (const kw of keywords) {
    const stem = kw.length > 5 ? kw.slice(0, kw.length - 1) : kw
    if (haystack.includes(` ${kw} `) || haystack.includes(` ${stem}`)) matched.push(kw)
    else missing.push(kw)
  }
  return { matched, missing, coverage: Math.round((matched.length / keywords.length) * 100) }
}

export function runAtsCheck(data: ResumeData): AtsReport {
  const checks: AtsCheck[] = []
  const add = (id: string, label: string, weight: number, status: AtsStatus, detail: string) =>
    checks.push({ id, label, weight, status, detail })

  const c = data.contact
  const emailOk = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c.email)
  add('email', 'Email address', 10, emailOk ? 'pass' : 'fail', emailOk ? 'Parsers pick this up as your primary contact.' : 'Add a valid email — without one an ATS cannot file your application.')

  const digits = c.phone.replace(/\D/g, '')
  const phoneOk = digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))
  add('phone', 'Phone number', 6, phoneOk ? 'pass' : c.phone ? 'warn' : 'fail', phoneOk ? 'A 10-digit mobile number is present.' : c.phone ? 'Use a plain 10-digit mobile number (with or without +91).' : 'Add a mobile number recruiters can call.')

  add('links', 'LinkedIn / portfolio link', 4, c.linkedin || c.github || c.website ? 'pass' : 'warn', c.linkedin || c.github || c.website ? 'A profile link is included.' : 'Add your LinkedIn URL — most campus recruiters check it.')

  const headlineWords = words(c.headline).length
  add('headline', 'Headline under your name', 4, headlineWords >= 3 && headlineWords <= 14 ? 'pass' : c.headline ? 'warn' : 'warn', c.headline ? (headlineWords > 14 ? 'Keep the headline under 12 words.' : 'Good — it tells the reader what you are targeting.') : 'Add a one-line headline, e.g. "B.Com Final Year | Aspiring Financial Analyst".')

  const summaryWords = words(data.summary).length
  add(
    'summary', 'Professional summary', 10,
    summaryWords >= 40 && summaryWords <= 90 ? 'pass' : summaryWords >= 20 && summaryWords <= 130 ? 'warn' : 'fail',
    summaryWords === 0 ? 'Write a 3–4 line summary: degree, strongest skills, the role you want.'
      : summaryWords < 40 ? `Only ${summaryWords} words — aim for 40–90.`
        : summaryWords > 90 ? `${summaryWords} words is long — trim to 40–90.`
          : `${summaryWords} words — the right length.`,
  )

  const eduComplete = data.education.filter((e) => e.institution && e.degree)
  const eduDated = eduComplete.filter((e) => e.endYear)
  add('education', 'Education with degree, institution and year', 10, eduDated.length ? 'pass' : eduComplete.length ? 'warn' : 'fail', eduDated.length ? 'Education is complete.' : eduComplete.length ? 'Add the (expected) year of completion.' : 'Add your degree and college — the first thing a campus ATS filters on.')

  const bullets = allBullets(data)
  const hasWork = data.experience.some((x) => x.organisation || x.role) || data.projects.some((p) => p.name)
  add('substance', 'Experience, internships or projects with bullet points', 12, bullets.length >= 3 && hasWork ? 'pass' : hasWork ? 'warn' : 'fail', bullets.length >= 3 && hasWork ? `${bullets.length} bullet points describe what you did.` : hasWork ? 'Add 2–4 bullet points under each internship or project.' : 'Add at least one internship, part-time role or academic project.')

  if (bullets.length) {
    const verbShare = bullets.filter(startsWithActionVerb).length / bullets.length
    add('verbs', 'Bullets start with action verbs', 8, verbShare >= 0.7 ? 'pass' : verbShare >= 0.4 ? 'warn' : 'fail', `${Math.round(verbShare * 100)}% of bullets open with a verb like "Built", "Reconciled", "Led".`)
    const numberShare = bullets.filter((b) => NUMBERISH.test(b)).length / bullets.length
    add('numbers', 'Quantified results', 8, numberShare >= 0.3 ? 'pass' : numberShare > 0 ? 'warn' : 'fail', numberShare > 0 ? `${Math.round(numberShare * 100)}% of bullets carry a number (%, ₹, count, time saved).` : 'Add numbers: how many, how much, how fast.')
  } else {
    add('verbs', 'Bullets start with action verbs', 8, 'fail', 'No bullet points yet.')
    add('numbers', 'Quantified results', 8, 'fail', 'No bullet points yet.')
  }

  const skillSet = new Set(data.skills.flatMap((g) => g.skills.map((s) => s.trim().toLowerCase())).filter(Boolean))
  add('skills', 'Skills section (6+ specific skills)', 8, skillSet.size >= 6 ? 'pass' : skillSet.size >= 3 ? 'warn' : 'fail', skillSet.size >= 6 ? `${skillSet.size} skills listed as plain text — exactly what keyword matching needs.` : `${skillSet.size} skills — list tools, software and methods by name (Tally, Excel, SQL, GST filing…).`)

  const prose = [data.summary, ...bullets].join('\n')
  const firstPerson = FIRST_PERSON.test(prose)
  add('pronouns', 'No first-person pronouns', 5, firstPerson ? 'warn' : 'pass', firstPerson ? 'Drop "I", "my", "me" — write "Managed…" not "I managed…".' : 'Written in the expected implied-third-person style.')

  const wordCount = countResumeWords(data)
  const estimatedPages = estimateResumePages(wordCount)
  add('length', 'Length (1–2 pages)', 8, wordCount >= 250 && wordCount <= 750 ? 'pass' : (wordCount >= 150 && wordCount < 250) || (wordCount > 750 && wordCount <= 950) ? 'warn' : 'fail', `${wordCount} words ≈ ${estimatedPages} page${estimatedPages > 1 ? 's' : ''}. Freshers: one page; with internships up to two.`)

  const dated = [
    ...data.experience.map((x) => ({ start: x.startDate, end: x.current ? 'Present' : x.endDate })),
    ...data.projects.filter((p) => p.startDate || p.endDate).map((p) => ({ start: p.startDate, end: p.endDate })),
  ]
  if (dated.length) {
    const missingStart = dated.filter((d) => !d.start.trim()).length
    const shapes = new Set(dated.flatMap((d) => [dateShape(d.start), dateShape(d.end)]).filter((s) => s !== 'empty'))
    const inconsistent = shapes.size > 1 || shapes.has('other')
    add('dates', 'Dates present and consistent', 4, missingStart === 0 && !inconsistent ? 'pass' : 'warn', missingStart ? `${missingStart} entr${missingStart > 1 ? 'ies are' : 'y is'} missing a start date.` : inconsistent ? 'Use one format everywhere, e.g. "Jan 2025 – Mar 2025".' : 'Every entry is dated in the same format.')
  } else {
    add('dates', 'Dates present and consistent', 4, 'warn', 'Add start and end dates to internships and projects.')
  }

  const suspicious = SUSPICIOUS.test(resumePlainText(data))
  add('characters', 'No emojis or decorative symbols', 3, suspicious ? 'warn' : 'pass', suspicious ? 'Remove emojis / symbols — parsers turn them into junk characters.' : 'Plain characters only.')

  const keywords = data.targetJobDescription.trim() ? keywordCoverage(data, data.targetJobDescription) : null
  if (keywords) {
    add('keywords', 'Job-description keyword match', 10, keywords.coverage >= 60 ? 'pass' : keywords.coverage >= 35 ? 'warn' : 'fail', `${keywords.coverage}% of the top keywords appear in your resume. Missing: ${keywords.missing.slice(0, 6).join(', ') || 'none'}.`)
  }

  const totalWeight = checks.reduce((sum, ch) => sum + ch.weight, 0)
  const earned = checks.reduce((sum, ch) => sum + (ch.status === 'pass' ? ch.weight : ch.status === 'warn' ? ch.weight / 2 : 0), 0)
  const score = totalWeight ? Math.round((earned / totalWeight) * 100) : 0
  const grade: AtsGrade = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Needs work' : 'Weak'

  return { score, grade, checks, keywords, wordCount, estimatedPages }
}
