// functions/src/autoTimetable.ts
// ─── Auto class scheduling callable — one-click, equal-distribution, break-aware
// See docs/auto-timetable-algorithm.md §§3.4–3.6 for the full spec.

import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { generateWeeklyTimetable, type SlotConfig, type CohortDemand } from './utils/timetableGeneratorCore'

const SCHEDULING_ROLES = ['superadmin','admin','principal','hod']
const MAX_BATCH_OPS = 400
const MAX_COHORTS_PER_CALL = 40
const MAX_SUBJECTS_PER_COHORT = 12

interface AutoGenerateInput {
  cohorts?: CohortDemand[]
  slotConfig?: Partial<SlotConfig>
  rooms?: string[]
  maxPeriodsPerDayPerFaculty?: number
  equalDistribution?: boolean
  dryRun?: boolean
  replace?: boolean // if true, deactivate existing auto-generated slots before creating
}

function isDay(v: unknown): v is SlotConfig['workingDays'][number] {
  return ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].includes(String(v).toLowerCase())
}

function validateInput(data: unknown): AutoGenerateInput {
  const raw = (data || {}) as Record<string,unknown>
  const out: AutoGenerateInput = {}
  if (raw.cohorts !== undefined) {
    if (!Array.isArray(raw.cohorts)) throw new HttpsError('invalid-argument','cohorts must be an array')
    if (raw.cohorts.length === 0) throw new HttpsError('invalid-argument','Provide at least one cohort')
    if (raw.cohorts.length > MAX_COHORTS_PER_CALL) throw new HttpsError('invalid-argument',`Too many cohorts (max ${MAX_COHORTS_PER_CALL})`)
    out.cohorts = (raw.cohorts as any[]).map((c, idx)=>{
      if (!c.branch || !c.batch) throw new HttpsError('invalid-argument',`Cohort ${idx}: branch and batch are required`)
      const subjects = Array.isArray(c.subjects) ? c.subjects : []
      if (subjects.length===0) throw new HttpsError('invalid-argument',`Cohort ${idx} (${c.branch} ${c.batch}): subjects required`)
      if (subjects.length>MAX_SUBJECTS_PER_COHORT) throw new HttpsError('invalid-argument',`Cohort ${idx}: too many subjects (max ${MAX_SUBJECTS_PER_COHORT})`)
      return {
        branch: String(c.branch).trim(),
        batch: String(c.batch).trim(),
        semester: Number(c.semester)||1,
        division: String(c.division||'').trim(),
        section: String(c.section||'').trim(),
        subjects: subjects.map((s:any)=>{
          if(!s.subject || !s.facultyId) throw new HttpsError('invalid-argument','Each subject needs subject and facultyId')
          return {
            subject: String(s.subject).trim(),
            subjectCode: String(s.subjectCode||'').trim(),
            facultyId: String(s.facultyId).trim(),
            facultyName: String(s.facultyName||s.facultyId).trim(),
            periodsPerWeek: Math.max(1, Math.min(12, Number(s.periodsPerWeek)||3)),
            type: (['lecture','lab','tutorial','seminar','workshop'].includes(String(s.type)) ? String(s.type) : 'lecture') as any,
            preferredRoom: String(s.preferredRoom||'').trim(),
          }
        })
      }
    })
  }
  if (raw.slotConfig !== undefined) {
    const sc = raw.slotConfig as Record<string,unknown>
    out.slotConfig = {}
    if (sc.workingDays !== undefined) {
      if (!Array.isArray(sc.workingDays) || !(sc.workingDays as unknown[]).every(isDay)) throw new HttpsError('invalid-argument','slotConfig.workingDays must be day names')
      out.slotConfig.workingDays = (sc.workingDays as string[]).map(s=> s.toLowerCase() as SlotConfig['workingDays'][number])
    }
    if (sc.dayStart !== undefined) out.slotConfig.dayStart = String(sc.dayStart)
    if (sc.dayEnd !== undefined) out.slotConfig.dayEnd = String(sc.dayEnd)
    if (sc.periodMinutes !== undefined) {
      const n=Number(sc.periodMinutes); if(!Number.isFinite(n)||n<30||n>90) throw new HttpsError('invalid-argument','periodMinutes must be 30–90')
      out.slotConfig.periodMinutes = n
    }
    if (sc.breaks !== undefined) {
      if(!Array.isArray(sc.breaks)) throw new HttpsError('invalid-argument','breaks must be an array')
      out.slotConfig.breaks = (sc.breaks as any[]).map(b=> ({
        start: String(b.start), end: String(b.end), label: String(b.label||'Break')
      }))
    }
  }
  if (raw.rooms !== undefined) {
    if(!Array.isArray(raw.rooms)) throw new HttpsError('invalid-argument','rooms must be string array')
    out.rooms = (raw.rooms as unknown[]).map(String).map(s=> s.trim()).filter(Boolean).slice(0,60)
  }
  if (raw.maxPeriodsPerDayPerFaculty !== undefined) out.maxPeriodsPerDayPerFaculty = Number(raw.maxPeriodsPerDayPerFaculty)
  if (raw.equalDistribution !== undefined) out.equalDistribution = raw.equalDistribution === true
  if (raw.dryRun !== undefined) out.dryRun = raw.dryRun === true
  if (raw.replace !== undefined) out.replace = raw.replace === true
  return out
}

async function resolveSchedulingStaff(uid:string, token: Record<string,unknown>): Promise<{uid:string;role:string;collegeId:string}> {
  const userDoc=await admin.firestore().collection('users').doc(uid).get()
  const user=userDoc.data()
  const role=String(token.role || user?.role || '')
  const collegeId=String(token.collegeId || user?.collegeId || '')
  if(!userDoc.exists || !SCHEDULING_ROLES.includes(role) || (role!=='superadmin' && !collegeId)){
    throw new HttpsError('permission-denied','Scheduling administration access is required (admin / principal / HOD / superadmin)')
  }
  return {uid,role,collegeId}
}

export const autoGenerateTimetable = onCall(
  { region:'asia-south1', memory:'512MiB', timeoutSeconds: 120, minInstances:0, maxInstances:10 },
  async (request)=>{
    const uid=request.auth?.uid
    if(!uid) throw new HttpsError('unauthenticated','Authentication is required')
    const staff=await resolveSchedulingStaff(uid, request.auth?.token || {})
    const input=validateInput(request.data)

    // If cohorts not supplied, we cannot invent them — ask caller to send them
    // (the UI derives them from faculty subjects).  This keeps the callable honest.
    if(!input.cohorts || input.cohorts.length===0){
      throw new HttpsError('invalid-argument','cohorts is required — send subjects by branch/batch/division')
    }
    const rooms=input.rooms && input.rooms.length ? input.rooms : ['101','102','201','Lab-1','LH-201']

    const result=generateWeeklyTimetable({
      cohorts: input.cohorts,
      slotConfig: input.slotConfig,
      rooms,
      maxPeriodsPerDayPerFaculty: input.maxPeriodsPerDayPerFaculty,
      equalDistribution: input.equalDistribution,
    })

    if (input.dryRun) {
      return {
        dryRun: true,
        collegeId: staff.collegeId,
        slots: result.slots,
        stats: result.stats,
        warnings: result.warnings,
        clashes: result.hardClashes,
        unmet: result.unmet,
        wouldCreate: result.slots.length,
      }
    }

    // — Write to weeklySchedules, college-scoped, faculty/room conflict-checked —
    // We write in batches; ids are auto-generated (weeklySchedules is the plan, not deterministic like classSessions).
    const db=admin.firestore()
    const now=new Date().toISOString()
    let created=0

    // Optional replace: deactivate existing slots for those cohorts/days before adding
    // For safety we only do soft-deactivate (isActive=false) on exact matching cohorts, not wipe whole college.
    if (input.replace) {
      const snap=await db.collection('weeklySchedules').where('collegeId','==', staff.collegeId).limit(2000).get()
      const toDeactivate=snap.docs.filter(d=>{
        const data=d.data() as any
        return input.cohorts!.some(c=> String(data.branch).toLowerCase()===c.branch.toLowerCase()
          && String(data.batch)===String(c.batch)
          && String(data.division||'').toLowerCase()===String(c.division||'').toLowerCase())
      })
      for(let i=0;i<toDeactivate.length;i+=MAX_BATCH_OPS){
        const chunk=toDeactivate.slice(i,i+MAX_BATCH_OPS)
        const batch=db.batch()
        chunk.forEach(doc=> batch.update(doc.ref,{ isActive:false, updatedAt: now, replacedByAuto: true }))
        await batch.commit()
      }
    }

    const docs = result.slots.map(slot=> ({
      collegeId: staff.collegeId,
      subject: slot.subject,
      subjectCode: slot.subjectCode,
      facultyId: slot.facultyId,
      facultyName: slot.facultyName,
      facultyInitials: slot.facultyName.split(' ').map(n=> n[0]).join('').toUpperCase().slice(0,3),
      branch: slot.branch,
      batch: slot.batch,
      semester: slot.semester,
      division: slot.division,
      section: slot.section,
      room: slot.room,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: slot.type,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      generatedBy: 'autoTimetable',
      autoGeneratedAt: now,
    }))

    // Chunked writes
    for(let i=0;i<docs.length;i+=MAX_BATCH_OPS){
      const chunk=docs.slice(i,i+MAX_BATCH_OPS)
      const batch=db.batch()
      chunk.forEach(docData=>{
        const ref=db.collection('weeklySchedules').doc()
        batch.set(ref, docData)
      })
      await batch.commit()
      created+=chunk.length
    }

    return {
      dryRun: false,
      collegeId: staff.collegeId,
      created,
      slots: result.slots.slice(0,50), // preview sample; full count is `created`
      stats: result.stats,
      warnings: result.warnings,
      clashes: result.hardClashes,
      unmet: result.unmet,
    }
  }
)
