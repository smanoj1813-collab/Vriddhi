// src/modules/student/components/resume/ResumeEditor.tsx
//
// The form half of the Resume Builder. Pure controlled component: it receives
// ResumeData and emits a new ResumeData on every keystroke; the page owns
// autosave and preview. Sections are accordions so the phone layout stays
// usable; lists (bullets, skills, languages) are edited as "one per line" /
// comma-separated text, which students find far quicker than one input per
// item and maps 1:1 onto the ATS-friendly plain text the templates print.

import { useState, type ReactNode } from 'react'
import {
  ArrowDown, ArrowUp, ChevronDown, ChevronUp, Loader2, Plus, Sparkles, Trash2,
} from 'lucide-react'
import {
  RESUME_SECTION_LABELS,
  newResumeId,
  type ResumeCertification,
  type ResumeData,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeProject,
  type ResumeSectionId,
  type ResumeSkillGroup,
} from '@/shared/types/resume'
import type { ResumeAiKind } from '@/shared/services/resumeService'

export interface ResumeEditorProps {
  data: ResumeData
  onChange: (next: ResumeData) => void
  /** AI suggestions remaining for this student (0 hides the buttons). */
  aiRemaining: number
  aiBusy: boolean
  onAi: (kind: ResumeAiKind, text: string, apply: (improved: string) => void) => void
}

// ─── Small form primitives ──────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white'

function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, id, maxLength = 160 }: { value: string; onChange: (v: string) => void; placeholder?: string; id?: string; maxLength?: number }) {
  return <input id={id} className={inputCls} value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}

function LinesInput({ value, onChange, placeholder, rows = 4, maxItems = 8 }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; rows?: number; maxItems?: number }) {
  // Keep the raw text while typing so a trailing newline is not eaten.
  const [raw, setRaw] = useState<string | null>(null)
  const shown = raw ?? value.join('\n')
  return (
    <textarea
      className={`${inputCls} min-h-[80px] font-normal`}
      rows={rows}
      value={shown}
      placeholder={placeholder}
      onChange={(e) => {
        setRaw(e.target.value)
        onChange(e.target.value.split('\n').map((l) => l.replace(/^\s*[-•*]\s*/, '')).filter((l) => l.trim().length > 0).slice(0, maxItems))
      }}
      onBlur={() => setRaw(null)}
    />
  )
}

function CommaInput({ value, onChange, placeholder, maxItems = 30 }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; maxItems?: number }) {
  const [raw, setRaw] = useState<string | null>(null)
  const shown = raw ?? value.join(', ')
  return (
    <input
      className={inputCls}
      value={shown}
      placeholder={placeholder}
      onChange={(e) => {
        setRaw(e.target.value)
        onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, maxItems))
      }}
      onBlur={() => setRaw(null)}
    />
  )
}

function Section({ id, title, subtitle, open, onToggle, children, badge }: { id: string; title: string; subtitle?: string; open: boolean; onToggle: () => void; children: ReactNode; badge?: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#131b2e]" data-section={id}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`resume-sec-${id}`}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="block text-sm font-bold text-slate-900 dark:text-white">{title}</span>
          {subtitle && <span className="block text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>}
        </span>
        <span className="flex items-center gap-2">
          {badge && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{badge}</span>}
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </span>
      </button>
      {open && <div id={`resume-sec-${id}`} className="space-y-4 border-t border-slate-100 px-4 py-4 dark:border-slate-800">{children}</div>}
    </section>
  )
}

function RowTools({ index, total, onMove, onRemove, label }: { index: number; total: number; onMove: (dir: -1 | 1) => void; onRemove: () => void; label: string }) {
  const btn = 'rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800'
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={btn} aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={14} /></button>
      <button type="button" className={btn} aria-label={`Move ${label} down`} disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={14} /></button>
      <button type="button" className={`${btn} hover:text-rose-600`} aria-label={`Remove ${label}`} onClick={onRemove}><Trash2 size={14} /></button>
    </div>
  )
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-teal-300 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-900/20">
      <Plus size={14} /> {children}
    </button>
  )
}

function AiButton({ disabled, busy, remaining, onClick, label }: { disabled: boolean; busy: boolean; remaining: number; onClick: () => void; label: string }) {
  if (remaining <= 0 && !busy) return null
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      title={`${remaining} AI suggestions left this year`}
      className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-[11px] font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-50 dark:bg-violet-900/30 dark:text-violet-200"
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {label}
    </button>
  )
}

function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

// ─── Editor ─────────────────────────────────────────────────────────────────

const SECTION_HELP: Record<ResumeSectionId, string> = {
  summary: '3–4 lines: degree, strongest skills, the role you want.',
  education: 'Most recent first. Add CGPA / percentage if it helps.',
  experience: 'Internships, part-time jobs, volunteering. 2–4 bullets each — start with a verb, add a number.',
  projects: 'Academic or personal projects. Name the tools you used.',
  skills: 'Group them: Technical, Tools, Soft skills. Comma-separated.',
  certifications: 'Tally, NISM, Google, Coursera… with the year.',
  achievements: 'Ranks, prizes, scholarships, leadership roles. One per line.',
  languages: 'Comma-separated, e.g. English, Kannada, Hindi.',
}

export default function ResumeEditor({ data, onChange, aiRemaining, aiBusy, onAi }: ResumeEditorProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({ contact: true, summary: true })
  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  const patch = (partial: Partial<ResumeData>) => onChange({ ...data, ...partial })
  const patchContact = (partial: Partial<ResumeData['contact']>) => patch({ contact: { ...data.contact, ...partial } })

  const programme = data.education[0]?.degree || ''
  const role = data.contact.headline

  const renderSection = (id: ResumeSectionId, index: number, total: number) => {
    const moveSection = (dir: -1 | 1) => patch({ sectionOrder: move(data.sectionOrder, index, dir) })
    const orderTools = (
      <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400">
        <span className="mr-1">Order</span>
        <button type="button" aria-label={`Move ${RESUME_SECTION_LABELS[id]} section up`} disabled={index === 0} onClick={() => moveSection(-1)} className="rounded-lg p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"><ArrowUp size={13} /></button>
        <button type="button" aria-label={`Move ${RESUME_SECTION_LABELS[id]} section down`} disabled={index === total - 1} onClick={() => moveSection(1)} className="rounded-lg p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"><ArrowDown size={13} /></button>
      </div>
    )

    switch (id) {
      case 'summary':
        return (
          <Section key={id} id={id} title="Professional summary" subtitle={SECTION_HELP.summary} open={!!open[id]} onToggle={() => toggle(id)} badge={data.summary ? `${data.summary.split(/\s+/).filter(Boolean).length} words` : 'empty'}>
            {orderTools}
            <textarea
              id="resume-summary"
              className={`${inputCls} min-h-[110px]`}
              rows={5}
              maxLength={1200}
              value={data.summary}
              placeholder="Final-year B.Com student with hands-on Tally and Excel experience from a six-month audit internship…"
              onChange={(e) => patch({ summary: e.target.value })}
            />
            <div className="flex justify-end">
              <AiButton label="Improve with AI" remaining={aiRemaining} busy={aiBusy} disabled={data.summary.trim().length < 8} onClick={() => onAi('summary', data.summary, (t) => patch({ summary: t }))} />
            </div>
          </Section>
        )
      case 'education':
        return (
          <Section key={id} id={id} title="Education" subtitle={SECTION_HELP.education} open={!!open[id]} onToggle={() => toggle(id)} badge={`${data.education.length}`}>
            {orderTools}
            {data.education.map((ed, i) => (
              <div key={ed.id} className="space-y-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Education {i + 1}</span>
                  <RowTools index={i} total={data.education.length} label={`education ${i + 1}`} onMove={(d) => patch({ education: move(data.education, i, d) })} onRemove={() => patch({ education: data.education.filter((x) => x.id !== ed.id) })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Degree"><TextInput value={ed.degree} placeholder="B.Com" onChange={(v) => updateEdu(ed.id, { degree: v })} /></Field>
                  <Field label="Specialisation"><TextInput value={ed.field} placeholder="Accounting & Finance" onChange={(v) => updateEdu(ed.id, { field: v })} /></Field>
                  <Field label="Institution" className="sm:col-span-2"><TextInput value={ed.institution} placeholder="College name, University" onChange={(v) => updateEdu(ed.id, { institution: v })} /></Field>
                  <Field label="Location"><TextInput value={ed.location} placeholder="Bengaluru" onChange={(v) => updateEdu(ed.id, { location: v })} /></Field>
                  <Field label="Score"><TextInput value={ed.score} placeholder="CGPA 8.4/10 or 78%" maxLength={60} onChange={(v) => updateEdu(ed.id, { score: v })} /></Field>
                  <Field label="Start year"><TextInput value={ed.startYear} placeholder="2023" maxLength={20} onChange={(v) => updateEdu(ed.id, { startYear: v })} /></Field>
                  <Field label="End year (expected)"><TextInput value={ed.endYear} placeholder="2026" maxLength={20} onChange={(v) => updateEdu(ed.id, { endYear: v })} /></Field>
                </div>
                <Field label="Highlights (optional, one per line)"><LinesInput value={ed.highlights} rows={2} placeholder="Class representative; Dean's list 2024" onChange={(v) => updateEdu(ed.id, { highlights: v })} /></Field>
              </div>
            ))}
            <AddButton onClick={() => patch({ education: [...data.education, { id: newResumeId('edu'), institution: '', degree: '', field: '', location: '', startYear: '', endYear: '', score: '', highlights: [] }] })}>Add education</AddButton>
          </Section>
        )
      case 'experience':
        return (
          <Section key={id} id={id} title="Experience & internships" subtitle={SECTION_HELP.experience} open={!!open[id]} onToggle={() => toggle(id)} badge={`${data.experience.length}`}>
            {orderTools}
            {data.experience.map((x, i) => (
              <div key={x.id} className="space-y-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Role {i + 1}</span>
                  <RowTools index={i} total={data.experience.length} label={`role ${i + 1}`} onMove={(d) => patch({ experience: move(data.experience, i, d) })} onRemove={() => patch({ experience: data.experience.filter((r) => r.id !== x.id) })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Role / title"><TextInput value={x.role} placeholder="Audit Intern" onChange={(v) => updateExp(x.id, { role: v })} /></Field>
                  <Field label="Organisation"><TextInput value={x.organisation} placeholder="ABC & Co, Chartered Accountants" onChange={(v) => updateExp(x.id, { organisation: v })} /></Field>
                  <Field label="Location"><TextInput value={x.location} placeholder="Bengaluru" onChange={(v) => updateExp(x.id, { location: v })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start"><TextInput value={x.startDate} placeholder="Jan 2025" maxLength={30} onChange={(v) => updateExp(x.id, { startDate: v })} /></Field>
                    <Field label="End"><TextInput value={x.current ? '' : x.endDate} placeholder={x.current ? 'Present' : 'Jun 2025'} maxLength={30} onChange={(v) => updateExp(x.id, { endDate: v })} /></Field>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={x.current} onChange={(e) => updateExp(x.id, { current: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-teal-600" />
                  I currently work here
                </label>
                <Field label="What you did (one bullet per line)">
                  <LinesInput value={x.bullets} placeholder={'Reconciled 120+ vendor ledgers in Tally, cutting month-end close by 2 days\nPrepared GST returns for 15 SME clients'} onChange={(v) => updateExp(x.id, { bullets: v })} />
                </Field>
                <div className="flex justify-end">
                  <AiButton label="Sharpen last bullet with AI" remaining={aiRemaining} busy={aiBusy} disabled={!x.bullets.length} onClick={() => {
                    const last = x.bullets[x.bullets.length - 1]
                    onAi('bullet', last, (t) => updateExp(x.id, { bullets: [...x.bullets.slice(0, -1), t] }))
                  }} />
                </div>
              </div>
            ))}
            <AddButton onClick={() => patch({ experience: [...data.experience, { id: newResumeId('exp'), organisation: '', role: '', location: '', startDate: '', endDate: '', current: false, bullets: [] }] })}>Add internship / job</AddButton>
          </Section>
        )
      case 'projects':
        return (
          <Section key={id} id={id} title="Projects" subtitle={SECTION_HELP.projects} open={!!open[id]} onToggle={() => toggle(id)} badge={`${data.projects.length}`}>
            {orderTools}
            {data.projects.map((p, i) => (
              <div key={p.id} className="space-y-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Project {i + 1}</span>
                  <RowTools index={i} total={data.projects.length} label={`project ${i + 1}`} onMove={(d) => patch({ projects: move(data.projects, i, d) })} onRemove={() => patch({ projects: data.projects.filter((r) => r.id !== p.id) })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Project name"><TextInput value={p.name} placeholder="GST Compliance Tracker" onChange={(v) => updateProject(p.id, { name: v })} /></Field>
                  <Field label="Your role"><TextInput value={p.role} placeholder="Team lead" onChange={(v) => updateProject(p.id, { role: v })} /></Field>
                  <Field label="Link (optional)"><TextInput value={p.link} placeholder="https://github.com/…" onChange={(v) => updateProject(p.id, { link: v })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start"><TextInput value={p.startDate} placeholder="Jan 2025" maxLength={30} onChange={(v) => updateProject(p.id, { startDate: v })} /></Field>
                    <Field label="End"><TextInput value={p.endDate} placeholder="Mar 2025" maxLength={30} onChange={(v) => updateProject(p.id, { endDate: v })} /></Field>
                  </div>
                </div>
                <Field label="Tools / tech (comma-separated)"><CommaInput value={p.techStack} maxItems={15} placeholder="Excel, Power Query, Tally" onChange={(v) => updateProject(p.id, { techStack: v })} /></Field>
                <Field label="What you built / found (one bullet per line)"><LinesInput value={p.bullets} placeholder="Built a tracker adopted by 4 local firms" onChange={(v) => updateProject(p.id, { bullets: v })} /></Field>
              </div>
            ))}
            <AddButton onClick={() => patch({ projects: [...data.projects, { id: newResumeId('prj'), name: '', role: '', link: '', startDate: '', endDate: '', techStack: [], bullets: [] }] })}>Add project</AddButton>
          </Section>
        )
      case 'skills':
        return (
          <Section key={id} id={id} title="Skills" subtitle={SECTION_HELP.skills} open={!!open[id]} onToggle={() => toggle(id)} badge={`${data.skills.reduce((n, g) => n + g.skills.length, 0)}`}>
            {orderTools}
            {data.skills.map((g, i) => (
              <div key={g.id} className="space-y-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1"><TextInput value={g.name} placeholder="Group name, e.g. Tools" maxLength={60} onChange={(v) => updateSkill(g.id, { name: v })} /></div>
                  <RowTools index={i} total={data.skills.length} label={`skill group ${i + 1}`} onMove={(d) => patch({ skills: move(data.skills, i, d) })} onRemove={() => patch({ skills: data.skills.filter((r) => r.id !== g.id) })} />
                </div>
                <CommaInput value={g.skills} placeholder="Tally Prime, MS Excel, Power BI, GST filing" onChange={(v) => updateSkill(g.id, { skills: v })} />
              </div>
            ))}
            <AddButton onClick={() => patch({ skills: [...data.skills, { id: newResumeId('skl'), name: '', skills: [] }] })}>Add skill group</AddButton>
          </Section>
        )
      case 'certifications':
        return (
          <Section key={id} id={id} title="Certifications" subtitle={SECTION_HELP.certifications} open={!!open[id]} onToggle={() => toggle(id)} badge={`${data.certifications.length}`}>
            {orderTools}
            {data.certifications.map((c, i) => (
              <div key={c.id} className="space-y-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Certification {i + 1}</span>
                  <RowTools index={i} total={data.certifications.length} label={`certification ${i + 1}`} onMove={(d) => patch({ certifications: move(data.certifications, i, d) })} onRemove={() => patch({ certifications: data.certifications.filter((r) => r.id !== c.id) })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name"><TextInput value={c.name} placeholder="Tally Essentials" onChange={(v) => updateCert(c.id, { name: v })} /></Field>
                  <Field label="Issuer"><TextInput value={c.issuer} placeholder="Tally Education" onChange={(v) => updateCert(c.id, { issuer: v })} /></Field>
                  <Field label="Year"><TextInput value={c.year} placeholder="2024" maxLength={20} onChange={(v) => updateCert(c.id, { year: v })} /></Field>
                  <Field label="Credential ID (optional)"><TextInput value={c.credentialId} maxLength={80} onChange={(v) => updateCert(c.id, { credentialId: v })} /></Field>
                </div>
              </div>
            ))}
            <AddButton onClick={() => patch({ certifications: [...data.certifications, { id: newResumeId('crt'), name: '', issuer: '', year: '', credentialId: '' }] })}>Add certification</AddButton>
          </Section>
        )
      case 'achievements':
        return (
          <Section key={id} id={id} title="Achievements" subtitle={SECTION_HELP.achievements} open={!!open[id]} onToggle={() => toggle(id)} badge={`${data.achievements.length}`}>
            {orderTools}
            <LinesInput value={data.achievements} maxItems={15} placeholder={'Runner-up, State Commerce Quiz 2024\nNSS volunteer — led a 40-student blood-donation drive'} onChange={(v) => patch({ achievements: v })} />
          </Section>
        )
      case 'languages':
        return (
          <Section key={id} id={id} title="Languages" subtitle={SECTION_HELP.languages} open={!!open[id]} onToggle={() => toggle(id)} badge={`${data.languages.length}`}>
            {orderTools}
            <CommaInput value={data.languages} maxItems={10} placeholder="English, Kannada, Hindi" onChange={(v) => patch({ languages: v })} />
          </Section>
        )
      default:
        return null
    }
  }

  function updateEdu(id: string, partial: Partial<ResumeEducation>) {
    patch({ education: data.education.map((e) => (e.id === id ? { ...e, ...partial } : e)) })
  }
  function updateExp(id: string, partial: Partial<ResumeExperience>) {
    patch({ experience: data.experience.map((e) => (e.id === id ? { ...e, ...partial } : e)) })
  }
  function updateProject(id: string, partial: Partial<ResumeProject>) {
    patch({ projects: data.projects.map((e) => (e.id === id ? { ...e, ...partial } : e)) })
  }
  function updateSkill(id: string, partial: Partial<ResumeSkillGroup>) {
    patch({ skills: data.skills.map((e) => (e.id === id ? { ...e, ...partial } : e)) })
  }
  function updateCert(id: string, partial: Partial<ResumeCertification>) {
    patch({ certifications: data.certifications.map((e) => (e.id === id ? { ...e, ...partial } : e)) })
  }

  return (
    <div className="space-y-3">
      <Section id="contact" title="Contact details" subtitle="Name, headline and how recruiters reach you." open={!!open.contact} onToggle={() => toggle('contact')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2"><TextInput id="resume-fullName" value={data.contact.fullName} placeholder="As on your marks card" onChange={(v) => patchContact({ fullName: v })} /></Field>
          <Field label="Headline" className="sm:col-span-2" hint="One line: programme + the role you are targeting.">
            <div className="flex gap-2">
              <TextInput id="resume-headline" value={data.contact.headline} maxLength={200} placeholder="B.Com Final Year | Aspiring Financial Analyst" onChange={(v) => patchContact({ headline: v })} />
              <AiButton label="AI" remaining={aiRemaining} busy={aiBusy} disabled={(data.contact.headline || programme).trim().length < 8} onClick={() => onAi('headline', data.contact.headline || `${programme} student, ${role}`, (t) => patchContact({ headline: t }))} />
            </div>
          </Field>
          <Field label="Email"><TextInput id="resume-email" value={data.contact.email} placeholder="you@example.com" onChange={(v) => patchContact({ email: v })} /></Field>
          <Field label="Phone"><TextInput id="resume-phone" value={data.contact.phone} maxLength={40} placeholder="+91 98450 12345" onChange={(v) => patchContact({ phone: v })} /></Field>
          <Field label="Location"><TextInput value={data.contact.location} placeholder="Bengaluru, Karnataka" onChange={(v) => patchContact({ location: v })} /></Field>
          <Field label="LinkedIn"><TextInput value={data.contact.linkedin} placeholder="https://linkedin.com/in/you" onChange={(v) => patchContact({ linkedin: v })} /></Field>
          <Field label="GitHub / portfolio"><TextInput value={data.contact.github} placeholder="https://github.com/you" onChange={(v) => patchContact({ github: v })} /></Field>
          <Field label="Website (optional)"><TextInput value={data.contact.website} placeholder="https://" onChange={(v) => patchContact({ website: v })} /></Field>
        </div>
      </Section>

      {data.sectionOrder.map((id, index) => renderSection(id, index, data.sectionOrder.length))}
    </div>
  )
}
