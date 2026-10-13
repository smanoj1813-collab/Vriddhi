# 01 · What Vriddhi is, and everything that is already built

**Source of every number:** this repository at commit `091c6d5` (2 Oct 2026), plus the dated audits
in `docs/`. Nothing here is a plan — it is an inventory. A "Where it stands" column marks the few
places where the code is thinner than the marketing, because an investor will find them anyway.

---

## 1. The one-paragraph description

**Vriddhi (वृद्धि — "growth") is the academic operating system for Indian colleges.** It is a
multi-tenant, role-based, AI-native platform that runs the whole academic life-cycle of a college —
admissions enquiries, curriculum, timetable, attendance, question banks, AI question-paper
generation, secure online exams, auto-grading, results and transcripts, fees and challans, library,
stores and procurement, staff attendance and payroll, student learning programmes, and NAAC/UUCMS
compliance evidence — in **one login, in six Indian languages, on one serverless stack**.

It is built for the segment that global software ignores: the 40,000+ affiliated Indian colleges
that answer to a state university, a state portal and an accreditation body.

---

## 2. Scale of what exists (verifiable today)

| Dimension | Measured value |
| --- | --- |
| Frontend code | **181,995 lines** of TypeScript/TSX across **581 files** |
| Backend code | **74,811 lines** of TypeScript across **115 files** in `functions/src` |
| Tests | **18,414 lines** of backend tests; ~1,540 unit tests green; **382 render-mount checks** |
| Security rules | **1,827 lines** Firestore + **329 lines** Storage + fully locked Realtime DB |
| Screens | **124 role pages** (admin 39, faculty 24, student 23, superadmin 24, office/accounts 13, employee 1) + public course & prep catalogs |
| Routes | **~166 role-scoped route definitions**, 7 role portals |
| Backend surface | **144 callable functions · 6 HTTP endpoints · 10 scheduled jobs**, all in `asia-south1` (Mumbai) |
| Content on disk | 4 certificate programmes (32 modules / 135 lessons / **984 quiz items**), ~950 curated MCQs + 22 BBA banks (1,100 items), syllabus JSON, BCU/KUD scheme presets, PYQ corpus pipeline |
| Change discipline | Node 22, Zod request validation, rate limiting, per-tier quotas, audit trails, `node --test` suites, GitHub Actions build + test on every PR |

**Why this matters to an investor:** the product is not a slide. A team that wanted to reach this
state conventionally would spend **₹75 L – 1.1 Cr and 10–14 months** (`docs/COSTING_AND_PRICING_ANALYSIS_2026-09-25.md`).
The remaining work is sales, not construction.

---

## 3. Architecture in one screen

```
 Student / Faculty / HOD / Mentor / Principal / Admin / Superadmin / Parent(roadmap)
                            │
                    React 18 + Vite + TypeScript SPA (installable PWA)
              MUI v9 + Tailwind · TanStack Query · Recharts · KaTeX
                    role guards · lazy routes · error boundaries
                            │
        ┌───────────────────┴────────────────────┐
        │                                        │
  Firebase Auth (claims: role, collegeId)   Firestore + Storage
  multi-tenant isolation by claim           per-college subcollections
        │                                        │
        └──────────────┬─────────────────────────┘
                       │
        Cloud Functions v2 (Node 22, asia-south1)
        ├── 144 callables  — everything the UI needs, validated by Zod
        ├── Express API    — /api/ai-questions · /api/papers · /api/questions
        │                    /api/prep · /api/resume · /api/attendance-pdf
        │                    /api/admissions/ingest (signed public intake)
        ├── 10 schedulers  — expired-test auto-submit, digests, cleanup, canaries
        ├── Puppeteer      — server PDF: papers, challans, transcripts, resumes,
        │                    attendance registers, ID cards (client fallback if absent)
        └── AI layer       — Gemini / OpenAI / DeepSeek behind one adapter,
                             deterministic parser first, cost guards per feature
```

**Deliberate architectural choices that are also business advantages**

| Choice | Why it matters commercially |
| --- | --- |
| Fully serverless, `minInstances: 0` everywhere | No idle servers, no ops team; **₹18,123/year** infrastructure for a 5,000-student college |
| Mumbai region (`asia-south1`) | Data residency in India; latency that feels local; DPDP-friendly story |
| Multi-tenant with claim-based isolation + 1,827 lines of rules | One deployment serves every college; new college onboarding is data, not a new environment |
| AI provider adapter with fallback + deterministic fallback | Model price shocks and shutdowns (Gemini 1.5 was retired) do not break the product or the margin |
| Per-feature AI cost guards (tiers, daily caps, cache, per-college circuit breaker) | AI is a **₹23/student/year** cost, not an unbounded liability |
| Content as versioned files in the repo, validated by CI | New courses/papers ship as a pull request; content is an asset, not a database entry |

---

## 4. The complete feature inventory

Legend — **Full**: working module with UI + server logic + tests · **Strong**: complete but with a
known thin edge · **Partial**: meaningful subset shipped, documented gap.

### 4.1 Identity, roles & multi-tenancy — *Full*

- Firebase Auth with custom claims (`role`, `collegeId`); **8 roles**: superadmin, admin, principal,
  hod, mentor, faculty, student, employee (`parent` is defined, not yet a module).
- Role-guarded routing (`RoleRoute`, `RoleGuard`) and per-role landing dashboards.
- Bulk provisioning of student and faculty accounts, credential regeneration, identity repair
  tooling, temporary-password flow, self-profile editing.
- College-scoped access control matrix, platform employee (Vriddhi staff) access with audit.
- 1,827 lines of Firestore rules: claims-based, default-deny, role canonicalisation, **zero `if true`**.

### 4.2 Academics — curriculum, timetabling, attendance — *Full*

- **Curriculum**: standardized syllabus upload (DOCX/PDF/JSON), parsing, topic/sub-topic hierarchy,
  course→faculty mapping with **auto-mapping** (subject/branch/experience/load scoring →
  preview → approve) and coverage tracking.
- **Timetable**: manual builder, bulk CSV import with clash detection, and an **auto-generator**
  (day × period placement with faculty/room/cohort clash safety, lab spanning, daily caps,
  unplaced-reason reporting) — preview → approve.
- **Attendance**: faculty marking (per period, per student), student self-view, subject-wise and
  cumulative percentage, low-attendance lists, staff/faculty attendance, register PDF export.
- **Academic calendar**, division/cohort grouping, holiday banners.

### 4.3 Assessment & AI assessment loop — *Full (the company's core)*

| Stage | What is built |
| --- | --- |
| Author | Manual question entry, Excel/CSV template import, DOCX/PDF **paper parsing** (deterministic first, AI second), AI generation by topic/difficulty/type, 22 subject banks, platform seed |
| Compose | Paper builder with blueprint patterns, unit/topic rules, marks distribution, multi-set, question-paper **PDF/DOCX** export via Puppeteer |
| Review | HOD/principal approval workflow with review states and audit trail |
| Conduct | Online tests: instructions → active test → section breaks → autosave (delta-optimised) → submit; scheduling, publish/cancel, proctor events, exam lockdown, expired-attempt auto-submit |
| Grade | MCQ auto-grade, **AI grading suggestions with confidence scores and rubric breakdown** for descriptive answers, manual grading queue, review-needed flags |
| Publish | Result release control, student results with step-by-step solutions, **university result importer** (XLSX/CSV → grades/SGPA/CGPA), draft → publish grade records, transcripts |
| Certify | Grade records, marks statements, BCU pass-rule engine (UE ≥ 28/80, aggregate ≥ 40), grade-point tables |

AI supports **6 languages** (`en, hi, kn, ta, te, ml`) for both UI and generated content, in native
Unicode script.

### 4.4 Karnataka & university compliance — *Full*

- **UUCMS integration** (Government of Karnataka's Unified University & College Management System):
  candidate-ID/USN capture, CSV import with auto-matching, status sync, eligibility checks.
- **Scheme packs** as configuration: `BCU_SEP_2024`, `KUD_NEP_CBAE`, generic NEP, plus custom packs
  per college — marks split, internal assessment composition, attendance slabs, pass criteria,
  grade tables. The same pack drives compliance dashboards, hall-ticket blocking and result import.
- **Exam office**: exam sessions, subjects, hall-ticket generation with **attendance eligibility
  blocking (75 % BCU rule)**, room allotment and seating, QR verification payloads, university
  notification targeting, result publication.
- **BCU compliance dashboard** and result importer validated against a real BCU result format.

### 4.5 Fees, finance & office — *Strong*

- Fee heads, fee structures per programme/semester, student fee ledgers, installments, concessions.
- **Challans** with college letterhead, generation/printing, and student-side **fee portal with
  proof upload**; office-side Accounts Desk for verification.
- **Online payments via Razorpay** — order creation, HMAC signature verification, webhook —
  wired "flow now, keys later": with no keys configured it degrades to offline recording.
- Finance reports, receipts, finance settings, **refunds/dues** logic, no-dues engine (library,
  lab, hostel-style clearances) with staff and student views.
- **Library**: catalogue, issue/return, fines, member view, reports (barcode-scan flow demoed).
- **Inventory & procurement**: asset register, stock, vendors, purchase requests → orders → vendor
  bills, with engine tests for all four flows.
- **Payroll**: faculty payroll engine, guest-faculty billing derived from the timetable with CSV
  export, staff salary self-view.

### 4.6 Student experience & engagement — *Full*

Student dashboard, timetable, attendance, materials, assignments (submit/grade/download), tests,
results, grades, hall tickets, fee portal, challans, **digital ID card (PDF with barcode/QR)**,
notifications, events, faculty appointments/mentoring, academic calendar, **Journey** (milestone
timeline), settings, **installable PWA** with offline shell and install prompts.

### 4.7 Learning & placement (the eLearning engine) — *Full, expanding*

- **Courses module**: 4 certificate programmes (GenAI, Digital Marketing, Project Management, HR
  Analytics) — 32 modules, 135 Markdown lessons, **984 quiz items**, projects, capstones, rubrics,
  facilitator guides, certification policy; sequential unlocking, module assessments with pass
  marks, progress sync per college (`courseProgress`), offline caching, in-app slide decks.
- **Public shareable catalog** (`/courses`) for lead generation, with device-local progress.
- **Prep Studio** (placement preparation): company-wise and subject-wise catalogs, previous-year
  university question papers (English + Kannada pipeline), repeated-question analysis, model
  answers, frequent-question detection — published content served to anonymous visitors.
- **Coding Lab**: in-browser editor with server-side execution via a Judge0-compatible runner,
  BCA-only and per-college gated, per-student/day quotas, no source retention.
- **Resume Builder** (Placement Pack add-on): 5 ATS-friendly templates, live preview, rule-based ATS
  score, text-PDF export (parser-readable, not a screenshot), credit-metered per student per year,
  optional AI rewrite suggestions, sold per college as a switchable add-on.
- **AI study packs & student AI chat**: generated revision material with cache + per-student and
  per-college caps, and a floating AI assistant for students and staff.

### 4.8 Admissions — *Partial by design, honest*

- **Admission Center**: enquiry → application → document verification → merit → offer → admitted
  pipeline with stages, weights and application numbers.
- **Public intake** endpoint for Google-Form-based enquiries: token-authenticated (SHA-256 hashed),
  write-once, rate-limited, single-college scoped — the only unauthenticated write path in the system.
- Not yet built: public online application with payment, counselling rounds, scholarship workflow.

### 4.9 Superadmin / platform operations — *Full*

Multi-college and multi-university management, college onboarding templates, subscription billing,
**access products** (sellable durations + price per student with derived active/expiring/expired
windows and MIS), access control products, platform employees, bulk user/faculty import,
question-bank seeding, curriculum seeding, **system health monitor**, platform stats, multi-college
comparison, AI model canary, platform PYQ studio, credential reset.

### 4.10 Analytics — *Full*

Admin analytics, **View 360** (single-student 360° view: attendance, assessments, fees, materials,
engagement), HOD dashboard, departmental comparisons, assessment reports and statistics, assignment
analytics, attendance analytics and digest, freshness indicators on dashboards, multi-college
comparison at superadmin level.

### 4.11 Communication — *Partial, documented*

In-app notifications, announcement module, cohort/class-targeted notices, university notification
targeting with delivery tracking fields, internal chat/AI assistant, faculty appointments.
**Not yet connected:** SMS / WhatsApp / email dispatch providers (the models and targeting exist;
the gateways do not). This is on the funded roadmap — see `03_EXPANSION_AND_USE_OF_FUNDS.md`.

### 4.12 Documents, print & export — *Full*

Puppeteer-based server rendering with a clean degradation contract (`503 + fallback: client` → the
browser renders the same document with jsPDF/html2canvas). Artefacts: question papers, answer keys,
challans, receipts, hall tickets, ID cards, attendance registers, report PDFs, resumes, transcripts.
Imports: XLSX, CSV, DOCX (mammoth), PDF (pdfjs), Google-Drive-linked PYQ seeding.

### 4.13 Localisation — *Full*

Six languages (`en, hi, kn, ta, te, ml`) across UI chrome, settings and AI-generated content;
language switcher, per-user preference, Indic font loading, Kannada content authored in-script
(booklet, brochure, deck, question papers, course packs).

---

## 5. Content assets (these compound and cannot be copied quickly)

| Asset | Volume | Why it is defensible |
| --- | --- | --- |
| Certificate programmes | 4 packs · 32 modules · 135 lessons · 984 quiz items · 232 hours · 16 credits | Authored to a CI-validated schema; each pack ships with rubrics, projects, facilitator guide, certification policy |
| Curated question banks | ~950 MCQs (B.Com/BA/B.Sc/BCA) + 22 BBA subject banks (1,100 items) | Subject-matter work, seeded per college; becomes the cold-start for AI generation |
| Scheme packs | BCU SEP-2024, KUD NEP-CBAE, generic NEP, per-college custom | Encodes real university rules as data — the part competitors hard-code |
| Syllabus JSON + Word template | BCU B.Com Sem 1, BA/BCom/BSc Sem 1, upload template | Makes the "upload your syllabus" onboarding path instant |
| PYQ corpus pipeline | Drive-linked seeding, English + Kannada, source-cited, validation contract | Previous-year papers are the #1 student search in Indian colleges |
| Kannada collateral | Deck, booklet, brochure in-script | Proof of vernacular capability, not a claim |

---

## 6. Where it honestly stands (say this before they find it)

Updated from `docs/PROJECT_HEALTH_AUDIT_2026-09-26.md` plus the gaps still visible in this commit.

| Area | State | What it means for the raise |
| --- | --- | --- |
| Code correctness | **A** — tsc clean, ~1,540 unit tests + 382 render mounts green | De-risks the technical diligence conversation entirely |
| End-to-end wiring | **A** — navigation ↔ routes ↔ callables all resolve | The demo cannot embarrass you |
| Security posture | **A−** — claims-based rules, secrets out of the tree, audited | Fix the 2 open items below before a bank or large institution invests |
| CI integrity | **C+** — functions `test:unit` still ends with `|| true`; lint not in CI | A one-line fix; do it before diligence so you can say "CI can fail" |
| Payments | **Wired, no live keys** | Add key later — either the college's own Razorpay account or Vriddhi's with settlement |
| Notifications | **In-app only** | WhatsApp/SMS/email is a funded milestone, not a claim |
| Parent portal | **Role exists, no module** | #1 ask of principals; on the 2-quarter plan |
| OBE / NAAC reporting | **Partial** (curriculum mapping strong, CO/PO attainment not built) | The single highest-value compliance feature for premium deals |
| Production pilots | **Repo shows no live college data** | Say "pre-revenue / pilot-stage" and show the pilot plan, not a fake dashboard |
| Mobile | **Installable PWA**, no native app | PWA covers 80 % of the ask for 5 % of the cost — say it that way |

---

## 7. The five-slide version of this document

1. **Problem** — a college runs on 9 disconnected tools, and the exam cycle (paper-making →
   invigilation → grading → results) is where the hours and the risk are.
2. **Product** — one role-based platform where that whole cycle is a single, auditable workflow.
3. **Proof** — 257 K lines, 7 portals, 160 functions, ~1,540 tests, ₹18 K/year to run at scale.
4. **Wedge** — AI paper generation + secure exams + auto-grading is the pull; the platform is the
   land-and-expand; Indic languages and state compliance make it un-substitutable.
5. **Expansion** — the same engine already delivers certificate programmes and placement prep,
   so the eLearning business is an add-on to an installed base, not a new company.
