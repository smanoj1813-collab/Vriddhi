// src/modules/student/hooks/useStudentProfile.ts
// ------------------------------------------------------------------
// Fetches the student's Firestore profile document through
// resolveStudentRecord(), which reads only documents the signed-in uid is
// allowed to `get` (users/{uid} -> students/{studentDocId}). Queries are used
// last and only as a legacy fallback, because the rules cannot authorise a
// LIST for a student.
// ------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { resolveStudentRecord } from '../services/studentRecordResolver';

export interface FirestoreStudentProfile {
  id: string;
  userId?: string;
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  regNo?: string;
  registrationNumber?: string;
  rollNumber?: string;
  branch?: string;
  department?: string;
  course?: string;
  batch?: string;
  academicYear?: string;
  semester?: number;
  division?: string;
  section?: string;
  collegeId?: string;
  mentor?: string;
  cgpa?: number;
  [key: string]: unknown;
}

export interface UseStudentProfileReturn {
  profile: FirestoreStudentProfile | null;
  loading: boolean;
  error: string | undefined;
  refresh: () => void;
}

export function useStudentProfile(studentId?: string): UseStudentProfileReturn {
  const { user } = useAuth();
  const uid = studentId || user?.uid;
  const email = user?.email || undefined;
  const [state, setState] = useState<{
    owner: string | undefined;
    profile: FirestoreStudentProfile | null;
    loading: boolean;
    error?: string;
  }>({ owner: uid, profile: null, loading: true });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!uid) {
      setState({ owner: uid, profile: null, loading: false });
      return;
    }
    setState({ owner: uid, profile: null, loading: true });
    const load = async () => {
      try {
        const { record, permissionDenied, errors } = await resolveStudentRecord(uid, email);
        if (cancelled) return;
        if (record) {
          setState({ owner: uid, profile: { id: record.id, ...(record.data as Record<string, unknown>) } as FirestoreStudentProfile, loading: false });
        } else if (permissionDenied) {
          console.error('[useStudentProfile] reads denied by Firestore rules', errors);
          setState({ owner: uid, profile: null, loading: false, error:
            'The app could not read your student record because access was denied by Firestore security rules. ' +
            'Sign out and back in to refresh your role claim; if it persists, contact your administrator to check the deployed rules.' });
        } else {
          setState({ owner: uid, profile: null, loading: false, error: 'Your account is not linked to a student profile. Contact your college administrator.' });
        }
      } catch (error) {
        if (!cancelled) setState({ owner: uid, profile: null, loading: false, error: error instanceof Error ? error.message : 'Failed to load student profile' });
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [uid, email, refreshKey]);

  const refresh = useCallback(() => setRefreshKey(key => key + 1), []);
  // Hide the old account synchronously, before the new account's effect runs.
  return state.owner === uid
    ? { profile: state.profile, loading: state.loading, error: state.error, refresh }
    : { profile: null, loading: !!uid, error: undefined, refresh };
}

export default useStudentProfile;
