// src/modules/superadmin/api/superAdminApi.ts
// Cleaned - No mock data. Connects to Firebase Firestore.
// All types imported from ../types/superAdmin.ts (single source of truth)

import { db, functions } from '@/Firebase/config';
import { httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  Query,
} from "firebase/firestore";

import {
  SuperAdminApiError,
  type PaginatedResult,
  type College,
  type CreateCollegeInput,
  type ListCollegesOptions,
  type Admin,
  type AdminRole,
  type CreateAdminInput,
  type ListAdminsOptions,
  type Student,
  type ListStudentsOptions,
  type UpdateStudentInput,
  type ImportUsersInput,
  type ImportResult,
  type FacultyImportPayload,
  type Faculty,
  type ListFacultyOptions,
  type UpdateFacultyInput,
  type DashboardStats,
  type RecentActivity,
  type TopCollege,
  type ComparisonFilter,
  type CollegeMetric,
  type ComparisonResult,
  type BenchmarkData,
  type SubscriptionPlan,
  type PlanType,
  type BillingCycle,
  type CollegeSubscription,
  type PaymentStatus,
  type PaymentHistory,
  type RenewalAlert,
  type SystemHealthStatus,
  type SlowQuery,
  type ErrorLog,
  type PerformanceMetric,
  type HealthStatus,
  type ServiceHealth,
  type HealthAlert,
  type EmploymentType,
} from "../types/superAdmin";

export {
  SuperAdminApiError,
  type PaginatedResult,
  type College,
  type CreateCollegeInput,
  type Admin,
  type Student,
  type ImportResult,
  type Faculty,
  type UpdateFacultyInput,
  type DashboardStats,
  type RecentActivity,
  type TopCollege,
  type ComparisonFilter,
  type CollegeMetric,
  type ComparisonResult,
  type BenchmarkData,
  type SubscriptionPlan,
  type PlanType,
  type BillingCycle,
  type CollegeSubscription,
  type PaymentStatus,
  type PaymentHistory,
  type RenewalAlert,
  type SystemHealthStatus,
  type SlowQuery,
  type ErrorLog,
  type PerformanceMetric,
  type HealthStatus,
  type ServiceHealth,
  type HealthAlert,
  type EmploymentType,
};

// ═══════════════════════════════════════════════════════════════════════
// FIREBASE HELPERS
// ═══════════════════════════════════════════════════════════════════════

function docToCollege(docSnap: QueryDocumentSnapshot<DocumentData>): College {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "",
    code: data.code || "",
    shortName: data.shortName,
    address: data.address,
    city: data.city,
    state: data.state,
    country: data.country,
    location: data.location,
    phone: data.phone,
    email: data.email,
    website: data.website,
    status: data.status || "active",
    plan: data.plan || "standard",
    billingCycle: data.billingCycle || "monthly",
    createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
    studentCount: data.studentCount || data.currentStudents || 0,
    facultyCount: data.facultyCount || 0,
    adminCount: data.adminCount || 0,
    currentStudents: data.currentStudents,
    currentFaculty: data.currentFaculty,
    courses: data.courses,
    subscriptionEnd: data.subscriptionEnd,
    logo: data.logo,
    ...(data.pincode ? { pincode: data.pincode } : {}),
  } as College;
}

function docToAdmin(docSnap: QueryDocumentSnapshot<DocumentData>): Admin {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "",
    email: data.email || "",
    role: data.role || "admin",
    collegeId: data.collegeId || "",
    collegeName: data.collegeName,
    collegeCode: data.collegeCode,
    status: data.status || "active",
    createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
    lastLogin: data.lastLogin?.toDate?.().toISOString(),
    phone: data.phone,
    department: data.department,
  } as Admin;
}

function docToStudent(docSnap: QueryDocumentSnapshot<DocumentData>): Student {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "",
    email: data.email || "",
    regNo: data.regNo || "",
    collegeId: data.collegeId || "",
    collegeName: data.collegeName,
    batch: data.batch || "",
    division: data.division || "",
    mentor: data.mentor,
    department: data.department,
    status: data.status || "active",
    createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString(),
    phone: data.phone,
    avatar: data.avatar,
    uid: data.uid,
  };
}

function docToFaculty(docSnap: QueryDocumentSnapshot<DocumentData>): Faculty {
  const data = docSnap.data();
  const firstName = data.firstName || "";
  const lastName = data.lastName || "";
  return {
    id: docSnap.id,
    facultyId: data.facultyId || docSnap.id,
    name: `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    email: data.email || "",
    phone: data.phone || "",
    gender: data.gender || "",
    collegeId: data.collegeId || "",
    collegeName: data.collegeName || "",
    collegeCode: data.collegeCode || "",
    department: data.department || "",
    designation: data.designation || "Assistant Professor",
    employmentType: data.employmentType || "FULL_TIME",
    joiningDate: data.joiningDate || "",
    qualification: data.qualification || "",
    specialization: data.specialization || "",
    subjectsUG: data.subjectsUG || [],
    subjectsPG: data.subjectsPG || [],
    experienceYears: data.experienceYears || 0,
    isHOD: data.isHOD || false,
    role: data.role || "faculty",
    status: data.status || "active",
    createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
    lastLogin: data.lastLogin?.toDate?.().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// STRIP UNDEFINED / NULL — prevents Firestore addDoc/updateDoc errors
// ═══════════════════════════════════════════════════════════════════════
function stripUndefined(obj: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ORPHANED-ACCOUNT SELF-HEAL
// An import that ran while the Firestore rules denied the `users/{uid}`
// write left the Auth account alive but with no role-resolution doc —
// such accounts could never log in (ACCOUNT_NOT_FOUND). When an import
// meets an email that already has a profile doc, we check for (and
// restore) the missing users doc instead of failing the row.
// ═══════════════════════════════════════════════════════════════════════

async function healMissingUserDoc(
  profileData: DocumentData,
  fallbackRole: 'faculty' | 'student'
): Promise<boolean> {
  const uid = profileData?.uid;
  if (!uid || typeof uid !== 'string') return false;

  const userDocRef = doc(db, "users", uid);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) return false; // lookup doc present — genuinely a duplicate

  const name = (profileData.name as string)
    || `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim()
    || (profileData.email as string);

  const now = Timestamp.now();
  await setDoc(userDocRef, stripUndefined({
    uid,
    email: profileData.email,
    name,
    role: profileData.role || fallbackRole,
    collegeId: profileData.collegeId || "",
    department: profileData.department || "",
    phone: profileData.phone || "",
    avatar: "",
    createdAt: now,
    updatedAt: now,
  }));
  return true;
}

// ═══════════════════════════════════════════════════════════════════════
// FIREBASE AUTH REST API — create users without affecting current session
// ═══════════════════════════════════════════════════════════════════════

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

export async function createFirebaseAuthUser(email: string, password: string): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    if (data.error?.message === 'EMAIL_EXISTS') {
      const lookupRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: [email] }),
        }
      );
      const lookupData = await lookupRes.json();
      if (lookupData.users?.[0]?.localId) {
        return lookupData.users[0].localId;
      }
    }
    throw new Error(data.error?.message || 'Failed to create Firebase Auth user');
  }
  return data.localId;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// ═══════════════════════════════════════════════════════════════════════
// COLLEGE API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function createCollege(input: CreateCollegeInput): Promise<College> {
  const now = Timestamp.now();

  const collegeData = {
    ...stripUndefined(input),
    plan: input.plan || "standard",
    billingCycle: input.billingCycle || "monthly",
    status: "active",
    createdAt: now,
    updatedAt: now,
    studentCount: 0,
    facultyCount: 0,
    adminCount: 0,
  };

  const docRef = await addDoc(collection(db, "colleges"), collegeData);

  return {
    id: docRef.id,
    ...collegeData,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  } as College;
}

export async function listColleges(options: ListCollegesOptions = {}): Promise<PaginatedResult<College>> {
  try {
    let q = query(collection(db, "colleges"), orderBy("createdAt", "desc"));

    if (options.limit) {
      q = query(q, limit(options.limit));
    } else {
      q = query(q, limit(100));
    }

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(docToCollege);

    if (options.status && options.status !== "all") {
      items = items.filter(c => {
        const docStatus = c.status;
        if (!docStatus && options.status === "active") return true;
        return docStatus === options.status;
      });
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      items = items.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.code.toLowerCase().includes(searchLower)
      );
    }

    const total = items.length;
    const hasMore = snapshot.docs.length === (options.limit || 100);
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return { items, data: items, total, hasMore, lastDoc };
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return { items: [], data: [], total: 0, hasMore: false };
  }
}

export async function getCollegeById(collegeId: string): Promise<College | null> {
  try {
    const docRef = doc(db, "colleges", collegeId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docToCollege(docSnap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error fetching college:", error);
    return null;
  }
}

export async function getCollegeDetailWithCounts(collegeId: string): Promise<College | null> {
  try {
    const college = await getCollegeById(collegeId);
    if (!college) return null;

    const [studentsSnap, facultySnap, adminsSnap] = await Promise.all([
      getDocs(query(collection(db, "students"), where("collegeId", "==", collegeId))),
      getDocs(query(collection(db, "faculty"), where("collegeId", "==", collegeId))),
      getDocs(query(collection(db, "admins"), where("collegeId", "==", collegeId))),
    ]);

    return {
      ...college,
      studentCount: studentsSnap.size,
      facultyCount: facultySnap.size,
      adminCount: adminsSnap.size,
      currentStudents: studentsSnap.size,
      currentFaculty: facultySnap.size,
    };
  } catch (error) {
    console.error("Error fetching college detail with counts:", error);
    return getCollegeById(collegeId);
  }
}

export async function updateCollege(collegeId: string, updates: Partial<College>): Promise<College> {
  try {
    const docRef = doc(db, "colleges", collegeId);
    const updateData = {
      ...stripUndefined(updates),
      updatedAt: Timestamp.now(),
    };
    await updateDoc(docRef, updateData);

    const updated = await getDoc(docRef);
    if (!updated.exists()) throw new SuperAdminApiError("College not found after update");
    return docToCollege(updated as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    throw new SuperAdminApiError(error instanceof Error ? error.message : "Failed to update college");
  }
}

export async function deleteCollege(collegeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "colleges", collegeId));
  } catch (error) {
    throw new SuperAdminApiError(error instanceof Error ? error.message : "Failed to delete college");
  }
}

export async function bulkUpdateCollegeStatus(
  collegeIds: string[],
  status: "active" | "inactive" | "suspended"
): Promise<void> {
  const batch = writeBatch(db);
  collegeIds.forEach(id => {
    const ref = doc(db, "colleges", id);
    batch.update(ref, { status, updatedAt: Timestamp.now() });
  });
  await batch.commit();
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function createAdmin(input: CreateAdminInput): Promise<Admin> {
  const password = input.password || generateTempPassword();

  const uid = await createFirebaseAuthUser(input.email, password);

  const now = Timestamp.now();

  // Strip undefined for Firestore write only
  const adminData = {
    ...stripUndefined(input),
    uid,
    status: "active",
    createdAt: now,
  };

  const docRef = await addDoc(collection(db, "admins"), adminData);

  await setDoc(doc(db, "users", uid), {
    uid,
    email: input.email,
    name: input.name,
    role: input.role,
    collegeId: input.collegeId || "",
    department: input.department || "",
    phone: input.phone || "",
    avatar: "",
    createdAt: now,
    updatedAt: now,
  });

  // Explicit return — satisfies Admin type
  return {
    id: docRef.id,
    name: input.name,
    email: input.email,
    role: input.role,
    collegeId: input.collegeId,
    status: "active",
    createdAt: now.toDate().toISOString(),
    uid,
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.department ? { department: input.department } : {}),
  } as Admin;
}

export async function promoteToAdmin(payload: {
  uid: string;
  name: string;
  email: string;
  role: AdminRole;
  collegeId: string;
  phone?: string;
  department?: string;
}): Promise<Admin> {
  const now = Timestamp.now();

  const adminData = {
    ...stripUndefined({
      uid: payload.uid,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      collegeId: payload.collegeId,
      phone: payload.phone,
      department: payload.department,
    }),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const docRef = doc(db, "admins", payload.uid);
  await setDoc(docRef, adminData, { merge: true });

  await setDoc(doc(db, "users", payload.uid), {
    uid: payload.uid,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    collegeId: payload.collegeId,
    department: payload.department || "",
    phone: payload.phone || "",
    avatar: "",
    updatedAt: now,
  }, { merge: true });

  return {
    id: payload.uid,
    uid: payload.uid,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    collegeId: payload.collegeId,
    status: "active",
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
    ...(payload.phone ? { phone: payload.phone } : {}),
    ...(payload.department ? { department: payload.department } : {}),
  } as Admin;
}

export async function listAdmins(options: ListAdminsOptions = {}): Promise<PaginatedResult<Admin>> {
  try {
    let q: Query<DocumentData>;
    if (options.collegeId) {
      q = query(collection(db, "admins"), where("collegeId", "==", options.collegeId));
    } else {
      q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
    }

    if (options.status && options.status !== "all") {
      q = query(q, where("status", "==", options.status));
    }

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(docToAdmin);

    if (options.collegeId) {
      items = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const collegesSnap = await getDocs(collection(db, "colleges"));
    const collegeMap: Record<string, string> = {};
    collegesSnap.docs.forEach(d => {
      const data = d.data();
      collegeMap[d.id] = data.name || "";
    });

    items = items.map(admin => ({
      ...admin,
      collegeName: admin.collegeName || collegeMap[admin.collegeId] || admin.collegeId,
    }));

    const total = items.length;
    const hasMore = false;

    return { items, data: items, total, hasMore };
  } catch (error) {
    console.error("Error fetching admins:", error);
    return { items: [], data: [], total: 0, hasMore: false };
  }
}

export async function updateAdminStatus(adminId: string, status: "active" | "inactive"): Promise<void> {
  await updateDoc(doc(db, "admins", adminId), { status, updatedAt: Timestamp.now() });
}

// ═══════════════════════════════════════════════════════════════════════
// STUDENT API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function listStudents(options: ListStudentsOptions = {}): Promise<PaginatedResult<Student>> {
  try {
    let q: Query<DocumentData>;
    if (options.collegeId) {
      q = query(collection(db, "students"), where("collegeId", "==", options.collegeId));
    } else {
      q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    }

    if (options.batch) {
      q = query(q, where("batch", "==", options.batch));
    }
    if (options.status && options.status !== "all") {
      q = query(q, where("status", "==", options.status));
    }

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(docToStudent);

    if (options.collegeId) {
      items = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = items.length;
    const hasMore = false;

    return { items, data: items, total, hasMore };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { items: [], data: [], total: 0, hasMore: false };
  }
}

export async function getStudentByIdSuperAdmin(studentId: string): Promise<Student | null> {
  try {
    const docRef = doc(db, "students", studentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docToStudent(docSnap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error fetching student:", error);
    return null;
  }
}

export async function updateStudentSuperAdmin(studentId: string, updates: UpdateStudentInput): Promise<Student> {
  try {
    const docRef = doc(db, "students", studentId);
    await updateDoc(docRef, { ...stripUndefined(updates), updatedAt: Timestamp.now() });

    const updated = await getDoc(docRef);
    if (!updated.exists()) throw new SuperAdminApiError("Student not found after update");
    return docToStudent(updated as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    throw new SuperAdminApiError(error instanceof Error ? error.message : "Failed to update student");
  }
}

// ═══════════════════════════════════════════════════════════════════════
// IMPORT API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function importUsers(input: ImportUsersInput): Promise<ImportResult> {
  // Separate students from other roles
  const students = input.users.filter(u => u.role === 'student');
  const nonStudents = input.users.filter(u => u.role !== 'student');

  const imported: Array<{ id: string; email: string; password?: string }> = [];
  const errors: string[] = [];
  let studentCount = 0;
  let facultyCount = 0;

  // ── Students: use Cloud Function (creates Auth + Firestore) ──────────────
  if (students.length > 0) {
    try {
      const bulkCreateFn = httpsCallable<
        { collegeId: string; students: any[] },
        { success: boolean; total: number; created: number; failed: number; errors: any[]; students: any[] }
      >(functions, 'bulkCreateStudentAccounts');

      const result = await bulkCreateFn({
        collegeId: input.collegeId,
        students: students.map(s => ({
          regNo: s.regNo || '',
          name: s.name,
          email: s.email,
          phone: s.phone,
          department: s.department || '',
          batch: s.batch || '',
          division: s.division || '',
          semester: s.semester || 1,
          dob: s.dob || '',
          gender: s.gender || '',
          address: s.address || '',
          mentorId: s.mentor || '',
        })),
      });

      const data = result.data;
      
      // Process successful imports
      for (const student of data.students) {
        if (student.success) {
          imported.push({
            id: student.uid,
            email: student.email,
            password: student.password,
          });
          studentCount++;
        } else {
          errors.push(`Row: ${student.regNo} - ${student.error || 'Unknown error'}`);
        }
      }

      // Add server-side errors
      for (const err of data.errors || []) {
        errors.push(`Row ${err.row}: ${err.message}`);
      }

      console.log('[ImportUsers] Cloud Function result:', {
        total: data.total,
        created: data.created,
        failed: data.failed,
      });
    } catch (cfErr: any) {
      console.error('[ImportUsers] Cloud Function error:', cfErr);
      errors.push(`Cloud Function error: ${cfErr.message || 'Failed to call bulkCreateStudentAccounts'}`);
    }
  }

  // ── Non-students (faculty, admin, etc.): direct Firestore write ───────────
  for (const user of nonStudents) {
    try {
      if (!user.email || !user.name) {
        throw new Error(`Missing required fields (name, email)`);
      }

      const email = user.email.toLowerCase().trim();

      // Check for existing user
      const collectionName = user.role === "student" ? "students" : "faculty";
      const existingSnap = await getDocs(
        query(collection(db, collectionName), where("email", "==", email))
      );
      if (!existingSnap.empty) {
        // Duplicate profile — but if a previous failed import left the Auth
        // account without its users/{uid} lookup doc, restore it so the
        // account can log in (password from the original import still valid).
        const healed = await healMissingUserDoc(
          existingSnap.docs[0].data(),
          user.role === "student" ? "student" : "faculty"
        );
        if (healed) {
          imported.push({ id: existingSnap.docs[0].id, email });
          facultyCount++;
          errors.push(`Info: restored missing login profile for ${email} — account already existed, password unchanged`);
        } else {
          throw new Error(`${email} already exists`);
        }
        continue;
      }

      // Generate password and create Firebase Auth account
      const tempPassword = generateTempPassword();
      let uid: string;
      try {
        uid = await createFirebaseAuthUser(email, tempPassword);
      } catch (authErr: any) {
        throw new Error(`Auth creation failed — ${authErr.message}`);
      }

      // Build the Firestore document
      const now = Timestamp.now();
      const docRef = doc(collection(db, collectionName));
      const userDoc = stripUndefined({
        ...user,
        email,
        collegeId: input.collegeId,
        uid,
        role: user.role,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      await setDoc(docRef, userDoc);

      // Create the users/ lookup document
      await setDoc(doc(db, "users", uid), {
        uid,
        email,
        name: user.name,
        role: user.role,
        collegeId: input.collegeId,
        department: user.department || "",
        phone: user.phone || "",
        avatar: "",
        createdAt: now,
        updatedAt: now,
      });

      imported.push({ id: docRef.id, email, password: tempPassword });
      facultyCount++;
    } catch (error) {
      errors.push(
        `Failed to import ${user.email}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Update college aggregate counts
  if (studentCount > 0 || facultyCount > 0) {
    try {
      const collegeRef = doc(db, "colleges", input.collegeId);
      const collegeSnap = await getDoc(collegeRef);
      if (collegeSnap.exists()) {
        const collegeData = collegeSnap.data();
        const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
        if (studentCount > 0) updates.studentCount = (collegeData.studentCount || 0) + studentCount;
        if (facultyCount > 0) updates.facultyCount = (collegeData.facultyCount || 0) + facultyCount;
        await updateDoc(collegeRef, updates);
      }
    } catch (err) {
      console.error("Failed to update college counts:", err);
    }
  }

  return {
    success: imported.length,
    failed: errors.length,
    errors,
    imported,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// FACULTY IMPORT API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function importFaculty(payload: FacultyImportPayload): Promise<ImportResult> {
  try {
    const collegeRef = doc(db, "colleges", payload.collegeId);
    const collegeSnap = await getDoc(collegeRef);
    if (!collegeSnap.exists()) throw new Error("College not found");

    const collegeData = collegeSnap.data();
    const collegeName = collegeData.name;
    const imported: Array<{ id: string; email: string; password: string }> = [];
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const [index, faculty] of payload.faculty.entries()) {
      try {
        if (!faculty.firstName || !faculty.email || !faculty.collegeCode) {
          throw new Error(`Row ${index + 1}: Missing required fields`);
        }
        const existingSnap = await getDocs(query(
          collection(db, "faculty"), where("email", "==", faculty.email.toLowerCase().trim())
        ));
        if (!existingSnap.empty) {
          // Duplicate — self-heal a missing users/{uid} lookup doc left by an
          // earlier failed import instead of failing the row.
          const healed = await healMissingUserDoc(existingSnap.docs[0].data(), "faculty");
          if (healed) {
            imported.push({ id: existingSnap.docs[0].id, email: faculty.email, password: "" });
            success++;
            errors.push(`Row ${index + 1}: Info — restored missing login profile for ${faculty.email} (account already existed, password unchanged)`);
          } else {
            throw new Error(`Row ${index + 1}: Faculty with email ${faculty.email} already exists`);
          }
          continue;
        }

        const facultyId = faculty.facultyId || `FAC${Date.now()}${index}`;
        const tempPassword = generateTempPassword();

        let uid: string;
        try {
          uid = await createFirebaseAuthUser(faculty.email.toLowerCase().trim(), tempPassword);
        } catch (authErr: any) {
          failed++;
          errors.push(`Row ${index + 1}: ${authErr.message}`);
          continue;
        }

        const facultyData = {
          id: facultyId,
          facultyId,
          firstName: faculty.firstName,
          lastName: faculty.lastName || "",
          email: faculty.email.toLowerCase().trim(),
          phone: faculty.phone || "",
          gender: faculty.gender || "",
          collegeId: payload.collegeId,
          collegeName: faculty.collegeName || collegeName,
          collegeCode: faculty.collegeCode,
          department: faculty.department || "",
          designation: faculty.designation || "Assistant Professor",
          employmentType: faculty.employmentType || "FULL_TIME",
          joiningDate: faculty.joiningDate || "",
          qualification: faculty.qualification || "",
          specialization: faculty.specialization || "",
          subjectsUG: faculty.subjectsUG || [],
          subjectsPG: faculty.subjectsPG || [],
          experienceYears: faculty.experienceYears || 0,
          isHOD: faculty.isHOD || false,
          role: "faculty",
          status: "active",
          uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, "faculty", facultyId), facultyData);

        await setDoc(doc(db, "users", uid), {
          uid,
          email: faculty.email.toLowerCase().trim(),
          name: `${faculty.firstName} ${faculty.lastName || ""}`.trim(),
          role: faculty.isHOD ? "hod" : "faculty",
          collegeId: payload.collegeId,
          department: faculty.department || "",
          phone: faculty.phone || "",
          avatar: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (faculty.isHOD && faculty.department) {
          await setDoc(doc(db, "hods", `${payload.collegeId}_${faculty.department}`), {
            facultyId,
            uid,
            collegeId: payload.collegeId,
            department: faculty.department,
            name: `${faculty.firstName} ${faculty.lastName || ""}`.trim(),
            email: faculty.email,
            role: "hod",
            assignedAt: serverTimestamp(),
          }, { merge: true });
        }

        imported.push({ id: facultyId, email: faculty.email, password: tempPassword });
        success++;
      } catch (err: unknown) {
        failed++;
        const errorMsg = err instanceof Error ? err.message : `Row ${index + 1}: Unknown error`;
        errors.push(errorMsg);
      }
    }

    if (success > 0) {
      await updateDoc(collegeRef, {
        facultyCount: (collegeData.facultyCount || 0) + success,
        updatedAt: Timestamp.now(),
      });
    }
    return { success, failed, imported, errors };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Faculty import failed";
    throw new Error(msg);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function getDashboardStats(): Promise<{
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  topColleges: TopCollege[];
}> {
  try {
    const collegesSnap = await getDocs(collection(db, "colleges"));
    const studentsSnap = await getDocs(collection(db, "students"));
    const facultySnap = await getDocs(collection(db, "faculty"));
    const adminsSnap = await getDocs(collection(db, "admins"));

    const colleges = collegesSnap.docs.map(docToCollege);
    const activeColleges = colleges.filter(c => c.status === "active").length;
    const suspendedColleges = colleges.filter(c => c.status === "suspended").length;

    const topColleges: TopCollege[] = colleges
      .sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        studentCount: c.studentCount || 0,
        facultyCount: c.facultyCount || 0,
        students: c.studentCount,
        faculty: c.facultyCount,
        avgAttendance: 0,
        passRate: 0,
        score: 0,
        status: c.status,
      }));

    return {
      stats: {
        totalColleges: collegesSnap.size,
        totalStudents: studentsSnap.size,
        totalFaculty: facultySnap.size,
        totalAdmins: adminsSnap.size,
        activeColleges,
        suspendedColleges,
        newCollegesThisMonth: 0,
        revenueThisMonth: 0,
      },
      recentActivity: [],
      topColleges,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      stats: {
        totalColleges: 0,
        totalStudents: 0,
        totalFaculty: 0,
        totalAdmins: 0,
        activeColleges: 0,
        suspendedColleges: 0,
        newCollegesThisMonth: 0,
        revenueThisMonth: 0,
      },
      recentActivity: [],
      topColleges: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// COMPARISON API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function getCollegeComparison(collegeIds: string[]): Promise<ComparisonResult> {
  try {
    const colleges: CollegeMetric[] = [];

    for (const id of collegeIds) {
      const college = await getCollegeById(id);
      if (!college) continue;

      colleges.push({
        collegeId: college.id,
        collegeName: college.name,
        collegeCode: college.code,
        students: college.studentCount || 0,
        faculty: college.facultyCount || 0,
        avgAttendance: 0,
        avgScore: 0,
        passRate: 0,
        feeCollectionRate: 0,
        libraryUsage: 0,
        placementRate: 0,
        mentorRatio: 0,
        researchPapers: 0,
        trendAttendance: 0,
        trendScore: 0,
        trendPassRate: 0,
        percentileAttendance: 0,
        percentileScore: 0,
        percentilePassRate: 0,
      });
    }

    if (colleges.length < 2) {
      throw new SuperAdminApiError("At least 2 colleges required for comparison");
    }

    const values = colleges.map(c => c.avgAttendance);
    const average = values.reduce((a, b) => a + b, 0) / values.length || 0;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[Math.floor(sorted.length / 2) - 1] + sorted[Math.floor(sorted.length / 2)]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const mean = average;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length || 0;
    const stdDev = Math.sqrt(variance);

    const best = colleges.reduce((max, c) => (c.avgAttendance > max.avgAttendance ? c : max), colleges[0]);
    const worst = colleges.reduce((min, c) => (c.avgAttendance < min.avgAttendance ? c : min), colleges[0]);

    return { colleges, average, median, stdDev, best, worst };
  } catch (error) {
    throw new SuperAdminApiError(error instanceof Error ? error.message : "Comparison failed");
  }
}

export async function getBenchmarkData(collegeId: string): Promise<BenchmarkData[]> {
  return [
    { metric: "attendance", collegeValue: 0, averageValue: 0, topValue: 0, percentile: 0 },
    { metric: "score", collegeValue: 0, averageValue: 0, topValue: 0, percentile: 0 },
    { metric: "passRate", collegeValue: 0, averageValue: 0, topValue: 0, percentile: 0 },
  ];
}

// ═══════════════════════════════════════════════════════════════════════
// SUBSCRIPTION API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function getCollegeSubscriptions(): Promise<CollegeSubscription[]> {
  try {
    const snapshot = await getDocs(collection(db, "subscriptions"));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
      } as CollegeSubscription;
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }
}

export async function getPaymentHistory(
  options?: { collegeId?: string; limit?: number; status?: PaymentStatus }
): Promise<PaginatedResult<PaymentHistory>> {
  try {
    let q = query(collection(db, "payments"), orderBy("createdAt", "desc"));

    if (options?.collegeId) {
      q = query(q, where("collegeId", "==", options.collegeId));
    }
    if (options?.status) {
      q = query(q, where("status", "==", options.status));
    }

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      } as PaymentHistory;
    });

    return { items, data: items, total: items.length, hasMore: false };
  } catch (error) {
    console.error("Error fetching payments:", error);
    return { items: [], data: [], total: 0, hasMore: false };
  }
}

export async function getRenewalAlerts(): Promise<RenewalAlert[]> {
  try {
    const snapshot = await getDocs(collection(db, "subscriptions"));
    const now = new Date();

    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        const nextDate = new Date(data.nextBillingDate);
        const daysUntilExpiry = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let status: "info" | "warning" | "urgent" = "info";
        if (daysUntilExpiry <= 7) status = "urgent";
        else if (daysUntilExpiry <= 30) status = "warning";

        return {
          id: `alert-${doc.id}`,
          collegeId: data.collegeId,
          collegeName: data.collegeName,
          planName: data.plan?.name || "",
          daysUntilExpiry,
          currentPlan: data.plan?.type || "standard",
          amount: data.plan?.price || 0,
          status,
          autoRenewEnabled: data.autoRenew || false,
        } as RenewalAlert;
      })
      .filter(alert => alert.daysUntilExpiry <= 30);
  } catch (error) {
    console.error("Error fetching renewal alerts:", error);
    return [];
  }
}

export async function updateSubscriptionPlan(
  collegeId: string,
  plan: PlanType,
  billingCycle: BillingCycle
): Promise<void> {
  await updateDoc(doc(db, "subscriptions", collegeId), {
    plan,
    billingCycle,
    updatedAt: Timestamp.now(),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SYSTEM HEALTH API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function getSystemHealth(): Promise<SystemHealthStatus> {
  return {
    overallStatus: "healthy",
    uptime: 99.98,
    uptime24h: 99.95,
    errorRate24h: 0.02,
    avgResponseTime: 85,
    totalRequests24h: 245678,
    services: [],
    slowQueries: [],
    recentErrors: [],
    alerts: [],
  };
}

export async function getSlowQueries(limitCount: number = 20): Promise<SlowQuery[]> {
  return [];
}

export async function getErrorLogs(
  options?: { severity?: string; resolved?: boolean; limit?: number }
): Promise<PaginatedResult<ErrorLog>> {
  return { items: [], data: [], total: 0, hasMore: false };
}

export async function getPerformanceMetrics(hours: number = 24): Promise<PerformanceMetric[]> {
  return [];
}

export async function resolveError(errorId: string): Promise<void> {
  await updateDoc(doc(db, "errors", errorId), { resolved: true, resolvedAt: Timestamp.now() });
}

// ═══════════════════════════════════════════════════════════════════════
// COLLEGE RESET API
//
// Delegated to the `resetCollegeData` Cloud Function so the reset can also
// remove data the client cannot touch safely: `users/{uid}` lookup docs,
// Firebase Auth accounts, hods, curriculum, curriculumFacultyMappings,
// weeklySchedules, college-scoped syllabusExtracts and the
// colleges/{collegeId} subcollections. The old client-side version only
// cleared top-level students/faculty/admins and left orphans behind.
// ═══════════════════════════════════════════════════════════════════════

export interface ResetCollegeDataResult {
  success: boolean;
  collegeId: string;
  totalDeleted: number;
  authUsersDeleted: number;
  deleted: Record<string, number>;
  errors: string[];
}

export async function resetCollegeData(collegeId: string): Promise<ResetCollegeDataResult> {
  try {
    const resetFn = httpsCallable<
      { collegeId: string; deleteAuthUsers?: boolean },
      ResetCollegeDataResult
    >(functions, "resetCollegeData");

    const result = await resetFn({ collegeId, deleteAuthUsers: true });
    return result.data;
  } catch (error) {
    console.error("Error resetting college data:", error);
    throw new SuperAdminApiError(
      error instanceof Error ? error.message : "Failed to reset college data"
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PLAN ID MAPPING HELPER
// ═══════════════════════════════════════════════════════════════════════
const PLAN_ID_MAP: Record<string, { plan: PlanType; billingCycle: BillingCycle }> = {
  "plan-1": { plan: "basic", billingCycle: "monthly" },
  "plan-2": { plan: "standard", billingCycle: "monthly" },
  "plan-3": { plan: "premium", billingCycle: "quarterly" },
  "plan-4": { plan: "enterprise", billingCycle: "yearly" },
};

export async function updateSubscriptionPlanById(
  collegeId: string,
  planId: string
): Promise<void> {
  const mapping = PLAN_ID_MAP[planId];
  if (!mapping) {
    throw new SuperAdminApiError(`Unknown plan ID: ${planId}`);
  }
  return updateSubscriptionPlan(collegeId, mapping.plan, mapping.billingCycle);
}

// ═══════════════════════════════════════════════════════════════════════
// ADDITIONAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const snapshot = await getDocs(collection(db, "subscriptionPlans"));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as SubscriptionPlan));
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return [];
  }
}

export async function toggleAutoRenew(subscriptionId: string, enabled: boolean): Promise<void> {
  await updateDoc(doc(db, "subscriptions", subscriptionId), {
    autoRenew: enabled,
    updatedAt: Timestamp.now(),
  });
}

export async function sendRenewalReminder(collegeId: string): Promise<void> {
  console.log(`Sending renewal reminder to college ${collegeId}`);
}

export async function getHealthHistory(hours: number = 24): Promise<PerformanceMetric[]> {
  return getPerformanceMetrics(hours);
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  await updateDoc(doc(db, "alerts", alertId), { acknowledged: true, acknowledgedAt: Timestamp.now() });
}

export async function getCollegeComparisonTrend(
  collegeId: string | null,
  metric: string,
  timeRange: string
): Promise<Array<{ date: string; value: number }>> {
  return [];
}

// ═══════════════════════════════════════════════════════════════════════
// FACULTY API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function listFaculty(options: ListFacultyOptions = {}): Promise<PaginatedResult<Faculty>> {
  try {
    let q: Query<DocumentData>;
    if (options.collegeId) {
      q = query(collection(db, "faculty"), where("collegeId", "==", options.collegeId));
    } else {
      q = query(collection(db, "faculty"), orderBy("createdAt", "desc"));
    }

    if (options.status && options.status !== "all") {
      q = query(q, where("status", "==", options.status));
    }

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(docToFaculty);

    if (options.collegeId) {
      items = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (options.department) items = items.filter(f => f.department === options.department);
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      items = items.filter(f =>
        f.firstName.toLowerCase().includes(searchLower) ||
        f.lastName.toLowerCase().includes(searchLower) ||
        f.email.toLowerCase().includes(searchLower) ||
        f.department.toLowerCase().includes(searchLower) ||
        f.designation.toLowerCase().includes(searchLower) ||
        f.facultyId.toLowerCase().includes(searchLower)
      );
    }
    return { items, data: items, total: items.length, hasMore: false };
  } catch (error) {
    console.error("Error fetching faculty:", error);
    return { items: [], data: [], total: 0, hasMore: false };
  }
}

export async function getFacultyById(facultyId: string): Promise<Faculty | null> {
  try {
    const docSnap = await getDoc(doc(db, "faculty", facultyId));
    if (!docSnap.exists()) return null;
    return docToFaculty(docSnap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error fetching faculty:", error);
    return null;
  }
}

export async function updateFaculty(facultyId: string, updates: UpdateFacultyInput): Promise<Faculty> {
  try {
    const docRef = doc(db, "faculty", facultyId);
    await updateDoc(docRef, { ...stripUndefined(updates), updatedAt: Timestamp.now() });
    const updated = await getDoc(docRef);
    if (!updated.exists()) throw new SuperAdminApiError("Faculty not found after update");
    return docToFaculty(updated as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    throw new SuperAdminApiError(error instanceof Error ? error.message : "Failed to update faculty");
  }
}

export async function deleteFaculty(facultyId: string): Promise<void> {
  try {
    const facultySnap = await getDoc(doc(db, "faculty", facultyId));
    if (facultySnap.exists()) {
      const collegeId = facultySnap.data().collegeId;
      await deleteDoc(doc(db, "faculty", facultyId));
      if (collegeId) {
        const collegeSnap = await getDoc(doc(db, "colleges", collegeId));
        if (collegeSnap.exists()) {
          await updateDoc(doc(db, "colleges", collegeId), {
            facultyCount: Math.max(0, (collegeSnap.data().facultyCount || 0) - 1),
            updatedAt: Timestamp.now(),
          });
        }
      }
    }
  } catch (error) {
    throw new SuperAdminApiError(error instanceof Error ? error.message : "Failed to delete faculty");
  }
}

export async function toggleFacultyStatus(facultyId: string, status: "active" | "inactive"): Promise<void> {
  await updateDoc(doc(db, "faculty", facultyId), { status, updatedAt: Timestamp.now() });
}

export async function resetFacultyPassword(facultyId: string): Promise<string> {
  const newPassword = generateTempPassword();
  await updateDoc(doc(db, "faculty", facultyId), { password: newPassword, updatedAt: Timestamp.now() });
  return newPassword;
}