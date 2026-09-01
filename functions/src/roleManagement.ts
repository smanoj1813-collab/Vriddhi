import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import * as crypto from 'crypto'

const db = admin.firestore()
const ALLOWED_ROLES = ['superadmin', 'admin', 'principal', 'hod', 'mentor', 'faculty', 'student', 'parent'] as const
type Role = typeof ALLOWED_ROLES[number]

function password(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  return Array.from({ length: 14 }, (_, i) => i < 3 ? ['A', 'a', '7'][i] : alphabet[crypto.randomInt(alphabet.length)]).join('')
}

async function callerIsSuperadmin(uid: string): Promise<boolean> {
  const user = await db.doc(`users/${uid}`).get()
  if (user.exists && String(user.data()?.role || '').toLowerCase() === 'superadmin') return true
  return (await db.doc(`superadmins/${uid}`).get()).exists
}

function clean(value: unknown, max = 160): string { return String(value ?? '').trim().slice(0, max) }

async function findByEmail(collectionName: string, email: string) {
  const snap = await db.collection(collectionName).where('email', '==', email).limit(5).get()
  return snap.docs
}

export const grantUserRole = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required')
    if (!(await callerIsSuperadmin(request.auth.uid))) {
      throw new HttpsError('permission-denied', 'Only a superadmin can manage identities')
    }

    const input = request.data || {}
    const email = clean(input.email, 254).toLowerCase()
    const name = clean(input.name, 120)
    const role = clean(input.role, 30).toLowerCase() as Role
    const collegeId = clean(input.collegeId, 120) || null
    const providedPassword = clean(input.password, 128)
    if (!email || !email.includes('@') || !role || !ALLOWED_ROLES.includes(role)) {
      throw new HttpsError('invalid-argument', 'A valid email and supported role are required')
    }
    if (role !== 'superadmin' && !collegeId) {
      throw new HttpsError('invalid-argument', 'collegeId is required for this role')
    }
    if (providedPassword && providedPassword.length < 10) {
      throw new HttpsError('invalid-argument', 'Password must be at least 10 characters')
    }

    let authUser: admin.auth.UserRecord
    let created = false
    let generatedPassword: string | undefined
    try {
      authUser = await admin.auth().getUserByEmail(email)
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') throw error
      if (!providedPassword && !name) {
        throw new HttpsError('not-found', 'No Auth user found. Supply a name and password to create one.')
      }
      generatedPassword = providedPassword || password()
      authUser = await admin.auth().createUser({ email, password: generatedPassword, displayName: name || email.split('@')[0] })
      created = true
    }

    const resolvedName = name || authUser.displayName || email.split('@')[0]
    const existingClaims = authUser.customClaims || {}
    const previousRole = typeof existingClaims.role === 'string' ? existingClaims.role : null
    const previousCollegeId = existingClaims.collegeId ?? null
    const roleChanged = previousRole !== role || previousCollegeId !== collegeId

    await admin.auth().setCustomUserClaims(authUser.uid, {
      ...existingClaims, role, collegeId, mustChangePassword: created || existingClaims.mustChangePassword === true,
    })

    // Rules trust the custom claim before the profile document, so without this
    // a downgraded or moved account would keep its old privileges until the ID
    // token expired (up to an hour). Revoking refresh tokens forces the next
    // request to mint a token that carries the claims just written.
    if (roleChanged) {
      await admin.auth().revokeRefreshTokens(authUser.uid)
    }

    const now = admin.firestore.FieldValue.serverTimestamp()
    const batch: admin.firestore.WriteBatch = db.batch()
    batch.set(db.doc(`users/${authUser.uid}`), {
      uid: authUser.uid, email, name: resolvedName, role, collegeId,
      status: 'active', updatedAt: now, ...(created ? { createdAt: now } : {}),
      managedBy: request.auth.uid,
    }, { merge: true })

    if (role === 'superadmin') {
      batch.set(db.doc(`superadmins/${authUser.uid}`), {
        uid: authUser.uid, email, name: resolvedName, role, status: 'active', updatedAt: now,
        ...(created ? { createdAt: now } : {}), managedBy: request.auth.uid,
      }, { merge: true })
    } else {
      batch.delete(db.doc(`superadmins/${authUser.uid}`))
    }

    const profileCollection = role === 'faculty' ? 'faculty' : ['admin', 'principal'].includes(role) ? 'admins' : role === 'hod' ? 'hods' : role === 'mentor' ? 'mentors' : null
    if (profileCollection) {
      const docs = await findByEmail(profileCollection, email)
      const target = docs[0] || db.doc(`${profileCollection}/${authUser.uid}`)
      batch.set(target as any, { uid: authUser.uid, email, name: resolvedName, role, collegeId, updatedAt: now }, { merge: true })
    }
    if (role === 'student') {
      const docs = await findByEmail('students', email)
      for (const student of docs) batch.set(student.ref, { uid: authUser.uid, userId: authUser.uid, updatedAt: now }, { merge: true })
    }
    batch.create(db.collection('logs').doc(), {
      action: 'grantUserRole', targetUid: authUser.uid, targetEmail: email, role, collegeId,
      previousRole, previousCollegeId, revokedRefreshTokens: roleChanged,
      actorUid: request.auth.uid, createdAt: now, created,
    })
    await batch.commit()
    logger.info('[grantUserRole] identity wired', { targetUid: authUser.uid, role, actorUid: request.auth.uid })

    return {
      success: true, uid: authUser.uid, email, role, collegeId, created,
      // The target must sign in again before the new claims and rules apply.
      reauthenticateRequired: roleChanged,
      temporaryPassword: created ? generatedPassword : undefined,
    }
  }
)

export const diagnoseIdentity = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required')
    if (!(await callerIsSuperadmin(request.auth.uid))) throw new HttpsError('permission-denied', 'Only a superadmin can audit identities')
    const email = clean(request.data?.email, 254).toLowerCase()
    if (!email) throw new HttpsError('invalid-argument', 'email is required')
    let authUser: admin.auth.UserRecord | null = null
    try { authUser = await admin.auth().getUserByEmail(email) } catch (e: any) { if (e?.code !== 'auth/user-not-found') throw e }
    const uid = authUser?.uid
    const result: Record<string, unknown> = { email, uid: uid || null, claims: authUser?.customClaims || {} }
    const issues: string[] = []
    if (!uid) issues.push('No Firebase Auth account exists')
    if (uid) {
      for (const collectionName of ['users', 'superadmins', 'faculty', 'admins', 'hods', 'mentors', 'students']) {
        const snap = await db.doc(`${collectionName}/${uid}`).get()
        result[collectionName] = snap.exists ? { id: snap.id, ...snap.data() } : null
      }
      if (!(result.users as any) && !(result.superadmins as any)) issues.push('No identity profile document exists')
      const studentDocs = await findByEmail('students', email)
      result.studentEmailMatches = studentDocs.map(d => ({ id: d.id, ...d.data() }))
      if (studentDocs.length && !studentDocs.some(d => d.data().userId === uid || d.data().uid === uid)) issues.push('Student profile exists but is not linked to this Auth uid')
      if (!authUser?.customClaims?.role) issues.push('Auth custom claims do not contain role')
    }
    result.issues = issues
    return result
  }
)
