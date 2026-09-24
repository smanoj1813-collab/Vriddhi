// src/modules/admin/utils/feeReference.ts
//
// Pure, dependency-free helpers for the college fee & payment flows. No Firebase
// import, so these unit-test under `node --test` without a browser/Firebase
// environment (same pattern as assessmentStats.ts / examSectionBreaks.ts).

/** Lifecycle of a single payment entry against a fee record. */
export type PaymentSubmissionStatus =
  | 'recorded'             // admin collected it directly — final, already credited to the ledger
  | 'pending_verification' // a student submitted proof; awaits finance-office review (not yet credited)
  | 'verified'             // proof approved and the ledger credited
  | 'rejected'             // proof rejected; ledger untouched

/** Ledger status a credit can produce (a subset of FeeStatus in feeApi.ts). */
export type LedgerStatus = 'paid' | 'overdue' | 'partial'

/**
 * A suggested bank/UPI-style reference for when the operator leaves the
 * transaction-id field blank. Injectable seed keeps it deterministic in tests.
 */
export function suggestTransactionId(
  now: number = Date.now(),
  seq: number = Math.floor(Math.random() * 1000),
): string {
  return `TXN-${now}-${seq}`
}

/** Trim + upper-case a manually entered reference. Empty stays empty (→ auto). */
export function normalizeReference(value: string | undefined | null): string {
  return (value ?? '').trim().toUpperCase()
}

/**
 * Pure ledger math: the paid amount + status after crediting `amount` to a fee
 * record, clamped to the total. Shared by direct collection and proof
 * verification so both derive the resulting status identically.
 */
export function creditLedger(
  current: Record<string, unknown>,
  amount: number,
  todayStr: string,
): { paidAmount: number; status: LedgerStatus } {
  const totalRaw = Number(current.amount)
  const total = Number.isFinite(totalRaw) ? totalRaw : 0
  const paidRaw = Number(current.paidAmount)
  const paid = Number.isFinite(paidRaw) ? paidRaw : 0
  const credit = Number.isFinite(amount) ? amount : 0
  const newPaidAmount = Math.min(paid + credit, total)
  const dueDate = String(current.dueDate ?? '').slice(0, 10)
  const status: LedgerStatus =
    total > 0 && newPaidAmount >= total
      ? 'paid'
      : dueDate && dueDate < todayStr
        ? 'overdue'
        : 'partial'
  return { paidAmount: newPaidAmount, status }
}
