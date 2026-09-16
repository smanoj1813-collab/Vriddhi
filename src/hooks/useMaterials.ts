// ═══════════════════════════════════════════════════════════════════════
// src/hooks/useMaterials.ts
// Hook for managing and fetching college course materials
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { materialApi, type MaterialItem, type MaterialType, type CreateMaterialInput } from '../api/materialApi';

export type FilterType = MaterialType | 'all';

export function useMaterials(subjectFilter?: string) {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const fetchMaterials = useCallback(async () => {
    if (!collegeId) {
      setMaterials([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await materialApi.getCollegeMaterials(collegeId);
      setMaterials(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (filterType !== 'all' && m.type !== filterType) return false;
      if (subjectFilter && m.subject !== subjectFilter && m.courseCode !== subjectFilter && m.courseName !== subjectFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesSubject = m.subject.toLowerCase().includes(q);
        const matchesTopic = (m.topic || '').toLowerCase().includes(q);
        const matchesTags = (m.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSubject && !matchesTopic && !matchesTags) return false;
      }
      return true;
    });
  }, [materials, filterType, subjectFilter, search]);

  const stats = useMemo(() => {
    const total = materials.length;
    const pdf = materials.filter(m => m.type === 'pdf').length;
    const video = materials.filter(m => m.type === 'video').length;
    const link = materials.filter(m => m.type === 'link').length;
    const document = materials.filter(m => m.type === 'document').length;
    const presentation = materials.filter(m => m.type === 'presentation').length;
    const image = materials.filter(m => m.type === 'image').length;
    return { total, pdf, video, link, document, presentation, image };
  }, [materials]);

  const addMaterial = useCallback(
    async (data: Omit<CreateMaterialInput, 'collegeId'>) => {
      if (!collegeId) throw new Error('Not authenticated - missing college');
      const item = await materialApi.addMaterial({
        ...data,
        collegeId,
        facultyId: user?.id || user?.uid,
        facultyName: user?.name || user?.email || 'Faculty',
      });
      setMaterials(prev => [item, ...prev]);
    },
    [collegeId, user]
  );

  const removeMaterial = useCallback(
    async (id: string) => {
      if (!collegeId) return;
      await materialApi.deleteMaterial(collegeId, id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    },
    [collegeId]
  );

  const trackView = useCallback(
    async (id: string) => {
      if (!collegeId) return;
      await materialApi.trackView(collegeId, id);
      setMaterials(prev =>
        prev.map(m => (m.id === id ? { ...m, views: (m.views || 0) + 1 } : m))
      );
    },
    [collegeId]
  );

  const trackDownload = useCallback(
    async (id: string) => {
      if (!collegeId) return;
      await materialApi.trackDownload(collegeId, id);
      setMaterials(prev =>
        prev.map(m => (m.id === id ? { ...m, downloads: (m.downloads || 0) + 1 } : m))
      );
    },
    [collegeId]
  );

  return {
    materials: filteredMaterials,
    allMaterials: materials,
    stats,
    loading,
    error,
    readStats: { used: materials.length, remaining: 1000 - materials.length },
    search,
    setSearch,
    filterType,
    setFilterType,
    refresh: fetchMaterials,
    addMaterial,
    removeMaterial,
    trackView,
    trackDownload,
  };
}

export default useMaterials;
