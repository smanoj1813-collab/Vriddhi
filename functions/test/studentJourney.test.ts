import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { READINESS_BANDS, bandFor, weightedCgpa } from '../src/studentJourney'

// The journey used to show every student `rank: 1` and a GPA computed as
// `(average test percentage / 100) * 10` — a number that appeared on no
// transcript. These cases pin the two computations that replaced it.

describe('credit-weighted CGPA', () => {
  it('weights by credits, so a 4-credit subject counts for more than a 2-credit one', () => {
    // (4*9 + 2*6) / 6 = 8, not the unweighted mean of 7.5.
    assert.equal(
      weightedCgpa([
        { credits: 4, gradePoint: 9 },
        { credits: 2, gradePoint: 6 },
      ]),
      8
    )
  })

  it('returns null when there are no published rows rather than reporting 0', () => {
    assert.equal(weightedCgpa([]), null)
  })

  it('returns null when no row carries usable credits or grade points', () => {
    assert.equal(
      weightedCgpa([
        { credits: 0, gradePoint: 9 },
        { credits: 3, gradePoint: 0 },
      ]),
      null
    )
  })

  it('ignores rows with zero credits instead of letting them dilute the mean', () => {
    assert.equal(
      weightedCgpa([
        { credits: 3, gradePoint: 8 },
        { credits: 0, gradePoint: 1 },
      ]),
      8
    )
  })

  it('rounds to two decimals', () => {
    // (3*8 + 2*7) / 5 = 7.6
    assert.equal(
      weightedCgpa([
        { credits: 3, gradePoint: 8 },
        { credits: 2, gradePoint: 7 },
      ]),
      7.6
    )
    // (3*8 + 3*9) / 6 = 8.5 ; (3*7 + 2*8) / 5 = 7.4 ; thirds must not drift.
    assert.equal(
      weightedCgpa([
        { credits: 1, gradePoint: 8 },
        { credits: 1, gradePoint: 8 },
        { credits: 1, gradePoint: 9 },
      ]),
      8.33
    )
  })
})

describe('placement readiness band', () => {
  it('places each CGPA in the highest band it clears', () => {
    assert.equal(bandFor(9.4).id, 'tier1')
    assert.equal(bandFor(9).id, 'tier1')
    assert.equal(bandFor(8.99).id, 'tier2')
    assert.equal(bandFor(8).id, 'tier2')
    assert.equal(bandFor(7.5).id, 'tier3')
    assert.equal(bandFor(6.5).id, 'tier4')
    assert.equal(bandFor(6.2).id, 'tier5')
    assert.equal(bandFor(5.9).id, 'below')
    assert.equal(bandFor(0).id, 'below')
  })

  it('keeps band cut-offs in descending order so the lookup cannot skip a band', () => {
    for (let index = 1; index < READINESS_BANDS.length; index += 1) {
      assert.ok(
        READINESS_BANDS[index - 1].minCgpa > READINESS_BANDS[index].minCgpa,
        `${READINESS_BANDS[index - 1].id} must sit above ${READINESS_BANDS[index].id}`
      )
    }
  })

  it('has a band that catches the lowest possible CGPA', () => {
    assert.equal(READINESS_BANDS[READINESS_BANDS.length - 1].minCgpa, 0)
  })

  it('describes the opportunity without promising an employer', () => {
    READINESS_BANDS.forEach((band) => {
      assert.ok(band.label.length > 0, `${band.id} needs a label`)
      assert.ok(band.outlook.length > 0, `${band.id} needs an outlook`)
      // A band is guidance about eligibility, never a named recruiter or offer.
      assert.ok(!/guarantee|offer letter|placed at/i.test(band.outlook), `${band.id} over-promises`)
    })
  })
})
