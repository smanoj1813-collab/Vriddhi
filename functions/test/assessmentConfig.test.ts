import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePerformanceCategories } from '../src/studentAssessments'

test('accepts the default three categories', () => {
  const result = parsePerformanceCategories([
    { label: 'Good to Go', minPercent: 70 },
    { label: 'Needs Improvement', minPercent: 50 },
    { label: 'Needs Training', minPercent: 0 },
  ])
  assert.deepEqual(result, [
    { label: 'Good to Go', minPercent: 70 },
    { label: 'Needs Improvement', minPercent: 50 },
    { label: 'Needs Training', minPercent: 0 },
  ])
})

test('trims labels and caps their length', () => {
  const result = parsePerformanceCategories([{ label: `  ${'x'.repeat(80)}  `, minPercent: 0 }])
  assert.equal(result[0].label.length, 40)
  assert.equal(result[0].label, 'x'.repeat(40))
})

test('rejects empty input', () => {
  assert.throws(() => parsePerformanceCategories([]))
  assert.throws(() => parsePerformanceCategories(null))
  assert.throws(() => parsePerformanceCategories('nope'))
})

test('rejects more than six categories', () => {
  const categories = Array.from({ length: 7 }, (_, i) => ({ label: `C${i}`, minPercent: 100 - i * 10 }))
  assert.throws(() => parsePerformanceCategories(categories))
})

test('rejects a missing label', () => {
  assert.throws(() => parsePerformanceCategories([{ label: '  ', minPercent: 0 }]))
})

test('rejects out-of-range minimums', () => {
  assert.throws(() => parsePerformanceCategories([{ label: 'A', minPercent: -1 }]))
  assert.throws(() => parsePerformanceCategories([{ label: 'A', minPercent: 101 }]))
  assert.throws(() => parsePerformanceCategories([{ label: 'A', minPercent: 'abc' }]))
})

test('rejects non-decreasing minimums', () => {
  assert.throws(() => parsePerformanceCategories([
    { label: 'Low', minPercent: 50 },
    { label: 'High', minPercent: 70 },
  ]))
  assert.throws(() => parsePerformanceCategories([
    { label: 'A', minPercent: 50 },
    { label: 'B', minPercent: 50 },
  ]))
})

test('accepts a single category covering everything', () => {
  const result = parsePerformanceCategories([{ label: 'Participated', minPercent: 0 }])
  assert.equal(result.length, 1)
})
