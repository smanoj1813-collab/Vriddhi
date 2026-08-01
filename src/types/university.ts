// src/shared/types/university.ts

export type ManagementType = 'government' | 'private' | 'aided' | 'autonomous' | 'deemed' | 'Government' | 'Private' | 'Aided' | 'Autonomous' | 'Deemed';
export type PriorityLevel = 1 | 2 | 3 | 4 | 5;
export type UniversityStatus = 'active' | 'inactive' | 'pending' | 'onboarding';
export type CourseCode = "BA" | "B.Com" | "BBA" | "BCA" | "B.Sc" | "BSW" | "BPA" | "B.Voc";

export interface UniversityCourse {
  id: string;
  name: string;
  duration: string;
  type: string;
  specialization?: string;
}

export interface UniversityCollege {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending' | 'onboarding';
  location?: string;
  city?: string;
  district?: string;
  code?: string;
}

export interface University {
  id: string;
  name: string;
  shortName?: string;
  code?: string;
  location: string;
  city?: string;
  district?: string;
  districts?: string[];
  state?: string;
  managementType: ManagementType;
  priority: PriorityLevel;
  status: UniversityStatus;
  courses: CourseCode[];
  colleges?: UniversityCollege[];
  establishedYear?: number;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  accreditation?: string;
  naacGrade?: string;
  nbaAccredited?: boolean;
  totalStudents?: number;
  totalFaculty?: number;
  departments?: string[];
  affiliatedColleges?: number;
  collegeCountMin: number;
  collegeCountMax: number;
  onboardedColleges?: number;
  activeColleges?: number;
  isNewUniversity?: boolean;
  isWomensUniversity?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ListUniversitiesOptions {
  status?: string;
  managementType?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UniversityStats {
  totalUniversities: number;
  onboardedColleges: number;
  activeColleges: number;
  coveragePercentage: number;
}

export interface RolloutItem {
  id: string;
  universityId: string;
  universityName: string;
  priority: number;
  status: string;
  targetDate?: Date | string;
  completedDate?: Date | string;
  notes?: string;
  targetColleges?: number;
  percentageComplete?: number;
  onboardedColleges?: number;
}

export interface DistrictUniversityMapping {
  district: string;
  primaryUniversityId: string;
  primaryUniversityName: string;
  secondaryUniversityId?: string;
  secondaryUniversityName?: string;
  courses: CourseCode[];
  notes?: string;
}

export interface UniversityPriorityConfig {
  universityId: string;
  priority: number;
  reason?: string;
}

export const getPriorityLabel = (priority: number): string => {
  const labels: Record<number, string> = {
    1: 'Critical',
    2: 'High',
    3: 'Medium',
    4: 'Low',
    5: 'Backlog',
  };
  return labels[priority] || 'Unknown';
};

export const getManagementTypeColor = (type: string): string => {
  const normalized = type.toLowerCase();
  const colors: Record<string, string> = {
    government: 'bg-blue-100 text-blue-800',
    private: 'bg-purple-100 text-purple-800',
    aided: 'bg-green-100 text-green-800',
    autonomous: 'bg-orange-100 text-orange-800',
    deemed: 'bg-pink-100 text-pink-800',
  };
  return colors[normalized] || 'bg-gray-100 text-gray-800';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    onboarding: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};