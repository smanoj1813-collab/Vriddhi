import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractFirstJsonObject } from '../src/studentAssessments'

test('extractFirstJsonObject parses a plain JSON object', () => {
  const result = extractFirstJsonObject('{"suggestions":[{"questionId":"q1","marks":3,"feedback":"ok"}]}')
  assert.deepEqual(result, { suggestions: [{ questionId: 'q1', marks: 3, feedback: 'ok' }] })
})

test('extractFirstJsonObject strips ```json fences', () => {
  const raw = '```json\n{"a":1}\n```'
  assert.deepEqual(extractFirstJsonObject(raw), { a: 1 })
})

test('extractFirstJsonObject skips leading prose before the object', () => {
  const raw = 'Here is the grading result:\n{"overallFeedback":"good","totalMarks":5}'
  const result = extractFirstJsonObject(raw) as Record<string, unknown>
  assert.equal(result.overallFeedback, 'good')
  assert.equal(result.totalMarks, 5)
})

test('extractFirstJsonObject respects strings containing braces', () => {
  const raw = '{"feedback":"use {braces} carefully","suggestions":[],"n":2}'
  const result = extractFirstJsonObject(raw) as Record<string, unknown>
  assert.equal(result.feedback, 'use {braces} carefully')
  assert.equal(result.n, 2)
})

test('extractFirstJsonObject handles escaped quotes in strings', () => {
  const raw = '{"feedback":"she said \\"great\\"","ok":true}'
  const result = extractFirstJsonObject(raw) as Record<string, unknown>
  assert.equal(result.feedback, 'she said "great"')
  assert.equal(result.ok, true)
})

test('extractFirstJsonObject throws when no object is present', () => {
  assert.throws(() => extractFirstJsonObject('no json here'))
})

test('extractFirstJsonObject throws on unbalanced braces', () => {
  assert.throws(() => extractFirstJsonObject('{"a":{"b":1'))
})
