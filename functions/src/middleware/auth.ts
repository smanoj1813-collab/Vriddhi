import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { getAuth } from 'firebase-admin/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    collegeId?: string;
    name?: string;
  };
}

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
 *
 * Primary path verifies a standard Firebase Authentication ID token through
 * the Admin SDK. A legacy custom `vriddhi_<uid>_<timestamp>` token is also
 * supported for older installs/clients that still store that shape.
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

    let verified: { uid: string; email?: string } | null = null;

    // Firebase ID token (used by the React + Firebase Auth clients)
    try {
      const decoded = await getAuth().verifyIdToken(token);
      verified = { uid: decoded.uid, email: decoded.email };
    } catch (firebaseErr) {
      // Legacy custom token shape: vriddhi_<userId>_<timestamp>
      if (token.startsWith('vriddhi_')) {
        const parts = token.split('_');
        if (parts.length < 3) {
          res.status(401).json({ error: 'Unauthorized: Invalid token' });
          return;
        }
        verified = { uid: parts[1] };
      } else {
        console.error('[auth] Firebase token verification failed:', firebaseErr);
        res.status(401).json({ error: 'Unauthorized: Invalid Firebase token' });
        return;
      }
    }

    if (!verified) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    const profile = await resolveUserProfile(verified.uid, verified.email);

    if (!profile) {
      res.status(401).json({ error: 'Unauthorized: User profile not found' });
      return;
    }

    req.user = {
      uid: verified.uid,
      email: profile.email || verified.email,
      role: profile.role,
      collegeId: profile.collegeId,
      name: profile.name,
    };

    next();
  } catch (err: any) {
    console.error('[auth] Auth middleware error:', err?.message || err);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role || '')) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
};
