import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import admin from 'firebase-admin'

// Actual callable handlers, with only the Admin SDK I/O boundary replaced.
// The fake enforces atomic batches and snapshot preconditions, not permissions;
// direct client permissions are covered separately by the emulator matrix.
const UID = 'faculty-auth'
const EMAIL = 'faculty@example.edu'
let rows: Map<string, Record<string, any>>
let revisions: Map<string, number>
let revision = 0
let writes: Array<{ path: string; value: any }>
let authCalls: Array<{ uid: string; displayName: string }>
let authName: string
let failCommit = false
let beforeCommit: (() => void) | undefined
let authUpdate: ((uid: string, name: string) => Promise<void>) | undefined
function seed(path: string, value: Record<string, any>) { rows.set(path, { ...value }); revisions.set(path, ++revision) }
class Ref {
  constructor(readonly path: string) {}
  get id() { return this.path.split('/').pop()! }
  get parent() { return { id: this.path.split('/').at(-2)! } }
  async get() { return snapshot(this) }
}
class Collection {
  constructor(readonly path: string, readonly filters: Array<[string, unknown]> = [], readonly max = Infinity) {}
  doc(id: string) { return new Ref(`${this.path}/${id}`) }
  where(field: string, op: string, value: unknown) {
    assert.equal(op, '==')
    return new Collection(this.path, [...this.filters, [field, value]], this.max)
  }
  limit(max: number) { return new Collection(this.path, this.filters, max) }
  async get() {
    const docs = [...rows].filter(([path, data]) => path.split('/').length === 2 && path.startsWith(`${this.path}/`)
      && this.filters.every(([field, value]) => data[field] === value)).slice(0, this.max).map(([path]) => snapshot(new Ref(path)))
    return { docs, empty: !docs.length, size: docs.length }
  }
}
function snapshot(ref: Ref): any {
  const data = rows.get(ref.path)
  const copy = data ? structuredClone(data) : undefined
  return { id: ref.id, ref, exists: !!data, updateTime: revisions.get(ref.path), data: () => copy }
}
const fakeDb = {
  collection: (name: string) => new Collection(name),
  batch() {
    const staged: Array<{ ref: Ref; value: any; condition: { lastUpdateTime: number } }> = []
    return {
      update(ref: Ref, value: any, condition: { lastUpdateTime: number }) { staged.push({ ref, value, condition }) },
      async commit() {
        beforeCommit?.()
        if (failCommit) throw new Error('Firestore unavailable')
        for (const row of staged) assert.equal(revisions.get(row.ref.path), row.condition.lastUpdateTime, 'snapshot precondition changed')
        for (const row of staged) {
          assert.ok(rows.has(row.ref.path), 'never create a partial profile')
          seed(row.ref.path, { ...rows.get(row.ref.path), ...row.value })
          writes.push({ path: row.ref.path, value: row.value })
        }
      },
    }
  },
}
let api: typeof import('../src/staffProfile')
const firestoreDescriptor = Object.getOwnPropertyDescriptor(admin, 'firestore')!
const authDescriptor = Object.getOwnPropertyDescriptor(admin, 'auth')!
before(async () => {
  Object.defineProperty(admin, 'firestore', { configurable: true, value: Object.assign(() => fakeDb, { FieldValue: admin.firestore.FieldValue }) })
  Object.defineProperty(admin, 'auth', { configurable: true, value: () => ({
    async updateUser(uid: string, input: { displayName: string }) {
      authCalls.push({ uid, displayName: input.displayName })
      await authUpdate?.(uid, input.displayName)
      authName = input.displayName
    },
  }) })
  api = await import('../src/staffProfile')
})
after(() => {
  if (firestoreDescriptor) Object.defineProperty(admin, 'firestore', firestoreDescriptor)
  else delete (admin as any).firestore
  if (authDescriptor) Object.defineProperty(admin, 'auth', authDescriptor)
  else delete (admin as any).auth
})
beforeEach(() => {
  rows = new Map(); revisions = new Map(); revision = 0; writes = []; authCalls = []; authName = 'Original'
  failCommit = false; beforeCommit = undefined; authUpdate = undefined
  seed(`users/${UID}`, { uid: UID, role: 'faculty', collegeId: 'college-a', facultyDocId: 'FAC001', name: 'Original', email: EMAIL })
  seed('faculty/FAC001', { uid: UID, collegeId: 'college-a', name: 'Original', firstName: 'Original', lastName: '', phone: '1234567890', department: 'Science', email: EMAIL, confidential: 'not-returned' })
})
function request(data: unknown = {}, token: Record<string, unknown> = {}): any {
  return { auth: { uid: UID, token: { role: 'faculty', collegeId: 'college-a', email: EMAIL, ...token } }, data }
}
const saved = () => rows.get('faculty/FAC001')!

describe('staff profile input validation', () => {
  for (const key of ['uid', 'userId', 'role', 'collegeId', 'department', 'facultyDocId', 'profileId', 'firstName', 'password', 'appearance', 'twoFAEnabled']) {
    it(`rejects protected or target field ${key}`, () => {
      assert.throws(() => api.parseStaffProfileUpdate({ name: 'Edited', [key]: 'forged' }), /Only name/)
      assert.equal(writes.length, 0)
    })
  }
  for (const value of [null, [], {}, { name: '' }, { name: 12 }, { name: 'a' }, { name: 'a'.repeat(101) }, { name: 'Two\nNames' }, { phone: 1234 }, { phone: '<script>' }, { phone: '1'.repeat(33) }, { notificationPrefs: null }, { notificationPrefs: [] }, { notificationPrefs: { classes: true } }, { notificationPrefs: { classes: true, attendance: true, assignments: true, announcements: 'yes' } }, { notificationPrefs: { classes: true, attendance: true, assignments: true, announcements: true, role: 'admin' } }]) {
    it(`rejects malformed update ${JSON.stringify(value)}`, () => assert.throws(() => api.parseStaffProfileUpdate(value)))
  }
  it('normalizes only allowed fields, including an explicitly cleared phone', () => {
    assert.deepEqual(api.parseStaffProfileUpdate({ name: '  Asha   Kumar  ', phone: '' }), { name: 'Asha Kumar', phone: '' })
  })
})

describe('canonical self-service staff settings callables', () => {
  it('projects the linked non-UID profile without leaking arbitrary private fields', async () => {
    const data = await api.getMyStaffSettings.run(request())
    assert.deepEqual(data, { uid: UID, name: 'Original', phone: '1234567890', email: EMAIL, department: 'Science', collegeId: 'college-a', notificationPrefs: null, appearance: null })
    assert.equal(writes.length, 0)
  })
  it('updates the canonical profile and users anchor atomically, never faculty/{auth.uid}', async () => {
    const result = await api.updateMyStaffProfile.run(request({ name: 'Asha Kumar', phone: '+91 98765 43210' }))
    assert.deepEqual(result, { success: true, uid: UID, authDisplayNameSynced: true })
    assert.equal(saved().firstName, 'Asha'); assert.equal(saved().lastName, 'Kumar')
    assert.equal(rows.get(`users/${UID}`)!.name, 'Asha Kumar')
    assert.equal(saved().department, 'Science'); assert.equal(saved().uid, UID); assert.equal(saved().collegeId, 'college-a')
    assert.equal(rows.has(`faculty/${UID}`), false)
    assert.deepEqual(writes.map(row => row.path).sort(), [`users/${UID}`, 'faculty/FAC001'].sort())
    assert.deepEqual(authCalls, [{ uid: UID, displayName: 'Asha Kumar' }])
  })
  it('saves a complete faculty preference set without touching Auth or any identity field', async () => {
    const prefs = { classes: false, attendance: true, assignments: false, announcements: true }
    await api.updateMyStaffProfile.run(request({ notificationPrefs: prefs }))
    assert.deepEqual(saved().notificationPrefs, prefs)
    assert.deepEqual(rows.get(`users/${UID}`)!.notificationPrefs, prefs)
    assert.equal(saved().name, 'Original'); assert.equal(authCalls.length, 0)
  })
  it('accepts the admin notification shape without permitting arbitrary keys', async () => {
    const prefs = { emailAssessments: true, smsAttendance: false, weeklyReports: false, milestoneAlerts: true, maintenance: true, pushEnabled: false }
    await api.updateMyStaffProfile.run(request({ notificationPrefs: prefs }))
    assert.deepEqual(saved().notificationPrefs, prefs)
  })
  for (const role of ['admin', 'principal', 'hod', 'mentor', 'employee', 'superadmin']) {
    it(`${role} can edit their own canonical settings, without creating a shadow admin profile`, async () => {
      const fields = { uid: UID, role, collegeId: role === 'superadmin' ? null : 'college-a', name: 'Original' }
      seed(`users/${UID}`, fields)
      if (role === 'superadmin') seed(`superadmins/${UID}`, fields)
      await api.updateMyStaffProfile.run(request({ phone: '9876543210' }, { role }))
      assert.equal(rows.get(`users/${UID}`)!.phone, '9876543210')
      assert.equal(rows.has(`admins/${UID}`), false)
    })
  }
  for (const anchor of ['document-id', 'uid', 'userId', 'email']) {
    it(`resolves a legacy ${anchor} profile without a users anchor`, async () => {
      rows.clear(); revisions.clear()
      const id = anchor === 'document-id' ? UID : 'legacy-FAC'
      const link = anchor === 'document-id' ? {} : { [anchor]: anchor === 'email' ? EMAIL : UID }
      seed(`faculty/${id}`, { ...link, collegeId: 'college-a', name: 'Original' })
      await api.updateMyStaffProfile.run(request({ name: 'Legacy Updated' }))
      assert.equal(rows.get(`faculty/${id}`)!.name, 'Legacy Updated')
      assert.equal(rows.has(`users/${UID}`), false, 'settings must not create identity anchors')
      assert.equal(authName, 'Legacy Updated')
    })
  }
  it('supports legitimate users-only provisioning without inventing a faculty/admin document', async () => {
    rows.clear(); revisions.clear()
    seed(`users/${UID}`, { uid: UID, role: 'faculty', collegeId: 'college-a', name: 'Original' })
    await api.updateMyStaffProfile.run(request({ name: 'Users Only' }))
    assert.equal(rows.size, 1)
    assert.equal(rows.get(`users/${UID}`)!.name, 'Users Only')
  })
  for (const role of ['student', 'parent', 'accounts', 'operations', 'unrecognized', '__proto__']) {
    it(`refuses the ${role} role even if a staff profile is present`, async () => {
      await assert.rejects(api.updateMyStaffProfile.run(request({ phone: '' }, { role })), /active staff/)
      assert.equal(writes.length, 0); assert.equal(authCalls.length, 0)
    })
  }
  it('rejects unsigned callers and never takes identity or tenancy from a payload', async () => {
    await assert.rejects(api.updateMyStaffProfile.run({ data: { name: 'Anonymous' } } as any), /Authentication/)
    await assert.rejects(api.updateMyStaffProfile.run(request({ name: 'Forged', collegeId: 'college-b' })), /Only name/)
    assert.equal(writes.length, 0)
  })
  for (const token of [{ collegeId: null }, { collegeId: '' }, { role: '' }, { employeeStatus: 'suspended' }]) {
    it(`refuses missing/stale/suspended claims ${JSON.stringify(token)}`, async () => {
      await assert.rejects(api.updateMyStaffProfile.run(request({ phone: '' }, token)))
      assert.equal(writes.length, 0)
    })
  }
  for (const patch of [{ collegeId: 'college-b' }, { role: 'student' }, { uid: 'other-person' }, { userId: 'other-person' }, { employeeStatus: 'suspended' }, { status: 'suspended' }]) {
    it(`refuses a changed canonical identity ${JSON.stringify(patch)}`, async () => {
      seed(`users/${UID}`, { ...rows.get(`users/${UID}`), ...patch })
      await assert.rejects(api.updateMyStaffProfile.run(request({ phone: '' })), /identity has changed/)
      assert.equal(writes.length, 0)
    })
  }
  for (const patch of [{ uid: 'other-person' }, { userId: 'other-person' }, { collegeId: 'college-b' }]) {
    it(`refuses conflicting canonical profile linkage ${JSON.stringify(patch)}`, async () => {
      seed('faculty/FAC001', { ...saved(), ...patch })
      await assert.rejects(api.updateMyStaffProfile.run(request({ name: 'Not allowed' })), /linkage is inconsistent/)
      assert.equal(writes.length, 0); assert.equal(authCalls.length, 0)
    })
  }
  it('will not use an email match to overwrite another explicit UID', async () => {
    seed(`users/${UID}`, { uid: UID, role: 'faculty', collegeId: 'college-a' })
    seed('faculty/FAC001', { uid: 'someone-else', collegeId: 'college-a', email: EMAIL })
    await assert.rejects(api.updateMyStaffProfile.run(request({ name: 'Not allowed' })), /linkage is inconsistent/)
    assert.equal(writes.length, 0)
  })
  it('refuses ambiguous UID queries instead of selecting the first imported profile', async () => {
    seed(`users/${UID}`, { uid: UID, role: 'faculty', collegeId: 'college-a' })
    seed('faculty/FAC002', { uid: UID, collegeId: 'college-a' })
    await assert.rejects(api.updateMyStaffProfile.run(request({ name: 'Ambiguous' })), /Multiple staff profiles/)
    assert.equal(writes.length, 0)
  })
  it('does not fall back when an official canonical pointer is missing or path-injected', async () => {
    for (const facultyDocId of ['missing', '../other']) {
      seed(`users/${UID}`, { uid: UID, role: 'faculty', collegeId: 'college-a', facultyDocId })
      await assert.rejects(api.updateMyStaffProfile.run(request({ name: 'No partial record' })))
    }
    assert.equal(writes.length, 0)
  })
  it('a failed canonical batch never changes Auth or leaves a partial Firestore edit', async () => {
    failCommit = true
    await assert.rejects(api.updateMyStaffProfile.run(request({ name: 'Should not apply' })), /Firestore unavailable/)
    assert.equal(saved().name, 'Original'); assert.equal(rows.get(`users/${UID}`)!.name, 'Original')
    assert.equal(authCalls.length, 0); assert.equal(writes.length, 0)
  })
  it('snapshot preconditions prevent a concurrent reassignment from being overwritten', async () => {
    beforeCommit = () => seed('faculty/FAC001', { ...saved(), uid: 'new-owner' })
    await assert.rejects(api.updateMyStaffProfile.run(request({ name: 'Old owner edit' })), /snapshot precondition/)
    assert.equal(saved().uid, 'new-owner'); assert.equal(saved().name, 'Original')
    assert.equal(writes.length, 0); assert.equal(authCalls.length, 0)
  })
  it('reports a retryable Auth mirror failure without falsely reporting the canonical save as lost', async () => {
    authUpdate = async () => { throw new Error('Auth unavailable') }
    const first = await api.updateMyStaffProfile.run(request({ name: 'Saved Name' }))
    assert.equal(first.success, true); assert.equal(first.authDisplayNameSynced, false)
    assert.equal(saved().name, 'Saved Name'); assert.equal(rows.get(`users/${UID}`)!.name, 'Saved Name')
    authUpdate = undefined
    const second = await api.updateMyStaffProfile.run(request({ name: 'Saved Name' }))
    assert.equal(second.authDisplayNameSynced, true); assert.equal(authName, 'Saved Name')
  })
  it('reconciles out-of-order Auth completions to the newest canonical display name', async () => {
    let release!: () => void
    let entered!: () => void
    const blocked = new Promise<void>(resolve => { release = resolve })
    const started = new Promise<void>(resolve => { entered = resolve })
    authUpdate = async (_uid, name) => { if (name === 'Earlier Name') { entered(); await blocked } }
    const earlier = api.updateMyStaffProfile.run(request({ name: 'Earlier Name' }))
    await started
    await api.updateMyStaffProfile.run(request({ name: 'Latest Name' }))
    release()
    await earlier
    assert.equal(saved().name, 'Latest Name'); assert.equal(authName, 'Latest Name')
  })
})
