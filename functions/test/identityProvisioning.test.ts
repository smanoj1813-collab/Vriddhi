import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import {
  IDENTITY_API_VERSION,
  SECRET_PROFILE_FIELDS,
  generateRandomPassword,
  isValidEmail,
  normalizeEmail,
  normalizeRole,
  toPhoneE164,
  withApiVersion,
} from '../src/identityShared.ts'

const here = dirname(fileURLToPath(import.meta.url))

describe('identity API version handshake', () => {
  it('matches the constant the web client expects', () => {
    // The whole point of the handshake is defeated if the two files drift, and
    // the failure it protects against (stale functions + fresh frontend) is
    // silent at runtime. Asserting it in CI makes it loud.
    const client = readFileSync(resolve(here, '../../src/shared/services/identityBackend.ts'), 'utf8')
    const match = client.match(/EXPECTED_IDENTITY_API_VERSION = '([^']+)'/)
    assert.ok(match, 'client must declare EXPECTED_IDENTITY_API_VERSION')
    assert.equal(
      match[1],
      IDENTITY_API_VERSION,
      'functions/src/identityShared.ts and src/shared/services/identityBackend.ts must be bumped and deployed together'
    )
  })

  it('wraps every provisioning response with the version', () => {
    assert.deepEqual(withApiVersion({ created: 1 }), { created: 1, apiVersion: IDENTITY_API_VERSION })
  })

  it('is exported by every identity callable the client calls', () => {
    // A callable the client version-checks must actually report a version,
    // otherwise the client rejects a perfectly good deployment.
    const files = ['studentAuth.ts', 'staffAuth.ts', 'roleManagement.ts', 'accountManagement.ts', 'identityRepair.ts', 'selfIdentity.ts']
    for (const file of files) {
      const source = readFileSync(resolve(here, `../src/${file}`), 'utf8')
      const reportsVersion = /apiVersion|withApiVersion/.test(source)
      assert.ok(reportsVersion, `${file} must return apiVersion (directly or via withApiVersion)`)
    }
  })
})

describe('normalizeRole', () => {
  it('canonicalises the spellings this database actually contains', () => {
    for (const [input, expected] of [
      ['Faculty', 'faculty'],
      ['teacher', 'faculty'],
      ['Assistant Professor', 'faculty'],
      ['Head of Department', 'hod'],
      ['vice-principal', 'principal'],
      ['super admin', 'superadmin'],
      ['Administrator', 'admin'],
      ['Learner', 'student'],
      ['guardian', 'parent'],
    ] as const) {
      assert.equal(normalizeRole(input), expected, `normalizeRole(${input})`)
    }
  })

  it('falls back instead of inventing a privileged role', () => {
    // An unrecognised string must never be rounded up to something with more
    // access than was asked for: it becomes the caller's fallback (or '', which
    // the importers reject as "invalid role") rather than a guess.
    assert.equal(normalizeRole('Super User Extraordinaire', ''), '')
    assert.equal(normalizeRole('Super Admin Wannabe', ''), '')
    assert.equal(normalizeRole('Assistant Professor Emeritus', 'mentor'), 'mentor')
    assert.equal(normalizeRole(undefined, 'student'), 'student')
    assert.equal(normalizeRole(null, 'faculty'), 'faculty')
  })

  it('agrees with the role canonicalisation in current-firestore.rules', () => {
    // A role the rules understand but the importer does not (or the reverse)
    // produces an account that can be created but not authorised.
    const rules = readFileSync(resolve(here, '../../current-firestore.rules'), 'utf8')
    const block = rules.slice(rules.indexOf('function canonicalRole('), rules.indexOf('function role()'))
    const spellings = [
      'teacher', 'teaching staff', 'teaching-staff', 'lecturer', 'professor',
      'assistant professor', 'associate professor', 'instructor', 'faculty member',
      'head of department', 'head-of-department', 'head_of_department', 'dept head',
      'department head', 'administrator', 'admin staff', 'college admin',
      'super admin', 'super-admin', 'super_admin', 'superuser', 'owner',
      'vice principal', 'vice-principal', 'vice_principal', 'learner', 'pupil', 'guardian',
    ]
    for (const spelling of spellings) {
      assert.ok(block.includes(`'${spelling}'`), `rules do not canonicalise "${spelling}" — update both files together`)
      assert.ok(normalizeRole(spelling) !== '', `the importer does not canonicalise "${spelling}"`)
    }
  })

  it('never trusts whitespace or case to hide a role', () => {
    assert.equal(normalizeRole('  SUPERADMIN \n'), 'superadmin')
  })
})

describe('temporary passwords', () => {
  it('satisfy the Firebase Auth complexity minimum and are not ambiguous', () => {
    for (let i = 0; i < 50; i++) {
      const password = generateRandomPassword()
      assert.equal(password.length, 14)
      assert.match(password, /[A-Z]/)
      assert.match(password, /[a-z]/)
      assert.match(password, /[0-9]/)
      assert.match(password, /[!@#$%^&*]/)
      // 0/O, 1/l/I are excluded: these are read aloud over the phone.
      assert.doesNotMatch(password, /[0O1lI]/)
    }
  })

  it('does not repeat itself across an import batch', () => {
    const batch = new Set(Array.from({ length: 500 }, () => generateRandomPassword()))
    assert.equal(batch.size, 500, 'a collision would hand two students the same credential')
  })

  it('honours an explicit default password length', () => {
    assert.equal(generateRandomPassword(20).length, 20)
  })
})

describe('plaintext credentials cannot survive on a profile document', () => {
  it('strips every field the rules also refuse to write', () => {
    // Drift guard for the two halves of the same rule: the callables delete
    // these keys, current-firestore.rules refuses to create them.
    const rules = readFileSync(resolve(here, '../../current-firestore.rules'), 'utf8')
    const body = rules.slice(rules.indexOf('function noPasswordField()'), rules.indexOf('function noPrivilegedRole'))
    for (const field of SECRET_PROFILE_FIELDS) {
      assert.ok(body.includes(`'${field}'`), `noPasswordField() must also reject "${field}"`)
    }
    assert.ok(/noPasswordField\(\)/.test(rules), 'the rules must call noPasswordField() somewhere')
    for (const collection of ['students', 'faculty', 'admins', 'hods', 'mentors', 'superadmins']) {
      const block = rules.slice(rules.indexOf(`match /${collection}/{id} {`))
      const uptoNext = block.slice(0, block.indexOf('\n    match /'))
      assert.ok(/noPasswordField\(\)/.test(uptoNext), `${collection} writes must be guarded by noPasswordField()`)
    }
  })
})

describe('input normalisation', () => {
  it('lowercases and trims emails, because Auth does too', () => {
    assert.equal(normalizeEmail('  Aarav@College.EDU '), 'aarav@college.edu')
    assert.equal(normalizeEmail(undefined), '')
  })

  it('rejects the malformed addresses the CSV importer used to accept', () => {
    assert.equal(isValidEmail('aarav@college'), false)
    assert.equal(isValidEmail('aarav college.edu'), false)
    assert.equal(isValidEmail('aarav@college.edu'), true)
  })

  it('normalises Indian phone numbers to E.164', () => {
    assert.equal(toPhoneE164('098765 43210'), '+919876543210')
    assert.equal(toPhoneE164(''), undefined)
    assert.equal(toPhoneE164('123'), undefined, 'too short to be a real number')
  })
})
