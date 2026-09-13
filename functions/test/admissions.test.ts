import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_MERIT_WEIGHTS,
  STUDENT_CSV_COLUMNS,
  allowedTransitions,
  canTransition,
  computeMeritScore,
  toCsv,
  toStudentCsvRow,
} from '../src/admissions'

// The Admission Center decides who gets an offer and what lands in the student
// CSV, so both the stage machine and the merit maths are pinned here.

describe('admission stage machine', () => {
  it('walks the pipeline one stage at a time', () => {
    assert.equal(canTransition('enquiry', 'application'), true)
    assert.equal(canTransition('application', 'screening'), true)
    assert.equal(canTransition('screening', 'offer'), true)
    assert.equal(canTransition('offer', 'fee'), true)
    assert.equal(canTransition('fee', 'enrolled'), true)
  })

  it('refuses to skip the funnel', () => {
    // An applicant must not reach enrolled without an offer and a fee — that is
    // exactly what the CSV export trusts.
    assert.equal(canTransition('enquiry', 'enrolled'), false)
    assert.equal(canTransition('enquiry', 'offer'), false)
    assert.equal(canTransition('application', 'enrolled'), false)
    assert.equal(canTransition('application', 'fee'), false)
    assert.equal(canTransition('screening', 'enrolled'), false)
  })

  it('never moves backwards through the pipeline', () => {
    assert.equal(canTransition('enrolled', 'fee'), false)
    assert.equal(canTransition('offer', 'screening'), false)
    assert.equal(canTransition('fee', 'offer'), false)
  })

  it('lets any pre-enrolment stage be rejected or withdrawn', () => {
    for (const from of ['enquiry', 'application', 'screening', 'offer'] as const) {
      assert.equal(canTransition(from, 'rejected'), true, `${from} -> rejected`)
      assert.equal(canTransition(from, 'withdrawn'), true, `${from} -> withdrawn`)
    }
    assert.equal(canTransition('fee', 'rejected'), false, 'fee is past the decision point')
    assert.equal(canTransition('fee', 'withdrawn'), true)
  })

  it('treats enrolled as terminal', () => {
    assert.deepEqual(allowedTransitions('enrolled'), [])
  })

  it('allows a rejected applicant to reapply, keeping the audit trail', () => {
    assert.equal(canTransition('rejected', 'application'), true)
    assert.equal(canTransition('withdrawn', 'enquiry'), true)
    // But not straight back into the funnel past application.
    assert.equal(canTransition('rejected', 'offer'), false)
  })
})

describe('merit score', () => {
  it('weights the components by the configured policy', () => {
    // qualifying 80 × 50%, entrance (120/200 = 60) × 40%, interview (8 → 80) × 10%
    // = (80×50 + 60×40 + 80×10) / 100 = (4000 + 2400 + 800) / 100 = 72
    const result = computeMeritScore(
      { qualifyingPercentage: 80, entranceScore: 120, entranceMaxScore: 200, interviewRating: 8 },
      DEFAULT_MERIT_WEIGHTS
    )
    assert.equal(result.score, 72)
    assert.deepEqual(result.missing, [])
  })

  it('normalises entrance scores so different exams stay comparable', () => {
    const result = computeMeritScore(
      { qualifyingPercentage: null, entranceScore: 450, entranceMaxScore: 600, interviewRating: null },
      DEFAULT_MERIT_WEIGHTS
    )
    // 450/600 = 75, and it is the only component so it carries the whole score.
    assert.equal(result.score, 75)
  })

  it('excludes a missing component and re-normalises instead of scoring it zero', () => {
    // With no entrance exam recorded, qualifying (50) and interview (10) carry
    // the weight: (80×50 + 80×10) / 60 = 80. Treating the exam as zero would
    // have produced 56 and ranked the applicant last for unfiled paperwork.
    const result = computeMeritScore(
      { qualifyingPercentage: 80, entranceScore: null, entranceMaxScore: null, interviewRating: 8 },
      DEFAULT_MERIT_WEIGHTS
    )
    assert.equal(result.score, 80)
    assert.deepEqual(result.missing, ['Entrance exam'])
    assert.equal(result.components.length, 2)
    // Re-normalised shares must still total 100%.
    assert.equal(
      Math.round(result.components.reduce((sum, c) => sum + c.weight, 0)),
      100
    )
  })

  it('returns null rather than 0 when nothing has been recorded', () => {
    const result = computeMeritScore(
      { qualifyingPercentage: null, entranceScore: null, entranceMaxScore: null, interviewRating: null },
      DEFAULT_MERIT_WEIGHTS
    )
    assert.equal(result.score, null)
    assert.deepEqual(result.components, [])
    assert.equal(result.missing.length, 3)
  })

  it('ignores an entrance score with no maximum, since it cannot be normalised', () => {
    const result = computeMeritScore(
      { qualifyingPercentage: 90, entranceScore: 150, entranceMaxScore: null, interviewRating: null },
      DEFAULT_MERIT_WEIGHTS
    )
    // Only qualifying was recorded, so it carries the whole score on its own.
    assert.equal(result.score, 90)
    // Both the entrance exam and the interview are absent here, so both are
    // reported as unscored rather than silently folded in as zero.
    assert.deepEqual(result.missing, ['Entrance exam', 'Interview'])
  })

  it('rejects a zero or negative maximum score', () => {
    const result = computeMeritScore(
      { qualifyingPercentage: null, entranceScore: 100, entranceMaxScore: 0, interviewRating: null },
      DEFAULT_MERIT_WEIGHTS
    )
    assert.equal(result.score, null)
  })

  it('clamps out-of-range inputs instead of producing a score above 100', () => {
    const result = computeMeritScore(
      { qualifyingPercentage: 140, entranceScore: null, entranceMaxScore: null, interviewRating: 25 },
      DEFAULT_MERIT_WEIGHTS
    )
    assert.ok((result.score as number) <= 100, `expected <= 100, got ${result.score}`)
  })

  it('reports the weight a college actually configured', () => {
    const result = computeMeritScore(
      { qualifyingPercentage: 70, entranceScore: null, entranceMaxScore: null, interviewRating: null },
      { qualifying: 100, entrance: 0, interview: 0 }
    )
    assert.equal(result.score, 70)
    // Zero-weight components are not "missing" — the college chose not to use them.
    assert.deepEqual(result.missing, [])
  })
})

describe('student CSV hand-off', () => {
  const complete = {
    applicationNo: 'ADM-2026-0001',
    applicantName: 'Asha Verma',
    email: 'asha@example.com',
    phone: '+919876543210',
    dateOfBirth: '2007-03-15',
    gender: 'Female',
    bloodGroup: 'B+',
    program: 'B.Com',
    department: 'Commerce',
    batch: '2026',
    division: 'A',
    regNo: 'R2026001',
    mentorId: 'FAC001',
  }

  it('maps a complete applicant onto the student template columns', () => {
    const { row, blocked } = toStudentCsvRow(complete)
    assert.deepEqual(blocked, [])
    assert.ok(row)
    assert.equal(row!.regNo, 'R2026001')
    assert.equal(row!.course, 'B.Com')
    assert.equal(row!.department, 'Commerce')
    assert.equal(row!.division, 'A')
    // A fresh admission always starts in semester 1.
    assert.equal(row!.semester, '1')
    // The bulk-upload template validates gender as a lowercase select.
    assert.equal(row!.gender, 'female')
  })

  it('blocks an applicant with no registration number rather than inventing one', () => {
    const { row, blocked } = toStudentCsvRow({ ...complete, regNo: '' })
    assert.equal(row, null)
    assert.equal(blocked.length, 1)
    assert.match(blocked[0], /no registration number/)
  })

  it('blocks an applicant with no division assigned', () => {
    const { row, blocked } = toStudentCsvRow({ ...complete, division: '' })
    assert.equal(row, null)
    assert.match(blocked[0], /no division/)
  })

  it('reports every missing field at once, not one per round trip', () => {
    const { row, blocked } = toStudentCsvRow({ applicationNo: 'ADM-2026-0002' })
    assert.equal(row, null)
    assert.equal(blocked.length, 7)
    assert.ok(blocked.every((reason) => reason.startsWith('ADM-2026-0002')))
  })

  it('emits exactly the columns the bulk-upload template expects, in order', () => {
    const { row } = toStudentCsvRow(complete)
    const csv = toCsv([row!])
    const header = csv.split('\n')[0].split(',')
    assert.deepEqual(header, [...STUDENT_CSV_COLUMNS])
    assert.deepEqual(header, [
      'regNo', 'name', 'email', 'phone', 'dateOfBirth', 'gender', 'bloodGroup',
      'course', 'department', 'batch', 'semester', 'division', 'mentorId',
    ])
  })
})

describe('CSV escaping', () => {
  it('quotes values containing commas, quotes and newlines (RFC 4180)', () => {
    const csv = toCsv([
      {
        regNo: 'R1',
        name: 'Verma, Asha "Ash"',
        email: 'a@b.com',
        phone: '1',
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        course: 'B.Com',
        department: 'Line1\nLine2',
        batch: '2026',
        semester: '1',
        division: 'A',
        mentorId: '',
      },
    ])
    const body = csv.split('\n').slice(1).join('\n')
    assert.ok(body.includes('"Verma, Asha ""Ash"""'), body)
    assert.ok(body.includes('"Line1\nLine2"'), body)
  })

  it('produces a header-only file when there are no rows', () => {
    const csv = toCsv([])
    assert.equal(csv.split('\n').length, 1)
  })
})
