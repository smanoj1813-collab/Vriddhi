// src/hooks/useCollegeStudents.ts
// Hook to fetch students for a specific college

import { useState, useEffect } from 'react';
import { db } from '../../../Firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface CollegeStudent {
  id: string;
  name: string;
  regNo: string;
  email: string;
  phone?: string;
  department: string;
  batch: string;
  year: string;
  section: string;
  attendance: number;
  avgScore: number;
  status: 'active' | 'inactive' | 'probation';
  mentor: string;
  address?: string;
  dob?: string;
  guardianName?: string;
  guardianPhone?: string;
  feesPaid: boolean;
  lastActive: string;
  collegeId: string;
}

export interface UseCollegeStudentsReturn {
  students: CollegeStudent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCollegeStudents(collegeId: string | undefined): UseCollegeStudentsReturn {
  const [students, setStudents] = useState<CollegeStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!collegeId) {
      setLoading(false);
      setError('No college ID provided');
      return;
    }

    let cancelled = false;

    async function fetchStudents() {
      setLoading(true);
      setError(null);

      try {
        const q = query(
          collection(db, 'students'),
          where('collegeId', '==', collegeId)
        );
        const snap = await getDocs(q);

        if (cancelled) return;

        const data = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || '',
            regNo: d.regNo || d.registrationNumber || d.enrollmentNumber || '',
            email: d.email || '',
            phone: d.phone || d.mobile || '',
            department: d.department || d.division || d.course || 'General',
            batch: d.batch || d.academicYear || '',
            year: d.year || d.batch || '',
            section: d.section || d.division || '',
            attendance: d.attendance || d.attendancePercentage || 0,
            avgScore: d.avgScore || d.cgpa || d.percentage || 0,
            status: (d.status || 'active') as CollegeStudent['status'],
            mentor: d.mentor || d.mentorName || '',
            address: d.address || '',
            dob: d.dob || d.dateOfBirth || '',
            guardianName: d.guardianName || d.fatherName || d.parentName || '',
            guardianPhone: d.guardianPhone || d.parentPhone || '',
            feesPaid: d.feesPaid || d.feeStatus === 'paid' || false,
            lastActive: d.lastActive || 'Recently',
            collegeId: d.collegeId || collegeId,
          };
        });

        if (!cancelled) {
          setStudents(data);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching students:', err);
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchStudents();

    return () => { cancelled = true; };
  }, [collegeId, refreshKey]);

  const refetch = () => setRefreshKey(k => k + 1);

  return { students, loading, error, refetch };
}
