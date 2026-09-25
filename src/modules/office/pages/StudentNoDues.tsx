// /student/no-dues — apply for a no-dues certificate, track each office's
// clearance and download the certificate once issued.

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CircleDashed, FileText, Send, ShieldCheck, XCircle } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useStudentProfile } from '@/modules/student/hooks/useStudentProfile'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Badge, Empty, Field, Loading, PageHeader, btn, errMsg, fmtDate, inr } from '../components/officeUi'
import { createNoDuesRequest, downloadNoDuesCertificate, fetchMyNoDues, fetchNoDuesSettings } from '../api/noDuesApi'
import { useBranding, useCollegeId } from '../hooks/useLibrary'
import { DEFAULT_NODUES_SETTINGS, effectiveSections, progress } from '../utils/noDuesEngine'

export default function StudentNoDues() {
  const { user } = useAuth()
  const uid = user?.uid || ''
  const cid = useCollegeId()
  const qc = useQueryClient()
  const branding = useBranding()
  const { showSuccess, showError } = useNotification()
  const { profile, loading: profLoading } = useStudentProfile(uid || undefined)
  const settingsQ = useQuery({ queryKey: ['nodues', cid, 'settings'], queryFn: () => fetchNoDuesSettings(cid), enabled: !!cid })
  const mineQ = useQuery({ queryKey: ['nodues', cid, 'mine', uid], queryFn: () => fetchMyNoDues(uid, cid), enabled: !!cid && !!uid })
  const settings = settingsQ.data || DEFAULT_NODUES_SETTINGS
  const [purpose, setPurpose] = useState('')

  const apply = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error('Your student record was not found. Contact the office.')
      return createNoDuesRequest(
        {
          studentId: profile.id,
          uid,
          name: profile.name,
          regNo: profile.regNo || profile.registrationNumber || profile.rollNumber || '',
          course: profile.course || '',
          batch: profile.batch || '',
          department: profile.department || '',
        },
        purpose || settings.purposes[0] || 'Course completion',
        mineQ.data || [],
      )
    },
    onSuccess: () => { showSuccess('Applied — each office will clear its section'); qc.invalidateQueries({ queryKey: ['nodues', cid, 'mine', uid] }) },
    onError: e => showError(errMsg(e)),
  })

  if (settingsQ.isLoading || mineQ.isLoading || profLoading) return <div className="p-6"><Loading /></div>
  const list = mineQ.data || []
  const active = list.some(r => r.status === 'open' || r.status === 'cleared')
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader title="No-Dues Certificate" subtitle="Clearance from the library, accounts, your department and other offices" icon={<ShieldCheck className="w-5 h-5" />} />
      {settings.allowStudentApply ? (
        <div className="glass-card p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <Field label="Purpose" className="flex-1 min-w-[200px]">
              <select className="input-field" value={purpose || settings.purposes[0] || ''} onChange={e => setPurpose(e.target.value)}>{settings.purposes.map(p => <option key={p}>{p}</option>)}</select>
            </Field>
            <button className={btn.primary} disabled={apply.isPending} onClick={() => apply.mutate()}><Send className="w-4 h-4" />{apply.isPending ? 'Applying…' : 'Apply'}</button>
          </div>
          {active && <p className="text-xs text-vriddhi-muted mt-2">You already have a request in progress; you can apply for a different purpose.</p>}
          <p className="text-xs text-vriddhi-muted mt-2">Return all library books and clear your fee and fine balances first — offices clear you only when nothing is pending.</p>
        </div>
      ) : (
        <div className="glass-card p-4 mb-4 text-sm text-vriddhi-muted">Contact the college office to start your no-dues clearance.</div>
      )}
      {!list.length ? <Empty icon={<ShieldCheck className="w-8 h-8" />} title="No requests yet" /> : (
        <div className="space-y-4">
          {list.map(r => {
            const secs = effectiveSections(settings.sections, r.sections)
            const p = progress(settings.sections, r.sections)
            return (
              <div key={r.id} className="glass-card p-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <p className="font-semibold">{r.purpose}</p>
                  <span className="text-xs text-vriddhi-muted">applied {fmtDate(r.createdAt)}</span>
                  <span className="ml-auto"><Badge tone={r.status === 'issued' ? 'green' : r.status === 'cleared' ? 'teal' : r.status === 'cancelled' ? 'slate' : p.blocked ? 'red' : 'amber'}>{r.status === 'issued' ? 'Certificate issued' : r.status === 'cleared' ? 'All cleared — certificate being issued' : r.status === 'cancelled' ? 'Cancelled' : `${p.cleared}/${p.total} cleared`}</Badge></span>
                </div>
                <div className="space-y-2">
                  {secs.map(s => (
                    <div key={s.key} className="flex items-start gap-2 text-sm">
                      {s.status === 'cleared' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> : s.status === 'blocked' ? <XCircle className="w-4 h-4 text-red-500 mt-0.5" /> : <CircleDashed className="w-4 h-4 text-vriddhi-muted mt-0.5" />}
                      <div>
                        <span className="font-medium">{s.label}</span>
                        <span className="text-vriddhi-muted"> — {s.status === 'cleared' ? `cleared ${fmtDate(s.at)}` : s.status === 'blocked' ? 'dues pending' : 'waiting'}</span>
                        {s.status === 'blocked' && s.note && <p className="text-red-500 text-xs">{s.note}{s.dues ? ` · ${inr(s.dues)}` : ''}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {r.status === 'issued' && <button className={`${btn.primary} mt-4`} onClick={() => downloadNoDuesCertificate(r, settings, branding)}><FileText className="w-4 h-4" />Download certificate {r.certificateNo}</button>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
