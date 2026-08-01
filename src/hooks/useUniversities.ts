import { useState, useEffect, useCallback } from "react";
import type { University, UniversityCollege, UniversityFilters } from "../shared/types/university";

export function useUniversities(filters?: UniversityFilters) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUniversities([]);
    setLoading(false);
    setError(null);
  }, [filters]);

  return { universities, loading, error, refetch: () => {} };
}

export function useUniversity(id?: string) {
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUniversity(null);
    setLoading(false);
    setError(null);
  }, [id]);

  return { university, loading, error, refetch: () => {} };
}

export function useUniversityColleges(universityId?: string) {
  const [colleges, setColleges] = useState<UniversityCollege[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setColleges([]);
    setLoading(false);
    setError(null);
  }, [universityId]);

  return { colleges, loading, error, refetch: () => {} };
}

export function useUpdateUniversity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutateAsync = useCallback(async (_data: Partial<University> & { id: string }) => {
    setLoading(true);
    try {
      // TODO: wire to actual API
      return { success: true };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutateAsync, loading, error };
}