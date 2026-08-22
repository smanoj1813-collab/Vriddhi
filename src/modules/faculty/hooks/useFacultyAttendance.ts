import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import {
  fetchFacultyClassSessions,
  fetchStudentsForSession,
  fetchAttendanceForSession,
  saveAttendance,
} from '../api/facultyApi';
import type {
  FacultyClassSession,
  FacultyStudent,
  FacultyAttendanceRecord,
  FacultyAttendanceDoc,
  AttendanceStatus,
} from '../types/attendance';

interface AttendanceState {
  [studentId: string]: {
    status: AttendanceStatus;
    notes: string;
  };
}

function todayLocalISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  onDuty: number;
  medicalLeave: number;
}

export function useFacultyAttendance() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedSessionId = searchParams.get('sessionId');

  const collegeId = (user as any)?.collegeId as string | undefined;
  const facultyId = user?.id;
  const facultyName = user?.name || 'Faculty';

  const [selectedDate, setSelectedDate] = useState(todayLocalISO);
  const [classSessions, setClassSessions] = useState<FacultyClassSession[]>([]);
  const [selectedClass, setSelectedClass] = useState<FacultyClassSession | null>(null);
  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [existingAttendance, setExistingAttendance] = useState<FacultyAttendanceDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ─── Load class sessions ────────────────────────────────
  useEffect(() => {
    if (!facultyId) return;
    const fid = facultyId;
    async function load() {
      setLoading(true);
      try {
        const sessions = await fetchFacultyClassSessions(fid, selectedDate);
        setClassSessions(sessions);

        const preselected = preselectedSessionId
          ? sessions.find((session) => session.id === preselectedSessionId)
          : undefined;
        setSelectedClass(preselected || sessions[0] || null);
        if (sessions.length === 0) {
          setStudents([]);
          setAttendance({});
          setExistingAttendance(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [facultyId, preselectedSessionId, selectedDate]);

  // ─── Load students when class selected ──────────────────
  useEffect(() => {
    if (!selectedClass || !collegeId) return;

    const cls = selectedClass;
    const cid = collegeId;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const studentsData = await fetchStudentsForSession(
          cls.branch,
          cls.batch,
          cls.division,
          cls.semester,
          cls.subject,
          cid
        );
        setStudents(studentsData);

        const existing = await fetchAttendanceForSession(cls.id, cls.date);
        setExistingAttendance(existing);

        if (existing) {
          const existingState: AttendanceState = {};
          existing.records.forEach((r: FacultyAttendanceRecord) => {
            existingState[r.studentId] = {
              status: r.status,
              notes: r.notes || '',
            };
          });
          setAttendance(existingState);
        } else {
          const defaultState: AttendanceState = {};
          studentsData.forEach((s: FacultyStudent) => {
            defaultState[s.id] = { status: 'Present', notes: '' };
          });
          setAttendance(defaultState);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedClass, collegeId]);

  // ─── Stats computation ──────────────────────────────────
  const stats: AttendanceStats = {
    total: students.length,
    present: Object.values(attendance).filter((a) => a.status === 'Present').length,
    absent: Object.values(attendance).filter((a) => a.status === 'Absent').length,
    late: Object.values(attendance).filter((a) => a.status === 'Late').length,
    leave: Object.values(attendance).filter((a) => a.status === 'Leave').length,
    onDuty: Object.values(attendance).filter((a) => a.status === 'OnDuty').length,
    medicalLeave: Object.values(attendance).filter((a) => a.status === 'MedicalLeave').length,
  };

  // ─── Actions ────────────────────────────────────────────
  const updateStudentStatus = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      setAttendance((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], status },
      }));
    },
    []
  );

  const updateStudentNotes = useCallback(
    (studentId: string, notes: string) => {
      setAttendance((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], notes },
      }));
    },
    []
  );

  const setAllStatus = useCallback(
    (status: AttendanceStatus) => {
      setAttendance((prev) => {
        const next: AttendanceState = {};
        students.forEach((s) => {
          next[s.id] = { status, notes: prev[s.id]?.notes || '' };
        });
        return next;
      });
    },
    [students]
  );

  const resetAttendance = useCallback(() => {
    const defaultState: AttendanceState = {};
    students.forEach((s) => {
      defaultState[s.id] = { status: 'Present', notes: '' };
    });
    setAttendance(defaultState);
  }, [students]);

  const handleSave = useCallback(async () => {
    if (!selectedClass || !facultyId || !collegeId) {
      setError('Your faculty account is missing a college assignment.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const records: FacultyAttendanceRecord[] = students.map((s) => ({
        studentId: s.id,
        name: s.name,
        usn: s.usn,
        regNo: s.regNo,
        status: attendance[s.id]?.status || 'Present',
        notes: attendance[s.id]?.notes || '',
      }));

      const attendanceId = await saveAttendance(
        selectedClass,
        records,
        facultyId,
        facultyName,
        collegeId
      );
      setSaveSuccess(true);
      setExistingAttendance({
        id: attendanceId,
        sessionId: selectedClass.id,
        facultyId,
        subject: selectedClass.subject,
        subjectCode: selectedClass.subjectCode,
        branch: selectedClass.branch,
        batch: selectedClass.batch,
        semester: selectedClass.semester,
        division: selectedClass.division,
        section: selectedClass.section,
        room: selectedClass.room,
        timeSlot: selectedClass.timeSlot,
        date: selectedClass.date,
        records,
        presentCount: records.filter((r) => r.status === 'Present').length,
        absentCount: records.filter((r) => r.status === 'Absent').length,
        lateCount: records.filter((r) => r.status === 'Late').length,
        leaveCount: records.filter((r) => r.status === 'Leave').length,
        onDutyCount: records.filter((r) => r.status === 'OnDuty').length,
        medicalLeaveCount: records.filter((r) => r.status === 'MedicalLeave').length,
        totalStudents: records.length,
        markedAt: new Date().toISOString(),
        markedBy: facultyName,
      });

      if (selectedClass.status === 'ongoing') {
        setSelectedClass((prev) =>
          prev ? { ...prev, status: 'completed' as const } : null
        );
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }, [selectedClass, facultyId, facultyName, collegeId, students, attendance]);

  return {
    selectedDate,
    setSelectedDate,
    classSessions,
    selectedClass,
    setSelectedClass,
    students,
    attendance,
    existingAttendance,
    loading,
    saving,
    error,
    saveSuccess,
    stats,
    updateStudentStatus,
    updateStudentNotes,
    setAllStatus,
    resetAttendance,
    handleSave,
  };
}