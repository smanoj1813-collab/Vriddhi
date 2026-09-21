// src/shared/utils/driveLink.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  extractDriveFileId,
  normalizeDriveLink,
  validateDriveLink,
} from './driveLink'

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345'
const CANONICAL = `https://drive.google.com/file/d/${ID}/view`

describe('extractDriveFileId', () => {
  it('accepts the canonical view link', () => {
    assert.equal(extractDriveFileId(CANONICAL), ID)
  })

  it('accepts /preview and ?usp=sharing suffixes', () => {
    assert.equal(extractDriveFileId(`https://drive.google.com/file/d/${ID}/preview`), ID)
    assert.equal(extractDriveFileId(`${CANONICAL}?usp=sharing`), ID)
    assert.equal(extractDriveFileId(`https://drive.google.com/file/d/${ID}/view?usp=drive_link`), ID)
  })

  it('trims surrounding whitespace', () => {
    assert.equal(extractDriveFileId(`  ${CANONICAL}  `), ID)
  })

  it('rejects non-file Drive URLs', () => {
    assert.equal(extractDriveFileId(`https://drive.google.com/drive/folders/${ID}`), null)
    assert.equal(extractDriveFileId(`https://drive.google.com/file/d/${ID}`), null)
    assert.equal(extractDriveFileId('https://drive.google.com/uc?id=' + ID), null)
  })

  it('rejects every other domain and scheme (phishing surface)', () => {
    assert.equal(extractDriveFileId(`http://drive.google.com/file/d/${ID}/view`), null)
    assert.equal(extractDriveFileId(`https://drive.google.co.in/file/d/${ID}/view`), null)
    assert.equal(extractDriveFileId(`https://drive.evil.com/file/d/${ID}/view`), null)
    assert.equal(extractDriveFileId(`https://drive.google.com.evil.com/file/d/${ID}/view`), null)
    assert.equal(extractDriveFileId(`javascript:alert(1)`), null)
    assert.equal(extractDriveFileId('https://example.com/file/d/1234567890/view'), null)
  })

  it('rejects too-short file ids', () => {
    assert.equal(extractDriveFileId('https://drive.google.com/file/d/abc/view'), null)
  })
})

describe('normalizeDriveLink', () => {
  it('returns the canonical view URL', () => {
    assert.equal(normalizeDriveLink(`${CANONICAL}?usp=sharing`), CANONICAL)
  })

  it('returns null for non-links', () => {
    assert.equal(normalizeDriveLink('hello'), null)
    assert.equal(normalizeDriveLink(''), null)
  })
})

describe('validateDriveLink', () => {
  it('accepts a valid link with the canonical url', () => {
    const result = validateDriveLink(`${CANONICAL}?usp=sharing`)
    assert.equal(result.valid, true)
    assert.equal(result.url, CANONICAL)
  })

  it('rejects empty input with a friendly message', () => {
    const result = validateDriveLink('   ')
    assert.equal(result.valid, false)
    assert.match(result.error || '', /Paste a Google Drive link/)
  })

  it('rejects arbitrary http links', () => {
    const result = validateDriveLink('https://totally-legit-assignments.com/pdf')
    assert.equal(result.valid, false)
    assert.ok(result.url === undefined)
  })
})
