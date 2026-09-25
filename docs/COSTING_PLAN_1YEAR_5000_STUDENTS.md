# Vriddhi — 1-Year Costing Plan for a 5,000-Student College

**Prepared:** 25 September 2026 · **Reproduce:** `npm run cost:plan` (add `-- --optimized`, `-- --students 3000`, `-- --team 150000`, `-- --json`)
**Companion:** `docs/COSTING_AND_PRICING_ANALYSIS_2026-09-25.md` (build cost, market pricing, ROI). This document answers four narrower questions: what the Firebase Blaze plan really charges once you cross the free quota, what every role reads and writes per day (including the new accounts and operations teams), what one full academic year costs month by month with your 5-person team at ₹30,000 gross each, and the **minimum per-student / per-user bid that does not lose money**.

> ₹96 / USD. Cloud figures are ex-GST (Google Cloud India adds 18 % GST, claimable as input credit if you are GST-registered). Every number is an estimate built from the queries in the code, not a Firebase invoice — validate against the console after the first billed month.

---

## 1. The Blaze plan, stated plainly

| Meter | Free every day | Price after that | Notes |
| --- | --- | --- | --- |
| Firestore document reads | **50,000 / day** | **$0.06 per 100,000** (₹5.76) | the quota resets daily at midnight US-Pacific (≈ 12:30–13:30 IST) and **does not roll over** — an unused Sunday does not pay for an exam Monday |
| Firestore document writes | **20,000 / day** | **$0.18 per 100,000** (₹17.28) | one write per document touched; a 60-student attendance session = 63 writes |
| Firestore deletes | 20,000 / day | $0.02 per 100,000 | negligible for Vriddhi |
| Firestore stored data | 1 GiB | $0.18 per GiB-month | includes index size |
| Cloud Storage (files) | 5 GB stored · 1 GB/day download | $0.026 / GB-month · $0.12 / GB download | assignments, materials, challan/hall-ticket PDFs |
| Hosting transfer | 360 MB / day | $0.15 / GB | the PWA bundle + daily deltas |
| Cloud Functions | 2 M invocations · 180 K vCPU-s · 360 K GiB-s per month | $0.40 / M · $0.000024 / vCPU-s · $0.0000025 / GiB-s | Vriddhi stays inside this free tier all year (2.3 M invocations / yr) |
| Firebase Auth (email/password) | unlimited | free | phone-OTP would cost extra |

**What this means for a 5,000-student college:** a normal teaching day generates **≈ 3.4 million reads and ≈ 45,000 writes**. The free quota therefore covers **1.5 % of the reads and 45 % of the writes** of an ordinary day; on an online-test day (5.5 M reads / 140 K writes) even less. You are on pay-as-you-go from the first week of the semester. The good news is the price per unit is so small that the whole year of Firestore usage as currently coded is about **₹38,000**.

---

## 2. Who uses the system (headcount used in the model)

| Role | Users | Where they work in the app |
| --- | ---: | --- |
| Students | 5,000 | student portal (dashboard, attendance, timetable, tests, results, fees, materials, assignments, library) |
| Faculty | 200 | attendance marking, schedule, question bank, papers, assignments, grading; **15 HODs** and **40 mentors** are faculty with extra pages |
| Principal / college admin / exam cell | 5 | analytics, curriculum, timetable, scheme packs, result import, hall tickets |
| **Accounts team** | 5 | fee management, challans, collections, receipts, finance reports, vendor bills, Tally export |
| **Operations team** | 8 | operations desk, library (issue/return, visits, fines), inventory & assets, purchase requests/orders/GRN, vendors, admissions, no-dues |
| Superadmin (your team) | 2 | platform dashboards, imports, billing, health monitor |
| **Total accounts** | **5,218** | 84 sections of ~60 · 5 periods per day |

Academic calendar modelled (Aug 2026 → Jul 2027, Karnataka degree college): 151 regular teaching days + 24 internal-assessment (online test) days + 32 university exam days + 2 result days + 52 office-only days (admissions, vacation) + 104 weekends/holidays.

---

## 3. What each role reads and writes per day — from the code

| Role | Users | Active on a teaching day | **Reads / day** | **Writes / day** | Where the numbers come from |
| --- | ---: | ---: | ---: | ---: | --- |
| Student | 5,000 | 60 % (3,000) | **1,020** | 3 | `useStudentData.ts` runs on every dashboard mount with **no cache** and calls `fetchAttendance`, which reads up to **500 raw `attendanceRecords`** (`limit(500)`, no semester filter — after month 4 every student always has ≥ 500), plus profile 2, assignments ~15, fees ~8, today's timetable ~35, notifications ~20, tests callable ~15 ⇒ **≈ 600 reads per dashboard load** × 1.5 loads + ~120 reads on other pages |
| Faculty | 200 | 85 % (170) | 380 | 15 | dashboard/schedule ≈ 230 (`fetchFacultyClassSessions` ≤ 100, `fetchFacultyStudents` 4 × ≤ 200, papers ≤ 100) + question bank / papers / assignments ≈ 150; React Query caches for 2 min |
| HOD (extra) | 15 | 100 % | +600 | +10 | department analytics, 500-cap queries |
| Mentor (extra) | 40 | 100 % | +80 | +2 | mentee list, View 360 |
| **Attendance marking** (per session, not per user) | 420 sessions / day | — | 70 per session | **63 per session** | `fetchStudentsForSession` roster ≈ 60 + session + prior attendance; `saveAttendance` writes 60 `attendanceRecords` + `attendance` + `attendanceSummary` + `classSessions` ⇒ **29,400 reads and 26,460 writes per day** |
| Principal / admin / exam cell | 5 | 100 % | 6,000 | 100 | `dashboardApi.ts`: students / attendance / assessments / scores each `limit(MAX_READS = 500)` ⇒ 2,000 reads per dashboard load, plus analytics & compliance pages |
| **Accounts team** | 5 | 100 % | 4,000 | 40 | `feeApi.ts`: fee page = `feeStructures` ≤ 500 + `students` ≤ 500 + `feePayments` ≤ 500 = **1,500 reads per load**; challan list ≤ 500; AccountsDesk = payments 500 + fines + vendor bills + PRs ≈ 1,200 |
| **Operations team** | 8 | 100 % | 8,000 | 150 | `officeDb` lists: OperationsDesk (PRs, POs, items, assets ≤ 2,000 each), `libraryTitles` ≤ 20,000, `libraryLoans` ≤ 20,000, `libraryVisits` by date ≤ 50,000, `assets` ≤ 50,000, `students` ≤ 5,000 for member sync |
| Superadmin (you) | 2 | ~1 tab open | **81,000** | 20 | `useSuperAdmin.ts` polls 7 queries every 60–120 s (`refetchInterval`) ≈ 225 reads / min per open tab × 6 h |

### Event-driven volumes on top of the daily profiles

| Event | Volume per year | Reads | Writes | Functions | When |
| --- | ---: | ---: | ---: | ---: | --- |
| **Online tests (assessments)** — 20 per student | **100,000 attempts** | 155 per attempt → **15.5 M** | 24 per attempt → **2.4 M** | 12 per attempt → 1.2 M | 4 IA windows × 6 days ⇒ **4,167 attempts, 646 K reads, 100 K writes per IA day** |
| Assignments — 8 per student | 40,000 submissions | 35 each → 1.4 M | 7 each → 0.28 M | 3 each → 0.12 M | teaching days (265 / day) |
| **Fee collections** (accounts) — 4 instalments | 20,000 | 2 each → 40 K | 3 each → 60 K | Razorpay callables | Aug 30 % · Sep 15 % · Jan 25 % · Feb 15 % · rest spread |
| **Challan generation bursts** (accounts) | 4 × 5,000 | 5,000 each | **15,000 writes in one day**, 4× | — | Aug, Oct, Jan, Mar |
| Library issue + return (operations) — 10 loans / student | 50,000 loans | 6 each → 0.3 M | 4 each → 0.2 M | — | class days |
| Library gate visits (operations) — 40 / student | 200,000 | reports 24 × ≤ 50 K = 1.2 M | 1 each → 0.2 M | — | class days |
| Library member sync (operations) | 52 | 5,000 each → 0.26 M | — | — | weekly |
| Admissions (operations) — 1,500 new students | 1,500 | 10 each | 6 each + bulk provisioning 1,500 | 1,500 auth callables | Jun 40 % · Jul 40 % · Aug 15 % · Sep 5 % |
| Result import (exam cell) | 2 | 5,000 each | 5,000 each | — | Feb, Jun |
| Hall tickets (exam cell) | 2 × 5,000 PDFs | — | — | 10,000 Puppeteer renders | Dec, May |
| Semester roll-over + timetable generation | 2 | — | 5,000 + 2,520 each | — | Aug, Jan |
| No-dues (operations) — 1,667 final-years × 6 sign-offs | 10,000 | 100 K | 10 K | — | May |

### A day in numbers vs the free quota

| Day type | Reads | of which students | staff | events | Writes | Free quota covers |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Teaching day (steady state) | **3,372,459** | 3,060,000 | 301,473 | 10,986 | **44,729** | 1.5 % of reads · 45 % of writes |
| IA / online-test day | **5,544,064** | 4,590,000 | 306,516 | 647,548 | **139,896** | 0.9 % · 14 % |
| Weekend / holiday | 382,700 | 372,000 | 10,700 | 0 | 845 | 13 % · 100 % |
| Challan-burst day (accounts) | teaching day + 5,000 | | | | teaching day + **15,000** | — |

**Students generate 86 % of all reads (569 M of 658 M) and almost all of it is the 500-record attendance query on the dashboard.** Staff — including accounts and operations with their large list pages — are 71 M reads (11 %); tests, assignments and the library are 17 M (3 %).

---

## 4. Month-by-month plan (as coded today)

Day mix = teaching / IA / university-exam / result / office-only / off. Firestore = reads + writes + storage. Files + host = Cloud Storage, downloads, hosting, fixed items (Artifact Registry, Secret Manager, RTDB). AI = Gemini/OpenAI spend distributed by academic activity. Tools = Google Workspace (5 seats) + domain. Team = **5 × ₹30,000 gross = ₹1,50,000 / month**.

| Month | Day mix | Reads | Writes | Peak reads / day | Firestore | Files + host | **Cloud** | AI | Tools | Team | **Month total** | Cumulative |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Aug 2026 | 20/0/0/0/2/9 | 28.6 M | 0.9 M | 1.35 M | ₹1,654 | ₹1,282 | ₹2,936 | ₹4,641 | ₹1,250 | ₹1,50,000 | **₹1,58,827** | ₹1,58,827 |
| Sep 2026 | 22/0/0/0/0/8 | 43.6 M | 1.0 M | 1.91 M | ₹2,533 | ₹1,393 | ₹3,925 | ₹9,282 | ₹1,250 | ₹1,50,000 | **₹1,64,457** | ₹3,23,284 |
| Oct 2026 | 15/6/0/0/0/10 | 64.9 M | 1.5 M | 4.19 M | ₹3,873 | ₹1,346 | ₹5,219 | ₹13,922 | ₹1,250 | ₹1,50,000 | **₹1,70,391** | ₹4,93,675 |
| Nov 2026 | 16/6/0/0/0/8 | 81.5 M | 1.6 M | 5.04 M | ₹4,851 | ₹1,398 | ₹6,248 | ₹16,243 | ₹1,250 | ₹1,50,000 | **₹1,73,741** | ₹6,67,416 |
| Dec 2026 | 10/0/8/0/4/9 | 51.7 M | 0.5 M | 3.37 M | ₹2,986 | ₹820 | ₹3,806 | ₹11,602 | ₹1,250 | ₹1,50,000 | **₹1,66,658** | ₹8,34,074 |
| Jan 2027 | 8/0/9/0/3/11 | 46.7 M | 0.4 M | 3.37 M | ₹2,698 | ₹724 | ₹3,423 | ₹5,801 | ₹1,250 | ₹1,50,000 | **₹1,60,474** | ₹9,94,547 |
| Feb 2027 | 21/0/0/1/0/6 | 75.9 M | 1.0 M | 3.37 M | ₹4,451 | ₹1,413 | ₹5,864 | ₹8,121 | ₹1,250 | ₹1,50,000 | **₹1,65,235** | ₹11,59,783 |
| Mar 2027 | 15/6/0/0/0/10 | 87.7 M | 1.5 M | 5.54 M | ₹5,242 | ₹1,419 | ₹6,662 | ₹13,922 | ₹1,250 | ₹1,50,000 | **₹1,71,834** | ₹13,31,617 |
| Apr 2027 | 16/6/0/0/0/8 | 90.3 M | 1.6 M | 5.54 M | ₹5,414 | ₹1,471 | ₹6,884 | ₹16,243 | ₹1,250 | ₹1,50,000 | **₹1,74,377** | ₹15,05,994 |
| May 2027 | 8/0/10/0/4/9 | 48.1 M | 0.4 M | 3.37 M | ₹2,827 | ₹786 | ₹3,613 | ₹10,442 | ₹1,250 | ₹1,50,000 | **₹1,65,305** | ₹16,71,298 |
| Jun 2027 | 0/0/5/1/16/8 | 22.6 M | 0.1 M | 2.68 M | ₹1,326 | ₹698 | ₹2,024 | ₹3,481 | ₹1,250 | ₹1,50,000 | **₹1,56,755** | ₹18,28,053 |
| Jul 2027 | 0/0/0/0/23/8 | 16.3 M | 0.1 M | 0.57 M | ₹960 | ₹702 | ₹1,663 | ₹2,320 | ₹1,250 | ₹1,50,000 | **₹1,55,233** | **₹19,83,286** |

**Annual totals**

| Line | Usage | Cost / yr |
| --- | --- | ---: |
| Firestore reads | 658 M total · free tier covered 18.25 M (2.8 %) · 640 M billable | ₹36,853 |
| Firestore writes | 10.6 M total · free tier covered 3.9 M (37 %) · 6.7 M billable | ₹1,157 |
| Firestore storage | 7.4 GiB at year end (4.5 M attendance docs + 100 K attempts + library) | ₹768 |
| Cloud Storage | 89 GB stored at year end; 800 GB downloaded (materials, assignments, PDFs) | ₹7,584 |
| Hosting | ~35 GB / month | ₹3,936 |
| Cloud Functions | 2.3 M invocations, ~0.4 M vCPU-s, ~0.6 M GiB-s — all inside the free tier | ₹0 |
| Fixed (Artifact Registry, Secret Manager, RTDB) | | ₹1,958 |
| **Cloud total** | **$544** | **₹52,266 (₹4,356 / month · ₹10 per student)** |
| AI / LLM (question generation, paper parsing, AI grading, study packs, chat, placement prep) | base case, Gemini 2.5 Flash | ₹1,16,020 (₹23 per student) |
| Tools (Google Workspace 5 seats + domain) | | ₹15,000 |
| **Team — 5 members × ₹30,000 gross × 12** | | **₹18,00,000** |
| **All-in cost for the year** | | **₹19,83,286** |

Cash-flow shape: ₹1.55–1.75 L per month, of which cloud is only ₹1,700–6,900 (peaks in Oct–Nov and Mar–Apr, the online-test months). Google bills monthly in arrears to the card on the Blaze billing account.

---

## 5. Break-even and the minimum bid

| Basis | Annual cost | **Per student / yr** (5,000) | **Per user / yr** (5,218 incl. staff) | Per student / month |
| --- | ---: | ---: | ---: | ---: |
| Cash floor — cloud + AI + tools only (team treated as already paid) | ₹1,83,286 | **₹37** | ₹35 | ₹3 |
| **True break-even — including the 5-person team** | **₹19,83,286** | **₹397** | **₹380** | ₹33 |
| Break-even + 12 % contingency (AI overrun, GST on cloud, travel) | ₹22,21,000 | **₹445** | ₹426 | ₹37 |
| 30 % gross margin | ₹28,33,266 | **₹567** | ₹543 | ₹47 |
| 35 % gross margin | ₹30,51,209 | **₹610** | ₹585 | ₹51 |
| 40 % gross margin | ₹33,05,477 | **₹661** | ₹633 | ₹55 |

**The bare-minimum bid that does not make a loss is ₹400 per student per year (₹20 L for 5,000 students).** That figure has zero margin and zero buffer: one bad month of AI usage, the 18 % GST on the cloud bill, or two extra site visits puts you under water. The practical floor is **₹450 per student (₹22.5 L)**, which leaves ~12 % to absorb surprises. To reach the 30–40 % you said you need, the bid has to be **₹570–660 per student (₹28.5–33 L)** while this team is carried by one college alone.

Three ways to bring the required price down without touching the team:

| Lever | Effect on break-even (per student) |
| --- | ---: |
| A second college of similar size sharing the same 5-person team | ₹397 → **≈ ₹217** (team ₹9 L each + own cloud/AI ₹1.8 L) |
| A third college | → **≈ ₹157** |
| The three read fixes in §6 (no headcount change) | ₹397 → ₹378 (cloud ₹52 K → ₹28 K; AI ₹1.16 L → ₹0.46 L) |

Sensitivity to college size with the same team: 3,000 students → break-even ₹654 / student; 8,000 students → ₹252 / student. Cloud stays ≈ ₹10 per student at any size; the team cost is what gets divided.

---

## 6. Three code changes that cut Firestore reads by 63 % (and why they matter more for headroom than for money)

| # | Change | Reads saved / yr | ₹ saved / yr | Why do it anyway |
| --- | --- | ---: | ---: | --- |
| 1 | Student dashboard: replace the 500-record `attendanceRecords` query with a per-student aggregate document (`attendanceSummary` already exists per session — add a per-student roll-up updated inside `saveAttendance`), and wrap `useStudentData` in React Query | **394 M** | ₹22,700 | dashboard loads ~5× faster on mobile; removes the single query that dominates every exam-day spike |
| 2 | Superadmin dashboards: poll every 10 min and only while the tab is focused (`refetchIntervalInBackground: false`) | 18 M | ₹1,050 | your own two users should not be 11 % of the college's read volume |
| 3 | Accounts fee page: paginate `students` / `feePayments` (50 per page + search) instead of three 500-document loads | 4 M | ₹230 | also fixes the functional problem that the page only shows the first 500 of 5,000 students |

Optimised year: **243 M reads (₹12,961), cloud ₹28,374, AI ₹46,000 (with chat/prep/study packs on Gemini Flash-Lite), all-in ₹18,89,374, break-even ₹378 / student.** The rupee saving (~₹1 L / yr, 5 % of cost) is modest because Firestore reads are cheap; the real value is that the peak day drops from 5.5 M to 2.1 M reads, which is the headroom you want before signing a 5,000-student SLA.

---

## 7. What is deliberately not in the ₹19.83 L

- **GST**: 18 % on the Google Cloud bill (≈ ₹9,400 / yr) and on OpenAI/DeepSeek under reverse charge; recoverable as input credit if you are GST-registered. Your invoice to the college also carries 18 % GST on top of the prices above.
- **Team overheads**: laptops, internet, phones, office — budget ₹5–10 K / month if not already covered.
- **Travel / on-site support**: the earlier analysis used ₹30 K / yr for 6 visits; add it if the college is not local.
- **Year-1 onboarding effort** (data migration, training) — done by the same 5 people, so no extra cash, but it consumes ~25 person-days in Aug–Sep.
- **Optional add-ons** the college may ask for: WhatsApp/SMS notifications (₹36–60 K / yr at 300 K messages), phone-OTP login (₹1.2–6 L / yr), Google Cloud Standard support ($29 / month).
- **Razorpay fees** (2 % cards, 0–2 % UPI) — a pass-through borne by the college/students, not by you.
- **Growth of the AI line if `/chat` is left uncapped** — up to ₹3.7 L / yr in a heavy-adoption year; the 20-turns/day/student cap in the companion report bounds it to ~₹1 L.

---

## 8. Recommendation

1. **Quote ₹450 per student per year as your walk-away floor for this college (₹22.5 L + GST)** — not ₹400. Below that you are financing the college with your team's salaries.
2. **Target ₹599–649** (₹30–32.5 L) for the 30–40 % margin you want while one college carries the team; use the ROI table in the companion report to justify it (≈ ₹21–24 L / yr of quantified savings for the college).
3. **Sign a second college within 12 months** — it halves the break-even to ~₹217 / student and lets you hold ₹449 at a 40 %+ margin, which is where the market price sits.
4. Before go-live, ship the three read fixes in §6 and the AI guards from the companion report; they cost two or three developer-days and remove every unbounded cost line.
5. Turn on Google Cloud budget alerts at ₹5,000 / ₹10,000 / ₹25,000 per month. At the modelled usage you should never see the third one.
