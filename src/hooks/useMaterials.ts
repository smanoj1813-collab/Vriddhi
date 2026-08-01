import { useState, useEffect, useCallback } from "react";
import { Material, materialApi } from "../api/materialApi";

export function useMaterials(classId?: string, subject?: string) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await materialApi.getMaterials(classId, subject);
      setMaterials(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch materials");
    } finally {
      setLoading(false);
    }
  }, [classId, subject]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return { materials, loading, error, refetch: fetchMaterials };
}
