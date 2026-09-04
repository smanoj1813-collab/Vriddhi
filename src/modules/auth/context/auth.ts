import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { auth, db } from '@/Firebase/config';

export type UserRole = 'superadmin' | 'admin' | 'principal' | 'faculty' | 'student' | 'parent' | 'hod' | 'mentor';

export const VALID_ROLES: UserRole[] = ['superadmin', 'admin', 'principal', 'faculty', 'student', 'parent', 'hod', 'mentor'];

export interface FirebaseUserData {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  collegeId?: string;
  department?: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

/** Privileged registration is server-only (callable provisionUser). */
export const registerUser = async (
  _email: string,
  _password: string,
  _name: string,
  _role: UserRole,
  _collegeId?: string
) => {
  throw new Error(
    'Account provisioning must be performed by an authorized administrator via the provisionUser Cloud Function.'
  );
};

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

// ── Helper: validate role ──────────────────────────────────────────────
function normalizeRole(raw: any): UserRole | null {
  if (!raw) return null;
  const cleaned = String(raw).trim().toLowerCase();
  if (VALID_ROLES.includes(cleaned as UserRole)) return cleaned as UserRole;
  return null;
}

/**
 * Resolve user data from Firestore after login.
 * Checks document ID first, then uid field, then email field.
 * Order: users → superadmins → admins → faculty → hods → mentors → students.
 */
export interface IdentityResolution {
  user: FirebaseUserData | null
  /**
   * At least one identity read was refused by the Firestore rules. A profile can
   * exist and still be unreadable, and that is a DIFFERENT problem from "no
   * account" — it means the caller's ID token has no role claim (or the rules
   * deployed are newer/older than the data). Reporting it as ACCOUNT_NOT_FOUND
   * is what sent this project in circles.
   */
  permissionDenied: boolean;
  /**
   * A role was found in Firestore but the ID-token claim is missing or
   * different. Under claim-authoritative rules such an account can sign in and
   * then read nothing; `syncMyIdentity` repairs it.
   */
  claimMissing: boolean;
  /** Where the role came from, for diagnostics in the console. */
  source: 'claim' | 'users' | 'profile' | null;
  resolvedRole: UserRole | null;
  errors: string[];
  /** Collections tried, so a failure report can show how far the search got. */
  attempts: number;
}

const toISO = (v: any) => v?.toDate?.().toISOString() || v || new Date().toISOString();

interface ProfileSpec {
  collection: string;
  /** Role implied by membership of the collection when the doc has none. */
  fallbackRole: UserRole;
  /** Project the document onto the app's user shape (timestamps added later). */
  map: (data: any, uid: string, email?: string) => Record<string, any>;
}

const PROFILE_SPECS: ProfileSpec[] = [
  {
    collection: 'superadmins',
    fallbackRole: 'superadmin',
    map: (d, uid, email) => ({
      uid: d.uid || uid, email: d.email || email || '', name: d.name || d.displayName || 'Superadmin',
      role: normalizeRole(d.role) || 'superadmin', collegeId: d.collegeId, department: d.department,
      avatar: d.avatar || '', phone: d.phone || '',
    }),
  },
  {
    collection: 'admins',
    fallbackRole: 'admin',
    map: (d, uid, email) => ({
      uid: d.uid || uid, email: d.email || email || '', name: d.name || 'Admin',
      role: normalizeRole(d.role) || 'admin', collegeId: d.collegeId, department: d.department,
      avatar: d.avatar || '', phone: d.phone || '',
    }),
  },
  {
    collection: 'faculty',
    fallbackRole: 'faculty',
    map: (d, uid, email) => ({
      uid: d.uid || uid, email: d.email || email || '',
      name: `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.name || 'Faculty',
      role: normalizeRole(d.role) || 'faculty', collegeId: d.collegeId || d.collegeID, department: d.department,
      avatar: d.profilePhotoUrl || d.avatar || '', phone: d.phone || '',
    }),
  },
  {
    collection: 'hods',
    fallbackRole: 'hod',
    map: (d, uid, email) => ({
      uid: d.uid || uid, email: d.email || email || '',
      name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'HOD',
      role: normalizeRole(d.role) || 'hod', collegeId: d.collegeId, department: d.department,
      avatar: d.avatar || d.profilePhotoUrl || '', phone: d.phone || '',
    }),
  },
  {
    collection: 'mentors',
    fallbackRole: 'mentor',
    map: (d, uid, email) => ({
      uid: d.uid || uid, email: d.email || email || '',
      name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Mentor',
      role: normalizeRole(d.role) || 'mentor', collegeId: d.collegeId, department: d.department,
      avatar: d.avatar || d.profilePhotoUrl || '', phone: d.phone || '',
    }),
  },
  {
    // Students carry no privileged role, so the document id/email/uid link is
    // enough: `role` is forced rather than read from the document.
    collection: 'students',
    fallbackRole: 'student',
    map: (d, uid, email) => ({
      uid: d.uid || d.userId || uid, email: d.email || email || '', name: d.name || 'Student',
      role: 'student' as UserRole, collegeId: d.collegeId, department: d.department,
      avatar: d.avatar || '', phone: d.phone || '',
    }),
  },
];

function classifyReadError(err: any): { kind: 'permission' | 'other'; text: string } {
  const code = String(err?.code || '').toLowerCase();
  const message = String(err?.message || err || '');
  if (code.includes('permission-denied') || code.includes('failed-precondition') || /missing or insufficient permissions/i.test(message)) {
    return { kind: 'permission', text: message };
  }
  // A missing composite index is reported per query and is a deployment issue,
  // not a data issue — say so instead of returning "account not found".
  if (/needs an index|failed to get document because the backend/i.test(message)) {
    return { kind: 'other', text: `index required: ${message}` };
  }
  return { kind: 'other', text: message };
}

/**
 * Resolve the app identity for a signed-in uid.
 *
 * Order (mirrors the documented rules behaviour):
 *   1. users/{uid}                       — the canonical lookup document
 *   2. superadmins/{uid}                  — legacy/privileged identities
 *   3. every profile collection, by document id, then `uid`, then `email`
 *
 * Reads are sequential on purpose: the first hit wins, so a healthy account
 * costs one document read instead of nineteen.
 */
export const resolveIdentity = async (uid: string, email?: string): Promise<IdentityResolution> => {
  const outcome: IdentityResolution = {
    user: null, permissionDenied: false, claimMissing: false, source: null,
    resolvedRole: null, errors: [], attempts: 0,
  };

  const claimedRole = normalizeRole((await safeClaims(uid)).role);

  const finish = (data: any, source: IdentityResolution['source']): FirebaseUserData => {
    outcome.source = source;
    const role = normalizeRole(data.role);
    outcome.resolvedRole = role;
    outcome.claimMissing = !role ? false : claimedRole !== role;
    return {
      uid: data.uid || uid,
      email: data.email || email || '',
      name: data.name || 'User',
      role: role || 'student',
      collegeId: data.collegeId,
      department: data.department,
      avatar: data.avatar || '',
      phone: data.phone || '',
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
    } as FirebaseUserData;
  };

  // 1. users/{uid}
  try {
    outcome.attempts++;
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const role = normalizeRole(data.role);
      if (role) {
        return { ...outcome, user: finish({ ...data, role }, 'users') };
      }
      outcome.errors.push('users/' + uid + ' exists but has no valid `role` field; continuing with profile collections');
    }
  } catch (err) {
    const { kind, text } = classifyReadError(err);
    if (kind === 'permission') outcome.permissionDenied = true;
    outcome.errors.push(`users: ${text}`);
  }

  // 2./3. profile collections
  for (const spec of PROFILE_SPECS) {
    // a) document id == uid
    try {
      outcome.attempts++;
      const byId = await getDoc(doc(db, spec.collection, uid));
      if (byId.exists()) {
        const projected = spec.map(byId.data(), uid, email);
        return { ...outcome, user: finish(projected, 'profile') };
      }
    } catch (err) {
      const { kind, text } = classifyReadError(err);
      if (kind === 'permission') outcome.permissionDenied = true;
      outcome.errors.push(`${spec.collection}(id): ${text}`);
    }

    if (!email) continue;

    // b) legacy documents that store the uid in a field, or are keyed by email.
    for (const field of ['uid', 'email'] as const) {
      try {
        outcome.attempts++;
        const snap = await getDocs(query(collection(db, spec.collection), where(field, '==', field === 'email' ? email : uid), limit(1)));
        if (!snap.empty) {
          const projected = spec.map(snap.docs[0].data(), uid, email);
          return { ...outcome, user: finish(projected, 'profile') };
        }
      } catch (err) {
        const { kind, text } = classifyReadError(err);
        if (kind === 'permission') outcome.permissionDenied = true;
        outcome.errors.push(`${spec.collection}(${field}): ${text}`);
      }
    }
  }

  return outcome;
};

/** Read the caller's own ID-token claims without ever throwing. */
async function safeClaims(uid: string): Promise<{ role?: unknown; uid?: string }> {
  try {
    const current = auth.currentUser;
    if (!current || current.uid !== uid) return {};
    const token = await current.getIdTokenResult();
    return (token.claims as Record<string, unknown>) || {};
  } catch {
    return {};
  }
}

/**
 * Resolve user data after login. Kept for compatibility with callers that only
 * want the profile; use `resolveIdentity` when the *reason* matters.
 */
export const getUserData = async (uid: string, email?: string): Promise<FirebaseUserData | null> => {
  const result = await resolveIdentity(uid, email);
  if (!result.user) {
    console.warn('[auth] identity could not be resolved', {
      uid,
      permissionDenied: result.permissionDenied,
      errors: result.errors,
      attempts: result.attempts,
    });
  }
  return result.user;
};

export const updateUserRole = async (_uid: string, _role: UserRole) => {
  throw new Error('Role changes must be performed server-side with Admin SDK custom claims.');
};

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface College {
  id: string;
  name: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  college: College | null;
  loading: boolean;
}

export interface FacultyProfile {
  title: string;
  name: string;
  email?: string;
  department?: string;
  avatar?: string;
}