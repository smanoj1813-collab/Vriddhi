# Vriddhi Question Bank — Seed Data (B.Com / BA / B.Sc)

Curated, import-ready question data organised as **subject → topic → sub-topic**.
It ships **inside the app bundle** as well as on disk, so a superadmin can load it
with one click — no terminal, no copy-pasting CSV.

## Contents

| File | Branch | Questions | Topics | Sub-topics |
|---|---|---|---|---|
| `BCom_QuestionBank.csv` | B.Com | 262 | 16 | 48 |
| `BA_QuestionBank.csv` | BA | 238 | 16 | 48 |
| `BSc_QuestionBank.csv` | B.Sc | 259 | 16 | 48 |
| `All_QuestionBank.csv` | all three | **759** | 48 | 144 |

| Source module | Role |
|---|---|
| `structure.py` | **the hierarchy** — every subject, topic and sub-topic, plus the keywords used to backfill sub-topics onto older questions |
| `bcom_questions.py` / `ba_questions.py` / `bsc_questions.py` | the original topic-level questions (5 per topic) |
| `subtopic_questions.py` | the sub-topic questions (4 per sub-topic = 12 per topic) |
| `generate_seed.py` | validator + CSV generator |

Batch is `2026-27`. Across the bank: 435 MCQ, 167 true/false, 141 short answer,
16 numerical; 443 easy / 292 medium / 24 hard.

### The three tiers

```
subject   → QuestionMetadata.subjectId     (CSV `subject`)
topic     → QuestionMetadata.topicId       (CSV `unit`)
sub-topic → QuestionMetadata.subTopicId    (CSV `subtopic`)
```

`structure.py` is the single source of truth for that hierarchy. The generator
**rejects** any sub-topic that is not declared there, and rejects a sub-topic
with no questions — so a typo cannot split one concept into two phantom
sub-topics in the bank's filters, and no filter chip can open on an empty
drill-down.

### Subjects, topics and sub-topics

**B.Com**
- *Financial Accounting* — Journal and Accounting Equation · Ledger and Trial Balance · Financial Statements · Bank Reconciliation and Depreciation
- *Commercial Law* — Indian Contract Act · Sale of Goods · Negotiable Instruments · Consumer Protection
- *Business Mathematics* — Probability and Statistics · Index Numbers · Time Series · Linear Programming
- *Economics* — Demand and Supply · National Income · Money and Banking · International Trade

**BA**
- *Political Science* — Preamble and Fundamental Rights · Parliament · Judiciary · Local Self Government
- *History* — Indus and Vedic Civilisation · Medieval India · Freedom Struggle · Modern World History
- *Sociology* — Society and Culture · Social Institutions · Social Stratification · Social Change
- *Psychology* — Introduction and Theories · Learning and Memory · Intelligence · Mental Health

**B.Sc**
- *Mathematics* — Limits and Continuity · Differentiation · Integration · Differential Equations
- *Physics* — Waves and Optics · Electricity and Magnetism · Modern Physics · Thermodynamics
- *Chemistry* — Chemical Bonding · Chemical Thermodynamics · Electrochemistry · Coordination Compounds
- *Computer Science* — Programming Fundamentals · Data Structures · Databases and SQL · Operating Systems

Each topic holds exactly **3 sub-topics** and **12 questions**; each sub-topic
holds **4 questions**. Run `python3 data/question-bank/generate_seed.py` to print
the full tree with counts.

---

## How to seed (recommended: in-app)

**Superadmin → Question Bank → `Seed Question Bank`.**

Only `All_QuestionBank.csv` is bundled into the superadmin chunk at build time
(`src/modules/superadmin/data/questionBankSeed.ts` imports it with Vite's `?raw`
suffix); the three per-programme datasets are filtered out of it by
`filterSeedCsvByBranch`, because each is an exact subset and inlining all four
would ship ~450 KB of duplicated text. Either way the seeder needs no upload and
no server round-trip:

1. Pick a dataset — *All programmes* (759) or a single branch (238–262). The
   programme chips narrow the combined dataset further. The step reports how many
   subjects, topics and sub-topics the selection covers before you commit.
2. Choose how the rows land:
   - **Visibility** — `public` makes them usable by every college (the platform
     pool); `college_only` keeps them platform-internal.
   - **Approved immediately** — uncheck to leave them `pending` in the review queue.
   - **Shuffle MCQ options** — the generator already spreads the authored answer
     keys across A–D (102 / 100 / 119 / 114), and this shuffle randomises the
     option order per seed. It is seeded from each question's fingerprint, so it
     is **deterministic**: re-seeding produces identical documents rather than
     churning the pool.
3. Click **Preview & Validate**. This reads the existing pool once and reports
   exactly how many rows are new before anything is written, plus the estimated
   Firestore write count (3 documents per question: meta + content + review).
4. Click **Seed**. The list below reloads automatically.

Seeding is **idempotent**. A row is skipped when a question with the same
`text + subject + topic + programme` already exists in `questionBank_meta`, so
re-running after a partial failure, or after extending the CSVs, only writes what
is missing. Note the fingerprint deliberately **excludes** the sub-topic: adding
or renaming a sub-topic must not re-seed 759 questions as "new". Rows tagged
`seed-import` / `vriddhi-curated` identify the seeded content afterwards.

> **Free-tier quota.** The full bank is ~2 277 Firestore writes
> (759 questions × 3 documents), well over the Spark plan's **500 writes/day**.
> On a free-tier project seed **one programme at a time on separate days**
> (B.Com ≈ 786 writes, BA ≈ 714, B.Sc ≈ 777 — still above 500, so split further
> by subject chips if needed), or move the project to Blaze first. The dialog
> warns about this when the selection exceeds the quota. Because seeding is
> idempotent, a run that stops part-way can simply be resumed.

**Where the rows land:** the universal pool — `questionBank_meta` +
`questionBank_content` (+ `questionReviews`), `source: 'platform'`,
`createdBy.collegeId: null`. That is the collection Superadmin → Question Bank
reads, and because the rows are `public` every college sees them too. Both
documents carry `subTopicId`, which is what the bank's sub-topic filter
(`questionBankApi` `filters.subTopicId`) queries.

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

Three caveats that the in-app seeder does not have:

- **It is not idempotent** — re-importing the same file creates duplicates. Import
  each file once, then extend the existing questions.
- **It needs a college.** Firestore rules only allow a `questions` create when the
  document carries the caller's `collegeId` and `createdBy == request.auth.uid`, so
  a superadmin seeding the legacy bank must do it through a college admin session
  (or the rules would need widening).
- **The sub-topic only survives the shared upload path.** `Admin → Question Bank →
  Bulk Import` (`BulkImportModal`) has no sub-topic field and drops the column.
  The shared **question upload editor** (`QuestionUploadEditor`, backed by
  `src/shared/utils/questionFileParser.ts`) does read it and writes it as
  `subTopic` on the legacy document.

---

## Format constraints (important)

Both import paths split each line on a **raw comma** — quoted CSV fields are not
supported by the bulk importer. Therefore:

- **No commas or double quotes inside any field** (use semicolons or "plus"/"and").
- **No pipe `|` inside question text or options** — `|` is the option separator
  (`Opt A|Opt B|Opt C|Opt D`). Watch out for notation like `P(A|B)`: write
  "the probability of A given B".
- MCQ rows need **4 options** and a `correctAnswer` of `A`/`B`/`C`/`D`.
- `true_false` rows: `correctAnswer` must be exactly `True` or `False` — auto-grading
  compares the key literally, so a sentence in that column can never be marked correct.
- `numerical` rows: `correctAnswer` must be a number (write `e raised to x` as a
  `short_answer` instead).
- `short_answer`/`long_answer` rows put the expected answer in the `correctAnswer`
  column (no options).
- One line per question; `isPYQ` rows need `examYear` + `examName` filled.
- **`subtopic` must name a sub-topic declared in `structure.py`** for that
  subject and topic.

`generate_seed.py` enforces all of these before writing the CSVs, and the app
re-checks every row at seed time (`validateSeedRow`) — an invalid row is reported
with its line number and skipped rather than written wrong:

```bash
python3 data/question-bank/generate_seed.py
```

It also enforces the shape of the hierarchy: every declared sub-topic must
receive questions, every topic must carry exactly `PER_TOPIC` (12) new questions,
no question text may repeat inside a branch, and the MCQ answer keys must stay
spread across A–D.

The parser, validator, dedupe fingerprints, sub-topic mapping and option shuffle
are covered by `src/modules/superadmin/data/questionBankSeed.test.ts` and
`src/shared/utils/questionFileParser.test.ts` (`npm run test:unit`), and the
dialog end-to-end by `npm run test:render`.

## Extending

1. Declare any new sub-topic in `structure.py` (name + lowercase keywords used to
   backfill older questions).
2. Add questions as `SQ(...)` entries under that sub-topic in
   `subtopic_questions.py` — keep the comma/quote/pipe rules above and hold the
   4-questions-per-sub-topic quota.
3. Re-run the generator; it validates every row and rewrites all four CSVs.
4. Commit the CSVs — they are what the app bundles. Re-deploy, then open the
   seeder: it will show only your new rows as "new" and skip everything already
   in the pool.

Older topic-level questions in `*_questions.py` need no edit: the generator
assigns them a sub-topic by matching their text against the keywords in
`structure.py`, and fails loudly if nothing matches.
