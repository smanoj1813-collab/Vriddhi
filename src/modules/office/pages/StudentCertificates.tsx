// /student/certificates — apply for a bonafide / transfer / conduct /
// course-completion / fee-structure certificate, track the request and
// download the numbered PDF once the office issues it.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Award, CheckCircle2, Clock, Download, Send, XCircle } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useStudentProfile } from '@/modules/student/hooks/useStudentProfile'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Badge, Empty, Field, Loading, PageHeader, btn, errMsg, fmtDate } from '../components/officeUi'
import { createCertificateRequest, downloadIssuedCertificate, fetchCertificateSettings, fetchMyCertificates } from '../api/certificateApi'
import { useBranding, useCollegeId } from '../hooks/useLibrary'
import { DEFAULT_CERTIFICATE_SETTINGS, certificateType } from '../utils/certificateEngine'

export default function StudentCertificates() {
  const { user } = useAuth()
  const uid = user?.uid || ''
  const cid = useCollegeId()
  const qc = useQueryClient()
  const branding = useBranding()
  const { showSuccess, showError } = useNotification()
  const { profile, loading: profLoading } = useStudentProfile(uid || undefined)
  const settingsQ = useQuery({ queryKey: ['certificates', cid, 'settings'], queryFn: () => fetchCertificateSettings(cid), enabled: !!cid })
  const mineQ = useQuery({ queryKey: ['certificates', cid, 'mine', uid], queryFn: () => fetchMyCertificates(uid, cid), enabled: !!cid && !!uid })
  const settings = settingsQ.data || DEFAULT_CERTIFICATE_SETTINGS
  const enabledTypes = settings.types.filter(t => t.enabled)
  const [kind, setKind] = useState('')
  const [purpose, setPurpose] = useState('')
  const selectedKind = kind || enabledTypes[0]?.kind || ''
  const def = certificateType(settings, selectedKind)

  const apply = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error('Your student record was not found. Contact the office.')
      return createCertificateRequest(
        {
          studentId: profile.id,
          uid,
          name: profile.name,
          regNo: profile.regNo || profile.registrationNumber || profile.rollNumber || '',
          programme: profile.course || profile.department || profile.branch || '',
          semester: Number(profile.semester) || 0,
          batch: profile.batch || '',
          gender: (profile as { gender?: string }).gender || '',
          dateOfBirth: (profile as { dob?: string; dateOfBirth?: string }).dob || (profile as { dateOfBirth?: string }).dateOfBirth || '',
          apaarId: (profile as { apaarId?: string }).apaarId || '',
        },
        settings, selectedKind, purpose, mineQ.data || [],
      )
    },
    onSuccess: () => { showSuccess('Applied — the college office will issue your certificate'); setPurpose(''); qc.invalidateQueries({ queryKey: ['certificates', cid, 'mine', uid] }) },
    onError: e => showError(errMsg(e)),
  })

  if (settingsQ.isLoading || mineQ.isLoading || profLoading) return <div className="p-6"><Loading /></div>
  const list = mineQ.data || []

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader title="My Certificates" subtitle="Bonafide, transfer, conduct and other certificates from the college office" icon={<Award className="w-5 h-5" />} />
      {settings.allowStudentApply ? (
        <div className="glass-card p-4 mb-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Certificate">
              <select className="input-field" value={selectedKind} onChange={e => setKind(e.target.value)}>
                {enabledTypes.map(t => <option key={t.kind} value={t.kind}>{t.label}</option>)}
              </select>
            </Field>
            <Field label={def?.needsPurpose ? 'Purpose' : 'Purpose (optional)'}>
              <input className="input-field" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. SSP scholarship, bank loan, bus pass" />
            </Field>
          </div>
          <div className="mt-3">
            <button className={btn.primary} disabled={apply.isPending || !selectedKind} onClick={() => apply.mutate()}>
              <Send className="w-4 h-4" />{apply.isPending ? 'Applying…' : 'Apply'}
            </button>
          </div>
          <p className="text-xs text-vriddhi-muted mt-2">Clear any fee or library dues first — the office issues certificates only when nothing is pending. Issued certificates appear below as downloadable PDFs.</p>
        </div>
      ) : (
        <div className="glass-card p-4 mb-4 text-sm text-vriddhi-muted">Please contact the college office to request a certificate.</div>
      )}
      {!list.length ? <Empty icon={<Award className="w-8 h-8" />} title="No certificate requests yet" /> : (
        <div className="space-y-3">
          {list.map(r => (
            <div key={r.id} className="glass-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                {r.status === 'issued' ? <CheckCircle2 className="w-4 h-4 text-teal-500" /> : r.status === 'requested' ? <Clock className="w-4 h-4 text-amber-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                <p className="font-semibold">{r.kindLabel}</p>
                <span className="ml-auto">
                  <Badge tone={r.status === 'issued' ? 'green' : r.status === 'requested' ? 'amber' : 'red'}>
                    {r.status === 'issued' ? `Issued · ${r.certificateNo}` : r.status === 'requested' ? 'In process' : r.status === 'rejected' ? 'Rejected' : 'Cancelled'}
                  </Badge>
                </span>
              </div>
              <p className="text-xs text-vriddhi-muted mt-1.5">
                Applied {fmtDate(r.createdAt)}{r.purpose && <> · {r.purpose}</>}
                {r.status === 'issued' && <> · issued {fmtDate(r.issuedAt)}</>}
                {(r.status === 'rejected' || r.status === 'cancelled') && r.decidedNote && <> · {r.decidedNote}</>}
              </p>
              {r.status === 'issued' && (
                <button className={`${btn.primary} mt-3`} onClick={() => downloadIssuedCertificate(r, branding, settings).catch(e => showError(errMsg(e)))}>
                  <Download className="w-4 h-4" /> Download certificate
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
