import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { academicFixture } from '../../../../functions/test/helpers/academicFixture';
import { evaluateImportRow, groupResultsByStudent } from './resultImportEngine';
import type { ResultImportRow } from '../types/resultImport';
import type { CollegeSchemeConfiguration } from '../../../../functions/src/academic/collegeSchemes';

function row(extra: Partial<ResultImportRow> = {}): ResultImportRow {
  return { rowNumber: 2, regNo: 'A001', name: 'Test student', course: 'BCA', batch: '2026-27', semester: 1, subjectCode: 'CS101', subjectName: 'Untrusted name', internal: 20, external: 65, ...extra };
}
describe('scheme-governed result import preview', () => {
  it('uses approved course credits, not a guessed four-credit default or client subject name', () => {
    const result = evaluateImportRow(row({ subjectCode: 'CS102' }), academicFixture());
    assert.equal(result.credits, 2); assert.equal(result.subject, 'Synthetic CS102');
    assert.throws(() => evaluateImportRow(row({ credits: 3 }), academicFixture()), /Credits must match/);
    assert.throws(() => evaluateImportRow(row({ subjectCode: 'UNKNOWN' }), academicFixture()), /no approved credits/);
  });
  it('preserves zero-credit courses and their award-completion status', () => {
    const result = groupResultsByStudent([row({ subjectCode: 'ZERO', credits: 0 })], academicFixture())[0];
    assert.equal(result.subjects[0].credits, 0); assert.equal(result.subjects[0].includeInGpa, false);
    assert.equal(result.sgpa, null); assert.equal(result.totalCredits, 0); assert.equal(result.result, 'PASS');
  });
  it('keeps failed component outcomes at zero points and includes their GPA credits', () => {
    const result = groupResultsByStudent([row(), row({ rowNumber: 3, subjectCode: 'CS102', internal: 10, external: 45 }), row({ rowNumber: 4, subjectCode: 'CS103', external: 27 })], academicFixture())[0];
    assert.equal(result.subjects[2].gradePoint, 0); assert.equal(result.sgpa, 4.8);
    assert.equal(result.creditsEarned, 6); assert.equal(result.totalCredits, 10); assert.equal(result.result, 'FAIL');
    assert.equal(result.schemePackId, 'college-a__TEST_POLICY'); assert.equal(result.schemePackRevision, 1);
  });
  it('separates semesters for the same registration number rather than blending semester GPAs', () => {
    const pack = academicFixture(); pack.courses!.push({ ...pack.courses![0], semester: 2 });
    const results = groupResultsByStudent([row(), row({ semester: 2, external: 50 })], pack);
    assert.equal(results.length, 2); assert.deepEqual(results.map(r => r.semester), [1, 2]);
  });
  it('rejects duplicate course rows, ambiguous cohort metadata and missing semester', () => {
    assert.throws(() => groupResultsByStudent([row(), row()], academicFixture()), /Duplicate course/);
    assert.throws(() => groupResultsByStudent([row(), row({ subjectCode: 'CS102', batch: '2025-26' })], academicFixture()), /Inconsistent programme/);
    assert.throws(() => evaluateImportRow(row({ semester: NaN }), academicFixture()), /valid semester/);
  });
  it('does not invent profile ratios, pass withheld rows, or accept inconsistent supplied grades', () => {
    assert.throws(() => evaluateImportRow(row({ maxMarks: 50 }), academicFixture()), /not be ratio-scaled/);
    assert.throws(() => evaluateImportRow(row({ result: 'W' }), academicFixture()), /Withheld/);
    assert.throws(() => evaluateImportRow(row({ external: 27, grade: 'B', gradePoint: 6 }), academicFixture()), /does not match/);
    assert.equal(evaluateImportRow(row({ result: 'F' }), academicFixture()).gradePoint, 0);
    assert.equal(evaluateImportRow(row({ result: 'A', internal: undefined, external: undefined }), academicFixture()).result, 'A');
  });
});


describe('multi-pack import routing', () => {
  function policies(): CollegeSchemeConfiguration {
    const first = academicFixture()
    const second = academicFixture()
    second.id = 'college-a__SECOND'; second.code = 'SECOND'; second.revision = 3
    second.courses![0].credits = 5
    second.semesterEndExam.passPercentage = 50
    return { assignments: [first, second].map(snapshot => ({ schemePackId: snapshot.id, revision: snapshot.revision!, snapshot })), primarySchemePackId: first.id, routes: [{ batch: '2024-25', schemePackId: second.id }], revision: 7, needsReconfirmation: false }
  }
  it('uses each group’s assigned pack for credits, pass/GP and provenance in a mixed-cohort file', () => {
    const results = groupResultsByStudent([row({ external: 35 }), row({ regNo: 'B001', batch: '2024-25', external: 35 })], policies())
    assert.equal(results.length, 2)
    assert.equal(results[0].schemePackId, 'college-a__TEST_POLICY')
    assert.equal(results[0].totalCredits, 4)
    assert.equal(results[0].result, 'PASS')
    assert.equal(results[1].schemePackId, 'college-a__SECOND')
    assert.equal(results[1].schemePackRevision, 3)
    assert.equal(results[1].totalCredits, 5)
    assert.equal(results[1].creditsEarned, 0)
    assert.equal(results[1].sgpa, 0)
    assert.equal(results[1].result, 'FAIL')
    assert.ok(results.every(result => result.schemeConfigurationRevision === 7))
  })
  it('refuses missing route context instead of previewing from the primary', () => {
    assert.throws(() => groupResultsByStudent([row({ batch: '' })], policies()), /missing/)
  })
  it('routes the same student’s semesters independently when a scoped semester route applies', () => {
    const configuration = policies()
    for (const a of configuration.assignments) a.snapshot.courses!.push({ ...a.snapshot.courses![0], semester: 2 })
    configuration.routes = [{ programme: 'BCA', semester: 2, schemePackId: configuration.assignments[1].schemePackId }]
    const results = groupResultsByStudent([row(), row({ semester: 2 })], configuration)
    assert.deepEqual(results.map(result => result.totalCredits), [4, 5])
    assert.deepEqual(results.map(result => result.semester), [1, 2])
  })
})
