// Mounts the public landing page in jsdom and asserts on the 3D hero that now
// leads it: a real projected campus (not a flat SVG), labelled and keyboard
// operable, honest about motion preferences, and — the point of the exercise —
// carrying no new runtime dependency, network request or paid service.
//
// Run with: npm run test:render:landing
import { createServer } from 'vite';
import path from 'path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

const server = await createServer({
  configFile: path.resolve(here, 'vite.config.mts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true, include: [] },
});

let checks = 0;
let passed = 0;
const failures = [];
function check(label, cond, detail = '') {
  checks += 1;
  if (cond) {
    passed += 1;
    console.log(`ok ${checks} - ${label}`);
  } else {
    failures.push(label);
    console.log(`not ok ${checks} - ${label}${detail ? `\n  ${detail.slice(0, 400)}` : ''}`);
  }
}

const host = document.createElement('div');
document.body.appendChild(host);
const reactRoot = createRoot(host);

try {
  const LandingModule = await server.ssrLoadModule('/src/modules/landing/LandingPage.tsx');
  await act(async () => { reactRoot.render(React.createElement(LandingModule.default)); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 80)); });

  const svg = host.querySelector('.landing-hero-art svg.campus3d-svg');

  check('landing hero: the 3D campus replaces the flat illustration', !!svg, 'no svg.campus3d-svg under .landing-hero-art');
  check('landing hero: the campus is real projected geometry, not a placeholder', (svg?.querySelectorAll('polygon').length ?? 0) > 200,
    `only ${svg?.querySelectorAll('polygon').length ?? 0} polygons`);
  check('landing hero: nothing clips outside the viewBox at the composed angle', (() => {
    const box = svg?.getAttribute('viewBox');
    return box === '0 0 1000 660';
  })(), `viewBox was ${svg?.getAttribute('viewBox')}`);

  // Depth is real: faces are painted with a range of shades, not one flat fill.
  const fills = new Set([...host.querySelectorAll('.landing-hero-art polygon')].map((node) => node.getAttribute('fill')));
  check('landing hero: faces are lit and depth-tinted, so the scene reads as 3D', fills.size > 25, `only ${fills.size} distinct fills`);

  // Accessibility: the stage is labelled and reachable, and the rotation
  // controls are named buttons rather than bare icons.
  const stage = host.querySelector('.landing-hero-art [role="group"]');
  check('landing hero: the interactive stage has an accessible name', /drag/i.test(stage?.getAttribute('aria-label') ?? ''));
  check('landing hero: keyboard users can reach the stage', stage?.tabIndex === 0);
  check('landing hero: rotation controls are labelled', ['Rotate campus left', 'Rotate campus right', 'Reset the campus view to the front']
    .every((label) => !!host.querySelector(`.landing-hero-art [aria-label="${label}"]`)));
  check('landing hero: the angle is exposed as a bounded slider', (() => {
    const dial = host.querySelector('.landing-hero-art [role="slider"]');
    if (!dial) return false;
    const now = Number(dial.getAttribute('aria-valuenow'));
    return now >= Number(dial.getAttribute('aria-valuemin')) && now <= Number(dial.getAttribute('aria-valuemax'));
  })());

  // The headline still owns the page's meaning; the illustration is decorative
  // geometry behind readable copy.
  check('landing hero: the headline and calls to action survive beside the artwork', (() => {
    const heading = host.querySelector('#hero-heading')?.textContent ?? '';
    const actions = host.querySelectorAll('.landing-hero-actions a').length;
    return heading.includes('Less busywork') && actions >= 2;
  })());

  // ── The cost claims, verified rather than asserted ──────────────────────
  const campus = fs.readFileSync(path.join(root, 'src/shared/visuals/Campus3D.tsx'), 'utf8');
  const engine = fs.readFileSync(path.join(root, 'src/shared/visuals/campusScene.ts'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/shared/visuals/campus3d.css'), 'utf8');
  const all = campus + engine + css;

  check('no runtime network dependency: no URL, fetch or remote asset in the hero', !/https?:\/\//.test(campus + engine) && !/fetch\(|XMLHttpRequest|new Image\(/.test(all));
  check('no extra package: no three.js / WebGL / canvas library is imported', (() => {
    // Match import/require statements only: the source *documents* that it does
    // not use three.js, and a naive text search would flag that prose.
    const imports = [...(campus + engine).matchAll(/(?:from\s+|require\()\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    const offending = imports.filter((id) => /^(three|@react-three|babylon|@babylonjs|gl-matrix|d3-3d|canvas|regl|ogl|three-gl)/.test(id));
    return offending.length === 0;
  })(), 'a 3D library import slipped in');
  check('no paid service: no analytics, billing or third-party renderer is called', !/stripe|analytics|gtag|sentry|vercel|cloudinary|sketchfab/i.test(all));
  check('the 3D scene is confined to the public sign-in surfaces, never a signed-in workspace', (() => {
    // Walk src/ and find every module that *imports* Campus3D. Only the landing
    // page and the sign-in shell may: a signed-in workspace must not ship an
    // animated hero behind a form someone is trying to read.
    const importers = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === '__tests__') continue;
          walk(full);
        } else if (/\.tsx?$/.test(entry.name)) {
          const body = fs.readFileSync(full, 'utf8');
          if (/^\s*import[^;]*from\s+['"][^'"]*Campus3D['"]/m.test(body)) importers.push(full);
        }
      }
    };
    walk(path.join(root, 'src'));
    const relative = importers
      .map((file) => path.relative(path.join(root, 'src'), file).split(path.sep).join('/'))
      .sort();
    return relative.length === 2
      && relative[0] === 'modules/auth/components/AuthPageLayout.tsx'
      && relative[1] === 'modules/landing/LandingPage.tsx';
  })(), 'a workspace route imports the animated hero');

  // ── Motion policy ──────────────────────────────────────────────────────
  check('styling: the component actually imports its stylesheet', /import ['"]\.\/campus3d\.css['"]/.test(campus),
    'campus3d.css exists but nothing imports it, so the scene ships unstyled');
  check('motion: the scene has a scoped reduced-motion override', /prefers-reduced-motion:\s*reduce/.test(css));
  check('motion: no perpetual CSS animation runs the illustration', !/animation:[^;]*infinite/.test(css));
  check('motion: every automatic animation ends within five seconds', (() => {
    // The repo's rule (asserted for the student portal): no infinite CSS
    // animation, and duration x iteration + delay stays under five seconds.
    // CI caught a 9s cloud drift and a 5.2s spark loop here; keep it honest.
    const failures = [];
    for (const match of css.matchAll(/animation:\s*([^;]+);/g)) {
      const value = match[1].trim();
      if (value === 'none') continue;
      const tokens = value.split(/\s+/);
      const times = tokens.filter((token) => /^\d*\.?\d+s$/.test(token)).map(parseFloat);
      const count = Number(tokens.find((token) => /^\d+$/.test(token)) ?? 1);
      const duration = times[0] ?? 0;
      const delay = times[1] ?? 0;
      if (!(duration * count + delay < 5)) failures.push(value);
    }
    return failures.length === 0;
  })(), 'an entrance animation runs longer than five seconds');
  check('motion: the idle drift honours the preference in JavaScript too, not just CSS', /prefers-reduced-motion: reduce/.test(campus) && /reducedMotion/.test(campus));
  check('motion: the drift pauses when the tab is hidden', /visibilitychange/.test(campus));
  check('motion: the drift pauses when the hero is scrolled out of view', /IntersectionObserver/.test(campus));

  // The mobile-preview tabs further down the page own a polite live region
  // already. The hero must not add another: an idle animation that announces
  // itself would talk over a screen-reader user who is reading the headline.
  const heroLive = host.querySelectorAll('.landing-hero [aria-live], .landing-hero [role="status"]');
  check('a11y: the animated hero announces nothing by itself', heroLive.length === 0, `${heroLive.length} live region(s) inside the hero`);

  // Portability, one layer down from the bundler: on a case-insensitive
  // filesystem (Windows, macOS) two modules whose names differ only in casing
  // are the same file. This bit twice — a `campus3d.ts` beside `Campus3D.tsx`
  // made `import Campus3D from './Campus3D'` resolve to the engine ("no default
  // export"), and `campus3d.test.ts` beside `Campus3D.test.ts` made a Windows
  // checkout write both specs to one path, corrupting the working tree. Linux
  // CI cannot see either. Walk all of src so no folder is exempt.
  const MODULE = /\.(mjs|cjs|js|jsx|ts|tsx)$/i;
  const byStem = new Map();
  const walk = (dir) => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') walk(full);
        continue;
      }
      if (!MODULE.test(entry.name)) continue;
      const key = `${path.relative(root, dir)}:${entry.name.replace(MODULE, '').toLowerCase()}`;
      byStem.set(key, [...(byStem.get(key) ?? []), path.relative(root, full)]);
    }
  };
  walk(path.join(root, 'src'));
  const collisions = [...byStem.values()].filter((group) => group.length > 1).map((group) => group.join(' / '));
  check('portability: no two modules in one folder differ only in letter case', collisions.length === 0, collisions.join(', '));

  // The campus keeps the visitor's local time. Three things must hold for that to
  // stay free: the engine never reads a clock itself (so it stays pure and
  // testable), the component asks the browser once rather than per frame, and
  // nothing new animates or loads. Note: these are flat checks — calling
  // `check()` inside another `check()` makes the inner call pass its condition
  // as the *label* and always report success.
  const stripComments = (source) =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const engineSource = stripComments(fs.readFileSync(path.join(root, 'src/shared/visuals/campusScene.ts'), 'utf8'));
  const clockAccess = ['new Date(', 'Date.now(', 'performance.now(', 'getHours('].filter((pattern) => engineSource.includes(pattern));
  check('local time: no clock access inside the pure scene engine', clockAccess.length === 0, clockAccess.join(', '));

  const componentSource = stripComments(campus);
  check('local time: the hour comes from a timed effect, not a render', /setInterval/.test(componentSource) && /getHours/.test(componentSource));
  const driftBody = componentSource.slice(componentSource.indexOf('const tick = (now: number)'));
  check('local time: the drift loop never reads a clock', !/getHours|new Date\(/.test(driftBody.slice(0, 1200)));

  check('local time: no animation is declared for it', !/animation:[^;]*(dusk|dawn|night|lit|hour)/i.test(css));
  check('local time: no request and no asset', !/fetch\(|https?:\/\//.test(componentSource));

} finally {
  await act(async () => reactRoot.unmount());
  host.remove();
  await server.close();
}

console.log(`\n${passed}/${checks} landing 3D hero checks passed.`);
if (failures.length) {
  console.log(`Failed: ${failures.join('; ')}`);
  process.exitCode = 1;
}
