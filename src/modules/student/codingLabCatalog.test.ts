import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CODING_LAB_PROGRAMS, CODING_LANGUAGES } from './codingLabCatalog'

test('coding lab catalog has worked samples for every supported language', () => {
  const languageIds = CODING_LANGUAGES.map((language) => language.id)
  assert.deepEqual(languageIds, ['c', 'cpp', 'java', 'python'])
  for (const language of languageIds) {
    const samples = CODING_LAB_PROGRAMS.filter((program) => program.language === language)
    assert.ok(samples.length >= 5, `${language} has at least five worked programs`)
    assert.ok(samples.every((program) => program.sourceCode.trim() && program.objective.trim()))
  }
})

test('coding lab examples have unique IDs and explicit sample input/output', () => {
  const ids = CODING_LAB_PROGRAMS.map((program) => program.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const program of CODING_LAB_PROGRAMS) {
    assert.ok(program.title.trim())
    assert.ok(program.subject.trim())
    assert.ok(program.topic.trim())
    assert.equal(typeof program.stdin, 'string')
    assert.equal(typeof program.expectedOutput, 'string')
  }
})
