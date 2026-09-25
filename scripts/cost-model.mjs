#!/usr/bin/env node
// Vriddhi — parametric cost & pricing model
//
// Estimates (a) annual cloud + AI cost to run Vriddhi for N students, (b) fully
// loaded cost including people, and (c) the per-student price needed to reach a
// target gross margin. Every assumption is a named constant below or a CLI flag,
// so the numbers are reproducible and easy to challenge.
//
//   node scripts/cost-model.mjs                       # 5,000 students, base case
//   node scripts/cost-model.mjs --students 3000       # different college size
//   node scripts/cost-model.mjs --scenario high       # low | base | high usage
//   node scripts/cost-model.mjs --colleges 5          # team cost shared by N colleges
//   node scripts/cost-model.mjs --price 349           # test a per-student price
//   node scripts/cost-model.mjs --team lean           # founder-led ops team (see teamFor)
//   node scripts/cost-model.mjs --json                # machine-readable output
//
// NOT a billing measurement. Unit prices are public list prices as of Sept 2026
// (see docs/COSTING_AND_PRICING_ANALYSIS_2026-09-25.md for sources); usage
// drivers are derived from how the code actually reads/writes Firestore
// (attendance = 1 write per student per period, assessments ≈ 150 reads per
// attempt after the autosave optimisation, etc.).

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return fallback
  const v = args[i + 1]
  if (v === undefined || v.startsWith('--')) return true
  return isNaN(Number(v)) ? v : Number(v)
}

const STUDENTS = flag('students', 5000)
const COLLEGES = flag('colleges', 1) // how many colleges share the platform team
const SCENARIO = String(flag('scenario', 'base')) // low | base | high
const FX = flag('fx', 96) // INR per USD (Sept 2026 ≈ ₹96)
const TEST_PRICE = flag('price', null) // ₹ per student per year to evaluate
const TEAM_MODE = String(flag('team', 'standard')) // standard | lean
const JSON_OUT = flag('json', false) === true

const S = { low: 0.5, base: 1, high: 3 }[SCENARIO] ?? 1 // usage multiplier

// ─────────────────────────────────────────────────────────────────────────────
// Unit prices (USD, public list prices, Sept 2026)
// ─────────────────────────────────────────────────────────────────────────────
const P = {
  // Firestore Standard (asia-south1). Free quota on Blaze: 50K reads/day, 20K writes/day, 1 GiB.
  fsReadPer100k: 0.06,
  fsWritePer100k: 0.18,
  fsDeletePer100k: 0.02,
  fsStoragePerGiBMonth: 0.18,
  fsEgressPerGB: 0.12,
  fsFreeReadsPerDay: 50_000,
  fsFreeWritesPerDay: 20_000,
  fsFreeStorageGiB: 1,
  fsFreeEgressGBMonth: 10,
  // Cloud Storage for Firebase. Free: 5 GB stored, 1 GB/day download, 20K upload ops/day, 50K download ops/day.
  csStoragePerGBMonth: 0.026,
  csDownloadPerGB: 0.12,
  csUploadOpsPer10k: 0.05,
  csDownloadOpsPer10k: 0.004,
  csFreeStorageGB: 5,
  csFreeDownloadGBMonth: 30,
  // Firebase Hosting. Free: 10 GB stored, 360 MB/day transfer.
  hostTransferPerGB: 0.15,
  hostFreeTransferGBMonth: 10.8,
  // Cloud Functions v2 (Cloud Run). Free/month: 2M invocations, 180K vCPU-s, 360K GiB-s.
  cfPerMillionInvocations: 0.4,
  cfPerVcpuSecond: 0.000024,
  cfPerGiBSecond: 0.0000025,
  cfFreeInvocationsMonth: 2_000_000,
  cfFreeVcpuSecMonth: 180_000,
  cfFreeGiBSecMonth: 360_000,
  // Small GCP line items
  artifactRegistryPerGBMonth: 0.1,
  loggingPerGiB: 0.5,
  loggingFreeGiBMonth: 50,
  secretVersionPerMonth: 0.06,
  schedulerJobPerMonth: 0.1,
  // Realtime Database (light use). Free: 1 GB stored, 10 GB/month download.
  rtdbPerGBStored: 5,
  rtdbPerGBDownload: 1,
  // LLM prices per 1M tokens
  llm: {
    'gemini-2.5-flash': { in: 0.3, out: 2.5 },
    'gemini-2.5-flash-lite': { in: 0.1, out: 0.4 },
    'gpt-4o-mini': { in: 0.15, out: 0.6 },
    'deepseek-chat': { in: 0.28, out: 0.42 },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage drivers (per academic year)
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  facultyRatio: 25, // students per faculty
  adminStaff: Math.max(10, Math.round(STUDENTS / 200)),
  teachingDays: 180,
  nonTeachingDays: 185,
  staffWorkingDays: 250,
  sectionSize: 60,
  periodsPerDay: 5,
  // Student portal
  studentDauTeaching: 0.6,
  studentDauOff: 0.15,
  readsPerStudentDay: 80,
  writesPerStudentDay: 3,
  callablesPerStudentDay: 2,
  // Faculty portal (excluding attendance marking, modelled separately)
  facultyDauTeaching: 0.85,
  facultyDauOff: 0.5,
  readsPerFacultyDay: 150,
  writesPerFacultyDay: 20,
  callablesPerFacultyDay: 5,
  // Admin / office
  readsPerAdminDay: 500,
  writesPerAdminDay: 100,
  callablesPerAdminDay: 20,
  analyticsReadsPerStudentYear: 1000, // View360, dashboards, compliance reports
  // Online assessments (post-optimisation figures from docs/HANDOFF_exam_autosave_cost.md)
  testsPerStudentYear: 20,
  readsPerAttempt: 150,
  writesPerAttempt: 22,
  invocationsPerAttempt: 12,
  facultyReviewReadsPerAttempt: 10,
  descriptiveShare: 0.3, // share of tests with descriptive answers (AI-grading candidates)
  // Assignments
  assignmentsPerStudentYear: 8,
  assignmentFileMB: 1.5,
  readsPerSubmission: 30,
  writesPerSubmission: 5,
  invocationsPerSubmission: 3,
  // Study materials
  materialsPerFaculty: 20,
  materialFileMB: 5,
  materialDownloadsPerStudent: 30,
  // Fees & PDFs (Puppeteer @ 2 GiB / 1 vCPU / ~5 s)
  feeInstallments: 4,
  challansPerStudent: 4,
  hallTicketsPerStudent: 2,
  pdfSeconds: 5,
  pdfGiB: 2,
  // Generic callable profile
  callableSeconds: 0.4,
  callableGiB: 0.25,
  callableVcpu: 0.167, // Cloud Functions v2 default CPU for 256 MiB
  // Firestore storage
  attendanceDocKB: 1.2, // attendanceRecords doc incl. index overhead
  otherDataPerStudentKB: 200,
  otherDataPerFacultyMB: 2,
  storageAvgFactor: 0.6, // average stored during year vs end-of-year size
  avgDocKB: 1, // for Firestore egress
  // Hosting
  bundleMB: 3,
  deploysPerMonth: 2,
  dailyDeltaKB: 50,
}

const FACULTY = Math.round(STUDENTS / D.facultyRatio)
const SECTIONS = Math.ceil(STUDENTS / D.sectionSize)
const USERS = STUDENTS + FACULTY + D.adminStaff

// ─────────────────────────────────────────────────────────────────────────────
// Firestore reads / writes
// ─────────────────────────────────────────────────────────────────────────────
const studentActiveDays =
  STUDENTS * D.studentDauTeaching * D.teachingDays + STUDENTS * D.studentDauOff * D.nonTeachingDays
const facultyActiveDays =
  FACULTY * D.facultyDauTeaching * D.teachingDays + FACULTY * D.facultyDauOff * D.nonTeachingDays
const adminActiveDays = D.adminStaff * D.staffWorkingDays

const attendanceSessions = SECTIONS * D.periodsPerDay * D.teachingDays
const attempts = STUDENTS * D.testsPerStudentYear
const submissions = STUDENTS * D.assignmentsPerStudentYear
const feeOps = STUDENTS * D.feeInstallments
const pdfRenders = STUDENTS * (D.challansPerStudent + D.hallTicketsPerStudent)

const reads = {
  studentPortal: studentActiveDays * D.readsPerStudentDay,
  facultyPortal: facultyActiveDays * D.readsPerFacultyDay,
  attendanceMarking: attendanceSessions * (D.sectionSize + 10),
  adminOffice: adminActiveDays * D.readsPerAdminDay,
  analytics: STUDENTS * D.analyticsReadsPerStudentYear,
  assessments: attempts * (D.readsPerAttempt + D.facultyReviewReadsPerAttempt),
  assignments: submissions * D.readsPerSubmission,
  fees: feeOps * 20,
}
const writes = {
  studentPortal: studentActiveDays * D.writesPerStudentDay,
  facultyPortal: facultyActiveDays * D.writesPerFacultyDay,
  attendanceMarking: attendanceSessions * (D.sectionSize + 3),
  adminOffice: adminActiveDays * D.writesPerAdminDay,
  assessments: attempts * D.writesPerAttempt,
  assignments: submissions * D.writesPerSubmission,
  fees: feeOps * 10,
  notificationsMisc: STUDENTS * 100,
}
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0)
const totalReads = sum(reads) * S
const totalWrites = sum(writes) * S
const billableReads = Math.max(0, totalReads - P.fsFreeReadsPerDay * 365)
const billableWrites = Math.max(0, totalWrites - P.fsFreeWritesPerDay * 365)

// Firestore storage (GiB): attendance records dominate document count.
const attendanceDocs = STUDENTS * D.periodsPerDay * D.teachingDays
const fsEndGiB =
  (attendanceDocs * D.attendanceDocKB) / 1024 / 1024 +
  (STUDENTS * D.otherDataPerStudentKB) / 1024 / 1024 +
  (FACULTY * D.otherDataPerFacultyMB) / 1024
const fsAvgGiB = fsEndGiB * D.storageAvgFactor
const fsEgressGB = (totalReads * D.avgDocKB) / 1024 / 1024

// ─────────────────────────────────────────────────────────────────────────────
// Cloud Storage (files)
// ─────────────────────────────────────────────────────────────────────────────
const assignmentGB = (submissions * D.assignmentFileMB) / 1024
const materialsGB = (FACULTY * D.materialsPerFaculty * D.materialFileMB) / 1024
const photosPdfGB = (STUDENTS * 0.2) / 1024 + (pdfRenders * 0.15) / 1024
const csEndGB = (assignmentGB + materialsGB + photosPdfGB) * S
const csAvgGB = csEndGB * D.storageAvgFactor
const csDownloadGB =
  (assignmentGB * 1.0 + (STUDENTS * D.materialDownloadsPerStudent * D.materialFileMB) / 1024 + photosPdfGB * 2) * S
const csUploadOps = (submissions + FACULTY * D.materialsPerFaculty + pdfRenders) * S
const csDownloadOps = (submissions + STUDENTS * D.materialDownloadsPerStudent + pdfRenders * 2) * S

// ─────────────────────────────────────────────────────────────────────────────
// Hosting
// ─────────────────────────────────────────────────────────────────────────────
const dailyUsers = STUDENTS * D.studentDauTeaching + FACULTY * D.facultyDauTeaching + D.adminStaff
const hostGBMonth = (USERS * D.bundleMB * D.deploysPerMonth) / 1024 + (dailyUsers * D.dailyDeltaKB * 30) / 1024 / 1024

// ─────────────────────────────────────────────────────────────────────────────
// Cloud Functions compute
// ─────────────────────────────────────────────────────────────────────────────
const genericInvocations =
  (studentActiveDays * D.callablesPerStudentDay +
    facultyActiveDays * D.callablesPerFacultyDay +
    adminActiveDays * D.callablesPerAdminDay) *
  S
const assessmentInvocations = attempts * D.invocationsPerAttempt * S
const submissionInvocations = submissions * D.invocationsPerSubmission * S
const totalInvocations = genericInvocations + assessmentInvocations + submissionInvocations + pdfRenders * S

const vcpuSec =
  (genericInvocations + assessmentInvocations + submissionInvocations) * D.callableSeconds * D.callableVcpu +
  pdfRenders * S * D.pdfSeconds * 1
const gibSec =
  (genericInvocations + assessmentInvocations + submissionInvocations) * D.callableSeconds * D.callableGiB +
  pdfRenders * S * D.pdfSeconds * D.pdfGiB

// ─────────────────────────────────────────────────────────────────────────────
// AI (LLM) usage — one row per feature found in functions/src
// ─────────────────────────────────────────────────────────────────────────────
const FINAL_YEAR = Math.round(STUDENTS / 3)
const aiFeatures = [
  {
    key: 'questionGen',
    label: 'AI question generation (faculty)',
    file: 'routes/ai-questions.ts',
    model: 'gemini-2.5-flash',
    calls: FACULTY * 30,
    tokensIn: 2500,
    tokensOut: 4000,
    guard: 'TIER_CONFIG dailyQuestionLimit 100/500/1000',
  },
  {
    key: 'paperParse',
    label: 'AI paper parsing (Gemini fallback)',
    file: 'paperParsing.ts',
    model: 'gemini-2.5-flash',
    calls: FACULTY * 6 * 0.4,
    tokensIn: 10000,
    tokensOut: 5000,
    guard: 'deterministic parser first',
  },
  {
    key: 'aiGrading',
    label: 'AI grading suggestions (descriptive)',
    file: 'studentAssessments.ts',
    model: 'gemini-2.5-flash',
    calls: attempts * D.descriptiveShare,
    tokensIn: 8000,
    tokensOut: 2000,
    guard: 'cached per attempt, ≤50 questions',
  },
  {
    key: 'studyPacks',
    label: 'AI study material packs (cached, shared)',
    file: 'routes/ai-chat.ts /study-material',
    model: 'gemini-2.5-flash',
    calls: 60 * 200,
    tokensIn: 3000,
    tokensOut: 5000,
    guard: 'cache + 5/day/student + 400/day/college',
  },
  {
    key: 'chat',
    label: 'AI study assistant chat (students)',
    file: 'routes/ai-chat.ts /chat',
    model: 'gemini-2.5-flash',
    calls: STUDENTS * 0.3 * 150,
    tokensIn: 3000,
    tokensOut: 500,
    guard: 'NO per-student daily cap (30/min IP limiter only)',
  },
  {
    key: 'prep',
    label: 'Placement prep generation (final year)',
    file: 'routes/prep.ts',
    model: 'gemini-2.5-flash',
    calls: FINAL_YEAR * 20,
    tokensIn: 2000,
    tokensOut: 3000,
    guard: 'rate limiter only',
  },
]
const aiRows = aiFeatures.map((f) => {
  const price = P.llm[f.model]
  const perCallUsd = (f.tokensIn * price.in + f.tokensOut * price.out) / 1e6
  const calls = f.calls * S
  return { ...f, calls, perCallUsd, perCallInr: perCallUsd * FX, annualUsd: perCallUsd * calls }
})
const aiTotalUsd = aiRows.reduce((a, r) => a + r.annualUsd, 0)

// ─────────────────────────────────────────────────────────────────────────────
// Cloud cost roll-up (USD / year)
// ─────────────────────────────────────────────────────────────────────────────
const monthly = (x) => x / 12
const cloud = {
  'Firestore reads': (billableReads / 100_000) * P.fsReadPer100k,
  'Firestore writes': (billableWrites / 100_000) * P.fsWritePer100k,
  'Firestore storage': Math.max(0, fsAvgGiB - P.fsFreeStorageGiB) * P.fsStoragePerGiBMonth * 12,
  'Firestore egress': Math.max(0, monthly(fsEgressGB) - P.fsFreeEgressGBMonth) * 12 * P.fsEgressPerGB,
  'Cloud Storage stored': Math.max(0, csAvgGB - P.csFreeStorageGB) * P.csStoragePerGBMonth * 12,
  'Cloud Storage download': Math.max(0, monthly(csDownloadGB) - P.csFreeDownloadGBMonth) * 12 * P.csDownloadPerGB,
  'Cloud Storage ops':
    (Math.max(0, csUploadOps - 20_000 * 365) / 10_000) * P.csUploadOpsPer10k +
    (Math.max(0, csDownloadOps - 50_000 * 365) / 10_000) * P.csDownloadOpsPer10k,
  'Hosting transfer': Math.max(0, hostGBMonth - P.hostFreeTransferGBMonth) * 12 * P.hostTransferPerGB,
  'Functions invocations':
    (Math.max(0, monthly(totalInvocations) - P.cfFreeInvocationsMonth) / 1e6) * 12 * P.cfPerMillionInvocations,
  'Functions vCPU': Math.max(0, monthly(vcpuSec) - P.cfFreeVcpuSecMonth) * 12 * P.cfPerVcpuSecond,
  'Functions memory': Math.max(0, monthly(gibSec) - P.cfFreeGiBSecMonth) * 12 * P.cfPerGiBSecond,
  'Artifact Registry (function images ~3 GB)': 2.5 * P.artifactRegistryPerGBMonth * 12,
  'Cloud Logging': Math.max(0, monthly((totalInvocations * 2) / 1024 / 1024) - P.loggingFreeGiBMonth) * 12 * P.loggingPerGiB,
  'Secret Manager (6 secrets)': 6 * P.secretVersionPerMonth * 12,
  'Cloud Scheduler (2 jobs, 3 free)': 0,
  'Realtime Database (light)': 12,
  'Firebase Auth (email/password)': 0,
}
const cloudTotalUsd = sum(cloud)

// Safety buffers applied when pricing (never price on the point estimate)
const INFRA_BUFFER = 1.5
const AI_BUFFER = 2.0
const cloudBudgetInr = cloudTotalUsd * FX * INFRA_BUFFER
const aiBudgetInr = aiTotalUsd * FX * AI_BUFFER

// ─────────────────────────────────────────────────────────────────────────────
// Third-party tools & per-college direct costs (₹ / year)
// ─────────────────────────────────────────────────────────────────────────────
const platformShared = {
  'Domain + DNS': 1_500,
  'Error monitoring (Sentry Team)': 25_000,
  'Google Workspace / transactional email': 20_000,
  'GitHub Team + CI minutes': 15_000,
  'AI coding tools for the dev team': 60_000,
  'Firestore backups / PITR + exports': 6_000,
  'Google Cloud Standard support (optional)': 28_000,
}
const perCollegeDirect = {
  'Cloud infrastructure (× 1.5 buffer)': cloudBudgetInr,
  'AI / LLM usage (× 2 buffer)': aiBudgetInr,
  'Site visits & travel (6 / year)': 30_000,
  'Printed guides, training material, misc': 10_000,
}
const onboardingOneTime = {
  'Data migration & bulk imports (10 person-days)': 40_000,
  'Scheme pack, timetable, fee-structure setup (5 days)': 20_000,
  'Faculty & office training (6 sessions, 10 days)': 40_000,
  'Travel & hand-holding in week 1–4': 40_000,
  'Project management / go-live buffer': 30_000,
}

// ─────────────────────────────────────────────────────────────────────────────
// People (₹ / year, fully loaded) and team sizing vs number of colleges served
// ─────────────────────────────────────────────────────────────────────────────
const RATE = { midDev: 12_00_000, seniorDev: 20_00_000, support: 3_60_000, csLead: 6_00_000, pm: 12_00_000, sme: 3_00_000 }
// "standard" = a properly staffed vendor (what a college should assume it is
// paying for). "lean" = founder-led operations: founders do PM + senior dev
// work, one paid mid dev, minimal support bench. Lean is realistic for the
// first 3–5 customers but not a sustainable steady state.
function teamFor(colleges, mode) {
  if (mode === 'lean') {
    if (colleges <= 1) return { midDev: 0.5, seniorDev: 0, support: 0.5, csLead: 0, pm: 0, sme: 0.1 }
    if (colleges <= 3) return { midDev: 1, seniorDev: 0, support: 1, csLead: 0, pm: 0.25, sme: 0.25 }
    if (colleges <= 5) return { midDev: 1, seniorDev: 0.5, support: 1.5, csLead: 0, pm: 0.5, sme: 0.25 }
    if (colleges <= 10) return { midDev: 2, seniorDev: 0.5, support: 3, csLead: 1, pm: 0.5, sme: 0.5 }
    return { midDev: 3, seniorDev: 1, support: Math.ceil(colleges / 3), csLead: 1, pm: 1, sme: 1 }
  }
  if (colleges <= 1) return { midDev: 1, seniorDev: 0, support: 0.5, csLead: 0, pm: 0.2, sme: 0.25 }
  if (colleges <= 3) return { midDev: 1, seniorDev: 0.5, support: 2, csLead: 0, pm: 0.5, sme: 0.5 }
  if (colleges <= 5) return { midDev: 2, seniorDev: 0.5, support: 2, csLead: 1, pm: 1, sme: 0.5 }
  if (colleges <= 10) return { midDev: 3, seniorDev: 1, support: 4, csLead: 1, pm: 1, sme: 1 }
  return { midDev: 4, seniorDev: 1, support: Math.ceil(colleges / 2.5), csLead: 2, pm: 1.5, sme: 1 }
}
const team = teamFor(COLLEGES, TEAM_MODE)
const peopleTotalInr = Object.entries(team).reduce((a, [k, fte]) => a + fte * RATE[k], 0)
const peoplePerCollegeInr = peopleTotalInr / COLLEGES
const platformSharedPerCollegeInr = sum(platformShared) / COLLEGES

const directPerCollegeInr = sum(perCollegeDirect)
const onboardingInr = sum(onboardingOneTime)
const recurringCostPerCollegeInr = directPerCollegeInr + platformSharedPerCollegeInr + peoplePerCollegeInr
const year1CostPerCollegeInr = recurringCostPerCollegeInr + onboardingInr

// ─────────────────────────────────────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────────────────────────────────────
const priceForMargin = (cost, margin) => cost / (1 - margin)
const pricing = [0.3, 0.35, 0.4].map((m) => {
  const annual = priceForMargin(recurringCostPerCollegeInr, m)
  return { margin: m, annualInr: annual, perStudentInr: annual / STUDENTS, perStudentMonthInr: annual / STUDENTS / 12 }
})
let priceTest = null
if (TEST_PRICE) {
  const revenue = TEST_PRICE * STUDENTS
  priceTest = {
    perStudentInr: TEST_PRICE,
    annualRevenueInr: revenue,
    grossMargin: (revenue - recurringCostPerCollegeInr) / revenue,
    year1MarginWithOnboardingFee: (revenue + onboardingInr * 1.25 - year1CostPerCollegeInr) / (revenue + onboardingInr * 1.25),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────────────────────────────────────
const inr = (x) => '₹' + Math.round(x).toLocaleString('en-IN')
const usd = (x) => '$' + x.toFixed(x < 10 ? 2 : 0)
const n = (x) => Math.round(x).toLocaleString('en-IN')

const result = {
  inputs: { students: STUDENTS, faculty: FACULTY, adminStaff: D.adminStaff, sections: SECTIONS, colleges: COLLEGES, scenario: SCENARIO, team: TEAM_MODE, fx: FX },
  usage: {
    firestoreReads: totalReads,
    firestoreWrites: totalWrites,
    firestoreEndOfYearGiB: fsEndGiB,
    storageEndOfYearGB: csEndGB,
    storageDownloadGB: csDownloadGB,
    hostingGBPerMonth: hostGBMonth,
    functionInvocations: totalInvocations,
    vcpuSeconds: vcpuSec,
    gibSeconds: gibSec,
    attendanceSessions,
    testAttempts: attempts,
    pdfRenders,
  },
  cloudUsd: cloud,
  cloudTotalUsd,
  cloudTotalInr: cloudTotalUsd * FX,
  ai: aiRows,
  aiTotalUsd,
  aiTotalInr: aiTotalUsd * FX,
  budgets: { cloudBudgetInr, aiBudgetInr, INFRA_BUFFER, AI_BUFFER },
  perCollegeDirect,
  platformShared,
  platformSharedPerCollegeInr,
  team,
  peopleTotalInr,
  peoplePerCollegeInr,
  onboardingOneTime,
  onboardingInr,
  recurringCostPerCollegeInr,
  recurringCostPerStudentInr: recurringCostPerCollegeInr / STUDENTS,
  year1CostPerCollegeInr,
  pricing,
  priceTest,
}

if (JSON_OUT) {
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
}

const line = (w = 78) => console.log('─'.repeat(w))
console.log(`\nVRIDDHI COST MODEL — ${n(STUDENTS)} students · ${n(FACULTY)} faculty · ${D.adminStaff} admin · scenario=${SCENARIO} · ₹${FX}/USD · ${TEAM_MODE} team shared by ${COLLEGES} college(s)`)
line()
console.log('USAGE DRIVERS (per year)')
console.log(`  Firestore reads            ${n(totalReads)}   (billable after free quota: ${n(billableReads)})`)
console.log(`  Firestore writes           ${n(totalWrites)}   (billable: ${n(billableWrites)})`)
console.log(`  Firestore data end of year ${fsEndGiB.toFixed(1)} GiB   (attendance records: ${n(attendanceDocs)} docs)`)
console.log(`  Files stored end of year   ${csEndGB.toFixed(0)} GB · downloads ${csDownloadGB.toFixed(0)} GB`)
console.log(`  Hosting transfer           ${hostGBMonth.toFixed(0)} GB / month`)
console.log(`  Function invocations       ${n(totalInvocations)} · vCPU-s ${n(vcpuSec)} · GiB-s ${n(gibSec)}`)
console.log(`  Attendance sessions ${n(attendanceSessions)} · test attempts ${n(attempts)} · PDF renders ${n(pdfRenders)}`)
line()
console.log('CLOUD INFRASTRUCTURE (Firebase + Google Cloud, asia-south1)     USD/yr      ₹/yr')
for (const [k, v] of Object.entries(cloud)) console.log(`  ${k.padEnd(52)} ${usd(v).padStart(8)} ${inr(v * FX).padStart(10)}`)
console.log(`  ${'TOTAL cloud (point estimate)'.padEnd(52)} ${usd(cloudTotalUsd).padStart(8)} ${inr(cloudTotalUsd * FX).padStart(10)}`)
console.log(`  ${`Budget with ×${INFRA_BUFFER} safety buffer`.padEnd(52)} ${''.padStart(8)} ${inr(cloudBudgetInr).padStart(10)}`)
line()
console.log('AI / LLM USAGE                                      calls/yr   ₹/call    USD/yr      ₹/yr')
for (const r of aiRows)
  console.log(`  ${r.label.padEnd(44)} ${n(r.calls).padStart(9)} ${('₹' + r.perCallInr.toFixed(2)).padStart(8)} ${usd(r.annualUsd).padStart(9)} ${inr(r.annualUsd * FX).padStart(10)}`)
console.log(`  ${'TOTAL AI (point estimate)'.padEnd(44)} ${''.padStart(9)} ${''.padStart(8)} ${usd(aiTotalUsd).padStart(9)} ${inr(aiTotalUsd * FX).padStart(10)}`)
console.log(`  ${`Budget with ×${AI_BUFFER} safety buffer`.padEnd(44)} ${''.padStart(9)} ${''.padStart(8)} ${''.padStart(9)} ${inr(aiBudgetInr).padStart(10)}`)
line()
console.log(`PER-COLLEGE DIRECT COSTS (₹/yr)`)
for (const [k, v] of Object.entries(perCollegeDirect)) console.log(`  ${k.padEnd(52)} ${inr(v).padStart(12)}`)
console.log(`  ${'Subtotal direct'.padEnd(52)} ${inr(directPerCollegeInr).padStart(12)}`)
line()
console.log(`SHARED PLATFORM TOOLS (₹/yr, total ${inr(sum(platformShared))}, ÷${COLLEGES} = ${inr(platformSharedPerCollegeInr)} per college)`)
for (const [k, v] of Object.entries(platformShared)) console.log(`  ${k.padEnd(52)} ${inr(v).padStart(12)}`)
line()
console.log(`PEOPLE (₹/yr, fully loaded) — ${TEAM_MODE} team for ${COLLEGES} college(s)`)
for (const [k, fte] of Object.entries(team)) if (fte) console.log(`  ${`${k} × ${fte} FTE @ ${inr(RATE[k])}`.padEnd(52)} ${inr(fte * RATE[k]).padStart(12)}`)
console.log(`  ${'Total team'.padEnd(52)} ${inr(peopleTotalInr).padStart(12)}`)
console.log(`  ${`Allocated per college (÷${COLLEGES})`.padEnd(52)} ${inr(peoplePerCollegeInr).padStart(12)}`)
line()
console.log(`ONE-TIME ONBOARDING (year 1, per college)`)
for (const [k, v] of Object.entries(onboardingOneTime)) console.log(`  ${k.padEnd(52)} ${inr(v).padStart(12)}`)
console.log(`  ${'Total onboarding'.padEnd(52)} ${inr(onboardingInr).padStart(12)}`)
line()
console.log('COST SUMMARY (per college)')
console.log(`  Recurring cost / year            ${inr(recurringCostPerCollegeInr).padStart(14)}   = ${inr(recurringCostPerCollegeInr / STUDENTS)} per student per year`)
console.log(`  Year-1 cost incl. onboarding     ${inr(year1CostPerCollegeInr).padStart(14)}`)
line()
console.log('PRICE NEEDED FOR TARGET GROSS MARGIN (recurring, per college)')
for (const p of pricing)
  console.log(`  ${Math.round(p.margin * 100)}% margin → ${inr(p.annualInr).padStart(12)} / yr  = ${inr(p.perStudentInr)} per student per year  (${inr(p.perStudentMonthInr)} / student / month)`)
if (priceTest) {
  line()
  console.log(`PRICE TEST @ ₹${TEST_PRICE}/student/yr → revenue ${inr(priceTest.annualRevenueInr)}/yr`)
  console.log(`  Recurring gross margin: ${(priceTest.grossMargin * 100).toFixed(1)}%`)
  console.log(`  Year-1 margin with onboarding fee (₹${n(onboardingInr * 1.25)}): ${(priceTest.year1MarginWithOnboardingFee * 100).toFixed(1)}%`)
}
console.log()
