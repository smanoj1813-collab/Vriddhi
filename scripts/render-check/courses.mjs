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
import fs from 'node:fs';
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

// Discover every bundled pack for overview and Markdown regression sweeps.
const coursesDir = path.resolve(root, 'content/courses');
const packs = fs.readdirSync(coursesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(coursesDir, entry.name, 'course.json')))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((entry) => ({
    packDir: path.join(coursesDir, entry.name),
    manifest: JSON.parse(fs.readFileSync(path.join(coursesDir, entry.name, 'course.json'), 'utf8')),
  }));
// Keep the detailed interaction checks on their existing GenAI fixture.
const { manifest } = packs.find((pack) => pack.manifest.id === 'genai-certification');
const firstTopic = manifest.modules[0].topics[0];
const secondTopic = manifest.modules[0].topics[1];
const topicCount = manifest.modules.reduce((n, m) => n + m.topics.length, 0);
const { getCourse } = await server.ssrLoadModule('/src/shared/courses/courseCatalog.ts');
const firstTopicSlides = getCourse(manifest.id)?.slides[firstTopic.id] ?? [];
check('catalog: optional slide deck is loaded from the module bank', firstTopicSlides.length === 5, `slides=${firstTopicSlides.length}`);

localStorage.clear();

// ── Catalog ─────────────────────────────────────────────────────────────────
await section('catalog', '/src/modules/courses/CourseCatalogPage.tsx', { basePath: '/courses', publicPreview: true }, (v) => {
  const t = v.text();
  check('catalog: mounts without throwing', true);
  check('catalog: lists every bundled course by title', packs.every(({ manifest: pack }) => t.includes(pack.title)), t);
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
  check('student catalog: shows only the assigned GenAI course', t.includes(manifest.title) && !t.includes('No courses assigned')
    && packs.every(({ manifest: pack }) => pack.id === manifest.id || !t.includes(pack.title)), t);
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
  // The panel renders one card per bundled course pack (alphabetical), so the
  // harness must scope every selector to THIS manifest's card — a new pack
  // that sorts first would otherwise swallow the clicks below.
  const card = () => v.all('article').find((a) => a.textContent.includes(manifest.code));
  const toggle = card()?.querySelector('input[role="switch"]');
  check('assignment panel: provides an assignment switch', !!toggle, t);
  await v.click(toggle);
  const dates = () => [...(card()?.querySelectorAll('input[type="date"]') ?? [])];
  const notes = () => card()?.querySelector('textarea') ?? null;
  check('assignment panel: shows optional programme, start/due and notes controls', dates().length === 2 && !!notes(), v.text());
  const bcomOption = [...(card()?.querySelectorAll('input[type="checkbox"]') ?? [])].find((input) => input.parentElement?.textContent.includes('B.Com'));
  check('assignment panel: offers college programme targeting', !!bcomOption, v.text());
  if (bcomOption) await v.click(bcomOption);
  await v.change(dates()[0], '2026-10-01');
  await v.change(dates()[1], '2026-12-01');
  await v.change(notes(), 'Complete the cohort project before the due date.');
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

// Every pack must render its title and grade bands on both overview routes.
for (const { manifest: pack } of packs) {
  globalThis.__RC_PARAMS = { courseId: pack.id };
  for (const basePath of ['/courses', '/student/courses']) {
    await section(`${pack.id}: ${basePath} overview`, '/src/modules/courses/CourseOverviewPage.tsx', { basePath }, (v) => {
      const t = v.text();
      check(`${pack.id}: ${basePath} overview renders title`, t.includes(pack.title), t);
      check(`${pack.id}: ${basePath} overview renders grade bands`,
        Array.isArray(pack.assessment.grades) && pack.assessment.grades.length > 0
          && pack.assessment.grades.every((grade) => t.includes(grade.band) && (grade.min === 0 || t.includes(`≥ ${grade.min}%`))), t);
    });
  }
}

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
  check('lesson: shows a Slides tab when a topic deck exists', new RegExp(`Slides · ${firstTopicSlides.length}`).test(t), t);
  await v.click(v.byText('Slides'));
  check('slides: opens an in-course visual walkthrough', v.text().includes(firstTopicSlides[0].title) && /Slide 1 of 5/.test(v.text()), v.text());
  check('slides: provides accessible navigation and no download controls',
    !!v.el('[aria-label="Slide navigation"]') && !!v.el('[aria-label^="Slide walkthrough"]')
      && !v.el('[download]') && !/download|\.pdf|\.pptx/i.test(v.all('button').map((button) => button.textContent).join(' ')),
    v.text());
  await v.click(v.byText('Next slide'));
  check('slides: next button advances the slide', v.text().includes(firstTopicSlides[1].title) && /Slide 2 of 5/.test(v.text()), v.text());
  const slideViewer = v.el('[aria-label^="Slide walkthrough"]');
  await act(async () => { slideViewer.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); });
  await v.settle();
  check('slides: arrow keys navigate the walkthrough', v.text().includes(firstTopicSlides[2].title) && /Slide 3 of 5/.test(v.text()), v.text());
  await v.click(v.byText('Lesson'));

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

// Smoke-test every additional pack through the real lazy lesson, slides and
// quiz loaders. Keep the detailed GenAI checks above as the interaction fixture.
for (const { manifest: pack } of packs.filter(({ manifest: item }) => item.id !== manifest.id)) {
  const course = getCourse(pack.id);
  const topic = pack.modules[0].topics[0];
  const questions = course.quizzes[topic.id];
  const deck = course.slides[topic.id] ?? [];
  const uid = `pack-smoke-${pack.id}`;
  globalThis.__RC_PARAMS = { courseId: pack.id, topicId: topic.id };
  await section(`${pack.id}: first lesson`, '/src/modules/courses/CourseLessonPage.tsx', { basePath: '/courses', uid }, async (v) => {
    for (let i = 0; i < 20 && !/Learning objectives/.test(v.text()); i += 1) await v.settle(50);
    check(`${pack.id}: first lesson body loads`, v.text().includes(topic.title) && /Learning objectives/.test(v.text()), v.text());
    check(`${pack.id}: quiz count matches manifest`, questions.length === (pack.lessonQuizQuestionCount ?? 5)
      && v.text().includes(`Quiz · ${questions.length}`), v.text());
    if (deck.length) {
      await v.click(v.byText('Slides'));
      check(`${pack.id}: slide walkthrough loads`, v.text().includes(deck[0].title) && v.text().includes(`Slide 1 of ${deck.length}`), v.text());
    }
    await v.click(v.byText('Quiz'));
    check(`${pack.id}: every question has four answer controls`, v.all('input[type=radio]').length === questions.length * 4, v.text());
    for (const q of questions) await v.click(v.el(`input[name="${q.id}"][value="${q.answerIndex}"]`));
    await v.click(v.byText('Check answers'));
    check(`${pack.id}: quiz scores against its own bank`, v.text().includes(`${questions.length} / ${questions.length} correct`) && /Why:/.test(v.text()), v.text());
    const stored = JSON.parse(localStorage.getItem(`vriddhi.course.progress.${uid}.${pack.id}`) || '{}');
    check(`${pack.id}: quiz progress is stored under its course id`, stored.quiz?.[topic.id]?.score === questions.length
      && stored.quiz?.[topic.id]?.total === questions.length && stored.quiz?.[topic.id]?.attempts === 1, JSON.stringify(stored));
  });
  globalThis.__RC_PARAMS = undefined;
  await section(`${pack.id}: assigned student catalog`, '/src/modules/courses/CourseCatalogPage.tsx', {
    basePath: '/student/courses', uid, assignedCourseIds: [pack.id],
  }, (v) => {
    check(`${pack.id}: only the assigned course is listed`, v.text().includes(pack.title)
      && packs.every(({ manifest: other }) => other.id === pack.id || !v.text().includes(other.title)), v.text());
    check(`${pack.id}: assigned course uses the protected route`, v.hrefs().includes(`/student/courses/${pack.id}`), v.hrefs().join(' '));
  });
}

// ── Unknown ids degrade gracefully ──────────────────────────────────────────
globalThis.__RC_PARAMS = { courseId: 'nope', topicId: 'nope' };
await section('lesson (missing)', '/src/modules/courses/CourseLessonPage.tsx', { basePath: '/courses' }, (v) => {
  check('lesson: unknown course renders an empty state, not a crash', /Lesson not found/.test(v.text()), v.text());
});

// ── Every lesson body renders through CourseMarkdown ────────────────────────
// The page checks above exercise one lesson; this sweep renders every pack's files
// (with a per-file time budget) so a stray construct in any lesson — a table
// without a separator row, a nested quote in a list, an unclosed fence — fails
// here rather than in a learner's browser.
for (const { packDir, manifest: pack } of packs) {
  const topics = pack.modules.flatMap((m) => m.topics);
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
  check(`${pack.id}: markdown sweep: all ${topics.length} lesson files render`, rendered === topics.length && problems.length === 0, problems.join('\n'));
  const tables = topics.length;
  check(`${pack.id}: markdown sweep: every lesson has a plan or project call-out`,
    topics.every((topic) => /\*\*(Lesson|Project) plan\*\*/.test(fs.readFileSync(path.join(packDir, topic.lesson), 'utf8'))), String(tables));
}

// Supporting documents include the synthetic fixtures, templates, rubrics and
// facilitator calendar. Verify their tables/code blocks render without errors.
for (const { packDir, manifest: pack } of packs) {
  const documents = [...new Set([...Object.values(pack.documents ?? {}), pack.finalAssessment?.blueprint].filter(Boolean))];
  for (const doc of documents) {
    const source = fs.readFileSync(path.join(packDir, doc), 'utf8');
    await section(`${pack.id}: ${doc}`, '/src/shared/components/courses/CourseMarkdown.tsx', { source }, (v) => {
      check(`${pack.id}: supporting document ${doc} renders`, !!v.el('h1') && v.all('h2').length > 0
        && !/\[object Object\]/.test(v.text()), v.text());
    });
  }
}

await server.close();

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed${crashes ? `, ${crashes} crash(es)` : ''}`);
process.exit(failed || crashes ? 1 : 0);
