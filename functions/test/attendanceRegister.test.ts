// functions/test/attendanceRegister.test.ts
//
// The attendance register is printed, filed and audited, so the tests here are
// about what must never appear on the page: unescaped user text, a table whose
// rows disagree with its header, or a report large enough to occupy a 2 GiB
// Chrome instance for a whole minute.
//
// Run: `npm --prefix functions run test:unit`.

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MAX_CELL_CHARS,
  MAX_REPORT_COLUMNS,
  MAX_REPORT_ROWS,
  MAX_REPORT_SHEETS,
  attendanceRegisterFilename,
  buildAttendanceRegisterHtml,
  buildSheetTable,
  columnPercents,
  escapeHtml,
  normaliseReport,
  reportCell,
  type ReportDoc,
} from '../src/reports/attendanceRegister'

const sheet = (headers: string[], rows: unknown[][] = []) => ({ name: 'Detail', headers, rows })

function ok(raw: unknown): ReportDoc {
  const result = normaliseReport(raw)
  assert.ok('doc' in result, `expected a valid report, got ${JSON.stringify(result)}`)
  return result.doc
}

test('a valid report keeps its title, subtitle and college', () => {
  const doc = ok({
    title: 'Student attendance — September 2026',
    subtitle: 'BCA · Semester 5',
    collegeName: 'Sri Siddaganga College',
    sheets: [sheet(['Date', 'Student'], [['2026-09-01', 'Bala Kumar']])],
  })

  assert.equal(doc.title, 'Student attendance — September 2026')
  assert.equal(doc.subtitle, 'BCA · Semester 5')
  assert.equal(doc.collegeName, 'Sri Siddaganga College')
  assert.equal(doc.sheets.length, 1)
  assert.equal(doc.sheets[0].rows.length, 1)
})

test('a missing body, empty sheets or a missing title are refused with a reason code', () => {
  assert.deepEqual(normaliseReport(undefined), { error: 'report_missing' })
  assert.deepEqual(normaliseReport({ title: 'X' }), { error: 'report_missing' })
  assert.deepEqual(normaliseReport({ title: 'X', sheets: [] }), { error: 'report_missing' })
  assert.deepEqual(normaliseReport({ title: '  ', sheets: [sheet(['A'])] }), { error: 'report_no_title' })
})

test('a sheet with no columns is refused — an empty table is a mistake, not a report', () => {
  assert.deepEqual(normaliseReport({ title: 'X', sheets: [{ name: 'Detail', headers: [] }] }), {
    error: 'report_no_columns',
  })
})

test('too many sheets, columns or rows are refused before Chrome is started', () => {
  const manySheets = new Array(MAX_REPORT_SHEETS + 1).fill(sheet(['A']))
  assert.deepEqual(normaliseReport({ title: 'X', sheets: manySheets }), { error: 'report_too_many_sheets' })

  const wide = sheet(new Array(MAX_REPORT_COLUMNS + 1).fill('Column'))
  assert.deepEqual(normaliseReport({ title: 'X', sheets: [wide] }), { error: 'report_too_many_columns' })

  const long = sheet(['Date'], Array.from({ length: MAX_REPORT_ROWS + 1 }, (_, i) => [`2026-09-${i}`]))
  assert.deepEqual(normaliseReport({ title: 'X', sheets: [long] }), { error: 'report_too_many_rows' })
})

test('the limits are counted across sheets, not per sheet', () => {
  const half = Math.ceil((MAX_REPORT_ROWS + 1) / 2)
  const rows = Array.from({ length: half }, () => ['x'])
  const result = normaliseReport({ title: 'X', sheets: [sheet(['A'], rows), sheet(['A'], rows)] })
  assert.deepEqual(result, { error: 'report_too_many_rows' })
})

test('a row with fewer cells is padded and a row with more is marked clamped', () => {
  const padded = ok({ title: 'X', sheets: [sheet(['Date', 'Name', 'Status'], [['2026-09-01', 'Bala']])] })
  assert.deepEqual(padded.sheets[0].rows[0], ['2026-09-01', 'Bala', ''])

  const extra = normaliseReport({
    title: 'X',
    sheets: [sheet(['Date', 'Name'], [['2026-09-01', 'Bala', 'surplus']])],
  })
  assert.ok('doc' in extra)
  assert.equal(extra.clamped, true, 'a dropped cell must be reported, not hidden')
  assert.deepEqual(extra.doc.sheets[0].rows[0], ['2026-09-01', 'Bala'])
})

test('a long cell is truncated rather than rejected', () => {
  const long = 'x'.repeat(600)
  const cell = reportCell(long)
  assert.equal(cell.length, MAX_CELL_CHARS)
  assert.ok(cell.endsWith('…'))
  const doc = ok({ title: 'X', sheets: [sheet(['Remark'], [[long]])] })
  assert.equal(doc.sheets[0].rows[0][0].length, MAX_CELL_CHARS)
})

test('newlines and tabs inside a cell become one space', () => {
  assert.equal(reportCell('Filed\nat  the\tbank'), 'Filed at the bank')
})

test('escapeHtml neutralises every character that could break out of the cell', () => {
  assert.equal(escapeHtml(`<script>alert("x")</script>`), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
  assert.equal(escapeHtml("O'Brien & Sons"), 'O&#039;Brien &amp; Sons')
})

test('a student name cannot inject markup into the printed register', () => {
  const doc = ok({
    title: 'Attendance',
    sheets: [sheet(['Student'], [['<img src=x onerror=alert(1)>']])],
  })
  const html = buildAttendanceRegisterHtml(doc)
  assert.ok(!html.includes('<img'), 'an image tag from the data must never reach the document')
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'))
})

test('the document repeats the header band and states the size it will print at', () => {
  const doc = ok({ title: 'Student attendance', collegeName: 'ABC College', sheets: [sheet(['Date'], [['2026-09-01']])] })
  const html = buildAttendanceRegisterHtml(doc)
  assert.ok(html.includes('@page { size: A4 landscape; margin: 12mm; }'))
  assert.ok(html.includes('<th>Date</th>'))
  assert.ok(html.includes('thead { display: table-header-group; }'), 'the header must repeat on every page')
  assert.ok(html.includes('ABC College'))
})

test('portrait is available for a narrow register', () => {
  const doc = ok({ title: 'My attendance', sheets: [sheet(['Date', 'Status'], [['2026-09-01', 'Present']])] })
  const html = buildAttendanceRegisterHtml(doc, { landscape: false })
  assert.ok(html.includes('@page { size: A4 portrait; margin: 12mm; }'))
})

test('an empty sheet still renders its headers, not a blank page', () => {
  const doc = ok({ title: 'Attendance', sheets: [sheet(['Date', 'Student'])] })
  const html = buildAttendanceRegisterHtml(doc)
  assert.ok(html.includes('<th>Date</th>') && html.includes('<th>Student</th>'))
  assert.ok(html.includes('class="empty"'), 'the empty state must be visible on the page')
})

test('a sheet named "Sheet 2" is labelled when there is more than one sheet', () => {
  const doc = ok({
    title: 'Attendance',
    sheets: [
      { name: 'Detail', headers: ['Date'], rows: [['2026-09-01']] },
      { name: 'Summary', headers: ['Student'], rows: [['Bala Kumar']] },
    ],
  })
  const html = buildAttendanceRegisterHtml(doc)
  assert.ok(html.includes('<h2>Detail</h2>') && html.includes('<h2>Summary</h2>'))
})

test('column widths follow the client weights, and fall back to equal columns', () => {
  assert.deepEqual(columnPercents(2, [3, 1]), ['75.00%', '25.00%'])
  assert.deepEqual(columnPercents(4), ['25.00%', '25.00%', '25.00%', '25.00%'])
  // Weights that do not match the column count are ignored, not stretched.
  assert.deepEqual(columnPercents(3, [1, 2]), ['33.33%', '33.33%', '33.33%'])
  // A zero-weight column is allowed (a spacer column) as long as another is set.
  assert.deepEqual(columnPercents(2, [0, 4]), ['0.00%', '100.00%'])
})

test('the table carries a colgroup so the printed sheet matches the browser sheet', () => {
  const html = buildSheetTable({ name: 'Detail', headers: ['Date', 'Student'], rows: [['2026-09-01', 'Bala']] }, [1, 3])
  assert.ok(html.includes('<colgroup><col style="width:25.00%"><col style="width:75.00%"></colgroup>'))
})

test('the filename is filesystem-safe and always ends in .pdf', () => {
  assert.equal(attendanceRegisterFilename({ title: 'Faculty attendance — Sept/2026', sheets: [] }), 'faculty_attendance_sept_2026.pdf')
  assert.equal(attendanceRegisterFilename({ title: '   ', sheets: [] }), 'attendance.pdf')
  assert.ok(attendanceRegisterFilename({ title: 'a'.repeat(200), sheets: [] }).length <= 64)
})

test('a report with no college name still prints a usable header', () => {
  const doc = ok({ title: 'My attendance', sheets: [sheet(['Date'], [['2026-09-01']])] })
  const html = buildAttendanceRegisterHtml(doc)
  assert.ok(html.includes('<h1>My attendance</h1>'))
  assert.ok(!html.includes('undefined'))
})
