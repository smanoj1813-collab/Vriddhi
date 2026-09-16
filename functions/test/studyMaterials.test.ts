// functions/test/studyMaterials.test.ts
//
// Run with: npm --prefix functions run test:unit
//
// Pins the serve-decision table of the versioned study-material cache. The
// governance contract these tests protect:
//   1. A campus's own pin ALWAYS wins over the global latest — a refresh by
//      another college can never change what our students see mid-study.
//   2. An un-pinned campus follows the global latest and should be pinned to
//      it on that first serve (pin-on-first-serve).
//   3. Pre-versioning documents (legacy top-level studyPack, latestVersion
//      absent) yield no target: the route must migrate them to v0001 first.
//   4. Version numbering is 1-based and strictly increasing.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  decideStudyServeTarget,
  nextStudyVersion,
  studyVersionDocId,
} from '../src/routes/ai-chat.ts'

describe('nextStudyVersion', () => {
  it('starts numbering at 1 for a brand-new key', () => {
    assert.equal(nextStudyVersion(undefined), 1)
    assert.equal(nextStudyVersion(null), 1)
    assert.equal(nextStudyVersion(0), 1)
  })

  it('increments from the current latest', () => {
    assert.equal(nextStudyVersion(1), 2)
    assert.equal(nextStudyVersion(41), 42)
  })

  it('tolerates numeric strings from documents', () => {
    assert.equal(nextStudyVersion('3'), 4)
  })
})

describe('studyVersionDocId', () => {
  it('zero-pads for lexicographic ordering', () => {
    assert.equal(studyVersionDocId(1), 'v0001')
    assert.equal(studyVersionDocId(42), 'v0042')
    assert.equal(studyVersionDocId(1234), 'v1234')
  })
})

describe('decideStudyServeTarget', () => {
  it('a campus pin wins over the global latest (learning continuity)', () => {
    // College pinned to v1 while another college refreshed and created v3:
    // the pinned campus stays at v1 and no re-pin is requested.
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 3 }, 1),
      { version: 1, pinTo: null },
    )
  })

  it('an un-pinned campus follows the latest and gets pinned to it on that serve', () => {
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 3 }, undefined),
      { version: 3, pinTo: 3 },
    )
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 3 }, null),
      { version: 3, pinTo: 3 },
    )
  })

  it('ignores malformed pin values and falls back to latest', () => {
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 2 }, 'not-a-number'),
      { version: 2, pinTo: 2 },
    )
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 2 }, 0),
      { version: 2, pinTo: 2 },
    )
  })

  it('returns null for pre-versioning documents so the route migrates them first', () => {
    assert.equal(decideStudyServeTarget({}, undefined), null)
    assert.equal(decideStudyServeTarget(null, undefined), null)
    assert.equal(decideStudyServeTarget(undefined, undefined), null)
  })

  it('a pin referencing a pre-versioning sentinel is not served blindly', () => {
    // Pin 0 meant "legacy top-level" in an early draft of the model; legacy
    // packs now migrate to v0001, so pin 0 falls through to the latest.
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 5 }, 0),
      { version: 5, pinTo: 5 },
    )
  })
})
