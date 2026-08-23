import { Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { getAuth } from 'firebase-admin/auth';
import { AuthenticatedRequest } from './authTypes';

export type { AuthenticatedRequest } from './authTypes';
export { requireRole, resolveCollegeId, assertCollegeAccess } from './authz';

const VALID_ROLES = ['superadmin', 'admin', 'principal', 'faculty', 'hod', 'mentor', 'student', 'parent'];

function normalizeRole(raw: unknown): string | undefined {
  if (!raw) return undefined;
  const cleaned = String(raw).trim().toLowerCase();
  return VALID_ROLES.includes(cleaned) ? cleaned : undefined;
}

/**
 * Resolve a user profile from Firestore, matching the same fallback order the
 * React auth layer uses. The most common storage is the `users` collection.
 */
async function resolveUserProfile(
  uid: string,
  email?: string
): Promise<{ role?: string; collegeId?: string; name?: string; email?: string } | null> {
  const toText = (v: unknown): string => (v == null ? '' : String(v));

  // 1. users by document id
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
      const d = doc.data() || {};
      const role = normalizeRole(d.role);
      if (role) {
        return {
          role,
          collegeId: d.collegeId || d.college_id || undefined,
          name: toText(d.name || d.displayName) || undefined,
          email: d.email || email,
        };
      }
    }
  } catch (err) {
    console.error('[auth] users lookup failed:', err);
  }

  // 2. Legacy collections by document id, then uid/email fields.
  const legacyCollections = [
    { collection: 'superadmins', fallbackRole: 'superadmin' },
    { collection: 'admins', fallbackRole: 'admin' },
    { collection: 'faculty', fallbackRole: 'faculty' },
    { collection: 'hods', fallbackRole: 'hod' },
    { collection: 'mentors', fallbackRole: 'mentor' },
    { collection: 'students', fallbackRole: 'student' },
  ];

  for (const entry of legacyCollections) {
    try {
      const doc = await db.collection(entry.collection).doc(uid).get();
      if (doc.exists) {
        const d = doc.data() || {};
        const role = normalizeRole(d.role) || entry.fallbackRole;
        return {
          role,
          collegeId: d.collegeId || d.college_id || undefined,
          name: toText(d.name || d.displayName || `${d.firstName || ''} ${d.lastName || ''}`) || undefined,
          email: d.email || email,
        };
      }
    } catch (err) {
      console.error(`[auth] ${entry.collection} doc lookup failed:`, err);
    }

    // Fallback by uid field
    try {
      const snap = await db
        .collection(entry.collection)
        .where('uid', '==', uid)
        .limit(1)
        .get();
      if (!snap.empty) {
        const d = snap.docs[0].data();
        const role = normalizeRole(d.role) || entry.fallbackRole;
        return {
          role,
          collegeId: d.collegeId || d.college_id || undefined,
          name: toText(d.name || d.displayName || `${d.firstName || ''} ${d.lastName || ''}`) || undefined,
          email: d.email || email,
        };
      }
    } catch (err) {
      console.error(`[auth] ${entry.collection} uid lookup failed:`, err);
    }
  }

  return null;
}

/**
 * Authentication middleware.
 * Only Firebase Authentication ID tokens verified via Admin SDK are accepted.
 */
export const verifyAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1].trim();
    if (!token) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch (firebaseErr) {
      console.error('[auth] Firebase token verification failed:', firebaseErr);
      res.status(401).json({ error: 'Unauthorized: Invalid Firebase token' });
      return;
    }

    const tokenClaims = decoded as unknown as { role?: unknown; collegeId?: unknown };
    const claimRole = normalizeRole(tokenClaims.role);
    const claimCollegeId =
      typeof tokenClaims.collegeId === 'string' ? tokenClaims.collegeId : undefined;

    const profile = await resolveUserProfile(decoded.uid, decoded.email);

    if (!profile && !claimRole) {
      res.status(401).json({ error: 'Unauthorized: User profile not found' });
      return;
    }

    req.user = {
      uid: decoded.uid,
      email: profile?.email || decoded.email,
      role: claimRole || profile?.role,
      collegeId: claimCollegeId || profile?.collegeId,
      name: profile?.name,
    };

    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auth] Auth middleware error:', message);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};


