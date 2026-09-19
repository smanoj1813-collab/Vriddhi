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

  const settle = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 20)); }); };

  return {
    text: () => host.textContent.replace(/\s+/g, ' ').trim(),
    /**
     * Like text(), but without anything inside a collapsed MUI Collapse.
     * Collapse keeps its children mounted with `visibility: hidden` (correct
     * for screen readers), so textContent alone would "see" closed accordions.
     */
    openText: () => {
      const clone = host.cloneNode(true);
      clone.querySelectorAll('.MuiCollapse-hidden').forEach((el) => el.remove());
      return clone.textContent.replace(/\s+/g, ' ').trim();
    },
    // <input> values never appear in textContent, so form state has to be read
    // off the elements themselves.
    value: (id) => {
      const el = host.querySelector(`#${id}`);
      return el ? el.value : null;
    },
    el: (selector) => host.querySelector(selector),
    all: (selector) => [...host.querySelectorAll(selector)],
    /** The first element whose own text is exactly `label` (a button/pill). */
    byText: (label, selector = 'button') =>
      [...host.querySelectorAll(selector)].find((e) => (e.textContent || '').replace(/\s+/g, ' ').trim() === label) ?? null,
    /** Real click through React's event system, then let effects settle. */
    click: async (target) => {
      const el = typeof target === 'string' ? host.querySelector(target) : target;
      if (!el) throw new Error(`nothing to click for ${typeof target === 'string' ? target : '<element>'}`);
      await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })); });
      await settle();
    },
    hrefs: (selector = 'a') => [...host.querySelectorAll(selector)].map((a) => a.getAttribute('href')),
    host,
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
    // Awaited: assertions may be async (click a toggle, then read the DOM).
    await assertions(view.text(), view);
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

// ── Student "My Curriculum" page ─────────────────────────────────────────────
// The fixture is the exact payload `getMyCurriculum` returns. The page must
// show all three states, the per-subject percentage, the module being taught,
// the next scheduled classes WITH their planned topics, and behave sensibly
// when the college has mapped nothing yet.
const curriculumFixture = {
  generatedAt: '2026-09-13T00:00:00.000Z',
  student: { branch: 'BBA', batch: '2027', semester: 3, division: 'A' },
  noCurriculumAssigned: false,
  totals: { subjects: 1, topics: 5, completed: 2, current: 1, upcoming: 2, pct: 40 },
  upcomingClasses: [{
    id: 's1', date: '2099-01-05', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00',
    subject: 'Financial Accounting', subjectCode: 'BBA101', facultyName: 'Vivek Ramesh', room: 'R-12',
    status: 'scheduled', topics: ['Journals'],
  }],
  subjects: [{
    curriculumId: 'cur-1', courseCode: 'BBA101', courseName: 'Financial Accounting', facultyName: 'Vivek Ramesh',
    credits: 4, totalHours: 40,
    totals: { total: 5, completed: 2, current: 1, upcoming: 2, pct: 40 },
    recentSessions: [], upcomingSessions: [],
    modules: [
      { moduleNo: '1', moduleName: 'Introduction', hours: 8, total: 3, completed: 2, current: 1, upcoming: 0, pct: 67, state: 'current', topics: [
        { title: 'What is Accounting', state: 'completed', coveredOn: '2026-09-01', plannedOn: null },
        { title: 'Double Entry', state: 'completed', coveredOn: '2026-09-05', plannedOn: null },
        { title: 'Journals', state: 'current', coveredOn: null, plannedOn: '2099-01-05' },
      ]},
      { moduleNo: '2', moduleName: 'Ledgers', hours: 10, total: 2, completed: 0, current: 0, upcoming: 2, pct: 0, state: 'upcoming', topics: [
        { title: 'Posting', state: 'upcoming', coveredOn: null, plannedOn: null },
        { title: 'Trial Balance', state: 'upcoming', coveredOn: null, plannedOn: null },
      ]},
    ],
  }],
};
globalThis.__RC_CALLABLE_DATA = { getMyCurriculum: curriculumFixture };
await section('curriculum', '/src/modules/student/pages/StudentCurriculumPage.tsx', {}, (t) => {
  check('curriculum: mounts without throwing', true);
  check('curriculum: identifies the cohort', /BBA/.test(t) && /Batch 2027/.test(t) && /Semester 3/.test(t), t);
  check('curriculum: lists the subject with its faculty and coverage %',
    t.includes('Financial Accounting') && t.includes('Vivek Ramesh') && t.includes('40%'), t);
  check('curriculum: shows Completed / Current / Upcoming states',
    /Completed/.test(t) && /Current/.test(t) && /Upcoming/.test(t), t);
  check('curriculum: the module being taught is expanded and marks taught topics with their date',
    t.includes('Module 1: Introduction') && t.includes('What is Accounting') && /Taught on 1 Sept?/.test(t), t);
  check('curriculum: "Currently studying" names the in-progress topic', /Currently studying/.test(t) && t.includes('Journals'), t);
  check('curriculum: next classes show the planned topic, faculty and room',
    /Next classes/.test(t) && t.includes('R-12') && t.includes('Journals'), t);
  check('curriculum: links to the timetable', /Full timetable/.test(t), t);
});

globalThis.__RC_CALLABLE_DATA = { getMyCurriculum: { ...curriculumFixture, subjects: [], upcomingClasses: [], noCurriculumAssigned: true,
  totals: { subjects: 0, topics: 0, completed: 0, current: 0, upcoming: 0, pct: 0 } } };
await section('curriculum (unmapped)', '/src/modules/student/pages/StudentCurriculumPage.tsx', {}, (t) => {
  check('curriculum (unmapped): explains that nothing is mapped instead of showing zeros',
    /No curriculum has been mapped/.test(t) && !/0%/.test(t), t);
});

globalThis.__RC_CALLABLE_DATA = {};
await section('curriculum (error)', '/src/modules/student/pages/StudentCurriculumPage.tsx', {}, (t) => {
  check('curriculum (error): surfaces the callable failure with a retry', /Could not load your curriculum/.test(t) && /Try again/.test(t), t);
});


// ── Public /prep hub (docs/handoff-prep-hub-redesign.md §3, §7) ──────────────
// The hub was rebuilt from a flat card grid into two jobs side by side: a
// semester accordion and a placement band. These checks pin the parts the
// brief calls out — title-first rows, one line of metadata, no descriptions or
// stream chips in the grid, semester grouping (with the yearGroup / "other"
// fallbacks), the UG/PG program control, the eligibility-filtered company row,
// and the "college hid company prep" case where the band must lose the company
// sub-block without leaving a hole.
const PREP_VIEWER = '/src/modules/prep/PrepPublicViewer.tsx';

const prepSubjects = [
  // Semester 1 — BBA, all 1st-year.
  { id: 'bba-micro', name: 'Microeconomics', stream: 'economics', track: 'academic', programs: ['bba', 'bcom'],
    yearGroup: '1st-year', semester: 1, order: 1, topicCount: 5, status: 'published',
    description: 'Demand, supply and elasticity explained for first-year commerce students.' },
  { id: 'bba-mpa', name: 'Management Principles & Applications', stream: 'management', track: 'academic', programs: ['bba'],
    yearGroup: '1st-year', semester: 1, order: 2, topicCount: 5, status: 'published',
    description: 'Fayol to Mintzberg, with cases from Indian firms.' },
  { id: 'bba-accounting', name: 'Fundamentals of Business Accounting', stream: 'commerce', track: 'academic', programs: ['bba', 'bcom', 'mcom'],
    yearGroup: '1st-year', semester: 1, order: 3, topicCount: 5, status: 'published',
    description: 'Journals, ledgers and the trial balance.' },
  // Semester 2 — note `stream: 'aptitude'` on an ACADEMIC subject: the split is
  // by track, never by stream, or the hub would file maths under placements.
  { id: 'bba-ob', name: 'Organizational Behaviour', stream: 'management', track: 'academic', programs: ['bba'],
    yearGroup: '1st-year', semester: 2, order: 4, topicCount: 5, status: 'published',
    description: 'Motivation, groups and leadership.' },
  { id: 'bba-math', name: 'Business Mathematics & Quantitative Techniques', stream: 'aptitude', track: 'academic', programs: ['bba'],
    yearGroup: '1st-year', semester: 2, order: 5, topicCount: 5, status: 'published',
    description: 'Matrices, calculus and linear programming for commerce.' },
  // Semester 3 — 2nd year.
  { id: 'bba-cost', name: 'Cost Accounting', stream: 'commerce', track: 'academic', programs: ['bba', 'bcom'],
    yearGroup: '2nd-year', semester: 3, order: 7, topicCount: 5, status: 'published', description: 'Costing methods.' },
  { id: 'bba-stats', name: 'Business Statistics', stream: 'aptitude', track: 'academic', programs: ['bba'],
    yearGroup: '2nd-year', semester: 3, order: 8, topicCount: 5, status: 'published', description: 'Measures of central tendency.' },
  // M.Com: one numbered semester, one year-group-only subject and one with
  // neither — the two documented fallbacks (§5.1).
  { id: 'mcom-adv-accounting', name: 'Advanced Corporate Accounting', stream: 'commerce', track: 'academic', programs: ['mcom'],
    yearGroup: '1st-year', semester: 1, order: 1, topicCount: 6, status: 'published', description: 'Consolidation and branch accounts.' },
  { id: 'mcom-research', name: 'Business Research Methods', stream: 'management', track: 'academic', programs: ['mcom'],
    yearGroup: '1st-year', order: 9, topicCount: 4, status: 'published', description: 'Sampling, hypotheses and SPSS.' },
  { id: 'mcom-elective', name: 'Elective Pack', stream: 'strategy', track: 'academic', programs: ['mcom'],
    order: 12, topicCount: 3, status: 'published', description: 'An elective with no semester or year yet.' },
  // Shared placement aptitude catalogue — every program.
  { id: 'apt-quantitative-aptitude', name: 'Quantitative Aptitude', stream: 'aptitude', track: 'aptitude',
    programs: ['bba', 'bcom', 'ba', 'bsc', 'bca', 'mba', 'mcom', 'mca'], order: 101, topicCount: 24, status: 'published',
    description: 'Numbers, percentages, time-speed-work, algebra, probability and DI.' },
  { id: 'apt-logical-reasoning', name: 'Logical Reasoning', stream: 'aptitude', track: 'aptitude',
    programs: ['bba', 'bcom', 'ba', 'bsc', 'bca', 'mba', 'mcom', 'mca'], order: 102, topicCount: 20, status: 'published',
    description: 'Series, coding-decoding, blood relations, seating arrangement.' },
  { id: 'apt-verbal-ability', name: 'Verbal Ability & Reading Skills', stream: 'communication', track: 'aptitude',
    programs: ['bba', 'bcom', 'ba', 'bsc', 'bca', 'mba', 'mcom', 'mca'], order: 103, topicCount: 18, status: 'published',
    description: 'Grammar, vocabulary, comprehension and sentence correction.' },
];

const company = (code, name, programs, extra = {}) => ({
  code, name, testName: `${name} Online Test`, tagline: `${name} tagline.`, audience: ['ug'], tier: 'mass',
  totalMinutes: 100, totalQuestions: 60, negativeMarking: false, sectionalCutoff: true,
  eligibility: { programs, degrees: 'Any graduate' }, sections: [], rounds: [], quickTips: [],
  patternVerifiedOn: '2026-09-01', sources: [], status: 'published', order: 1, topicCount: 12, ...extra,
});

const prepCompanies = [
  company('tcs-nqt', 'TCS', ['bba', 'bcom', 'ba', 'bsc', 'bca', 'mba', 'mcom', 'mca']),
  company('infosys', 'Infosys', ['bba', 'bcom', 'ba', 'bsc', 'bca', 'mba', 'mcom', 'mca']),
  company('wipro-nlth', 'Wipro', ['bba', 'bcom', 'bsc', 'bca']),
  // Capgemini hires tech/PG only — it must NOT show for BBA (§7).
  company('capgemini', 'Capgemini', ['bca', 'bsc', 'mca']),
];

const prepTopic = {
  id: 'bba-micro-t1', subjectId: 'bba-micro', title: 'Demand, Supply & Equilibrium', order: 1, difficulty: 'core',
  moduleNumber: 1, moduleName: 'Module 1: Microeconomics', subtopics: ['Demand'], explanationMd: '## Demand',
  formulas: [], tricks: [], howToSolve: [], featuredQuestionIds: [], status: 'published',
  generatedBy: 'curator', contentVersion: 1, tier: 'free',
};

const prepQuestion = {
  id: 'q-qa-1', questionText: 'If 20% of x is 40, what is x?', options: ['100', '200', '160', '80'], correctIndex: 1,
  explanation: 'x = 40 / 0.2 = 200.', difficulty: 'basic', status: 'approved',
  prepTags: { subjectId: 'apt-quantitative-aptitude', topicIds: ['qa-percentages'] },
  sectionId: 'quant', sectionName: 'Quantitative Ability',
};

function resetPrep(fixture = {}, { search = '', params = {} } = {}) {
  globalThis.__RC_PREP = { subjects: prepSubjects, companies: prepCompanies, ...fixture };
  globalThis.__RC_PREP_CALLS = [];
  globalThis.__RC_SEARCH = search;
  globalThis.__RC_SEARCH_SETS = [];
  globalThis.__RC_PARAMS = params;
  for (const key of ['vriddhi.prep.program', 'vriddhi.prep.collegeId',
    'vriddhi.prep.openSemesters.bba', 'vriddhi.prep.openSemesters.mcom', 'vriddhi.prep.openSemesters.bca']) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}

const callsTo = (fn) => (globalThis.__RC_PREP_CALLS ?? []).filter((c) => c.fn === fn);
/** The accordion's header lines, in render order. */
const groupHeaders = (view) => view.all('button[aria-expanded]').map((b) => b.textContent.replace(/\s+/g, ' ').trim());
/** header text → aria-expanded, i.e. what the learner can actually see. */
const expandedGroups = (view) => Object.fromEntries(
  view.all('button[aria-expanded]').map((b) => [b.textContent.replace(/\s+/g, ' ').trim(), b.getAttribute('aria-expanded')]));
/** The breadcrumb, crumb by crumb (textContent alone runs them together). */
const crumbs = (view) => view.all('nav[aria-label="Breadcrumb"] li').map((li) => li.textContent.trim());

// ── Hub, BBA, default arrival ────────────────────────────────────────────────
resetPrep();
await section('prep hub (bba)', PREP_VIEWER, { view: 'hub' }, (t, view) => {
  const ot = view.openText();
  check('prep hub: mounts without throwing', true);
  check('prep hub: both jobs render — study column and placement band',
    /Study your subjects/.test(t) && /Prepare for placements/.test(t), t);
  check('prep hub: program control groups UG and PG instead of suffixing "(PG)"',
    /Undergraduate/.test(t) && /Postgraduate/.test(t) && !/\(PG\)/.test(t), t);
  const active = view.all('[aria-current="true"]');
  check('prep hub: the selected program is marked with aria-current',
    active.length === 1 && active[0].textContent.trim() === 'BBA', active.map((a) => a.textContent).join('|'));
  check('prep hub: the catalog is grouped by semester, in order, with year + count on the header',
    JSON.stringify(groupHeaders(view)) === JSON.stringify([
      'Semester 1 · 1st year · 3 subjects',
      'Semester 2 · 1st year · 2 subjects',
      'Semester 3 · 2nd year · 2 subjects',
    ]), groupHeaders(view).join(' | '));
  check('prep hub: semester 1 is open on arrival and lists its subjects, title first',
    t.includes('Microeconomics') && t.includes('Management Principles & Applications')
    && t.includes('Fundamentals of Business Accounting'), t);
  check('prep hub: later semesters stay collapsed instead of becoming a wall of cards',
    !ot.includes('Organizational Behaviour') && !ot.includes('Cost Accounting'), ot);
  // textContent runs "…Applications" and "5 topics" together, and the study
  // column's own total says "35 topics" — so exclude a preceding digit.
  const fiveTopicRows = (ot.match(/(?<!\d)5 topics/g) ?? []).length;
  check('prep hub: each visible subject row carries exactly one metadata line ("5 topics")',
    fiveTopicRows === 3, `count=${fiveTopicRows} tail=${ot.slice(-320)}`);
  check('prep hub: no descriptions in the grid — those live on the subject page',
    !ot.includes('Demand, supply and elasticity') && !ot.includes('Journals, ledgers'), ot);
  check('prep hub: no stream chip, no program list, no "All programs" noise on a row',
    !ot.includes('Quantitative Aptitude & Reasoning') && !ot.includes('Managerial Economics')
    && !ot.includes('BA, B.Com, BBA') && !/All programs/.test(ot), ot);
  check('prep hub: the three aptitude packs are compact tiles in the band',
    /Quantitative Aptitude/.test(t) && /Logical Reasoning/.test(t) && /Verbal Ability/.test(t)
    && /24 topics/.test(t) && /20 topics/.test(t) && /18 topics/.test(t), t);
  check('prep hub: aptitude is filed under placements, never under a semester',
    groupHeaders(view).every((h) => !/· 6[23] subjects/.test(h)) && !t.includes('Semester 101'), groupHeaders(view).join(' | '));
  check('prep hub: company guides render as a compact row inside the band',
    /Company guides/.test(t) && t.includes('TCS') && t.includes('Infosys') && t.includes('Wipro')
    && /Take a 20-question mock/.test(t), t);
  check('prep hub: Capgemini is filtered out for BBA by eligibility', !t.includes('Capgemini'), t);
  check('prep hub: renders from ONE subjects + ONE companies request (no per-card fetches)',
    callsTo('subjects').length === 1 && callsTo('companies').length === 1 && callsTo('subject').length === 0,
    JSON.stringify(globalThis.__RC_PREP_CALLS));
  check('prep hub: subject rows deep-link with the program they were browsed under',
    view.hrefs().includes('/prep/subject/bba-micro?program=bba'), view.hrefs().join(' '));
  check('prep hub: the mock CTA lands on the company mock tab',
    view.hrefs().some((h) => /^\/prep\/company\/tcs-nqt\?tab=mock/.test(h)), view.hrefs().join(' '));
  check('prep hub: keeps a share control for the page', view.all('[aria-label*="Share"]').length === 1, '');
  check('prep hub: the header no longer leads with NEP 2020 / CBCS jargon',
    !/NEP 2020 \/ CBCS study packs/.test(t) && /Free study packs/.test(t), t);
});

// ── Hub interaction: semester memory + program switch ────────────────────────
resetPrep();
await section('prep hub (accordion + program switch)', PREP_VIEWER, { view: 'hub' }, async (t, view) => {
  check('prep hub (interaction): mounts without throwing', true);
  const sem2 = view.all('button[aria-expanded]').find((b) => /Semester 2/.test(b.textContent));
  check('prep hub (interaction): semester headers are buttons with aria-expanded + aria-controls',
    Boolean(sem2) && sem2.getAttribute('aria-expanded') === 'false' && Boolean(sem2.getAttribute('aria-controls')), '');
  await view.click(sem2);
  const after = view.openText();
  check('prep hub (interaction): tapping a semester expands it in place',
    sem2.getAttribute('aria-expanded') === 'true' && after.includes('Organizational Behaviour')
    && after.includes('Business Mathematics & Quantitative Techniques'), after);
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem('vriddhi.prep.openSemesters.bba') ?? 'null'); } catch { /* ignore */ }
  check('prep hub (interaction): open semesters are remembered per program',
    Array.isArray(stored) && stored.includes('sem-1') && stored.includes('sem-2'), JSON.stringify(stored));

  const mcom = view.byText('M.Com');
  check('prep hub (interaction): M.Com is its own pill, with no "(PG)" suffix', Boolean(mcom), '');
  await view.click(mcom);
  const switched = view.openText();
  check('prep hub (interaction): switching program updates the URL query',
    (globalThis.__RC_SEARCH_SETS ?? []).includes('?program=mcom'), JSON.stringify(globalThis.__RC_SEARCH_SETS));
  check('prep hub (interaction): switching program refetches that catalog exactly once',
    callsTo('subjects').length === 2 && callsTo('subjects')[1].params.program === 'mcom'
    && callsTo('companies').length === 2, JSON.stringify(globalThis.__RC_PREP_CALLS));
  check('prep hub (interaction): the new program shows its own subjects and hides BBA ones',
    switched.includes('Advanced Corporate Accounting') && !switched.includes('Microeconomics'), switched);
  check('prep hub (interaction): the study column reports what it is showing',
    /M\.Com · 4 subjects · 18 topics/.test(switched), switched);
  check('prep hub (interaction): a subject shared with another program is listed here too',
    switched.includes('Fundamentals of Business Accounting'), switched);
  check('prep hub (interaction): no semester → year group, no year group → "Other study packs"',
    JSON.stringify(groupHeaders(view)) === JSON.stringify([
      'Semester 1 · 1st year · 2 subjects',
      '1st year · 1 subject',
      'Other study packs · 1 subject',
    ]), groupHeaders(view).join(' | '));
  const other = view.all('button[aria-expanded]').find((b) => /Other study packs/.test(b.textContent));
  await view.click(other);
  check('prep hub (interaction): the catch-all group opens onto its subject',
    view.openText().includes('Elective Pack'), view.openText());
  check('prep hub (interaction): the chosen program is remembered on this device',
    localStorage.getItem('vriddhi.prep.program') === 'mcom', localStorage.getItem('vriddhi.prep.program'));
});

// ── Reloading restores the program and the open semester ─────────────────────
resetPrep({}, { search: '?program=bba' });
try { localStorage.setItem('vriddhi.prep.openSemesters.bba', JSON.stringify(['sem-3'])); } catch { /* ignore */ }
await section('prep hub (reload)', PREP_VIEWER, { view: 'hub' }, (t, view) => {
  const ot = view.openText();
  const expanded = expandedGroups(view);
  check('prep hub (reload): reopens the semester the learner left open, and only that one',
    ot.includes('Cost Accounting') && ot.includes('Business Statistics')
    && expanded['Semester 3 · 2nd year · 2 subjects'] === 'true'
    && expanded['Semester 1 · 1st year · 3 subjects'] === 'false', JSON.stringify(expanded));
});

// ── A `?sem=` hint from a breadcrumb wins over the stored semester ───────────
resetPrep({}, { search: '?program=bba&sem=2' });
await section('prep hub (?sem hint)', PREP_VIEWER, { view: 'hub' }, (t, view) => {
  const ot = view.openText();
  const expanded = expandedGroups(view);
  check('prep hub (?sem): opens the semester the learner came back from',
    ot.includes('Organizational Behaviour')
    && expanded['Semester 2 · 1st year · 2 subjects'] === 'true'
    && expanded['Semester 1 · 1st year · 3 subjects'] === 'false', JSON.stringify(expanded));
});

// ── BCA: Capgemini becomes eligible ─────────────────────────────────────────
resetPrep({}, { search: '?program=bca' });
await section('prep hub (bca)', PREP_VIEWER, { view: 'hub' }, (t) => {
  check('prep hub (bca): mounts without throwing', true);
  check('prep hub (bca): Capgemini IS offered to BCA — the filter is eligibility, not a hardcode',
    t.includes('Capgemini'), t);
  check('prep hub (bca): the placement band still leads with the aptitude tiles',
    /Prepare for placements/.test(t) && /Quantitative Aptitude/.test(t), t);
  check('prep hub (bca): with no BCA syllabus published the study block explains itself',
    /No BCA subjects published yet/.test(t), t);
  check('prep hub (bca): still exactly one subjects + one companies request',
    callsTo('subjects').length === 1 && callsTo('companies').length === 1, JSON.stringify(globalThis.__RC_PREP_CALLS));
});

// ── College hides company prep (§5.3 / §7) ───────────────────────────────────
resetPrep({ companies: [] });
await section('prep hub (company prep hidden)', PREP_VIEWER, { view: 'hub' }, (t) => {
  check('prep hub (hidden companies): mounts without throwing', true);
  check('prep hub (hidden companies): the band survives — aptitude is always there',
    /Prepare for placements/.test(t) && /Quantitative Aptitude/.test(t) && /Logical Reasoning/.test(t), t);
  check('prep hub (hidden companies): no company row and no mock CTA left behind',
    !/Company guides/.test(t) && !/Take a 20-question mock/.test(t), t);
  check('prep hub (hidden companies): the study column is untouched',
    /Semester 1 · 1st year · 3 subjects/.test(t), t);
});

// ── Nothing published at all ─────────────────────────────────────────────────
resetPrep({ subjects: [], companies: [] });
await section('prep hub (empty catalog)', PREP_VIEWER, { view: 'hub' }, (t) => {
  check('prep hub (empty): says the catalog is not published instead of rendering a shell',
    /No published BBA packs yet/.test(t), t);
});

// ── Subject + topic + company pages share one breadcrumb treatment ───────────
resetPrep({ topics: [prepTopic] }, { search: '?program=bba', params: { subjectId: 'bba-micro' } });
await section('prep subject page', PREP_VIEWER, { view: 'subject' }, (t, view) => {
  check('prep subject: mounts without throwing', true);
  check('prep subject: breadcrumb is Prep › BBA › Semester 1 › subject (§3.1)',
    JSON.stringify(crumbs(view)) === JSON.stringify(['Prep', 'BBA', 'Semester 1', 'Microeconomics']), crumbs(view).join(' | '));
  check('prep subject: the current page is the aria-current crumb, not a link',
    view.all('[aria-current="page"]').length === 1
    && view.all('[aria-current="page"]')[0].textContent.trim() === 'Microeconomics', '');
  check('prep subject: keeps its share control', /Share \/ copy link/.test(t), t);
  check('prep subject: topic links carry the program so "back" returns to the same catalog',
    view.hrefs().includes('/prep/subject/bba-micro/topic/bba-micro-t1?program=bba'), view.hrefs().join(' '));
});

resetPrep({ topics: [prepTopic] }, { search: '?program=bba', params: { subjectId: 'bba-micro', topicId: 'bba-micro-t1' } });
await section('prep topic page', PREP_VIEWER, { view: 'topic' }, (t, view) => {
  check('prep topic: mounts without throwing', true);
  check('prep topic: breadcrumb names program, semester, subject and topic',
    JSON.stringify(crumbs(view)) === JSON.stringify(
      ['Prep', 'BBA', 'Semester 1', 'Microeconomics', 'Demand, Supply & Equilibrium']), crumbs(view).join(' | '));
  check('prep topic: the subject crumb links back to the subject with its program',
    view.hrefs().includes('/prep/subject/bba-micro?program=bba'), view.hrefs().join(' '));
  check('prep topic: the semester crumb links back to that semester on the hub',
    view.hrefs().includes('/prep?program=bba&sem=1'), view.hrefs().join(' '));
  check('prep topic: still renders every content section',
    /Explanation/.test(t) && /Formulas/.test(t) && /Tricks/.test(t) && /How to Solve/.test(t) && /Practice/.test(t), t);
});

resetPrep({ questions: [prepQuestion] }, { search: '?program=bca&tab=mock', params: { companyCode: 'capgemini' } });
await section('prep company page', PREP_VIEWER, { view: 'company' }, (t, view) => {
  check('prep company: mounts without throwing', true);
  check('prep company: breadcrumb matches the subject/topic pages',
    JSON.stringify(crumbs(view)) === JSON.stringify(['Prep', 'BCA', 'Placement', 'Capgemini']), crumbs(view).join(' | '));
  check('prep company: ?tab=mock opens the mock rather than the pattern tab',
    /questions sampled from the topics this test uses/.test(t), t);
  check('prep company: keeps the checklist tab with its progress label',
    /Topics to prepare/.test(t), t);
});

resetPrep();


await server.close();

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed, ${crashes} mount crash(es)`);
process.exit(failed.length === 0 && crashes === 0 ? 0 : 1);
