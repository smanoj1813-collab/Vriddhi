// College-owned academic configuration: review -> save revision -> explicitly activate.
// Pure contracts/validation/evaluation live under academic/ and are also used by the browser.
import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { assertAcademicDocumentBudget } from './utils/firestoreBudget'
import { SCHEME_PACK_PRESETS, type AcademicContext, type UniversitySchemePack } from './academic/schemePack'
import { normalizeSchemePack } from './academic/schemeValidation'
import { readCollegeScheme, readCollegeSchemes } from './academic/schemeResolution'
import { collegeSchemeFields, normalizeCollegeSchemeSelection, readPinnedCollegeSchemes, type CollegeSchemeSelection, type CollegeSchemeConfiguration } from './academic/collegeSchemes'

export type SchemePackDoc = UniversitySchemePack
export const PRESET_SCHEME_CODES = SCHEME_PACK_PRESETS.map((p) => p.code)
export type SchemeStage = 'author' | 'activate'
const ROLES: Record<SchemeStage, readonly string[]> = {
  author: ['superadmin', 'admin', 'principal', 'hod'],
  activate: ['superadmin', 'admin', 'principal'],
}
export function schemeStageAllows(stage: SchemeStage, role: unknown): boolean {
  return ROLES[stage].includes(
    String(role || '')
      .trim()
      .toLowerCase(),
  )
}
export function validateSchemePackDoc(raw: unknown): SchemePackDoc {
  try {
    return normalizeSchemePack(raw)
  } catch (err) {
    throw new HttpsError('invalid-argument', err instanceof Error ? err.message : 'Invalid scheme pack')
  }
}
async function resolveAcademicStaff(uid: string, token: Record<string, unknown>, stage: SchemeStage) {
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  const user = userDoc.data()
  const role = String(token.role || user?.role || '')
    .trim()
    .toLowerCase()
  const collegeId = String(token.collegeId || user?.collegeId || '').trim()
  if (!userDoc.exists || !schemeStageAllows(stage, role) || (role !== 'superadmin' && !collegeId)) {
    throw new HttpsError(
      'permission-denied',
      stage === 'activate'
        ? 'Only the college admin, principal or superadmin may activate college-wide academic rules'
        : 'College academic administrator access is required',
    )
  }
  return { uid, role, collegeId }
}
function targetCollege(staff: { role: string; collegeId: string }, raw: Record<string, unknown>): string {
  const collegeId =
    staff.role === 'superadmin' ? String(raw.collegeId || staff.collegeId || '').trim() : staff.collegeId
  if (!collegeId || collegeId.includes('/'))
    throw new HttpsError('invalid-argument', 'A valid college is required')
  if (staff.role !== 'superadmin' && raw.collegeId && raw.collegeId !== collegeId)
    throw new HttpsError('permission-denied', 'Cannot configure another college')
  return collegeId
}
/** Used inside grade transactions as well: assignment cannot change mid-write. */
export async function resolveCollegeSchemeOnServer(
  collegeId: string,
  transaction?: FirebaseFirestore.Transaction,
  context?: AcademicContext,
) {
  const db = admin.firestore()
  const read = async (collection: string, id: string) => {
    const ref = db.collection(collection).doc(id)
    const snap = transaction ? await transaction.get(ref) : await ref.get()
    return snap.exists ? (snap.data() as Record<string, unknown>) : undefined
  }
  try {
    return await readCollegeScheme(collegeId, {
      college: (id) => read('colleges', id),
      customPack: (id) => read('schemePacks', id),
    }, context)
  } catch (err) {
    throw new HttpsError(
      'failed-precondition',
      err instanceof Error ? err.message : 'College scheme configuration required',
    )
  }
}
/** Read the whole assignment once for a transaction containing different cohorts. */
export async function resolveCollegeSchemesOnServer(collegeId: string, transaction?: FirebaseFirestore.Transaction) {
  const read = async (collection: string, id: string) => {
    const ref = admin.firestore().collection(collection).doc(id)
    const snap = transaction ? await transaction.get(ref) : await ref.get()
    return snap.exists ? snap.data() as Record<string, unknown> : undefined
  }
  try { return await readCollegeSchemes(collegeId, { college: id => read('colleges', id), customPack: id => read('schemePacks', id) }) }
  catch (err) { throw new HttpsError('failed-precondition', err instanceof Error ? err.message : 'College scheme configuration required') }
}

/** Reads only: callers must finish all reads before queuing Firestore writes. */
export async function pinCollegeSchemeSelection(collegeId: string, selection: CollegeSchemeSelection, transaction: FirebaseFirestore.Transaction, previous?: Record<string, unknown>): Promise<CollegeSchemeConfiguration> {
  let old = previous ? readPinnedCollegeSchemes(collegeId, previous) : null
  // First migration from the single-pack format must preserve an already
  // reviewed old snapshot even if its source now has a newer revision.
  if (!old && previous?.schemePackSnapshot && selection.assignments.some(a => a.schemePackId === previous.schemePackId && a.revision === previous.schemePackRevision)) {
    old = await readCollegeSchemes(collegeId, { college: async () => previous, customPack: async () => undefined })
  }
  const assignments = []
  for (const choice of selection.assignments) {
    const pinned = old?.assignments.find(a => a.schemePackId === choice.schemePackId && a.revision === choice.revision)
    if (pinned) { assignments.push(pinned); continue }
    const preset = SCHEME_PACK_PRESETS.find(p => p.id === choice.schemePackId)
    let pack: UniversitySchemePack
    if (preset) pack = validateSchemePackDoc(preset)
    else {
      if (!choice.schemePackId.startsWith(`${collegeId}__`)) throw new HttpsError('permission-denied', 'Only this college’s own packs may be assigned')
      const doc = await transaction.get(admin.firestore().collection('schemePacks').doc(choice.schemePackId))
      if (!doc.exists) throw new HttpsError('not-found', 'An assigned scheme pack was not found')
      if (doc.data()?.collegeId !== collegeId) throw new HttpsError('permission-denied', 'An assigned scheme belongs to another college')
      pack = validateSchemePackDoc({ ...doc.data(), id: doc.id })
    }
    if (pack.status !== 'active' || !pack.sourceNote?.trim()) throw new HttpsError('failed-precondition', 'Only an active, reviewed pack with its regulations reference can be assigned. Research drafts are not academic rules.')
    if (pack.revision !== choice.revision) throw new HttpsError('aborted', 'Scheme revision changed. Reload and review before assigning it.')
    assignments.push({ ...choice, snapshot: pack })
  }
  const configuration = { ...selection, assignments, revision: Number(previous?.schemeConfigurationRevision || 0) + 1, needsReconfirmation: false }
  return configuration
}
export function validateCollegeSchemeSelection(value: unknown) {
  try { return normalizeCollegeSchemeSelection(value) }
  catch (err) { throw new HttpsError('invalid-argument', err instanceof Error ? err.message : 'Invalid college scheme selection') }
}
export function assertSchemeConfigurationRevision(raw: unknown, college: Record<string, unknown>) {
  const current = Number(college.schemeConfigurationRevision || 0)
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw !== current) throw new HttpsError('aborted', 'College scheme assignments changed. Reload before saving.')
}
export function queueSchemeAssignmentAudit(transaction: FirebaseFirestore.Transaction, collegeId: string, uid: string, configuration: CollegeSchemeConfiguration, previous?: Record<string, unknown>) {
  const now = admin.firestore.FieldValue.serverTimestamp()
  transaction.create(admin.firestore().collection('schemePackAudit').doc(), {
    collegeId, action: configuration.assignments.length ? 'assignments_configured' : 'configuration_cleared',
    configurationRevision: configuration.revision, primarySchemePackId: configuration.primarySchemePackId,
    assignments: configuration.assignments.map(({ schemePackId, revision }) => ({ schemePackId, revision })),
    routes: configuration.routes, previousPrimarySchemePackId: previous?.primarySchemePackId ?? previous?.schemePackId ?? null,
    previousConfigurationRevision: previous?.schemeConfigurationRevision ?? 0, performedBy: uid, performedAt: now,
  })
}

const REGION = { region: 'asia-south1' as const }

export const saveSchemePack = onCall(REGION, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  const staff = await resolveAcademicStaff(uid, request.auth?.token || {}, 'author')
  const raw = (request.data || {}) as Record<string, unknown>
  const collegeId = targetCollege(staff, raw)
  const pack = validateSchemePackDoc(raw.pack)
  if (PRESET_SCHEME_CODES.includes(pack.code))
    throw new HttpsError('invalid-argument', 'Preset codes are reserved — pick a custom code')
  const db = admin.firestore()
  const id = `${collegeId}__${pack.code}`
  const ref = db.collection('schemePacks').doc(id)
  const collegeRef = db.collection('colleges').doc(collegeId)
  const auditRef = db.collection('schemePackAudit').doc()
  return db.runTransaction(async (transaction) => {
    const [existing, college] = await transaction.getAll(ref, collegeRef)
    if (!college.exists) throw new HttpsError('not-found', 'College not found')
    if (existing.exists && existing.data()?.collegeId !== collegeId)
      throw new HttpsError('permission-denied', 'This scheme belongs to another college')
    const oldRevision = existing.exists ? Number(existing.data()?.revision ?? 1) : 0
    if (existing.exists && Number((raw.pack as Record<string, unknown>)?.revision) !== oldRevision)
      throw new HttpsError('aborted', 'Scheme was edited by someone else. Reload before saving.')
    const revision = oldRevision + 1
    const saved = { ...pack, id, revision }
    const now = admin.firestore.FieldValue.serverTimestamp()
    // Pin a pre-upgrade explicit assignment BEFORE editing its source document.
    // Otherwise the first edit would silently change a live legacy college.
    if (college.data()?.schemePackId === id && !college.data()?.schemePackSnapshot && existing.exists) {
      const old = validateSchemePackDoc({ ...existing.data(), id, revision: oldRevision })
      if (old.status !== 'active')
        throw new HttpsError(
          'failed-precondition',
          'Reactivate a valid scheme before editing this legacy assignment',
        )
      assertAcademicDocumentBudget({ ...college.data(), schemePackSnapshot: old, schemePackRevision: oldRevision })
      transaction.update(collegeRef, { schemePackSnapshot: old, schemePackRevision: oldRevision })
    }
    assertAcademicDocumentBudget({ ...saved, collegeId, createdAt: now, createdBy: uid, updatedAt: now, updatedBy: uid }, 'Scheme revision')
    transaction.set(ref, {
      ...saved,
      collegeId,
      createdAt: existing.data()?.createdAt || now,
      createdBy: existing.data()?.createdBy || uid,
      updatedAt: now,
      updatedBy: uid,
    })
    transaction.create(ref.collection('revisions').doc(String(revision)), {
      ...saved,
      collegeId,
      createdAt: now,
      createdBy: uid,
    })
    transaction.create(auditRef, {
      collegeId,
      schemePackId: id,
      revision,
      action: 'revision_saved',
      performedBy: uid,
      performedAt: now,
    })
    return { id, code: pack.code, name: pack.name, revision, updated: existing.exists }
  })
})

export const assignCollegeSchemePack = onCall(REGION, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  const staff = await resolveAcademicStaff(uid, request.auth?.token || {}, 'activate')
  const raw = (request.data || {}) as Record<string, unknown>
  const collegeId = targetCollege(staff, raw)
  const id = String(raw.schemePackId ?? '').trim()
  if (id.includes('/')) throw new HttpsError('invalid-argument', 'Invalid scheme identifier')
  const preset = SCHEME_PACK_PRESETS.find((p) => p.id === id || p.code === id)
  const db = admin.firestore()
  const collegeRef = db.collection('colleges').doc(collegeId)
  const auditRef = db.collection('schemePackAudit').doc()
  return db.runTransaction(async (transaction) => {
    const college = await transaction.get(collegeRef)
    if (!college.exists) throw new HttpsError('not-found', 'College not found')
    if (Array.isArray(college.data()?.schemePackAssignments) && (college.data()!.schemePackAssignments.length > 1 || college.data()!.schemePackRoutes?.length)) throw new HttpsError('failed-precondition', 'Use the multi-pack configuration editor; the legacy single-pack action cannot replace programme/cohort assignments')
    let pack: UniversitySchemePack | null = null
    if (id) {
      if (preset) pack = validateSchemePackDoc(preset)
      else {
        const doc = await transaction.get(db.collection('schemePacks').doc(id))
        if (!doc.exists) throw new HttpsError('not-found', 'Scheme pack not found')
        if (doc.data()?.collegeId !== collegeId)
          throw new HttpsError('permission-denied', 'This scheme belongs to another college')
        pack = validateSchemePackDoc({ ...doc.data(), id })
      }
      if (pack.status !== 'active')
        throw new HttpsError('failed-precondition', 'Only an active, validated scheme can be activated')
      if (!pack.sourceNote?.trim())
        throw new HttpsError(
          'failed-precondition',
          'Add the approved syllabus/regulations reference before activation',
        )
      if (Number(raw.revision) !== pack.revision)
        throw new HttpsError(
          'aborted',
          'Scheme revision changed. Reload and review the current revision before activation.',
        )
    }
    const now = admin.firestore.FieldValue.serverTimestamp()
    const patch = {
      ...collegeSchemeFields({ assignments: pack ? [{ schemePackId: pack.id, revision: pack.revision!, snapshot: pack }] : [], primarySchemePackId: pack?.id ?? null, routes: [], revision: Number(college.data()?.schemeConfigurationRevision || 0) + 1, needsReconfirmation: false }),
      schemePackId: pack?.id ?? null,
      schemePackSnapshot: pack,
      schemePackRevision: pack?.revision ?? null,
      schemePackAssignedAt: now,
      schemePackAssignedBy: uid,
      updatedAt: now,
    }
    assertAcademicDocumentBudget({ ...college.data(), ...patch })
    transaction.update(collegeRef, patch)
    transaction.create(auditRef, {
      collegeId,
      schemePackId: pack?.id ?? null,
      revision: pack?.revision ?? null,
      previousSchemePackId: college.data()?.schemePackId ?? null,
      previousRevision: college.data()?.schemePackRevision ?? null,
      action: pack ? 'activated' : 'configuration_cleared',
      performedBy: uid,
      performedAt: now,
    })
    return {
      collegeId,
      schemePackId: pack?.id ?? null,
      revision: pack?.revision ?? null,
      resolvedName: pack?.name ?? 'Configuration required — no scheme active',
    }
  })
})


export const configureCollegeSchemePacks = onCall(REGION, async request => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  const staff = await resolveAcademicStaff(request.auth.uid, request.auth.token || {}, 'activate')
  const raw = (request.data || {}) as Record<string, unknown>
  const collegeId = targetCollege(staff, raw)
  const selection = validateCollegeSchemeSelection(raw.selection)
  const collegeRef = admin.firestore().collection('colleges').doc(collegeId)
  return admin.firestore().runTransaction(async transaction => {
    const college = await transaction.get(collegeRef)
    if (!college.exists) throw new HttpsError('not-found', 'College not found')
    assertSchemeConfigurationRevision(raw.expectedConfigurationRevision, college.data()!)
    const configuration = await pinCollegeSchemeSelection(collegeId, selection, transaction, college.data())
    const now = admin.firestore.FieldValue.serverTimestamp()
    const patch = { ...collegeSchemeFields(configuration), schemePackAssignedAt: now, schemePackAssignedBy: request.auth!.uid, updatedAt: now }
    assertAcademicDocumentBudget({ ...college.data(), ...patch })
    transaction.update(collegeRef, patch)
    queueSchemeAssignmentAudit(transaction, collegeId, request.auth!.uid, configuration, college.data())
    return { collegeId, configurationRevision: configuration.revision }
  })
})
