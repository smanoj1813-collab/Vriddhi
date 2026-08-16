import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Types ─────────────────────────────────────────────

export type TopicStatus = 'planned' | 'in-progress' | 'completed' | 'delayed' | 'pending' | 'cancelled';
export type StatusFilter = 'all' | TopicStatus;

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

export interface UseTopicsReturn {
  topics: Topic[];
  stats: TopicStats;
  loading: boolean;
  error: string | null;
  readStats: ReadStats;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  refresh: () => void;
  addTopic: (data: Omit<Topic, 'id'>) => Promise<void>;
  editTopic: (id: string, data: Partial<Topic>) => Promise<void>;
  removeTopic: (id: string) => Promise<void>;
}

// Backward-compat export (so other files don't break)
export interface TopicResource {
  title: string;
  url: string;
  type: 'pdf' | 'video' | 'link' | 'doc' | 'ppt' | 'other';
  uploadedAt?: Date | string;
}

// ─── Hook ──────────────────────────────────────────────

export function useTopics(_facultyId?: string): UseTopicsReturn {
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    setLoading(false);
    setError(null);
  }, []);

  const topics = useMemo(() => {
    return allTopics.filter(t => {
      const q = search.toLowerCase();
      const matchesSearch = !search ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.course.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allTopics, search, statusFilter]);

  const stats = useMemo(() => ({
    total: allTopics.length,
    planned: allTopics.filter(t => t.status === 'planned').length,
    inProgress: allTopics.filter(t => t.status === 'in-progress').length,
    completed: allTopics.filter(t => t.status === 'completed').length,
    delayed: allTopics.filter(t => t.status === 'delayed').length,
  }), [allTopics]);

  const addTopic = useCallback(async (data: Omit<Topic, 'id'>) => {
    const newTopic: Topic = { ...data, id: Math.random().toString(36).substring(2, 9) };
    setAllTopics(prev => [...prev, newTopic]);
  }, []);

  const editTopic = useCallback(async (id: string, data: Partial<Topic>) => {
    setAllTopics(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
  }, []);

  const removeTopic = useCallback(async (id: string) => {
    setAllTopics(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    topics,
    stats,
    loading,
    error,
    readStats: { used: 0, remaining: 999 },
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refresh: () => {},
    addTopic,
    editTopic,
    removeTopic,
  };
}

export default useTopics;