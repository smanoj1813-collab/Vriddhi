import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, FileText, FileImage, FileVideo, Filter, BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  type: string;
  size?: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  tags: string[];
}

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-red-400" />,
  doc: <FileText className="w-5 h-5 text-blue-400" />,
  ppt: <FileText className="w-5 h-5 text-orange-400" />,
  video: <FileVideo className="w-5 h-5 text-purple-400" />,
  image: <FileImage className="w-5 h-5 text-emerald-400" />,
  link: <ExternalLink className="w-5 h-5 text-teal-400" />,
};

const typeColors: Record<string, string> = {
  pdf: 'bg-red-500/10 text-red-400 border-red-500/20',
  doc: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ppt: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  video: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  image: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  link: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

export default function StudentMaterials() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useStudentProfile(user?.uid);

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  useEffect(() => {
    if (!profile?.collegeId || !profile?.batch) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Materials live at colleges/{collegeId}/materials (see materialApi).
        // Query by batch and filter branch/semester client-side to avoid composite indexes.
        const q = query(
          collection(db, 'colleges', profile.collegeId!, 'materials'),
          where('batch', '==', profile.batch),
          limit(300)
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const items: StudyMaterial[] = snap.docs
          .map((d) => {
            const data = d.data() as Record<string, any>;
            // Optional cohort guard (branch/semester may not always be set)
            if (data.branch && data.branch !== profile.branch) return null;
            if (data.semester && Number(data.semester) !== Number(profile.semester)) return null;
            return {
              id: d.id,
              title: data.title || '',
              subject: data.subject || data.topic || '',
              type: String(data.type || 'pdf'),
              size: data.size,
              uploadedBy: data.facultyName || 'Faculty',
              uploadedAt: data.uploadDate || data.createdAt || '',
              url: data.url || '#',
              tags: Array.isArray(data.tags) ? data.tags : [],
            } as StudyMaterial;
          })
          .filter(Boolean) as StudyMaterial[];

        setMaterials(items);
      } catch (err) {
        console.error('[StudentMaterials] load failed:', err);
        setMaterials([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.collegeId, profile?.batch, profile?.branch, profile?.semester]);

  const subjects = useMemo(
    () => ['All', ...Array.from(new Set(materials.map((m) => m.subject).filter(Boolean)))],
    [materials]
  );
  const types = useMemo(
    () => ['All', ...Array.from(new Set(materials.map((m) => m.type).filter(Boolean)))],
    [materials]
  );

  const filtered = materials.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      m.title.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q));
    const matchesSubject = selectedSubject === 'All' || m.subject === selectedSubject;
    const matchesType = selectedType === 'All' || m.type === selectedType;
    return matchesSearch && matchesSubject && matchesType;
  });

  if (profileLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Study Materials</h1>
          <p className="text-sm text-slate-400">Access lecture notes, slides, videos and more</p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, subject or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white appearance-none focus:outline-none focus:border-teal-500/50 cursor-pointer"
              >
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white appearance-none focus:outline-none focus:border-teal-500/50 cursor-pointer"
            >
              {types.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {types.filter((t) => t !== 'All').map((type) => {
            const count = materials.filter((m) => m.type === type).length;
            return (
              <motion.button
                key={type}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-lg border ${typeColors[type] || 'bg-slate-800 text-slate-300 border-slate-700'} flex items-center gap-3 hover:opacity-80 transition-opacity`}
                onClick={() => setSelectedType(selectedType === type ? 'All' : type)}
              >
                {typeIcons[type] || <FileText className="w-5 h-5" />}
                <div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs opacity-80">{type.charAt(0).toUpperCase() + type.slice(1)}s</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-5 hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[material.type] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                      {typeIcons[material.type] || <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white line-clamp-1">{material.title}</h3>
                      <p className="text-xs text-slate-400 truncate">{material.subject}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${typeColors[material.type] || 'border-slate-700 text-slate-400'}`}>
                    {material.type.toUpperCase()}
                  </span>
                </div>

                {material.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {material.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 text-xs">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span className="truncate">By {material.uploadedBy}</span>
                  {material.uploadedAt && (
                    <span>{new Date(material.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {material.size && <span className="text-xs text-slate-500">{material.size}</span>}
                  {material.url && material.url !== '#' && (
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/15 text-teal-400 text-sm font-medium hover:bg-teal-500/25 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {material.type === 'link' ? 'Open' : 'Download'}
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-slate-800 bg-slate-900/40">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No materials found</p>
            <p className="text-sm text-slate-500">New materials shared by your faculty will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
