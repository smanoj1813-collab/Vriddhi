// src/shared/utils/receiptPdf.ts
//
// Backwards-compatible entry point for fee receipts. The renderer now lives in
// financePdf.ts alongside payslips, salary certificates and guest bills so all
// finance documents share the college letterhead.

export { downloadReceiptPdf } from './financePdf'
