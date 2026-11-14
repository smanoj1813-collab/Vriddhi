// Runs the shipped frontend APIs/hooks against an atomic Firestore transport
// boundary. Counts committed operations, not just surviving documents.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const server = await createServer({ root, configFile: path.join(root, 'scripts/render-check/vite.config.mts'), server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel: 'error' });
const { saveAttendance } = await server.ssrLoadModule('/src/modules/faculty/api/facultyApi.ts');
const { saveCourseProgress } = await server.ssrLoadModule('/src/shared/courses/courseCloud.ts');
const student = await server.ssrLoadModule('/src/modules/student/hooks/useStudentData.ts');
const health = await server.ssrLoadModule('/src/modules/superadmin/hooks/useSuperAdmin.ts');
const { default: Reports } = await server.ssrLoadModule('/src/modules/faculty/components/AssessmentTestReports.tsx');
// Warm the deliberately lazy provider imports before mounting; no network SDK.
await server.ssrLoadModule('/src/modules/student/api/studentDataApi.ts');
await server.ssrLoadModule('/src/shared/services/codingLabAccessService.ts');
const { calls, queries } = await server.ssrLoadModule('/scripts/render-check/stubs/firestore.ts');
const views = new Set();
const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); }); };
let checks = 0;
const check = (name, fn) => { fn(); console.log(`ok ${++checks} - ${name}`); };
const state = {};
let committed = [];
function reset() {
  for (const key of Object.keys(state)) delete state[key];
  committed = []; calls.length = queries.length = 0;
  globalThis.__RC_WRITES = []; globalThis.__RC_CALLABLE_ERRORS = {}; globalThis.__RC_CALLABLE_PAYLOADS = [];
  globalThis.__RC_FIRESTORE_QUERY_GUARD = undefined;
  globalThis.__RC_FIRESTORE_BY_PATH = state; globalThis.__RC_FIRESTORE_COLLECTIONS = {};
  globalThis.__RC_ROLE = 'faculty'; globalThis.__RC_AUTH_USER = { uid: 'staff', id: 'staff', role: 'faculty', name: 'Faculty', collegeId: 'college-a' };
  globalThis.__RC_CALLABLE_DATA = {};
  globalThis.__RC_TRANSACTION = async fn => {
    const pending = [];
    const result = await fn({
      get: async ref => { assert.equal(pending.length, 0, 'transaction reads precede writes'); return { exists: () => ref.__path in state, data: () => state[ref.__path] }; },
      set: (ref, value, options) => pending.push({ path: ref.__path, value, merge: options?.merge }),
    });
    assert.ok(pending.length <= 500, 'transaction write limit');
    for (const item of pending) state[item.path] = item.merge ? { ...state[item.path], ...item.value } : item.value;
    committed.push(...pending);
    return result;
  };
}
async function mount(Component, wrap = children => children) {
  const host = document.createElement('div'); document.body.appendChild(host);
  const reactRoot = createRoot(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, refetchOnWindowFocus: false } } });
  const render = async () => { await act(async () => reactRoot.render(React.createElement(QueryClientProvider, { client }, wrap(React.createElement(Component))))); await settle(); await settle(); };
  const view = { host, client, render, close: async () => { await act(async () => reactRoot.unmount()); client.clear(); host.remove(); views.delete(view); } };
  views.add(view); await render(); return view;
}
const session = { id: 'session-a', materialised: true, source: 'daily', date: '2026-11-13', subject: 'Math', subjectCode: 'M1', branch: 'Science', batch: '2026', division: 'A', section: 'A', semester: 1, room: '101', timeSlot: '09:00', facultyId: 'staff', facultyName: 'Faculty' };
const rows = count => Array.from({ length: count }, (_, i) => ({ studentId: `s-${i}`, name: `Student ${i}`, usn: `U${i}`, regNo: `R${i}`, status: 'Present', notes: '' }));
const seedBatch = () => { for (const item of globalThis.__RC_WRITES) state[item.path] = item.data; globalThis.__RC_WRITES = []; };

try {
  reset(); const records = rows(50);
  const id = await saveAttendance(session, records, 'staff', 'Faculty', 'college-a');
  check('attendance: first save retains all 50 raw rows and three authoritative documents', () => assert.equal(globalThis.__RC_WRITES.length, 53));
  seedBatch();
  await saveAttendance(session, records, 'staff', 'Faculty', 'college-a', id);
  check('attendance: unchanged re-save commits zero writes', () => assert.equal(committed.length, 0));
  const changed = records.map((row, index) => index === 0 ? { ...row, status: 'Absent', notes: 'Corrected register' } : row);
  await saveAttendance(session, changed, 'staff', 'Faculty', 'college-a', id);
  check('attendance: one correction writes one raw row plus the three authoritative documents', () => assert.equal(committed.length, 4));
  check('attendance: counts, notes and lowercase reporting status remain correct', () => {
    assert.equal(state[`attendance/${id}`].absentCount, 1);
    assert.equal(state[`attendanceSummary/${id}`].absent, 1);
    assert.equal(state[`attendanceRecords/${id}_s-0`].status, 'absent');
    assert.equal(state[`attendanceRecords/${id}_s-0`].notes, 'Corrected register');
  });
  committed = [];
  await saveAttendance(session, changed, 'staff', 'Faculty', 'college-a', id);
  check('attendance: after a successful correction, another identical save is still a no-op', () => assert.equal(committed.length, 0));
  const missing = `attendanceRecords/${id}_s-4`; delete state[missing];
  await saveAttendance(session, changed, 'staff', 'Faculty', 'college-a', id);
  check('attendance: a missing reporting row is repaired even when the parent already matches', () => { assert.ok(state[missing]); assert.ok(committed.some(write => write.path === missing)); });
  committed = [];
  state[`attendanceRecords/${id}_s-5`].status = 'absent';
  await saveAttendance(session, changed, 'staff', 'Faculty', 'college-a', id);
  check('attendance: fresh server rows win over stale page assumptions when calculating the write delta', () => assert.ok(committed.some(write => write.path.endsWith('_s-5'))));
  globalThis.__RC_TRANSACTION = async () => { throw Object.assign(new Error('Missing row not get-readable'), { code: 'permission-denied' }); };
  await saveAttendance(session, changed, 'staff', 'Faculty', 'college-a', id);
  check('attendance: deployed read-rule incompatibility retains the original repair/save path', () => assert.equal(globalThis.__RC_WRITES.length, 53));
  globalThis.__RC_WRITES = [];
  await saveAttendance(session, rows(451), 'staff', 'Faculty', 'college-a', id);
  check('attendance: a class over the atomic limit still saves all records in bounded batches', () => assert.equal(globalThis.__RC_WRITES.length, 454));

  reset(); const progress = { read: {}, completed: {}, quiz: {}, moduleAssessments: {}, lastTopicId: 't-1', startedAt: '2026-11-13T09:00:00Z', updatedAt: '2026-11-13T09:00:00Z' };
  await saveCourseProgress('college-a', 'learner', 'course-a', undefined, progress);
  check('course progress: first real progress still persists', () => assert.equal(committed.length, 1));
  committed = [];
  await saveCourseProgress('college-a', 'learner', 'course-a', undefined, progress);
  check('course progress: loading identical cloud progress does not write it back', () => assert.equal(committed.length, 0));
  await saveCourseProgress('college-a', 'learner', 'course-a', { version: '2', modules: [] }, progress);
  check('course progress: manifest-derived record changes are not suppressed', () => assert.equal(committed.length, 1));
  committed = [];
  const remote = Object.values(state)[0]; remote.completed = { 'other-device-topic': '2026-11-13T10:00:00Z' };
  const merged = await saveCourseProgress('college-a', 'learner', 'course-a', { version: '2', modules: [] }, progress);
  check('course progress: stale-device saves preserve work completed on another device', () => assert.ok(merged.completed['other-device-topic']));

  reset(); globalThis.__RC_ROLE = 'student'; globalThis.__RC_AUTH_USER = { uid: 'learner', id: 'learner', role: 'student', collegeId: 'college-a', name: 'Student' };
  state['students/learner'] = { userId: 'learner', collegeId: 'college-a', name: 'Student', course: 'BSc', branch: 'Science', batch: '2026', semester: 1 };
  const card = { id: 't-1', testId: 't-1', title: 'Test', status: 'upcoming', canStart: false, canResume: false, startDateTime: new Date(Date.now() + 60_000).toISOString(), endDateTime: new Date(Date.now() + 120_000).toISOString() };
  globalThis.__RC_CALLABLE_DATA = { getMyStudentTests: { tests: [card] }, getMyAssignments: { assignments: [] }, getMyNotifications: { notifications: [] }, getMyStudentAcademicContext: { enabled: false } };
  let latest;
  function StudentProbe() { latest = student.useStudentData(); return React.createElement('span', null, latest.profile?.name); }
  const view = await mount(StudentProbe, children => React.createElement(student.StudentDataProvider, null, children));
  for (let i = 0; i < 30 && latest.loading; i++) await settle();
  check('student provider: actual initial profile and tests still load', () => { assert.equal(latest.profile.name, 'Student'); assert.equal(latest.tests.length, 1); });
  const oldAssignments = latest.assignments, oldFees = latest.fees, oldProfile = latest.profile;
  const beforeReads = calls.filter(call => call.startsWith('getDoc:')).length;
  globalThis.__RC_CALLABLE_PAYLOADS = [];
  globalThis.__RC_CALLABLE_DATA.getMyStudentTests = { tests: [{ ...card, status: 'available', canStart: true }] };
  await act(async () => latest.refreshTests());
  check('student provider: timed revalidation calls only the test endpoint', () => assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS.map(call => call.name), ['getMyStudentTests']));
  check('student provider: unrelated data and profile reads are untouched', () => { assert.equal(latest.profile, oldProfile); assert.equal(latest.assignments, oldAssignments); assert.equal(latest.fees, oldFees); assert.equal(calls.filter(call => call.startsWith('getDoc:')).length, beforeReads); });
  check('student provider: actionable test cards and dashboard counts update together', () => { assert.equal(latest.assessments.length, 1); assert.equal(latest.stats.upcomingTests, 1); });
  let release;
  globalThis.__RC_CALLABLE_DATA.getMyStudentTests = new Promise(resolve => { release = resolve; });
  let a, b;
  await act(async () => { a = latest.refreshTests(); b = latest.refreshTests(); });
  check('student provider: overlapping refreshes share one in-flight request', () => assert.equal(a, b));
  await act(async () => { release({ tests: [card] }); await a; });
  globalThis.__RC_CALLABLE_ERRORS.getMyStudentTests = { code: 'unavailable', message: 'Offline fixture' };
  await act(async () => latest.refreshTests());
  check('student provider: a failed refresh retains existing tests and unrelated data with a visible warning', () => { assert.equal(latest.tests.length, 1); assert.equal(latest.profile, oldProfile); assert.ok(latest.warnings.some(warning => warning.includes('Offline fixture'))); });
  delete globalThis.__RC_CALLABLE_ERRORS.getMyStudentTests;
  let releaseOld;
  globalThis.__RC_CALLABLE_DATA.getMyStudentTests = new Promise(resolve => { releaseOld = resolve; });
  let oldRequest;
  await act(async () => { oldRequest = latest.refreshTests(); }); await settle();
  globalThis.__RC_AUTH_USER = { uid: 'other-learner', id: 'other-learner', role: 'student', collegeId: 'college-b' };
  state['students/other-learner'] = { userId: 'other-learner', collegeId: 'college-b', name: 'Other Student', course: 'BSc' };
  globalThis.__RC_CALLABLE_DATA.getMyStudentTests = { tests: [{ ...card, id: 'new-account-test' }] };
  await view.render();
  for (let i = 0; i < 30 && latest.loading; i++) await settle();
  await act(async () => { releaseOld({ tests: [{ ...card, id: 'stale-account-test' }] }); await oldRequest; });
  check('student provider: a delayed response after account/college change cannot replace the new account cards', () => { assert.equal(latest.profile.name, 'Other Student'); assert.equal(latest.tests[0].id, 'new-account-test'); });
  await view.close();

  // Drive the actual report component's clock, visibility and request boundary.
  reset();
  const realInterval = globalThis.setInterval, realClear = globalThis.clearInterval, realNow = Date.now;
  const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
  let hidden = true, reportNow = Date.now(), reportView;
  const intervals = new Map();
  globalThis.setInterval = (callback, delay, ...args) => { const id = {}; intervals.set(id, { delay, callback: () => callback(...args) }); return id; };
  globalThis.clearInterval = id => { if (!intervals.delete(id)) realClear(id); };
  Date.now = () => reportNow;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  const tick = async () => {
    await act(async () => { for (const timer of [...intervals.values()]) if (timer.delay === 30_000) timer.callback(); });
    await settle();
  };
  const visibility = async value => { hidden = value; await act(async () => document.dispatchEvent(new Event('visibilitychange'))); await settle(); };
  const reportCalls = () => globalThis.__RC_CALLABLE_PAYLOADS.filter(call => call.name === 'getAssessmentTestReport');
  const click = async label => {
    const button = [...reportView.host.querySelectorAll('button')].find(element => element.textContent.trim() === label);
    assert.ok(button, `button ${label} exists`);
    await act(async () => button.dispatchEvent(new MouseEvent('click', { bubbles: true }))); await settle();
  };
  try {
    const test = { id: 'live-test', title: 'Live cost report', subject: 'Math', status: 'ongoing', facultyId: 'staff', facultyName: 'Faculty', startDateTime: new Date(reportNow - 60_000).toISOString(), endDateTime: new Date(reportNow + 600_000).toISOString(), totalQuestions: 1, totalMarks: 1, maxTabSwitches: 0, totalStarted: 0 };
    const fullReport = { reportRevision: 'revision-one', test, summary: {}, students: [] };
    globalThis.__RC_CALLABLE_DATA = { listManagedAssessmentTests: { tests: [test] }, getAssessmentTestReport: fullReport, getAssessmentConfig: { performanceCategories: [] } };
    reportView = await mount(Reports);
    await click('Report');
    check('live report: opening retains a full initial load without a cached revision', () => { assert.equal(reportCalls().length, 1); assert.deepEqual(reportCalls()[0].payload, { testId: test.id }); });
    await tick(); await tick();
    check('live report: an initially hidden tab never starts database polling', () => assert.equal(reportCalls().length, 1));
    globalThis.__RC_CALLABLE_DATA.getAssessmentTestReport = { unchanged: true, reportRevision: fullReport.reportRevision };
    await visibility(false);
    check('live report: returning to the tab immediately revalidates with the saved revision', () => { assert.equal(reportCalls().length, 2); assert.equal(reportCalls().at(-1).payload.knownRevision, 'revision-one'); assert.match(reportView.host.textContent, /Live cost report/); });
    let finishReport;
    globalThis.__RC_CALLABLE_DATA.getAssessmentTestReport = new Promise(resolve => { finishReport = resolve; });
    const beforePending = reportCalls().length;
    await tick(); await tick(); await visibility(true); await visibility(false);
    check('live report: slow polls and visibility events do not create overlapping requests', () => assert.equal(reportCalls().length, beforePending + 1));
    await act(async () => finishReport({ unchanged: true, reportRevision: fullReport.reportRevision })); await settle();
    globalThis.__RC_CALLABLE_DATA.getAssessmentTestReport = { ...fullReport, reportRevision: 'revision-two', test: { ...test, title: 'Refreshed cost report' } };
    await click('Refresh report');
    check('live report: explicit refresh bypasses cached revisions and updates the displayed data', () => { assert.deepEqual(reportCalls().at(-1).payload, { testId: test.id }); assert.match(reportView.host.textContent, /Refreshed cost report/); });
    for (const status of ['completed', 'cancelled']) {
      globalThis.__RC_CALLABLE_DATA.getAssessmentTestReport = { ...fullReport, test: { ...test, status } };
      await click('Refresh report');
      const beforeStopped = reportCalls().length;
      await tick(); await tick();
      check(`live report: ${status} tests stop automatic requests even inside their former window`, () => assert.equal(reportCalls().length, beforeStopped));
    }
    const starts = reportNow + 30_000, ends = starts + 60_000;
    globalThis.__RC_CALLABLE_DATA.getAssessmentTestReport = { ...fullReport, test: { ...test, status: 'published', startDateTime: new Date(starts).toISOString(), endDateTime: new Date(ends).toISOString() } };
    await click('Refresh report');
    const beforeOpen = reportCalls().length;
    reportNow = starts - 1; await tick();
    check('live report: upcoming windows use only the local clock, not database reads', () => assert.equal(reportCalls().length, beforeOpen));
    reportNow = starts + 1; await tick();
    globalThis.__RC_CALLABLE_DATA.getAssessmentTestReport = { unchanged: true, reportRevision: fullReport.reportRevision };
    await tick();
    check('live report: polling starts when the real window opens without reloading the page', () => assert.equal(reportCalls().length, beforeOpen + 1));
    reportNow = ends + 1; await tick();
    const afterClosed = reportCalls().length; await tick();
    check('live report: the local clock stops automatic requests after the window closes', () => assert.equal(reportCalls().length, afterClosed));
    await reportView.close(); reportView = undefined;
    check('live report: unmount removes all component polling clocks', () => assert.equal(intervals.size, 0));
  } finally {
    if (reportView) await reportView.close();
    globalThis.setInterval = realInterval; globalThis.clearInterval = realClear; Date.now = realNow;
    if (hiddenDescriptor) Object.defineProperty(document, 'hidden', hiddenDescriptor); else delete document.hidden;
  }

  reset(); globalThis.__RC_ROLE = 'superadmin';
  const row = (id, data) => ({ id, data: () => data });
  globalThis.__RC_FIRESTORE_COLLECTIONS = { performanceMetrics: Array.from({ length: 96 }, (_, i) => row(`m-${i}`, { timestamp: '2026-11-13', responseTime: 10 })), errors: [], slowQueries: [], alerts: [] };
  let observed;
  function HealthProbe() {
    const main = health.useSystemHealth(), history = health.useHealthHistory(), performance = health.usePerformanceMetrics(), slow = health.useSlowQueries(), errors = health.useErrorLogs();
    observed = { main, history, performance, slow, errors }; return React.createElement('span');
  }
  const healthView = await mount(HealthProbe);
  check('system health: all overview/history/performance consumers receive data', () => { assert.ok(observed.main.data); assert.equal(observed.history.data.length, 96); assert.equal(observed.performance.data.length, 96); });
  check('system health: one shared metrics query, not three independent downloads', () => assert.equal(queries.filter(query => query.__collection === 'performanceMetrics').length, 1));
  check('system health: overview and detail share the same errors and slow-query reads', () => { assert.equal(queries.filter(query => query.__collection === 'errors').length, 1); assert.equal(queries.filter(query => query.__collection === 'slowQueries').length, 1); });
  await healthView.close();
  console.log(`\n${checks}/${checks} cost-control behavioral checks passed.`);
} finally {
  for (const view of views) await view.close();
  for (const key of ['__RC_TRANSACTION', '__RC_WRITES', '__RC_AUTH_USER', '__RC_ROLE', '__RC_CALLABLE_DATA', '__RC_CALLABLE_ERRORS', '__RC_CALLABLE_PAYLOADS', '__RC_FIRESTORE_BY_PATH', '__RC_FIRESTORE_COLLECTIONS', '__RC_FIRESTORE_QUERY_GUARD']) delete globalThis[key];
  await server.close();
}
process.exit(process.exitCode || 0);
