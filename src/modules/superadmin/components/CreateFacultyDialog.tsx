import React, { useState } from 'react'
import { CheckCircle2, Copy, UserPlus, X } from 'lucide-react'
import BranchMultiInput from './BranchMultiInput'
import { useCreateFaculty } from '../hooks/useSuperAdmin'
import type {
  College,
  CreateFacultyInput,
  CreateFacultyResult,
  EmploymentType,
} from '../types/superAdmin'
import { useNotification } from '@/shared/providers/NotificationProvider'

interface CreateFacultyDialogProps {
  colleges: College[]
  onClose: () => void
  onCreated?: (facultyId: string) => void
}

const initialForm: CreateFacultyInput = {
  collegeId: '',
  facultyId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  branches: [],
  designation: 'Assistant Professor',
  employmentType: 'FULL_TIME',
  joiningDate: '',
  qualification: '',
  specialization: '',
  experienceYears: 0,
  isHOD: false,
  deliveryMode: 'temp-password',
}

export default function CreateFacultyDialog({ colleges, onClose, onCreated }: CreateFacultyDialogProps) {
  const [form, setForm] = useState<CreateFacultyInput>(initialForm)
  const [result, setResult] = useState<CreateFacultyResult | null>(null)
  const [error, setError] = useState('')
  const createFaculty = useCreateFaculty()
  const { showSuccess } = useNotification()

  const setField = <K extends keyof CreateFacultyInput>(key: K, value: CreateFacultyInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!form.collegeId || !form.facultyId.trim() || !form.firstName.trim() || !form.email.trim()) {
      setError('College, faculty ID, first name, and email are required.')
      return
    }
    if (form.branches.length === 0) {
      setError('Add at least one branch or program.')
      return
    }
    try {
      const created = await createFaculty.mutateAsync(form)
      setResult(created)
      showSuccess(`${created.name} was created and assigned to the selected college`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Faculty could not be created')
    }
  }

  const credential = result?.temporaryPassword || result?.resetLink || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40">
              <UserPlus className="h-5 w-5 text-teal-700 dark:text-teal-300" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {result ? 'Faculty created' : 'Add faculty'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {result ? 'The account and college assignment are ready.' : 'Create one account without preparing a CSV.'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {result ? (
          <div className="p-6">
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">{result.name}</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">{result.email} · {result.facultyId}</p>
              </div>
            </div>

            {credential ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {result.temporaryPassword ? 'One-time password' : 'Password setup link'}
                </p>
                <div className="flex items-start gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 text-sm text-slate-900 dark:bg-slate-800 dark:text-white">
                    {credential}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(credential)
                      showSuccess(result.temporaryPassword ? 'Password copied' : 'Setup link copied')
                    }}
                    className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  This credential is shown once and is not saved in Firestore. Share it securely with the faculty member.
                </p>
              </div>
            ) : (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                The account was created, but no credential was returned. Use the email icon in Manage Faculty to send a password-reset email.
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn-secondary">Close</button>
              <button
                type="button"
                onClick={() => onCreated?.(result.facultyId)}
                className="btn-primary"
              >
                View faculty profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">College *</label>
              <select value={form.collegeId} onChange={(event) => setField('collegeId', event.target.value)} className="input-field" required>
                <option value="">Select college</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>{college.name} ({college.code})</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Faculty ID *</label>
                <input value={form.facultyId} onChange={(event) => setField('facultyId', event.target.value)} className="input-field" placeholder="FAC001" required />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Email *</label>
                <input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} className="input-field" placeholder="faculty@college.edu" required />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">First name *</label>
                <input value={form.firstName} onChange={(event) => setField('firstName', event.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Last name</label>
                <input value={form.lastName || ''} onChange={(event) => setField('lastName', event.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Phone</label>
                <input type="tel" value={form.phone || ''} onChange={(event) => setField('phone', event.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Gender</label>
                <select value={form.gender || ''} onChange={(event) => setField('gender', event.target.value)} className="input-field">
                  <option value="">Not specified</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <BranchMultiInput value={form.branches} onChange={(branches) => setField('branches', branches)} required />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Designation</label>
                <input value={form.designation || ''} onChange={(event) => setField('designation', event.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Employment type</label>
                <select value={form.employmentType} onChange={(event) => setField('employmentType', event.target.value as EmploymentType)} className="input-field">
                  <option value="FULL_TIME">Full time</option>
                  <option value="PART_TIME">Part time</option>
                  <option value="ADJUNCT">Adjunct</option>
                  <option value="VISITING">Visiting</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Joining date</label>
                <input type="date" value={form.joiningDate || ''} onChange={(event) => setField('joiningDate', event.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Experience (years)</label>
                <input type="number" min="0" step="0.5" value={form.experienceYears || 0} onChange={(event) => setField('experienceYears', Number(event.target.value) || 0)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Qualification</label>
                <input value={form.qualification || ''} onChange={(event) => setField('qualification', event.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Specialization</label>
                <input value={form.specialization || ''} onChange={(event) => setField('specialization', event.target.value)} className="input-field" />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <input type="checkbox" checked={!!form.isHOD} onChange={(event) => setField('isHOD', event.target.checked)} className="mt-1 rounded" />
              <span>
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Head of department (HOD)</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Creates HOD directory assignments for all selected branches.</span>
              </span>
            </label>

            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Initial sign-in credential</label>
              <select value={form.deliveryMode} onChange={(event) => setField('deliveryMode', event.target.value as CreateFacultyInput['deliveryMode'])} className="input-field">
                <option value="temp-password">Generate a one-time password</option>
                <option value="reset-email">Generate a password setup link</option>
              </select>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={createFaculty.isPending} className="btn-primary inline-flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                {createFaculty.isPending ? 'Creating account…' : 'Create faculty'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
