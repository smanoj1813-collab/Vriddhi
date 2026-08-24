import { useState, useEffect, useCallback } from "react";
import { AttendanceRecord, AttendanceStatus } from "../modules/faculty/types/attendance";

export function useFacultyAttendance(classId?: string, subject?: string, date?: Date) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      setRecords([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  }, [classId, subject, date]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const markAttendance = useCallback(
    async (studentId: string, status: AttendanceStatus, remarks?: string) => {
      console.log(`Marking attendance for ${studentId} as ${status}`);
      return true;
    },
    []
  );

  const bulkMarkAttendance = useCallback(
    async (updates: { studentId: string; status: AttendanceStatus; remarks?: string }[]) => {
      console.log(`Bulk marking ${updates.length} attendance records`);
      return true;
    },
    []
  );

  return { records, loading, error, refetch: fetchRecords, markAttendance, bulkMarkAttendance };
}
