// src/shared/utils/firestoreLimits.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIRESTORE_MAX_LIMIT, cappedLimit, warnIfTruncated } from './firestoreLimits.ts';

test('the cap is Firestore’s actual maximum', () => {
  // Not a number we chose — the API rejects anything above it outright, which
  // is exactly how the office desks broke.
  assert.equal(FIRESTORE_MAX_LIMIT, 10000);
});

test('an impossible limit is clamped to one the API will run', () => {
  assert.equal(cappedLimit(50000), 10000);
  assert.equal(cappedLimit(20000), 10000);
  assert.equal(cappedLimit(10001), 10000);
});

test('a legal limit is passed through untouched', () => {
  for (const n of [1, 5, 50, 300, 500, 5000, 10000]) {
    assert.equal(cappedLimit(n), n, String(n));
  }
});

test('no literal limit in the office APIs exceeds the cap any more', () => {
  // The regression that caused the production outage: limit(50000) compiled,
  // type-checked, and was only ever discovered at runtime. This pins the
  // helper's contract, and the call sites use nothing else.
  for (const bad of [20001, 50000, 100000]) {
    assert.ok(cappedLimit(bad) <= FIRESTORE_MAX_LIMIT, String(bad));
  }
});

test('nonsense input becomes the maximum rather than an invalid query', () => {
  assert.equal(cappedLimit(0), FIRESTORE_MAX_LIMIT);
  assert.equal(cappedLimit(-5), FIRESTORE_MAX_LIMIT);
  assert.equal(cappedLimit(Number.NaN), FIRESTORE_MAX_LIMIT);
  assert.equal(cappedLimit(10.9), 10, 'a fractional limit is floored, not rounded up past the cap');
});

test('a result at the cap is reported as possibly truncated', () => {
  const warnings: unknown[][] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => warnings.push(args);
  try {
    assert.equal(warnIfTruncated(10000, 'assets'), true);
    assert.equal(warnIfTruncated(9999, 'assets'), false);
    assert.equal(warnIfTruncated(0, 'assets'), false);
  } finally {
    console.warn = original;
  }
  // A silently truncated read is a different lie from one that throws, so the
  // truncation has to be visible in the log.
  assert.equal(warnings.length, 1);
  assert.match(String(warnings[0][0]), /assets/);
  assert.match(String(warnings[0][0]), /truncat/i);
});
