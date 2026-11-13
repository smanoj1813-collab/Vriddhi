import type {
  AssessmentComponent,
  CourseAssessmentProfile,
  ProgrammeCreditRequirement,
  SchemeCourse,
  SchemeGrade,
  UniversitySchemePack,
} from './schemePack'

export class SchemeConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SchemeConfigurationError'
  }
}
const fail = (message: string): never => {
  throw new SchemeConfigurationError(message)
}
const obj = (v: unknown, field: string): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : fail(`${field} must be an object`)
const text = (v: unknown, field: string, max = 120, required = true): string => {
  if (typeof v !== 'string') return required ? fail(`${field} is required`) : ''
  const s = v.trim()
  if ((required && !s) || s.length > max) fail(`${field} is required and must be at most ${max} characters`)
  return s
}
const num = (v: unknown, field: string, min = 0, max = 100, integer = false): number => {
  if (
    (typeof v !== 'number' && typeof v !== 'string') ||
    (typeof v === 'string' && !v.trim()) ||
    !Number.isFinite(Number(v))
  )
    fail(`${field} must be a number between ${min} and ${max}`)
  const n = Number(v)
  if (n < min || n > max || (integer && !Number.isInteger(n)))
    fail(`${field} must be ${integer ? 'an integer' : 'a number'} between ${min} and ${max}`)
  return n
}
const bool = (v: unknown, field: string): boolean =>
  typeof v === 'boolean' ? v : fail(`${field} must be true or false`)
const list = (v: unknown, field: string, max: number, optional = false): unknown[] => {
  if (optional && v === undefined) return []
  if (!Array.isArray(v) || v.length > max) fail(`${field} must be an array with at most ${max} entries`)
  return v as unknown[]
}
const strings = (v: unknown, field: string, max: number): string[] =>
  list(v, field, max, true).map((s, i) => text(s, `${field}[${i}]`, 120))
const unique = (keys: string[], field: string) => {
  if (new Set(keys).size !== keys.length) fail(`${field} contains duplicate entries`)
}
export const academicKey = (v: unknown): string =>
  String(v ?? '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    // Vowel signs/combining marks distinguish Kannada and other programme
    // names. Strip presentation punctuation, not meaningful script marks.
    .replace(/[^\p{L}\p{M}\p{N}]/gu, '')
export const courseCodeKey = (v: unknown): string =>
  String(v ?? '')
    .trim()
    .toUpperCase()

function grades(value: unknown, field: string): SchemeGrade[] {
  const rows = list(value, field, 14)
  if (rows.length < 2) fail(`${field} must have between 2 and 14 rows`)
  const table = rows
    .map((v, i) => {
      const r = obj(v, `${field}[${i}]`)
      const grade = text(r.grade, `${field}[${i}].grade`, 6).toUpperCase()
      if (!/^[A-Z][A-Z0-9+-]{0,5}$/.test(grade)) fail(`${field}: invalid grade label`)
      return {
        grade,
        gradePoint: num(r.gradePoint, `${field}.gradePoint`, 0, 10),
        minPercentage: num(r.minPercentage, `${field}.minPercentage`),
        description: text(r.description, `${field}.description`, 120, false),
      }
    })
    .sort((a, b) => b.minPercentage - a.minPercentage)
  unique(
    table.map((g) => g.grade),
    field,
  )
  unique(
    table.map((g) => String(g.minPercentage)),
    field,
  )
  if (table[table.length - 1].minPercentage !== 0 || table[table.length - 1].gradePoint !== 0)
    fail(`${field} must end with a zero-point failure band at 0%`)
  for (let i = 1; i < table.length; i++) {
    if (table[i].gradePoint > table[i - 1].gradePoint)
      fail(`${field} grade points must decrease with percentage`)
  }
  return table
}

function components(value: unknown, total: number, field: string): AssessmentComponent[] {
  const result = list(value, field, 20).map((v, i): AssessmentComponent => {
    const r = obj(v, `${field}[${i}]`)
    const method = text(r.method, `${field}.method`, 20) as AssessmentComponent['method']
    if (!['single', 'average', 'bestOf', 'sum', 'attendance'].includes(method))
      fail(`${field}: unsupported method`)
    const count = num(r.count, `${field}.count`, 1, 20, true)
    if ((method === 'single' || method === 'attendance') && count !== 1)
      fail(`${field}: single/attendance components have count 1`)
    const bestOf = method === 'bestOf' ? num(r.bestOf, `${field}.bestOf`, 1, count, true) : undefined
    const id = text(r.id, `${field}.id`, 50)
    if (!/^[a-zA-Z0-9_-]+$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id))
      fail(`${field}: component id must use letters, digits, underscore or hyphen`)
    return {
      id,
      label: text(r.label, `${field}.label`),
      method,
      count,
      maxMarksEach: num(r.maxMarksEach, `${field}.maxMarksEach`, 0.01, 1000),
      weight: num(r.weight, `${field}.weight`, 0, 1000),
      ...(bestOf === undefined ? {} : { bestOf }),
    }
  })
  unique(
    result.map((c) => c.id),
    field,
  )
  if (Math.abs(result.reduce((s, c) => s + c.weight, 0) - total) > 0.001)
    fail(`${field}: component weights must add up to totalMarks (${total})`)
  return result
}

function gradePointPolicy(value: unknown): NonNullable<UniversitySchemePack['gradePointPolicy']> {
  const r = obj(value, 'gradePointPolicy')
  if (r.method !== 'bands' && r.method !== 'percentage-divided-by-ten') fail('Invalid gradePointPolicy.method')
  if (r.percentageRounding !== 'none' && r.percentageRounding !== 'nearest-integer') fail('Invalid gradePointPolicy.percentageRounding')
  return { method: r.method as 'bands' | 'percentage-divided-by-ten', percentageRounding: r.percentageRounding as 'none' | 'nearest-integer' }
}

function profile(value: unknown): CourseAssessmentProfile {
  const r = obj(value, 'assessmentProfiles entry')
  const id = text(r.id, 'profile.id', 50)
  if (id === 'default' || !/^[a-zA-Z0-9_-]+$/.test(id))
    fail('profile.id must be unique and cannot be default')
  const internalMaxMarks = num(r.internalMaxMarks, 'profile.internalMaxMarks', 0, 1000)
  const externalMaxMarks = num(r.externalMaxMarks, 'profile.externalMaxMarks', 0, 1000)
  if (internalMaxMarks + externalMaxMarks <= 0) fail('A profile must have a positive total maximum')
  const p = obj(r.passCriteria, 'profile.passCriteria')
  return {
    id,
    name: text(r.name, 'profile.name'),
    internalMaxMarks,
    externalMaxMarks,
    durationMinutes: num(r.durationMinutes, 'profile.durationMinutes', 0, 600, true),
    internalComponents: components(r.internalComponents, internalMaxMarks, 'profile.internalComponents'),
    passCriteria: {
      externalPassPercentage: num(p.externalPassPercentage, 'profile.externalPassPercentage'),
      internalPassPercentage: num(p.internalPassPercentage, 'profile.internalPassPercentage'),
      aggregatePassPercentage: num(p.aggregatePassPercentage, 'profile.aggregatePassPercentage'),
      requireExternalPass: bool(p.requireExternalPass, 'profile.requireExternalPass'),
    },
    ...(r.gradeTable === undefined ? {} : { gradeTable: grades(r.gradeTable, 'profile.gradeTable') }),
    ...(r.gradePointPolicy === undefined ? {} : { gradePointPolicy: gradePointPolicy(r.gradePointPolicy) }),
  }
}

/** Validate a COMPLETE pack. Never fill missing academic rules from another university. */
export function normalizeSchemePack(value: unknown): UniversitySchemePack {
  const r = obj(value, 'Scheme pack')
  const code = text(r.code, 'code', 40).toUpperCase()
  if (!/^[A-Z0-9_]{3,40}$/.test(code)) fail('code must be 3-40 chars, letters/digits/underscore')
  const a = obj(r.attendance, 'attendance')
  const minimumPercentage = num(a.minimumPercentage, 'attendance.minimumPercentage')
  const marksSlabs = list(a.marksSlabs, 'attendance.marksSlabs', 12)
    .map((v, i) => {
      const s = obj(v, `marksSlabs[${i}]`)
      const min = num(s.min, `marksSlabs[${i}].min`)
      const max = num(s.max, `marksSlabs[${i}].max`)
      if (min > max) fail(`marksSlabs[${i}]: min must be ≤ max`)
      return {
        min,
        max,
        marks: num(s.marks, `marksSlabs[${i}].marks`, 0, 100),
        label: text(s.label, `marksSlabs[${i}].label`, 120, false) || `${min}%–${max}%`,
      }
    })
    .sort((x, y) => x.min - y.min)
  for (let i = 1; i < marksSlabs.length; i++) {
    if (marksSlabs[i].min <= marksSlabs[i - 1].max) fail('attendance slabs must not overlap')
    if (marksSlabs[i].min - marksSlabs[i - 1].max > 1)
      fail('attendance slabs must not leave uncovered whole-percentage gaps')
  }
  if (marksSlabs.length && marksSlabs[marksSlabs.length - 1].max !== 100)
    fail('attendance slabs must extend to 100%')
  if (marksSlabs.length && marksSlabs[0].min > minimumPercentage + 1.5)
    fail('attendance slabs should start at or just above minimumPercentage')
  const ia = obj(r.internalAssessment, 'internalAssessment')
  const t = obj(ia.test, 'internalAssessment.test')
  const totalMarks = num(ia.totalMarks, 'internalAssessment.totalMarks', 0, 1000)
  const test = {
    count: num(t.count, 'test.count', 0, 8, true),
    maxMarksEach: num(t.maxMarksEach, 'test.maxMarksEach', 0, 1000),
    bestOf: num(t.bestOf, 'test.bestOf', 0, 8, true),
    weightInTotal: num(t.weightInTotal, 'test.weightInTotal', 0, 1000),
  }
  if (test.weightInTotal > 0 && (test.count < 1 || test.bestOf < 1 || test.maxMarksEach <= 0))
    fail('A weighted test component requires a positive count, bestOf and maximum')
  if (test.bestOf > test.count) fail('internalAssessment.test.bestOf cannot exceed test.count')
  const attendanceMaxMarks = num(ia.attendanceMaxMarks, 'internalAssessment.attendanceMaxMarks', 0, 100)
  const assignmentMaxMarks = num(ia.assignmentMaxMarks, 'internalAssessment.assignmentMaxMarks', 0, 1000)
  if (Math.abs(test.weightInTotal + attendanceMaxMarks + assignmentMaxMarks - totalMarks) > 0.001)
    fail('IA components must add up to totalMarks')
  if (attendanceMaxMarks > 0 && !marksSlabs.length) fail('Attendance marks require a nonempty slab table')
  if (marksSlabs.some((s) => s.marks > attendanceMaxMarks))
    fail('Attendance slab marks exceed attendanceMaxMarks')
  const e = obj(r.semesterEndExam, 'semesterEndExam')
  const semesterEndExam = {
    defaultMaxMarks: num(e.defaultMaxMarks, 'semesterEndExam.defaultMaxMarks', 0, 1000),
    durationMinutes: num(e.durationMinutes, 'semesterEndExam.durationMinutes', 0, 600, true),
    passPercentage: num(e.passPercentage, 'semesterEndExam.passPercentage'),
  }
  if (semesterEndExam.defaultMaxMarks + totalMarks <= 0) fail('Scheme total marks must be positive')
  const p = obj(r.passCriteria, 'passCriteria')
  const status = text(r.status ?? 'active', 'status', 20)
  if (!['active', 'draft', 'archived'].includes(status)) fail('status must be active, draft or archived')
  const applicableProgrammes = strings(r.applicableProgrammes, 'applicableProgrammes', 40)
  unique(applicableProgrammes.map(academicKey), 'applicableProgrammes')
  const gradeTable = grades(r.gradeTable, 'gradeTable')
  const profiles = list(r.assessmentProfiles, 'assessmentProfiles', 50, true).map(profile)
  unique(
    profiles.map((x) => x.id),
    'assessmentProfiles',
  )
  const courses = list(r.courses, 'courses', 500, true).map((v): SchemeCourse => {
    const c = obj(v, 'courses entry')
    const assessmentProfileId = text(c.assessmentProfileId, 'course.assessmentProfileId', 50)
    if (assessmentProfileId !== 'default' && !profiles.some((x) => x.id === assessmentProfileId))
      fail(`Unknown assessment profile ${assessmentProfileId}`)
    const credits = num(c.credits, 'course.credits', 0, 30)
    const includeInGpa = bool(c.includeInGpa, 'course.includeInGpa')
    if (includeInGpa && credits === 0) fail('A GPA course must have positive credits')
    return {
      code: text(c.code, 'course.code', 50).toUpperCase(),
      name: text(c.name, 'course.name', 200),
      credits,
      category: text(c.category, 'course.category', 50),
      assessmentProfileId,
      includeInGpa,
      requiredForAward: bool(c.requiredForAward, 'course.requiredForAward'),
      ...(c.programme ? { programme: text(c.programme, 'course.programme') } : {}),
      ...(c.batch ? { batch: text(c.batch, 'course.batch', 40) } : {}),
      ...(c.semester === undefined ? {} : { semester: num(c.semester, 'course.semester', 1, 20, true) }),
    }
  })
  for (const course of courses)
    if (
      course.programme &&
      applicableProgrammes.length &&
      !applicableProgrammes.some((p) => academicKey(p) === academicKey(course.programme))
    )
      fail(`Course ${course.code}: programme is outside applicableProgrammes`)
  for (const course of courses) {
    const table = profiles.find((p) => p.id === course.assessmentProfileId)?.gradeTable ?? gradeTable
    if (course.includeInGpa && !table.some((g) => g.gradePoint > 0))
      fail(`GPA course ${course.code} requires a positive-point passing grade band`)
  }
  unique(
    courses.map((c) => `${c.code}|${academicKey(c.programme)}|${academicKey(c.batch)}|${c.semester ?? ''}`),
    'courses',
  )
  const requirements = list(r.creditRequirements, 'creditRequirements', 40, true).map(
    (v): ProgrammeCreditRequirement => {
      const c = obj(v, 'creditRequirements entry')
      const categoryMinimums = obj(c.categoryMinimums ?? {}, 'categoryMinimums')
      if (Object.keys(categoryMinimums).length > 30) fail('At most 30 category minimums are supported')
      const categories: Record<string, number> = {}
      for (const [key, val] of Object.entries(categoryMinimums)) {
        const name = text(key, 'credit category', 50)
        if (['__proto__', 'constructor', 'prototype'].includes(name)) fail('Invalid category name')
        categories[name] = num(val, `categoryMinimums.${name}`, 0, 1000)
      }
      unique(Object.keys(categories).map(academicKey), 'categoryMinimums')
      const requiredCourseCodes = strings(c.requiredCourseCodes, 'requiredCourseCodes', 500).map(
        courseCodeKey,
      )
      unique(requiredCourseCodes, 'requiredCourseCodes')
      return {
        programme: text(c.programme, 'creditRequirement.programme'),
        ...(c.batch ? { batch: text(c.batch, 'creditRequirement.batch', 40) } : {}),
        totalSemesters: num(c.totalSemesters, 'creditRequirement.totalSemesters', 1, 20, true),
        minimumCredits: num(c.minimumCredits, 'creditRequirement.minimumCredits', 0.01, 1000),
        requiredCourseCodes,
        categoryMinimums: categories,
      }
    },
  )
  for (const plan of requirements) {
    if (
      applicableProgrammes.length &&
      !applicableProgrammes.some((p) => academicKey(p) === academicKey(plan.programme))
    )
      fail('Credit requirement programme is outside applicableProgrammes')
    for (const code of plan.requiredCourseCodes)
      if (
        !courses.some(
          (c) =>
            c.code === code &&
            (!c.programme || academicKey(c.programme) === academicKey(plan.programme)) &&
            (!c.batch || academicKey(c.batch) === academicKey(plan.batch)),
        )
      )
        fail(`Required course ${code} is missing from the approved programme/cohort mappings`)
  }
  unique(
    requirements.map((c) => `${academicKey(c.programme)}|${academicKey(c.batch)}`),
    'creditRequirements',
  )
  return {
    id: text(r.id ?? code, 'id', 200),
    code,
    name: text(r.name, 'name'),
    universityName: text(r.universityName, 'universityName'),
    schemeName: text(r.schemeName, 'schemeName', 80),
    applicableProgrammes,
    attendance: {
      minimumPercentage,
      marksSlabs,
      blocksExamEligibility: bool(a.blocksExamEligibility, 'attendance.blocksExamEligibility'),
    },
    internalAssessment: { totalMarks, test, attendanceMaxMarks, assignmentMaxMarks },
    semesterEndExam,
    passCriteria: {
      aggregatePassPercentage: num(p.aggregatePassPercentage, 'aggregatePassPercentage'),
      minimumInternalPercentage: num(p.minimumInternalPercentage, 'minimumInternalPercentage'),
      requireSemesterEndPass: bool(p.requireSemesterEndPass, 'requireSemesterEndPass'),
    },
    gradeTable,
    ...(r.gradePointPolicy === undefined ? {} : { gradePointPolicy: gradePointPolicy(r.gradePointPolicy) }),
    mediums: strings(r.mediums, 'mediums', 12),
    status: status as UniversitySchemePack['status'],
    sourceNote: text(r.sourceNote, 'sourceNote', 1500, false),
    revision: r.revision === undefined ? 1 : num(r.revision, 'revision', 1, 100000, true),
    assessmentProfiles: profiles,
    courses,
    creditRequirements: requirements,
  }
}
