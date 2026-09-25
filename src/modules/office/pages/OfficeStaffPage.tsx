// /admin/office-staff — the principal adds accounts / operations team members
// (Cloud Function manageOfficeStaff sets their role claim) and decides
// whether the accounts team may see payroll.

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { Copy, KeyRound, Lock, Plus, UserCheck, UserX, Users } from 'lucide-react'
import { db, functions } from '@/Firebase/config'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { saveAccessSettings } from '@/modules/admin/api/accessApi'
import { useAccessSettings } from '@/modules/admin/hooks/useAccessSettings'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Badge, Empty, Field, Loading, Modal, PageHeader, btn, errMsg, fmtDate } from '../components/officeUi'
import { useCollegeId } from '../hooks/useLibrary'

interface StaffRow {
  uid: string
  name: string
  email: string
  phone: string
  role: 'accounts' | 'operations'
  status: 'active' | 'disabled'
  createdAt: string
}

type Result = { ok: boolean; uid: string; created?: boolean; temporaryPassword?: string | null; status?: string }
const call = (data: Record<string, unknown>) => httpsCallable<Record<string, unknown>, Result>(functions, 'manageOfficeStaff')(data).then(r => r.data)

const ROLE_INFO = {
  accounts: { label: 'Accounts team', desc: 'Fees, receipts, challans, vendor bills, library fines, finance reports & Tally. Payroll only if allowed below.' },
  operations: { label: 'Operations team', desc: 'Library, inventory & assets, stores, purchase orders, vendors, no-dues.' },
}

export default function OfficeStaffPage() {
  const { user } = useAuth()
  const cid = useCollegeId()
  const qc = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const { access, loading: accessLoading } = useAccessSettings()
  const [adding, setAdding] = useState(false)
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null)
  const staffQ = useQuery({
    queryKey: ['officeStaff', cid],
    enabled: !!cid,
    queryFn: async (): Promise<StaffRow[]> => {
      const snap = await getDocs(query(collection(db, 'colleges', cid, 'officeStaff'), limit(500)))
      return snap.docs.map(d => {
        const r = d.data()
        const ts = r.createdAt as { toDate?: () => Date } | string | undefined
        return {
          uid: d.id,
          name: String(r.name || ''),
          email: String(r.email || ''),
          phone: String(r.phone || ''),
          role: r.role === 'operations' ? 'operations' : 'accounts',
          status: r.status === 'disabled' ? 'disabled' : 'active',
          createdAt: typeof ts === 'string' ? ts : ts?.toDate ? ts.toDate().toISOString() : '',
        } as StaffRow
      }).sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name))
    },
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['officeStaff', cid] })
  const payrollOn = access.payrollRoles.includes('accounts')
  const togglePayroll = useMutation({
    mutationFn: () => saveAccessSettings(cid, { payrollRoles: payrollOn ? [] : ['accounts'] }, user?.name || 'Principal'),
    onSuccess: () => { showSuccess(payrollOn ? 'Payroll hidden from the accounts team' : 'Accounts team can now see payroll'); qc.invalidateQueries({ queryKey: ['accessSettings', cid] }) },
    onError: e => showError(errMsg(e)),
  })
  const act = useMutation({
    mutationFn: (v: { action: 'deactivate' | 'reactivate' | 'resetPassword'; row: StaffRow }) => call({ action: v.action, uid: v.row.uid, collegeId: cid }).then(r => ({ r, row: v.row, action: v.action })),
    onSuccess: ({ r, row, action }) => {
      if (action === 'resetPassword' && r.temporaryPassword) setSecret({ email: row.email, password: r.temporaryPassword })
      else showSuccess(action === 'deactivate' ? 'Sign-in disabled' : 'Sign-in re-enabled')
      refresh()
    },
    onError: e => showError(errMsg(e)),
  })

  const rows = staffQ.data || []
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <PageHeader title="Office Staff & Access" subtitle="Accounts and operations team members for your college" icon={<Users className="w-5 h-5" />} actions={<button className={btn.primary} onClick={() => setAdding(true)}><Plus className="w-4 h-4" />Add staff</button>} />
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        {(Object.keys(ROLE_INFO) as Array<keyof typeof ROLE_INFO>).map(k => (
          <div key={k} className="glass-card p-4"><p className="font-semibold">{ROLE_INFO[k].label} <span className="text-xs text-vriddhi-muted font-normal">· {rows.filter(r => r.role === k && r.status === 'active').length} active</span></p><p className="text-xs text-vriddhi-muted mt-1">{ROLE_INFO[k].desc}</p></div>
        ))}
      </div>
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-3">
        <Lock className="w-5 h-5 text-vriddhi-accent" />
        <div className="flex-1 min-w-[220px]">
          <p className="font-medium text-sm">Payroll visibility</p>
          <p className="text-xs text-vriddhi-muted">You always see payroll. Allow the accounts team to view and run payroll and salary certificates?</p>
        </div>
        <button className={payrollOn ? btn.danger : btn.primary} disabled={accessLoading || togglePayroll.isPending} onClick={() => togglePayroll.mutate()}>{payrollOn ? 'Hide from accounts' : 'Allow accounts'}</button>
        <Badge tone={payrollOn ? 'green' : 'slate'}>{payrollOn ? 'Accounts can see payroll' : 'Principal only'}</Badge>
      </div>
      {staffQ.isLoading ? <Loading /> : !rows.length ? <Empty icon={<Users className="w-8 h-8" />} title="No office staff yet" hint="Add your accountant and librarian / store keeper. They sign in with their email and see only their desk." /> : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border"><th className="p-3">Name</th><th className="p-3">Team</th><th className="p-3">Added</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.uid} className="border-b border-vriddhi-border/50">
                  <td className="p-3">{r.name}<div className="text-xs text-vriddhi-muted">{r.email}{r.phone ? ` · ${r.phone}` : ''}</div></td>
                  <td className="p-3"><Badge tone={r.role === 'accounts' ? 'blue' : 'purple'}>{ROLE_INFO[r.role].label}</Badge></td>
                  <td className="p-3">{r.createdAt ? fmtDate(r.createdAt) : '—'}</td>
                  <td className="p-3"><Badge tone={r.status === 'active' ? 'green' : 'red'}>{r.status === 'active' ? 'Active' : 'Disabled'}</Badge></td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    <button className={btn.small} disabled={act.isPending} onClick={() => act.mutate({ action: 'resetPassword', row: r })}><KeyRound className="w-3 h-3" />Reset password</button>
                    {r.status === 'active'
                      ? <button className={btn.small} disabled={act.isPending} onClick={() => act.mutate({ action: 'deactivate', row: r })}><UserX className="w-3 h-3" />Disable</button>
                      : <button className={btn.small} disabled={act.isPending} onClick={() => act.mutate({ action: 'reactivate', row: r })}><UserCheck className="w-3 h-3" />Enable</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-vriddhi-muted mt-3">To move someone between teams, add them again with the new team (same email). A role change takes effect at their next sign-in.</p>
      {adding && <AddModal cid={cid} onClose={() => setAdding(false)} onDone={(email, pw) => { refresh(); setAdding(false); if (pw) setSecret({ email, password: pw }); else showSuccess('Existing account moved to the office team') }} />}
      {secret && (
        <Modal open onClose={() => setSecret(null)} title="Temporary password" footer={<button className={btn.primary} onClick={() => setSecret(null)}>Done</button>}>
          <p className="text-sm mb-3">Share this with <b>{secret.email}</b> privately. It is shown only once; they should change it after signing in.</p>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-vriddhi-border/30 font-mono text-lg">
            <span className="flex-1 select-all">{secret.password}</span>
            <button className={btn.small} onClick={() => navigator.clipboard?.writeText(secret.password)}><Copy className="w-3 h-3" />Copy</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AddModal({ cid, onClose, onDone }: { cid: string; onClose: () => void; onDone: (email: string, password: string | null) => void }) {
  const { showError } = useNotification()
  const [f, setF] = useState({ name: '', email: '', phone: '', role: 'accounts' as 'accounts' | 'operations' })
  const m = useMutation({
    mutationFn: () => {
      if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email.trim())) throw new Error('Enter a name and a valid email.')
      const phone = f.phone.trim() ? (f.phone.trim().startsWith('+') ? f.phone.trim() : `+91${f.phone.trim().replace(/\D/g, '')}`) : ''
      return call({ action: 'create', name: f.name.trim(), email: f.email.trim().toLowerCase(), phone, role: f.role, collegeId: cid })
    },
    onSuccess: r => onDone(f.email.trim().toLowerCase(), r.temporaryPassword || null),
    onError: e => showError(errMsg(e)),
  })
  return (
    <Modal open onClose={onClose} title="Add office staff" footer={<><button className={btn.ghost} onClick={onClose}>Cancel</button><button className={btn.primary} disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Adding…' : 'Add'}</button></>}>
      <div className="grid gap-3">
        <Field label="Team">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ROLE_INFO) as Array<keyof typeof ROLE_INFO>).map(k => (
              <button key={k} type="button" onClick={() => setF({ ...f, role: k })} className={`p-3 rounded-xl border text-left text-sm ${f.role === k ? 'border-vriddhi-accent bg-vriddhi-accent/10' : 'border-vriddhi-border'}`}>
                <b>{ROLE_INFO[k].label}</b><p className="text-xs text-vriddhi-muted mt-1">{ROLE_INFO[k].desc}</p>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Full name"><input className="input-field" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email (sign-in)"><input className="input-field" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Mobile (optional)"><input className="input-field" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="98xxxxxxxx" /></Field>
      </div>
    </Modal>
  )
}
