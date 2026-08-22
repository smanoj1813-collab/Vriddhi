// Backward-compatible route component.
// Attendance marking now has one canonical implementation so /faculty/attendance
// and /faculty/attendance-marking cannot write incompatible Firestore shapes.
import FacultyAttendance from '../pages/FacultyAttendance';

interface FacultyAttendanceMarkingProps {
  collegeId?: string;
  facultyId?: string;
  facultyName?: string;
}

export function FacultyAttendanceMarking(_props: FacultyAttendanceMarkingProps) {
  return <FacultyAttendance />;
}

export default FacultyAttendanceMarking;
