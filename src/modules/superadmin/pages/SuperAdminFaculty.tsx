import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFacultyList, useDeleteFaculty, useToggleFacultyStatus, useResetFacultyPassword, useColleges } from '../hooks/useSuperAdmin'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import {
  Users, Search, Filter, ArrowLeft, Trash2, Eye,
  GraduationCap, Mail, Phone, MapPin, Key,
  CheckCircle, XCircle, Download
} from 'lucide-react'
import type { Faculty } from '../api/superAdminApi'
import { collection, getDocs, updateDoc, doc, setDoc, deleteField } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { db } from '@/Firebase/config'
import { createFirebaseAuthUser } from '../api/superAdminApi'

const SuperAdminFaculty: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useNotification()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [collegeFilter, setCollegeFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetFacultyName, setResetFacultyName] = useState('')

  const { data: facultyData, isLoading } = useFacultyList({
    status: statusFilter,
    search: searchQuery || undefined,
  })
  const { data: collegesData } = useColleges()
  const deleteFaculty = useDeleteFaculty()
  const toggleStatus = useToggleFacultyStatus()
  const resetPasswordMutation = useResetFacultyPassword()

  const faculty = facultyData?.items || []
  const colleges = collegesData?.items || []

  const departments = Array.from(new Set(faculty.map(f => f.department).filter(Boolean)))

  const filteredFaculty = faculty.filter((f: Faculty) => {
    if (collegeFilter !== 'all' && f.collegeId !== collegeFilter) return false
    if (departmentFilter !== 'all' && f.department !== departmentFilter) return false
    return true
  })

  const stats = {
    total: filteredFaculty.length,
    active: filteredFaculty.filter((f: Faculty) => f.status === 'active').length,
    inactive: filteredFaculty.filter((f: Faculty) => f.status === 'inactive').length,
    hodCount: filteredFaculty.filter((f: Faculty) => f.isHOD).length,
  }

  const handleDelete = async (facultyId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    try {
      await deleteFaculty.mutateAsync(facultyId)
      showSuccess(`Faculty ${name} deleted successfully`)
    } catch {
      showError('Failed to delete faculty')
    }
  }

  const handleToggleStatus = async (facultyId: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await toggleStatus.mutateAsync({ facultyId, status: newStatus })
      showSuccess(`Faculty ${name} is now ${newStatus}`)
    } catch {
      showError('Failed to update status')
    }
  }

  const handleResetPassword = async (facultyId: string, name: string) => {
    try {
      const newPassword = await resetPasswordMutation.mutateAsync(facultyId)
      setResetPassword(newPassword)
      setResetFacultyName(name)
      setShowPasswordModal(true)
      showSuccess(`Password reset for ${name}`)
    } catch {
      showError('Failed to reset password')
    }
  }

  // FIX: Uses REST API (createFirebaseAuthUser) so it does NOT log out the current superadmin.
  // Also checks data.uid (not data.authUid) to match the field stored by importFaculty.
  const handleFixPasswords = async () => {
    if (!confirm('This will create Firebase Auth accounts for faculty without one. Continue?')) return
    try {
      const snap = await getDocs(collection(db, 'faculty'))
      let fixed = 0
      const newAccounts: Array<{ name: string; email: string; tempPassword: string }> = []

      for (const d of snap.docs) {
        const data = d.data()
        // Only create auth account if they don't have one already
        if (!data.uid) {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
          let tempPwd = ''
          for (let i = 0; i < 12; i++) tempPwd += chars.charAt(Math.floor(Math.random() * chars.length))

          // Create Firebase Auth user via REST API (does NOT affect current session)
          let uid: string
          try {
            uid = await createFirebaseAuthUser(data.email, tempPwd)
          } catch (authErr: any) {
            console.warn(`Skipping ${data.email}: ${authErr.message}`)
            continue
          }

          // Store ONLY the auth UID in Firestore, NEVER the password
          await updateDoc(doc(db, 'faculty', d.id), {
            uid,
            passwordResetRequired: true,
            // Remove any existing plaintext password field
            password: deleteField(),
          })

          // Also create users doc so they can log in
          await setDoc(doc(db, 'users', uid), {
            uid,
            email: data.email,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            role: 'faculty',
            collegeId: data.collegeId || '',
            department: data.department || '',
            phone: data.phone || '',
            avatar: data.profilePhotoUrl || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })

          newAccounts.push({ name: `${data.firstName} ${data.lastName}`, email: data.email, tempPassword: tempPwd })
          fixed++
        }
      }

      if (fixed > 0) {
        showSuccess(`Created ${fixed} secure auth accounts`)
        console.table(newAccounts)
        setResetPassword(newAccounts.map(p => `${p.name}: ${p.tempPassword}`).join('\n'))
        setResetFacultyName(`Created ${fixed} auth accounts - check console for temp passwords`)
        setShowPasswordModal(true)
      } else {
        showInfo('All faculty already have auth accounts')
      }
    } catch (err) {
      showError('Failed to create auth accounts: ' + (err as Error).message)
    }
  }

  const handleExportCSV = () => {
    const headers = ['Faculty ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'College', 'Status', 'HOD']
    const rows = filteredFaculty.map((f: Faculty) => [
      f.facultyId,
      `${f.firstName} ${f.lastName}`,
      f.email,
      f.phone,
      f.department,
      f.designation,
      f.collegeName,
      f.status,
      f.isHOD ? 'Yes' : 'No',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `faculty-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showSuccess('Faculty data exported')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Users className="w-6 h-6 text-teal-400" />
              <h1 className="text-2xl font-bold text-white">Manage Faculty</h1>
            </div>
            <p className="text-slate-400 text-sm">View, edit and manage all faculty members</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handleFixPasswords} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm">
            <Key className="w-4 h-4" /> Create Auth Accounts
          </button>
          <button onClick={() => navigate('/superadmin/faculty-import')} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm">
            <GraduationCap className="w-4 h-4" /> Import Faculty
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Faculty</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Inactive</p>
          <p className="text-2xl font-bold text-orange-400">{stats.inactive}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">HODs</p>
          <p className="text-2xl font-bold text-blue-400">{stats.hodCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, ID, department..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="pl-10 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none appearance-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <select
            value={collegeFilter}
            onChange={e => setCollegeFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none appearance-none"
          >
            <option value="all">All Colleges</option>
            {colleges.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {departments.length > 0 && (
          <div className="relative">
            <GraduationCap className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none appearance-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d: string) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Faculty Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Faculty</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Contact</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Department</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Designation</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">College</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredFaculty.map((f: Faculty) => (
                <tr key={f.id} className="hover:bg-slate-800/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-teal-400">
                          {f.firstName?.[0]}{f.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {f.firstName} {f.lastName}
                          {f.isHOD && <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">HOD</span>}
                        </p>
                        <p className="text-xs text-slate-500">{f.facultyId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" /> {f.email}
                      </p>
                      {f.phone && (
                        <p className="text-sm text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" /> {f.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">{f.department || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">{f.designation}</span>
                    <p className="text-xs text-slate-500">{f.employmentType.replace('_', ' ')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">{f.collegeName || f.collegeCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(f.id, f.status, `${f.firstName} ${f.lastName}`)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        f.status === 'active'
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                      }`}
                    >
                      {f.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {f.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/superadmin/faculty/${f.id}`)}
                        className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(f.id, `${f.firstName} ${f.lastName}`)}
                        disabled={resetPasswordMutation.isPending}
                        className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-yellow-400 rounded-lg transition-colors"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id, `${f.firstName} ${f.lastName}`)}
                        disabled={deleteFaculty.isPending}
                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFaculty.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No faculty found</p>
            <p className="text-sm mt-1">Try adjusting filters or import faculty first</p>
            <button
              onClick={() => navigate('/superadmin/faculty-import')}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition-colors"
            >
              Import Faculty
            </button>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Key className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Password Reset</h3>
                <p className="text-sm text-slate-400">{resetFacultyName}</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <p className="text-xs text-slate-500 mb-1">New Temporary Password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono text-teal-400 bg-slate-800 px-3 py-2 rounded">
                  {resetPassword}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resetPassword)
                    showInfo('Password copied to clipboard')
                  }}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Share this password securely with the faculty member. They should change it after first login.
            </p>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperAdminFaculty