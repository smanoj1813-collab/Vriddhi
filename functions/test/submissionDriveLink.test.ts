// functions/test/submissionDriveLink.test.ts
// ─── Google Drive link attachments for assignment submissions ─────────────
//
// Students may submit a Drive file link instead of uploading bytes, so the
// college stores nothing for that attachment. Faculty click these links, so
// the server-side normaliser is the security boundary: it must accept ONLY
// canonical drive.google.com file URLs and canonicalise them to a single
// click-anywhere form.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeDriveFileUrl } from '../src/studentPortal'

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345'

describe('normalizeDriveFileUrl', () => {
  it('canonicalises a view link with tracking params', () => {
    assert.equal(
      normalizeDriveFileUrl(`https://drive.google.com/file/d/${ID}/view?usp=sharing`),
      `https://drive.google.com/file/d/${ID}/view`
    )
    assert.equal(
      normalizeDriveFileUrl(`https://drive.google.com/file/d/${ID}/preview`),
      `https://drive.google.com/file/d/${ID}/view`
    )
  })

  it('trims surrounding whitespace', () => {
    assert.equal(
      normalizeDriveFileUrl(`  https://drive.google.com/file/d/${ID}/view  `),
      `https://drive.google.com/file/d/${ID}/view`
    )
  })

  it('rejects non-file Drive URLs', () => {
    assert.equal(normalizeDriveFileUrl(`https://drive.google.com/drive/folders/${ID}`), '')
    assert.equal(normalizeDriveFileUrl(`https://drive.google.com/file/d/${ID}`), '')
    assert.equal(normalizeDriveFileUrl(`https://drive.google.com/uc?id=${ID}`), '')
  })

  it('rejects every other domain and scheme (phishing surface)', () => {
    assert.equal(normalizeDriveFileUrl(`http://drive.google.com/file/d/${ID}/view`), '')
    assert.equal(normalizeDriveFileUrl(`https://drive.google.co.in/file/d/${ID}/view`), '')
    assert.equal(normalizeDriveFileUrl(`https://drive.evil.com/file/d/${ID}/view`), '')
    assert.equal(normalizeDriveFileUrl(`https://drive.google.com.evil.com/file/d/${ID}/view`), '')
    assert.equal(normalizeDriveFileUrl('javascript:alert(1)'), '')
    assert.equal(normalizeDriveFileUrl('https://example.com/file/d/12345678901234567890/view'), '')
  })

  it('rejects empty or malformed input', () => {
    assert.equal(normalizeDriveFileUrl(''), '')
    assert.equal(normalizeDriveFileUrl('   '), '')
    assert.equal(normalizeDriveFileUrl('not a url'), '')
    assert.equal(normalizeDriveFileUrl(`https://drive.google.com/file/d/abc/view`), '')
  })
})
