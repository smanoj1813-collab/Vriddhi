export interface University {
  id: string;
  name: string;
  code?: string;
  location?: string;
  district?: string;
  state?: string;
  country?: string;
  website?: string;
  email?: string;
  phone?: string;
  type?: 'public' | 'private' | 'deemed' | 'autonomous';
  status?: 'active' | 'inactive' | 'pending';
  establishedYear?: number;
  accreditation?: string;
  // SuperAdmin dashboard stats
  onboardedColleges?: number;
  activeColleges?: number;
  totalColleges?: number;
  totalStudents?: number;
  totalFaculty?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UniversityCollege {
  id: string;
  universityId: string;
  name: string;
  code?: string;
  location?: string;
  district?: string;
  status?: 'active' | 'inactive' | 'pending';
  principalName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  courses?: UniversityCourse[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type UniversityCourse = string;

export interface DistrictUniversityMapping {
  district: string;
  universities: string[];
}

export interface UniversityFilters {
  state?: string;
  district?: string;
  type?: string;
  status?: string;
  search?: string;
}