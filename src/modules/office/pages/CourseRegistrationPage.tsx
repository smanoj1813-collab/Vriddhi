// /admin/course-registration — define elective baskets per semester,
// open the window, watch subject strengths, confirm and export the
// final lists (for UUCMS subject entry, timetable and IA lists).
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpenCheck, Download, Plus, Save, Trash2, Users } from 'lucide-react'
import { Badge, Empty, Field, Loading, PageHeader, PillTabs, StatCard, btn, downloadCsv, errMsg, fmtDate } from '../components/officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { fetchCertificateStudents } from '../api/certificateApi'
import { fetchRegistrations, fetchRegWindows, saveRegWindows, setRegistrationStatus } from '../api/registrationApi'
import { useCollegeId } from '../hooks/useLibrary'
import { REG_CATEGORIES, isWindowOpen, normalizeWindows, type RegGroup, type RegOption, type RegWindow } from '../utils/registrationEngine'

type TabId = 'registrations' | 'windows'

const newOption = (): RegOption => ({ id: '', code: '', name: '', department: '', credits: 2, capacity: 0 })
const newGroup = (): RegGroup => ({ id: '', label: 'New basket', category: 'DSE', choose: 1, programmes: [], options: [newOption()] })
const newWindow = (): RegWindow => ({ id: `window-${Date.now()}`, title: 'Semester elective registration', semester: 3, batches: [], opensOn: '', closesOn: '', status: 'draft', groups: [newGroup()] })

export default function CourseRegistrationPage() {
  const cid = useCollegeId()
  const qc = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const windowsQ = useQuery({ queryKey: ['registration', cid, 'windows'], queryFn: () => fetchRegWindows(cid), enabled: !!cid })
  const rosterQ = useQuery({ queryKey: ['registration', cid, 'roster'], queryFn: () => fetchCertificateStudents(cid), enabled: !!cid })
  const windows = windowsQ.data || []
  const [tab, setTab] = useState<TabId>('registrations')
  const [draft, setDraft] = useState<RegWindow[] | null>(null)
  const editWindows = draft || windows
  const [windowId, setWindowId] = useState('')
  const activeWindow = windows.find(w => w.id === windowId) || windows.find(w => isWindowOpen(w)) || windows[0] || null
  const regsQ = useQuery({ queryKey: ['registration', cid, 'regs', activeWindow?.id || ''], queryFn: () => fetchRegistrations(activeWindow!.id), enabled: !!cid && !!activeWindow })
  const regs = regsQ.data || []
  useEffect(() => { if (activeWindow && windowId !== activeWindow.id) setWindowId(activeWindow.id) }, [activeWindow, windowId])

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['registration', cid] }) }
  const save = useMutation({
    mutationFn: () => saveRegWindows(normalizeWindows({ windows: editWindows })),
    onSuccess: () => { showSuccess('Registration windows saved'); setDraft(null); refresh() },
    onError: e => showError(errMsg(e)),
  })
  const setStatus = useMutation({
    mutationFn: (input: { id: string; status: 'confirmed' | 'rejected' | 'submitted' }) => setRegistrationStatus(input.id, input.status),
    onSuccess: () => { showSuccess('Registration updated'); refresh() },
    onError: e => showError(errMsg(e)),
  })

  const batches = useMemo(() => [...new Set((rosterQ.data || []).map(r => r.batch).filter(Boolean))].sort(), [rosterQ.data])
  const programmes = useMemo(() => [...new Set((rosterQ.data || []).map(r => r.programme).filter(Boolean))].sort(), [rosterQ.data])
  const eligibleCount = useMemo(() => {
    if (!activeWindow) return 0
    return (rosterQ.data || []).filter(r => r.semester === activeWindow.semester && (!activeWindow.batches.length || activeWindow.batches.includes(r.batch))).length
  }, [rosterQ.data, activeWindow])

  const strength = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of regs) {
      if (r.status === 'rejected') continue
      for (const ids of Object.values(r.selections)) for (const id of ids) counts.set(id, (counts.get(id) || 0) + 1)
    }
    return counts
  }, [regs])

  const optionLabel = (w: RegWindow, groupId: string, optionId: string) => {
    const g = w.groups.find(x => x.id === groupId)
    const o = g?.options.find(x => x.id === optionId)
    return o ? `${o.code ? `${o.code} — ` : ''}${o.name}` : optionId
  }

  const exportRegs = () => {
    if (!activeWindow) return
    downloadCsv(`${activeWindow.id}-registrations.csv`, regs.map(r => {
      const row: Record<string, unknown> = { 'Reg No': r.regNo, Name: r.name, Programme: r.programme, Batch: r.batch, Semester: r.semester, Status: r.status }
      for (const g of activeWindow.groups) row[g.label] = (r.selections[g.id] || []).map(id => optionLabel(activeWindow, g.id, id)).join('; ')
      return row
    }))
  }
  const exportStrength = () => {
    if (!activeWindow) return
    const rows: Record<string, unknown>[] = []
    for (const g of activeWindow.groups) for (const o of g.options) {
      rows.push({ Basket: g.label, Category: g.category, Code: o.code, Subject: o.name, Department: o.department, Credits: o.credits, Capacity: o.capacity || 'Unlimited', Enrolled: strength.get(o.id) || 0 })
    }
    downloadCsv(`${activeWindow.id}-subject-strength.csv`, rows)
  }

  const patchWindow = (wi: number, patch: Partial<RegWindow>) => setDraft(editWindows.map((w, i) => (i === wi ? { ...w, ...patch } : w)))
  const patchGroup = (wi: number, gi: number, patch: Partial<RegGroup>) => patchWindow(wi, { groups: editWindows[wi].groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)) })
  const patchOption = (wi: number, gi: number, oi: number, patch: Partial<RegOption>) => patchGroup(wi, gi, { options: editWindows[wi].groups[gi].options.map((o, i) => (i === oi ? { ...o, ...patch } : o)) })

  if (!cid) return <div className="p-6"><Empty icon={<BookOpenCheck className="w-8 h-8" />} title="No college selected" /></div>

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <PageHeader title="Course Registration" subtitle="Elective baskets (DSE / OE / SEC / VAC) with seats, windows and UUCMS-ready exports" icon={<BookOpenCheck className="w-5 h-5" />} />
      <PillTabs value={tab} onChange={t => setTab(t as TabId)} options={[
        { id: 'registrations', label: 'Registrations' },
        { id: 'windows', label: 'Windows & baskets' },
      ]} />

      {windowsQ.isLoading ? <Loading /> : tab === 'registrations' ? (
        <div className="space-y-4">
          {!windows.length ? (
            <Empty icon={<BookOpenCheck className="w-8 h-8" />} title="No registration windows yet" hint="Create one under “Windows & baskets”: add the semester's elective baskets, set seats, then open the window for students." />
          ) : activeWindow && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <select className="input-field !w-auto" value={activeWindow.id} onChange={e => setWindowId(e.target.value)}>
                  {windows.map(w => <option key={w.id} value={w.id}>{w.title} — Sem {w.semester} ({w.status})</option>)}
                </select>
                <Badge tone={isWindowOpen(activeWindow) ? 'green' : 'slate'}>{isWindowOpen(activeWindow) ? 'Open for students' : activeWindow.status === 'open' ? 'Open (outside dates)' : activeWindow.status}</Badge>
                <span className="text-xs text-vriddhi-muted">{activeWindow.opensOn && <>Opens {fmtDate(activeWindow.opensOn)} · </>}{activeWindow.closesOn && <>Closes {fmtDate(activeWindow.closesOn)}</>}</span>
                <span className="ml-auto flex gap-2">
                  <button className={btn.ghost} onClick={exportStrength}><Download className="w-4 h-4" /> Subject strength</button>
                  <button className={btn.ghost} onClick={exportRegs}><Download className="w-4 h-4" /> Registrations CSV</button>
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Eligible students" value={eligibleCount} icon={<Users className="w-4 h-4" />} />
                <StatCard label="Submitted" value={regs.filter(r => r.status !== 'rejected').length} icon={<BookOpenCheck className="w-4 h-4" />} />
                <StatCard label="Confirmed" value={regs.filter(r => r.status === 'confirmed').length} icon={<BookOpenCheck className="w-4 h-4" />} />
                <StatCard label="Not yet submitted" value={Math.max(0, eligibleCount - regs.filter(r => r.status !== 'rejected').length)} icon={<Users className="w-4 h-4" />} />
              </div>
              <div className="glass-card p-4">
                <p className="font-semibold mb-2">Subject strength</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {activeWindow.groups.map(g => (
                    <div key={g.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                      <p className="text-xs text-vriddhi-muted">{g.category} · {g.label}</p>
                      {g.options.map(o => (
                        <p key={o.id} className="text-sm flex justify-between gap-2 mt-1"><span className="truncate">{o.code ? `${o.code} — ` : ''}{o.name}</span><b>{strength.get(o.id) || 0}{o.capacity ? ` / ${o.capacity}` : ''}</b></p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {regsQ.isLoading ? <Loading /> : !regs.length ? <Empty icon={<Users className="w-8 h-8" />} title="No submissions yet" /> : (
                <div className="glass-card p-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-vriddhi-muted border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2 pr-2">Student</th>
                      {activeWindow.groups.map(g => <th key={g.id} className="py-2 pr-2">{g.label}</th>)}
                      <th className="py-2 pr-2">Status</th><th className="py-2">Action</th>
                    </tr></thead>
                    <tbody>
                      {regs.map(r => (
                        <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800 align-top">
                          <td className="py-2 pr-2"><span className="font-medium">{r.name}</span><span className="block text-xs text-vriddhi-muted">{r.regNo} · {r.programme}</span></td>
                          {activeWindow.groups.map(g => <td key={g.id} className="py-2 pr-2 text-xs">{(r.selections[g.id] || []).map(id => optionLabel(activeWindow, g.id, id)).join('; ') || '—'}</td>)}
                          <td className="py-2 pr-2"><Badge tone={r.status === 'confirmed' ? 'green' : r.status === 'rejected' ? 'red' : 'amber'}>{r.status}</Badge></td>
                          <td className="py-2 whitespace-nowrap">
                            {r.status === 'submitted' && <><button className={btn.primary} onClick={() => setStatus.mutate({ id: r.id, status: 'confirmed' })}>Confirm</button>{' '}<button className={btn.ghost} onClick={() => setStatus.mutate({ id: r.id, status: 'rejected' })}>Return</button></>}
                            {r.status !== 'submitted' && <button className={btn.ghost} onClick={() => setStatus.mutate({ id: r.id, status: 'submitted' })}>Reopen</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {editWindows.map((w, wi) => (
            <div key={w.id} className="glass-card p-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Window title"><input className="input-field" value={w.title} onChange={e => patchWindow(wi, { title: e.target.value })} /></Field>
                <Field label="Semester"><input type="number" min={1} max={12} className="input-field" value={w.semester} onChange={e => patchWindow(wi, { semester: Number(e.target.value) })} /></Field>
                <Field label="Status">
                  <select className="input-field" value={w.status} onChange={e => patchWindow(wi, { status: e.target.value as RegWindow['status'] })}>
                    <option value="draft">Draft (hidden)</option><option value="open">Open</option><option value="closed">Closed</option>
                  </select>
                </Field>
                <Field label="Batches (empty = all)">
                  <input className="input-field" value={w.batches.join(', ')} placeholder={batches.join(', ') || '2024-27'} onChange={e => patchWindow(wi, { batches: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} />
                </Field>
                <Field label="Opens on"><input type="date" className="input-field" value={w.opensOn} onChange={e => patchWindow(wi, { opensOn: e.target.value })} /></Field>
                <Field label="Closes on"><input type="date" className="input-field" value={w.closesOn} onChange={e => patchWindow(wi, { closesOn: e.target.value })} /></Field>
                <div className="flex items-end"><button className={`${btn.ghost} text-rose-500`} onClick={() => setDraft(editWindows.filter((_, i) => i !== wi))}><Trash2 className="w-4 h-4" /> Remove window</button></div>
              </div>
              <div className="space-y-3 mt-4">
                {w.groups.map((g, gi) => (
                  <div key={gi} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Field label="Basket name"><input className="input-field" value={g.label} onChange={e => patchGroup(wi, gi, { label: e.target.value })} /></Field>
                      <Field label="Category"><select className="input-field" value={g.category} onChange={e => patchGroup(wi, gi, { category: e.target.value })}>{REG_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
                      <Field label="Student picks"><input type="number" min={1} max={6} className="input-field" value={g.choose} onChange={e => patchGroup(wi, gi, { choose: Number(e.target.value) })} /></Field>
                      <Field label="Only for programmes (empty = all)"><input className="input-field" value={g.programmes.join(', ')} placeholder={programmes.slice(0, 3).join(', ') || 'BCA'} onChange={e => patchGroup(wi, gi, { programmes: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} /></Field>
                    </div>
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-sm min-w-[640px]">
                        <thead><tr className="text-left text-vriddhi-muted text-xs"><th className="pb-1 pr-2">Code</th><th className="pb-1 pr-2">Subject</th><th className="pb-1 pr-2">Dept</th><th className="pb-1 pr-2">Credits</th><th className="pb-1 pr-2">Seats (0 = ∞)</th><th /></tr></thead>
                        <tbody>
                          {g.options.map((o, oi) => (
                            <tr key={oi}>
                              <td className="pr-2 py-1"><input className="input-field !py-1.5 w-28" value={o.code} onChange={e => patchOption(wi, gi, oi, { code: e.target.value })} /></td>
                              <td className="pr-2 py-1"><input className="input-field !py-1.5 min-w-[220px]" value={o.name} onChange={e => patchOption(wi, gi, oi, { name: e.target.value })} /></td>
                              <td className="pr-2 py-1"><input className="input-field !py-1.5 w-28" value={o.department} onChange={e => patchOption(wi, gi, oi, { department: e.target.value })} /></td>
                              <td className="pr-2 py-1"><input type="number" min={0} max={10} className="input-field !py-1.5 w-20" value={o.credits} onChange={e => patchOption(wi, gi, oi, { credits: Number(e.target.value) })} /></td>
                              <td className="pr-2 py-1"><input type="number" min={0} className="input-field !py-1.5 w-24" value={o.capacity} onChange={e => patchOption(wi, gi, oi, { capacity: Number(e.target.value) })} /></td>
                              <td className="py-1"><button className="p-1.5 text-rose-500" onClick={() => patchGroup(wi, gi, { options: g.options.filter((_, i) => i !== oi) })}><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className={btn.ghost} onClick={() => patchGroup(wi, gi, { options: [...g.options, newOption()] })}><Plus className="w-4 h-4" /> Subject</button>
                      <button className={`${btn.ghost} text-rose-500 ml-auto`} onClick={() => patchWindow(wi, { groups: w.groups.filter((_, i) => i !== gi) })}>Remove basket</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className={`${btn.ghost} mt-3`} onClick={() => patchWindow(wi, { groups: [...w.groups, newGroup()] })}><Plus className="w-4 h-4" /> Add basket</button>
            </div>
          ))}
          <div className="flex gap-2">
            <button className={btn.primary} disabled={save.isPending} onClick={() => save.mutate()}><Save className="w-4 h-4" /> Save windows</button>
            <button className={btn.ghost} onClick={() => setDraft([...editWindows, newWindow()])}><Plus className="w-4 h-4" /> New window</button>
            {draft && <button className={btn.ghost} onClick={() => setDraft(null)}>Discard changes</button>}
          </div>
          <p className="text-xs text-vriddhi-muted">Keep a window in Draft while building baskets. Seat capacity is enforced on the server when students submit; once you confirm a registration, the student can no longer amend it — reopen it here if a change is genuinely needed.</p>
        </div>
      )}
    </div>
  )
}
