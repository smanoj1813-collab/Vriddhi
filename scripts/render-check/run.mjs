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
    // <input> values never appear in textContent, so form state has to be read
    // off the elements themselves.
    value: (id) => {
      const el = host.querySelector(`#${id}`);
      return el ? el.value : null;
    },
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
    assertions(view.text(), view);
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

// ── Student journey page ─────────────────────────────────────────────────────
// The fixture is the exact payload shape `getMyAcademicJourney` returns, so the
// page, its hook and buildJourneyStages are all the shipped source. The numbers
// are chosen to be checkable by hand:
//   credits/grade points  4×9, 3×8, 2×7, 3×9  → 101 points / 12 credits
//   CGPA                  8.42 (round(8.4166…, 2))
//   semester 1 SGPA       (36+24)/7  = 8.57
//   semester 2 SGPA       (14+27)/5  = 8.2
//   rank 4 of 40          percentile (40-4)/(40-1) = 92.3 → "Top 7.7%"
//   band                  8.42 clears the 8.0 cut-off → "Strong band"
//   gap to next band      9.0 - 8.42 = 0.58
const journeyFixture = {
  profile: {
    name: 'Asha Verma', regNo: '1VE21CS012', course: 'B.E.', branch: 'CSE',
    batch: '2026', division: 'A', semester: 5,
  },
  attendance: { percentage: 82, totalClasses: 210, present: 160, late: 12, absent: 38, requiredPercentage: 75 },
  assessments: {
    attempted: 6, graded: 5, awaitingGrading: 1, averagePercentage: 78.4,
    recent: [
      { title: 'Internal Assessment 2', subject: 'Data Structures', percentage: 84, grade: 'A', submittedAt: '2026-09-02T10:00:00.000Z' },
      { title: 'Internal Assessment 1', subject: 'Data Structures', percentage: 61, grade: 'C', submittedAt: '2026-08-02T10:00:00.000Z' },
    ],
  },
  grades: {
    published: true,
    subjects: [
      { code: 'CS301', subject: 'Data Structures', credits: 4, gradePoint: 9, grade: 'A', total: 88, semester: 1 },
      { code: 'CS302', subject: 'DMS', credits: 3, gradePoint: 8, grade: 'B+', total: 79, semester: 1 },
      { code: 'CS401', subject: 'Design and Analysis', credits: 2, gradePoint: 7, grade: 'B', total: 72, semester: 2 },
      { code: 'CS402', subject: 'Operating Systems', credits: 3, gradePoint: 9, grade: 'A', total: 91, semester: 2 },
    ],
    semesters: [
      { semester: 1, sgpa: 8.57, credits: 7 },
      { semester: 2, sgpa: 8.2, credits: 5 },
    ],
    cgpa: 8.42,
    creditsEarned: 12,
  },
  standing: { branch: 'CSE', batch: '2026', cohortSize: 40, rank: 4, percentile: 92.3 },
  readiness: {
    hasCgpa: true,
    band: {
      id: 'tier2', label: 'Strong band',
      outlook: 'Clears most campus drive cut-offs, including the majority of core and product roles posted by recruiters.',
    },
    minCgpaForBand: 8,
    nextBand: { id: 'tier1', label: 'Distinction band', minCgpa: 9, gap: 0.58 },
    attendanceGate: 75,
    attendanceShortfall: 0,
    bands: [
      { id: 'tier1', minCgpa: 9, label: 'Distinction band', outlook: 'Clears the highest academic cut-offs.' },
      { id: 'tier2', minCgpa: 8, label: 'Strong band', outlook: 'Clears most campus drive cut-offs.' },
      { id: 'tier3', minCgpa: 7, label: 'Competitive band', outlook: 'Meets the common 7.0 cut-off.' },
      { id: 'tier4', minCgpa: 6.5, label: 'Eligible band', outlook: 'Meets the widely used 6.5 cut-off.' },
      { id: 'tier5', minCgpa: 6, label: 'Minimum band', outlook: 'Meets the baseline 6.0 cut-off.' },
      { id: 'below', minCgpa: 0, label: 'Below common cut-off', outlook: 'Below the 6.0 cut-off most recruiters publish.' },
    ],
  },
};

globalThis.__RC_CALLABLE_DATA = { getMyAcademicJourney: journeyFixture };

await section('student journey', '/src/modules/student/pages/StudentJourneyPage.tsx', {}, (t) => {
  check('journey: mounts without throwing', true);
  check('journey: shows the credit-weighted CGPA (8.42), not a percentage-derived one', t.includes('8.42'), t);
  check('journey: shows the real cohort rank (#4 of 40), not a hardcoded #1',
    t.includes('#4') && t.includes('40'), t);
  check('journey: derives the percentile from the cohort (Top 7.7%)', t.includes('Top 7.7%'), t);
  check('journey: names the readiness band for 8.42 (Strong band)', t.includes('Strong band'), t);
  check('journey: states the measured gap to the next band (0.58)', t.includes('0.58'), t);
  check('journey: renders all five stages from enrolment to placement',
    /Enrolled/.test(t) && /Attending & learning/.test(t) && /Assessed/.test(t)
    && /Results published/.test(t) && /Placement ready/.test(t), t);
  check('journey: renders the real per-semester SGPA (8.57 and 8.2)',
    t.includes('8.57') && t.includes('8.2'), t);
  check('journey: reports attendance against the gate without a false warning',
    t.includes('82') && t.includes('Meets the 75% gate'), t);
  check('journey: lists real graded assessments with their scores',
    t.includes('Internal Assessment 2') && t.includes('84'), t);
  check('journey: does not invent an employer name or an offer',
    !/TCS|Infosys|Wipro|guaranteed placement/i.test(t), t);
});

// ── Same page when the college has published nothing ─────────────────────────
// The honest empty states matter more than the happy path: a student with no
// transcript must see "not published", never a 0 CGPA or an invented band.
globalThis.__RC_CALLABLE_DATA = {
  getMyAcademicJourney: {
    ...journeyFixture,
    grades: { published: false, subjects: [], semesters: [], cgpa: null, creditsEarned: 0 },
    standing: { branch: 'CSE', batch: '2026', cohortSize: 0, rank: null, percentile: null },
    readiness: { ...journeyFixture.readiness, hasCgpa: false, band: null, minCgpaForBand: null, nextBand: null },
  },
};

await section('student journey (no grades published)', '/src/modules/student/pages/StudentJourneyPage.tsx', {}, (t) => {
  check('journey (empty): mounts without throwing', true);
  check('journey (empty): renders an em dash for CGPA rather than 0', t.includes('—'), t);
  check('journey (empty): says grades are not published', t.includes('Not published yet'), t);
  check('journey (empty): explains that readiness needs published grades',
    t.includes('Readiness needs published grades'), t);
  check('journey (empty): does not claim a placement band', !/Strong band/.test(t), t);
  check('journey (empty): still renders the stage timeline', /Placement ready/.test(t), t);
});

// ── Admission settings ───────────────────────────────────────────────────────
// The merit weights and the Google Form mapping are per-college, so the panel
// must render the college's own values. A panel that quietly showed the Vriddhi
// defaults would let an office believe its scoring policy was different from
// what the server actually applies.
globalThis.__RC_CALLABLE_DATA = {
  getAdmissionConfig: {
    weights: { qualifying: 60, entrance: 30, interview: 10 },
    weightsCustomised: true,
    intake: {
      enabled: true,
      hasToken: true,
      fieldMapping: { applicantName: 'Full name', phone: 'Phone Number' },
      defaults: {
        program: 'B.Tech CSE',
        batch: '2026',
        source: 'Google Form',
        department: 'Computer Science',
      },
      endpoint: 'https://asia-south1-vriddhi-academic.cloudfunctions.net/api/admissions/ingest',
      mappableFields: ['applicantName', 'phone'],
      lastSubmissionAt: '2026-09-10T09:30:00.000Z',
      submissionCount: 17,
      rejectedCount: 2,
    },
  },
};

const SETTINGS = '/src/modules/admin/components/AdmissionSettings.tsx';
const settingsProps = { collegeId: 'college-a', onClose: () => {}, onChanged: () => {} };

await section('admission settings', SETTINGS, settingsProps, (t, view) => {
  check('settings: mounts without throwing', true);
  check('settings: shows the college\'s own weights (60 / 30 / 10), not the 50/40/10 defaults',
    view.value('weight-qualifying') === '60'
    && view.value('weight-entrance') === '30'
    && view.value('weight-interview') === '10',
    `qualifying=${view.value('weight-qualifying')} entrance=${view.value('weight-entrance')} interview=${view.value('weight-interview')}`);
  check('settings: confirms the weights add up to 100%', t.includes('Total 100% — valid'), t);
  check('settings: reports the real submission counts (17 received, 2 rejected)',
    t.includes('17') && /Submissions received/.test(t) && /Rejected/.test(t), t);
  check('settings: shows the ingest endpoint the Apps Script must post to',
    t.includes('/api/admissions/ingest'), t);
  check('settings: echoes the mapped form question titles back to the college',
    view.value('map-applicantName') === 'Full name' && view.value('map-phone') === 'Phone Number',
    `applicantName=${view.value('map-applicantName')} phone=${view.value('map-phone')}`);
  check('settings: shows the per-college intake defaults',
    view.value('default-program') === 'B.Tech CSE'
    && view.value('default-department') === 'Computer Science'
    && view.value('default-batch') === '2026',
    `program=${view.value('default-program')} department=${view.value('default-department')}`);
  check('settings: does not display a plaintext token — it is shown once, at generation only',
    !/[A-Za-z0-9_-]{32}/.test(t) && t.includes('rotate it to see a new one'), t);
  check('settings: offers both rotate and revoke',
    /Rotate token/.test(t) && /Revoke/.test(t), t);
  check('settings: tells the college the trigger they must add',
    /On form submit/.test(t), t);
});


await server.close();

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed, ${crashes} mount crash(es)`);
process.exit(failed.length === 0 && crashes === 0 ? 0 : 1);
