# Karnataka UG syllabus research — B.Com / B.A / B.Sc Semester I

**Date:** 2026-09-09
**Scope:** Pre-assessment papers and a BCU B.Com Sem I extraction for Vriddhi (non-technical UG colleges only).
**Not in scope:** B.Tech/BE, 4-year engineering patterns, autonomous-college variants except as a note.

This note is the research trail for `content/pre-assessment/` and `content/syllabus/bcu-bcom-sem1.json`. It is **not** a substitute for the university PDF a college actually follows.

---

## 1. Why this exists

Vriddhi already has:

- a syllabus parser tuned for **BCU B.Com (Regular)** (`src/modules/superadmin/services/syllabusParser.ts`, `BCU_CONFIG`);
- a standardised XLSX curriculum template (`standardizedTemplate.ts`);
- a Karnataka university seed list (`src/shared/data/karnatakaUniversities.ts`);
- paper HTML generation (`src/shared/utils/pdfGenerator.ts`).

What it did **not** have is a first pack of **printable, syllabus-aware diagnostic papers** that a college can run in Week 1 of Sem I, plus a researched extraction of one real Sem I programme.

Pre-assessment ≠ semester-end exam. Incoming students have not yet been taught B.Com.1.1. The three papers therefore test **PUC / Class 12** readiness for the destination degree, with topics chosen so faculty can see who will struggle in Financial Accounting, History DSC-1, Mechanics, etc.

---

## 2. NEP 2020 vs SEP 2024 (Karnataka)

| | **NEP 2020 (KSHEC model, ~2021–23 admits)** | **SEP 2024 (from 2024–25)** |
| --- | --- | --- |
| Legal hook | National Education Policy 2020; KSHEC model curricula | Govt. Order **ED 166 UNE 2023**, Bengaluru, **08.05.2024** — all Karnataka universities to recast UG from 2024–25 |
| Typical UG length | 4-year with multiple entry/exit (certificate / diploma / degree / honours) | 3-year degree emphasised (B.Com Regular = 6 semesters, ~142 credits at BCU) |
| Commerce Sem I DSC (BCU) | Financial Accounting; Management Principles and Applications; Principles of Marketing | Financial Accounting; Principles of Marketing; **Business Environment**; **Indian Financial System** |
| SEE : CIE (BCU B.Com theory) | 60 : 40 | **80 : 20** |
| SEE paper (BCU B.Com) | Older NEP pattern | Section A 5×2, B 4×5, C 3×15, D skill 5 = **80**, 3 hours |

**Implication for Vriddhi:** a 2026–27 batch should be seeded as **SEP** unless the college is still teaching out NEP. The parser comment “SEP 2026” is the right direction; the extraction file keeps **both** matrices so superadmin can pick.

---

## 3. Universities in the product (affiliation still an open question)

`KARNATAKA_UNIVERSITIES` lists 23 public universities. Phase 1 (highest college count) is:

1. Bangalore University (BU)
2. University of Mysore (UoM)
3. Karnatak University, Dharwad (KU)
4. Mangalore University
5. Gulbarga University (Kalaburagi)

Bengaluru City University (**BCU**) and Bengaluru North University (**BNU**) sit in Phase 4 in that seed file (post-2017 BU bifurcation) but they are **the** affiliating universities for a large share of Bengaluru degree colleges — commercially more important than the priority number suggests.

**Open thread (needs the operator):** which universities are the onboarded colleges actually affiliated to? Until that is answered, BCU is used as the **template** (parser already BCU-shaped; SEP PDF is public). BU / BNU / UoM Sem I DSC titles are close cousins, not identical.

---

## 4. Semester I course maps (typical)

### 4.1 B.Com — Bengaluru City University

**NEP 2020 Sem I** (25 credits; SEE 390 + CIE 310 = 700):

| Code | Title | Category | Credits |
| --- | --- | --- | --- |
| Lang.1.1 / 1.2 | Language I / II | AECC | 3 + 3 |
| B.Com.1.1 | Financial Accounting | DSC | 4 |
| B.Com.1.2 | Management Principles and Applications | DSC | 4 |
| B.Com.1.3 | Principles of Marketing | DSC | 4 |
| B.Com.1.4 | Digital Fluency / Basics of Computer | SEC | 2 |
| B.Com.1.5 | OEC (Accounting for Everyone **or** Personal Finance & Planning) | OEC | 3 |
| B.Com.1.6 / 1.7 | Yoga; Health & Wellness | SEC-VB | 1 + 1 |

**SEP 2024 Sem I DSC (BCU Regular):** 1.1 Financial Accounting, 1.2 Principles of Marketing, 1.3 Business Environment, 1.4 Indian Financial System (4 credits / 80+20 each).

Full module lists for NEP 1.1–1.3 live in `content/syllabus/bcu-bcom-sem1.json`.

### 4.2 B.A — KSHEC / BCU model (History + Political Science as the worked example)

NEP B.A Sem I is combination-based (two DSCs), plus languages, OE, SEC (Digital Fluency), PE / Health.

Typical DSC-1 titles used in Bengaluru History / Pol. Sci. BoS:

| Discipline | Sem I DSC (illustrative) |
| --- | --- |
| History | Political History of Karnataka (BCE 300 – CE 1000) Part I; often paired with Cultural Heritage of India |
| Political Science | Basic Concepts in Political Science (State, sovereignty, liberty, equality, justice) |
| Economics | Microeconomic theory / Principles of Economics (university-specific) |
| Sociology | Introduction to Sociology / Society in India |
| Optional English | Introduction to literature / language papers per BoS |

The B.A pre-assessment therefore mixes **English language**, **History of India/Karnataka**, **Constitution / Political Science**, and **society & economy** — the four literacies almost every B.A combination still needs.

### 4.3 B.Sc — KSHEC model

Students arrive as **PCM or PCB** (sometimes PMS, CBZ, etc.). Sem I is two (or three) DSCs + languages + OE + SEC.

Illustrative NEP Sem I DSC titles:

| Discipline | Sem I DSC (illustrative) |
| --- | --- |
| Physics | Mechanics / Mechanics and Properties of Matter |
| Chemistry | Analytical + organic foundations / Atomic structure, bonding, stoichiometry |
| Mathematics | Algebra and Calculus |
| Botany | Microbial diversity and morphology |
| Zoology | Cytology, genetics and infectious diseases |
| Electronics (where offered) | Electronic Devices and Circuits |

The B.Sc diagnostic therefore has Physics + Chemistry for everyone, a mixed Maths/Biology block (so PCM and PCB both show a gap profile), and a **choice of one** numerical in Section E (mechanics **or** maxima-minima).

---

## 5. What a pre-assessment paper is (and is not)

| It is | It is not |
| --- | --- |
| 50 marks, 60 minutes, Week 1 | An 80-mark / 3-hour SEE clone |
| PUC bridge, mapped to Sem I destination courses | A leak of this year's university paper |
| Original items with a faculty key in JSON | Scraped commercial MCQ banks |
| Printable A4 HTML a principal can photocopy | A Firestore write — nothing is deployed |

Blueprint used for all three programmes:

| Section | Marks | Form |
| --- | --- | --- |
| A–C | 10 + 10 + 10 | MCQ × 1 |
| D | 10 | 5 short × 2 |
| E | 10 | 1 application (B.Sc: attempt 1 of 2) |

Passing percentage in metadata is 40% (college diagnostic convention, not a university pass mark). No negative marking.

---

## 6. File map

```
content/pre-assessment/
  README.md
  papers/{bcom,ba,bsc}-sem1.json
  previews/{bcom,ba,bsc}-sem1.html          ← generated
content/syllabus/bcu-bcom-sem1.json          ← matrices + NEP modules + 10 sample bank items
docs/karnataka-ug-syllabus-research.md       ← this file
scripts/validate-question-paper.mjs
scripts/render-question-paper.mjs
```

```bash
node scripts/validate-question-paper.mjs
node scripts/render-question-paper.mjs --all
# optional faculty keys:
node scripts/render-question-paper.mjs --all --with-key
```

`--with-key` writes `previews/*-key.html` (gitignored if we ever add them; they are **not** part of the default student previews).

---

## 7. How this should enter the product later (not this PR)

This PR is **content + a standalone renderer**. No Firestore seed, no UI route.

When a college is ready:

1. Superadmin confirms **affiliating university + scheme (NEP vs SEP) + combination**.
2. Curriculum: either parse the official DOCX/PDF with `parseSyllabusDocument`, or fill `Vriddhi_Curriculum_Template.xlsx`. The extraction JSON is a reference, not an uploader payload.
3. Question bank: import `sampleQuestions` (and later, items from the papers) via the existing CSV/JSON question importer (`parseQuestionFile`).
4. Papers: faculty can upload the HTML/PDF or re-key sections in `PaperUploadEditor`. A future `seed-preassessment.mjs` (Admin SDK) can write `papers/{id}` + `questions/{id}` the same way `scripts/seed-phase2-assessment.mjs` does for the test engine.

**Open thread — seed format:** XLSX (matches the curriculum template colleges already know) vs JSON (matches this repo and `parseJsonQuestions`). Recommendation: **keep JSON as source of truth in git**; emit XLSX only if a college asks to edit in Excel.

---

## 8. Kannada

BCU SEP regulations: medium of instruction is English; a candidate **may write the examination entirely in Kannada**. Theory SEE papers are supposed to ship **Kannada + English** versions; practical/problem papers English only.

These seeds are **English only**. Kannada versions are an open thread (need a Kannada-fluent reviewer; do not machine-translate accounting terminology without a commerce lecturer).

---

## 9. What to extract next (open thread)

Suggested order after BCU B.Com Sem I:

1. **BCU B.Com Sem I SEP** detailed modules (Business Environment, Indian Financial System) — we have the matrix, not the unit text.
2. **BNU / BU B.Com Sem I** (same city, slightly different BoS).
3. **UoM / KU B.A History + Pol. Sci Sem I** (statewide volume).
4. **B.Sc Physics + Chemistry Sem I** (CBZ vs PCM split).
5. Sem II only after Sem I papers have been sat in a real college.

**Question volume:** 50-mark diagnostics are enough for Week 1. A full question bank for Financial Accounting should be hundreds of items tagged by module — out of scope here.

---

## 10. Sources

- BCU B.Com (Regular) NEP 2022–23: [spmcollege.ac.in B.Com NEP PDF](https://www.spmcollege.ac.in/downloads/nepsyllabus/bcom.pdf)
- BCU B.Com (Regular) SEP 2024–25 I & II: [bcu.ac.in SEP B.Com PDF](https://bcu.ac.in/uploads/syllabus/ug_sep/I_and_II_Sem_SEP_Syllabus/Commerce%20Syllabus/B.Com%20-%20Regular%20UG%20Syllabus%20SEP.pdf)
- BCU History Sem I–II (NEP): college-hosted BoS PDF (e.g. SJRC History syllabus)
- Bangalore University History / Political Science NEP model papers (KSHEC-aligned)
- Karnataka 2nd PUC subject lists: DPUE / commonly summarised for Accountancy, Business Studies, Economics, Physics, Chemistry, Mathematics, Biology, History, Political Science
- Vriddhi in-tree: `academicPrograms.ts` (non-tech UG only), `karnatakaUniversities.ts`, `syllabusParser.ts`

If a source URL 404s, the university has reshuffled `/uploads/syllabus/`. Use the current prospectus, not this note, as ground truth.
