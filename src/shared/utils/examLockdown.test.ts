import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BULK_INSERT_CHAR_LIMIT,
  isSuspiciousBulkInsert,
  shouldBlockBeforeInput,
  shouldBlockKeydown,
} from './examLockdown'

// The point of these guards is that a phone has more than one way to get
// clipboard text into a field, while a student typing in Kannada through an
// IME must never be interrupted. Both directions are pinned here.

test('paste and drop input types are always blocked', () => {
  for (const inputType of ['insertFromPaste', 'insertFromPasteAsQuotation', 'insertFromDrop', 'insertFromYank']) {
    assert.equal(shouldBlockBeforeInput(inputType, 'any text'), true, inputType)
  }
})

test('typing one character is allowed', () => {
  assert.equal(shouldBlockBeforeInput('insertText', 'a'), false)
  assert.equal(shouldBlockBeforeInput('insertText', 'Th'), false)
  assert.equal(shouldBlockBeforeInput('insertLineBreak', '\n'), false)
})

test('IME composition and autocorrect are never blocked', () => {
  // Transliterated Indic input arrives as composition text; a long Kannada
  // word committed by the keyboard must not look like a paste.
  const transliterated = 'ಶಿಕ್ಷಣ ಇಲಾಖೆ ನೋಟಿಸ್'
  assert.equal(shouldBlockBeforeInput('insertCompositionText', transliterated), false)
  assert.equal(shouldBlockBeforeInput('insertReplacementText', 'autocorrected'), false)
})

test('a clipboard-sized insertText burst is treated as a paste', () => {
  const chip = 'The quick brown fox' // 19 chars, no newline
  assert.equal(isSuspiciousBulkInsert('insertText', chip), false)
  const long = 'x'.repeat(BULK_INSERT_CHAR_LIMIT)
  assert.equal(isSuspiciousBulkInsert('insertText', long), true)
  assert.equal(shouldBlockBeforeInput('insertText', long), true)
})

test('multi-line text pasted into a long-answer box is blocked by content, not length', () => {
  // Gboard/SwiftKey commit their clipboard chip as plain insertText, so a
  // 6-character answer would otherwise slip through.
  assert.equal(isSuspiciousBulkInsert('insertText', 'opt A\nopt B'), true)
  assert.equal(isSuspiciousBulkInsert('insertText', 'a\nb'), false)
})

test('empty and missing payloads are ignored', () => {
  assert.equal(isSuspiciousBulkInsert('insertText', ''), false)
  assert.equal(isSuspiciousBulkInsert('insertText', null), false)
  assert.equal(shouldBlockBeforeInput('deleteContentBackward', null), false)
})

test('clipboard and devtools shortcuts are blocked with ctrl or cmd', () => {
  assert.equal(shouldBlockKeydown({ key: 'v', ctrlKey: true }), true)
  assert.equal(shouldBlockKeydown({ key: 'c', metaKey: true }), true)
  assert.equal(shouldBlockKeydown({ key: 'v', ctrlKey: true, shiftKey: true }), true)
  assert.equal(shouldBlockKeydown({ key: 'F12' }), true)
  assert.equal(shouldBlockKeydown({ key: 'Tab', altKey: true }), true)
})

test('plain typing is not mistaken for a shortcut', () => {
  assert.equal(shouldBlockKeydown({ key: 'v' }), false)
  assert.equal(shouldBlockKeydown({ key: 'a', shiftKey: true }), false)
  assert.equal(shouldBlockKeydown({ key: 'Shift' }), false)
  assert.equal(shouldBlockKeydown({}), false)
})
