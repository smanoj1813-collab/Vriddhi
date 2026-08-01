import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, FileText, FileImage, FileVideo, Filter, BookOpen, ExternalLink } from 'lucide-react';

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  type: 'pdf' | 'doc' | 'video' | 'image' | 'link';
  size?: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  tags: string[];
}

const mockMaterials: StudyMaterial[] = [
  { id: '1', title: 'Data Structures - Complete Notes', subject: 'Data Structures & Algorithms', type: 'pdf', size: '2.4 MB', uploadedBy: 'Dr. Priya Nair', uploadedAt: '2026-06-20', url: '#', tags: ['notes', 'dsa'] },
  { id: '2', title: 'DBMS Lecture Slides - Unit 3', subject: 'Database Management Systems', type: 'pdf', size: '5.1 MB', uploadedBy: 'Prof. Arun Kumar', uploadedAt: '2026-06-18', url: '#', tags: ['slides', 'unit-3'] },
  { id: '3', title: 'Operating Systems - Process Scheduling Video', subject: 'Operating Systems', type: 'video', size: '45 MB', uploadedBy: 'Dr. Meera Iyer', uploadedAt: '2026-06-15', url: '#', tags: ['video', 'scheduling'] },
  { id: '4', title: 'Computer Networks - Subnetting Guide', subject: 'Computer Networks', type: 'doc', size: '1.2 MB', uploadedBy: 'Dr. Priya Nair', uploadedAt: '2026-06-12', url: '#', tags: ['guide', 'subnetting'] },
  { id: '5', title: 'Mathematics III - Formula Sheet', subject: 'Mathematics III', type: 'pdf', size: '0.8 MB', uploadedBy: 'Prof. Sharma', uploadedAt: '2026-06-10', url: '#', tags: ['formulas', 'quick-ref'] },
  { id: '6', title: 'OS Lab Manual', subject: 'Operating Systems', type: 'pdf', size: '3.5 MB', uploadedBy: 'Dr. Meera Iyer', uploadedAt: '2026-06-08', url: '#', tags: ['lab', 'manual'] },
  { id: '7', title: 'DBMS - SQL Practice Questions', subject: 'Database Management Systems', type: 'link', uploadedBy: 'Prof. Arun Kumar', uploadedAt: '2026-06-05', url: '#', tags: ['sql', 'practice'] },
  { id: '8', title: 'DSA - Binary Tree Diagrams', subject: 'Data Structures & Algorithms', type: 'image', size: '1.8 MB', uploadedBy: 'Dr. Priya Nair', uploadedAt: '2026-06-01', url: '#', tags: ['diagrams', 'trees'] },
];

const typeIcons = {
  pdf: <FileText className="w-5 h-5 text-red-400" />,
  doc: <FileText className="w-5 h-5 text-blue-400" />,
  video: <FileVideo className="w-5 h-5 text-purple-400" />,
  image: <FileImage className="w-5 h-5 text-emerald-400" />,
  link: <ExternalLink className="w-5 h-5 text-teal-400" />,
};

const typeColors: Record<string, string> = {
  pdf: 'bg-red-500/10 text-red-400 border-red-500/20',
  doc: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  video: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  image: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  link: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

export default function StudentMaterials() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  const subjects = ['All', ...Array.from(new Set(mockMaterials.map(m => m.subject)))];
  const types = ['All', ...Array.from(new Set(mockMaterials.map(m => m.type)))];

  const filtered = mockMaterials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubject === 'All' || m.subject === selectedSubject;
    const matchesType = selectedType === 'All' || m.type === selectedType;
    return matchesSearch && matchesSubject && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Study Materials</h1>
          <p className="text-sm text-slate-400">Access lecture notes, slides, videos and more</p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title or tags..."
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
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white appearance-none focus:outline-none focus:border-teal-500/50 cursor-pointer"
            >
              {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {types.filter((t: string) => t !== 'All').map(type => {
            const count = mockMaterials.filter(m => m.type === type).length;
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-lg border ${typeColors[type]} flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => setSelectedType(selectedType === type ? 'All' : type)}
              >
                {typeIcons[type as keyof typeof typeIcons]}
                <div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs opacity-80">{type.charAt(0).toUpperCase() + type.slice(1)}s</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Materials Grid */}
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl border border-slate-700/30 p-5 hover:border-slate-600/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[material.type]}`}>
                      {typeIcons[material.type as keyof typeof typeIcons]}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white line-clamp-1">{material.title}</h3>
                      <p className="text-xs text-slate-400">{material.subject}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${typeColors[material.type]}`}>
                    {material.type.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {material.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span>By {material.uploadedBy}</span>
                  <span>{material.uploadedAt}</span>
                </div>

                <div className="flex items-center justify-between">
                  {material.size && <span className="text-xs text-slate-500">{material.size}</span>}
                  <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/15 text-teal-400 text-sm font-medium hover:bg-teal-500/25 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    {material.type === 'link' ? 'Open' : 'Download'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No materials found</p>
            <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
