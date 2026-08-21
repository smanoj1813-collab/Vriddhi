import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../Firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

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
  facultyId?: string;
  createdAt?: string;
  updatedAt?: string;
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

// ─── Firestore collection ──────────────────────────────

const TOPICS_COLLECTION = 'facultyTopics';

function docToTopic(d: any, id: string): Topic {
  return {
    id,
    title: d.title || '',
    description: d.description || '',
    course: d.course || '',
    batch: d.batch || '',
    division: d.division || '',
    plannedDate: d.plannedDate || '',
    duration: typeof d.duration === 'number' ? d.duration : 0,
    status: d.status || 'planned',
    resources: Array.isArray(d.resources) ? d.resources : [],
    notes: d.notes || '',
    subject: d.subject || '',
    facultyId: d.facultyId || '',
    createdAt: d.createdAt || '',
    updatedAt: d.updatedAt || '',
  };
}

// ─── Hook ──────────────────────────────────────────────

export function useTopics(facultyId?: string): UseTopicsReturn {
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Single equality filter (no composite index needed), sort client-side
      let q;
      if (facultyId) {
        q = query(collection(db, TOPICS_COLLECTION), where('facultyId', '==', facultyId));
      } else {
        q = query(collection(db, TOPICS_COLLECTION));
      }
      const snap = await getDocs(q);
      const list = snap.docs
        .map((d) => docToTopic(d.data(), d.id))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAllTopics(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topics');
      setAllTopics([]);
    } finally {
      setLoading(false);
    }
  }, [facultyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    const now = new Date().toISOString();
    const payload = {
      ...data,
      facultyId: facultyId || '',
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(collection(db, TOPICS_COLLECTION), payload);
    setAllTopics(prev => [docToTopic(payload, docRef.id), ...prev]);
  }, [facultyId]);

  const editTopic = useCallback(async (id: string, data: Partial<Topic>) => {
    const updatedAt = new Date().toISOString();
    await updateDoc(doc(db, TOPICS_COLLECTION, id), { ...data, updatedAt });
    setAllTopics(prev => prev.map(t => (t.id === id ? { ...t, ...data, updatedAt } : t)));
  }, []);

  const removeTopic = useCallback(async (id: string) => {
    await deleteDoc(doc(db, TOPICS_COLLECTION, id));
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
    refresh: fetchData,
    addTopic,
    editTopic,
    removeTopic,
  };
}

export default useTopics;
