// All books currently out: overdue list, due soon, renewal requests from
// the member portal, with renew/decline and CSV / reminder export.

import { useMemo, useState } from 'react'
import { Check, Download, Search, X } from 'lucide-react'
import { Badge, Empty, Loading, PillTabs, btn, downloadCsv, errMsg, fmtDate, inr } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { countWaitingReservations, declineRenewal, renewLoan, type LibraryLoan } from '../../api/libraryApi'
import { canRenew, computeOverdueFine, daysBetween, loanState, type LibrarySettings } from '../../utils/libraryEngine'
import { todayIso } from '../../api/officeDb'
import { useActiveLoans, useLibraryRefresh } from '../../hooks/useLibrary'

type Filter = 'all' | 'overdue' | 'due_soon' | 'requests'

export default function LoansTab({ settings }: { settings: LibrarySettings }) {
  const { showSuccess, showError, showWarning } = useNotification()
  const loansQ = useActiveLoans()
  const refresh = useLibraryRefresh()
  const [filter, setFilter] = useState<Filter>('overdue')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const today = todayIso()

  const loans = loansQ.data || []
  const counts = useMemo(() => ({
    all: loans.length,
    overdue: loans.filter(l => loanState(l.dueDate, today) === 'overdue').length,
    due_soon: loans.filter(l => loanState(l.dueDate, today) === 'due_soon').length,
    requests: loans.filter(l => l.renewRequestedAt).length,
  }), [loans, today])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return loans.filter(l => {
      if (filter === 'overdue' && loanState(l.dueDate, today) !== 'overdue') return false
      if (filter === 'due_soon' && loanState(l.dueDate, today) !== 'due_soon') return false
      if (filter === 'requests' && !l.renewRequestedAt) return false
      return !q || `${l.titleName} ${l.accessionNo} ${l.memberName} ${l.memberCode} ${l.course}`.toLowerCase().includes(q)
    })
  }, [loans, filter, search, today])

  const fineFor = (l: LibraryLoan) => computeOverdueFine(l.dueDate, today, settings.policies[l.memberType] || settings.policies.student, settings)

  async function renew(l: LibraryLoan) {
    setBusy(l.id)
    try {
      const waiting = await countWaitingReservations(l.titleId)
      const chk = canRenew({ renewals: l.renewals, dueDate: l.dueDate, today, policy: settings.policies[l.memberType] || settings.policies.student, waitingReservations: waiting })
      if (!chk.ok) return showWarning(chk.reason || 'Cannot renew.')
      const due = await renewLoan(l, settings)
      showSuccess(`Renewed until ${fmtDate(due)}`)
      refresh()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  async function decline(l: LibraryLoan) {
    setBusy(l.id)
    try {
      await declineRenewal(l.id)
      refresh()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  const exportCsv = () =>
    downloadCsv(`library-loans-${filter}-${today}.csv`, rows.map(l => ({
      member: l.memberName, code: l.memberCode, type: l.memberType, course: l.course || l.department, batch: l.batch,
      title: l.titleName, accessionNo: l.accessionNo, issued: l.issueDate, due: l.dueDate,
      daysOverdue: Math.max(0, daysBetween(l.dueDate, today)), fineSoFar: fineFor(l).amount,
    })))

  if (loansQ.isLoading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <PillTabs value={filter} onChange={setFilter} options={[
          { id: 'overdue', label: 'Overdue', count: counts.overdue },
          { id: 'due_soon', label: 'Due in 2 days', count: counts.due_soon },
          { id: 'requests', label: 'Renewal requests', count: counts.requests },
          { id: 'all', label: 'All issued', count: counts.all },
        ]} />
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="input-field !pl-9 !w-56" />
          </div>
          <button onClick={exportCsv} disabled={!rows.length} className={btn.ghost}><Download className="w-4 h-4" /> CSV</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty title={filter === 'overdue' ? 'Nothing overdue' : 'No loans here'} />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vriddhi-border">
                  <th className="table-header">Member</th>
                  <th className="table-header">Book</th>
                  <th className="table-header">Due</th>
                  <th className="table-header text-right">Fine so far</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(l => {
                  const st = loanState(l.dueDate, today)
                  const f = fineFor(l)
                  return (
                    <tr key={l.id} className="border-b border-vriddhi-border/50">
                      <td className="table-cell"><p className="font-medium text-slate-900 dark:text-white">{l.memberName}</p><p className="text-xs text-vriddhi-muted">{l.memberCode} · {[l.course || l.department, l.batch].filter(Boolean).join(' · ')}</p></td>
                      <td className="table-cell"><p className="text-sm text-vriddhi-text">{l.titleName}</p><p className="text-xs font-mono text-vriddhi-muted">{l.accessionNo}</p></td>
                      <td className="table-cell text-sm">
                        {fmtDate(l.dueDate)}{' '}
                        {st === 'overdue' ? <Badge tone="red">{daysBetween(l.dueDate, today)}d late</Badge> : st === 'due_soon' ? <Badge tone="amber">soon</Badge> : null}
                        {l.renewals > 0 && <span className="block text-[11px] text-vriddhi-muted">renewed {l.renewals}×</span>}
                        {l.renewRequestedAt && <span className="block text-[11px] text-blue-500">renewal requested {fmtDate(l.renewRequestedAt)}</span>}
                      </td>
                      <td className="table-cell text-right">{f.amount ? inr(f.amount) : '—'}</td>
                      <td className="table-cell text-right whitespace-nowrap">
                        <button onClick={() => renew(l)} disabled={busy === l.id} className={btn.small}><Check className="w-3 h-3" /> Renew</button>
                        {l.renewRequestedAt && <> <button onClick={() => decline(l)} disabled={busy === l.id} className={btn.small}><X className="w-3 h-3" /> Decline</button></>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
