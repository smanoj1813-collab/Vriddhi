// src/shared/utils/attendanceExport.ts
//
// Attendance report downloads: CSV, real XLSX (via the `xlsx` dependency
// already in package.json) and PDF (jsPDF, also already present).
//
// The pre-existing faculty export hook hand-rolls a CSV and saves it with an
// `.xlsx` extension, which Excel opens with a "file format doesn't match the
// extension" warning. Anything new goes through here instead, so a principal
// downloading a monthly register gets a file that opens cleanly.
//
// The table builders are pure and unit tested; only `triggerDownload` touches
// the DOM.

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

import {
  STAFF_STATUS_LABEL,
  STAFF_STATUS_ORDER,
  STAFF_STATUS_SHORT,
  type StaffAttendanceRecord,
  type StaffAttendanceStatus,
} from '../types/staffAttendance';
import {
  formatDayLabel,
  type AttendanceRange,
  type AttendanceRegister,
  type RegisterRow,
  type StaffAttendanceSummary,
  type DailyAttendancePoint,
} from './staffAttendanceStats';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportSheet {
  name: string;
  /** Header row. */
  headers: string[];
  /** One array per data row, aligned with `headers`. */
  rows: (string | number)[][];
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

/** RFC 4180 quoting: wrap when the value contains a comma, quote or newline. */
export function escapeCsvValue(value: string | number | null | undefined): string {
  const raw = value == null ? '' : String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

export function toCsv(sheet: ExportSheet): string {
  const lines = [sheet.headers.map(escapeCsvValue).join(',')];
  for (const row of sheet.rows) lines.push(row.map(escapeCsvValue).join(','));
  // \r\n is what Excel on Windows expects for a clean line break in a cell.
  return lines.join('\r\n') + '\r\n';
}

/**
 * UTF-8 BOM. Without it Excel reads a UTF-8 CSV as ANSI and mangles the
 * Indic names this app is full of.
 */
export const CSV_BOM = '\uFEFF';

export function toCsvBlob(sheet: ExportSheet): Blob {
  return new Blob([CSV_BOM + toCsv(sheet)], { type: 'text/csv;charset=utf-8;' });
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────

export function toXlsxBlob(sheets: ExportSheet[]): Blob {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
    // Column widths track the widest cell, capped so one long note cannot
    // produce a 200-character-wide column.
    ws['!cols'] = sheet.headers.map((header, i) => {
      const widest = sheet.rows.reduce((max, row) => Math.max(max, String(row[i] ?? '').length), header.length);
      return { wch: Math.min(Math.max(widest + 2, 8), 40) };
    });
    // Sheet names are limited to 31 chars and cannot contain : \ / ? * [ ]
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31) || 'Sheet');
  }
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  collegeName?: string;
  sheets: ExportSheet[];
  /** Column weights, per sheet, summing to anything — they are normalised. */
  columnWeights?: number[][];
}

const PAGE_MARGIN = 28;

/**
 * jsPDF has no autotable plugin in this project, so the table is laid out by
 * hand: fixed-weight columns, text clipped to the column, header repeated on
 * every page. It is plain but it prints, which is the point of a register.
 */
export function toPdfBlob(options: PdfReportOptions): Blob {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - PAGE_MARGIN * 2;

  let y = PAGE_MARGIN;

  const drawHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(options.title, PAGE_MARGIN, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (options.collegeName) {
      doc.text(options.collegeName, PAGE_MARGIN, y);
      y += 12;
    }
    if (options.subtitle) {
      doc.text(options.subtitle, PAGE_MARGIN, y);
      y += 12;
    }
    doc.setFontSize(8);
    doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, PAGE_MARGIN, y);
    y += 14;
  };

  drawHeader();

  options.sheets.forEach((sheet, sheetIndex) => {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = PAGE_MARGIN;
      drawHeader();
    }
    if (sheetIndex > 0) y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(sheet.name, PAGE_MARGIN, y);
    y += 12;

    const weights = options.columnWeights?.[sheetIndex] ?? sheet.headers.map(() => 1);
    const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
    const widths = weights.map((w) => (w / weightSum) * usableWidth);

    const drawRow = (cells: string[], bold: boolean, background?: [number, number, number]) => {
      const rowHeight = 16;
      if (y + rowHeight > pageHeight - PAGE_MARGIN) {
        doc.addPage();
        y = PAGE_MARGIN;
      }
      if (background) {
        doc.setFillColor(background[0], background[1], background[2]);
        doc.rect(PAGE_MARGIN, y - 10, usableWidth, rowHeight, 'F');
      }
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(8);
      let x = PAGE_MARGIN;
      cells.forEach((cell, i) => {
        const maxChars = Math.max(4, Math.floor(widths[i] / 4.2));
        const text = cell.length > maxChars ? `${cell.slice(0, maxChars - 1)}…` : cell;
        doc.text(text, x + 3, y);
        x += widths[i];
      });
      y += rowHeight;
    };

    drawRow(sheet.headers, true, [241, 245, 249]);
    if (sheet.rows.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('No records for this period.', PAGE_MARGIN + 3, y);
      y += 16;
    }
    for (const row of sheet.rows) {
      drawRow(row.map((c) => (c == null ? '' : String(c))), false);
    }
    y += 6;
  });

  return doc.output('blob');
}

// ─── Download plumbing ────────────────────────────────────────────────────────

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke on the next tick: revoking synchronously cancels some downloads.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** `attendance_2026-09` — filesystem-safe, and readable in a Downloads folder. */
export function exportFilename(prefix: string, range: AttendanceRange, format: ExportFormat): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const stamp = range.kind === 'month' && range.month
    ? range.month
    : range.start === range.end
      ? range.start
      : `${range.start}_to_${range.end}`;
  const ext = format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf';
  return `${safePrefix}_${stamp}.${ext}`;
}

export function downloadAttendanceReport(
  format: ExportFormat,
  filenamePrefix: string,
  range: AttendanceRange,
  report: { title: string; subtitle?: string; collegeName?: string; sheets: ExportSheet[]; columnWeights?: number[][] },
): string {
  const filename = exportFilename(filenamePrefix, range, format);
  const blob =
    format === 'csv'
      ? toCsvBlob(report.sheets[0] ?? { name: 'Report', headers: [], rows: [] })
      : format === 'excel'
        ? toXlsxBlob(report.sheets)
        : toPdfBlob(report);
  triggerDownload(blob, filename);
  return filename;
}

// ─── Staff attendance report builders ─────────────────────────────────────────

export interface StaffReportInput {
  records: StaffAttendanceRecord[];
  summaries: StaffAttendanceSummary[];
  register: AttendanceRegister;
  range: AttendanceRange;
  collegeName?: string;
}

/** One row per faculty member per recorded day — the raw audit trail. */
export function buildStaffDetailSheet(records: StaffAttendanceRecord[], range: AttendanceRange): ExportSheet {
  const rows = records
    .filter((r) => r.date >= range.start && r.date <= range.end)
    .sort((a, b) => a.date.localeCompare(b.date) || a.facultyName.localeCompare(b.facultyName))
    .map((r) => [
      r.date,
      formatDayLabel(r.date),
      r.facultyName,
      r.department || 'General',
      r.designation || '',
      STAFF_STATUS_LABEL[r.status] ?? r.status,
      r.checkIn || '',
      r.checkOut || '',
      r.hoursWorked || 0,
      r.note || '',
      r.source === 'self' ? 'Self' : 'Admin',
    ]);

  return {
    name: 'Daily Records',
    headers: [
      'Date', 'Day', 'Faculty', 'Department', 'Designation', 'Status',
      'Check In', 'Check Out', 'Hours', 'Note', 'Marked By',
    ],
    rows,
  };
}

/** One row per faculty member for the whole period — the summary sheet. */
export function buildStaffSummarySheet(summaries: StaffAttendanceSummary[], range: AttendanceRange): ExportSheet {
  const rows = summaries.map((s) => [
    s.facultyName,
    s.department || 'General',
    s.designation || '',
    s.expectedDays,
    s.marked,
    s.unmarked,
    ...STAFF_STATUS_ORDER.map((status) => s.counts[status]),
    s.percentage,
  ]);

  return {
    name: 'Faculty Summary',
    headers: [
      'Faculty', 'Department', 'Designation', 'Working Days', 'Days Marked', 'Not Marked',
      ...STAFF_STATUS_ORDER.map((s) => STAFF_STATUS_LABEL[s]),
      'Attendance %',
    ],
    rows,
  };
}

/** The classic register: faculty down the side, dates across the top. */
export function buildStaffRegisterSheet(register: AttendanceRegister): ExportSheet {
  const rows = register.rows.map((row: RegisterRow) => [
    row.facultyName,
    row.department || 'General',
    ...row.cells.map((c: StaffAttendanceStatus | null) => (c ? STAFF_STATUS_SHORT[c] : '-')),
    row.percentage,
  ]);

  return {
    name: 'Monthly Register',
    headers: [
      'Faculty', 'Department',
      ...register.dates.map((d) => d.slice(8)),
      '%',
    ],
    rows,
  };
}

export function buildStaffTrendSheet(daily: DailyAttendancePoint[]): ExportSheet {
  return {
    name: 'Daily Trend',
    headers: ['Date', 'Present', 'Late', 'Half Day', 'Leave', 'Absent', 'Not Marked', 'Attendance %'],
    rows: daily.map((d) => [
      d.date,
      d.present,
      d.late,
      d.other,
      d.leave,
      d.absent,
      d.unmarked,
      d.percentage,
    ]),
  };
}

// ─── Student attendance report builders ───────────────────────────────────────

/**
 * Student attendance rows, kept structural (plain arrays) so the admin page
 * does not have to know about XLSX or CSV to produce a download.
 */
export interface StudentAttendanceDetailRow {
  date: string;
  studentName: string;
  regNo: string;
  usn?: string;
  branch?: string;
  batch?: string;
  division?: string;
  subject?: string;
  status: string;
  markedBy?: string;
}

export interface StudentAttendanceSummaryRow {
  studentName: string;
  regNo: string;
  branch?: string;
  batch?: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
}

/** Human-readable label for the lowercase statuses stored in attendanceRecords. */
const STUDENT_STATUS_LABEL: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  leave: 'On Leave',
  onDuty: 'On Duty',
  medicalLeave: 'Medical Leave',
};

export function studentStatusLabel(status: string): string {
  return STUDENT_STATUS_LABEL[status] ?? status;
}

export function buildStudentDetailSheet(rows: StudentAttendanceDetailRow[], range: AttendanceRange): ExportSheet {
  const sorted = [...rows]
    .filter((r) => r.date >= range.start && r.date <= range.end)
    .sort((a, b) => a.date.localeCompare(b.date) || a.studentName.localeCompare(b.studentName));

  return {
    name: 'Attendance Records',
    headers: ['Date', 'Day', 'Student', 'Reg No', 'USN', 'Branch', 'Batch', 'Division', 'Subject', 'Status', 'Marked By'],
    rows: sorted.map((r) => [
      r.date,
      formatDayLabel(r.date),
      r.studentName,
      r.regNo,
      r.usn ?? '',
      r.branch ?? '',
      r.batch ?? '',
      r.division ?? '',
      r.subject ?? '',
      studentStatusLabel(r.status),
      r.markedBy ?? '',
    ]),
  };
}

export function buildStudentSummarySheet(rows: StudentAttendanceSummaryRow[]): ExportSheet {
  return {
    name: 'Student Summary',
    headers: ['Student', 'Reg No', 'Branch', 'Batch', 'Classes', 'Present', 'Absent', 'Late', 'Leave', 'Attendance %'],
    rows: rows.map((r) => [
      r.studentName,
      r.regNo,
      r.branch ?? '',
      r.batch ?? '',
      r.totalClasses,
      r.present,
      r.absent,
      r.late,
      r.leave,
      Math.round(r.percentage * 10) / 10,
    ]),
  };
}

export function buildStudentAttendanceReport(input: {
  detail: StudentAttendanceDetailRow[];
  summary: StudentAttendanceSummaryRow[];
  range: AttendanceRange;
  collegeName?: string;
}): { title: string; subtitle: string; collegeName?: string; sheets: ExportSheet[]; columnWeights: number[][] } {
  return {
    title: 'Student Attendance Report',
    subtitle: `${input.range.label}  ·  ${input.summary.length} students  ·  ${input.detail.length} records`,
    collegeName: input.collegeName,
    sheets: [buildStudentSummarySheet(input.summary), buildStudentDetailSheet(input.detail, input.range)],
    columnWeights: [
      [2.6, 1.8, 1.4, 1.2, 0.9, 0.9, 0.9, 0.8, 0.8, 1.3],
      [1, 1.4, 2.4, 1.6, 1.6, 1.2, 0.9, 0.9, 2, 1.4, 1.6],
    ],
  };
}

export function buildStaffAttendanceReport(input: StaffReportInput): {
  title: string;
  subtitle: string;
  collegeName?: string;
  sheets: ExportSheet[];
  columnWeights: number[][];
} {
  const detail = buildStaffDetailSheet(input.records, input.range);
  const summary = buildStaffSummarySheet(input.summaries, input.range);
  const registerSheet = buildStaffRegisterSheet(input.register);

  return {
    title: 'Faculty Attendance Report',
    subtitle: `${input.range.label}  ·  ${input.summaries.length} faculty`,
    collegeName: input.collegeName,
    sheets: [summary, registerSheet, detail],
    columnWeights: [
      [3, 2.2, 2.2, 1.2, 1.2, 1.2, ...STAFF_STATUS_ORDER.map(() => 0.9), 1.2],
      [3, 2.2, ...input.register.dates.map(() => 0.55), 0.8],
      [1, 1.6, 2.4, 1.8, 1.8, 1.4, 0.9, 0.9, 0.7, 2.4, 1],
    ],
  };
}
