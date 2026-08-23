import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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
export const getUserData = async (uid: string, email?: string): Promise<FirebaseUserData | null> => {
  console.log('[getUserData] START — uid:', uid, 'email:', email);

  const toISO = (v: any) => v?.toDate?.().toISOString() || v || new Date().toISOString();

  // 1. users collection by DOCUMENT ID
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const normalizedRole = normalizeRole(data.role);
      console.log('[getUserData] FOUND in users collection by doc ID — raw role:', data.role, 'normalized:', normalizedRole);

      if (!normalizedRole) {
        console.warn('[getUserData] WARNING: users doc has invalid/missing role ("' + data.role + '"). Continuing search...');
        // Fall through to other collections instead of returning bad data
      } else {
        return {
          uid: data.uid || uid,
          email: data.email || email || '',
          name: data.name || 'User',
          role: normalizedRole,
          collegeId: data.collegeId,
          department: data.department,
          avatar: data.avatar || "",
          phone: data.phone || "",
          createdAt: toISO(data.createdAt),
          updatedAt: toISO(data.updatedAt),
        } as FirebaseUserData;
      }
    }
  } catch (e) { console.error('[getUserData] Error reading users:', e); }

  // 2. superadmins by DOCUMENT ID
  try {
    const superadminDoc = await getDoc(doc(db, "superadmins", uid));
    if (superadminDoc.exists()) {
      const data = superadminDoc.data();
      console.log('[getUserData] FOUND in superadmins by doc ID — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: data.name || data.displayName || 'Superadmin',
        role: normalizeRole(data.role) || "superadmin",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.avatar || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error reading superadmins by doc ID:', e); }

  // 3. superadmins by uid field (legacy)
  try {
    const superadminsQuery = query(collection(db, "superadmins"), where("uid", "==", uid));
    const superadminsSnap = await getDocs(superadminsQuery);
    if (!superadminsSnap.empty) {
      const data = superadminsSnap.docs[0].data();
      console.log('[getUserData] FOUND in superadmins by uid field — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: data.name || data.displayName || 'Superadmin',
        role: normalizeRole(data.role) || "superadmin",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.avatar || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error querying superadmins by uid:', e); }

  // 4. superadmins by EMAIL field
  if (email) {
    try {
      const emailQuery = query(collection(db, "superadmins"), where("email", "==", email));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        const data = emailSnap.docs[0].data();
        console.log('[getUserData] FOUND in superadmins by EMAIL fallback — role:', data.role);
        return {
          uid: data.uid || uid,
          email: data.email || email,
          name: data.name || data.displayName || 'Superadmin',
          role: normalizeRole(data.role) || "superadmin",
          collegeId: data.collegeId,
          department: data.department,
          avatar: data.avatar || "",
          phone: data.phone || "",
          createdAt: toISO(data.createdAt),
          updatedAt: toISO(data.updatedAt),
        } as FirebaseUserData;
      }
    } catch (e) { console.error('[getUserData] Error querying superadmins by email:', e); }
  }

  // 5. admins by DOCUMENT ID
  try {
    const adminDoc = await getDoc(doc(db, "admins", uid));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      console.log('[getUserData] FOUND in admins by doc ID — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: data.name || 'Admin',
        role: normalizeRole(data.role) || "admin",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.avatar || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error reading admins by doc ID:', e); }

  // 6. admins by uid field (legacy)
  try {
    const adminsQuery = query(collection(db, "admins"), where("uid", "==", uid));
    const adminsSnap = await getDocs(adminsQuery);
    if (!adminsSnap.empty) {
      const data = adminsSnap.docs[0].data();
      console.log('[getUserData] FOUND in admins by uid field — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: data.name || 'Admin',
        role: normalizeRole(data.role) || "admin",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.avatar || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error querying admins by uid:', e); }

  // 7. admins by EMAIL field
  if (email) {
    try {
      const emailQuery = query(collection(db, "admins"), where("email", "==", email));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        const data = emailSnap.docs[0].data();
        console.log('[getUserData] FOUND in admins by EMAIL fallback — role:', data.role);
        return {
          uid: data.uid || uid,
          email: data.email || email,
          name: data.name || 'Admin',
          role: normalizeRole(data.role) || "admin",
          collegeId: data.collegeId,
          department: data.department,
          avatar: data.avatar || "",
          phone: data.phone || "",
          createdAt: toISO(data.createdAt),
          updatedAt: toISO(data.updatedAt),
        } as FirebaseUserData;
      }
    } catch (e) { console.error('[getUserData] Error querying admins by email:', e); }
  }

  // 8. faculty by DOCUMENT ID
  try {
    const facultyDoc = await getDoc(doc(db, "faculty", uid));
    if (facultyDoc.exists()) {
      const data = facultyDoc.data();
      console.log('[getUserData] FOUND in faculty by doc ID — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: `${data.firstName || ""} ${data.lastName || ""}`.trim() || 'Faculty',
        role: normalizeRole(data.role) || "faculty",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.profilePhotoUrl || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error reading faculty by doc ID:', e); }

  // 9. faculty by uid field (legacy)
  try {
    const facultyQuery = query(collection(db, "faculty"), where("uid", "==", uid));
    const facultySnap = await getDocs(facultyQuery);
    if (!facultySnap.empty) {
      const data = facultySnap.docs[0].data();
      console.log('[getUserData] FOUND in faculty by uid field — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: `${data.firstName || ""} ${data.lastName || ""}`.trim() || 'Faculty',
        role: normalizeRole(data.role) || "faculty",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.profilePhotoUrl || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error querying faculty by uid:', e); }

  // 10. faculty by EMAIL field
  if (email) {
    try {
      const emailQuery = query(collection(db, "faculty"), where("email", "==", email));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        const data = emailSnap.docs[0].data();
        console.log('[getUserData] FOUND in faculty by EMAIL fallback — role:', data.role);
        return {
          uid: data.uid || uid,
          email: data.email || email,
          name: `${data.firstName || ""} ${data.lastName || ""}`.trim() || 'Faculty',
          role: normalizeRole(data.role) || "faculty",
          collegeId: data.collegeId,
          department: data.department,
          avatar: data.profilePhotoUrl || "",
          phone: data.phone || "",
          createdAt: toISO(data.createdAt),
          updatedAt: toISO(data.updatedAt),
        } as FirebaseUserData;
      }
    } catch (e) { console.error('[getUserData] Error querying faculty by email:', e); }
  }

  // 11. hods by DOCUMENT ID
  try {
    const hodDoc = await getDoc(doc(db, "hods", uid));
    if (hodDoc.exists()) {
      const data = hodDoc.data();
      console.log('[getUserData] FOUND in hods by doc ID — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || 'HOD',
        role: normalizeRole(data.role) || "hod",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.avatar || data.profilePhotoUrl || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error reading hods by doc ID:', e); }

  // 12. hods by uid field (legacy)
  try {
    const hodsQuery = query(collection(db, "hods"), where("uid", "==", uid));
    const hodsSnap = await getDocs(hodsQuery);
    if (!hodsSnap.empty) {
      const data = hodsSnap.docs[0].data();
      console.log('[getUserData] FOUND in hods by uid field — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || 'HOD',
        role: normalizeRole(data.role) || "hod",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.avatar || data.profilePhotoUrl || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error querying hods by uid:', e); }

  // 13. hods by EMAIL field
  if (email) {
    try {
      const emailQuery = query(collection(db, "hods"), where("email", "==", email));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        const data = emailSnap.docs[0].data();
        console.log('[getUserData] FOUND in hods by EMAIL fallback — role:', data.role);
        return {
          uid: data.uid || uid,
          email: data.email || email,
          name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || 'HOD',
          role: normalizeRole(data.role) || "hod",
          collegeId: data.collegeId,
          department: data.department,
          avatar: data.avatar || data.profilePhotoUrl || "",
          phone: data.phone || "",
          createdAt: toISO(data.createdAt),
          updatedAt: toISO(data.updatedAt),
        } as FirebaseUserData;
      }
    } catch (e) { console.error('[getUserData] Error querying hods by email:', e); }
  }

  // 14. mentors by DOCUMENT ID
  try {
    const mentorDoc = await getDoc(doc(db, "mentors", uid));
    if (mentorDoc.exists()) {
      const data = mentorDoc.data();
      console.log('[getUserData] FOUND in mentors by doc ID — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || 'Mentor',
        role: normalizeRole(data.role) || "mentor",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.avatar || data.profilePhotoUrl || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error reading mentors by doc ID:', e); }

  // 15. mentors by uid field (legacy)
  try {
    const mentorsQuery = query(collection(db, "mentors"), where("uid", "==", uid));
    const mentorsSnap = await getDocs(mentorsQuery);
    if (!mentorsSnap.empty) {
      const data = mentorsSnap.docs[0].data();
      console.log('[getUserData] FOUND in mentors by uid field — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || 'Mentor',
        role: normalizeRole(data.role) || "mentor",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.avatar || data.profilePhotoUrl || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error querying mentors by uid:', e); }

  // 16. mentors by EMAIL field
  if (email) {
    try {
      const emailQuery = query(collection(db, "mentors"), where("email", "==", email));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        const data = emailSnap.docs[0].data();
        console.log('[getUserData] FOUND in mentors by EMAIL fallback — role:', data.role);
        return {
          uid: data.uid || uid,
          email: data.email || email,
          name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || 'Mentor',
          role: normalizeRole(data.role) || "mentor",
          collegeId: data.collegeId,
          department: data.department,
          avatar: data.avatar || data.profilePhotoUrl || "",
          phone: data.phone || "",
          createdAt: toISO(data.createdAt),
          updatedAt: toISO(data.updatedAt),
        } as FirebaseUserData;
      }
    } catch (e) { console.error('[getUserData] Error querying mentors by email:', e); }
  }

  // 17. students by DOCUMENT ID
  try {
    const studentDoc = await getDoc(doc(db, "students", uid));
    if (studentDoc.exists()) {
      const data = studentDoc.data();
      console.log('[getUserData] FOUND in students by doc ID — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: data.name || 'Student',
        role: "student",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.avatar || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error reading students by doc ID:', e); }

  // 18. students by uid field (legacy)
  try {
    const studentsQuery = query(collection(db, "students"), where("uid", "==", uid));
    const studentsSnap = await getDocs(studentsQuery);
    if (!studentsSnap.empty) {
      const data = studentsSnap.docs[0].data();
      console.log('[getUserData] FOUND in students by uid field — role:', data.role);
      return {
        uid: data.uid || uid,
        email: data.email,
        name: data.name || 'Student',
        role: "student",
        collegeId: data.collegeId,
        department: data.department,
        avatar: data.avatar || "",
        phone: data.phone || "",
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } as FirebaseUserData;
    }
  } catch (e) { console.error('[getUserData] Error querying students by uid:', e); }

  // 19. students by EMAIL field
  if (email) {
    try {
      const emailQuery = query(collection(db, "students"), where("email", "==", email));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        const data = emailSnap.docs[0].data();
        console.log('[getUserData] FOUND in students by EMAIL fallback — role:', data.role);
        return {
          uid: data.uid || uid,
          email: data.email || email,
          name: data.name || 'Student',
          role: "student",
          collegeId: data.collegeId,
          department: data.department,
          avatar: data.avatar || "",
          phone: data.phone || "",
          createdAt: toISO(data.createdAt),
          updatedAt: toISO(data.updatedAt),
        } as FirebaseUserData;
      }
    } catch (e) { console.error('[getUserData] Error querying students by email:', e); }
  }

  console.log('[getUserData] NOT FOUND anywhere — returning null');
  return null;
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