#!/usr/bin/env node
/**
 * Identity doctor — reconcile Firestore profiles with Firebase Authentication.
 *
 * WHY
 * Every "login does not work" investigation in this project has started the
 * same way: open the console, look for the email in Authentication, then in
 * users/{uid}, then in faculty/{uid} or students/{uid}, then wonder whether the
 * role claim is set. That state machine is exactly what this script walks, for
 * every account at once, from the command line — and with --apply it repairs it.
 *
 * It exists so recovery does not depend on the app being usable: if the
 * superadmin's own login is part of the problem, the Access Control screen is
 * unreachable, and this script still works.
 *
 * USAGE
 *   export GOOGLE_APPLICATION_CREDENTIALS=~/Downloads/vriddhi-serviceAccount.json
 *   npm run identity:doctor -- --college <collegeId>
 *   npm run identity:doctor -- --email aarav@college.edu          # one account
 *   npm run identity:doctor -- --apply --csv /tmp/issued.csv      # repair + export
 *   npm run identity:doctor -- --apply --delivery password --password 'Temp!1234567'
 *
 * FLAGS
 *   --project <id>            Firebase project id (default: vriddhi-academic)
 *   --service-account <path>  service-account JSON (else ADC / env var)
 *   --college <id>            restrict to one tenant
 *   --email <addr>            restrict to one person (repeatable)
 *   --collections <list>      students,faculty,admins,hods,mentors,superadmins
 *   --limit <n>               documents per collection (default 2000)
 *   --apply                   write the repairs (default: read-only dry run)
 *   --delivery <mode>         reset-email (default) | password
 *   --password <pw>           fixed temp password (>= 10 chars, --delivery password)
 *   --csv <path>              write issued credentials
 *   --keep-secrets            leave legacy plaintext `password` fields in place
 *                             (they are deleted by default, never printed)
 *   --force-claims            rewrite claims even when a role claim already exists
 *
 * SAFETY
 *   - Read-only unless --apply is passed.
 *   - Never deletes an Auth account, never lowers a role, never overwrites an
 *     existing role claim unless --force-claims is given.
 *   - Plaintext passwords found on profile documents are removed, never printed.
 */

import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))

function loadAdmin() {
  for (const candidate of [
    'firebase-admin',
    '../functions/node_modules/firebase-admin',
    '../node_modules/firebase-admin',
  ]) {
    try {
      return require(candidate.startsWith('.') ? path.join(here, candidate) : candidate)
    } catch {
      /* try the next location */
    }
  }
  console.error(
    'firebase-admin is not installed. Run:  npm --prefix functions install\n' +
      '(the module is resolved from functions/node_modules as well)'
  )
  process.exit(2)
}

// ── args ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { emails: [] }
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) {
      out[key] = true
      continue
    }
    if (key === 'email') out.emails.push(next.toLowerCase())
    else out[key] = next
    i++
  }
  return out
}

const args = parseArgs(process.argv.slice(2))
const PROJECT = args.project || process.env.GCLOUD_PROJECT || 'vriddhi-academic'
const COLLECT = (args.collections || 'students,faculty,admins,hods,mentors,superadmins')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const LIMIT = Number(args.limit || 2000)
const APPLY = Boolean(args.apply)
const DRY = !APPLY
const DELIVERY = args.delivery === 'password' ? 'password' : 'reset-email'
const COLLECTION_ROLE = {
  students: 'student',
  faculty: 'faculty',
  admins: 'admin',
  hods: 'hod',
  mentors: 'mentor',
  superadmins: 'superadmin',
  principal: 'principal',
}
const SECRET_FIELDS = ['password', 'passwordHash', 'tempPassword', 'temporaryPassword', 'pwd']

// ── admin init ─────────────────────────────────────────────────────────
const admin = loadAdmin()
const credential = args['service-account']
  ? admin.credential.cert(fs.readFileSync(path.resolve(args['service-account']), 'utf8'))
  : admin.credential.applicationDefault()
admin.initializeApp({ credential, projectId: PROJECT, storageBucket: `${PROJECT}.appspot.com` })

const db = admin.firestore()
const auth = admin.auth()
db.settings({ ignoreUndefinedProperties: true })

function randomPassword(length = 14) {
  const { randomInt } = require('node:crypto')
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const nums = '23456789'
  const special = '!@#$%^&*'
  const all = upper + lower + nums + special
  const pick = (set) => set[randomInt(0, set.length)]
  const chars = [pick(upper), pick(lower), pick(nums), pick(special)]
  for (let i = chars.length; i < length; i++) chars.push(pick(all))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

const canonicalRole = (raw) => {
  const value = String(raw || '').trim().toLowerCase()
  if (/teach|lecturer|professor|instructor/.test(value)) return 'faculty'
  if (/head of (the )?department|dept ?head/.test(value)) return 'hod'
  if (/vice.?principal/.test(value)) return 'principal'
  if (/administrator|^admin$|college admin/.test(value)) return 'admin'
  if (/super.?admin|owner|superuser/.test(value)) return 'superadmin'
  if (/learner|pupil/.test(value)) return 'student'
  if (/guardian/.test(value)) return 'parent'
  return value
}

// ── diagnosis ──────────────────────────────────────────────────────────
async function inspectDoc(collectionName, snap) {
  const data = snap.data() || {}
  const email = String(data.email || '').trim().toLowerCase() || null
  const name =
    (typeof data.name === 'string' && data.name.trim()) ||
    [data.firstName, data.lastName].filter(Boolean).join(' ').trim() ||
    (email ? email.split('@')[0] : snap.id)
  const role = canonicalRole(data.role) || COLLECTION_ROLE[collectionName] || null
  const collegeId = data.collegeId || data.collegeID || data.college || null
  const linkedUid = typeof data.uid === 'string' ? data.uid : typeof data.userId === 'string' ? data.userId : null

  const problems = []
  let authUser = null
  if (linkedUid) {
    try {
      authUser = await auth.getUser(linkedUid)
    } catch (err) {
      if (err?.code !== 'auth/user-not-found') throw err
      problems.push(`STALE_UID_LINK (uid ${linkedUid} does not exist in Auth)`)
    }
  }
  if (!authUser && email) {
    try {
      authUser = await auth.getUserByEmail(email)
      problems.push('PROFILE_NOT_LINKED (Auth account exists but the profile has no uid/userId)')
    } catch (err) {
      if (err?.code !== 'auth/user-not-found') throw err
      problems.push('MISSING_AUTH_ACCOUNT (this person cannot sign in: no credential exists)')
    }
  }

  let usersDoc = null
  if (authUser) {
    usersDoc = (await db.doc(`users/${authUser.uid}`).get()).data() || null
    if (!usersDoc) problems.push('MISSING_USERS_DOC (role resolution depends on profile fallbacks)')
    const claims = authUser.customClaims || {}
    const claimRole = canonicalRole(claims.role)
    if (!claimRole) problems.push('MISSING_CLAIMS (signs in, then every rule-guarded read is denied)')
    else if (role && claimRole !== role) problems.push(`WRONG_CLAIM (token says "${claimRole}", profile says "${role}")`)
    if (role !== 'superadmin' && collegeId && claims.collegeId && claims.collegeId !== collegeId) {
      problems.push(`WRONG_COLLEGE_CLAIM (token "${claims.collegeId}", profile "${collegeId}")`)
    }
    if (authUser.disabled) problems.push('ACCOUNT_DISABLED')
    if (collectionName === 'students' && usersDoc?.studentDocId !== snap.id) {
      problems.push('MISSING_STUDENT_DOC_LINK (users/{uid}.studentDocId is not set)')
    }
  }

  const secrets = SECRET_FIELDS.filter((field) => field in data)
  if (secrets.length) problems.push(`PLAINTEXT_PASSWORD_ON_PROFILE (${secrets.join(', ')}) — remove it`)

  return { collectionName, id: snap.id, email, name, role, collegeId, linkedUid, authUser, usersDoc, problems, secrets }
}

async function main() {
  const issued = []
  const rows = []
  const summary = { scanned: 0, healthy: 0, broken: 0, created: 0, claims: 0, usersDocs: 0, links: 0, stripped: 0 }
  const byProblem = new Map()

  for (const collection of COLLECT) {
    let query = db.collection(collection).limit(LIMIT)
    if (args.college && collection !== 'superadmins') {
      query = db.collection(collection).where('collegeId', '==', args.college).limit(LIMIT)
    }
    let snapshot
    try {
      snapshot = await query.get()
    } catch (err) {
      console.error(`\n! ${collection}: scan failed — ${err.message}`)
      console.error('  Does the collection have the collegeId composite index? (firebase deploy --only firestore:indexes)')
      continue
    }
    console.log(`\n── ${collection}: ${snapshot.size} profile document(s)`)

    for (const snap of snapshot.docs) {
      const info = await inspectDoc(collection, snap)
      if (args.emails.length && (!info.email || !args.emails.includes(info.email))) continue
      summary.scanned++
      if (!info.problems.length) {
        summary.healthy++
        continue
      }
      summary.broken++
      info.problems.forEach((p) => byProblem.set(p.split(' ')[0], (byProblem.get(p.split(' ')[0]) || 0) + 1))
      rows.push(info)
      console.log(
        `  ✗ ${snap.id}  ${info.email || '(no email)'}  ${info.role || '?'}` +
          `\n      ${info.problems.join('\n      ')}`
      )
      if (!DRY) await repair(info, summary, issued)
    }
  }

  console.log('\n════════ Summary ════════')
  console.log(`project        ${PROJECT}`)
  console.log(`college        ${args.college || '(all)'}`)
  console.log(`mode           ${DRY ? 'DRY RUN (nothing written) — pass --apply to repair' : 'APPLY'}`)
  console.log(`scanned        ${summary.scanned}   healthy ${summary.healthy}   needing repair ${summary.broken}`)
  for (const [problem, count] of [...byProblem.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  ${problem}`)
  }
  if (!DRY) {
    console.log(`\nrepaired: auth accounts created ${summary.created}, claims issued ${summary.claims}, ` +
      `users docs ${summary.usersDocs}, profile links ${summary.links}, password fields stripped ${summary.stripped}`)
  }
  if (rows.length && DRY) {
    console.log('\nNext step: re-run with --apply. Accounts that had no credential get a password-reset link,')
    console.log('so no shared secret has to be stored or forwarded. Users must sign out and back in for claims.')
  }
  if (issued.length) {
    console.log(`\nIssued credentials (${issued.length}):`)
    issued.forEach((row) => console.log(`  ${row.email}  ${row.password || row.resetLink}`))
  }
  if (args.csv) {
    const header = 'name,email,role,collegeId,action,password,resetLink'
    const lines = issued.map((row) =>
      [row.name, row.email, row.role, row.collegeId, row.action, row.password || '', row.resetLink || '']
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    fs.writeFileSync(path.resolve(args.csv), [header, ...lines].join('\n'))
    console.log(`\nWrote ${lines.length} row(s) to ${args.csv} — delete this file once it has been handed over.`)
  }
}

async function repair(info, summary, issued) {
  const now = admin.firestore.FieldValue.serverTimestamp()
  let uid = info.authUser?.uid || null
  const profileRef = db.collection(info.collectionName).doc(info.id)

  // 1. the credential
  if (!info.authUser && info.email) {
    const password = DELIVERY === 'password' ? String(args.password || randomPassword()) : randomPassword()
    try {
      const created = await auth.createUser({ email: info.email, password, displayName: info.name })
      uid = created.uid
      summary.created++
      let resetLink = null
      if (DELIVERY !== 'password') {
        resetLink = await auth.generatePasswordResetLink(info.email).catch(() => null)
      }
      issued.push({
        name: info.name,
        email: info.email,
        role: info.role,
        collegeId: info.collegeId,
        action: 'created-auth-account',
        password: DELIVERY === 'password' ? password : undefined,
        resetLink,
      })
      info.problems = info.problems.filter((p) => !p.startsWith('MISSING_AUTH_ACCOUNT'))
    } catch (err) {
      console.error(`      ! could not create Auth account for ${info.email}: ${err.message}`)
      return
    }
  } else if (info.authUser?.disabled) {
    await auth.updateUser(info.authUser.uid, { disabled: false })
    console.log(`      → re-enabled the disabled Auth account`)
  }

  if (!uid) {
    console.log('      ! no email/uid to act on — fix the document by hand')
    return
  }

  // 2. claims
  const record = await auth.getUser(uid)
  const claims = record.customClaims || {}
  const claimRole = canonicalRole(claims.role)
  if (!claimRole || args['force-claims']) {
    await auth.setCustomUserClaims(uid, { ...claims, role: info.role, collegeId: info.collegeId || null })
    await auth.revokeRefreshTokens(uid)
    summary.claims++
    console.log(`      → claims { role: ${info.role}, collegeId: ${info.collegeId || null} }`)
  }

  // 3. users/{uid} lookup document
  const usersRef = db.collection('users').doc(uid)
  const usersSnap = await usersRef.get()
  if (!usersSnap.exists) {
    await usersRef.set(
      {
        uid,
        id: uid,
        email: info.email,
        name: info.name,
        role: info.role,
        collegeId: info.collegeId || null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        repairedBy: 'identity-doctor',
      },
      { merge: true }
    )
    summary.usersDocs++
  }

  // 4. profile ↔ auth links (and the studentDocId the portal needs)
  const patch = { updatedAt: now }
  if (info.linkedUid !== uid) {
    patch.uid = uid
    if (info.collectionName === 'students') patch.userId = uid
    summary.links++
  }
  if (info.collectionName === 'students' && usersSnap.data()?.studentDocId !== info.id) {
    await usersRef.set({ studentDocId: info.id }, { merge: true })
  }
  if (info.collectionName === 'faculty' && usersSnap.data()?.facultyDocId !== info.id) {
    await usersRef.set({ facultyDocId: info.id }, { merge: true })
  }
  await profileRef.set(patch, { merge: true })

  // 5. plaintext credentials must not live on a readable profile. Stripping is
  //    the default because those fields are the reason the "read the password in
  //    Firestore" workflow exists; pass --keep-secrets only to inspect them.
  if (info.secrets.length && !args['keep-secrets']) {
    const deletes = {}
    for (const field of info.secrets) deletes[field] = admin.firestore.FieldValue.delete()
    await profileRef.set(deletes, { merge: true })
    summary.stripped += info.secrets.length
    console.log(`      → deleted ${info.secrets.join(', ')} from the profile document`)
  }
}

main().catch((err) => {
  console.error('\nidentity-doctor failed:', err?.message || err)
  process.exit(1)
})
