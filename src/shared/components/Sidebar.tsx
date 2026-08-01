import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/hooks/useAuth'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isFaculty = user?.role === 'faculty'
  const isAdmin = user?.role === 'admin'
  const isHOD = user?.role === 'hod'
  const isMentor = user?.role === 'mentor'
  const isSuperAdmin = user?.role === 'superadmin'

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // Navigation items for Admin/HOD
  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/' },
    { id: 'students', label: 'Students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', path: '/students' },
    { id: 'attendance', label: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', path: '/attendance' },
    { id: 'class-schedule', label: 'Class Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/class-schedule' },
    // ═══════════════════════════════════════════════════════════════════════
    // NEW: Curriculum Mapping for Admin/HOD
    // ═══════════════════════════════════════════════════════════════════════
    { id: 'curriculum', label: 'Curriculum', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', path: '/admin/curriculum' },
    { id: 'assessments', label: 'Assessments', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/assessments' },
    { id: 'question-bank', label: 'Question Bank', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', path: '/question-bank' },
    { id: 'paper-generator', label: 'Paper Generator', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/paper-generator' },
    { id: 'journey', label: 'Journey', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', path: '/journey' },
    { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', path: '/analytics' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', path: '/settings' },
  ]

  // Faculty navigation items
  const facultyNavItems = [
    { id: 'faculty-dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/faculty' },
    { id: 'faculty-attendance', label: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', path: '/faculty/attendance' },
    // ═══════════════════════════════════════════════════════════════════════
    // NEW: My Curriculum for Faculty
    // ═══════════════════════════════════════════════════════════════════════
    { id: 'faculty-curriculum', label: 'My Curriculum', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', path: '/faculty/curriculum' },
    { id: 'faculty-topics', label: 'Topics', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', path: '/faculty/topics' },
    { id: 'faculty-papers', label: 'Papers', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/faculty/papers' },
    { id: 'faculty-question-bank', label: 'Question Bank', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', path: '/faculty/question-bank' },
    { id: 'faculty-paper-generator', label: 'Paper Generator', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/faculty/paper-generator' },
    { id: 'faculty-student-analysis', label: 'Student Analysis', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', path: '/faculty/student-analysis' },
    { id: 'faculty-reschedule', label: 'Reschedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/faculty/reschedule' },
    { id: 'faculty-upload-material', label: 'Upload Material', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', path: '/faculty/upload-material' },
    { id: 'faculty-announcements', label: 'Announcements', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', path: '/faculty/announcements' },
    { id: 'faculty-assignments', label: 'Assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', path: '/faculty/assignments' },
    { id: 'faculty-calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/faculty/calendar' },
    // ═══════════════════════════════════════════════════════════════════════
    // NEW: AI Question Generator
    // ═══════════════════════════════════════════════════════════════════════
    { id: 'faculty-ai-questions', label: 'AI Question Generator', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', path: '/faculty/ai-questions' },
  ]

  // Super Admin navigation items
  const superAdminNavItems = [
    { id: 'sa-colleges', label: 'Colleges', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', path: '/superadmin/colleges' },
    { id: 'sa-create-college', label: 'Create College', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', path: '/superadmin/colleges/create' },
    { id: 'sa-create-admin', label: 'Create Admin', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', path: '/superadmin/create-admin' },
    { id: 'sa-curriculum', label: 'Curriculum', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', path: '/superadmin/curriculum' },
    { id: 'sa-user-import', label: 'User Import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', path: '/superadmin/user-import' },
  ]

  const navItems = isFaculty ? facultyNavItems : (isSuperAdmin ? [] : adminNavItems)

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <aside className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 z-50 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">Vriddhi</h1>
              <p className="text-slate-400 text-xs">Academic Management</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {/* Role Badge */}
        {!isCollapsed && (
          <div className="px-3 py-2 mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isFaculty ? 'Faculty' : isAdmin ? 'Admin' : isHOD ? 'HOD' : isMentor ? 'Mentor' : isSuperAdmin ? 'Super Admin' : 'User'}
            </span>
          </div>
        )}

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <>
            {!isCollapsed && (
              <div className="px-3 py-2 mt-2">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
            )}
            {superAdminNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </>
        )}

        {/* Regular Nav Items (for non-superadmin) */}
        {!isSuperAdmin && navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'A'}</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || 'Admin User'}</p>
              <p className="text-slate-400 text-xs capitalize">{user?.role || 'Admin'}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar