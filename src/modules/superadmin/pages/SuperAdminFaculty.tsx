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
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/Firebase/config'
import { runIdentityRepair, type RepairResult } from '../api/identityApi'

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
  const [fixingPasswords, setFixingPasswords] = useState(false)
  const [repairSummary, setRepairSummary] = useState<RepairResult | null>(null)
  const [resetEmailState, setResetEmailState] = useState<Record<string, 'sending' | 'sent' | 'error'>>({})

  const { data: facultyData, isLoading, refetch } = useFacultyList({
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

  /**
   * Provision Firebase Auth accounts for faculty rows that have none.
   *
   * This used to run in the browser: build a password with Math.random(), POST
   * to the Identity Toolkit REST endpoint, then write users/{uid} with the
   * superadmin's own session. Three things were wrong with that — Math.random is
   * not a CSPRNG, the REST API cannot set custom claims (so the new account
   * could sign in while every rule-guarded read was denied), and a failed row
   * was visible only in console.log while the import still looked successful.
   *
   * It now delegates to the server-side identity repair, which creates the Auth
   * account, issues role/college claims, verifies the users/{uid} lookup
   * document, strips legacy plaintext passwords from profile documents, and
   * returns reset links so no shared secret is ever displayed.
   */
  const handleFixPasswords = async () => {
    if (!window.confirm(
      'Create missing Firebase Auth accounts for faculty in this college?\n\n' +
      'Accounts that already exist are left untouched. Faculty without a login get a password-reset link, ' +
      'so nobody has to be handed a password. Run a Preview first if you want to see the plan.'
    )) return
    setFixingPasswords(true)
    try {
      const result = await runIdentityRepair({
        dryRun: false,
        collegeId: collegeFilter !== 'all' ? collegeFilter : undefined,
        collections: ['faculty'],
        limit: 500,
        deliveryMode: 'reset-email',
        continueUrl: window.location.origin + '/login',
      })
      setRepairSummary(result)
      const issued = result.credentials || []
      if (issued.length) {
        setResetPassword(issued.map(c => `${c.email} — ${c.password || c.resetLink}`).join('\n'))
        setResetFacultyName(`${issued.length} account(s) created; reset links issued`)
        setShowPasswordModal(true)
        showSuccess(`Created ${issued.length} Auth account(s) with claims; profile documents verified`)
      } else if (result.broken === 0) {
        showInfo('Every faculty member in this college already has a verified Auth account')
      } else {
        showInfo(`Repaired ${result.repaired} of ${result.broken} affected identities`)
      }
      await refetch?.()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Identity repair failed')
    } finally {
      setFixingPasswords(false)
    }
  }

  /**
   * Per-row "no password needed" recovery. The old flow was: open Firestore,
   * read the plaintext password from the profile document, tell the user. That
   * field is exactly what this app now refuses to store, so the row action
   * sends Firebase's own reset email instead — the faculty member picks a new
   * password and the credential never passes through anyone's hands.
   */
  const handleSendResetEmail = async (email: string) => {
    if (!email) {
      showError('This faculty record has no email address')
      return
    }
    setResetEmailState(prev => ({ ...prev, [email]: 'sending' }))
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase())
      setResetEmailState(prev => ({ ...prev, [email]: 'sent' }))
      showSuccess(`Password reset email sent to ${email}`)
    } catch (err) {
      setResetEmailState(prev => ({ ...prev, [email]: 'error' }))
      showError(
        err instanceof Error && err.message.includes('auth/invalid-email')
          ? 'Firebase rejected this email address'
          : 'Could not send the reset email — check the Auth authorised-domains setting and try again'
      )
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
              <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Faculty</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">View, edit and manage all faculty members</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleFixPasswords}
            disabled={fixingPasswords}
            title="Reconcile this college's faculty with Firebase Authentication: create missing accounts, issue role/college claims, verify users/{uid}, delete legacy plaintext passwords"
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-slate-900 dark:text-white rounded-lg transition-colors text-sm"
          >
            <Key className="w-4 h-4" /> {fixingPasswords ? 'Reconciling…' : 'Fix Missing Logins'}
          </button>
          <button onClick={() => navigate('/superadmin/faculty/import')} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white rounded-lg transition-colors text-sm">
            <GraduationCap className="w-4 h-4" /> Import Faculty
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Faculty</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Inactive</p>
          <p className="text-2xl font-bold text-orange-400">{stats.inactive}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">HODs</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.hodCount}</p>
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
          </select>
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <select
            value={collegeFilter}
            onChange={e => setCollegeFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 appearance-none"
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
              className="pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 appearance-none"
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
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Faculty</th>
                <th className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Contact</th>
                <th className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Department</th>
                <th className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Designation</th>
                <th className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider px-4 py-3">College</th>
                <th className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFaculty.map((f: Faculty) => (
                <tr key={f.id} className="hover:bg-slate-100 dark:hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                          {f.firstName?.[0]}{f.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {f.firstName} {f.lastName}
                          {f.isHOD && <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-400 text-xs rounded">HOD</span>}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{f.facultyId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" /> {f.email}
                      </p>
                      {f.phone && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" /> {f.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{f.department || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{f.designation}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{f.employmentType.replace('_', ' ')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{f.collegeName || f.collegeCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(f.id, f.status, `${f.firstName} ${f.lastName}`)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        f.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100 dark:bg-emerald-900/30'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-orange-500/20'
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
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendResetEmail(f.email)}
                        disabled={resetEmailState[f.email] === 'sending'}
                        title={
                          resetEmailState[f.email] === 'sent'
                            ? 'Reset email sent'
                            : resetEmailState[f.email] === 'error'
                              ? 'Reset email failed — click to retry'
                              : 'Send Firebase password-reset email (no password needed from you)'
                        }
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-teal-400 rounded-lg transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(f.id, `${f.firstName} ${f.lastName}`)}
                        disabled={resetPasswordMutation.isPending}
                        title="Rotate the password and show a one-time credential (signs the user out everywhere)"
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-yellow-400 rounded-lg transition-colors"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id, `${f.firstName} ${f.lastName}`)}
                        disabled={deleteFaculty.isPending}
                        className="p-1.5 hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-400 rounded-lg transition-colors"
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
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No faculty found</p>
            <p className="text-sm mt-1">Try adjusting filters or import faculty first</p>
            <button
              onClick={() => navigate('/superadmin/faculty/import')}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white rounded-lg text-sm transition-colors"
            >
              Import Faculty
            </button>
          </div>
        )}
      </div>

      {repairSummary && (
        <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{repairSummary.message}</p>
            <button onClick={() => setRepairSummary(null)} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Dismiss</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>scanned {repairSummary.scanned}</span>·
            <span>needs repair {repairSummary.broken}</span>·
            <span>repaired {repairSummary.repaired}</span>·
            <span>Auth accounts created {repairSummary.authCreated}</span>·
            <span>claims issued {repairSummary.claimsIssued}</span>·
            <span>plaintext password fields deleted {repairSummary.secretsStripped}</span>
          </div>
          {repairSummary.errors?.length ? (
            <ul className="mt-2 space-y-1">
              {repairSummary.errors.map((error, i) => <li key={i} className="text-xs text-rose-600">{error}</li>)}
            </ul>
          ) : null}
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Key className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Password Reset</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{resetFacultyName}</p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-4 border border-slate-200 dark:border-transparent">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">New Temporary Password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent px-3 py-2 rounded">
                  {resetPassword}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resetPassword)
                    showInfo('Password copied to clipboard')
                  }}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm transition-colors"
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
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
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