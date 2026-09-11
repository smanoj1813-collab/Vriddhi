import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseCSV, validateCSV } from './parseCSV';

const HEADER = 'Student Name,Email Address,Registration Number,Phone Number';

/** Parse + validate a CSV body, the way the import page does. */
function check(body: string[]) {
  const parsed = parseCSV([HEADER, ...body].join('\n'), 'students');
  return validateCSV(parsed, 'students');
}

const reasons = (result: ReturnType<typeof check>, rowNumber: number): string =>
  (result.invalidRows ?? []).find((r) => r.rowNumber === rowNumber)?.reasons.join('; ') ?? '';

test('a clean file produces no rejections', () => {
  const result = check([
    'Ada Lovelace,ada@college.edu,R001,9876543210',
    'Alan Turing,alan@college.edu,R002,9876543211',
  ]);

  assert.equal(result.validCount, 2);
  assert.equal(result.invalidCount, 0);
  assert.deepEqual(result.errors, []);
});

test('duplicate email: first row is kept, later copies are rejected', () => {
  // This is the case that silently lost rows — the server rejects every copy
  // after the first, so the file looked valid and the import lost them.
  const result = check([
    'Ada Lovelace,ada@college.edu,R001,9876543210',
    'Ada Duplicate,ada@college.edu,R002,9876543211',
    'Third Copy,ada@college.edu,R003,9876543212',
  ]);

  assert.equal(result.validCount, 1);
  assert.equal(result.invalidCount, 2);
  assert.match(reasons(result, 3), /Duplicate email/i);
  assert.match(reasons(result, 4), /Duplicate email/i);
  // The rejection names where the value first appeared, so it can be found.
  assert.match(reasons(result, 3), /row 2/i);
});

test('duplicate email detection is case-insensitive', () => {
  const result = check([
    'Ada Lovelace,Ada@College.edu,R001,9876543210',
    'Ada Again,ada@college.edu,R002,9876543211',
  ]);

  assert.equal(result.validCount, 1);
  assert.match(reasons(result, 3), /Duplicate email/i);
});

test('duplicate registration number is rejected', () => {
  const result = check([
    'Ada Lovelace,ada@college.edu,R001,9876543210',
    'Alan Turing,alan@college.edu,R001,9876543211',
  ]);

  assert.equal(result.validCount, 1);
  assert.match(reasons(result, 3), /Duplicate registration number/i);
});

test('an email containing a space is rejected and the value is quoted back', () => {
  const result = check(['Ada Lovelace,ada lovelace@college.edu,R001,9876543210']);

  assert.equal(result.validCount, 0);
  assert.match(reasons(result, 2), /contains a space/i);
  assert.match(reasons(result, 2), /ada lovelace@college\.edu/);
});

test('a phone number with spaces is normalised, not rejected', () => {
  // The server strips non-digits anyway, so failing the row would be wrong.
  const result = check(['Ada Lovelace,ada@college.edu,R001,"98765 43210"']);

  assert.equal(result.validCount, 1);
  assert.equal(result.validRows[0].phone, '9876543210');
  assert.ok(
    (result.warnings ?? []).some((w) => /normalised/i.test(w)),
    'expected a normalisation warning'
  );
});

test('missing required fields are still rejected', () => {
  const result = check([',ada@college.edu,R001,9876543210']);

  assert.equal(result.validCount, 0);
  assert.match(reasons(result, 2), /Missing required field/i);
});

test('rejected rows carry their original data so they can be exported', () => {
  const result = check([
    'Ada Lovelace,ada@college.edu,R001,9876543210',
    'Dup Row,ada@college.edu,R002,9876543211',
  ]);

  const rejected = result.invalidRows?.[0];
  assert.ok(rejected, 'expected one rejected row');
  assert.equal(rejected.row.email, 'ada@college.edu');
  assert.equal(rejected.row.regNo, 'R002');
  assert.equal(rejected.rowNumber, 3); // 1-based sheet row, header included
});
