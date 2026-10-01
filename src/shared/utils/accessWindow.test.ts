// src/shared/utils/accessWindow.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// The browser copy of the platform-access window rule. The server copy
// (functions/src/accessProducts.ts) is pinned against this one in
// functions/test/accessProducts.test.ts; these cases document the rule itself
// for the UI that previews "covered until …" before anything is saved.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  ACCESS_EXPIRING_SOON_DAYS,
  accessDaysLeft,
  accessStatus,
  addDaysToDateKey,
  addMonthsToDateKey,
  computeAccessWindow,
  formatDurationMonths,
  isDateKey,
} from './accessWindow'

describe('access windows (browser copy)', () => {
  it('a 1/2/3-year product ends the day before its anniversary', () => {
    assert.equal(computeAccessWindow('2026-10-01', 12)?.end, '2027-09-30')
    assert.equal(computeAccessWindow('2026-10-01', 24)?.end, '2028-09-30')
    assert.equal(computeAccessWindow('2026-10-01', 36)?.end, '2029-09-30')
    assert.equal(computeAccessWindow('2026-10-01', 12)?.start, '2026-10-01')
  })

  it('clamps a month step instead of rolling into the next month', () => {
    assert.equal(addMonthsToDateKey('2026-01-31', 1), '2026-02-28')
    assert.equal(addMonthsToDateKey('2024-01-31', 1), '2024-02-29')
    assert.equal(addDaysToDateKey('2026-10-01', -1), '2026-09-30')
  })

  it('rejects unusable input rather than inventing a window', () => {
    assert.equal(computeAccessWindow('', 12), null)
    assert.equal(computeAccessWindow('2026-02-30', 12), null)
    assert.equal(computeAccessWindow('2026-10-01', 0), null)
    assert.equal(isDateKey('2026-02-30'), false)
  })

  it('buckets access into active / expiring / expired', () => {
    const today = '2026-10-01'
    assert.equal(accessStatus('2027-09-30', today), 'active')
    assert.equal(accessStatus('2026-11-29', today), 'expiring')
    assert.equal(accessStatus('2026-10-01', today), 'expiring', 'end day is inclusive')
    assert.equal(accessStatus('2026-09-30', today), 'expired')
    assert.equal(accessStatus(undefined, today), 'expired')
    assert.equal(ACCESS_EXPIRING_SOON_DAYS, 60)
  })

  it('counts days left', () => {
    assert.equal(accessDaysLeft('2026-10-31', '2026-10-01'), 30)
    assert.equal(accessDaysLeft('2026-09-30', '2026-10-01'), -1)
  })

  it('formats the durations colleges sell', () => {
    assert.equal(formatDurationMonths(12), '1 year')
    assert.equal(formatDurationMonths(36), '3 years')
    assert.equal(formatDurationMonths(18), '1 year 6 months')
    assert.equal(formatDurationMonths(6), '6 months')
  })
})
