import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  allPyqQuestionKeys,
  applyPyqAssignmentChanges,
  assignedPyqIds,
  filterPyqRows,
  isAssessmentReadyRow,
  normalizePyqAssignments,
  pyqProgramOptions,
  pyqQuestionKey,
  rubricPyqQuestionKeys,
  sortPyqRows,
  summarizePyqSelection,
  type PyqPaperRow,
  type PyqSectionLike,
} from './pyqAssignmentModel';

const ROWS: PyqPaperRow[] = [
  { id: 'b', program: 'bba', programLabel: 'BBA', semester: 3, subjectName: 'Business Law', examLabel: 'March 2024', questionCount: 12, contentType: 'structured' },
  { id: 'a', program: 'bba', programLabel: 'BBA', semester: 1, subjectName: 'AMC-106A OE-221', examLabel: '', questionCount: 0, contentType: 'source_pdf', sourceFile: { fileName: 'AMC-106A OE-221.pdf', url: 'https://drive.google.com/file/d/x/view' } },
  { id: 'c', program: 'bsw', programLabel: 'BSW', semester: 1, subjectName: 'Social Work Basics', questionCount: 0, contentType: 'source_pdf' },
];

const SECTIONS: PyqSectionLike[] = [
  { id: 'A', answerCount: 2, marksEach: 2, questions: [{ text: 'Q1' }, { text: 'Q2' }, { text: '  ' }, { text: 'Q4' }] },
  { id: 'B', answerCount: 0, marksEach: 5, questions: [{ text: 'Q5' }, { text: 'Q6', marks: 8 }] },
];

describe('pyq assignment settings', () => {
  it('normalises and fails closed', () => {
    assert.deepEqual(normalizePyqAssignments(undefined), { assignments: {} });
    const settings = normalizePyqAssignments({ assignments: { a: { enabled: true }, b: { enabled: 1 }, c: null } });
    assert.deepEqual(assignedPyqIds(settings), ['a']);
  });

  it('stamps new assignments, keeps existing stamps, and keeps unassigned rows as disabled', () => {
    const previous = normalizePyqAssignments({
      assignments: {
        keep: { enabled: true, assignedAt: '2026-01-01T00:00:00.000Z', assignedBy: 'old' },
        drop: { enabled: true, assignedAt: '2026-01-01T00:00:00.000Z', assignedBy: 'old' },
      },
    });
    const next = applyPyqAssignmentChanges(previous, ['keep', 'new'], 'sa', '2026-10-02T00:00:00.000Z');
    assert.deepEqual(next.assignments.keep, { enabled: true, assignedAt: '2026-01-01T00:00:00.000Z', assignedBy: 'old', notes: undefined });
    assert.equal(next.assignments.drop.enabled, false);
    assert.equal(next.assignments.drop.assignedBy, 'old', 'audit of the past assignment survives');
    assert.deepEqual(next.assignments.new, { enabled: true, assignedAt: '2026-10-02T00:00:00.000Z', assignedBy: 'sa' });
    assert.equal(next.updatedBy, 'sa');
    assert.deepEqual(assignedPyqIds(next).sort(), ['keep', 'new']);
  });
});

describe('pyq paper rows', () => {
  it('treats PDF-only papers as not assessment-ready', () => {
    assert.equal(isAssessmentReadyRow(ROWS[0]), true);
    assert.equal(isAssessmentReadyRow(ROWS[1]), false);
    assert.equal(isAssessmentReadyRow({ contentType: 'structured', questionCount: 0 }), false);
  });

  it('filters by programme, semester, readiness and search (incl. file name)', () => {
    assert.deepEqual(filterPyqRows(ROWS, { program: 'bba' }).map((r) => r.id), ['b', 'a']);
    assert.deepEqual(filterPyqRows(ROWS, { semester: '1' }).map((r) => r.id), ['a', 'c']);
    assert.deepEqual(filterPyqRows(ROWS, { readiness: 'ready' }).map((r) => r.id), ['b']);
    assert.deepEqual(filterPyqRows(ROWS, { readiness: 'pdf' }).map((r) => r.id), ['a', 'c']);
    assert.deepEqual(filterPyqRows(ROWS, { q: 'oe-221.pdf' }).map((r) => r.id), ['a']);
  });

  it('sorts by programme, semester, subject and builds programme options', () => {
    assert.deepEqual(sortPyqRows(ROWS).map((r) => r.id), ['a', 'b', 'c']);
    assert.deepEqual(pyqProgramOptions(ROWS), [
      { value: 'bba', label: 'BBA', count: 2 },
      { value: 'bsw', label: 'BSW', count: 1 },
    ]);
  });
});

describe('pyq question selection', () => {
  it('skips blank questions in the default selection', () => {
    assert.deepEqual(allPyqQuestionKeys(SECTIONS), ['A#0', 'A#1', 'A#3', 'B#0', 'B#1']);
  });

  it('matches the "answer any N" rubric', () => {
    assert.deepEqual(rubricPyqQuestionKeys(SECTIONS), ['A#0', 'A#1', 'B#0', 'B#1']);
  });

  it('summarises selected questions, marks and per-section rubric counts', () => {
    const summary = summarizePyqSelection(SECTIONS, new Set(allPyqQuestionKeys(SECTIONS)));
    assert.equal(summary.questions, 5);
    assert.equal(summary.marks, 2 + 2 + 2 + 5 + 8);
    assert.deepEqual(summary.sections[0], { id: 'A', selected: 3, answerCount: 2, total: 3 });
    assert.deepEqual(summary.sections[1], { id: 'B', selected: 2, answerCount: 0, total: 2 });
    assert.equal(pyqQuestionKey('A', 3), 'A#3');
  });
});
