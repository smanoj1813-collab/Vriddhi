# PB1 Project Block 1 — HR data quality and definitions

> **Project plan** · 180 minutes — 3-hour applied portfolio block, including checks and peer review.

## The brief

Create a clean, reproducible synthetic HR workbook with a metric dictionary, quality log and reconciled baseline summaries.

Use the applications and workforce records supplied in resources/practice-data.md. Copy the raw data before cleaning. Add a clearly labelled practice copy containing an exact duplicate, a missing category and an impossible event date; do not silently change the original fixture.

The project is designed for an individual submission. Pairs may discuss methods and review each other’s work, but every learner submits an attributable artefact and can reproduce the central calculations or decisions independently. The facilitator may permit a shared capstone with individual contribution records and defences; shared work does not remove individual assessment.

## Inputs and working boundaries

Use `resources/practice-data.md`, the lesson worked examples and the artefacts from earlier blocks. When fixtures have different populations or periods, keep them separate and label their provenance. If you change an input for a scenario, retain the original and record the new assumption. Do not describe a simulated approval, interview, test or business result as something that happened in a live organisation.

No paid software, real client, real employee dataset or production account is required. A spreadsheet, document and presentation are sufficient. If using Jira or an optional BI tool, use a sandbox and synthetic records. Screenshots must not expose account details or other people’s information. The quality of the reasoning and evidence is graded, not access to a premium feature.

## Work plan

| Activity | Minutes |
| --- | --- |
| Frame the brief and inspect the inputs | 20 |
| Build the required artefacts | 80 |
| Reproduce calculations and review decisions | 35 |
| Peer review and revise | 30 |
| Write the recommendation and AI-use statement | 15 |

Work in short checkpoints. At the end of the build phase, ask whether another person could reproduce your headline result. At the end of review, check whether the recommendation still follows from the corrected evidence. Reserve time for revision; a first draft without checking is not a finished professional artefact.

## What to submit

1. Raw and cleaned tabs with row-grain and unique-key definitions.
2. Data dictionary for at least eight fields and four metrics, including period and inclusion rules.
3. Cleaning log showing duplicate, missing-value and impossible-date handling.
4. Formula or pivot summary with at least two hand-checked metrics and total reconciliation.
5. Privacy/access note and a limitations paragraph explaining what remains unknown.

Include an evidence index with filename, version, purpose and the claim it supports. Submit editable working files through the institution-approved channel and an accessible summary for the marker. The public portfolio copy should contain only safe synthetic or aggregate material. The app records reading and quiz progress; it does not collect, verify or mark these external project files automatically.

## Acceptance and self-check

- Cleaning preserves provenance and does not invent missing facts.
- Metric definitions and denominators are reproducible.
- Summary values reconcile and the publication layer is safe.

**Calculation or decision checkpoint:** The base application fixture has 24 distinct applications, 12 per source, with 12 offers, 9 acceptances and 7 joins. The source is a mature synthetic cohort, not a list of real candidates.

Use the checkpoint to verify the method, not as a substitute for showing your work. A correct final number with no traceable inputs earns less than a transparent analysis that identifies and corrects an error. If your assumptions differ, explain why and show how the result changes. Do not overwrite the published fixture to make a target easier to meet.

## Rubric

This block is marked out of 7: correctness and reproducibility 3; professional judgement and safeguards 2; clarity, evidence and reflection 2. Four blocks contribute 28 marks overall.

Use `assessments/rubrics.md` for performance anchors and moderation. Technical correctness includes the topic-specific criteria above. Professional judgement includes honest provenance, uncertainty, appropriate authority and safe sharing. No marks are awarded for an unsupported claim simply because it sounds commercially impressive. Tool substitutions are acceptable when the same evidence can be inspected.

## Review questions

- Which claim is most important to the decision, and where can the reviewer reproduce it?
- What assumption or missing record could reverse your recommendation?
- Which action requires someone else’s approval, and how have you represented that boundary?
- What did peer review change? Keep the comment and your response in the change log.
- Which evidence can safely appear in a public portfolio, and which should remain in the restricted submission?

## AI-use statement

Copy and complete this statement even if you did not use AI:

```text
Tools used, or “none”:
Tasks for which assistance was used:
Inputs shared (synthetic only; no real personal or confidential data):
Suggestions accepted, changed or rejected:
Calculations, facts and source references I independently checked:
My own contribution and responsibility for the final work:
```

AI may help draft wording, suggest checks or rehearse a presentation. It must not fabricate evidence, approvals, sources, results or personal experience. You remain responsible for every submitted number and claim. Do not upload real HR, student, vendor or credential data to public AI systems. Follow the final-assessment restrictions separately; permission to use tools on a project does not imply permission during the exam.

## Optional extension

Add a deliberately unmatched lookup key and demonstrate how the quality check catches it without turning the error into zero.

The extension is not required for full marks. Complete the core evidence and safeguards first; extra complexity that cannot be explained or reproduced does not improve the submission.
