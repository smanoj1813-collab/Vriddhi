// Mounts the staff-attendance components in jsdom and asserts on what actually
// lands in the DOM.
//
// Why this exists: `tsc` and `vite build` prove the code compiles, and the unit
// tests prove the maths is right, but neither proves a single component
// renders. This closes that gap. The I/O boundary (Firestore, AuthContext, the
// router) is stubbed by ./vite.config.mts; the components, their hooks, and the
// aggregation in staffAttendanceStats are the real shipped source.
//
// Run with: npm run test:render
import { createServer } from 'vite';
import path from 'path';
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
});

async function mount(file, props) {
  const mod = await server.ssrLoadModule(file);
  const Comp = mod.default;
  if (typeof Comp !== 'function') throw new Error(`no default export from ${file}`);

  const host = document.createElement('div');
  document.body.appendChild(host);
  const reactRoot = createRoot(host);

  // Two passes: the first mounts and fires effects, the second lets the
  // awaited fixtures resolve and re-render.
  await act(async () => { reactRoot.render(React.createElement(Comp, props)); });
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });

  return {
    text: () => host.textContent.replace(/\s+/g, ' ').trim(),
    unmount: async () => { await act(async () => reactRoot.unmount()); host.remove(); },
  };
}

const checks = [];
function check(label, cond, detail) {
  checks.push({ label, ok: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : `\n        → ${(detail ?? '').slice(0, 400)}`}`);
}

let crashes = 0;
async function section(label, file, props, assertions) {
  try {
    const view = await mount(file, props);
    assertions(view.text());
    await view.unmount();
  } catch (err) {
    crashes++;
    check(`${label}: mounts without throwing`, false, String(err.stack ?? err.message));
  }
}

// ── Principal analysis panel ─────────────────────────────────────────────────
// The fixtures are 3 faculty and 7 records across 1–3 Sep 2026. September 2026
// has 26 working days (Sundays excluded), so the expected figures are:
//   credited = 2.5 (Bala) + 1 (Anitha) + 1 (Suresh) = 4.5
//   overall  = 4.5 / (26 × 3) = 5.8%
//   Bala     = 2.5 / 26      = 9.6%
await section('panel', '/src/modules/admin/components/FacultyAttendancePanel.tsx', { collegeId: 'college-a' }, (t) => {
  check('panel: mounts without throwing', true);
  check('panel: overall percentage matches the fixture maths (5.8%)', t.includes('5.8%'), t);
  check('panel: per-faculty percentage matches (9.6% for 2.5/26 days)', t.includes('9.6%'), t);
  check('panel: lists all three roster members, including ones with no records',
    t.includes('Bala Kumar') && t.includes('Anitha Rao') && t.includes('Suresh Menon'), t);
  check('panel: reports the working-day denominator (26)', t.includes('26'), t);
  check('panel: offers the month and date-range scopes', /Month/.test(t) && /Date range/i.test(t), t);
  check('panel: offers CSV, XLSX and PDF downloads', /CSV/.test(t) && /XLSX/.test(t) && /PDF/.test(t), t);
  check('panel: renders the day-by-day register', /Register/.test(t), t);
});

// ── Same panel in dashboard-tab (compact) form ───────────────────────────────
await section('panel (compact)', '/src/modules/admin/components/FacultyAttendancePanel.tsx',
  { collegeId: 'college-a', compact: true }, (t) => {
    check('panel (compact): mounts without throwing', true);
    check('panel (compact): still computes the analysis', t.includes('5.8%'), t);
  });

// ── Overview "today" tile ────────────────────────────────────────────────────
// The fixtures are all from 1–3 Sep, so on any other day nothing is marked and
// the tile must say so rather than render an empty shell.
await section('today card', '/src/modules/admin/components/FacultyAttendanceTodayCard.tsx',
  { collegeId: 'college-a' }, (t) => {
    check('today card: mounts without throwing', true);
    check('today card: reports the roster size (3 faculty)', t.includes('3 faculty'), t);
  });

// ── Faculty "My Attendance" page ─────────────────────────────────────────────
await section('my attendance', '/src/modules/faculty/pages/FacultySelfAttendance.tsx', {}, (t) => {
  check('my attendance: mounts without throwing', true);
  check('my attendance: identifies the signed-in faculty member', t.includes('Bala Kumar'), t);
  check('my attendance: offers every status choice',
    /Present/.test(t) && /Late/.test(t) && /Half Day/.test(t) && /On Leave/.test(t) && /Absent/.test(t), t);
  check('my attendance: renders the month grid with Sundays marked off', /OFF/.test(t), t);
  check('my attendance: shows the member\'s own percentage (9.6%)', t.includes('9.6%'), t);
  check('my attendance: lists recent entries with hours worked', /8h/.test(t) && /4h/.test(t), t);
  check('my attendance: previews the download filename', /my_attendance_\d{4}-\d{2}\.xlsx/.test(t), t);
});

// ── Standalone admin page (resolves collegeId from AuthContext) ──────────────
await section('admin page', '/src/modules/admin/pages/FacultyAttendanceAdmin.tsx', {}, (t) => {
  check('admin page: mounts without throwing', true);
  check('admin page: renders the analysis panel inside it', t.includes('5.8%'), t);
});

await server.close();

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed, ${crashes} mount crash(es)`);
process.exit(failed.length === 0 && crashes === 0 ? 0 : 1);
