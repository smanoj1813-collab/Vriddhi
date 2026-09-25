import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_LIBRARY_SETTINGS as D,
  canIssue,
  canRenew,
  chargeableOverdueDays,
  code39Widths,
  computeDueDate,
  computeOverdueFine,
  formatAccession,
  isValidIsbn,
  isbn10to13,
  loanState,
  lostBookCharge,
  normalizeLibrarySettings,
  renewedDueDate,
} from './libraryEngine'

const S = { ...D, holidays: ['2026-10-02'] } // Gandhi Jayanti (a Friday)

test('due date skips Sundays and holidays when configured', () => {
  // 2026-09-18 is a Friday; +14 = 2026-10-02 (holiday, Fri) → Sat 03
  assert.equal(computeDueDate('2026-09-18', 14, S), '2026-10-03')
  // +16 = Sun 2026-10-04 → Mon 05
  assert.equal(computeDueDate('2026-09-18', 16, S), '2026-10-05')
  assert.equal(computeDueDate('2026-09-18', 16, { ...S, dueDateSkipsClosedDays: false }), '2026-10-04')
})

test('overdue days exclude grace and closed days; fine is capped', () => {
  // due Thu 2026-10-01, returned Mon 10-05: late 4 days (Fri holiday, Sat, Sun, Mon) → chargeable Sat + Mon = 2
  assert.equal(chargeableOverdueDays('2026-10-01', '2026-10-05', 0, S), 2)
  assert.equal(chargeableOverdueDays('2026-10-01', '2026-10-05', 0, { ...S, skipClosedDaysInFines: false }), 4)
  assert.equal(chargeableOverdueDays('2026-10-01', '2026-10-05', 3, { ...S, skipClosedDaysInFines: false }), 1)
  assert.equal(chargeableOverdueDays('2026-10-01', '2026-09-30', 0, S), 0)
  assert.deepEqual(computeOverdueFine('2026-10-01', '2026-10-05', { finePerDay: 5, maxFine: 0, graceDays: 0 }, S), { days: 2, amount: 10 })
  assert.deepEqual(computeOverdueFine('2026-01-01', '2026-06-01', { finePerDay: 5, maxFine: 200, graceDays: 0 }, S).amount, 200)
  assert.equal(computeOverdueFine('2026-01-01', '2026-06-01', { finePerDay: 0, maxFine: 0, graceDays: 0 }, S).amount, 0)
})

test('lost book charge follows the college policy', () => {
  assert.equal(lostBookCharge(450, { ...D, lostBookPolicy: 'price' }), 450)
  assert.equal(lostBookCharge(450, { ...D, lostBookPolicy: 'price_plus_fee', lostProcessingFee: 100 }), 550)
  assert.equal(lostBookCharge(450, { ...D, lostBookPolicy: 'multiple', lostMultiplier: 2 }), 900)
})

test('issue and renewal rules', () => {
  const p = D.policies.student
  assert.equal(canIssue({ activeLoans: 0, unpaidFines: 0, policy: p, settings: D }).ok, true)
  assert.equal(canIssue({ activeLoans: 3, unpaidFines: 0, policy: p, settings: D }).ok, false)
  assert.equal(canIssue({ activeLoans: 0, unpaidFines: 150, policy: p, settings: { blockIssueAboveFine: 100 } }).ok, false)
  assert.equal(canIssue({ activeLoans: 0, unpaidFines: 150, policy: p, settings: { blockIssueAboveFine: 0 } }).ok, true)
  assert.equal(canIssue({ activeLoans: 0, unpaidFines: 0, policy: p, settings: D, alreadyHasTitle: true }).ok, false)
  assert.equal(canRenew({ renewals: 0, dueDate: '2026-10-01', today: '2026-09-30', policy: p, waitingReservations: 0 }).ok, true)
  assert.equal(canRenew({ renewals: 1, dueDate: '2026-10-01', today: '2026-09-30', policy: p, waitingReservations: 0 }).ok, false)
  assert.equal(canRenew({ renewals: 0, dueDate: '2026-10-01', today: '2026-09-30', policy: p, waitingReservations: 1 }).ok, false)
  // renew from the later of today / due date
  assert.equal(renewedDueDate('2026-10-01', '2026-09-25', { ...p, renewDays: 7 }, { ...S, dueDateSkipsClosedDays: false }), '2026-10-08')
  assert.equal(renewedDueDate('2026-09-20', '2026-09-25', { ...p, renewDays: 7 }, { ...S, dueDateSkipsClosedDays: false }), '2026-10-02')
})

test('settings normalisation keeps defaults and rejects junk', () => {
  const s = normalizeLibrarySettings({ policies: { student: { maxBooks: 5, loanDays: -3 } }, holidays: ['2026-01-26', 'bad'], accessionPrefix: 'bcu lib!', lostBookPolicy: 'nope' })
  assert.equal(s.policies.student.maxBooks, 5)
  assert.equal(s.policies.student.loanDays, D.policies.student.loanDays)
  assert.deepEqual(s.holidays, ['2026-01-26'])
  assert.equal(s.accessionPrefix, 'BCULIB')
  assert.equal(s.lostBookPolicy, D.lostBookPolicy)
  assert.deepEqual(normalizeLibrarySettings(null), normalizeLibrarySettings({}))
})

test('identifiers: accession, ISBN, Code 39', () => {
  assert.equal(formatAccession('ACC', 42, 6), 'ACC000042')
  assert.equal(isValidIsbn('978-0-262-03384-8'), true)
  assert.equal(isValidIsbn('0-262-03384-4'), true)
  assert.equal(isValidIsbn('978-0-262-03384-9'), false)
  assert.equal(isbn10to13('0262033844'), '9780262033848')
  const w = code39Widths('A1')
  // 3 chars incl. start/stop ×9 elements + 2 gaps... '*A1*' = 4 chars → 36 + 3 gaps
  assert.equal(w.length, 39)
  assert.ok(w.every(x => x === 1 || x === 3))
  assert.throws(() => code39Widths('a#'))
  assert.equal(loanState('2026-09-20', '2026-09-25'), 'overdue')
  assert.equal(loanState('2026-09-26', '2026-09-25'), 'due_soon')
  assert.equal(loanState('2026-10-26', '2026-09-25'), 'ok')
})
