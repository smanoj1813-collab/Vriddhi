// Actual settings pages, theme runtime and preference transport. Only the
// Auth/Firebase/router I/O boundaries use the existing isolated render stubs.
import assert from 'node:assert/strict';
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
const { calls } = await server.ssrLoadModule('/scripts/render-check/stubs/firestore.ts');
const { applyStoredAppearanceForUser } = await server.ssrLoadModule('/src/shared/theme/accent.ts');
const { DEFAULT_APPEARANCE, applyLocalAppearance } = await server.ssrLoadModule('/src/shared/theme/appearance.ts');
const views = new Set();
let checks = 0;
const check = (name, fn) => { fn(); console.log(`ok ${++checks} - ${name}`); };
const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 25)); }); };
const ownedPath = uid => `users/${uid}/preferences/appearance`;
const account = (uid, role = 'faculty') => ({ uid, id: uid, role, name: 'Appearance user', email: `${uid}@example.edu`, ...(role === 'superadmin' ? {} : { collegeId: 'college-a' }) });
function reset(role = 'faculty') {
  localStorage.clear(); calls.length = 0;
  document.documentElement.style.fontSize = '16px';
  globalThis.__RC_ROLE = role; globalThis.__RC_AUTH_USER = account(`${role}-appearance`, role);
  globalThis.__RC_SEARCH = ''; globalThis.__RC_WRITES = []; globalThis.__RC_CALLABLE_PAYLOADS = [];
  globalThis.__RC_CALLABLE_DATA = {}; globalThis.__RC_CALLABLE_ERRORS = {};
  globalThis.__RC_FIRESTORE_DOCS = []; globalThis.__RC_FIRESTORE_COLLECTIONS = {};
  globalThis.__RC_FIRESTORE_BY_PATH = {};
  delete globalThis.__RC_FIRESTORE_READ_GUARD; delete globalThis.__RC_FIRESTORE_WRITE_GUARD;
  if (role === 'student') {
    const uid = globalThis.__RC_AUTH_USER.uid;
    globalThis.__RC_FIRESTORE_BY_PATH[`users/${uid}`] = { uid, role, collegeId: 'college-a', studentDocId: 'appearance-student-profile' };
    globalThis.__RC_FIRESTORE_BY_PATH['students/appearance-student-profile'] = { userId: uid, name: 'Student user', collegeId: 'college-a', regNo: 'A001' };
  }
}
async function mount(file, props = {}) {
  const Comp = (await server.ssrLoadModule(file)).default;
  const host = document.createElement('div'); document.body.appendChild(host);
  const reactRoot = createRoot(host), client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  const render = async () => { await act(async () => reactRoot.render(React.createElement(QueryClientProvider, { client }, React.createElement(AppThemeProvider, null, React.createElement(LanguageProvider, null, React.createElement(Comp, props)))))); await settle(); await settle(); };
  const view = { q: selector => host.querySelector(selector), all: selector => [...host.querySelectorAll(selector)], text: () => host.textContent.replace(/\s+/g, ' '), render,
    button: text => [...host.querySelectorAll('button')].find(button => button.textContent.trim() === text),
    click: async element => { assert.ok(element, 'Expected clickable element'); assert.equal(element.disabled, false); await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))); await settle(); await settle(); },
    close: async () => { await act(async () => reactRoot.unmount()); client.clear(); host.remove(); views.delete(view); } };
  views.add(view); await render(); return view;
}
const select = async (element, value) => { assert.ok(element); await act(async () => { element.value = value; element.dispatchEvent(new Event('change', { bubbles: true })); }); await settle(); };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const PAGE = '/src/shared/components/AppearanceSettings.tsx';
try {
  for (const [role, file, tab] of [
    ['faculty', '/src/modules/faculty/pages/FacultySettings.tsx', 'Appearance'],
    ['student', '/src/modules/student/pages/StudentSettings.tsx', 'Appearance & Theme'],
    ['superadmin', '/src/modules/admin/pages/Settings.tsx', null],
  ]) {
    reset(role);
    let view = await mount(file);
    const uid = globalThis.__RC_AUTH_USER.uid;
    check(`${role} settings: appearance is reachable and Super Admin opens it without a college`, () => {
      if (tab) { assert.ok(view.button(tab)); assert.equal(calls.filter(call => call === `getDoc:${ownedPath(uid)}`).length, 0); }
      else { assert.equal(view.q('h2').textContent, 'Appearance'); assert.doesNotMatch(view.text(), /General Settings|No college ID found/); }
    });
    if (tab) await view.click(view.button(tab));
    check(`${role} appearance: eight accessible swatches, font choices and one lazy owner-document read`, () => {
      assert.equal(view.all('button[aria-label^="Accent Colour:"]').length, 8);
      assert.equal(view.q('select').options.length, 3);
      assert.equal(view.q('label[for]').htmlFor, view.q('select').id);
      assert.equal(calls.filter(call => call === `getDoc:${ownedPath(uid)}`).length, 1);
      assert.equal(globalThis.__RC_WRITES.length, 0);
      assert.ok(view.button('System'));
    });
    await view.click(view.q('button[title="Indigo"]'));
    await select(view.q('select'), 'large');
    check(`${role} appearance: swatch previews update account-local CSS without Firestore writes`, () => {
      assert.equal(document.documentElement.style.getPropertyValue('--accent-500'), '99 102 241');
      assert.equal(localStorage.getItem(`vriddhi_accent_color__${uid}`), '#6366f1');
      assert.equal(localStorage.getItem('vriddhi_accent_color'), null);
      assert.equal(view.q('button[title="Indigo"]').getAttribute('aria-pressed'), 'true');
      assert.equal(globalThis.__RC_WRITES.length, 0);
    });
    await view.click(view.button('Save Preferences'));
    check(`${role} appearance: explicit save writes only cosmetic fields to the private owner document`, () => {
      assert.equal(globalThis.__RC_WRITES.length, 1);
      assert.deepEqual(globalThis.__RC_WRITES[0], { path: ownedPath(uid), data: { accentColor: '#6366f1', fontSize: 'large', compactMode: false, animationsEnabled: true, updatedAt: { __stub: 'serverTimestamp' } } });
      assert.equal(document.documentElement.style.fontSize, '18px');
      assert.match(view.text(), /Appearance saved to your account/);
      assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.length, 0);
    });
    await view.click(view.button('Save Preferences'));
    check(`${role} appearance: repeated unchanged saves do not add writes or reads`, () => {
      assert.equal(globalThis.__RC_WRITES.length, 1);
      assert.equal(calls.filter(call => call === `getDoc:${ownedPath(uid)}`).length, 1);
    });
    await view.close();
  }

  reset();
  const uid = globalThis.__RC_AUTH_USER.uid;
  const legacy = { accentColor: '#8b5cf6', fontSize: 'small', compactMode: true };
  let view = await mount(PAGE, { legacyAppearance: legacy, showCompactMode: true, showAnimations: true });
  check('appearance migration: old profile values are restored without mutating the protected profile', () => {
    assert.equal(view.q('button[title="Violet"]').getAttribute('aria-pressed'), 'true');
    assert.equal(view.q('select').value, 'small');
    assert.equal(view.q('[role="switch"][aria-label="Compact Mode"]').getAttribute('aria-checked'), 'true');
    assert.equal(globalThis.__RC_WRITES.length, 0);
  });
  await view.click(view.button('Save Preferences'));
  check('appearance migration: first save creates only the new owner document', () => assert.equal(globalThis.__RC_WRITES[0].path, ownedPath(uid)));
  await view.close();

  reset('student');
  const cloud = { accentColor: '#06b6d4', fontSize: 'large', compactMode: true, animationsEnabled: false };
  globalThis.__RC_FIRESTORE_BY_PATH[ownedPath(globalThis.__RC_AUTH_USER.uid)] = cloud;
  view = await mount(PAGE, { legacyAppearance: legacy });
  check('appearance on another device: canonical cloud values override legacy/default values and refill the local cache', () => {
    assert.equal(view.q('button[title="Cyan"]').getAttribute('aria-pressed'), 'true');
    assert.equal(view.q('select').value, 'large');
    assert.equal(document.documentElement.style.fontSize, '18px');
    assert.equal(localStorage.getItem('vriddhi_accent_color__student-appearance'), '#06b6d4');
    assert.equal(globalThis.__RC_WRITES.length, 0);
  });
  await view.click(view.button('Save Preferences'));
  check('appearance cloud no-op: unchanged remote values, including hidden optional controls, are not rewritten', () => assert.equal(globalThis.__RC_WRITES.length, 0));
  await view.close();

  reset();
  globalThis.__RC_FIRESTORE_READ_GUARD = () => { throw new Error('Missing or insufficient permissions'); };
  view = await mount(PAGE);
  check('appearance read error: device preferences and an explicit retry remain available', () => {
    assert.match(view.q('[role="alert"]').textContent, /could not be loaded/);
    assert.ok(view.button('Retry'));
    assert.equal(view.q('button[title="Red"]').disabled, false);
  });
  delete globalThis.__RC_FIRESTORE_READ_GUARD;
  await view.click(view.button('Retry'));
  check('appearance retry: successful read clears the warning without a write', () => { assert.equal(view.q('[role="alert"]'), null); assert.equal(globalThis.__RC_WRITES.length, 0); });
  globalThis.__RC_FIRESTORE_WRITE_GUARD = () => { throw new Error('Missing or insufficient permissions'); };
  await view.click(view.q('button[title="Red"]')); await view.click(view.button('Save Preferences'));
  check('appearance write error: local colour remains applied, error is honest, and cloud success is never claimed', () => {
    assert.match(view.q('[role="alert"]').textContent, /could not sync/);
    assert.doesNotMatch(view.text(), /Appearance saved to your account/);
    assert.equal(document.documentElement.style.getPropertyValue('--accent-500'), '239 68 68');
    assert.equal(globalThis.__RC_WRITES.length, 0);
  });
  delete globalThis.__RC_FIRESTORE_WRITE_GUARD;
  await view.click(view.button('Save Preferences'));
  check('appearance write retry: one successful private save clears the previous error', () => { assert.equal(view.q('[role="alert"]'), null); assert.equal(globalThis.__RC_WRITES.length, 1); assert.match(view.text(), /Appearance saved to your account/); });
  await view.close();

  reset();
  const retryUid = globalThis.__RC_AUTH_USER.uid;
  globalThis.__RC_FIRESTORE_BY_PATH[ownedPath(retryUid)] = { ...DEFAULT_APPEARANCE };
  globalThis.__RC_FIRESTORE_READ_GUARD = () => { throw new Error('Temporarily offline'); };
  view = await mount(PAGE);
  delete globalThis.__RC_FIRESTORE_READ_GUARD;
  const pendingSave = deferred();
  globalThis.__RC_FIRESTORE_WRITE_GUARD = () => pendingSave.promise;
  await view.click(view.q('button[title="Violet"]'));
  await select(view.q('select'), 'large');
  await view.click(view.button('Save Preferences'));
  const readsBeforeRetry = calls.filter(call => call === `getDoc:${ownedPath(retryUid)}`).length;
  // A retry must not race an outstanding write and restore stale cloud data.
  const retryDuringSave = view.button('Retry');
  if (!retryDuringSave.disabled) await view.click(retryDuringSave);
  await act(async () => pendingSave.resolve()); await settle();
  check('appearance save/retry race: an old cloud read cannot replace the values just saved', () => {
    assert.equal(view.q('button[title="Violet"]').getAttribute('aria-pressed'), 'true');
    assert.equal(view.q('select').value, 'large');
    assert.equal(document.documentElement.style.fontSize, '18px');
    assert.equal(calls.filter(call => call === `getDoc:${ownedPath(retryUid)}`).length, readsBeforeRetry);
    assert.match(view.text(), /Appearance saved to your account/);
  });
  await view.close();

  reset();
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('Storage blocked'); } });
    applyLocalAppearance(globalThis.__RC_AUTH_USER.uid, { ...DEFAULT_APPEARANCE, accentColor: '#8b5cf6', fontSize: 'large' });
    check('appearance storage denial: validated cloud/font preferences still apply without a writable device cache', () => {
      assert.equal(document.documentElement.style.fontSize, '18px');
      assert.equal(document.documentElement.style.getPropertyValue('--accent-500'), '139 92 246');
    });
  } finally {
    Object.defineProperty(globalThis, 'localStorage', originalStorage);
  }

  reset();
  const lateRead = deferred();
  const uidA = globalThis.__RC_AUTH_USER.uid;
  globalThis.__RC_FIRESTORE_BY_PATH[ownedPath(uidA)] = { ...DEFAULT_APPEARANCE, accentColor: '#ef4444', fontSize: 'large' };
  globalThis.__RC_FIRESTORE_BY_PATH[ownedPath('account-b')] = { ...DEFAULT_APPEARANCE, accentColor: '#06b6d4' };
  globalThis.__RC_FIRESTORE_READ_GUARD = ref => ref.__path === ownedPath(uidA) ? lateRead.promise : undefined;
  view = await mount(PAGE);
  globalThis.__RC_AUTH_USER = account('account-b', 'student'); await view.render();
  await act(async () => lateRead.resolve()); await settle();
  check('shared browser: a delayed account-A load cannot overwrite account-B state, CSS or cached preferences', () => {
    assert.equal(view.q('button[title="Cyan"]').getAttribute('aria-pressed'), 'true');
    assert.equal(document.documentElement.style.getPropertyValue('--accent-500'), '6 182 212');
    assert.equal(document.documentElement.style.fontSize, '16px');
    assert.equal(localStorage.getItem('vriddhi_accent_color__account-b'), '#06b6d4');
  });
  await view.close();

  reset();
  const lateWrite = deferred();
  view = await mount(PAGE);
  await view.click(view.q('button[title="Violet"]'));
  globalThis.__RC_FIRESTORE_WRITE_GUARD = () => lateWrite.promise;
  await view.click(view.button('Save Preferences'));
  globalThis.__RC_AUTH_USER = account('account-c', 'superadmin');
  globalThis.__RC_FIRESTORE_BY_PATH[ownedPath('account-c')] = { ...DEFAULT_APPEARANCE, accentColor: '#06b6d4' };
  await view.render();
  await act(async () => lateWrite.resolve()); await settle();
  check('shared browser: a delayed account-A save cannot show success or reapply A colours after switching to C', () => {
    assert.equal(view.q('button[title="Cyan"]').getAttribute('aria-pressed'), 'true');
    assert.doesNotMatch(view.text(), /Appearance saved to your account/);
    assert.equal(document.documentElement.style.getPropertyValue('--accent-500'), '6 182 212');
    assert.equal(localStorage.getItem('vriddhi_accent_color__account-c'), '#06b6d4');
  });
  await view.close();

  reset();
  localStorage.setItem('vriddhi_font_size__account-a', 'large');
  await act(async () => applyStoredAppearanceForUser('account-a'));
  assert.equal(document.documentElement.style.fontSize, '18px');
  await act(async () => applyStoredAppearanceForUser('new-account'));
  check('shared browser: an account with no stored font size resets the previous user\'s enlarged font', () => assert.equal(document.documentElement.style.fontSize, '16px'));
  await act(async () => applyStoredAppearanceForUser(null));
  check('sign-out resets account colour and size to defaults', () => { assert.equal(document.documentElement.style.fontSize, '16px'); assert.equal(document.documentElement.style.getPropertyValue('--accent-500'), '20 184 166'); });

  reset('superadmin');
  view = await mount(PAGE);
  const { dictionaries } = await server.ssrLoadModule('/src/shared/i18n/translations.ts');
  const { SUPPORTED_LANGUAGES } = await server.ssrLoadModule('/src/shared/i18n/index.ts');
  for (const language of SUPPORTED_LANGUAGES) {
    await view.click(view.all('button').find(button => button.textContent.startsWith(language.nativeName)));
    check(`appearance translations: ${language.code} headings, colour controls, fonts and Save remain operable`, () => {
      assert.equal(view.q('h2').textContent, dictionaries[language.code]['settings.appearance']);
      assert.equal(view.all(`button[aria-label^="${dictionaries[language.code]['settings.accentColor']}:"]`).length, 8);
      assert.equal(view.q('select').options[0].textContent, `${dictionaries[language.code]['settings.fontSmall']} (14px)`);
      assert.ok(view.button(dictionaries[language.code]['common.savePreferences']));
      assert.equal(globalThis.__RC_WRITES.length, 0);
    });
  }
  await view.close();

  reset('superadmin');
  const { toasts } = await server.ssrLoadModule('/scripts/render-check/stubs/notificationProvider.ts');
  toasts.length = 0;
  globalThis.__RC_FIRESTORE_BY_PATH[ownedPath(globalThis.__RC_AUTH_USER.uid)] = { ...DEFAULT_APPEARANCE, accentColor: '#8b5cf6', fontSize: 'large' };
  view = await mount('/src/modules/admin/pages/Settings.tsx');
  await view.click(view.button('Data & Backup'));
  globalThis.confirm = () => false;
  await view.click(view.button('Reset Appearance'));
  check('appearance reset: cancellation neither writes nor clears the saved colour', () => {
    assert.equal(globalThis.__RC_WRITES.length, 0);
    assert.equal(localStorage.getItem('vriddhi_accent_color__superadmin-appearance'), '#8b5cf6');
  });
  globalThis.confirm = () => true;
  await view.click(view.button('Reset Appearance'));
  check('appearance reset: defaults are applied locally and saved to the same private cloud document', () => {
    assert.equal(globalThis.__RC_WRITES.length, 1);
    assert.deepEqual(globalThis.__RC_WRITES[0], { path: ownedPath('superadmin-appearance'), data: { ...DEFAULT_APPEARANCE, updatedAt: { __stub: 'serverTimestamp' } } });
    assert.equal(document.documentElement.style.fontSize, '16px');
    assert.equal(localStorage.getItem('vriddhi_accent_color__superadmin-appearance'), DEFAULT_APPEARANCE.accentColor);
    assert.equal(toasts.at(-1), 'success:Appearance reset to defaults');
  });
  globalThis.__RC_FIRESTORE_WRITE_GUARD = () => { throw new Error('Permission denied'); };
  await view.click(view.button('Reset Appearance'));
  check('appearance reset: cloud errors produce an honest error toast, not false sync success', () => {
    assert.equal(globalThis.__RC_WRITES.length, 1);
    assert.match(toasts.at(-1), /^error:.*could not be synced/);
  });
  await view.close(); delete globalThis.confirm;

  reset(); globalThis.__RC_AUTH_USER = null;
  view = await mount(PAGE);
  check('signed-out appearance never reads/writes another account or presents editable controls', () => { assert.equal(view.all('button').length, 0); assert.equal(calls.length, 0); assert.equal(globalThis.__RC_WRITES.length, 0); });
  const api = await server.ssrLoadModule('/src/shared/services/appearancePreferences.ts');
  await assert.rejects(api.loadAppearancePreferences(''), /signed-in account/);
  await assert.rejects(api.saveAppearancePreferences('uid/other', DEFAULT_APPEARANCE), /signed-in account/);
  check('appearance transport rejects missing or path-injected account IDs before any I/O', () => assert.equal(calls.length, 0));
  await view.close();
  console.log(`\n${checks}/${checks} appearance regression checks passed.`);
} catch (error) {
  process.exitCode = 1; console.error(error);
} finally {
  for (const view of views) await view.close();
  delete globalThis.__RC_AUTH_USER; delete globalThis.__RC_FIRESTORE_READ_GUARD; delete globalThis.__RC_FIRESTORE_WRITE_GUARD;
  await server.close();
}
process.exit(process.exitCode || 0);
