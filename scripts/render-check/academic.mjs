// Real academic components and CSV parser; only Firebase/Auth/router I/O is
// replaced by the existing render harness. No production project is contacted.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const server = await createServer({ root, configFile: path.join(root, 'scripts/render-check/vite.config.mts'), server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel: 'error' });
let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log(`ok ${checks} - ${name}`); };
const settle = async () => { await act(async () => { await new Promise(r => setTimeout(r, 25)); }); };
const click = async el => { assert.ok(el, 'Expected a button'); await act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))); await settle(); };
const buttons = label => [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === label);
async function mount(file, props = {}) {
  const Comp = typeof file === 'function' ? file : (await server.ssrLoadModule(file)).default;
  const host = document.createElement('div'); document.body.appendChild(host);
  const reactRoot = createRoot(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  await act(async () => reactRoot.render(React.createElement(QueryClientProvider, { client }, React.createElement(Comp, props))));
  await settle(); await settle();
  return { client, rerender: async nextProps => { await act(async () => reactRoot.render(React.createElement(QueryClientProvider, { client }, React.createElement(Comp, nextProps)))); await settle(); await settle(); }, text: () => document.body.textContent.replace(/\s+/g, ' '), close: async () => { await act(async () => reactRoot.unmount()); client.clear(); host.remove(); } };
}
const seedCollege = pack => { globalThis.__RC_FIRESTORE_DOC = { data: pack ? { schemePackId: pack.id, schemePackRevision: pack.revision, schemePackSnapshot: pack } : {} }; };
const csvFile = csv => ({ arrayBuffer: async () => new TextEncoder().encode(csv).buffer });
const type = async (el, value) => {
  assert.ok(el, 'Expected an input');
  await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, value); el.dispatchEvent(new window.Event('input', { bubbles: true })); }); await settle();
};
const inputWithLabel = text => { const label = [...document.querySelectorAll('label')].find(el => el.textContent === text); return label && document.getElementById(label.htmlFor); };
const selectOption = async (labelId, text) => {
  const combo = [...document.querySelectorAll('[role=combobox]')].find(el => el.getAttribute('aria-labelledby')?.split(' ').includes(labelId));
  assert.ok(combo, `Expected select ${labelId}`);
  await act(async () => combo.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))); await settle();
  await click([...document.querySelectorAll('[role=option]')].find(el => el.textContent === text));
};
const nativeSelect = async (el, value) => { await act(async () => { el.value = value; el.dispatchEvent(new window.Event('change', { bubbles: true })); }); await settle(); };
const submitForm = async () => { await act(async () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))); await settle(); await settle(); };
const docRow = (id, data) => ({ id, data: () => data });
try {
  localStorage.setItem('vriddhi_college_id', 'college-a');
  globalThis.__RC_ROLE = 'principal'; globalThis.__RC_FIRESTORE_DOCS = [];
  globalThis.__RC_CALLABLE_DATA = {}; globalThis.__RC_CALLABLE_PAYLOADS = []; globalThis.__RC_WRITES = [];
  window.confirm = () => true;
  const { academicFixture } = await server.ssrLoadModule('/functions/test/helpers/academicFixture.ts');
  const p = academicFixture();

  seedCollege(null);
  let view = await mount('/src/modules/admin/pages/SchemePacks.tsx');
  check('unconfigured college is labelled configuration required', () => assert.match(view.text(), /Configuration required|configuration required/));
  check('unconfigured college has no falsely assigned cards', () => assert.doesNotMatch(view.text(), /Active r\d|\(default\)/));
  check('templates do not auto-activate a university', () => assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.length, 0));
  await click(buttons('Choose a template')[0]);
  check('new pack requires an explicit authoring template choice', () => { assert.match(view.text(), /Explicitly choose an authoring template/); assert.match(view.text(), /Nothing is assigned automatically/); });
  await view.close();

  seedCollege(p); globalThis.__RC_FIRESTORE_DOCS = [{ id: p.id, data: () => ({ ...p, collegeId: 'college-a', revision: 2 }) }];
  globalThis.__RC_CALLABLE_DATA.configureCollegeSchemePacks = { collegeId: 'college-a', configurationRevision: 1 };
  view = await mount('/src/modules/admin/pages/SchemePacks.tsx');
  check('active revision and newer saved revision are distinguished', () => { assert.match(view.text(), /Primary r1/); assert.match(view.text(), /Saved r2/); });
  await click(buttons('Review & use saved r2')[0]);
  await click(buttons('Save assigned packs & primary')[0]);
  check('multi-pack save sends the explicitly reviewed revision, primary, configuration revision and tenant', () => assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS.at(-1), { name: 'configureCollegeSchemePacks', payload: { collegeId: 'college-a', selection: { assignments: [{ schemePackId: p.id, revision: 2 }], primarySchemePackId: p.id, routes: [] }, expectedConfigurationRevision: 0 } }));
  await view.close();

  globalThis.__RC_CALLABLE_DATA.saveSchemePack = { id: p.id, revision: 3 };
  view = await mount('/src/modules/admin/pages/SchemePacks.tsx');
  await click(buttons('Edit')[0]);
  const methodCombo = [...document.querySelectorAll('[role=combobox]')].find(l => l.textContent === 'Fixed points from grade table');
  const roundingCombo = [...document.querySelectorAll('[role=combobox]')].find(l => l.textContent === 'No percentage rounding');
  await selectOption(methodCombo.getAttribute('aria-labelledby'), 'Actual percentage divided by 10'); await selectOption(roundingCombo.getAttribute('aria-labelledby'), 'Nearest integer before GP lookup');
  await click(buttons('Save pack')[0]);
  check('policy editor saves the explicit GP formula and lookup rounding, without changing pass floors', () => { const call = globalThis.__RC_CALLABLE_PAYLOADS.findLast(c => c.name === 'saveSchemePack'); assert.deepEqual(call.payload.pack.gradePointPolicy, { method: 'percentage-divided-by-ten', percentageRounding: 'nearest-integer' }); assert.equal(call.payload.pack.semesterEndExam.passPercentage, p.semesterEndExam.passPercentage); });
  await view.close();

  globalThis.__RC_FIRESTORE_DOCS = []; seedCollege(null);
  view = await mount('/src/modules/admin/pages/BCUComplianceDashboard.tsx');
  check('compliance does not render a BCU sample while configuration is missing', () => { assert.match(view.text(), /Academic configuration required/); assert.doesNotMatch(view.text(), /Sample Result|80\+20 marks split/); });
  await view.close();
  view = await mount('/src/modules/admin/pages/ResultImporter.tsx');
  check('result upload is disabled without an active scheme', () => assert.equal(document.querySelector('input[type=file]').disabled, true));
  check('import UI explains drafts and does not promise auto-publication or BCU checks', () => { assert.match(view.text(), /server-verified drafts/); assert.doesNotMatch(view.text(), /Auto Publish|35% uni|0-80/); });
  await view.close();

  seedCollege(p); globalThis.__RC_CALLABLE_DATA.listManagedGradeRecords = { records: [] };
  view = await mount('/src/modules/admin/pages/GradeRecords.tsx');
  check('manual grade entry shows active policy and calculated read-only values', () => { assert.match(view.text(), /TEST_POLICY, revision 1/); assert.ok(document.querySelectorAll('input[readonly]').length >= 4); assert.match(view.text(), /Approved credits/); });
  await view.close();

  const api = await server.ssrLoadModule('/src/modules/admin/api/resultImportApi.ts');
  const header = 'regNo,name,semester,course,batch,subjectCode,internal,external,credits,result';
  const csv = `${header}\nA001,Test,1,BCA,2026-27,CS101,20,65,,\nA001,Test,1,BCA,2026-27,CS102,10,45,,\nA001,Test,1,BCA,2026-27,CS103,20,27,,`;
  let preview = await api.parseResultFile(csvFile(csv));
  check('real CSV parser uses approved credits and evaluated pass/fail summaries', () => { assert.equal(preview.errors.length, 0); assert.equal(preview.rows[1].credits, 2); assert.equal(preview.summary.passCount, 2); assert.equal(preview.summary.failCount, 1); });
  const grouped = api.groupResultsByStudent(preview.rows, preview.schemeConfiguration);
  check('real parse-to-preview path produces 4.8 SGPA and six earned credits', () => { assert.equal(grouped[0].sgpa, 4.8); assert.equal(grouped[0].creditsEarned, 6); });
  preview = await api.parseResultFile(csvFile(`${header}\nA001,Test,1,BCA,2026-27,ZERO,20,65,0,`));
  check('CSV parser preserves a legitimate explicit zero-credit course', () => { assert.equal(preview.errors.length, 0); assert.equal(preview.rows[0].credits, 0); });
  preview = await api.parseResultFile(csvFile(`${header}\nA001,Test,,BCA,2026-27,CS101,20,65,,`));
  check('missing semester is not invented as semester one', () => assert.ok(preview.errors.some(e => /semester/i.test(e.message))));
  preview = await api.parseResultFile(csvFile(`${header}\nA001,Test,1,BCA,2026-27,CS101,20,65,not-a-number,`));
  check('malformed optional numeric data is rejected instead of silently ignored', () => assert.ok(preview.errors.some(e => /finite number/.test(e.message))));
  preview = await api.parseResultFile(csvFile(`${header}\nA001,Test,1,BCA,2026-27,CS101,20,65,,W`));
  check('withheld results cannot be turned into passing imported grades', () => { assert.ok(preview.errors.some(e => /Withheld/.test(e.message))); assert.equal(preview.rows[0].isValid, false); });
  preview = await api.parseResultFile(csvFile(`${header}\nA001,Test,1,BCA,2026-27,CS101,20,65,,\na001,Test,1,BCA,2026-27,CS101,20,65,,`));
  check('duplicate CSV course rows are blocked before saving', () => { assert.ok(preview.errors.some(e => /Duplicate/.test(e.message))); assert.equal(api.groupResultsByStudent(preview.rows, preview.schemeConfiguration).length, 0); });

  globalThis.__RC_FIRESTORE_DOCS = [{ id: 'student-a', data: () => ({ name: 'Test student', course: 'BCA', collegeId: 'college-a' }) }];
  globalThis.__RC_CALLABLE_DATA.saveDraftGradeRecords = { saved: 3 };
  globalThis.__RC_CALLABLE_PAYLOADS = [];
  const imported = await api.importResults(grouped, '2026-27', 'regular');
  check('import transport saves drafts through the official callable', () => { assert.equal(imported.imported, 3); assert.equal(imported.failed, 0); assert.equal(globalThis.__RC_CALLABLE_PAYLOADS[0].name, 'saveDraftGradeRecords'); });
  check('import payload pins policy identity and revision', () => { const payload = globalThis.__RC_CALLABLE_PAYLOADS[0].payload; assert.equal(payload.schemePackId, p.id); assert.equal(payload.schemePackRevision, 1); assert.equal(payload.records[2].gradePoint, 0); });
  check('import makes no shadow transcript or student-CGPA client writes', () => assert.equal(globalThis.__RC_WRITES.length, 0));

  // Real parser + transport, with independent pinned policies for two cohorts.
  const { collegeSchemeFields } = await server.ssrLoadModule('/functions/src/academic/collegeSchemes.ts');
  const second = { ...academicFixture(), id: 'college-a__SECOND', code: 'SECOND', name: 'Second synthetic policy', revision: 3 };
  second.courses[0].credits = 6; second.semesterEndExam.passPercentage = 50;
  const multi = { assignments: [p, second].map(snapshot => ({ schemePackId: snapshot.id, revision: snapshot.revision, snapshot })), primarySchemePackId: p.id, routes: [{ batch: '2024-25', schemePackId: second.id }], revision: 9, needsReconfirmation: false };
  globalThis.__RC_FIRESTORE_BY_PATH = { 'colleges/college-a': collegeSchemeFields(multi) };
  globalThis.__RC_FIRESTORE_COLLECTIONS = { students: [docRow('student-a', { collegeId: 'college-a', regNo: 'A001' }), docRow('student-c', { collegeId: 'college-a', regNo: 'C001' })] };
  preview = await api.parseResultFile(csvFile(`${header}\nA001,Test,1,BCA,2026-27,CS101,20,35,,\nC001,Other cohort,1,BCA,2024-25,CS101,20,35,,`));
  const mixed = api.groupResultsByStudent(preview.rows, preview.schemeConfiguration);
  check('real mixed-cohort parse resolves independent assigned credits and pass rules', () => {
    assert.equal(preview.errors.length, 0); assert.deepEqual(mixed.map(r => [r.schemePackId, r.totalCredits, r.result]), [[p.id, 4, 'PASS'], [second.id, 6, 'FAIL']]);
  });
  globalThis.__RC_CALLABLE_PAYLOADS = [];
  await api.importResults(mixed, '2026-27');
  check('mixed import pins each group’s policy and the same reviewed configuration revision', () => {
    const calls = globalThis.__RC_CALLABLE_PAYLOADS; assert.equal(calls.length, 2);
    assert.deepEqual(calls.map(c => [c.payload.schemePackId, c.payload.schemePackRevision, c.payload.schemeConfigurationRevision, c.payload.records[0].studentId]), [[p.id, 1, 9, 'student-a'], [second.id, 3, 9, 'student-c']]);
  });
  globalThis.__RC_FIRESTORE_BY_PATH['colleges/college-a'] = collegeSchemeFields({ ...multi, revision: 10, routes: [] });
  await assert.rejects(api.importResults(mixed, '2026-27'), /changed since preview/); checks++; console.log(`ok ${checks} - routing-only configuration changes invalidate mixed import previews`);

  globalThis.__RC_FIRESTORE_BY_PATH['colleges/college-a'] = collegeSchemeFields(multi);
  await assert.rejects(api.importResults(mixed.map(({ schemeConfigurationRevision, ...r }) => r), '2026-27'), /changed since preview/); checks++; console.log(`ok ${checks} - import cannot fall back to a primary-only preview without configuration provenance`);

  const examApi = await server.ssrLoadModule('/src/modules/admin/api/examManagementApi.ts');
  const strictAttendance = { ...second, attendance: { minimumPercentage: 90, marksSlabs: [{ min: 90, max: 100, marks: 5, label: 'Synthetic' }], blocksExamEligibility: true } };
  const examConfiguration = { ...multi, revision: 11, assignments: [p, strictAttendance].map(snapshot => ({ schemePackId: snapshot.id, revision: snapshot.revision, snapshot })) };
  const roster = [docRow('student-a', { collegeId: 'college-a', regNo: 'A001', course: 'BCA', batch: '2026-27', semester: 3 }), docRow('student-c', { collegeId: 'college-a', regNo: 'C001', course: 'BCA', batch: '2024-25', semester: 1 })];
  globalThis.__RC_FIRESTORE_BY_PATH = { 'colleges/college-a': collegeSchemeFields(examConfiguration), 'colleges/college-a/examSessions/session-a': { title: 'Synthetic exam', academicYear: '2026-27', course: 'BCA', semester: 1 } };
  globalThis.__RC_FIRESTORE_COLLECTIONS = { students: roster, attendanceRecords: roster.flatMap(student => Array.from({ length: 5 }, (_, i) => docRow(`${student.id}-att-${i}`, { collegeId: 'college-a', studentId: student.id, subjectCode: 'CS101', status: i < 4 ? 'present' : 'absent' }))) };
  globalThis.__RC_WRITES = [];
  const tickets = await examApi.generateHallTickets({ examSessionId: 'session-a', checkAttendanceEligibility: true });
  check('hall-ticket eligibility uses each cohort’s assigned attendance floor and retained configuration identity', () => {
    assert.equal(tickets.generated, 2); assert.equal(tickets.blocked, 1); assert.deepEqual(tickets.errors, []);
    const writes = globalThis.__RC_WRITES.filter(w => w.data.examSessionId === 'session-a');
    assert.ok(writes.every(w => w.data.semester === 1)); // exam semester, not roster’s current semester
    assert.deepEqual(writes.map(w => [w.data.schemePackId, w.data.schemeConfigurationRevision, w.data.status]), [[p.id, 11, 'generated'], [second.id, 11, 'blocked']]);
  });
  globalThis.__RC_FIRESTORE_COLLECTIONS.students = Array.from({ length: 500 }, (_, i) => docRow(`student-${i}`, roster[0].data())); globalThis.__RC_WRITES = [];
  await assert.rejects(examApi.generateHallTickets({ examSessionId: 'session-a' }), /safe hall-ticket read limit/); checks++; console.log(`ok ${checks} - hall-ticket generation rejects a truncated roster before any ticket writes`);
  globalThis.__RC_FIRESTORE_COLLECTIONS.students = [roster[0]];
  globalThis.__RC_FIRESTORE_COLLECTIONS.attendanceRecords = Array.from({ length: 200 }, (_, i) => docRow(`att-${i}`, { collegeId: 'college-a', studentId: 'student-a', status: 'present' }));
  const incompleteAttendance = await examApi.generateHallTickets({ examSessionId: 'session-a', checkAttendanceEligibility: true });
  check('hall-ticket generation never treats truncated attendance as a complete percentage', () => { assert.equal(incompleteAttendance.generated, 0); assert.match(incompleteAttendance.errors[0], /safe eligibility read limit/); assert.equal(globalThis.__RC_WRITES.filter(w => w.data.examSessionId === 'session-a').length, 0); });

  // The shared multi-selector never guesses a primary, and removes dependent routes.
  const { CollegeSchemeSelector, emptySchemeSelection, useCollegeSchemeEditor } = await server.ssrLoadModule('/src/modules/admin/components/CollegeSchemeSelector.tsx');
  let selected;
  function SelectorHarness() { const [value, setValue] = React.useState(emptySchemeSelection); selected = value; return React.createElement(CollegeSchemeSelector, { choices: [p, second].map(pack => ({ pack, origin: 'custom' })), value, onChange: setValue }); }
  view = await mount(SelectorHarness);
  await click(document.querySelectorAll('input[type=checkbox]')[0]); await click(document.querySelectorAll('input[type=checkbox]')[1]);
  check('multiple selections require an explicit primary instead of taking the first checked pack', () => { assert.equal(selected.assignments.length, 2); assert.equal(selected.primarySchemePackId, null); assert.match(view.text(), /Choose exactly one primary/); });
  await selectOption('college-primary-scheme-label', second.name);
  await click(buttons('Add programme/cohort route')[0]); await type(inputWithLabel('Route 1 programme'), 'BCA'); await type(inputWithLabel('Route 1 batch'), '2024-25'); await type(inputWithLabel('Route 1 semester'), '2');
  check('primary and programme/cohort/semester scope remain explicit controlled state', () => { assert.equal(selected.primarySchemePackId, second.id); assert.deepEqual(selected.routes, [{ schemePackId: second.id, programme: 'BCA', batch: '2024-25', semester: 2 }]); });
  await click(document.querySelectorAll('input[type=checkbox]')[1]);
  check('unassigning the primary clears it and dependent routes rather than silently choosing another', () => { assert.equal(selected.primarySchemePackId, null); assert.equal(selected.assignments.length, 1); assert.equal(selected.routes.length, 0); });
  await view.close();

  const eleven = Array.from({ length: 11 }, (_, i) => ({ ...p, id: `college-a__PACK${i}`, code: `PACK${i}` }));
  view = await mount(CollegeSchemeSelector, { choices: eleven.map(pack => ({ pack, origin: 'custom' })), value: { assignments: eleven.slice(0, 10).map(pack => ({ schemePackId: pack.id, revision: 1 })), primarySchemePackId: eleven[0].id, routes: [] }, onChange: () => {} });
  check('selector enforces ten assigned packs without preventing explicit removal of a selected pack', () => { const checkboxes = document.querySelectorAll('input[type=checkbox]'); assert.equal(checkboxes[10].disabled, true); assert.equal(checkboxes[0].disabled, false); });
  await view.close();

  const catalogue = await server.ssrLoadModule('/src/modules/admin/components/SchemeResearchCatalogue.tsx');
  view = await mount(catalogue.default);
  check('catalogue separates all 23 source-backed preparation drafts from assignable policies', () => { assert.match(view.text(), /23 research drafts shown/); assert.match(view.text(), /0 newly certified assignable packs/); assert.equal(buttons('Download preparation draft JSON').length, 23); assert.equal(buttons('Activate').length, 0); });
  await type(inputWithLabel('Find university / programme'), 'Vijayanagara University');
  check('catalogue search exposes the unresolved seed identity instead of cloning VSKU regulations', () => { assert.match(view.text(), /1 research draft shown/); assert.match(view.text(), /University identity needs review/); assert.match(view.text(), /VIJ · Vijayanagara University/); });
  await view.rerender({ universityCode: 'BCU' }); await type(inputWithLabel('Find university / programme'), '');
  check('university-filtered catalogue exposes regulatory conflicts and source limitations', () => { assert.match(view.text(), /1 research draft shown/); assert.match(view.text(), /Conflicting \/ unapproved source/); assert.ok([...document.querySelectorAll('a')].some(a => a.href.includes('bcu.ac.in/uploads/syllabus/'))); });
  await view.close();

  // Query refetches must not discard unsaved selections. Explicit reset/reload may.
  globalThis.__RC_FIRESTORE_BY_PATH = { 'colleges/college-a': collegeSchemeFields(multi), 'colleges/college-b': collegeSchemeFields({ assignments: [], primarySchemePackId: null, routes: [], revision: 2, needsReconfirmation: false }) };
  globalThis.__RC_FIRESTORE_COLLECTIONS = { schemePacks: [p, second].map(pack => docRow(pack.id, { ...pack, collegeId: 'college-a' })) };
  let editor;
  function EditorHarness({ collegeId }) { editor = useCollegeSchemeEditor(collegeId); return React.createElement('div', null, editor.loading ? 'Loading' : editor.error || 'Ready'); }
  view = await mount(EditorHarness, { collegeId: 'college-a' });
  check('editor hydrates independently pinned assignments and configuration revision', () => { assert.equal(editor.loading, false); assert.equal(editor.revision, 9); assert.equal(editor.selection.assignments[1].revision, 3); });
  const unsaved = { ...editor.selection, primarySchemePackId: second.id, routes: [{ programme: 'MCA', schemePackId: second.id }] };
  await act(async () => editor.setSelection(unsaved));
  await act(async () => view.client.refetchQueries({ queryKey: ['schemePack', 'college-a', 'configuration'] })); await settle();
  check('background configuration refetch preserves unsaved primary and routes', () => assert.deepEqual(editor.selection, unsaved));
  globalThis.__RC_FIRESTORE_BY_PATH['colleges/college-a'] = collegeSchemeFields({ ...multi, revision: 10, routes: [] });
  await act(async () => view.client.refetchQueries({ queryKey: ['schemePack', 'college-a', 'configuration'] })); await settle();
  check('concurrent server changes show a reload error without silently replacing unsaved work', () => { assert.match(editor.error, /assignments changed/); assert.equal(editor.revision, 9); assert.deepEqual(editor.selection, unsaved); });
  await act(async () => editor.reset()); await settle();
  check('explicit reset adopts the latest reviewed server revision and clears stale-route errors', () => { assert.equal(editor.revision, 10); assert.equal(editor.selection.primarySchemePackId, p.id); assert.deepEqual(editor.selection.routes, []); assert.equal(editor.error, ''); });
  await act(async () => editor.setSelection(unsaved)); await act(async () => editor.reload()); await settle(); await settle();
  check('explicit reload restores server pins after a save rather than retaining an old reviewed revision', () => { assert.equal(editor.revision, 10); assert.equal(editor.selection.primarySchemePackId, p.id); });
  await view.rerender({ collegeId: 'college-b' });
  check('switching college identity never reuses the previous college’s edited assignments', () => { assert.equal(editor.loading, false); assert.equal(editor.revision, 2); assert.deepEqual(editor.selection.assignments, []); });
  await view.close();

  // The onboarding form and transport are real; only external services are stubbed.
  globalThis.__RC_ROLE = 'superadmin';
  const created = { name: 'New reviewed college', code: 'NEW', universityId: 'generated-bcu', universityCode: 'BCU' };
  globalThis.__RC_FIRESTORE_BY_PATH = { 'systemConfig/app': { allowCollegeOnboarding: true }, 'colleges/new-college': created };
  globalThis.__RC_FIRESTORE_COLLECTIONS = { universities: [docRow('generated-bcu', { code: 'BCU', name: 'Bengaluru City University' })], schemePacks: [] };
  globalThis.__RC_CALLABLE_DATA.saveCollegeWithSchemes = { collegeId: 'new-college', configurationRevision: 1 };
  globalThis.__RC_CALLABLE_PAYLOADS = []; globalThis.__RC_WRITES = [];
  view = await mount('/src/modules/superadmin/pages/CreateCollege.tsx');
  await type(document.querySelector('[name=name]'), created.name); await type(document.querySelector('[name=code]'), created.code);
  await nativeSelect(document.querySelector('[name=universityId]'), 'generated-bcu');
  check('affiliation uses the generated university ID and filters research without assigning academic rules', () => { assert.equal(document.querySelector('[name=universityId]').value, 'generated-bcu'); assert.equal(document.querySelectorAll('input[type=checkbox]:checked').length, 0); assert.match(view.text(), /1 research draft shown/); assert.match(view.text(), /BCU · Bengaluru City University/); assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.length, 0); });
  await click(document.querySelectorAll('input[type=checkbox]')[0]); await click(document.querySelectorAll('input[type=checkbox]')[1]);
  check('college creation is disabled until a selected primary is explicitly reviewed', () => assert.equal(buttons('Create College')[0].disabled, true));
  await selectOption('college-primary-scheme-label', 'Karnatak University Dharwad — NEP CBAE');
  await submitForm();
  check('college onboarding sends multi-selection, explicit primary and affiliation in one callable', () => {
    const call = globalThis.__RC_CALLABLE_PAYLOADS.find(c => c.name === 'saveCollegeWithSchemes'); assert.ok(call);
    assert.deepEqual(call.payload.selection, { assignments: [{ schemePackId: 'BCU_SEP_2024', revision: 1 }, { schemePackId: 'KUD_NEP_CBAE', revision: 1 }], primarySchemePackId: 'KUD_NEP_CBAE', routes: [] });
    assert.equal(call.payload.details.universityId, 'generated-bcu'); assert.equal(call.payload.details.name, created.name);
    assert.equal('expectedConfigurationRevision' in call.payload.details, false); assert.equal(globalThis.__RC_WRITES.length, 0);
  });
  await view.close();
  globalThis.__RC_FIRESTORE_BY_PATH = { 'systemConfig/app': { allowCollegeOnboarding: false }, 'colleges/college-a': { name: 'College A', code: 'A', ...collegeSchemeFields(multi) }, 'colleges/college-b': { name: 'College B', code: 'B' } };
  globalThis.__RC_FIRESTORE_COLLECTIONS = { universities: [], schemePacks: [p, second].map(pack => docRow(pack.id, { ...pack, collegeId: 'college-a' })) };
  globalThis.__RC_CALLABLE_PAYLOADS = [];
  view = await mount('/src/modules/superadmin/pages/CreateCollege.tsx', { collegeId: 'college-a' });
  check('editing a college hydrates its names and pins, even when new onboarding is disabled', () => { assert.equal(document.querySelector('[name=name]').value, 'College A'); assert.equal(document.querySelectorAll('input[type=checkbox]:checked').length, 2); assert.equal(buttons('Save Changes')[0].disabled, false); });
  await type(document.querySelector('[name=name]'), 'Edited College A'); await submitForm();
  check('college edit submits its expected configuration revision atomically with metadata', () => { const call = globalThis.__RC_CALLABLE_PAYLOADS.find(c => c.name === 'saveCollegeWithSchemes'); assert.equal(call.payload.collegeId, 'college-a'); assert.equal(call.payload.expectedConfigurationRevision, 9); assert.equal(call.payload.details.name, 'Edited College A'); assert.equal(call.payload.selection.assignments.length, 2); assert.equal(globalThis.__RC_WRITES.length, 0); });
  await view.rerender({ collegeId: 'college-b' });
  check('switching edited colleges resets metadata and selections instead of leaking the previous prefill', () => { assert.equal(document.querySelector('[name=name]').value, 'College B'); assert.equal(document.querySelector('[name=code]').value, 'B'); assert.equal(document.querySelectorAll('input[type=checkbox]:checked').length, 0); });
  await view.close();
  globalThis.__RC_ROLE = 'principal'; delete globalThis.__RC_FIRESTORE_BY_PATH; delete globalThis.__RC_FIRESTORE_COLLECTIONS;
  const studentApi = await server.ssrLoadModule('/src/modules/student/api/studentDataApi.ts');
  globalThis.__RC_FIRESTORE_DOCS = [{ id: 'grade-a', data: () => ({ subjectCode: 'CS101', subjectName: 'Legacy alias', credits: 4, gradePoint: 9, result: 'F', isPass: false, includeInGpa: true, semester: 1 }) }];
  const transcript = await studentApi.fetchGrades('college-a', 'student-a');
  check('transcript reads preserve result/GPA flags and legacy course aliases', () => { assert.equal(transcript[0].code, 'CS101'); assert.equal(transcript[0].result, 'F'); assert.equal(transcript[0].isPass, false); });
  const { summarizeCredits } = await server.ssrLoadModule('/src/shared/utils/creditEngine.ts');
  globalThis.__RC_FIRESTORE_DOCS = [
    { id: 'correction-new', data: () => ({ code: 'CS101', credits: 4, gradePoint: 6, result: 'P', semester: 1, publishedAt: '2026-02-01', createdAt: '2026-01-01' }) },
    { id: 'correction-old', data: () => ({ code: 'CS101', credits: 4, gradePoint: 9, result: 'P', semester: 1, publishedAt: '2026-01-01', createdAt: '2025-12-01' }) },
  ];
  const legacyTranscript = await studentApi.fetchGrades('college-a', 'student-a');
  check('transcript preserves publication/creation dates for latest legacy correction selection', () => { assert.equal(legacyTranscript[0].createdAt, '2026-01-01'); assert.equal(summarizeCredits(legacyTranscript).gpa, 6); });
  globalThis.__RC_FIRESTORE_DOCS = Array.from({ length: 500 }, (_, i) => ({ id: `grade-${i}`, data: () => ({ subject: 'Large transcript', code: `CS${i}`, credits: 4, gradePoint: 9, semester: 1 }) }));
  await assert.rejects(studentApi.fetchGrades('college-a', 'student-a'), /safe summary limit/); checks++; console.log(`ok ${checks} - transcript refuses to calculate GPA from a truncated result set`);
  seedCollege({ ...p, revision: 2 });
  await assert.rejects(api.importResults(grouped, '2026-27', 'regular'), /changed since preview/); checks++; console.log(`ok ${checks} - changed scheme rejects stale import previews`);
  seedCollege(null);
  await assert.rejects(api.parseResultFile(csvFile(csv)), /configuration required/); checks++; console.log(`ok ${checks} - parser itself fails closed without college configuration`);
  console.log(`\n${checks}/${checks} academic UI/parser/transport checks passed`);
} catch (err) {
  process.exitCode = 1;
  console.error(err);
} finally { await server.close(); }
// Some mounted libraries retain timers after unmount. Match the main render
// runner: terminate only AFTER assertions and server cleanup, preserving failure.
process.exit(process.exitCode || 0);
