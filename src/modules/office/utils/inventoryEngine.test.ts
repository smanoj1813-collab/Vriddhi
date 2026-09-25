import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyMovement,
  bookValue,
  depreciationSchedule,
  expiryState,
  formatAssetTag,
  fyStartYear,
  needsReorder,
  normalizeInventorySettings,
  verificationDue,
} from './inventoryEngine'

test('asset tag and financial year', () => {
  assert.equal(formatAssetTag('AST', 'IT', 42, 5), 'AST/IT/00042')
  assert.equal(fyStartYear('2026-03-31'), 2025)
  assert.equal(fyStartYear('2026-04-01'), 2026)
})

test('WDV depreciation is pro-rata in the purchase year and compounds', () => {
  // bought 1 Oct 2024: 182/365 days of FY 2024-25
  const s = depreciationSchedule({ cost: 100000, purchaseDate: '2024-10-01', method: 'WDV', rate: 40, asOfFy: 2026 })
  assert.equal(s.length, 3)
  assert.equal(s[0].fy, '2024-25')
  assert.equal(s[0].addition, 100000)
  assert.ok(Math.abs(s[0].depreciation - 100000 * 0.4 * (182 / 365)) < 1)
  assert.equal(s[1].opening, s[0].closing)
  assert.ok(Math.abs(s[1].depreciation - s[1].opening * 0.4) < 0.01)
  assert.equal(bookValue({ cost: 100000, purchaseDate: '2024-10-01', method: 'WDV', rate: 40, asOfFy: 2026 }), s[2].closing)
})

test('SLM depreciation stops at salvage; disposal stops the schedule; small items written off', () => {
  const s = depreciationSchedule({ cost: 10000, purchaseDate: '2020-04-01', method: 'SLM', rate: 25, salvage: 1000, asOfFy: 2026 })
  assert.equal(s[0].depreciation, 2500)
  assert.equal(s[s.length - 1].closing, 1000)
  const d = depreciationSchedule({ cost: 10000, purchaseDate: '2020-04-01', method: 'SLM', rate: 10, asOfFy: 2026, disposedOn: '2022-09-30' })
  assert.equal(d[d.length - 1].fy, '2022-23')
  assert.ok(Math.abs(d[d.length - 1].depreciation - 1000 * (183 / 365)) < 1)
  const w = depreciationSchedule({ cost: 3000, purchaseDate: '2025-12-01', method: 'WDV', rate: 15, asOfFy: 2025, fullWriteOffBelow: 5000 })
  assert.equal(w[0].closing, 0)
  assert.deepEqual(depreciationSchedule({ cost: 0, purchaseDate: '2025-01-01', method: 'WDV', rate: 10, asOfFy: 2025 }), [])
})

test('moving average stock', () => {
  let s = applyMovement({ qty: 0, avgCost: 0 }, { type: 'in', qty: 10, rate: 50 })
  assert.deepEqual(s, { qty: 10, avgCost: 50, value: 500 })
  s = applyMovement(s, { type: 'in', qty: 10, rate: 70 })
  assert.equal(s.avgCost, 60)
  s = applyMovement(s, { type: 'out', qty: 5 })
  assert.deepEqual(s, { qty: 15, avgCost: 60, value: 300 })
  assert.throws(() => applyMovement(s, { type: 'out', qty: 50 }))
  assert.equal(applyMovement(s, { type: 'adjust', qty: -2 }).qty, 13)
  assert.throws(() => applyMovement(s, { type: 'adjust', qty: -20 }))
  assert.equal(needsReorder({ qty: 3, reorderLevel: 5 }), true)
  assert.equal(needsReorder({ qty: 3, reorderLevel: 0 }), false)
})

test('expiry, verification and settings normalisation', () => {
  assert.equal(expiryState('2026-09-20', '2026-09-25', 30), 'expired')
  assert.equal(expiryState('2026-10-10', '2026-09-25', 30), 'expiring')
  assert.equal(expiryState('2027-10-10', '2026-09-25', 30), 'ok')
  assert.equal(expiryState('', '2026-09-25', 30), 'none')
  assert.equal(verificationDue('', '2026-09-25', 365), true)
  assert.equal(verificationDue('2026-01-01', '2026-09-25', 365), false)
  const s = normalizeInventorySettings({ categories: [{ name: 'Projectors', code: 'proj!', method: 'bad', rate: 500 }], assetTagPrefix: 'bcu' })
  assert.deepEqual(s.categories, [{ name: 'Projectors', code: 'PROJ', method: 'WDV', rate: 100 }])
  assert.equal(s.assetTagPrefix, 'BCU')
  assert.ok(normalizeInventorySettings(null).categories.length > 3)
})
