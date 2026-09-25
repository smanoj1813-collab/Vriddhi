# Resume Builder add-on — costing before we build

**Scope being costed:** 5 ATS-safe resume templates; students edit in the browser and download a PDF; **3 downloads per template per student per year** (15 in total); sold/positioned as an add-on that justifies the per-student price.

**Basis:** same assumptions as the round-2/3 costing — 5,000 students, ₹96 / USD, Firebase Blaze list prices for asia-south1, team of 5 × ₹30,000 already in the plan. Every number below is reproduced live on the new **"Resume Add-on"** sheet of `docs/Vriddhi_Costing_Sheet.xlsx` (regenerate with `python3 scripts/build-costing-sheet.py`); change any yellow cell and the tables recalculate.

---

## 1. The answer in one table

| | **MAX** — every student uses all 15 credits | **EXPECTED** — 70 % of students, 6 downloads each | **LOW** — 40 %, 3 each |
|---|---:|---:|---:|
| PDF renders per year | 75,000 | 21,000 | 6,000 |
| Cloud cost (compute + storage + downloads + Firestore + hosting) | **₹3,583** | **₹1,003** | **₹287** |
| Cloud cost per download | ₹0.048 | ₹0.048 | ₹0.048 |
| Optional AI assist (capped 20 calls / student / yr) | ₹16,320 | ₹4,570 | ₹1,306 |
| **New cash on the Google / AI invoice** | **₹19,903** | **₹5,573** | **₹1,592** |
| Build — team time, one-time (60 person-days incl. contingency) | ₹81,818 | ₹81,818 | ₹81,818 |
| Maintenance & support — team time per year (12 person-days) | ₹16,364 | ₹16,364 | ₹16,364 |
| **Year-1 all-in** | **₹1,18,085** | **₹1,03,755** | **₹99,774** |
| **Year-1 cost per student** | **₹23.6** | **₹20.8** | **₹20.0** |
| Steady state per year (build spread over 3 years) | ₹63,540 | ₹49,209 | ₹45,229 |
| Steady-state cost per student | ₹12.7 | ₹9.8 | ₹9.0 |

**Bottom line: 3 downloads × 5 templates costs about 5 paise per download and under ₹1 per student per year in cloud spend, even if every one of 5,000 students exhausts every credit.** The real cost of the feature is the ~60 person-days to build it well (≈ ₹82 K of team time that is already salaried) — not the downloads.

---

## 2. What one download actually costs (list prices, worst case)

A "download" here means a **server-rendered PDF version** — headless Chrome on a 2 GiB Cloud Function, the same Puppeteer path the app already uses for question papers (`functions/src/utils/pdfRenderer.ts`). That is the only design in which the 3-per-template rule is enforceable (see §5).

| Component | Assumption | $ per download | ₹ per download |
|---|---|---:|---:|
| Render compute | 8 billable s × (1 vCPU @ $0.0000336 + 2 GiB @ $0.0000035) — Cloud Run Tier 2 | $0.000325 | ₹0.031 |
| Cloud Storage — keep the PDF | 0.25 MB × 6 months avg × $0.026 / GB-month | $0.000038 | ₹0.004 |
| Cloud Storage — download + 1 free re-download | 2 × 0.25 MB × $0.12 / GB | $0.000059 | ₹0.006 |
| Firestore | 1.2 sessions × 40 autosave writes + 3 credit writes @ $0.18 / 100 K; 10 reads @ $0.06 / 100 K | $0.000098 | ₹0.009 |
| Hosting transfer | 1.2 sessions × 0.8 MB (builder bundle + fonts, cached) @ $0.15 / GB | $0.000141 | ₹0.014 |
| **Total at list price** | | **$0.00066** | **≈ ₹0.063** |
| Total with the Cloud Functions free tier absorbing half the compute (the normal case) | | | **≈ ₹0.048** |

Free tier reality check: Tier 2 gives 128,571 vCPU-s and 257,142 GiB-s **per month** free. The base app uses ≈ 33 K vCPU-s a month. Even the MAX scenario adds 75,000 × 8 s = 600 K vCPU-s a **year** (50 K a month) — so in most months the render compute is literally ₹0. The sheet's default (50 % absorbed) is deliberately conservative to allow for placement-season bunching.

---

## 3. What the cap changes — and what it does not

Cloud cost per year if every "expected-adoption" student (3,500) used **every** credit:

| Credits per template | Renders / yr | Cloud ₹ / yr | ₹ per student |
|---:|---:|---:|---:|
| 1 | 17,500 | ₹836 | ₹0.17 |
| 2 | 35,000 | ₹1,672 | ₹0.33 |
| **3 (proposed)** | **52,500** | **₹2,508** | **₹0.50** |
| 5 | 87,500 | ₹4,180 | ₹0.84 |
| 10 (≈ unlimited) | 175,000 | ₹8,361 | ₹1.67 |

**The cap is a product and pricing lever, not a cost lever.** Going from 3 credits to effectively unlimited costs ~₹6 K a year across the whole college. Keep the cap for three reasons that have nothing to do with cloud spend: it frames the add-on as a metered premium (scarcity), it creates a **top-up SKU** (e.g. ₹49 for 3 more versions), and it stops a handful of students hammering the renderer during placement week.

Two rules that make the cap feel fair without costing anything:
1. **A credit = a new PDF version.** Re-downloading a PDF that was already generated is free (we keep the file). Students never "lose" a credit because their browser cleared a download.
2. **Preview is unlimited.** The live editor preview is rendered in the browser and watermarked; only the clean PDF consumes a credit.

---

## 4. Build effort (lean, in-house, AI-assisted — the same basis as the "Build Cost" sheet)

| Work item | Person-days |
|---|---:|
| Resume data model, per-student docs, security rules, autosave, prefill from the student record | 5 |
| Editor UI — sections (contact, summary, education, internships/experience, projects, skills, certifications, achievements, languages), reorder, live preview, mobile | 12 |
| 5 ATS-safe templates — single column, standard headings, real text, A4 + Letter, page-break rules, open-licence fonts (2 days each) | 10 |
| Server-side PDF — dedicated 2 GiB function, credit transaction (render + decrement + ledger in one write), Cloud Storage, signed re-download URLs, watermarked preview | 6 |
| ATS checker — rule-based score: sections present, contact block, heading names, no tables/images/columns, length, keyword match against a pasted job description, fix-it hints | 4 |
| AI assist (optional) — bullet rewrite, summary draft, JD keyword suggestions, per-student cap and cost guard | 3 |
| Admin & superadmin — enable per college (add-on flag), template on/off, credits view/reset, usage dashboard, export | 5 |
| QA — every template through 2–3 open-source resume parsers, device matrix, print fidelity, load test at 20 renders/min | 5 |
| **Total** | **50** → **60 with 20 % contingency ≈ 2.7 person-months** |

- In-house: 60 days × ₹1,364 (₹30,000 ÷ 22) = **₹81,818** of team time — one developer for ~11 weeks or two for ~6. This is an *allocation* of salaries already in the plan, not new cash.
- Agency at ₹1,500 / h: 60 × ₹12,000 = **₹7.2 L** — the "why we build it ourselves" comparison.
- Run cost: ~1 person-day a month (template fixes, credit resets, parser regressions) = ₹16 K / yr.

---

## 5. Design decisions that drive the numbers (and the one that is non-negotiable)

1. **PDFs must be real text, not pictures.** `html2canvas → jsPDF` (the client-side fallback the paper pipeline already has) produces an *image* inside a PDF. An ATS cannot read it; the resume scores zero. Every resume PDF must come from a text renderer — headless Chrome server-side (recommended) or a text-based client library. This is the single most important requirement behind the words "ATS approved".
2. **Server-side rendering is what makes the cap enforceable.** The credit is decremented in the same Firestore transaction that authorises the render; the PDF bytes never exist until the credit is spent. A client-side PDF with a "please decrement my counter" call is bypassable by any student who opens DevTools.
3. **Dedicated function, not the shared `api`.** Chrome renders hold an instance for 3–10 s. Give the resume renderer its own 2 GiB function (concurrency 1, maxInstances 20 ⇒ ~150 renders/min) so a placement-day rush cannot starve the rest of the API. Same price per render.
4. **Peak load is a non-issue.** A "resume day" where 2,000 students download within 2 hours is 17 renders a minute — 2–3 concurrent instances.
5. **Keep every version for 12 months** (or 6 months past graduation). Worst case 75,000 × 0.25 MB ≈ 19 GB ≈ ₹580 / yr. Enables free re-downloads and a "version history" that students value.
6. **AI assist is optional and capped.** ₹0.16 per call on Gemini 2.5 Flash; 20 calls per student per year caps exposure at ₹3.3 per student (₹16 K for the college). On Flash-Lite it is ~4× cheaper. Ship it behind a college-level switch.
7. **"ATS approved" is a design standard, not a certificate.** No body certifies templates. We build to the parsing rules every ATS shares (single column, standard section names, no tables/text boxes/icons/images, common fonts, real text, contact block at top) and **prove it** by running each template through open-source parsers in QA. Say "ATS-friendly / ATS-tested" in marketing, not "approved by ATS vendors".
8. **Personal data.** Resumes hold phone numbers and addresses — per-student rules (already the tenant pattern), delete on request, purge after retention.

---

## 6. Pricing the add-on

Cost per student is ₹20–24 in year 1 and ₹9–13 thereafter, so any price above ~₹40 clears a 40 % margin even in the MAX scenario:

| | MAX | EXPECTED | LOW |
|---|---:|---:|---:|
| Price for **30 %** margin (year-1 cost + 10 % contingency) | ₹37 | ₹33 | ₹31 |
| Price for **40 %** margin | ₹43 | ₹38 | ₹37 |
| At **₹79 / student / yr** — revenue ₹3.95 L, year-1 gross profit | ₹2.77 L (70 %) | ₹2.91 L (74 %) | ₹2.95 L (75 %) |
| If **bundled free** into the ₹599 base price — margin points it costs in year 1 | 3.9 pts | 3.5 pts | 3.3 pts |

Effect on the round-2 P&L (5,000 students, ₹599 + ₹2.5 L onboarding, year-1 GP ₹10.03 L = 30.9 %):
- **Sold as a ₹79 add-on:** revenue ₹36.4 L, GP ≈ ₹12.9 L → **≈ 35.6 % margin**.
- **Bundled free** (the "justify the price" play): revenue unchanged, GP ≈ ₹8.99 L → **≈ 27.7 % margin** in year 1, ~29.5 % from year 2.

Indicative market anchors (retail, per individual — verify before quoting): online resume builders charge roughly ₹1,000–2,000 **per month**; design-tool subscriptions ~₹500 per month; one-off resume-writing services ₹1,000–5,000. A college-wide ₹49–99 **per year** with 15 tailored versions is an easy line in the pitch.

### Recommendation
1. **Build it** — ~2.7 person-months, no new hires, negligible run cost.
2. **Price it as a named add-on ("Placement Pack") at ₹79–99 per student per year**, with the option to bundle it free as a negotiation concession. Never bundle it silently — an add-on that is visible on the quote justifies the price even when discounted to zero.
3. **Keep 3 versions per template**, unlimited free re-downloads, unlimited watermarked preview, and a ₹49 top-up for 3 more versions. The cap costs nothing and earns something.
4. **Ship AI assist off by default, capped at 20 calls** per student per year; switch it on per college as a further upsell.
5. **Non-negotiable in the build:** text PDFs only, server-side credit transaction, dedicated render function, parser-tested templates.

---

*Workbook: `docs/Vriddhi_Costing_Sheet.xlsx` → sheet "Resume Add-on". Regenerate: `python3 scripts/build-costing-sheet.py`. Prices: Cloud Run Tier 2 (asia-south1) $0.0000336 / vCPU-s, $0.0000035 / GiB-s, $0.40 / M requests; Firestore, Storage and Hosting prices from the Inputs sheet; Gemini 2.5 Flash $0.30 / $2.50 per 1M tokens.*
