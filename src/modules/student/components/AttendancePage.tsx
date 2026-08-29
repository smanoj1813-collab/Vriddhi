import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, CheckCircle, XCircle, Clock, AlertCircle,
  ChevronLeft, ChevronRight, BookOpen, Percent, Award
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { fetchAttendance, type StudentAttendanceRecord } from '../api/studentDataApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  subjectCode: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'onDuty' | 'medicalLeave' | 'excused' | string;
  checkInTime?: string;
  notes?: string;
}

interface MonthlyBreakdown {
  month: string;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

interface AttendanceSummary {
  percentage: number;
  requiredPercentage: number;
  totalDays: number;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

// ═══════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════════════
const STATUS_CONFIG: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  present: { icon: CheckCircle, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', label: 'Present' },
  absent: { icon: XCircle, bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-400', label: 'Absent' },
  late: { icon: Clock, bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', label: 'Late' },
  leave: { icon: AlertCircle, bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'On Leave' },
  medicalLeave: { icon: AlertCircle, bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Medical Leave' },
  onDuty: { icon: CheckCircle, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', label: 'On Duty' },
  excused: { icon: AlertCircle, bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Excused' },
};

const PIE_COLORS: Record<string, string> = {
  present: '#10b981', absent: '#ef4444', late: '#f59e0b', excused: '#3b82f6',
};

export const AttendancePage: React.FC<{ studentId?: string }> = ({ studentId: studentIdProp }) => {
  const { user } = useAuth();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useStudentProfile(user?.uid);
  const resolvedStudentId = studentIdProp || profile?.id || '';
  const collegeId = profile?.collegeId || user?.collegeId || '';

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (profileLoading) return;
    if (!resolvedStudentId || !collegeId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchAttendance(resolvedStudentId, collegeId)
      .then((data) => {
        if (cancelled) return;
        const mapped: AttendanceRecord[] = data.records.map((r) => ({
          id: r.id,
          date: r.date,
          subject: r.subject,
          subjectCode: r.subjectCode || '',
          status: r.status,
          checkInTime: r.checkInTime,
          notes: r.notes,
        }));
        setAllRecords(mapped);
        setSummary({
          percentage: data.percentage,
          requiredPercentage: data.requiredPercentage,
          totalDays: new Set(mapped.map((r) => r.date)).size,
          totalClasses: data.totalClasses,
          present: data.present,
          absent: data.absent,
          late: data.late,
          excused: data.excused,
          monthlyBreakdown: data.monthlyBreakdown,
        });
      })
      .catch((err) => {
        console.error('[AttendancePage] load failed:', err);
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load attendance records');
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [resolvedStudentId, collegeId, profileLoading]);

  const records = useMemo(
    () => allRecords.filter((r) => r.date.startsWith(selectedMonth)),
    [allRecords, selectedMonth]
  );

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const days: { date: number; records: AttendanceRecord[]; present: number; total: number }[] = [];
    for (let i = 0; i < firstDay; i++) days.push({ date: 0, records: [], present: 0, total: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRecords = records.filter(r => r.date === ds);
      const present = dayRecords.filter(r => r.status === 'present' || r.status === 'excused').length;
      days.push({ date: d, records: dayRecords, present, total: dayRecords.length });
    }
    return days;
  }, [records, calendarYear, calendarMonth]);

  const navigateMonth = (delta: number) => {
    let newMonth = calendarMonth + delta;
    let newYear = calendarYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
    setSelectedMonth(`${newYear}-${String(newMonth + 1).padStart(2, '0')}`);
  };

  const getDayColor = (present: number, total: number) => {
    if (total === 0) return 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400';
    const pct = present / total;
    if (pct >= 0.9) return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold';
    if (pct >= 0.75) return 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold';
    if (pct >= 0.5) return 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-bold';
    return 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-bold';
  };

  const pieData = summary ? [
    { name: 'Present', value: summary.present, color: PIE_COLORS.present },
    { name: 'Late', value: summary.late, color: PIE_COLORS.late },
    { name: 'Absent', value: summary.absent, color: PIE_COLORS.absent },
    { name: 'Excused', value: summary.excused, color: PIE_COLORS.excused },
  ].filter(d => d.value > 0) : [];

  const monthlyChartData = summary?.monthlyBreakdown.map(m => ({
    month: m.month.split(' ')[0], rate: m.percentage, present: m.present, absent: m.absent,
  })) || [];

  if (loading || profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Attendance Records...</p>
      </div>
    );
  }

  const error = profileError || loadError;
  if (error || !resolvedStudentId || !collegeId) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" role="alert">
        {error || 'Your account is not linked to a complete student profile. Contact your college administrator.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Attendance Record</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive session tracking, monthly trends and compliance status</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Rate</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${summary.percentage >= summary.requiredPercentage ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl md:text-3xl font-extrabold ${summary.percentage >= summary.requiredPercentage ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {summary.percentage}%
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Required Minimum: {summary.requiredPercentage}%</div>
          </div>

          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Classes</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{summary.totalClasses}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{summary.totalDays} Total Active Days</div>
          </div>

          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Present Sessions</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{summary.present}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{summary.late} marked with late entry</div>
          </div>

          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Absences</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-rose-700 dark:text-rose-400">{summary.absent}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{summary.excused} with verified leave</div>
          </div>
        </div>
      )}

      {/* Calendar & Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((d, i) => {
              if (d.date === 0) {
                return <div key={`empty-${i}`} className="h-16 rounded-xl bg-transparent" />;
              }
              const colorClass = getDayColor(d.present, d.total);
              return (
                <div
                  key={`day-${d.date}`}
                  className={`h-16 rounded-2xl border p-2 flex flex-col justify-between transition-all hover:scale-102 ${colorClass}`}
                >
                  <span className="text-xs font-bold">{d.date}</span>
                  {d.total > 0 && (
                    <span className="text-[10px] text-right font-bold">
                      {d.present}/{d.total}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="space-y-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Monthly Rate %</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
