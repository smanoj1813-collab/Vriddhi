// functions/test/accessProducts.test.ts
// ─── Platform-access products: windows, status buckets and MIS ──────────────
//
// The onboarding import, the bulk assign and the MIS page all have to agree
// about when a subscription ends and which bucket it is in. These cases pin:
//
//   * the window arithmetic (a 12-month product starting 2026-10-01 ends
//     2027-09-30 — the inclusive last day, not the anniversary);
//   * month-end clamping (31 Jan + 1 month is 28/29 Feb, never 3 March);
//   * the Active / Expiring / Expired boundaries;
//   * the MIS aggregation buckets and revenue, including the students who have
//     no product at all (they must be visible, not silently dropped);
//   * the SERVER copy against the BROWSER copy, so the "valid till" preview an
//     admin sees before saving is the same date the server stamps.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ACCESS_EXPIRING_SOON_DAYS,
  accessDaysLeft,
  accessStatus,
  addDaysToDateKey,
  addMonthsToDateKey,
  buildAccessFields,
  computeAccessWindow,
  docToAccessProduct,
  isDateKey,
  summarizeAccess,
  todayInIst,
  type AccessRow,
} from '../src/accessProducts'
import {
  accessStatus as browserAccessStatus,
  addDaysToDateKey as browserAddDays,
  addMonthsToDateKey as browserAddMonths,
  computeAccessWindow as browserComputeAccessWindow,
  formatDurationMonths,
} from '../../src/shared/utils/accessWindow'

describe('date keys', () => {
  it('accepts real yyyy-mm-dd dates and rejects impossible ones', () => {
    assert.equal(isDateKey('2026-10-01'), true)
    assert.equal(isDateKey('2026-02-30'), false, 'February has no 30th')
    assert.equal(isDateKey('2026-13-01'), false)
    assert.equal(isDateKey('01-10-2026'), false)
    assert.equal(isDateKey(''), false)
  })

  it('adds whole days across month and year boundaries', () => {
    assert.equal(addDaysToDateKey('2026-10-01', -1), '2026-09-30')
    assert.equal(addDaysToDateKey('2026-12-31', 1), '2027-01-01')
    assert.equal(addDaysToDateKey('2026-10-01', 0), '2026-10-01')
  })

  it('clamps a month step to the last day of the target month', () => {
    assert.equal(addMonthsToDateKey('2026-01-31', 1), '2026-02-28')
    assert.equal(addMonthsToDateKey('2024-01-31', 1), '2024-02-29', 'leap year')
    assert.equal(addMonthsToDateKey('2026-01-31', 13), '2027-02-28')
    assert.equal(addMonthsToDateKey('2026-03-31', 1), '2026-04-30')
  })
})

describe('computeAccessWindow', () => {
  it('ends the day BEFORE the anniversary — the last day covered', () => {
    assert.deepEqual(computeAccessWindow('2026-10-01', 12), {
      start: '2026-10-01',
      end: '2027-09-30',
      durationMonths: 12,
    })
    assert.deepEqual(computeAccessWindow('2026-10-01', 24)?.end, '2028-09-30')
    assert.deepEqual(computeAccessWindow('2026-10-01', 36)?.end, '2029-09-30')
  })

  it('covers a whole month for a 1-month product', () => {
    assert.equal(computeAccessWindow('2026-10-01', 1)?.end, '2026-10-31')
    assert.equal(computeAccessWindow('2026-01-31', 1)?.end, '2026-02-27', 'clamped start, then −1 day')
  })

  it('refuses a missing/invalid start date or duration', () => {
    assert.equal(computeAccessWindow('', 12), null)
    assert.equal(computeAccessWindow('2026-02-30', 12), null)
    assert.equal(computeAccessWindow('2026-10-01', 0), null)
    assert.equal(computeAccessWindow('2026-10-01', -3), null)
    assert.equal(computeAccessWindow('2026-10-01', 'x'), null)
  })
})

describe('accessStatus', () => {
  const today = '2026-10-01'

  it('buckets by days left around the warn window', () => {
    assert.equal(accessStatus('2027-09-30', today), 'active')
    assert.equal(accessStatus('2026-12-01', today), 'active', `${ACCESS_EXPIRING_SOON_DAYS} days out is still active`)
    assert.equal(accessStatus('2026-11-29', today), 'expiring', '59 days out')
    assert.equal(accessStatus('2026-10-01', today), 'expiring', 'ends today — still covered')
    assert.equal(accessStatus('2026-09-30', today), 'expired')
    assert.equal(accessStatus('', today), 'expired', 'no end date cannot be proved valid')
    assert.equal(accessStatus(null, today), 'expired')
  })

  it('honours a custom warn window', () => {
    assert.equal(accessStatus('2026-10-20', today, 30), 'expiring')
    assert.equal(accessStatus('2026-10-20', today, 10), 'active')
  })

  it('counts days left, negative once past', () => {
    assert.equal(accessDaysLeft('2026-10-01', today), 0)
    assert.equal(accessDaysLeft('2026-10-02', today), 1)
    assert.equal(accessDaysLeft('2026-09-30', today), -1)
    assert.equal(accessDaysLeft('nonsense', today), null)
  })
})

describe('buildAccessFields', () => {
  const product = { id: 'prod-1', name: '3-Year Platform Access', durationMonths: 36, price: 4500, currency: 'INR' }

  it('stamps the product, its price and the window', () => {
    assert.deepEqual(buildAccessFields(product, '2026-10-01'), {
      accessProductId: 'prod-1',
      accessProductName: '3-Year Platform Access',
      accessDurationMonths: 36,
      accessPrice: 4500,
      accessCurrency: 'INR',
      accessStart: '2026-10-01',
      accessEnd: '2029-09-30',
    })
  })

  it('returns null for an unusable start date instead of guessing', () => {
    assert.equal(buildAccessFields(product, ''), null)
    assert.equal(buildAccessFields(product, '2026-02-30'), null)
  })
})

describe('summarizeAccess', () => {
  const today = '2026-10-01'
  const rows: AccessRow[] = [
    // 3-year product, running
    { studentId: 's1', name: 'Arti', collegeId: 'c1', productId: 'p3', productName: '3-Year', durationMonths: 36, price: 4500, end: '2029-09-30' },
    { studentId: 's2', name: 'Bhavya', collegeId: 'c1', productId: 'p3', productName: '3-Year', durationMonths: 36, price: 4500, end: '2029-09-30' },
    // 1-year product, expiring in 30 days
    { studentId: 's3', name: 'Chetan', collegeId: 'c2', productId: 'p1', productName: '1-Year', durationMonths: 12, price: 1500, end: '2026-10-31' },
    // 1-year product, expired
    { studentId: 's4', name: 'Divya', collegeId: 'c2', productId: 'p1', productName: '1-Year', durationMonths: 12, price: 1500, end: '2026-08-31' },
    // no product at all — the students the MIS must not lose
    { studentId: 's5', name: 'Eshwar', collegeId: 'c1' },
  ]

  it('buckets every student exactly once', () => {
    const { totals } = summarizeAccess(rows, today)
    assert.equal(totals.students, 5)
    assert.equal(totals.withProduct, 4)
    assert.equal(totals.unassigned, 1)
    assert.equal(totals.active + totals.expiring + totals.expired, totals.withProduct)
  })

  it('values running access and lapsed access separately', () => {
    const { totals } = summarizeAccess(rows, today)
    assert.equal(totals.active, 2)
    assert.equal(totals.expiring, 1)
    assert.equal(totals.expired, 1)
    // 2 × 4500 running + 1 × 1500 expiring
    assert.equal(totals.activeValue, 10_500)
    assert.equal(totals.expiredValue, 1_500)
  })

  it('groups by product, biggest first (name breaks ties), unassigned last', () => {
    const { byProduct } = summarizeAccess(rows, today)
    // 1-Year and 3-Year both have 2 students; the name is the stable tiebreak.
    assert.deepEqual(byProduct.map((p) => p.productName), ['1-Year', '3-Year', 'No product assigned'])
    assert.deepEqual(byProduct.map((p) => p.students), [2, 2, 1])
    const oneYear = byProduct.find((p) => p.productId === 'p1')!
    assert.equal(oneYear.students, 2)
    assert.equal(oneYear.expiring, 1)
    assert.equal(oneYear.expired, 1)
    assert.equal(oneYear.activeValue, 1_500)
    assert.equal(oneYear.expiredValue, 1_500)
  })

  it('groups by college', () => {
    const { byCollege } = summarizeAccess(rows, today)
    const c1 = byCollege.find((row) => row.collegeId === 'c1')!
    assert.equal(c1.students, 3)
    assert.equal(c1.unassigned, 1)
    assert.equal(c1.active, 2)
  })

  it('keeps college buckets disjoint — expired never counts unassigned students', () => {
    const { byCollege } = summarizeAccess(rows, today)
    const c1 = byCollege.find((row) => row.collegeId === 'c1')!
    const c2 = byCollege.find((row) => row.collegeId === 'c2')!
    // c1's third student has no product: expired must stay 0 (not expired-unassigned = -1).
    assert.equal(c1.expired, 0)
    assert.equal(c1.unassigned, 1)
    assert.equal(c2.expired, 1)
    assert.equal(c2.unassigned, 0)
    for (const row of byCollege) {
      assert.equal(row.active + row.expiring + row.expired + row.unassigned, row.students)
    }
  })

  it('an empty college is all zeros, not an error', () => {
    const { totals, byProduct } = summarizeAccess([], today)
    assert.equal(totals.students, 0)
    assert.deepEqual(byProduct, [])
  })
})

describe('docToAccessProduct', () => {
  it('defaults currency and treats a missing active flag as active', () => {
    const product = docToAccessProduct('p1', { name: '1-Year', durationMonths: 12, price: 1500 })
    assert.equal(product.currency, 'INR')
    assert.equal(product.active, true)
    assert.equal(product.durationMonths, 12)
  })

  it('reads an archived product as inactive', () => {
    assert.equal(docToAccessProduct('p1', { name: 'Old', active: false }).active, false)
  })
})

describe('todayInIst', () => {
  it('rolls over at IST midnight, not UTC', () => {
    // 2026-10-01T20:00Z is already 2026-10-02 in India (+05:30).
    assert.equal(todayInIst(new Date('2026-10-01T20:00:00Z')), '2026-10-02')
    assert.equal(todayInIst(new Date('2026-10-01T18:00:00Z')), '2026-10-01')
  })
})

describe('formatDurationMonths', () => {
  it('reads as the durations colleges actually sell', () => {
    assert.equal(formatDurationMonths(12), '1 year')
    assert.equal(formatDurationMonths(24), '2 years')
    assert.equal(formatDurationMonths(36), '3 years')
    assert.equal(formatDurationMonths(6), '6 months')
    assert.equal(formatDurationMonths(18), '1 year 6 months')
    assert.equal(formatDurationMonths(1), '1 month')
    assert.equal(formatDurationMonths(0), '—')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Server ↔ browser parity
// ═════════════════════════════════════════════════════════════════════════════

describe('server ↔ browser parity (access windows)', () => {
  const STARTS = ['2026-10-01', '2026-01-31', '2024-02-29', '2026-12-31', '2026-02-30', '', 'nonsense']
  const DURATIONS = [1, 3, 6, 12, 18, 24, 36, 120, 0, -1, 'x', null]

  it('computes the same window for every start/duration pair', () => {
    for (const start of STARTS) {
      for (const duration of DURATIONS) {
        assert.deepEqual(
          computeAccessWindow(start, duration),
          browserComputeAccessWindow(start, duration),
          `computeAccessWindow(${JSON.stringify(start)}, ${JSON.stringify(duration)})`,
        )
      }
    }
  })

  it('agrees on month steps and day steps', () => {
    for (const key of ['2026-01-31', '2024-01-31', '2026-03-31', '2026-10-01', '2026-12-31']) {
      for (const months of [1, 2, 12, 13, -1]) {
        assert.equal(addMonthsToDateKey(key, months), browserAddMonths(key, months), `${key} + ${months}m`)
      }
      for (const days of [-1, 0, 1, 365]) {
        assert.equal(addDaysToDateKey(key, days), browserAddDays(key, days), `${key} + ${days}d`)
      }
    }
  })

  it('agrees on the status bucket, including the boundary days', () => {
    const today = '2026-10-01'
    const ends = ['2027-09-30', '2026-12-01', '2026-11-29', '2026-10-01', '2026-09-30', '', null, '2026-02-30']
    for (const end of ends) {
      assert.equal(
        accessStatus(end, today),
        browserAccessStatus(end, today),
        `accessStatus(${JSON.stringify(end)})`,
      )
    }
  })
})
