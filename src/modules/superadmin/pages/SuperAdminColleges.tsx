import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useColleges, useDeleteCollege } from '../hooks/useSuperAdmin'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import { Building2, Plus, Search, Filter, ArrowLeft, Trash2, MapPin, Users, GraduationCap, BookOpen } from 'lucide-react'
import type { College } from '../api/superAdminApi'

const SuperAdminColleges: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all')

  const { data, isLoading, refetch } = useColleges({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
  })
  const deleteCollege = useDeleteCollege()

  const colleges = data?.items || []

  const stats = {
    total: colleges.length,
    active: colleges.filter((c: College) => c.status === 'active').length,
    inactive: colleges.filter((c: College) => c.status === 'inactive').length,
    suspended: colleges.filter((c: College) => c.status === 'suspended').length,
    trial: colleges.filter((c: College) => c.status === 'trial').length,
    totalStudents: colleges.reduce((a: number, c: College) => a + (c.studentCount || 0), 0),
    totalFaculty: colleges.reduce((a: number, c: College) => a + (c.facultyCount || 0), 0),
  }

  const handleDelete = async (collegeId: string) => {
    if (!confirm('Are you sure you want to delete this college?')) return
    try {
      await deleteCollege.mutateAsync(collegeId)
      showSuccess('College deleted')
    } catch {
      showError('Failed to delete college')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-teal-400" />
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">College Management</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Manage all registered colleges</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/superadmin/colleges/new')}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add College
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Colleges</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Students</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalStudents.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Faculty</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalFaculty.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search colleges..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 appearance-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colleges.map((college: College) => (
          <div key={college.id} className="glass-card p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{college.shortName?.[0] || college.name[0]}</span>
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold">{college.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{college.code} &bull; {college.city || college.location || '—'}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                college.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                college.status === 'trial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                college.status === 'suspended' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {college.status === 'active' ? '● Active' : college.status === 'trial' ? '⏱ Trial' : college.status === 'suspended' ? '⏸ Suspended' : '● Inactive'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-center">
                <Users className="w-4 h-4 text-slate-600 dark:text-slate-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-white">{college.studentCount || 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Students</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-center">
                <GraduationCap className="w-4 h-4 text-slate-600 dark:text-slate-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-white">{college.facultyCount || 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Faculty</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-center">
                <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-white">{college.courses || 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Courses</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="capitalize">{college.plan} plan</span>
              {college.subscriptionEnd
                ? `Subscribed until ${new Date(college.subscriptionEnd).toLocaleDateString('en-IN')}`
                : 'No subscription'}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
              <button onClick={() => navigate(`/superadmin/colleges/${college.id}`)} className="flex-1 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 hover:bg-teal-100 dark:bg-teal-900/30 rounded-lg transition-colors">
                View Details
              </button>
              <button onClick={() => handleDelete(college.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {colleges.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No colleges found</p>
        </div>
      )}
    </div>
  )
}

export default SuperAdminColleges
