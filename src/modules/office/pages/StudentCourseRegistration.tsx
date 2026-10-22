// /student/course-registration — pick this semester's electives from
// the college's baskets. Seat counts and validation are server-side.
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpenCheck, CheckCircle2, Clock, Send } from 'lucide-react'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Badge, Empty, Loading, PageHeader, btn, errMsg, fmtDate } from '../components/officeUi'
import { getMyRegistrationWindow, submitCourseRegistration, type RegSelections } from '../api/registrationApi'

export default function StudentCourseRegistration() {
  const qc = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const stateQ = useQuery({ queryKey: ['myRegWindow'], queryFn: getMyRegistrationWindow, staleTime: 30_000 })
  const data = stateQ.data
  const win = data?.window
  const [choices, setChoices] = useState<RegSelections | null>(null)

  const effective = useMemo<RegSelections>(() => choices ?? data?.mine?.selections ?? {}, [choices, data])
  const programme = data?.student?.programme || ''
  const groups = useMemo(
    () => (win ? win.groups.filter(g => !g.programmes.length || g.programmes.some(p => p.toLowerCase() === programme.toLowerCase())) : []),
    [win, programme],
  )

  const submit = useMutation({
    mutationFn: () => submitCourseRegistration(win!.id, effective),
    onSuccess: () => { showSuccess('Registration submitted'); setChoices(null); qc.invalidateQueries({ queryKey: ['myRegWindow'] }) },
    onError: e => showError(errMsg(e)),
  })

  if (stateQ.isLoading) return <div className="p-6"><Loading /></div>
  if (stateQ.isError) return <div className="p-6"><Empty icon={<BookOpenCheck className="w-8 h-8" />} title="Could not load registration" hint={errMsg(stateQ.error)} /></div>
  if (!win) return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader title="Course Registration" subtitle="Choose your elective subjects for this semester" icon={<BookOpenCheck className="w-5 h-5" />} />
      <Empty icon={<Clock className="w-8 h-8" />} title="No registration window for your semester yet" hint="Your college will open elective registration here at the start of the semester. Watch announcements for the dates." />
    </div>
  )

  const confirmed = data?.mine?.status === 'confirmed'
  const rejected = data?.mine?.status === 'rejected'
  const editable = !!data?.open && !confirmed
  const setChoice = (groupId: string, optionId: string, choose: number) => {
    const cur = effective[groupId] || []
    const next = cur.includes(optionId) ? cur.filter(id => id !== optionId) : (choose === 1 ? [optionId] : [...cur, optionId].slice(-choose))
    setChoices({ ...effective, [groupId]: next })
  }
  const complete = groups.every(g => (effective[g.id] || []).length === g.choose)

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader title={win.title} subtitle={`Semester ${win.semester} elective registration${data?.student ? ` — ${data.student.programme} (${data.student.batch})` : ''}`} icon={<BookOpenCheck className="w-5 h-5" />} />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {data?.open ? <Badge tone="green">Open{win.closesOn ? ` until ${fmtDate(win.closesOn)}` : ''}</Badge> : <Badge tone="red">Closed{win.opensOn ? ` · was open from ${fmtDate(win.opensOn)}` : ''}</Badge>}
        {data?.mine && <Badge tone={confirmed ? 'green' : rejected ? 'red' : 'amber'}>{confirmed ? 'Confirmed by college' : rejected ? 'Returned by college — resubmit' : `Submitted ${data.mine.updatedAt ? fmtDate(data.mine.updatedAt) : ''}`}</Badge>}
      </div>
      {confirmed && <p className="text-sm mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500" /> Your choices are confirmed. Any change must go through the college office.</p>}
      {!data?.open && <p className="text-sm text-vriddhi-muted mb-3">This window is not open right now. Your saved choices (if any) are shown below.</p>}

      <div className="space-y-4">
        {groups.map(g => (
          <div key={g.id} className="glass-card p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <p className="font-semibold">{g.label}</p>
              <Badge tone="blue">{g.category}</Badge>
              <span className="text-xs text-vriddhi-muted">Choose {g.choose}{g.programmes.length ? ` · for ${g.programmes.join(', ')}` : ''}</span>
              <span className="ml-auto text-xs">{(effective[g.id] || []).length}/{g.choose} picked</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {g.options.map(o => {
                const taken = data?.counts[o.id] || 0
                const left = o.capacity > 0 ? o.capacity - taken : null
                const picked = (effective[g.id] || []).includes(o.id)
                const full = left !== null && left <= 0 && !picked
                return (
                  <label key={o.id} className={`rounded-xl border px-3 py-2.5 ${picked ? 'border-teal-500 bg-teal-500/10' : 'border-slate-200 dark:border-slate-700'} ${editable && !full ? 'cursor-pointer' : 'opacity-70'}`}>
                    <span className="flex items-start gap-2">
                      <input type={g.choose === 1 ? 'radio' : 'checkbox'} name={g.id} className="mt-1" checked={picked} disabled={!editable || full} onChange={() => setChoice(g.id, o.id, g.choose)} />
                      <span>
                        <span className="block font-medium text-sm">{o.code ? `${o.code} — ` : ''}{o.name}</span>
                        <span className="block text-xs text-vriddhi-muted">{o.department && <>{o.department} · </>}{o.credits} credits{left !== null && <> · {full ? <b className="text-rose-500">Full ({o.capacity} seats)</b> : `${left} of ${o.capacity} seats left`}</>}</span>
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {editable && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className={btn.primary} disabled={!complete || submit.isPending} onClick={() => submit.mutate()}>
            <Send className="w-4 h-4" />{submit.isPending ? 'Submitting…' : data?.mine ? 'Update my choices' : 'Submit registration'}
          </button>
          {!complete && <p className="text-xs text-vriddhi-muted">Pick the required number of subjects in every basket to submit. You may amend your choices while the window is open (until the college confirms).</p>}
        </div>
      )}
    </div>
  )
}
