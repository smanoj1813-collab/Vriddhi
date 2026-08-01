import { useCallback, useEffect, useState } from 'react';

export type MaterialType = 'pdf' | 'video' | 'doc' | 'ppt' | 'image' | 'link' | 'other';

export interface FacultyMaterial {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  url: string;
  subject: string;
  subjectCode?: string;
  className?: string;
  section?: string;
  semester?: number;
  uploadedAt: Date | string;
  uploadedBy: string;
  fileSize?: number;
  downloadCount?: number;
}

export interface UseMaterialsReturn {
  materials: FacultyMaterial[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  uploadMaterial: (file: File, metadata: Omit<FacultyMaterial, 'id' | 'url' | 'uploadedAt'>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
}

export const useMaterials = (facultyId?: string): UseMaterialsReturn => {
  const [materials, setMaterials] = useState<FacultyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!facultyId) { setLoading(false); return; }
    try {
      setLoading(true);
      // TODO: Wire to Firestore / Cloud Storage
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [facultyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const uploadMaterial = useCallback(async (file: File, metadata: Omit<FacultyMaterial, 'id' | 'url' | 'uploadedAt'>) => {
    // TODO: Implement actual upload
    console.log('Uploading', file.name, metadata);
  }, []);

  const deleteMaterial = useCallback(async (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  }, []);

  return { materials, loading, error, refresh: fetchData, uploadMaterial, deleteMaterial };
};

export default useMaterials;
