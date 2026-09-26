// src/modules/admin/utils/platformPyq.test.ts
//
// Pure-helper tests for the platform-PYQ bridge: mapping questionBank_meta
// rows (imported papers / seeded bank) into the college-side Question shape.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isPlatformPyqMeta,
  mapPlatformMetaToQuestion,
  platformPyqExamName,
  platformPyqExamYear,
  type PlatformPyqMeta,
} from './platformPyq';

const baseMeta: PlatformPyqMeta = {
  id: 'q-1',
  status: 'approved',
  subjectId: 'Operating System',
  topicId: 'General',
  difficulty: 'medium',
  questionType: 'mcq',
  marks: 2,
  tags: ['pyq', 'question-paper-import', 'exam-2023', 'exam-month-nov'],
  previewText: 'Short preview…',
  createdBy: { userName: 'System Import', collegeId: null },
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
};

describe('platformPyqExamYear', () => {
  it('prefers the explicit examYear field', () => {
    assert.equal(platformPyqExamYear({ examYear: '2024', tags: ['exam-2023'] }), '2024');
    assert.equal(platformPyqExamYear({ examYear: 2024 }), '2024');
  });

  it('falls back to the exam-YYYY tag', () => {
    assert.equal(platformPyqExamYear({ tags: ['pyq', 'exam-2023'] }), '2023');
  });

  it('returns empty string when nothing matches', () => {
    assert.equal(platformPyqExamYear({ tags: ['pyq'] }), '');
    assert.equal(platformPyqExamYear({}), '');
  });
});

describe('platformPyqExamName', () => {
  it('prefers the explicit examName field', () => {
    assert.equal(platformPyqExamName({ examName: 'Model Exam 2024' }), 'Model Exam 2024');
  });

  it('derives a readable name from the exam-month tag', () => {
    assert.equal(platformPyqExamName({ tags: ['exam-month-nov'] }), 'Nov Examination');
  });

  it('falls back to a stable default', () => {
    assert.equal(platformPyqExamName({ tags: ['pyq'] }), 'Previous Year Examination');
  });
});

describe('isPlatformPyqMeta', () => {
  it('accepts approved rows tagged pyq or flagged isPYQ', () => {
    assert.equal(isPlatformPyqMeta(baseMeta), true);
    assert.equal(isPlatformPyqMeta({ id: 'q', status: 'approved', isPYQ: true }), true);
  });

  it('rejects pending rows and non-PYQ rows', () => {
    assert.equal(isPlatformPyqMeta({ ...baseMeta, status: 'pending' }), false);
    assert.equal(isPlatformPyqMeta({ id: 'q', status: 'approved', tags: ['js'] }), false);
  });
});

describe('mapPlatformMetaToQuestion', () => {
  it('maps a platform meta into the college Question shape with read-only marker', () => {
    const q = mapPlatformMetaToQuestion(baseMeta, 'Full question text?');
    assert.deepEqual(
      {
        id: q.id,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty,
        subject: q.subject,
        marks: q.marks,
        status: q.status,
        isPYQ: q.isPYQ,
        examYear: q.examYear,
        examName: q.examName,
        isPlatform: q.isPlatform,
        createdBy: q.createdBy,
        collegeId: q.collegeId,
      },
      {
        id: 'q-1',
        text: 'Full question text?',
        type: 'mcq',
        difficulty: 'medium',
        subject: 'Operating System',
        marks: 2,
        status: 'active',
        isPYQ: true,
        examYear: '2023',
        examName: 'Nov Examination',
        isPlatform: true,
        createdBy: 'platform',
        collegeId: '',
      }
    );
    assert.equal(q.createdByName, 'System Import');
  });

  it('falls back to previewText when no content text is provided', () => {
    const q = mapPlatformMetaToQuestion(baseMeta);
    assert.equal(q.text, 'Short preview…');
  });

  it('sanitises unknown type/difficulty and missing marks', () => {
    const q = mapPlatformMetaToQuestion({
      id: 'q-2',
      questionType: 'weird',
      difficulty: 'extreme',
      marks: 0,
    });
    assert.equal(q.type, 'mcq');
    assert.equal(q.difficulty, 'medium');
    assert.equal(q.marks, 1);
    assert.equal(q.examName, 'Previous Year Examination');
  });

  it('maps common imported type aliases', () => {
    assert.equal(mapPlatformMetaToQuestion({ id: 'q-3', questionType: 'match' }).type, 'matching');
    assert.equal(mapPlatformMetaToQuestion({ id: 'q-4', questionType: 'fill_blank' }).type, 'fill_in_blank');
    assert.equal(mapPlatformMetaToQuestion({ id: 'q-5', questionType: 'assertion' }).type, 'assertion_reason');
    assert.equal(mapPlatformMetaToQuestion({ id: 'q-6', questionType: 'short' }).type, 'short');
  });
});
