// Generic A4 report PDF (letterhead + titled sections of key/value rows or
// tables). Used by library, inventory and finance reports. jsPDF is lazily
// imported through the shared lazy runtime; amounts should be pre-formatted by
// the caller ("Rs." — the built-in font has no ₹ glyph).

import { loadPdfLibs } from '@/shared/utils/pdfRuntime'

export interface ReportSection {
  heading: string
  /** Two-column label / value rows. */
  rows?: Array<[string, string | number]>
  /** Or a table with a header row. */
  table?: { head: string[]; body: Array<Array<string | number>>; align?: Array<'left' | 'right'> }
  note?: string
}

export interface ReportDoc {
  collegeName: string
  address?: string
  title: string
  subtitle?: string
  sections: ReportSection[]
  footer?: string
  filename: string
  landscape?: boolean
}

export const pdfMoney = (n: number) => `Rs. ${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export async function downloadReportPdf(r: ReportDoc): Promise<void> {
  const { jsPDF } = await loadPdfLibs()
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: r.landscape ? 'landscape' : 'portrait' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 14
  let y = M

  const header = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(r.collegeName || 'College', W / 2, y, { align: 'center' })
    y += 5
    if (r.address) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.text(doc.splitTextToSize(r.address, W - 2 * M), W / 2, y, { align: 'center' })
      y += 4
    }
    doc.setDrawColor(150)
    doc.line(M, y, W - M, y)
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(r.title, M, y)
    y += 5
    if (r.subtitle) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(90)
      doc.text(r.subtitle, M, y)
      doc.setTextColor(0)
      y += 5
    }
    y += 2
  }
  const ensure = (h: number) => {
    if (y + h > H - 14) {
      doc.addPage()
      y = M
    }
  }

  header()
  for (const s of r.sections) {
    ensure(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setFillColor(238, 242, 247)
    doc.rect(M, y - 4, W - 2 * M, 6.5, 'F')
    doc.text(s.heading, M + 2, y)
    y += 6
    doc.setFontSize(9)
    if (s.rows) {
      for (const [label, value] of s.rows) {
        ensure(6)
        doc.setFont('helvetica', 'normal')
        doc.text(doc.splitTextToSize(label, (W - 2 * M) * 0.65), M + 2, y)
        doc.setFont('helvetica', 'bold')
        doc.text(String(value), W - M - 2, y, { align: 'right' })
        y += 5.5
      }
    }
    if (s.table) {
      const cols = s.table.head.length
      const colW = (W - 2 * M) / cols
      const first = Math.min(colW * 2, (W - 2 * M) * 0.45)
      const rest = cols > 1 ? (W - 2 * M - first) / (cols - 1) : 0
      const xs = s.table.head.map((_, i) => (i === 0 ? M : M + first + rest * (i - 1)))
      const widths = s.table.head.map((_, i) => (i === 0 ? first : rest))
      const drawRow = (cells: Array<string | number>, bold: boolean) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        const lines = cells.map((c, i) => doc.splitTextToSize(String(c ?? ''), widths[i] - 3) as string[])
        const h = Math.max(...lines.map(l => l.length)) * 4 + 1.5
        ensure(h)
        cells.forEach((_, i) => {
          const right = (s.table!.align?.[i] ?? (i === 0 ? 'left' : 'right')) === 'right'
          doc.text(lines[i], right ? xs[i] + widths[i] - 1.5 : xs[i] + 1.5, y, { align: right ? 'right' : 'left' })
        })
        y += h
        doc.setDrawColor(225)
        doc.line(M, y - 3, W - M, y - 3)
      }
      drawRow(s.table.head, true)
      s.table.body.forEach(row => drawRow(row, false))
    }
    if (s.note) {
      ensure(6)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(100)
      const lines = doc.splitTextToSize(s.note, W - 2 * M)
      doc.text(lines, M + 2, y)
      doc.setTextColor(0)
      y += lines.length * 3.8
    }
    y += 4
  }

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(120)
    doc.text(`${r.footer || 'Generated with Vriddhi'} · ${new Date().toLocaleDateString('en-IN')}`, M, H - 7)
    doc.text(`Page ${p} of ${pages}`, W - M, H - 7, { align: 'right' })
  }
  doc.save(r.filename)
}
