# eGenius / Vriddhi — Competitive Analysis & Feature Gap Roadmap

Date: 2026-09-10 · Prepared from: (a) the actual codebase (module-by-module, with evidence),
(b) egenius.in marketing site, (c) six competitor product pages / directories.
Status: analysis only — no product code changes proposed in this file's PR beyond docs.

---

## 1. Executive summary

- **What the product genuinely is today** (code, not claims): a modern, multi-tenant,
  role-based *academic* platform — attendance, online assessments with a full test engine,
  question bank with AI generation, AI-paper-generation plus the new PDF/DOCX→paper parse
  (Slice 1/1b), curriculum/syllabus mapping, fee *records*, timetable with conflict detection,
  grade records, analytics/View360, 6 Indic languages, a real print/online/bank paper model,
  a multi-college superadmin SaaS layer, and notably hardened security/audit engineering.
- **What the market treats as table stakes for a *college ERP* and the code does not have**:
  admissions CRM, online fee *collection* (payment gateway), exam-office artefacts (hall tickets,
  marksheets, results publishing, revaluation), HR & payroll, hostel/transport, placements,
  alumni, NAAC/NBA/OBE attainment reporting, parent portal, mobile app/PWA, bulk SMS/WhatsApp.
- **Strategic read**: don't try to out-ERP the legacy ERPs on their turf. The defensible wedge is
  the thing no competitor here has: **AI-assisted, human-confirmed exam papers + online test
  engine + Indic languages + NEP/OBE-ready curriculum mapping** — i.e., the *academic* core.
  Then bolt on the 3–4 revenue-critical admin gaps (fees PG, hall tickets/marksheets, admissions
  lite, parent view) to survive procurement checklists.
- **⚠️ Claims-vs-code risk**: the egenius.in college page advertises "20+ professional modules",
  "Hall Ticket Generation", "Marks Card Generation", "biometrics". None of those exist in this
  repository. If those claims are backed by a different legacy codebase, keep the marketing
  aligned to the right product; if not, that is a sales/demo liability — fix the page or build
  the claims (hall tickets & marksheets are the cheapest to make true — see §5.2/5.3).

---

## 2. Product truth inventory (evidence-based)

Legend: **Full** = working module with UI+server logic · **Partial** = meaningful subset ·
**None** = no real implementation (keyword greps returned only false positives).

| Capability | State | Evidence / notes |
| --- | --- | --- |
| Roles & identity (student, faculty, mentor, HOD, principal, admin, superadmin) | Full | `functions/src/studentAuth/staffAuth/roleManagement/accountManagement` + claim-based rules; bulk provisioning & identity-repair tooling — unusually mature |
| Attendance | Full | faculty marking, student view, analytics; conflict tests exist |
| Online tests & assessments | Full | schedule→publish→start→autosave→submit→auto-grade MCQ + manual grading, expired-test auto-submit, result release control (`studentAssessments.ts`, TestScheduler, ReviewQueuePage) |
| Question bank | Full | manual, bulk import, AI generation, Excel template import (client + `routes/ai-questions`) |
| Paper upload → parse → confirm (Print/Online/Bank) | Full (as of Slice 1/1b) | `paperParsing.ts` deterministic-first parser + strict Confirm + Word template + pre-flight checker; audit rows |
| AI paper generator | Full | templates, topic rules, multi-provider (Gemini/OpenAI/DeepSeek) with fallbacks |
| Curriculum / syllabus mapping | Partial | upload + parsing + topic mapping (`AdminCurriculum`, `curriculumMappingApi`) — **no CO/PO attainment (OBE)** |
| Fees | Partial | fee heads incl. hostel/transport *as charges* (`feeApi.ts`), records & portal — **no payment gateway, receipts/defaulter automation not found** |
| Timetable | Full | generation, rescheduling, conflict detection (`timetableConflicts` tests) |
| Grade records / results | Partial | draft→publish pipeline (`gradeRecords.ts`); **no marksheets, hall tickets, backlog/reval** |
| Library | Partial | catalogue/issues UI (426+679 LOC) — no barcode/RFID/OPAC/fines automation |
| Announcements / notifications | Partial | in-app notifications, announcements module; **no SMS/WhatsApp/email dispatch** |
| Assignments & materials | Full | create/submit/grade with file download, deadlines, drafts |
| Appointments (student↔faculty), calendar, events | Full | dedicated pages/functions |
| Analytics | Full | View360, multi-college comparison, HOD dashboard, system health monitor |
| Multi-tenant SaaS (colleges, universities, subscription billing, onboarding) | Full | superadmin suite + `SubscriptionBilling` |
| Indic languages (KN/TA/TE/ML/HI/EN) incl. AI output | Full | language settings + native-Unicode generation — real differentiator |
| PDF export pipeline | Full | Puppeteer renderer w/ client fallback; print artefact model |
| Security engineering | Full | auth audit docs, rules hardening, optimistic-concurrency writes, audit trails |
| Admissions CRM | None | no enquiry/application/merit/counselling code |
| HR & payroll, leave | None | `payroll`/`leave` grep: 0 |
| Hostel & transport management | None | only fee-head labels |
| Placements | None | `placement` hits are assessment-type words, not a module |
| Alumni | None | 0 |
| NAAC/NBA/NIRF/IQAC reporting | None | one type field mentions NAAC; no reports |
| Parent portal | None | README: "defined, not yet a full module" |
| Mobile app / PWA | None | no manifest, no service worker |
| Grievance/feedback, ID cards, certificates, biometric/RFID, Tally export | None | 0 evidence |

## 3. Market baseline — what competitors market as table stakes

Sources fetched 2026-09-10:
[vmedulife college ERP guide](https://vmedulife.com/blog/erp-lms/best-erp-software-for-colleges-in-india-a-complete-guide-to-digitizing-higher-education/) ·
[MyLeadingCampus (autonomous colleges)](https://www.myleadingcampus.com/blogview/top-10-benefits-of-college-erp-for-autonomous-colleges-and-universities-in-2025) ·
[GeniusEduSoft CMS](https://www.geniusedusoft.com/products/college-management-system.html) ·
[CampusAlly (Databus)](https://databus.co/campusally/) ·
[edumerge college ERP](https://www.edumerge.com/products/college-erp) ·
[Codingclave comparison (incl. Linways, ₹3L+/yr, OBE-focused)](https://codingclave.com/blog/college-erp-software-india) ·
[own product page](https://egenius.in/college-management-system/) ·
[zoftwarehub listing for eGenius](https://zoftwarehub.com/products/egenius/overview)

Common denominator across all six: **admissions→alumni lifecycle, online fee collection with
UPI/PG + receipts + defaulter lists, exam office (hall tickets, seating, marks, results,
CGPA/SGPA), HR & payroll, library automation (barcode/RFID/OPAC), hostel (rooms/mess),
transport (GPS/routes), LMS, parent portal, WhatsApp/SMS/mobile apps, one-way reporting
(NAAC AQAR/SSR, NBA OBE CO-PO attainment, NIRF metrics, AISHE/UGC), grievance, ID cards,
Tally/finance integration, auto timetable**. Newer players (edumerge, CampusAlly, Linways) lead
with **OBE/NAAC as the hero feature**, and Codingclave anchors pricing at ₹50/student/year —
price pressure is real.

Also notable: **none of the six** has anything like this product's **AI paper workflow with
no-AI deterministic fallback, multi-provider AI, or Indic-language generation**; and their
engines are classic LAMP/Java ERPs — no competitor markets online tests + manual grading +
auto-submit flows with this depth. That's the wedge.

## 4. Gap analysis

### 4.1 Product gaps (ranked by (market pressure × reuse of existing infra) ÷ effort)

| # | Feature | Pressure | Build notes (fits current architecture) | Size |
| --- | --- | --- | --- | --- |
| 1 | **Fee collection: payment gateway** (Razorpay/UPI), receipts, defaulter list, concessions/scholarships | High — every procurement checklist | New callable `createFeePaymentOrder` + Express webhook route (Razorpay signature verify), `feePayments` collection, receipt PDF via existing Puppeteer pipeline; portal button on StudentFeePortal; auto-reminder via announcements | M |
| 2 | **Exam office artefacts**: hall tickets (batch PDF per student, photo/signature slots), seat allotment grid, marksheets/transcripts from grade records, backlog & revaluation states | High — and *already claimed on egenius.in* | All inputs exist (students, papers/tests, grades, PDF renderer). Hall ticket = template + batch loop; marksheet = GradeRecords snapshot + PDF; reval = status extension on grade records | M |
| 3 | **Admissions Lite**: public enquiry/apply form (can also power a lead-capture form on egenius.in), application states (enquiry→form→doc review→merit→offer→admitted), document upload to Storage, merit list builder on PUC/CET marks | High — revenue front-door; greenfield-friendly | `admissions` collection + public un-authenticated submit callable w/ rate limit (existing express + rateLimit middleware); simple kanban admin page; reuses identity provisioning to create student accounts on admission | M |
| 4 | **OBE (CO-PO) + NAAC reporting starter**: define COs per course, map questions↔CO (question bank already has topic/difficulty — add `co` tag), attainment per student/cohort from test results, PO/PEO matrix, AQAR metric exports (CSV/PDF) | High — the modern differentiator (edumerge, Linways, CampusAlly all lead here); pairs *perfectly* with the assessment engine's MCQ+manual grading data | Extend curriculum mapping module; attainment = callable aggregation over `studentTestAttempts`; export = existing PDF/CSV paths | L |
| 5 | **Parent portal**: read-only view (attendance %, fees due, test results, circulars), OTP/PIN login for a `parent` identity linked to students | Medium-high — 100% of school-facing pitches, most college pitches | Role already scaffolded in README; identity system supports linking; reuse studentAssessments read paths with parent scoping | M |
| 6 | **Announcements delivery: WhatsApp/SMS/email** (bulk + scheduled, per-college config, opt-in) | Medium | Announcement module exists; add dispatch service in functions (MSG91/SMS gateway + WhatsApp Cloud API), delivery log collection | S-M |
| 7 | **PWA + "app" story**: manifest, offline shell, push notifications (FCM), install prompt | Medium — "mobile app" on every checklist; PWA gets 80% of it | Vite PWA plugin; FCM already natural on Firebase; cache student views (timetable, fees, results) | S |
| 8 | **Documents**: ID card generation (batch, template w/ college branding), certificate generator (bonafide/no-objection/transfer) with request flow | Medium — small, demo-friendly | HTML templates + existing Puppeteer renderer; Firestore request queue | S |
| 9 | **HR & payroll lite** (staff records, leave apply/approve, pay slips) | Medium | Independent of academic core; payroll = computed sheet + PDF payslips; biometric import = CSV | L |
| 10 | **Hostel & transport** (rooms/allotment/mess; routes/vehicles/stops) | Low-medium — defer until demand | Two self-contained CRUD+report modules; fee-heads already exist for charges | L |
| 11 | **Placements & alumni** (company drives, eligibility, offers; alumni directory) | Low-medium — good expansion story, not RTO-critical for smaller colleges | New modules; reuses identity + announcements | L |
| 12 | **Grievance & feedback** (student→admin ticket states, course feedback surveys) | Medium for NAAC evidence (5.3.4 etc.), cheap to build | Ticket collection + SLA states; survey builder can reuse the *test engine UI* (inverted: no marks, Likert items) — very high reuse | M |
| 13 | **NEP 2020 readiness**: credit framework fields, multiple entry/exit states, ABC-ID field on student + export format | Medium — keyword colleges search for; cheap as data-model + report | Academic model extension + exports | M |
| 14 | **Library v2** (barcode checkout, fines, OPAC search, e-resource links) | Low-medium — existing UI can be upgraded incrementally | Barcode = camera scan via web (no native app needed — beats some legacy ERPs); fines → fee heads | M |
| 15 | **Tally/finance export** | Low — Indian colleges ask | CSV/Tally XML export of receipts/fees | S |

Explicitly **out of scope / bad bets**: facial-recognition attendance (privacy, DPDP exposure),
LMS content authoring (use deep-links to Google Classroom/Moodle until admissions/OBE ship),
per-minute GPS hardware integrations (partner instead).

### 4.2 Marketing-site (egenius.in) gaps

Observed on the site itself: it is a near-pure **blog feed** — the college product page is thin,
the "campus management system" page redirects to an `elementor-82077` slug (SEO-broken), title tag
has a trailing stray `-` (`eGenius ERP,`), the enquiry email is rendered as a link prefixed with
`http://egenius.in/enquiry@…` (broken mailto), zero case studies/testimonials, no pricing page for
the college product (only a "Regular Package" bullet list on the college page), no demo scheduling,
no screenshots/product tour, third-party directories (zoftwarehub) list only 8 features.

Site additions, ordered:

1. **Module pages** (one per pillar: Admissions, Academics/OBE, Exams & AI question papers,
   Fees & payments, Attendance, Transport/Hostel *once they exist* — don't market what isn't).
2. **The hero page the market doesn't have**: "AI question paper studio — upload any PDF/DOCX,
   it transcribes without AI keys; review → confirm → schedule online." With the Word-template
   download as the lead magnet (email gate) — doubles as the admissions-lite demo form (#3.1).
3. **Comparison + "why modern" page**: vs legacy ERPs: multi-tenant, per-college isolation,
   Firestore audit trails, Indic languages, no on-prem server, browser-only (no biometric
   hardware lock-in). Include the honest table: hall tickets/marksheets "on roadmap".
4. **Pricing transparency** page (₹/student/yr band like Codingclave, or flat per-college tiers —
   the SubscriptionBilling module already models tiers).
5. **Demo booking** (Cal.com/Google Meet embed) + WhatsApp CTA; fix mailto/title/slug bugs.
6. **Security & DPDP Act page**: claim-based auth, audited rules, data residency (asia-south1),
   audit logs — few competitors market compliance; it's a procurement unlocker (and pairs with
   the repo's `AUTH_AUDIT.md` work).
7. Schema.org `SoftwareApplication` + `FAQPage` markup, OG images, /resource/blogs restructure
   with internal links from every blog to the matching module page; publish a blog per shipped
   gap-feature (the parse flow is already blog-worthy: "Exam papers without AI").

## 5. Recommended sequencing (once PR #41 is merged)

- **Sprint A (1–2 wks)** — Site quick-wins (§4.2.2, §4.2.5, bug fixes) + **PWA shell** (#7) +
  **ID cards/certificates** (#8, demo gold).
- **Sprint B (2–3 wks)** — **Fees payment gateway** (#1) end-to-end incl. webhook, receipts,
  defaulter reminders; announce-delivery (#6) rides along (needs same dispatch plumbing).
- **Sprint C (2 wks)** — **Exam-office artefacts** (#2): hall tickets + marksheets — makes the
  existing marketing claims true.
- **Sprint D (3–4 wks)** — **Admissions Lite** (#3) — public form + merit + offer; converts site
  traffic into the product's own pipeline.
- **Sprint E (4 wks)** — **OBE/NAAC starter** (#4) with question-bank `co` tags + attainment from
  the test engine — the enterprise-deal differentiator; then **parent portal** (#5).
- Backlog: 9–15 by demand; re-run this analysis quarterly (competitors move fast on OBE/AI).

Each sprint ships as: callable/Express route + Firestore rules/claims + role pages + tests
(node --test, current suite pattern) + feature-flag per college via the existing config route.

## 6. Immediate housekeeping flags

- PR #41 (parse + delete + templates) is green but **unmerged**; the sandbox branch keeps
  reverting between turns, so merge soon to avoid another manual rebase.
- Remove any marketing claim for **biometrics** unless a device-integration plan exists.
- `current-firestore.rules` vs deployed rules drift (repo has both rules files) — worth a check
  before adding admissions (public write paths demand careful rules + rate limits).
