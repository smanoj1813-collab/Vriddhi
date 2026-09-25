// Issue / return / renew counter. Scan a member ID card (or type a reg. no /
// name) and a book's accession barcode. A scanned copy that is out on loan is
// treated as a RETURN; an available copy is ISSUED to the selected member.

import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, BookOpen, CheckCircle2, RefreshCw, User, UserX } from 'lucide-react'
import { ScanInput, type ScanInputHandle } from '../ScanInput'
import { Badge, Field, btn, errMsg, fmtDate, inr } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import {
  COPY_STATUS_LABEL,
  countWaitingReservations,
  fetchLoansForMember,
  fetchUnpaidFineTotal,
  findCopyByAccession,
  findMembers,
  issueCopy,
  renewLoan,
  returnLoan,
  type LibraryCopy,
  type LibraryLoan,
  type LibraryMember,
  type ReturnCondition,
} from '../../api/libraryApi'
import {
  canIssue,
  canRenew,
  computeDueDate,
  computeOverdueFine,
  lostBookCharge,
  type LibrarySettings,
} from '../../utils/libraryEngine'
import { todayIso } from '../../api/officeDb'
import { useActiveLoans, useLibraryMembers, useLibraryRefresh } from '../../hooks/useLibrary'

interface LogRow {
  at: string
  kind: 'issue' | 'return' | 'renew' | 'lost'
  text: string
}

const TYPE_LABEL = { student: 'Student', faculty: 'Faculty', staff: 'Staff' } as const

export default function CirculationDesk({ settings }: { settings: LibrarySettings }) {
  const { showSuccess, showError, showWarning } = useNotification()
  const refresh = useLibraryRefresh()
  const membersQ = useLibraryMembers()
  const loansQ = useActiveLoans()
  const bookScan = useRef<ScanInputHandle>(null)

  const [member, setMember] = useState<LibraryMember | null>(null)
  const [memberLoans, setMemberLoans] = useState<LibraryLoan[]>([])
  const [unpaid, setUnpaid] = useState(0)
  const [choices, setChoices] = useState<LibraryMember[]>([])
  const [copy, setCopy] = useState<LibraryCopy | null>(null)
  const [loan, setLoan] = useState<LibraryLoan | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [log, setLog] = useState<LogRow[]>([])
  // issue form
  const [dueOverride, setDueOverride] = useState('')
  // return form
  const [condition, setCondition] = useState<ReturnCondition>('ok')
  const [charge, setCharge] = useState(0)
  const [waiveOverdue, setWaiveOverdue] = useState(false)

  const today = todayIso()
  const addLog = (kind: LogRow['kind'], text: string) => setLog(l => [{ at: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), kind, text }, ...l].slice(0, 30))

  async function selectMember(m: LibraryMember) {
    setMember(m)
    setChoices([])
    setBusy('member')
    try {
      const [loans, fines] = await Promise.all([fetchLoansForMember(m.id), fetchUnpaidFineTotal(m.id)])
      setMemberLoans(loans.filter(l => l.status === 'issued'))
      setUnpaid(fines)
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
      bookScan.current?.focus()
    }
  }

  function onMemberScan(code: string) {
    const list = findMembers(membersQ.data || [], code)
    if (!list.length) return showWarning(`No member matches "${code}".`)
    if (list.length === 1) return void selectMember(list[0])
    setChoices(list)
  }

  async function onBookScan(code: string) {
    setBusy('book')
    setCopy(null)
    setLoan(null)
    try {
      const c = await findCopyByAccession(code)
      if (!c) return showWarning(`No copy with accession "${code.toUpperCase()}".`)
      setCopy(c)
      if (c.status === 'issued') {
        const active = (loansQ.data || []).find(l => l.copyId === c.id) || (await fetchLoansForCopy(c))
        setLoan(active || null)
        setCondition('ok')
        setCharge(0)
        setWaiveOverdue(false)
      } else {
        setDueOverride('')
      }
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  // fallback when the cached active-loan list is stale
  async function fetchLoansForCopy(c: LibraryCopy): Promise<LibraryLoan | null> {
    const r = await loansQ.refetch()
    return (r.data || []).find(l => l.copyId === c.id) || null
  }

  const policy = member ? settings.policies[member.type] : null
  const issueCheck = useMemo(() => {
    if (!member || !policy || !copy) return null
    return canIssue({
      activeLoans: memberLoans.length,
      unpaidFines: unpaid,
      policy,
      settings,
      alreadyHasTitle: memberLoans.some(l => l.titleId === copy.titleId),
    })
  }, [member, policy, copy, memberLoans, unpaid, settings])

  const plannedDue = member && policy ? dueOverride || computeDueDate(today, policy.loanDays, settings) : ''

  async function doIssue(force = false) {
    if (!member || !copy) return
    if (issueCheck && !issueCheck.ok && !force) return
    setBusy('issue')
    try {
      const l = await issueCopy({ copyId: copy.id, member, settings, dueDateOverride: dueOverride || undefined })
      showSuccess(`Issued “${l.titleName}” to ${member.name} — due ${fmtDate(l.dueDate)}`)
      addLog('issue', `${l.accessionNo} → ${member.name} (due ${fmtDate(l.dueDate)})`)
      setMemberLoans(ls => [l, ...ls])
      setCopy(null)
      refresh()
      bookScan.current?.focus()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  const loanPolicy = loan ? settings.policies[loan.memberType] || settings.policies.student : null
  const overduePreview = loan && loanPolicy ? computeOverdueFine(loan.dueDate, today, loanPolicy, settings) : { days: 0, amount: 0 }

  function pickCondition(c: ReturnCondition) {
    setCondition(c)
    if (c === 'lost') setCharge(lostBookCharge(copy?.price || 0, settings))
    else if (c === 'damaged') setCharge(settings.damageCharge)
    else setCharge(0)
  }

  async function doReturn() {
    if (!loan) return
    setBusy('return')
    try {
      const res = await returnLoan({ loan, settings, condition, extraCharge: charge, waiveOverdue })
      const total = res.fines.reduce((s, f) => s + f.amount, 0)
      showSuccess(`${condition === 'lost' ? 'Marked lost' : 'Returned'}: ${loan.titleName}${total ? ` · fine ${inr(total)}` : ''}`)
      if (res.heldFor) showWarning(`Keep aside for ${res.heldFor.memberName} (reservation) until ${fmtDate(res.heldFor.expiresAt)}.`)
      addLog(condition === 'lost' ? 'lost' : 'return', `${loan.accessionNo} ← ${loan.memberName}${total ? ` · ${inr(total)}` : ''}${res.heldFor ? ' · HOLD' : ''}`)
      if (member && member.id === loan.memberId) {
        setMemberLoans(ls => ls.filter(l => l.id !== loan.id))
        setUnpaid(u => u + total)
      }
      setLoan(null)
      setCopy(null)
      refresh()
      bookScan.current?.focus()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  async function doRenew(l: LibraryLoan) {
    const pol = settings.policies[l.memberType] || settings.policies.student
    setBusy(`renew-${l.id}`)
    try {
      const waiting = await countWaitingReservations(l.titleId)
      const chk = canRenew({ renewals: l.renewals, dueDate: l.dueDate, today, policy: pol, waitingReservations: waiting })
      if (!chk.ok) return showWarning(chk.reason || 'Cannot renew.')
      const due = await renewLoan(l, settings)
      showSuccess(`Renewed until ${fmtDate(due)}`)
      addLog('renew', `${l.accessionNo} (${l.memberName}) → ${fmtDate(due)}`)
      setMemberLoans(ls => ls.map(x => (x.id === l.id ? { ...x, dueDate: due, renewals: x.renewals + 1 } : x)))
      if (loan?.id === l.id) setLoan({ ...l, dueDate: due, renewals: l.renewals + 1 })
      refresh()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* ── Member ───────────────────────────── */}
      <section className="glass-card p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><User className="w-4 h-4" /> Member</h3>
        <ScanInput placeholder={membersQ.isLoading ? 'Loading members…' : 'Scan ID card, or type reg. no / staff code / name'} onScan={onMemberScan} busy={busy === 'member' || membersQ.isLoading} autoFocus />
        {choices.length > 0 && (
          <div className="border border-vriddhi-border rounded-xl divide-y divide-vriddhi-border/60 max-h-64 overflow-y-auto">
            {choices.map(m => (
              <button key={`${m.type}-${m.id}`} onClick={() => selectMember(m)} className="w-full text-left px-3 py-2 hover:bg-vriddhi-border/40">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{m.name}</p>
                <p className="text-xs text-vriddhi-muted">{TYPE_LABEL[m.type]} · {m.code || '—'} · {m.course || m.department}</p>
              </button>
            ))}
          </div>
        )}
        {member ? (
          <div className="rounded-xl border border-vriddhi-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{member.name}</p>
                <p className="text-xs text-vriddhi-muted">{TYPE_LABEL[member.type]} · {member.code || 'no ID'} · {[member.course || member.department, member.batch].filter(Boolean).join(' · ')}</p>
              </div>
              <button onClick={() => { setMember(null); setMemberLoans([]); setUnpaid(0) }} className={btn.small}><UserX className="w-3 h-3" /> Clear</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge tone={policy && memberLoans.length >= policy.maxBooks ? 'red' : 'teal'}>{memberLoans.length}/{policy?.maxBooks ?? 0} books</Badge>
              <Badge tone={unpaid > 0 ? (settings.blockIssueAboveFine > 0 && unpaid > settings.blockIssueAboveFine ? 'red' : 'amber') : 'green'}>Unpaid fines {inr(unpaid)}</Badge>
              <Badge tone="slate">Loan {policy?.loanDays} days</Badge>
              {!member.uid && <Badge tone="amber">Account not linked — cannot see loans online</Badge>}
            </div>
            {memberLoans.length > 0 && (
              <ul className="mt-3 divide-y divide-vriddhi-border/60">
                {memberLoans.map(l => {
                  const late = l.dueDate < today
                  return (
                    <li key={l.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white truncate">{l.titleName}</p>
                        <p className={`text-xs ${late ? 'text-red-500' : 'text-vriddhi-muted'}`}>{l.accessionNo} · due {fmtDate(l.dueDate)}{l.renewals ? ` · renewed ${l.renewals}×` : ''}{l.renewRequestedAt ? ' · renewal requested' : ''}</p>
                      </div>
                      <button onClick={() => doRenew(l)} disabled={busy === `renew-${l.id}`} className={btn.small}><RefreshCw className="w-3 h-3" /> Renew</button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-vriddhi-muted">No member selected. Returns work without selecting a member.</p>
        )}
      </section>

      {/* ── Book ─────────────────────────────── */}
      <section className="glass-card p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><BookOpen className="w-4 h-4" /> Book</h3>
        <ScanInput ref={bookScan} placeholder="Scan book barcode or type accession no." onScan={onBookScan} busy={busy === 'book'} />

        {copy && copy.status !== 'issued' && (
          <div className="rounded-xl border border-vriddhi-border p-3 space-y-3">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{copy.titleName}</p>
              <p className="text-xs text-vriddhi-muted">{copy.accessionNo} · {copy.callNumber || 'no call no.'} · <Badge tone={copy.status === 'available' ? 'green' : copy.status === 'on_hold' ? 'purple' : 'red'}>{COPY_STATUS_LABEL[copy.status]}</Badge></p>
            </div>
            {!['available', 'on_hold'].includes(copy.status) ? (
              <p className="text-sm text-red-500 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> This copy cannot be issued ({COPY_STATUS_LABEL[copy.status].toLowerCase()}). Change its status in the Catalogue.</p>
            ) : !member ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">Scan the member’s ID card first to issue this book.</p>
            ) : (
              <>
                {copy.status === 'on_hold' && <p className="text-xs text-purple-600 dark:text-purple-400">On hold for a reservation — it can only go to that member.</p>}
                <Field label="Due date" hint={dueOverride ? 'Custom due date' : `Loan period for ${TYPE_LABEL[member.type].toLowerCase()}s: ${policy?.loanDays} days (closed days skipped: ${settings.dueDateSkipsClosedDays ? 'yes' : 'no'})`}>
                  <input type="date" className="input-field" value={plannedDue} min={today} onChange={e => setDueOverride(e.target.value)} />
                </Field>
                {issueCheck && !issueCheck.ok && <p className="text-sm text-red-500 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {issueCheck.reason}</p>}
                <div className="flex gap-2">
                  <button onClick={() => doIssue(false)} disabled={busy === 'issue' || (issueCheck ? !issueCheck.ok : true)} className={btn.primary}><ArrowUpRight className="w-4 h-4" /> Issue to {member.name.split(' ')[0]}</button>
                  {issueCheck && !issueCheck.ok && <button onClick={() => doIssue(true)} disabled={busy === 'issue'} className={btn.ghost} title="Librarian override">Override &amp; issue</button>}
                </div>
              </>
            )}
          </div>
        )}

        {copy && copy.status === 'issued' && (
          <div className="rounded-xl border border-vriddhi-border p-3 space-y-3">
            {!loan ? (
              <p className="text-sm text-red-500">This copy is marked issued but no open loan was found. Refresh, or fix its status in the Catalogue.</p>
            ) : (
              <>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{loan.titleName}</p>
                  <p className="text-xs text-vriddhi-muted">{loan.accessionNo} · with <b>{loan.memberName}</b> ({loan.memberCode || TYPE_LABEL[loan.memberType]}) · issued {fmtDate(loan.issueDate)} · due {fmtDate(loan.dueDate)}</p>
                </div>
                {overduePreview.days > 0 && !waiveOverdue && (
                  <p className="text-sm text-red-500">Overdue fine: {overduePreview.days} chargeable day(s) → <b>{inr(overduePreview.amount)}</b></p>
                )}
                <div className="flex flex-wrap gap-2">
                  {(['ok', 'damaged', 'lost'] as ReturnCondition[]).map(c => (
                    <button key={c} onClick={() => pickCondition(c)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${condition === c ? 'bg-vriddhi-accent text-white border-transparent' : 'border-vriddhi-border text-vriddhi-muted'}`}>
                      {c === 'ok' ? 'Good condition' : c === 'damaged' ? 'Damaged' : 'Lost'}
                    </button>
                  ))}
                </div>
                {condition !== 'ok' && (
                  <Field label={condition === 'lost' ? 'Lost-book charge (₹)' : 'Damage charge (₹)'} hint={condition === 'lost' ? `Policy: ${settings.lostBookPolicy === 'price' ? 'book price' : settings.lostBookPolicy === 'multiple' ? `${settings.lostMultiplier}× price` : `price + ₹${settings.lostProcessingFee} processing`}` : undefined}>
                    <input type="number" min={0} className="input-field" value={charge} onChange={e => setCharge(Number(e.target.value) || 0)} />
                  </Field>
                )}
                {overduePreview.amount > 0 && (
                  <label className="flex items-center gap-2 text-sm text-vriddhi-muted">
                    <input type="checkbox" checked={waiveOverdue} onChange={e => setWaiveOverdue(e.target.checked)} /> Don’t charge the overdue fine
                  </label>
                )}
                <div className="flex flex-wrap gap-2">
                  <button onClick={doReturn} disabled={busy === 'return'} className={condition === 'lost' ? btn.danger : btn.primary}>
                    <ArrowDownLeft className="w-4 h-4" /> {condition === 'lost' ? 'Mark lost' : 'Return'}
                  </button>
                  <button onClick={() => doRenew(loan)} disabled={!!busy} className={btn.ghost}><RefreshCw className="w-4 h-4" /> Renew instead</button>
                </div>
              </>
            )}
          </div>
        )}

        {log.length > 0 && (
          <div>
            <p className="text-xs font-medium text-vriddhi-muted mb-1">This session</p>
            <ul className="text-xs space-y-1 max-h-56 overflow-y-auto">
              {log.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-vriddhi-muted w-12 shrink-0">{r.at}</span>
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${r.kind === 'lost' ? 'text-red-500' : r.kind === 'issue' ? 'text-blue-500' : 'text-green-500'}`} />
                  <span className="text-vriddhi-text">{r.kind.toUpperCase()} · {r.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
