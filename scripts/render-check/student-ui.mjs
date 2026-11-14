// Real student navigation, dashboard and illustrations; only the existing
// Firebase/router I/O boundary is stubbed. Run: npm run test:render:student-ui
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';
import postcss from 'postcss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const server = await createServer({
  root,
  configFile: path.join(root, 'scripts/render-check/vite.config.mts'),
  server: { middlewareMode: true, watch: null, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
  logLevel: 'error',
});
let checks = 0;
const check = (label, fn) => { fn(); console.log(`ok ${++checks} - ${label}`); };
const settle = async () => { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); }); };
const views = new Set();
const { LanguageProvider } = await server.ssrLoadModule('/src/shared/contexts/LanguageProvider.tsx');
const { AppThemeProvider: ThemeProvider } = await server.ssrLoadModule('/src/shared/contexts/ThemeProvider.tsx');
const { studentNavItemsForProfile, navItemsInGroup } = await server.ssrLoadModule('/src/modules/student/studentNav.ts');
const { translate } = await server.ssrLoadModule('/src/shared/i18n/index.ts');

async function mount(file, props = {}, providers = true) {
  const Component = (await server.ssrLoadModule(file)).default;
  const host = document.createElement('div');
  document.body.appendChild(host);
  const reactRoot = createRoot(host);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  let currentProps = props;
  const render = async (nextProps = currentProps) => {
    currentProps = nextProps;
    let element = React.createElement(Component, nextProps);
    if (providers) element = React.createElement(ThemeProvider, null, React.createElement(LanguageProvider, null, element));
    element = React.createElement(QueryClientProvider, { client: queryClient }, element);
    await act(async () => reactRoot.render(element));
    await settle();
  };
  const view = {
    host,
    q: (selector) => host.querySelector(selector),
    all: (selector) => [...host.querySelectorAll(selector)],
    text: () => host.textContent.replace(/\s+/g, ' '),
    visibleLinks: () => [...host.querySelectorAll('nav a')].filter((el) => !el.closest('[hidden]')),
    click: async (el) => {
      assert.ok(el, 'Expected a clickable element');
      await act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
      await settle();
    },
    rerender: render,
    close: async () => { await act(async () => reactRoot.unmount()); queryClient.clear(); host.remove(); views.delete(view); },
  };
  views.add(view);
  await render();
  return view;
}
const SIDEBAR = '/src/modules/student/components/StudentSidebar.tsx';
const HUB = '/src/modules/student/pages/StudentHubPage.tsx';
const DASHBOARD = '/src/modules/student/pages/StudentDashboard.tsx';
const toggle = (view, group) => view.q(`button[aria-controls$="-section-${group}"]`);
const openGroups = (view) => view.all('nav button[aria-expanded="true"]');
const visible = (view, href) => view.visibleLinks().some((el) => el.getAttribute('href') === href);
const reset = () => {
  localStorage.clear();
  globalThis.__RC_PATHNAME = '/student/dashboard';
  globalThis.__RC_ROLE = 'student';
  globalThis.__RC_CALLABLE_DATA = { getMyAcademicRiskAlerts: { alerts: [], checkedAt: null, truncated: false, canRefresh: false, canConfigure: false } };
  delete globalThis.__RC_STUDENT_DATA;
  document.documentElement.classList.remove('dark');
};

try {
  reset();
  let signedOut = 0;
  let view = await mount(SIDEBAR, { onSignOut: () => { signedOut++; } });
  check('sidebar: four native section buttons with correctly labelled panels', () => {
    for (const group of ['academics', 'practice', 'money', 'account']) {
      const button = toggle(view, group);
      assert.equal(button?.tagName, 'BUTTON');
      assert.equal(button.type, 'button');
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      assert.equal(panel?.getAttribute('role'), 'group');
      assert.equal(panel?.getAttribute('aria-labelledby'), button.id);
      assert.equal(panel.hidden, button.getAttribute('aria-expanded') !== 'true');
    }
  });
  check('sidebar: only Academics opens by default; Dashboard stays visible and current', () => {
    assert.equal(openGroups(view).length, 1);
    assert.equal(toggle(view, 'academics').getAttribute('aria-expanded'), 'true');
    assert.ok(visible(view, '/student/dashboard') && visible(view, '/student/attendance'));
    assert.ok(!visible(view, '/student/materials'));
    assert.equal(view.q('nav [aria-current="page"]').getAttribute('href'), '/student/dashboard');
  });
  check('sidebar: unread count is discoverable even with Account closed', () => {
    assert.match(toggle(view, 'account').textContent, /2 unread notifications/);
  });
  await view.click(toggle(view, 'practice'));
  check('sidebar: opening Learning closes Academics, persists choice and hides its links', () => {
    assert.equal(openGroups(view).length, 1);
    assert.ok(visible(view, '/student/materials') && !visible(view, '/student/attendance'));
    assert.ok(view.q('a[href="/student/attendance"]').closest('[hidden]'));
    assert.equal(localStorage.getItem('vriddhi-student-open-section'), 'practice');
  });
  await view.click(toggle(view, 'practice'));
  check('sidebar: a section can be closed completely without losing Dashboard', () => {
    assert.equal(openGroups(view).length, 0);
    assert.equal(localStorage.getItem('vriddhi-student-open-section'), 'none');
    assert.ok(visible(view, '/student/dashboard'));
  });
  await view.click(view.q('button[aria-label="Sign Out"]'));
  await view.click(view.q('button[aria-label="Dark Mode"]'));
  check('sidebar: sign out and real theme switching still work outside the accordion', () => {
    assert.equal(signedOut, 1);
    assert.ok(document.documentElement.classList.contains('dark'));
    assert.ok(view.q('button[aria-label="Light Mode"]'));
  });
  let installs = 0;
  const onInstall = () => { installs++; };
  window.addEventListener('vriddhi:pwa-install-request', onInstall);
  await view.click(view.q('button[aria-label="Install app"]'));
  window.removeEventListener('vriddhi:pwa-install-request', onInstall);
  check('sidebar: install button still dispatches the existing PWA install request', () => assert.equal(installs, 1));
  await act(async () => {
    const select = view.q('select');
    select.value = 'kn';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  check('sidebar: language control still translates destination labels', () => {
    assert.equal(view.q('a[href="/student/attendance"]').getAttribute('aria-label'), translate('kn', 'nav.attendance'));
  });
  await view.close();

  for (const [saved, expected] of [['practice', 'practice'], ['none', null], ['invalid-section', 'academics']]) {
    reset();
    localStorage.setItem('vriddhi-student-open-section', saved);
    view = await mount(SIDEBAR, { onSignOut() {} });
    check(`sidebar: restores ${saved} preference safely`, () => {
      assert.equal(openGroups(view).length, expected ? 1 : 0);
      if (expected) assert.equal(toggle(view, expected).getAttribute('aria-expanded'), 'true');
    });
    await view.close();
  }

  reset();
  globalThis.__RC_PATHNAME = '/student/fee-portal';
  view = await mount(SIDEBAR, { onSignOut() {} });
  check('sidebar: alias deep link opens Fees and marks its canonical destination current', () => {
    assert.equal(toggle(view, 'money').getAttribute('aria-expanded'), 'true');
    assert.equal(view.q('nav [aria-current="page"]').getAttribute('href'), '/student/fees');
    assert.ok(visible(view, '/student/fees'));
  });
  globalThis.__RC_PATHNAME = '/student/courses/genai-certification';
  await view.rerender();
  check('sidebar: route changes reveal the correct section and nested destination', () => {
    assert.equal(openGroups(view).length, 1);
    assert.equal(toggle(view, 'practice').getAttribute('aria-expanded'), 'true');
    assert.equal(view.q('nav [aria-current="page"]').getAttribute('href'), '/student/courses');
  });
  await view.click(toggle(view, 'practice'));
  globalThis.__RC_PATHNAME = '/student/courses/another-course';
  await view.rerender();
  check('sidebar: navigating inside a closed active section reopens it', () => assert.ok(visible(view, '/student/courses')));
  globalThis.__RC_PATHNAME = '/student/notifications';
  await view.rerender();
  check('sidebar: Account route shows the unread destination without losing its badge', () => {
    assert.ok(visible(view, '/student/notifications'));
    assert.match(view.q('nav [aria-current="page"]').getAttribute('aria-label'), /2 unread notifications/);
  });
  globalThis.__RC_PATHNAME = '/student/fee-portal';
  await view.rerender();
  check('sidebar: Back/Forward to another group reveals it again', () => assert.ok(visible(view, '/student/fees')));
  await view.close();

  reset();
  localStorage.setItem('vriddhi-student-collapsed', 'true');
  localStorage.setItem('vriddhi-student-open-section', 'practice');
  view = await mount(SIDEBAR, { onSignOut() {} });
  check('sidebar: compact rail exposes every permitted destination with an accessible name', () => {
    const expected = studentNavItemsForProfile({ course: 'BCA' }, false).filter((item) => !item.hub && item.id !== 'install-app').map((item) => item.path).sort();
    assert.deepEqual(view.visibleLinks().map((el) => el.getAttribute('href')).sort(), expected);
    assert.ok(view.visibleLinks().every((el) => el.getAttribute('aria-label')));
    assert.ok(view.all('button').every((el) => el.getAttribute('aria-label')));
  });
  await view.click(view.q('button[aria-label="Expand menu"]'));
  check('sidebar: returning from compact mode restores the chosen section', () => {
    assert.equal(openGroups(view).length, 1);
    assert.equal(toggle(view, 'practice').getAttribute('aria-expanded'), 'true');
    assert.equal(localStorage.getItem('vriddhi-student-collapsed'), 'false');
  });
  for (const [course, enabled, expected] of [['BCA', true, true], ['BBA', true, false], ['BCA', false, false]]) {
    globalThis.__RC_STUDENT_DATA = { profile: { name: 'Student', course }, codingLabEnabled: enabled };
    await view.rerender();
    check(`sidebar: Coding Lab visibility for ${course}, college enabled=${enabled}`, () => {
      assert.equal(!!view.q('a[href="/student/coding-lab"]'), expected);
    });
  }
  await view.close();

  reset();
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = (query) => ({ ...originalMatchMedia(query), matches: query === '(max-width: 1100px)' });
  try {
    localStorage.setItem('vriddhi-student-collapsed', 'true');
    view = await mount(SIDEBAR, { onSignOut() {} });
    check('sidebar: narrow desktop restores labels without expanding every section', () => {
      assert.ok(view.q('button[aria-label="Collapse menu"]'));
      assert.equal(openGroups(view).length, 1);
    });
    await view.close();
  } finally { window.matchMedia = originalMatchMedia; }

  reset();
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  try {
    view = await mount(SIDEBAR, { onSignOut() {} }, false);
    await view.click(toggle(view, 'practice'));
    await view.click(view.q('button[aria-label="Collapse menu"]'));
    check('sidebar: blocked storage does not break dropdowns or compact navigation', () => {
      assert.ok(view.q('button[aria-label="Expand menu"]'));
      assert.ok(visible(view, '/student/materials'));
    });
    await view.close();
  } finally { Object.defineProperty(globalThis, 'localStorage', storageDescriptor); }

  reset();
  const hubViews = [];
  for (const [group, scene] of [['academics', 'academics'], ['practice', 'learning']]) {
    view = await mount(HUB, { group });
    hubViews.push(view);
    check(`${scene} hub: decorative scene and every permitted tile are present`, () => {
      const svg = view.q('svg.portal-illustration');
      assert.equal(svg?.dataset.scene, scene);
      assert.equal(svg.getAttribute('aria-hidden'), 'true');
      assert.equal(svg.getAttribute('focusable'), 'false');
      assert.deepEqual(view.all('a').map((el) => el.getAttribute('href')).sort(), navItemsInGroup(group, { course: 'BCA' }, false).map((item) => item.path).sort());
      assert.ok(view.all('a .portal-interactive-icon').length > 0);
      assert.ok(!svg.querySelector('a, button, image'));
    });
  }
  check('illustrations: simultaneous scenes have unique SVG resource IDs and valid references', () => {
    const patterns = [...document.querySelectorAll('.portal-illustration pattern')];
    assert.equal(new Set(patterns.map((el) => el.id)).size, patterns.length);
    for (const svg of document.querySelectorAll('.portal-illustration')) {
      for (const el of svg.querySelectorAll('[fill^="url("]')) {
        const id = el.getAttribute('fill').match(/^url\(#(.+)\)$/)?.[1];
        assert.ok([...svg.querySelectorAll('[id]')].some((resource) => resource.id === id));
      }
    }
  });
  for (const hubView of hubViews) await hubView.close();

  reset();
  globalThis.__RC_ROLE = 'student';
  globalThis.__RC_CALLABLE_DATA = { getMyStudentAcademicContext: { enabled: false } };
  globalThis.__RC_STUDENT_DATA = {
    profile: { name: 'Bala Kumar', regNo: '21BCA045', course: 'BCA', batch: '2024-2027', accessEnd: '2027-06-30', accessProductName: 'Student Pack', accessDurationMonths: 12 },
    codingLabEnabled: true,
    attendance: { percentage: 88, presentClasses: 44, totalClasses: 50 },
    assessments: [{ id: 'test-a', title: 'Database Midterm', subject: 'DBMS', date: '2026-11-20' }],
    assignments: [{ id: 'assignment-a', title: 'ER Diagram', subject: 'DBMS', dueDate: '2026-11-18', status: 'pending' }],
    fees: { totalFees: 50000, paidFees: 40000, pendingFees: 10000 },
    schedule: [{ id: 'class-a', subject: 'Database Systems', startTime: '09:00', room: 'R-101' }],
    notifications: [{ id: 'notice-a', title: 'Library extended hours', message: 'Open until 6 pm', type: 'info', read: false }],
    warnings: ['Some records are still being refreshed.'],
  };
  view = await mount(DASHBOARD);
  check('dashboard: welcome scene preserves name, profile, access badge and assessment action', () => {
    assert.ok(view.q('header .portal-illustration[data-scene="dashboard"]'));
    assert.match(view.q('h1').textContent, /Welcome back, Bala/);
    assert.match(view.q('header').textContent, /21BCA045.*BCA.*2024-2027/);
    assert.match(view.q('header').textContent, /Student Pack/);
    assert.equal(view.q('header a').getAttribute('href'), '/student/assessments');
  });
  check('dashboard: real-data statistics, warnings and quick actions remain intact', () => {
    assert.match(view.text(), /88%/);
    assert.match(view.text(), /10,000/);
    assert.match(view.text(), /Some records are still being refreshed/);
    assert.ok(view.q('a[href="/student/coding-lab"] .portal-interactive-icon'));
    assert.match(view.text(), /Database Midterm/);
  });
  await view.click(view.all('button').find((el) => el.textContent === "Today's Schedule"));
  check('dashboard: schedule tab still shows its real-data content', () => assert.match(view.text(), /Database Systems/));
  await view.click(view.all('button').find((el) => /^Notifications/.test(el.textContent)));
  check('dashboard: notifications tab still shows its real-data content', () => assert.match(view.text(), /Library extended hours/));
  globalThis.__RC_STUDENT_DATA = { error: 'Student profile link is missing', profile: null };
  await view.rerender();
  check('dashboard: profile errors remain actionable, not hidden by decorative content', () => {
    assert.match(view.q('[role="alert"]').textContent, /Student profile link is missing/);
    assert.ok(!view.q('.portal-illustration'));
  });
  await view.close();

  const css = postcss.parse(readFileSync(path.join(root, 'src/shared/styles/portalExperience.css'), 'utf8'));
  check('motion: scoped reduced-motion rule disables both artwork and interactive animations', () => {
    const selectors = new Set();
    css.walkAtRules('media', (rule) => {
      if (!/prefers-reduced-motion:\s*reduce/.test(rule.params)) return;
      rule.walkRules((child) => {
        if (child.nodes.some((decl) => decl.prop === 'animation' && decl.value === 'none' && decl.important)) {
          child.selectors.forEach((selector) => selectors.add(selector));
        }
      });
    });
    for (const selector of ['.portal-illustration *', '.portal-motion-target *', '.student-nav-panel', '.student-sidebar-spacer']) assert.ok(selectors.has(selector));
  });
  check('motion: every automatic animation has a finite duration below five seconds', () => {
    css.walkDecls('animation', (decl) => {
      assert.ok(!/infinite/.test(decl.value));
      if (decl.value === 'none') return;
      const tokens = decl.value.split(/\s+/);
      const times = tokens.filter((token) => /^\d*\.?\d+s$/.test(token)).map(parseFloat);
      const count = Number(tokens.find((token) => /^\d+$/.test(token)) ?? 1);
      assert.ok(times[0] * count + (times[1] ?? 0) < 5, decl.toString());
    });
  });
  console.log(`\n${checks}/${checks} student UI render checks passed.`);
} finally {
  for (const view of views) await view.close();
  delete globalThis.__RC_PATHNAME;
  delete globalThis.__RC_STUDENT_DATA;
  delete globalThis.__RC_ROLE;
  delete globalThis.__RC_CALLABLE_DATA;
  await server.close();
}
