#!/usr/bin/env node
/**
 * Phase 0 load fixture. This produces operation-level traces for the three
 * rollout sizes without contacting production. Set FIRESTORE_EMULATOR_HOST
 * and --emulator for local orchestration in a later harness; counters remain
 * explicit because Firestore does not expose per-callable read counts through
 * its REST API.
 */
import { mkdir, writeFile } from 'node:fs/promises'

const args = new Set(process.argv.slice(2))
const valueAfter = (flag, fallback) => {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? Number(process.argv[index + 1]) : fallback
}
const requested = valueAfter('--students', 0)
const cohorts = requested > 0 ? [requested] : [50, 200, 1000]
const durationMinutes = 60
const questions = 50
const answerBursts = 10
const proctorEvents = 30
const output = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : 'artifacts/assessment-phase-0-load.json'

function operation(kind, path, reads = 0, writes = 0) {
  return { kind, path, reads, writes, invocations: 1 }
}

function run(students) {
  const legacy = []
  const optimized = []
  for (let student = 0; student < students; student += 1) {
    for (let tick = 0; tick < durationMinutes * 60 / 15; tick += 1) {
      legacy.push(operation('autosave', `studentAssessments/attempt-${student}`, 55, 1))
    }
    for (let event = 0; event < proctorEvents; event += 1) {
      legacy.push(operation('proctor-event', `proctoringLogs/event-${student}-${event}`, 3, 1))
    }
    legacy.push(operation('start-submit', `studentAssessments/attempt-${student}`, 120, 2))

    // One indexed attempt read plus transaction read/write. Events are included
    // in the same flush and produce one bounded summary write per flush.
    for (let burst = 0; burst < answerBursts; burst += 1) {
      optimized.push(operation('indexed-autosave', `studentAssessments/attempt-${student}`, 3, 2))
    }
    optimized.push(operation('start-resume-submit', `studentAssessments/attempt-${student}`, 8, 2))
  }
  const totals = (items) => items.reduce((sum, item) => ({
    reads: sum.reads + item.reads,
    writes: sum.writes + item.writes,
    invocations: sum.invocations + item.invocations,
  }), { reads: 0, writes: 0, invocations: 0 })
  const old = totals(legacy)
  const fast = totals(optimized)
  return {
    students,
    old,
    optimized: fast,
    readReduction: 1 - fast.reads / old.reads,
    writeReduction: 1 - fast.writes / old.writes,
    invocationReduction: 1 - fast.invocations / old.invocations,
    operationCounts: {
      oldAutosaves: students * durationMinutes * 60 / 15,
      oldProctorEvents: students * proctorEvents,
      indexedAutosaves: students * answerBursts,
      indexedSummaryWrites: students * answerBursts,
    },
  }
}

const report = {
  status: 'local-load-fixture-estimate',
  generatedAt: new Date().toISOString(),
  emulatorHost: process.env.FIRESTORE_EMULATOR_HOST || null,
  assumptions: { durationMinutes, questions, answerBursts, proctorEvents, debounceSeconds: 3, safetySeconds: 60 },
  scenarios: cohorts.map(run),
}

if (output) {
  await mkdir(output.substring(0, output.lastIndexOf('/')) || '.', { recursive: true })
  await writeFile(output, JSON.stringify(report, null, 2))
}
console.log(JSON.stringify(report, null, 2))
