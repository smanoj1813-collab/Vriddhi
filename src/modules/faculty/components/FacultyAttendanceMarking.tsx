// ============================================================
// VRIDDHI - Faculty Attendance Marking
// ============================================================
// Faculty marks attendance for a class session
// Data saved to: attendanceRecords + attendanceSummary
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, getDocs, doc, setDoc, writeBatch, Timestamp
} from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import type { AttendanceStatus, Student } from '../../../modules/faculty/types/attendance';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'Present', label: 'Present', color: '#22c55e' },
  { value: 'Absent', label: 'Absent', color: '#ef4444' },
  { value: 'Late', label: 'Late', color: '#f59e0b' },
  { value: 'Leave', label: 'Leave', color: '#3b82f6' },
  { value: 'OnDuty', label: 'On Duty', color: '#8b5cf6' },
  { value: 'MedicalLeave', label: 'Medical', color: '#06b6d4' },
];

interface FacultyAttendanceMarkingProps {
  collegeId: string;
  facultyId: string;
  facultyName: string;
}

export function FacultyAttendanceMarking({ collegeId, facultyId, facultyName }: FacultyAttendanceMarkingProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Session config
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [branch, setBranch] = useState('BCom');
  const [batch, setBatch] = useState('2024');
  const [division, setDivision] = useState('A');
  const [room, setRoom] = useState('101');
  const [timeSlot, setTimeSlot] = useState('09:00-10:30');

  // Students
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  // Load students for selected branch/batch/division
  const loadStudents = useCallback(async () => {
    if (!collegeId) return;
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'students'),
        where('collegeId', '==', collegeId),
        where('branch', '==', branch),
        where('batch', '==', batch),
        where('division', '==', division)
      );
      const snap = await getDocs(q);

      const loadedStudents: Student[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || 'Unknown',
          usn: data.usn || data.regNo || d.id,
          regNo: data.regNo || data.usn || d.id,
          branch: data.branch || branch,
          batch: data.batch || batch,
          division: data.division || division,
          semester: data.semester || 1,
          avatar: data.avatar,
        };
      });

      loadedStudents.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(loadedStudents);

      const initialMap: Record<string, AttendanceStatus> = {};
      loadedStudents.forEach(s => { initialMap[s.id] = 'Present'; });
      setAttendanceMap(initialMap);

    } catch (err: any) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [collegeId, branch, batch, division]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setNotesMap(prev => ({ ...prev, [studentId]: notes }));
  };

  const markAll = (status: AttendanceStatus) => {
    const newMap: Record<string, AttendanceStatus> = {};
    students.forEach(s => { newMap[s.id] = status; });
    setAttendanceMap(newMap);
  };

  const handleSave = async () => {
    if (!subject || !subjectCode) {
      setError('Please enter subject and subject code');
      return;
    }
    if (students.length === 0) {
      setError('No students to mark attendance for');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const sessionId = `sess_${date}_${branch}_${batch}_${division}_${subjectCode}`;
      const batch_write = writeBatch(db);

      let present = 0, absent = 0, late = 0, leave = 0, onDuty = 0, medicalLeave = 0;

      for (const student of students) {
        const status = attendanceMap[student.id] || 'Present';
        const recordId = `att_${date}_${student.id}_${sessionId}`;
        const recordRef = doc(db, 'attendanceRecords', recordId);

        batch_write.set(recordRef, {
          collegeId,
          studentId: student.id,
          studentName: student.name,
          sessionId,
          date,
          subject,
          subjectCode,
          status,
          checkInTime: status === 'Present' || status === 'Late' ? new Date().toTimeString().substring(0, 5) : null,
          notes: notesMap[student.id] || '',
          markedBy: facultyId,
          markedAt: new Date().toISOString(),
          branch,
          batch,
          division,
          usn: student.usn,
          regNo: student.regNo,
          createdAt: Timestamp.now(),
        });

        if (status === 'Present') present++;
        else if (status === 'Absent') absent++;
        else if (status === 'Late') late++;
        else if (status === 'Leave') leave++;
        else if (status === 'OnDuty') onDuty++;
        else if (status === 'MedicalLeave') medicalLeave++;
      }

      await batch_write.commit();

      const total = students.length;
      const summaryId = `sum_${date}_${branch}_${batch}_${division}`;
      const summaryRef = doc(db, 'attendanceSummary', summaryId);
      await setDoc(summaryRef, {
        collegeId,
        date,
        branch,
        batch,
        division,
        subject,
        subjectCode,
        total,
        present,
        absent,
        late,
        leave,
        onDuty,
        medicalLeave,
        percentage: Math.round((present / total) * 100),
        sessions: 1,
        facultyId,
        facultyName,
        createdAt: Timestamp.now(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'Absent').length;
  const lateCount = Object.values(attendanceMap).filter(s => s === 'Late').length;
  const leaveCount = Object.values(attendanceMap).filter(s => s === 'Leave').length;

  return (
    <div className="page-container">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title mb-1">Mark Attendance</h1>
          <p className="text-vriddhi-muted">Record attendance for your class session</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => markAll('Present')} className="btn-secondary text-sm">All Present</button>
          <button onClick={() => markAll('Absent')} className="btn-secondary text-sm">All Absent</button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
          Attendance saved successfully!
        </div>
      )}

      {/* Session Config */}
      <div className="glass-card p-4 mb-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-vriddhi-muted block mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="text-xs text-vriddhi-muted block mb-1">Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics" className="input-field w-full" />
          </div>
          <div>
            <label className="text-xs text-vriddhi-muted block mb-1">Code</label>
            <input type="text" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="MAT101" className="input-field w-full" />
          </div>
          <div>
            <label className="text-xs text-vriddhi-muted block mb-1">Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)} className="input-field w-full">
              {['BCom', 'BA', 'BSc', 'BBA', 'BCA'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-vriddhi-muted block mb-1">Batch</label>
            <select value={batch} onChange={e => setBatch(e.target.value)} className="input-field w-full">
              {['2022', '2023', '2024', '2025'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-vriddhi-muted block mb-1">Division</label>
            <select value={division} onChange={e => setDivision(e.target.value)} className="input-field w-full">
              {['A', 'B', 'C'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="stat-card">
          <div className="text-xs text-vriddhi-muted">Total Students</div>
          <div className="text-2xl font-bold text-white">{students.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-green-400">Present</div>
          <div className="text-2xl font-bold text-green-400">{presentCount}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-red-400">Absent</div>
          <div className="text-2xl font-bold text-red-400">{absentCount}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-amber-400">Late</div>
          <div className="text-2xl font-bold text-amber-400">{lateCount}</div>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-vriddhi-muted">
          No students found for {branch} - Batch {batch} - Division {division}
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student, idx) => {
            const status = attendanceMap[student.id] || 'Present';
            return (
              <div key={student.id} className="glass-card p-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-vriddhi-accent/20 flex items-center justify-center text-vriddhi-accent font-bold text-sm flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{student.name}</div>
                  <div className="text-xs text-vriddhi-muted">{student.usn} | {student.regNo}</div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {STATUS_OPTIONS.map(opt => {
                    const isActive = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(student.id, opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'ring-2 ring-offset-1 ring-offset-slate-900'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: isActive ? `${opt.color}20` : 'transparent',
                          color: opt.color,
                          border: `1px solid ${isActive ? opt.color : 'transparent'}`,
                          boxShadow: isActive ? `0 0 0 2px ${opt.color}` : 'none',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={notesMap[student.id] || ''}
                  onChange={e => handleNotesChange(student.id, e.target.value)}
                  className="input-field w-32 text-sm hidden md:block"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Save Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleSave}
          disabled={saving || students.length === 0}
          className="btn-primary flex items-center gap-2 shadow-lg"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Saving...
            </>
          ) : (
            <>Save Attendance</>
          )}
        </button>
      </div>
    </div>
  );
}

export default FacultyAttendanceMarking;