// functions/src/utils/timetableGeneratorCore.ts
// ─── Server port of src/shared/utils/timetableGenerator.ts ────────────────
// Pure helpers only — no Firebase, no Express.  Kept in sync with the client
// copy so previews and the callable agree.

export type DayOfWeek = 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday'
export type ClassType = 'lecture'|'lab'|'tutorial'|'seminar'|'workshop'

export interface BreakSlot { start: string; end: string; label: string }
export interface SlotConfig {
  workingDays: DayOfWeek[]
  dayStart: string
  dayEnd: string
  periodMinutes: number
  breaks: BreakSlot[]
}
export interface TimeSlot { start: string; end: string; index: number; day: DayOfWeek }

export const DEFAULT_SLOT_CONFIG: SlotConfig = {
  workingDays: ['monday','tuesday','wednesday','thursday','friday','saturday'],
  dayStart: '09:00',
  dayEnd: '16:00',
  periodMinutes: 50,
  breaks: [
    { start: '10:40', end: '11:00', label: 'Short Break' },
    { start: '13:00', end: '14:00', label: 'Lunch Break' },
  ],
}
export const DAY_ORDER: DayOfWeek[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

export interface SubjectDemand {
  subject: string; subjectCode: string; facultyId: string
  facultyName?: string; periodsPerWeek: number; type: ClassType; preferredRoom?: string
}
export interface CohortDemand {
  branch: string; batch: string; semester: number; division: string; section?: string
  subjects: SubjectDemand[]
}
export interface GeneratorInput {
  cohorts: CohortDemand[]
  slotConfig?: Partial<SlotConfig>
  rooms: string[]
  maxPeriodsPerDayPerFaculty?: number
  maxPeriodsPerDayPerCohort?: number
  equalDistribution?: boolean
}
export interface GeneratedSlot {
  cohortKey: string; branch: string; batch: string; semester: number
  division: string; section: string; dayOfWeek: DayOfWeek
  startTime: string; endTime: string
  subject: string; subjectCode: string; facultyId: string; facultyName: string
  room: string; type: ClassType
}
export interface DistributionStats {
  workingDays: number; slotsPerDay: number; totalSlotsPerWeek: number
  cohorts: Array<{ cohortKey: string; needed: number; placed: number; unmet: number; perDay: Record<string,number>; perSubject: Record<string,{needed:number;placed:number}> }>
  facultyDailyLoad: Record<string, Record<string,number>>
  facultyVariance: number
  breaksRespected: boolean
}
export interface GeneratorResult {
  slots: GeneratedSlot[]; stats: DistributionStats; warnings: string[]
  hardClashes: Array<{message:string;kind:string}>
  unmet: Array<{cohortKey:string;subject:string;needed:number;placed:number}>
}

function parseTimeToMinutes(time: string): number {
  const [h,m]=String(time||'').split(':').map(Number)
  return (Number.isFinite(h)?h:0)*60 + (Number.isFinite(m)?m:0)
}
function timesOverlapCorrect(s1:string,e1:string,s2:string,e2:string): boolean {
  return parseTimeToMinutes(s1) < parseTimeToMinutes(e2) && parseTimeToMinutes(s2) < parseTimeToMinutes(e1)
}
function fmt(m:number): string { const h=Math.floor(m/60), mm=m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}` }
function hashString(s:string): number { let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h=Math.imul(h,16777619)} return h>>>0 }
function cohortKeyOf(c:{branch:string;batch:string;division:string;section?:string}): string { return `${c.branch}|${c.batch}|${c.division}|${c.section||''}`.toLowerCase() }
function validateBreaks(breaks:BreakSlot[], dayStart:string, dayEnd:string): string[] {
  const errs:string[]=[]; const ds=parseTimeToMinutes(dayStart), de=parseTimeToMinutes(dayEnd)
  if(de<=ds) errs.push('dayEnd must be after dayStart')
  breaks.forEach((b,i)=>{ const s=parseTimeToMinutes(b.start), e=parseTimeToMinutes(b.end); if(!(e>s)) errs.push(`break ${i+1} (${b.label}): end must be after start`); if(s<ds||e>de) errs.push(`break ${i+1} (${b.label}): must be inside the school day`) })
  for(let i=0;i<breaks.length;i++) for(let j=i+1;j<breaks.length;j++) if(timesOverlapCorrect(breaks[i].start,breaks[i].end,breaks[j].start,breaks[j].end)) errs.push(`breaks "${breaks[i].label}" and "${breaks[j].label}" overlap`)
  return errs
}

export function buildTimeSlots(config: SlotConfig): Map<DayOfWeek, TimeSlot[]> {
  const grid=new Map<DayOfWeek, TimeSlot[]>()
  const errs=validateBreaks(config.breaks, config.dayStart, config.dayEnd)
  if(errs.length) throw new Error(`Invalid slot config: ${errs.join('; ')}`)
  const ds=parseTimeToMinutes(config.dayStart), de=parseTimeToMinutes(config.dayEnd)
  for(const day of config.workingDays){
    const list:TimeSlot[]=[]; let cursor=ds, idx=0
    while(cursor + config.periodMinutes <= de){
      const start=fmt(cursor), end=fmt(cursor+config.periodMinutes)
      const hit=config.breaks.find(b=> timesOverlapCorrect(start,end,b.start,b.end))
      if(hit){ cursor=parseTimeToMinutes(hit.end); continue }
      list.push({start,end,index:idx++,day}); cursor+=config.periodMinutes
    }
    grid.set(day,list)
  }
  return grid
}

export function spreadPeriodsAcrossDays(periods:number, workingDays:DayOfWeek[], seed:string): Map<DayOfWeek,number> {
  const d=workingDays.length, base=Math.floor(periods/d), rem=periods%d
  const shuffled=[...workingDays].sort((a,b)=> hashString(seed+'|'+a)-hashString(seed+'|'+b))
  const plan=new Map<DayOfWeek,number>(); workingDays.forEach(day=> plan.set(day,base))
  for(let i=0;i<rem;i++){ const day=shuffled[i]; plan.set(day,(plan.get(day)||0)+1) }
  return plan
}

function scoreCandidate(args:{remaining:number;timesToday:number;facultyLoadToday:number;maxFacultyPerDay:number;seed:string}): number {
  let score=args.remaining*10
  if(args.timesToday>=1) score-=12
  if(args.timesToday>=2) score-=20
  const ratio=args.facultyLoadToday/Math.max(1,args.maxFacultyPerDay)
  score-=ratio*6
  const jitter=(hashString(args.seed)%100)/1000
  score+=jitter
  return score
}

export function generateWeeklyTimetable(input: GeneratorInput): GeneratorResult {
  const cfg: SlotConfig = { ...DEFAULT_SLOT_CONFIG, ...(input.slotConfig||{}) } as SlotConfig
  cfg.workingDays = cfg.workingDays.filter((d,i,a)=> a.indexOf(d)===i).sort((a,b)=> DAY_ORDER.indexOf(a)-DAY_ORDER.indexOf(b))
  const equalDistribution = input.equalDistribution !== false
  const maxPerFacultyDay = input.maxPeriodsPerDayPerFaculty ?? 4
  const rooms = input.rooms.length ? input.rooms : ['101']
  const grid=buildTimeSlots(cfg)
  const slotsPerDay=grid.get(cfg.workingDays[0]||'monday')?.length ?? 0
  const totalSlotsPerWeek=cfg.workingDays.length*slotsPerDay
  const warnings:string[]=[]
  const unmet: Array<{cohortKey:string;subject:string;needed:number;placed:number}>=[]

  type DemandKey=string
  const demandLeft=new Map<DemandKey,number>()
  const lookup=new Map<DemandKey,{cohort:CohortDemand;subject:SubjectDemand}>()
  for(const cohort of input.cohorts){
    for(const subj of cohort.subjects){
      const key=`${cohortKeyOf(cohort)}::${subj.subjectCode||subj.subject}::${subj.facultyId}`
      demandLeft.set(key, subj.periodsPerWeek)
      lookup.set(key,{cohort,subject:subj})
    }
  }
  const spreadPlans=new Map<DemandKey, Map<DayOfWeek,number>>()
  for(const [key, periods] of demandLeft.entries()) spreadPlans.set(key, spreadPeriodsAcrossDays(periods, cfg.workingDays, key))

  const cohortOccupied=new Set<string>()
  const facultyOccupied=new Set<string>()
  const roomOccupied=new Map<string,Set<string>>()
  const facultyDayCount=new Map<string,number>()
  const slots: GeneratedSlot[]=[]

  function roomBusy(day:DayOfWeek,start:string,room:string): boolean {
    const s=roomOccupied.get(day); return s ? s.has(`${room}|${start}`) : false
  }
  function markRoomBusy(day:DayOfWeek,start:string,room:string): void {
    let s=roomOccupied.get(day); if(!s){ s=new Set(); roomOccupied.set(day,s)} s.add(`${room}|${start}`)
  }

  for(const cohort of input.cohorts){
    const needed=cohort.subjects.reduce((s,x)=> s+x.periodsPerWeek,0)
    if(needed>totalSlotsPerWeek) warnings.push(`${cohortKeyOf(cohort)} needs ${needed} periods but only ${totalSlotsPerWeek} slots exist with this break config — reduce periods or shorten a break.`)
  }

  for(const day of cfg.workingDays){
    const daySlots=grid.get(day)||[]
    for(let sIdx=0;sIdx<daySlots.length;sIdx++){
      const slot=daySlots[sIdx]
      const cohortsByNeed=[...input.cohorts].sort((a,b)=>{
        const needA=a.subjects.reduce((sum,subj)=>{ const k=`${cohortKeyOf(a)}::${subj.subjectCode||subj.subject}::${subj.facultyId}`; return sum+(demandLeft.get(k)||0)},0)
        const needB=b.subjects.reduce((sum,subj)=>{ const k=`${cohortKeyOf(b)}::${subj.subjectCode||subj.subject}::${subj.facultyId}`; return sum+(demandLeft.get(k)||0)},0)
        return needB-needA
      })
      for(const cohort of cohortsByNeed){
        const cKey=cohortKeyOf(cohort)
        const cohortSlotId=`${day}|${slot.start}|${cKey}`
        if(cohortOccupied.has(cohortSlotId)) continue
        type Cand={key:DemandKey;subject:SubjectDemand;score:number;timesToday:number}
        const cands:Cand[]=[]
        for(const subj of cohort.subjects){
          const key=`${cKey}::${subj.subjectCode||subj.subject}::${subj.facultyId}`
          const left=demandLeft.get(key)||0
          if(left<=0) continue
          const isLab=subj.type==='lab'
          if(isLab){
            const next=daySlots[sIdx+1]; if(!next) continue
          }
          const timesToday=slots.filter(s=> s.cohortKey===cKey && s.dayOfWeek===day && (s.subjectCode===subj.subjectCode || s.subject===subj.subject)).length
          const wantsToday=spreadPlans.get(key)?.get(day) ?? 0
          if (equalDistribution && timesToday >= wantsToday) {
            continue
          }
          const fDayKey=`${subj.facultyId}|${day}`
          const fLoad=facultyDayCount.get(fDayKey)||0
          if(fLoad>=maxPerFacultyDay) continue
          if(facultyOccupied.has(`${day}|${slot.start}|${subj.facultyId}`)) continue
          let room=subj.preferredRoom?.trim() ? subj.preferredRoom.trim() : ''
          if(!room){
            const found=rooms.find(r=> !roomBusy(day,slot.start,r))
            if(!found) continue; room=found
          } else if(roomBusy(day,slot.start,room)) continue
          if(isLab){
            const next=daySlots[sIdx+1]
            if(facultyOccupied.has(`${day}|${next.start}|${subj.facultyId}`)) continue
            if(roomBusy(day,next.start,room)) continue
          }
          const sc=scoreCandidate({remaining:left,timesToday,facultyLoadToday:fLoad,maxFacultyPerDay:maxPerFacultyDay,seed:`${cKey}|${subj.subjectCode}|${day}|${slot.start}`})
          const spreadBonus=(spreadPlans.get(key)?.get(day) ?? 0) > timesToday ? 3 : 0
          cands.push({key,subject:subj,score:sc+spreadBonus,timesToday})
        }
        if(cands.length===0) continue
        cands.sort((a,b)=> b.score-a.score)
        let chosen=cands[0]
        if(equalDistribution){
          const hasZero=cands.some(c=> c.timesToday===0)
          if(hasZero && chosen.timesToday>=1){
            const zeroBest=cands.find(c=> c.timesToday===0)
            if(zeroBest) chosen=zeroBest
          }
        }
        const isLab=chosen.subject.type==='lab'
        const cohortObj=lookup.get(chosen.key)!.cohort
        let room=chosen.subject.preferredRoom?.trim() ? chosen.subject.preferredRoom.trim() : rooms.find(r=> !roomBusy(day,slot.start,r)) || rooms[0]
        if(isLab){
          const next=daySlots[sIdx+1]
          const gSlot: GeneratedSlot={ cohortKey:cKey, branch:cohortObj.branch, batch:cohortObj.batch, semester:cohortObj.semester, division:cohortObj.division, section:cohortObj.section||'', dayOfWeek:day, startTime:slot.start, endTime:next.end, subject:chosen.subject.subject, subjectCode:chosen.subject.subjectCode, facultyId:chosen.subject.facultyId, facultyName:chosen.subject.facultyName||chosen.subject.facultyId, room, type:'lab' }
          slots.push(gSlot)
          cohortOccupied.add(`${day}|${slot.start}|${cKey}`)
          cohortOccupied.add(`${day}|${next.start}|${cKey}`)
          facultyOccupied.add(`${day}|${slot.start}|${chosen.subject.facultyId}`)
          facultyOccupied.add(`${day}|${next.start}|${chosen.subject.facultyId}`)
          markRoomBusy(day,slot.start,room); markRoomBusy(day,next.start,room)
          facultyDayCount.set(`${chosen.subject.facultyId}|${day}`, (facultyDayCount.get(`${chosen.subject.facultyId}|${day}`)||0)+1)
          const left=demandLeft.get(chosen.key)||0
          demandLeft.set(chosen.key, Math.max(0, left-1))
        } else {
          const gSlot: GeneratedSlot={ cohortKey:cKey, branch:cohortObj.branch, batch:cohortObj.batch, semester:cohortObj.semester, division:cohortObj.division, section:cohortObj.section||'', dayOfWeek:day, startTime:slot.start, endTime:slot.end, subject:chosen.subject.subject, subjectCode:chosen.subject.subjectCode, facultyId:chosen.subject.facultyId, facultyName:chosen.subject.facultyName||chosen.subject.facultyId, room, type:chosen.subject.type }
          slots.push(gSlot)
          cohortOccupied.add(`${day}|${slot.start}|${cKey}`)
          facultyOccupied.add(`${day}|${slot.start}|${chosen.subject.facultyId}`)
          markRoomBusy(day,slot.start,room)
          facultyDayCount.set(`${chosen.subject.facultyId}|${day}`, (facultyDayCount.get(`${chosen.subject.facultyId}|${day}`)||0)+1)
          demandLeft.set(chosen.key, (demandLeft.get(chosen.key)||0)-1)
        }
      }
    }
  }

  for(const [key,left] of demandLeft.entries()){
    if(left>0){
      const meta=lookup.get(key)!
      const cKey=cohortKeyOf(meta.cohort)
      unmet.push({cohortKey:cKey,subject:meta.subject.subject,needed:meta.subject.periodsPerWeek,placed:meta.subject.periodsPerWeek-left})
      warnings.push(`${cKey}: "${meta.subject.subject}" still needs ${left} period(s) — free rooms or reduce another subject.`)
    }
  }

  // stats
  const perCohort=new Map<string,{needed:number;placed:number;perDay:Record<string,number>;perSubject:Record<string,{needed:number;placed:number}>}>()
  for(const cohort of input.cohorts){
    const cKey=cohortKeyOf(cohort)
    const needed=cohort.subjects.reduce((s,x)=> s+x.periodsPerWeek,0)
    const entry={needed,placed:0,perDay:{} as Record<string,number>,perSubject:{} as Record<string,{needed:number;placed:number}>}
    cfg.workingDays.forEach(d=> entry.perDay[d]=0)
    cohort.subjects.forEach(subj=> entry.perSubject[subj.subject]={needed:subj.periodsPerWeek,placed:0})
    perCohort.set(cKey,entry)
  }
  for(const s of slots){
    const b=perCohort.get(s.cohortKey)
    if(b){ b.placed+=1; b.perDay[s.dayOfWeek]=(b.perDay[s.dayOfWeek]||0)+1; const ps=b.perSubject[s.subject]; if(ps) ps.placed+=1; else b.perSubject[s.subject]={needed:0,placed:1}}
  }
  const loads=[...facultyDayCount.values()]
  const mean=loads.length? loads.reduce((a,b)=>a+b,0)/loads.length:0
  const variance=loads.length? Math.sqrt(loads.reduce((sum,x)=> sum+(x-mean)**2,0)/loads.length):0
  let breaksRespected=true
  for(const s of slots) for(const br of cfg.breaks) if(timesOverlapCorrect(s.startTime,s.endTime,br.start,br.end)) { breaksRespected=false; break }
  const stats: DistributionStats={
    workingDays: cfg.workingDays.length,
    slotsPerDay,
    totalSlotsPerWeek: cfg.workingDays.length*slotsPerDay,
    cohorts: [...perCohort.entries()].map(([cohortKey,v])=> ({cohortKey,needed:v.needed,placed:v.placed,unmet:Math.max(0,v.needed-v.placed),perDay:v.perDay,perSubject:v.perSubject})),
    facultyDailyLoad: (()=>{ const out:Record<string,Record<string,number>>={}; for(const [k,c] of facultyDayCount.entries()){ const [fid,day]=k.split('|'); if(!out[fid]) out[fid]={}; out[fid][day]=c } return out })(),
    facultyVariance: Math.round(variance*100)/100,
    breaksRespected,
  }
  // clashes
  const hardClashes:Array<{message:string;kind:string}>=[]
  for(let i=0;i<slots.length;i++) for(let j=i+1;j<slots.length;j++){
    const a=slots[i],b=slots[j]
    if(a.dayOfWeek!==b.dayOfWeek) continue
    if(!timesOverlapCorrect(a.startTime,a.endTime,b.startTime,b.endTime)) continue
    if(a.facultyId && a.facultyId===b.facultyId) hardClashes.push({kind:'faculty',message:`Faculty ${a.facultyName} double-booked ${a.dayOfWeek} ${a.startTime}–${a.endTime} (${a.subject} vs ${b.subject})`})
    if(a.room && a.room===b.room) hardClashes.push({kind:'room',message:`Room ${a.room} double-booked ${a.dayOfWeek} ${a.startTime}–${a.endTime} (${a.subject} vs ${b.subject})`})
    if(a.cohortKey===b.cohortKey) hardClashes.push({kind:'cohort',message:`Cohort ${a.cohortKey} double-booked ${a.dayOfWeek} ${a.startTime}–${a.endTime} (${a.subject} vs ${b.subject})`})
  }

  return { slots, stats, warnings, hardClashes, unmet }
}
