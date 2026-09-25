// Principal-only switch: may the accounts team see and run payroll?
// (colleges/{id}/config/access — the security rules read the same doc.)
// The principal always keeps payroll visibility.

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { saveAccessSettings } from '../api/accessApi'
import { useAccessSettings } from '../hooks/useAccessSettings'

export default function PayrollAccessCard() {
  const { user } = useAuth()
  const { access, loading } = useAccessSettings()
  const qc = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''
  const on = access.payrollRoles.includes('accounts')
  const toggle = useMutation({
    mutationFn: () => saveAccessSettings(collegeId, { payrollRoles: on ? [] : ['accounts'] }, user?.name || 'Principal'),
    onSuccess: () => {
      showSuccess(on ? 'Payroll hidden from the accounts team' : 'The accounts team can now see payroll')
      qc.invalidateQueries({ queryKey: ['accessSettings', collegeId] })
    },
    onError: (e: unknown) => showError(e instanceof Error ? e.message : 'Could not save'),
  })
  if (user?.role !== 'principal' && user?.role !== 'superadmin') return null
  return (
    <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-3">
      <Lock className="w-5 h-5 text-vriddhi-accent" />
      <div className="flex-1 min-w-[220px]">
        <p className="font-medium text-sm text-vriddhi-text">Payroll visibility</p>
        <p className="text-xs text-vriddhi-muted">You always see payroll. Allow the accounts team to view and run payroll and salary certificates?</p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${on ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-vriddhi-muted'}`}>{on ? 'Accounts can see payroll' : 'Principal only'}</span>
      <button
        className={`px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50 ${on ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' : 'bg-vriddhi-accent text-white hover:bg-teal-600'}`}
        disabled={loading || !collegeId || toggle.isPending}
        onClick={() => toggle.mutate()}
      >
        {on ? 'Hide from accounts' : 'Allow accounts'}
      </button>
    </div>
  )
}
