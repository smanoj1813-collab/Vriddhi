# Course packs

Self-contained learning programmes rendered by the Vriddhi app under **Courses** (`/courses` public catalog, `/student/courses` inside the student portal). Each pack is a folder with a JSON manifest, Markdown lessons, per-module quiz banks, project briefs and assessment documents — plain files that can be reviewed in pull requests, versioned, and reused outside the app.

## Available packs

| Folder | Code | Title | Hours |
| --- | --- | --- | --- |
| `genai-certification/` | VGC-101 | GenAI for Career Impact — Certificate Program | 60 |
| `digital-marketing/` | VDM-101 | Digital Marketing — Certificate Program | 52 |
| `project-management/` | VPM-101 | Project Management — Certificate Program | 60 |
| `hr-analytics/` | VHR-101 | HR Analytics — Certificate Program | 60 |

### Project Management and HR Analytics

Both new packs contain **8 modules, 24 lessons, 4 project blocks and a 12-hour capstone**. Each has five formative questions per lesson, ten advanced questions per module (**200 quiz items**), three companion slides per lesson (**72 slides**), worked examples, labs, journals, rubrics, certification policy and a facilitator guide. The 60 learning hours are 36 lesson hours (including labs) plus 12 project-block hours and 12 capstone hours; the institutional 90-minute final is scheduled separately.

- **VPM-101:** Agile, Scrum, planning, risks and Jira, with cost/schedule control, PMO reporting, vendor coordination and operations handover. Target roles: Project Coordinator, PMO Analyst and Operations Associate.
- **VHR-101:** Recruitment, HR metrics, dashboards and people analytics, with spreadsheet cleaning, workforce scenarios, survey/cohort interpretation and responsible evaluation. Target roles: HR Executive, HR Analyst and Talent Acquisition Associate.
- `resources/practice-data.md` provides copyable synthetic fixtures and calculation checkpoints; `resources/portfolio-templates.md` provides submission templates. No real personal data or paid tool is required.
- Public quiz banks and final-assessment practice cases are learning resources, not secure exam banks. Facilitators prepare an unseen final under the published blueprint and mark external projects separately.
- Platform reading/quiz certificate eligibility is distinct from the institutional award, which also requires marked projects, capstone, final assessment and applicable attendance/integrity checks.
- The app discovers both packs automatically. College/programme assignment is still required for visibility in the protected student catalog; no assignment or production deployment is performed by adding content.

## Pack layout

```
content/courses/<course-id>/
├── course.json                 # manifest: metadata, modules → topics, assessment scheme, toolkit
├── modules/<module-slug>/
│   ├── <n.n>-<lesson-slug>.md  # one lesson per topic
│   ├── quiz.json               # lesson MCQs + optional advanced module assessment
│   └── slides.json             # optional in-app visual walkthroughs, keyed by topic id
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

## Adding or changing a pack

1. Create the folder and `course.json`; add lessons and quiz banks following the conventions above.
2. The app discovers packs automatically via `import.meta.glob` in `src/shared/courses/courseCatalog.ts` — no code change needed for a new pack.
3. Run the checks:
   - `npm run validate:courses` — every manifest path exists, quiz IDs/answer indices are valid, declared question counts and advanced module banks match, and weights sum to 100.
   - `npm run test:unit` — includes `courseModel.test.ts`.
   - `npm run test:render:courses` — renders the catalog, overview, lesson and quiz pages in jsdom.
4. Bump `version` and `lastReviewed` in `course.json`; note the change in the facilitator guide if it affects delivery.

## Maintenance cadence

Before each cohort: tool-landscape check (facilitator guide §6), legal-update check (DPDP commencement stages, IT Rules on synthetic media, EU AI Act deadlines), quiz item review, and a read-through of any lesson older than 12 months.
