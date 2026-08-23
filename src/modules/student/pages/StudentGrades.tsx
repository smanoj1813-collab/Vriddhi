import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, BookOpen, ChevronDown, ChevronUp, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { fetchGrades } from '../api/studentDataApi';

interface GradeRecord {
  id: string;
  subject: string;
  code: string;
  credits: number;
  internal: number;
  external: number;
  total: number;
  grade: string;
  gradePoint: number;
  semester: number;
}

const gradeColors: Record<string, string> = {
  'A+': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'O': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'A': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'B+': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'B': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'C': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'D': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'F': 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function StudentGrades() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useStudentProfile(user?.uid);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setLoading(true);
    fetchGrades(profile.collegeId || user?.collegeId, profile.id)
      .then((data) => !cancelled && setGrades(data))
      .catch((err) => console.error('[StudentGrades] load failed:', err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [profile, user?.collegeId]);

  const semesterWise = useMemo(() => {
    return grades.reduce((acc, g) => {
      const sem = g.semester || 1;
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(g);
      return acc;
    }, {} as Record<number, GradeRecord[]>);
  }, [grades]);

  const semesters = useMemo(
    () => Object.keys(semesterWise).map(Number).sort((a, b) => b - a),
    [semesterWise]
  );

  const [expandedSemester, setExpandedSemester] = useState<number | null>(
    semesters[0] ?? (profile?.semester || 1)
  );
  const [activeTab, setActiveTab] = useState<'grades' | 'progress'>('grades');

  useEffect(() => {
    if (expandedSemester == null && semesters.length) setExpandedSemester(semesters[0]);
  }, [semesters, expandedSemester]);

  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
  const totalGradePoints = grades.reduce((sum, g) => sum + g.gradePoint * g.credits, 0);
  const cgpa = totalCredits ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

  const semesterGPA = (semester: number) => {
    const list = semesterWise[semester] || [];
    const credits = list.reduce((s, g) => s + g.credits, 0);
    const points = list.reduce((s, g) => s + g.gradePoint * g.credits, 0);
    return credits ? (points / credits).toFixed(2) : '0.00';
  };

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
          <h1 className="text-2xl font-bold text-white">Grades &amp; Progress</h1>
          <p className="text-sm text-slate-400">View your academic performance and track progress</p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* CGPA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - parseFloat(cgpa) / 10) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{cgpa}</span>
                <span className="text-xs text-slate-400">CGPA</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="text-center p-4 rounded-lg bg-slate-800/50">
                <Award className="w-5 h-5 text-teal-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{grades.filter(g => g.grade === 'A' || g.grade === 'A+' || g.grade === 'O').length}</p>
                <p className="text-xs text-slate-400">A Grades</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-800/50">
                <BookOpen className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{totalCredits}</p>
                <p className="text-xs text-slate-400">Total Credits</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-800/50">
                <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{semesters[0] ?? '—'}</p>
                <p className="text-xs text-slate-400">Current Sem</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-800/50">
                <GraduationCap className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{grades.length}</p>
                <p className="text-xs text-slate-400">Subjects</p>
              </div>
            </div>
          </div>
        </motion.div>

        {grades.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-slate-700/30 bg-slate-900/40">
            <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-white font-medium">No graded results yet</p>
            <p className="text-sm text-slate-400 mt-1">Your graded assessments will appear here once published.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              {(['grades', 'progress'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab === 'grades' ? 'Grade Cards' : 'Semester Progress'}
                </button>
              ))}
            </div>

            {activeTab === 'grades' ? (
              <div className="space-y-4">
                {semesters.map((semester) => (
                  <motion.div
                    key={semester}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-slate-700/30 bg-slate-900/40 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedSemester(expandedSemester === semester ? null : semester)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center text-sm font-bold">
                          {semester}
                        </span>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white">Semester {semester}</p>
                          <p className="text-xs text-slate-400">{semesterWise[semester].length} subjects · GPA: {semesterGPA(semester)}</p>
                        </div>
                      </div>
                      {expandedSemester === semester ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {expandedSemester === semester && (
                      <div className="px-6 pb-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-xs text-slate-400 border-b border-slate-700/50">
                                <th className="pb-2 font-medium">Subject</th>
                                <th className="pb-2 font-medium">Code</th>
                                <th className="pb-2 font-medium text-center">Credits</th>
                                <th className="pb-2 font-medium text-center">Internal</th>
                                <th className="pb-2 font-medium text-center">External</th>
                                <th className="pb-2 font-medium text-center">Total</th>
                                <th className="pb-2 font-medium text-center">Grade</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {semesterWise[semester].map((g) => (
                                <tr key={g.id} className="border-b border-slate-800/50 last:border-0">
                                  <td className="py-3 text-slate-200">{g.subject}</td>
                                  <td className="py-3 text-slate-400">{g.code}</td>
                                  <td className="py-3 text-center text-slate-400">{g.credits}</td>
                                  <td className="py-3 text-center text-slate-400">{g.internal}</td>
                                  <td className="py-3 text-center text-slate-400">{g.external}</td>
                                  <td className="py-3 text-center font-semibold text-white">{g.total}</td>
                                  <td className="py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${gradeColors[g.grade] || 'bg-slate-700 text-slate-300'}`}>
                                      {g.grade}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Semester-wise GPA Trend</h3>
                <div className="space-y-4">
                  {semesters
                    .slice()
                    .sort((a, b) => a - b)
                    .map((semester) => {
                      const gpa = parseFloat(semesterGPA(semester));
                      const percentage = (gpa / 10) * 100;
                      return (
                        <div key={semester}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300">Semester {semester}</span>
                            <span className="text-teal-400 font-semibold">{gpa} GPA</span>
                          </div>
                          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: semester * 0.1 }}
                              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
