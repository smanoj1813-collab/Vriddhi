// Fixture-backed stand-in for the Firestore layer. Uses the SAME record shape
// src/shared/api/staffAttendanceApi.ts produces, so the components exercise
// their real mapping/aggregation paths against realistic data.
export const calls: string[] = [];

const ROSTER = [
  { id: 'faculty-1', name: 'Bala Kumar', department: 'Science', designation: 'Professor' },
  { id: 'faculty-2', name: 'Anitha Rao', department: 'Science', designation: 'Lecturer' },
  { id: 'faculty-3', name: 'Suresh Menon', department: 'Commerce', designation: 'Asst. Professor' },
];

function rec(facultyId: string, date: string, status: string, checkIn = '09:00', checkOut = '17:00') {
  const f = ROSTER.find((r) => r.id === facultyId)!;
  return {
    id: `college-a__${facultyId}__${date}`,
    collegeId: 'college-a',
    facultyId,
    facultyName: f.name,
    department: f.department,
    designation: f.designation,
    date,
    status: status as any,
    checkIn,
    checkOut,
    hoursWorked: status === 'halfday' ? 4 : 8,
    note: '',
    markedAt: new Date().toISOString(),
    source: 'self' as const,
    markedBy: facultyId,
  };
}

const RECORDS = [
  rec('faculty-1', '2026-09-01', 'present'),
  rec('faculty-1', '2026-09-02', 'late', '09:40', '17:30'),
  rec('faculty-1', '2026-09-03', 'halfday', '09:00', '13:00'),
  rec('faculty-2', '2026-09-01', 'present'),
  rec('faculty-2', '2026-09-02', 'leave', '', ''),
  rec('faculty-3', '2026-09-01', 'absent', '', ''),
  rec('faculty-3', '2026-09-03', 'present'),
];

function inRange(start: string, end: string) {
  return RECORDS.filter((r) => r.date >= start && r.date <= end);
}

export async function fetchCollegeStaffAttendance(_collegeId: string, start: string, end: string) {
  calls.push(`fetchCollegeStaffAttendance(${start}..${end})`);
  return inRange(start, end);
}
export async function fetchCollegeStaffAttendanceByMonth(_collegeId: string, month: string) {
  calls.push(`fetchCollegeStaffAttendanceByMonth(${month})`);
  return RECORDS.filter((r) => r.date.startsWith(month));
}
export async function fetchMyStaffAttendance(facultyId: string, start: string, end: string) {
  calls.push(`fetchMyStaffAttendance(${facultyId},${start}..${end})`);
  return inRange(start, end).filter((r) => r.facultyId === facultyId);
}
export async function fetchStaffAttendanceForDate(_c: string, facultyId: string, date: string) {
  calls.push(`fetchStaffAttendanceForDate(${facultyId},${date})`);
  return RECORDS.find((r) => r.facultyId === facultyId && r.date === date) ?? null;
}
export async function fetchStaffRoster(_collegeId: string) {
  calls.push('fetchStaffRoster');
  return ROSTER;
}
export async function saveStaffAttendance(p: any) {
  calls.push(`saveStaffAttendance(${p.facultyId},${p.date},${p.status})`);
  return `college-a__${p.facultyId}__${p.date}`;
}
export function staffAttendanceDocId(c: string, f: string, d: string) { return `${c}__${f}__${d}`; }
export function mapStaffAttendanceDoc() { return null; }
export function todayDateKey() { return new Date().toISOString().slice(0, 10); }
export const STAFF_ATTENDANCE_COLLECTION = 'staffAttendance';
