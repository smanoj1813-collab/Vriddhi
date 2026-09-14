# Universal Question Bank — Design Proposal (cost-conscious)

**Status:** Proposal · **Author:** Arena agent · **Date:** 2026-09-14

---

## 1. What exists today (and why we should build on it, not around it)

The repo already contains a partial "universal question bank" implementation. It is
**fragmented** into two parallel systems:

| System | Collections | Used by |
| --- | --- | --- |
| **Legacy college-scoped bank** | `questions`, `papers` | `QuestionBankManager`, `FacultyBankAdmin`, `BulkImportModal`, paper linking |
| **Universal / shared pool (partial)** | `questionBank_meta`, `questionBank_content`, `papers_universal`, `paperTemplates`, `questionReviews` | `UniversalQuestionBank`, `QuestionSubmissionForm`, `ReviewQueue`, `PaperBuilder` |

The universal pool already has the *right shape* — a `QuestionMetadata` doc (small,
filterable) and a `QuestionContent` doc (full text/options/explanation), plus a review
workflow (`pending → approved / rejected`) and a `CreatedBy { collegeId, role }` field
and a `visibility: public | college_only | shared_with` field in the types. This is the
foundation the design below formalises.

### Gaps found while reviewing (must be fixed regardless of design choice)

1. **`questionBank_content` is missing from `current-firestore.rules`.** It falls through to
   the catch-all `match /{document=**} { allow read, write: if false }`, so content is
   currently unreadable for everyone. `questionBank_meta` is allowed, content is not — an
   inconsistency.
2. **`visibility` is defined but never enforced.** Paper generation queries
   `status == 'approved'` only, with **no** `visibility` and **no** `collegeId` filter, so a
   `college_only` question would leak into every college's papers.
3. **Paper generation does a client-side `limit(200)` scan** and filters in memory. It only
   sees the *newest 200* approved questions and does a full read of the meta collection on
   every generation — a correctness bug **and** a read-cost hotspot.
4. **Two write paths coexist.** The legacy `questions` collection and the universal pool both
   accept writes, so the "one place where everything is stored" requirement is not met today.

---

## 2. Target architecture — one pool, two input doors

**Goal:** a single, continuously-growing question pool where the platform and colleges both
contribute, and every approved "public" question is instantly visible to all colleges.

```
                    ┌─────────────────────────────────────────────┐
                    │            UNIVERSAL QUESTION POOL           │
                    │   questionBank_meta/{id}   (small, indexed)  │
                    │   questionBank_content/{id} (full payload)   │
                    │   questionReviews/{id}      (workflow)       │
                    └───────────────▲───────────────▲──────────────┘
                                    │               │
                    ┌───────────────┴───┐       ┌───┴───────────────┐
                    │  DOOR 1: Platform │       │ DOOR 2: Colleges  │
                    │  (superadmin /    │       │ (faculty / admin /│
                    │   ops / seed)     │       │  HOD)             │
                    │  status=approved  │       │ status=pending    │
                    │  visibility set   │       │ → review queue    │
                    └───────────────────┘       └───────────────────┘
```

**One storage location.** Both doors write into the same three collections. There is no
separate per-college copy — a college's questions live in the pool with
`createdBy.collegeId` recorded. "Reflecting across colleges" is a *query* concern
(`visibility == 'public'`), not a *replication* concern. This is the single most important
cost decision: **no duplication** means no write amplification and no sync jobs.

### Data model (final)

**`questionBank_meta/{id}`** — the doc that gets read on every list/search/filter/generate.
Keep it small (< ~600 bytes):

```jsonc
{
  "subjectId": "financial-accounting",
  "topicId": "final-accounts",
  "subTopicId": "adjustments",
  "difficulty": "medium",
  "questionType": "mcq",
  "marks": 1,
  "language": "en",
  "tags": ["accounting", "final-accounts"],
  "status": "approved",            // pending | approved | rejected | needs_revision
  "visibility": "public",          // public | college_only | shared_with
  "sharedWith": [],                // collegeIds when visibility=shared_with
  "createdBy": { "userId": "...", "collegeId": null, "collegeName": "Vriddhi", "role": "superadmin" },
  "source": "platform" | "college",
  "quality": { "rating": 0, "reviewCount": 0, "flagged": false },
  "usageCount": 0,
  "createdAt": "<ts>", "updatedAt": "<ts>"
}
```

**`questionBank_content/{id}`** — full payload, read only when a question is *opened,
previewed, or placed on a paper*:

```jsonc
{
  "questionText": "…", "options": [{"id":"A","text":"…","isCorrect":true}, …],
  "correctAnswer": "A", "explanation": "…", "hint": "…",
  "images": [{ "storagePath": "images/questions/…/fig1.png", "altText": "…" }]
}
```

**`questionReviews/{id}`** — one doc per submitted question (or per revision):

```jsonc
{ "questionId": "…", "submittedBy": {…}, "status": "pending",
  "reviewComment": "…", "reviewerId": "…", "reviewedAt": "<ts>" }
```

**Images live in Cloud Storage, never in Firestore.** Only the `storagePath` is stored.
(Storing base64 blobs in Firestore would multiply both storage and read costs by orders of
magnitude.)

### Two-way input flow

| Step | Platform (our end) | College (their end) |
| --- | --- | --- |
| Entry | Seed script / superadmin upload / AI pipeline | `QuestionSubmissionForm` (already exists) |
| Initial status | `approved` (trusted) | `pending` |
| Visibility | `public` (free to all colleges) | defaults to `college_only` |
| Curation | — | Superadmin `ReviewQueue` approves / rejects / requests revision |
| On approve | instantly visible to all colleges | visible to the college; if approved as `public`, visible to all |

---

## 6. Ownership & tagging (decision: free platform content + per-college papers)

**Policy.** Platform-created questions **and** question papers are **free** and available to
all colleges. College-created papers stay **private to that college** by default. Everything
is **tagged at the source** so the two origins are permanently distinguishable in the UI,
in filters, and in exports.

### Tagging scheme (applies to both `Question` and `Paper` records)

| Attribute | Platform (ours) | College (theirs) |
| --- | --- | --- |
| `source` field | `"platform"` | `"college"` |
| `tags[]` ownership tag | `vriddhi-curated` | `college-contributed` |
| `tags[]` access tag | `free` | *(none — access via `visibility`)* |
| `visibility` | `public` | `college_only` (upgradeable to `public` via review) |
| `status` | `approved` | `pending` → review |
| `createdBy` | `role: superadmin`, `collegeId: null`, `collegeName: "Vriddhi"` | `role: admin/faculty`, own `collegeId` |

Concrete examples:

- **Platform question** → `tags: ["vriddhi-curated", "free"]`, `source: "platform"`,
  `visibility: "public"`, `status: "approved"`.
- **Platform paper (template)** → `tags: ["vriddhi-curated", "free"]`, `isTemplate: true`,
  `visibility: "public"`.
- **College question/paper** → `tags: ["college-contributed"]`, `source: "college"`,
  `visibility: "college_only"`.

The ownership tag (`vriddhi-curated` vs `college-contributed`) rides in `tags[]` so it
survives every path — CSV bulk import (which only carries a `tags` column), the legacy
`questions` collection, and the universal pool — and is natively filterable and renderable
as a chip. The `source` field is the machine-readable equivalent used by the universal pool.

> Note: "free" is expressed today as `visibility: public` + the `free` tag. If paid/tiered
> content is ever introduced, add a `tier` field (`free | premium`) rather than overloading
> `visibility`.

Notes:
- **Platform questions skip review** (trusted writer). College questions **always pass
  through review** — this protects pool quality without any manual platform review overhead.
- `needs_revision` returns the question to the college with a comment, so the loop is
  two-way, not fire-and-forget.

---

## 3. Cost model — where the money goes, and how we keep it near zero

Firestore cost is driven by **reads, writes, deletes, and storage** (not by number of
collections). Reads are almost always the dominant line item, because browse/search/generate
read many documents while writes happen once per question.

### The four levers (ranked by impact)

1. **Split meta vs content — and never read content in lists.**
   The `UniversalQuestionBank` browse UI, filters, and paper generation read only
   `questionBank_meta` (~0.5 KB). Full content (~2–5 KB) is read only on preview/use.
   For a bank of 10k questions this cuts list read volume ~5–10× — the single biggest
   saving.

2. **Move paper generation server-side (Cloud Function) with composite indexes.**
   Replace the `limit(200)` client scan with an indexed query
   `where(status, approved) where(subjectId, ==) where(difficulty, ==)` plus a
   denormalised `subjectCounts` doc for availability. Correctness and cost fixed together:
   generation becomes a handful of indexed reads instead of a 200-doc scan.

3. **Client cache + pagination (already partially present).**
   `DEFAULTS.CACHE_TTL` (5 min) and `PAGE_SIZE` (20) exist in the types — apply them in the
   browse UI so repeated views don't re-read. Use `startAfter` cursor pagination, never
   `offset` (offset still reads skipped docs).

4. **Batched writes for seeds and bulk imports.**
   The existing `bulkImportQuestions` already writes in batches of 500. Keep this pattern for
   platform seeding.

### Concrete estimate for the BBA seed (1,100 questions)

| Item | Volume | Cost |
| --- | --- | --- |
| Write meta + content (1,100 × 2 docs, batched) | 2,200 writes | ≈ **$0.004** one-time |
| Storage (meta ~0.5 KB + content ~3 KB × 1,100) | ≈ 4 MB | ≈ **$0.001 / month** |
| Total one-time | — | **well under ₹1** |

Ongoing usage for a few hundred colleges browsing + generating a few papers/day stays
comfortably inside Firestore's **free tier** (50k reads / 20k writes / 1 GB per day) as long
as levers 1–3 are in place. The design is deliberately **free-tier-first**; you only start
paying at scale, and then linearly, not by collection count.

### Anti-patterns to avoid (each is a cost trap)

- ❌ Storing images/base64 inside Firestore → use Cloud Storage paths.
- ❌ Reading full content during search/filter → read meta only.
- ❌ `limit(200)` + in-memory filter for generation → server-side indexed query.
- ❌ `offset`-based pagination → cursor (`startAfter`) pagination.
- ❌ A separate full copy of the pool per college → one shared pool + `visibility`.
- ❌ Per-question reads on every paper render → batch-fetch content by id list in one round.

---

## 4. Migration & phasing (what to do, in order)

**Phase 0 — harden the existing pool (small, high value).**
- Add `questionBank_content` (and `questionReviews` if missing) to `current-firestore.rules`.
- Enforce `visibility` in paper generation (filter `public`/`shared_with`/own-college).

**Phase 1 — unify the two banks.**
- Make `QuestionSubmissionForm` and `UniversalQuestionBank` the single entry/exit points.
- Route the legacy `questions` collection into the pool: a one-time migration script that
  reads each college's `questions` and writes them into `questionBank_meta`/`_content` with
  `createdBy.collegeId`, `visibility: college_only`, `status: approved` (they were already
  accepted by their college). Keep the legacy collection read-only for a transition window,
  then archive.

**Phase 2 — cost levers.**
- Server-side generation Cloud Function + composite indexes (`status+subjectId+difficulty`,
  `status+subjectId+topicId`, etc.).
- Cursor pagination + TTL cache in the browse UI.

**Phase 3 — platform seeding pipeline.**
- A `scripts/seed-question-bank.mjs` that reads the repo's `content/question-banks/**/questions.json`
  and bulk-writes them as `source: platform`, `status: approved`, `visibility: public`.
  (This is the "our end" door, and makes the BBA bank we're building live in one command.)

---

## 5. Recommended decision (summary)

> Adopt **one shared pool** (`questionBank_meta` + `questionBank_content` +
> `questionReviews`) with **two input doors**: platform writes `approved` directly, colleges
> write `pending` and pass through the existing `ReviewQueue`. Use **`visibility`** to
> control who sees what. **Tag every record with its origin** — `vriddhi-curated` / `free`
> for platform content, `college-contributed` for college content — so the two are always
> distinguishable. Enforce the **four cost levers** (meta/content split, server-side
> generation, caching + cursor pagination, batched writes). Store images in **Cloud Storage**.
> Deprecate the legacy `questions` collection after migration.

This delivers exactly what you asked — universal, always-growing, two-way input, one storage
location, reflected across colleges — while staying inside Firestore's free tier for the
foreseeable scale.

### Decisions confirmed (as of this revision)

1. **Platform questions & papers are free and public** to all colleges. ✅
2. **College papers are private to that college** (`visibility: college_only`). ✅
3. **Origin tagging** via `vriddhi-curated` / `college-contributed` tags + `source` field. ✅

### Remaining open question

- Do you want **AI-generated questions** (the existing `useAIQuestionGenerator` / aptitude
  pipeline) to feed into the same pool as a third "door", tagged `vriddhi-curated` but still
  gated through review? (Platform *hand-seeded* content stays `approved` directly.)
