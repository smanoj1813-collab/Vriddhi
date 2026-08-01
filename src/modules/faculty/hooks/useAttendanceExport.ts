
import { useState, useCallback } from 'react';
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
}

export function useAttendanceExport() {
  const [exporting, setExporting] = useState(false);

  const generateCSV = useCallback((rows: Record<string, string | undefined>[], headers: string[]): string => {
    const escapeCSV = (val: string | undefined) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `\"${str.replace(/"/g, '\"')}\"`;
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

  return {
    exportFacultyAttendance,
    exportAdminAttendance,
    exporting,
  };
}