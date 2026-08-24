// src/modules/student/hooks/useCurrentStudent.ts
// ------------------------------------------------------------------
// Single source of truth for the currently logged-in student.
// Derives identity from the Firebase AuthContext (NOT localStorage).
// ------------------------------------------------------------------
import { useMemo } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from './useStudentProfile';

export interface CurrentStudent {
  /** Firebase Auth uid — also the student document id in most cases. */
  id: string;
  uid: string;
  name: string;
  email: string;
  regNo: string;
  rollNo?: string;
  avatar?: string;
  phone?: string;
  collegeId?: string;
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section: string;
  course?: string;
  mentor?: string;
  cgpa?: number;
}

export interface UseCurrentStudentReturn {
  student: CurrentStudent | null;
  profile: CurrentStudent | null;
  loading: boolean;
  error: string | null;
  /** True once we know for certain there is no student profile. */
  missing: boolean;
  refresh: () => void;
}

/**
 * Resolve the authenticated student's profile. All student pages should
 * use this hook instead of reading `studentToken` from localStorage.
 */
export function useCurrentStudent(): UseCurrentStudentReturn {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const shouldFetch =
    !authLoading &&
    isAuthenticated &&
    !!user &&
    user.role === 'student' &&
    !!user.uid;

  const { profile, loading: profileLoading, error, refresh } = useStudentProfile(
    shouldFetch ? user!.uid : undefined
  );

  const student = useMemo<CurrentStudent | null>(() => {
    if (!user) return null;
    if (!profile) return null;
    return {
      id: profile.id || user.uid,
      uid: user.uid,
      name: profile.name || user.name || user.displayName || 'Student',
      email: profile.email || user.email || '',
      regNo: profile.regNo || profile.rollNumber || '',
      rollNo: profile.rollNumber || profile.regNo,
      avatar: profile.avatar || user.avatar,
      phone: profile.phone || user.phone,
      collegeId: profile.collegeId || user.collegeId,
      branch: profile.branch || profile.department || '',
      batch: profile.batch || '',
      semester: typeof profile.semester === 'number' ? profile.semester : 0,
      division: profile.division || '',
      section: profile.section || profile.division || '',
      course: profile.course,
      mentor: profile.mentor,
      cgpa: profile.cgpa,
    };
  }, [user, profile]);

  return {
    student,
    profile: student,
    loading: authLoading || profileLoading,
    error: error || null,
    missing: !authLoading && isAuthenticated && !profileLoading && !profile,
    refresh,
  };
}

export default useCurrentStudent;
