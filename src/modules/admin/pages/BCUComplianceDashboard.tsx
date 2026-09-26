import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import {
  calculateSchemeInternalMarks,
  checkSchemePassCriteria,
  DEFAULT_SCHEME_PACK,
} from '@/shared/utils/schemeEngine';
import { getCollegeSchemePack } from '../api/schemePackApi';
import type { UniversitySchemePack } from '@/shared/types/schemePack';
import {
  AlertTriangle, CheckCircle, BookOpen, Award, TrendingUp,
  Users, Calculator, FileText, GraduationCap, Clock
} from 'lucide-react';

function getCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id');
  if (!id) throw new Error('No college ID');
  return id;
}

export default function BCUComplianceDashboard() {
  // G1: everything on this page evaluates against the college's assigned
  // university scheme pack (BCU default when unassigned).
  const { data: packInfo } = useQuery({
    queryKey: ['bcuCompliancePack'],
    queryFn: () => getCollegeSchemePack(),
  });
  const pack: UniversitySchemePack = packInfo?.pack ?? DEFAULT_SCHEME_PACK;
  const minAtt = pack.attendance.minimumPercentage;
  const atRiskUpper = pack.attendance.marksSlabs[0]?.max ?? 80;
  const topSlab = pack.attendance.marksSlabs[pack.attendance.marksSlabs.length - 1];
  const seeMax = pack.semesterEndExam.defaultMaxMarks;
  const iaMax = pack.internalAssessment.totalMarks;
  const maxTotal = seeMax + iaMax;

  const { data: stats } = useQuery({
    queryKey: ['bcuComplianceStats'],
    // pack identity in the closure key so switching packs recomputes bands

    queryFn: async () => {
      const collegeId = getCollegeId();
      
      // Students
      const studentQuery = query(collection(db, 'students'), where('collegeId', '==', collegeId), limit(500));
      const studentSnap = await getDocs(studentQuery);
      const students = studentSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      // Attendance records
      const attendanceQuery = query(collection(db, 'attendanceRecords'), where('collegeId', '==', collegeId), limit(500));
      const attendanceSnap = await getDocs(attendanceQuery);
      const attendanceRecords = attendanceSnap.docs.map(d => d.data() as any);

      // Calculate per-student attendance
      const attendanceByStudent = new Map<string, { present: number; total: number }>();
      attendanceRecords.forEach(rec => {
        const sid = rec.studentId;
        if (!attendanceByStudent.has(sid)) {
          attendanceByStudent.set(sid, { present: 0, total: 0 });
        }
        const entry = attendanceByStudent.get(sid)!;
        entry.total++;
        if (rec.status === 'present' || rec.status === 'onDuty') entry.present++;
      });

      const eligibilityStats = {
        eligible: 0,
        notEligible: 0,
        atRisk: 0, // 75-80%
        excellent: 0, // 91%+
      };

      const iaStats = {
        avgIAMarks: 0,
        totalStudents: students.length,
      };

      attendanceByStudent.forEach(({ present, total }) => {
        const perc = total > 0 ? (present / total) * 100 : 100;
        if (perc >= (topSlab?.min ?? 91)) eligibilityStats.excellent++;
        if (perc >= minAtt) eligibilityStats.eligible++;
        else eligibilityStats.notEligible++;
        if (perc >= minAtt && perc <= atRiskUpper) eligibilityStats.atRisk++;
      });

      // If no attendance data, assume all eligible
      if (attendanceByStudent.size === 0) {
        eligibilityStats.eligible = students.length;
      }

      return {
        totalStudents: students.length,
        ...eligibilityStats,
        attendanceCoverage: attendanceByStudent.size,
        iaStats,
      };
    },
  });

  // Sample: solid-marks student, scaled to whatever the pack's maxima are.
  const sampleIAMarks = calculateSchemeInternalMarks(
    {
      testMarks: [0.8, 0.9, 0.8].slice(0, pack.internalAssessment.test.count)
        .map((f) => +(pack.internalAssessment.test.maxMarksEach * f).toFixed(1)),
      assignmentMarks: +(pack.internalAssessment.assignmentMaxMarks * 0.8).toFixed(1),
      attendancePercentage: 85,
    },
    pack,
  );

  const samplePass = checkSchemePassCriteria(
    {
      semesterEndMarks: +(seeMax * 0.5625).toFixed(1),
      internalMarks: +(iaMax * 0.75).toFixed(1),
    },
    pack,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="text-teal-600" />
          {pack.name} Compliance
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {pack.universityName} — {pack.schemeName} · {seeMax}+{iaMax} marks split · Attendance, IA Marks, Pass Criteria
          {packInfo?.schemePackId ? '' : ' (default pack — assign one under Scheme Packs)'}
        </p>
      </div>

      {/* Eligibility Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600">
              <CheckCircle size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Eligible</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats?.eligible || 0}</p>
          <p className="text-xs text-slate-500 mt-1">≥{minAtt}% attendance - Can write exam</p>
          <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats?.totalStudents ? (stats.eligible / stats.totalStudents) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-rose-600">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Not Eligible</span>
          </div>
          <p className="text-2xl font-black text-rose-600">{stats?.notEligible || 0}</p>
          <p className="text-xs text-slate-500 mt-1">&lt;{minAtt}% - {pack.attendance.blocksExamEligibility ? `Blocked per ${pack.code}` : 'pack does not block'}</p>
          <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${stats?.totalStudents ? (stats.notEligible / stats.totalStudents) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">At Risk</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{stats?.atRisk || 0}</p>
          <p className="text-xs text-slate-500 mt-1">{minAtt}-{atRiskUpper}% - Lowest IA slab</p>
        </div>

        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/50 rounded-xl text-teal-600">
              <Award size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Excellent</span>
          </div>
          <p className="text-2xl font-black text-teal-600">{stats?.excellent || 0}</p>
          <p className="text-xs text-slate-500 mt-1">{topSlab?.min ?? 91}%+ - {topSlab?.marks ?? 5} marks in IA</p>
        </div>
      </div>

      {/* BCU Rules */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attendance Marks */}
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Calculator size={18} className="text-teal-600" />
            Attendance Marks ({pack.code})
          </h3>
          <div className="space-y-2">
            {[
              ...([...pack.attendance.marksSlabs].reverse().map((s, i) => ({
                range: `${s.min}% - ${s.max}%`,
                marks: s.marks,
                color: ['emerald', 'teal', 'blue', 'amber'][Math.min(i, 3)],
                label: `${s.label} - ${s.marks} marks`,
                eligible: true,
              }))),
              { range: `Below ${minAtt}%`, marks: 0, color: 'rose', label: pack.attendance.blocksExamEligibility ? 'Not Eligible - Blocked' : 'Below floor - EB discretion', eligible: false },
            ].map(row => (
              <div key={row.range} className={`flex items-center justify-between p-3 rounded-xl border ${
                row.eligible ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-slate-900 dark:text-white bg-${row.color}-500`}
                    style={{ backgroundColor: row.color === 'emerald' ? '#10b981' : row.color === 'teal' ? '#14b8a6' : row.color === 'blue' ? '#3b82f6' : row.color === 'amber' ? '#f59e0b' : '#ef4444' }}>
                    {row.marks}
                  </span>
                  <span className="text-sm font-medium">{row.range}</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  row.eligible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {row.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>Source:</strong> {pack.sourceNote || pack.name}. 
              {`A student shall be considered to have satisfied attendance if he/she has attended not less than ${minAtt}% in aggregate`}
            </p>
          </div>
        </div>

        {/* IA Marks */}
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-teal-600" />
            Internal Assessment ({iaMax} Marks) — {pack.code}
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-xl">
              <h4 className="font-bold text-sm text-teal-900 dark:text-teal-100">Sample Calculation</h4>
              <div className="mt-2 space-y-1 text-xs text-teal-800 dark:text-teal-200">
                <p>Tests: <strong>{sampleIAMarks.testAverage}/{pack.internalAssessment.test.weightInTotal}</strong> (best {pack.internalAssessment.test.bestOf} of {pack.internalAssessment.test.count})</p>
                <p>Attendance: 85% → <strong>{sampleIAMarks.attendanceMarks}/{pack.internalAssessment.attendanceMaxMarks}</strong> marks (per {pack.code} slabs)</p>
                <p>Assignment: → <strong>{sampleIAMarks.assignmentMarks}/{pack.internalAssessment.assignmentMaxMarks}</strong></p>
                <p className="font-black text-sm pt-1 border-t border-teal-200 dark:border-teal-800 mt-2">
                  Total IA: {sampleIAMarks.totalIA}/{iaMax} — {sampleIAMarks.breakdown}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <p className="text-lg font-black text-teal-600">{sampleIAMarks.testAverage}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500">Tests ({pack.internalAssessment.test.weightInTotal})</p>
                <p className="text-xs text-slate-500 mt-1">Best {pack.internalAssessment.test.bestOf} of {pack.internalAssessment.test.count}</p>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <p className="text-lg font-black text-blue-600">{sampleIAMarks.attendanceMarks}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500">Attendance ({pack.internalAssessment.attendanceMaxMarks})</p>
                <p className="text-xs text-slate-500 mt-1">Per slab</p>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <p className="text-lg font-black text-amber-600">{sampleIAMarks.assignmentMarks}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500">Assignment ({pack.internalAssessment.assignmentMaxMarks})</p>
                <p className="text-xs text-slate-500 mt-1">Record book</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>NEP 2020 Pattern:</strong> C1=20% (test, seminar, assignment after 50% syllabus) + C2=20% (test, assignment, field work) + Semester End=60%. 
                Internal marks shown separately, no minimum for IA.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pass Criteria */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Award size={18} className="text-teal-600" />
          Pass Criteria — {pack.code}
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-sm mb-3">Minimum for Pass</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <span className="text-sm">University Exam (Theory)</span>
                <span className="font-bold text-sm">{pack.semesterEndExam.passPercentage}% ({Math.round(pack.semesterEndExam.passPercentage * seeMax / 100)}/{seeMax})</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <span className="text-sm">Aggregate (University + IA)</span>
                <span className="font-bold text-sm">{pack.passCriteria.aggregatePassPercentage}% ({Math.round(pack.passCriteria.aggregatePassPercentage * maxTotal / 100)}/{maxTotal})</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <span className="text-sm">Internal Assessment</span>
                <span className="font-bold text-sm text-emerald-600">{pack.passCriteria.minimumInternalPercentage > 0 ? `${pack.passCriteria.minimumInternalPercentage}% minimum` : 'No minimum'}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3">Sample Result</h4>
            <div className={`p-4 rounded-xl border ${samplePass.isPass ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                {samplePass.isPass ? <CheckCircle size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-rose-600" />}
                <span className={`font-bold text-sm ${samplePass.isPass ? 'text-emerald-900 dark:text-emerald-100' : 'text-rose-900 dark:text-rose-100'}`}>
                  {samplePass.isPass ? 'PASS' : 'FAIL'} - {samplePass.remarks}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                <div>University: {samplePass.aggregatePercentage !== undefined ? +(seeMax * 0.5625).toFixed(1) : ''}/{seeMax} ({samplePass.semesterEndPercentage}%)</div>
                <div>IA: {+(iaMax * 0.75).toFixed(1)}/{iaMax}</div>
                <div>Total: {samplePass.totalMarks}/{samplePass.maxTotal}</div>
                <div>Aggregate: {samplePass.aggregatePercentage}%</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Source: {pack.sourceNote || pack.name} — {`minimum ${pack.semesterEndExam.passPercentage}% in university examination and ${pack.passCriteria.aggregatePassPercentage}% in aggregate in each subject for pass`}
            </p>
          </div>
        </div>
      </div>

      {/* Grade System */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-teal-600" />
          Grade System (SGPA/CGPA) — {pack.code}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {pack.gradeTable.map((row, i, arr) => ({
            grade: row.grade,
            gp: row.gradePoint,
            label: row.description,
            range: row.minPercentage <= 0 && row.gradePoint === 0
              ? `< ${arr[i - 1]?.minPercentage ?? 35}%`
              : `${row.minPercentage}-${i === 0 ? 100 : (arr[i - 1]?.minPercentage ?? 100) - 1}%`,
          })).map(g => (
            <div key={g.grade} className="text-center p-3 border border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-lg font-black">{g.grade}</p>
              <p className="text-xs font-bold text-teal-600">{g.gp} GP</p>
              <p className="text-[10px] text-slate-500 mt-1">{g.range}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{g.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-6 text-white">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <FileText size={20} />
          Compliance Actions for Your College
        </h3>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-500/10 dark:bg-white/10 backdrop-blur rounded-xl p-4">
            <h4 className="font-bold text-sm">✅ Already in Vriddhi</h4>
            <ul className="text-sm mt-2 space-y-1 text-teal-50">
              <li>• Attendance tracking per student</li>
              <li>• IA marks calculation (needs BCU slab update)</li>
              <li>• Grade records & SGPA</li>
              <li>• Kannada + English medium support</li>
            </ul>
          </div>
          <div className="bg-slate-500/10 dark:bg-white/10 backdrop-blur rounded-xl p-4">
            <h4 className="font-bold text-sm">🚧 Needs Implementation</h4>
            <ul className="text-sm mt-2 space-y-1 text-teal-50">
              <li>• Auto-block &lt;75% attendance for hall tickets</li>
              <li>• Attendance → IA marks conversion (2-5 marks)</li>
              <li>• C1/C2 split for NEP 2020</li>
              <li>• 35% university + 40% aggregate pass check</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
