# Karnataka Degree Colleges — How They Actually Run, and Where Vriddhi Fits

Research date: 2026-09-23. Focus: **affiliated degree colleges** across Karnataka's ~33
state universities (Mysuru, Bangalore, BCU, BNU, Kalaburagi, Kuvempu, Mangaluru,
Karnatak Dharwad, Davangere, Rani Channamma, Tumakuru, Kodagu, Vijayanagara…),
mostly small-to-mid private/aided colleges running BA, B.Com, BBM, BSc, BCA.

Sources: Karnataka university NEP/CBAE scheme PDFs (Karnatak University Dharwad
BBA/B.Com/UG Regulations [1][2][3]), BCU BCA CBAE tables [4], a working
Karnataka college fee schedule (LCB College [5]), UGC workload norms via press
coverage [6][7], UUCMS details (repo: `KARNATAKA_UNIVERSITY_FEATURES.md`), and
Vriddhi's own module inventory. Items marked *(est.)* are typical-practice
estimates, not sourced figures.

---

## 1. How a Karnataka affiliated degree college actually runs

### The structure
- **Colleges don't design their own curriculum or exams.** They are affiliated:
  the university prescribes the scheme (credits, courses, IA pattern, exam
  format, pass criteria), the college runs admissions, classes, internal
  exams, attendance, and hands exam data/results through the university.
- **One college often serves one or two universities**, but *every*
  Karnataka university is on **UUCMS** (uucms.karnataka.gov.in) — the
  state-mandated common portal where students register (Candidate ID), get
  USNs, do semester course registration, and **pay university exam fees**.
  No Candidate ID → no admission, no exam registration.
- **Different universities ≠ same rules.** This is the single biggest
  operational complexity in Karnataka (vs a single-university state):
  | | BCU (per repo compliance doc) | Karnatak Univ. Dharwad (NEP PDFs) |
  |---|---|---|
  | Marks split | 80 external + 20 IA | 60 SEE + 40 CIE on 100-mark courses (also 50-mark sub-3-credit courses) |
  | IA composition | best-2-tests (10) + attendance slab (5) + assignment (5) | continuous internal evaluation (tests, assignments, practicals) per scheme |
  | Course shape | fixed papers | CBAE: DSCC/DSE/SEC/OEC/AECC, L+T+P hours (e.g. 3+0+0 = 25h, 3+1+0 = 4cr), elective Groups A–D [1][2][3] |
  - So a "compliance engine" cannot be one hardcoded university — it must be
    **per-university configuration packs** (see §5, gap G1).

### The academic year (typical)
| When | What happens | Who does it |
|---|---|---|
| May–Jun | Odd-semester university exams done; **even-sem admissions start** (PUC results → UUCMS applications → doc verification → fee payment → Principal approval → USN) | office staff + UUCMS portal |
| Jul–Aug | Orientation; **curriculum → faculty mapping** (who teaches what, per batch/section); **timetable building**; lab schedule; first internal tests | principal/HOD/office |
| Sep–Nov | Teaching (≈14–15 working weeks); mid-semester internal exams (1–2 tests/subject); assignments; attendance scrutiny starts (75% rule) | faculty + exam cell |
| Dec–Jan | Even-semester university exams: forms, **exam fee payment via UUCMS**, hall tickets, room allotment, invigilation | exam cell |
| Feb–Mar | Results published by university → college imports → SGPA/ATKT analysis; supplementary/improvement exam cycles; **revaluation** windows | exam cell |
| Jun | Odd-sem exams repeat; **placement/internship season for final years** | TPO (where one exists) |

The people doing this: **1–3 office staff + the principal + HODs + a part-time
TPO** in a typical 300–800 student college. Everything above is currently
Excel, registers, phone calls and WhatsApp. That is the job Vriddhi sells.

---

## 2. The specific areas asked about

### 2.1 Payments
- **Fees are semester-ized installments**, split into many heads — a real
  Karnataka college schedule shows: admission, tuition, **internal exam fee,
  library, development, electricity, registration, lab caution money, and a
  separate *eligibility fee* (paid to the university, not the college)** [5].
  Example magnitudes: BA ≈ ₹8.7k/yr at a small college; B.Com higher;
  private unaided colleges set fees within the state fee-committee norms.
- **Two money flows to track**: (a) college fees (tuition/installments,
  waivers by category — SC/ST/OBC/KK in aided colleges), (b) **university
  exam-fee pass-through via UUCMS** with a hard last date — miss it and the
  student can't sit the exam. Deadlines are the #1 parent anxiety.
- **Payment channels in practice**: bank challans (college-specific formats),
  online payment (Razorpay/CCAvenue/UPI) at the front desk, cash for small
  colleges. Reconciliation against bank statements is manual.
- **Defaults** are a real revenue problem: installment reminders by phone,
  no systematic Dunning.

### 2.2 Curriculum
- **CBAE under NEP**: ~50% discipline core (major) + ~20% minor/electives +
  ~30% ability/skill/open-elective courses [1][2]. Per-semester load ≈
  20–26 credits [4]. Each course carries **L+T+P hours** (e.g. 3+1+0 → 4
  credits, 60h) — the university syllabus is a machine-readable tree:
  course → modules → units, with prescribed textbooks/modules.
- **Languages (Kannada L1/L2, MIL), Environmental/Constitution, Health &
  Wellness, PE** are compulsory everywhere; Kannada is 42h/semester [1].
- **Two schemes coexist** (old CBCS vs new NEP/SEP cohorts in the same
  college) — a college simultaneously runs 2–3 scheme versions across its
  year-cohorts.
- Syllabus files arrive as PDFs/Word from the university; parsing them into
  the system is a real bottleneck (Vriddhi has a syllabus parser for this).

### 2.3 Scheduling & hours per day
- **UGC norms** (apply to every Karnataka college): full-time faculty
  workload **40 h/week for 30 working weeks (180 teaching days/year)**,
  physically on campus **≥5 h/day**, **direct teaching ≤ 24 periods/week**
  [6][7]. *(est.)* one period = 50 min.
- **Typical affiliated-college day**: classes ~**8:00 → 1:30/2:00 pm**,
  **4–5 periods/day**, Mon–Sat (some colleges Friday-afternoon off); labs are
  half-days on fixed days; evening batches (BBM/BCA parallel) at
  multi-shift colleges. So the scheduling problem is: cover each course's
  L+T+P hours inside the grid, respect 24 h/wk per faculty, no
  double-booking of faculty/rooms/cohort — exactly what Vriddhi's
  `generateClassSessions` clash engine + the new **auto-mapping** and **bulk
  schedule import** now address at the *faculty-to-course* and *CSV* layer.
  What's still missing: **period-slot auto-assignment** (who, which slot) and
  a **per-day grid view** validated against the university-mandated hours.

### 2.4 Faculty numbers in core subjects (BA / B.Com / BBM)
- UGC minimum-faculty standards scale roughly **1 faculty : 25–30 students**
  per department [6][7]; *(est.)* a BA, B.Com or BBM department with 150–300
  students therefore carries **6–12 full-time faculty** (incl. HOD), and a
  300–800-student college of this kind runs **25–50 full-time faculty total**.
- **Guest/P&T (part-time) faculty are the norm** for filling gaps (labs,
  electives, parallel sections) — they have no stable system identity, get
  paid per period, and join mid-year. This is why the *mapping* step (who
  covers which course this semester) is so painful to do by hand — and why
  the auto-mapper's load-balancing + guest-faculty inclusion matters.
- Subject fit is shallow in these departments: a B.Com faculty may teach
  Accounting, Business Law, Statistics, and a banking/lab course across
  years — faculty profiles (subjectsUG/PG, specialization) are the right
  matching signal, which is what the auto-mapper scores.

### 2.5 Exam pattern
- **End-semester university exam**: 3-hour paper, sectioned (e.g.
  10×2 + 5×5 + 3×10 or 80/20 splits), internal choice in parts B/C [8][9];
  **50-mark papers for sub-3-credit courses/practicals** [2]; languages can
  be written in **Kannada or English** (theory paper in both) [repo BCU doc].
- **Practicals**: major/minor practicals + spotters + record + viva (for
  BSc/BCA labs) [9].
- **Internal assessment**: 1–2 tests/subject + assignment + attendance marks
  (slab-based, e.g. BCU 91%+ = 5 marks … <75% = 0 and **exam-blocked**).
- **Pass criteria** vary by university (BCU: 35% in university paper + 40%
  aggregate; others differ) — config, not code.
- Extra cycles: **supplementary, improvement, revaluation** — each with its
  own fee + date windows, and hall tickets for re-exams.
- Operational load: exam forms → fee verification (UUCMS) → **hall tickets
  with QR + room/seat allotment** → invigilator lists → results import →
  SGPA/CGPA → ATKT tracking across semesters.

### 2.6 Exam practice
- **VPPs (Valuable Past Papers) are the de-facto prep culture**: students buy
  10–20 years of previous university papers per subject and solve them in
  3-hour sittings. Universities publish syllabus **modules/CBMs and sample
  papers**; third-party sites aggregate past papers [10][11].
- Colleges typically run **one mid-semester internal test** — not a real test
  series. There is almost no timed, auto-graded, university-pattern mock
  testing. → This is whitespace Vriddhi can own (its question bank + AI
  paper generator + assessment engine already exist).

### 2.7 Study materials
- University-prescribed **textbooks + module PDFs (CBMs)**; NEP pushes
  **ODL (online/distance) delivery** — UG programmes increasingly require a
  substantial share of credits delivered online, which Karnataka universities
  are operationalising on their own portals.
- In practice at affiliated colleges: the module PDF circulates on
  WhatsApp; **no per-student study tracking, no digital library, no
  assignment/e-resource per course**.

### 2.8 Placement & career prep
- In **arts/commerce affiliated colleges, placement cells are thin or
  absent** (strong only in private autonomous/engineering colleges). The
  real exit routes are:
  - **Government job exams** — KPSC, KAD, banking (IBPS/SBI), KFEA, clerk:
    application deadlines, category cutoffs; students track these on
    Telegram groups.
  - **Internships & skill schemes** — state internship schemes (e.g.
    KSCSTE), NCS/ICT skills, NSS projects.
  - **Further studies** — M.Com/MBA/MCA, CUET, university entrance.
  - Corporate campus drives are the exception, not the rule.
- So "placement prep" for this segment = **career ops**: exam-deadline
  tracking + alerts, internship application tracking, CV/skill register,
  aptitude practice, offer/feedback records for the few drives.

---

## 3. Where Vriddhi can be most helpful (strengths → market reality)

1. **The full delivery spine exists and is the product.** Syllabus →
   curriculum → **faculty mapping (now automated, PR #77)** → timetable →
   class sessions → attendance → topic coverage → internal exams → results →
   SGPA/ATKT. Small colleges run this in 4–6 separate Excel books +
   registers; a single system with **one-click bulk schedule import with
   clash safety** (PR #77) and **scored auto-mapping** removes the two most
   time-consuming manual steps (the HOD's July crunch) immediately.
2. **75% attendance → auto-blocked hall tickets** (BCU engine + BCU
   compliance dashboard). Every exam cell re-does this by hand each
   semester; auto-blocking + parent alerts is a demo-stopper feature.
3. **UUCMS-compliant wrapper** (Candidate ID/USN import, scheme tagging).
   In a state where UUCMS is mandatory but has no good hall-ticket PDF,
   room-allotment UX, or parent view, "UUCMS-compliant, not a replacement"
   is the right position.
4. **Multi-university tenancy** (superadmin multi-college, per-college
   schemes) — the same fragmentation that pains colleges is the moat vs
   single-college tools.
5. **Question bank + AI paper generation + auto-grading** → converts the
   VPP culture into a *timed, auto-graded, syllabus-tagged test series* per
   subject — something no small college can self-build. AI grading already
   handles 5M/10M descriptives (repo: `RESULT_IMPORTER_AND_AUTO_GRADING.md`).
6. **Fees with installment/last-date machinery** (`FEE_MANAGEMENT_CHALLAN_E2E.md`)
   + university-exam-fee last-date alerts (Uniclare's killer feature, already
   replicated).
7. **Analytics + View 360 + parent alerts** — the principal's monthly
   committee meeting (attendance, fees, results, ATKT list) becomes a
   dashboard.

## 4. Where we are lagging (gap register, ranked)

| # | Gap | Reality on the ground | Vriddhi today | Pointer |
|---|---|---|---|---|
| ~~G1~~ ✅ shipped (G1) | **Per-university compliance is code, not config** | 33 universities, 2–3 schemes running in one college (BCU 80+20, Dharwad 40+60, 75-mark papers, grade tables, mediums) | BCU engine hardcoded in `bcuCompliance.ts` | Make a **University Scheme Pack** (JSON): marks split, IA composition, pass criteria, grade table, mediums, paper duration → drive compliance dashboard, hall-ticket blocking, result import, paper generator from the same config. This is the #1 multi-college unlock. |
| G2 | **UUCMS is CSV-import only** | UUCMS is the source of truth for USN, registration, exam-fee payment | Manual CSV import, no verification of exam-fee-paid | Add a **sync job** (scheduled export import + diff) and an **"exam fee paid" verification view** per student (the parent's #1 question), with last-date Dunning to parents. |
| G3 | **Payments: no live gateway / reconciliation** | Challan + front-desk UPI + category waivers; manual reconciliation | Fee categories, challan E2E, installment tracking | Razorpay/UPI payment links per student (installment-aware), receipt PDFs, **waiver rules by category** (SC/ST/OBC/KK %), bank-statement import & reconciliation, default-aging report with reminder templates. |
| ~~G4~~ ✅ shipped (G4) | **No period-slot auto-scheduler** | HOD hand-builds the grid (4–5 periods/day, 8–2, lab days, guest slots) in Excel; clash fixes by phone | Timetable CRUD + bulk import + session generation + clash engine | Extend auto-mapping to **slot assignment**: greedy over periods (respecting 24 h/wk, lab half-days, faculty preferences, room grid) → preview grid → apply. A per-day "hours per day" view with university-mandated-hour coverage per course is the trust feature. |
| ~~G5~~ ✅ shipped (G5) | **Guest/P&T faculty lifecycle** | 30–50% of sections at small colleges are guest-taught; per-period pay; mid-year joins | Faculty profiles exist; no contract/pay model | Guest-faculty onboarding (date-bounded, per-period rate), inclusion in auto-mapping (lower priority than full-time), **period-wise load billing sheet** (their pay slip). |
| G6 | **VPP-powered exam practice** | Students buy past-paper books; colleges run one internal test | Question bank, AI papers, assessments | **VPP ingestion** (paste/upload 10y past papers → auto-extract Qs into the bank, syllabus-tagged) + **university-pattern mock tests** (3 h, sections A/B/C, internal choice, English/Kannada medium choice, auto-graded, result per subject) + attempt analytics for the HOD. |
| G7 | **Study materials / ODL tracking** | Module PDFs on WhatsApp; NEP ODL credit requirement creeping in | Study materials module (seeded) | Per-course **resource shelf** (textbook + CBM PDFs + links), **ODL completion tracking** per course (view/assignment counts) so the college can evidence its online-credit share; reuse the curriculum-topic ledger for per-study-material completion. |
| G8 | **Career/exit ops (arts-commerce reality)** | Placement cells are thin; exits are gov-exams, internships, further study | Prep module exists (exams-focused) | **Gov-exam deadline tracker** (KPSC/IBPS/KAD) with alerts, **internship application + stipend tracking** (KSCSTE etc.), CV/skill register + aptitude practice, offer ledger for actual drives, alumni outcomes. |
| G9 | **Exam-day operations** | Room allotment, invigilator lists, seat maps printed by hand | Room allotment API + hall tickets (BCU) | Exam-day console: per-day invigilator assignment (from faculty with light load that day — reuse the mapper), seat-map PDF, report-center log, supplementary/improvement/revaluation **cycle templates** (dates + fees + forms in one click). |
| G10 | **Results → student loop** | College re-types results into registers; ATKT tracked in a notebook | Result importer (BCU-verified), grade records | Marks-card PDF + DigiLocker share, **ATKT history across semesters**, revaluation request flow with fee, result-announcement notification (already a defined type). |
| G11 | **Parent reach** | Parents are on WhatsApp; no portal | Parent role defined, portal not built | Read-only parent view: attendance %, fee dues+pay, hall ticket, result — the single highest-churn-saver for fee collection. |
| G12 | **Identity hygiene at scale** | uid vs profile-id vs email aliases (mapped in PR #77 for one domain) | Alias resolution exists per-domain | Generalize the **identity resolver** (uid/profile/email/name directory, ambiguous-alias detection) as a shared service; every import (students, faculty, results) should run through it. |

## 5. Suggested sequencing

1. **G1 University Scheme Packs** — unblocks multi-university sales (BCU,
   Kalaburagi, Kuvempu, Dharwad packs first); moves all BCU constants into
   config; the auto-mapper's `semesterWeeks`/capacity already take options —
   same pattern extends to IA/pass/grade.
2. **G4 slot auto-scheduler** — natural continuation of PR #77 (same scoring
   core, new constraint axis: periods), and the "hours per day" visibility.
3. **G3 gateway + Dunning** — revenue; biggest principal objection to pilot
   cost is "will it actually collect fees?".
4. **G6 VPP mocks** — student-side virality (students pull parents/principals
   into the platform), and it's the cheapest wow.
5. **G2 UUCMS sync, G9 exam-day ops, G11 parent view** in that order.

## 6. Key sources
[1] Karnatak University (Dharwad) NEP BBA scheme — kud.ac.in/file_upload/nep/BBA.pdf
[2] Karnatak University NEP B.Com scheme — kud.ac.in/file_upload/nep/BCom.pdf
[3] Karnatak University UG Regulations (CBAE, elective Groups A–D) — kud.ac.in/file_upload/nep/UG%20REGULATIONS.pdf
[4] Bengaluru City University BCA CBAE tables (credits per semester, L+T+P) — bca.klesnc.edu.in NEP-BCA syllabus PDF
[5] LCB College fee structure PDF (admission/tuition/internal-exam/library/registration/eligibility-fee heads)
[6] UGC 40 h/week, ≥5 h/day on campus norms — Times of India (2009 regulation coverage)
[7] DU-to-HoDs UGC minimum-workload enforcement (180 teaching days, 24 periods direct teaching) — Economic Times (2022)
[8] Karnataka 2nd PUC board pattern (80+20, 3 h, sections A–E with internal choice) — vedantu.com board pattern page
[9] UG question-paper/practical patterns (sections, spotters, record, viva; 60/40 splits) — srkgacyanam.edu.in CIE scheme PDFs (illustrative of common UG formats)
[10] Karnataka University previous-year paper archives (VPP culture) — sample-papers.com
[11] Karnataka model/past question paper portals (KSEAB, careers360, shiksha) — exam-prep resource landscape
+ Repo docs: `KARNATAKA_UNIVERSITY_FEATURES.md`, `NEXT_STEPS_AFTER_REAL_DATA.md`,
`FEE_MANAGEMENT_CHALLAN_E2E.md`, `RESULT_IMPORTER_AND_AUTO_GRADING.md`,
`docs/auto-curriculum-mapping.md`
