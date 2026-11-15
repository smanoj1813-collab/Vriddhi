// Shipped query builders, with only Auth/Firestore I/O replaced. Authorization
// itself is covered by the separate Firebase emulator suite, not these stubs.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const server = await createServer({ root, configFile: path.join(root, 'scripts/render-check/vite.config.mts'), server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel: 'error' });
const { auth } = await server.ssrLoadModule('/scripts/render-check/stubs/firebaseConfig.ts');
const { queries, calls } = await server.ssrLoadModule('/scripts/render-check/stubs/firestore.ts');
const { collegeReadConstraints, requireCollegeId } = await server.ssrLoadModule('/src/shared/api/tenantScope.ts');
const schedule = await server.ssrLoadModule('/src/modules/admin/api/scheduleApi.ts');
const attendance = await server.ssrLoadModule('/src/modules/admin/api/attendanceApi.ts');
const faculty = await server.ssrLoadModule('/src/modules/faculty/api/facultyApi.ts');
const assessments = await server.ssrLoadModule('/src/modules/admin/api/assessmentsApi.ts');
const { resolveFacultyAliases } = await server.ssrLoadModule('/src/modules/admin/api/curriculumMappingApi.ts');
const originalAuth = auth.currentUser;
const row = (id, data) => ({ id, data: () => data });
const tenant = q => q.__constraints?.find(c => c.__field === 'collegeId' && c.__operator === '==')?.__value;
const scoped = (college = 'college-a') => { assert.ok(queries.length); for (const q of queries) assert.equal(tenant(q), college, `Unscoped/foreign query: ${JSON.stringify(q)}`); };
const deferred = () => { let resolve; const promise = new Promise(ok => { resolve = ok; }); return { promise, resolve }; };
let checks = 0;
const check = (name, run) => { run(); console.log(`ok ${++checks} - ${name}`); };
function reset(uid = 'tenant-query-user', role = 'faculty', collegeId = 'college-a') {
  queries.length = 0; calls.length = 0; localStorage.clear();
  localStorage.setItem('vriddhi_college_id', 'foreign-stale-browser-college');
  auth.currentUser = { uid, getIdTokenResult: async () => ({ claims: { role, collegeId } }) };
  globalThis.__RC_FIRESTORE_BY_PATH = {}; globalThis.__RC_FIRESTORE_COLLECTIONS = {}; globalThis.__RC_FIRESTORE_DOCS = [];
  globalThis.__RC_WRITES = [];
  delete globalThis.__RC_FIRESTORE_QUERY_GUARD;
  delete globalThis.__RC_FIRESTORE_READ_GUARD;
}
try {
  reset();
  const claimConstraints = await collegeReadConstraints();
  const claimCollege = await requireCollegeId();
  check('tenant selection: verified cached claims win over a stale browser-wide college ID', () => {
    assert.equal(claimCollege, 'college-a');
    assert.deepEqual(claimConstraints, [{ __field: 'collegeId', __operator: '==', __value: 'college-a' }]);
    assert.deepEqual(queries, []);
  });
  auth.currentUser = null;
  await assert.rejects(collegeReadConstraints(), /Sign in/);
  await assert.rejects(requireCollegeId(), /Sign in/);
  check('signed-out tenant selection: refuses before any query', () => assert.deepEqual(queries, []));
  assert.deepEqual(await collegeReadConstraints(' college-selected '), [{ __field: 'collegeId', __operator: '==', __value: 'college-selected' }]);
  await assert.rejects(collegeReadConstraints('college/invalid'), /Invalid college/);
  check('explicit selection: normalized query scope only, with malformed paths rejected', () => assert.deepEqual(queries, []));

  for (const role of ['faculty', 'admin', 'hod', 'principal', 'mentor', 'employee', 'accounts', 'operations']) {
    reset(`no-college-${role}`, role, '');
    await assert.rejects(collegeReadConstraints(), /no college scope/);
    await assert.rejects(requireCollegeId(), /no college scope/);
    check(`${role}: missing college never degrades into an unbounded query`, () => assert.deepEqual(queries, []));
  }
  reset('platform-query', 'Super Admin', '');
  assert.deepEqual(await collegeReadConstraints(), []);
  await assert.rejects(requireCollegeId(), /Select a college/);
  check('Super Admin: intentional global reads remain supported, but college-path writes require a selection', () => assert.deepEqual(queries, []));

  reset();
  const delayedClaims = deferred();
  auth.currentUser.getIdTokenResult = () => delayedClaims.promise;
  const previousAccount = collegeReadConstraints();
  auth.currentUser = { uid: 'new-auth-account' };
  delayedClaims.resolve({ claims: { role: 'faculty', collegeId: 'college-a' } });
  await assert.rejects(previousAccount, /account changed/);
  check('tenant selection: an old-account token response cannot scope the next account', () => assert.deepEqual(queries, []));

  reset();
  globalThis.__RC_FIRESTORE_COLLECTIONS.weeklySchedules = [row('slot-a', { collegeId: 'college-a', subject: 'Owned class', isActive: true, dayOfWeek: 'monday' }), row('slot-b', { collegeId: 'college-b', subject: 'Foreign class', isActive: true })];
  const storage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('Storage blocked'); } });
    const slots = await schedule.fetchWeeklySchedules();
    check('weekly schedules: verified scope works without localStorage and excludes a foreign fixture', () => { scoped(); assert.deepEqual(slots.map(slot => slot.id), ['slot-a']); });
  } finally { Object.defineProperty(globalThis, 'localStorage', storage); }

  reset();
  for (const method of ['fetchFacultyList', 'fetchSubjectsFromFaculty', 'fetchBatchesFromStudents', 'fetchBranchesFromStudents']) assert.deepEqual(await schedule[method]('college-a'), []);
  check('schedule directories: an empty college never triggers an unfiltered legacy fallback', () => { scoped(); assert.equal(queries.length, 4); });
  const queriesBeforeMissing = queries.length;
  for (const method of ['fetchFacultyList', 'fetchSubjectsFromFaculty', 'fetchBatchesFromStudents', 'fetchBranchesFromStudents']) assert.deepEqual(await schedule[method](''), []);
  check('schedule directories: unresolved identity performs no directory reads', () => assert.equal(queries.length, queriesBeforeMissing));

  reset();
  await attendance.listClassSessions();
  await attendance.listAttendanceRecords({ sessionId: 'session-a' });
  await attendance.listAttendanceRecordsInRange({ dateFrom: '2026-11-01', dateTo: '2026-11-13' });
  await attendance.getFacultyMap();
  check('attendance list, range, session and faculty lookups all carry verified tenant constraints', () => { scoped(); assert.equal(queries.length, 4); });
  assert.throws(() => attendance.subscribeToSessions({}, () => {}), /college is required/);
  check('realtime sessions: missing tenant fails before installing an unbounded listener', () => assert.equal(calls.includes('onSnapshot'), false));

  reset();
  globalThis.__RC_FIRESTORE_COLLECTIONS = {
    classSessions: [row('session-a', { collegeId: 'college-a', date: '2026-11-13' }), row('session-b', { collegeId: 'college-b' })],
    attendanceRecords: [row('record-a', { collegeId: 'college-a', sessionId: 'session-a', studentId: 'student-a', status: 'present' }), row('record-b', { collegeId: 'college-b', sessionId: 'session-a', studentId: 'student-b', status: 'absent' })],
    students: [row('student-a', { collegeId: 'college-a', name: 'Owned Learner', regNo: 'A001' }), row('student-b', { collegeId: 'college-b', name: 'Foreign Learner' })],
  };
  const summaries = await attendance.getAllStudentsAttendanceSummary({});
  check('attendance report: session IDs, record joins and student-name joins are independently college scoped', () => {
    scoped(); assert.equal(queries.length, 3);
    assert.equal(summaries.length, 1); assert.equal(summaries[0].studentName, 'Owned Learner'); assert.equal(summaries[0].present, 1);
  });

  reset();
  await faculty.fetchAttendanceForSession('legacy-session', '2026-11-13');
  await faculty.fetchClassSessions('tenant-query-user', '2026-11-13');
  check('faculty attendance: legacy fallback and class-session queries are college bound', () => { scoped(); assert.equal(queries.length, 2); });

  reset();
  await assessments.listAssessments();
  await assessments.getPendingReviews();
  check('assessments and private review queue: tenant constraints accompany the ordered query', () => { scoped(); assert.equal(queries.length, 2); });

  reset('cache-account-a');
  globalThis.__RC_FIRESTORE_COLLECTIONS.faculty = [row('FAC-A', { uid: 'faculty-to-resolve', collegeId: 'college-a', email: 'a@example.edu' })];
  const aliasesA = await resolveFacultyAliases('faculty-to-resolve', 'college-a');
  await resolveFacultyAliases('faculty-to-resolve', 'college-a');
  check('faculty alias resolution: stable same-account/college requests reuse the narrow result', () => { scoped(); assert.equal(queries.length, 1); assert.equal(aliasesA.profileId, 'FAC-A'); });
  auth.currentUser = { uid: 'cache-account-b' };
  globalThis.__RC_FIRESTORE_COLLECTIONS.faculty = [row('FAC-B', { uid: 'faculty-to-resolve', collegeId: 'college-b', email: 'b@example.edu' })];
  const aliasesB = await resolveFacultyAliases('faculty-to-resolve', 'college-b');
  check('faculty alias cache: an account/college switch cannot reuse the previous profile or email', () => {
    assert.equal(queries.length, 2); assert.equal(tenant(queries[1]), 'college-b'); assert.equal(aliasesB.profileId, 'FAC-B'); assert.equal(aliasesB.email, 'b@example.edu');
  });
  console.log(`\n${checks}/${checks} tenant-query compatibility checks passed.`);
} catch (error) {
  process.exitCode = 1; console.error(error);
} finally {
  auth.currentUser = originalAuth;
  for (const key of ['__RC_FIRESTORE_BY_PATH', '__RC_FIRESTORE_COLLECTIONS', '__RC_FIRESTORE_DOCS', '__RC_FIRESTORE_QUERY_GUARD', '__RC_FIRESTORE_READ_GUARD', '__RC_WRITES']) delete globalThis[key];
  await server.close();
}
process.exit(process.exitCode || 0);
