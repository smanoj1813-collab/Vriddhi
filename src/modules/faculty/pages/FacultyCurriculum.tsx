// ═══════════════════════════════════════════════════════════════════════
// pages/faculty/FacultyCurriculum.tsx — Faculty: View Assigned Curriculum
// Tailwind CSS — matches FacultyTopics.tsx & FacultyAttendance.tsx patterns
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, Clock, GraduationCap, Calendar, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, Layers, MapPin, Users,
  RefreshCw, Loader2, Search, Play, FileText, Timer
} from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'
import { useFacultyCurriculum } from '../hooks/useFacultyCurriculum'
import type { ParsedModule, FacultyCurriculumView, FacultyScheduleItem, FacultyCurriculumStats } from '../types/curriculum'

// ─── Component ───────────────────────────────────────────────────────────

export default function FacultyCurriculum() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const facultyId = user?.id || ''
  const collegeId = (user as any)?.collegeId || ''

  const {
    curriculum,
    schedules,
    stats,
    loading,
    error,
    selectedCourse,
    setSelectedCourse,
    refresh,
    refreshSchedule,
    getCourseModules,
    getCourseSchedule,
    getTodaySchedule,
    getUpcomingSchedule,
  } = useFacultyCurriculum(facultyId, collegeId)

  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'modules' | 'schedule'>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // ─── Derived Data ────────────────────────────────────────────────────
  const filteredCurriculum = useMemo(() => {
    if (!searchQuery) return curriculum
    const q = searchQuery.toLowerCase()
    return curriculum.filter((c: FacultyCurriculumView) =>
      c.courseName.toLowerCase().includes(q) ||
      c.courseCode.toLowerCase().includes(q) ||
      c.branch.toLowerCase().includes(q)
    )
  }, [curriculum, searchQuery])

  const selectedCourseData = useMemo(() =>
    curriculum.find((c: FacultyCurriculumView) => c.courseId === selectedCourse),
  [curriculum, selectedCourse])

  const courseModules = useMemo(() =>
    selectedCourse ? getCourseModules() : [],
  [selectedCourse, getCourseModules])

  const courseSchedule = useMemo(() =>
    selectedCourse ? getCourseSchedule() : [],
  [selectedCourse, getCourseSchedule])

  const todaySchedule = useMemo(() => getTodaySchedule(), [getTodaySchedule])
  const upcomingSchedule = useMemo(() => getUpcomingSchedule(), [getUpcomingSchedule])

  // ─── Loading State ───────────────────────────────────────────────────
  if (loading && curriculum.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400">Loading your curriculum...</p>
      </div>
    )
  }

  // ─── Error State ─────────────────────────────────────────────────────
  if (error && curriculum.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-rose-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-2">Failed to Load</h2>
        <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400 text-center max-w-md">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-teal-600 text-slate-900 dark:text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/faculty"
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500/30 text-slate-500 dark:text-slate-600 dark:text-slate-400 hover:text-teal-500 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-900 dark:text-white">My Curriculum</h1>
          <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400">
            Assigned courses, modules, and teaching schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { refresh(); refreshSchedule(); }}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500/30 text-slate-500 dark:text-slate-600 dark:text-slate-400 hover:text-teal-500 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400 mb-1">Courses</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-900 dark:text-white">{stats.totalCourses}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-blue-400 mb-1">Modules</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalModules}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400 mb-1">Total Hours</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalHours}h</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 mb-1">Credits</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.totalCredits}</p>
          </div>
        </div>
      )}

      {/* Today's Classes */}
      {todaySchedule.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Today's Classes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaySchedule.map((cls: FacultyScheduleItem) => (
              <div
                key={cls.id}
                className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20 hover:border-teal-500/40 transition-all cursor-pointer"
                onClick={() => navigate('/faculty/attendance-marking')}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-900 dark:text-white">{cls.subject}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">{cls.subjectCode}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    cls.status === 'ongoing'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-500/20'
                  }`}>
                    {cls.status === 'ongoing' ? 'In Progress' : 'Upcoming'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {cls.startTime} - {cls.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {cls.room}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">
                  {cls.branch} · {cls.batch} · Sem {cls.semester}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-1">
        {(['overview', 'modules', 'schedule'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
              activeView === view
                ? 'text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW VIEW ─── */}
      {activeView === 'overview' && (
        <div>
          {curriculum.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 border-dashed">
              <BookOpen className="w-10 h-10 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400">No curriculum assigned yet</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500 mt-1">
                Contact your admin to get courses assigned to you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCurriculum.map((course: FacultyCurriculumView) => {
                const isExpanded = expandedCourse === course.courseId
                const courseSchedules = schedules.filter((s: FacultyScheduleItem) =>
                  s.subject === course.courseName || s.subjectCode === course.courseCode
                )
                const upcomingClasses = courseSchedules.filter((s: FacultyScheduleItem) => s.status === 'scheduled').length

                return (
                  <div
                    key={course.courseId}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    {/* Course Header */}
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors"
                      onClick={() => {
                        setExpandedCourse(isExpanded ? null : course.courseId)
                        setSelectedCourse(course.courseId)
                      }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-900 dark:text-white truncate">
                            {course.courseName}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-700 dark:text-slate-300">
                            {course.courseCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">
                          {course.branch} · Semester {course.semester} · {course.batch}
                          {course.division && ` · ${course.division}`}
                          {course.section && ` · ${course.section}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center hidden sm:block">
                          <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">Modules</p>
                          <p className="text-slate-900 dark:text-slate-900 dark:text-white font-medium">{course.modules.length}</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">Hours</p>
                          <p className="text-slate-900 dark:text-slate-900 dark:text-white font-medium">{course.totalHours}h</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">Credits</p>
                          <p className="text-slate-900 dark:text-slate-900 dark:text-white font-medium">{course.credits}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">Classes</p>
                          <p className="text-teal-400 font-medium">{upcomingClasses}</p>
                        </div>
                      </div>
                      <button className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Modules Preview */}
                          <div>
                            <h4 className="text-xs text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1">
                              <Layers className="w-3 h-3" /> Modules ({course.modules.length})
                            </h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {course.modules.map((mod: ParsedModule) => (
                                <div
                                  key={mod.id}
                                  className="p-3 rounded-lg bg-slate-200/50 dark:bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">
                                      Module {mod.moduleNo}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">
                                      {mod.hours}h
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{(mod.title || mod.moduleName || '')}</p>
                                  {mod.topics && mod.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {mod.topics.slice(0, 3).map((topic, i) => (
                                        <span
                                          key={i}
                                          className="text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                        >
                                          {topic}
                                        </span>
                                      ))}
                                      {mod.topics.length > 3 && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">+{mod.topics.length - 3} more</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Schedule Preview */}
                          <div>
                            <h4 className="text-xs text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Upcoming Classes
                            </h4>
                            {courseSchedules.length === 0 ? (
                              <p className="text-sm text-slate-500 dark:text-slate-600 dark:text-slate-400 py-4 text-center">
                                No scheduled classes yet
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {courseSchedules
                                  .filter((s: FacultyScheduleItem) => s.status === 'scheduled')
                                  .slice(0, 5)
                                  .map((cls: FacultyScheduleItem) => (
                                    <div
                                      key={cls.id}
                                      className="p-3 rounded-lg bg-slate-200/50 dark:bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {cls.startTime} - {cls.endTime}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs text-slate-500 dark:text-slate-400">Room {cls.room}</span>
                                        </div>
                                      </div>
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(cls.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => {
                              setSelectedCourse(course.courseId)
                              setActiveView('modules')
                            }}
                            className="flex-1 px-3 py-2 rounded-lg text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-100 dark:bg-teal-900/30 transition-all flex items-center justify-center gap-1"
                          >
                            <Layers className="w-3 h-3" /> View All Modules
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCourse(course.courseId)
                              setActiveView('schedule')
                            }}
                            className="flex-1 px-3 py-2 rounded-lg text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-100 dark:bg-blue-900/30 transition-all flex items-center justify-center gap-1"
                          >
                            <Calendar className="w-3 h-3" /> View Schedule
                          </button>
                          <button
                            onClick={() => navigate('/faculty/attendance-marking')}
                            className="flex-1 px-3 py-2 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" /> Mark Attendance
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── MODULES VIEW ─── */}
      {activeView === 'modules' && selectedCourseData && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">
                {selectedCourseData.courseName} — Modules
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-600 dark:text-slate-400">
                {selectedCourseData.courseCode} · {selectedCourseData.branch} · Semester {selectedCourseData.semester}
              </p>
            </div>
            <button
              onClick={() => setActiveView('overview')}
              className="text-sm text-teal-400 hover:text-teal-300"
            >
              ← Back to Overview
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courseModules.map((mod: ParsedModule) => (
              <div
                key={mod.id}
                className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 text-xs font-bold">
                      {mod.moduleNo}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-900 dark:text-white">
                        {(mod.title || mod.moduleName || '')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">
                        {mod.hours} hours · {mod.marks ?? 0} marks
                      </p>
                    </div>
                  </div>
                </div>

                {mod.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{mod.description}</p>
                )}

                {mod.topics && mod.topics.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400 mb-2">Topics:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.topics.map((topic, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {mod.learningOutcomes && mod.learningOutcomes.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400 mb-2">Learning Outcomes:</p>
                    <ul className="space-y-1">
                      {mod.learningOutcomes.map((outcome, i) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                          <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SCHEDULE VIEW ─── */}
      {activeView === 'schedule' && selectedCourseData && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-900 dark:text-white">
                {selectedCourseData.courseName} — Schedule
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-600 dark:text-slate-400">
                {selectedCourseData.courseCode} · {selectedCourseData.branch} · Semester {selectedCourseData.semester}
              </p>
            </div>
            <button
              onClick={() => setActiveView('overview')}
              className="text-sm text-teal-400 hover:text-teal-300"
            >
              ← Back to Overview
            </button>
          </div>

          {courseSchedule.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 border-dashed">
              <Calendar className="w-10 h-10 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400">No schedule entries yet</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500 mt-1">
                Your admin will schedule classes for this course.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseSchedule.map((cls: FacultyScheduleItem) => (
                <div
                  key={cls.id}
                  className={`p-4 rounded-xl border transition-all ${
                    cls.status === 'ongoing'
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : cls.status === 'completed'
                      ? 'bg-slate-100 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        cls.status === 'ongoing'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : cls.status === 'completed'
                          ? 'bg-slate-700 text-slate-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {cls.status === 'ongoing' ? (
                          <Play className="w-5 h-5" />
                        ) : cls.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-900 dark:text-white">
                            {cls.startTime} - {cls.endTime}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            cls.status === 'ongoing'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : cls.status === 'completed'
                              ? 'bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-600'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-500/20'
                          }`}>
                            {cls.status === 'ongoing' ? 'In Progress' : cls.status === 'completed' ? 'Completed' : 'Scheduled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Room {cls.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {cls.branch} {cls.batch} · Sem {cls.semester}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">
                        {new Date(cls.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      {cls.attendanceMarked && (
                        <span className="text-xs text-emerald-400 mt-1 block">Attendance marked</span>
                      )}
                    </div>
                  </div>

                  {cls.topicsPlanned && cls.topicsPlanned.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400 mb-2">Topics Planned:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cls.topicsPlanned.map((topic, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Course Selected for Modules/Schedule */}
      {(activeView === 'modules' || activeView === 'schedule') && !selectedCourseData && (
        <div className="p-12 text-center rounded-xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 border-dashed">
          <BookOpen className="w-10 h-10 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400">Select a course from the Overview tab first</p>
          <button
            onClick={() => setActiveView('overview')}
            className="mt-3 text-sm text-teal-400 hover:text-teal-300"
          >
            Go to Overview
          </button>
        </div>
      )}
    </div>
  )
}