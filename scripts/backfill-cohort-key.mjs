#!/usr/bin/env node
/**
 * Backfill the derived `cohortKey` on existing student documents.
 *
 * WHY
 * New imports stamp `cohortKey` (see functions/src/cohortKey.ts), but every
 * student imported before that has none. Nothing reads the key yet, so this is
 * still a no-op behaviourally — it exists so the matchers can START reading it
 * without dropping every existing student out of their classes. Switching the
 * matchers on before this has run would be strictly worse than the bug it
 * fixes.
 *
 * THE KEY IS DERIVED, NOT INVENTED
 * The key is computed by the SAME pure function the writers use
 * (src/shared/utils/cohortKey.ts), from the fields already on the document.
 * So a backfilled row and a re-imported row produce byte-identical keys for the
 * same class — that equality is the whole point, and it is asserted in
 * functions/test/cohortKey.test.ts.
 *
 * WHAT IS WRITTEN
 *   `cohortKey` — always, when the row yields one
 *   `cohortKeyIncomplete` — true when the row is missing a field the key needs
 *   `cohortKeyBackfilledAt` — ISO timestamp, so a later run can be told apart
 *
 * An INCOMPLETE row (no batch, or a semester the college does not run) is
 * written WITHOUT `cohortKey` and flagged instead. Storing a key with a blank
 * segment would collide two genuinely different cohorts — a missing batch would
 * merge every intake — which is worse than having no key at all. Those rows are
 * listed so the operator can fix the data; the matchers keep using the field
 * comparison for them.
 *
 * USAGE
 *   node scripts/backfill-cohort-key.mjs                         # dry run, all colleges
 *   node scripts/backfill-cohort-key.mjs --college vriddhi-demo   # dry run, one college
 *   node scripts/backfill-cohort-key.mjs --college X --apply      # write
 *   node scripts/backfill-cohort-key.mjs --limit 50               # cap the scan
 *   node scripts/backfill-cohort-key.mjs --recompute              # rewrite existing keys
 *
 * FLAGS
 *   --project <id>            Firebase project (default vriddhi-academic)
 *   --service-account <path>  service-account JSON (else ADC / env var)
 *   --college <id>            limit to one college (repeatable)
 *   --limit <n>               stop after n student documents
 *   --apply                   write (default: read-only dry run)
 *   --recompute               recompute and overwrite rows that already have a key
 *   --show <n>                print this many sample keys (default 10)
 *
 * SAFETY
 *   - Read-only unless --apply.
 *   - Never deletes a field, never touches Auth, never touches any collection
 *     other than `students` and the `colleges/{id}/students` mirror.
 *   - Skips rows that already carry a key unless --recompute.
 *   - Batched writes (<=400 per batch; Firestore's limit is 500).
 */

import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')

/**
 * Load firebase-admin in a way that works across its two module shapes.
 *
 * firebase-admin v14 is ESM-first: `require('firebase-admin')` returns the app
 * module WITHOUT `.credential`/`.firestore` (those moved to
 * `firebase-admin/app` and `firebase-admin/firestore`). Older v11/v12 builds
 * expose the legacy aggregate with `admin.credential.cert()` and
 * `admin.firestore()`. Both are supported so this script does not silently
 * break on whichever version the machine happens to have — the sibling
 * backfill-department.mjs breaks on v14 for exactly this reason.
 */
function loadAdmin() {
  const roots = ['firebase-admin', '../functions/node_modules/firebase-admin', '../node_modules/firebase-admin']
  for (const candidate of roots) {
    const root = candidate.startsWith('.') ? path.join(here, candidate) : candidate
    try {
      const mod = require(root)
      // Legacy aggregate: admin.credential.cert(...) / admin.firestore()
      if (mod.credential && typeof mod.firestore === 'function') {
        return { kind: 'legacy', admin: mod }
      }
      // v14 modular: app + firestore subpath.
      if (typeof mod.initializeApp === 'function' && typeof mod.cert === 'function') {
        const firestoreMod = require(root + '/firestore')
        return {
          kind: 'modular',
          admin: mod,
          getFirestore: firestoreMod.getFirestore,
        }
      }
    } catch {
      /* try the next location */
    }
  }
  console.error(
    'firebase-admin not found. Install it (npm i --no-save firebase-admin) or run this from the repo root.',
  )
  process.exit(1)
}

/**
 * The cohort helpers live in TypeScript under src/. They are pure (no
 * Firestore, no clock), so the same file the app and the tests use is loaded
 * here through tsx rather than re-implemented — a second copy of the rule is
 * exactly the drift this whole change exists to remove.
 */
async function loadCohortHelpers() {
  const utils = path.join(repoRoot, 'src', 'shared', 'utils')
  let cohortKey, cohortConfigCore
  try {
    cohortKey = await import(path.join(utils, 'cohortKey.ts'))
    cohortConfigCore = await import(path.join(utils, 'cohortConfigCore.ts'))
  } catch (err) {
    console.error('Could not load the cohort helpers from src/shared/utils.')
    console.error('Run through tsx:  node --import tsx scripts/backfill-cohort-key.mjs')
    console.error(String(err?.message || err))
    process.exit(1)
  }
  return { ...cohortKey, ...cohortConfigCore }
}

function parseArgs(argv) {
  const out = { college: [] }
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) {
      out[key] = true
      continue
    }
    if (key === 'college') out.college.push(next)
    else out[key] = next
    i++
  }
  return out
}

const args = parseArgs(process.argv.slice(2))
const PROJECT = typeof args.project === 'string' ? args.project : process.env.GCLOUD_PROJECT || 'vriddhi-academic'
const SERVICE_ACCOUNT = typeof args['service-account'] === 'string' ? args['service-account'] : undefined
const APPLY = Boolean(args.apply)
const RECOMPUTE = Boolean(args.recompute)
const LIMIT = typeof args.limit === 'string' ? Number(args.limit) : Infinity
const SHOW = typeof args.show === 'string' ? Number(args.show) : 10

const admin = loadAdmin()

function readServiceAccount(filePath) {
  const resolved = path.resolve(filePath)
  try {
    return JSON.parse(fs.readFileSync(resolved, 'utf8'))
  } catch (err) {
    if (err?.code === 'ENOENT' || err instanceof SyntaxError) {
      console.error(`Could not read a valid service-account JSON at: ${resolved}`)
      console.error(
        '\nDownload one from Firebase Console -> Project settings -> Service accounts\n' +
          '-> "Generate new private key", then pass its path to --service-account.',
      )
      process.exit(1)
    }
    throw err
  }
}

// Both module shapes express the same two steps differently. Everything below
// uses `db`, never `admin`, so the rest of the script is shape-agnostic.
const credential =
  admin.kind === 'legacy'
    ? SERVICE_ACCOUNT
      ? admin.admin.credential.cert(readServiceAccount(SERVICE_ACCOUNT))
      : admin.admin.credential.applicationDefault()
    : null

let db
if (admin.kind === 'legacy') {
  admin.admin.initializeApp({ credential, projectId: PROJECT })
  db = admin.admin.firestore()
} else {
  const appOptions = SERVICE_ACCOUNT
    ? { credential: admin.admin.cert(readServiceAccount(SERVICE_ACCOUNT)), projectId: PROJECT }
    : { projectId: PROJECT }
  const app = admin.admin.initializeApp(appOptions)
  db = admin.getFirestore(app)
}

/** Counters, so the summary answers "did this work?" at a glance. */
const stats = {
  scanned: 0,
  written: 0,
  alreadyKeyed: 0,
  incomplete: 0,
  failed: 0,
}

/** Rows that could not be keyed, grouped by reason, for the final report. */
const incompleteReasons = new Map()
const samples = []

function recordIncomplete(reason, regNo, collegeId, fields) {
  stats.incomplete++
  if (!incompleteReasons.has(reason)) incompleteReasons.set(reason, [])
  const bucket = incompleteReasons.get(reason)
  if (bucket.length < 5) bucket.push(`${regNo || '(no regNo)'} @ ${collegeId}`)
  void fields
}

/** The college's declared vocabulary, cached per college (one read each). */
const configCache = new Map()
async function loadConfig(collegeId, helpers) {
  if (configCache.has(collegeId)) return configCache.get(collegeId)
  let result = { config: helpers.DEFAULT_COHORT_CONFIG, declared: false }
  try {
    const snap = await db.collection('colleges').doc(collegeId).collection('config').doc('cohort').get()
    const data = snap.exists ? snap.data() : undefined
    result = {
      config: helpers.cohortConfigFromDoc(data),
      declared: helpers.isCohortConfigDeclared(data),
    }
  } catch (err) {
    console.warn(`  ! could not read cohort config for ${collegeId}: ${String(err?.message || err)}`)
  }
  configCache.set(collegeId, result)
  return result
}

/**
 * Build the two write payloads for one student document: the students/{id} and
 * the colleges/{cid}/students/{regNo} mirror. Null when the row is incomplete.
 */
function buildPayload(docId, data, helpers, configInfo) {
  const collegeId = String(data.collegeId ?? '')
  const branch = data.branch ?? data.department
  const fields = {
    collegeId,
    branch,
    batch: data.batch,
    semester: data.semester,
    division: data.division,
    section: data.section,
  }

  // Same completeness rule the writers use. A key with a blank segment would
  // merge two different cohorts, so an incomplete row gets NO key.
  if (!helpers.cohortKeyIsComplete(fields)) {
    const parts = helpers.cohortKeyParts(fields)
    let reason = 'missing a required field'
    if (!parts.college) reason = 'no collegeId'
    else if (!parts.programme) reason = 'no branch/department'
    else if (!parts.batch) reason = 'no batch (pass-out year)'
    else if (!parts.semester) reason = `no usable semester (got ${JSON.stringify(data.semester ?? null)})`
    else if (!parts.sections) reason = 'no division/section'
    return { key: null, reason }
  }

  // A declared vocabulary makes an out-of-range semester a real problem: the
  // key would name a class the college does not run.
  if (configInfo.declared && !helpers.semesterInRange(data.semester, configInfo.config)) {
    return { key: null, reason: `semester ${String(data.semester)} outside 1-${configInfo.config.semesterCount}` }
  }
  if (configInfo.declared && configInfo.config.sections.length > 0) {
    for (const field of [data.division, data.section]) {
      const value = String(field ?? '').trim()
      if (value && !helpers.sectionIsDeclared(value, configInfo.config)) {
        return { key: null, reason: `section "${value}" not declared by this college` }
      }
    }
  }

  return { key: helpers.cohortKey(fields), reason: null }
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === ''
}

async function main() {
  const helpers = await loadCohortHelpers()

  console.log(`backfill-cohort-key — project ${PROJECT}`)
  console.log(`  mode      : ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}`)
  console.log(`  recompute : ${RECOMPUTE ? 'yes (overwrites existing keys)' : 'no (skips keyed rows)'}`)
  console.log(`  colleges  : ${args.college.length ? args.college.join(', ') : 'all'}`)
  if (Number.isFinite(LIMIT)) console.log(`  limit     : ${LIMIT} documents`)
  console.log('')

  /**
   * Read `students` at the collection-group level: students live both in the
   * top-level `students` collection and under colleges/{id}/students. A
   * collection-group query needs an index; without one Firestore still serves
   * the top-level path, so the fallback is a per-college walk rather than a
   * failure.
   */
  const collegeIds = args.college.length
    ? args.college
    : (await db.collection('colleges').limit(500).get()).docs.map((doc) => doc.id)

  let pending = []
  const flush = async () => {
    if (pending.length === 0) return
    if (!APPLY) {
      pending = []
      return
    }
    const batch = db.batch()
    for (const entry of pending) {
      batch.set(entry.ref, entry.payload, { merge: true })
      if (entry.mirrorRef) batch.set(entry.mirrorRef, entry.mirrorPayload, { merge: true })
    }
    try {
      await batch.commit()
      stats.written += pending.length
    } catch (err) {
      stats.failed += pending.length
      console.error(`  ! batch failed (${pending.length} rows): ${String(err?.message || err)}`)
    }
    pending = []
  }

  const stamp = new Date().toISOString()

  for (const collegeId of collegeIds) {
    if (stats.scanned >= LIMIT) break
    const configInfo = await loadConfig(collegeId, helpers)
    const snap = await db.collection('students').where('collegeId', '==', collegeId).get()
    if (snap.empty) continue

    for (const doc of snap.docs) {
      if (stats.scanned >= LIMIT) break
      const data = doc.data()
      stats.scanned++

      if (!isBlank(data.cohortKey) && !RECOMPUTE) {
        stats.alreadyKeyed++
        continue
      }

      const { key, reason } = buildPayload(doc.id, data, helpers, configInfo)

      if (!key) {
        recordIncomplete(reason, data.regNo || doc.id, collegeId, data)
        pending.push({
          ref: doc.ref,
          payload: { cohortKeyIncomplete: true, cohortKeyBackfilledAt: stamp },
        })
        continue
      }

      if (samples.length < SHOW) {
        samples.push({
          regNo: String(data.regNo ?? doc.id),
          branch: String(data.branch ?? data.department ?? ''),
          batch: String(data.batch ?? ''),
          semester: String(data.semester ?? ''),
          section: String(data.division ?? data.section ?? ''),
          key,
        })
      }

      const payload = { cohortKey: key, cohortKeyBackfilledAt: stamp, cohortKeyIncomplete: false }
      const regNo = String(data.regNo ?? '')
      const mirrorRef = regNo
        ? db.collection('colleges').doc(collegeId).collection('students').doc(regNo)
        : null

      pending.push({ ref: doc.ref, payload, mirrorRef, mirrorPayload: payload })
      if (pending.length >= 400) await flush()
    }
    process.stdout.write(`  ...${collegeId}: ${stats.scanned} scanned\n`)
  }

  await flush()

  console.log('')
  console.log('── Summary ─────────────────────────────────────────────')
  console.log(`  scanned         : ${stats.scanned}`)
  console.log(`  ${APPLY ? 'written' : 'would write'}       : ${APPLY ? stats.written : stats.scanned - stats.alreadyKeyed - stats.incomplete}`)
  console.log(`  already keyed   : ${stats.alreadyKeyed}${RECOMPUTE ? ' (recomputed)' : ' (skipped)'}`)
  console.log(`  incomplete      : ${stats.incomplete}`)
  if (stats.failed) console.log(`  FAILED rows     : ${stats.failed}`)

  if (samples.length > 0) {
    console.log('')
    console.log('── Sample keys ─────────────────────────────────────────')
    const width = Math.max(...samples.map((s) => s.key.length), 20)
    for (const sample of samples) {
      console.log(`  ${sample.key.padEnd(width)}  ← ${sample.branch} / ${sample.batch} / ${sample.semester} / ${sample.section}`)
    }
  }

  if (stats.incomplete > 0) {
    console.log('')
    console.log('── Rows that could not be keyed (fix the data, then re-run) ──')
    for (const [reason, examples] of incompleteReasons) {
      console.log(`  ${reason}: ${examples.join(', ')}${examples.length >= 5 ? ' …' : ''}`)
    }
    console.log('')
    console.log('  These rows keep NO cohortKey and are flagged cohortKeyIncomplete.')
    console.log('  A key with a blank segment would merge two different cohorts, which is')
    console.log('  worse than no key; the matchers fall back to field comparison for them.')
  }

  if (!APPLY) {
    console.log('')
    console.log('DRY RUN — nothing was written. Re-run with --apply to write.')
  }
  process.exit(stats.failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('backfill-cohort-key failed:', err)
  process.exit(1)
})
