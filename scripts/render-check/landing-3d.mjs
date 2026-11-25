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
  const engine = fs.readFileSync(path.join(root, 'src/shared/visuals/campus3d.ts'), 'utf8');
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
  check('motion: the idle drift honours the preference in JavaScript too, not just CSS', /prefers-reduced-motion: reduce/.test(campus) && /reducedMotion/.test(campus));
  check('motion: the drift pauses when the tab is hidden', /visibilitychange/.test(campus));
  check('motion: the drift pauses when the hero is scrolled out of view', /IntersectionObserver/.test(campus));

  // The mobile-preview tabs further down the page own a polite live region
  // already. The hero must not add another: an idle animation that announces
  // itself would talk over a screen-reader user who is reading the headline.
  const heroLive = host.querySelectorAll('.landing-hero [aria-live], .landing-hero [role="status"]');
  check('a11y: the animated hero announces nothing by itself', heroLive.length === 0, `${heroLive.length} live region(s) inside the hero`);
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
