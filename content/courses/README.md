# Course packs

Self-contained learning programmes rendered by the Vriddhi app under **Courses** (`/courses` public catalog, `/student/courses` inside the student portal). Each pack is a folder with a JSON manifest, Markdown lessons, per-module quiz banks, project briefs and assessment documents — plain files that can be reviewed in pull requests, versioned, and reused outside the app.

## Available packs

| Folder | Code | Title | Hours |
| --- | --- | --- | --- |
| `genai-certification/` | VGC-101 | GenAI for Career Impact — Certificate Program | 60 |
| `digital-marketing/` | VDM-101 | Digital Marketing — Certificate Program | 52 |
| `project-management/` | VPM-101 | Project Management — Certificate Program | 60 |
| `hr-analytics/` | VHR-101 | HR Analytics — Certificate Program | 60 |

### Digital Marketing — illustrated edition (v1.1.0)

VDM-101 includes **162 inline visual explanations across all 31 lessons and 5 project briefs**. Every Core ideas subtopic and every project section has a diagram, a short additional explanation and a takeaway; every topic has a revealable understanding checkpoint. The original Markdown explanations, slides, quizzes, assessment weights, reading gates and certificates are unchanged.

The visual layer includes step-by-step flows, system maps, feedback loops, comparisons, decision matrices, zero-based bar charts and schematic funnels. Lesson 1.2 has an interactive funnel/CPA lab with adjustable rates, a practice media budget, reset and an accessible data table. All numeric examples are labelled synthetic; forecasts are not performance promises. Learners can switch illustrations off for an exact text-only rendering.

### GenAI Certification — illustrated edition (v1.2.0)

VGC-101 adds **237 visual companions across all 35 lessons and 6 project briefs**. These cover every Core ideas subheading and every project section, after the complete original explanation. Locally bundled vector artwork introduces the course; prompt maps, generation loops, the RAG pipeline, human-review controls, responsible-AI checks and portfolio workflows provide a second way to understand the reading. The original Markdown, 605 quiz items, 20 slides, grading, reading/quiz gates and certificate requirements are unchanged.

Lesson **2.2** includes a local **CO-STAR prompt-building lab**. Toggle Context, Objective, Style, Tone, Audience and Response to see which instruction disappears, then reset. The fictional placement-team scenario retains unconfirmed-date/venue placeholders. This is a brief assembler, **not an AI call, a truth/quality score or a new submission task**. No learner text is sent or collected.

### HR Analytics — illustrated edition (v1.1.0)

VHR-101 adds **117 visual companions across all 24 lessons and 5 project briefs**, plus course-specific vector artwork. Examples include a matched recruitment funnel, zero-based cost/capacity charts, survey participation, filtered acceptance denominators, percentage-point comparisons, a row-major confusion matrix and privacy-aware decision maps. All fixtures remain separate synthetic populations; no real employee data is needed. Original explanations, 200 quiz items, 72 slides, rubrics and institutional-award conditions are unchanged.

Lesson **4.2** includes a **workforce denominator lab**: adjust opening headcount, joiners and exits from each cohort, inspect the headcount bridge, and compare period turnover with fixed-opening-cohort retention. The initial scenario reproduces 100 opening / 120 closing / 11 exits / 92 retained; the 31 joiners and 8 + 3 exit breakdown are explicitly illustrative. Counts are whole people from 0–200, exits cannot exceed their cohort, and reducing a cohort caps its exits. The opening/closing mean is only an approximate denominator; turnover may exceed 100%, retention cannot, and zero denominators are undefined rather than 0%. These are not complementary rates, diagnoses or individual employment-risk assessments.

#### Optional animation, without changing completion

Every new GenAI/HR diagram has an **opt-in, finite walkthrough**. Play highlights one focus point at a time (one pass, no loop); Pause, Replay, numbered buttons and Previous/Next give control. All diagram text stays visible. Sequences pause when hidden/offscreen, and reduced-motion users get static manual steps with timed playback disabled. Focus numbering follows the diagram's reading order, not necessarily chronological events. Nothing in the walkthrough or either lab records reading, submits a quiz or marks an external project. The illustrations switch still gives an exact text-only rendering.

### Project Management and HR Analytics

Both new packs contain **8 modules, 24 lessons, 4 project blocks and a 12-hour capstone**. Each has five formative questions per lesson, ten advanced questions per module (**200 quiz items**), three companion slides per lesson (**72 slides**), worked examples, labs, journals, rubrics, certification policy and a facilitator guide. The 60 learning hours are 36 lesson hours (including labs) plus 12 project-block hours and 12 capstone hours; the institutional 90-minute final is scheduled separately.

- **VPM-101:** Agile, Scrum, planning, risks and Jira, with cost/schedule control, PMO reporting, vendor coordination and operations handover. Target roles: Project Coordinator, PMO Analyst and Operations Associate.
- **VHR-101:** Recruitment, HR metrics, dashboards and people analytics, with spreadsheet cleaning, workforce scenarios, survey/cohort interpretation and responsible evaluation. Target roles: HR Executive, HR Analyst and Talent Acquisition Associate.
- `resources/practice-data.md` provides copyable synthetic fixtures and calculation checkpoints; `resources/portfolio-templates.md` provides submission templates. No real personal data or paid tool is required.
- Public quiz banks and final-assessment practice cases are learning resources, not secure exam banks. Facilitators prepare an unseen final under the published blueprint and mark external projects separately.
- Platform reading/quiz certificate eligibility is distinct from the institutional award, which also requires marked projects, capstone, final assessment and applicable attendance/integrity checks.
- The app discovers both packs automatically. College/programme assignment is still required for visibility in the protected student catalog; no assignment or production deployment is performed by adding content.

### Project Management — illustrated edition (v1.1.0)

VPM-101 includes **117 inline visual explanations across all 24 lessons and 5 project briefs**. They cover every Core ideas subtopic and project section, with additional explanations, takeaways and revealable formative checks. Original lesson/project text, the 200 quiz items, 72 slides, rubrics and completion requirements are unchanged.

The course adds working-day timelines, dependency networks, a role-based RACI table, work boards with visible blockers/WIP policies, qualitative risk matrices and zero-based cost/capacity charts. Lesson **2.2** includes an interactive schedule sandbox: edit task durations, switch between timeline and network, inspect both CPM passes/float, apply one explicit shared-specialist order and reset. It distinguishes the four-task lesson (**8 days**) from the eight-task fixture (**14 days**, or **17** with B before C). The model uses finish-to-start dependencies, no lag and a day-zero working-day calendar; it is not a general resource optimiser or a promised launch date.

The new layer retains the course’s interpretation safeguards: rupee schedule variance is not days; ordinal risk scores are not probabilities; a mandatory defect cannot be averaged away by a high test-pass rate; theoretical service capacity is not a guarantee; and forecasts, simulated approvals and live results are different. Tables and wide networks scroll inside their own labelled keyboard-accessible regions on narrow screens. Illustrations remain optional, locally bundled and independently retryable.

## Pack layout

```
content/courses/<course-id>/
├── course.json                 # manifest: metadata, modules → topics, assessment scheme, toolkit
├── modules/<module-slug>/
│   ├── <n.n>-<lesson-slug>.md  # one lesson per topic
│   ├── quiz.json               # lesson MCQs + optional advanced module assessment
│   ├── slides.json             # optional in-app slide walkthroughs, keyed by topic id
│   └── illustrations.json      # optional inline visuals, keyed by topic id + exact heading
├── projects/*.md               # project-block and capstone briefs with rubrics
├── assessments/
│   ├── final-assessment-blueprint.md
│   ├── rubrics.md
│   └── certification-policy.md
└── facilitator-guide.md
```

### `course.json` essentials

- `id` (folder name), `code`, `title`, `totalHours`, `credits`, `durationWeeks`, `outcomes[]`, `prerequisites[]`.
- `modules[]`: `{ id: "m1", slug, title, hours, summary, topics[], assessment? }`. An assessment declares `title`, `passMark` and `questionCount`; its advanced bank lives beside the lesson quizzes.
- `topics[]`: `{ id: "m1-t1" | "m2-pb1" | "m6-cap", number: "1.1" | "PB1" | "CAP", title, type: "lesson" | "project", minutes, lesson: "<path relative to the pack>", summary }`.
- `assessment`: `{ passMark, conditions[], components[{ id, name, weight, description }], grades[] }` — component weights must sum to 100.
- `lessonQuizQuestionCount` optionally sets the exact lesson-bank size (defaults to **5** for existing packs). VGC-101 sets this to **15**.
- `finalAssessment.blueprint` and `documents.*` point to Markdown files in the pack.

The schema is defined in `src/shared/courses/types.ts`; `validateManifest()` in `src/shared/courses/courseModel.ts` reports structural problems (the app logs them in development).

### College visibility and progress

- `/courses` is the public preview and stores progress only in the current browser. `/student/courses` is the college-scoped learner experience and lists only courses assigned to that student's college and, when configured, programme.
- Assignments live in `colleges/{collegeId}/config/courses`. Missing assignments are hidden by default. Superadmins can configure any college; college admins, principals and HODs can configure their own college through the Course assignments panel. The panel supports programme targeting, start/due dates, student notes, audit metadata, progress summaries and copyable student URLs.
- Student progress syncs to `colleges/{collegeId}/courseProgress/{uid}__{courseId}` and remains cached in localStorage for offline use. Firestore rules provide the tenant boundary; course delivery does not require a Functions deployment.
- Deploy and test Firestore rules before enabling assignments in production. Keep the public preview URL separate from the assigned student URL.

### Quiz banks

`modules/<slug>/quiz.json`:

```json
{
  "moduleId": "m1",
  "questions": {
    "m1-t1": [
      { "id": "m1-t1-q1", "question": "…", "options": ["…", "…", "…", "…"], "answerIndex": 1, "explanation": "…" }
    ]
  }
}
```

The number of items per lesson topic must equal `course.json.lessonQuizQuestionCount` (five when omitted); project topics have no lesson quiz. If the module declares an assessment, `moduleAssessment` contains exactly its advanced scenario questions, with IDs `<moduleId>-assessment-q<N>`. Learners unlock it after reading every topic and submitting every lesson quiz; reaching its pass mark unlocks the next module.

### Lesson Markdown conventions

Lessons use a fixed structure so the renderer (`src/shared/components/courses/CourseMarkdown.tsx`) and learners get a consistent experience:

`# <number> <title>` → `> **Lesson plan** · N minutes — Read · Lab · Quiz` → `## Learning objectives` → `## Opening scenario` → `## Core ideas` (numbered `###` subsections) → `## Try it now` → `## Hands-on lab: … (N min)` with a **Deliverable** → `## Common mistakes` → `## Key takeaways` → `## Reflection journal` → `## Going further (optional)`.

Renderer notes: GFM tables and task lists are supported; fenced blocks with no language or `text` render as copyable **Prompt** cards; blockquotes whose leading bold text matches *plan/time/duration* render as teal call-outs, *warn/caution/careful/never/do not* as amber, others as indigo; only `http(s)` images; no raw HTML; a `>` continuation line inside a list item renders as italics (nested blockquotes in lists are not supported).

Style: ~1,200–1,500 words per lesson; version-agnostic tool names (product families, never model versions or prices); Indian and Karnataka examples; bilingual prompts welcome; every lab produces an artefact; every project brief includes an AI-use statement template.

### In-app slide walkthroughs

A module may include `slides.json` beside its quiz bank. The bank is keyed by lesson topic id and contains short, plain-language slides with a visual grouping (`cards`, `compare` or `flow`), explanation, everyday example and takeaway. Slides render inside the lesson player; they are a companion to the Markdown lesson, do not count as reading completion, and have no file-download option. Start with a small module pilot and add decks only when content has been reviewed for accuracy and accessibility.

### Inline illustrated explanations

Opt a pack in with `course.json.illustrations: { "title": "…", "description": "…" }` and add `modules/<slug>/illustrations.json` for **every module**, including its project topics. The shape is `{ moduleId, topics: { "m1-t1": { introduction, sections: [...] } } }`. Each section contains:

- `id`: unique lowercase slug; `section`: the **exact source heading**, including its number.
- `title`, `explanation`, `takeaway`, `caption`: plain-language teaching content. This is additional explanation, not a replacement for the reading.
- `diagram`: one of `flow`, `compare`, `cycle`, `hub`, `bars`, `funnel`, `matrix`, `schedule`, `board`, `raci`, `prompt`, `workforce`. Most kinds have 2–6 labelled items with explanatory details; a schedule supports 2–12 tasks. See `src/shared/courses/illustrationTypes.ts` and the four bundled course banks for examples.
- Optional `checkpoint: { question, answer }`; at least one is required per topic.
- Optional `walkthrough: true`: add the learner-started focus sequence. Omit it for an unchanged static visual. Do not add autoplay or completion dependencies.

An illustrated pack must cover every `###` within **Core ideas** in a lesson and every `##` in a project brief, in source order. The renderer inserts each figure **after the complete original section**. Do not edit the Markdown to add images or duplicate the explanation. If a source heading changes, update its mapping; validation rejects missing, duplicate or orphaned mappings.

Numeric charts need finite, non-negative values, explicit units and a caption identifying synthetic/illustrative data. Bar charts use a zero baseline; funnel widths are explicitly schematic. Matrices require labelled axes and four row-major cells. An interactive funnel has exactly four positive initial counts; forecasts retain fractional expected values, and CPA is undefined when customers are zero. Conceptual illustrations are not current platform screenshots, legal advice, secure exams or new rubric requirements.

Project-specific schemas add these checks:

- `schedule`: `unit: "working days"`; tasks have a unique `id`, positive whole-day `duration` (1–60), `predecessors[]`, label and detail. Dependencies must reference known tasks and form a DAG. `view` is `timeline` or `network`; optional `interactive: true` uses 1–20-day sliders. An optional `{ before, after, label }` resource constraint adds the explicit order without mutating the source; cyclic orders are rejected. Captions must label the numeric model synthetic/illustrative. Both forward and backward passes are calculated, including multiple critical branches and total float. The resource switch models only that stated precedence, not general resource levelling.
- `board`: each column has label/detail and 0–12 cards with unique `id`, label/detail and optional boolean `blocked`; an optional positive `wipLimit` describes active work. Explicitly `complete` columns are excluded from the example’s WIP boundary and do not have active WIP limits. Blocked cards still count. Use a clearly labelled classroom policy rather than implying a live Jira configuration or individual productivity ranking.
- `raci`: 2–6 distinct `roles`; each row has label/detail and a matching `assignments[]` of `R`, `A`, `C`, `I`, `RA` or `—`. Each deliverable needs exactly one accountable and at least one responsible role (`RA` satisfies both). Label proposals as illustrative agreements, not real appointments.

Local-lab schemas also stay plain data:

- `prompt`: exactly six distinctly labelled items, each with a non-empty `example` as well as label/detail. Examples are assembled in source order only for selected parts. The displayed inclusion count is not output evaluation or a quality guarantee.
- `workforce`: exactly four labelled stages (opening, joiners, leavers, closing) and a `scenario` with exactly `opening`, `joiners`, `openingLeavers`, `joinerLeavers`. Each is a whole 0–200 count; cohort exits must not exceed the matching opening or joining population. The model allows one entry/exit per person, no rehires/transfers, and one synthetic period. Closing = opening + joiners − all exits; turnover uses all exits / approximate average headcount; retention uses remaining opening members / opening. Never silently replace undefined rates with zero or interpret these demonstrations as individual employment scores.

Only the asset URLs enter the catalog. The app fetches and validates the current module's JSON on demand, caches successful loads and offers retry without blocking the original reading. Assets are bundled locally, require no image service, and production assets use the existing `/assets/` PWA runtime cache after a successful visit. Public and assigned-student routes use the same visual renderer; visibility and progress permissions are unchanged.

## Adding or changing a pack

1. Create the folder and `course.json`; add lessons and quiz banks following the conventions above.
2. The app discovers packs automatically via `import.meta.glob` in `src/shared/courses/courseCatalog.ts` — no code change needed for a new pack.
3. Run the checks:
   - `npm run validate:courses` — manifest paths, quiz banks, weights, visual schema and exact source-heading coverage.
   - `npm run test:unit` — includes course models, exact four-pack visual coverage, malformed-bank safeguards, funnel/workforce arithmetic, prompt assembly, both CPM passes/resource scenarios, board counts and RACI invariants.
   - `npm run test:render:courses` — renders the catalog, overview, lesson and quizzes; discovers every illustrated pack, sweeps all **633 illustrations across 135 topics**, and compares each topic's original DOM exactly after removing the additive figures. It also checks both public/student route families and interactive calculations.
   - `npx playwright test e2e/course-illustrations.spec.ts --workers 2` — public-preview desktop/mobile flows for all four illustrated courses: keyboard controls, optional animation and reduced motion, prompt/workforce/schedule/funnel scenarios, charts, boards, RACI, original completion/quiz behaviour, navigation, network retry and scoped light/dark WCAG checks. These checks are not whole-app accessibility certification or a live authenticated/backend acceptance test. Requires Playwright Chromium.
4. Bump `version` and `lastReviewed` in `course.json`; note the change in the facilitator guide if it affects delivery.

## Maintenance cadence

Before each cohort: tool-landscape check (facilitator guide §6), legal-update check (DPDP commencement stages, IT Rules on synthetic media, EU AI Act deadlines), quiz item review, and a read-through of any lesson older than 12 months.
