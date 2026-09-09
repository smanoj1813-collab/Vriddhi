# Pre-assessment papers — B.Com / B.A / B.Sc Semester I

Week-1 **diagnostic** papers for Karnataka non-technical UG colleges. They check PUC / Class 12 readiness for Semester I; they are **not** university SEE papers and they are **not** written to Firestore by this folder.

| Paper | Programme | Marks | Time | JSON | Preview |
| --- | --- | --- | --- | --- | --- |
| Commerce bridge | B.Com | 50 | 60 min | `papers/bcom-sem1.json` | `previews/bcom-sem1.html` |
| Arts bridge | B.A | 50 | 60 min | `papers/ba-sem1.json` | `previews/ba-sem1.html` |
| Science bridge | B.Sc | 50 | 60 min | `papers/bsc-sem1.json` | `previews/bsc-sem1.html` |

Research: [`docs/karnataka-ug-syllabus-research.md`](../../docs/karnataka-ug-syllabus-research.md)
BCU B.Com Sem I extraction + sample bank items: [`content/syllabus/bcu-bcom-sem1.json`](../syllabus/bcu-bcom-sem1.json)

## Print a paper

Open the HTML preview in a browser → Print → A4. Substitute the college name in the header before photocopying (search `Vriddhi Affiliated College`).

To regenerate previews after editing JSON:

```bash
node scripts/validate-question-paper.mjs
node scripts/render-question-paper.mjs --all
```

Faculty answer keys (not committed):

```bash
node scripts/render-question-paper.mjs --all --with-key
# writes previews/bcom-sem1-key.html etc.
```

The JSON already carries `correctAnswer` / `modelAnswer` / `explanation` for every item.

## JSON shape (schemaVersion 1)

Required on the paper: `id`, `title`, `subject`, `examType`, `program`, `branch`, `semester` (1–6), `scheme`, `language`, `duration` (minutes), `totalMarks`, `negativeMarking`, `instructions[]`, `sections[]`.

Each question: `id`, `text`, `type`, `difficulty` (`easy|medium|hard`), `marks`. MCQ / true-false need `options[{id,text,isCorrect}]` with exactly one correct option, and `correctAnswer` equal to that option id.

Section E on the B.Sc paper uses `"attempt": { "count": 1 }` (attempt any 1 of 2). Declared `totalMarks` must equal the sum of **attempted** section marks, not the unused alternative.

Allowed `program` values match `UG_PROGRAMS` / `PG_PROGRAMS` in `src/shared/constants/academicPrograms.ts` (no engineering branches).

## What this is not

- Not a deploy. Hosting / functions / rules are untouched.
- Not Kannada. BCU allows Kannada-medium SEE; these seeds are English.
- Not affiliated-university specific. Header says BCU as a **template** — swap the university line for BU, BNU, UoM, …
- Not a question-bank import. Use `parseQuestionFile` / the faculty bulk importer when you want these items in Firestore.

## Blueprint

| Section | Marks | Notes |
| --- | --- | --- |
| A–C | 30 | 30 × 1-mark MCQ |
| D | 10 | 5 × 2-mark short |
| E | 10 | one application (B.Sc: choose physics **or** maths) |
