// Self-service staff settings. Identity, tenancy, role and academic assignments
// are never payload fields, and no partial profile/identity document is created.
import * as admin from 'firebase-admin'
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import { normalizeEmail, normalizeRole, pickCollegeId } from './identityShared'

const PROFILE_COLLECTIONS: Record<string, string[]> = {
  faculty: ['faculty'], employee: ['faculty'],
  admin: ['admins', 'faculty'], principal: ['admins', 'faculty'],
  hod: ['admins', 'faculty', 'hods'], mentor: ['faculty', 'mentors'],
  superadmin: ['superadmins'],
}
const FACULTY_PREFS = ['classes', 'attendance', 'assignments', 'announcements']
const ADMIN_PREFS = ['emailAssessments', 'smsAttendance', 'weeklyReports', 'milestoneAlerts', 'maintenance', 'pushEnabled']
type Row = Record<string, unknown>
type Snapshot = admin.firestore.DocumentSnapshot

export function parseStaffProfileUpdate(value: unknown): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'Editable profile fields are required')
  }
  const input = value as Row
  const keys = Object.keys(input)
  if (!keys.length || keys.some(key => !['name', 'phone', 'notificationPrefs'].includes(key))) {
    throw new HttpsError('invalid-argument', 'Only name, phone and notificationPrefs may be updated')
  }
  const patch: Row = {}
  if ('name' in input) {
    if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.trim().length > 100
      || [...input.name].some(c => c.charCodeAt(0) < 32)) {
      throw new HttpsError('invalid-argument', 'Name must be between 2 and 100 characters without control characters')
    }
    patch.name = input.name.trim().replace(/\s+/g, ' ')
  }
  if ('phone' in input) {
    if (typeof input.phone !== 'string' || input.phone.length > 32 || !/^[+()\d .-]*$/.test(input.phone)) {
      throw new HttpsError('invalid-argument', 'Enter a valid phone number (up to 32 characters), or leave it blank')
    }
    patch.phone = input.phone.trim()
  }
  if ('notificationPrefs' in input) {
    const prefs = input.notificationPrefs
    if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
      throw new HttpsError('invalid-argument', 'Notification preferences must be boolean values')
    }
    const source = prefs as Row
    const allowed = [FACULTY_PREFS, ADMIN_PREFS].find(fields => fields.length === Object.keys(source).length
      && fields.every(key => typeof source[key] === 'boolean'))
    if (!allowed) throw new HttpsError('invalid-argument', 'Provide only the supported boolean notification preferences')
    patch.notificationPrefs = Object.fromEntries(allowed.map(key => [key, source[key]]))
  }
  return patch
}

function text(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }

interface StaffIdentity {
  uid: string
  role: string
  collegeId: string | null
  email: string
  user: Snapshot
  profile: Snapshot | null
}

/** Every lookup is derived from the verified caller; email is a last-resort
 * legacy anchor and may never override a conflicting explicit UID link. */
async function resolveStaffIdentity(request: CallableRequest): Promise<StaffIdentity> {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  const { uid, token } = request.auth
  const role = normalizeRole(token.role)
  if (!Object.prototype.hasOwnProperty.call(PROFILE_COLLECTIONS, role) || token.employeeStatus === 'suspended') {
    throw new HttpsError('permission-denied', 'An active staff account is required')
  }
  const collegeId = role === 'superadmin' ? null : text(token.collegeId)
  if (role !== 'superadmin' && (!collegeId || collegeId.includes('/'))) {
    throw new HttpsError('failed-precondition', 'Refresh your sign-in to resolve your college before editing settings')
  }
  const email = normalizeEmail(token.email)
  const db = admin.firestore()
  const user = await db.collection('users').doc(uid).get()
  const userData = user.data()
  if (userData && (normalizeRole(userData.role) !== role
    || (role !== 'superadmin' && pickCollegeId(userData) !== collegeId)
    || (text(userData.uid) && userData.uid !== uid)
    || (text(userData.userId) && userData.userId !== uid)
    || userData.employeeStatus === 'suspended'
    || ['suspended', 'inactive', 'disabled'].includes(text(userData.status)))) {
    throw new HttpsError('failed-precondition', 'Your account identity has changed. Sign in again or contact your administrator.')
  }

  const validateProfile = (snapshot: Snapshot): Snapshot => {
    const data = snapshot.data() || {}
    const links = [text(data.uid), text(data.userId)].filter(Boolean)
    if (links.some(link => link !== uid)
      || (!links.length && snapshot.id !== uid && (!email || normalizeEmail(data.email) !== email))
      || (role !== 'superadmin' && pickCollegeId(data) !== collegeId)) {
      throw new HttpsError('failed-precondition', 'Your profile linkage is inconsistent. Contact your administrator to repair it.')
    }
    return snapshot
  }

  let profile: Snapshot | null = null
  // Official staff imports keep the stable (non-Auth-UID) profile ID here.
  const pointer = text(userData?.facultyDocId)
  if (pointer && role !== 'superadmin') {
    if (pointer.includes('/')) throw new HttpsError('failed-precondition', 'Invalid staff profile linkage')
    const snapshot = await db.collection('faculty').doc(pointer).get()
    if (!snapshot.exists) throw new HttpsError('failed-precondition', 'The linked staff profile is missing. Contact your administrator.')
    profile = validateProfile(snapshot)
  } else {
    for (const name of PROFILE_COLLECTIONS[role]) {
      const collection = db.collection(name)
      const byId = await collection.doc(uid).get()
      if (byId.exists) { profile = validateProfile(byId); break }
      for (const [field, value] of [['uid', uid], ['userId', uid], ...(email ? [['email', email]] : [])]) {
        const matches = await collection.where(field, '==', value).limit(2).get()
        if (matches.size > 1) throw new HttpsError('failed-precondition', 'Multiple staff profiles match this account. Contact your administrator.')
        if (!matches.empty) { profile = validateProfile(matches.docs[0]); break }
      }
      if (profile) break
    }
  }
  // provisionUser intentionally creates users/{uid} only. It is a valid
  // canonical record; never fabricate an admins/faculty row to edit it.
  if (!user.exists && !profile) throw new HttpsError('failed-precondition', 'No staff profile is linked to this account')
  return { uid, role, collegeId, email, user, profile }
}

function settingsFor(identity: StaffIdentity) {
  const data = { ...(identity.user.data() || {}), ...(identity.profile?.data() || {}) }
  return {
    uid: identity.uid,
    name: text(data.name) || [text(data.firstName), text(data.lastName)].filter(Boolean).join(' '),
    phone: text(data.phone), email: identity.email || text(data.email),
    department: text(data.department), collegeId: identity.collegeId,
    notificationPrefs: data.notificationPrefs ?? null,
    appearance: data.appearance ?? null,
  }
}

const OPTIONS = { region: 'asia-south1', memory: '256MiB' as const, timeoutSeconds: 30, minInstances: 0, maxInstances: 20 }

export const getMyStaffSettings = onCall(OPTIONS, async request => settingsFor(await resolveStaffIdentity(request)))

export const updateMyStaffProfile = onCall(OPTIONS, async request => {
  const patch = parseStaffProfileUpdate(request.data)
  const identity = await resolveStaffIdentity(request)
  const db = admin.firestore()
  const updates = { ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
  const batch = db.batch()
  // Preconditions close the lookup/write race: reassigned or concurrently
  // changed profiles require a fresh lookup, never an overwrite of a new owner.
  const stage = (snapshot: Snapshot, value: Row) => {
    batch.update(snapshot.ref, value, { lastUpdateTime: snapshot.updateTime! })
  }
  if (identity.user.exists) stage(identity.user, updates)
  if (identity.profile) {
    const profileUpdates: Row = { ...updates }
    if (typeof patch.name === 'string' && identity.profile.ref.parent.id === 'faculty') {
      const [firstName, ...lastName] = patch.name.split(' ')
      profileUpdates.firstName = firstName
      profileUpdates.lastName = lastName.join(' ')
    }
    stage(identity.profile, profileUpdates)
  }
  await batch.commit()

  // Auth is a derived display-name mirror, not the profile source of truth.
  // Commit the canonical records atomically FIRST: a failed Firestore write
  // must not change Auth. Firebase offers no cross-service transaction; a
  // mirror failure is explicit and retryable, never reported as a lost save.
  let authDisplayNameSynced = true
  if (typeof patch.name === 'string') {
    try {
      let displayName = patch.name
      const canonical = identity.user.exists ? identity.user.ref : identity.profile!.ref
      // A slower, earlier request must not overwrite a newer saved name in
      // Auth. Reconcile against the canonical record after the mirror write.
      // This extra read occurs only for name edits, not preference saves.
      authDisplayNameSynced = false
      for (let attempt = 0; attempt < 3; attempt++) {
        await admin.auth().updateUser(identity.uid, { displayName })
        const latestName = text((await canonical.get()).data()?.name)
        if (latestName === displayName) { authDisplayNameSynced = true; break }
        if (!latestName) break
        displayName = latestName
      }
    } catch (error) {
      authDisplayNameSynced = false
      logger.warn('[StaffProfile] Saved profile; Auth display-name sync needs retry', { uid: identity.uid, error })
    }
  }
  return { success: true, uid: identity.uid, authDisplayNameSynced }
})
