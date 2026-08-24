  // src/modules/admin/api/universityApi.ts
  import type { University, ListUniversitiesOptions } from '@/shared/types/university';

  export const listUniversities = async (options?: ListUniversitiesOptions): Promise<{ data: University[]; total: number }> => {
    console.warn('[STUB] listUniversities called with', options);
    return { data: [], total: 0 };
  };

  export const getUniversityById = async (id: string): Promise<University | null> => {
    console.warn('[STUB] getUniversityById called with', id);
    return null;
  };

  export const createUniversity = async (data: Omit<University, 'id'>): Promise<University> => {
    console.warn('[STUB] createUniversity called');
    return { ...data, id: `uni_${Date.now()}` } as University;
  };

  export const updateUniversity = async (id: string, data: Partial<University>): Promise<University> => {
    console.warn('[STUB] updateUniversity called');
    return { ...data, id } as University;
  };
  export const getUniversityByCodeFromDb = async (code: string): Promise<University | null> => {
  console.warn('[STUB] getUniversityByCodeFromDb', code);
  return null;
};

export const deleteUniversity = async (id: string): Promise<void> => {
  console.warn('[STUB] deleteUniversity', id);
};

export const seedUniversities = async (): Promise<{ seeded: number }> => {
  console.warn('[STUB] seedUniversities');
  return { seeded: 0 };
};

export const getUniversityStats = async (): Promise<unknown> => {
  console.warn('[STUB] getUniversityStats');
  return {};
};

export const getRolloutProgress = async (): Promise<unknown> => {
  console.warn('[STUB] getRolloutProgress');
  return {};
};

export const updateCollegeClassification = async (
  collegeId: string,
  input: unknown
): Promise<void> => {
  console.warn('[STUB] updateCollegeClassification', collegeId, input);
};

export const getCollegesByUniversity = async (universityId: string): Promise<unknown[]> => {
  console.warn('[STUB] getCollegesByUniversity', universityId);
  return [];
};
