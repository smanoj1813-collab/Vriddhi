# Fee and system management

## Fee ledger source of truth

New fee records live under:

```text
colleges/{collegeId}/feePayments/{paymentId}
colleges/{collegeId}/feePayments/{paymentId}/transactions/{transactionId}
colleges/{collegeId}/feeStructures/{structureId}
```

`feePayments` is the current invoice balance. `transactions` is append-only history for each collection or waiver. A collection is committed with a Firestore transaction, so two finance users cannot overwrite each other’s `paidAmount`. The API validates the remaining balance, rejects payments against waived invoices, derives overdue/partial/paid status, and records the actor, receipt number and transaction id.

The admin Fee Management page now supports:

- Assigning an invoice to a student from the college’s actual `students` collection.
- Recording full or partial cash, UPI, card, net-banking, cheque or DD payments.
- Waiving an outstanding balance with a reason and an immutable waiver transaction.
- Outstanding-balance-aware KPIs and overdue values.
- A real CSV export instead of a console placeholder.
- Student summaries reading the same nested ledger, with a legacy top-level fallback for old data.

There is intentionally no fake student-side online payment. The portal tells students to use the college finance office until a verified payment gateway and server-side webhook are configured. A student cannot write a payment or transaction in the Firestore rules.

## Super-admin System Management

The new `/superadmin/system-management` page replaces the old static idea of a system page with three real Firestore-backed responsibilities:

- Live probes against the institutions, identity, tenant and audit collections.
- Platform controls in `systemConfig/app` (maintenance mode/message, college onboarding, default academic year and fee policy defaults).
- Append-only changes in `systemAuditLogs`.

Telemetry collections are optional and read-only from the browser:

```text
performanceMetrics
slowQueries
errors
alerts
```

If telemetry has not been deployed yet, the UI shows zero tracked requests and the actual Firestore probe latency rather than fabricated uptime or request counts. `Create College` consumes the onboarding toggle, so the control has an immediate operational effect.

All platform collections are restricted to the authoritative `superadmin` claim in `current-firestore.rules`. Deploy the rules before using the new transaction history or system page:

```bash
npm run deploy:rules
```
