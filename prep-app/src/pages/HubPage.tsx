// prep-app/src/pages/HubPage.tsx
import React, { useState, useEffect } from 'react';
import {
  BookOpen, Calculator, TrendingUp, Users, Scale, Target,
  Truck, Zap, Receipt, Search, Filter, Sparkles, CheckCircle2,
  ChevronRight, ArrowRight, BarChart2, PieChart, Briefcase
} from 'lucide-react';
import { getSubjects, getLearnerProgress, type PrepSubject, type LearnerProgress } from '../services/api';

interface HubPageProps {
  onSelectSubject: (subjectId: string) => void;
  selectedProgram: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase,
  BookOpen,
  TrendingUp,
  Calculator,
  Users,
  PieChart,
  Scale,
  BarChart2,
  Target,
  Truck,
  Zap,
  Receipt,
};

export default function HubPage({ onSelectSubject, selectedProgram }: HubPageProps) {
  const [subjects, setSubjects] = useState<PrepSubject[]>([]);
  const [progress, setProgress] = useState<LearnerProgress>({ topicsCompleted: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<string>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [subjData, progData] = await Promise.all([
        getSubjects({ program: selectedProgram }),
        getLearnerProgress(),
      ]);
      setSubjects(subjData);
      setProgress(progData);
      setLoading(false);
    }
    load();
  }, [selectedProgram]);

  const filtered = subjects.filter((s) => {
    if (selectedYear !== 'all' && s.yearGroup !== selectedYear) return false;
    if (selectedSemester !== 'all' && s.semester !== Number(selectedSemester)) return false;
    if (selectedStream !== 'all' && s.stream !== selectedStream) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchDesc = s.description?.toLowerCase().includes(q);
      const matchStream = s.stream.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchStream) return false;
    }
    return true;
  });

  const yearStats = {
    all: subjects.length,
    '1st-year': subjects.filter((s) => s.yearGroup === '1st-year').length,
    '2nd-year': subjects.filter((s) => s.yearGroup === '2nd-year').length,
    'final-year': subjects.filter((s) => s.yearGroup === 'final-year').length,
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PrepInsta-Class Commerce & Management Preparation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Master Every BBA Subject from <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">1st Year to Final Year</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Curriculum-authored study material for Indian Universities (NEP 2020, CBCS). Instant concept explanations, formula sheets, examiner shortcuts, step-by-step solvers, and timed practice tests.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>20 Core & Capstone Subjects (Karnataka NEP 2020)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Bangalore Univ (BU/BCU/BNU), Mysore, VTU & Mangalore</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>5-Module Structure with Granular Subtopics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Year Group Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All 3 Years', count: yearStats.all },
            { id: '1st-year', label: '1st Year (Foundations)', count: yearStats['1st-year'] },
            { id: '2nd-year', label: '2nd Year (Core Functional)', count: yearStats['2nd-year'] },
            { id: 'final-year', label: 'Final Year (Capstone)', count: yearStats['final-year'] },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedYear(tab.id);
                setSelectedSemester('all');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedYear === tab.id
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedYear === tab.id ? 'bg-teal-700 text-white' : 'bg-slate-200 dark:bg-slate-800'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject, module, or topic..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Semester Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">Karnataka Semester:</span>
        {[
          { id: 'all', label: 'All Semesters' },
          { id: '1', label: 'Sem 1' },
          { id: '2', label: 'Sem 2' },
          { id: '3', label: 'Sem 3' },
          { id: '4', label: 'Sem 4' },
          { id: '5', label: 'Sem 5' },
          { id: '6', label: 'Sem 6' },
        ].map((sem) => (
          <button
            key={sem.id}
            onClick={() => setSelectedSemester(sem.id)}
            className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
              selectedSemester === sem.id
                ? 'bg-teal-700 text-white font-bold shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-400'
            }`}
          >
            {sem.label}
          </button>
        ))}
      </div>

      {/* Stream Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">Stream:</span>
        {[
          { id: 'all', label: 'All Streams' },
          { id: 'management', label: 'Management & OB' },
          { id: 'commerce', label: 'Commerce & Accounting' },
          { id: 'economics', label: 'Economics' },
          { id: 'aptitude', label: 'Quantitative & Stats' },
          { id: 'finance', label: 'Finance' },
          { id: 'law', label: 'Law' },
          { id: 'strategy', label: 'Strategy' },
          { id: 'operations', label: 'Operations' },
          { id: 'taxation', label: 'Taxation & GST' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStream(s.id)}
            className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
              selectedStream === s.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold">No subjects match the selected criteria.</p>
            <p className="text-xs">Try selecting "All 3 Years" or clearing search filters.</p>
          </div>
        ) : (
          filtered.map((subject) => {
            const Icon = ICON_MAP[subject.icon] || BookOpen;
            const completedCount = 0; // calculated per user
            const yearLabel =
              subject.yearGroup === '1st-year'
                ? '1st Year'
                : subject.yearGroup === '2nd-year'
                ? '2nd Year'
                : 'Final Year';

            return (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(subject.id)}
                className="group cursor-pointer rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-teal-500/60 dark:hover:border-teal-500/60 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/60 dark:border-teal-800/60 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {subject.semester && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                          Sem {subject.semester}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {yearLabel}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                        {subject.stream}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {subject.description || 'Comprehensive university curriculum topics, formulas, tricks and timed quiz pool.'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                    <span>{subject.topicCount || 6} Topics</span>
                  </div>

                  <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Study Pack <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
