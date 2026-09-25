// Library gate register — scan ID card to check in / out. Replaces the
// paper visitor register and feeds daily footfall into NAAC reports.

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, LogIn, LogOut, Users } from 'lucide-react'
import { ScanInput } from '../ScanInput'
import { Badge, StatCard, btn, downloadCsv, errMsg, fmtDateTime } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { fetchVisits, findMembers, toggleVisit } from '../../api/libraryApi'
import { todayIso } from '../../api/officeDb'
import { useCollegeId, useLibraryMembers } from '../../hooks/useLibrary'

export default function GateRegisterTab() {
  const { showSuccess, showWarning, showError } = useNotification()
  const cid = useCollegeId()
  const membersQ = useLibraryMembers()
  const [date, setDate] = useState(todayIso())
  const [purpose, setPurpose] = useState('Reading')
  const visitsQ = useQuery({ queryKey: ['library', cid, 'visits', date], queryFn: () => fetchVisits(date, date), enabled: !!cid })
  const visits = visitsQ.data || []
  const inside = visits.filter(v => !v.outAt)
  const byType = useMemo(() => ({
    student: visits.filter(v => v.memberType === 'student').length,
    staff: visits.filter(v => v.memberType !== 'student').length,
  }), [visits])

  async function onScan(code: string) {
    if (date !== todayIso()) return showWarning('Switch to today to record entries.')
    const hits = findMembers(membersQ.data || [], code, 2)
    if (hits.length !== 1) return showWarning(hits.length ? 'More than one match — scan the ID card or type the full reg. no.' : `No member matches "${code}".`)
    try {
      const dir = await toggleVisit(hits[0], inside, purpose)
      showSuccess(`${hits[0].name} checked ${dir}`)
      visitsQ.refetch()
    } catch (e) {
      showError(errMsg(e))
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Visits" value={visits.length} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Inside now" value={inside.length} icon={<LogIn className="w-5 h-5" />} tone="text-green-500" />
        <StatCard label="Students" value={byType.student} icon={<Users className="w-5 h-5" />} tone="text-blue-500" />
        <StatCard label="Faculty & staff" value={byType.staff} icon={<Users className="w-5 h-5" />} tone="text-purple-500" />
      </div>
      <div className="glass-card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[260px]"><ScanInput placeholder="Scan ID card at the gate (scan again on the way out)" onScan={onScan} autoFocus busy={membersQ.isLoading} /></div>
        <select className="input-field !w-auto" value={purpose} onChange={e => setPurpose(e.target.value)}>
          {['Reading', 'Borrow / return', 'Reference', 'Digital library', 'Newspaper / magazines', 'Other'].map(p => <option key={p}>{p}</option>)}
        </select>
        <input type="date" className="input-field !w-auto" value={date} max={todayIso()} onChange={e => setDate(e.target.value)} />
        <button onClick={() => downloadCsv(`gate-register-${date}.csv`, visits.map(v => ({ name: v.memberName, code: v.memberCode, type: v.memberType, department: v.department, purpose: v.purpose, in: v.inAt, out: v.outAt })))} disabled={!visits.length} className={btn.ghost}><Download className="w-4 h-4" /> CSV</button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-vriddhi-border"><th className="table-header">Member</th><th className="table-header">Purpose</th><th className="table-header">In</th><th className="table-header">Out</th></tr></thead>
          <tbody>
            {visits.length === 0 ? (
              <tr><td colSpan={4} className="table-cell text-center text-sm text-vriddhi-muted py-8">No entries for this day.</td></tr>
            ) : visits.map(v => (
              <tr key={v.id} className="border-b border-vriddhi-border/50">
                <td className="table-cell"><p className="text-sm font-medium text-slate-900 dark:text-white">{v.memberName}</p><p className="text-xs text-vriddhi-muted">{v.memberCode} · {v.department}</p></td>
                <td className="table-cell text-sm">{v.purpose}</td>
                <td className="table-cell text-sm">{fmtDateTime(v.inAt)}</td>
                <td className="table-cell text-sm">{v.outAt ? fmtDateTime(v.outAt) : <Badge tone="green"><LogOut className="w-3 h-3" /> inside</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
