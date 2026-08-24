
import { useState, useCallback, useRef, useEffect } from 'react';
import type { AttendanceStatus, AttendanceRecord, ClassSession, Student } from '../types/attendance';

export interface MarkingState {
  [studentId: string]: {
    status: AttendanceStatus;
    notes: string;
  };
}

interface UseAttendanceMarkingReturn {
  records: AttendanceRecord[];
  selectedIds: Set<string>;
  markStatus: (studentIds: string[], status: AttendanceStatus) => void;
  toggleSelect: (studentId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  markAll: (status: AttendanceStatus) => void;
  undo: () => void;
  allMarked: boolean;
  summary: { present: number; absent: number; late: number; leave: number; onDuty: number; medicalLeave: number; total: number };
  autoSave: boolean;
  setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
  clearDraft: () => void;
}

export function useAttendanceMarking(session: ClassSession): UseAttendanceMarkingReturn {
  // Build records from session.students
  const initialRecords: AttendanceRecord[] = (session.students || []).map((student: Student, index: number) => ({
    id: `temp-${student.id}-${index}`,
    studentId: student.id,
    studentName: student.name,
    sessionId: session.id,
    date: session.date || new Date().toISOString().split('T')[0],
    subject: session.subject,
    subjectCode: session.subjectCode || '',
    status: 'Present' as AttendanceStatus,
    markedBy: session.facultyName || 'Faculty',
    markedAt: new Date().toISOString(),
    branch: student.branch,
    batch: student.batch,
    division: student.division,
    usn: student.usn,
    regNo: student.regNo,
  }));

  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoSave, setAutoSave] = useState(false);
  const historyRef = useRef<AttendanceRecord[][]>([initialRecords]);
  const historyIndexRef = useRef(0);

  // Update records when session changes
  useEffect(() => {
    const newRecords = (session.students || []).map((student: Student, index: number) => ({
      id: `temp-${student.id}-${index}`,
      studentId: student.id,
      studentName: student.name,
      sessionId: session.id,
      date: session.date || new Date().toISOString().split('T')[0],
      subject: session.subject,
      subjectCode: session.subjectCode || '',
      status: 'Present' as AttendanceStatus,
      markedBy: session.facultyName || 'Faculty',
      markedAt: new Date().toISOString(),
      branch: student.branch,
      batch: student.batch,
      division: student.division,
      usn: student.usn,
      regNo: student.regNo,
    }));
    setRecords(newRecords);
    historyRef.current = [newRecords];
    historyIndexRef.current = 0;
    setSelectedIds(new Set());
  }, [session.id]);

  const pushHistory = useCallback((newRecords: AttendanceRecord[]) => {
    // Remove any future history if we're not at the end
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(newRecords);
    historyIndexRef.current++;
  }, []);

  const markStatus = useCallback((studentIds: string[], status: AttendanceStatus) => {
    setRecords(prev => {
      const newRecords = prev.map(r =>
        studentIds.includes(r.studentId) ? { ...r, status } : r
      );
      pushHistory(newRecords);
      return newRecords;
    });
  }, [pushHistory]);

  const toggleSelect = useCallback((studentId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(records.map(r => r.studentId)));
  }, [records]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const markAll = useCallback((status: AttendanceStatus) => {
    setRecords(prev => {
      const newRecords = prev.map(r => ({ ...r, status }));
      pushHistory(newRecords);
      return newRecords;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setRecords(historyRef.current[historyIndexRef.current]);
    }
  }, []);

  const clearDraft = useCallback(() => {
    const reset = initialRecords.map(r => ({ ...r, status: 'Present' as AttendanceStatus }));
    setRecords(reset);
    historyRef.current = [reset];
    historyIndexRef.current = 0;
    setSelectedIds(new Set());
  }, [initialRecords]);

  const allMarked = records.every(r => r.status !== 'Present' || records.length === 0);

  const summary = {
    present: records.filter(r => r.status === 'Present').length,
    absent: records.filter(r => r.status === 'Absent').length,
    late: records.filter(r => r.status === 'Late').length,
    leave: records.filter(r => r.status === 'Leave').length,
    onDuty: records.filter(r => r.status === 'OnDuty').length,
    medicalLeave: records.filter(r => r.status === 'MedicalLeave').length,
    total: records.length,
  };

  return {
    records,
    selectedIds,
    markStatus,
    toggleSelect,
    selectAll,
    deselectAll,
    markAll,
    undo,
    allMarked,
    summary,
    autoSave,
    setAutoSave,
    clearDraft,
  };
}