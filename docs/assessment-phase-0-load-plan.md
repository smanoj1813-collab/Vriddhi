# Phase 0 assessment cost load plan

## Purpose

Measure the assessment conduction path before enabling the academic intelligence
features. The target remains approximately 60,000–80,000 reads and fewer than
10,000 writes for a 200-student, 50-question, 60-minute exam.

## Local fixture

Run the deterministic operation-level fixture:

```bash
npm run assessment:load-fixture
npm run assessment:load-fixture -- --students 200 --output artifacts/assessment-200.json
```

It produces scenarios for 50, 200 and 1,000 students by default and records
reads, writes, invocations and operation categories. It is intentionally marked
as a fixture estimate: callable-internal Firestore reads are not available from
the emulator's HTTP response, so the next measurement step must instrument the
callable path or compare Firestore emulator request logs with the fixture trace.

## Callable emulator runner

With the Auth, Firestore and Functions emulators running, the disposable runner
seeds a 50-question test and synthetic Auth/Firestore student records, then
invokes start, active-test load and ten indexed delta autosaves per student:

```bash
npm run assessment:emulator -- --students 10
npm run assessment:emulator -- --students 50
npm run assessment:emulator -- --students 200
npm run assessment:emulator -- --students 1000
```

It writes an `artifacts/phase0-*.json` report and never targets production. The
runner reports callable success/error counts; Firestore internal read counts
still require emulator request-log/tracer collection described below.

## Emulator measurement gate

Before rollout, run the fixture against a disposable Firebase emulator project
with synthetic data and collect:

| Scenario | Required result |
|---|---|
| 50 students | operation counts and errors recorded |
| 200 students | 60K–80K reads, under 10K writes preferred |
| 1,000 students | no unbounded collection scans or function failures |

The test must cover start, resume, dirty delta autosave, clean safety tick,
ordinary batched proctor events, high-severity immediate events and final
submission. Legacy attempts without `answerIndex` or frozen chunks must also be
included to confirm fallback behavior.

Do not treat the nominal fixture numbers as billing evidence. Production rollout
requires a canary exam and monitoring grouped by `collegeId`, `testId` and
operation type.
