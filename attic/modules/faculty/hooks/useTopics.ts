import { useCallback, useEffect, useState } from 'react';

export type TopicStatus = 'covered' | 'pending' | 'in-progress' | 'review';

export interface TopicResource {
  title: string;
  url: string;
  type: 'pdf' | 'video' | 'link' | 'doc' | 'ppt' | 'other';
  uploadedAt?: Date | string;
}

export interface FacultyTopicItem {
  id: string;
  title: string;
  subject: string;
  subjectCode?: string;
  status: TopicStatus;
  description?: string;
  resources: TopicResource[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  facultyId?: string;
}

export interface UseTopicsReturn {
  topics: FacultyTopicItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateTopic: (id: string, data: Partial<FacultyTopicItem>) => Promise<void>;
  addResource: (topicId: string, resource: TopicResource) => Promise<void>;
  deleteResource: (topicId: string, resourceIndex: number) => Promise<void>;
}

export const useTopics = (facultyId?: string): UseTopicsReturn => {
  const [topics, setTopics] = useState<FacultyTopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!facultyId) { setLoading(false); return; }
    try {
      setLoading(true);
      // TODO: Wire to Firestore
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [facultyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateTopic = useCallback(async (id: string, data: Partial<FacultyTopicItem>) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const addResource = useCallback(async (topicId: string, resource: TopicResource) => {
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, resources: [...t.resources, resource] } : t));
  }, []);

  const deleteResource = useCallback(async (topicId: string, resourceIndex: number) => {
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, resources: t.resources.filter((_, i) => i !== resourceIndex) } : t));
  }, []);

  return { topics, loading, error, refresh: fetchData, updateTopic, addResource, deleteResource };
};

export default useTopics;