// Faculty navigation + real Journey/Schedule hooks and APIs. Only the existing
// Auth/Firebase/router transport boundary is stubbed; no live college is read.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const server = await createServer({ root, configFile: path.join(root, 'scripts/render-check/vite.config.mts'), server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel: 'error' });
const { AppThemeProvider } = await server.ssrLoadModule('/src/shared/contexts/ThemeProvider.tsx');
const { LanguageProvider } = await server.ssrLoadModule('/src/shared/contexts/LanguageProvider.tsx');
const { queries } = await server.ssrLoadModule('/scripts/render-check/stubs/firestore.ts');
const { fetchFacultyProfile } = await server.ssrLoadModule('/src/shared/api/facultyProfileApi.ts');
const { fetchFacultyWeeklySchedule, fetchFacultyWeeklyScheduleByName } = await server.ssrLoadModule('/src/modules/admin/api/scheduleApi.ts');
const { fetchStudentsByMentor, fetchScoresByStudentIds } = await server.ssrLoadModule('/src/modules/admin/api/journeyApi.ts');
const { fetchFacultyTimelineFromRealData } = await server.ssrLoadModule('/src/modules/admin/api/journeyMilestonesApi.ts');
const { fetchFacultyClassSessions } = await server.ssrLoadModule('/src/modules/faculty/api/facultyApi.ts');
const settle = async (ms = 25) => { await act(async () => { await new Promise(resolve => setTimeout(resolve, ms)); }); };
const views = new Set();
let checks = 0;
const check = (name, fn) => { fn(); console.log(`ok ${++checks} - ${name}`); };
const row = (id, data) => ({ id, data: () => data });
const field = (q, name) => q.__constraints?.find(c => c.__field === name);
const user = { uid: 'faculty-1', id: 'faculty-1', role: 'faculty', name: 'Bala Kumar', displayName: 'Bala Kumar', email: 'bala@example.edu', collegeId: 'college-a', department: 'Science' };
const ownProgress = { facultyId: 'FAC001', topics: { total: 5, covered: 3, pending: 2, pct: 60 }, pace: { completed: 8, weeksElapsed: 4 }, attendance: { marked: 2, present: 0, pct: 0 } };
const JOURNEY = '/src/modules/faculty/pages/FacultyJourneyPage.tsx';
const SCHEDULE = '/src/modules/faculty/pages/FacultySchedule.tsx';
const profile = { uid: user.uid, collegeId: user.collegeId, facultyId: 'EMP001', name: 'Bala Kumar', email: user.email, department: 'Science', designation: 'Lecturer', joiningDate: '2024-01-10', papersUploaded: 2 };
function scopeGuard(q) {
  if (['faculty', 'weeklySchedules', 'students', 'studentAssessments', 'assessments', 'papers', 'classSessions'].includes(q.__collection)) {
    const college = field(q, 'collegeId');
    assert.equal(college?.__operator, '==', `${q.__collection} must be tenant scoped BEFORE reading`);
    assert.ok(['college-a', 'college-b'].includes(college.__value));
  }
}
function reset() {
  localStorage.clear();
  // Deliberately stale/invalid legacy storage: new hooks must use live Auth.
  localStorage.setItem('vriddhi_user', 'not valid JSON');
  localStorage.setItem('vriddhi_college_id', 'college-b');
  globalThis.__RC_ROLE = 'faculty'; globalThis.__RC_AUTH_USER = user;
  globalThis.__RC_PATHNAME = '/faculty/dashboard'; globalThis.__RC_AUTH_LOADING = false;
  globalThis.__RC_FIRESTORE_DOCS = [];
  globalThis.__RC_FIRESTORE_BY_PATH = { 'colleges/college-a': { name: 'Faculty Test College' } };
  globalThis.__RC_FIRESTORE_COLLECTIONS = {
    faculty: [row('FAC001', profile), row('foreign-profile', { ...profile, collegeId: 'college-b' })],
    students: [
      row('s-name', { collegeId: 'college-a', mentor: ' BALA    KUMAR ', name: 'Name linked' }),
      row('s-profile', { collegeId: 'college-a', mentorId: 'FAC001', name: 'Profile linked' }),
      row('s-uid', { collegeId: 'college-a', mentorFacultyId: 'faculty-1', name: 'UID linked' }),
      row('s-email', { collegeId: 'college-a', mentorName: 'BALA@EXAMPLE.EDU', name: 'Email linked' }),
      row('other', { collegeId: 'college-a', mentor: 'Other faculty', name: 'Other mentee' }),
      row('foreign', { collegeId: 'college-b', mentor: 'Bala Kumar', name: 'Foreign mentee' }),
    ],
    studentAssessments: [
      ...[['s-profile', 100], ['s-profile', 80], ['s-name', 60], ['s-uid', 0], ['other', 100]].map(([studentId, percentage], i) => row(`score-${i}`, { studentId, percentage, status: 'graded', collegeId: 'college-a' })),
      row('pending', { studentId: 's-email', percentage: 0, status: 'submitted', collegeId: 'college-a' }),
      row('foreign-score', { studentId: 's-name', percentage: 100, status: 'graded', collegeId: 'college-b' }),
    ],
    assessments: [
      ...Array.from({ length: 30 }, (_, i) => row(`other-${i}`, { collegeId: 'college-a', createdBy: 'another', title: 'Not mine', createdAt: '2026-10-01' })),
      row('mine', { collegeId: 'college-a', createdBy: 'faculty-1', createdByName: 'Bala Kumar', title: 'My UID assessment', createdAt: '2026-11-10', status: 'published' }),
      row('legacy', { collegeId: 'college-a', createdByName: 'Bala Kumar', title: 'My legacy assessment' }),
      row('same-name', { collegeId: 'college-a', createdBy: 'someone-else', createdByName: 'Bala Kumar', title: 'Different teacher with same name' }),
      row('foreign', { collegeId: 'college-b', createdBy: 'faculty-1', title: 'Foreign assessment' }),
    ],
    papers: [row('paper', { collegeId: 'college-a', createdBy: 'FAC001', createdByName: 'Bala Kumar', title: 'My profile paper', createdAt: '2026-11-11' })],
    weeklySchedules: [
      row('uid-slot', { collegeId: 'college-a', facultyId: 'faculty-1', facultyName: 'Bala Kumar', dayOfWeek: 'tuesday', startTime: '10:00', endTime: '11:00', subject: 'UID class' }),
      row('profile-slot', { collegeId: 'college-a', facultyId: 'FAC001', facultyName: 'Bala Kumar', dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00', subject: 'Profile class' }),
      row('code-slot', { collegeId: 'college-a', facultyId: 'EMP001', facultyName: 'Bala Kumar', dayOfWeek: 'sunday', startTime: '09:00', endTime: '10:00', subject: 'Faculty code class' }),
      row('inactive', { collegeId: 'college-a', facultyId: 'FAC001', dayOfWeek: 'monday', subject: 'Inactive class', isActive: false }),
      row('foreign', { collegeId: 'college-b', facultyId: 'FAC001', facultyName: 'Bala Kumar', subject: 'Foreign class' }),
      row('another', { collegeId: 'college-a', facultyId: 'another-uid', subject: 'Other teacher class' }),
    ],
  };
  globalThis.__RC_FIRESTORE_QUERY_GUARD = scopeGuard;
  globalThis.__RC_CALLABLE_ERRORS = {}; globalThis.__RC_CALLABLE_PAYLOADS = [];
  globalThis.__RC_CALLABLE_DATA = { getCurriculumProgress: { faculty: [ownProgress, { ...ownProgress, facultyId: 'other-faculty', topics: { covered: 99, pending: 1 } }], totals: { ...ownProgress, topics: { covered: 999, pending: 1 } } } };
  queries.length = 0;
}
async function mount(file, props = {}) {
  const Comp = (await server.ssrLoadModule(file)).default;
  const host = document.createElement('div'); document.body.appendChild(host);
  const reactRoot = createRoot(host), client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const render = async () => { await act(async () => reactRoot.render(React.createElement(QueryClientProvider, { client }, React.createElement(AppThemeProvider, null, React.createElement(LanguageProvider, null, React.createElement(Comp, props)))))); await settle(); await settle(); };
  const view = { host, q: s => host.querySelector(s), all: s => [...host.querySelectorAll(s)], text: () => host.textContent.replace(/\s+/g, ' '), render,
    byText: text => [...host.querySelectorAll('button,[role="button"]')].find(el => el.textContent.trim() === text),
    click: async el => { assert.ok(el, 'Expected a clickable element'); await act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))); await settle(250); },
    close: async () => { await act(async () => reactRoot.unmount()); client.clear(); host.remove(); views.delete(view); } };
  views.add(view); await render(); return view;
}
const stat = (view, label) => view.all('h3').find(el => el.textContent === label)?.parentElement.parentElement.querySelector('p')?.textContent;
try {
  reset();
  let view = await mount('/src/shared/components/Layout.tsx', { children: React.createElement('p', null, 'Faculty route content') });
  const drawer = () => view.q('.MuiDrawer-paper');
  const group = label => [...drawer().querySelectorAll('[aria-expanded]')].find(el => el.textContent === label);
  check('faculty sidebar: ten compact top-level entries, Journey directly reachable, no one-item Insights group', () => {
    assert.equal(drawer().querySelectorAll('[aria-expanded]').length, 6);
    assert.ok([...drawer().querySelectorAll('[role="button"]')].find(el => el.textContent === 'Journey'));
    assert.equal(group('Insights'), undefined);
    assert.equal(drawer().querySelectorAll('[aria-expanded="true"]').length, 0);
  });
  await view.click(group('Schedule'));
  check('faculty sidebar: exactly one Calendar, and rescheduling is in Schedule', () => {
    assert.equal([...drawer().querySelectorAll('[role="button"]')].filter(el => el.textContent === 'Calendar').length, 1);
    assert.ok(drawer().textContent.includes('Reschedule Class'));
  });
  await view.click(group('Curriculum'));
  check('faculty sidebar: opening another group closes Schedule without dropping Program Insights', () => {
    assert.equal(group('Schedule').getAttribute('aria-expanded'), 'false');
    assert.equal(group('Curriculum').getAttribute('aria-expanded'), 'true');
    assert.equal(drawer().querySelectorAll('[aria-expanded="true"]').length, 1);
    assert.ok(drawer().textContent.includes('Program Insights'));
  });
  globalThis.__RC_PATHNAME = '/faculty/calendar'; await view.render(); await settle(250);
  check('faculty sidebar: calendar deep links open Schedule and select the existing destination', () => {
    assert.equal(group('Schedule').getAttribute('aria-expanded'), 'true');
    assert.ok(drawer().querySelector('.Mui-selected')?.textContent === 'Calendar');
    assert.equal(drawer().querySelectorAll('[aria-expanded="true"]').length, 1);
  });
  await view.click(group('Schedule'));
  check('faculty sidebar: an active accordion can still be closed manually', () => assert.equal(drawer().querySelectorAll('[aria-expanded="true"]').length, 0));
  await view.click(view.q('nav button[aria-label="More"]'));
  check('faculty mobile More: one Calendar and all 27 previous unique destinations remain reachable', () => {
    const tiles = view.all('[role="dialog"] a[href]');
    const destinations = new Set(tiles.map(a => a.getAttribute('href')));
    for (const path of ['/faculty/dashboard', '/faculty/my-attendance', '/faculty/student-analysis', '/faculty/assessments']) destinations.add(path); // four thumb tabs
    const layout = readFileSync(path.join(root, 'src/shared/components/Layout.tsx'), 'utf8');
    const navSource = layout.slice(layout.indexOf('const facultyNav:'), layout.indexOf('const principalNav:'));
    const paths = [...navSource.matchAll(/path: "([^"]+)"/g)].map(match => match[1]);
    assert.equal(paths.length, 27); assert.equal(new Set(paths).size, 27);
    assert.deepEqual([...destinations].sort(), [...paths].sort());
    assert.equal(tiles.filter(a => a.getAttribute('href') === '/faculty/calendar').length, 1);
    assert.ok(destinations.has('/faculty/journey') && destinations.has('/faculty/settings') && destinations.has('/faculty/my-salary'));
  });
  await view.close();

  reset(); globalThis.__RC_ROLE = 'principal'; globalThis.__RC_AUTH_USER = { ...user, role: 'principal' };
  view = await mount('/src/shared/components/Layout.tsx');
  const otherGroups = view.all('.MuiDrawer-paper [aria-expanded]');
  await view.click(otherGroups[0]); await view.click(otherGroups[1]);
  check('shared shell: principal retains its original multi-open group behaviour', () => assert.equal(view.all('.MuiDrawer-paper [aria-expanded="true"]').length, 2));
  await view.close();

  reset(); view = await mount(JOURNEY);
  check('Journey: live Auth and top-level college-scoped faculty profile work without legacy user storage', () => {
    assert.match(view.q('section[aria-label="Faculty profile"]').textContent, /Bala Kumar.*Lecturer.*Science/);
    assert.doesNotMatch(view.text(), /No faculty data available|Unable to load/);
    assert.equal(queries.some(q => q.__collection.includes('/faculty')), false);
    assert.ok(queries.filter(q => q.__collection === 'faculty').every(q => field(q, 'collegeId').__value === 'college-a'));
  });
  check('Journey: mentees match uid, profile id, email and normalized name, not another college', () => assert.equal(stat(view, 'Students Mentored'), '4'));
  check('Journey: each graded mentee counted once; pending/unassigned/foreign attempts excluded', () => {
    assert.equal(stat(view, 'Avg Student Score'), '50%');
    assert.match(view.q('section[aria-label="Student performance"]').textContent, /Good: 1Average: 1Weak: 1/);
    assert.match(view.text(), /1 mentee without graded results; not classified as weak/);
  });
  check('Journey: teaching progress uses only own rows, actual 0% attendance stays 0%, average is honestly labelled', () => {
    assert.equal(stat(view, 'Avg Classes / Week'), '2');
    assert.match(view.q('section[aria-label="Teaching progress"]').textContent, /3\/5/);
    assert.equal(view.q('[aria-label="Class attendance"]').getAttribute('aria-valuenow'), '0');
    assert.doesNotMatch(view.text(), /Classes This Week|999/);
    // Regression for the scoped browser axe definition-list finding: bars and
    // helper text belong inside dd, never next to dt/dd within a dl group.
    for (const group of view.all('dl > div')) assert.ok([...group.children].every(el => ['DT', 'DD'].includes(el.tagName)));
  });
  check('Journey: owner-filtered timeline finds UID records beyond first 20 college rows and deduplicates aliases', () => {
    const text = view.q('section[aria-label="Career timeline"]').textContent;
    assert.match(text, /My UID assessment/); assert.match(text, /My legacy assessment/); assert.match(text, /My profile paper/);
    assert.equal(view.all('section[aria-label="Career timeline"] li').length, 3);
    assert.doesNotMatch(text, /Foreign assessment|Different teacher|Not mine|Faculty Onboarding|0 marks|0 questions/);
    assert.match(text, /Date not recorded/);
  });
  await view.click(view.byText('Refresh journey'));
  check('Journey: refresh reloads real data rather than exhausting the global read counter to empty', () => assert.equal(stat(view, 'Students Mentored'), '4'));
  await view.close();

  reset(); globalThis.__RC_FIRESTORE_COLLECTIONS.faculty = [row('FAC001', { ...profile, uid: '' })];
  const byEmail = await fetchFacultyProfile({ collegeId: 'college-a', uid: 'faculty-1', email: user.email });
  check('faculty profile resolver: email fallback repairs older unlinked uid profiles in the same college', () => assert.equal(byEmail?.id, 'FAC001'));
  const byDocument = await fetchFacultyProfile({ collegeId: 'college-a', uid: 'FAC001' });
  const byCode = await fetchFacultyProfile({ collegeId: 'college-a', uid: 'EMP001' });
  check('faculty profile resolver: direct document and faculty-code callers preserve aliases', () => { assert.equal(byDocument?.id, 'FAC001'); assert.equal(byCode?.id, 'FAC001'); });

  reset(); globalThis.__RC_FIRESTORE_COLLECTIONS.faculty = []; globalThis.__RC_FIRESTORE_COLLECTIONS.assessments = []; globalThis.__RC_FIRESTORE_COLLECTIONS.papers = [];
  globalThis.__RC_CALLABLE_DATA.getCurriculumProgress = { faculty: [], totals: ownProgress };
  view = await mount(JOURNEY);
  check('Journey: a genuinely unlinked profile keeps the signed-in identity visible with actionable guidance', () => { assert.match(view.text(), /no faculty profile is linked/); assert.match(view.text(), /Bala Kumar/); assert.ok(view.q('a[href="/faculty/curriculum"]')); });
  check('Journey: empty activity and missing dates/attendance are honest, not fabricated onboarding or zeroes', () => {
    assert.match(view.text(), /No assessments or generated papers are recorded/);
    assert.equal(stat(view, 'Years of Service'), '—'); assert.equal(stat(view, 'Avg Classes / Week'), '—');
    assert.match(view.q('section[aria-label="Teaching progress"]').textContent, /Avg Attendance—/);
    assert.equal(view.q('[aria-label="Class attendance"]'), null);
    assert.doesNotMatch(view.text(), /Faculty Onboarding|Create First Assessment|Save 70%/);
  });
  await view.close();

  reset(); globalThis.__RC_FIRESTORE_QUERY_GUARD = q => { scopeGuard(q); if (q.__collection === 'faculty') throw Object.assign(new Error('Permission denied'), { code: 'permission-denied' }); };
  view = await mount(JOURNEY);
  check('Journey: denied profile reads show an error and retry, never the misleading no-profile success state', () => { assert.match(view.q('[role="alert"]').textContent, /profile could not be loaded/); assert.ok(view.byText('Retry journey')); assert.doesNotMatch(view.text(), /no faculty profile is linked|No assessments or generated papers/); });
  globalThis.__RC_FIRESTORE_QUERY_GUARD = scopeGuard; await view.click(view.byText('Retry journey'));
  check('Journey: retry actually recovers after a transient profile error', () => { assert.equal(stat(view, 'Students Mentored'), '4'); assert.equal(view.q('[role="alert"]'), null); });
  await view.close();

  reset(); globalThis.__RC_CALLABLE_ERRORS.getCurriculumProgress = { code: 'functions/unavailable', message: 'Unavailable' };
  globalThis.__RC_FIRESTORE_QUERY_GUARD = q => { scopeGuard(q); if (q.__collection === 'studentAssessments') throw new Error('Offline'); };
  view = await mount(JOURNEY);
  check('Journey: one failed summary source does not erase profile, roster or timeline', () => { assert.match(view.text(), /Some records are unavailable.*Mentee scores.*Teaching progress/); assert.equal(stat(view, 'Students Mentored'), '4'); assert.match(view.text(), /My UID assessment/); });
  check('Journey: unavailable metrics remain unknown, with no invented weak band or attendance percentage', () => { assert.equal(stat(view, 'Avg Student Score'), '—'); assert.equal(stat(view, 'Avg Classes / Week'), '—'); assert.match(view.q('section[aria-label="Teaching progress"]').textContent, /Topics Covered—/); assert.doesNotMatch(view.q('section[aria-label="Student performance"]').textContent, /Weak:|Good:/); });
  await view.close();

  reset(); globalThis.__RC_FIRESTORE_QUERY_GUARD = q => { scopeGuard(q); if (q.__collection === 'papers') throw new Error('Unavailable'); };
  view = await mount(JOURNEY);
  check('Journey: failed timeline is distinct from empty activity and has its own retry', () => { assert.match(view.q('section[aria-label="Career timeline"]').textContent, /timeline could not be loaded/); assert.ok(view.byText('Retry timeline')); assert.doesNotMatch(view.text(), /No assessments or generated papers/); });
  globalThis.__RC_FIRESTORE_QUERY_GUARD = scopeGuard; await view.click(view.byText('Retry timeline'));
  check('Journey: independent timeline retry recovers without blanking the summary', () => { assert.equal(stat(view, 'Students Mentored'), '4'); assert.match(view.text(), /My profile paper/); });
  await view.close();

  reset(); globalThis.__RC_AUTH_USER = { ...user, collegeId: undefined };
  view = await mount(JOURNEY);
  check('Journey: missing Auth college never falls back to a stale storage tenant', () => { assert.match(view.text(), /not linked to a college/); assert.equal(queries.length, 0); });
  await view.close();

  reset(); globalThis.__RC_AUTH_USER = null; globalThis.__RC_AUTH_LOADING = true;
  view = await mount(JOURNEY);
  check('Journey: Auth restoration stays in a labelled loading state without querying a stale college', () => { assert.match(view.text(), /Loading your journey/); assert.equal(queries.length, 0); assert.equal(view.q('[role="alert"]'), null); });
  globalThis.__RC_AUTH_USER = user; globalThis.__RC_AUTH_LOADING = false; await view.render();
  check('Journey: resolving Auth triggers the load instead of remaining permanently blank', () => assert.equal(stat(view, 'Students Mentored'), '4'));
  await view.close();

  reset(); let release; let block = true;
  const pending = new Promise(resolve => { release = resolve; });
  globalThis.__RC_FIRESTORE_QUERY_GUARD = async q => { scopeGuard(q); if (block && q.__collection === 'faculty' && field(q, 'uid')?.__value === 'faculty-1') { block = false; await pending; } };
  view = await mount(JOURNEY);
  globalThis.__RC_AUTH_USER = { ...user, uid: 'new-user', id: 'new-user', collegeId: 'college-b', name: 'New Faculty', email: 'new@example.edu' };
  globalThis.__RC_FIRESTORE_COLLECTIONS.faculty.push(row('FAC002', { collegeId: 'college-b', uid: 'new-user', name: 'New Faculty', email: 'new@example.edu' }));
  await view.render(); release(); await settle(); await settle();
  check('Journey: account/college changes reload identity and ignore a late previous-account response', () => { assert.match(view.q('section[aria-label="Faculty profile"]').textContent, /New Faculty/); assert.doesNotMatch(view.text(), /Bala Kumar|My UID assessment|My profile paper/); });
  await view.close();

  reset(); let releaseTimeline;
  const waitingTimeline = new Promise(resolve => { releaseTimeline = resolve; });
  globalThis.__RC_FIRESTORE_QUERY_GUARD = async q => { scopeGuard(q); if (q.__collection === 'assessments' && field(q, 'createdBy')?.__value.includes('faculty-1')) await waitingTimeline; };
  view = await mount(JOURNEY);
  globalThis.__RC_AUTH_USER = { ...user, uid: 'new-user', id: 'new-user', collegeId: 'college-b', name: 'New Faculty', email: 'new@example.edu' };
  globalThis.__RC_FIRESTORE_COLLECTIONS.faculty.push(row('FAC002', { collegeId: 'college-b', uid: 'new-user', name: 'New Faculty', email: 'new@example.edu' }));
  globalThis.__RC_FIRESTORE_COLLECTIONS.assessments.push(row('new-activity', { collegeId: 'college-b', createdBy: 'new-user', title: 'New account activity', createdAt: '2026-11-12' }));
  await view.render(); releaseTimeline(); await settle(); await settle();
  check('Journey timeline: identity changes reload activity and discard an old in-flight response', () => { assert.match(view.text(), /New account activity/); assert.doesNotMatch(view.text(), /My UID assessment|My profile paper/); });
  await view.close();

  reset(); const slots = await fetchFacultyWeeklySchedule('faculty-1', { collegeId: 'college-a', email: user.email });
  check('weekly API: college constrained; merges uid/profile/code slots even when uid already has classes', () => assert.deepEqual(slots.map(s => s.id), ['profile-slot', 'uid-slot', 'code-slot']));
  const byName = await fetchFacultyWeeklyScheduleByName('Bala Kumar', 'college-a');
  check('weekly name fallback: also college scoped and retains legacy active-without-flag slots', () => assert.deepEqual(byName.map(s => s.id), ['profile-slot', 'uid-slot', 'code-slot']));
  view = await mount(SCHEDULE);
  check('Weekly Schedule: renders real classes, including Sunday, excluding inactive/foreign/other faculty', () => { for (const text of ['3 total classes', 'Profile class', 'UID class', 'Faculty code class', 'Sunday']) assert.ok(view.text().includes(text)); assert.doesNotMatch(view.text(), /Foreign class|Other teacher class|Inactive class|Failed to load/); });
  await view.close();

  reset(); globalThis.__RC_FIRESTORE_COLLECTIONS.classSessions = [
    row('materialised-profile', { collegeId: 'college-a', facultyId: 'FAC001', date: '2026-11-09', weeklyScheduleId: 'profile-slot', startTime: '09:00', endTime: '10:00', subject: 'Delivered profile class', status: 'completed', attendanceMarked: true }),
    row('daily-uid', { collegeId: 'college-a', facultyId: 'faculty-1', date: '2026-11-09T12:00:00Z', startTime: '11:00', endTime: '12:00', subjectCode: 'UID', subject: 'Ad hoc UID class' }),
    row('daily-code', { collegeId: 'college-a', facultyId: 'EMP001', date: '2026-11-09', startTime: '12:00', endTime: '13:00', subjectCode: 'CODE', subject: 'Ad hoc code class' }),
    row('foreign-session', { collegeId: 'college-b', facultyId: 'FAC001', date: '2026-11-09', subject: 'Foreign session' }),
  ];
  const sessions = await fetchFacultyClassSessions(user.uid, '2026-11-09', { collegeId: 'college-a', email: user.email });
  check('attendance compatibility: merged weekly aliases preserve daily/rescheduled classes under every id', () => assert.deepEqual(sessions.map(session => session.id), ['materialised-profile', 'daily-uid', 'daily-code']));
  check('attendance compatibility: materialised classes retain completion/attendance instead of becoming duplicate virtual slots', () => { assert.equal(sessions[0].status, 'completed'); assert.equal(sessions[0].attendanceMarked, true); assert.equal(sessions[0].materialised, true); });

  reset(); let releaseSchedule;
  const waitingSchedule = new Promise(resolve => { releaseSchedule = resolve; });
  globalThis.__RC_FIRESTORE_QUERY_GUARD = async q => { scopeGuard(q); if (q.__collection === 'weeklySchedules' && field(q, 'collegeId')?.__value === 'college-a') await waitingSchedule; };
  view = await mount(SCHEDULE);
  globalThis.__RC_AUTH_USER = { ...user, uid: 'new-user', id: 'new-user', collegeId: 'college-b', name: 'New Faculty', email: 'new@example.edu' };
  globalThis.__RC_FIRESTORE_COLLECTIONS.weeklySchedules.push(row('new-slot', { collegeId: 'college-b', facultyId: 'new-user', dayOfWeek: 'wednesday', startTime: '10:00', endTime: '11:00', subject: 'New account class' }));
  await view.render(); releaseSchedule(); await settle(); await settle();
  check('Weekly Schedule: account/college changes discard stale queries and never show the previous timetable', () => { assert.match(view.text(), /New account class/); assert.doesNotMatch(view.text(), /Profile class|UID class|Faculty code class/); });
  await view.close();

  reset(); globalThis.__RC_FIRESTORE_QUERY_GUARD = q => { scopeGuard(q); if (q.__collection === 'weeklySchedules') throw new Error('Permission denied'); };
  view = await mount(SCHEDULE);
  check('Weekly Schedule: query failure offers a visible retry, not an empty timetable', () => { assert.ok(view.byText('Retry schedule')); assert.match(view.q('[role="alert"]').textContent, /Failed to load/); assert.doesNotMatch(view.text(), /No weekly classes are assigned/); });
  globalThis.__RC_FIRESTORE_QUERY_GUARD = scopeGuard; await view.click(view.byText('Retry schedule'));
  check('Weekly Schedule: retry recovers the actual timetable', () => assert.match(view.text(), /3 total classes.*Profile class/));
  await view.close();

  reset(); globalThis.__RC_FIRESTORE_COLLECTIONS.weeklySchedules = [];
  view = await mount(SCHEDULE);
  check('Weekly Schedule: a successful empty response explains assignment/publishing, without claiming a load failure', () => { assert.match(view.text(), /No weekly classes are assigned.*timetable administrator/); assert.doesNotMatch(view.text(), /Failed to load/); assert.ok(view.q('button[aria-label="Refresh schedule"]')); });
  await view.close();

  reset(); globalThis.__RC_FIRESTORE_COLLECTIONS.students = Array.from({ length: 501 }, (_, i) => row(`s-${i}`, { collegeId: 'college-a', mentorId: 'FAC001', name: `Mentee ${i}` }));
  await assert.rejects(fetchStudentsByMentor(['FAC001'], 'college-a'), /too large/);
  check('Journey read caps: an incomplete roster is not presented as a complete mentor count', () => assert.ok(true));
  reset(); globalThis.__RC_FIRESTORE_COLLECTIONS.studentAssessments = Array.from({ length: 501 }, (_, i) => row(`s-${i}`, { collegeId: 'college-a', studentId: 's-name', status: 'graded', percentage: 80 }));
  await assert.rejects(fetchScoresByStudentIds(['s-name'], 'college-a'), /too many results/);
  check('Journey read caps: capped results do not produce partial performance conclusions', () => assert.ok(true));

  reset(); globalThis.__RC_FIRESTORE_COLLECTIONS.assessments = Array.from({ length: 51 }, (_, i) => row(`own-${i}`, { collegeId: 'college-a', createdBy: 'faculty-1', title: `Assessment ${i}`, createdAt: '2026-11-10' }));
  const timeline = await fetchFacultyTimelineFromRealData({ collegeId: 'college-a', ids: ['faculty-1'], emails: [user.email], names: [user.name] });
  check('Journey timeline: capped activity is explicitly marked as a limited summary', () => { assert.equal(timeline.limited, true); assert.equal(timeline.milestones.length, 15); });

  reset(); globalThis.__RC_FIRESTORE_COLLECTIONS.faculty.push(row('duplicate', profile));
  await assert.rejects(fetchFacultyProfile({ collegeId: 'college-a', uid: user.uid }), /More than one faculty profile/);
  check('faculty profiles: ambiguous identity links require repair instead of picking an arbitrary person', () => assert.ok(true));

  reset(); view = await mount('/src/modules/admin/pages/Journey.tsx');
  await view.click(view.byText('Faculty Journey'));
  check('admin Journey faculty tab: shares the corrected identity, summary and Teaching Record without legacy storage', () => { assert.equal(stat(view, 'Students Mentored'), '4'); assert.ok(view.q('section[aria-label="Teaching record"]')); assert.match(view.text(), /My UID assessment/); });
  await view.close();
  console.log(`\n${checks}/${checks} faculty portal regression checks passed.`);
} finally {
  for (const view of views) await view.close();
  for (const key of ['__RC_ROLE', '__RC_AUTH_USER', '__RC_AUTH_LOADING', '__RC_PATHNAME', '__RC_FIRESTORE_DOCS', '__RC_FIRESTORE_BY_PATH', '__RC_FIRESTORE_COLLECTIONS', '__RC_FIRESTORE_QUERY_GUARD', '__RC_CALLABLE_DATA', '__RC_CALLABLE_ERRORS', '__RC_CALLABLE_PAYLOADS']) delete globalThis[key];
  await server.close();
}
process.exit(process.exitCode || 0);
