// Hold queue: waiting reservations per title, copies kept aside ("ready")
// with their pickup deadline, and desk-placed holds.

import { useEffect, useMemo, useState } from 'react'
import { BookmarkPlus, X } from 'lucide-react'
import { Badge, Empty, Field, Loading, Modal, btn, errMsg, fmtDate } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { cancelReservation, expireStaleHolds, findMembers, reserveForMember, type LibraryMember, type LibraryReservation, type LibraryTitle } from '../../api/libraryApi'
import type { LibrarySettings } from '../../utils/libraryEngine'
import { useLibraryMembers, useLibraryRefresh, useLibraryTitles, useOpenReservations } from '../../hooks/useLibrary'

export default function ReservationsTab({ settings }: { settings: LibrarySettings }) {
  const { showSuccess, showError, showInfo } = useNotification()
  const resQ = useOpenReservations()
  const refresh = useLibraryRefresh()
  const [busy, setBusy] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [swept, setSwept] = useState(false)

  const list = resQ.data || []
  useEffect(() => {
    // release holds whose pickup window has passed, once per visit
    if (swept || !resQ.data) return
    setSwept(true)
    expireStaleHolds(resQ.data).then(n => {
      if (n) {
        showInfo(`${n} uncollected hold(s) expired and returned to the shelf.`)
        refresh()
      }
    }).catch(() => undefined)
  }, [resQ.data, swept, refresh, showInfo])

  const ready = list.filter(r => r.status === 'ready')
  const waiting = list.filter(r => r.status === 'waiting')
  const queuePos = useMemo(() => {
    const m = new Map<string, number>()
    const byTitle = new Map<string, LibraryReservation[]>()
    waiting.forEach(r => byTitle.set(r.titleId, [...(byTitle.get(r.titleId) || []), r]))
    byTitle.forEach(rs => rs.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((r, i) => m.set(r.id, i + 1)))
    return m
  }, [waiting])

  async function cancel(r: LibraryReservation) {
    if (!window.confirm(`Cancel ${r.memberName}’s reservation for “${r.titleName}”?`)) return
    setBusy(r.id)
    try {
      await cancelReservation(r)
      refresh()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  if (resQ.isLoading) return <Loading />

  const Row = ({ r }: { r: LibraryReservation }) => (
    <tr className="border-b border-vriddhi-border/50">
      <td className="table-cell"><p className="font-medium text-slate-900 dark:text-white">{r.memberName}</p><p className="text-xs text-vriddhi-muted">{r.memberCode} · {r.memberType}</p></td>
      <td className="table-cell text-sm">{r.titleName}{r.accessionNo && <span className="block text-xs font-mono text-vriddhi-muted">kept aside: {r.accessionNo}</span>}</td>
      <td className="table-cell text-sm">
        {r.status === 'ready' ? <><Badge tone={r.expiresAt < new Date().toISOString().slice(0, 10) ? 'red' : 'purple'}>Ready</Badge><span className="block text-[11px] text-vriddhi-muted">collect by {fmtDate(r.expiresAt)}</span></> : <><Badge tone="amber">#{queuePos.get(r.id)} in queue</Badge><span className="block text-[11px] text-vriddhi-muted">since {fmtDate(r.createdAt)}</span></>}
      </td>
      <td className="table-cell text-right"><button onClick={() => cancel(r)} disabled={busy === r.id} className={btn.small}><X className="w-3 h-3" /> Cancel</button></td>
    </tr>
  )

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-vriddhi-muted">Returned copies of a reserved title are kept aside automatically for {settings.reservationHoldDays} day(s). Issue them from the desk by scanning as usual.</p>
        <button onClick={() => setAdding(true)} className={btn.primary}><BookmarkPlus className="w-4 h-4" /> Reserve for a member</button>
      </div>
      {list.length === 0 ? (
        <Empty title="No open reservations" hint={settings.allowReservations ? 'Members can reserve books that are all on loan from their library page.' : 'Member self-reservation is turned off in Library Settings.'} />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-vriddhi-border"><th className="table-header">Member</th><th className="table-header">Title</th><th className="table-header">Status</th><th className="table-header" /></tr></thead>
            <tbody>
              {ready.map(r => <Row key={r.id} r={r} />)}
              {waiting.map(r => <Row key={r.id} r={r} />)}
            </tbody>
          </table>
        </div>
      )}
      {adding && <ReserveModal onClose={() => setAdding(false)} onDone={() => { setAdding(false); refresh(); showSuccess('Reservation placed.') }} />}
    </div>
  )
}

function ReserveModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { showError } = useNotification()
  const membersQ = useLibraryMembers()
  const titlesQ = useLibraryTitles()
  const [mq, setMq] = useState('')
  const [tq, setTq] = useState('')
  const [member, setMember] = useState<LibraryMember | null>(null)
  const [title, setTitle] = useState<LibraryTitle | null>(null)
  const [busy, setBusy] = useState(false)
  const mHits = member ? [] : findMembers(membersQ.data || [], mq, 6)
  const tHits = title || !tq.trim() ? [] : (titlesQ.data || []).filter(t => `${t.title} ${t.authors} ${t.isbn}`.toLowerCase().includes(tq.toLowerCase())).slice(0, 6)

  async function save() {
    if (!member || !title) return
    setBusy(true)
    try {
      await reserveForMember(title, member)
      onDone()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Reserve for a member" footer={<><button onClick={onClose} className={btn.ghost}>Cancel</button><button onClick={save} disabled={!member || !title || busy} className={btn.primary}>Reserve</button></>}>
      <div className="space-y-3">
        <Field label="Member">
          {member ? <div className="flex justify-between items-center"><span className="text-sm">{member.name} · {member.code}</span><button className={btn.small} onClick={() => setMember(null)}>Change</button></div> : <input className="input-field" value={mq} onChange={e => setMq(e.target.value)} placeholder="Reg. no / name" autoFocus />}
        </Field>
        {mHits.map(m => <button key={m.id} onClick={() => setMember(m)} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-vriddhi-border/40">{m.name} <span className="text-vriddhi-muted">· {m.code}</span></button>)}
        <Field label="Title">
          {title ? <div className="flex justify-between items-center"><span className="text-sm">{title.title}</span><button className={btn.small} onClick={() => setTitle(null)}>Change</button></div> : <input className="input-field" value={tq} onChange={e => setTq(e.target.value)} placeholder="Title / author / ISBN" />}
        </Field>
        {tHits.map(t => <button key={t.id} onClick={() => setTitle(t)} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-vriddhi-border/40">{t.title} <span className="text-vriddhi-muted">· {t.availableCopies}/{t.totalCopies} available</span></button>)}
      </div>
    </Modal>
  )
}
