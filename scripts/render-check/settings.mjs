// Actual role settings and shared password handler; only Auth/Firestore/callable
// I/O is stubbed. No credential, account, email or production data is changed.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const server = await createServer({ root, configFile: path.join(root, 'scripts/render-check/vite.config.mts'),
  server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel: 'error',
  resolve: { alias: [{ find: /^firebase\/auth$/, replacement: path.join(root, 'scripts/render-check/stubs/passwordAuth.ts') }] },
});
const { AppThemeProvider } = await server.ssrLoadModule('/src/shared/contexts/ThemeProvider.tsx');
const { LanguageProvider } = await server.ssrLoadModule('/src/shared/contexts/LanguageProvider.tsx');
const { auth } = await server.ssrLoadModule('/scripts/render-check/stubs/firebaseConfig.ts');
const { toasts } = await server.ssrLoadModule('/scripts/render-check/stubs/notificationProvider.ts');
const originalAuth = auth.currentUser;
const views = new Set();
let checks = 0;
const check = (name, fn) => { fn(); console.log(`ok ${++checks} - ${name}`); };
const settle = async () => { await act(async () => new Promise(resolve => setTimeout(resolve, 20))); };
function reset(role) {
  localStorage.clear(); sessionStorage.clear();
  delete globalThis.__RC_FIRESTORE_WRITE_GUARD; delete globalThis.__RC_FIRESTORE_READ_GUARD; delete globalThis.__RC_FIRESTORE_QUERY_GUARD;
  toasts.length = 0;
  const uid = `settings-${role}`;
  const user = { uid, id: uid, role, name: 'Settings fixture', email: `${uid}@example.edu`, ...(role === 'superadmin' ? {} : { collegeId: 'college-a' }) };
  globalThis.__RC_ROLE = role; globalThis.__RC_AUTH_USER = user;
  globalThis.__RC_SEARCH = ''; globalThis.__RC_CALLABLE_PAYLOADS = []; globalThis.__RC_CALLABLE_ERRORS = {}; globalThis.__RC_CALLABLE_DATA = {};
  globalThis.__RC_CALLABLE_DATA.getMyStaffSettings = { uid, name: user.name, phone: '', email: user.email, department: 'Science', collegeId: user.collegeId || null, notificationPrefs: null, appearance: null };
  globalThis.__RC_CALLABLE_DATA.updateMyStaffProfile = { success: true, uid, authDisplayNameSynced: true };
  globalThis.__RC_CALLABLE_DATA.updateMyStudentProfile = { success: true, name: user.name, notificationPrefs: null };
  globalThis.__RC_WRITES = []; globalThis.__RC_FIRESTORE_DOCS = []; globalThis.__RC_FIRESTORE_COLLECTIONS = {};
  globalThis.__RC_FIRESTORE_BY_PATH = {};
  globalThis.__RC_PASSWORD_AUTH = { calls: [] };
  auth.currentUser = { uid, email: user.email, getIdToken: async force => { globalThis.__RC_PASSWORD_AUTH.calls.push({ name: 'getIdToken', force }); return 'fixture-token'; } };
  if (role === 'student') {
    globalThis.__RC_FIRESTORE_BY_PATH[`users/${uid}`] = { uid, role, collegeId: 'college-a', studentDocId: 'settings-student-profile' };
    globalThis.__RC_FIRESTORE_BY_PATH['students/settings-student-profile'] = { userId: uid, name: user.name, collegeId: 'college-a', regNo: 'TEST001' };
  }
  return globalThis.__RC_PASSWORD_AUTH;
}
async function mount(file, tab) {
  const Comp = typeof file === 'function' ? file : (await server.ssrLoadModule(file)).default;
  const host = document.createElement('div'); document.body.appendChild(host);
  const reactRoot = createRoot(host), client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const render = async () => {
    await act(async () => reactRoot.render(React.createElement(QueryClientProvider, { client }, React.createElement(AppThemeProvider, null, React.createElement(LanguageProvider, null, React.createElement(Comp))))));
    await settle(); await settle();
  };
  await render();
  const view = {
    render, button: text => [...host.querySelectorAll('button')].find(button => button.textContent.trim() === text),
    q: selector => host.querySelector(selector), all: selector => [...host.querySelectorAll(selector)], text: () => host.textContent.replace(/\s+/g, ' '),
    click: async element => { assert.ok(element, 'Expected a button'); await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))); await settle(); },
    type: async (element, value) => { assert.ok(element, 'Expected an input'); await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); }); await settle(); },
    select: async (element, value) => { assert.ok(element); await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(element, value); element.dispatchEvent(new Event('change', { bubbles: true })); }); await settle(); },
    submit: async () => { await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); await settle(); },
    close: async () => { await act(async () => reactRoot.unmount()); client.clear(); host.remove(); views.delete(view); },
  };
  views.add(view);
  if (tab) await view.click(view.button(tab));
  return view;
}
const deferred = () => { let resolve, reject; const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; }); return { promise, resolve, reject }; };
const FACULTY = '/src/modules/faculty/pages/FacultySettings.tsx';
const ADMIN = '/src/modules/admin/pages/Settings.tsx';
const STUDENT = '/src/modules/student/pages/StudentSettings.tsx';
function changeAccount(uid, name = 'Second Account') {
  const user = { ...globalThis.__RC_AUTH_USER, uid, id: uid, name, email: `${uid}@example.edu` };
  globalThis.__RC_AUTH_USER = user; auth.currentUser = { ...auth.currentUser, uid, email: user.email };
  globalThis.__RC_CALLABLE_DATA.getMyStaffSettings = { uid, name, phone: '999', email: user.email, department: 'History', collegeId: user.collegeId || null, notificationPrefs: null, appearance: null };
  globalThis.__RC_CALLABLE_DATA.updateMyStaffProfile = { success: true, uid, authDisplayNameSynced: true };
  return user;
}
try {
  for (const [role, file, tab] of [
    ['faculty', '/src/modules/faculty/pages/FacultySettings.tsx', 'Security'],
    ['student', '/src/modules/student/pages/StudentSettings.tsx', 'Security & Password'],
    ['superadmin', '/src/modules/admin/pages/Settings.tsx', 'Security'],
  ]) {
    const fixture = reset(role);
    const view = await mount(file, tab);
    globalThis.__RC_CALLABLE_PAYLOADS = [];
    check(`${role} security: uses the current-password reauthentication flow and platform 10-character minimum`, () => {
      assert.ok(view.q('input[autocomplete="current-password"]'));
      assert.equal(view.q('input[autocomplete="new-password"]').placeholder, 'Minimum 10 characters');
      assert.doesNotMatch(view.text(), /at least 6 characters/);
    });
    if (role !== 'student') check(`${role} security: MFA and session availability is explicit, with no fake enrollment/revoke controls`, () => {
      assert.match(view.text(), /Enrollment and status verification are not available/);
      assert.equal(view.q('[role="switch"]'), null);
      assert.equal(view.button('Revoke'), undefined);
      if (role === 'superadmin') assert.match(view.text(), /Session inventory and remote revocation are not available/);
    });
    check(`${role} security: each password field has a unique programmatic label`, () => {
      const inputs = view.all('form input');
      assert.equal(inputs.length, 3);
      assert.equal(new Set(inputs.map(input => input.id)).size, 3);
      for (const input of inputs) assert.ok(input.id && view.q(`label[for="${input.id}"]`));
    });
    await view.type(view.q('input[autocomplete="current-password"]'), 'fixture-current-123');
    const passwordFields = view.all('input[autocomplete="new-password"]');
    await view.type(passwordFields[0], 'short1'); await view.type(passwordFields[1], 'short1');
    await view.submit();
    check(`${role} security: short replacement passwords stop before any Auth or callable I/O`, () => {
      assert.match(view.q('[role="alert"]').textContent, /at least 10 characters/);
      assert.deepEqual(fixture.calls, []); assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS, []);
    });
    await view.type(passwordFields[0], 'fixture-replacement-456'); await view.type(passwordFields[1], 'fixture-replacement-456');
    fixture.reauthError = { code: 'auth/invalid-credential' };
    await view.submit();
    check(`${role} security: a wrong current password never rotates credentials or clears the forced-change flag`, () => {
      assert.match(view.q('[role="alert"]').textContent, /Current password is incorrect/);
      assert.deepEqual(fixture.calls.map(call => call.name), ['reauthenticate']);
      assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS, []);
    });
    delete fixture.reauthError; fixture.calls.length = 0;
    await view.submit();
    check(`${role} security: rotation verifies possession first, clears the one-time flag and refreshes claims`, () => {
      assert.deepEqual(fixture.calls.map(call => call.name), ['reauthenticate', 'updatePassword', 'getIdToken']);
      assert.equal(fixture.calls[0].credential.password, 'fixture-current-123');
      assert.equal(fixture.calls[1].password, 'fixture-replacement-456');
      assert.equal(fixture.calls[2].force, true);
      assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS.map(call => call.name), ['clearMyMustChangePassword']);
      assert.match(view.q('[role="status"]').textContent, /Password changed successfully/);
      assert.ok(view.all('form input').every(input => input.value === ''));
      assert.equal(globalThis.__RC_WRITES.length, 0);
    });
    await view.close();
  }
  reset('faculty');
  const notifications = await mount('/src/modules/faculty/pages/FacultySettings.tsx', 'Notifications');
  globalThis.__RC_CALLABLE_ERRORS.updateMyStaffProfile = { code: 'functions/unavailable', message: 'Settings service unavailable' };
  await notifications.click(notifications.all('button').find(button => button.textContent.trim() === 'Save Preferences'));
  check('faculty notifications: rejected server saves are announced without an unhandled rejection or false success', () => {
    assert.match(notifications.q('[role="alert"]').textContent, /Settings service unavailable/);
    assert.doesNotMatch(notifications.text(), /Saved!/);
    assert.equal(notifications.all('button').find(button => button.textContent.trim() === 'Save Preferences').disabled, false);
    assert.equal(globalThis.__RC_WRITES.length, 0);
  });
  await notifications.close();
  // Canonical transport is shared by every staff page/role. No target document,
  // role, college or management field may be assembled by these client forms.
  for (const role of ['faculty', 'admin', 'hod', 'principal', 'superadmin']) {
    const fixture = reset(role), file = role === 'faculty' ? FACULTY : ADMIN;
    globalThis.__RC_CALLABLE_DATA.getMyStaffSettings.name = 'Canonical Staff Name';
    globalThis.__RC_CALLABLE_DATA.getMyStaffSettings.phone = '1234567890';
    const view = await mount(file, role === 'faculty' ? 'Profile Details' : 'Profile');
    const name = view.q('#faculty-full-name, input[placeholder="Your full name"]');
    const phone = view.q('#faculty-phone, input[type="tel"]');
    check(`${role} profile: hydrates from the canonical callable, not faculty/admin Auth-UID shadow documents`, () => {
      assert.equal(name.value, 'Canonical Staff Name'); assert.equal(phone.value, '1234567890');
      assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.filter(call => call.name === 'getMyStaffSettings').length, 1);
      assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.find(call => call.name === 'getMyStaffSettings').payload, undefined);
      assert.equal(globalThis.__RC_WRITES.length, 0);
      if (role === 'faculty') for (const value of ['Science', 'college-a', 'settings-faculty@example.edu']) assert.ok(view.all('input[disabled]').some(input => input.value === value));
    });
    await view.type(name, '  Updated Staff Name  '); await view.type(phone, '+91 98765 43210');
    if (role === 'faculty') await view.submit(); else await view.click(view.button('Update Profile'));
    check(`${role} profile: sends only allowed self-edit fields and never updates Auth before the server save`, () => {
      assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS.filter(call => call.name === 'updateMyStaffProfile'), [{ name: 'updateMyStaffProfile', payload: { name: 'Updated Staff Name', phone: '+91 98765 43210' } }]);
      assert.deepEqual(fixture.calls, []); assert.deepEqual(globalThis.__RC_WRITES, []);
      assert.match(view.q('[role="status"]').textContent, /Profile updated successfully/);
    });
    await view.close();
  }

  for (const [role, file, base, prefs, label, cloudValue] of [
    ['faculty', FACULTY, 'vriddhi_faculty_prefs', { classes: false, attendance: true, assignments: true, announcements: false }, 'Class Schedule Updates', false],
    ['admin', ADMIN, 'vriddhi_admin_notifications', { emailAssessments: false, smsAttendance: true, weeklyReports: true, milestoneAlerts: false, maintenance: true, pushEnabled: false }, 'Email notifications for new assessments', false],
  ]) {
    reset(role);
    const uid = globalThis.__RC_AUTH_USER.uid;
    localStorage.setItem(base, JSON.stringify(Object.fromEntries(Object.keys(prefs).map(key => [key, true]))));
    localStorage.setItem(`${base}__${uid}`, JSON.stringify(Object.fromEntries(Object.keys(prefs).map(key => [key, true]))));
    globalThis.__RC_CALLABLE_DATA.getMyStaffSettings.notificationPrefs = prefs;
    const view = await mount(file, 'Notifications');
    const toggle = view.q(`[role="switch"][aria-label="${label}"]`);
    check(`${role} notifications: canonical cloud values win over both shared legacy and UID caches`, () => {
      assert.ok(toggle, view.text()); assert.equal(toggle.getAttribute('aria-checked'), String(cloudValue));
      assert.equal(globalThis.__RC_WRITES.length, 0);
    });
    await view.click(toggle);
    const updated = { ...prefs, [role === 'faculty' ? 'classes' : 'emailAssessments']: true };
    await view.click(view.button('Save Preferences'));
    check(`${role} notifications: a successful server save caches only known booleans for the signed-in UID`, () => {
      assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS.filter(call => call.name === 'updateMyStaffProfile').at(-1).payload, { notificationPrefs: updated });
      assert.deepEqual(JSON.parse(localStorage.getItem(`${base}__${uid}`)), updated);
      assert.equal(localStorage.getItem(base), null);
      assert.equal(localStorage.getItem(`${base}__unrelated-account`), null);
      assert.deepEqual(globalThis.__RC_WRITES, []);
    });
    await view.close();

    reset(role);
    localStorage.setItem(base, '{"classes":false,"emailAssessments":false}');
    globalThis.__RC_CALLABLE_ERRORS.getMyStaffSettings = { code: 'functions/unavailable', message: 'Cloud read unavailable' };
    const failed = await mount(file, 'Notifications');
    check(`${role} notifications: a failed load offers Retry, never adopts a global cache or overwrites unknown cloud preferences`, () => {
      assert.match(failed.q('[role="alert"]').textContent, /Cloud read unavailable/);
      assert.equal(failed.button('Save Preferences').disabled, true);
      assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.some(call => call.name === 'updateMyStaffProfile'), false);
    });
    delete globalThis.__RC_CALLABLE_ERRORS.getMyStaffSettings;
    globalThis.__RC_CALLABLE_DATA.getMyStaffSettings.notificationPrefs = prefs;
    await failed.click(failed.button('Retry'));
    check(`${role} notifications: Retry rehydrates canonical values without a write`, () => {
      assert.equal(failed.q('[role="alert"]'), null);
      assert.equal(failed.button('Save Preferences').disabled, false);
      assert.equal(failed.q(`[role="switch"][aria-label="${label}"]`).getAttribute('aria-checked'), String(cloudValue));
      assert.deepEqual(globalThis.__RC_WRITES, []);
    });
    await failed.close();
  }

  reset('faculty');
  globalThis.__RC_CALLABLE_DATA.updateMyStaffProfile.authDisplayNameSynced = false;
  let view = await mount(FACULTY, 'Profile Details');
  await view.type(view.q('#faculty-full-name'), 'Saved Canonical Name'); await view.submit();
  check('staff profile: a failed Auth mirror is an honest partial-sync notice and remains retryable', () => {
    assert.match(view.q('[role="status"]').textContent, /Profile saved.*could not sync; save again to retry/);
    assert.equal(view.q('button[type="submit"]').disabled, false);
  });
  await view.close();

  // Delayed I/O must not leak values, success/error banners or cache writes
  // across a mounted account change (including an Auth change before context).
  for (const role of ['faculty', 'admin']) {
    reset(role);
    const file = role === 'faculty' ? FACULTY : ADMIN, late = deferred();
    const previous = { ...globalThis.__RC_CALLABLE_DATA.getMyStaffSettings, name: 'Previous Account' };
    globalThis.__RC_CALLABLE_DATA.getMyStaffSettings = late.promise;
    view = await mount(file);
    changeAccount(`second-${role}`);
    await view.render();
    if (role !== 'faculty') await view.click(view.button('Profile'));
    await act(async () => late.resolve(previous)); await settle();
    check(`${role} settings: a delayed previous-account load cannot replace the current account`, () => {
      assert.equal(view.q('#faculty-full-name, input[placeholder="Your full name"]').value, 'Second Account');
      assert.doesNotMatch(view.text(), /Previous Account/);
      assert.deepEqual(globalThis.__RC_WRITES, []);
    });
    await view.close();

    reset(role);
    const base = role === 'faculty' ? 'vriddhi_faculty_prefs' : 'vriddhi_admin_notifications';
    view = await mount(file, 'Notifications');
    const oldUid = globalThis.__RC_AUTH_USER.uid, pending = deferred();
    globalThis.__RC_CALLABLE_DATA.updateMyStaffProfile = pending.promise;
    await view.click(view.button('Save Preferences'));
    check(`${role} notifications: duplicate saves and conflicting edits are disabled in flight`, () => {
      assert.equal(view.button('Save Preferences').disabled, true);
      assert.ok(view.all('[role="switch"]').every(input => input.disabled));
    });
    changeAccount(`second-save-${role}`); await view.render(); await view.click(view.button('Notifications'));
    await act(async () => pending.resolve({ success: true, uid: oldUid, authDisplayNameSynced: true })); await settle();
    check(`${role} notifications: old-account save completion cannot show success or write either account's cache`, () => {
      assert.doesNotMatch(view.text(), /Saved!|preferences saved!/);
      assert.equal(localStorage.getItem(`${base}__${oldUid}`), null);
      assert.equal(localStorage.getItem(`${base}__second-save-${role}`), null);
    });
    await view.close();
  }

  reset('faculty');
  view = await mount(FACULTY, 'Profile Details');
  auth.currentUser = { uid: 'switched-before-context' };
  await view.type(view.q('#faculty-full-name'), 'Must Not Save'); await view.submit();
  check('staff settings: an Auth switch before the React context changes blocks a stale form submission', () => {
    assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.some(call => call.name === 'updateMyStaffProfile'), false);
  });
  await view.close();

  reset('admin');
  const pendingProfile = deferred();
  view = await mount(ADMIN, 'Profile');
  globalThis.__RC_CALLABLE_DATA.updateMyStaffProfile = pendingProfile.promise;
  await view.click(view.button('Update Profile'));
  changeAccount('new-profile-account'); await view.render(); await view.click(view.button('Profile'));
  await act(async () => pendingProfile.reject(new Error('Late previous-account failure'))); await settle();
  check('admin settings: a late previous-account profile rejection never creates an error in the new account', () => {
    assert.equal(view.q('[role="alert"]'), null);
    assert.doesNotMatch(view.text(), /Late previous-account/);
    assert.equal(view.q('input[placeholder="Your full name"]').value, 'Second Account');
  });
  await view.close();

  for (const role of ['faculty', 'admin', 'student']) {
    reset(role);
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    let blockedView;
    try {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('Storage blocked'); } });
      blockedView = await mount(role === 'faculty' ? FACULTY : role === 'student' ? STUDENT : ADMIN, role === 'student' ? 'Alert Preferences' : 'Notifications');
      await blockedView.click(blockedView.button('Save Preferences'));
      check(`${role} settings: fully blocked device storage cannot crash hydration or turn a server save into failure`, () => {
        assert.match(blockedView.text(), role === 'admin' ? /Notification preferences saved!/ : /Saved!/);
        assert.deepEqual(globalThis.__RC_WRITES, []);
      });
    } finally {
      if (blockedView) await blockedView.close();
      Object.defineProperty(globalThis, 'localStorage', descriptor);
    }
  }

  reset('admin');
  globalThis.__RC_FIRESTORE_BY_PATH['colleges/college-a'] = { name: 'Fixture College', settings: { autoBackup: 'daily', academicYear: '2026-2027' } };
  view = await mount(ADMIN, 'Data & Backup');
  check('admin backup preference: hydrates the college value instead of always resetting to weekly', () => {
    assert.equal(view.q('select[aria-label="Automatic backup frequency"]').value, 'daily');
    assert.deepEqual(globalThis.__RC_WRITES, []);
  });
  await view.select(view.q('select[aria-label="Automatic backup frequency"]'), 'monthly');
  await view.click(view.button('General')); await view.click(view.button('Save Changes'));
  check('admin backup preference: saves the selected value with the existing college General workflow', () => {
    assert.equal(globalThis.__RC_WRITES.length, 1);
    assert.equal(globalThis.__RC_WRITES[0].path, 'colleges/college-a');
    assert.equal(globalThis.__RC_WRITES[0].data.settings.autoBackup, 'monthly');
    assert.match(view.q('[role="status"]').textContent, /General settings saved successfully/);
  });
  await view.close();

  reset('student');
  globalThis.__RC_FIRESTORE_BY_PATH['students/settings-student-profile'].apaarId = '123456789012';
  globalThis.__RC_FIRESTORE_BY_PATH['students/settings-student-profile'].notificationPrefs = { exams: false, fees: true, assignments: false, events: true };
  localStorage.setItem('vriddhi_notification_prefs', '{"exams":true}');
  localStorage.setItem('vriddhi_notification_prefs__settings-student', '{"exams":true}');
  view = await mount(STUDENT, 'Profile Details');
  check('student APAAR: existing canonical APAAR/ABC ID is hydrated for editing', () => assert.equal(view.q('#student-apaar-id').value, '123456789012'));
  await view.type(view.q('#student-full-name'), 'Updated Student');
  await view.type(view.q('#student-apaar-id'), '1234 5678-9012');
  globalThis.__RC_FIRESTORE_BY_PATH['students/settings-student-profile'].name = 'Updated Student';
  await view.submit();
  check('student APAAR: formatted IDs submit all twelve digits with the name, not a discarded field', () => {
    assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS.filter(call => call.name === 'updateMyStudentProfile').at(-1).payload, { name: 'Updated Student', apaarId: '123456789012' });
    assert.deepEqual(globalThis.__RC_WRITES, []);
  });
  await view.type(view.q('#student-apaar-id'), '');
  globalThis.__RC_FIRESTORE_BY_PATH['students/settings-student-profile'].apaarId = '';
  await view.submit();
  check('student APAAR: optional blank is sent explicitly to clear a previously saved ID', () => assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.filter(call => call.name === 'updateMyStudentProfile').at(-1).payload.apaarId, ''));
  const callsBeforeInvalid = globalThis.__RC_CALLABLE_PAYLOADS.length;
  await view.type(view.q('#student-apaar-id'), '123'); await view.submit();
  check('student APAAR: partial IDs fail visibly before any network write', () => {
    assert.match(view.q('[role="alert"]').textContent, /must be 12 digits/);
    assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.length, callsBeforeInvalid);
  });
  await view.click(view.button('Alert Preferences'));
  check('student notifications: cloud booleans override UID/global cache values', () => {
    assert.equal(view.q('input[aria-label="Exam & Assessment Reminders"]').checked, false);
    assert.equal(view.q('input[aria-label="Assignment Deadlines"]').checked, false);
  });
  await view.click(view.q('input[aria-label="Exam & Assessment Reminders"]'));
  await view.click(view.button('Save Preferences'));
  check('student notifications: canonical save updates only the UID-scoped validated cache', () => {
    assert.equal(JSON.parse(localStorage.getItem('vriddhi_notification_prefs__settings-student')).exams, true);
    assert.equal(localStorage.getItem('vriddhi_notification_prefs'), null);
    assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS.filter(call => call.name === 'updateMyStudentProfile').at(-1).payload, { notificationPrefs: { exams: true, fees: true, assignments: false, events: true } });
  });
  await view.close();
  reset('student');
  view = await mount(STUDENT, 'Alert Preferences');
  const pendingStudentPrefs = deferred();
  globalThis.__RC_CALLABLE_DATA.updateMyStudentProfile = pendingStudentPrefs.promise;
  await view.click(view.button('Save Preferences'));
  const nextStudent = changeAccount('second-student');
  nextStudent.collegeId = 'college-b';
  globalThis.__RC_FIRESTORE_BY_PATH['users/second-student'] = { uid: 'second-student', role: 'student', collegeId: 'college-b', studentDocId: 'second-student-profile' };
  globalThis.__RC_FIRESTORE_BY_PATH['students/second-student-profile'] = { userId: 'second-student', name: 'Second Student', apaarId: '999999999999', collegeId: 'college-b', notificationPrefs: { exams: false, fees: true, assignments: true, events: true } };
  await view.render(); await view.click(view.button('Alert Preferences'));
  await act(async () => pendingStudentPrefs.resolve({ success: true })); await settle();
  check('student settings: a delayed old-account preference save never updates the new account or either cache', () => {
    assert.equal(localStorage.getItem('vriddhi_notification_prefs__settings-student'), null);
    assert.equal(localStorage.getItem('vriddhi_notification_prefs__second-student'), null);
    assert.doesNotMatch(view.text(), /Saved!/);
    assert.equal(view.q('input[aria-label="Exam & Assessment Reminders"]').checked, false);
  });
  await view.click(view.button('Profile Details'));
  check('student settings: account switching resets APAAR and name to the new canonical profile', () => {
    assert.equal(view.q('#student-full-name').value, 'Second Student');
    assert.equal(view.q('#student-apaar-id').value, '999999999999');
  });
  await view.close();

  // This probes the shared hook without a keyed-page remount: the cancellation
  // and synchronous owner-tag protections must work for all its consumers.
  const { useStudentProfile } = await server.ssrLoadModule('/src/modules/student/hooks/useStudentProfile.ts');
  function StudentProfileProbe() {
    const state = useStudentProfile();
    return React.createElement('div', { 'data-loading': String(state.loading) }, state.profile?.name || state.error || 'No profile');
  }
  reset('student');
  const oldProfileRead = deferred();
  globalThis.__RC_FIRESTORE_READ_GUARD = ref => ref.__path === 'students/settings-student-profile' ? oldProfileRead.promise : undefined;
  view = await mount(StudentProfileProbe);
  changeAccount('hook-next-student');
  globalThis.__RC_FIRESTORE_BY_PATH['users/hook-next-student'] = { uid: 'hook-next-student', role: 'student', collegeId: 'college-a', studentDocId: 'hook-next-profile' };
  globalThis.__RC_FIRESTORE_BY_PATH['students/hook-next-profile'] = { userId: 'hook-next-student', name: 'Current Hook Student', collegeId: 'college-a' };
  await view.render();
  await act(async () => oldProfileRead.resolve()); await settle();
  check('student profile hook: a late previous-account read cannot overwrite a newer profile without remounting', () => {
    assert.equal(view.text(), 'Current Hook Student');
    assert.equal(view.q('[data-loading]').getAttribute('data-loading'), 'false');
  });
  globalThis.__RC_AUTH_USER = null; auth.currentUser = null; await view.render();
  check('student profile hook: sign-out immediately removes the last profile and leaves no stale loading state', () => {
    assert.equal(view.text(), 'No profile');
    assert.equal(view.q('[data-loading]').getAttribute('data-loading'), 'false');
  });
  await view.close();

  reset('admin');
  const exportRead = deferred();
  globalThis.__RC_FIRESTORE_BY_PATH['colleges/college-a'] = { name: 'Old College' };
  globalThis.__RC_FIRESTORE_QUERY_GUARD = q => q.__collection === 'students' ? exportRead.promise : undefined;
  view = await mount(ADMIN, 'Data & Backup');
  const createObjectURL = URL.createObjectURL, revokeObjectURL = URL.revokeObjectURL;
  let exportDownloads = 0;
  URL.createObjectURL = () => { exportDownloads++; return 'blob:offline-export'; }; URL.revokeObjectURL = () => {};
  await view.click(view.button('Export Full JSON'));
  changeAccount('new-export-account'); await view.render();
  await act(async () => exportRead.resolve()); await settle();
  check('admin exports: an old-account response cannot download data or announce a result after switching accounts', () => {
    assert.equal(exportDownloads, 0);
    assert.deepEqual(toasts, []);
    assert.deepEqual(globalThis.__RC_WRITES, []);
  });
  URL.createObjectURL = createObjectURL; URL.revokeObjectURL = revokeObjectURL;
  await view.close();
  console.log(`\n${checks}/${checks} role settings security and persistence checks passed.`);
} catch (error) {
  process.exitCode = 1; console.error(error);
} finally {
  for (const view of views) await view.close();
  auth.currentUser = originalAuth;
  delete globalThis.__RC_AUTH_USER; delete globalThis.__RC_PASSWORD_AUTH; delete globalThis.__RC_FIRESTORE_WRITE_GUARD; delete globalThis.__RC_FIRESTORE_READ_GUARD; delete globalThis.__RC_FIRESTORE_QUERY_GUARD;
  await server.close();
}
process.exit(process.exitCode || 0);
