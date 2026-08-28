// src/modules/faculty/hooks/useAttendanceExport.ts
// Attendance Export Hook with Date Range Support

import { useState, useCallback, useMemo } from 'react';
import type { FacultyExportRow, ExportFormat } from '../types/attendance';

export { type FacultyExportRow, type ExportFormat } from '../types/attendance';

export interface AdminExportRow {
  date: string;
  studentName: string;
  usn?: string;
  regNo: string;
  branch: string;
  batch: string;
  division: string;
  subject: string;
  status: string;
  markedBy: string;
  semester?: number;
  section?: string;
  timeSlot?: string;
  room?: string;
}

// ─── Date Range Types ──────────────────────────────────────────────────────────

export type DateRangeType = 'day' | 'week' | 'month' | 'quarter' | 'custom';

export interface DateRange {
  type: DateRangeType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;     // Display label
}

// ─── Date Range Helpers ───────────────────────────────────────────────────────

/**
 * Get the start of week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the start of month for a given date
 */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the start of quarter for a given date
 */
function getQuarterStart(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate date range for a given type
 */
export function getDateRange(type: DateRangeType, referenceDate?: Date): DateRange {
  const ref = referenceDate || new Date();
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  
  switch (type) {
    case 'day': {
      return {
        type,
        startDate: formatDate(today),
        endDate: formatDate(today),
        label: `Day: ${formatDate(today)}`,
      };
    }
    
    case 'week': {
      const weekStart = getWeekStart(today);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return {
        type,
        startDate: formatDate(weekStart),
        endDate: formatDate(weekEnd),
        label: `Week: ${formatDate(weekStart)} to ${formatDate(weekEnd)}`,
      };
    }
    
    case 'month': {
      const monthStart = getMonthStart(today);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        type,
        startDate: formatDate(monthStart),
        endDate: formatDate(monthEnd),
        label: `Month: ${monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      };
    }
    
    case 'quarter': {
      const quarterStart = getQuarterStart(today);
      const quarterEnd = new Date(quarterStart);
      quarterEnd.setMonth(quarterEnd.getMonth() + 3);
      quarterEnd.setDate(0); // Last day of quarter end month
      const quarterNum = Math.floor(quarterStart.getMonth() / 3) + 1;
      return {
        type,
        startDate: formatDate(quarterStart),
        endDate: formatDate(quarterEnd),
        label: `Q${quarterNum}: ${quarterStart.getFullYear()}`,
      };
    }
    
    default:
      return {
        type,
        startDate: formatDate(today),
        endDate: formatDate(today),
        label: `Day: ${formatDate(today)}`,
      };
  }
}

/**
 * Get all dates in a range
 */
export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Get week number within a year
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// ─── Export Hook ───────────────────────────────────────────────────────────────

export function useAttendanceExport() {
  const [exporting, setExporting] = useState(false);
  const [selectedRangeType, setSelectedRangeType] = useState<DateRangeType>('day');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Get current date range based on selection
  const currentRange = useMemo((): DateRange => {
    if (selectedRangeType === 'custom') {
      return {
        type: 'custom',
        startDate: customStartDate || formatDate(new Date()),
        endDate: customEndDate || formatDate(new Date()),
        label: `Custom: ${customStartDate || '...'} to ${customEndDate || '...'}`,
      };
    }
    return getDateRange(selectedRangeType);
  }, [selectedRangeType, customStartDate, customEndDate]);

  const generateCSV = useCallback((rows: Record<string, string | undefined>[], headers: string[]): string => {
    const escapeCSV = (val: string | undefined) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `\"${str.replace(/"/g, '""')}\"`;
      }
      return str;
    };

    return [
      headers.join(','),
      ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(',')),
    ].join('\n');
  }, []);

  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const exportFacultyAttendance = useCallback(async (
    format: ExportFormat,
    rows: FacultyExportRow[],
    subject: string,
    date: string
  ) => {
    if (rows.length === 0) return;

    setExporting(true);
    try {
      const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `attendance_${safeSubject}_${date}`;

      const headers = [
        'Date', 'Time Slot', 'Subject', 'Subject Code', 'Branch', 'Batch',
        'Division', 'Section', 'Room', 'Student Name', 'USN', 'Reg No',
        'Status', 'Notes', 'Marked By'
      ];

      const csvRows = rows.map(row => ({
        Date: row.date,
        'Time Slot': row.timeSlot,
        Subject: row.subject,
        'Subject Code': row.subjectCode,
        Branch: row.branch,
        Batch: row.batch,
        Division: row.division,
        Section: row.section,
        Room: row.room,
        'Student Name': row.studentName,
        USN: row.usn,
        'Reg No': row.regNo,
        Status: row.status,
        Notes: row.notes,
        'Marked By': row.markedBy,
      }));

      if (format === 'csv') {
        const csv = generateCSV(csvRows, headers);
        downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
      } else {
        const csv = generateCSV(csvRows, headers);
        const bom = '\uFEFF';
        downloadFile(bom + csv, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    } finally {
      setExporting(false);
    }
  }, [generateCSV, downloadFile]);

  const exportAdminAttendance = useCallback(async (
    format: ExportFormat,
    rows: AdminExportRow[],
    dateStr: string,
    branchFilter?: string,
    batchFilter?: string
  ) => {
    if (rows.length === 0) return;

    setExporting(true);
    try {
      const branchPart = branchFilter && branchFilter !== 'all' ? `_${branchFilter}` : '';
      const batchPart = batchFilter && batchFilter !== 'all' ? `_${batchFilter}` : '';
      const filename = `attendance_${dateStr}${branchPart}${batchPart}`;

      const headers = [
        'Date', 'Student Name', 'USN', 'Reg No', 'Branch', 'Batch',
        'Division', 'Subject', 'Status', 'Marked By'
      ];

      const csvRows = rows.map(row => ({
        Date: row.date,
        'Student Name': row.studentName,
        USN: row.usn || '',
        'Reg No': row.regNo,
        Branch: row.branch,
        Batch: row.batch,
        Division: row.division,
        Subject: row.subject,
        Status: row.status,
        'Marked By': row.markedBy,
      }));

      if (format === 'csv') {
        const csv = generateCSV(csvRows, headers);
        downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
      } else {
        const csv = generateCSV(csvRows, headers);
        const bom = '\uFEFF';
        downloadFile(bom + csv, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    } finally {
      setExporting(false);
    }
  }, [generateCSV, downloadFile]);

  // ─── New: Export with Date Range (for reports) ─────────────────────────────
  
  const exportAttendanceReport = useCallback(async (
    format: ExportFormat,
    rows: AdminExportRow[],
    range: DateRange,
    branchFilter?: string,
    batchFilter?: string,
    subjectFilter?: string
  ) => {
    if (rows.length === 0) return;

    setExporting(true);
    try {
      const safeRangeLabel = range.label.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      const branchPart = branchFilter && branchFilter !== 'all' ? `_${branchFilter}` : '';
      const batchPart = batchFilter && batchFilter !== 'all' ? `_${batchFilter}` : '';
      const subjectPart = subjectFilter ? `_${subjectFilter.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `attendance_report${subjectPart}${branchPart}${batchPart}_${safeRangeLabel}`;

      // Extended headers for detailed reports
      const headers = [
        'Date', 'Day', 'Time Slot', 'Student Name', 'USN/Reg No', 'Branch', 
        'Batch', 'Division', 'Section', 'Subject', 'Room', 'Status', 'Marked By'
      ];

      const csvRows = rows.map(row => {
        const dateObj = new Date(row.date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        
        return {
          Date: row.date,
          'Day': dayName,
          'Time Slot': row.timeSlot || '',
          'Student Name': row.studentName,
          'USN/Reg No': row.usn || row.regNo,
          Branch: row.branch,
          Batch: row.batch,
          Division: row.division,
          Section: row.section || '',
          Subject: row.subject,
          Room: row.room || '',
          Status: row.status,
          'Marked By': row.markedBy,
        };
      });

      // Sort by date, then by student name
      csvRows.sort((a, b) => {
        const dateCompare = a.Date.localeCompare(b.Date);
        if (dateCompare !== 0) return dateCompare;
        return a['Student Name'].localeCompare(b['Student Name']);
      });

      if (format === 'csv') {
        const csv = generateCSV(csvRows, headers);
        downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
      } else {
        const csv = generateCSV(csvRows, headers);
        const bom = '\uFEFF';
        downloadFile(bom + csv, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    } finally {
      setExporting(false);
    }
  }, [generateCSV, downloadFile]);

  // ─── Summary Report Export ──────────────────────────────────────────────────
  
  const exportAttendanceSummary = useCallback(async (
    format: ExportFormat,
    summaryData: Array<{
      studentName: string;
      regNo: string;
      usn?: string;
      branch: string;
      batch: string;
      division: string;
      totalClasses: number;
      present: number;
      absent: number;
      late: number;
      percentage: number;
    }>,
    range: DateRange,
    branchFilter?: string,
    batchFilter?: string
  ) => {
    if (summaryData.length === 0) return;

    setExporting(true);
    try {
      const safeRangeLabel = range.label.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      const branchPart = branchFilter && branchFilter !== 'all' ? `_${branchFilter}` : '';
      const batchPart = batchFilter && batchFilter !== 'all' ? `_${batchFilter}` : '';
      const filename = `attendance_summary${branchPart}${batchPart}_${safeRangeLabel}`;

      const headers = [
        'Student Name', 'USN/Reg No', 'Branch', 'Batch', 'Division',
        'Total Classes', 'Present', 'Absent', 'Late', 'Attendance %'
      ];

      const csvRows = summaryData.map(row => ({
        'Student Name': row.studentName,
        'USN/Reg No': row.usn || row.regNo,
        Branch: row.branch,
        Batch: row.batch,
        Division: row.division,
        'Total Classes': String(row.totalClasses),
        'Present': String(row.present),
        'Absent': String(row.absent),
        'Late': String(row.late),
        'Attendance %': String(row.percentage.toFixed(1)),
      }));

      // Sort by attendance percentage (lowest first to highlight issues)
      csvRows.sort((a, b) => {
        const percA = parseFloat(a['Attendance %']) || 0;
        const percB = parseFloat(b['Attendance %']) || 0;
        return percA - percB;
      });

      if (format === 'csv') {
        const csv = generateCSV(csvRows, headers);
        downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
      } else {
        const csv = generateCSV(csvRows, headers);
        const bom = '\uFEFF';
        downloadFile(bom + csv, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    } finally {
      setExporting(false);
    }
  }, [generateCSV, downloadFile]);

  return {
    // Existing exports
    exportFacultyAttendance,
    exportAdminAttendance,
    exporting,
    
    // New: Date range support
    selectedRangeType,
    setSelectedRangeType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    currentRange,
    
    // New: Report exports
    exportAttendanceReport,
    exportAttendanceSummary,
    
    // Helpers
    getDateRange,
    getDatesInRange,
  };
}
