# 04 · The eLearning brief — written for the person who is interested in eLearning

This is the highest-value document in the pack: it re-pitches the same company in the language of an
eLearning investor. Read §1 and §2 aloud; the rest is ammunition.

---

## 1. The reframe (say this first, in one breath)

> "Vriddhi is not another college ERP. We built the delivery engine that every Indian eLearning
> company pays crores to build — assessments, certification, progress tracking, proctoring-grade
> exams, vernacular content, and a distribution channel into 48,000 colleges — and we are sitting
> on 4 certificate programmes and 984 assessment items that we can sell through it today.
>
> The campus platform is our distribution. The eLearning layer is the business."

**Why that lands:** an eLearning investor has heard 50 content startups with no distribution. You
are the opposite — a distribution asset with a content business bolted on, already built.

---

## 2. What already exists (not a plan — a repo)

| eLearning building block | What Vriddhi already has | What a typical eLearning startup has to build |
| --- | --- | --- |
| Course delivery | Module → lesson → quiz → project → capstone → certificate flow with sequential unlocking, pass marks and progress sync per college, plus offline caching | Same, from scratch |
| Content format | A CI-validated pack format (`course.json` + Markdown lessons + quiz banks + slide decks + rubrics + facilitator guide + certification policy) — reviewed in pull requests, versioned, portable | A CMS and an authoring panic |
| Assessments | A production exam engine: MCQ auto-grading, descriptive AI grading with confidence scores, timers, section breaks, autosave, lockdown, expired-attempt recovery | A quiz widget, then a rewrite |
| Certification evidence | Grade records, transcripts, attendance eligibility, university result import, PDF generation with letterhead | A Canva template |
| Practice & placement | Coding Lab with server-side execution, previous-year-paper corpus (English + Kannada), model answers, repeated-question analysis, ATS résumé builder | Separate products, usually paid add-ons |
| Language | Six Indian languages with native-script generation (en, hi, kn, ta, te, ml) | "Coming soon: Hindi" |
| Distribution | Multi-tenant SPA already installed/institutionalised inside colleges: attendance, fees, timetable and exams run in the same app students open daily | Paid acquisition |
| Trust | 1,827 lines of security rules, DPDP-friendly Mumbai residency, audit trails, ~1,540 tests | A privacy policy |

**The honest gap:** we have the engine and the first 4 programmes; we do not yet have a marketplace,
per-learner payments, verifiable certificate IDs, or a corporate sales motion. That is precisely what
the funding buys (§6).

---

## 3. The market (with sources, so the numbers survive scrutiny)

| Market | Size | Growth | Source |
| --- | --- | --- | --- |
| India online education | **USD 4.48 B (2026) → USD 23.90 B (2034)** | 23.3 % CAGR | IMARC, Sep 2026 |
| India EdTech (broader) | **USD 3.63 B (2025) → USD 33.31 B (2034)** | 27.9 % CAGR | IMARC, Aug 2026 |
| Higher-education segment of online education | **USD 2.48 B (2024)** | Fastest-growing end-user segment | Technavio |
| India executive education & upskilling | **USD 12.2 B (2025) → USD 27.32 B (2032)** | 12.2 % CAGR, 22.7 M paid learners | Ken Research, Aug 2026 |
| India corporate e-learning & upskilling | **USD 9.4 B (2025) → USD 24.1 B (2031)** | 17.0 % CAGR | Ken Research |
| India's global rank in e-learning | **#2, after the USA** | — | Edovu Ventures, Aug 2026 |
| Enrolment base feeding all of it | **4.50 crore** higher-education students, **1.02 crore** in STEM | GER 30 % | AISHE 2026 |

Add the demand-side fact that sells certification: **India's employability rate is 56.35 %** (India
Skills Report 2026) — 44 % of graduates are not job-ready, and every college is under pressure to
prove placement outcomes. Credit-bearing, certifiable, outcome-mapped learning is the answer
colleges are shopping for, and **NEP 2020's credit framework already lets them buy it externally**.

**Beachhead inside that market:** Karnataka alone has thousands of affiliated colleges, a mandatory
state portal (UUCMS), and a government pushing NEP credit transfers — a legislated reason to buy
digital courses and digital assessment, in a state whose language Vriddhi already ships.

---

## 4. Three eLearning business models we can run on the same engine

### Model A — Campus-bundled learning (activate first, lowest risk)

Sell certificate programmes to the college as part of the platform licence or as an affordable pack.

- **Price:** ₹150–400 per student per programme, or bundle 2 programmes into the ₹449 licence.
- **Why it works:** zero acquisition cost — the buyer is already paying us; the principal gets
  "our students get AI and digital-marketing certification" as an admission-marketing line.
- **Unit economics:** content cost is fixed and already spent; delivery cost ≈ cloud + AI
  (₹23/student/year observed). At ₹250 for a 60-hour certificate, gross margin is >85 %.
- **10 colleges × 2,000 students × ₹250** = **₹50 L revenue** from an asset that already exists.

### Model B — Direct-to-learner certification (the scale engine)

Open the public catalog (`/courses` already exists as a shareable, unauthenticated preview) for
paid enrolment with verifiable certificates.

- **Price:** ₹999–2,999 per certificate (market range for a 50–60 hour Indian certificate).
- **CAC advantage:** colleges are our channel — campus ambassadors, faculty referral coupons,
  WhatsApp cohorts, and the fact that students already open the app daily for attendance and results.
  Blended CAC target **₹400–900**, versus the ₹1,500–4,000 a cold edtech brand pays.
- **Expansion math:** 25 colleges × 2,000 students = 50,000 students reachable at zero media spend.
  Converting **2 %** at ₹1,499 = **₹15 L**; 10 % = **₹75 L** — and each learner can buy more than
  one programme (GenAI → Digital Marketing → HR Analytics).

### Model C — Corporate & institutional L&D (highest price per seat)

Sell the same engine (not just content) to companies and government skilling programmes.

- **Products:** proctored skill certification and hiring assessments, onboarding academy delivery,
  L&D dashboards with attainment evidence, white-label delivery for another content company.
- **Price:** **₹1,500–6,000 per learner** for a certified corporate programme, or ₹5–25 L per
  annual platform contract. Government skilling schemes (NSDC/state skill missions) buy per batch.
- **Why we win:** our assessment engine is auditable (proctoring events, eligibility rules, grade
  records), which is what corporate L&D and government audits actually require — most Indian LMS
  vendors sell a video player with a quiz.

**Sequencing:** A now (revenue from the installed base) → C for cash and credibility (6 months) →
B as the compounding engine (12 months), once the marketplace and certificate verification exist.

---

## 5. Content roadmap (what the money buys)

| Wave | Programmes | Why these |
| --- | --- | --- |
| Live now | GenAI for Career Impact (60 h) · Digital Marketing (52 h) · Project Management (60 h) · HR Analytics (60 h) | AI + job-ready skills; the highest-demand certificate categories |
| Wave 1 (0–6 months) | Applied AI for Commerce, Data Analytics with Excel/Power BI, Tally + GST, Banking & Insurance, Campus-to-Corporate readiness, Spoken English for employability | Every one maps to an existing course in Karnataka's B.Com/BBA/B.Sc curriculum — colleges can adopt them as skill electives |
| Wave 2 (6–12 months) | Java/Python/Full-stack foundation, Cybersecurity basics, Digital Finance, Sales & CRM, Healthcare administration, Kannada-medium editions of the top 4 | Career-track ladders that a learner buys twice |
| Wave 3 (12–24 months) | University credit-bearing electives (NEP compliant), corporate academies, government skilling batches | Moves from ₹1,000–3,000 consumer price points to ₹5,000+ institutional ones |

Each pack costs roughly **₹1.5–3 L** to author to the existing standard (subject expert + instructional
designer + review), which is why ₹25–30 L of content funding buys a **10-programme catalogue** —
a catalogue, not a course.

---

## 6. What we would build with an eLearning partner in the first 90 days

1. **Marketplace + payments** — per-learner enrolment, coupons, UPI/card checkout, GST-compliant
   invoicing, refund policy (uses the Razorpay flow already wired for fees).
2. **Verifiable certificates** — signed certificate IDs with a public verification URL, QR on the
   PDF, and an employer-facing verification page (the credibility asset for hiring).
3. **Publish Wave 1 (6 programmes)** — to the existing CI-validated format, 2 of them in Kannada.
4. **Ambassador launch in 5 colleges** — faculty referral codes, cohort WhatsApp groups, a leaderboard,
   and a dashboard that proves conversion per college.
5. **Corporate pilot** — one mid-size employer for proctored certification, at ₹2,500–4,000 per seat.
6. **Learner analytics** — completion, drop-off, quiz difficulty, outcome-to-placement mapping; this
   is also the data that makes NAAC/OBE reporting sellable to colleges.

Success metric at day 90: **500–1,000 paid learners and one corporate contract**, at a blended CAC
under ₹900.

---

## 7. The five-slide version for this investor

1. **India has 4.5 crore students and a 56 % employability problem** — the state (NEP, UUCMS) is
   pushing colleges to buy digital, credit-bearing, outcome-tracked learning.
2. **Everyone is selling courses; nobody is inside the college.** We are inside: attendance, exams,
   fees and timetables already run on Vriddhi in the same app a student opens daily.
3. **The engine is built.** Course delivery, assessment, certification, six Indian languages,
   proctoring-grade security — 4 programmes and 984 items already authored.
4. **Three ways to monetise the same engine:** campus bundles (₹250/student), direct certification
   (₹999–2,999), corporate L&D (₹1,500–6,000/seat or ₹5–25 L/contract).
5. **What we want from you:** content and channel capital — ₹1–3 Cr and your catalogue/corporate
   relationships — for 25 colleges, 10 programmes and 1,000+ paid learners in 12 months.

---

## 8. Deal structures that work for an eLearning strategic

| Structure | When it fits | Watch out for |
| --- | --- | --- |
| **Equity (CCPS/SAFE)** — ₹1–3 Cr for 12–20 % | Partner brings money + channel, wants the upside | Cap table hygiene, board seat, reserved matters; get the SHA reviewed |
| **Strategic + content JV** — they contribute a content library or LMS; revenue share on certificates (e.g. 30/70) | They own curriculum assets and a corporate client base | Content licensing must be perpetual and Vriddhi-hostable; define white-label rights and non-compete carefully |
| **Distribution partnership (no equity)** — they resell Vriddhi certificates into their base, you resell their content into colleges | A fast test with a large player before you dilute | Exclusivity: never grant category exclusivity for more than 12 months |
| **Convertible note with a valuation cap** | A first cheque that needs to close in weeks | Conversion mechanics, interest, maturity, and what happens at the next round |

**Never trade more than 25 % in this round**, never give revenue share *and* equity for the same
content, and never sign away the right to sell the same content to another college.

---

## 9. The diligence questions this investor will ask — with answers

| Question | Answer |
| --- | --- |
| *"Do you have any paying learners?"* | "No — pre-revenue, 4 programmes authored and the engine live. What we have is distribution: N colleges in pilot conversation, M students reachable at zero CAC. Your cheque buys the marketplace, certificates and 6 more programmes, which is the shortest path from here to first ₹10 L of learning revenue." |
| *"What's your course completion rate?"* | "Unmeasured in production because we have not run a paid cohort; the format is built for completion — sequential unlocking, a quiz per lesson, module assessments with pass marks, projects with rubrics, and a facilitator guide for the college. We will publish cohort-completion data from the first 5 colleges; expect 55–70 %, materially above self-paced MOOC averages, because a college schedules it." |
| *"How is this different from Coursera/upGrad/Simplilearn?"* | "They buy learners; we already have them. Those brands spend ₹1,500–4,000 to acquire a student, sell 3-month programmes at ₹30,000+, and cannot sell the college a system of record. We sell the certificate as an extension of software the college runs its exams and attendance on — and we can go down to ₹999 where their cost structure cannot." |
| *"Is the content quality good enough?"* | "Every pack is authored to a published style guide: 1,200–1,500 words per lesson, worked examples, labs with deliverables, rubrics, an AI-use statement, Indian and Karnataka examples, and a review cycle logged in the repo. Every pack passes automated structural validation in CI — question counts, answer indices, assessment weights, file paths. If you have instructional designers, we'd rather license your review than argue." |
| *"Where does AI help you, where is it a risk?"* | "AI generates question banks and papers, drafts grading suggestions with confidence scores, produces study packs, and writes résumé suggestions — all human-approved, all metered, all switchable to a deterministic fallback. Cost is measured at ₹23/student/year. The risk is model churn, which is why the provider adapter and the fallback exist." |
| *"Can this work outside Karnataka?"* | "The compliance layer is configuration (scheme packs) and the portal integrations are bounded projects; the platform, content and language layer are state-agnostic. Gulf and SAARC markets run Indian curricula — same product, higher price." |
| *"What if a college wants to white-label my content into their own portal?"* | "We can host and deliver it with their branding through the existing multi-tenant layer. That is a platform-revenue conversation, not a threat — and it is why content partners like us." |
| *"Why take your cheque instead of just selling your content to an LMS?"* | "Because we would lose the distribution. Our advantage is that the learner is already logged in to do attendance, see results and pay fees. Content sold into someone else's LMS has to buy its own audience." |
