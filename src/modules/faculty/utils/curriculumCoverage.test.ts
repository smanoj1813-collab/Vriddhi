// src/modules/faculty/utils/curriculumCoverage.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTopicKey,
  indexLedger,
  classifyModule,
  isCoveredStatus,
  localToday,
} from './curriculumCoverage.ts';

const TODAY = '2026-09-28';

test('the topic key ignores punctuation and case, so a covered topic still matches', () => {
  assert.equal(normalizeTopicKey('Working Capital — Types!'), 'working capital types');
  assert.equal(normalizeTopicKey('  Working/Capital  '), 'working capital');
  // The whole feature rests on this: the ledger row and the curriculum module
  // are typed by different people and rarely match character for character.
  assert.equal(normalizeTopicKey('Introduction & Scope'), 'introduction scope');
  assert.equal(normalizeTopicKey(''), '');
  assert.equal(normalizeTopicKey(null), '');
});

test('covered is a status set, not a single magic word', () => {
  for (const s of ['completed', 'Completed', 'covered', 'DONE', ' taught ']) {
    assert.equal(isCoveredStatus(s), true, s);
  }
  for (const s of ['planned', 'in-progress', 'pending', 'delayed', 'cancelled', '', null]) {
    assert.equal(isCoveredStatus(s), false, String(s));
  }
});

test('a topic the teacher marked covered is reported covered, with the date', () => {
  const ledger = indexLedger([
    { id: 'r1', title: 'Introduction & Scope', status: 'completed', dateCovered: '2026-09-20' },
  ]);
  const { coverage } = classifyModule(['Introduction & Scope', 'Nature of Working Capital'], ledger, {
    today: TODAY,
  });
  assert.equal(coverage.topics, 2);
  assert.equal(coverage.covered, 1);
  assert.equal(coverage.pct, 50);
  assert.equal(coverage.state, 'planned');
});

test('a planned-but-untouched topic is planned, never covered', () => {
  const ledger = indexLedger([{ id: 'r1', title: 'Nature of Working Capital', status: 'planned', plannedDate: '2026-10-01' }]);
  const { topics, coverage } = classifyModule(['Nature of Working Capital'], ledger, { today: TODAY });
  assert.equal(topics[0].state, 'planned');
  assert.equal(topics[0].plannedOn, '2026-10-01');
  assert.equal(coverage.covered, 0);
  assert.equal(coverage.planned, 1);
  assert.equal(coverage.pct, 0);
});

test('a fully covered module is 100% and reads as done', () => {
  const ledger = indexLedger([
    { id: 'a', title: 'One', status: 'completed' },
    { id: 'b', title: 'Two', status: 'completed' },
  ]);
  const { coverage } = classifyModule(['One', 'Two'], ledger, { today: TODAY });
  assert.equal(coverage.pct, 100);
  assert.equal(coverage.state, 'covered');
});

test('an untouched module is 0%, never "unknown"', () => {
  const { coverage } = classifyModule(['A', 'B'], new Map(), { today: TODAY });
  assert.equal(coverage.covered, 0);
  assert.equal(coverage.pct, 0);
  assert.equal(coverage.state, 'not-planned');
});

test('a row is scoped to its subject, so the same title in two subjects stays separate', () => {
  const ledger = indexLedger([
    { id: 'r1', title: 'Introduction', status: 'completed', subject: 'Cost Accounting' },
  ]);
  const cost = classifyModule(['Introduction'], ledger, { subject: 'Cost Accounting', today: TODAY });
  const business = classifyModule(['Introduction'], ledger, { subject: 'Business Environment', today: TODAY });
  assert.equal(cost.coverage.covered, 1, 'covered in its own subject');
  assert.equal(business.coverage.covered, 0, 'must not inherit another subject’s coverage');
});

test('a subject-less planner row still counts towards the module that contains it', () => {
  // Rows written from the faculty Topics page carry no subject at all.
  const ledger = indexLedger([{ id: 'r1', title: 'Introduction', status: 'completed' }]);
  const { coverage } = classifyModule(['Introduction'], ledger, { subject: 'Cost Accounting', today: TODAY });
  assert.equal(coverage.covered, 1);
});

test('a duplicated topic in the same module is counted once', () => {
  const ledger = indexLedger([{ id: 'r1', title: 'Introduction', status: 'completed' }]);
  const { coverage } = classifyModule(['Introduction', 'introduction', ' INTRODUCTION '], ledger, {
    today: TODAY,
  });
  assert.equal(coverage.topics, 1);
  assert.equal(coverage.covered, 1);
  assert.equal(coverage.pct, 100);
});

test('the earliest cover date wins, because the ledger only ever accumulates', () => {
  const ledger = indexLedger([
    { id: 'later', title: 'Introduction', status: 'completed', dateCovered: '2026-09-20' },
    { id: 'earlier', title: 'Introduction', status: 'completed', dateCovered: '2026-09-05' },
  ]);
  const { topics } = classifyModule(['Introduction'], ledger, { today: TODAY });
  assert.equal(topics[0].coveredOn, '2026-09-05');
});

test('an uncovered row never displaces a covered one, whatever the date', () => {
  const ledger = indexLedger([
    { id: 'done', title: 'Introduction', status: 'completed', dateCovered: '2026-09-20' },
    { id: 'planned', title: 'Introduction', status: 'planned', plannedDate: '2026-01-01' },
  ]);
  const { topics } = classifyModule(['Introduction'], ledger, { today: TODAY });
  assert.equal(topics[0].state, 'covered');
});

test('a blank or non-string title is skipped rather than counted as a topic', () => {
  const { topics, coverage } = classifyModule(['Real topic', '', '   ', null as unknown as string], new Map(), {
    today: TODAY,
  });
  assert.equal(topics.length, 1);
  assert.equal(coverage.topics, 1);
});

test('today is rendered in local time, not UTC', () => {
  // 23:30 local on the 28th is already the 29th in UTC; a UTC-based
  // implementation would silently shift the planned/covered boundary.
  const late = new Date(2026, 8, 28, 23, 30);
  assert.equal(localToday(late), '2026-09-28');
  assert.equal(localToday(new Date(2026, 0, 5, 0, 5)), '2026-01-05');
});
