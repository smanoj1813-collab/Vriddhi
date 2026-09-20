# Phase 0 assessment cost results

Date: 2026-09-19
Environment: Firebase Emulator Suite, project `demo-vriddhi-assessment`, Node 22.23.2
Runner: `scripts/assessment-emulator-run.mjs`

## Results

The callable load runner completed with zero errors at every required size.
The cost trace is test-only and reports the known Firestore operation paths in
the callable implementation; it is not a production billing export.

| Students | Reads | Writes | Invocations | Errors |
|---:|---:|---:|---:|---:|
| 50 | 4,150 | 702 | 650 | 0 |
| 200 | 16,600 | 2,802 | 2,600 | 0 |
| 1,000 | 83,000 | 14,002 | 13,000 | 0 |

## 200-student gate

The target for a 200-student, 50-question, 60-minute exam is approximately
60,000–80,000 reads and fewer than 10,000 writes. The traced emulator result
was 16,600 reads and 2,802 writes, so the current optimized path passes the
Phase 0 cost gate under the fixture workload.

## Operation breakdown

For 200 students:

| Operation | Reads | Writes |
|---|---:|---:|
| Start | 11,000 | 402 |
| Active/resume with frozen chunks | 1,200 | 0 |
| Indexed autosave | 4,400 | 2,400 |
| **Total** | **16,600** | **2,802** |

The 1,000-student run completed successfully but produced 14,002 writes. This
is above the 10,000-write reference used for the 200-student gate and should be
kept as a scale-watch result. The fixture sends ten dirty autosaves per student
and one ordinary proctor batch summary, so the result is sensitive to workload
shape.

## Hardening fixture result

The legacy/submission fixture also passed with zero errors:

- full-answer legacy autosave;
- high-severity direct proctor event;
- authoritative submission;
- objective score preservation;
- finalized attempt status.

The academic context fixture passed separately for student, faculty and paper
contexts, including cohort filtering, submitted-assignment exclusion, attendance
calculation and unapproved-question exclusion.

## Remaining production gate

Before enabling Phase 1/2 features for real users:

1. Preserve the callable optimization deployment.
2. Run a controlled canary exam in the real Firebase project.
3. Compare Firestore usage by `collegeId`, `testId` and operation.
4. Confirm no answer loss and no grading drift.
5. Keep the feature flags disabled until the canary confirms the emulator result.
