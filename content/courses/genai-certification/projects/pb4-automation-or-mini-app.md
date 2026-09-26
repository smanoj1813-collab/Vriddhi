# Project Block 4 — Working Automation or Mini-App

> **Project plan** · 120 minutes guided + 4–5 hours independent work · Submit by the end of Week 7 · Weight: 7% of the final grade

## The brief

Solve a **real, small, recurring problem** for a college unit, club, department, NGO or small business by building either:

- **Option A — an automation** with at least one AI step, an error handler and a human checkpoint (Lesson 5.3), or
- **Option B — a no-code app** with roles, a status workflow and one AI feature (Lesson 5.5),

justified by a process map, scorecard and return estimate (Lesson 5.4), tested with real users, and documented for hand-over.

Working in pairs is allowed; each member's contribution must be identifiable in the build log.

## What to submit

1. **Problem statement and process map** — who has the problem, the current process (swimlane map with times, waits, errors), what you observed or whom you interviewed.
2. **Scorecard and justification** — scores for at least two candidate tasks; why you chose this one; the human-in-the-loop pattern and where the checkpoint sits.
3. **Design** — the automation design card (Option A) or data design + screen sketches + user flows (Option B); the AI step/feature prompt with fallback behaviour; data-flow note (what personal data goes where).
4. **The working build** — a link or access, plus screenshots; test data addressed only to yourselves for anything that sends messages.
5. **Test log** — at least eight test cases (normal, edge, failure) with results and fixes; for Option B, notes from two real users doing three tasks.
6. **Return estimate** — minutes saved per month, error reduction, cost, payback; conservative and explained.
7. **Hand-over document (1 page)** — purpose, how it works, owner, how to pause/kill it, how to update the prompt or add users, privacy notice text, retirement rule.
8. **Demo video (2–3 minutes)** — the problem in 20 seconds, the build in action, one failure handled, what you would do next.
9. **Reflection (250 words)** — what broke, what you learned about the people in the process, what a developer would do differently.
10. **AI-use statement** on the cover.

## Constraints

- Real problem, real stakeholder (named, with their permission).
- No personal data sent to an AI step unless necessary, minimised and disclosed in the data-flow note.
- Nothing auto-sends to real people until the test log shows the checkpoint works; no auto-publishing.
- An error handler (Option A) or a sensible failure state (Option B) must be demonstrated in the video.
- Free tiers only; if the build hits a limit, document it — that is a legitimate finding.

## Process (suggested)

| When | Do |
| --- | --- |
| Week 6, session 2 | Choose stakeholder; observe or interview; map; scorecard. |
| Week 7, session 1 | Design card / data design reviewed by a peer; build core flow. |
| Week 7, session 2 (guided) | Build AI step/feature, error handling; tests; demo recording. |
| Week 7, self-study | User test; fixes; hand-over doc; return estimate; submit. |

## Rubric (7 marks)

| Criterion | 0–1 | 2 | 3 |
| --- | --- | --- | --- |
| **It works and is safe** (3) | Does not run; sends to real people untested; no error handling; data exposed. | Core flow works; error handling or checkpoint partly present. | Works end to end; error handler and human checkpoint demonstrated; data minimised; kill switch documented. |
| **Problem fit and justification** (2) | No real stakeholder; no map; scorecard missing or generous. | Map and scorecard present; return roughly estimated. | Observed process; honest scorecard; conservative, explained return; correct human-in-the-loop pattern. |
| **Testing and hand-over** (1) | No test log or hand-over. | Tests present; hand-over thin. | Eight-plus cases incl. failures; user test notes; complete hand-over with privacy notice and retirement rule. |
| **Demo and reflection** (1) | Missing. | Demo shows the build; reflection generic. | Demo shows problem, build, failure handling, next step; reflection specific about people and limits. |

**Pass threshold for this block:** 3.5 / 7. Builds that message real people during testing without a checkpoint, or send personal data to an AI step without justification, cap the block at 3.

## Tips from previous cohorts

- The best projects solved a problem the stakeholder complained about *unprompted*.
- Build the error handler first. It is the part you will forget under time pressure.
- Record the demo on a fresh run, not a rehearsed one, and keep the failure in.
- If your pair split is "one built, one wrote", say so and explain what each learned — markers respect honesty over symmetry.

## AI-use statement template

> *AI-use statement: The process map and proposal were drafted with [tool] from our observations and edited by us. The [automation/app] was built in [platform]; the AI step uses [model/platform] with the prompt shown in the design. Test data was ours. [Name] built X; [Name] built Y. The stakeholder [name/role] consented to this project and has reviewed the hand-over document.*
