# Vriddhi Question Bank — Seed Data (B.Com / BA / B.Sc)

Import-ready topic-wise question data for the **Bulk Import** feature
(`Admin → Question Bank → Bulk Import`).

## Contents

| File | Branch | Questions |
|---|---|---|
| `BCom_QuestionBank.csv` | B.Com | 80 |
| `BA_QuestionBank.csv` | BA | 80 |
| `BSc_QuestionBank.csv` | B.Sc | 80 |
| `All_QuestionBank.csv` | all three | 240 |
| `bcom_questions.py` / `ba_questions.py` / `bsc_questions.py` | source data (editable) | — |
| `generate_seed.py` | validator + CSV generator | — |

Each branch: **4 subjects × 4 topics × 5 questions** (3 MCQ + 1 true/false
or numerical + 1 short answer). Batch is `2026-27`.

### Subjects and topics

**B.Com**
- Financial Accounting — Journal and Accounting Equation · Ledger and Trial Balance · Financial Statements · Bank Reconciliation and Depreciation
- Commercial Law — Indian Contract Act · Sale of Goods · Negotiable Instruments · Consumer Protection
- Business Mathematics — Probability and Statistics · Index Numbers · Time Series · Linear Programming
- Economics — Demand and Supply · National Income · Money and Banking · International Trade

**BA**
- Political Science — Preamble and Fundamental Rights · Parliament · Judiciary · Local Self Government
- History — Indus and Vedic Civilisation · Medieval India · Freedom Struggle · Modern World History
- Sociology — Society and Culture · Social Institutions · Social Stratification · Social Change
- Psychology — Introduction and Theories · Learning and Memory · Intelligence · Mental Health

**B.Sc**
- Mathematics — Limits and Continuity · Differentiation · Integration · Differential Equations
- Physics — Waves and Optics · Electricity and Magnetism · Modern Physics · Thermodynamics
- Chemistry — Chemical Bonding · Chemical Thermodynamics · Electrochemistry · Coordination Compounds
- Computer Science — Programming Fundamentals · Data Structures · Databases and SQL · Operating Systems

## How to import

1. In the app open **Admin → Question Bank → Bulk Import** (admin/superadmin role).
2. Paste the contents of the CSV for one branch (or the combined file) into the
   *Paste CSV* box, or upload the `.csv` file.
3. Click **Preview & Validate** — every row should show as valid (240 for the
   combined file).
4. Click **Import**. Rows land with `branch` + `batch 2026-27` set,
   `unit` = topic name, `subject` = subject name, so tests and filters can
   target a subject or topic.

> Re-importing the same file again will create duplicates — import each file
> once, then extend the existing questions.

## Format constraints (important)

The app's import parser (`BulkImportModal.tsx`) splits each line on a **raw
comma** — it does not support quoted CSV fields. Therefore:

- **No commas or double quotes inside any field** (use semicolons or "plus"/"and").
- **No pipe `|` inside MCQ text or options** — `|` is the option separator
  (`Opt A|Opt B|Opt C|Opt D`).
- MCQ rows need **4 options** and a `correctAnswer` of `A`/`B`/`C`/`D`.
- `short_answer`/`long_answer` rows put the expected answer in the
  `correctAnswer` column (no options).
- `true_false` rows: `correctAnswer` = `True` or `False`.
- One line per question; `isPYQ` rows need `examYear` + `examName` filled.

`generate_seed.py` enforces all of these before writing the CSVs:

```bash
/home/user/.venv/bin/python data/question-bank/generate_seed.py
```

## Extending

- Add questions as `Q(...)` entries in the matching `*_questions.py` file
  (keep the comma/quote/pipe rules above).
- Re-run the generator; it validates every row and rewrites all four CSVs.
- Import the fresh per-branch CSV; existing rows in the bank are untouched.
