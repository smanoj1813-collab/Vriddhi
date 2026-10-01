// src/modules/admin/services/onboardingTemplateParity.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// The onboarding centre (admin) and Import Users (superadmin) are two doors
// into the SAME import. The admin door builds its CSV from STUDENT_TEMPLATE
// (headers are the template field keys); the superadmin door parses with
// src/shared/utils/parseCSV.ts and required-flag rules there. When the two
// drift, the template that downloads cleanly is rejected row by row — or
// worse, a column the template promises (Course, Blood Group) is silently
// dropped and the imported student matches no class.
//
// These cases pin the admin template against the importer that actually
// writes the data, so the two cannot drift apart again.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { STUDENT_TEMPLATE, generateTemplateCSV } from './onboardingService';
// Relative, not the `@/` alias: the functions-side test runner resolves paths
// from functions/tsconfig, where the alias does not exist.
import { parseCSV, validateCSV } from '../../../shared/utils/parseCSV';

const REQUIRED_KEYS = ['regNo', 'name', 'email', 'department', 'batch', 'semester', 'division'];

describe('STUDENT_TEMPLATE ≡ the CSV importer', () => {
  it('the generated template parses with no unknown columns', () => {
    const parsed = parseCSV(generateTemplateCSV(STUDENT_TEMPLATE), 'students');
    assert.deepEqual(
      parsed.unknownHeaders,
      [],
      'every template column must be one the importer understands',
    );
  });

  it('the generated template passes its own row validation', () => {
    const result = validateCSV(parseCSV(generateTemplateCSV(STUDENT_TEMPLATE), 'students'), 'students');
    assert.equal(result.validCount, 1, JSON.stringify(result.errors));
    assert.equal(result.invalidCount, 0);
  });

  it('every field the template marks required is a required importer column', () => {
    const requiredKeys = STUDENT_TEMPLATE.fields.filter((f) => f.required).map((f) => f.key).sort();
    assert.deepEqual(requiredKeys, [...REQUIRED_KEYS].sort());
  });

  it('the sample row carries a real value for every required field', () => {
    for (const key of REQUIRED_KEYS) {
      const value = STUDENT_TEMPLATE.sampleRow[key];
      assert.ok(
        typeof value === 'string' && value.trim() !== '',
        `sample row is missing "${key}" — a template example must be importable as-is`,
      );
    }
    // The example must also be a valid class: the batch and division it shows
    // are the ones the curriculum mappings are written with.
    assert.equal(STUDENT_TEMPLATE.sampleRow.batch, '2027');
    assert.equal(STUDENT_TEMPLATE.sampleRow.division, 'C');
    assert.equal(STUDENT_TEMPLATE.sampleRow.semester, '3');
    assert.equal(STUDENT_TEMPLATE.sampleRow.department, 'BBA');
  });

  it('the sample row stores no field the importer drops', () => {
    // "Course" and "Blood Group" used to be template columns that reached no
    // database field. A sample value for a dropped column is the confusing
    // part: it looks like data the system keeps.
    const parsed = parseCSV(generateTemplateCSV(STUDENT_TEMPLATE), 'students');
    /** Template key → the field the importer stores it as. */
    const KEY_TO_PARSED_FIELD: Record<string, string> = { mentorId: 'mentor', dateOfBirth: 'dob' };
    for (const key of Object.keys(STUDENT_TEMPLATE.sampleRow)) {
      const field = KEY_TO_PARSED_FIELD[key] ?? key;
      assert.ok(
        Object.prototype.hasOwnProperty.call(parsed.rows[0], field),
        `sample value "${key}" has no column in the importer`,
      );
    }
  });
});
