// Re-export from shared types for admin module compatibility
// (src/types/university.ts and src/shared/types/university.ts have overlapping exports)
export * from '@/shared/types/university';
// src/modules/admin/types/university.ts — APPEND to existing

export interface ListUniversitiesOptions {
  search?: string
  state?: string
  type?: string
  status?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateUniversityInput {
  name: string
  code: string
  state: string
  city: string
  type: 'state' | 'deemed' | 'private' | 'central'
  establishedYear?: number
  website?: string
  email?: string
  phone?: string
  address?: string
  status?: 'active' | 'inactive'
}

export interface UpdateUniversityInput {
  id: string
  name?: string
  code?: string
  state?: string
  city?: string
  type?: 'state' | 'deemed' | 'private' | 'central'
  establishedYear?: number
  website?: string
  email?: string
  phone?: string
  address?: string
  status?: 'active' | 'inactive'
}

export interface UpdateCollegeClassificationInput {
  collegeId: string
  universityId: string
  affiliationType: 'autonomous' | 'affiliated' | 'constituent'
  accreditation?: string
  naacGrade?: string
  nbaAccredited?: boolean
}

export interface UniversityStats {
  totalUniversities: number
  totalColleges: number
  totalStudents: number
  totalFaculty: number
  byState: Record<string, number>
  byType: Record<string, number>
}

export interface UniversityRolloutProgress {
  universityId: string
  universityName: string
  totalColleges: number
  onboardedColleges: number
  pendingColleges: number
  percentage: number
  lastUpdated: string
}