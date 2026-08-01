import { useState, useCallback } from "react";
import { FacultyExportRow } from "../modules/faculty/types/attendance";

export function useAttendanceExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const exportToCSV = useCallback((data: FacultyExportRow[], filename?: string) => {
    setExporting(true);
    try {
      const headers = [
        "Date", "Time Slot", "Subject", "Subject Code", "Branch", "Batch",
        "Division", "Section", "Room", "Student Name", "USN", "Reg No",
        "Status", "Notes", "Marked By",
      ];
      const rows = data.map((row) => [
        row.date,
        row.timeSlot,
        row.subject,
        row.subjectCode,
        row.branch,
        row.batch,
        row.division,
        row.section,
        row.room,
        row.studentName,
        row.usn,
        row.regNo,
        row.status,
        row.notes,
        row.markedBy,
      ]);
      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename || "attendance"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, []);

  const exportToPDF = useCallback((data: FacultyExportRow[], filename?: string) => {
    setExporting(true);
    try {
      console.log(`PDF export stub: ${data.length} rows`);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, error, exportToCSV, exportToPDF };
}
