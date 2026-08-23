import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, FileText, FileImage, FileVideo, Filter, BookOpen, ExternalLink, Loader2, FolderOpen } from 'lucide-react';
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
  pdf: <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />,
  doc: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  ppt: <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
  video: <FileVideo className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
  image: <FileImage className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  link: <ExternalLink className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
};

const typeColors: Record<string, string> = {
  pdf: 'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  doc: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  ppt: 'bg-orange-50 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  video: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  image: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  link: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Study Materials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Study Materials &amp; Lecture Notes</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Faculty curated presentations, reference documents, video links and syllabi</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes, chapters, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-teal-500 shadow-xs cursor-pointer"
          >
            {subjects.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-teal-500 shadow-xs cursor-pointer"
          >
            {types.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Formats' : t.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {types.filter((t) => t !== 'All').map((type) => {
          const count = materials.filter((m) => m.type === type).length;
          const isSelected = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(selectedType === type ? 'All' : type)}
              className={`p-3 rounded-2xl border transition-all text-left flex items-center gap-3 shadow-xs ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/50 ring-2 ring-teal-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] hover:border-slate-300'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeColors[type] || 'bg-slate-100 text-slate-600'}`}>
                {typeIcons[type] || <FileText className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{count}</p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize">{type}s</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Materials Cards Grid */}
      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((material, index) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ delay: index * 0.02 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] p-5 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[material.type] || 'bg-slate-100 text-slate-600'}`}>
                      {typeIcons[material.type] || <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{material.title}</h3>
                      <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold truncate">{material.subject}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${typeColors[material.type] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {material.type}
                  </span>
                </div>

                {material.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {material.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="truncate font-medium">By {material.uploadedBy}</span>
                  {material.uploadedAt && (
                    <span className="shrink-0">{new Date(material.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">{material.size || 'Document'}</span>
                  {material.url && material.url !== '#' && (
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {material.type === 'link' ? 'Open Link' : 'Download'}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] p-8 shadow-sm">
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">No course materials found</p>
          <p className="text-xs text-slate-500 mt-0.5">When professors share lecture notes or references, they will be catalogued here.</p>
        </div>
      )}
    </div>
  );
}
