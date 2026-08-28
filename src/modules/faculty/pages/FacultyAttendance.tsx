import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Check, X, Clock, AlertCircle, FileMinus,
  Users, Calendar, Save, RotateCcw, Search, Pill,
  Loader2, AlertTriangle
} from 'lucide-react'
import { useFacultyAttendance } from '../hooks/useFacultyAttendance'
import { useAttendanceExport } from '../hooks/useAttendanceExport'
import { DateRangeSelector } from '../../../components/shared/DateRangeSelector'
import { ExportButton } from '../../../components/shared/ExportButton'
import type { AttendanceStatus, FacultyExportRow, FacultyStudent, FacultyClassSession } from '../types/attendance'
import type { DateRangeType } from '../hooks/useAttendanceExport'

const statusConfig: Record<AttendanceStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  Present: {
    label: 'Present',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: Check,
  },
  Absent: {
    label: 'Absent',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: X,
  },
  Late: {
    label: 'Late',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: Clock,
  },
  Leave: {
    label: 'Leave',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: FileMinus,
  },
  OnDuty: {
    label: 'On Duty',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: AlertCircle,
  },
  MedicalLeave: {
    label: 'Medical',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    icon: Pill,
  },
}

const allStatuses: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Leave', 'OnDuty', 'MedicalLeave'];

export default function FacultyAttendance() {
  const {
    selectedDate,
    setSelectedDate,
    classSessions,
    selectedClass,
    setSelectedClass,
    students,
    attendance,
    existingAttendance,
    loading,
    saving,
    error,
    saveSuccess,
    stats,
    updateStudentStatus,
    updateStudentNotes,
    setAllStatus,
    resetAttendance,
    handleSave,
  } = useFacultyAttendance();

  const { 
    exportFacultyAttendance, 
    exporting,
    selectedRangeType,
    setSelectedRangeType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    currentRange,
  } = useAttendanceExport();

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'all'>('all')

  const filteredStudents = useMemo(() => {
    return students.filter((s: FacultyStudent) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.regNo.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === 'all' || attendance[s.id]?.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [students, searchQuery, filterStatus, attendance])

  const getExportRows = (): FacultyExportRow[] => {
    return filteredStudents.map((student: FacultyStudent) => ({
      date: selectedClass?.date || selectedDate,
      timeSlot: selectedClass?.timeSlot || '',
      subject: selectedClass?.subject || 'Unknown',
      subjectCode: selectedClass?.subjectCode || '',
      branch: selectedClass?.branch || '',
      batch: selectedClass?.batch || '',
      division: selectedClass?.division || '',
      section: selectedClass?.section || '',
      room: selectedClass?.room || '',
      studentName: student.name,
      usn: student.usn,
      regNo: student.regNo,
      status: attendance[student.id]?.status || 'Present',
      notes: attendance[student.id]?.notes || '',
      markedBy: selectedClass?.facultyName || 'Faculty',
    }));
  };

  const hasAttendanceData = filteredStudents.length > 0;
  const isAttendanceAlreadySaved = !!existingAttendance;

  if (loading && students.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400">Loading class sessions and students...</p>
      </div>
    )
  }

  if (error && students.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-rose-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-2">Failed to Load</h2>
        <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400 text-center max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-slate-900 dark:text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (classSessions.length === 0 && !loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Calendar className="w-12 h-12 text-slate-600 dark:text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-2">No Classes Scheduled</h2>
        <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400 text-center max-w-md mb-4">
          No recurring or rescheduled classes were found for this date. Choose another date or contact your admin.
        </p>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <Link to="/faculty/schedule" className="mt-4 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400">
          View my weekly schedule
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/faculty"
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500/30 text-slate-500 dark:text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-900 dark:text-white">Mark Attendance</h1>
          <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400">
            {selectedClass
              ? `${selectedClass.subject} (${selectedClass.subjectCode}) • ${selectedClass.branch} • ${selectedClass.batch} • ${selectedClass.division} ${selectedClass.section} • ${selectedClass.timeSlot}`
              : "Select a class session"}
          </p>
        </div>
        {isAttendanceAlreadySaved && (
          <span className="ml-auto px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
            Already Saved
          </span>
        )}
      </div>

      <div className="mb-6 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-600 dark:text-slate-400">Class:</span>
            <select
              value={selectedClass?.id || ""}
              onChange={(e) => {
                const cls = classSessions.find((c: FacultyClassSession) => c.id === e.target.value)
                if (cls) setSelectedClass(cls)
              }}
              className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[280px]"
            >
              {classSessions.map((c: FacultyClassSession) => (
                <option key={c.id} value={c.id}>
                  {c.subject} ({c.subjectCode}) • {c.branch} {c.batch} • {c.division} {c.section} • {c.timeSlot} {c.attendanceMarked ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-600 dark:text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{students.length} students</span>
          </div>
          {selectedClass?.room && (
            <>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
              <span className="text-sm text-slate-500 dark:text-slate-600 dark:text-slate-400">Room: {selectedClass.room}</span>
            </>
          )}
        </div>
        {selectedClass?.topicsPlanned && selectedClass.topicsPlanned.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">Topics:</span>
            {selectedClass.topicsPlanned.map((topic: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs border border-blue-200 dark:border-blue-500/20">
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400">Present</span>
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.present}</p>
        </div>
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20">
          <div className="flex items-center gap-2 mb-1">
            <X className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span className="text-sm text-rose-600 dark:text-rose-400">Absent</span>
          </div>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{stats.absent}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-600 dark:text-amber-600 dark:text-amber-400">Late</span>
          </div>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-600 dark:text-amber-400">{stats.late}</p>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20">
          <div className="flex items-center gap-2 mb-1">
            <FileMinus className="w-4 h-4 text-purple-500 dark:text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-purple-600 dark:text-purple-600 dark:text-purple-400">Leave</span>
          </div>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-600 dark:text-purple-400">{stats.leave}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-blue-500 dark:text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-600 dark:text-blue-600 dark:text-blue-400">On Duty</span>
          </div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-600 dark:text-blue-400">{stats.onDuty}</p>
        </div>
        <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-500/5 border border-pink-200 dark:border-pink-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Pill className="w-4 h-4 text-pink-500 dark:text-pink-400" />
            <span className="text-sm text-pink-600 dark:text-pink-400">Medical</span>
          </div>
          <p className="text-xl font-bold text-pink-600 dark:text-emerald-400">{stats.medicalLeave}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAllStatus('Present')}
            className="px-3 py-1.5 rounded-lg text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
          >
            All Present
          </button>
          <button
            onClick={() => setAllStatus('Absent')}
            className="px-3 py-1.5 rounded-lg text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
          >
            All Absent
          </button>
          <button
            onClick={() => setAllStatus('Late')}
            className="px-3 py-1.5 rounded-lg text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-100 dark:bg-amber-900/30 transition-all"
          >
            All Late
          </button>
          <button
            onClick={resetAttendance}
            className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, USN, or reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | 'all')}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Leave">Leave</option>
            <option value="OnDuty">On Duty</option>
            <option value="MedicalLeave">Medical Leave</option>
          </select>

          <ExportButton
            onExport={(format: string) =>
              exportFacultyAttendance(
                format as any,
                getExportRows(),
                selectedClass?.subject || 'Class',
                selectedClass?.date || selectedDate
              )
            }
            exporting={exporting}
            hasData={hasAttendanceData}
            label="Export"
          />
        </div>
        
        {/* Date Range Selector for Reports */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <DateRangeSelector
            selectedType={selectedRangeType}
            onTypeChange={setSelectedRangeType as (type: DateRangeType) => void}
            customStartDate={customStartDate}
            onCustomStartChange={setCustomStartDate}
            customEndDate={customEndDate}
            onCustomEndChange={setCustomEndDate}
            currentRange={currentRange}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider w-12">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider">USN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider">Reg No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider">Batch/Div</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider">Notes</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredStudents.map((student: FacultyStudent, index: number) => {
                const status: AttendanceStatus = attendance[student.id]?.status || 'Present'
                const config = statusConfig[status]
                const StatusIcon = config.icon

                return (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-600 dark:text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-700 dark:text-slate-300">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-900 dark:text-white">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400 font-mono">{student.usn}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400 font-mono">{student.regNo}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400">
                      {student.batch} · {student.division}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          const current: AttendanceStatus = attendance[student.id]?.status || 'Present'
                          const nextIndex = (allStatuses.indexOf(current) + 1) % allStatuses.length
                          updateStudentStatus(student.id, allStatuses[nextIndex])
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-80 ${config.bg} ${config.color} ${config.border}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Add notes..."
                        value={attendance[student.id]?.notes || ''}
                        onChange={(e) => updateStudentNotes(student.id, e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:text-slate-900 dark:focus:text-white"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              student.attendancePercentage >= 85 ? 'bg-emerald-500' :
                              student.attendancePercentage >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(student.attendancePercentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          student.attendancePercentage >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                          student.attendancePercentage >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {student.attendancePercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-600 dark:text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No students found matching your criteria</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-600 dark:text-slate-400">
          Marked: {stats.present + stats.absent + stats.late + stats.leave + stats.onDuty + stats.medicalLeave} / {stats.total} students
          {isAttendanceAlreadySaved && existingAttendance && (
            <span className="ml-2 text-emerald-600 dark:text-emerald-400">
              • Previously saved at {new Date(existingAttendance.markedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || students.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-slate-900 dark:text-white hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : isAttendanceAlreadySaved ? 'Update Attendance' : 'Save Attendance'}
        </button>
      </div>

      {saveSuccess && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-lg">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Attendance saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shadow-lg">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  )
}