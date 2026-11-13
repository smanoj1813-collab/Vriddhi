import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { academicFixture } from './helpers/academicFixture'
import { SCHEME_PACK_PRESETS } from '../src/academic/schemePack'
import { normalizeSchemePack } from '../src/academic/schemeValidation'
import {
  calculateProfileInternalMarks,
  calculateSchemeInternalMarks,
  checkSchemePassCriteria,
  evaluateCourseResult,
  resolveSchemeCourse,
  calculateSchemeSGPA,
} from '../src/academic/schemeEngine'
import { deriveOfficialGrade, assertDraftPolicyCurrent } from '../src/academic/gradePolicy'
import { auditProgrammeCredits, summarizeCredits } from '../src/academic/creditEngine'

const context = { programme: 'BCA', batch: '2026-27', semester: 1 }
const rows = [
  { code: 'CS101', semester: 1, credits: 4, gradePoint: 9, result: 'P', category: 'Core' },
  { code: 'CS102', semester: 1, credits: 2, gradePoint: 6, result: 'P', category: 'Core' },
  { code: 'CS103', semester: 1, credits: 4, gradePoint: 0, result: 'F', category: 'Core' },
]

describe('complete academic policy validation', () => {
  it('validates every existing Karnataka template without changing its rules', () => {
    for (const p of SCHEME_PACK_PRESETS) {
      const normalized = normalizeSchemePack(p)
      assert.deepEqual(normalized.passCriteria, p.passCriteria)
      assert.deepEqual(normalized.gradeTable, p.gradeTable)
      assert.equal(normalized.semesterEndExam.defaultMaxMarks, p.semesterEndExam.defaultMaxMarks)
    }
    assert.equal(normalizeSchemePack(academicFixture()).courses?.length, 7)
  })
  it('rejects missing, partial and non-finite numeric rules rather than filling BCU', () => {
    for (const p of [null, {}, { code: 'CUSTOM' }]) assert.throws(() => normalizeSchemePack(p))
    for (const n of [NaN, Infinity, -1, 3.5]) {
      const p = academicFixture()
      p.internalAssessment.test.count = n
      assert.throws(() => normalizeSchemePack(p), /test.count/)
    }
    const p = academicFixture()
    p.internalAssessment.test.bestOf = 1.5
    assert.throws(() => normalizeSchemePack(p), /bestOf/)
  })
  it('rejects overlapping/gapped slabs, unbalanced IA, duplicate grades and missing failure floor', () => {
    const a = academicFixture()
    a.attendance.marksSlabs[1].min = 80
    assert.throws(() => normalizeSchemePack(a), /overlap/)
    const b = academicFixture()
    b.attendance.marksSlabs[1].min = 83
    assert.throws(() => normalizeSchemePack(b), /gaps/)
    const c = academicFixture()
    c.internalAssessment.totalMarks = 20.5
    assert.throws(() => normalizeSchemePack(c), /add up/)
    const d = academicFixture()
    d.gradeTable[0].grade = 'F'
    assert.throws(() => normalizeSchemePack(d), /duplicate/)
    const e = academicFixture()
    e.gradeTable.pop()
    assert.throws(() => normalizeSchemePack(e), /failure band/)
    const f = academicFixture()
    f.status = 'nonsense' as never
    assert.throws(() => normalizeSchemePack(f), /status/)
  })
  it('validates course/profile references, credits, component sums and required-course mappings', () => {
    const a = academicFixture()
    a.courses![0].assessmentProfileId = 'MISSING'
    assert.throws(() => normalizeSchemePack(a), /Unknown assessment/)
    const b = academicFixture()
    b.courses![0].credits = -1
    assert.throws(() => normalizeSchemePack(b), /credits/)
    const c = academicFixture()
    c.courses![0].credits = 0
    assert.throws(() => normalizeSchemePack(c), /positive credits/)
    const d = academicFixture()
    d.assessmentProfiles![0].internalComponents[0].weight = 29
    assert.throws(() => normalizeSchemePack(d), /add up/)
    const e = academicFixture()
    e.creditRequirements![0].requiredCourseCodes.push('UNKNOWN')
    assert.throws(() => normalizeSchemePack(e), /Required course/)
  })
})

describe('programme, batch and course assessment resolution', () => {
  it('does not guess credits or accept out-of-scope programmes and semesters', () => {
    const p = normalizeSchemePack(academicFixture())
    assert.throws(() => resolveSchemeCourse(p, 'UNKNOWN', context), /no approved credits/)
    assert.throws(() => resolveSchemeCourse(p, 'CS101', { ...context, programme: 'BA' }), /not covered/)
    assert.throws(() => resolveSchemeCourse(p, 'CS101', { ...context, semester: 2 }), /no approved credits/)
    assert.equal(resolveSchemeCourse(p, 'cs101', context).course.credits, 4)
  })
  it('chooses the most specific mapping and fails closed on equally specific ambiguity', () => {
    const p = academicFixture()
    p.courses!.push({ ...p.courses![0], batch: '2026-27', credits: 3 })
    assert.equal(resolveSchemeCourse(p, 'CS101', context).course.credits, 3)
    p.courses!.push({ ...p.courses![0], semester: undefined, batch: '2026-27', credits: 2 })
    p.courses = p.courses!.filter((c) => !(c.code === 'CS101' && c.batch && c.semester))
    assert.throws(() => resolveSchemeCourse(p, 'CS101', context), /ambiguous/)
  })
  it('does not collapse distinct Kannada programme names into the same scope', () => {
    const p = academicFixture()
    p.applicableProgrammes = []
    p.courses![0].programme = 'ಬಿಸಿಎ'
    assert.equal(resolveSchemeCourse(p, 'CS101', { ...context, programme: 'ಬಿಸಿಎ' }).course.credits, 4)
    assert.throws(
      () => resolveSchemeCourse(p, 'CS101', { ...context, programme: 'ಎಂಸಿಎ' }),
      /no approved credits/,
    )
    // These differ only in their vowel signs, not their base letters.
    p.courses![0].programme = 'ಬಿ'
    assert.equal(resolveSchemeCourse(p, 'CS101', { ...context, programme: 'ಬಿ' }).course.credits, 4)
    assert.throws(
      () => resolveSchemeCourse(p, 'CS101', { ...context, programme: 'ಬೀ' }),
      /no approved credits/,
    )
  })
  it('preserves zero component maxima; internal-only/external-only courses do not inherit 80/20', () => {
    const p = academicFixture()
    const lab = deriveOfficialGrade({ code: 'LAB', semester: 1, internal: 35 }, p, context)
    assert.equal(lab.maxMarks, 50)
    assert.equal(lab.external, 0)
    assert.equal(lab.isPass, true)
    const external = deriveOfficialGrade({ code: 'EXT', semester: 1, external: 30 }, p, context)
    assert.equal(external.internal, 0)
    assert.equal(external.maxMarks, 50)
    assert.equal(external.isPass, true)
    assert.equal(
      checkSchemePassCriteria(
        { semesterEndMarks: 0, internalMarks: 30, maxSemesterEndMarks: 0, maxInternalMarks: 50 },
        p,
      ).maxTotal,
      50,
    )
  })
  it('represents a truly external-only college standard without inventing tests or IA', () => {
    const p = academicFixture()
    p.internalAssessment = {
      totalMarks: 0,
      test: { count: 0, bestOf: 0, maxMarksEach: 0, weightInTotal: 0 },
      attendanceMaxMarks: 0,
      assignmentMaxMarks: 0,
    }
    p.attendance.marksSlabs = []
    const valid = normalizeSchemePack(p)
    const ia = calculateSchemeInternalMarks(
      { testMarks: [], assignmentMarks: 0, attendancePercentage: 85 },
      valid,
    )
    assert.equal(ia.totalIA, 0)
    assert.equal(
      deriveOfficialGrade({ code: 'CS101', semester: 1, external: 50 }, valid, context).internal,
      0,
    )
  })
  it('supports a different PG pass floor and grade ladder within one college policy', () => {
    const result = deriveOfficialGrade(
      { code: 'PG101', semester: 1, internal: 20, external: 40 },
      academicFixture(),
      { programme: 'MCA', semester: 1 },
    )
    assert.equal(result.grade, 'P')
    assert.equal(result.gradePoint, 6)
    assert.equal(result.maxInternalMarks, 30)
  })
})

describe('assessment evidence and pass/grade integrity', () => {
  it('uses best-N, named practical/project/viva components and auditable evidence', () => {
    const p = academicFixture()
    const standard = deriveOfficialGrade(
      {
        code: 'CS101',
        semester: 1,
        external: 60,
        internalComponents: { tests: [16, 18, 12], assignment: [5] },
        attendancePercentage: 95,
      },
      p,
      context,
    )
    assert.equal(standard.internal, 18.5)
    assert.equal(standard.assessmentEvidence?.breakdown.length, 3)
    const { profile } = resolveSchemeCourse(p, 'LAB', context)
    assert.equal(calculateProfileInternalMarks({ record: [80], viva: [18] }, profile, p).totalIA, 42)
    const practical = deriveOfficialGrade(
      { code: 'LAB', semester: 1, internalComponents: { record: [80], viva: [18] } },
      p,
      context,
    )
    assert.equal(practical.internal, 42)
  })
  it('rejects missing, excessive, negative or non-finite component inputs', () => {
    const p = academicFixture()
    const { profile } = resolveSchemeCourse(p, 'LAB', context)
    for (const marks of [
      { record: [NaN], viva: [10] },
      { record: [101], viva: [10] },
      { record: [80] },
      { record: [-1], viva: [10] },
    ])
      assert.throws(() => calculateProfileInternalMarks(marks, profile, p))
    assert.throws(
      () =>
        calculateSchemeInternalMarks({ testMarks: [50], assignmentMarks: 0, attendancePercentage: 95 }, p),
      /Test marks/,
    )
    assert.equal(
      calculateSchemeInternalMarks({ testMarks: [20], assignmentMarks: 0, attendancePercentage: 95 }, p)
        .testAverage,
      5,
    )
    assert.throws(
      () =>
        deriveOfficialGrade(
          { code: 'LAB', semester: 1, internal: 50, internalComponents: { record: [80], viva: [18] } },
          p,
          context,
        ),
      /do not match/,
    )
  })
  it('forces a failed external component to zero grade points, even when aggregate reaches a passing grade band', () => {
    const p = academicFixture()
    const { course, profile } = resolveSchemeCourse(p, 'CS101', context)
    const result = evaluateCourseResult({ internal: 20, external: 27 }, p, course, profile)
    assert.equal(result.total, 47)
    assert.equal(result.isPass, false)
    assert.equal(result.grade, 'F')
    assert.equal(result.gradePoint, 0)
  })
  it('preserves explicit failure/absence and never auto-passes a withheld record', () => {
    const p = academicFixture()
    const failed = deriveOfficialGrade(
      { code: 'CS101', semester: 1, internal: 20, external: 70, result: 'FAIL' },
      p,
      context,
    )
    assert.equal(failed.gradePoint, 0)
    assert.equal(failed.result, 'F')
    const absent = deriveOfficialGrade({ code: 'CS101', semester: 1, result: 'A' }, p, context)
    assert.equal(absent.result, 'A')
    assert.equal(absent.grade, 'AB')
    assert.equal(absent.gradePoint, 0)
    assert.throws(
      () =>
        deriveOfficialGrade(
          { code: 'CS101', semester: 1, internal: 20, external: 70, result: 'W' },
          p,
          context,
        ),
      /Withheld/,
    )
  })
  it('does not round a just-below grade band up into a higher official grade', () => {
    const result = deriveOfficialGrade(
      { code: 'CS101', semester: 1, internal: 19.999, external: 60 },
      academicFixture(),
      context,
    )
    assert.equal(result.gradePoint, 8)
  })
  it('rejects client credit/grade tampering, over-max marks and stale draft policy identity', () => {
    const p = academicFixture()
    const input = { code: 'CS101', semester: 1, internal: 20, external: 70 }
    assert.throws(() => deriveOfficialGrade({ ...input, credits: 5 }, p, context), /Credits must match/)
    assert.throws(() => deriveOfficialGrade({ ...input, gradePoint: 3 }, p, context), /grade point/)
    assert.throws(() => deriveOfficialGrade({ ...input, grade: 'F' }, p, context), /does not match/)
    assert.throws(() => deriveOfficialGrade({ ...input, external: 81 }, p, context), /External marks/)
    assert.throws(() => deriveOfficialGrade({ ...input, total: 100 }, p, context), /Total must equal/)
    const draft = deriveOfficialGrade(input, p, context)
    assert.doesNotThrow(() => assertDraftPolicyCurrent(draft, p))
    assert.throws(() => assertDraftPolicyCurrent(draft, { ...p, revision: 2 }), /Re-save/)
  })
})

describe('credit accounting', () => {
  it('includes failed course credits in GPA but not earned credits (4.8, not 8.0)', () => {
    assert.deepEqual(summarizeCredits(rows), {
      gpa: 4.8,
      attemptedCredits: 10,
      gpaCredits: 10,
      earnedCredits: 6,
      creditPoints: 48,
      pendingRows: 0,
      invalidRows: 0,
      courseCount: 3,
    })
    assert.equal(calculateSchemeSGPA(rows), 4.8)
  })
  it('distinguishes all-failed (0) from unpublished/no GPA credits (null)', () => {
    assert.equal(summarizeCredits([{ credits: 4, gradePoint: 0 }]).gpa, 0)
    assert.equal(summarizeCredits([]).gpa, null)
    assert.equal(summarizeCredits([{ credits: 0, gradePoint: 8 }]).gpa, null)
  })
  it('can pass a non-GPA activity with zero points without confusing it with a failed GPA course', () => {
    const p = academicFixture()
    p.assessmentProfiles!.push({
      ...p.assessmentProfiles![1],
      id: 'PASS_FAIL',
      name: 'Non-GPA pass/fail',
      gradeTable: [
        { grade: 'P', gradePoint: 0, minPercentage: 40, description: 'Completed' },
        { grade: 'F', gradePoint: 0, minPercentage: 0, description: 'Not completed' },
      ],
    })
    const course = p.courses!.find((c) => c.code === 'ZERO')!
    course.assessmentProfileId = 'PASS_FAIL'
    const passed = deriveOfficialGrade(
      { code: 'ZERO', semester: 1, external: 40 },
      normalizeSchemePack(p),
      context,
    )
    assert.equal(passed.isPass, true)
    assert.equal(passed.gradePoint, 0)
    assert.equal(passed.result, 'P')
    const summary = summarizeCredits([...rows, passed])
    assert.equal(summary.gpa, 4.8)
    assert.equal(summary.earnedCredits, 6)
    assert.equal(auditProgrammeCredits([...rows, passed], p, context).creditRequirementsMet, true)
    const nonGpaCredits = summarizeCredits([
      { credits: 2, includeInGpa: false, result: 'P', grade: 'P', gradePoint: 0 },
    ])
    assert.equal(nonGpaCredits.earnedCredits, 2)
    assert.equal(nonGpaCredits.gpaCredits, 0)
  })
  it('excludes non-GPA credits without losing legitimately earned course credits', () => {
    const s = summarizeCredits([
      ...rows,
      { credits: 2, gradePoint: 9, includeInGpa: false },
      { credits: 0, gradePoint: 8 },
    ])
    assert.equal(s.gpa, 4.8)
    assert.equal(s.attemptedCredits, 12)
    assert.equal(s.earnedCredits, 8)
    assert.equal(s.gpaCredits, 10)
  })
  it('does not inflate GPA when legacy positive points contradict failure status', () => {
    const s = summarizeCredits([
      { credits: 4, gradePoint: 9, result: 'F' },
      { credits: 2, gradePoint: 6, isPass: true },
    ])
    assert.equal(s.gpa, 2)
    assert.equal(s.earnedCredits, 2)
    assert.equal(summarizeCredits([{ credits: 4, gradePoint: 0, result: 'P' }]).earnedCredits, 0)
  })
  it('reports incomplete grades/credits and withheld rows instead of guessing numeric values', () => {
    for (const r of [
      { credits: 4 },
      { credits: 4, gradePoint: 8, result: 'W' },
      { gradePoint: 8 },
      { credits: -1, gradePoint: 8 },
      { credits: 4, gradePoint: NaN },
    ])
      assert.equal(summarizeCredits([r]).gpa, null)
    assert.throws(() => calculateSchemeSGPA([{ credits: -1, gradePoint: 8 }]), /Credits/)
  })
  it('counts a course/semester once and uses a later correction, not an invented best-attempt rule', () => {
    const s = summarizeCredits([
      { ...rows[0], updatedAt: '2026-01-01' },
      { ...rows[0], gradePoint: 6, updatedAt: '2026-02-01' },
    ])
    assert.equal(s.gpa, 6)
    assert.equal(s.earnedCredits, 4)
    assert.equal(s.courseCount, 1)
  })
  it('audits explicit total/category/mandatory zero-credit requirements, never assumes a degree total', () => {
    const p = academicFixture()
    const incomplete = auditProgrammeCredits(rows, p, context)
    assert.equal(incomplete.configured, true)
    if (!incomplete.configured) throw new Error('Expected configured fixture')
    assert.deepEqual(incomplete.missingCourses, ['ZERO'])
    assert.equal(incomplete.creditRequirementsMet, false)
    const complete = auditProgrammeCredits(
      [...rows, { code: 'ZERO', semester: 1, credits: 0, gradePoint: 8, result: 'P' }],
      p,
      context,
    )
    assert.equal(complete.creditRequirementsMet, true)
    assert.equal(auditProgrammeCredits(rows, p, { programme: 'MCA' }).configured, false)
  })
})

describe('explicit programme-specific course grade point methods', () => {
  it('preserves fractional point ladders and nearest-integer GP lookup without changing old revisions', () => {
    const old = academicFixture()
    const p = academicFixture()
    p.gradeTable = [[98, 10], [93, 9.5], [88, 9], [83, 8.5], [78, 8], [73, 7.5], [68, 7], [63, 6.5], [58, 6], [53, 5.5], [48, 5], [43, 4.5], [40, 4], [0, 0]].map(([minPercentage, gradePoint]) => ({ minPercentage, gradePoint, grade: gradePoint ? `G${gradePoint * 10}` : 'F', description: 'Synthetic fractional-ladder test' }))
    p.gradePointPolicy = { method: 'bands', percentageRounding: 'nearest-integer' }
    const valid = normalizeSchemePack(p)
    assert.equal(deriveOfficialGrade({ code: 'CS101', semester: 1, internal: 20, external: 77.5 }, valid, context).gradePoint, 10)
    assert.equal(deriveOfficialGrade({ code: 'CS101', semester: 1, internal: 20, external: 77.49 }, valid, context).gradePoint, 9.5)
    assert.equal(deriveOfficialGrade({ code: 'CS101', semester: 1, internal: 20, external: 32 }, valid, context).gradePoint, 5)
    assert.equal(normalizeSchemePack(old).gradePointPolicy, undefined)
    assert.equal(deriveOfficialGrade({ code: 'CS101', semester: 1, internal: 20, external: 65 }, old, context).gradePoint, 9)
  })
  it('does not round a failing total or component up to pass just because the GP table rounds', () => {
    const p = academicFixture()
    p.gradePointPolicy = { method: 'bands', percentageRounding: 'nearest-integer' }
    const belowTotal = deriveOfficialGrade({ code: 'CS101', semester: 1, internal: 7.6, external: 32 }, p, context)
    assert.equal(belowTotal.percentage, 39.6)
    assert.equal(belowTotal.gradePoint, 0)
    assert.equal(belowTotal.isPass, false)
    assert.equal(deriveOfficialGrade({ code: 'CS101', semester: 1, internal: 20, external: 27.9 }, p, context).gradePoint, 0)
  })
  it('supports actual percentage/10 points with explicit per-profile overrides and historical provenance', () => {
    const p = academicFixture()
    p.gradePointPolicy = { method: 'percentage-divided-by-ten', percentageRounding: 'none' }
    p.assessmentProfiles!.find(profile => profile.id === 'PG')!.gradePointPolicy = { method: 'bands', percentageRounding: 'none' }
    const valid = normalizeSchemePack(p)
    const result = deriveOfficialGrade({ code: 'CS101', semester: 1, internal: 20, external: 57 }, valid, context)
    assert.equal(result.gradePoint, 7.7)
    assert.deepEqual(result.schemePolicySnapshot.gradePointPolicy, p.gradePointPolicy)
    assert.equal(deriveOfficialGrade({ code: 'PG101', semester: 1, internal: 20, external: 40 }, valid, { programme: 'MCA', semester: 1 }).gradePoint, 6)
    assert.equal(deriveOfficialGrade({ code: 'CS101', semester: 1, internal: 20, external: 57, result: 'F' }, valid, context).gradePoint, 0)
    assert.throws(() => deriveOfficialGrade({ code: 'CS101', semester: 1, internal: 20, external: 57, gradePoint: 8 }, valid, context), /does not match/)
  })
  it('rejects unknown GP formulas or rounding modes instead of silently using generic integer bands', () => {
    for (const gradePointPolicy of [{ method: 'auto', percentageRounding: 'none' }, { method: 'bands', percentageRounding: 'ceil' }, { method: ['bands'], percentageRounding: 'none' }, { method: 'bands', percentageRounding: ['none'] }, null]) {
      assert.throws(() => normalizeSchemePack({ ...academicFixture(), gradePointPolicy }), /gradePointPolicy/)
    }
  })
})
