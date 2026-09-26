// Barcode label sheets (A4) for library books and asset tags.
// Code 39 bars are drawn as rectangles with jsPDF — no barcode library and
// no external service. Readable by every USB scanner and by BarcodeDetector.

import { code39Widths } from './libraryEngine'
import { loadPdfLibs } from '@/shared/utils/pdfRuntime'

export interface LabelItem {
  code: string
  line1: string
  line2?: string
  line3?: string
}

export interface LabelSheetOptions {
  header: string
  columns?: number
  rows?: number
  /** Skip this many labels at the start (reuse a partly used sheet). */
  skip?: number
  filename: string
}

type Doc = import('jspdf').jsPDF

function drawBarcode(doc: Doc, text: string, x: number, y: number, maxW: number, h: number) {
  // Code 39 supports only upper-case A-Z, 0-9 and - . space $ / + %
  const safe = text.toUpperCase().replace(/[^A-Z0-9\-. $/+%]/g, '-')
  const widths = code39Widths(safe)
  const units = widths.reduce((s, w) => s + w, 0)
  const unit = Math.min(maxW / units, 0.5)
  const total = unit * units
  let cx = x + (maxW - total) / 2
  doc.setFillColor(0, 0, 0)
  widths.forEach((w, i) => {
    if (i % 2 === 0) doc.rect(cx, y, w * unit, h, 'F')
    cx += w * unit
  })
}

const clip = (doc: Doc, s: string, w: number) => {
  if (!s) return ''
  if (doc.getTextWidth(s) <= w) return s
  let t = s
  while (t.length > 1 && doc.getTextWidth(`${t}…`) > w) t = t.slice(0, -1)
  return `${t}…`
}

export async function downloadLabelSheet(items: LabelItem[], opts: LabelSheetOptions): Promise<void> {
  const { jsPDF } = await loadPdfLibs()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const cols = Math.max(1, opts.columns ?? 3)
  const rows = Math.max(1, opts.rows ?? 8)
  const marginX = 7
  const marginY = 10
  const cellW = (210 - marginX * 2) / cols
  const cellH = (297 - marginY * 2) / rows
  const perPage = cols * rows
  const slots = [...Array(Math.max(0, opts.skip ?? 0)).fill(null), ...items] as Array<LabelItem | null>

  slots.forEach((item, i) => {
    const pos = i % perPage
    if (i > 0 && pos === 0) doc.addPage()
    if (!item) return
    const x = marginX + (pos % cols) * cellW
    const y = marginY + Math.floor(pos / cols) * cellH
    const pad = 2.5
    const w = cellW - pad * 2
    doc.setDrawColor(210)
    doc.setLineWidth(0.1)
    doc.rect(x + 0.5, y + 0.5, cellW - 1, cellH - 1)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(90)
    doc.text(clip(doc, opts.header, w), x + pad, y + pad + 2)
    doc.setTextColor(0)
    doc.setFontSize(8)
    doc.text(clip(doc, item.line1, w), x + pad, y + pad + 5.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    if (item.line2) doc.text(clip(doc, item.line2, w), x + pad, y + pad + 8.5)
    const barTop = y + pad + 10
    const barH = Math.max(6, cellH - pad * 2 - 15)
    drawBarcode(doc, item.code, x + pad, barTop, w, barH)
    doc.setFont('courier', 'bold')
    doc.setFontSize(8)
    const codeText = item.code.toUpperCase()
    doc.text(codeText, x + cellW / 2, barTop + barH + 3, { align: 'center' })
    if (item.line3) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.text(clip(doc, item.line3, w), x + pad, y + cellH - pad)
    }
  })
  doc.save(opts.filename)
}
