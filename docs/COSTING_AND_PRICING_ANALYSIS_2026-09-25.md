# Vriddhi — Costing, Running Cost & Pricing Analysis

**Prepared:** 25 September 2026 · **Scope:** build cost, 1-year running cost for a 5,000-student college, and a pricing proposal with a 30–40 % gross margin.
**Basis:** a read-through of this repository (architecture, Firestore access patterns, AI call sites, function resource configs) plus public list prices as of Sept 2026. Every number below is reproducible with `npm run cost:model` (see §7).

> **Currency:** ₹96 / USD (Sept 2026). All prices exclude 18 % GST. "L" = lakh (₹1,00,000), "Cr" = crore (₹1,00,00,000).

---

## 0. Executive summary

| Question | Answer |
| --- | --- |
| **What would it cost to build a product like Vriddhi?** | **₹30–40 L** with a lean AI-assisted team (how it was evidently built) · **₹75 L – 1.1 Cr** with a traditional in-house team · **₹1.5 – 3 Cr** from an Indian software agency. Defensible *replacement value* to quote: **≈ ₹1 – 1.2 Cr**. |
| **Cloud "server" cost, 5,000 students, 1 year** | **≈ ₹18,000 / yr** point estimate (≈ ₹1,500 / month), budget **₹27,000** with a 1.5× buffer. Stress case ₹56,000. Fully serverless (Firebase + Cloud Functions in Mumbai), no idle servers. |
| **AI tools cost, 5,000 students, 1 year** | **≈ ₹1.16 L / yr** base (₹23 / student), budget **₹2.32 L** with a 2× buffer. Range ₹0.58 L (low) – ₹3.5 L (heavy use). Can be cut ~60 % by moving chat/prep/study-packs to Gemini Flash-Lite (see §6). |
| **Fully-loaded cost to run & support one 5,000-student college** | **₹21.5 L / yr** if one college carries a whole vendor team (₹430 / student) · **₹15.4 L / yr** when the team is shared across 5 colleges (₹309 / student) · **₹12.3 L / yr** across 10 colleges (₹246 / student). Year-1 adds **₹1.7 L** onboarding. |
| **Recommended price** | **Vriddhi Plus @ ₹449 / student / year** → **₹22,45,000 / yr** for 5,000 students **+ ₹2,50,000 one-time onboarding**. That is **₹37 per student per month**. |
| **Margin at that price** | 31 % (team shared by 5 colleges) · 45 % (10 colleges) · 44–55 % if founders run operations lean. A single college cannot carry a fully staffed team at any market-acceptable price — plan for ≥ 3–5 colleges. |
| **Negotiation floor** | ₹399 / student with a 3-year commitment (still ≥ 30 % once 8–10 colleges share the team, or immediately with a lean team). Never below ₹349. |
| **Why a college should pay it** | ≈ ₹21–24 L / yr of conservatively quantified value (faculty hours, printing, fee collection, admin FTEs) against ₹22.45 L; < 1 % of a typical ₹40 K annual fee; sits inside the ₹300–1,200 / student band Indian university ERPs already charge — while bundling AI paper generation, AI grading and online exams that none of them include. |

---

## 1. What was measured (the basis of the estimate)

| Metric | Value | Source |
| --- | --- | --- |
| Frontend code | **158,248 lines** TypeScript/TSX in 484 files, **121 pages**, 7 role modules (student, faculty, admin, office, prep, superadmin, auth) | `src/` |
| Backend code | **57,459 lines** TypeScript in 77 files; **~100 Cloud Functions** (98 `onCall`, 2 `onRequest` incl. an Express API, 2 scheduled) | `functions/src/` |
| Tests, scripts, rules, docs | 11,353 lines of backend tests · 9,018 lines of scripts · 1,796 lines of Firestore/Storage security rules · 5,370 lines of docs | `functions/test`, `scripts`, `*.rules`, `docs` |
| Curated content | 759 curated B.Com/BA/B.Sc questions, 24 BBA subject banks, syllabus JSON, BCU/KUD/NEP scheme presets | `content/`, `data/question-bank/` |
| Runtime | React 18 + Vite SPA (PWA) on Firebase Hosting · Firestore · Cloud Storage · Realtime DB (light) · Cloud Functions v2 (Node 22, region `asia-south1` Mumbai) | `firebase.json`, `functions/src/index.ts` |
| Function sizing | All functions `minInstances: 0` (no idle cost); 62 × 256 MiB, 30 × 512 MiB, 1 × 1 GiB, 1 × 2 GiB (Puppeteer PDF); `maxInstances` 1–80 | grep of `functions/src` |
| AI call sites | 6: question generation, paper parsing, AI grading, study-material packs, student chat, placement prep — on `gemini-2.5-flash` / `gemini-1.5-flash` with `gpt-4o-mini` / `deepseek-chat` fallbacks | `functions/src/routes/ai-*.ts`, `paperParsing.ts`, `studentAssessments.ts`, `routes/prep.ts` |
| Payments | Razorpay order + HMAC verification wired ("flow now, keys later") | `functions/src/payments.ts` |
| Cost-critical access patterns | Attendance = **1 Firestore write per student per period** (`attendanceRecords`) + 3 docs per session · Online test ≈ **150 reads / 22 writes / 12 invocations per attempt** after the autosave optimisation · Notifications are single docs with cohort filters (no per-student fan-out) · Study-material AI has cache + per-student (5/day) + per-college (400/day) caps · `/chat` has **no per-student daily cap** | `facultyApi.ts`, `docs/HANDOFF_exam_autosave_cost.md`, `notifications.ts`, `routes/ai-chat.ts` |

---

## 2. Part A — What it costs to build a product like this

### 2.1 Bottom-up effort by module

Effort is estimated per module from what exists in the repo. "Lean" assumes an experienced 3–4 person team using AI-assisted development (the repo's history shows this is how it was built). "Traditional" assumes a conventional team without AI tooling (≈ 2.3× effort). Cross-check against code volume: lean ≈ 9,000 LOC per person-month, traditional ≈ 3,500 LOC per person-month (≈ 160–190 LOC/day) — both within normal ranges for React/TypeScript products.

| # | Module (evidence in repo) | Lean person-weeks | Traditional person-weeks |
| --- | --- | ---: | ---: |
| 1 | Auth, RBAC (7 roles), multi-tenant claims, bulk provisioning, 1,800 lines of security rules + rules tests | 6 | 14 |
| 2 | Student portal — dashboard, attendance, timetable, tests, results, fees, materials, assignments, PWA | 10 | 24 |
| 3 | Faculty portal — attendance marking, schedule/rescheduling, question bank, paper authoring & review, assignments, grading queue, mentoring | 10 | 24 |
| 4 | College admin & office — analytics/View 360, curriculum + auto-mapping, timetable + auto-generator + bulk import, scheme packs, fees + challans + Razorpay, admissions, guest-faculty billing, staff attendance, notifications | 18 | 44 |
| 5 | Superadmin — colleges, universities, imports, subscription billing, health monitor, question-bank seeding, access control | 6 | 14 |
| 6 | Assessment engine — scheduling, secure test flow, delta autosave, proctor events, auto-submit, grading, result import, grade records/transcripts (`studentAssessments.ts` alone is 2,700+ lines) | 10 | 24 |
| 7 | AI layer — multi-provider, question generation, paper parsing, AI grading, study packs with cost guards, chat, placement prep, 6 languages | 8 | 18 |
| 8 | PDF & document pipeline — Puppeteer renderer with client fallback, DOCX/PDF parsing, CSV/XLSX import/export | 4 | 9 |
| 9 | Domain content — curated question banks, syllabus JSON, BCU/KUD/NEP scheme presets (subject-matter-expert work) | 5 | 8 |
| 10 | Quality — 11K lines of tests, rules tests, CI, security/feature audits, 5K lines of docs | 6 | 14 |
| 11 | Brand system, design system, UI/UX, i18n | 3 | 7 |
| | **Subtotal** | **86** | **200** |
| | PM / QA / rework (+20 %) | 17 | 40 |
| | **Total** | **≈ 103 person-weeks ≈ 24 person-months** | **≈ 240 person-weeks ≈ 55–70 person-months** |

### 2.2 Cost under three delivery models

Rate cards (India, 2026, fully loaded): mid-level full-stack ₹9–15 LPA, senior ₹16–30 LPA, blended loaded team cost ≈ ₹1.1–1.2 L per person-month; agency billing $25–40 / h (₹2,400–3,800 / h) for mid-level, $40–80 / h for senior.

| Delivery model | Effort | People cost | Other | **Total** | Timeline |
| --- | --- | --- | --- | --- | --- |
| **A. Lean in-house, AI-assisted** (3–4 devs + part-time SME/designer) | 24 pm × ₹1.1 L | ₹26 L | AI dev tools ₹3 L · design ₹2 L · dev infra ₹0.5 L · SME ₹2 L | **₹30–40 L** | 6–8 months |
| **B. Traditional in-house team** (6 people) | 62 pm × ₹1.2 L | ₹74 L | design ₹3 L · infra ₹1 L · recruiting/overheads 10 % | **₹75 L – 1.1 Cr** | 10–14 months |
| **C. Indian software agency, fixed bid** | ~9,900 h × ₹2,400–3,800 | ₹2.4–3.8 Cr list | typically negotiated to ₹1.5–2.5 Cr; +18 % AMC / yr | **₹1.5 – 3 Cr** | 12–18 months |

Market reference: a custom-built university ERP in India is typically quoted at **₹25–90 L one-time**, with implementation and migration adding 20–40 % in year one [[optatech]](https://www.optatechinnovation.com/blog/university-erp-software-cost-india). Vriddhi's scope (full ERP **plus** an online assessment engine, multi-provider AI and 6-language support) sits above the top of that range, which is why **₹1–1.2 Cr is the defensible replacement value** to quote to investors or a college that asks "why not build it ourselves?".

---

## 3. Part B — Cost to run for 5,000 students for one year

### 3.1 Usage model

| Driver | Assumption | Derived annual volume |
| --- | --- | --- |
| People | 5,000 students · 200 faculty (1:25) · 25 admin/office staff · 84 sections of ~60 | 5,225 accounts |
| Calendar | 180 teaching days, 185 non-teaching, 250 staff working days | — |
| Student activity | 60 % daily active on teaching days, 15 % otherwise; 80 Firestore reads + 3 writes + 2 callables per active day | 43 M reads from the student portal |
| Faculty activity | 85 % / 50 % daily active; 150 reads + 20 writes + 5 callables per day (excl. attendance) | 6.4 M reads |
| Attendance | 84 sections × 5 periods × 180 days; 1 write per student per period + 3 docs per session | **75,600 sessions · 4.5 M attendance docs · 4.8 M writes** |
| Online tests | 20 tests per student per year; 150 reads / 22 writes / 12 invocations per attempt (post-optimisation) + 10 faculty review reads | **100,000 attempts · 16 M reads · 1.2 M invocations** |
| Assignments | 8 per student per year, 1.5 MB each | 40,000 submissions · 59 GB |
| Materials | 20 files × 5 MB per faculty; each student downloads 30 files | 20 GB stored · 732 GB downloaded |
| Fees & PDFs | 4 installments; 4 challans + 2 hall tickets per student rendered by Puppeteer (5 s @ 2 GiB) | 30,000 PDF renders |
| Hosting | 3 MB bundle, 2 deploys / month, 50 KB daily delta per active user | 35 GB / month |

**Totals:** ≈ 93 M Firestore reads, 11.5 M writes, 6.5 GiB Firestore data at year end, 83 GB files, 3.1 M function invocations, 354 K vCPU-seconds, 605 K GiB-seconds.

### 3.2 Server / cloud infrastructure (Firebase + Google Cloud, Mumbai)

Unit prices: Firestore $0.06 / 100 K reads, $0.18 / 100 K writes, $0.18 / GiB-month, free 50 K reads & 20 K writes per day [[budgetforge]](https://www.budgetforge.dev/tools/firebase-pricing-2026); Cloud Functions v2 $0.40 / M invocations, $0.000024 / vCPU-s, $0.0000025 / GiB-s with 2 M invocations, 180 K vCPU-s and 360 K GiB-s free per month [[cloudzero]](https://www.cloudzero.com/blog/google-cloud-functions/); Storage $0.026 / GB-month, $0.12 / GB download; Hosting $0.15 / GB.

| Line item | Annual usage | USD / yr | ₹ / yr |
| --- | --- | ---: | ---: |
| Firestore document reads | 92.7 M (74.4 M billable) | $45 | ₹4,287 |
| Firestore document writes | 11.5 M (4.2 M billable) | $7.6 | ₹727 |
| Firestore storage | avg 3.9 GiB | $6.3 | ₹601 |
| Firestore network egress | ~88 GB (under free quota) | $0 | ₹0 |
| Cloud Storage — stored files | avg 50 GB | $14 | ₹1,351 |
| Cloud Storage — downloads | 802 GB | $53 | ₹5,089 |
| Cloud Storage — operations | under free quota | $0 | ₹0 |
| Firebase Hosting transfer | 35 GB / month | $44 | ₹4,214 |
| Cloud Functions — invocations | 3.1 M / yr vs 24 M free | $0 | ₹0 |
| Cloud Functions — vCPU + memory | 354 K vCPU-s, 605 K GiB-s vs 2.2 M / 4.3 M free | $0 | ₹0 |
| Artifact Registry (function images) | ~2.5 GB | $3 | ₹288 |
| Cloud Logging | ~6 GB / month vs 50 GB free | $0 | ₹0 |
| Secret Manager (6 secrets) | — | $4.3 | ₹415 |
| Cloud Scheduler (2 jobs, 3 free) | — | $0 | ₹0 |
| Realtime Database (light) | — | $12 | ₹1,152 |
| Firebase Auth (email/password) | 5,225 users | $0 | ₹0 |
| **Total cloud — point estimate** | | **$189** | **₹18,123 / yr (≈ ₹1,510 / month)** |
| **Budget with 1.5× safety buffer** | | | **₹27,185 / yr** |

| Usage scenario | Reads | Writes | Invocations | Cloud cost / yr |
| --- | ---: | ---: | ---: | ---: |
| Low (0.5×) | 46 M | 5.8 M | 1.5 M | $97 · **₹9,359** |
| **Base (1×)** | 93 M | 11.5 M | 3.1 M | $189 · **₹18,123** |
| High (3×) | 278 M | 34.5 M | 9.2 M | $583 · **₹55,922** |

**Why so low?** The architecture is fully serverless: nothing runs when nobody is using it (`minInstances: 0` everywhere), the free tiers absorb all Cloud Functions compute at this scale, and the assessment engine was already optimised from ~2.7 M reads per 200-student exam to ~30 K. For comparison, a conventional VM + managed-database deployment for the same load (2 app VMs + Cloud SQL/Postgres + load balancer + backups) would be roughly **₹5–7 L / yr** and would need someone to patch and scale it.

**Exam-day peaks** are not a cost problem: 1,000 students starting a test simultaneously ≈ 150 K reads + 22 K writes + 12 K invocations ≈ ₹15, and Cloud Functions scale out automatically (`maxInstances` 30–80 per assessment function).

### 3.3 AI tools costing

Model prices (per 1 M tokens): Gemini 2.5 Flash **$0.30 in / $2.50 out** [[aicostcheck]](https://aicostcheck.com/blog/google-gemini-pricing-guide-2026); Gemini 2.5 Flash-Lite $0.10 / $0.40; GPT-4o-mini $0.15 / $0.60 [[pricepertoken]](https://pricepertoken.com/pricing-page/model/openai-gpt-4o-mini); DeepSeek-Chat V3.2 $0.28 / $0.42 [[nxcode]](https://www.nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026). The model below prices everything on Gemini 2.5 Flash (the default in code).

**Unit economics per feature (from the actual call sites):**

| Feature (file) | Model | Tokens in / out per call | ₹ per call | Cost guard in code |
| --- | --- | --- | ---: | --- |
| AI question generation (`routes/ai-questions.ts`) | gemini-2.5-flash | 2,500 / 4,000 | ₹1.03 | `TIER_CONFIG` 100 / 500 / 1,000 questions per day |
| AI paper parsing, Gemini fallback (`paperParsing.ts`) | gemini-2.5-flash | 10,000 / 5,000 | ₹1.49 | deterministic layout parser runs first |
| AI grading suggestions (`studentAssessments.ts`) | gemini-2.5-flash | 8,000 / 2,000 | ₹0.71 | cached per attempt, ≤ 50 questions |
| AI study-material packs (`routes/ai-chat.ts /study-material`) | gemini-2.5-flash | 3,000 / 5,000 | ₹1.29 | shared cache, 5 / day / student, 400 / day / college, exam-freeze windows |
| AI study assistant chat (`routes/ai-chat.ts /chat`) | gemini-1.5-flash → must move | 3,000 / 500 | ₹0.21 | **none per student** (30 req / min per IP only) |
| Placement prep (`routes/prep.ts`) | gemini-1.5-flash → must move | 2,000 / 3,000 | ₹0.78 | rate limiter only |

**Annual volume and cost, 5,000 students:**

| Feature | Base volume / yr | Base ₹ / yr | Low (0.5×) | High (3×) |
| --- | ---: | ---: | ---: | ---: |
| Question generation — 200 faculty × 30 | 6,000 | ₹6,192 | ₹3,096 | ₹18,576 |
| Paper parsing — 40 % of 1,200 papers | 480 | ₹714 | ₹357 | ₹2,142 |
| AI grading — 30 % of 100 K attempts | 30,000 | ₹21,312 | ₹10,656 | ₹63,936 |
| Study packs — 60 / day × 200 days | 12,000 | ₹15,437 | ₹7,718 | ₹46,311 |
| Chat — 30 % of students × 150 turns | 225,000 | ₹46,440 | ₹23,220 | ₹1,39,320 |
| Placement prep — 1,667 final-years × 20 | 33,340 | ₹25,925 | ₹12,962 | ₹77,775 |
| **Total AI** | | **₹1,16,020 ($1,209)** | **₹58,010** | **₹3,48,061** |
| **Budget with 2× buffer** | | **₹2,32,040** | | |

Per student: **₹23 / yr base, ₹46 budgeted, ₹70 in the heavy case.**

**Two things that change this materially:**

1. **Move chat, prep and study packs to Gemini 2.5 Flash-Lite** (they are conversational / generative, not precision tasks). Per-call cost drops from ₹0.21 → ₹0.05 (chat), ₹0.78 → ₹0.13 (prep), ₹1.29 → ₹0.22 (study). Base AI total falls from ₹1.16 L → **≈ ₹0.46 L / yr (-60 %)**. This migration is mandatory anyway — see §6.
2. **The `/chat` route is the only unbounded line.** With no per-student cap, a heavy-adoption year (60 % of students × 600 turns) costs ₹3.7 L on Flash, and a single scripted account could burn ~₹9,000 / day at the 30-per-minute IP limit. A 20-turns / day / student cap plus the same per-college circuit breaker the study-material route already has bounds the worst case at roughly ₹1 L / yr.

### 3.4 Third-party tools, add-ons and pass-through costs

| Item | Cost | Notes |
| --- | --- | --- |
| Domain + DNS | ₹1,500 / yr | |
| Error monitoring (Sentry Team) | ₹25,000 / yr | shared across colleges |
| Google Workspace + transactional email | ₹20,000 / yr | Firebase Auth emails are free; this is for support mailbox and notifications |
| GitHub Team + CI minutes | ₹15,000 / yr | shared |
| AI coding tools for the dev team | ₹60,000 / yr | shared; the largest tooling line |
| Firestore backups / PITR + exports | ₹6,000 / yr | |
| Google Cloud Standard support (optional) | ₹28,000 / yr | $29 / month minimum; recommended once ≥ 3 colleges are live |
| **Shared tooling total** | **₹1,55,500 / yr** | divided by the number of colleges served |
| **Razorpay fees** — *pass-through, not a vendor cost* | 2 % on cards; UPI 0–2 % depending on plan [[productgrowth]](https://productgrowth.in/tools/payments/razorpay/) | On ₹20 Cr of annual fees this is up to ₹40 L, borne by the college/students as a convenience fee. Push UPI (0 % MDR) and negotiate — at ₹20 Cr volume the college can get sub-1 % rates. |
| WhatsApp / SMS notifications — *not built yet, optional add-on* | ≈ ₹0.12–0.20 / message → 300 K msgs / yr ≈ ₹36–60 K | Colleges expect it; sell as an add-on at ₹0.30 / msg or ₹1 L / yr bundle |
| Phone-OTP login — *optional add-on* | ≈ ₹1–5 per OTP → ₹1.2–6 L / yr for 5,000 users | Current email/password + PWA persistent login costs ₹0; charge OTP at cost + 20 % if demanded |

### 3.5 People — the real cost

Fully-loaded annual rates used: mid-level developer ₹12 L, senior developer ₹20 L, support / implementation executive ₹3.6 L, customer-success lead ₹6 L, product manager ₹12 L, subject-matter expert ₹3 L (market: mid-level ₹9–15 LPA, senior ₹16–30 LPA [[brollyacademy]](https://brollyacademy.com/full-stack-developer-salary/)).

| Team shared by … colleges | Standard vendor team (FTE) | Cost / yr | **Allocated per college** | Lean founder-led team (FTE) | Cost / yr | **Allocated per college** |
| --- | --- | ---: | ---: | --- | ---: | ---: |
| 1 | 1 dev · 0.5 support · 0.2 PM · 0.25 SME | ₹16.95 L | **₹16.95 L** | 0.5 dev · 0.5 support · 0.1 SME | ₹8.1 L | **₹8.1 L** |
| 3 | 1 dev · 0.5 senior · 2 support · 0.5 PM · 0.5 SME | ₹36.7 L | **₹12.2 L** | 1 dev · 1 support · 0.25 PM · 0.25 SME | ₹19.4 L | **₹6.5 L** |
| 5 | 2 dev · 0.5 senior · 2 support · 1 CS lead · 1 PM · 0.5 SME | ₹60.7 L | **₹12.1 L** | 1 dev · 0.5 senior · 1.5 support · 0.5 PM · 0.25 SME | ₹34.2 L | **₹6.8 L** |
| 10 | 3 dev · 1 senior · 4 support · 1 CS lead · 1 PM · 1 SME | ₹91.4 L | **₹9.1 L** | 2 dev · 0.5 senior · 3 support · 1 CS lead · 0.5 PM · 0.5 SME | ₹57.3 L | **₹5.7 L** |

Why a developer is unavoidable even for one college: Node runtimes and Firebase SDKs must be upgraded yearly, Google retires Gemini models every 6–12 months (§6), university scheme rules change every academic year, and 5,000 users will find bugs. The "lean" column assumes founders do the PM and senior-dev work unpaid — realistic for the first 3–5 customers, not a steady state.

### 3.6 One-time onboarding (year 1, per college)

| Activity | Cost |
| --- | ---: |
| Data migration & bulk imports — students, faculty, timetables, curriculum (10 person-days) | ₹40,000 |
| Scheme pack, timetable, fee-structure configuration (5 days) | ₹20,000 |
| Faculty & office training — 6 sessions (10 days) | ₹40,000 |
| Travel & on-site hand-holding, weeks 1–4 | ₹40,000 |
| Project management / go-live buffer | ₹30,000 |
| **Total onboarding cost** | **₹1,70,000** |

### 3.7 Total cost summary — one 5,000-student college

| | Standard team, 1 college | Standard, shared by 5 | Standard, shared by 10 | Lean, shared by 5 |
| --- | ---: | ---: | ---: | ---: |
| Cloud infrastructure (×1.5 buffer) | ₹27,185 | ₹27,185 | ₹27,185 | ₹27,185 |
| AI / LLM (×2 buffer) | ₹2,32,040 | ₹2,32,040 | ₹2,32,040 | ₹2,32,040 |
| Site visits, travel, training material | ₹40,000 | ₹40,000 | ₹40,000 | ₹40,000 |
| Shared tooling (allocated) | ₹1,55,500 | ₹31,100 | ₹15,550 | ₹31,100 |
| People (allocated) | ₹16,95,000 | ₹12,14,000 | ₹9,14,000 | ₹6,83,000 |
| **Recurring cost / yr** | **₹21,49,725** | **₹15,44,325** | **₹12,28,775** | **₹10,13,325** |
| **Per student / yr** | **₹430** | **₹309** | **₹246** | **₹203** |
| Year-1 incl. onboarding | ₹23,19,725 | ₹17,14,325 | ₹13,98,775 | ₹11,83,325 |

**Only ~12 % of the recurring cost is cloud + AI.** The price you charge is fundamentally a price for a team that keeps the platform running, compliant and supported — that is also the strongest honest justification (see §5).

---

## 4. Part C — Pricing proposal

### 4.1 Margin arithmetic (avoid the classic mistake)

"30–40 % margin" is taken as **gross margin on price**: `price = cost ÷ (1 − margin)`. A 40 % margin is a 66.7 % markup on cost; a 40 % *markup* would give only 28.6 % margin. All figures below use margin on price.

### 4.2 What price hits the target, by scale

| Team / colleges | Cost per student | Price @ 30 % | Price @ 35 % | Price @ 40 % |
| --- | ---: | ---: | ---: | ---: |
| Standard · 1 | ₹430 | ₹614 | ₹661 | ₹717 |
| Standard · 3 | ₹315 | ₹450 | ₹484 | ₹525 |
| Standard · 5 | ₹309 | ₹441 | ₹475 | ₹515 |
| Standard · 10 | ₹246 | ₹351 | ₹378 | ₹410 |
| Lean · 1 | ₹253 | ₹361 | ₹389 | ₹422 |
| Lean · 5 | ₹203 | ₹290 | ₹312 | ₹338 |
| Lean · 10 | ₹180 | ₹257 | ₹277 | ₹299 |

### 4.3 Recommended price book (per student per year, billed annually, ex-GST)

| | **Core** | **Plus** ← recommended | **Enterprise** |
| --- | --- | --- | --- |
| **Price (2,500–4,999 seats)** | ₹399 | ₹499 | ₹649 |
| **Price (5,000–9,999 seats)** | **₹349** | **₹449** | **₹599** |
| Price (10,000+ seats) | ₹299 | ₹399 | ₹549 |
| Minimum annual contract | ₹5 L | ₹8 L | ₹15 L |
| One-time onboarding | ₹1.5 L | ₹2.5 L | ₹4 L |
| **Annual for 5,000 students** | **₹17,45,000** | **₹22,45,000** | **₹29,95,000** |
| Student & faculty portals, attendance, timetable, curriculum, notifications, PWA | ✓ | ✓ | ✓ |
| Fees, challans, Razorpay online payments, defaulter tracking | ✓ | ✓ | ✓ |
| Online assessments (secure test flow, auto-submit, MCQ auto-grading) | up to 12 tests / student / yr | unlimited | unlimited |
| AI question & paper generation | 100 questions / day | 500 / day | 1,000 / day |
| AI grading suggestions for descriptive answers | — | ✓ | ✓ |
| AI study assistant + study packs (fair use 20 turns / student / day) | — | ✓ | ✓ |
| Placement-prep module | — | ✓ | ✓ |
| Auto timetable, auto curriculum mapping, guest-faculty billing, scheme packs (BCU / KUD / NEP) | — | ✓ | ✓ + custom packs |
| 6 languages (EN, HI, KN, TA, TE, ML) incl. AI generation | ✓ | ✓ | ✓ |
| Multi-campus, SSO, data exports / API, custom reports, NAAC data pack | — | — | ✓ |
| Support | email, business hours | dedicated success manager, 4 site visits / yr, exam-day on-call | 12 site visits, 99.5 % SLA in exam windows, priority roadmap |

Add-ons: WhatsApp/SMS notifications ₹1 L / yr (300 K messages) · phone-OTP login at cost + 20 % · extra AI credits ₹50,000 per 25,000 generations · future modules (parent portal, hostel, transport, library) ₹50–100 / student / yr each.

Commercial terms: annual payment in advance (or 50 / 50 per semester); seats counted at a census date (e.g., 31 Aug) with 10 % headroom; 3-year price lock, then ≤ 8 % annual escalation; fair-use policy for AI features; full data export on exit.

### 4.4 The proposal for the 5,000-student college

| | Year 1 | Year 2 | Year 3 | 3-year TCO |
| --- | ---: | ---: | ---: | ---: |
| Vriddhi Plus @ ₹449 × 5,000 | ₹22,45,000 | ₹22,45,000 | ₹22,45,000 | ₹67,35,000 |
| Onboarding (one-time) | ₹2,50,000 | — | — | ₹2,50,000 |
| **Total (ex-GST)** | **₹24,95,000** | **₹22,45,000** | **₹22,45,000** | **₹69,85,000** |
| Per student per month | ₹42 | ₹37 | ₹37 | |

### 4.5 Margin check at the recommended and floor prices

| Price / student | Std · 1 college | Std · 5 | Std · 10 | Lean · 1 | Lean · 5 | Lean · 10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ₹349 (Core) | −23 % | 12 % | 30 % | 28 % | 42 % | 49 % |
| ₹399 (floor for Plus) | −8 % | 23 % | 38 % | 37 % | 49 % | 55 % |
| **₹449 (Plus list)** | 4 % | **31 %** | **45 %** | **44 %** | **55 %** | **60 %** |
| ₹599 (Enterprise) | 28 % | 48 % | 59 % | 58 % | 66 % | 70 % |

Reading the table honestly:

- **₹449 delivers the 30–40 % target as soon as the team is shared by ~5 colleges, or immediately with a lean team.** With one college and a fully staffed team the margin is ~4 % — that is a statement about needing more customers, not about the price.
- **₹399 is the negotiation floor** (3-year commitment, or anchor-customer discount). It dips to 23 % during the 5-college phase with a standard team — accept it only for a strategic first reference customer.
- **Core at ₹349** is deliberately a lower-support, lower-AI product (AI budget roughly ₹1.5 L less); it reaches 30 % at 10 colleges. Use it to avoid losing price-sensitive aided colleges, not as the lead offer.
- **Do not go below ₹349** for 5,000 seats; at ₹299 even a lean 5-college operation is under 30 %.

Vendor-level view at ₹449: 5 colleges → revenue ₹1.12 Cr, cost ₹77 L, gross profit ₹35 L (31 %); 10 colleges → revenue ₹2.25 Cr, cost ₹1.23 Cr, gross profit ₹1.02 Cr (45 %).

---

## 5. Part D — How to justify the price to the college

### 5.1 Return on investment (conservative, 5,000 students / 200 faculty)

| Value driver | Calculation | Annual value |
| --- | --- | ---: |
| Faculty time — paper setting with AI + question bank | 200 faculty × 6 papers × 3 h saved = 3,600 h | |
| Faculty time — AI grading suggestions for descriptive answers | 30,000 attempts × 5 min = 2,500 h | |
| Faculty time — digital attendance vs registers + monthly consolidation | 75,600 sessions × 3 min = 3,780 h | |
| Faculty/HOD time — auto timetable & curriculum mapping | ≈ 200 h | |
| **Subtotal faculty hours** | **≈ 10,000 h × ₹400 / h (₹6 LPA ÷ 1,500 h) = ₹40 L gross; count only 25 % as realised** | **₹10 L** |
| Printing & logistics — internal tests moved online | 5,000 × 20 tests × 6 pages × ₹1 = ₹6 L; 50 % moved online | ₹3 L |
| Fee collection — online challans, Razorpay, defaulter lists, late-fee automation | on ₹20 Cr of fees, 1 % faster / better collection = ₹20 L cash-flow; value conservatively | ₹2–5 L |
| Office staff — bulk imports, result import, hall tickets, challan generation | ≈ 2 FTE-equivalents freed at ₹3 L | ₹6 L |
| Compliance & risk — attendance-slab eligibility, scheme-pack compliance dashboards, NAAC-ready evidence, DPDP-friendly data residency (Mumbai) | not quantified | — |
| **Total quantified value** | | **≈ ₹21–24 L / yr** |

Against ₹22.45 L / yr this is **payback within the first year on conservative assumptions and 2–3× return if faculty-time savings are realised at 50 %+**. Put the ROI table in the proposal with the college's own numbers (fee income, faculty count, tests per semester) — it is far more persuasive than a feature list.

### 5.2 Per-student framing

₹449 / yr = **₹37 / month per student**, about **1 % of a typical ₹40,000 annual fee**. Many colleges already collect a ₹500–1,500 "technology / digital campus fee"; Vriddhi can be fully funded from it with margin left for the college. The proposal should show the cost per student per month, never just the annual total.

### 5.3 Competitive benchmark

| Vendor / reference | Published price | Notes |
| --- | --- | --- |
| Licensed university ERPs (India) | **₹300–1,200 / student / yr** → ₹15–60 L / yr for 5,000 students; implementation ₹2–15 L extra [[optatech]](https://www.optatechinnovation.com/blog/university-erp-software-cost-india) | Vriddhi Plus at ₹449 is in the lower-middle of this band |
| "Medium college 1,000–5,000 students" SaaS band | ₹5–12 L / yr; "large 5,000+" ₹12–30 L / yr [[codingclave]](https://codingclave.com/blog/college-erp-software-india) | ₹22.45 L sits inside the large-institution band |
| MasterSoft | from ₹5 L (implementation + licence); dated UI, weak mobile [[codingclave]](https://codingclave.com/blog/college-erp-software-india) | no AI, no online assessment engine |
| Linways | from ₹3 L / yr; OBE-focused, weaker non-academic modules [[codingclave]](https://codingclave.com/blog/college-erp-software-india) | |
| EduSec / MyLeadingCampus / Kalvisalai | ₹300 · ₹180 · ₹120–180 per student / yr [[myleadingcampus]](https://www.myleadingcampus.com/blogview/top-5-college-management-erp-systems-in-india-what-makes-them-the-best-in-2025/), [[softwareadvice]](https://www.softwareadvice.com/product/531667-Kalvisalai-college-erp/) | classic ERPs, no AI, no secure online exams |
| Codingclave | ₹50 / student / yr (₹10 K / month base) [[codingclave]](https://codingclave.com/blog/college-erp-software-india) | bare-bones; sets the floor of the market |
| Fedena | $999–1,699 / yr school tiers, enterprise on quote [[techjockey]](https://www.techjockey.com/blog/erp-software-for-school) | school-oriented |
| Camu | listed "from ₹25 / yr" on review sites [[capterra]](https://www.capterra.com/p/165862/CAMU/) | listing teaser; enterprise deals are quoted |
| Standalone AI paper generators (Testmate etc.) | ~₹500 per 20 papers | point tools with no campus data — Vriddhi bundles this |

**Positioning line:** *"Priced like a mid-market college ERP, but it is the only one that also ships an online examination engine, AI paper generation, AI-assisted grading and a student AI tutor in six Indian languages — with the data in Mumbai and no servers for the college to run."*

### 5.4 Total cost of ownership vs the alternatives

| | Vriddhi Plus | Typical on-prem / licence ERP | Build in-house |
| --- | --- | --- | --- |
| Year-1 cash | ₹24.95 L | ₹8–20 L licence + ₹1–5 L implementation + ₹2–5 L hardware | ₹75 L – 1.1 Cr (§2) |
| Years 2–3 | ₹22.45 L / yr | AMC ₹1–3 L + hardware refresh + IT staff ₹4–8 L | ₹15–20 L / yr team |
| Servers, patching, backups, scaling for exam day | included (Google-managed, Mumbai) | college IT | college IT |
| AI paper generation / grading / tutor | included | not offered or add-on | must build |
| Online secure assessments | included | usually a separate product | must build |
| Data export / exit | contractual | often locked | n/a |

### 5.5 Risk reversal that makes "yes" easy

- One-semester pilot on a department (≤ 1,000 students) at the per-student rate, credited against year 1.
- 99.5 % availability SLA during published exam windows, with service credits.
- Data residency in India, role-based access with 1,800 lines of tested security rules, full export on exit.
- Deterministic (no-AI) fallbacks for paper parsing and PDF rendering — the platform keeps working if an AI provider is down.

---

## 6. Cost & operational risks found in the code (action items)

| # | Finding | Impact | Fix |
| --- | --- | --- | --- |
| 1 | `gemini-1.5-flash` is still called in `functions/src/routes/ai-chat.ts` (L463, L1383) and `functions/src/routes/prep.ts` (L149). Google shut down `gemini-1.5-flash` on **29 Sept 2025** [[Gemini changelog]](https://ai.google.dev/gemini-api/docs/changelog). | Student chat, study packs and placement prep fail on Gemini today and only work if a DeepSeek/OpenAI key is configured. | Switch these three to `gemini-2.5-flash-lite` — fixes the outage **and** cuts their cost ~5× (§3.3). |
| 2 | `gemini-2.5-flash` (question generation, paper parsing, AI grading) is listed with an earliest shutdown of **16 Oct 2026** — three weeks away [[aiweekly]](https://aiweekly.co/alerts/google-retires-gemini-20-flash-001-replace-with-25-flash). Successor pricing has been reported at $0.75 / $3.75 per M tokens (≈ 2.5× 2.5 Flash) [[creditforstartups]](https://creditforstartups.com/pricing/gemini-api-pricing). | Second forced migration; AI budget may rise ~2× for precision tasks. | Centralise model IDs in `functions/src/config/aiProviders.ts` behind env vars (`GEMINI_MODEL_FAST`, `GEMINI_MODEL_LITE`) so a model change is a config change, not a deploy. Keep the 2× AI buffer in pricing. |
| 3 | `/chat` has no per-student daily cap (only the 30 / min IP limiter in `middleware/rateLimit.ts`). | The single unbounded AI line: ₹3.7 L / yr under heavy adoption, ~₹9 K / day from one scripted account. | Reuse the study-material guard: 20 turns / day / student + per-college daily circuit breaker + exam-freeze windows; expose usage in the superadmin cost view. |
| 4 | `providerCosts` in `aiProviders.ts` records `gemini: 0`. | Any UI or report derived from it under-states real spend. | Update to per-1M-token prices and compute from the token counts already logged in `ai_usage/*`. |
| 5 | No GCP budget alerts are mentioned anywhere in the repo. | A runaway loop or abuse would only show up on the monthly invoice. | Set billing alerts at ₹5 K / ₹15 K / ₹50 K per month; review `maxInstances` on AI routes. |
| 6 | `attendanceRecords` grows by ~4.5 M documents per 5,000-student year. | Storage cost is trivial (₹600 / yr) but exports, backups and unbounded queries slow down over multi-year deployments. | Add an archival policy (aggregate + move records older than two academic years to Cloud Storage / BigQuery). |
| 7 | AI usage telemetry exists (`ai_usage/{date}` with per-college token counts) but there is no per-college monthly cost report. | Needed to enforce the fair-use clause in contracts and to bill AI add-on credits. | Small scheduled function → monthly `ai_cost_reports/{collegeId}` doc + CSV. |

Items 1–3 are one-to-two-day changes and should be done before the first paid deployment.

---

## 7. Assumptions, sensitivity and how to re-run

**Run the model:**

```bash
npm run cost:model                                   # 5,000 students, base usage, standard team, 1 college
npm run cost:model -- --students 3000                # a different college size
npm run cost:model -- --colleges 5 --team lean       # team cost shared by 5 colleges, founder-led ops
npm run cost:model -- --scenario high                # 3× usage stress test (low | base | high)
npm run cost:model -- --price 449 --colleges 5       # gross margin at a given per-student price
npm run cost:model -- --json                         # machine-readable output for spreadsheets
```

Every driver is a named constant at the top of `scripts/cost-model.mjs` (student DAU, reads per session, tests per year, tokens per AI call, salaries, buffers). The script is an estimate built from the code's access patterns and public list prices — **not** a billing measurement; validate against the Firebase console after the first month of real usage.

**What moves the number most (in order):**

1. **Team size and how many colleges share it** — ~80 % of recurring cost. Going from 1 to 5 customers cuts cost per student from ₹430 to ₹309.
2. **AI chat adoption** — ±₹3 L / yr between low and heavy use; capped by the fixes in §6.
3. **Gemini price changes** — successor models may be 2.5× dearer for precision tasks; the 2× AI buffer covers one such step.
4. **Tests per student per year** (20 assumed) — each extra 10 tests add ≈ ₹1,000 of cloud and ≈ ₹10,000 of AI-grading cost. Negligible.
5. **Exchange rate** — a 10 % INR depreciation adds < ₹15,000 / yr across cloud + AI. Negligible.

**Deliberately excluded:** vendor sales & marketing cost, office rent, corporate taxes, and roadmap R&D beyond maintenance (OBE/CO-PO, NAAC reports, parent portal, hostel/transport — see `docs/product-analysis.md`). If you want the price to fund roadmap development, add ₹15–25 L / yr of R&D to the shared pool, which raises the 5-college cost per student by ₹60–100.

---

## 8. Sources

- Firebase / Firestore list prices and free quotas (2026): [budgetforge.dev](https://www.budgetforge.dev/tools/firebase-pricing-2026), [getpricepulse.com](https://www.getpricepulse.com/companies/firebase-pricing.html), [mobile-squad.com estimator](https://mobile-squad.com/apps/firepulse/firestore-cost-estimator/)
- Cloud Run functions (2nd gen) pricing and free tier: [cloudzero.com](https://www.cloudzero.com/blog/google-cloud-functions/), [modal.com](https://modal.com/blog/google-cloud-function-pricing-guide)
- Gemini pricing and deprecations: [aicostcheck.com](https://aicostcheck.com/blog/google-gemini-pricing-guide-2026), [creditforstartups.com](https://creditforstartups.com/pricing/gemini-api-pricing), [Gemini API release notes](https://ai.google.dev/gemini-api/docs/changelog), [aiweekly.co](https://aiweekly.co/alerts/google-retires-gemini-20-flash-001-replace-with-25-flash)
- GPT-4o-mini and DeepSeek pricing: [pricepertoken.com](https://pricepertoken.com/pricing-page/model/openai-gpt-4o-mini), [nxcode.io](https://www.nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)
- Indian college ERP pricing: [optatechinnovation.com](https://www.optatechinnovation.com/blog/university-erp-software-cost-india), [codingclave.com](https://codingclave.com/blog/college-erp-software-india), [myleadingcampus.com](https://www.myleadingcampus.com/blogview/top-5-college-management-erp-systems-in-india-what-makes-them-the-best-in-2025/), [techjockey.com](https://www.techjockey.com/blog/erp-software-for-school), [softwareadvice.com — Kalvisalai](https://www.softwareadvice.com/product/531667-Kalvisalai-college-erp/), [capterra.com — Camu](https://www.capterra.com/p/165862/CAMU/)
- Developer cost in India: [mqbittechnologies.com](https://mqbittechnologies.com/hire-full-stack-developer-india-hourly-rate-cost-breakdown-2026-guide), [brollyacademy.com](https://brollyacademy.com/full-stack-developer-salary/), [salaryinhand.in](https://salaryinhand.in/salaries/full-stack-developer)
- Razorpay fees: [productgrowth.in](https://productgrowth.in/tools/payments/razorpay/), [softwaresuggest.com](https://www.softwaresuggest.com/blog/razorpay-payment-gateway-charges/)
- USD/INR (Sept 2026 ≈ ₹96): [mtfxgroup.com](https://www.mtfxgroup.com/tools/historical-currency-exchange-rates/usd-to-inr-rate/)
- In-repo: `docs/HANDOFF_exam_autosave_cost.md` (assessment read/write profile), `docs/product-analysis.md` and `docs/competitive-analysis-and-roadmap.md` (market context), `functions/src/config/aiProviders.ts` (tiers), `functions/src/routes/ai-chat.ts` (AI cost guards).
