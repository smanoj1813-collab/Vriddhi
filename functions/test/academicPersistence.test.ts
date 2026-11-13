import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import admin from 'firebase-admin'
import { academicFixture } from './helpers/academicFixture'

// Exercise the actual callable handlers against an atomic in-memory Firestore
// boundary. It rejects reads-after-writes, supports rollback and never contacts
// a real Firebase project. This is not a substitute for emulator rules tests.
let auto = 0
let data: Map<string, Record<string, any>>
class Ref {
  constructor(readonly path: string) {}
  get id() {
    return this.path.split('/').pop()!
  }
  collection(name: string) {
    return new Col(`${this.path}/${name}`)
  }
  async get() {
    return snapshot(this)
  }
}
class Col {
  constructor(readonly path: string, readonly filters: Array<[string, unknown]> = [], readonly max = Infinity) {}
  where(field: string, op: string, value: unknown) {
    assert.equal(op, '==')
    return new Col(this.path, [...this.filters, [field, value]], this.max)
  }
  limit(max: number) { return new Col(this.path, this.filters, max) }
  doc(id = `auto-${++auto}`) {
    return new Ref(`${this.path}/${id}`)
  }
}
function snapshot(ref: Ref | Col): any {
  if (ref instanceof Col) {
    const docs = [...data.entries()].filter(([path, row]) => path.startsWith(`${ref.path}/`) && path.split('/').length === ref.path.split('/').length + 1 && ref.filters.every(([field, value]) => row[field] === value)).slice(0, ref.max).map(([path]) => snapshot(new Ref(path)))
    return { docs, size: docs.length, empty: !docs.length }
  }
  const row = data.get(ref.path)
  return { ref, id: ref.id, exists: row !== undefined, data: () => (row ? { ...row } : undefined) }
}
const fakeDb = {
  collection: (name: string) => new Col(name),
  async runTransaction<T>(fn: (t: any) => Promise<T>) {
    let writesStarted = false
    const writes: Array<{ op: string; ref: Ref; value?: any }> = []
    const read = (ref: Ref) => {
      assert.equal(writesStarted, false, 'Firestore transactions must read before writing')
      return snapshot(ref)
    }
    const txn: any = { get: async (ref: Ref) => read(ref), getAll: async (...refs: Ref[]) => refs.map(read) }
    for (const op of ['set', 'update', 'create', 'delete'])
      txn[op] = (ref: Ref, value?: any) => {
        writesStarted = true
        writes.push({ op, ref, value })
        return txn
      }
    const result = await fn(txn)
    const next = new Map(data)
    for (const w of writes) {
      if (w.op === 'create') assert.equal(next.has(w.ref.path), false, 'create must not overwrite')
      if (w.op === 'update') assert.equal(next.has(w.ref.path), true, 'update needs an existing document')
      if (w.op === 'delete') next.delete(w.ref.path)
      else next.set(w.ref.path, w.op === 'update' ? { ...next.get(w.ref.path), ...w.value } : { ...w.value })
    }
    data = next
    return result
  },
}
let packs: typeof import('../src/schemePacks')
let grades: typeof import('../src/gradeRecords')
let onboarding: typeof import('../src/collegeOnboarding')
const original = admin.firestore
const originalDescriptor = Object.getOwnPropertyDescriptor(admin, 'firestore')
before(async () => {
  Object.defineProperty(admin, 'firestore', {
    configurable: true,
    value: Object.assign(() => fakeDb, { FieldValue: original.FieldValue, Timestamp: original.Timestamp }),
  })
  packs = await import('../src/schemePacks')
  grades = await import('../src/gradeRecords')
  onboarding = await import('../src/collegeOnboarding')
})
after(() => {
  if (originalDescriptor) Object.defineProperty(admin, 'firestore', originalDescriptor)
  else delete (admin as any).firestore
})
beforeEach(() => {
  auto = 0
  data = new Map([
    ['users/admin-a', { role: 'admin', collegeId: 'college-a' }],
    ['users/super-a', { role: 'superadmin' }],
    ['users/employee-a', { role: 'employee', collegeId: 'college-a' }],
    ['users/operations-a', { role: 'operations', collegeId: 'college-a' }],
    ['users/hod-a', { role: 'hod', collegeId: 'college-a' }],
    ['colleges/college-a', { name: 'Test college' }],
    ['colleges/college-b', { name: 'Another college' }],
    [
      'students/student-a',
      { name: 'Test student', regNo: 'A001', collegeId: 'college-a', course: 'BCA', batch: '2026-27' },
    ],
    [
      'students/student-b',
      { name: 'Other tenant student', regNo: 'B001', collegeId: 'college-b', course: 'BCA' },
    ],
  ])
})
function request(payload: Record<string, unknown>, uid = 'admin-a'): any {
  const staff = data.get(`users/${uid}`)!
  return { auth: { uid, token: staff }, data: payload }
}
async function save(pack: Record<string, unknown> = academicFixture() as any) {
  return packs.saveSchemePack.run(request({ pack, collegeId: 'college-a' }))
}
async function configure() {
  const saved = await save()
  await packs.assignCollegeSchemePack.run(
    request({ schemePackId: saved.id, revision: saved.revision, collegeId: 'college-a' }),
  )
  return saved
}
const gradeInput = (extra = {}) => ({
  studentId: 'student-a',
  semester: 1,
  code: 'CS101',
  subject: 'Untrusted client label',
  internal: 20,
  external: 27,
  ...extra,
})
function count(collection: string) {
  return [...data.keys()].filter((k) => k.startsWith(`${collection}/`) && k.split('/').length === 2).length
}

describe('academic configuration and official grade callables', () => {
  it('blocks unconfigured official grading with no partial writes or fallback policy', async () => {
    await assert.rejects(
      grades.saveDraftGradeRecords.run(request({ collegeId: 'college-a', records: [gradeInput()] })),
      /configuration required/,
    )
    assert.equal(count('gradeRecords'), 0)
    assert.equal(count('gradeRecordAudit'), 0)
    assert.equal(data.get('colleges/college-a')!.schemePackId, undefined)
  })
  it('uses college academic roles, not scheduling permissions; HOD authors but cannot activate', async () => {
    assert.equal(packs.schemeStageAllows('author', 'admin'), true)
    assert.equal(packs.schemeStageAllows('activate', 'principal'), true)
    assert.equal(packs.schemeStageAllows('activate', 'hod'), false)
    await assert.rejects(
      packs.saveSchemePack.run(request({ pack: academicFixture() }, 'operations-a')),
      /academic administrator/,
    )
    const saved = await packs.saveSchemePack.run(request({ pack: academicFixture() }, 'hod-a'))
    await assert.rejects(
      packs.assignCollegeSchemePack.run(request({ schemePackId: saved.id, revision: 1 }, 'hod-a')),
      /Only the college admin/,
    )
    await assert.rejects(
      packs.saveSchemePack.run(request({ pack: academicFixture() }, 'employee-a')),
      /academic administrator/,
    )
  })
  it('explicitly activates a preset, records the approval, and clears to UNCONFIGURED, not BCU', async () => {
    await packs.assignCollegeSchemePack.run(request({ schemePackId: 'KUD_NEP_CBAE', revision: 1 }))
    const current = await packs.resolveCollegeSchemeOnServer('college-a')
    assert.equal(current.pack.code, 'KUD_NEP_CBAE')
    assert.equal(current.needsReconfirmation, false)
    assert.equal(count('schemePackAudit'), 1)
    const cleared = await packs.assignCollegeSchemePack.run(request({ schemePackId: '' }))
    assert.match(cleared.resolvedName, /Configuration required/)
    assert.equal(data.get('colleges/college-a')!.schemePackSnapshot, null)
    await assert.rejects(packs.resolveCollegeSchemeOnServer('college-a'), /configuration required/)
  })
  it('saved revisions never mutate live rules; activation and optimistic locking require the reviewed revision', async () => {
    const first = await configure()
    const p = academicFixture()
    p.semesterEndExam.defaultMaxMarks = 70
    p.name = 'Revised synthetic policy'
    const second = await save(p as any)
    assert.equal(second.revision, 2)
    const active = await packs.resolveCollegeSchemeOnServer('college-a')
    assert.equal(active.revision, 1)
    assert.equal(active.pack.semesterEndExam.defaultMaxMarks, 80)
    assert.equal(data.get(`schemePacks/${first.id}/revisions/1`)!.semesterEndExam.defaultMaxMarks, 80)
    await assert.rejects(save(p as any), /Reload before saving/)
    await assert.rejects(
      packs.assignCollegeSchemePack.run(request({ schemePackId: first.id, revision: 1 })),
      /revision changed/,
    )
    await packs.assignCollegeSchemePack.run(request({ schemePackId: first.id, revision: 2 }))
    assert.equal(
      (await packs.resolveCollegeSchemeOnServer('college-a')).pack.semesterEndExam.defaultMaxMarks,
      70,
    )
  })
  it('pins a legacy explicit assignment before its source is edited', async () => {
    data.set('schemePacks/college-a__TEST_POLICY', { ...academicFixture(), collegeId: 'college-a' })
    data.set('colleges/college-a', { schemePackId: 'college-a__TEST_POLICY' })
    const p = academicFixture()
    p.semesterEndExam.defaultMaxMarks = 70
    await save(p as any)
    const active = await packs.resolveCollegeSchemeOnServer('college-a')
    assert.equal(active.pack.semesterEndExam.defaultMaxMarks, 80)
    assert.equal(active.revision, 1)
  })
  it('rejects cross-college, inactive and structurally invalid configuration changes', async () => {
    data.set('schemePacks/college-b__TEST_POLICY', {
      ...academicFixture(),
      id: 'college-b__TEST_POLICY',
      collegeId: 'college-b',
    })
    await assert.rejects(
      packs.assignCollegeSchemePack.run(request({ schemePackId: 'college-b__TEST_POLICY', revision: 1 })),
      /another college/,
    )
    await assert.rejects(
      packs.saveSchemePack.run(request({ collegeId: 'college-b', pack: academicFixture() })),
      /another college/,
    )
    const p = academicFixture()
    p.status = 'draft'
    const saved = await save(p as any)
    await assert.rejects(
      packs.assignCollegeSchemePack.run(request({ schemePackId: saved.id, revision: 1 })),
      /Only an active/,
    )
    await assert.rejects(save({ code: 'INCOMPLETE' }), /attendance/)
  })
  it('derives official credit/grade outcomes server-side and uses the canonical top-level workflow', async () => {
    await configure()
    const saved = await grades.saveDraftGradeRecords.run(
      request(
        {
          collegeId: 'college-a',
          records: [gradeInput()],
          importMetadata: { academicYear: '2026-27', examType: 'regular' },
        },
        'employee-a',
      ),
    )
    const row = data.get(`gradeRecords/${saved.ids[0]}`)!
    assert.equal(row.gradePoint, 0)
    assert.equal(row.credits, 4)
    assert.equal(row.grade, 'F')
    assert.equal(row.isPass, false)
    assert.equal(row.subject, 'Synthetic CS101')
    assert.equal(row.status, 'draft')
    assert.equal(row.schemePackRevision, 1)
    assert.equal(row.examType, 'regular')
    assert.ok(row.schemePolicySnapshot.profile)
    assert.equal(data.get('students/student-a')!.cgpa, undefined)
    assert.equal(
      [...data.keys()].some((k) => k.startsWith('colleges/college-a/gradeRecords/')),
      false,
    )
    await assert.rejects(
      grades.publishGradeRecords.run(request({ ids: saved.ids }, 'employee-a')),
      /Only the college/,
    )
    await grades.publishGradeRecords.run(request({ ids: saved.ids }))
    assert.equal(data.get(`gradeRecords/${saved.ids[0]}`)!.status, 'published')
    assert.equal(count('gradeRecordAudit'), 2)
    await assert.rejects(
      grades.saveDraftGradeRecords.run(request({ collegeId: 'college-a', records: [gradeInput()] })),
      /Published records cannot be overwritten/,
    )
  })
  it('distinguishes newly created drafts from idempotent draft updates', async () => {
    await configure()
    const first = await grades.saveDraftGradeRecords.run(
      request({ collegeId: 'college-a', records: [gradeInput()] }),
    )
    assert.equal(first.created, 1)
    assert.equal(first.updated, 0)
    const second = await grades.saveDraftGradeRecords.run(
      request({ collegeId: 'college-a', records: [gradeInput()] }),
    )
    assert.equal(second.created, 0)
    assert.equal(second.updated, 1)
    assert.deepEqual(second.ids, first.ids)
  })
  it('revalidates current policy on publication; old/unpinned drafts cannot slip through', async () => {
    const policy = await configure()
    const saved = await grades.saveDraftGradeRecords.run(
      request({ collegeId: 'college-a', records: [gradeInput()] }),
    )
    const p = academicFixture()
    p.passCriteria.aggregatePassPercentage = 50
    await save(p as any)
    await packs.assignCollegeSchemePack.run(request({ schemePackId: policy.id, revision: 2 }))
    await assert.rejects(grades.publishGradeRecords.run(request({ ids: saved.ids })), /Re-save/)
    assert.equal(data.get(`gradeRecords/${saved.ids[0]}`)!.status, 'draft')
    await assert.rejects(
      grades.saveDraftGradeRecords.run(
        request({
          collegeId: 'college-a',
          schemePackId: policy.id,
          schemePackRevision: 1,
          records: [gradeInput()],
        }),
      ),
      /changed since preview/,
    )
  })
  it('rolls back a batch containing tampered credits or a different-tenant student', async () => {
    await configure()
    await assert.rejects(
      grades.saveDraftGradeRecords.run(
        request({
          collegeId: 'college-a',
          records: [gradeInput(), gradeInput({ code: 'CS102', credits: 10 })],
        }),
      ),
      /Credits must match/,
    )
    assert.equal(count('gradeRecords'), 0)
    assert.equal(count('gradeRecordAudit'), 0)
    await assert.rejects(
      grades.saveDraftGradeRecords.run(
        request({ collegeId: 'college-a', records: [gradeInput({ studentId: 'student-b' })] }),
      ),
      /students are invalid/,
    )
  })
  it('retains component evidence and re-evaluates it again on publication', async () => {
    await configure()
    const saved = await grades.saveDraftGradeRecords.run(
      request({
        collegeId: 'college-a',
        records: [
          gradeInput({
            internal: undefined,
            external: 60,
            internalComponents: { tests: [16, 18, 12], assignment: [5] },
            attendancePercentage: 95,
          }),
        ],
      }),
    )
    assert.equal(data.get(`gradeRecords/${saved.ids[0]}`)!.internal, 18.5)
    await grades.publishGradeRecords.run(request({ ids: saved.ids }))
    assert.equal(data.get(`gradeRecords/${saved.ids[0]}`)!.assessmentEvidence.totalIA, 18.5)
  })
})


async function configureTwo() {
  const first = await save()
  const p = academicFixture()
  p.code = 'SECOND_POLICY'
  p.name = 'Second synthetic assigned policy'
  p.courses![0].credits = 6
  p.semesterEndExam.passPercentage = 50
  const second = await save(p as any)
  data.set('students/student-c', { name: 'Another cohort', regNo: 'C001', collegeId: 'college-a', course: 'BCA', batch: '2024-25' })
  const selection = { assignments: [{ schemePackId: first.id, revision: 1 }, { schemePackId: second.id, revision: 1 }], primarySchemePackId: first.id, routes: [{ batch: '2024-25', schemePackId: second.id }] }
  await packs.configureCollegeSchemePacks.run(request({ selection, expectedConfigurationRevision: 0 }))
  return { first, second, selection }
}

describe('multi-pack assignment, official assessment and onboarding transactions', () => {
  it('pins multiple independent revisions, primary, routes and actor audit in one transaction', async () => {
    const { first, second } = await configureTwo()
    const college = data.get('colleges/college-a')!
    assert.equal(college.schemePackAssignments.length, 2)
    assert.equal(college.primarySchemePackId, first.id)
    assert.equal(college.schemePackId, first.id)
    assert.equal(college.schemePackAssignments[1].schemePackId, second.id)
    assert.equal(college.schemeConfigurationRevision, 1)
    const policy = await packs.resolveCollegeSchemeOnServer('college-a', undefined, { programme: 'BCA', batch: '2024-25', semester: 1 })
    assert.equal(policy.schemePackId, second.id)
    const audit = [...data.values()].find(row => row.action === 'assignments_configured')!
    assert.equal(audit.performedBy, 'admin-a')
    assert.equal(audit.assignments.length, 2)
    assert.equal(audit.configurationRevision, 1)
  })
  it('rejects stale configuration writes and legacy single-pack replacements with no partial change', async () => {
    const { selection, first } = await configureTwo()
    const before = JSON.stringify([...data])
    await assert.rejects(packs.configureCollegeSchemePacks.run(request({ selection, expectedConfigurationRevision: 0 })), /assignments changed/)
    await assert.rejects(packs.assignCollegeSchemePack.run(request({ schemePackId: first.id, revision: 1 })), /multi-pack/)
    assert.equal(JSON.stringify([...data]), before)
  })
  it('preserves old pins when a primary/route changes, and requires explicit review to upgrade a revision', async () => {
    const { selection, first, second } = await configureTwo()
    const p = academicFixture()
    p.name = 'Unactivated new source revision'
    await save(p as any)
    const changed = { ...selection, primarySchemePackId: second.id }
    await packs.configureCollegeSchemePacks.run(request({ selection: changed, expectedConfigurationRevision: 1 }))
    assert.equal(data.get('colleges/college-a')!.schemePackAssignments[0].snapshot.name, 'Synthetic college policy')
    assert.equal(data.get('colleges/college-a')!.schemePackAssignments[0].revision, 1)
    changed.assignments[0].revision = 2
    await packs.configureCollegeSchemePacks.run(request({ selection: changed, expectedConfigurationRevision: 2 }))
    assert.equal(data.get('colleges/college-a')!.schemePackAssignments[0].snapshot.name, p.name)
    assert.equal(data.get('colleges/college-a')!.schemeConfigurationRevision, 3)
    assert.equal(data.get(`schemePacks/${first.id}`)!.revision, 2)
  })
  it('migrates a legacy pinned primary without silently upgrading it to a newer source revision', async () => {
    const saved = await save()
    const pinned = data.get(`schemePacks/${saved.id}`)!
    data.set('colleges/college-a', { name: 'Legacy college', schemePackId: saved.id, schemePackRevision: 1, schemePackSnapshot: pinned })
    await save({ ...pinned, name: 'New source not yet approved for this college' })
    const selection = { assignments: [{ schemePackId: saved.id, revision: 1 }], primarySchemePackId: saved.id, routes: [] }
    await packs.configureCollegeSchemePacks.run(request({ selection, expectedConfigurationRevision: 0 }))
    const resolved = await packs.resolveCollegeSchemeOnServer('college-a')
    assert.equal(resolved.revision, 1)
    assert.equal(resolved.pack.name, 'Synthetic college policy')
    assert.equal(data.get(`schemePacks/${saved.id}`)!.revision, 2)
    assert.equal(data.get('colleges/college-a')!.schemeConfigurationRevision, 1)
  })
  it('refuses draft, unreferenced, cross-tenant and stale source revisions', async () => {
    const saved = await save()
    const selection = { assignments: [{ schemePackId: saved.id, revision: 1 }], primarySchemePackId: saved.id, routes: [] }
    for (const patch of [{ status: 'draft' }, { sourceNote: '' }]) {
      const before = { ...data.get(`schemePacks/${saved.id}`)! }
      data.set(`schemePacks/${saved.id}`, { ...before, ...patch })
      await assert.rejects(packs.configureCollegeSchemePacks.run(request({ selection, expectedConfigurationRevision: 0 })), /reviewed pack|reference/)
      assert.equal(data.get('colleges/college-a')!.schemePackAssignments, undefined)
      data.set(`schemePacks/${saved.id}`, before)
    }
    await assert.rejects(packs.configureCollegeSchemePacks.run(request({ selection: { ...selection, assignments: [{ schemePackId: saved.id, revision: 2 }] }, expectedConfigurationRevision: 0 })), /revision changed/)
    await assert.rejects(packs.configureCollegeSchemePacks.run(request({ selection: { ...selection, assignments: [{ schemePackId: 'college-b__OTHER', revision: 1 }], primarySchemePackId: 'college-b__OTHER' }, expectedConfigurationRevision: 0 })), /own packs/)
  })
  it('enforces activation roles and tenant ownership on the multi-pack callable', async () => {
    const selection = { assignments: [], primarySchemePackId: null, routes: [] }
    await assert.rejects(packs.configureCollegeSchemePacks.run(request({ collegeId: 'college-b', selection, expectedConfigurationRevision: 0 })), /another college/)
    for (const uid of ['employee-a', 'hod-a', 'operations-a']) await assert.rejects(packs.configureCollegeSchemePacks.run(request({ selection, expectedConfigurationRevision: 0 }, uid)), /Only the college/)
  })
  it('routes every row from authoritative roster data in one mixed-cohort draft/publication batch', async () => {
    const { first, second } = await configureTwo()
    const result = await grades.saveDraftGradeRecords.run(request({ collegeId: 'college-a', schemeConfigurationRevision: 1, records: [gradeInput({ external: 35 }), gradeInput({ studentId: 'student-c', external: 35, batch: '2026-27', schemePackId: first.id })] }))
    const [a, c] = result.ids.map((id: string) => data.get(`gradeRecords/${id}`)!)
    assert.equal(a.schemePackId, first.id)
    assert.equal(a.credits, 4)
    assert.equal(a.result, 'P')
    assert.equal(c.schemePackId, second.id)
    assert.equal(c.batch, '2024-25')
    assert.equal(c.credits, 6)
    assert.equal(c.result, 'F')
    assert.equal(c.schemeSelection, 'route')
    await grades.publishGradeRecords.run(request({ ids: result.ids }))
    assert.equal(data.get(`gradeRecords/${result.ids[1]}`)!.status, 'published')
    assert.equal(data.get(`gradeRecords/${result.ids[1]}`)!.schemeConfigurationRevision, 1)
  })
  it('rejects stale previews or now-inapplicable drafts, without changing published provenance', async () => {
    const { second, selection } = await configureTwo()
    const result = await grades.saveDraftGradeRecords.run(request({ collegeId: 'college-a', records: [gradeInput({ studentId: 'student-c', external: 50 })] }))
    await packs.configureCollegeSchemePacks.run(request({ selection: { ...selection, routes: [] }, expectedConfigurationRevision: 1 }))
    await assert.rejects(grades.publishGradeRecords.run(request({ ids: result.ids })), /Re-save/)
    await assert.rejects(grades.saveDraftGradeRecords.run(request({ collegeId: 'college-a', schemeConfigurationRevision: 1, records: [gradeInput()] })), /changed since preview/)
    await assert.rejects(grades.saveDraftGradeRecords.run(request({ collegeId: 'college-a', schemePackId: second.id, schemePackRevision: 1, records: [gradeInput({ studentId: 'student-c', external: 50 })] })), /changed since preview/)
  })
  it('blocks missing routing context and rolls back an otherwise valid grade batch', async () => {
    await configureTwo()
    data.set('students/student-c', { ...data.get('students/student-c'), batch: '' })
    await assert.rejects(grades.saveDraftGradeRecords.run(request({ collegeId: 'college-a', records: [gradeInput(), gradeInput({ studentId: 'student-c' })] })), /missing/)
    assert.equal(count('gradeRecords'), 0)
    assert.equal(count('gradeRecordAudit'), 0)
  })
  it('clears all assignments explicitly and never reinstates BCU', async () => {
    await configureTwo()
    await packs.configureCollegeSchemePacks.run(request({ selection: { assignments: [], primarySchemePackId: null, routes: [] }, expectedConfigurationRevision: 1 }))
    assert.deepEqual(data.get('colleges/college-a')!.schemePackAssignments, [])
    assert.equal(data.get('colleges/college-a')!.schemePackSnapshot, null)
    await assert.rejects(packs.resolveCollegeSchemeOnServer('college-a'), /configuration required/)
  })
  it('onboards a college and its multiple selections/affiliation atomically using generated university IDs', async () => {
    data.set('universities/generated-uni-id', { name: 'Test university', code: 'BCU' })
    const result = await onboarding.saveCollegeWithSchemes.run(request({ details: { name: 'New college', code: 'NEW', universityId: 'generated-uni-id', schemePackSnapshot: { tampered: true }, createdBy: 'spoofed' }, selection: { assignments: [{ schemePackId: 'BCU_SEP_2024', revision: 1 }, { schemePackId: 'KUD_NEP_CBAE', revision: 1 }], primarySchemePackId: 'KUD_NEP_CBAE', routes: [{ programme: 'BCA', schemePackId: 'BCU_SEP_2024' }] } }, 'super-a'))
    const college = data.get(`colleges/${result.collegeId}`)!
    assert.equal(college.universityCode, 'BCU')
    assert.equal(college.universityName, 'Test university')
    assert.equal(college.schemePackAssignments.length, 2)
    assert.equal(college.primarySchemePackId, 'KUD_NEP_CBAE')
    assert.equal(college.createdBy, 'super-a')
    assert.equal(college.schemePackSnapshot.tampered, undefined)
    assert.equal(result.configurationRevision, 1)
  })
  it('leaves no partially created college for invalid packs, revisions, primary or affiliation', async () => {
    const details = { name: 'New college', code: 'NEW' }
    const selection = { assignments: [{ schemePackId: 'BCU_SEP_2024', revision: 7 }], primarySchemePackId: 'BCU_SEP_2024', routes: [] }
    for (const payload of [{ details, selection }, { details: { ...details, universityId: 'BCU' } }, { details, selection: { ...selection, primarySchemePackId: null } }]) {
      await assert.rejects(onboarding.saveCollegeWithSchemes.run(request(payload, 'super-a')))
      assert.equal(count('colleges'), 2)
      assert.equal(count('schemePackAudit'), 0)
    }
  })
  it('enforces superadmin, duplicate code and the server onboarding toggle', async () => {
    const details = { name: 'New college', code: 'NEW' }
    await assert.rejects(onboarding.saveCollegeWithSchemes.run(request({ details })), /superadmin/)
    data.set('systemConfig/app', { allowCollegeOnboarding: false })
    await assert.rejects(onboarding.saveCollegeWithSchemes.run(request({ details }, 'super-a')), /disabled/)
    data.set('systemConfig/app', { allowCollegeOnboarding: true })
    await onboarding.saveCollegeWithSchemes.run(request({ details }, 'super-a'))
    await assert.rejects(onboarding.saveCollegeWithSchemes.run(request({ details }, 'super-a')), /already in use/)
    assert.equal(count('colleges'), 3)
  })
  it('edits college details and assignments together with optimistic revision checking, even while onboarding is off', async () => {
    const { selection } = await configureTwo()
    data.set('systemConfig/app', { allowCollegeOnboarding: false })
    const details = { name: 'Updated college', code: 'A' }
    await assert.rejects(onboarding.saveCollegeWithSchemes.run(request({ collegeId: 'college-a', details, selection, expectedConfigurationRevision: 0 }, 'super-a')), /assignments changed/)
    assert.equal(data.get('colleges/college-a')!.name, 'Test college')
    await onboarding.saveCollegeWithSchemes.run(request({ collegeId: 'college-a', details, selection, expectedConfigurationRevision: 1 }, 'super-a'))
    assert.equal(data.get('colleges/college-a')!.name, 'Updated college')
    assert.equal(data.get('colleges/college-a')!.schemeConfigurationRevision, 2)
  })
})

describe('complete academic document storage budget', () => {
  it('counts duplicated primary snapshots, UTF-8 and fixed-width numbers rather than configuration JSON only', async () => {
    const p = academicFixture()
    p.applicableProgrammes = ['ಕ'.repeat(120)]
    p.courses = Array.from({ length: 500 }, (_, i) => ({ ...p.courses![0], programme: p.applicableProgrammes[0], code: `LARGE${i}`, name: 'ಕ'.repeat(200), category: 'C'.repeat(50), batch: '2'.repeat(40) }))
    p.creditRequirements = []
    const saved = await save(p as any)
    // The former 650KB config-only JSON check would admit this one large pack.
    assert.ok(Buffer.byteLength(JSON.stringify(p), 'utf8') < 650000)
    const selection = { assignments: [{ schemePackId: saved.id, revision: 1 }], primarySchemePackId: saved.id, routes: [] }
    const before = JSON.stringify([...data])
    await assert.rejects(packs.configureCollegeSchemePacks.run(request({ selection, expectedConfigurationRevision: 0 })), /too large.*storage/)
    assert.equal(JSON.stringify([...data]), before)
    await assert.rejects(packs.assignCollegeSchemePack.run(request({ schemePackId: saved.id, revision: 1 })), /too large.*storage/)
    assert.equal(JSON.stringify([...data]), before)
  })
  it('accounts for existing college metadata in multi-assignment and atomic onboarding edits', async () => {
    const saved = await save()
    data.set('colleges/college-a', { ...data.get('colleges/college-a'), largeMetadata: 'x'.repeat(890000) })
    const selection = { assignments: [{ schemePackId: saved.id, revision: 1 }], primarySchemePackId: saved.id, routes: [] }
    const before = JSON.stringify([...data])
    await assert.rejects(packs.configureCollegeSchemePacks.run(request({ selection, expectedConfigurationRevision: 0 })), /too large/)
    await assert.rejects(onboarding.saveCollegeWithSchemes.run(request({ collegeId: 'college-a', details: { name: 'Must not be written', code: 'A' }, selection, expectedConfigurationRevision: 0 }, 'super-a')), /too large/)
    assert.equal(JSON.stringify([...data]), before)
  })
})
