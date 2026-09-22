import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  enteredSectionsFromAnswers,
  sectionKeyOf,
  shouldPlaySectionBreak,
} from './examSectionBreaks'

const q = (id: string, sectionId?: string) => ({ id, sectionId }) as any

test('break: the first step into a new section is gated', () => {
  assert.equal(
    shouldPlaySectionBreak({ targetKey: 'sec-b', currentKey: 'sec-a', enteredKeys: new Set(['sec-a']) }),
    true
  )
})

test('break: a section already entered is open in either direction', () => {
  const entered = new Set(['sec-a', 'sec-b'])
  // A -> B was already paid for; B -> A must not charge it a second time.
  assert.equal(shouldPlaySectionBreak({ targetKey: 'sec-a', currentKey: 'sec-b', enteredKeys: entered }), false)
  assert.equal(shouldPlaySectionBreak({ targetKey: 'sec-b', currentKey: 'sec-a', enteredKeys: entered }), false)
})

test('break: moving inside one section never gates', () => {
  assert.equal(shouldPlaySectionBreak({ targetKey: 'sec-a', currentKey: 'sec-a', enteredKeys: new Set() }), false)
})

test('break: an unsectioned paper has one key and no gates', () => {
  assert.equal(sectionKeyOf(q('1', undefined)), 'sec-0')
  assert.equal(sectionKeyOf(q('1', 'sec-a')), 'sec-a')
  assert.equal(shouldPlaySectionBreak({ targetKey: 'sec-0', currentKey: 'sec-0', enteredKeys: new Set() }), false)
})

test('resume: a section holding saved work counts as entered', () => {
  const questions = [q('1', 'sec-a'), q('2', 'sec-a'), q('3', 'sec-b')]
  const entered = enteredSectionsFromAnswers(questions, { '1': { visitedAt: '2026-09-22T10:00:00Z' }, '3': { textAnswer: 'x' } })
  assert.deepEqual([...entered].sort(), ['sec-a', 'sec-b'])
})

test('resume: a merely-visited question still counts, an untouched one does not', () => {
  const questions = [q('1', 'sec-a'), q('2', 'sec-b')]
  // `visitedAt` is written when the question is opened, so the student has met
  // that section already — but only for the sections actually opened.
  const entered = enteredSectionsFromAnswers(questions, { '2': { visitedAt: 'x' } })
  assert.deepEqual([...entered], ['sec-b'])
  assert.equal(enteredSectionsFromAnswers(questions, undefined).size, 0)
  assert.equal(enteredSectionsFromAnswers(questions, {}).size, 0)
})
