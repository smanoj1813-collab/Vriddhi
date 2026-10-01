// Payroll segregation-of-duties notice shown in Finance Settings.
// Payroll roles are fixed: accounts prepares/processes; principal approves.

import { Lock } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'

export default function PayrollAccessCard() {
  const { user } = useAuth()
  if (user?.role !== 'principal' && user?.role !== 'accounts' && user?.role !== 'superadmin') return null

  return (
    <div className="glass-card p-4 mb-6 flex items-start gap-3">
      <Lock className="w-5 h-5 text-vriddhi-accent mt-0.5" />
      <div>
        <p className="font-medium text-sm text-vriddhi-text">Faculty payroll approval workflow</p>
        <p className="text-xs text-vriddhi-muted mt-1">
          Accounts prepares the monthly payroll and submits it for approval. The principal reviews the payslip details and approves or requests changes. Accounts can process the payment only after approval.
        </p>
      </div>
    </div>
  )
}
