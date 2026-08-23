/**
 * Firebase Rules emulator tests.
 * Run: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm --prefix functions test
 * If the emulator is not running, these tests are skipped.
 */
import assert from 'node:assert/strict'
import { describe, it, before, after } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST
const shouldRun = Boolean(emulatorHost)

describe('firestore rules', { skip: !shouldRun }, () => {
  let testEnv: any

  before(async () => {
    const { initializeTestEnvironment } = await import('@firebase/rules-unit-testing')
    const rules = readFileSync(resolve(process.cwd(), '../current-firestore.rules'), 'utf8')
    testEnv = await initializeTestEnvironment({
      projectId: 'vriddhi-rules-test',
      firestore: { rules },
    })

    await testEnv.withSecurityRulesDisabled(async (ctx: any) => {
      const db = ctx.firestore()
      await db.doc('users/student-a').set({ uid: 'student-a', role: 'student', collegeId: 'college-a' })
      await db.doc('users/faculty-a').set({ uid: 'faculty-a', role: 'faculty', collegeId: 'college-a' })
      await db.doc('users/admin-a').set({ uid: 'admin-a', role: 'admin', collegeId: 'college-a' })
      await db.doc('users/student-b').set({ uid: 'student-b', role: 'student', collegeId: 'college-b' })
      await db.doc('users/admin-b').set({ uid: 'admin-b', role: 'admin', collegeId: 'college-b' })
      await db.doc('users/super').set({ uid: 'super', role: 'superadmin' })
      await db.doc('students/stu-a').set({ uid: 'student-a', collegeId: 'college-a', name: 'A' })
      await db.doc('questions/q-a').set({ collegeId: 'college-a', status: 'published', createdBy: 'faculty-a' })
      await db.doc('papers/p-a').set({ collegeId: 'college-a', status: 'published' })
      await db.doc('colleges/college-a').set({ name: 'A' })
      await db.doc('attendance/att-a').set({ collegeId: 'college-a', studentId: 'student-a' })
      await db.doc('payments/pay-a').set({ collegeId: 'college-a', studentId: 'student-a' })
    })
  })

  after(async () => {
    if (testEnv) await testEnv.cleanup()
  })

  function authed(uid: string, claims: Record<string, unknown>) {
    return testEnv.authenticatedContext(uid, claims).firestore()
  }

  it('denies unauthenticated visitor', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assert.rejects(() => db.doc('users/student-a').get())
  })

  it('student A can read own profile, not college B student', async () => {
    const db = authed('student-a', { role: 'student', collegeId: 'college-a' })
    await assert.doesNotReject(() => db.doc('users/student-a').get())
    await assert.rejects(() => db.doc('students/stu-a').update({ name: 'hack' }))
  })

  it('faculty A cannot write college B question', async () => {
    const db = authed('faculty-a', { role: 'faculty', collegeId: 'college-a' })
    await assert.rejects(() =>
      db.doc('questions/q-b').set({ collegeId: 'college-b', createdBy: 'faculty-a', status: 'active' })
    )
  })

  it('admin A cannot change own role', async () => {
    const db = authed('admin-a', { role: 'admin', collegeId: 'college-a' })
    await assert.rejects(() => db.doc('users/admin-a').update({ role: 'superadmin' }))
  })

  it('superadmin can read college records', async () => {
    const db = authed('super', { role: 'superadmin' })
    await assert.doesNotReject(() => db.doc('colleges/college-a').get())
  })
})
