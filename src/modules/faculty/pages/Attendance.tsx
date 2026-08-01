// src/pages/Attendance.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Calendar, Check, X, Users, ChevronLeft, ChevronRight,
  Search, TrendingUp, GraduationCap, Building2, CalendarDays, BarChart3, Clock,
  AlertCircle, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { useAttendance } from '../../../modules/faculty/hooks/useAttendance';
import { CalendarDayData, AttendanceRecord, AttendanceStatus } from '../../../modules/faculty/types/attendance';
import { useAuth } from '../../auth/context/AuthContext';

// ─── NEW IMPORTS ───
import { useAttendanceExport, AdminExportRow } from '../../../modules/faculty/hooks/useAttendanceExport';
import { ExportButton } from '../../../components/shared/ExportButton';

type ViewMode = 'calendar' | 'list' | 'analytics';

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  Present: '#22c55e',
  Absent: '#ef4444',
  Late: '#f59e0b',
  Leave: '#3b82f6',
  OnDuty: '#8b5cf6',
  MedicalLeave: '#06b6d4',
};

const BRANCHES = ['BCom', 'BA', 'BSc', 'BBA', 'BCA'];
const BATCHES = ['2026', '2027', '2028', '2029'];

// ═══════════════════════════════════════════════════════════════════
// GET COLLEGE ID - tries multiple sources
// ═══════════════════════════════════════════════════════════════════

function getCollegeIdFromStorage(): string {
  // Try localStorage first (set during login)
  const fromStorage = localStorage.getItem('vriddhi_college_id');
  if (fromStorage) return fromStorage;

  // Try from user object in localStorage
  try {
    const userStr = localStorage.getItem('vriddhi_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.collegeId) return user.collegeId;
      if (user?.college?.id) return user.college.id;
    }
  } catch { /* ignore */ }

  return '';
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function Attendance() {
  const { user } = useAuth();
  const collegeId = user?.collegeId || getCollegeIdFromStorage();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const dateStr = selectedDate.toISOString().split('T')[0];

  // ═══════════════════════════════════════════════════════════════
  // REAL DATA HOOK - enableRealtime DISABLED to save reads
  // ═══════════════════════════════════════════════════════════════
  const {
    records: dayRecords,
    dailySummary,
    calendarData,
    branchStats,
    batchStats,
    monthlyTrend,
    loading,
    error,
    refresh,
    setFilters,
  } = useAttendance({
    collegeId,
    date: dateStr,
    branch: branchFilter,
    batch: batchFilter,
    enableRealtime: false, // ⚠️ DISABLED to prevent excessive reads
  });

  // Update filters when they change
  useEffect(() => {
    if (!collegeId) return;
    setFilters({
      date: dateStr,
      branch: branchFilter,
      batch: batchFilter,
    });
  }, [dateStr, branchFilter, batchFilter, setFilters, collegeId]);

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  const navigateDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const navigateMonth = (delta: number) => {
    let newMonth = calendarMonth + delta;
    let newYear = calendarYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
    setSelectedDate(new Date(newYear, newMonth, 1));
  };

  // ═══════════════════════════════════════════════════════════════
  // CALENDAR BUILDER
  // ═══════════════════════════════════════════════════════════════

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const days: (CalendarDayData | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = calendarData.find(c => c.date === ds);
      days.push(dayData || { date: ds, present: 0, absent: 0, total: 0, percentage: 0, hasData: false, sessions: 0 });
    }
    return days;
  }, [calendarYear, calendarMonth, calendarData]);

  const getDayColor = (percentage: number, hasData: boolean) => {
    if (!hasData) return 'bg-slate-800/50 border-slate-700/30';
    if (percentage >= 90) return 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30';
    if (percentage >= 75) return 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30';
    if (percentage >= 60) return 'bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30';
    return 'bg-red-500/20 border-red-500/40 hover:bg-red-500/30';
  };

  // ═══════════════════════════════════════════════════════════════
  // NEW: EXPORT
  // ═══════════════════════════════════════════════════════════════

  const { exportAdminAttendance, exporting: exportLoading } = useAttendanceExport();

  const handleExport = (format: 'csv' | 'excel') => {
    if (dayRecords.length === 0) {
      alert('No attendance records to export for the selected date.');
      return;
    }

    const rows: AdminExportRow[] = dayRecords.map((record) => ({
      date: dateStr,
      studentName: record.studentName || 'Unknown',
      regNo: record.regNo || record.studentId || 'N/A',
      branch: record.branch || '-',
      batch: record.batch || '-',
      division: record.division || '-',
      subject: record.subject || '-',
      subjectCode: record.subjectCode || '-',
      status: record.status || 'Unknown',
      markedBy: record.markedBy || 'System',
    }));

    exportAdminAttendance(format, rows, dateStr, branchFilter, batchFilter);
  };

  // ═══════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════

  const statsCards: StatCard[] = useMemo(() => {
    const cards: StatCard[] = [
      { label: 'Total Students', value: dailySummary?.total ?? 0, icon: Users, color: 'text-vriddhi-accent' },
      { label: 'Present', value: dailySummary?.present ?? 0, icon: Check, color: 'text-green-400' },
      { label: 'Absent', value: dailySummary?.absent ?? 0, icon: X, color: 'text-red-400' },
      { label: 'Attendance Rate', value: `${dailySummary?.percentage ?? 0}%`, icon: TrendingUp, color: 'text-vriddhi-accent' },
    ];
    if (dailySummary) {
      cards.push(
        { label: 'Late', value: dailySummary.late ?? 0, icon: Clock, color: 'text-amber-400' },
        { label: 'On Duty', value: dailySummary.onDuty ?? 0, icon: Building2, color: 'text-purple-400' }
      );
    }
    return cards;
  }, [dailySummary]);

  // ═══════════════════════════════════════════════════════════════
  // FILTERED RECORDS (for search in list view)
  // ═══════════════════════════════════════════════════════════════

  const filteredRecords = useMemo(() => {
    if (!search) return dayRecords;
    const q = search.toLowerCase();
    return dayRecords.filter(
      (r) =>
        r.studentName?.toLowerCase().includes(q) ||
        r.studentId?.toLowerCase().includes(q) ||
        r.regNo?.toLowerCase().includes(q) ||
        r.subject?.toLowerCase().includes(q)
    );
  }, [dayRecords, search]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (!collegeId) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No College Selected</h2>
          <p className="text-vriddhi-muted mb-4">
            Please log in again or ensure your college ID is stored in localStorage as 'vriddhi_college_id'.
          </p>
          <div className="text-left text-sm text-vriddhi-muted bg-slate-800/50 p-4 rounded-xl">
            <p className="font-medium text-white mb-2">Debug info:</p>
            <p>User: MANOJ S (Principal)</p>
            <p>Expected collegeId: NhARL0kWJof1JbnLGijV</p>
            <p className="mt-2 text-amber-400">Run in console:</p>
            <code className="block bg-slate-900 p-2 rounded mt-1 font-mono text-xs">
              localStorage.setItem('vriddhi_college_id', 'NhARL0kWJof1JbnLGijV')
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title mb-1">Attendance</h1>
          <p className="text-vriddhi-muted">Monitor attendance across branches and batches</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex bg-vriddhi-dark rounded-xl p-1">
            {([
              { key: 'calendar' as ViewMode, icon: CalendarDays, label: 'Calendar' },
              { key: 'list' as ViewMode, icon: Search, label: 'List' },
              { key: 'analytics' as ViewMode, icon: BarChart3, label: 'Analytics' },
            ]).map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setViewMode(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === key ? 'bg-vriddhi-accent text-slate-900' : 'text-vriddhi-muted hover:text-white'
                }`}>
                <Icon className="w-4 h-4" /><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* ─── NEW: Export Button ─── */}
          <ExportButton
            onExport={handleExport}
            exporting={exportLoading}
            hasData={dayRecords.length > 0}
            label="Export"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
          <button onClick={refresh} className="ml-auto text-red-400 hover:text-red-300 text-sm underline">Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.slice(0, 4).map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center gap-2 mb-2"><stat.icon className={`w-5 h-5 ${stat.color}`} /><span className="text-sm text-vriddhi-muted">{stat.label}</span></div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex items-center gap-2 bg-vriddhi-dark rounded-xl p-2">
            <button onClick={() => viewMode === 'calendar' ? navigateMonth(-1) : navigateDate(-1)} className="p-2 rounded-lg hover:bg-vriddhi-border/50">
              <ChevronLeft className="w-5 h-5 text-vriddhi-muted" />
            </button>
            <div className="flex items-center gap-2 px-4 min-w-[180px] justify-center">
              <Calendar className="w-5 h-5 text-vriddhi-accent" />
              <span className="text-white font-medium">
                {viewMode === 'calendar'
                  ? new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <button onClick={() => viewMode === 'calendar' ? navigateMonth(1) : navigateDate(1)} className="p-2 rounded-lg hover:bg-vriddhi-border/50">
              <ChevronRight className="w-5 h-5 text-vriddhi-muted" />
            </button>
          </div>
          <div className="flex gap-3 flex-1 justify-end flex-wrap">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vriddhi-muted" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="input-field pl-10 w-40"
              >
                <option value="all">All Branches</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vriddhi-muted" />
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="input-field pl-10 w-40"
              >
                <option value="all">All Batches</option>
                {BATCHES.map(b => <option key={b} value={b}>Batch {b}</option>)}
              </select>
            </div>
            {viewMode === 'list' && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vriddhi-muted" />
                <input
                  type="text"
                  placeholder="Search student name, USN or reg no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-12"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">{new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500/60" /><span className="text-vriddhi-muted">≥90%</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500/60" /><span className="text-vriddhi-muted">75-89%</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500/60" /><span className="text-vriddhi-muted">60-74%</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500/40 border border-red-500/60" /><span className="text-vriddhi-muted">&lt;60%</span></div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center text-xs font-medium text-vriddhi-muted py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => (
                  <div key={idx}
                    onClick={() => day?.hasData && setSelectedDate(new Date(day.date))}
                    className={`aspect-square rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer
                      ${day ? getDayColor(day.percentage, day.hasData) : 'opacity-0 pointer-events-none'}
                      ${day?.hasData ? 'hover:scale-[1.02]' : ''}`}>
                    {day && (
                      <>
                        <span className={`text-sm font-medium ${day.hasData ? 'text-white' : 'text-slate-500'}`}>{new Date(day.date).getDate()}</span>
                        {day.hasData && (
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-white">{day.percentage}%</div>
                            <div className="flex gap-1"><div className="h-1 flex-1 rounded-full bg-green-500/60" style={{ width: `${(day.present/day.total)*100}%` }} /></div>
                            <div className="text-[10px] text-vriddhi-muted">{day.present}/{day.total}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {/* Daily Pie Chart */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
              {dailySummary && dailySummary.total > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={[
                        {name:'Present',value:dailySummary.present,color:'#22c55e'},
                        {name:'Absent',value:dailySummary.absent,color:'#ef4444'},
                        {name:'Late',value:dailySummary.late||0,color:'#f59e0b'},
                        {name:'Leave',value:dailySummary.leave||0,color:'#3b82f6'}
                      ]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                        {[{c:'#22c55e'},{c:'#ef4444'},{c:'#f59e0b'},{c:'#3b82f6'}].map((e,i)=><Cell key={i} fill={e.c}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-vriddhi-muted">Total</span><span className="text-white font-medium">{dailySummary.total}</span></div>
                    <div className="flex justify-between"><span className="text-vriddhi-muted">Rate</span><span className="text-white font-medium">{dailySummary.percentage}%</span></div>
                    <div className="flex justify-between"><span className="text-green-400">Present</span><span className="text-green-400 font-medium">{dailySummary.present}</span></div>
                    <div className="flex justify-between"><span className="text-red-400">Absent</span><span className="text-red-400 font-medium">{dailySummary.absent}</span></div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-vriddhi-muted py-8">
                  {loading ? 'Loading...' : 'No data for selected date'}
                </div>
              )}
            </div>
            {/* Branch Stats */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Branch-wise</h3>
              <div className="space-y-3">
                {branchStats.length > 0 ? branchStats.map(branch => (
                  <div key={branch.branch} className="p-3 rounded-xl bg-vriddhi-dark/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{branch.branch}</span>
                      <span className={`text-sm font-bold ${branch.percentage >= 75 ? 'text-green-400' : 'text-red-400'}`}>{branch.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${branch.percentage >= 75 ? 'bg-green-500' : branch.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${branch.percentage}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-vriddhi-muted">
                      <span>{branch.present} present</span><span>{branch.absent} absent</span><span>{branch.total} total</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-vriddhi-muted py-4">No branch data</div>
                )}
              </div>
            </div>
            {/* Batch Stats */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Batch-wise</h3>
              <div className="space-y-3">
                {batchStats.length > 0 ? batchStats.map(batch => (
                  <div key={batch.batch} className="p-3 rounded-xl bg-vriddhi-dark/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">Batch {batch.batch}</span>
                      <span className={`text-sm font-bold ${batch.percentage >= 75 ? 'text-green-400' : 'text-red-400'}`}>{batch.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${batch.percentage >= 75 ? 'bg-green-500' : batch.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${batch.percentage}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-vriddhi-muted">
                      <span>{batch.present} present</span><span>{batch.absent} absent</span><span>{batch.total} total</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-vriddhi-muted py-4">No batch data</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="table-container">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-vriddhi-border">
                      <th className="table-header">Student</th>
                      <th className="table-header">Reg No</th>
                      <th className="table-header">Branch</th>
                      <th className="table-header">Batch</th>
                      <th className="table-header">Division</th>
                      <th className="table-header">Subject</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => (
                      <tr key={record.id} className="hover:bg-vriddhi-dark/30 transition-colors">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-vriddhi-accent/20 flex items-center justify-center text-vriddhi-accent font-semibold text-sm">
                              {record.studentName?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium">{record.studentName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="table-cell font-mono text-sm">{record.regNo || record.studentId}</td>
                        <td className="table-cell">
                          <span className="px-2 py-1 rounded-lg bg-vriddhi-accent/10 text-vriddhi-accent text-xs font-medium">{record.branch || '-'}</span>
                        </td>
                        <td className="table-cell text-sm text-vriddhi-muted">{record.batch || '-'}</td>
                        <td className="table-cell text-sm text-vriddhi-muted">{record.division || '-'}</td>
                        <td className="table-cell">
                          <div>
                            <div className="text-sm text-white">{record.subject}</div>
                            <div className="text-xs text-vriddhi-muted">{record.subjectCode}</div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            record.status === 'Present' ? 'bg-green-500/20 text-green-400' :
                            record.status === 'Absent' ? 'bg-red-500/20 text-red-400' :
                            record.status === 'Late' ? 'bg-amber-500/20 text-amber-400' :
                            record.status === 'Leave' ? 'bg-blue-500/20 text-blue-400' :
                            record.status === 'OnDuty' ? 'bg-purple-500/20 text-purple-400' :
                            record.status === 'MedicalLeave' ? 'bg-cyan-500/20 text-cyan-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>{record.status}</span>
                        </td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={7} className="table-cell text-center text-vriddhi-muted py-12">
                          {loading ? 'Loading records...' : 'No attendance records found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Today\'s Overview</h3>
              {dailySummary && dailySummary.total > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={[
                        {name:'Present',value:dailySummary.present,color:'#22c55e'},
                        {name:'Absent',value:dailySummary.absent,color:'#ef4444'},
                        {name:'Late',value:dailySummary.late||0,color:'#f59e0b'},
                        {name:'Leave',value:dailySummary.leave||0,color:'#3b82f6'},
                        {name:'OnDuty',value:dailySummary.onDuty||0,color:'#8b5cf6'},
                        {name:'Medical',value:dailySummary.medicalLeave||0,color:'#06b6d4'}
                      ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {[{c:'#22c55e'},{c:'#ef4444'},{c:'#f59e0b'},{c:'#3b82f6'},{c:'#8b5cf6'},{c:'#06b6d4'}].map((e,i)=><Cell key={i} fill={e.c}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2 flex-wrap">
                    {[
                      {name:'Present',value:dailySummary.present,color:'#22c55e'},
                      {name:'Absent',value:dailySummary.absent,color:'#ef4444'},
                      {name:'Late',value:dailySummary.late||0,color:'#f59e0b'}
                    ].map(item => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-vriddhi-muted">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-vriddhi-muted py-8">
                  {loading ? 'Loading...' : 'No data available'}
                </div>
              )}
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Branch Summary</h3>
              <div className="space-y-3">
                {branchStats.length > 0 ? branchStats.map(b => (
                  <div key={b.branch} className="flex items-center justify-between p-2 rounded-lg bg-vriddhi-dark/30">
                    <span className="text-sm text-white">{b.branch}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${b.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${b.percentage}%` }} />
                      </div>
                      <span className={`text-sm font-bold ${b.percentage >= 75 ? 'text-green-400' : 'text-red-400'}`}>{b.percentage}%</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-vriddhi-muted py-4">No data</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {viewMode === 'analytics' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Attendance Trend — {calendarYear}</h3>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrend}>
                  <defs><linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} formatter={(value: any) => [`${value}%`, 'Attendance Rate']} />
                  <Area type="monotone" dataKey="rate" stroke="#6366f1" fillOpacity={1} fill="url(#colorRate)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-vriddhi-muted py-12">No trend data available</div>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Branch Comparison</h3>
              {branchStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={branchStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="branch" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                    <Bar dataKey="present" fill="#22c55e" radius={[4,4,0,0]} name="Present" />
                    <Bar dataKey="absent" fill="#ef4444" radius={[4,4,0,0]} name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-vriddhi-muted py-8">No branch data</div>
              )}
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Batch Comparison</h3>
              {batchStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={batchStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="batch" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                    <Bar dataKey="present" fill="#22c55e" radius={[4,4,0,0]} name="Present" />
                    <Bar dataKey="absent" fill="#ef4444" radius={[4,4,0,0]} name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-vriddhi-muted py-8">No batch data</div>
              )}
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Status Distribution</h3>
            {dailySummary && dailySummary.total > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries({
                  Present: dailySummary.present,
                  Absent: dailySummary.absent,
                  Late: dailySummary.late,
                  Leave: dailySummary.leave,
                  'On Duty': dailySummary.onDuty,
                  'Medical': dailySummary.medicalLeave,
                }).map(([status, count]) => (
                  <div key={status} className="p-4 rounded-xl bg-vriddhi-dark/50 text-center">
                    <div className="text-2xl font-bold text-white mb-1">{count || 0}</div>
                    <div className="text-xs text-vriddhi-muted">{status}</div>
                    <div className="w-full h-1 rounded-full mt-2" style={{ backgroundColor: STATUS_COLORS[status.replace(' ', '') as AttendanceStatus] || '#64748b' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-vriddhi-muted py-8">No data available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
