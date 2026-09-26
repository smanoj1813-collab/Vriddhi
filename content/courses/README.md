# Course packs

Self-contained learning programmes rendered by the Vriddhi app under **Courses** (`/courses` public catalog, `/student/courses` inside the student portal). Each pack is a folder with a JSON manifest, Markdown lessons, per-module quiz banks, project briefs and assessment documents — plain files that can be reviewed in pull requests, versioned, and reused outside the app.

## Available packs

| Folder | Code | Title | Hours |
| --- | --- | --- | --- |
| `genai-certification/` | VGC-101 | GenAI for Career Impact — Certificate Program | 60 |

## Pack layout

```
content/courses/<course-id>/
├── course.json                 # manifest: metadata, modules → topics, assessment scheme, toolkit
├── modules/<module-slug>/
│   ├── <n.n>-<lesson-slug>.md  # one lesson per topic
│   └── quiz.json               # 5 MCQs per lesson topic in that module
├── projects/*.md               # project-block and capstone briefs with rubrics
├── assessments/
│   ├── final-assessment-blueprint.md
│   ├── rubrics.md
│   └── certification-policy.md
└── facilitator-guide.md
```

### `course.json` essentials

- `id` (folder name), `code`, `title`, `totalHours`, `credits`, `durationWeeks`, `outcomes[]`, `prerequisites[]`.
- `modules[]`: `{ id: "m1", slug, title, hours, summary, topics[] }`.
- `topics[]`: `{ id: "m1-t1" | "m2-pb1" | "m6-cap", number: "1.1" | "PB1" | "CAP", title, type: "lesson" | "project", minutes, lesson: "<path relative to the pack>", summary }`.
- `assessment`: `{ passMark, conditions[], components[{ id, name, weight, description }], grades[] }` — component weights must sum to 100.
- `finalAssessment.blueprint` and `documents.*` point to Markdown files in the pack.

The schema is defined in `src/shared/courses/types.ts`; `validateManifest()` in `src/shared/courses/courseModel.ts` reports structural problems (the app logs them in development).

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

Five items per lesson topic; project topics have no quiz (the app shows a rubric notice instead).

### Lesson Markdown conventions

Lessons use a fixed structure so the renderer (`src/shared/components/courses/CourseMarkdown.tsx`) and learners get a consistent experience:

`# <number> <title>` → `> **Lesson plan** · N minutes — Read · Lab · Quiz` → `## Learning objectives` → `## Opening scenario` → `## Core ideas` (numbered `###` subsections) → `## Try it now` → `## Hands-on lab: … (N min)` with a **Deliverable** → `## Common mistakes` → `## Key takeaways` → `## Reflection journal` → `## Going further (optional)`.

Renderer notes: GFM tables and task lists are supported; fenced blocks with no language or `text` render as copyable **Prompt** cards; blockquotes whose leading bold text matches *plan/time/duration* render as teal call-outs, *warn/caution/careful/never/do not* as amber, others as indigo; only `http(s)` images; no raw HTML; a `>` continuation line inside a list item renders as italics (nested blockquotes in lists are not supported).

Style: ~1,200–1,500 words per lesson; version-agnostic tool names (product families, never model versions or prices); Indian and Karnataka examples; bilingual prompts welcome; every lab produces an artefact; every project brief includes an AI-use statement template.

## Adding or changing a pack

1. Create the folder and `course.json`; add lessons and quiz banks following the conventions above.
2. The app discovers packs automatically via `import.meta.glob` in `src/shared/courses/courseCatalog.ts` — no code change needed for a new pack.
3. Run the checks:
   - `npm run validate:courses` — every manifest path exists, quiz ids/answer indices are valid, five MCQs per lesson topic, weights sum to 100.
   - `npm run test:unit` — includes `courseModel.test.ts`.
   - `npm run test:render:courses` — renders the catalog, overview, lesson and quiz pages in jsdom.
4. Bump `version` and `lastReviewed` in `course.json`; note the change in the facilitator guide if it affects delivery.

## Maintenance cadence

Before each cohort: tool-landscape check (facilitator guide §6), legal-update check (DPDP commencement stages, IT Rules on synthetic media, EU AI Act deadlines), quiz item review, and a read-through of any lesson older than 12 months.
