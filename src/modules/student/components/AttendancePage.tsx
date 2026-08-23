import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, CheckCircle, XCircle, Clock, AlertCircle,
  ChevronLeft, ChevronRight, BookOpen, Percent
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
// STATUS CONFIG (real Firestore statuses from attendanceRecords)
// ═══════════════════════════════════════════════════════════════════
const STATUS_CONFIG: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  present: { icon: CheckCircle, bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Present' },
  absent: { icon: XCircle, bg: 'bg-red-500/15', text: 'text-red-400', label: 'Absent' },
  late: { icon: Clock, bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Late' },
  leave: { icon: AlertCircle, bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'On Leave' },
  medicalLeave: { icon: AlertCircle, bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Medical Leave' },
  onDuty: { icon: CheckCircle, bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'On Duty' },
  excused: { icon: AlertCircle, bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Excused' },
};

const PIE_COLORS: Record<string, string> = {
  present: '#10b981', absent: '#ef4444', late: '#f59e0b', excused: '#3b82f6',
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════
export const AttendancePage: React.FC<{ studentId?: string }> = ({ studentId: studentIdProp }) => {
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid);
  const resolvedStudentId = studentIdProp || profile?.id || user?.uid || '';

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Fetch all attendance records once from Firestore.
  useEffect(() => {
    if (!resolvedStudentId) return;
    let cancelled = false;
    setLoading(true);
    fetchAttendance(resolvedStudentId)
      .then((data) => {
        if (cancelled) return;
        const mapped: AttendanceRecord[] = data.records.map((r: StudentAttendanceRecord) => ({
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
      .catch((err) => console.error('[AttendancePage] load failed:', err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [resolvedStudentId]);

  // Records for the selected month (client-side filter)
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
    if (total === 0) return 'bg-slate-800/30 border-slate-700/20';
    const pct = present / total;
    if (pct >= 0.9) return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
    if (pct >= 0.75) return 'bg-blue-500/20 border-blue-500/40 text-blue-400';
    if (pct >= 0.5) return 'bg-amber-500/20 border-amber-500/40 text-amber-400';
    return 'bg-red-500/20 border-red-500/40 text-red-400';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400" />
          <p className="text-slate-400 text-sm">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Attendance</h1>
        <p className="text-slate-400 text-sm">Track your daily attendance and monthly progress</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Attendance %</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${summary.percentage >= summary.requiredPercentage ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                <Percent className={`w-4 h-4 ${summary.percentage >= summary.requiredPercentage ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${summary.percentage >= summary.requiredPercentage ? 'text-emerald-400' : 'text-red-400'}`}>{summary.percentage}%</div>
            <div className="text-xs text-slate-500 mt-1">Required: {summary.requiredPercentage}%</div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Total Classes</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center"><BookOpen className="w-4 h-4 text-blue-400" /></div>
            </div>
            <div className="text-3xl font-bold text-white">{summary.totalClasses}</div>
            <div className="text-xs text-slate-500 mt-1">{summary.totalDays} days attended</div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Present</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-400" /></div>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{summary.present}</div>
            <div className="text-xs text-slate-500 mt-1">{Math.round((summary.present / summary.totalClasses) * 100)}% of total</div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Absent</span>
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center"><XCircle className="w-4 h-4 text-red-400" /></div>
            </div>
            <div className="text-3xl font-bold text-red-400">{summary.absent}</div>
            <div className="text-xs text-slate-500 mt-1">{Math.round((summary.absent / summary.totalClasses) * 100)}% of total</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Calendar */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-slate-300" />
                </button>
                <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => (
                <div key={idx} className={`aspect-square rounded-xl border p-2 flex flex-col justify-between transition-all
                  ${day.date === 0 ? 'opacity-0 pointer-events-none' : getDayColor(day.present, day.total)}
                  ${day.total > 0 ? 'hover:scale-[1.05] cursor-pointer' : ''}`}
                  title={day.total > 0 ? `${day.present}/${day.total} present` : ''}>
                  {day.date > 0 && (
                    <>
                      <span className={`text-sm font-medium ${day.total > 0 ? 'text-white' : 'text-slate-600'}`}>{day.date}</span>
                      {day.total > 0 && <div className="text-[10px] font-bold text-center">{day.present}/{day.total}</div>}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500/60" /><span className="text-slate-400">≥90%</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500/60" /><span className="text-slate-400">75-89%</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500/60" /><span className="text-slate-400">50-74%</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500/40 border border-red-500/60" /><span className="text-slate-400">&lt;50%</span></div>
            </div>
          </div>

          {/* Daily Records Table */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Daily Records</h3>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Subject</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Check-in</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {records.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No attendance records found for this month.</td></tr>
                  ) : records.map(record => {
                    const cfg = STATUS_CONFIG[record.status];
                    const Icon = cfg.icon;
                    return (
                      <tr key={record.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-5 py-4 text-sm text-white">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                        <td className="px-5 py-4"><div><div className="text-sm font-medium text-white">{record.subject}</div><div className="text-xs text-slate-500">{record.subjectCode}</div></div></td>
                        <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.text}`}><Icon className="w-3.5 h-3.5" />{cfg.label}</span></td>
                        <td className="px-5 py-4 text-sm text-slate-400">{record.checkInTime || '-'}</td>
                        <td className="px-5 py-4 text-sm text-slate-400">{record.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">This Month</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} formatter={(value: any, name: any) => [`${value} classes`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-3 mt-2 flex-wrap">
                  {pieData.map(item => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-slate-400">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="text-center text-slate-500 py-8">No data</div>}
          </div>

          {/* Monthly Trend */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} formatter={(value: any) => [`${value}%`, 'Rate']} />
                <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 6-Month History */}
          {summary?.monthlyBreakdown && summary.monthlyBreakdown.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">6-Month History</h3>
              <div className="space-y-3">
                {summary.monthlyBreakdown.map((month) => (
                  <div key={month.month} className="p-3 rounded-xl bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white">{month.month}</span>
                      <span className={`text-sm font-bold ${month.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>{month.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${month.percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${month.percentage}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs text-slate-500">
                      <span>{month.present} present</span><span>{month.absent} absent</span><span>{month.total} total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AttendancePage;
