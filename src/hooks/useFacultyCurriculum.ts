import { useState, useEffect } from "react";
import type { FacultyCurriculumView } from "../types/curriculum";

export function useFacultyCurriculum(facultyId?: string) {
  const [curricula, setCurricula] = useState<FacultyCurriculumView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurricula([]);
    setLoading(false);
    setError(null);
  }, [facultyId]);

  return { curricula, loading, error, refetch: () => {} };
}

export function useCurriculumById(curriculumId?: string) {
  const [curriculum, setCurriculum] = useState<FacultyCurriculumView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurriculum(null);
    setLoading(false);
    setError(null);
  }, [curriculumId]);

  return { curriculum, loading, error };
}
