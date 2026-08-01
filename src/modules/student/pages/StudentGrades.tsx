import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, BookOpen, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';

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

const mockGrades: GradeRecord[] = [
  { id: '1', subject: 'Data Structures & Algorithms', code: 'CS201', credits: 4, internal: 38, external: 52, total: 90, grade: 'A', gradePoint: 9, semester: 3 },
  { id: '2', subject: 'Database Management Systems', code: 'CS202', credits: 4, internal: 35, external: 48, total: 83, grade: 'A', gradePoint: 9, semester: 3 },
  { id: '3', subject: 'Operating Systems', code: 'CS203', credits: 4, internal: 32, external: 45, total: 77, grade: 'B+', gradePoint: 8, semester: 3 },
  { id: '4', subject: 'Computer Networks', code: 'CS204', credits: 3, internal: 30, external: 42, total: 72, grade: 'B+', gradePoint: 8, semester: 3 },
  { id: '5', subject: 'Mathematics III', code: 'MA201', credits: 3, internal: 36, external: 50, total: 86, grade: 'A', gradePoint: 9, semester: 3 },
  { id: '6', subject: 'Digital Logic Design', code: 'CS101', credits: 3, internal: 34, external: 46, total: 80, grade: 'A', gradePoint: 9, semester: 2 },
  { id: '7', subject: 'Object Oriented Programming', code: 'CS102', credits: 4, internal: 37, external: 51, total: 88, grade: 'A', gradePoint: 9, semester: 2 },
  { id: '8', subject: 'Discrete Mathematics', code: 'MA102', credits: 3, internal: 33, external: 44, total: 77, grade: 'B+', gradePoint: 8, semester: 2 },
];

const semesterWise = mockGrades.reduce((acc, g) => {
  if (!acc[g.semester]) acc[g.semester] = [];
  acc[g.semester].push(g);
  return acc;
}, {} as Record<number, GradeRecord[]>);

const gradeColors: Record<string, string> = {
  'A+': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'A': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'B+': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'B': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'C': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'F': 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function StudentGrades() {
  const [expandedSemester, setExpandedSemester] = useState<number | null>(3);
  const [activeTab, setActiveTab] = useState<'grades' | 'progress'>('grades');

  const totalCredits = mockGrades.reduce((sum, g) => sum + g.credits, 0);
  const totalGradePoints = mockGrades.reduce((sum, g) => sum + g.gradePoint * g.credits, 0);
  const cgpa = (totalGradePoints / totalCredits).toFixed(2);

  const semesterGPA = (semester: number) => {
    const grades = semesterWise[semester];
    const credits = grades.reduce((s, g) => s + g.credits, 0);
    const points = grades.reduce((s, g) => s + g.gradePoint * g.credits, 0);
    return (points / credits).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Grades & Progress</h1>
          <p className="text-sm text-slate-400">View your academic performance and track progress</p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* CGPA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl border border-slate-700/30 p-6"
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
                <p className="text-xl font-bold text-white">{mockGrades.filter(g => g.grade === 'A' || g.grade === 'A+').length}</p>
                <p className="text-xs text-slate-400">A Grades</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-800/50">
                <BookOpen className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{totalCredits}</p>
                <p className="text-xs text-slate-400">Total Credits</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-800/50">
                <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{Math.max(...Object.keys(semesterWise).map(Number))}</p>
                <p className="text-xs text-slate-400">Current Sem</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-800/50">
                <GraduationCap className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{mockGrades.length}</p>
                <p className="text-xs text-slate-400">Subjects</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
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
            {Object.entries(semesterWise)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([semester, grades]) => (
                <motion.div
                  key={semester}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-xl border border-slate-700/30 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedSemester(expandedSemester === Number(semester) ? null : Number(semester))}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center text-sm font-bold">
                        {semester}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">Semester {semester}</p>
                        <p className="text-xs text-slate-400">{grades.length} subjects · GPA: {semesterGPA(Number(semester))}</p>
                      </div>
                    </div>
                    {expandedSemester === Number(semester) ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {expandedSemester === Number(semester) && (
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
                            {grades.map((g) => (
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
            className="glass-card rounded-xl border border-slate-700/30 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Semester-wise GPA Trend</h3>
            <div className="space-y-4">
              {Object.entries(semesterWise)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([semester, grades]) => {
                  const gpa = parseFloat(semesterGPA(Number(semester)));
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
                          transition={{ duration: 1, delay: Number(semester) * 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
