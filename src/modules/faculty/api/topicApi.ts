// src/modules/faculty/api/topicApi.ts
export type TopicStatus = 'planned' | 'in-progress' | 'completed' | 'delayed';

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

// Types that FacultyTopics.tsx expects
export interface Topic {
  id: string;
  title: string;
  description: string;
  course: string;
  batch: string;
  division: string;
  plannedDate: string;
  duration: number;
  status: TopicStatus;
  resources: string[];
  notes: string;
  subject: string;
}

export interface TopicFormData {
  title: string;
  description: string;
  course: string;
  batch: string;
  division: string;
  plannedDate: string;
  duration: number;
  status: TopicStatus;
  resources: string[];
  notes: string;
  subject: string;
}

export interface TopicStats {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
  delayed: number;
}

export interface ReadStats {
  used: number;
  remaining: number;
}

export type StatusFilter = 'all' | TopicStatus;

export interface UseTopicsReturn {
  topics: Topic[];
  stats: TopicStats;
  readStats: ReadStats;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  refresh: () => void;
  addTopic: (data: TopicFormData) => Promise<void>;
  editTopic: (id: string, data: TopicFormData) => Promise<void>;
  removeTopic: (id: string) => Promise<void>;
}

import { useCallback, useEffect, useState } from 'react';

export const useTopics = (facultyId?: string): UseTopicsReturn => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchData = useCallback(async () => {
    if (!facultyId) { setLoading(false); return; }
    try {
      setLoading(true);
      // TODO: Wire to Firestore
      setTopics([]);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [facultyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addTopic = useCallback(async (data: TopicFormData) => {
    const newTopic: Topic = {
      id: `topic-${Date.now()}`,
      ...data,
    };
    setTopics(prev => [...prev, newTopic]);
  }, []);

  const editTopic = useCallback(async (id: string, data: TopicFormData) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const removeTopic = useCallback(async (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  }, []);

  const filteredTopics = topics.filter(t => {
    const matchesSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats: TopicStats = {
    total: topics.length,
    planned: topics.filter(t => t.status === 'planned').length,
    inProgress: topics.filter(t => t.status === 'in-progress').length,
    completed: topics.filter(t => t.status === 'completed').length,
    delayed: topics.filter(t => t.status === 'delayed').length,
  };

  const readStats: ReadStats = {
    used: 0,
    remaining: 1000,
  };

  return {
    topics: filteredTopics,
    stats,
    readStats,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refresh: fetchData,
    addTopic,
    editTopic,
    removeTopic,
  };
};

export default useTopics;
