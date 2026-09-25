// src/modules/admin/api/facultyDirectoryApi.ts
//
// One read of the college's faculty roster (top-level `faculty`, tenant-scoped
// by collegeId) shaped for the finance screens: guest billing and payroll.

import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/Firebase/config'

export interface FacultyDirectoryEntry {
  profileId: string
  uid: string
  staffCode: string
  name: string
  email: string
  gender: string
  department: string
  designation: string
  employmentType: string
  joiningDate: string
  status: string
  guestContract?: { startDate?: string; endDate?: string | null; periodRate?: number; notes?: string } | null
}

export function currentCollegeId(): string {
  return localStorage.getItem('vriddhi_college_id') || ''
}

export async function fetchCollegeFaculty(collegeId: string = currentCollegeId(), includeInactive = false): Promise<FacultyDirectoryEntry[]> {
  if (!collegeId) return []
  const snap = await getDocs(query(collection(db, 'faculty'), where('collegeId', '==', collegeId)))
  const out: FacultyDirectoryEntry[] = []
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>
    const status = String(data.status ?? 'active')
    if (!includeInactive && status === 'inactive') continue
    out.push({
      profileId: d.id,
      uid: String(data.uid ?? ''),
      staffCode: String(data.facultyId ?? data.staffCode ?? data.employeeId ?? ''),
      name:
        String(data.name ?? '').trim() ||
        `${String(data.firstName ?? '').trim()} ${String(data.lastName ?? '').trim()}`.trim() ||
        d.id,
      email: String(data.email ?? ''),
      gender: String(data.gender ?? ''),
      department: String(data.department ?? ''),
      designation: String(data.designation ?? ''),
      employmentType: String(data.employmentType ?? 'FULL_TIME').trim() || 'FULL_TIME',
      joiningDate: String(data.joiningDate ?? data.dateOfJoining ?? ''),
      status,
      guestContract: (data.guestContract as FacultyDirectoryEntry['guestContract']) ?? null,
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}
