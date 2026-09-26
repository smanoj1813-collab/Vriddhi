// Mounts the bundled-course pages (catalog → overview → lesson player) in
// jsdom against the REAL content pack under content/courses/ and asserts on
// what lands in the DOM: the manifest is read through Vite's import.meta.glob,
// a lesson's Markdown is fetched through the lazy `?raw` loader and rendered by
// CourseMarkdown, the quiz scores, and progress round-trips through
// localStorage.
//
// Run with: npm run test:render:courses
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const here = path.dirname(fileURLToPath(import.meta.url));

// jsdom has no layout, so scrollTo is "not implemented" — the lesson page calls
// it on navigation; make it a no-op instead of a console warning.
if (typeof window !== 'undefined') window.scrollTo = () => {};
const root = path.resolve(here, '../..');

const server = await createServer({
  configFile: path.resolve(here, 'vite.config.mts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  // Everything here is loaded through ssrLoadModule, which never touches the
  // client pre-bundle — so skip the dependency scan (it crawls index.html and
  // the whole app and reports unrelated stub gaps as scary-looking errors).
  optimizeDeps: { noDiscovery: true, include: [] },
});

const checks = [];
function check(label, cond, detail) {
  checks.push({ label, ok: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : `\n        → ${(detail ?? '').slice(0, 500)}`}`);
}

async function mountComponent(Comp, props = {}) {
  if (!Comp) throw new Error('render-check component was not exported');
  const host = document.createElement('div');
  document.body.appendChild(host);
  const reactRoot = createRoot(host);
  await act(async () => { reactRoot.render(React.createElement(Comp, props)); });
  const settle = async (ms = 30) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
  await settle();
  return {
    text: () => host.textContent.replace(/\s+/g, ' ').trim(),
    el: (s) => host.querySelector(s),
    all: (s) => [...host.querySelectorAll(s)],
    hrefs: () => [...host.querySelectorAll('a')].map((a) => a.getAttribute('href')),
    byText: (label, selector = 'button') =>
      [...host.querySelectorAll(selector)].find((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().startsWith(label)) ?? null,
    click: async (target) => {
      const el = typeof target === 'string' ? host.querySelector(target) : target;
      if (!el) throw new Error(`nothing to click for ${target}`);
      await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })); });
      await settle();
    },
    change: async (target, value) => {
      const el = typeof target === 'string' ? host.querySelector(target) : target;
      if (!el) throw new Error(`nothing to change for ${target}`);
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')?.set;
        if (setter) setter.call(el, value);
        else el.value = value;
        el.dispatchEvent(new window.Event('input', { bubbles: true }));
        el.dispatchEvent(new window.Event('change', { bubbles: true }));
      });
      await settle();
    },
    settle,
    unmount: async () => { await act(async () => reactRoot.unmount()); host.remove(); },
  };
}

async function mount(file, props) {
  const mod = await server.ssrLoadModule(file);
  return mountComponent(mod.default, props);
}

let crashes = 0;
async function section(label, file, props, assertions) {
  try {
    const view = await mount(file, props);
    await assertions(view);
    await view.unmount();
  } catch (err) {
    crashes++;
    check(`${label}: mounts without throwing`, false, String(err.stack ?? err.message));
  }
}

async function sectionComponent(label, Component, props, assertions) {
  try {
    const view = await mountComponent(Component, props);
    await assertions(view);
    await view.unmount();
  } catch (err) {
    crashes++;
    check(`${label}: mounts without throwing`, false, String(err.stack ?? err.message));
  }
}

// The pack under test.
const { default: manifest } = await import(path.resolve(root, 'content/courses/genai-certification/course.json'), { with: { type: 'json' } });
const firstTopic = manifest.modules[0].topics[0];
const secondTopic = manifest.modules[0].topics[1];
const topicCount = manifest.modules.reduce((n, m) => n + m.topics.length, 0);

localStorage.clear();

// ── Catalog ─────────────────────────────────────────────────────────────────
await section('catalog', '/src/modules/courses/CourseCatalogPage.tsx', { basePath: '/courses', publicPreview: true }, (v) => {
  const t = v.text();
  check('catalog: mounts without throwing', true);
  check('catalog: lists the GenAI course by title', t.includes(manifest.title), t);
  check('catalog: shows the course code and hour count', t.includes(manifest.code) && new RegExp(`Hours\\s*${manifest.totalHours}`).test(t), t);
  check('catalog: fresh learner starts at 0%', t.includes('0%'), t);
  check('catalog: "Start course" deep-links to the first topic',
    v.hrefs().includes(`/courses/${manifest.id}/learn/${firstTopic.id}`), v.hrefs().join(' '));
  check('catalog: public preview banner present', /Public preview/.test(t), t);
});

// The student catalog filters to college-assigned ids and displays assignment
// metadata without exposing other bundled courses.
await section('student catalog (assigned)', '/src/modules/courses/CourseCatalogPage.tsx', {
  basePath: '/student/courses', uid: 'student-1', assignedCourseIds: [manifest.id],
  assignments: { [manifest.id]: { enabled: true, startsOn: '2026-09-01', dueOn: '2026-12-01', notes: 'Complete this course with your cohort.' } },
}, (v) => {
  const t = v.text();
  check('student catalog: shows only the assigned GenAI course', t.includes(manifest.title) && !t.includes('No courses assigned'), t);
  check('student catalog: shows programme assignment notes and due date', t.includes('Complete this course with your cohort.') && t.includes('Due 2026-12-01'), t);
  check('student catalog: course actions use the protected student route', v.hrefs().includes(`/student/courses/${manifest.id}`), v.hrefs().join(' '));
});
await section('student catalog (unassigned)', '/src/modules/courses/CourseCatalogPage.tsx', {
  basePath: '/student/courses', uid: 'student-1', assignedCourseIds: [],
}, (v) => {
  check('student catalog: unassigned course is not listed', !v.text().includes(manifest.title), v.text());
  check('student catalog: explains that the college has not assigned a course', /No courses assigned to your college/.test(v.text()), v.text());
});
await section('student catalog (future start)', '/src/modules/courses/CourseCatalogPage.tsx', {
  basePath: '/student/courses', uid: 'student-1', assignedCourseIds: [manifest.id],
  assignments: { [manifest.id]: { enabled: true, startsOn: '2099-12-31' } },
}, (v) => {
  check('student catalog: displays a future start and withholds course links', /Available on 2099-12-31/.test(v.text()) && !v.hrefs().some((href) => href.includes(manifest.id)), v.text());
});

// Assignment panel: hidden-by-default state, copyable student URL, dates, notes,
// audit metadata and a Firestore-direct save are covered without live I/O.
globalThis.__RC_FIRESTORE_DOC = { data: { assignments: {} } };
globalThis.__RC_FIRESTORE_DOCS = [
  { id: 'student-a', data: () => ({ branch: 'B.Com' }) },
  { id: 'student-b', data: () => ({ branch: 'B.Sc' }) },
];
globalThis.__RC_WRITES = [];
await section('course assignment panel', '/src/shared/components/courses/CourseAssignmentPanel.tsx', {
  collegeId: 'college-a', collegeName: 'North College',
}, async (v) => {
  const t = v.text();
  check('assignment panel: mounts and identifies the college', t.includes('Course assignments') && t.includes('North College'), t);
  check('assignment panel: shows the student URL and hidden-by-default state', t.includes(`/student/courses/${manifest.id}`) && /Hidden until assigned/.test(t), t);
  const toggle = v.el('input[role="switch"]');
  check('assignment panel: provides an assignment switch', !!toggle, t);
  await v.click(toggle);
  check('assignment panel: shows optional programme, start/due and notes controls', v.all('input[type="date"]').length === 2 && !!v.el('textarea'), v.text());
  const bcomOption = v.all('input[type="checkbox"]').find((input) => input.parentElement?.textContent.includes('B.Com'));
  check('assignment panel: offers college programme targeting', !!bcomOption, v.text());
  if (bcomOption) await v.click(bcomOption);
  await v.change(v.all('input[type="date"]')[0], '2026-10-01');
  await v.change(v.all('input[type="date"]')[1], '2026-12-01');
  await v.change('textarea', 'Complete the cohort project before the due date.');
  const saveButton = v.byText('Save assignments');
  check('assignment panel: enables save after a draft change', !!saveButton && !saveButton.disabled, v.text());
  await v.click(saveButton);
  const saved = globalThis.__RC_WRITES.find((write) => write.path === 'colleges/college-a/config/courses');
  const assignment = saved?.data?.assignments?.[manifest.id];
  check('assignment panel: writes dates, notes and audit fields directly to Firestore',
    assignment?.enabled === true && assignment?.startsOn === '2026-10-01' && assignment?.dueOn === '2026-12-01'
      && assignment?.notes === 'Complete the cohort project before the due date.'
      && assignment?.cohort?.programs?.includes('B.Com')
      && assignment?.assignedBy === 'render-manager' && !!assignment?.assignedAt,
    JSON.stringify(saved));
});
globalThis.__RC_FIRESTORE_DOC = undefined;
globalThis.__RC_FIRESTORE_DOCS = undefined;

const accessModule = await server.ssrLoadModule('/src/modules/courses/StudentCourseAccess.tsx');
function StudentCourseGateHarness() {
  return React.createElement(accessModule.StudentCourseAccessProvider, null,
    React.createElement(accessModule.CourseAccessStatus, null,
      React.createElement(accessModule.StudentCourseUnavailable, null,
        React.createElement('div', null, 'Protected student course content'))));
}
globalThis.__RC_PARAMS = { courseId: manifest.id, topicId: firstTopic.id };
globalThis.__RC_FIRESTORE_DOC = { data: { assignments: {} } };
await sectionComponent('student deep-link gate (unassigned)', StudentCourseGateHarness, {}, (v) => {
  check('student deep-link gate: unassigned course shows a friendly unavailable state', /Course not available for your college/.test(v.text()) && /Contact your college administrator/.test(v.text()), v.text());
});
globalThis.__RC_FIRESTORE_DOC = { data: { assignments: { [manifest.id]: { enabled: true, startsOn: '2099-12-31' } } } };
await sectionComponent('student deep-link gate (future start)', StudentCourseGateHarness, {}, (v) => {
  check('student deep-link gate: future assignment date is enforced', /This course has not started yet/.test(v.text()) && !v.text().includes('Protected student course content'), v.text());
});
globalThis.__RC_FIRESTORE_DOC = { data: { assignments: { [manifest.id]: { enabled: true, dueOn: '2026-12-01', notes: 'Cohort note' } } } };
await sectionComponent('student deep-link gate (assigned)', StudentCourseGateHarness, {}, (v) => {
  check('student deep-link gate: assigned course renders its protected route', v.text().includes('Protected student course content'), v.text());
  check('student deep-link gate: assignment due date and notes appear on deep links', v.text().includes('Due 2026-12-01') && v.text().includes('Cohort note'), v.text());
});
globalThis.__RC_FIRESTORE_DOC = undefined;
globalThis.__RC_PARAMS = undefined;

// ── Overview ────────────────────────────────────────────────────────────────
globalThis.__RC_PARAMS = { courseId: manifest.id };
await section('overview', '/src/modules/courses/CourseOverviewPage.tsx', { basePath: '/courses' }, (v) => {
  const t = v.text();
  check('overview: mounts without throwing', true);
  check('overview: renders every module heading', manifest.modules.every((m) => t.includes(`Module ${m.number}: ${m.title}`)), t);
  check('overview: shows the syllabus count', t.includes(`${manifest.modules.length} modules · ${topicCount} lessons and projects`), t);
  check('overview: first module is expanded and lists its first topic', t.includes(firstTopic.title), t);
  check('overview: assessment weights rendered', manifest.assessment.components.every((c) => t.includes(`${c.weight}%`)), t);
  check('overview: first module mini-assessment is loaded from its quiz bank', t.includes('Hard mini assessment') && /10 scenario questions/.test(t), t);
  check('overview: incomplete module assessment remains gated', /Finish every topic and lesson quiz first/.test(t), t);
  check('overview: certificate gate is visible before eligibility', /Download eligibility/.test(t) && /Lesson quiz average at least 60%/.test(t), t);
  check('overview: programme outcomes rendered', t.includes(manifest.outcomes[0]), t);
  check('overview: links to the lesson player', v.hrefs().includes(`/courses/${manifest.id}/learn/${firstTopic.id}`), v.hrefs().join(' '));
});

// ── Lesson player ───────────────────────────────────────────────────────────
globalThis.__RC_PARAMS = { courseId: manifest.id, topicId: firstTopic.id };
await section('lesson', '/src/modules/courses/CourseLessonPage.tsx', { basePath: '/courses', uid: 'student-1' }, async (v) => {
  // The Markdown is a lazy `?raw` import — give it a moment to resolve.
  for (let i = 0; i < 20 && !/Learning objectives/.test(v.text()); i += 1) await v.settle(50);
  const t = v.text();
  check('lesson: mounts without throwing', true);
  check('lesson: shows the topic title', t.includes(firstTopic.title), t);
  check('lesson: Markdown body rendered (Learning objectives heading)', /Learning objectives/.test(t), t);
  check('lesson: H1 from the file is not duplicated', (t.match(new RegExp(firstTopic.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length <= 3, t);
  check('lesson: fenced prompt renders as a code block with Copy', v.el('pre code') !== null && /Copy/.test(t), t);
  check('lesson: a table renders', v.el('table') !== null, t);
  check('lesson: quiz tab shows all 15 questions', /Quiz · 15/.test(t), t);
  check('lesson: outline lists the next topic', t.includes(secondTopic.title), t);

  // Reaching the end marker records the read event; there is no manual bypass.
  for (let i = 0; i < 10; i += 1) {
    const current = JSON.parse(localStorage.getItem(`vriddhi.course.progress.student-1.${manifest.id}`) || '{}');
    if (current.read?.[firstTopic.id]) break;
    await v.settle(30);
  }
  const stored = JSON.parse(localStorage.getItem(`vriddhi.course.progress.student-1.${manifest.id}`) || '{}');
  check('lesson: end marker marks content read in localStorage', !!stored.read?.[firstTopic.id] && !!stored.completed?.[firstTopic.id], JSON.stringify(stored));
  check('lesson: header shows Completed chip', /Completed/.test(v.text()), v.text());
  check('lesson: next topic remains locked until quiz submission', !v.hrefs().includes(`/courses/${manifest.id}/learn/${secondTopic.id}`) && /submit the 15-question quiz to unlock/.test(v.text()), v.text());

  // Quiz: answer all questions and verify the 15-item result is persisted.
  await v.click(v.byText('Quiz'));
  const radios = v.all('input[type=radio]');
  check('quiz: 15 questions × four options rendered', radios.length === 60, `radios=${radios.length}`);
  const firstOptions = v.all('li input[type=radio]').filter((r) => r.value === '0');
  for (const r of firstOptions) await v.click(r);
  const checkBtn = v.byText('Check answers');
  check('quiz: submit enabled once all answered', checkBtn && !checkBtn.disabled, v.text());
  await v.click(checkBtn);
  const after = v.text();
  check('quiz: score shown after submit', /\d+ \/ 15 correct/.test(after), after);
  check('quiz: explanations shown', /Why:/.test(after), after);
  const stored2 = JSON.parse(localStorage.getItem(`vriddhi.course.progress.student-1.${manifest.id}`) || '{}');
  check('quiz: best result persisted with attempt count', stored2.quiz?.[firstTopic.id]?.attempts === 1 && stored2.quiz?.[firstTopic.id]?.total === 15, JSON.stringify(stored2.quiz));
});

// ── Progress reflects on the overview ───────────────────────────────────────
globalThis.__RC_PARAMS = { courseId: manifest.id };
await section('overview (after progress)', '/src/modules/courses/CourseOverviewPage.tsx', { basePath: '/courses', uid: 'student-1' }, (v) => {
  const t = v.text();
  const expected = Math.round((1 / topicCount) * 100);
  check('overview: progress reflects the completed lesson', t.includes(`1/${topicCount} complete`) && t.includes(`${expected}%`), t);
  check('overview: "Continue with" points at the second topic', new RegExp(`Continue with ${secondTopic.number}`).test(t), t);
});

// ── Unknown ids degrade gracefully ──────────────────────────────────────────
globalThis.__RC_PARAMS = { courseId: 'nope', topicId: 'nope' };
await section('lesson (missing)', '/src/modules/courses/CourseLessonPage.tsx', { basePath: '/courses' }, (v) => {
  check('lesson: unknown course renders an empty state, not a crash', /Lesson not found/.test(v.text()), v.text());
});

// ── Every lesson body renders through CourseMarkdown ────────────────────────
// The page checks above exercise one lesson; this sweep renders all 41 files
// (with a per-file time budget) so a stray construct in any lesson — a table
// without a separator row, a nested quote in a list, an unclosed fence — fails
// here rather than in a learner's browser.
{
  const fs = await import('node:fs');
  const packDir = path.resolve(root, 'content/courses/genai-certification');
  const topics = manifest.modules.flatMap((m) => m.topics);
  let rendered = 0;
  let problems = [];
  for (const topic of topics) {
    const source = fs.readFileSync(path.join(packDir, topic.lesson), 'utf8');
    const started = Date.now();
    try {
      const v = await mount('/src/shared/components/courses/CourseMarkdown.tsx', { source, skipTitle: true });
      const t = v.text();
      const took = Date.now() - started;
      const headings = v.all('h2').length;
      const expected = topic.type === 'project' ? /The brief/ : /Learning objectives/;
      if (!expected.test(t)) problems.push(`${topic.id}: expected section heading missing`);
      if (headings < 3) problems.push(`${topic.id}: only ${headings} h2 headings rendered`);
      if (v.el('h1')) problems.push(`${topic.id}: H1 rendered despite skipTitle`);
      if (/undefined|\[object Object\]/.test(t)) problems.push(`${topic.id}: rendered text contains "undefined"/"[object Object]"`);
      if (took > 2000) problems.push(`${topic.id}: took ${took} ms to render`);
      await v.unmount();
      rendered++;
    } catch (err) {
      problems.push(`${topic.id}: threw ${String(err.message).slice(0, 200)}`);
    }
  }
  check(`markdown sweep: all ${topics.length} lesson files render`, rendered === topics.length && problems.length === 0, problems.join('\n'));
  const tables = topics.length;
  check('markdown sweep: every lesson has a plan or project call-out',
    topics.every((topic) => /\*\*(Lesson|Project) plan\*\*/.test(fs.readFileSync(path.join(packDir, topic.lesson), 'utf8'))), String(tables));
}

await server.close();

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed${crashes ? `, ${crashes} crash(es)` : ''}`);
process.exit(failed || crashes ? 1 : 0);
