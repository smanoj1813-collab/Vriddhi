// functions/test/schemePacks.test.ts
// Validate G1 pack authoring — the single write door into the multi-university
// compliance engine: a malformed pack would silently corrupt result imports,
// hall-ticket blocking and every compliance number.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateSchemePackDoc, PRESET_SCHEME_CODES } from '../src/schemePacks'

function validPack(): Record<string, unknown> {
  return {
    code: 'MYSU_NEP_2023',
    name: 'University of Mysore — NEP 2023',
    universityName: 'University of Mysore',
    schemeName: 'NEP 2023',
    applicableProgrammes: ['BA', 'B.Com'],
    attendance: {
      minimumPercentage: 75,
      marksSlabs: [
        { min: 76, max: 85, marks: 2, label: 'Minimum eligible' },
        { min: 86, max: 100, marks: 3, label: 'Good' },
      ],
      blocksExamEligibility: true,
    },
    internalAssessment: {
      totalMarks: 40,
      test: { count: 3, maxMarksEach: 40, bestOf: 2, weightInTotal: 20 },
      attendanceMaxMarks: 5,
      assignmentMaxMarks: 15,
    },
    semesterEndExam: { defaultMaxMarks: 60, durationMinutes: 180, passPercentage: 35 },
    passCriteria: {
      aggregatePassPercentage: 40,
      minimumInternalPercentage: 0,
      requireSemesterEndPass: true,
    },
    gradeTable: [
      { grade: 'O', gradePoint: 10, minPercentage: 90, description: 'Outstanding' },
      { grade: 'A', gradePoint: 8, minPercentage: 70, description: 'Very Good' },
      { grade: 'P', gradePoint: 4, minPercentage: 35, description: 'Pass' },
      { grade: 'F', gradePoint: 0, minPercentage: 0, description: 'Fail' },
    ],
    mediums: ['English', 'Kannada'],
    status: 'active',
  }
}

describe('validateSchemePackDoc', () => {
  it('accepts a well-formed pack and normalises it', () => {
    const pack = validateSchemePackDoc(validPack())
    assert.equal(pack.code, 'MYSU_NEP_2023')
    assert.equal(pack.internalAssessment.totalMarks, 40)
    // grades come back sorted for the engine's descending probe
    assert.deepEqual(
      pack.gradeTable.map((g) => g.minPercentage),
      [90, 70, 35, 0],
    )
  })

  it('rejects an inverted attendance slab', () => {
    const raw = validPack()
    ;(raw.attendance as Record<string, unknown>).marksSlabs = [{ min: 90, max: 80, marks: 2, label: 'x' }]
    assert.throws(() => validateSchemePackDoc(raw), /min must be/)
  })

  it('rejects slabs floating far above the eligibility floor', () => {
    const raw = validPack()
    ;(raw.attendance as Record<string, unknown>).marksSlabs = [{ min: 95, max: 100, marks: 2, label: 'x' }]
    assert.throws(() => validateSchemePackDoc(raw), /minimumPercentage/)
  })

  it('rejects IA components that do not add up to totalMarks', () => {
    const raw = validPack()
    const ia = raw.internalAssessment as Record<string, unknown>
    ia.assignmentMaxMarks = 10 // 20 + 5 + 10 = 35 ≠ 40
    assert.throws(() => validateSchemePackDoc(raw), /add up to totalMarks/)
  })

  it('rejects bestOf exceeding the number of tests', () => {
    const raw = validPack()
    const ia = raw.internalAssessment as Record<string, unknown>
    ia.test = { count: 2, maxMarksEach: 40, bestOf: 3, weightInTotal: 20 }
    assert.throws(() => validateSchemePackDoc(raw), /bestOf/)
  })

  it('rejects malformed codes and over-long grade tables', () => {
    const raw = validPack()
    raw.code = 'bad code!'
    assert.throws(() => validateSchemePackDoc(raw), /code/)
    const raw2 = validPack()
    raw2.gradeTable = [{ grade: 'O', gradePoint: 10, minPercentage: 90, description: '' }]
    assert.throws(() => validateSchemePackDoc(raw2), /gradeTable/)
  })

  it('keeps the preset codes reserved (sync-check with client presets)', () => {
    assert.deepEqual(PRESET_SCHEME_CODES, ['BCU_SEP_2024', 'KUD_NEP_CBAE', 'GENERIC_NEP_2020'])
  })

  it('defaults status to active and trims notes', () => {
    const raw = validPack()
    raw.status = 'nonsense'
    raw.sourceNote = '  verified 2026  '
    const pack = validateSchemePackDoc(raw)
    assert.equal(pack.status, 'active')
    assert.equal(pack.sourceNote, 'verified 2026')
  })
})
