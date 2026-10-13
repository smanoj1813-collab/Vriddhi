# 03 · How Vriddhi expands — and what we need help with

The platform is built. **Money now buys distribution, content and the three missing procurement
checkboxes — not more code.** This document is the plan, the budget and the help-list.

---

## 1. Where the revenue comes from (four layers, in order of activation)

| Layer | Product | Buyer | Price anchor | Status |
| --- | --- | --- | --- | --- |
| **L1. Core campus licence** | Full platform, unlimited modules | College / trust | **₹449 / student / year** + ₹2.5 L onboarding | Product ready; sell to first 3–5 colleges |
| **L2. Add-on packs** | Resume Builder (Placement Pack), Coding Lab, Prep Studio, WhatsApp/SMS alerts, OBE/NAAC pack, library barcode | Same college, later | ₹40–120 / student / year each, or ₹1–3 L flat per pack | 2 built, 4 to build |
| **L3. Learning programmes** | Certificate courses (GenAI, Digital Marketing, PM, HR Analytics), university credit-bearing electives, skill bootcamps | College (bulk) **or student (direct)** | ₹999–2,999 per learner per certificate, or ₹150–400 / student bundled | 4 programmes authored; delivery engine ready |
| **L4. Platform / data services** | Multi-college benchmarking, university dashboards, API access, white-label for other edtechs, corporate L&D | University, edtech partner, enterprise | ₹5–25 L / year contracts | Architecture supports it; needs packaging |

Layer 3 is the one the eLearning investor is buying — see
[`04_ELEARNING_INVESTOR_BRIEF.md`](04_ELEARNING_INVESTOR_BRIEF.md).

---

## 2. The gap list, as a funded roadmap

Ranked by (procurement pressure × reuse of what exists) ÷ effort — from
`docs/competitive-analysis-and-roadmap.md`, re-costed here.

### Horizon 1 — "Make us buyable" (0–6 months, ~₹35–45 L)

| # | Milestone | Why it unlocks revenue | Effort |
| --- | --- | --- | --- |
| H1.1 | **Fee collection live** — gateway keys, UPI push, receipts, defaulter automation, settlement report | Every procurement checklist has it; the money conversation is the fastest door to a principal | 3 weeks |
| H1.2 | **WhatsApp + SMS + email dispatch** — absence alerts, fee reminders, results, university notices | The single most visible "modern college" signal to parents; also a per-message margin business | 3 weeks |
| H1.3 | **Parent portal** (read-only: attendance %, dues, results, circulars) with OTP/PIN login | #1 request from principals; converts the parent body into a retention force | 4 weeks |
| H1.4 | **Marksheets + transcripts + revaluation/backlog states** (hall tickets already ship) | Completes the exam-office story; makes existing marketing claims true | 3 weeks |
| H1.5 | **OBE / CO-PO attainment + NAAC evidence exports** (Criterion 1/2/3 starter) | The premium differentiator: unlocks higher-tier deals and Camu conversations | 6 weeks |
| H1.6 | **Trust hardening** — remove `|| true` from functions tests, lint in CI, full rules suite nightly, CORS allow-list, helmet, PWA precache diet | Lets you survive a technical or bank-level diligence without apology | 2 weeks |
| H1.7 | **Two reference colleges live** — full semester on the platform, 2 case studies with numbers | Nothing sells Indian colleges like another college's name and screenshots | continuous |

### Horizon 2 — "Turn the platform into a learning business" (6–18 months, ~₹50–70 L)

| # | Milestone | Commercial effect |
| --- | --- | --- |
| H2.1 | **Course marketplace mechanics** — per-college catalog, enrolment, pricing, coupons, certificates with verifiable IDs | Turns 4 programmes into a sellable catalogue; unblocks direct-to-student revenue |
| H2.2 | **10–14 certificate programmes** (AI & data, finance, sales, Java/Python, Tally/GST, spoken English, digital marketing, HR, banking, campus-to-corporate) + 4 in Kannada | Content is the product; each new pack is a new SKU with near-zero delivery cost |
| H2.3 | **Assessment-as-a-service for corporates** — proctored hiring tests, skill certification, L&D dashboards | Same engine, 5–20× per-seat pricing versus student licences |
| H2.4 | **Placement pack v2** — company drives, eligibility filters, alumni referrals, recruiter portal | Placement is the metric parents and NAAC both care about; also the college's marketing |
| H2.5 | **Mobile apps (or hardened PWA + push)** if data shows install/retention need | Removes the "no app" objection in large-college deals |
| H2.6 | **Integrations** — Tally export, biometric/attendance hardware import, Google Classroom/Moodle deep links, university result portals | Deals are won or lost on "does it talk to what we already have" |
| H2.7 | **Native app-store presence for students** + referral loop | Lowers CAC for the D2C learning layer |

### Horizon 3 — "Own the university layer" (18–36 months, ~₹1–2 Cr)

| # | Milestone | Commercial effect |
| --- | --- | --- |
| H3.1 | **University-level deployments** — multi-college dashboards, common question banks, affiliated-college rollups | One signature onboards 30–100 colleges; the highest-leverage sales motion available |
| H3.2 | **State-portal depth beyond Karnataka** (Maharashtra, Telangana, Tamil Nadu, AP equivalents) | Replicates the UUCMS play; each state is a bounded 8–12 week project |
| H3.3 | **Verifiable credentials** — digitally signed certificates/transcripts with public verification URLs | Compliance + employability story; blocks fraud; makes Vriddhi the trust layer |
| H3.4 | **Remote proctoring & AI invigilation** (partner-first, not hardware) | Unlocks high-stakes and corporate exams |
| H3.5 | **International adjacent markets** — Gulf, Nepal, Sri Lanka, Bangladesh, East Africa (large Indian-curriculum populations, same regulation shapes) | Same product, 3–5× price, 6-hour time difference |
| H3.6 | **API/marketplace** for third-party content and assessment providers | Platform economics: others bring content, Vriddhi takes a share |

---

## 3. Go-to-market: how the first 25 colleges are won

| Motion | Detail | Cost per college |
| --- | --- | --- |
| **Pilot wedge (primary)** | 30-day, one-programme pilot — attendance + timetable + exams + fees for one cohort. Free or ₹25 K, credited against the annual licence. Target: 1 signature per 4 pilots. | ₹35–60 K (setup time + travel) |
| **Principal's circle & management associations** | Demos at principals' meetings, management-association gatherings, ISTE/AICTE workshops; the deck + booklet in Kannada are already in `marketing/` | ₹15–25 K |
| **Reference flywheel** | Every pilot becomes a named case study; every college names 2 peer colleges; referral fee of ₹25–50 K in year 2 | ₹25–50 K (paid on close) |
| **University-channel** | Win the university's academic staff college / placement cell; offer a standard question-bank + scheme pack for all affiliated colleges | High, slow, but 30–100 colleges per win |
| **eLearning D2C (Horizon 2)** | Direct-to-student certificate sales through the public catalog, campus ambassadors, WhatsApp cohorts, LinkedIn, regional-language reels | ₹400–900 per paid learner; upsell to college bulk deals |

**Sales cycle reality:** 4–12 weeks for a private college; 3–9 months for a government or trust-run
college; 6–18 months for a university. Budget for a 90-day cash conversion gap and stagger pilots.

---

## 4. Unit economics (already measured — see `docs/COSTING_AND_PRICING_ANALYSIS_2026-09-25.md`)

| Line | 5,000-student college |
| --- | --- |
| Revenue at ₹449/student/year | **₹22.45 L** (+ ₹2.5 L one-time onboarding) |
| Cloud infrastructure (serverless, Mumbai) | **₹18,123 / year** (₹27 K budgeted with buffer) |
| AI (papers, grading, study packs, chat) | **₹1.16 L / year** base (₹2.32 L budgeted) |
| Support & success allocation (team shared by 5 colleges) | ₹12.1 L |
| **Gross margin with a 5-college shared team** | **31 %** |
| **Gross margin across 10 colleges** | **45 %** |
| Negotiation floor | **₹399/student with a 3-year commitment; never below ₹349** |

Two structural levers: (a) each additional college spreads the fixed team cost — margin rises with
the customer count, not with price increases; (b) add-on packs and learning programmes are sold into
the *same* already-onboarded buyer with near-zero acquisition cost.

---

## 5. What "help" actually means (ranked for an investor)

Money is the fourth most useful thing an investor gives you. Ask for these explicitly.

| Priority | Ask | Why it changes the outcome |
| --- | --- | --- |
| 1 | **Warm introductions to 10 college principals/chairmen** (especially in Karnataka, then Maharashtra/TN) | A warm intro converts ~3–5× better than cold outreach and costs you nothing |
| 2 | **2–3 reference logos willing to be named** | Removes the "who else uses it?" objection for every subsequent deal |
| 3 | **A university/regulator relationship** (BCU/Bangalore University, KUD, DTE, AICTE regional office) | Unlocks the university-channel motion worth 30–100 colleges |
| 4 | **Operating help**: a part-time enterprise sales lead with ERP/SaaS experience, a content producer for course packs, a support/implementation hire | Converts capital into velocity; hiring is the real constraint |
| 5 | **Cash** | Buys 12–18 months of the above at a lean burn |
| 6 | **Governance and honest pressure**: monthly metrics, a board seat, a quarterly strategy review, uncomfortable questions | Prevents the classic Indian SaaS failure: 8 hand-built colleges and no repeatable motion |
| 7 | **Legal/finance scaffolding**: CCPS/SAFE instrument drafting, GST treatment of per-student licences, DPDP Act compliance review, IP assignment from any contributor/freelancer | Prevents the diligence-stage derailment |
| 8 | **Follow-on and intros at the next round** | Seed investors who bring the Series A conversation are worth more than their cheque |

---

## 6. The ask — three ready-made versions (pick one, do not improvise)

**Option A · Angel / bridge — ₹50 L for 8–10 %**
Use for: 6 months of runway, 2 hires (implementation + content), 5 paid pilots, WhatsApp + fee
gateway shipped. Appropriate for a first-time raise from an individual who wants proof before a
larger round. Instrument: CCPS or a convertible note with a 20 % discount and a valuation cap.

**Option B · Seed (recommended) — ₹1.5 Cr for 12–15 %**
18-month plan with Horizon 1 complete and Horizon 2 started. Use of funds:

| Allocation | % | ₹ | What it buys |
| --- | --- | --- | --- |
| Engineering (2 devs + 1 full-stack) | 40 % | ₹60 L | Horizon 1 features, mobile, integrations |
| Content & instructional design | 18 % | ₹27 L | 10 more certificate programmes, Kannada editions, question banks |
| Sales & implementation (2 people + travel) | 25 % | ₹37 L | 20–25 colleges onboarded, pilot machine |
| Cloud, AI, tooling | 6 % | ₹9 L | Infra, AI usage, monitoring, CI |
| Legal, GST, DPDP, audit, compliance | 5 % | ₹7.5 L | Diligence-ready books, IP assignment |
| Contingency | 6 % | ₹9 L | The part every plan pretends does not exist |
| **Total** | **100 %** | **₹1.5 Cr** | **25 paying colleges ≈ ₹75 L–1.1 Cr ARR by month 18** |

**Option C · Strategic seed — ₹3 Cr for 18–22 %**
For an investor who brings distribution or content (an eLearning player, a college group, a
university network). Adds: a 10-programme content library, a corporate L&D pilot, two state
expansions, and a national sales lead.

**What to avoid:** selling more than 20–25 % in the first institutional round; a valuation that
requires a 10× step-up to raise the next round; and any instrument you cannot explain in one
sentence to your own board.

---

## 7. The 18-month milestone plan (what you promise and measure)

| Quarter | Product | Commercial | Metric that proves it |
| --- | --- | --- | --- |
| Q1 | Fee gateway live · WhatsApp/SMS · CI/trust hardening | 5 paid pilots signed | ₹8–12 L collected; 2 reference colleges |
| Q2 | Parent portal · marksheets/transcripts · NAAC pack v1 | 10 colleges live; 2 add-on packs sold | ₹25–35 L ARR; 60 % module adoption inside colleges |
| Q3 | Course marketplace · 8 certificate programmes · corporate pilot | D2C launch; 1 corporate L&D contract | 1,000 paid learners; ₹10 L non-licence revenue |
| Q4 | Mobile app · integrations (Tally, biometrics) | 18–20 colleges; university MoU in discussion | ₹60–80 L ARR; logo retention 100 %, net revenue retention >110 % |
| Q5–Q6 | University deployment · second state · proctoring partner | 25+ colleges; 1 university rollup | ₹1–1.5 Cr ARR; ready for a Series A conversation |

---

## 8. Risks, stated plainly (bring these up before the investor does)

| Risk | Honest severity | Mitigation |
| --- | --- | --- |
| No paying college live yet | **High — this is the real risk** | Convert existing interest into 3 paid pilots within 90 days; publish numbers even when small |
| Sales cycle longer than modelled | Medium-high | Pilot-led motion with a free/₹25 K entry price; monthly cash discipline; target private colleges first |
| Incumbent bundling AI | Medium | Compete on price-per-student and offline paper parsing; win new colleges, not migratable installed bases |
| AI cost/model churn | Low-medium | Multi-provider adapter, deterministic fallback, cache + caps (already built) |
| Single-founder/key-person risk | High if applicable | Publish the onboarding runbook, tests and docs; add a co-founder or senior engineer with the funding |
| Cash conversion / payment delays from trusts | Medium | Annual upfront or two-instalment billing; standing instruction/auto-debit where possible; keep a 6-month runway buffer |
| DPDP Act / data privacy exposure with student data | Medium | Mumbai-region residency, claims-based isolation, audited rules, DPIA before large deals, no biometric capture |
| Quality variance from AI outputs | Medium | Human-in-the-loop approval is already mandatory for papers and grading; keep it that way in the pitch |
