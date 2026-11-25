// Real sign-in UI and handlers with isolated Auth / reset-email I/O. Nothing
// signs in to Firebase, creates an account, or sends mail during these checks.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const server = await createServer({
  root,
  configFile: path.join(root, 'scripts/render-check/vite.config.mts'),
  server: { middlewareMode: true, watch: null, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
  logLevel: 'error',
  // Keep these aliases local to this runner: the rest of the render suite uses
  // its existing signed-in fixtures and must not inherit an anonymous session.
  resolve: { alias: [
    { find: '../context/AuthContext', replacement: path.join(root, 'scripts/render-check/stubs/loginContext.ts') },
    { find: /^firebase\/auth$/, replacement: path.join(root, 'scripts/render-check/stubs/loginRecovery.ts') },
  ] },
});
const { AppThemeProvider } = await server.ssrLoadModule('/src/shared/contexts/ThemeProvider.tsx');
const { LanguageProvider } = await server.ssrLoadModule('/src/shared/contexts/LanguageProvider.tsx');
const { dictionaries } = await server.ssrLoadModule('/src/shared/i18n/translations.ts');
const { LANGUAGE_STORAGE_KEY } = await server.ssrLoadModule('/src/shared/i18n/languages.ts');
const { IDLE_SIGNOUT_FLAG } = await server.ssrLoadModule('/src/shared/utils/idleTimeout.ts');
const views = new Set();
let checks = 0;
const check = (name, fn) => { fn(); console.log(`ok ${++checks} - ${name}`); };
const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); };
function reset() {
  localStorage.clear(); sessionStorage.clear();
  globalThis.__RC_SEARCH = '';
  globalThis.__RC_LOCATION_STATE = null;
  delete globalThis.__navigated;
  globalThis.__RC_LOGIN = { user: null, result: { uid: 'test-faculty', role: 'faculty' }, attempts: [], resets: [], signouts: 0 };
  return globalThis.__RC_LOGIN;
}
async function mount(portal) {
  const Comp = (await server.ssrLoadModule(`/src/modules/auth/pages/${portal === 'staff' ? 'Login' : 'StudentLogin'}.tsx`)).default;
  const host = document.createElement('div'); document.body.appendChild(host);
  const reactRoot = createRoot(host);
  const render = async () => {
    await act(async () => reactRoot.render(React.createElement(AppThemeProvider, null, React.createElement(LanguageProvider, null, React.createElement(Comp)))));
    await settle();
  };
  const view = {
    host, render, q: s => host.querySelector(s), all: s => [...host.querySelectorAll(s)], text: () => host.textContent.replace(/\s+/g, ' '),
    click: async el => { assert.ok(el); await act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))); await settle(); },
    type: async (el, value) => { assert.ok(el); await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); }); await settle(); },
    submit: async () => { await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); await settle(); },
    close: async () => { await act(async () => reactRoot.unmount()); host.remove(); views.delete(view); },
  };
  views.add(view); await render(); return view;
}
try {
  for (const portal of ['staff', 'student']) {
    const fixture = reset();
    const view = await mount(portal);
    check(`${portal}: shared illustrated layout, labelled inputs and the correct active portal`, () => {
      // The 3D campus is labelled for assistive tech rather than aria-hidden.
      // The floating greeting card beside it stays decorative.
      assert.ok(view.q('.auth-art svg.campus3d-svg[role="img"]'));
      assert.ok(view.q('.auth-art [role="group"][aria-label]'));
      // But it must not compete with the form: no rotation buttons, and no tab
      // stop before the email field someone came here to fill in.
      const art = view.q('.auth-art');
      assert.equal(art.querySelector('.campus3d-controls'), null, 'rotation controls belong on the landing page, not behind a sign-in form');
      assert.equal(art.querySelector('[role="group"]').getAttribute('tabindex'), '-1');
      assert.equal(view.q('.auth-art-note').getAttribute('aria-hidden'), 'true');
      assert.equal(view.q('nav [aria-current="page"]').textContent, portal === 'staff' ? 'Staff & Faculty' : 'Student Portal');
      assert.equal(view.q('nav a').getAttribute('href'), portal === 'staff' ? '/student/login' : '/login');
      for (const input of view.all('input')) assert.ok(view.q(`label[for="${input.id}"]`));
      assert.equal(view.q('input[type="password"]').autocomplete, 'current-password');
      assert.equal(view.q('.auth-footer a').getAttribute('href'), '/');
      assert.equal(fixture.attempts.length, 0);
      assert.equal(fixture.resets.length, 0);
    });
    await view.type(view.q('input[autocomplete="current-password"]'), 'dummy-test-password');
    await view.click(view.q('button[aria-label="Show password"]'));
    check(`${portal}: showing the password preserves its value and exposes the toggle state`, () => {
      assert.equal(view.q('input[autocomplete="current-password"]').type, 'text');
      assert.equal(view.q('input[autocomplete="current-password"]').value, 'dummy-test-password');
      assert.equal(view.q('button[aria-label="Hide password"]').getAttribute('aria-pressed'), 'true');
    });
    await view.click(view.q('button[aria-label="Hide password"]'));
    const forgot = view.q('form button[type="button"]:not([aria-label])');
    await view.click(forgot);
    check(`${portal}: empty-email recovery remains local and is announced`, () => {
      assert.match(view.q('[role="status"]').textContent, /Enter your account email above first/);
      assert.deepEqual(fixture.resets, []);
    });
    await view.type(view.q('input[type="email"]'), 'Student@Example.edu');
    await view.click(forgot);
    check(`${portal}: recovery still normalizes the address and reports the reset result`, () => {
      assert.deepEqual(fixture.resets, ['student@example.edu']);
      assert.match(view.q('[role="status"]').textContent, /Password reset link sent to student@example.edu/);
    });
    fixture.resetError = { code: 'auth/user-not-found' };
    await view.click(forgot);
    check(`${portal}: a recovery failure retains the generic non-enumerating message`, () => {
      assert.equal(view.q('[role="status"]').textContent, dictionaries.en['auth.forgotError']);
      assert.equal(forgot.disabled, false);
    });
    fixture.error = new Error('auth/invalid-credential');
    await view.submit();
    check(`${portal}: sign-in uses the entered credentials and announces a localized error`, () => {
      assert.deepEqual(fixture.attempts, [{ email: 'Student@Example.edu', password: 'dummy-test-password' }]);
      assert.equal(view.q('[role="alert"]').textContent, dictionaries.en['auth.invalidCredentials']);
      assert.equal(view.q('button[type="submit"]').disabled, false);
    });
    await view.close();

    reset(); sessionStorage.setItem(IDLE_SIGNOUT_FLAG, '1');
    let idle = await mount(portal);
    check(`${portal}: inactivity notice survives the redesign and consumes its flag`, () => {
      assert.match(idle.text(), /Signed out for inactivity/);
      assert.equal(sessionStorage.getItem(IDLE_SIGNOUT_FLAG), null);
    });
    await idle.close(); idle = await mount(portal);
    check(`${portal}: inactivity notice is not repeated on the next mount`, () => assert.doesNotMatch(idle.text(), /Signed out for inactivity/));
    await idle.close();

    for (const language of ['en', 'hi', 'kn', 'ta', 'te', 'ml']) {
      reset(); localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      const translated = await mount(portal);
      check(`${portal}: ${language} translates the new welcome, hero and submit copy`, () => {
        assert.ok(translated.q('h1').textContent.includes(dictionaries[language]['auth.heroTitle']));
        assert.ok(translated.q('h1').textContent.includes(dictionaries[language]['auth.heroAccent']));
        assert.equal(translated.q('h2').textContent, dictionaries[language]['auth.welcomeBack']);
        assert.equal(translated.q('button[type="submit"]').textContent.trim(), dictionaries[language][portal === 'staff' ? 'auth.signInStaff' : 'auth.signInStudent']);
      });
      await translated.close();
    }
  }

  for (const [role, target] of [['faculty', '/faculty/dashboard'], ['hod', '/admin/hod-dashboard'], ['principal', '/admin/dashboard']]) {
    reset().user = { uid: 'test-user', role };
    globalThis.__RC_SEARCH = '?role=principal';
    const view = await mount('staff');
    check(`staff: ${role} redirects by the verified role, never the landing-page hint`, () => {
      assert.equal(globalThis.__navigated, target);
      assert.match(view.text(), /Principal sign-in/);
    });
    await view.close();
  }
  reset().user = { uid: 'test-user', role: 'faculty' };
  globalThis.__RC_LOCATION_STATE = { from: { pathname: '/faculty/assignments' } };
  let view = await mount('staff');
  check('staff: an existing guarded return destination is preserved', () => assert.equal(globalThis.__navigated, '/faculty/assignments'));
  await view.close();

  let fixture = reset(); fixture.result = { uid: 'test-student', role: 'student' };
  view = await mount('staff'); await view.submit();
  check('staff: student credentials are still sent to the student entrance', () => assert.equal(globalThis.__navigated, '/student/login'));
  await view.close();

  fixture = reset();
  let complete;
  fixture.pending = new Promise(resolve => { complete = resolve; });
  view = await mount('staff'); await view.submit();
  check('staff: pending sign-in is disabled and retains an accessible loading name', () => {
    assert.equal(view.q('button[type="submit"]').disabled, true);
    assert.match(view.q('button[type="submit"]').textContent, /Loading/);
  });
  complete(); await settle(); await view.close();

  for (const [query, target] of [['', '/student/dashboard'], ['?next=courses', '/student/courses'], ['?next=https://example.com', '/student/dashboard'], ['?next=/student/courses', '/student/dashboard']]) {
    fixture = reset(); fixture.result = { uid: 'test-student', role: 'student' };
    globalThis.__RC_SEARCH = query;
    view = await mount('student'); await view.submit();
    check(`student: ${query || 'default sign-in'} retains the fixed, authorized destination`, () => assert.equal(globalThis.__navigated, target));
    await view.close();
  }
  fixture = reset(); fixture.result = { uid: 'test-staff', role: 'faculty' };
  view = await mount('student'); await view.submit();
  check('student: a non-student account is signed out, never granted a student workspace', () => {
    assert.equal(fixture.signouts, 1);
    assert.equal(globalThis.__navigated, undefined);
    assert.equal(view.q('[role="alert"]').textContent, dictionaries.en['auth.notStudent']);
  });
  await view.close();

  reset().loading = true;
  view = await mount('student');
  check('student: auth loading remains disabled with an accessible name', () => {
    assert.equal(view.q('button[type="submit"]').disabled, true);
    assert.match(view.q('button[type="submit"]').textContent, /Loading/);
  });
  await view.close();

  const css = readFileSync(path.join(root, 'src/modules/auth/styles/auth.css'), 'utf8');
  check('sign-in motion: reduced-motion override and finite greetings, without a perpetual decorative loop', () => {
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
    assert.doesNotMatch(css, /animation:[^;]*infinite/);
    assert.match(css, /\.auth-page \*.*animation: none !important/);
    // The 3D campus must honour reduced motion too, and its continuous rotation
    // is driven by requestAnimationFrame in JS, which the CSS override cannot
    // reach — so the component has to check the media query itself.
    const campusCss = readFileSync(path.join(root, 'src/shared/visuals/campus3d.css'), 'utf8');
    assert.doesNotMatch(campusCss, /animation:[^;]*infinite/);
    assert.match(campusCss, /prefers-reduced-motion:\s*reduce/);
    const campus = readFileSync(path.join(root, 'src/shared/visuals/Campus3D.tsx'), 'utf8');
    assert.match(campus, /prefers-reduced-motion: reduce/);
  });
  check('sign-in shell: no data SDK, risk hook, polling or remote illustration dependency', () => {
    const shell = readFileSync(path.join(root, 'src/modules/auth/components/AuthPageLayout.tsx'), 'utf8');
    assert.doesNotMatch(shell, /firebase\/|Firebase\/data|useAcademicRiskAlerts|setInterval|https?:\/\//);
  });
  console.log(`\n${checks}/${checks} sign-in render checks passed.`);
} finally {
  for (const view of views) await view.close();
  for (const key of ['__RC_LOGIN', '__RC_SEARCH', '__RC_LOCATION_STATE', '__navigated']) delete globalThis[key];
  await server.close();
}
process.exit(process.exitCode || 0);
