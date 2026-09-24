// src/shared/utils/receiptPdf.ts
//
// Renders a ReceiptModel to a PDF and triggers a download. jsPDF is lazily
// imported so it stays out of the main bundle (same pattern as pdfGenerator.ts).

import type { ReceiptModel } from '../../modules/admin/utils/financeReceipt'

const inr = (n: number) =>
  `INR ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Download a fee payment receipt as a PDF. */
export async function downloadReceiptPdf(model: ReceiptModel): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const left = 40
  const right = 555
  const amountX = 460
  let y = 56

  // Header
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(model.collegeName, left, y); y += 16
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(110)
  if (model.collegeCode) { doc.text(`College code: ${model.collegeCode}`, left, y); y += 12 }
  doc.setTextColor(0); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
  doc.text('FEE PAYMENT RECEIPT', left, y); y += 14
  doc.setLineWidth(0.6); doc.line(left, y, right, y); y += 20

  const row = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text(label, left, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, left + 150, y)
    y += 16
  }

  doc.setFontSize(10)
  row('Receipt No', model.receiptNo)
  row('Date', model.date)
  row('Student', model.studentName)
  row('Registration No', model.regNo)
  row('Course / Batch', `${model.course} — ${model.batch}`)
  row('Fee', model.feeCategory)
  if (model.paymentMode) row('Payment mode', model.paymentMode)
  if (model.transactionId) row('Transaction ID', model.transactionId)
  if (model.bankReference) row('Bank reference', model.bankReference)
  y += 4; doc.line(left, y, right, y); y += 18

  // Line items
  doc.setFont('helvetica', 'bold')
  doc.text('Particulars', left, y); doc.text('Amount', amountX, y); y += 14
  doc.setFont('helvetica', 'normal')
  for (const item of model.items) {
    doc.text(item.label, left, y)
    doc.text(inr(item.amount), amountX, y)
    y += 15
  }
  y += 2; doc.line(left, y, right, y); y += 18

  // Totals
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text('Amount received', left, y); doc.text(inr(model.amountReceived), amountX, y); y += 20
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  row('Total fee', inr(model.totalFee))
  row('Total paid to date', inr(model.totalPaid))
  row('Balance due', inr(model.balance))
  if (model.remarks) { y += 4; doc.text(`Remarks: ${model.remarks}`, left, y); y += 16 }

  y += 28
  doc.setFontSize(8); doc.setTextColor(130)
  doc.text('This is a computer-generated receipt.', left, y)

  const safe = model.receiptNo && model.receiptNo !== '—' ? model.receiptNo : model.regNo || 'receipt'
  doc.save(`receipt-${safe}.pdf`)
}
