// functions/src/reports/attendanceRegister.ts
//
// The pure half of the attendance-register PDF route (item 4.3 of
// docs/HANDOFF_OPTIMISATION_2026-09-25.md).
//
// The browser has always drawn this register itself with jsPDF — a hand-laid
// table, because the project has no autotable plugin. This module draws the same
// table as HTML so headless Chrome (utils/pdfRenderer.ts) can print it as *text*
// instead of a raster image: selectable, searchable, smaller, and reproducible
// years later from the same inputs.
//
// Everything here is pure and validated: the route is reachable by any signed-in
// staff member, so a report that is too large, too wide or malformed must be
// refused with a reason code before a 2 GiB Chrome instance is asked to render it.
// Nothing in this module touches Firestore or Express.

/** Sheets allowed in one report. The client sends at most two (detail + rollup). */
export const MAX_REPORT_SHEETS = 4
/** Rows allowed in one sheet — a month of a whole college still fits. */
export const MAX_REPORT_ROWS = 8000
/** Columns allowed. Beyond this the table stops being readable on A4. */
export const MAX_REPORT_COLUMNS = 16
/** Longest single cell. Long text is truncated, never rejected. */
export const MAX_CELL_CHARS = 300
/** Longest title / subtitle / college name. */
export const MAX_TITLE_CHARS = 160

export interface ReportSheet {
  name: string
  headers: string[]
  rows: string[][]
}

export interface ReportDoc {
  title: string
  subtitle?: string
  collegeName?: string
  sheets: ReportSheet[]
  /** Column weights per sheet, normalised later; ignored when absent. */
  columnWeights?: number[][]
}

export type ReportRejection =
  | 'report_missing'
  | 'report_too_many_sheets'
  | 'report_no_columns'
  | 'report_too_many_columns'
  | 'report_too_many_rows'
  | 'report_no_title'

export interface NormalisedReport {
  doc: ReportDoc
  /** True when something was clamped (long cell, extra weight list) — worth logging. */
  clamped: boolean
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** One cell: any shape in, one truncated single-line string out. */
export function reportCell(value: unknown, maxChars = MAX_CELL_CHARS): string {
  const flat = String(value ?? '')
    // A newline inside a cell would break the table row; Chrome renders it as a
    // space here, exactly like the jsPDF table does.
    .replace(/\s+/g, ' ')
    .trim()
  if (flat.length <= maxChars) return flat
  return `${flat.slice(0, maxChars - 1)}…`
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

/**
 * Validate and clamp a request body into a render-ready report, or return the
 * reason it cannot be rendered. The route turns the reason into a 400.
 */
export function normaliseReport(raw: unknown): NormalisedReport | { error: ReportRejection } {
  if (!raw || typeof raw !== 'object') return { error: 'report_missing' }
  const body = raw as Record<string, unknown>
  const rawSheets = asArray(body.sheets)
  if (rawSheets.length === 0) return { error: 'report_missing' }
  if (rawSheets.length > MAX_REPORT_SHEETS) return { error: 'report_too_many_sheets' }

  const title = reportCell(body.title, MAX_TITLE_CHARS)
  if (!title) return { error: 'report_no_title' }

  let clamped = false
  let totalRows = 0
  const sheets: ReportSheet[] = []

  for (const rawSheet of rawSheets) {
    const sheet = (rawSheet ?? {}) as Record<string, unknown>
    const headers = asArray(sheet.headers).map((h) => reportCell(h, MAX_TITLE_CHARS))
    if (headers.length === 0) return { error: 'report_no_columns' }
    if (headers.length > MAX_REPORT_COLUMNS) return { error: 'report_too_many_columns' }

    const rows: string[][] = []
    for (const rawRow of asArray(sheet.rows)) {
      totalRows += 1
      if (totalRows > MAX_REPORT_ROWS) return { error: 'report_too_many_rows' }
      // Pad short rows and drop extra cells: a skewed table is worse than a
      // truncated one, and the client's row builders occasionally omit a
      // trailing optional column.
      const cells = asArray(rawRow).map((c) => reportCell(c))
      if (cells.length > headers.length) clamped = true
      rows.push(headers.map((_, index) => cells[index] ?? ''))
    }

    sheets.push({
      name: reportCell(sheet.name, MAX_TITLE_CHARS) || `Sheet ${sheets.length + 1}`,
      headers,
      rows,
    })
  }

  const weights = asArray(body.columnWeights).map((w) => asArray(w).map((n) => Number(n) || 0))

  return {
    doc: {
      title,
      subtitle: reportCell(body.subtitle, MAX_TITLE_CHARS) || undefined,
      collegeName: reportCell(body.collegeName, MAX_TITLE_CHARS) || undefined,
      sheets,
      columnWeights: weights.length ? weights : undefined,
    },
    clamped,
  }
}

/**
 * Column widths as percentages. Without weights every column shares the width
 * equally; with weights they keep the client's proportions so the server sheet
 * and the browser sheet look like the same document.
 */
export function columnPercents(count: number, weights?: number[]): string[] {
  const usable = (weights ?? []).slice(0, count).map((w) => (Number.isFinite(w) && w > 0 ? w : 0))
  const given = usable.length === count && usable.some((w) => w > 0)
  const values = given ? usable : new Array(count).fill(1)
  const total = values.reduce((sum, w) => sum + w, 0) || 1
  // Round to two decimals and let the browser absorb the remainder — CSS does
  // not need the sum to be exactly 100.
  return values.map((w) => `${((w / total) * 100).toFixed(2)}%`)
}

/** A whole sheet as a table with a repeating header (Chrome repeats `<thead>`). */
export function buildSheetTable(sheet: ReportSheet, weights?: number[]): string {
  const widths = columnPercents(sheet.headers.length, weights)
  const colgroup = `<colgroup>${widths.map((w) => `<col style="width:${w}">`).join('')}</colgroup>`
  const head = `<thead><tr>${sheet.headers
    .map((h) => `<th>${escapeHtml(h)}</th>`)
    .join('')}</tr></thead>`
  const body = `<tbody>${
    sheet.rows.length === 0
      ? `<tr>${sheet.headers.map(() => '<td class="empty">—</td>').join('')}</tr>`
      : sheet.rows
          .map(
            (row) =>
              `<tr>${row.map((cell, index) => `<td${index === row.length - 1 ? ' class="last"' : ''}>${escapeHtml(cell)}</td>`).join('')}</tr>`,
          )
          .join('')
  }</tbody>`
  return `<table>${colgroup}${head}${body}</table>`
}

/**
 * The full printable document. Landscape A4 with 12 mm margins, 8.5 pt type so a
 * month of attendance fits the page width, and `-webkit-print-color-adjust` so
 * the header band keeps its colour in the PDF.
 */
export function buildAttendanceRegisterHtml(doc: ReportDoc, options: { landscape?: boolean } = {}): string {
  const landscape = options.landscape !== false
  const header = [doc.collegeName, doc.title, doc.subtitle].filter(Boolean).map((line) => escapeHtml(line)).join(' · ')
  const sheets = doc.sheets
    .map(
      (sheet, index) =>
        `<section class="sheet">${
          index > 0 || doc.sheets.length > 1 ? `<h2>${escapeHtml(sheet.name)}</h2>` : ''
        }${buildSheetTable(sheet, doc.columnWeights?.[index])}</section>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>${escapeHtml(doc.title)}</title>
<style>
  @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 8.5pt; color: #111827; margin: 0; }
  .band { border-bottom: 2px solid #0f766e; padding-bottom: 3mm; margin-bottom: 4mm; }
  .band h1 { font-size: 13pt; margin: 0 0 1mm; color: #0f766e; }
  .band p { margin: 0; color: #4b5563; font-size: 8pt; }
  .sheet { margin-bottom: 6mm; }
  .sheet h2 { font-size: 10pt; margin: 0 0 2mm; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 0.4pt solid #d1d5db; padding: 1.1mm 1.4mm; text-align: left; vertical-align: top;
           overflow-wrap: anywhere; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  th { background: #f3f4f6; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.02em; }
  td.last { text-align: right; }
  td.empty { color: #9ca3af; text-align: center; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
</style></head>
<body>
  <div class="band"><h1>${escapeHtml(doc.title)}</h1>${doc.subtitle ? `<p>${escapeHtml(doc.subtitle)}</p>` : ''}</div>
  <div class="meta" style="display:none">${header}</div>
  ${sheets}
</body></html>`
}

/** `faculty_attendance_2026-09.pdf` — filesystem-safe and readable in Downloads. */
export function attendanceRegisterFilename(doc: ReportDoc): string {
  const base = String(doc.title || 'attendance')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'attendance'
  return `${base}.pdf`
}
