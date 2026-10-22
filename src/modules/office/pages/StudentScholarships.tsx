// /student/scholarships — record your SSP/NSP application, keep the
// document checklist ready and track verification → sanction → DBT.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, GraduationCap, Send } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useStudentProfile } from '@/modules/student/hooks/useStudentProfile'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Badge, Empty, Field, Loading, PageHeader, btn, errMsg, fmtDate, inr } from '../components/officeUi'
import { createScholarshipApplication, fetchMyScholarships, fetchScholarshipSettings } from '../api/scholarshipApi'
import { useCollegeId } from '../hooks/useLibrary'
import {
  DEFAULT_SCHOLARSHIP_SETTINGS, SCHOLARSHIP_CATEGORIES, SCHOLARSHIP_DOCUMENTS, SCHOLARSHIP_STATUS_LABELS,
  daysToDeadline, type ScholarshipStatus,
} from '../utils/scholarshipEngine'

const TONE: Record<ScholarshipStatus, 'amber' | 'blue' | 'purple' | 'green' | 'teal' | 'red' | 'slate'> = {
  applied: 'amber', verified: 'blue', forwarded: 'purple', sanctioned: 'green', disbursed: 'teal', rejected: 'red', withdrawn: 'slate',
}

export default function StudentScholarships() {
  const { user } = useAuth()
  const uid = user?.uid || ''
  const cid = useCollegeId()
  const qc = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const { profile, loading: profLoading } = useStudentProfile(uid || undefined)
  const settingsQ = useQuery({ queryKey: ['scholarships', cid, 'settings'], queryFn: () => fetchScholarshipSettings(cid), enabled: !!cid })
  const mineQ = useQuery({ queryKey: ['scholarships', cid, 'mine', uid], queryFn: () => fetchMyScholarships(uid, cid), enabled: !!cid && !!uid })
  const settings = settingsQ.data || DEFAULT_SCHOLARSHIP_SETTINGS
  const open = settings.schemes.filter(s => s.enabled)
  const [schemeId, setSchemeId] = useState('')
  const [applicationNo, setApplicationNo] = useState('')
  const [category, setCategory] = useState('')
  const [income, setIncome] = useState('')
  const [docs, setDocs] = useState<Record<string, boolean>>({})
  const selectedScheme = schemeId || open[0]?.id || ''
  const scheme = open.find(s => s.id === selectedScheme)
  const days = scheme ? daysToDeadline(scheme) : null

  const apply = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error('Your student record was not found. Contact the office.')
      const p = profile as unknown as Record<string, unknown>
      return createScholarshipApplication({
        studentId: String(p.id || ''), uid, name: String(p.name || ''),
        regNo: String(p.registrationNumber || p.regNo || p.rollNumber || ''),
        programme: String(p.course || p.department || p.branch || ''),
        semester: Number(p.semester) || 0, batch: String(p.batch || ''),
        category: category || String(p.category || ''),
        annualIncome: Number(income) || 0,
        schemeId: selectedScheme, applicationNo, appliedOn: '', documents: docs,
      }, settings, mineQ.data || [])
    },
    onSuccess: () => { showSuccess('Recorded — the scholarship desk will verify/e-attest your application'); setApplicationNo(''); qc.invalidateQueries({ queryKey: ['scholarships', cid, 'mine', uid] }) },
    onError: e => showError(errMsg(e)),
  })

  if (settingsQ.isLoading || mineQ.isLoading || profLoading) return <div className="p-6"><Loading /></div>
  const mine = mineQ.data || []

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader title="My Scholarships" subtitle="SSP / NSP applications, verification and DBT status" icon={<GraduationCap className="w-5 h-5" />} />
      {settings.nodalOfficer && <p className="text-sm text-vriddhi-muted mb-3">Institute nodal officer: <b>{settings.nodalOfficer}</b>. Meet them at the college office for e-attestation or corrections.</p>}

      {settings.allowStudentApply ? (
        <div className="glass-card p-4 mb-4">
          <p className="text-sm mb-3">Apply on the <b>SSP</b> (ssp.karnataka.gov.in) or <b>NSP</b> (scholarships.gov.in) portal first, then record it here so the college verifies it before the window closes.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Scheme">
              <select className="input-field" value={selectedScheme} onChange={e => setSchemeId(e.target.value)}>
                {open.map(s => <option key={s.id} value={s.id}>{s.name} ({s.portal})</option>)}
              </select>
            </Field>
            <Field label="Portal application / acknowledgement no."><input className="input-field" value={applicationNo} onChange={e => setApplicationNo(e.target.value)} placeholder="From your SSP/NSP acknowledgement" /></Field>
            <Field label="Your category">
              <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select…</option>
                {SCHOLARSHIP_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Annual family income (₹)"><input type="number" min={0} className="input-field" value={income} onChange={e => setIncome(e.target.value)} placeholder="As on income certificate" /></Field>
          </div>
          {scheme?.lastDate && (
            <p className="text-xs mt-2">Last date: <b>{fmtDate(scheme.lastDate)}</b>{days !== null && <> · <Badge tone={days < 0 ? 'red' : days <= 15 ? 'amber' : 'green'}>{days < 0 ? `${-days} days overdue — check for an extension` : `${days} days left`}</Badge></>}{scheme.incomeLimit > 0 && <> · income limit {inr(scheme.incomeLimit)}</>}
            </p>
          )}
          <p className="text-sm font-medium mt-4 mb-2">Document checklist — tick what you have ready</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {SCHOLARSHIP_DOCUMENTS.map(d => (
              <label key={d.key} className="flex items-start gap-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={!!docs[d.key]} onChange={e => setDocs(prev => ({ ...prev, [d.key]: e.target.checked }))} />
                <span>{d.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <button className={btn.primary} disabled={apply.isPending || !selectedScheme} onClick={() => apply.mutate()}><Send className="w-4 h-4" />{apply.isPending ? 'Recording…' : 'Record my application'}</button>
          </div>
          <p className="text-xs text-vriddhi-muted mt-2">Need a bonafide or fee-structure certificate for your application? Request it under <b>My Certificates</b>.</p>
        </div>
      ) : (
        <div className="glass-card p-4 mb-4 text-sm text-vriddhi-muted">Visit the college office to record your scholarship application.</div>
      )}

      {!mine.length ? <Empty icon={<GraduationCap className="w-8 h-8" />} title="No applications recorded yet" /> : (
        <div className="space-y-3">
          {mine.map(a => (
            <div key={a.id} className="glass-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-teal-500" />
                <p className="font-semibold">{a.schemeName}</p>
                <span className="ml-auto"><Badge tone={TONE[a.status]}>{SCHOLARSHIP_STATUS_LABELS[a.status]}</Badge></span>
              </div>
              <p className="text-xs text-vriddhi-muted mt-1.5">
                {a.portal} · {a.academicYear}{a.applicationNo && <> · App. {a.applicationNo}</>} · applied {fmtDate(a.appliedOn || a.createdAt)}
                {a.sanctionedAmount > 0 && <> · sanctioned {inr(a.sanctionedAmount)}</>}
                {a.disbursedAmount > 0 && <> · disbursed {inr(a.disbursedAmount)}</>}
              </p>
              {a.officeNote && <p className="text-sm mt-1.5">{a.officeNote}</p>}
              {a.status === 'applied' && <p className="text-xs mt-1.5 text-amber-600">Waiting for the college to verify/e-attest — if the last date is close, visit the office with your acknowledgement.</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
