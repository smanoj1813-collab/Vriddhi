import type { AcademicContext, UniversitySchemePack } from './schemePack'
import { academicKey, courseCodeKey } from './schemeValidation'
import { selectCollegeScheme, type CollegeSchemeConfiguration } from './collegeSchemes'

export interface CreditRow {
  id?: string
  code?: string
  subjectCode?: string
  semester?: number
  credits?: number
  gradePoint?: number
  grade?: string
  result?: string
  isPass?: boolean
  includeInGpa?: boolean
  category?: string
  status?: string
  updatedAt?: unknown
  createdAt?: unknown
  publishedAt?: unknown
}
export interface CreditSummary {
  gpa: number | null
  attemptedCredits: number
  gpaCredits: number
  earnedCredits: number
  creditPoints: number
  pendingRows: number
  invalidRows: number
  courseCount: number
}
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
function time(v: unknown): number {
  if (typeof v === 'string') return Date.parse(v) || 0
  if (v instanceof Date) return v.getTime()
  if (v && typeof v === 'object' && 'toMillis' in v && typeof v.toMillis === 'function')
    return Number(v.toMillis()) || 0
  return 0
}
/** Same course/semester is not counted twice. Latest recorded correction wins;
 *  this is NOT a university-specific repeat/best-attempt regulation. */
export function latestCreditRows<T extends CreditRow>(rows: T[]): T[] {
  const map = new Map<string, T>()
  rows.forEach((r, i) => {
    if (r.status && r.status !== 'published') return
    const code = courseCodeKey(r.code || r.subjectCode)
    const key = code && r.semester ? `${r.semester}|${code}` : `row:${i}`
    const current = map.get(key)
    const date = (row: T) => time(row.updatedAt) || time(row.publishedAt) || time(row.createdAt)
    if (!current || date(r) >= date(current)) map.set(key, r)
  })
  return [...map.values()]
}
export function creditOutcome(row: CreditRow): 'pass' | 'fail' | 'pending' {
  const status = String(row.result || '')
    .trim()
    .toUpperCase()
  const grade = String(row.grade || '')
    .trim()
    .toUpperCase()
  if (['W', 'WITHHELD', 'PENDING', 'I', 'INCOMPLETE'].includes(status) || ['W', 'WH', 'I'].includes(grade))
    return 'pending'
  if (
    row.isPass === false ||
    ['F', 'FAIL', 'FAILED', 'A', 'ABSENT'].includes(status) ||
    ['F', 'FAIL', 'FAILED', 'AB', 'ABSENT', 'NE'].includes(grade)
  )
    return 'fail'
  // A passed non-GPA/zero-credit activity may legitimately carry zero points.
  if (
    (row.includeInGpa === false || row.credits === 0) &&
    (row.isPass === true || ['P', 'PASS'].includes(status) || ['P', 'PASS'].includes(grade))
  )
    return 'pass'
  if (row.gradePoint === 0) return 'fail'
  if (row.isPass === true || ['P', 'PASS'].includes(status)) return 'pass'
  // Legacy published rows often have no result. A finite published grade point
  // is evidence; missing numeric values are never coerced to a zero/pass.
  if (
    typeof row.gradePoint === 'number' &&
    Number.isFinite(row.gradePoint) &&
    row.gradePoint >= 0 &&
    row.gradePoint <= 10
  )
    return row.gradePoint > 0 ? 'pass' : 'fail'
  return 'pending'
}
/** Σ(C×GP)/Σ(C), including zero-point failures. Earned credits are separate.
 *  Incomplete positive-credit GPA data makes the GPA unavailable, not inflated. */
export function summarizeCredits(input: CreditRow[], deduplicate = true): CreditSummary {
  const rows = deduplicate ? latestCreditRows(input) : input
  let attemptedCredits = 0
  let gpaCredits = 0
  let earnedCredits = 0
  let creditPoints = 0
  let pendingRows = 0
  let invalidRows = 0
  let gpaIncomplete = false
  for (const row of rows) {
    const credits = row.credits
    if (typeof credits !== 'number' || !Number.isFinite(credits) || credits < 0 || credits > 30) {
      invalidRows++
      if (row.includeInGpa !== false) gpaIncomplete = true
      continue
    }
    attemptedCredits += credits
    const outcome = creditOutcome(row)
    if (outcome === 'pass') earnedCredits += credits
    if (row.includeInGpa === false || credits === 0) {
      if (outcome === 'pending') pendingRows++
      continue
    }
    gpaCredits += credits
    if (outcome === 'pending') {
      pendingRows++
      gpaIncomplete = true
      continue
    }
    if (outcome === 'fail') continue // zero points, but the credits stay in the denominator
    if (
      typeof row.gradePoint !== 'number' ||
      !Number.isFinite(row.gradePoint) ||
      row.gradePoint <= 0 ||
      row.gradePoint > 10
    ) {
      invalidRows++
      gpaIncomplete = true
      continue
    }
    creditPoints += credits * row.gradePoint
  }
  return {
    gpa: gpaIncomplete || gpaCredits === 0 ? null : round(creditPoints / gpaCredits),
    attemptedCredits: round(attemptedCredits),
    gpaCredits: round(gpaCredits),
    earnedCredits: round(earnedCredits),
    creditPoints: round(creditPoints),
    pendingRows,
    invalidRows,
    courseCount: rows.length,
  }
}

/** Advisory degree-credit audit only; attendance, exam attempts and institutional
 *  approval remain separate release gates. Never assumes a Karnataka total. */
export function auditProgrammeCredits(
  input: CreditRow[],
  pack: UniversitySchemePack,
  context: AcademicContext,
) {
  const matches = (pack.creditRequirements ?? [])
    .filter(
      (p) =>
        academicKey(p.programme) === academicKey(context.programme) &&
        (!p.batch || academicKey(p.batch) === academicKey(context.batch)),
    )
    .sort((a, b) => Number(!!b.batch) - Number(!!a.batch))
  const requirement = matches[0]
  if (!requirement)
    return {
      configured: false as const,
      creditRequirementsMet: false,
      reason: 'No approved programme/cohort credit requirement is configured.',
    }
  const rows = latestCreditRows(input)
  const summary = summarizeCredits(rows, false)
  const passed = rows.filter(
    (r) =>
      creditOutcome(r) === 'pass' &&
      typeof r.credits === 'number' &&
      Number.isFinite(r.credits) &&
      r.credits >= 0,
  )
  const earnedCodes = new Set(passed.map((r) => courseCodeKey(r.code || r.subjectCode)))
  const mandatory = new Set(requirement.requiredCourseCodes.map(courseCodeKey))
  for (const course of pack.courses ?? []) {
    if (
      course.requiredForAward &&
      (!course.programme || academicKey(course.programme) === academicKey(context.programme)) &&
      (!course.batch || academicKey(course.batch) === academicKey(context.batch))
    )
      mandatory.add(courseCodeKey(course.code))
  }
  const missingCourses = [...mandatory].filter((c) => !earnedCodes.has(c))
  const categories = Object.entries(requirement.categoryMinimums).map(([category, minimum]) => {
    const earned = passed
      .filter((r) => academicKey(r.category) === academicKey(category))
      .reduce((s, r) => s + r.credits!, 0)
    return { category, minimum, earned: round(earned), remaining: round(Math.max(0, minimum - earned)) }
  })
  const remainingCredits = round(Math.max(0, requirement.minimumCredits - summary.earnedCredits))
  return {
    configured: true as const,
    creditRequirementsMet:
      remainingCredits === 0 &&
      missingCourses.length === 0 &&
      categories.every((c) => c.remaining === 0) &&
      summary.invalidRows === 0 &&
      summary.pendingRows === 0,
    requirement,
    summary,
    remainingCredits,
    missingCourses,
    categories,
  }
}


/** Historical credits/GP stay on the published rows. Only the CURRENT advisory
 * award plan is routed. A semester-specific policy is not a whole-award plan:
 * resolve without semester and report ambiguity until an approved cross-pack
 * award-plan workflow exists, rather than choosing today's semester or primary. */
export function auditAssignedProgrammeCredits(
  input: CreditRow[],
  configuration: CollegeSchemeConfiguration,
  context: AcademicContext,
) {
  try {
    const policy = selectCollegeScheme(configuration, { programme: context.programme, batch: context.batch })
    return { ...auditProgrammeCredits(input, policy.pack, context),
      schemePackId: policy.schemePackId, schemePackRevision: policy.revision,
      schemeConfigurationRevision: configuration.revision }
  } catch (err) {
    return { configured: false as const, creditRequirementsMet: false,
      reason: `Whole-programme credit audit unavailable: ${err instanceof Error ? err.message : 'Assigned scheme cannot be determined'}. Semester-dependent assignments need an approved cross-pack award plan; current-semester rules are never substituted for the whole award.` }
  }
}
