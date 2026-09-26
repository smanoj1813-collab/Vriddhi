import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, FileText, FileImage, FileVideo, Filter,
  BookOpen, ExternalLink, Loader2, FolderOpen, Layers,
  Sparkles, CheckCircle2, ChevronRight, ChevronDown, GraduationCap,
  FileCheck, Library, Clock
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { useMyCurriculum, type StudentSubject, type StudentModule } from '../hooks/useMyCurriculum';
import { materialApi, type MaterialItem, type MaterialType } from '@/api/materialApi';
import { isSameSubject, isSameTopic, extractCanonicalSubject } from '@/shared/utils/curriculumMatcher';
import { openAIChatWithQuery } from '@/shared/components/FloatingAIChatWidget';
import AIStudyCompanionModal from '@/shared/components/study/AIStudyCompanionModal';

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />,
  doc: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  document: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  ppt: <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
  presentation: <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
  video: <FileVideo className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
  image: <FileImage className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  link: <ExternalLink className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
};

const typeColors: Record<string, string> = {
  pdf: 'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  doc: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  document: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  ppt: 'bg-orange-50 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  presentation: 'bg-orange-50 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  video: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  image: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  link: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
};

export default function StudentMaterials() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useStudentProfile(user?.uid);
  const { data: curriculumData, loading: curriculumLoading } = useMyCurriculum();

  const collegeId = profile?.collegeId || (user as any)?.collegeId || '';

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // ─── Fetch College Materials ───────────────────────────────────────
  useEffect(() => {
    if (!collegeId) return;
    let cancelled = false;
    setMaterialsLoading(true);

    materialApi.getCollegeMaterials(collegeId)
      .then((items) => {
        if (!cancelled) setMaterials(items);
      })
      .catch((err) => {
        console.error('[StudentMaterials] load failed:', err);
        if (!cancelled) setMaterials([]);
      })
      .finally(() => {
        if (!cancelled) setMaterialsLoading(false);
      });

    return () => { cancelled = true; };
  }, [collegeId]);

  // Assigned subjects from real curriculum (e.g., B.Com, BBA, etc.)
  const assignedSubjects = useMemo(() => {
    return curriculumData?.subjects || [];
  }, [curriculumData]);

  // Set default subject tab once curriculum loads
  useEffect(() => {
    if (assignedSubjects.length > 0 && selectedSubjectCode === 'all') {
      setSelectedSubjectCode(assignedSubjects[0].courseCode || assignedSubjects[0].courseName);
    }
  }, [assignedSubjects, selectedSubjectCode]);

  // Subject currently active in tab view
  const activeSubject = useMemo(() => {
    if (selectedSubjectCode === 'all') return null;
    return assignedSubjects.find(
      s => s.courseCode === selectedSubjectCode || s.courseName === selectedSubjectCode
    ) || null;
  }, [assignedSubjects, selectedSubjectCode]);

  // Filter materials for the selected subject using canonical topic/subject normalization
  const subjectMaterials = useMemo(() => {
    if (!activeSubject) return materials;
    return materials.filter(m => {
      // 1. Direct course code / ID match
      if (m.courseCode && activeSubject.courseCode && m.courseCode.toLowerCase() === activeSubject.courseCode.toLowerCase()) {
        return true;
      }
      if (m.courseId && activeSubject.curriculumId && m.courseId === activeSubject.curriculumId) {
        return true;
      }
      // 2. Canonical Subject Name match (e.g. "Cost Accounting" matching across differing university prefixes)
      if (isSameSubject(m.subject || m.courseName || '', activeSubject.courseName)) {
        return true;
      }
      return false;
    });
  }, [materials, activeSubject]);

  // Apply search query and format filter
  const filteredMaterials = useMemo(() => {
    return subjectMaterials.filter(m => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        (m.topic || '').toLowerCase().includes(q) ||
        (m.moduleName || '').toLowerCase().includes(q) ||
        (m.tags || []).some(t => t.toLowerCase().includes(q));

      const matchesType =
        selectedType === 'All' ||
        String(m.type).toLowerCase() === selectedType.toLowerCase() ||
        (selectedType === 'doc' && (m.type === 'document')) ||
        (selectedType === 'ppt' && (m.type === 'presentation'));

      return matchesSearch && matchesType;
    });
  }, [subjectMaterials, searchQuery, selectedType]);

  // Map materials into modules for the active subject
  const moduleGroupedMaterials = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.modules.map(mod => {
      const modMaterials = subjectMaterials.filter(m => {
        // Matched by moduleNo or moduleId
        if (m.moduleNo && String(m.moduleNo) === String(mod.moduleNo)) return true;
        if (m.moduleId && mod.topics.some(t => t.title.toLowerCase().includes(m.moduleId!.toLowerCase()))) return true;
        // Matched by topic title
        if (m.topic && mod.topics.some(t => isSameTopic(m.topic!, t.title))) return true;
        // Matched by module name
        if (m.moduleName && (mod.moduleName.toLowerCase().includes(m.moduleName.toLowerCase()) || m.moduleName.toLowerCase().includes(mod.moduleName.toLowerCase()))) return true;
        return false;
      });

      return {
        module: mod,
        materials: modMaterials,
      };
    });
  }, [activeSubject, subjectMaterials]);

  // Available formats among fetched materials
  const availableTypes = useMemo(() => {
    const set = new Set(subjectMaterials.map(m => m.type));
    return ['All', ...Array.from(set)];
  }, [subjectMaterials]);

  const toggleModuleAccordion = (moduleKey: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  const handleDownload = (material: MaterialItem) => {
    if (material.collegeId && material.id) {
      materialApi.trackDownload(material.collegeId, material.id).catch(() => {});
    }
  };

  const [activeStudyModal, setActiveStudyModal] = useState<{
    isOpen: boolean;
    subject: string;
    topic: string;
    courseName?: string;
    courseCode?: string;
    moduleName?: string;
    moduleNo?: number | string;
  }>({
    isOpen: false,
    subject: '',
    topic: '',
  });

  const handleAskAIStudyGuide = (
    subjectName: string,
    topicOrModule: string,
    modName?: string,
    modNo?: number | string
  ) => {
    setActiveStudyModal({
      isOpen: true,
      subject: subjectName,
      topic: topicOrModule,
      courseName: activeSubject?.courseName || subjectName,
      courseCode: activeSubject?.courseCode || '',
      moduleName: modName,
      moduleNo: modNo,
    });
  };

  const loading = profileLoading || (curriculumLoading && materialsLoading);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Your Assigned Course Curriculum &amp; Study Notes...
        </p>
      </div>
    );
  }

  const programTitle = profile?.branch || curriculumData?.student?.branch || 'Academic Program';
  const semesterNum = profile?.semester || curriculumData?.student?.semester || '';

  return (
    <div className="space-y-6">
      {/* Dynamic Header Connected to Student Curriculum */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 border border-teal-500/20 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {programTitle} {semesterNum ? `• Semester ${semesterNum}` : ''}
            </span>
            {curriculumData?.student?.batch && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Batch {curriculumData.student.batch}
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Curriculum Study Materials</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Official lecture notes, presentations, and AI learning guides matched to your enrolled subjects
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
            <p className="text-lg font-black text-teal-400">{assignedSubjects.length}</p>
            <p className="text-[10px] font-semibold text-slate-300 uppercase">Assigned Subjects</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
            <p className="text-lg font-black text-white">{materials.length}</p>
            <p className="text-[10px] font-semibold text-slate-300 uppercase">Total Notes</p>
          </div>
        </div>
      </div>

      {/* Subject Tabs Navigation (Dynamically generated from student's enrolled courses) */}
      {assignedSubjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSubjectCode('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-xs ${
              selectedSubjectCode === 'all'
                ? 'bg-teal-600 text-white shadow-teal-600/30 ring-2 ring-teal-500/20'
                : 'bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-300'
            }`}
          >
            <Library className="w-4 h-4" />
            All Subjects
          </button>

          {assignedSubjects.map(sub => {
            const isSelected = selectedSubjectCode === (sub.courseCode || sub.courseName);
            return (
              <button
                key={sub.curriculumId || sub.courseCode}
                onClick={() => setSelectedSubjectCode(sub.courseCode || sub.courseName)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-xs ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-teal-600/30 ring-2 ring-teal-500/20'
                    : 'bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-300'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{sub.courseName}</span>
                {sub.courseCode && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {sub.courseCode}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search notes, chapters, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === type
                  ? 'bg-teal-500 text-white shadow-xs'
                  : 'bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {type === 'All' ? 'All Formats' : type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Subject-Module Curriculum View */}
      {activeSubject && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeSubject.courseName}</span>
                {activeSubject.courseCode && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-mono">
                    {activeSubject.courseCode}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Faculty: <strong className="text-slate-700 dark:text-slate-300">{activeSubject.facultyName || 'Department Faculty'}</strong> • Credits: {activeSubject.credits} • Syllabus Modules: {activeSubject.modules.length}
              </p>
            </div>
            <button
              onClick={() => handleAskAIStudyGuide(activeSubject.courseName, 'Overview and important exam questions')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Subject Guide
            </button>
          </div>

          {/* Module-by-Module Breakdown */}
          <div className="space-y-4">
            {moduleGroupedMaterials.map(({ module: mod, materials: modMaterials }) => {
              const moduleKey = `${activeSubject.courseCode || activeSubject.courseName}_mod_${mod.moduleNo}`;
              const isExpanded = expandedModules[moduleKey] !== false; // Default expanded

              return (
                <div
                  key={moduleKey}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] overflow-hidden shadow-xs"
                >
                  {/* Module Header Accordion */}
                  <div
                    onClick={() => toggleModuleAccordion(moduleKey)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                        M{mod.moduleNo}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          Module {mod.moduleNo}: {mod.moduleName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {mod.topics.length} Syllabus Topics • {modMaterials.length} Uploaded Material(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAskAIStudyGuide(activeSubject.courseName, `Module ${mod.moduleNo}: ${mod.moduleName}`);
                        }}
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 border border-teal-500/20"
                      >
                        <Sparkles className="w-3 h-3 text-teal-500" />
                        AI Summary
                      </button>
                      <div className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Module Content */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
                      {/* Topics Checklist / Syllabus Topics */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#182238] border border-slate-200/80 dark:border-slate-800">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Syllabus Topics Covered in this Module:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {mod.topics.map((t, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAskAIStudyGuide(activeSubject.courseName, t.title)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 dark:hover:text-teal-300 border border-transparent hover:border-teal-500/20 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                              title="Click to ask AI for topic explanation"
                            >
                              <span>{t.title}</span>
                              <Sparkles className="w-2.5 h-2.5 text-teal-500 opacity-60" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Materials List for this module */}
                      {modMaterials.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {modMaterials.map((material) => (
                            <div
                              key={material.id}
                              className="p-4 rounded-2xl bg-white dark:bg-[#182238] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`p-2 rounded-xl shrink-0 ${typeColors[material.type] || 'bg-slate-100 text-slate-600'}`}>
                                      {typeIcons[material.type] || <FileText className="w-4 h-4" />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                      {material.title}
                                    </span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 border ${typeColors[material.type] || 'bg-slate-100'}`}>
                                    {material.type}
                                  </span>
                                </div>

                                {material.topic && material.topic !== 'General' && (
                                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-2 truncate">
                                    Topic: {material.topic}
                                  </p>
                                )}
                              </div>

                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400 truncate">By {material.uploadedBy}</span>
                                {material.url && material.url !== '#' && (
                                  <a
                                    href={material.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleDownload(material)}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    {material.type === 'link' ? 'Open' : 'Get'}
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#182238] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              No faculty uploads for Module {mod.moduleNo} yet
                            </p>
                            <p className="text-[11px] text-slate-500">
                              You can prepare with Vriddhi AI study summaries for these topics in the meantime.
                            </p>
                          </div>
                          <button
                            onClick={() => handleAskAIStudyGuide(activeSubject.courseName, `Module ${mod.moduleNo}: ${mod.moduleName}`, mod.moduleName, mod.moduleNo)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-bold hover:bg-teal-100 transition-colors shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                            Generate AI Study Notes
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback / General All-Materials View */}
      {selectedSubjectCode === 'all' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] p-5 shadow-xs hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${typeColors[material.type] || 'bg-slate-100 text-slate-600'}`}>
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

                  {material.topic && material.topic !== 'General' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
                      Topic: <span className="font-medium text-slate-700 dark:text-slate-200">{material.topic}</span>
                    </p>
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
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{material.size || 'Document'}</span>
                    {material.url && material.url !== '#' && (
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleDownload(material)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
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

          {filteredMaterials.length === 0 && (
            <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] p-8 shadow-xs">
              <FolderOpen className="w-12 h-12 text-slate-500 dark:text-slate-400 mx-auto mb-2" />
              <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">No course materials found</p>
              <p className="text-xs text-slate-500 mt-0.5">When professors share lecture notes or references for your syllabus, they will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* AI Study Companion Modal */}
      <AIStudyCompanionModal
        isOpen={activeStudyModal.isOpen}
        onClose={() => setActiveStudyModal(prev => ({ ...prev, isOpen: false }))}
        context={activeStudyModal}
      />
    </div>
  );
}
