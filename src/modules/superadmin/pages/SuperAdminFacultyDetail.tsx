import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFaculty, useUpdateFaculty, useResetFacultyPassword, useColleges } from '../hooks/useSuperAdmin'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import {
  ArrowLeft, Users, Mail, Phone, GraduationCap, Building2,
  Calendar, Award, BookOpen, Key, Save, CheckCircle, XCircle,
  Edit3, Copy
} from 'lucide-react'
import type { UpdateFacultyInput } from '../types/superAdmin'

const SuperAdminFacultyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useNotification()
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const { data: faculty, isLoading } = useFaculty(id || null)
  const { data: collegesData } = useColleges()
  const updateFaculty = useUpdateFaculty()
  const resetPassword = useResetFacultyPassword()

  const colleges = collegesData?.items || []

  const [formData, setFormData] = useState<UpdateFacultyInput>({})

  useEffect(() => {
    if (faculty) {
      setFormData({
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        email: faculty.email,
        phone: faculty.phone,
        gender: faculty.gender,
        department: faculty.department,
        designation: faculty.designation,
        employmentType: faculty.employmentType,
        joiningDate: faculty.joiningDate,
        qualification: faculty.qualification,
        specialization: faculty.specialization,
        subjectsUG: faculty.subjectsUG,
        subjectsPG: faculty.subjectsPG,
        experienceYears: faculty.experienceYears,
        isHOD: faculty.isHOD,
        status: faculty.status,
      })
    }
  }, [faculty])

  const handleSave = async () => {
    if (!id) return
    try {
      await updateFaculty.mutateAsync({ facultyId: id, updates: formData })
      showSuccess('Faculty updated successfully')
      setIsEditing(false)
    } catch {
      showError('Failed to update faculty')
    }
  }

  const handleResetPassword = async () => {
    if (!id) return
    try {
      const password = await resetPassword.mutateAsync(id)
      setNewPassword(password)
      setShowPassword(true)
      showSuccess('Password reset successfully')
    } catch {
      showError('Failed to reset password')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-teal-400" />
      </div>
    )
  }

  if (!faculty) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">Faculty not found</p>
          <button
            onClick={() => navigate('/superadmin/faculty')}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white rounded-lg text-sm"
          >
            Back to Faculty List
          </button>
        </div>
      </div>
    )
  }

  const college = colleges.find((c: any) => c.id === faculty.collegeId)

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: any }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <Icon className="w-4 h-4 text-slate-500 mt-0.5" />
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm text-slate-900 dark:text-white">{value || '—'}</p>
      </div>
    </div>
  )

  const EditField = ({ label, name, type = 'text', options }: { label: string; name: keyof UpdateFacultyInput; type?: string; options?: string[] }) => (
    <div className="mb-4">
      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      {options ? (
        <select
          value={(formData[name] as string) || ''}
          onChange={e => setFormData((prev: UpdateFacultyInput) => ({ ...prev, [name]: e.target.value }))}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Select {label}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'number' ? (
        <input
          type="number"
          value={(formData[name] as number) || 0}
          onChange={e => setFormData((prev: UpdateFacultyInput) => ({ ...prev, [name]: parseInt(e.target.value) || 0 }))}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      ) : (
        <input
          type={type}
          value={(formData[name] as string) || ''}
          onChange={e => setFormData((prev: UpdateFacultyInput) => ({ ...prev, [name]: e.target.value }))}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      )}
    </div>
  )

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/superadmin/faculty')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                {faculty.firstName?.[0]}{faculty.lastName?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {faculty.firstName} {faculty.lastName}
                {faculty.isHOD && <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-400 text-xs rounded-full">HOD</span>}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">{faculty.facultyId} · {faculty.designation}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={handleResetPassword}
                disabled={resetPassword.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition-colors text-sm"
              >
                <Key className="w-4 h-4" /> Reset Password
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white rounded-lg transition-colors text-sm"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors text-sm"
              >
                <XCircle className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateFaculty.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-white rounded-lg transition-colors text-sm"
              >
                <Save className="w-4 h-4" /> {updateFaculty.isPending ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Banner */}
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            faculty.status === 'active' ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20'
          }`}>
            {faculty.status === 'active' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-orange-400" />
            )}
            <div>
              <p className={`text-sm font-medium ${faculty.status === 'active' ? 'text-green-400' : 'text-orange-400'}`}>
                {faculty.status === 'active' ? 'Active Faculty' : 'Inactive Faculty'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {faculty.status === 'active' ? 'Can login and access the system' : 'Login access disabled'}
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Personal Information
            </h2>
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Full Name" value={`${faculty.firstName} ${faculty.lastName}`} icon={Users} />
                <InfoRow label="Email" value={faculty.email} icon={Mail} />
                <InfoRow label="Phone" value={faculty.phone} icon={Phone} />
                <InfoRow label="Gender" value={faculty.gender} icon={Users} />
                <InfoRow label="Faculty ID" value={faculty.facultyId} icon={GraduationCap} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditField label="First Name" name="firstName" />
                <EditField label="Last Name" name="lastName" />
                <EditField label="Email" name="email" type="email" />
                <EditField label="Phone" name="phone" type="tel" />
                <EditField label="Gender" name="gender" options={['Male', 'Female', 'Other']} />
              </div>
            )}
          </div>

          {/* Professional Information */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Professional Information
            </h2>
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Department" value={faculty.department} icon={Building2} />
                <InfoRow label="Designation" value={faculty.designation} icon={Award} />
                <InfoRow label="Employment Type" value={faculty.employmentType?.replace('_', ' ')} icon={Calendar} />
                <InfoRow label="Joining Date" value={faculty.joiningDate} icon={Calendar} />
                <InfoRow label="Qualification" value={faculty.qualification} icon={Award} />
                <InfoRow label="Specialization" value={faculty.specialization} icon={BookOpen} />
                <InfoRow label="Experience" value={`${faculty.experienceYears} years`} icon={Calendar} />
                <InfoRow label="HOD Status" value={faculty.isHOD ? 'Yes' : 'No'} icon={GraduationCap} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditField label="Department" name="department" />
                <EditField label="Designation" name="designation" />
                <EditField label="Employment Type" name="employmentType" options={['FULL_TIME', 'PART_TIME', 'ADJUNCT', 'VISITING']} />
                <EditField label="Joining Date" name="joiningDate" type="date" />
                <EditField label="Qualification" name="qualification" />
                <EditField label="Specialization" name="specialization" />
                <EditField label="Experience (Years)" name="experienceYears" type="number" />
                <EditField label="HOD" name="isHOD" options={['true', 'false']} />
              </div>
            )}
          </div>

          {/* Subjects */}
          {(faculty.subjectsUG?.length > 0 || faculty.subjectsPG?.length > 0) && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Subjects
              </h2>
              {faculty.subjectsUG?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">UG Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {faculty.subjectsUG.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-teal-500/10 text-teal-400 text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {faculty.subjectsPG?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">PG Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {faculty.subjectsPG.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* College Card */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" /> College
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{college?.shortName?.[0] || college?.name?.[0] || 'C'}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{college?.name || faculty.collegeName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{faculty.collegeCode}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/superadmin/colleges`)}
              className="w-full py-2 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors"
            >
              View College
            </button>
          </div>

          {/* Account Info */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Account
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                <p className="text-sm text-slate-900 dark:text-white capitalize">{faculty.role}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  faculty.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}>
                  {faculty.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {faculty.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                <p className="text-sm text-slate-900 dark:text-white">{new Date(faculty.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              {faculty.lastLogin && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Last Login</p>
                  <p className="text-sm text-slate-900 dark:text-white">{new Date(faculty.lastLogin).toLocaleDateString('en-IN')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Key className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Password Reset</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{faculty.firstName} {faculty.lastName}</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">New Temporary Password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono text-teal-400 bg-slate-800 px-3 py-2 rounded">
                  {newPassword}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newPassword)
                    showInfo('Password copied to clipboard')
                  }}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Share this password securely. Faculty should change it after first login.
            </p>
            <button
              onClick={() => setShowPassword(false)}
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

export default SuperAdminFacultyDetail
