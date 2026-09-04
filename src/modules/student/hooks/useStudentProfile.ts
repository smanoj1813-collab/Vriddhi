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
  const [profile, setProfile] = useState<FirestoreStudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const uid = studentId || user?.uid;

  const load = useCallback(async () => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { record, permissionDenied, errors } = await resolveStudentRecord(uid, user?.email || undefined);
      if (record) {
        setProfile({ id: record.id, ...(record.data as Record<string, unknown>) } as FirestoreStudentProfile);
        return;
      }
      // Two different failures, two different messages. Collapsing them into
      // "not linked to a profile" is what made a rules/deployment problem look
      // like a data problem for days.
      if (permissionDenied) {
        console.error('[useStudentProfile] reads denied by Firestore rules', errors);
        setProfile(null);
        setError(
          'The app could not read your student record because access was denied by Firestore security rules. ' +
          'This is a configuration problem, not a missing profile: deploy the current rules and sign out and back in ' +
          'so your role claim is refreshed.'
        );
        return;
      }
      setProfile(null);
      setError('Your account is not linked to a student profile. Contact your college administrator.');
    } catch (err) {
      console.error('[useStudentProfile] Failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return {
    profile,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}

export default useStudentProfile;
