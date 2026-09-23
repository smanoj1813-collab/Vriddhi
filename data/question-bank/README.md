# Vriddhi Question Bank — Seed Data (B.Com / BA / B.Sc)

Curated, import-ready topic-wise question data. It ships **inside the app bundle**
as well as on disk, so a superadmin can load it with one click — no terminal, no
copy-pasting CSV.

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

---

## How to seed (recommended: in-app)

**Superadmin → Question Bank → `Seed Question Bank`.**

The four CSVs are bundled into the superadmin chunk at build time
(`src/modules/superadmin/data/questionBankSeed.ts` imports them with Vite's
`?raw` suffix), so the seeder needs no upload and no server round-trip:

1. Pick a dataset — *All programmes* (240) or a single branch (80). The programme
   chips narrow it further.
2. Choose how the rows land:
   - **Visibility** — `public` makes them usable by every college (the platform
     pool); `college_only` keeps them platform-internal.
   - **Approved immediately** — uncheck to leave them `pending` in the review queue.
   - **Shuffle MCQ options** — the authored answer key is skewed (44 A / 76 B /
     6 C / 0 D), so papers generated straight from it would be guessable. The
     shuffle is seeded from each question's fingerprint, so it is **deterministic**:
     re-seeding produces identical documents rather than churning the pool.
3. Click **Preview & Validate**. This reads the existing pool once and reports
   exactly how many rows are new before anything is written, plus the estimated
   Firestore write count (3 documents per question: meta + content + review).
4. Click **Seed**. The list below reloads automatically.

Seeding is **idempotent**. A row is skipped when a question with the same
`text + subject + topic + programme` already exists in `questionBank_meta`, so
re-running after a partial failure, or after extending the CSVs, only writes
what is missing. Rows tagged `seed-import` / `vriddhi-curated` identify the
seeded content afterwards.

> ~720 Firestore writes for the full 240-question seed. That is above the
> Spark plan's 500-writes/day quota, so on a free-tier project seed one branch
> at a time (80 questions ≈ 240 writes).

**Where the rows land:** the universal pool — `questionBank_meta` +
`questionBank_content` (+ `questionReviews`), `source: 'platform'`,
`createdBy.collegeId: null`. That is the collection Superadmin → Question Bank
reads, and because the rows are `public` every college sees them too.

---

## Alternative: per-college Bulk Import

To put questions into a **single college's** legacy bank (`questions` collection —
what `Admin → Question Bank`, tests, and the college paper generator read):

1. In the app open **Admin → Question Bank → Bulk Import** (admin/superadmin role).
2. Paste the contents of the CSV for one branch into the *Paste CSV* box, or
   upload the `.csv` file.
3. Click **Preview & Validate** — every row should show as valid.
4. Click **Import**. Rows land with `branch` + `batch 2026-27` set, `unit` = topic
   name, `subject` = subject name, so tests and filters can target a subject or topic.

Two caveats that the in-app seeder does not have:

- **It is not idempotent** — re-importing the same file creates duplicates. Import
  each file once, then extend the existing questions.
- **It needs a college.** Firestore rules only allow a `questions` create when the
  document carries the caller's `collegeId` and `createdBy == request.auth.uid`, so
  a superadmin seeding the legacy bank must do it through a college admin session
  (or the rules would need widening).

---

## Format constraints (important)

Both import paths split each line on a **raw comma** — quoted CSV fields are not
supported. Therefore:

- **No commas or double quotes inside any field** (use semicolons or "plus"/"and").
- **No pipe `|` inside MCQ text or options** — `|` is the option separator
  (`Opt A|Opt B|Opt C|Opt D`).
- MCQ rows need **4 options** and a `correctAnswer` of `A`/`B`/`C`/`D`.
- `true_false` rows: `correctAnswer` must be exactly `True` or `False` — auto-grading
  compares the key literally, so a sentence in that column can never be marked correct.
- `numerical` rows: `correctAnswer` must be a number.
- `short_answer`/`long_answer` rows put the expected answer in the `correctAnswer`
  column (no options).
- One line per question; `isPYQ` rows need `examYear` + `examName` filled.

`generate_seed.py` enforces all of these before writing the CSVs, and the app
re-checks every row at seed time (`validateSeedRow`) — an invalid row is reported
with its line number and skipped rather than written wrong:

```bash
python3 data/question-bank/generate_seed.py
```

The parser, validator, dedupe fingerprints and option shuffle are covered by
`src/modules/superadmin/data/questionBankSeed.test.ts` (`npm run test:unit`), and
the dialog end-to-end by `npm run test:render`.

## Extending

- Add questions as `Q(...)` entries in the matching `*_questions.py` file
  (keep the comma/quote/pipe rules above).
- Re-run the generator; it validates every row and rewrites all four CSVs.
- Commit the CSVs — they are what the app bundles. Re-deploy, then open the
  seeder: it will show only your new rows as "new" and skip everything already
  in the pool.
