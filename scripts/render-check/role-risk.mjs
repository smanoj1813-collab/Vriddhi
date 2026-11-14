// Real role dashboards, shared shell, artwork, inbox and settings. Only the
// existing Auth/Firebase/router I/O boundary is stubbed; no live project used.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const server = await createServer({ root, configFile: path.join(root, 'scripts/render-check/vite.config.mts'), server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel: 'error' });
const { AppThemeProvider } = await server.ssrLoadModule('/src/shared/contexts/ThemeProvider.tsx');
const { LanguageProvider } = await server.ssrLoadModule('/src/shared/contexts/LanguageProvider.tsx');
const { DEFAULT_RISK_SETTINGS } = await server.ssrLoadModule('/functions/src/riskCore.ts');
const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); }); };
const views = new Set();
let checks = 0;
const check = (name, fn) => { fn(); console.log(`ok ${++checks} - ${name}`); };
async function mount(file, props = {}) {
  const Comp = (await server.ssrLoadModule(file)).default;
  const host = document.createElement('div'); document.body.appendChild(host);
  const reactRoot = createRoot(host), client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  const render = async (p = props) => { await act(async () => reactRoot.render(React.createElement(QueryClientProvider, { client }, React.createElement(AppThemeProvider, null, React.createElement(LanguageProvider, null, React.createElement(Comp, p)))))); await settle(); await settle(); };
  const view = { host, client, text: () => host.textContent.replace(/\s+/g, ' '), q: s => host.querySelector(s), all: s => [...host.querySelectorAll(s)], byText: (s, text) => [...host.querySelectorAll(s)].find(el => el.textContent.trim() === text), render,
    click: async el => { assert.ok(el, 'Expected clickable element'); await act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))); await settle(); await settle(); },
    close: async () => { await act(async () => reactRoot.unmount()); client.clear(); host.remove(); views.delete(view); } };
  views.add(view); await render(); return view;
}
const type = async (el, value) => { assert.ok(el); await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); }); await settle(); };
const select = async (el, value) => { assert.ok(el); await act(async () => { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); }); await settle(); };
const submit = async el => { assert.ok(el); await act(async () => el.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); await settle(); await settle(); };
const baseAlert = (id, extra = {}) => ({ id: id.repeat(64), key: `assignment:${id}`, category: 'assignment', severity: 'critical', title: 'Assignment submission missing', message: 'DBMS worksheet passed its deadline with no completed submission recorded.', path: '/student/assignments', subjectUid: 'faculty-1', subjectName: 'Teaching member', state: 'active', stale: false, read: false, checkedAt: Date.now(), createdAt: Date.now(), updatedAt: Date.now(), ...extra });
function reset(role = 'faculty') {
  localStorage.clear();
  localStorage.setItem('vriddhi_college_id', 'college-a');
  globalThis.__RC_ROLE = role;
  globalThis.__RC_PATHNAME = role === 'student' ? '/student/dashboard' : ['faculty', 'mentor'].includes(role) ? '/faculty/dashboard' : ['hod', 'admin'].includes(role) ? '/admin/hod-dashboard' : role === 'principal' ? '/admin/dashboard' : role === 'superadmin' ? '/superadmin/dashboard' : `/admin/${role}`;
  globalThis.__RC_FIRESTORE_DOCS = [];
  globalThis.__RC_FIRESTORE_COLLECTIONS = {};
  globalThis.__RC_FIRESTORE_BY_PATH = { 'platform/stats': { totalColleges: 12, totalStudents: 540, totalFaculty: 42, totalAdmins: 12, activeColleges: 12, suspendedColleges: 0, topColleges: [], updatedAt: new Date().toISOString() } };
  globalThis.__RC_CALLABLE_ERRORS = {}; globalThis.__RC_CALLABLE_PAYLOADS = [];
  globalThis.__RC_CALLABLE_DATA = {
    getMyAcademicRiskAlerts: { alerts: [], checkedAt: null, truncated: false, canRefresh: false, canConfigure: role === 'principal' },
    getFacultyAcademicContext: { enabled: false },
    getMyEmployeeAccess: { employee: null, superadmin: false },
    syncMyIdentity: { success: true },
    getAcademicRiskConfiguration: { settings: { ...DEFAULT_RISK_SETTINGS }, revision: 0, schedules: [], faculty: [{ uid: 'faculty-1', name: 'Teaching member' }], truncated: false },
    saveAcademicRiskConfiguration: { revision: 1 }, saveFacultyRiskWorkSchedule: { success: true },
    markMyAcademicRiskAlertRead: { success: true },
  };
}
const PAGE = '/src/shared/pages/AcademicRiskAlertsPage.tsx';
try {
  const bannerViews = [];
  for (const [role, scene] of [['faculty', 'faculty'], ['mentor', 'faculty'], ['hod', 'hod'], ['admin', 'hod'], ['principal', 'principal'], ['accounts', 'accounts'], ['operations', 'operations'], ['superadmin', 'superadmin'], ['employee', 'employee']]) {
    reset(role); const view = await mount('/src/shared/components/RoleWelcomeBanner.tsx', { role, title: `${role} workspace preview`, subtitle: 'Existing live metrics stay outside this decorative scene.', headingLevel: 1 }); bannerViews.push(view);
    check(`${role}: role-aware illustration and visible heading`, () => { assert.equal(view.q('svg[data-scene]')?.dataset.scene, scene); assert.match(view.q('h1')?.textContent || '', new RegExp(role)); });
    check(`${role}: illustration is decorative, nonfocusable and makes no image requests`, () => { assert.equal(view.q('svg[data-scene]')?.getAttribute('aria-hidden'), 'true'); assert.equal(view.q('svg[data-scene]')?.getAttribute('focusable'), 'false'); assert.equal(view.all('img,image,iframe').length, 0); });
  }
  check('all role scenes can coexist without SVG resource collisions', () => { const ids = [...document.querySelectorAll('svg[data-scene] [id]')].map(el => el.id); assert.equal(new Set(ids).size, ids.length); });
  for (const view of bannerViews) await view.close();

  for (const [role, file, scene, retained] of [
    ['faculty', '/src/modules/faculty/pages/FacultyDashboard.tsx', 'faculty', /My Attendance/],
    ['hod', '/src/modules/admin/pages/HODDashboard.tsx', 'hod', /Department of Science/],
    ['principal', '/src/modules/admin/pages/AdminDashboard.tsx', 'principal', /Principal Dashboard/],
    ['accounts', '/src/modules/office/pages/AccountsDesk.tsx', 'accounts', /Fees outstanding/],
    ['operations', '/src/modules/office/pages/OperationsDesk.tsx', 'operations', /Operations Desk/],
    ['superadmin', '/src/modules/superadmin/pages/SuperAdminDashboard.tsx', 'superadmin', /Super Admin Console/],
    ['employee', '/src/modules/employee/pages/EmployeeDashboard.tsx', 'employee', /No colleges have been assigned/],
  ]) {
    reset(role); const view = await mount(file); await settle();
    check(`${role} actual dashboard: landing-style artwork is integrated`, () => assert.ok(view.q(`.portal-role-banner svg[data-scene="${scene}"]`)));
    check(`${role} actual dashboard: previous role content remains`, () => assert.match(view.text(), retained));
    if (['faculty', 'hod', 'principal'].includes(role)) check(`${role} actual dashboard: scoped monthly Risk Alerts entry is present, without a self-check promise`, () => { assert.ok(view.q('section[aria-label="Academic risk alerts"] a[href$="/risk-alerts"]')); assert.match(view.text(), /Monthly snapshot — not live monitoring/); assert.doesNotMatch(view.text(), /Run your first check/); });
    if (role === 'faculty') {
      const action = view.all('button').find(b => b.textContent.includes('My Attendance'));
      check('faculty quick action: native keyboard-operable button has an animated decorative icon', () => { assert.equal(action?.type, 'button'); assert.ok(action.querySelector('.portal-interactive-icon[aria-hidden="true"]')); });
      await view.click(action); check('faculty quick action: preserved self-attendance destination', () => assert.equal(globalThis.__navigated, '/faculty/my-attendance'));
    }
    await view.close();
  }

  for (const role of ['faculty', 'hod', 'principal', 'accounts', 'operations', 'superadmin']) {
    reset(role); const view = await mount('/src/shared/components/Layout.tsx', { children: React.createElement('p', null, 'Protected role content') });
    check(`${role} shell: navigation icons opt into shared hover/focus motion`, () => { assert.ok(view.all('.portal-motion-target .portal-interactive-icon').length > 0); assert.match(view.text(), /Protected role content/); });
    check(`${role} shell: Risk Alerts respects the role permission boundary`, () => { const entries = view.all('[role="button"],button').filter(el => el.textContent.trim() === 'Risk Alerts'); assert.equal(entries.length > 0, ['faculty', 'hod', 'principal'].includes(role)); });
    await view.close();
  }

  reset('student');
  const missed = baseAlert('a'), warning = baseAlert('b', { category: 'attendance', severity: 'warning', title: 'Recorded missed classes', path: '/student/attendance', state: 'unverified', stale: true });
  const coverage = baseAlert('c', { category: 'coverage', severity: 'info', title: 'Some academic checks need more data', message: 'Assigned attendance policy is missing.\nA register import is incomplete.' });
  const resolved = baseAlert('d', { state: 'resolved', title: 'Previously cleared assignment' });
  // A stale server response must not restore the removed manual-scan action.
  globalThis.__RC_CALLABLE_DATA.getMyAcademicRiskAlerts = { alerts: [warning, missed, coverage, resolved], checkedAt: Date.now(), canRefresh: true, canConfigure: false, truncated: false };
  let view = await mount(PAGE);
  check('student inbox: active risks, history and coverage are separate', () => { assert.match(view.text(), /2 attention items/); assert.match(view.text(), /Coverage warnings — not confirmed risks/); assert.doesNotMatch(view.text(), /Previously cleared assignment/); });
  check('student inbox: monthly-only cadence is explicit and the manual-check button is absent', () => { assert.match(view.text(), /1st of each month at 3:00 AM IST/); assert.match(view.text(), /Monthly snapshot — not live monitoring/); assert.match(view.text(), /deadlines between reviews may not appear/); assert.ok(!view.byText('button', 'Check my records now')); assert.match(view.text(), /College accounts cannot run checks manually/); assert.doesNotMatch(view.text(), /on demand|request a new check|over four hours old/); });
  check('student inbox: no interval, focus or reconnect poller remains', () => { const query = view.client.getQueryCache().getAll().find(q => q.queryKey[0] === 'academic-risk-alerts'); assert.ok(query); assert.equal(query.options.refetchInterval, false); assert.equal(query.options.refetchOnWindowFocus, false); assert.equal(query.options.refetchOnReconnect, false); });
  check('student inbox: opening the page reads saved results but does not automatically recompute records', () => { assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.filter(c => c.name === 'getMyAcademicRiskAlerts').length, 1); assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.filter(c => c.name === 'refreshMyAcademicRiskAlerts').length, 0); });
  check('student inbox: critical before warnings; incomplete rechecks remain explicitly unverified', () => { assert.match(view.all('article h2')[0].textContent, /Assignment/); assert.match(view.text(), /Recheck needed — not confirmed current/); });
  check('student inbox: incomplete policy is not shown as a confirmed eligibility conclusion', () => { assert.match(view.text(), /Assigned attendance policy is missing/); assert.match(view.text(), /never a default university/); });
  check('student inbox: permission-based push stays optional and never asks automatically', () => { assert.match(view.text(), /Push has not been configured/); const b = view.byText('button', 'Enable push'); assert.equal(b?.disabled, true); assert.ok(view.q('a[href="/student/assignments"]')); });
  check('student inbox: read and state filters use native accessible controls', () => { assert.ok(view.q('button[aria-pressed="true"]')); assert.ok(view.q('select[id]') && document.querySelector(`label[for="${view.q('select').id}"]`)); assert.ok(view.byText('button', 'Mark read')); });
  await view.click(view.byText('button', 'Mark read'));
  check('student inbox: acknowledgement sends only the owned alert id, never a resolution or recipient', () => assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS.find(c => c.name === 'markMyAcademicRiskAlertRead'), { name: 'markMyAcademicRiskAlertRead', payload: { id: missed.id } }));
  const inboxReads = globalThis.__RC_CALLABLE_PAYLOADS.filter(c => c.name === 'getMyAcademicRiskAlerts').length;
  await view.click(view.byText('button', 'Refresh inbox'));
  check('student inbox: explicit inbox refresh only reloads saved results and cannot trigger a scan', () => { assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.filter(c => c.name === 'getMyAcademicRiskAlerts').length, inboxReads + 1); assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.filter(c => c.name === 'refreshMyAcademicRiskAlerts').length, 0); });
  await select(view.q('select'), 'attendance');
  check('student inbox: category filter preserves only matching risks', () => { assert.equal(view.all('article').length, 1); assert.match(view.all('article')[0].textContent, /Recorded missed classes/); });
  await select(view.q('select'), 'all'); await view.click(view.byText('button', 'History'));
  check('student inbox: history distinguishes resolved records from current warnings', () => { assert.equal(view.all('article').length, 1); assert.match(view.text(), /Previously cleared assignment/); });
  await view.close();

  for (const role of ['student', 'faculty', 'mentor', 'hod', 'admin', 'principal']) {
    reset(role);
    globalThis.__RC_CALLABLE_DATA.getMyAcademicRiskAlerts.canRefresh = true; // legacy capability must be ignored
    view = await mount(PAGE);
    const savedLoads = globalThis.__RC_CALLABLE_PAYLOADS.filter(c => c.name === 'getMyAcademicRiskAlerts').length;
    await view.click(view.byText('button', 'Refresh inbox'));
    check(`${role}: inbox refresh reads saved results with no manual scan control, even with a legacy canRefresh response`, () => { assert.ok(!view.byText('button', 'Check my records now')); assert.doesNotMatch(view.text(), /Checking records|on demand|request a new check/); assert.match(view.text(), /College accounts cannot run checks manually/); assert.ok(view.byText('button', 'Refresh inbox')); assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.filter(c => c.name === 'getMyAcademicRiskAlerts').length, savedLoads + 1); assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.filter(c => c.name === 'refreshMyAcademicRiskAlerts').length, 0); });
    await view.close();
  }
  reset('student');
  view = await mount('/src/shared/components/RiskAlertsSummary.tsx');
  check('dashboard risk summary: the first review waits for the monthly schedule, not a manual inbox action', () => { assert.match(view.text(), /first automatic monthly review is pending/); assert.match(view.text(), /Opening or refreshing the inbox does not start a check/); assert.doesNotMatch(view.text(), /Run your first check/); });
  await view.close();
  check('risk client: no scan API wrapper, mutation or capability-driven action remains', () => { for (const file of ['src/shared/services/riskAlertsApi.ts', 'src/shared/hooks/useAcademicRiskAlerts.ts', 'src/shared/pages/AcademicRiskAlertsPage.tsx']) assert.doesNotMatch(readFileSync(path.join(root, file), 'utf8'), /refreshMyAcademicRiskAlerts|canRefresh/); });

  reset('faculty'); globalThis.__RC_CALLABLE_ERRORS.getMyAcademicRiskAlerts = { code: 'functions/unavailable', message: 'Fixture service unavailable' };
  view = await mount(PAGE); await act(async () => { await new Promise(r => setTimeout(r, 1300)); });
  check('inbox failure: actionable retry, never an all-clear/empty-success screen', () => { assert.match(view.text(), /no “all clear” conclusion/); assert.ok(view.byText('button', 'Retry alerts')); assert.doesNotMatch(view.text(), /No attention items in this view/); });
  await view.close();

  reset('hod'); globalThis.__RC_CALLABLE_DATA.getMyAcademicRiskAlerts = { alerts: [baseAlert('a', { subjectUid: 'another-faculty', path: '/admin/attendance', category: 'class-register', title: 'Class attendance register is unmarked' })], checkedAt: null, truncated: false, canRefresh: false, canConfigure: false };
  view = await mount(PAGE);
  check('HOD inbox: identifies faculty and department scope without exposing configuration controls', () => { assert.match(view.text(), /Faculty · Teaching member/); assert.match(view.text(), /matching department HOD/); assert.ok(!view.byText('button', 'Warning settings')); assert.ok(!view.byText('button', 'Check my records now')); assert.ok(view.q('a[href="/admin/attendance"]')); });
  await view.close();

  reset('principal'); globalThis.__RC_CALLABLE_DATA.getMyAcademicRiskAlerts.canRefresh = false;
  view = await mount(PAGE);
  await view.click(view.byText('button', 'Warning settings')); await settle();
  check('Principal settings: lazy, labelled and version-aware, with all configurable buffers', () => { assert.match(view.text(), /College warning settings/); assert.match(view.text(), /revision 0/); assert.match(view.text(), /Enable monthly academic reviews/); assert.match(view.text(), /saving cannot start a check/); assert.doesNotMatch(view.text(), /Run academic early-warning checks/); assert.equal(view.all('input[type="number"]').length, 7); const region = document.getElementById(view.q('button[aria-expanded="true"]').getAttribute('aria-controls')); assert.ok(region?.textContent.includes('College warning settings')); });
  const numeric = view.all('input[type="number"]'); await type(numeric[2], '4');
  await submit(numeric[0].closest('form'));
  check('Principal settings: save uses reviewed revision and thresholds, never a client-selected tenant', () => { const call = globalThis.__RC_CALLABLE_PAYLOADS.find(c => c.name === 'saveAcademicRiskConfiguration'); assert.equal(call.payload.expectedRevision, 0); assert.equal(call.payload.settings.registerGraceHours, 4); assert.equal(call.payload.collegeId, undefined); assert.match(view.text(), /next monthly review; saving does not start a check/); assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.filter(c => c.name === 'refreshMyAcademicRiskAlerts').length, 0); });
  await select(view.q('select[id$="-faculty"]'), 'faculty-1');
  const weekdays = view.all('fieldset input[type="checkbox"]'); await view.click(weekdays[5]);
  await type(view.q('input[id$="-startTime"]'), '09:00'); await type(view.q('input[id$="-endTime"]'), '17:00'); await type(view.q('input[id$="-effectiveFrom"]'), '2026-11-13');
  await submit(view.q('select[id$="-faculty"]').closest('form'));
  check('Principal settings: staff monitoring requires explicit days/hours/dates and chosen verified faculty', () => { const call = globalThis.__RC_CALLABLE_PAYLOADS.find(c => c.name === 'saveFacultyRiskWorkSchedule'); assert.equal(call.payload.facultyUid, 'faculty-1'); assert.deepEqual(call.payload.schedule.days, [5]); assert.equal(call.payload.schedule.startTime, '09:00'); assert.equal(call.payload.schedule.effectiveFrom, '2026-11-13'); assert.match(view.text(), /Working schedule saved for the next monthly review/); assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.filter(c => c.name === 'refreshMyAcademicRiskAlerts').length, 0); });
  await view.close();

  const css = readFileSync(path.join(root, 'src/shared/styles/portalExperience.css'), 'utf8');
  check('all-role motion: finite greetings plus hover AND keyboard focus, no perpetual decorative loop', () => { assert.match(css, /prefers-reduced-motion:\s*reduce/); assert.match(css, /\.portal-motion-target:focus-visible \.portal-interactive-icon/); assert.match(css, /\.portal-motion-target:hover \.portal-interactive-icon/); assert.doesNotMatch(css, /animation:[^;]*infinite/); });
  check('login performance: shared Layout and account binding do not statically import data SDK or risk hooks', () => { for (const file of ['src/shared/components/Layout.tsx', 'src/shared/pwa/riskPushAccount.ts']) { const code = readFileSync(path.join(root, file), 'utf8'); assert.doesNotMatch(code, /import\s+(?:[^'";]*\s+from\s+)?['"](?:firebase\/(?:firestore|messaging|functions)|@\/Firebase\/data|[^'"]*useAcademicRiskAlerts)['"]/); } });
  console.log(`\n${checks}/${checks} role and risk render checks passed.`);
} finally {
  for (const view of views) await view.close();
  for (const key of ['__RC_ROLE', '__RC_PATHNAME', '__RC_FIRESTORE_DOCS', '__RC_FIRESTORE_COLLECTIONS', '__RC_FIRESTORE_BY_PATH', '__RC_CALLABLE_ERRORS', '__RC_CALLABLE_PAYLOADS', '__RC_CALLABLE_DATA']) delete globalThis[key];
  await server.close();
}

// Match the existing render runners: some mounted libraries retain timers.
// Exit only after every assertion and server cleanup; thrown assertions still fail.
process.exit(process.exitCode || 0);
