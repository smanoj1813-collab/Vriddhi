# BBA Catalog — Seeding Verification Report (previous → current)

**Date:** 2026-11-07
**Status:** Seeded and live on https://vriddhi-academic.web.app/prep?program=bba
**Verified against:** `functions/src/data/bbaSeedData.ts` (source of truth) + live hub pages

---

## 1. Verified totals (source-of-truth counts)

| Item | Count | Verification |
|------|-------|--------------|
| BBA subjects | **20** | 6 semesters (3/3/3/3/3/5 subject distribution) |
| BBA topics | **100** | **5 per subject — every subject has all 5 modules** (0 exceptions) |
| Practice questions | **169** | Every topic has 1+ MCQ with `pyqTag` + `prepTags` linking to topicIds |
| Duplicate question IDs | **0** | Programmatic check passed |
| Illustrated topics | **13** (8 diagrams) | Embedded in `explanationMd` via `![Diagram](file.png)` |

## 2. Why the hub numbers look different from "100 topics"

Three different numbers appear in three places — **all correct, none indicate missing data**:

| Where you saw it | Number | What it counts |
|------------------|--------|----------------|
| Green seed banner | *"24 subjects, 112 topics, 181 questions"* | The seeding commit: **20 BBA subjects (100 topics, 169 Q)** + **4 shared Universal Student Learning subjects (12 topics, 12 Q)** |
| Hub header | *"BBA · 28 subjects · 132 topics"* | The full public catalog for `?program=bba`: the 24 above + **4 cross-program packs** (BA/B.Sc shared subjects that also list BBA in `programs`) with 20 topics |
| Semester cards | 5/4/4/3/3/5 = **24 study subjects** | Matches the seeded bundle (20 BBA + 4 Universal) |

Each semester card shows every subject with **"5 topics"** — the required one-topic-per-module structure.

## 3. What is NEW vs the previous catalog

### Semester 1 gap modules (8 topics added — the previously missing ones)

| Subject | Module | Topic |
|---------|--------|-------|
| Management Principles & Applications | 3 | Organizing: Structure, Departmentation & Authority 🖼️ |
| Management Principles & Applications | 4 | Staffing, Leadership & Motivation |
| Management Principles & Applications | 5 | Directing, Coordination & Control |
| Fundamentals of Business Accounting | 2 | Journal, Ledger & Trial Balance 🖼️ |
| Fundamentals of Business Accounting | 5 | Final Accounts & Adjustments 🖼️ |
| Principles of Marketing | 1 | Marketing Concepts & 4Ps Marketing Mix |
| Principles of Marketing | 4 | Distribution Channels & Retailing |
| Principles of Marketing | 5 | Promotion Mix & Advertising |

### Semesters 2–6 (69 topics + 138 questions added)

All subjects completed to 5 modules each:
Organizational Behaviour · Business Mathematics & Quantitative Techniques · Managerial Economics · Cost Accounting · Business Statistics · Financial Markets & Services · Business Law & Commercial Regulations · Corporate Financial Management · Human Resource Management · Management Accounting · Income Tax - I · Production & Operations Management · Strategic Management & Business Policy · GST & Customs Duty · Entrepreneurship Development · Company Law & Secretarial Practice · Income Tax - II

## 4. The 13 illustrated topics — direct deep links

Open any of these to see the diagram at the end of the explanation:

| Topic | Diagram | Link |
|-------|---------|------|
| Organizing: Structure, Departmentation & Authority | org-structure.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-mpa/topic/mpa-mod3-organizing |
| Journal, Ledger & Trial Balance | financial-statements.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-accounting/topic/acc-mod2-journal-ledger-trial-balance |
| Final Accounts & Adjustments | financial-statements.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-accounting/topic/acc-mod5-final-accounts-adjustments |
| Production Functions & Cost Analysis | supply-demand-curve.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-economics/topic/eco-mod2-production-functions |
| Cost Curves & Revenue Concepts | cost-curves.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-economics/topic/eco-mod3-cost-curves |
| Market Structures: Perfect Competition & Monopoly | market-structures.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-economics/topic/eco-mod4-market-structures |
| Managerial Pricing Methods | supply-demand-curve.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-economics/topic/eco-mod5-managerial-pricing |
| Time Value of Money | break-even-analysis.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-fin-mgmt/topic/fm-mngt-mod1-time-value-of-money |
| Capital Budgeting: NPV, IRR & Payback | break-even-analysis.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-fin-mgmt/topic/fm-mngt-mod5-capital-budgeting |
| Marginal Costing & Decision Making | break-even-analysis.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-mgmt-accounting/topic/mgmt-mod5-marginal-costing-decision-making |
| Inventory Management | org-structure.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-operations-mgmt/topic/ops-mod3-inventory-management |
| SWOT & PESTLE Analysis | swot-analysis.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-strategic-mgmt/topic/strat-mod3-swot-pestle-analysis |
| Corporate Level Strategies | bcg-matrix.png | https://vriddhi-academic.web.app/prep/subject/bba-karnataka-strategic-mgmt/topic/strat-mod5-corporate-level-strategies |

## 5. Illustration rendering bug — fixed in this PR

**Symptom:** Not a single diagram visible on any topic page, even the 13 illustrated ones.

**Root cause:** `PrepMarkdown` (in `src/modules/prep/prepPublicShared.tsx`) only rendered
images whose markdown src was a full `https://` URL (the Studio "Upload image" Storage-URL
format). The seeded topics embed bare filenames (`![SWOT Diagram](swot-analysis.png)`), which
the regex rejected — the image line was silently dropped.

**Fix:** The renderer now resolves any image src through a bundled-asset map
(`src/assets/prep-images/*.png` imported at build time via Vite). Bare filenames, relative
paths, root-relative paths and full http(s) URLs all render. Because resolution happens at
**display time**, the already-seeded Firestore content shows diagrams with only a frontend
deploy — **no re-seeding required**.

## 6. Two-minute verification checklist

1. Open https://vriddhi-academic.web.app/prep?program=bba → header shows **28 subjects · 132 topics**; each semester subject card shows **5 topics**.
2. In the search box type **SWOT** → **Strategic Management** appears as a topic-title match → open it → **SWOT & PESTLE Analysis** shows `swot-analysis.png` in the explanation.
3. Open any deep link from section 4 → diagram renders at the end of the explanation.
4. Open **Management Principles & Applications** → all 5 modules listed (Module 3–5 are the new ones).
5. Open **Fundamentals of Business Accounting** → Modules 2 & 5 are the new ones (both illustrated).
