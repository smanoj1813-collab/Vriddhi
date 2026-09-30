import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateCSVTemplate, parseCSV, validateCSV } from './parseCSV';

/**
 * The required student columns. Kept in one place because the whole point of
 * this suite is that a row without them is REJECTED rather than imported into
 * a state where it matches no class.
 */
const HEADER = 'Student Name,Email Address,Registration Number,Department,Batch,Semester,Division,Phone Number';

/** One complete row, in HEADER order, overridable per case. */
function row(over: Partial<Record<'name' | 'email' | 'regNo' | 'department' | 'batch' | 'semester' | 'division' | 'phone', string>> = {}): string {
  const cells = {
    name: 'Ada Lovelace',
    email: 'ada@college.edu',
    regNo: 'R001',
    department: 'BBA',
    batch: '2027',
    semester: '3',
    division: 'C',
    phone: '9876543210',
    ...over,
  };
  return [cells.name, cells.email, cells.regNo, cells.department, cells.batch, cells.semester, cells.division, cells.phone].join(',');
}

/** Parse + validate a CSV body, the way the import page does. */
function check(body: string[]) {
  const parsed = parseCSV([HEADER, ...body].join('\n'), 'students');
  return validateCSV(parsed, 'students');
}

const reasons = (result: ReturnType<typeof check>, rowNumber: number): string =>
  (result.invalidRows ?? []).find((r) => r.rowNumber === rowNumber)?.reasons.join('; ') ?? '';

test('a clean file produces no rejections', () => {
  const result = check([row(), row({ name: 'Alan Turing', email: 'alan@college.edu', regNo: 'R002' })]);

  assert.equal(result.validCount, 2);
  assert.equal(result.invalidCount, 0);
  assert.deepEqual(result.errors, []);
});

test('a row without the cohort fields is rejected, not imported', () => {
  // These rows used to import perfectly and then match no roster, no
  // curriculum and no timetable — the import reported success and the class
  // stayed empty. Each missing field now fails the row by name.
  const cases: Array<[string, string, RegExp]> = [
    ['department', row({ department: '' }), /department|Missing required/i],
    ['batch', row({ batch: '' }), /batch|Missing required/i],
    ['division', row({ division: '' }), /division|Missing required/i],
    ['semester', row({ semester: '' }), /semester|Missing required/i],
    ['regNo', row({ regNo: '' }), /registration|Missing required/i],
  ];
  for (const [field, csvRow, expected] of cases) {
    const result = check([csvRow]);
    assert.equal(result.validCount, 0, `${field} must be required`);
    assert.match(reasons(result, 2), expected, `${field} rejection message`);
  }
});

test('a missing Semester column is refused as a column, not silently defaulted', () => {
  // The server used to default a blank semester to 1, so a file without this
  // column produced a college of semester-1 students with no warning at all.
  const csv = [
    'Student Name,Email Address,Registration Number,Department,Batch,Division',
    'Ada Lovelace,ada@college.edu,R001,BBA,2027,C',
  ].join('\n');
  const parsed = parseCSV(csv, 'students');
  assert.ok(
    parsed.warnings.some((w) => /Missing required columns/i.test(w) && /semester/i.test(w)),
    `expected a missing-column warning, got: ${JSON.stringify(parsed.warnings)}`,
  );
  const result = validateCSV(parsed, 'students');
  assert.equal(result.validCount, 0);
  assert.match(reasons(result, 2), /Missing required field "semester"/i);
});

test('semester must be a whole number between 1 and 12', () => {
  for (const semester of ['0', '13', 'three', '2.5']) {
    const result = check([row({ semester })]);
    assert.equal(result.validCount, 0, `semester "${semester}" must be rejected`);
    assert.match(reasons(result, 2), /Semester must be a whole number between 1 and 12/i);
  }
  for (const semester of ['1', '12', ' 3 ']) {
    assert.equal(check([row({ semester })]).validCount, 1, `semester "${semester}" must be accepted`);
  }
});

test('a "Section" column is read as the student division, as before', () => {
  // Colleges that title the column "Section" keep working — the letter still
  // lands on `division`, which is the field the matchers compare.
  const csv = [
    'Student Name,Email Address,Registration Number,Department,Batch,Semester,Section',
    'Ada Lovelace,ada@college.edu,R001,BBA,2027,3,C',
  ].join('\n');
  const result = validateCSV(parseCSV(csv, 'students'), 'students');
  assert.equal(result.validCount, 1);
  assert.equal(result.validRows[0].division, 'C');
});

test('duplicate email: first row is kept, later copies are rejected', () => {
  // This is the case that silently lost rows — the server rejects every copy
  // after the first, so the file looked valid and the import lost them.
  const result = check([
    row(),
    row({ name: 'Ada Duplicate', regNo: 'R002' }),
    row({ name: 'Third Copy', regNo: 'R003' }),
  ]);

  assert.equal(result.validCount, 1);
  assert.equal(result.invalidCount, 2);
  assert.match(reasons(result, 3), /Duplicate email/i);
  assert.match(reasons(result, 4), /Duplicate email/i);
  // The rejection names where the value first appeared, so it can be found.
  assert.match(reasons(result, 3), /row 2/i);
});

test('duplicate email detection is case-insensitive', () => {
  const result = check([row({ email: 'Ada@College.edu' }), row({ name: 'Ada Again', regNo: 'R002' })]);

  assert.equal(result.validCount, 1);
  assert.match(reasons(result, 3), /Duplicate email/i);
});

test('duplicate registration number is rejected', () => {
  const result = check([row(), row({ name: 'Alan Turing', email: 'alan@college.edu' })]);

  assert.equal(result.validCount, 1);
  assert.match(reasons(result, 3), /Duplicate registration number/i);
});

test('an email containing a space is rejected and the value is quoted back', () => {
  const result = check([row({ email: 'ada lovelace@college.edu' })]);

  assert.equal(result.validCount, 0);
  assert.match(reasons(result, 2), /contains a space/i);
  assert.match(reasons(result, 2), /ada lovelace@college\.edu/);
});

test('a phone number with spaces is normalised, not rejected', () => {
  // The server strips non-digits anyway, so failing the row would be wrong.
  const result = check([row({ phone: '"98765 43210"' })]);

  assert.equal(result.validCount, 1);
  assert.equal(result.validRows[0].phone, '9876543210');
  assert.ok(
    (result.warnings ?? []).some((w) => /normalised/i.test(w)),
    'expected a normalisation warning'
  );
});

test('mentor id headers are preserved for server-side faculty resolution', () => {
  for (const mentorHeader of ['Mentor ID', 'mentorId', 'Faculty ID']) {
    const csv = [
      `${HEADER},${mentorHeader}`,
      `${row()},FAC001`,
    ].join('\n');
    const parsed = parseCSV(csv, 'students');
    assert.equal(parsed.rows[0].mentor, 'FAC001', `failed header: ${mentorHeader}`);
  }
});

test('missing required fields are still rejected', () => {
  const result = check([row({ name: '' })]);

  assert.equal(result.validCount, 0);
  assert.match(reasons(result, 2), /Missing required field/i);
});

test('rejected rows carry their original data so they can be exported', () => {
  const result = check([row(), row({ name: 'Dup Row', regNo: 'R002' })]);

  const rejected = result.invalidRows?.[0];
  assert.ok(rejected, 'expected one rejected row');
  assert.equal(rejected.row.email, 'ada@college.edu');
  assert.equal(rejected.row.regNo, 'R002');
  assert.equal(rejected.rowNumber, 3); // 1-based sheet row, header included
  assert.equal(rejected.row.batch, '2027');
  assert.equal(rejected.row.semester, '3');
});

test('the downloadable student template passes its own validator', () => {
  // The template must be importable as generated: every required column is
  // present, and its sample row is a real, complete student.
  const parsed = parseCSV(generateCSVTemplate('students'), 'students');
  const result = validateCSV(parsed, 'students');

  assert.equal(parsed.rows.length, 1);
  assert.equal(result.validCount, 1, JSON.stringify(result.errors));
  assert.equal(parsed.rows[0].department, 'BBA');
  assert.equal(parsed.rows[0].batch, '2027');
  assert.equal(parsed.rows[0].semester, '3');
  assert.equal(parsed.rows[0].division, 'C');
});

test('faculty template preserves multiple branches and comma-containing samples', () => {
  const template = generateCSVTemplate('faculty');
  const parsed = parseCSV(template, 'faculty');

  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].department, 'Commerce');
  assert.equal(parsed.rows[0].branches, 'B.Com,BBA');
  assert.equal(parsed.rows[0].qualification, 'M.Com, UGC-NET');
  assert.equal(parsed.rows[0].subjectsUG, 'BCom101,BCom102');
  assert.deepEqual(parsed.unknownHeaders, []);
});
