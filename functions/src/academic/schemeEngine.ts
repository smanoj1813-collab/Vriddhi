import {
  SCHEME_PACK_PRESETS,
  type AcademicContext,
  type CourseAssessmentProfile,
  type SchemeCourse,
  type SchemeGrade,
  type UniversitySchemePack,
} from './schemePack'
import { academicKey, courseCodeKey, SchemeConfigurationError } from './schemeValidation'
export { normalizeSchemePack, SchemeConfigurationError } from './schemeValidation'
export type { UniversitySchemePack } from './schemePack'
export { BCU_SEP_2024 } from './schemePack'

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100
function range(n: number, field: string, max = 100): number {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > max)
    throw new SchemeConfigurationError(`${field} must be between 0 and ${max}`)
  return n
}
const requirePack = (pack: UniversitySchemePack): UniversitySchemePack => {
  if (!pack)
    throw new SchemeConfigurationError('An explicit college scheme pack is required; no default applies.')
  return pack
}
export function getBuiltInSchemePack(codeOrId: string): UniversitySchemePack | null {
  return SCHEME_PACK_PRESETS.find((p) => p.id === codeOrId || p.code === codeOrId) ?? null
}

export interface SchemeAttendanceResult {
  percentage: number
  marks: number
  isEligible: boolean
  remarks: string
  color: string
  slabLabel: string
}
export function calculateSchemeAttendanceMarks(
  percentage: number,
  pack: UniversitySchemePack,
): SchemeAttendanceResult {
  requirePack(pack)
  const pct = range(percentage, 'Attendance percentage')
  const { minimumPercentage, marksSlabs, blocksExamEligibility } = pack.attendance
  if (pct < minimumPercentage)
    return {
      percentage: pct,
      marks: 0,
      isEligible: !blocksExamEligibility,
      remarks: blocksExamEligibility
        ? `Not eligible - Attendance below ${minimumPercentage}% (${pack.code})`
        : `Attendance below ${minimumPercentage}% — this pack does not block exam eligibility (${pack.code})`,
      color: 'rose',
      slabLabel: 'Blocked',
    }
  // Slab bounds are inclusive. Gaps earn zero; do not invent a rounding rule.
  const ordered = [...marksSlabs].sort((a, b) => b.min - a.min)
  const slab = ordered.find((s) => pct >= s.min && pct <= s.max)
  const marks = slab?.marks ?? 0
  const slabLabel = slab?.label ?? 'Eligible'
  const colors = ['emerald', 'teal', 'blue', 'amber']
  return {
    percentage: pct,
    marks,
    isEligible: true,
    remarks: `${slabLabel} attendance - ${marks} marks`,
    color: colors[Math.min(slab ? ordered.indexOf(slab) : 3, 3)],
    slabLabel,
  }
}
export function isSchemeExamEligible(percentage: number, pack: UniversitySchemePack): boolean {
  return calculateSchemeAttendanceMarks(percentage, pack).isEligible
}

export interface SchemeIAInput {
  testMarks: number[]
  assignmentMarks: number
  attendancePercentage: number
}
export interface SchemeIAResult {
  testAverage: number
  attendanceMarks: number
  assignmentMarks: number
  totalIA: number
  totalPossible: number
  isEligible: boolean
  breakdown: string
}
export function calculateSchemeInternalMarks(
  input: SchemeIAInput,
  pack: UniversitySchemePack,
): SchemeIAResult {
  const ia = requirePack(pack).internalAssessment
  if (!Array.isArray(input.testMarks) || input.testMarks.length > ia.test.count)
    throw new SchemeConfigurationError(`Provide at most ${ia.test.count} test marks`)
  const sorted = input.testMarks
    .map((n) => range(n, 'Test marks', ia.test.maxMarksEach))
    .sort((a, b) => b - a)
  // Missing required best-N marks count as zero, never a smaller denominator.
  const bestAvgRaw =
    ia.test.bestOf > 0 ? sorted.slice(0, ia.test.bestOf).reduce((s, n) => s + n, 0) / ia.test.bestOf : 0
  const testAverage =
    ia.test.maxMarksEach > 0 ? (bestAvgRaw / ia.test.maxMarksEach) * ia.test.weightInTotal : 0
  const att = calculateSchemeAttendanceMarks(input.attendancePercentage, pack)
  const attendanceMarks = att.isEligible ? Math.min(ia.attendanceMaxMarks, att.marks) : 0
  const assignmentMarks = range(input.assignmentMarks, 'Assignment marks', ia.assignmentMaxMarks)
  return {
    testAverage: round2(testAverage),
    attendanceMarks,
    assignmentMarks,
    totalIA: round2(testAverage + attendanceMarks + assignmentMarks),
    totalPossible: ia.totalMarks,
    isEligible: att.isEligible,
    breakdown: `Tests: ${testAverage.toFixed(1)}/${ia.test.weightInTotal} (best ${ia.test.bestOf} avg: ${bestAvgRaw.toFixed(1)}/${ia.test.maxMarksEach}) + Attendance: ${attendanceMarks}/${ia.attendanceMaxMarks} (${input.attendancePercentage}%) + Assignment: ${assignmentMarks}/${ia.assignmentMaxMarks} = ${(testAverage + attendanceMarks + assignmentMarks).toFixed(1)}/${ia.totalMarks}`,
  }
}

export interface SchemePassInput {
  semesterEndMarks: number
  internalMarks: number
  maxSemesterEndMarks?: number
  maxInternalMarks?: number
}
export interface SchemePassResult {
  semesterEndPercentage: number
  internalPercentage: number
  aggregatePercentage: number
  totalMarks: number
  maxTotal: number
  isPassInSemesterEnd: boolean
  isPassInInternal: boolean
  isPassInAggregate: boolean
  isPass: boolean
  remarks: string
}
export function checkSchemePassCriteria(
  input: SchemePassInput,
  pack: UniversitySchemePack,
): SchemePassResult {
  requirePack(pack)
  const maxSee = range(
    input.maxSemesterEndMarks ?? pack.semesterEndExam.defaultMaxMarks,
    'External maximum',
    1000,
  )
  const maxInt = range(input.maxInternalMarks ?? pack.internalAssessment.totalMarks, 'Internal maximum', 1000)
  if (maxSee + maxInt <= 0)
    throw new SchemeConfigurationError('At least one assessment component must have a positive maximum')
  const see = range(input.semesterEndMarks, 'External marks', maxSee)
  const ia = range(input.internalMarks, 'Internal marks', maxInt)
  const seePerc = maxSee > 0 ? (see / maxSee) * 100 : 0
  const intPerc = maxInt > 0 ? (ia / maxInt) * 100 : 0
  const aggPerc = ((see + ia) / (maxSee + maxInt)) * 100
  const isPassInSemesterEnd = maxSee === 0 || seePerc >= pack.semesterEndExam.passPercentage
  const isPassInInternal = maxInt === 0 || intPerc >= pack.passCriteria.minimumInternalPercentage
  const isPassInAggregate = aggPerc >= pack.passCriteria.aggregatePassPercentage
  const isPass =
    isPassInAggregate &&
    (!pack.passCriteria.requireSemesterEndPass || isPassInSemesterEnd) &&
    isPassInInternal
  const failures: string[] = []
  if (pack.passCriteria.requireSemesterEndPass && !isPassInSemesterEnd)
    failures.push(
      `need ${pack.semesterEndExam.passPercentage}% in university exam (${round2((pack.semesterEndExam.passPercentage / 100) * maxSee)}/${maxSee}), got ${seePerc.toFixed(1)}%`,
    )
  if (!isPassInInternal)
    failures.push(`need ${pack.passCriteria.minimumInternalPercentage}% in IA, got ${intPerc.toFixed(1)}%`)
  if (!isPassInAggregate)
    failures.push(`need ${pack.passCriteria.aggregatePassPercentage}% aggregate, got ${aggPerc.toFixed(1)}%`)
  return {
    semesterEndPercentage: round2(seePerc),
    internalPercentage: round2(intPerc),
    aggregatePercentage: round2(aggPerc),
    totalMarks: see + ia,
    maxTotal: maxSee + maxInt,
    isPassInSemesterEnd,
    isPassInInternal,
    isPassInAggregate,
    isPass,
    remarks: isPass
      ? `Pass - ${seePerc.toFixed(1)}% in university exam, ${aggPerc.toFixed(1)}% aggregate (${pack.code})`
      : `Fail - ${failures.join('; ')}`,
  }
}
export interface SchemeGradeResult {
  grade: string
  gradePoint: number
  description: string
}
export function getSchemeGradeFromMarks(
  marks: number,
  maxMarks: number,
  pack: UniversitySchemePack,
): SchemeGradeResult {
  requirePack(pack)
  range(maxMarks, 'Maximum marks', 2000)
  if (maxMarks <= 0) throw new SchemeConfigurationError('Maximum marks must be positive')
  range(marks, 'Marks', maxMarks)
  const rawPercentage = (marks / maxMarks) * 100
  const percentage = pack.gradePointPolicy?.percentageRounding === 'nearest-integer' ? Math.round(rawPercentage) : rawPercentage
  const row = [...pack.gradeTable]
    .sort((a, b) => b.minPercentage - a.minPercentage)
    .find((g) => percentage >= g.minPercentage)
  if (!row) throw new SchemeConfigurationError('No grade band covers these marks')
  return { grade: row.grade, gradePoint: pack.gradePointPolicy?.method === 'percentage-divided-by-ten' && row.gradePoint > 0 ? percentage / 10 : row.gradePoint, description: row.description }
}
export interface SchemeSubjectGrade {
  credits: number
  gradePoint: number
}
export function calculateSchemeSGPA(subjects: SchemeSubjectGrade[]): number {
  let credits = 0
  let points = 0
  for (const s of subjects) {
    range(s.credits, 'Credits', 30)
    range(s.gradePoint, 'Grade point', 10)
    credits += s.credits
    points += s.credits * s.gradePoint
  }
  return credits > 0 ? points / credits : 0
}
export function getSchemeAttendanceEligibilityMessage(
  percentage: number,
  pack: UniversitySchemePack,
): string {
  const att = calculateSchemeAttendanceMarks(percentage, pack)
  return !att.isEligible
    ? `Not eligible for university exam - Attendance ${percentage.toFixed(1)}% is below ${pack.attendance.minimumPercentage}% minimum (${pack.code})`
    : `Eligible - ${percentage.toFixed(1)}% attendance (${att.marks} IA marks)`
}

export function defaultAssessmentProfile(pack: UniversitySchemePack): CourseAssessmentProfile {
  requirePack(pack)
  const ia = pack.internalAssessment
  return {
    id: 'default',
    name: 'College standard assessment',
    internalMaxMarks: ia.totalMarks,
    externalMaxMarks: pack.semesterEndExam.defaultMaxMarks,
    durationMinutes: pack.semesterEndExam.durationMinutes,
    internalComponents: [
      ...(ia.test.weightInTotal > 0
        ? [
            {
              id: 'tests',
              label: 'Tests',
              method: 'bestOf' as const,
              count: ia.test.count,
              maxMarksEach: ia.test.maxMarksEach,
              bestOf: ia.test.bestOf,
              weight: ia.test.weightInTotal,
            },
          ]
        : []),
      ...(ia.attendanceMaxMarks > 0
        ? [
            {
              id: 'attendance',
              label: 'Attendance',
              method: 'attendance' as const,
              count: 1,
              maxMarksEach: ia.attendanceMaxMarks,
              weight: ia.attendanceMaxMarks,
            },
          ]
        : []),
      ...(ia.assignmentMaxMarks > 0
        ? [
            {
              id: 'assignment',
              label: 'Assignment',
              method: 'single' as const,
              count: 1,
              maxMarksEach: ia.assignmentMaxMarks,
              weight: ia.assignmentMaxMarks,
            },
          ]
        : []),
    ],
    passCriteria: {
      externalPassPercentage: pack.semesterEndExam.passPercentage,
      internalPassPercentage: pack.passCriteria.minimumInternalPercentage,
      aggregatePassPercentage: pack.passCriteria.aggregatePassPercentage,
      requireExternalPass: pack.passCriteria.requireSemesterEndPass,
    },
  }
}
export function assertProgrammeApplies(pack: UniversitySchemePack, context: AcademicContext): void {
  if (
    pack.applicableProgrammes.length &&
    (!context.programme ||
      !pack.applicableProgrammes.some((p) => academicKey(p) === academicKey(context.programme)))
  ) {
    throw new SchemeConfigurationError(
      `Programme ${context.programme || '(missing)'} is not covered by scheme ${pack.code}. Review the approved college scheme.`,
    )
  }
}
export function resolveSchemeCourse(
  pack: UniversitySchemePack,
  code: string,
  context: AcademicContext,
): { course: SchemeCourse; profile: CourseAssessmentProfile } {
  requirePack(pack)
  assertProgrammeApplies(pack, context)
  const matches = (pack.courses ?? []).filter(
    (c) =>
      courseCodeKey(c.code) === courseCodeKey(code) &&
      (!c.programme || academicKey(c.programme) === academicKey(context.programme)) &&
      (!c.batch || academicKey(c.batch) === academicKey(context.batch)) &&
      (!c.semester || c.semester === context.semester),
  )
  const rank = (c: SchemeCourse) => Number(!!c.programme) + Number(!!c.batch) + Number(!!c.semester)
  matches.sort((a, b) => rank(b) - rank(a))
  if (!matches.length)
    throw new SchemeConfigurationError(
      `Course ${code} has no approved credits/assessment mapping for this programme, batch and semester. Configure it in Scheme Packs; credits will not be guessed.`,
    )
  if (matches.length > 1 && rank(matches[0]) === rank(matches[1]))
    throw new SchemeConfigurationError(`Course ${code} has ambiguous scheme mappings. Review Scheme Packs.`)
  const course = matches[0]
  const profile =
    course.assessmentProfileId === 'default'
      ? defaultAssessmentProfile(pack)
      : pack.assessmentProfiles?.find((p) => p.id === course.assessmentProfileId)
  if (!profile)
    throw new SchemeConfigurationError(`Assessment profile ${course.assessmentProfileId} is not configured`)
  return { course, profile }
}

/** Generic IA components: project/viva/practical/C1/C2 are not forced into tests+assignment. */
export function calculateProfileInternalMarks(
  values: Record<string, number[]>,
  profile: CourseAssessmentProfile,
  pack: UniversitySchemePack,
  attendancePercentage?: number,
) {
  if (!values || typeof values !== 'object' || Array.isArray(values))
    throw new SchemeConfigurationError('IA component evidence must be an object')
  if (
    Object.keys(values).some(
      (id) => !profile.internalComponents.some((c) => c.id === id && c.method !== 'attendance'),
    )
  )
    throw new SchemeConfigurationError('IA evidence contains an unknown component')
  let unroundedTotal = 0
  const breakdown = profile.internalComponents.map((c) => {
    let raw = 0
    if (c.method === 'attendance') {
      if (attendancePercentage === undefined)
        throw new SchemeConfigurationError(`${c.label}: attendance is required`)
      raw = Math.min(c.maxMarksEach, calculateSchemeAttendanceMarks(attendancePercentage, pack).marks)
    } else {
      const marks = values[c.id]
      if (!Array.isArray(marks) || marks.length !== c.count)
        throw new SchemeConfigurationError(
          `${c.label}: exactly ${c.count} marks are required (use 0 for a recorded absence)`,
        )
      marks.forEach((m) => range(m, c.label, c.maxMarksEach))
      if (c.method === 'bestOf')
        raw =
          [...marks]
            .sort((a, b) => b - a)
            .slice(0, c.bestOf!)
            .reduce((a, b) => a + b, 0) / c.bestOf!
      else if (c.method === 'sum') raw = marks.reduce((a, b) => a + b, 0) / c.count
      else raw = marks.reduce((a, b) => a + b, 0) / marks.length
    }
    const contribution = (raw / c.maxMarksEach) * c.weight
    unroundedTotal += contribution
    return { id: c.id, label: c.label, marks: round2(contribution), maxMarks: c.weight }
  })
  return { totalIA: round2(unroundedTotal), totalPossible: profile.internalMaxMarks, breakdown }
}

export type CourseResult = 'P' | 'F' | 'A' | 'W'
export interface CourseMarksInput {
  internal?: number
  external?: number
  total?: number
  result?: string
  grade?: string
  gradePoint?: number
  credits?: number
  internalComponents?: Record<string, number[]>
  attendancePercentage?: number
}
/** Both UI preview and authoritative server writes use this full pass + grade decision. */
export function evaluateCourseResult(
  input: CourseMarksInput,
  pack: UniversitySchemePack,
  course: SchemeCourse,
  profile: CourseAssessmentProfile,
) {
  const rawStatus = String(input.result ?? '')
    .trim()
    .toUpperCase()
  const statuses: Record<string, CourseResult> = {
    P: 'P',
    PASS: 'P',
    F: 'F',
    FAIL: 'F',
    FAILED: 'F',
    A: 'A',
    ABSENT: 'A',
    W: 'W',
    WITHHELD: 'W',
  }
  if (rawStatus && !statuses[rawStatus])
    throw new SchemeConfigurationError(`Unrecognised result status ${rawStatus}`)
  const status = statuses[rawStatus]
  if (status === 'W')
    throw new SchemeConfigurationError(
      'Withheld results cannot be converted to official grades or GPA. Resolve them before importing/publishing.',
    )
  const internal = input.internal ?? (profile.internalMaxMarks === 0 || status === 'A' ? 0 : NaN)
  const external = input.external ?? (profile.externalMaxMarks === 0 || status === 'A' ? 0 : NaN)
  const profilePack: UniversitySchemePack = {
    ...pack,
    gradeTable: profile.gradeTable ?? pack.gradeTable,
    gradePointPolicy: profile.gradePointPolicy ?? pack.gradePointPolicy,
    semesterEndExam: {
      defaultMaxMarks: profile.externalMaxMarks,
      durationMinutes: profile.durationMinutes,
      passPercentage: profile.passCriteria.externalPassPercentage,
    },
    internalAssessment: { ...pack.internalAssessment, totalMarks: profile.internalMaxMarks },
    passCriteria: {
      aggregatePassPercentage: profile.passCriteria.aggregatePassPercentage,
      minimumInternalPercentage: profile.passCriteria.internalPassPercentage,
      requireSemesterEndPass: profile.passCriteria.requireExternalPass,
    },
  }
  const pass = checkSchemePassCriteria({ internalMarks: internal, semesterEndMarks: external }, profilePack)
  if (
    input.total !== undefined &&
    (!Number.isFinite(input.total) || Math.abs(input.total - pass.totalMarks) > 0.01)
  )
    throw new SchemeConfigurationError('Total must equal internal plus external marks')
  if (input.credits !== undefined && input.credits !== course.credits)
    throw new SchemeConfigurationError(
      `Credits must match the approved course mapping (${course.credits}), not ${input.credits}`,
    )
  const band = getSchemeGradeFromMarks(internal + external, pass.maxTotal, profilePack)
  const failure: SchemeGrade | undefined = profilePack.gradeTable.find(
    (g) => g.gradePoint === 0 && g.minPercentage === 0,
  )
  if (!failure) throw new SchemeConfigurationError('A zero-point failure grade is required')
  const bandIsPass = band.grade !== failure.grade && (band.gradePoint > 0 || !course.includeInGpa)
  const isPass = pass.isPass && bandIsPass && status !== 'F' && status !== 'A'
  const grade = isPass ? band.grade : status === 'A' ? 'AB' : failure.grade
  const gradePoint = isPass ? band.gradePoint : 0
  if (input.grade && input.grade.trim().toUpperCase() !== grade)
    throw new SchemeConfigurationError(
      `Submitted grade ${input.grade} does not match the scheme-derived grade ${grade}`,
    )
  if (input.gradePoint !== undefined && input.gradePoint !== gradePoint)
    throw new SchemeConfigurationError(
      `Submitted grade point does not match the scheme-derived value ${gradePoint}`,
    )
  return {
    internal,
    external,
    total: pass.totalMarks,
    maxMarks: pass.maxTotal,
    maxInternalMarks: profile.internalMaxMarks,
    maxExternalMarks: profile.externalMaxMarks,
    percentage: pass.aggregatePercentage,
    grade,
    gradePoint,
    result: (status === 'A' ? 'A' : isPass ? 'P' : 'F') as Exclude<CourseResult, 'W'>,
    isPass,
    credits: course.credits,
    includeInGpa: course.includeInGpa,
    category: course.category,
    assessmentProfileId: profile.id,
    remarks: isPass
      ? pass.remarks
      : status === 'A'
        ? 'Absent — no credits earned'
        : status === 'F'
          ? 'Recorded failure — no credits earned'
          : pass.remarks,
  }
}
