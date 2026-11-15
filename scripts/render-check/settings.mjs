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
const originalAuth = auth.currentUser;
const views = new Set();
let checks = 0;
const check = (name, fn) => { fn(); console.log(`ok ${++checks} - ${name}`); };
const settle = async () => { await act(async () => new Promise(resolve => setTimeout(resolve, 20))); };
function reset(role) {
  localStorage.clear(); sessionStorage.clear();
  delete globalThis.__RC_FIRESTORE_WRITE_GUARD;
  const uid = `settings-${role}`;
  const user = { uid, id: uid, role, name: 'Settings fixture', email: `${uid}@example.edu`, ...(role === 'superadmin' ? {} : { collegeId: 'college-a' }) };
  globalThis.__RC_ROLE = role; globalThis.__RC_AUTH_USER = user;
  globalThis.__RC_SEARCH = ''; globalThis.__RC_CALLABLE_PAYLOADS = []; globalThis.__RC_CALLABLE_ERRORS = {}; globalThis.__RC_CALLABLE_DATA = {};
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
  const Comp = (await server.ssrLoadModule(file)).default;
  const host = document.createElement('div'); document.body.appendChild(host);
  const reactRoot = createRoot(host), client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  await act(async () => reactRoot.render(React.createElement(QueryClientProvider, { client }, React.createElement(AppThemeProvider, null, React.createElement(LanguageProvider, null, React.createElement(Comp))))));
  await settle(); await settle();
  const view = {
    q: selector => host.querySelector(selector), all: selector => [...host.querySelectorAll(selector)], text: () => host.textContent.replace(/\s+/g, ' '),
    click: async element => { assert.ok(element, 'Expected a button'); await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))); await settle(); },
    type: async (element, value) => { assert.ok(element, 'Expected an input'); await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); }); await settle(); },
    submit: async () => { await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); await settle(); },
    close: async () => { await act(async () => reactRoot.unmount()); client.clear(); host.remove(); views.delete(view); },
  };
  views.add(view);
  await view.click(view.all('button').find(button => button.textContent.trim() === tab));
  return view;
}
try {
  for (const [role, file, tab] of [
    ['faculty', '/src/modules/faculty/pages/FacultySettings.tsx', 'Security'],
    ['student', '/src/modules/student/pages/StudentSettings.tsx', 'Security & Password'],
    ['superadmin', '/src/modules/admin/pages/Settings.tsx', 'Security'],
  ]) {
    const fixture = reset(role);
    const view = await mount(file, tab);
    check(`${role} security: uses the current-password reauthentication flow and platform 10-character minimum`, () => {
      assert.ok(view.q('input[autocomplete="current-password"]'));
      assert.equal(view.q('input[autocomplete="new-password"]').placeholder, 'Minimum 10 characters');
      assert.doesNotMatch(view.text(), /at least 6 characters/);
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
  globalThis.__RC_FIRESTORE_WRITE_GUARD = () => { throw new Error('Missing or insufficient permissions'); };
  await notifications.click(notifications.all('button').find(button => button.textContent.trim() === 'Save Preferences'));
  check('faculty notifications: rejected profile writes are announced without an unhandled rejection or false success', () => {
    assert.match(notifications.q('[role="alert"]').textContent, /Missing or insufficient permissions/);
    assert.doesNotMatch(notifications.text(), /Saved!/);
    assert.equal(notifications.all('button').find(button => button.textContent.trim() === 'Save Preferences').disabled, false);
    assert.equal(globalThis.__RC_WRITES.length, 0);
  });
  await notifications.close();
  console.log(`\n${checks}/${checks} role settings security checks passed.`);
} catch (error) {
  process.exitCode = 1; console.error(error);
} finally {
  for (const view of views) await view.close();
  auth.currentUser = originalAuth;
  delete globalThis.__RC_AUTH_USER; delete globalThis.__RC_PASSWORD_AUTH; delete globalThis.__RC_FIRESTORE_WRITE_GUARD;
  await server.close();
}
process.exit(process.exitCode || 0);
