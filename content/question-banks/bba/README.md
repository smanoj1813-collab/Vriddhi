# BBA Question Bank — Vriddhi

Curriculum-aligned questions for the **Bachelor of Business Administration (BBA)** core,
ready to drop into the Vriddhi question bank via bulk import.

## What's here

| Path | Purpose |
| --- | --- |
| `subjects.json` | Machine-readable index of all 22 core subjects + electives, with unit maps |
| `Principles-of-Management/` | **Principles of Management** — 50 questions (JSON + CSV) |
| `Financial-Accounting/` | **Financial Accounting** — 50 questions (JSON + CSV) |
| *(more subjects follow the same per-subject folder pattern)* | |

Each subject folder contains two files with identical questions:

- `questions.json` — rich source-of-truth matching the `Question` schema
  (`text`, `subject`, `type`, `difficulty`, `unit`, `marks`, `options[]`,
  `correctAnswer`, `explanation`, `tags[]`, `topic`, `bloomLevel`, `batch`, `branch`).
- `questions.csv` — RFC-4180 CSV for the bulk importer. Header row is exactly
  `text,subject,type,difficulty,unit,marks,options,correctAnswer,explanation,tags,batch,branch,isPYQ,examYear,examName`.

## How to import

**Option A — file upload (recommended, handles commas/quotes correctly).**
Faculty → Question Bank → upload `questions.csv` (or `questions.json`). The app's
`parseQuestionFile` (RFC-4180) reads both formats.

**Option B — paste CSV.** Open *Bulk Import → Paste CSV* and paste the contents of
`questions.csv`. Note: the paste parser is naive (it splits on raw commas), so this
bank is written **comma-free** in every CSV field to be safe in both paths.

## Conventions used (match the app's data model)

- `type` ∈ `mcq`, `true_false`, `fill_in_blank`, `short_answer`, `long_answer`,
  `numerical`, `case_based` (all accepted by the file uploader).
- `options` are pipe-separated in the **order A, B, C, D**; `correctAnswer` is the
  **letter** `A|B|C|D`. `true_false` uses `True|False` with `A`/`B`.
- Assertion–Reason and Matching questions are expressed as 4-option MCQs so they import
  and render identically everywhere (they are labelled in `topic`).
- `difficulty` ∈ `easy | medium | hard`; `bloomLevel` ∈ `remember | understand | apply |
  analyze | evaluate | create`.
- Marks: MCQ/TF/FIB = 1, short = 2, long/case/numerical = 5.
- `batch` = `2026-27`, `branch` = `BBA` (edit before import if your batch/branch differ).

## Origin & access tagging

Every question in this bank is **Vriddhi-authored, free, and public** (visible to all
colleges). That is carried in two places so it survives every import path:

| Field | Value | Meaning |
| --- | --- | --- |
| `tags[]` (CSV `tags` column) | `vriddhi-curated,free` | platform-authored + free |
| `source` (JSON only) | `platform` | machine-readable origin |
| `visibility` (JSON only) | `public` | available to all colleges |

College-authored questions use the mirror tags — `college-contributed` + `source: college`
+ `visibility: college_only` — so the two origins stay distinguishable in filters and in the
UI. See `docs/universal-question-bank-design.md` §6 for the full scheme. The converter
(`scripts/generate_bba_questions.py`) injects these tags automatically on every run.

## Per-subject question mix (~50)

| Type | Count |
| --- | --- |
| MCQ (4 options; incl. assertion–reason & matching style) | ~20 |
| True / False | 6 |
| Fill in the blank | 6 |
| Short answer (2 marks) | 8 |
| Long answer (5 marks) | 6 |
| Case-based | 2 |
| Numerical (where the subject allows) | 2–4 |

## Roadmap / status

| # | Subject | Semester | Status |
| --- | --- | --- | --- |
| 1 | Principles of Management | 1 | ✅ 50 questions |
| 2 | Financial Accounting | 1 | ✅ 50 questions |
| 3 | Business Economics I (Micro) | 1 | ⏳ next |
| 4 | Business Communication | 1 | ⏳ |
| 5 | Organisational Behaviour | 2 | ⏳ |
| 6 | Business Economics II (Macro) | 2 | ⏳ |
| 7 | Marketing Management | 2 | ⏳ |
| 8 | Business Statistics | 2 | ⏳ |
| 9 | Human Resource Management | 3 | ⏳ |
| 10 | Financial Management | 3 | ⏳ |
| 11 | Business Law | 3 | ⏳ |
| 12 | Management Accounting | 3 | ⏳ |
| 13 | Entrepreneurship Development | 4 | ⏳ |
| 14 | Consumer Behaviour | 4 | ⏳ |
| 15 | Production & Operations Management | 4 | ⏳ |
| 16 | Business Research Methods | 4 | ⏳ |
| 17 | Strategic Management | 5 | ⏳ |
| 18 | International Business | 5 | ⏳ |
| 19 | Management Information Systems | 5 | ⏳ |
| 20 | Business Ethics & Corporate Governance | 6 | ⏳ |
| 21 | Banking & Insurance | 6 | ⏳ |
| 22 | Project Management | 6 | ⏳ |

Electives (Services/Retail/Digital Marketing, Investment/Portfolio/Tax, Labour Laws,
SCM/Logistics, E-Commerce/Analytics) can be added on request.

> Each subject is generated against its unit map in `subjects.json`, so coverage is
> syllabus-driven, not random. University schemes (NEP 2020 vs SEP 2024) differ slightly;
> adjust `unit` labels if your college follows a specific BoS syllabus.
