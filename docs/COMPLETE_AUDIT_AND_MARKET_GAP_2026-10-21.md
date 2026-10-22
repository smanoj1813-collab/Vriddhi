# Vriddhi — Complete Audit + University/Degree-College Case Studies + What We're Missing

**Date:** 21 Oct 2026 · **Branch:** `arena/679b808d-vriddhi` · **Commit audited:** `f36eaa5` (main)
**Scope asked:** Complete repo audit · case studies of how universities (especially affiliated
degree colleges) actually run, compared against Vriddhi · pointed list of what is missing.
WhatsApp notifications and Parent Portal are **excluded** from the gap list, as requested.
**Method:** Every claim below was verified against the code (builds, tests, greps, file reads),
not against README/marketing. Market facts are sourced (links inline).

---

## 0. The one-page verdict

**The engineering is market-ready. The product is ~80% market-ready. The *business plumbing*
around the product (email, payments settlement, contracts, monitoring, demo/onboarding) is
~40% ready — and that, not features, is what will decide your first 3 pilots.**

| Area | Readiness | One-line reason |
|---|---|---|
| Code health (build/tests/types) | **9/10** | tsc 0 errors both sides; 688 + 1,256 tests green; CI with dead-code + rules tests |
| Security posture (code level) | **8/10** | Claim-based multi-tenancy in 1,829 lines of rules; no secrets in repo; audit trails |
| Academic core (attendance, timetable, curriculum, assessments, papers) | **9/10** | Deeper than any Indian degree-college ERP audited; genuinely differentiating |
| College office (fees, library, inventory, procurement, payroll, no-dues) | **8/10** | Surprisingly complete; Tally export + challans + guest billing included |
| University compliance (UUCMS, scheme packs, hall tickets, results) | **7/10** | Strong Karnataka pack; exam-cell depth + IA export still thin |
| Regulatory data stack (NAAC/IQAC, AISHE, APAAR/ABC, scholarships) | **3/10** | **The biggest product gap** — this is what principals now buy ERPs for |
| Student lifecycle completeness (promotion, electives, certificates, alumni) | **5/10** | Admission + daily ops exist; semester rollover, elective enrolment, certificate desk missing |
| Communications (email/SMS/push) | **2/10** | In-app only. **Zero email-sending code in the entire backend** |
| Money plumbing (PG settlement, refunds, your own SaaS billing) | **4/10** | Razorpay wired, but single platform key = money settles to *you*, not the college |
| Ops readiness (monitoring, backups, staging, support) | **3/10** | No error tracking, no analytics, single Firebase project, backups unverified |
| Legal/company readiness | **2/10** | No LICENSE, no Terms/Privacy/DPA anywhere; you already know — Pvt Ltd next week fixes the base |

**Bottom line:** Do not wait to go to market. Sell pilots on the academic core (question bank →
AI papers → online IA tests → auto-grading → scheme compliance), which no competitor in your
price band has. But fix the **six P0 items in §6** before or during pilot #1, or the pilot will
"work" in demos and leak trust in daily office use.

---

## 1. What I actually verified (evidence)

| Check | Command | Result |
|---|---|---|
| Frontend type-check | `npx tsc --noEmit` | ✅ **0 errors** |
| Frontend unit tests | `npm run test:unit` | ✅ **688 pass / 0 fail** (117 suites) |
| Frontend production build | `npm run build` | ✅ built in 45s, PWA generated (14 MB dist) |
| Course render checks | `npm run test:render:courses` | ✅ **126/126** |
| Backend type-check | `npm --prefix functions run build` | ✅ **0 errors** |
| Backend unit tests | `npm --prefix functions run test:unit` | ✅ **1,256 pass / 0 fail** (295 suites) |
| Dead code | `node scripts/check-dead-code.cjs` | ✅ 586 files, 518 reachable, 0 unlisted orphans |
| Secrets in repo | pattern scan over src/functions/scripts | ✅ none found (only placeholders) |
| Scale of codebase | `wc -l` | **183k LOC frontend + 75k LOC backend**, 1,321 files total |
| Dependency vulnerabilities | `npm audit` | ⚠️ frontend 25 (15 high, mostly transitive/dev); functions 47 (1 critical, 31 high — incl. dev/test tooling). Needs triage, see §4 |
| TODO/FIXME debt | grep | ✅ only 7 in the whole codebase — unusually clean |

Routes/pages inventory (all role-guarded, lazy-loaded): **Admin ~40 pages, Faculty 24,
Student 23, Office 13, Superadmin 24**, plus public prep + courses. Backend: 1 Express API
(11 routers) + a large callable-function surface (~95+ callables per prior audit) in
`asia-south1`.

---

## 2. What you HAVE (verified inventory, with depth)

Depth key: 🟢 production-depth · 🟡 works but shallow · 🔴 label/stub only.

### Academic core — your wedge
- 🟢 **Curriculum system**: syllabus parsing, standardised curriculum upload, faculty↔course
  **auto-mapping** (subject/branch/experience/load scoring, preview→approve), coverage tracking.
- 🟢 **Timetable**: auto-generator (clash-safe for faculty/room/cohort, lab spanning, daily caps),
  bulk CSV import with per-row validation, reschedule flow.
- 🟢 **Attendance**: faculty marking, student view, staff self-attendance, admin registers,
  attendance→IA slab integration via scheme packs, export/PDF.
- 🟢 **Assessments**: full online test engine (instructions→take→result), MCQ + descriptive,
  manual grading queue, **AI-assisted auto-grading**, proctoring logs, exam lockdown, autosave
  (cost-optimised), assignments with drafts/submissions/analytics.
- 🟢 **Question bank + AI paper studio**: manual/bulk/AI generation (Gemini/OpenAI/DeepSeek),
  Bloom's-level tagging, review workflow, blueprint-based paper builder, paper parsing from
  PDF/DOCX (works without AI keys), print-ready PDF via Puppeteer, PYQ/prep studio, seeded banks
  (759 B.Com/BA/B.Sc + BBA banks + aptitude), 4 bundled certificate courses.
- 🟢 **University scheme packs (G1)**: per-university marks split, IA composition, attendance
  slabs, pass criteria, grade tables — BCU/KUD-NEP/generic NEP presets + custom packs; drives
  compliance dashboard, hall-ticket blocking, result import with SGPA/ATKT computation.
- 🟢 **UUCMS bridge**: candidate/USN mapping, CSV import with auto-linking, sync dashboard.
- 🟢 **Hall tickets + exam rooms**, grade records with audit, result importer.
- 🟢 **Student 360 / Journey / mentor system**, faculty–student connect, announcements,
  materials, ID card generation, resume builder (Placement Pack), coding lab.

### College office & finance
- 🟢 **Fees**: structures, assignments, installments, challans (generate→verify), receipts,
  student fee portal, categories incl. university pass-through heads, finance reports,
  **Tally export**, GST fields.
- 🟢 **Online payment flow**: Razorpay order→checkout→HMAC verify→webhook backup credit —
  complete code, awaiting keys (but see the settlement problem, §6-P0-2).
- 🟢 **Library**: catalogue, issue/return, fines, member portal, barcode references, reports.
- 🟢 **Inventory + procurement**: vendors, purchase requests/orders, vendor bills, stock.
- 🟢 **Payroll**: component engine (PF/PT/etc.), payslips, salary certificates, faculty
  self-view; **guest-faculty lifecycle** (contracts, per-period rates, timetable-derived billing).
- 🟢 **No-dues clearance** workflow (multi-section sign-off, student tracking).
- 🟢 **Admissions**: enquiry→application→merit ranking→stage pipeline, public intake API with
  tokens, export. (Good "Lite CRM", not yet a full public apply-portal.)

### Platform (your side of the SaaS)
- 🟢 Multi-college/multi-university superadmin, access products/tiers, subscription records,
  bulk user/faculty import, credential reset, identity-repair tooling, system health monitor,
  multi-college comparison, platform employees (your staff working across colleges).
- 🟢 6-language UI (EN/HI/KN/TA/TE/ML) + Indic-script AI generation. PWA installable.
- 🟢 College branding (logo/cover) on portals and ID cards.

This is a genuinely broad product. Most Indian college ERPs selling at ₹300–1,200/student/yr
have *none* of the assessment/AI depth and weaker office modules.

---

## 3. Case studies — how institutions actually run, vs where Vriddhi stands

### Case Study A — The Karnataka affiliated degree college (your beachhead customer)

Profile: 300–1,500 students, BA/B.Com/BBA/B.Sc/BCA, affiliated to BCU / Bangalore University /
Mangalore / Kuvempu / KUD etc., run by 1–3 office staff + principal + HODs. Curriculum, exams
and results belong to the university; **UUCMS is mandatory** for admission confirmation,
semester course registration and university exam-fee payment.

How their year actually breaks (documented, not hypothetical):
- **UUCMS failures are their #1 operational crisis.** Exam fees deducted twice / stuck in
  "INITIATED" state — Mangalore University alone traced ~3,000 affected students; refunds took
  ~10 months ([TOI, Nov 2025](https://timesofindia.indiatimes.com/city/mangaluru/students-receive-refunds-after-double-fee-deductions-on-uucms/articleshow/125305176.cms)).
  Students were told to **pay again** to get hall tickets generated
  ([Vartha Bharati, Dec 2024](https://english.varthabharati.in/karavali/pa-college-refutes-allegations-of-denying-hall-ticket-pressurizing-over-uucms-fee-payment-issue)).
  Glitches hit again in the June 2026 admission round, blocking hostel admissions and
  scholarship applications that need UUCMS documents
  ([TOI, Jun 2026](https://timesofindia.indiatimes.com/city/mangaluru/uucms-glitch-delays-online-admission-across-the-state/articleshow/131806809.cms)).
  The state has now budgeted ₹30 crore to fix UUCMS
  ([TOI, Mar 2025](https://timesofindia.indiatimes.com/city/mangaluru/authorities-welcome-uucms-upgradation-hope-glitches-will-go/articleshow/118792249.cms)).
- **Wrong data entered by colleges has real consequences**: BU's UUCMS nodal officer publicly
  blamed *incorrect attendance entries by affiliated colleges* for withheld results
  ([Vartha Bharati, Mar 2024](https://english.varthabharati.in/karnataka/reinstate-old-system-or-resolve-snags-urge-nep-grads-over-challenges-in-uucms-portal)).
- Revaluation status invisible on UUCMS → students can't proceed to pay next exam fee
  ([TOI, Nov 2024](https://timesofindia.indiatimes.com/city/mangaluru/mangalore-university-students-struggle-with-uucms-technical-glitches-amid-exam-fee-payment-issues/articleshow/115574856.cms)).

**What this college actually needs from Vriddhi** (in pain order): (1) a *pre-UUCMS* system of
record so every upload to UUCMS is right the first time; (2) deadline command-centre — who has
not registered/paid/selected subjects correctly, by name; (3) IA marks + attendance frozen and
exported in university format; (4) scholarship (SSP) paperwork factory; (5) certificates on
demand; (6) fee collection that reconciles itself.

**Vriddhi coverage:** (1) 🟢 strong — UUCMS mapping + scheme packs + compliance dashboard is
exactly this. (6) 🟢/🟡 strong minus settlement design. (3) 🟡 — IA exists inside grade
records/result import, but a dedicated *IA freeze → university-format export* doesn't.
(2) 🟡 partial — in-app notifications exist but **no email** reaches a student who hasn't
logged in; no dedicated "UUCMS readiness checklist per student" view. (4) 🔴 missing.
(5) 🔴 missing.

**Lesson:** In Karnataka you don't sell "an ERP". You sell **"UUCMS without the tears"** —
Vriddhi as the clean room where data is prepared, checked and frozen before it touches the
government portal. Lead demos with that.

### Case Study B — Samarth eGov universities (the "complete ERP" benchmark)

Samarth (built by University of Delhi for the Ministry of Education) is the reference
architecture Indian administrators now compare everything against: **40+ modules in 9 packages**,
adopted by **13,000+ institutions with 1.8 crore student records**
([Careers360, Jun 2026](https://news.careers360.com/samarth-portal-glitches-mar-admissions-exams-payment-2026-tiss-patna-university-bhu-bbau-du-cuet-13000-institutes-1-8-cr-students/amp)),
covering DU, BHU, IGNOU, JNU and most central universities
([samarth.edu.in](https://samarth.edu.in/about/)). Its module map: Programme & Courses,
Admissions, Evaluation & Grading, Research, **Student Feedback, Training & Placement, Alumni**;
HR: Recruitment, Employment, **Leave, Career Advancement (CAS)**; Finance: Budgets, Payroll,
Research Grants, Fees, Bills, Assets; Governance: **Grievance, File Tracking**, Hostel.

Two lessons for Vriddhi:
1. **The checklist gap is specific and finite.** Against Samarth's 40 modules, Vriddhi already
   matches or beats ~28. The missing named modules are: Student Feedback, Alumni, Leave
   Management, Career Advancement/appraisal, Grievance, Recruitment, Research/Grants, Hostel,
   File Tracking, Budget & Accounts (full double-entry — you have finance reports + Tally
   export, which is the pragmatic Indian answer; don't build a ledger).
2. **Samarth also glitches publicly** (admissions/exams/payments, Jun 2026) — and it has *no*
   assessment engine, no AI papers, no Indic-language generation, and is university-deployed
   (each HEI runs its own instance). A small affiliated college cannot adopt Samarth on its
   own — its university must. **Your market is precisely the colleges Samarth doesn't reach
   directly.** Position accordingly: "Samarth-grade governance, college-ready, plus the exam
   engine they don't have."

### Case Study C — The autonomous college exam cell (Controller of Examinations)

Autonomous colleges (1,000+ in India, growing under NEP) run their own exams. Published COE
manuals (e.g. [AIHT COE Manual](https://aiht.ac.in/vendor/pdf/coe/COE-Manual.pdf),
[Bishop Heber](https://bhc.edu.in/academics/coe/), [Panimalar process manual](https://coe.panimalar.ac.in/files/Conduct%20of%20Examination%20%20Process%20Manual.pdf))
define the full job: exam calendar → QP setter appointment (confidential, panel-based, max 3
papers/setter, 2–3 sets per course) → scrutiny → secure printing → hall/seating allotment →
invigilation → dummy numbering → central valuation camps → moderation/pass board → results →
grade sheets/transcripts/provisional certificates → photocopy & revaluation windows → script
preservation (1–3 yrs) → examiner remuneration.

**Vriddhi coverage:** 🟢 QP generation/review workflow, hall tickets, rooms, results, grade
records. 🟡/🔴 Missing: seating plan per room (roll-wise), invigilator duty chart +
remuneration register, setter panel/appointment letters, QP indent counts, dummy-number/
bundle tracking, consolidated marksheet & transcript PDFs, revaluation *workflow* (application
→ fee → status → revised marks; today it's only status strings in result import), malpractice
register.

**Lesson:** Autonomous colleges pay more and churn less, but they will test your exam cell
against this manual in the first demo. You are ~60% there. The affiliated-college subset
(seating, invigilation, IA export) is P1; full COE (valuation camps, transcripts) is your
Year-2 "Autonomous Pack" upsell — don't build it before a paying autonomous college asks.

### Case Study D — NAAC Binary Accreditation + MBGL (the new buying trigger)

NAAC has replaced letter grades with **Binary Accreditation (Accredited / Not) + optional
MBGL Levels 1–5**, announced 10 Feb 2025; assessment is **fully digital, AI-verified, no peer
visit** for Binary, validity 3 years
([India Today, Jul 2025](https://www.indiatoday.in/education-today/news/story/rating-agency-naac-to-grade-colleges-using-new-ai-based-model-from-august-2025-2763426-2025-07-30)).
Weightage is **25% Input, 75% Process & Output** — result timelines, pass %, progression,
feedback now outweigh buildings 3:1
([Maples OSM analysis](https://maplesosm.com/blog/naac-binary-accreditation-2025-mbgl-digital-data)).
Claims are cross-verified automatically against **AISHE + NIRF + UDISE+** on the "One Nation
One Data" platform — mismatches flag automatically
([BGC Global guide](https://bgcglobal.in/naac/)). AQAR is due **31 December every year**,
aligned to DCF-2025 formats ([edhitch AQAR 2026](https://www.edhitch.com/aqar-format-2026-sections-templates.html)).
A stakeholder validation survey (~100 students/alumni/faculty/employers) is built into the
process — which requires feedback data and an alumni/employer contact base colleges mostly
don't have.

**Vriddhi coverage:** 🔴 **This is your single largest product gap.** "NAAC" appears 7 times in
the codebase; "IQAC" zero. No CO-PO attainment (though Bloom tags on questions are a perfect
seed), no AQAR/SSR data pack, no evidence repository, no feedback surveys, no AISHE export,
no progression/alumni tracking. The irony: Vriddhi already *collects* 70% of the underlying
data (attendance, IA, results, placements-prep, library, finance) — it just never assembles it
into the formats a principal needs in December.

**Lesson:** From 2026 onward, the ERP purchase in an Indian degree college is increasingly
justified to management as a *NAAC-readiness purchase*. Competitors (Linways, vmedulife,
edumerge) lead with exactly this. An "IQAC Pack" (CO-PO attainment from your own test data +
AQAR metrics auto-computed + evidence vault + feedback surveys) is the highest-ROI roadmap
item you have — it converts your assessment data into the one report every principal fears.

### Case Study E — The national data stack: APAAR/ABC, AISHE, scholarships (compliance gravity)

- **APAAR/ABC/NAD:** UGC made uploading Exam-Year-2025 marksheets + credit data to NAD-ABC
  **mandatory by 30 June 2026, with no back-fill after the window closes**
  ([TOI, Jun 2026](https://timesofindia.indiatimes.com/education/news/ugc-directs-universities-to-upload-2025-academic-records-on-abc-platform-by-june-30-check-official-notice/articleshow/131609296.cms);
  [PIB factsheet](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jul/doc202675912501.pdf):
  2,899 HEIs registered, 26.35 crore APAAR IDs). Universities now enforce at college level —
  AKTU warned 700+ affiliated colleges: **no ABC ID on the ERP → no exam form, no DigiLocker
  result** ([TOI, Aug 2026](https://timesofindia.indiatimes.com/city/lucknow/no-abc-id-no-results-aktu-warns-students/amp_articleshow/133165081.cms)).
- **Scholarships (Karnataka SSP / NSP):** Post-matric + fee-concession schemes need caste/income
  verification, **bonafide certificate + fee receipt from the college**, college e-attestation,
  and bank/Aadhaar seeding; last date typically 30 Nov
  ([Collegedunia SSP 2025-26](https://collegedunia.com/articles/g-140188-ssp-scholarship-202526-apply-online-eligibility-amount-status-and-last-date)).
  For a typical aided/unaided degree college this touches 30–60% of students and determines
  whether their fees ever get paid (DBT reconciliation).
- **AISHE:** annual, mandatory, and now the cross-check source for NAAC (Case D).

**Vriddhi coverage:** Student/UUCMS types capture category, caste, income, RD numbers ✅ —
the *fields* exist. But: APAAR/ABC ID field is effectively absent (3 mentions, 1 file), no
NAD-ABC-format export from grade records, no scholarship lifecycle/reconciliation, no
bonafide generator, no AISHE export. You're storing the inputs and missing every output.

### Synthesis — where the five case studies converge

Every institutional archetype above runs on the same five "moments of truth" each year.
Vriddhi's strength/weakness by moment:

| Moment of truth | When | Vriddhi today | Verdict |
|---|---|---|---|
| Admission & UUCMS/USN confirmation | Jun–Aug | Admissions pipeline + UUCMS mapping | 🟢 sellable now |
| Timetable & faculty mapping week | Jul / Jan | Auto-map + auto-timetable + guest faculty | 🟢 best-in-class |
| IA tests + attendance freeze | Sep–Nov | Test engine + scheme slabs; no IA-freeze export | 🟡 one export away |
| Exam-fee / hall-ticket deadline weeks | Nov–Dec / Apr–May | Hall tickets + compliance; **no email reach**, no per-student readiness checklist | 🟡 comms gap |
| Results, promotion, NAAC/AQAR, scholarships | Dec–Mar | Result import ✅; promotion/NAAC/SSP ❌ | 🔴 the Q4 product gap |

Your first pilot will feel great until December. Plan the roadmap so December doesn't hurt.

---

## 4. Technical audit findings (code & infra)

### Strengths to protect
- **Tenancy done right:** Firestore rules authorise from custom claims (`collegeId` claim,
  role claims), not from client-supplied fields; 123 match blocks; dedicated rules tests in CI.
- **Cost engineering is real:** autosave optimisation, per-student/college AI caps, no
  per-student notification fan-out. Your own costing doc's ~₹18k/yr cloud for 5,000 students
  is credible *because* of these choices.
- Lazy-loaded routes everywhere; print/PDF pipeline with server renderer + fallback; Zod
  validation + rate limiting on the API; optimistic-concurrency writes; audit collections
  (grade/paper/IA changes are traceable — a sales point for exam integrity).
- CI gates: dead-code check, unit tests, course-pack validation, render checks, rules tests.

### Risks, ranked
1. **No error tracking / no product analytics.** `ErrorBoundary.tsx` literally says *"Console
   only. Swap for Sentry/etc. when available."* With a paying college, you will learn about
   outages from the principal's phone call. Add Sentry (or Firebase Crashlytics-equivalent for
   web) + basic analytics + uptime checks **before pilot #1**. Half-day of work, existential value.
2. **No email-sending capability exists in the backend** (zero nodemailer/SMTP/provider code).
   Password resets go through Firebase's default unbranded sender. See §6-P0-1.
3. **Single Firebase project (`vriddhi-academic`) for everything** — no staging project in the
   deploy scripts; Firestore PITR/backups are *budgeted* in docs but unverified in console.
   Before customer data: enable PITR + scheduled export, create staging project, run one
   restore drill and write the runbook. Blast radius today = all tenants at once.
4. **Bundle weight on low-end phones:** initial `index` chunk 798 KB (235 KB gz) + Firebase
   886 KB (220 KB gz) + MUI 458 KB; `courseCatalog` 842 KB. Your users are on ₹8–12k Androids
   on patchy 4G. Split the course catalog per-course, audit what's in the index chunk, set a
   performance budget in CI. First-paint *is* your demo.
5. **Firestore offline persistence is not enabled** → attendance marking in a low-network
   classroom has no local cache safety net. Enable `persistentLocalCache` (with care for
   multi-tab) at least for the attendance path; this will be a week-1 pilot complaint otherwise.
6. **Dependency vulnerabilities:** frontend 25, functions 47 (incl. 1 critical). Most are
   transitive/dev-only, but the first institutional security questionnaire will ask. Triage
   runtime-reachable ones, enable Dependabot, document the rest.
7. **Maintainability hot spots:** 576 `any`/`as any`; monster files (`Layout.tsx` 1,943 lines,
   `AdminFeeManagement.tsx` 2,064, `classSchedule.ts` 3,674, `superAdminApi.ts` 2,611). Fine
   today; painful when your first hires touch fee/schedule code. Split opportunistically.
8. **Aadhaar data handling:** Aadhaar numbers are modelled in student/UUCMS records. Under
   DPDP 2023 (+ Aadhaar Act norms) store masked/tokenised where possible, restrict + audit
   reads, and say so in the DPA. Verify exactly where full Aadhaar is persisted today.
9. **No lint gate in CI** (build+tests only) and `.env.production` is tracked (harmless API URL,
   but set the pattern right before the team grows).
10. **Documentation sprawl:** 55+ docs/handoffs, some now **wrong** (e.g. the Sep-2026
    competitive analysis lists payroll, PWA, ID cards, Tally and the payment gateway as
    missing — all shipped since). New hires and support will trust stale docs. Consolidate
    into one product manual; mark handoffs as archive.

---

## 5. Your unfair advantages (sell these, in this order)

1. **The IA engine nobody else has:** question bank → blueprint papers → online tests →
   AI-assisted grading → scheme-pack IA computation. For a degree college this replaces the
   most labour-intensive faculty work of every semester. No Samarth/legacy ERP competitor in
   your band offers this end-to-end.
2. **Karnataka-native:** UUCMS bridge + per-university scheme packs (BCU/KUD/NEP) + challan
   workflows + guest-faculty billing. This is local knowledge national players don't encode.
3. **Auto timetable + auto faculty mapping** — solves the two most hated spreadsheet weeks of
   the principal's year.
4. **Indic languages** (UI + AI generation in Kannada/Tamil/Telugu/Malayalam/Hindi) — a real
   differentiator for language papers and rural colleges.
5. **Cost structure:** serverless at ~₹23/student/yr AI + ~₹4/student/yr infra (your costing
   doc) lets you price at ₹399–449 and still keep margins legacy vendors can't match.
6. **Content moat, quietly:** seeded question banks, PYQ prep, 4 certificate courses, resume
   builder — students get value in week 1, before the office workflows even matter.

---

## 6. WHAT WE ARE MISSING — the pointer list

*(Excluding WhatsApp notifications and Parent Portal, as instructed. Sizes: S ≤1 wk, M 2–4 wks, L 1–2 months, for your current team pattern.)*

### 🔴 P0 — fix before / during pilot #1 (trust-breakers)

| # | Missing | Why it will bite immediately | Size |
|---|---|---|---|
| P0-1 | **Transactional email** (receipts, credentials, fee/exam deadline reminders, hall-ticket-ready, result-published) | Backend has *zero* mail code. In-app notifications don't reach a student who hasn't logged in — and deadline misses are the #1 student-harm event in the UUCMS case studies. Also unblocks branded password reset. Wire a provider (SES/Resend/ZeptoMail) on a `notify.` subdomain with SPF/DKIM/DMARC; per-college sender name. | S–M |
| P0-2 | **Per-college payment settlement** | `functions/src/payments.ts` uses one platform Razorpay key from env → **all fee money settles to Vriddhi's account**. Colleges are trusts/societies; their fees cannot legally/practically route through your balance sheet (GST, TDS, refunds, audit). Needs per-college PG credentials (encrypted) or Razorpay Route/linked accounts, + refund workflow (also missing). Decide the model *with your CA* before the first live transaction. | M |
| P0-3 | **Semester promotion / year rollover tool** | No promote-batch, backlog carry-forward, detention list, or final-sem→alumni conversion exists. Every college hits this every 6 months; today it means manual re-import — the classic churn moment. | M |
| P0-4 | **Student certificate desk** (bonafide/study, TC, conduct, course-completion, fee-structure-for-loan) | Daily office-counter work; bonafide + fee receipt are mandatory attachments for SSP/NSP scholarships. Request→approve→numbered PDF. Your faculty salary-certificate engine is the template to copy. Highest office-staff delight per rupee of effort. | S–M |
| P0-5 | **Scholarship desk (SSP/NSP)** | 30–60% of degree-college students; determines whether fees actually get paid. Needs: scheme masters, eligibility flagging from category/income fields you already capture, application/e-attestation status tracking, expected-vs-DBT-received reconciliation against fee ledgers, deadline tracker. | M |
| P0-6 | **APAAR/ABC ID everywhere + NAD-ABC export** | Field absent from student record/imports/profile. Universities are now blocking exam forms/results without it (AKTU order, Aug 2026). Add field + completeness dashboard ("87% mapped") + credit-data export from grade records in NAD format. Mostly plumbing on data you already hold. | S–M |
| P0-7 | **Student elective / course registration** | NEP/SEP students must choose OE/SEC/VAC/languages each semester; wrong scheme/subject selection on UUCMS is a documented failure mode. Vriddhi maps faculty→course but not student→elective enrolment (with capacity + clash check + UUCMS-ready export). | M |
| P0-8 | **Ops basics: Sentry, backups verified, staging, demo tenant** | §4 items 1 & 3 + a one-click seeded demo college with reset. Without these you can't safely run — or sell — pilot #1. | S |

### 🟠 P1 — needed by customer #2–3 (the December list)

| # | Missing | Why | Size |
|---|---|---|---|
| P1-1 | **OBE: CO-PO-PSO definition, question↔CO mapping, attainment computation** | NAAC Binary weights Process+Output at 75%; attainment is the proof. Your Bloom-tagged bank + graded test data make *direct* attainment computable — competitors fake it with spreadsheets. This is both a gap and your biggest future differentiator. | L |
| P1-2 | **IQAC/NAAC evidence centre**: AQAR metric auto-pack (from existing data), criteria-wise evidence vault, DCF-2025-shaped exports | AQAR due every 31 Dec; BAF cross-checks AISHE automatically. Sell as "IQAC Pack" add-on. | M–L |
| P1-3 | **AISHE DCF export** | Annual mandate + NAAC cross-verification source. Pure export engineering over existing records. | S–M |
| P1-4 | **Feedback system** (student→faculty/curriculum, alumni, employer; Likert surveys + reports) | Mandatory NAAC evidence; BAF stakeholder validation assumes it. Invert your test-engine UI. | M |
| P1-5 | **IA freeze + university-format export; UUCMS readiness checklist** per student (registered ✓ / subjects ✓ / fee ✓ / IA ✓) | Converts Case-A pain into your hero screen. Pairs with P0-1 email nudges to defaulters. | S–M |
| P1-6 | **Exam-cell depth**: seating plans, invigilator duty chart + remuneration, revaluation workflow (apply→fee→status→revised marks), consolidated marksheet/transcript PDFs | The affiliated-college subset of the COE manual (Case C). Revaluation *workflow* specifically was a named UUCMS pain. | M |
| P1-7 | **Staff leave management** (apply/approve/balance, LWP→payroll link) + biometric CSV import for staff attendance | Samarth's HR benchmark; principals ask in every ERP comparison. Payroll already exists — leave is the missing half. | M |
| P1-8 | **Grievance redressal + statutory committee registers** (student grievance per UGC norms, anti-ragging undertakings, ICC/SC-ST cell records) | Compliance exposure for the college; NAAC evidence; cheap ticket-system build. | S–M |
| P1-9 | **Placement cell (TPO)**: company/drive pipeline, eligibility engine (CGPA/backlog filters), applications→offers, placement statistics | You have best-in-class placement *prep* but no *drive management*. Placement % is also a BAF Output metric. | M–L |
| P1-10 | **Alumni register + progression tracking** (higher studies/employment/exams) | End-state of P0-3; feeds NAAC Output metrics + BAF stakeholder survey list. Start as a register, not a social network. | S–M |
| P1-11 | **Fee refunds + defaulter aging/Dunning + bank-statement auto-reconciliation** | Refund exists only as a subscription status string today. Duplicate/failed payments were *the* UUCMS scandal — your reconciliation must be visibly better. | M |
| P1-12 | **Faculty appraisal/profile enrichment** (publications, FDP, qualifications evidence, PBAS/CAS-lite) + **slow/advanced learner** identification & remedial tracking | NAAC Criteria 3 & 2.2 evidence; mentor system already gives you the workflow shell for the second half. | M |

### 🟡 P2 — scale & polish (after product-market fit signals)

- **Custom domain per college** (`portal.college.edu.in`) — branding exists, domain doesn't; principals ask at renewal time, not purchase time.
- **Full college data-exit pack** (one-click export of everything, documented formats) — DPDP trust + removes "lock-in" objection in procurement. Today only student/faculty CSVs.
- **Your own SaaS billing automation** (PG/recurring + GST e-invoices to colleges) — manual records are fine to ~10 colleges.
- **Public admission microsite** per college (apply online + document upload + application fee) on top of the existing intake API.
- **Hostel & transport modules** — conscious deferral: only residential colleges need them; fee heads already exist for billing. Build on first paying demand, not before.
- **Research/grants, recruitment, file-tracking (e-office)** — university-tier Samarth modules; revisit only if you move up-market to autonomous/university deals.
- Performance budget enforcement in CI; bundle splitting (courseCatalog); accessibility (WCAG) pass — govt colleges increasingly ask.
- Consolidate 55+ internal docs into a customer help centre + one product manual (your support inbox will thank you).

### Explicitly do NOT build now
Facial-recognition attendance (DPDP/privacy exposure, hardware support burden), a double-entry
accounting ledger (Tally export is the correct Indian answer), a full LMS content-authoring
suite (your course packs + materials suffice), native mobile apps (PWA is the right call at
this stage — revisit only if app-store presence starts deciding deals).

---

## 7. Go-to-market readiness — domain tomorrow, Pvt Ltd next week

### Domain + email (tomorrow)
- Buy **`.com` + `.in`** (add `.co.in` defensively), 5-year term, WHOIS privacy on. Register in
  a founder's name now and transfer to the Pvt Ltd after incorporation — don't let the perfect
  block email setup for two weeks; intra-registrar transfer is a formality. Keep registrar,
  DNS and Workspace under accounts the *company* will control (not a personal Gmail you'll regret).
- Email platform: Google Workspace (best deliverability/familiarity) or Zoho (cheaper, Indian
  data centres). Create `hello@`, `sales@`, `support@`, `careers@` + named founder boxes.
- **Day-1 DNS discipline:** SPF + DKIM + DMARC (start `p=none`, move to `quarantine`). Put
  product transactional mail on a **separate subdomain** (`notify.yourdomain`) so product
  bounce/spam signals never poison your sales mail.
- Point the app: Firebase Hosting custom domain + add the domain to Firebase Auth authorised
  domains + brand the auth email templates. Reserve `app.`, `www`, `demo.` subdomains now.

### Private Limited (next week) — product-relevant checklist
- Name search on MCA **and** trademark (Class 9 + 42) for "Vriddhi" — file the TM early; SaaS
  names collide often. MOA objects should expressly cover SaaS/EdTech/software services.
- **IP assignment deed**: all pre-incorporation code/content (this repo, brand assets, course
  content) formally assigned from founders → company. Investors and acquirers check this first;
  do it while it's a signature, not a negotiation.
- GST registration (inter-state SaaS supply → register from the start; SaaS to colleges is
  18% GST B2B — colleges will want GST invoices for ITC), current account, TAN.
- DPIIT Startup India recognition + Udyam (MSME) — helps with govt-college procurement and
  payment-protection norms.
- Razorpay business activation needs: company PAN + bank + GST → sequence incorporation
  accordingly. *And* settle the P0-2 model (college-owned PG vs Route) with your CA before
  activating fee collection for any college.
- Contract pack before the first pilot signature: MSA + subscription/order form, **DPA**
  (you are the *data processor*, college is fiduciary under DPDP 2023), SLA, pilot/PoC terms,
  NDA. Add in-product **Privacy Policy + Terms** pages (currently absent) and a data-retention/
  deletion + breach-notification process note. One lawyer-day now saves the first enterprise
  security review later.

### First-90-days pilot playbook (so "hands-on" teaches you fast)
1. **Two design partners**, not five: one BCU-affiliated, one other-university; 300–1,200
   students; free/heavily-discounted for one semester in exchange for weekly access to the
   office staff (your real users) + a testimonial clause.
2. Shadow the five moments of truth in §3-synthesis. Your roadmap after December should be
   written by what you see at the IA-freeze and exam-fee weeks.
3. Instrument before you onboard: Sentry live, per-college adoption dashboard (extend System
   Health: logins, attendance-marking rate, tests run), in-app feedback button, and a shared
   friction log reviewed fortnightly.
4. Write the **onboarding runbook** while doing pilot #1 by hand: data templates (students/
   faculty/curriculum — you already have import parity tests to lean on), credential letters
   (needs P0-1), training plan (2 faculty sessions + 1 office session), go-live checklist.
   Pilot #2 should take half the effort of #1; if it doesn't, the runbook is the product gap.
5. Price anchor: keep your modelled ₹449/student/yr (floor ₹399, never <₹349) — pilots get a
   *named* discount with an end date, never "free forever", so willingness-to-pay is tested
   in semester 1, not year 2.

---

## 8. Closing assessment

You are not missing a product. You are missing (a) the **compliance outputs** (NAAC/IQAC,
AISHE, APAAR, scholarships, certificates) that justify the purchase to college management,
(b) the **last-mile plumbing** (email, per-college payment settlement, semester rollover)
that makes office staff trust it daily, and (c) the **company shell** (domain/email, Pvt Ltd,
contracts, monitoring, backups) that makes you a vendor a principal can sign with.

All three are closable in one quarter with your demonstrated build velocity — and none of
them requires waiting to start selling. Register the company, put the domain on the product,
ship P0-1/P0-4/P0-6 (the three cheapest, highest-trust items), and walk into degree colleges
with the IA-engine + UUCMS-clean-room story. The hands-on semester will reorder P1 for you —
that's expected, and this audit is the baseline to measure it against.

*— End of audit. Evidence: builds/tests run 21 Oct 2026 on commit `f36eaa5`; market sources
linked inline. Prior internal audits (`AUDIT_REPORT.md`, `docs/PROJECT_HEALTH_AUDIT_2026-09-26.md`,
`docs/competitive-analysis-and-roadmap.md`) predate several shipped modules and should be
treated as historical.*
