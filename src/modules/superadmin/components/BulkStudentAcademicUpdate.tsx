import React, { useState } from 'react'
import { GraduationCap, Info, Users, X } from 'lucide-react'
import type { Student } from '../types/superAdmin'
import { useBulkUpdateStudentAcademicFields } from '../hooks/useSuperAdmin'
import { useNotification } from '@/shared/providers/NotificationProvider'

interface BulkStudentAcademicUpdateProps {
  students: Student[]
  onClose: () => void
  onUpdated: () => void
}

export default function BulkStudentAcademicUpdate({
  students,
  onClose,
  onUpdated,
}: BulkStudentAcademicUpdateProps) {
  const [changeBatch, setChangeBatch] = useState(true)
  const [changeBranch, setChangeBranch] = useState(false)
  const [changeSemester, setChangeSemester] = useState(false)
  const [batch, setBatch] = useState('')
  const [branch, setBranch] = useState('')
  const [semester, setSemester] = useState('1')
  const [error, setError] = useState('')
  const updateStudents = useBulkUpdateStudentAcademicFields()
  const { showSuccess } = useNotification()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!changeBatch && !changeBranch && !changeSemester) {
      setError('Choose at least one field to change.')
      return
    }
    const semesterNumber = Number(semester)
    if (changeSemester && (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 12)) {
      setError('Semester must be a whole number between 1 and 12.')
      return
    }
    if ((changeBatch && !batch.trim()) || (changeBranch && !branch.trim())) {
      setError('Enter a value for every selected field.')
      return
    }
    try {
      const result = await updateStudents.mutateAsync({
        studentIds: students.map((student) => student.id),
        ...(changeBatch ? { batch: batch.trim() } : {}),
        ...(changeBranch ? { branch: branch.trim() } : {}),
        ...(changeSemester ? { semester: semesterNumber } : {}),
      })
      const missing = result.missingIds.length ? ` ${result.missingIds.length} missing record(s) were skipped.` : ''
      showSuccess(`Updated ${result.updated} student${result.updated === 1 ? '' : 's'}.${missing}`)
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Students could not be updated')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between border-b border-slate-200 p-6 dark:border-slate-700">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <GraduationCap className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Change batch / branch / semester in bulk</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{students.length} selected student{students.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Only checked fields are changed. Names, registration numbers, divisions, and credentials are left untouched.</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                <input type="checkbox" checked={changeBatch} onChange={(event) => setChangeBatch(event.target.checked)} className="rounded" />
                Change batch
              </label>
              <input
                value={batch}
                onChange={(event) => setBatch(event.target.value)}
                disabled={!changeBatch}
                className="input-field disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. 2026-27"
              />
            </div>

            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                <input type="checkbox" checked={changeBranch} onChange={(event) => setChangeBranch(event.target.checked)} className="rounded" />
                Change branch / program
              </label>
              <input
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                disabled={!changeBranch}
                className="input-field disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. B.Com"
              />
            </div>

            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                <input type="checkbox" checked={changeSemester} onChange={(event) => setChangeSemester(event.target.checked)} className="rounded" />
                Change semester
              </label>
              <select
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                disabled={!changeSemester}
                className="input-field disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Semester"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={String(value)}>
                    Semester {value}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Use this to move a whole cohort to the next semester in one step.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <Users className="h-3.5 w-3.5" /> Selected records
            </div>
            {students.slice(0, 4).map((student) => student.name).join(', ')}
            {students.length > 4 ? ` and ${students.length - 4} more` : ''}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={updateStudents.isPending || students.length === 0 || students.length > 500}
              className="btn-primary"
            >
              {updateStudents.isPending ? 'Updating…' : `Update ${students.length} student${students.length === 1 ? '' : 's'}`}
            </button>
          </div>
          {students.length > 500 && (
            <p className="text-xs text-red-600 dark:text-red-400">Select at most 500 students per update.</p>
          )}
        </form>
      </div>
    </div>
  )
}
