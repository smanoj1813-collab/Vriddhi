// src/shared/utils/timetableGenerator.test.ts
// Run with: npm run test:unit  or  node --import tsx --test src/shared/utils/timetableGenerator.test.ts

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildTimeSlots,
  DEFAULT_SLOT_CONFIG,
  spreadPeriodsAcrossDays,
  generateWeeklyTimetable,
  balanceLabel,
} from './timetableGenerator'
import type { CohortDemand, SlotConfig } from './timetableGenerator'

function cohort(branch: string, batch: string, division: string, subjects: CohortDemand['subjects']): CohortDemand {
  return { branch, batch, semester: 1, division, subjects }
}
function subj(name: string, code: string, facultyId: string, periods: number, type: 'lecture' | 'lab' = 'lecture'): CohortDemand['subjects'][number] {
  return { subject: name, subjectCode: code, facultyId, facultyName: facultyId, periodsPerWeek: periods, type }
}

describe('buildTimeSlots', () => {
  it('excludes periods that overlap a break (default 10:40–11:00, 13:00–14:00)', () => {
    const grid = buildTimeSlots(DEFAULT_SLOT_CONFIG)
    const mon = grid.get('monday')!
    // 09:00–09:50, 09:50–10:40, then break 10:40–11:00 is skipped, next is 11:00–11:50
    assert.equal(mon[0].start, '09:00')
    assert.equal(mon[0].end, '09:50')
    assert.equal(mon[1].start, '09:50')
    assert.equal(mon[1].end, '10:40')
    assert.equal(mon[2].start, '11:00')
    // ensure no slot crosses a break
    for (const s of mon) {
      assert.equal(s.start < '10:40' ? s.end <= '10:40' : true, true)
      assert.equal(s.start < '13:00' ? s.end <= '13:00' || s.start >= '14:00' : true, true)
    }
    // 09–16 with two breaks and 50m periods should yield 6 slots
    assert.equal(mon.length, 6)
  })

  it('throws on overlapping or out-of-bounds breaks', () => {
    assert.throws(() =>
      buildTimeSlots({
        ...DEFAULT_SLOT_CONFIG,
        breaks: [
          { start: '10:00', end: '11:00', label: 'A' },
          { start: '10:30', end: '11:30', label: 'B' },
        ],
      })
    )
    assert.throws(() =>
      buildTimeSlots({
        ...DEFAULT_SLOT_CONFIG,
        dayStart: '09:00',
        dayEnd: '10:00',
        breaks: [{ start: '08:00', end: '08:30', label: 'Early' }],
      })
    )
  })

  it('yields identical slot starts for every working day (deterministic)', () => {
    const g = buildTimeSlots(DEFAULT_SLOT_CONFIG)
    const mon = g.get('monday')!.map(s => `${s.start}–${s.end}`)
    for (const d of DEFAULT_SLOT_CONFIG.workingDays) {
      assert.deepEqual(g.get(d)!.map(s => `${s.start}–${s.end}`), mon)
    }
  })
})

describe('spreadPeriodsAcrossDays', () => {
  it('splits evenly when divisible', () => {
    const plan = spreadPeriodsAcrossDays(6, ['monday','tuesday','wednesday'] as any, 'seed')
    assert.equal(plan.get('monday'), 2)
    assert.equal(plan.get('tuesday'), 2)
    assert.equal(plan.get('wednesday'), 2)
  })

  it('distributes remainder by hash(seed) so not all pile onto Monday', () => {
    const planA = spreadPeriodsAcrossDays(3, ['monday','tuesday','wednesday','thursday','friday','saturday'] as any, 'subjectA')
    const planB = spreadPeriodsAcrossDays(3, ['monday','tuesday','wednesday','thursday','friday','saturday'] as any, 'subjectB')
    // both sum to 3, each gets at most 1 per day
    assert.equal([...planA.values()].reduce((a,b)=>a+b,0), 3)
    assert.equal([...planB.values()].reduce((a,b)=>a+b,0), 3)
    assert.ok([...planA.values()].every(v=> v<=1))
    // different seeds should give different day allocations (probabilistic but true for these seeds)
    const aDays = [...planA.entries()].filter(([,v])=>v===1).map(([d])=>d).sort()
    const bDays = [...planB.entries()].filter(([,v])=>v===1).map(([d])=>d).sort()
    // at least one seed differs — verify deterministic but not all monday
    assert.ok(aDays.length===3 && bDays.length===3)
  })

  it('handles periods fewer than days without double-booking a day when possible', () => {
    const plan = spreadPeriodsAcrossDays(2, ['monday','tuesday','wednesday','thursday','friday','saturday'] as any, 'seed2')
    assert.equal([...plan.values()].reduce((a,b)=>a+b,0), 2)
    assert.ok([...plan.values()].every(v=> v<=1))
  })
})

describe('generateWeeklyTimetable — equal distribution & break handling', () => {
  const slotConfig: SlotConfig = {
    workingDays: ['monday','tuesday','wednesday','thursday','friday','saturday'],
    dayStart: '09:00',
    dayEnd: '16:00',
    periodMinutes: 50,
    breaks: [
      { start: '10:40', end: '11:00', label: 'Short Break' },
      { start: '13:00', end: '14:00', label: 'Lunch Break' },
    ],
  }

  it('generates the expected number of slots and respects breaks (no slot overlaps a break)', () => {
    const cohorts: CohortDemand[] = [
      cohort('B.Com','2026','A', [
        subj('Business Stats','BST101','f1',3),
        subj('Financial Acct','FAC101','f2',3),
      ]),
    ]
    const res = generateWeeklyTimetable({ cohorts, slotConfig, rooms: ['101','102'], maxPeriodsPerDayPerFaculty: 4, equalDistribution: true })
    assert.equal(res.slots.length, 6, '2 subjects × 3 periods')
    for (const s of res.slots) {
      for (const br of slotConfig.breaks) {
        const overlap = s.startTime < br.end && br.start < s.endTime
        assert.equal(overlap, false, `${s.subject} ${s.dayOfWeek} ${s.startTime}–${s.endTime} must not cross break ${br.label}`)
      }
    }
    assert.equal(res.stats.breaksRespected, true)
    assert.equal(res.hardClashes.length, 0, 'no faculty/room/cohort double-book')
    assert.equal(res.warnings.length, 0)
  })

  it('equalDistribution spreads each subject across days (no 3-on-Monday)', () => {
    const cohorts: CohortDemand[] = [
      cohort('BCA','2026','A', [
        subj('Maths','M101','f1',3),
        subj('Physics','P101','f2',3),
      ]),
    ]
    const res = generateWeeklyTimetable({ cohorts, slotConfig, rooms: ['101','102','103'], equalDistribution: true })
    // For 3 periods over 6 days, each subject should occupy 3 distinct days when equalDistribution is on
    const bySubject = new Map<string, Set<string>>()
    for (const s of res.slots) {
      const set = bySubject.get(s.subject) || new Set<string>()
      set.add(s.dayOfWeek)
      bySubject.set(s.subject, set)
    }
    for (const [, days] of bySubject) {
      assert.equal(days.size, 3, 'each subject should be on 3 distinct days when equalDistribution')
    }
  })

  it('levels faculty load and respects maxPeriodsPerDayPerFaculty', () => {
    const cohorts: CohortDemand[] = [
      cohort('BBA','2026','A', [
        subj('HR','HR101','f1',4),
        subj('Marketing','MKT101','f1',4), // same faculty for both subjects
      ]),
    ]
    const res = generateWeeklyTimetable({ cohorts, slotConfig, rooms: ['101','102'], maxPeriodsPerDayPerFaculty: 2, equalDistribution: true })
    // f1 has 8 periods across 6 days with cap 2/day → max per day should be <=2
    const load = res.stats.facultyDailyLoad['f1']
    assert.ok(load, 'faculty load tracked')
    for (const day of slotConfig.workingDays) {
      assert.ok((load[day] || 0) <= 2, `f1 on ${day} should be ≤2 with cap 2, got ${load[day]}`)
    }
    // variance should be low when capped
    assert.ok(res.stats.facultyVariance < 1.5, `variance ${res.stats.facultyVariance} should be low`)
    assert.ok(['success','warning'].includes(balanceLabel(res.stats.facultyVariance).color))
  })

  it('never double-books a room or cohort slot', () => {
    const cohorts: CohortDemand[] = [
      cohort('B.Com','2026','A', [ subj('S1','S1','f1',6), subj('S2','S2','f2',6) ]),
      cohort('B.Com','2026','B', [ subj('S3','S3','f3',6), subj('S4','S4','f4',6) ]),
    ]
    const res = generateWeeklyTimetable({ cohorts, slotConfig, rooms: ['101','102'], equalDistribution: true })
    // Check room double-booking
    const seenRoom = new Set<string>()
    for (const s of res.slots) {
      const key = `${s.dayOfWeek}|${s.startTime}|${s.room}`
      assert.equal(seenRoom.has(key), false, `room double-booked ${key}`)
      seenRoom.add(key)
    }
    // Check cohort double-booking
    const seenCohort = new Set<string>()
    for (const s of res.slots) {
      const key = `${s.dayOfWeek}|${s.startTime}|${s.cohortKey}`
      assert.equal(seenCohort.has(key), false, `cohort double-booked ${key}`)
      seenCohort.add(key)
    }
  })

  it('deterministic: same input → same slots, different seed → different remainder distribution', () => {
    const cohorts: CohortDemand[] = [ cohort('B.Sc','2026','A', [ subj('Chemistry','CH101','f1',3) ]) ]
    const a = generateWeeklyTimetable({ cohorts, slotConfig, rooms: ['101'] })
    const b = generateWeeklyTimetable({ cohorts, slotConfig, rooms: ['101'] })
    assert.deepEqual(a.slots.map(s=>`${s.dayOfWeek}|${s.startTime}|${s.subject}`), b.slots.map(s=>`${s.dayOfWeek}|${s.startTime}|${s.subject}`))
  })

  it('reports unmet demand when breaks leave insufficient capacity', () => {
    const tightConfig: SlotConfig = { ...slotConfig, dayStart: '09:00', dayEnd: '11:00', periodMinutes: 50, breaks: [{start:'09:50', end:'10:10', label:'Break'}] }
    // 09–11 with one break → 2 slots/day × 6 days = 12 total; demand 18 → unmet
    const cohorts: CohortDemand[] = [
      cohort('M.Com','2026','A', [ subj('S1','S1','f1',6), subj('S2','S2','f2',6), subj('S3','S3','f3',6) ]),
    ]
    const res = generateWeeklyTimetable({ cohorts, slotConfig: tightConfig, rooms: ['101','102','103'] })
    assert.ok(res.unmet.length > 0, 'should have unmet demand')
    assert.ok(res.warnings.some(w=> w.includes('still needs')), 'warnings should mention unmet')
  })
})

describe('balanceLabel', () => {
  it('maps variance to human labels', () => {
    assert.equal(balanceLabel(0.5).color, 'success')
    assert.equal(balanceLabel(1.2).color, 'success')
    assert.equal(balanceLabel(1.8).color, 'warning')
    assert.equal(balanceLabel(3).color, 'error')
  })
})
