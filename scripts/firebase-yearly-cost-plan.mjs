#!/usr/bin/env node
// Vriddhi — 1-year Firebase Blaze cost plan for one college (default 5,000 students)
//
// Role-by-role, day-type-by-day-type model of Firestore reads/writes derived
// from the queries the code actually runs, laid over a Karnataka degree-college
// academic calendar (Aug → Jul). The Blaze free quota (50,000 reads, 20,000
// writes per DAY, resets daily, does not roll over) is applied per day, so exam
// spikes are billed even when holidays sit under the quota.
//
//   node scripts/firebase-yearly-cost-plan.mjs                 # as coded today
//   node scripts/firebase-yearly-cost-plan.mjs --optimized     # after the 3 read fixes (see report §6)
//   node scripts/firebase-yearly-cost-plan.mjs --students 3000
//   node scripts/firebase-yearly-cost-plan.mjs --team 150000   # team ₹/month (default 5 × ₹30,000)
//   node scripts/firebase-yearly-cost-plan.mjs --json
//
// Estimate, not a bill. Unit prices are Sept-2026 list prices; usage drivers
// come from the code paths cited in docs/COSTING_PLAN_1YEAR_5000_STUDENTS.md.

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return fallback
  const v = args[i + 1]
  if (v === undefined || v.startsWith('--')) return true
  return isNaN(Number(v)) ? v : Number(v)
}
const STUDENTS = flag('students', 5000)
const OPTIMIZED = flag('optimized', false) === true
const TEAM_MONTHLY = flag('team', 5 * 30_000)
const FX = flag('fx', 96)
const JSON_OUT = flag('json', false) === true

// ── Blaze unit prices (USD) ──────────────────────────────────────────────────
const PRICE = {
  read: 0.06 / 100_000,
  write: 0.18 / 100_000,
  fsStorageGiBMonth: 0.18,
  csStorageGBMonth: 0.026,
  csDownloadGB: 0.12,
  hostingGB: 0.15,
  fixedMonthlyUsd: 1.7, // Artifact Registry ~$0.25 + Secret Manager $0.36 + RTDB ~$1 + misc
}
const FREE = { readsPerDay: 50_000, writesPerDay: 20_000, fsStorageGiB: 1, csStorageGB: 5, csDownloadGBMonth: 30, hostingGBMonth: 10.8 }

// ── Headcount ────────────────────────────────────────────────────────────────
const H = {
  students: STUDENTS,
  faculty: Math.round(STUDENTS / 25), // incl. HODs and mentors
  hod: Math.max(6, Math.round(STUDENTS / 330)),
  mentor: Math.round(STUDENTS / 125),
  admin: 5, // principal + college admins / exam cell
  accounts: 5,
  operations: 8, // office, library, inventory, procurement, admissions
  superadmin: 2, // vendor operations users
}
H.users = H.students + H.faculty + H.admin + H.accounts + H.operations
const SECTIONS = Math.ceil(STUDENTS / 60)
const FINAL_YEAR = Math.round(STUDENTS / 3)
const NEW_ADMISSIONS = Math.round(STUDENTS * 0.3)

// ── Per-role daily profiles (reads / writes per ACTIVE user per day) ─────────
// Student dashboard as coded: fetchProfile 2 + attendanceRecords (limit 500,
// no semester filter, no cache) + assignments ~15 + fees ~8 + today schedule
// ~35 + notifications ~20 + tests callable ~15 server reads.
const STUDENT_DASH_BASE = 100
const attendanceReadsPerDash = (ramp) => (OPTIMIZED ? 1 : Math.round(500 * ramp))
const STUDENT = {
  dauTeach: 0.6, dauIA: 0.9, dauUni: 0.4, dauResult: 0.8, dauOff: 0.12,
  dashLoadsTeach: 1.5, dashLoadsOther: 1,
  otherPageReads: 120, // timetable / materials / fees / assignments pages
  writesTeach: 3, writesOff: 1,
}
const FACULTY = { dauTeach: 0.85, dauUni: 0.3, dauOff: 0.25, readsTeach: 380, writesTeach: 15, readsIAExtra: 100, writesIAExtra: 20, readsUni: 150, writesUni: 5, readsOff: 100, writesOff: 3 }
const HOD_EXTRA = { reads: 600, writes: 10 } // department analytics (500-cap queries)
const MENTOR_EXTRA = { reads: 80, writes: 2 }
const ATTENDANCE = { sessionsPerDay: SECTIONS * 5, readsPerSession: 70, writesPerSession: 63, iaFactor: 0.6 }
const ADMIN = { reads: 6000, writes: 100 } // dashboard 4×500 + analytics; per user per working day
const ACCOUNTS = { reads: OPTIMIZED ? 2500 : 4000, writes: 40 } // fee page = structures 500 + students 500 + payments 500 per load
const OPERATIONS = { reads: 8000, writes: 150 } // OperationsDesk lists, library catalogue, inventory, procurement
const SUPERADMIN = { readsPerDay: OPTIMIZED ? 8000 : 81_000, writes: 20 } // 1–2 min polling × 6 h tab
const STAFF_OFF_ACTIVITY = 0.05

// ── Event volumes (per year) ─────────────────────────────────────────────────
const EV = {
  testsPerStudent: 20, // online IA/practice tests
  attemptReads: 155, attemptWrites: 24, attemptInvocations: 12, // post-optimisation (docs/HANDOFF_exam_autosave_cost.md) + grading/publish
  assignmentsPerStudent: 8, subReads: 35, subWrites: 7, subInvocations: 3, subFileMB: 1.5,
  feeCollections: STUDENTS * 4, collectionReads: 2, collectionWrites: 3,
  challanBursts: 4, challanWritesEach: 3,
  libraryLoansPerStudent: 10, loanReads: 6, loanWrites: 4, // issue + return
  libraryVisitsPerStudent: 40,
  libraryMemberSyncReads: STUDENTS, memberSyncsPerYear: 52,
  visitReportReads: Math.min(50_000, STUDENTS * 4), visitReportsPerYear: 24,
  admissionReads: 10, admissionWrites: 6,
  resultImports: 2,
  hallTicketBatches: 2,
  noDuesSignoffs: 6,
  semesterRollovers: 2,
  timetableGenWrites: SECTIONS * 30,
  materialsPerFaculty: 20, materialMB: 5, materialDownloadsPerStudent: 30,
  pdfKB: 150,
}

// ── Academic calendar (Aug 2026 → Jul 2027) ──────────────────────────────────
// teach = regular class days · ia = internal-assessment (online test) days, classes continue
// uni = university semester-end exam days (no classes) · result = result publication day
// staffOnly = office working days with no classes (admissions / vacation) · off = weekends + holidays
const MONTHS = [
  { m: 'Aug 2026', teach: 20, ia: 0, uni: 0, result: 0, staffOnly: 2, off: 9, ramp: 0.1, admit: 0.15, fees: 0.3, challanBurst: 1, rollover: 1, timetable: 1, ai: 0.04 },
  { m: 'Sep 2026', teach: 22, ia: 0, uni: 0, result: 0, staffOnly: 0, off: 8, ramp: 0.35, admit: 0.05, fees: 0.15, challanBurst: 0, rollover: 0, timetable: 0, ai: 0.08 },
  { m: 'Oct 2026', teach: 15, ia: 6, uni: 0, result: 0, staffOnly: 0, off: 10, ramp: 0.6, admit: 0, fees: 0.05, challanBurst: 1, rollover: 0, timetable: 0, ai: 0.12 },
  { m: 'Nov 2026', teach: 16, ia: 6, uni: 0, result: 0, staffOnly: 0, off: 8, ramp: 0.85, admit: 0, fees: 0.02, challanBurst: 0, rollover: 0, timetable: 0, ai: 0.14 },
  { m: 'Dec 2026', teach: 10, ia: 0, uni: 8, result: 0, staffOnly: 4, off: 9, ramp: 1, admit: 0, fees: 0.02, challanBurst: 0, rollover: 0, timetable: 0, hallTickets: 1, ai: 0.1 },
  { m: 'Jan 2027', teach: 8, ia: 0, uni: 9, result: 0, staffOnly: 3, off: 11, ramp: 1, admit: 0, fees: 0.25, challanBurst: 1, rollover: 1, timetable: 1, ai: 0.05 },
  { m: 'Feb 2027', teach: 21, ia: 0, uni: 0, result: 1, staffOnly: 0, off: 6, ramp: 1, admit: 0, fees: 0.15, challanBurst: 0, rollover: 0, timetable: 0, ai: 0.07 },
  { m: 'Mar 2027', teach: 15, ia: 6, uni: 0, result: 0, staffOnly: 0, off: 10, ramp: 1, admit: 0, fees: 0.04, challanBurst: 1, rollover: 0, timetable: 0, ai: 0.12 },
  { m: 'Apr 2027', teach: 16, ia: 6, uni: 0, result: 0, staffOnly: 0, off: 8, ramp: 1, admit: 0, fees: 0.01, challanBurst: 0, rollover: 0, timetable: 0, ai: 0.14 },
  { m: 'May 2027', teach: 8, ia: 0, uni: 10, result: 0, staffOnly: 4, off: 9, ramp: 1, admit: 0, fees: 0.01, challanBurst: 0, rollover: 0, timetable: 0, hallTickets: 1, noDues: 1, ai: 0.09 },
  { m: 'Jun 2027', teach: 0, ia: 0, uni: 5, result: 1, staffOnly: 16, off: 8, ramp: 1, admit: 0.4, fees: 0, challanBurst: 0, rollover: 0, timetable: 0, ai: 0.03 },
  { m: 'Jul 2027', teach: 0, ia: 0, uni: 0, result: 0, staffOnly: 23, off: 8, ramp: 1, admit: 0.4, fees: 0, challanBurst: 0, rollover: 0, timetable: 0, ai: 0.02 },
]
const TOTAL_TEACH = MONTHS.reduce((a, x) => a + x.teach, 0)
const TOTAL_CLASS_DAYS = MONTHS.reduce((a, x) => a + x.teach + x.ia, 0)
const TOTAL_IA = MONTHS.reduce((a, x) => a + x.ia, 0)

// AI budget (₹/yr) from scripts/cost-model.mjs base case, distributed by month weights above.
const AI_ANNUAL_INR = OPTIMIZED ? 46_000 : 1_16_020

// ── Daily usage builders ─────────────────────────────────────────────────────
const attemptsPerIADay = (STUDENTS * EV.testsPerStudent) / TOTAL_IA
const submissionsPerTeachDay = (STUDENTS * EV.assignmentsPerStudent) / TOTAL_TEACH
const loansPerClassDay = (STUDENTS * EV.libraryLoansPerStudent) / TOTAL_CLASS_DAYS
const visitsPerClassDay = (STUDENTS * EV.libraryVisitsPerStudent) / TOTAL_CLASS_DAYS

function studentDay(kind, ramp) {
  const dash = STUDENT_DASH_BASE + attendanceReadsPerDash(ramp)
  const dau = { teach: STUDENT.dauTeach, ia: STUDENT.dauIA, uni: STUDENT.dauUni, result: STUDENT.dauResult, off: STUDENT.dauOff, staffOnly: STUDENT.dauOff }[kind]
  const loads = kind === 'teach' || kind === 'ia' ? STUDENT.dashLoadsTeach : STUDENT.dashLoadsOther
  const other = kind === 'teach' || kind === 'ia' ? STUDENT.otherPageReads : kind === 'uni' ? 60 : 20
  const active = STUDENTS * dau
  return {
    reads: active * (loads * dash + other),
    writes: active * (kind === 'teach' || kind === 'ia' ? STUDENT.writesTeach : STUDENT.writesOff),
    invocations: active * loads, // tests-list callable on every dashboard load
    active,
  }
}
function staffDay(kind, month) {
  const working = kind !== 'off'
  const f = working ? 1 : STAFF_OFF_ACTIVITY
  let reads = 0, writes = 0
  // faculty
  if (kind === 'teach' || kind === 'ia') {
    const fa = H.faculty * FACULTY.dauTeach
    reads += fa * (FACULTY.readsTeach + (kind === 'ia' ? FACULTY.readsIAExtra : 0))
    writes += fa * (FACULTY.writesTeach + (kind === 'ia' ? FACULTY.writesIAExtra : 0))
    reads += H.hod * HOD_EXTRA.reads + H.mentor * MENTOR_EXTRA.reads
    writes += H.hod * HOD_EXTRA.writes + H.mentor * MENTOR_EXTRA.writes
    const sessions = ATTENDANCE.sessionsPerDay * (kind === 'ia' ? ATTENDANCE.iaFactor : 1)
    reads += sessions * ATTENDANCE.readsPerSession
    writes += sessions * ATTENDANCE.writesPerSession
  } else if (kind === 'uni') {
    reads += H.faculty * FACULTY.dauUni * FACULTY.readsUni
    writes += H.faculty * FACULTY.dauUni * FACULTY.writesUni
  } else {
    reads += H.faculty * FACULTY.dauOff * FACULTY.readsOff * (working ? 1 : 1)
    writes += H.faculty * FACULTY.dauOff * FACULTY.writesOff
  }
  // admin / accounts / operations / superadmin
  reads += f * (H.admin * ADMIN.reads + H.accounts * ACCOUNTS.reads + H.operations * OPERATIONS.reads)
  writes += f * (H.admin * ADMIN.writes + H.accounts * ACCOUNTS.writes + H.operations * OPERATIONS.writes)
  if (working) { reads += H.superadmin * SUPERADMIN.readsPerDay * 0.5; writes += H.superadmin * SUPERADMIN.writes } // ~1 tab open on average
  // fee collections spread over the month's working days
  const workingDays = month.teach + month.ia + month.uni + month.result + month.staffOnly
  if (working && workingDays > 0) {
    const perDay = (EV.feeCollections * month.fees) / workingDays
    reads += perDay * EV.collectionReads
    writes += perDay * EV.collectionWrites
    const admitPerDay = (NEW_ADMISSIONS * (month.admit || 0)) / workingDays
    reads += admitPerDay * EV.admissionReads
    writes += admitPerDay * EV.admissionWrites
  }
  return { reads, writes }
}
function eventDay(kind) {
  let reads = 0, writes = 0, invocations = 0
  if (kind === 'ia') {
    reads += attemptsPerIADay * EV.attemptReads
    writes += attemptsPerIADay * EV.attemptWrites
    invocations += attemptsPerIADay * EV.attemptInvocations
  }
  if (kind === 'teach') {
    reads += submissionsPerTeachDay * EV.subReads
    writes += submissionsPerTeachDay * EV.subWrites
    invocations += submissionsPerTeachDay * EV.subInvocations
  }
  if (kind === 'teach' || kind === 'ia') {
    reads += loansPerClassDay * EV.loanReads
    writes += loansPerClassDay * EV.loanWrites + visitsPerClassDay
  }
  return { reads, writes, invocations }
}

// ── Month loop ───────────────────────────────────────────────────────────────
let fsGiB = 0.5, csGB = 2
csGB += (H.faculty * EV.materialsPerFaculty * EV.materialMB) / 1024 // materials uploaded up front
const rows = []
let cumulative = 0
for (const mo of MONTHS) {
  const kinds = ['teach', 'ia', 'uni', 'result', 'staffOnly', 'off']
  let reads = 0, writes = 0, invocations = 0, billableReads = 0, billableWrites = 0
  const byRole = { students: 0, staff: 0, events: 0 }
  const peak = { reads: 0, writes: 0, kind: '' }
  for (const kind of kinds) {
    const days = mo[kind]
    if (!days) continue
    const s = studentDay(kind, mo.ramp)
    const st = staffDay(kind, mo)
    const ev = eventDay(kind)
    const dr = s.reads + st.reads + ev.reads
    const dw = s.writes + st.writes + ev.writes
    reads += dr * days; writes += dw * days; invocations += (s.invocations + ev.invocations) * days
    byRole.students += s.reads * days; byRole.staff += st.reads * days; byRole.events += ev.reads * days
    billableReads += Math.max(0, dr - FREE.readsPerDay) * days
    billableWrites += Math.max(0, dw - FREE.writesPerDay) * days
    if (dr > peak.reads) peak.reads = dr, peak.kind = kind
    if (dw > peak.writes) peak.writes = dw
  }
  // one-off bursts (all on working days that already exceed the free quota → fully billable)
  let burstWrites = 0, burstReads = 0
  if (mo.challanBurst) { burstWrites += STUDENTS * EV.challanWritesEach; burstReads += STUDENTS }
  if (mo.rollover) burstWrites += STUDENTS
  if (mo.timetable) burstWrites += EV.timetableGenWrites
  if (mo.result) { burstWrites += STUDENTS; burstReads += STUDENTS }
  if (mo.noDues) { burstWrites += FINAL_YEAR * EV.noDuesSignoffs; burstReads += 100_000 }
  if (mo.admit) { burstWrites += NEW_ADMISSIONS * mo.admit; burstReads += 0 } // bulk provisioning
  const classDays = mo.teach + mo.ia
  burstReads += (EV.libraryMemberSyncReads * EV.memberSyncsPerYear) / 12 + (EV.visitReportReads * EV.visitReportsPerYear) / 12
  reads += burstReads; writes += burstWrites; billableReads += burstReads; billableWrites += burstWrites

  // storage growth
  const attendanceDocsMonth = ATTENDANCE.sessionsPerDay * 60 * (mo.teach + mo.ia * ATTENDANCE.iaFactor)
  fsGiB += (attendanceDocsMonth * 1.2) / 1024 / 1024
  fsGiB += (visitsPerClassDay * classDays * 0.5 + loansPerClassDay * classDays * 1) / 1024 / 1024
  fsGiB += mo.ia ? (attemptsPerIADay * mo.ia * 15) / 1024 / 1024 : 0
  fsGiB += 0.05
  const assignmentsGB = (submissionsPerTeachDay * mo.teach * EV.subFileMB) / 1024
  const pdfGB = ((mo.challanBurst ? STUDENTS : 0) + (mo.hallTickets ? STUDENTS : 0)) * EV.pdfKB / 1024 / 1024
  const admitDocsGB = (NEW_ADMISSIONS * (mo.admit || 0) * 3) / 1024
  csGB += assignmentsGB + pdfGB + admitDocsGB
  const downloadGB = (STUDENTS * EV.materialDownloadsPerStudent * EV.materialMB / 1024) * (classDays / TOTAL_CLASS_DAYS) + assignmentsGB + pdfGB * 2
  const hostingGB = (H.users * 3 * 2) / 1024 + ((STUDENTS * 0.4 + H.faculty) * 50 * 30) / 1024 / 1024

  const usd = {
    reads: billableReads * PRICE.read,
    writes: billableWrites * PRICE.write,
    fsStorage: Math.max(0, fsGiB - FREE.fsStorageGiB) * PRICE.fsStorageGiBMonth,
    csStorage: Math.max(0, csGB - FREE.csStorageGB) * PRICE.csStorageGBMonth,
    csDownload: Math.max(0, downloadGB - FREE.csDownloadGBMonth) * PRICE.csDownloadGB,
    hosting: Math.max(0, hostingGB - FREE.hostingGBMonth) * PRICE.hostingGB,
    functions: 0, // ≤ 0.7 M invocations / month vs 2 M free; compute inside free tier
    fixed: PRICE.fixedMonthlyUsd,
  }
  const cloudUsd = Object.values(usd).reduce((a, b) => a + b, 0)
  const cloudInr = cloudUsd * FX
  const aiInr = AI_ANNUAL_INR * mo.ai
  const toolsInr = 1250 // Google Workspace (5 seats) + domain, monthly
  const teamInr = TEAM_MONTHLY
  const totalInr = cloudInr + aiInr + toolsInr + teamInr
  cumulative += totalInr
  rows.push({ month: mo.m, days: { teach: mo.teach, ia: mo.ia, uni: mo.uni, result: mo.result, staffOnly: mo.staffOnly, off: mo.off }, reads, writes, invocations, billableReads, billableWrites, peakDayReads: peak.reads, peakDayWrites: peak.writes, peakKind: peak.kind, byRole, fsGiB, csGB, downloadGB, usd, cloudUsd, cloudInr, aiInr, toolsInr, teamInr, totalInr, cumulative })
}

// ── Annual roll-up ───────────────────────────────────────────────────────────
const sumBy = (k) => rows.reduce((a, r) => a + r[k], 0)
const annual = {
  reads: sumBy('reads'), writes: sumBy('writes'), invocations: sumBy('invocations'),
  billableReads: sumBy('billableReads'), billableWrites: sumBy('billableWrites'),
  freeReadsUsed: sumBy('reads') - sumBy('billableReads'), freeWritesUsed: sumBy('writes') - sumBy('billableWrites'),
  cloudUsd: sumBy('cloudUsd'), cloudInr: sumBy('cloudInr'), aiInr: sumBy('aiInr'), toolsInr: sumBy('toolsInr'), teamInr: sumBy('teamInr'), totalInr: sumBy('totalInr'),
  usd: Object.fromEntries(Object.keys(rows[0].usd).map((k) => [k, rows.reduce((a, r) => a + r.usd[k], 0)])),
  byRoleReads: { students: rows.reduce((a, r) => a + r.byRole.students, 0), staff: rows.reduce((a, r) => a + r.byRole.staff, 0), events: rows.reduce((a, r) => a + r.byRole.events, 0) },
}
annual.cloudAiToolsInr = annual.cloudInr + annual.aiInr + annual.toolsInr
annual.breakEvenPerStudent = annual.totalInr / STUDENTS
annual.breakEvenPerUser = annual.totalInr / H.users
annual.cashFloorPerStudent = annual.cloudAiToolsInr / STUDENTS
annual.priceAt = Object.fromEntries([0.3, 0.35, 0.4].map((m) => [m, annual.totalInr / (1 - m) / STUDENTS]))

// per-role daily snapshot on a steady-state teaching day (Feb) for the report
const feb = MONTHS[6]
const snap = {
  student: studentDay('teach', 1), staff: staffDay('teach', feb), events: eventDay('teach'),
  studentIA: studentDay('ia', 1), staffIA: staffDay('ia', MONTHS[7]), eventsIA: eventDay('ia'),
  studentOff: studentDay('off', 1), staffOff: staffDay('off', feb),
}
const roleTable = [
  { role: 'Student (per active student)', users: H.students, activeTeach: `${STUDENT.dauTeach * 100}%`, readsPerDayTeach: STUDENT.dashLoadsTeach * (STUDENT_DASH_BASE + attendanceReadsPerDash(1)) + STUDENT.otherPageReads, writesPerDayTeach: STUDENT.writesTeach, note: OPTIMIZED ? 'dashboard 101 reads/load (aggregate attendance doc)' : 'dashboard ≈600 reads/load: 500 raw attendanceRecords + 100' },
  { role: 'Faculty (per active faculty)', users: H.faculty, activeTeach: `${FACULTY.dauTeach * 100}%`, readsPerDayTeach: FACULTY.readsTeach, writesPerDayTeach: FACULTY.writesTeach, note: 'dashboard/schedule ≈230 + QB/papers/assignments ≈150; attendance marking counted per session below' },
  { role: 'HOD (extra over faculty)', users: H.hod, activeTeach: '100%', readsPerDayTeach: HOD_EXTRA.reads, writesPerDayTeach: HOD_EXTRA.writes, note: 'department analytics, 500-cap queries' },
  { role: 'Mentor (extra over faculty)', users: H.mentor, activeTeach: '100%', readsPerDayTeach: MENTOR_EXTRA.reads, writesPerDayTeach: MENTOR_EXTRA.writes, note: 'mentee list + View 360' },
  { role: 'Attendance marking (per session)', users: ATTENDANCE.sessionsPerDay, activeTeach: `${ATTENDANCE.sessionsPerDay}/day`, readsPerDayTeach: ATTENDANCE.readsPerSession, writesPerDayTeach: ATTENDANCE.writesPerSession, note: 'roster 60 + session + prior; writes = 60 attendanceRecords + attendance + summary + session' },
  { role: 'Principal / Admin / Exam cell', users: H.admin, activeTeach: '100%', readsPerDayTeach: ADMIN.reads, writesPerDayTeach: ADMIN.writes, note: 'dashboard 4×500 reads/load, analytics, compliance; + result imports, timetable generation (bursts)' },
  { role: 'Accounts team', users: H.accounts, activeTeach: '100%', readsPerDayTeach: ACCOUNTS.reads, writesPerDayTeach: ACCOUNTS.writes, note: 'fee page 1,500 reads/load; + 3 writes per collection, 15,000-write challan bursts' },
  { role: 'Operations team (office/library/inventory/procurement)', users: H.operations, activeTeach: '100%', readsPerDayTeach: OPERATIONS.reads, writesPerDayTeach: OPERATIONS.writes, note: 'list-heavy pages (catalogue ≤20K, visits ≤50K); + library loans/visits, admissions, no-dues' },
  { role: 'Superadmin (vendor)', users: H.superadmin, activeTeach: '~1 tab', readsPerDayTeach: SUPERADMIN.readsPerDay, writesPerDayTeach: SUPERADMIN.writes, note: OPTIMIZED ? 'polling 10 min / focus-only' : 'dashboards poll every 1–2 min ≈ 225 reads/min' },
]

const out = { inputs: { students: STUDENTS, optimized: OPTIMIZED, teamMonthlyInr: TEAM_MONTHLY, fx: FX, headcount: H, sections: SECTIONS, teachingDays: TOTAL_TEACH, iaDays: TOTAL_IA }, roleTable, snapshot: snap, months: rows, annual }
if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0) }

// ── Print ────────────────────────────────────────────────────────────────────
const inr = (x) => '₹' + Math.round(x).toLocaleString('en-IN')
const n = (x) => Math.round(x).toLocaleString('en-IN')
const M = (x) => (x / 1e6).toFixed(1) + 'M'
const line = () => console.log('─'.repeat(118))
console.log(`\nVRIDDHI 1-YEAR FIREBASE COST PLAN — ${n(STUDENTS)} students · ${H.faculty} faculty · ${H.admin} admin · ${H.accounts} accounts · ${H.operations} operations · ${OPTIMIZED ? 'OPTIMIZED reads' : 'AS CODED today'} · team ${inr(TEAM_MONTHLY)}/month`)
line()
console.log('PER-ROLE DAILY PROFILE (steady-state teaching day)')
console.log('  ' + 'Role'.padEnd(56) + 'Users'.padStart(7) + 'Active'.padStart(9) + 'Reads/day'.padStart(11) + 'Writes/day'.padStart(12) + '  Basis')
for (const r of roleTable) console.log('  ' + r.role.padEnd(56) + n(r.users).padStart(7) + String(r.activeTeach).padStart(9) + n(r.readsPerDayTeach).padStart(11) + n(r.writesPerDayTeach).padStart(12) + '  ' + r.note)
line()
console.log('WHOLE-COLLEGE DAILY TOTALS vs BLAZE FREE QUOTA (50,000 reads / 20,000 writes per day)')
const dayRow = (label, s, st, ev) => console.log('  ' + label.padEnd(30) + `reads ${n(s.reads + st.reads + (ev?.reads || 0)).padStart(11)}  (students ${n(s.reads)}, staff ${n(st.reads)}, events ${n(ev?.reads || 0)})   writes ${n(s.writes + st.writes + (ev?.writes || 0)).padStart(9)}`)
dayRow('Teaching day', snap.student, snap.staff, snap.events)
dayRow('IA / online-test day', snap.studentIA, snap.staffIA, snap.eventsIA)
dayRow('Weekend / holiday', snap.studentOff, snap.staffOff, null)
console.log(`  → the free quota covers ${(FREE.readsPerDay / (snap.student.reads + snap.staff.reads + snap.events.reads) * 100).toFixed(1)}% of a teaching day's reads and ${(FREE.writesPerDay / (snap.student.writes + snap.staff.writes + snap.events.writes) * 100).toFixed(1)}% of its writes; you are on pay-as-you-go from day one.`)
line()
console.log('MONTH-BY-MONTH PLAN (₹)')
console.log('  ' + 'Month'.padEnd(10) + 'T/IA/U/R/S/Off'.padStart(15) + 'Reads'.padStart(9) + 'Writes'.padStart(8) + 'Peak rd/day'.padStart(12) + 'Firestore'.padStart(11) + 'Files+Host'.padStart(11) + 'Cloud ₹'.padStart(9) + 'AI ₹'.padStart(8) + 'Tools ₹'.padStart(8) + 'Team ₹'.padStart(10) + 'Total ₹'.padStart(11) + 'Cumulative'.padStart(12))
for (const r of rows) {
  const d = r.days
  const fs = (r.usd.reads + r.usd.writes + r.usd.fsStorage) * FX
  const files = (r.usd.csStorage + r.usd.csDownload + r.usd.hosting + r.usd.fixed) * FX
  console.log('  ' + r.month.padEnd(10) + `${d.teach}/${d.ia}/${d.uni}/${d.result}/${d.staffOnly}/${d.off}`.padStart(15) + M(r.reads).padStart(9) + M(r.writes).padStart(8) + n(r.peakDayReads).padStart(12) + inr(fs).padStart(11) + inr(files).padStart(11) + inr(r.cloudInr).padStart(9) + inr(r.aiInr).padStart(8) + inr(r.toolsInr).padStart(8) + inr(r.teamInr).padStart(10) + inr(r.totalInr).padStart(11) + inr(r.cumulative).padStart(12))
}
line()
console.log('ANNUAL TOTALS')
console.log(`  Firestore reads   ${n(annual.reads).padStart(15)}   free-tier covered ${n(annual.freeReadsUsed)} (${(annual.freeReadsUsed / annual.reads * 100).toFixed(1)}%)   billable ${n(annual.billableReads)}  → $${annual.usd.reads.toFixed(0)} = ${inr(annual.usd.reads * FX)}`)
console.log(`  Firestore writes  ${n(annual.writes).padStart(15)}   free-tier covered ${n(annual.freeWritesUsed)} (${(annual.freeWritesUsed / annual.writes * 100).toFixed(1)}%)   billable ${n(annual.billableWrites)}  → $${annual.usd.writes.toFixed(0)} = ${inr(annual.usd.writes * FX)}`)
console.log(`  Reads by source: students ${M(annual.byRoleReads.students)} · staff ${M(annual.byRoleReads.staff)} · events (tests, assignments, library) ${M(annual.byRoleReads.events)}`)
console.log(`  Firestore storage end of year ${rows[rows.length - 1].fsGiB.toFixed(1)} GiB → $${annual.usd.fsStorage.toFixed(0)} · files ${rows[rows.length - 1].csGB.toFixed(0)} GB → $${annual.usd.csStorage.toFixed(0)} stored + $${annual.usd.csDownload.toFixed(0)} downloads · hosting $${annual.usd.hosting.toFixed(0)} · functions $0 (${M(annual.invocations)} invocations, inside free tier) · fixed $${annual.usd.fixed.toFixed(0)}`)
console.log(`  CLOUD TOTAL        $${annual.cloudUsd.toFixed(0)}  =  ${inr(annual.cloudInr)} / yr   (${inr(annual.cloudInr / 12)} / month · ${inr(annual.cloudInr / STUDENTS)} per student)`)
console.log(`  AI (LLM) TOTAL     ${inr(annual.aiInr)} / yr   (${inr(annual.aiInr / STUDENTS)} per student)`)
console.log(`  Tools (Workspace + domain) ${inr(annual.toolsInr)} / yr`)
console.log(`  TEAM (5 × ₹30,000 gross) ${inr(annual.teamInr)} / yr`)
console.log(`  ALL-IN COST        ${inr(annual.totalInr)} / yr`)
line()
console.log('BREAK-EVEN (no profit, no loss)')
console.log(`  Cash floor — cloud + AI + tools only (team treated as sunk):  ${inr(annual.cloudAiToolsInr)} / yr = ${inr(annual.cashFloorPerStudent)} per student per year`)
console.log(`  True break-even — including the ₹${n(TEAM_MONTHLY)}/month team:      ${inr(annual.totalInr)} / yr = ${inr(annual.breakEvenPerStudent)} per student per year = ${inr(annual.breakEvenPerUser)} per user (${n(H.users)} users incl. staff)`)
console.log(`  Price for 30% margin ${inr(annual.priceAt[0.3])} · 35% ${inr(annual.priceAt[0.35])} · 40% ${inr(annual.priceAt[0.4])} per student per year`)
console.log()
