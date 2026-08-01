import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    collegeId?: string;
  };
}

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

    const token = authHeader.split('Bearer ')[1];
    
    // Simple token validation: check if it starts with 'vriddhi_'
    if (!token.startsWith('vriddhi_')) {
      res.status(401).json({ error: 'Unauthorized: Invalid token format' });
      return;
    }

    // Extract user ID from token (format: vriddhi_USERID_timestamp)
    const parts = token.split('_');
    if (parts.length < 3) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    const userId = parts[1];

    // Verify user exists in Firestore (check multiple collections)
    let userDoc = null;
    let userData = null;
    let userRole = '';

    // Check faculty
    const facultyDoc = await db.collection('faculty').doc(userId).get();
    if (facultyDoc.exists) {
      userDoc = facultyDoc;
      userData = facultyDoc.data();
      userRole = 'faculty';
    }

    // Check admins
    if (!userDoc) {
      const adminDoc = await db.collection('admins').doc(userId).get();
      if (adminDoc.exists) {
        userDoc = adminDoc;
        userData = adminDoc.data();
        userRole = adminDoc.data()?.role || 'admin';
      }
    }

    // Check superAdmins
    if (!userDoc) {
      const superDoc = await db.collection('superAdmins').doc(userId).get();
      if (superDoc.exists) {
        userDoc = superDoc;
        userData = superDoc.data();
        userRole = 'superadmin';
      }
    }

    if (!userDoc || !userData) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    req.user = {
      uid: userId,
      email: userData.email || undefined,
      role: userRole,
      collegeId: userData.collegeId || undefined,
    };

    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err.message);
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