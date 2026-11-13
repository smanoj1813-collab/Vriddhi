import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { activeRiskAlerts, riskCheckedLabel, riskErrorMessage, riskInboxPath, safeRiskActionPath } from './riskAlertPresentation';
import { canAccessAdminPath } from '../../modules/auth/permissions';
import { STUDENT_NAV_ITEMS, moreSheetItems } from '../../modules/student/studentNav';
import type { AcademicRiskAlert } from '../services/riskAlertsApi';

const alert = (extra: Partial<AcademicRiskAlert> = {}): AcademicRiskAlert => ({ id: 'a', key: 'assignment:a', category: 'assignment', severity: 'warning', title: 'Assignment due', message: 'Fixture', path: '/student/assignments', subjectUid: 'student-1', subjectName: 'Learner', state: 'active', stale: false, read: false, checkedAt: 1, createdAt: 1, updatedAt: 1, ...extra });
describe('risk alert presentation and navigation boundaries', () => {
  it('maps student, faculty/mentor and supervisors to their own inboxes', () => {
    assert.equal(riskInboxPath('student'), '/student/risk-alerts');
    assert.equal(riskInboxPath('faculty'), '/faculty/risk-alerts');
    assert.equal(riskInboxPath('mentor'), '/faculty/risk-alerts');
    assert.equal(riskInboxPath('hod'), '/admin/risk-alerts');
  });
  for (const path of ['https://evil.example/', '//evil.example/', 'javascript:alert(1)', '/admin/payroll', '/faculty/assignments', '/student/../admin/attendance', '/student/assignments?next=evil']) {
    it(`refuses a student alert action outside the exact safe destinations: ${path}`, () => assert.equal(safeRiskActionPath(path, 'student'), '/student/risk-alerts'));
  }
  it('preserves actionable routes for each authorized surface', () => {
    assert.equal(safeRiskActionPath('/student/attendance', 'student'), '/student/attendance');
    assert.equal(safeRiskActionPath('/faculty/my-attendance', 'faculty'), '/faculty/my-attendance');
    assert.equal(safeRiskActionPath('/admin/faculty-attendance', 'hod'), '/admin/faculty-attendance');
  });
  it('separates coverage/history from active and unverified risks', () => {
    const sorted = activeRiskAlerts([alert({ id: 'coverage', category: 'coverage' }), alert({ id: 'resolved', state: 'resolved' }), alert({ id: 'archived', state: 'archived' }), alert({ id: 'warning', state: 'unverified', stale: true, updatedAt: 3 }), alert({ id: 'critical', severity: 'critical', updatedAt: 2 })]);
    assert.deepEqual(sorted.map(a => a.id), ['critical', 'warning']);
  });
  it('does not invent a check timestamp or an all-clear from a backend error', () => {
    assert.equal(riskCheckedLabel(null), 'Not checked yet');
    assert.match(riskCheckedLabel(Date.parse('2026-11-13T20:00:00Z')), /14 Nov.*IST/);
    assert.match(riskErrorMessage({ code: 'functions/unavailable' }), /no “all clear”/);
    assert.match(riskErrorMessage({ code: 'functions/permission-denied' }), /verified academic account/);
  });
  it('grants the supervisor admin route only to academic supervisors, not office/employee accounts', () => {
    for (const role of ['hod', 'admin', 'principal'] as const) assert.ok(canAccessAdminPath(role, '/admin/risk-alerts'));
    for (const role of ['accounts', 'operations', 'employee', 'student', 'parent'] as const) assert.ok(!canAccessAdminPath(role, '/admin/risk-alerts'));
  });
  it('student Risk Alerts is reachable in Account and the phone More sheet without moving thumb tabs', () => {
    assert.equal(STUDENT_NAV_ITEMS.find(i => i.id === 'risk-alerts')?.group, 'account');
    assert.ok(moreSheetItems().some(i => i.path === '/student/risk-alerts'));
  });
});
