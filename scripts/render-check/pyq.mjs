// Mounts the previous-year-paper assignment panels in jsdom and asserts on what
// lands in the DOM:
//   • PyqAssignmentPanel (superadmin) — lists the catalogue, assigns, saves the
//     college's config/pyqPapers doc.
//   • AssignedPyqPapersPanel (college staff) — shows ONLY assigned papers, PDF
//     fallbacks, the question-picker dialog, the createPyqAssessmentPaper call
//     and the hand-off to the scheduler.
// Firestore, callables, the prep API and the router are the stubs wired in
// ./vite.config.mts; the components and pyqAssignmentModel are shipped source.
//
// Run with: npm run test:render:pyq
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
  optimizeDeps: { noDiscovery: true, include: [] },
});

const checks = [];
function check(label, cond, detail) {
  checks.push({ label, ok: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : `\n        → ${String(detail ?? '').slice(0, 500)}`}`);
}

async function mount(file, props) {
  const mod = await server.ssrLoadModule(file);
  const host = document.createElement('div');
  document.body.appendChild(host);
  const reactRoot = createRoot(host);
  await act(async () => { reactRoot.render(React.createElement(mod.default, props)); });
  const settle = async (ms = 40) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
  await settle();
  await settle();
  return {
    text: () => host.textContent.replace(/\s+/g, ' ').trim(),
    all: (s) => [...host.querySelectorAll(s)],
    button: (label) => [...host.querySelectorAll('button')].find((b) => (b.textContent || '').replace(/\s+/g, ' ').trim().startsWith(label)) ?? null,
    click: async (el) => {
      if (!el) throw new Error('nothing to click');
      await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })); });
      await settle();
      await settle();
    },
    unmount: async () => { await act(async () => reactRoot.unmount()); host.remove(); },
  };
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

const READY = {
  id: 'bba-law-2024', contentType: 'structured', program: 'bba', programLabel: 'BBA', semester: 3,
  subjectName: 'Business Law', examLabel: 'March 2024', questionCount: 3, maxMarks: 10, durationMinutes: 90,
  universityName: 'Fixture University', status: 'published',
};
const PDF_ONLY = {
  id: 'pyq-file-abc', contentType: 'source_pdf', program: 'bba', programLabel: 'BBA', semester: 1,
  subjectName: 'AMC-106A OE-221', examLabel: '', questionCount: 0, maxMarks: 0, durationMinutes: 0,
  universityName: '', status: 'published',
  sourceFile: { fileName: 'AMC-106A OE-221.pdf', url: 'https://drive.google.com/file/d/abc/view' },
};
const NOT_ASSIGNED = {
  id: 'bsw-unassigned', contentType: 'structured', program: 'bsw', programLabel: 'BSW', semester: 2,
  subjectName: 'Community Organisation', examLabel: 'May 2023', questionCount: 4, maxMarks: 20, durationMinutes: 120,
  universityName: '', status: 'published',
};
const FULL = {
  ...READY,
  instructions: [],
  sections: [
    { id: 'A', title: 'Section A', instruction: 'Answer any ONE. Each question carries 2 marks.', answerCount: 1, marksEach: 2,
      questions: [{ label: '1(a)', text: 'Define contract.' }, { label: '1(b)', text: 'What is consideration?' }] },
    { id: 'B', title: 'Section B', instruction: 'Answer the following.', answerCount: 0, marksEach: 6,
      questions: [{ label: '2', text: 'Write short notes on:', parts: ['(a) Consumer', '(b) Defect'] }] },
  ],
};

globalThis.__RC_PREP = { papers: [READY, PDF_ONLY, NOT_ASSIGNED], paper: FULL };
globalThis.__RC_FIRESTORE_DOC = {
  data: {
    assignments: {
      [READY.id]: { enabled: true, assignedAt: '2026-10-02T00:00:00.000Z', assignedBy: 'sa' },
      [PDF_ONLY.id]: { enabled: true, assignedAt: '2026-10-02T00:00:00.000Z', assignedBy: 'sa' },
      [NOT_ASSIGNED.id]: { enabled: false },
    },
  },
};
globalThis.__RC_CALLABLE_DATA = {
  createPyqAssessmentPaper: { id: 'paper-new-1', title: 'PYQ: Business Law (March 2024)', totalQuestions: 2, totalMarks: 8, duration: 90 },
};

// ── College staff: Question Bank → Previous Year Papers ─────────────────────
await section('college panel', '/src/shared/components/pyq/AssignedPyqPapersPanel.tsx', { collegeId: 'college-a', schedulePath: '/faculty/assessments' }, async (v) => {
  const t = v.text();
  check('college panel: lists assigned papers', t.includes('Business Law') && t.includes('AMC-106A OE-221'), t);
  check('college panel: hides papers that are not assigned (or unassigned)', !t.includes('Community Organisation'), t);
  check('college panel: counts assigned and online-ready', t.includes('2 assigned · 1 online-ready'), t);
  check('college panel: PDF-only paper offers the original PDF, not an assessment',
    v.all('a').some((a) => a.getAttribute('href') === PDF_ONLY.sourceFile.url) && t.includes('questions not transcribed yet'), t);
  check('college panel: never shows a university name', !t.includes('Fixture University'), t);

  const conduct = v.all('button').filter((b) => (b.textContent || '').includes('Conduct assessment'));
  check('college panel: exactly one "Conduct assessment" (the online-ready paper)', conduct.length === 1, String(conduct.length));
  await v.click(conduct[0]);
  let d = v.text();
  check('dialog: shows the transcribed questions verbatim with parts', d.includes('Define contract.') && d.includes('(a) Consumer') && d.includes('(b) Defect'), d);
  check('dialog: shows the section rubric', d.includes('Answer any ONE'), d);
  check('dialog: everything selected by default (3 questions · 10 marks)', d.includes('3 questions · 10 marks'), d);
  check('dialog: warns when more are selected than the rubric asks', d.includes('The paper says answer any 1'), d);

  await v.click(v.button('Match the paper’s rubric'));
  d = v.text();
  check('dialog: "Match the paper’s rubric" picks the first N per section (2 questions · 8 marks)', d.includes('2 questions · 8 marks') && !d.includes('The paper says answer any 1'), d);

  await v.click(v.button('Create assessment paper'));
  const payload = (globalThis.__RC_CALLABLE_PAYLOADS || []).find((p) => p.name === 'createPyqAssessmentPaper')?.payload;
  check('dialog: calls createPyqAssessmentPaper with the paper and the selected keys',
    payload?.prepPaperId === READY.id && JSON.stringify([...payload.selectedKeys].sort()) === JSON.stringify(['A#0', 'B#0']) && payload.durationMinutes === 90,
    JSON.stringify(payload));
  check('dialog: college staff do not send a collegeId (server pins their own)', payload && !('collegeId' in payload), JSON.stringify(payload));
  d = v.text();
  check('dialog: confirms the created paper', d.includes('Assessment paper created') && d.includes('2 questions, 8 marks, 90 minutes'), d);
  await v.click(v.button('Schedule test now'));
  check('dialog: "Schedule test now" opens the scheduler with the new paper preselected',
    globalThis.__navigated === '/faculty/assessments?paperId=paper-new-1', String(globalThis.__navigated));
});

// ── Empty state: nothing assigned ───────────────────────────────────────────
const assignedDoc = globalThis.__RC_FIRESTORE_DOC;
globalThis.__RC_FIRESTORE_DOC = undefined;
await section('college panel (none assigned)', '/src/shared/components/pyq/AssignedPyqPapersPanel.tsx', { collegeId: 'college-b', schedulePath: '/admin/schedule-tests' }, async (v) => {
  const t = v.text();
  check('college panel: explains that papers come from the platform team when none are assigned',
    t.includes('No previous year papers have been assigned to your college yet'), t);
  check('college panel: lists nothing when the config doc is missing (fail closed)', !t.includes('Business Law'), t);
});
globalThis.__RC_FIRESTORE_DOC = assignedDoc;

// ── Superadmin: assign papers to a college ──────────────────────────────────
globalThis.__RC_WRITES = [];
await section('superadmin panel', '/src/shared/components/pyq/PyqAssignmentPanel.tsx', { collegeId: 'college-a', collegeName: 'College A' }, async (v) => {
  const t = v.text();
  check('superadmin panel: lists the whole catalogue', t.includes('Business Law') && t.includes('AMC-106A OE-221') && t.includes('Community Organisation'), t);
  check('superadmin panel: badges online-ready vs PDF-only', t.includes('Online-ready') && t.includes('PDF only'), t);
  check('superadmin panel: reflects the saved assignments', t.includes('2 assigned (1 online-ready)'), t);
  check('superadmin panel: never shows a university name', !t.includes('Fixture University'), t);
  const save = v.button('Save assignments');
  check('superadmin panel: Save is disabled until something changes', save?.disabled === true, String(save?.disabled));

  const toggle = v.all('button[role="checkbox"]').find((b) => b.getAttribute('aria-label') === 'Assign Community Organisation');
  await v.click(toggle);
  check('superadmin panel: toggling a paper updates the count', v.text().includes('3 assigned (2 online-ready)'), v.text());
  await v.click(v.button('Save assignments'));
  const write = (globalThis.__RC_WRITES || []).find((w) => w.path === 'colleges/college-a/config/pyqPapers');
  const a = write?.data?.assignments || {};
  check('superadmin panel: saves colleges/{id}/config/pyqPapers', !!write, JSON.stringify(globalThis.__RC_WRITES));
  check('superadmin panel: newly assigned paper is stamped with who/when',
    a[NOT_ASSIGNED.id]?.enabled === true && a[NOT_ASSIGNED.id]?.assignedBy === 'render-manager' && !!a[NOT_ASSIGNED.id]?.assignedAt, JSON.stringify(a));
  check('superadmin panel: existing assignments keep their original stamp',
    a[READY.id]?.enabled === true && a[READY.id]?.assignedBy === 'sa', JSON.stringify(a));
  check('superadmin panel: confirms the save', v.text().includes('Saved — 3 paper(s) assigned to College A'), v.text());
});

await server.close();

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed${crashes ? `, ${crashes} crash(es)` : ''}`);
process.exit(failed || crashes ? 1 : 0);
