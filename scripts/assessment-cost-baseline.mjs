#!/usr/bin/env node
/**
 * Phase 0 assessment cost baseline.
 *
 * This is a deterministic pre-emulator fixture: it makes the assumptions
 * explicit and produces comparable 50/200/1,000-student scenarios. Replace
 * the rates with emulator counters or production export data before rollout.
 */
const students = [50, 200, 1000]
const durationMinutes = 60
const questions = 50
const oldAutosaves = durationMinutes * 60 / 15
const oldReadsPerAutosave = 55
const oldWritesPerAutosave = 1
const oldInvocationsPerAutosave = 1
const proctorEventsPerStudent = 30
const oldReadsPerProctorEvent = 3
const oldWritesPerProctorEvent = 1
const startSubmitReads = 120
const startSubmitWrites = 2
const startSubmitInvocations = 2

// Nominal optimized fixture: a 3-second debounce coalesces answer activity
// into ten dirty flushes, while the 60-second tick remains a safety ceiling.
// Proctor events travel in those batches; no extra read is needed for them.
const optimizedAutosaves = 10
const optimizedReadsPerAutosave = 3
const optimizedWritesPerAutosave = 1
const optimizedInvocationsPerAutosave = 1
const optimizedBatchLogWrites = 10

function row(count) {
  const old = {
    reads: count * (oldAutosaves * oldReadsPerAutosave + proctorEventsPerStudent * oldReadsPerProctorEvent + startSubmitReads),
    writes: count * (oldAutosaves * oldWritesPerAutosave + proctorEventsPerStudent * oldWritesPerProctorEvent + startSubmitWrites),
    invocations: count * (oldAutosaves * oldInvocationsPerAutosave + proctorEventsPerStudent + startSubmitInvocations),
  }
  const optimized = {
    reads: count * (optimizedAutosaves * optimizedReadsPerAutosave + startSubmitReads),
    writes: count * (optimizedAutosaves * optimizedWritesPerAutosave + optimizedBatchLogWrites + startSubmitWrites),
    invocations: count * (optimizedAutosaves + startSubmitInvocations),
  }
  return { students: count, old, optimized, readReduction: 1 - optimized.reads / old.reads, writeReduction: 1 - optimized.writes / old.writes }
}

const result = {
  generatedAt: new Date().toISOString(),
  status: 'fixture-estimate-not-emulator-measurement',
  scenario: { durationMinutes, questions, oldAutosaveSeconds: 15, optimizedSafetySeconds: 60, debounceSeconds: 3, proctorEventsPerStudent },
  assumptions: { oldReadsPerAutosave, oldWritesPerAutosave, oldReadsPerProctorEvent, oldWritesPerProctorEvent, startSubmitReads, startSubmitWrites, optimizedAutosaves, optimizedReadsPerAutosave, optimizedWritesPerAutosave, optimizedBatchLogWrites },
  scenarios: students.map(row),
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2))
} else {
  console.log('Phase 0 assessment cost baseline (deterministic fixture estimate)')
  console.log('Not a production measurement; run emulator/load fixtures before rollout.\n')
  console.table(result.scenarios.map(({ students: count, old, optimized, readReduction, writeReduction }) => ({
    students: count,
    oldReads: old.reads,
    optimizedReads: optimized.reads,
    oldWrites: old.writes,
    optimizedWrites: optimized.writes,
    oldInvocations: old.invocations,
    optimizedInvocations: optimized.invocations,
    readReduction: `${(readReduction * 100).toFixed(1)}%`,
    writeReduction: `${(writeReduction * 100).toFixed(1)}%`,
  })))
}
