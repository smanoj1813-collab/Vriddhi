// src/modules/student/hooks/useStudentProfile.ts
// ------------------------------------------------------------------
// Fetches the student's Firestore profile document.
// Resolves the canonical `userId` ownership field first, then legacy UID forms.
// ------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, query, collection, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { useAuth } from '../../auth/context/AuthContext';

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
      // 1) Canonical lookup. Provisioning creates a generated domain document
      // ID and links it to Firebase Auth through `userId`.
      const userIdSnap = await getDocs(
        query(collection(db, 'students'), where('userId', '==', uid), limit(1))
      );
      if (!userIdSnap.empty) {
        const d = userIdSnap.docs[0];
        setProfile({ id: d.id, ...(d.data() as Record<string, unknown>) } as FirestoreStudentProfile);
        return;
      }

      // 2) Legacy lookup by document ID.
      const byId = await getDoc(doc(db, 'students', uid));
      if (byId.exists()) {
        setProfile({ id: byId.id, ...(byId.data() as Record<string, unknown>) } as FirestoreStudentProfile);
        return;
      }

      // 3) Legacy lookup by `uid` field. Email is deliberately not used as an
      // ownership key because addresses can change and list rules cannot safely
      // authorize arbitrary email queries.
      const uidSnap = await getDocs(
        query(collection(db, 'students'), where('uid', '==', uid), limit(1))
      );
      if (!uidSnap.empty) {
        const d = uidSnap.docs[0];
        setProfile({ id: d.id, ...(d.data() as Record<string, unknown>) } as FirestoreStudentProfile);
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
