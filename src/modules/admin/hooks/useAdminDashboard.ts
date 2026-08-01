// src/hooks/useAdminDashboard.ts
// Hook to fetch real college data for Principal/Admin dashboard

import { useState, useEffect } from 'react';
import { db } from '@/Firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';

export interface DashboardDepartment {
  id: string;
  name: string;
  code: string;
  hod: string;
  facultyCount: number;
  studentCount: number;
  avgAttendance: number;
  avgScore: number;
  courses: number;
}

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  lastActive: string;
}

export interface AdminDashboardData {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  totalHODs: number;
  totalMentors: number;
  departments: DashboardDepartment[];
  users: DashboardUser[];
  loading: boolean;
  error: string | null;
}

export function useAdminDashboardData(collegeId: string | undefined): AdminDashboardData {
  const [data, setData] = useState<AdminDashboardData>({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalAdmins: 0,
    totalHODs: 0,
    totalMentors: 0,
    departments: [],
    users: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!collegeId) {
      setData(prev => ({ ...prev, loading: false, error: 'No college ID found' }));
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        // Fetch all collections in parallel
        const [studentsSnap, facultySnap, adminsSnap] = await Promise.all([
          getDocs(query(collection(db, 'students'), where('collegeId', '==', collegeId))),
          getDocs(query(collection(db, 'faculty'), where('collegeId', '==', collegeId))),
          getDocs(query(collection(db, 'admins'), where('collegeId', '==', collegeId))),
        ]);

        if (cancelled) return;

        const students = studentsSnap.docs.map(d => d.data());
        const faculty = facultySnap.docs.map(d => d.data());
        const admins = adminsSnap.docs.map(d => d.data());

        const totalStudents = students.length;
        const totalFaculty = faculty.length;
        const totalAdmins = admins.length;
        const totalHODs = admins.filter(a => a.role === 'hod').length;
        const totalMentors = admins.filter(a => a.role === 'mentor').length;

        // Build departments from faculty departments + student departments
        const deptMap: Record<string, { name: string; code: string; faculty: Set<string>; students: number; hodName: string }> = {};

        faculty.forEach(f => {
          const dept = f.department || 'General';
          if (!deptMap[dept]) {
            deptMap[dept] = { name: dept, code: dept, faculty: new Set(), students: 0, hodName: '' };
          }
          deptMap[dept].faculty.add(f.email || f.facultyId);
          if (f.isHOD) {
            deptMap[dept].hodName = `${f.firstName || ''} ${f.lastName || ''}`.trim();
          }
        });

        students.forEach(s => {
          const dept = s.department || s.division || 'General';
          if (!deptMap[dept]) {
            deptMap[dept] = { name: dept, code: dept, faculty: new Set(), students: 0, hodName: '' };
          }
          deptMap[dept].students++;
        });

        const departments: DashboardDepartment[] = Object.entries(deptMap).map(([code, info], idx) => ({
          id: String(idx + 1),
          name: info.name,
          code,
          hod: info.hodName || 'TBD',
          facultyCount: info.faculty.size,
          studentCount: info.students,
          avgAttendance: 0,
          avgScore: 0,
          courses: 0,
        }));

        // Build users list for User Management tab
        const users: DashboardUser[] = [
          ...admins.map((a, i) => ({
            id: a.uid || `admin-${i}`,
            name: a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim(),
            email: a.email,
            role: a.role,
            department: a.department || 'All',
            status: a.status || 'active',
            lastActive: 'Recently',
          })),
          ...faculty.map((f, i) => ({
            id: f.uid || `faculty-${i}`,
            name: `${f.firstName || ''} ${f.lastName || ''}`.trim(),
            email: f.email,
            role: 'faculty',
            department: f.department || 'General',
            status: f.status || 'active',
            lastActive: 'Recently',
          })),
        ];

        if (!cancelled) {
          setData({
            totalUsers: totalStudents + totalFaculty + totalAdmins,
            totalStudents,
            totalFaculty,
            totalAdmins,
            totalHODs,
            totalMentors,
            departments,
            users,
            loading: false,
            error: null,
          });
        }
      } catch (err: any) {
        console.error('AdminDashboard fetch error:', err);
        if (!cancelled) {
          setData(prev => ({ ...prev, loading: false, error: err.message }));
        }
      }
    }

    fetchData();

    return () => { cancelled = true; };
  }, [collegeId]);

  return data;
}