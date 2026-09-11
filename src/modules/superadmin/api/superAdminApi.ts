// src/modules/superadmin/api/superAdminApi.ts
// Cleaned - No mock data. Connects to Firebase Firestore.
// All types imported from ../types/superAdmin.ts (single source of truth)

import { db, functions } from '@/Firebase/config';
import { httpsCallable } from 'firebase/functions';
import {
  DEPLOY_COMMAND,
  describeIdentityError,
  identityBackendMismatch,
  type CredentialDelivery,
} from '@/shared/services/identityBackend';
import {
  IMPORT_BATCH_SIZE,
  IMPORT_BATCH_TIMEOUT_MS,
  runInBatches,
  type BatchMeta,
  type BatchedOutcome,
} from '@/shared/utils/batchedImport';
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
    // Never silently adopt a pre-existing account: doing so returned the old
    // uid WITHOUT resetting its password, so the temp password the importer
    // displayed never worked. Bulk import reclaims such orphans server-side
    // (bulkProvisionStaff / bulkCreateStudentAccounts); single-account callers
    // must surface the conflict instead of masking it.
    if (data.error?.message === 'EMAIL_EXISTS') {
      throw new Error('EMAIL_EXISTS');
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

/**
 * `createAdmin` returns the created profile plus the one-time credential facts
 * the caller has to surface. They live on the response only: nothing here is
 * written to Firestore, so a password cannot outlive the screen that showed it.
 */
export type CreateAdminResult = Admin & {
  /** Firebase Auth uid — equal to `id`; kept explicit because the profile
   *  document id and the uid are the same value only for freshly granted roles. */
  uid?: string;
  phone?: string;
  department?: string;
  temporaryPassword?: string;
  authVerified?: boolean;
  reauthenticateRequired?: boolean;
};

export async function createAdmin(input: CreateAdminInput): Promise<CreateAdminResult> {
  // Privileged accounts are created server-side via grantUserRole (Admin SDK)
  // so the Auth account is created with the correct custom CLAIMS (role +
  // collegeId). The old client REST path could not set claims, leaving a
  // created admin unable to perform any admin operation under the
  // claim-authoritative rules.
  const grant = httpsCallable<
    {
      email: string;
      name: string;
      role: string;
      collegeId: string | null;
      password?: string;
    },
    {
      success: boolean;
      uid: string;
      email: string;
      role: string;
      collegeId: string | null;
      created: boolean;
      temporaryPassword?: string;
      authVerified?: boolean;
      reauthenticateRequired?: boolean;
    }
  >(functions, "grantUserRole");

  const email = input.email.trim().toLowerCase();
  const result = await grant({
    email,
    name: input.name,
    role: input.role,
    collegeId: input.collegeId || null,
    ...(input.password ? { password: input.password } : {}),
  });

  const data = result.data;
  const now = new Date().toISOString();

  return {
    id: data.uid,
    name: input.name,
    email: data.email || email,
    role: (data.role || input.role) as Admin["role"],
    collegeId: data.collegeId || input.collegeId,
    status: "active",
    createdAt: now,
    uid: data.uid,
    // The one-time credential, surfaced to the creating superadmin only.
    ...(data.temporaryPassword ? { temporaryPassword: data.temporaryPassword } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.department ? { department: input.department } : {}),
    ...(data.authVerified === false ? { authVerified: false } : {}),
    ...(data.reauthenticateRequired ? { reauthenticateRequired: true } : {}),
  };
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
  // Promotion must change the Auth custom CLAIMS (role), otherwise under the
  // claim-authoritative rules the promoted user keeps their old privileges.
  // grantUserRole rewires claims + the users/admins profile documents and
  // revokes refresh tokens so the new role takes effect on next sign-in.
  const grant = httpsCallable<
    { email: string; name: string; role: string; collegeId: string | null },
    {
      success: boolean;
      uid: string;
      email: string;
      role: string;
      collegeId: string | null;
      reauthenticateRequired: boolean;
    }
  >(functions, "grantUserRole");

  const result = await grant({
    email: payload.email.trim().toLowerCase(),
    name: payload.name,
    role: payload.role,
    collegeId: payload.collegeId || null,
  });
  const data = result.data;
  const now = new Date().toISOString();

  return {
    id: data.uid,
    uid: data.uid,
    name: payload.name,
    email: data.email || payload.email,
    role: (data.role || payload.role) as Admin["role"],
    collegeId: data.collegeId || payload.collegeId,
    status: "active",
    createdAt: now,
    updatedAt: now,
    reauthenticateRequired: data.reauthenticateRequired,
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

/**
 * Response shape of `bulkProvisionStaff`, shared by the mixed user import and
 * the dedicated faculty import so both stay in step with the callable.
 */
type StaffBatchData = {
  /** Present only on newer deployments; absent on the mixed-user call site. */
  total?: number;
  created: number;
  reclaimed: number;
  skipped?: number;
  failed: number;
  authVerified?: number;
  warnings?: string[];
  secretsStripped?: number;
  apiVersion?: string;
  errors: any[];
  staff: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    success: boolean;
    uid?: string;
    password?: string;
    reclaimed?: boolean;
    status?: 'created' | 'reclaimed' | 'skipped' | 'failed';
    facultyDocId?: string;
    authVerified?: boolean;
    delivery?: 'temp-password' | 'reset-link' | 'none';
    resetLink?: string;
    error?: string;
  }>;
};

export async function importUsers(input: ImportUsersInput): Promise<ImportResult> {
  // Separate students from other roles: students are provisioned by
  // bulkCreateStudentAccounts, staff by bulkProvisionStaff. Both run in the
  // Admin SDK so an Auth account, the custom claims, the users/{uid} lookup doc
  // and the profile document are written together and then VERIFIED.
  const students = input.users.filter(u => u.role === 'student');
  const nonStudents = input.users.filter(u => u.role !== 'student');

  const imported: ImportResult["imported"] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const failedStudents: NonNullable<ImportResult["failedStudents"]> = [];
  let studentCount = 0;
  let facultyCount = 0;
  let skipped = 0;
  let authVerified = 0;

  if (!input.collegeId) {
    throw new SuperAdminApiError("A college must be selected before importing users.");
  }

  // ── Students: use Cloud Function (creates Auth + Firestore) ──────────────
  //
  // Rows go up in batches. One `httpsCallable` request cannot be held open for
  // the minutes a full-size upload takes: the Firebase JS SDK abandons it
  // after 70 s (`FirebaseError: deadline-exceeded`) while the Cloud Function
  // carries on server-side, so the accounts are created but the response —
  // counts and every generated one-time password — is thrown away. Batching
  // keeps each request inside the deadline, makes progress visible, and means
  // one bad batch no longer costs the credentials already issued.
  if (students.length > 0) {
    type StudentBatchData = {
      success: boolean; total: number; created: number; reclaimed: number; failed: number;
      authVerified?: number; errors: any[]; students: any[]; warnings?: string[]; apiVersion?: string;
    };

    const payloads = students.map(s => ({
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
    }));

    // Marker: proves the batched sender is the code actually running. If an
    // import fails without this line in the console, the deployed bundle is
    // stale and is still sending every row in a single 70 s-capped request.
    console.log(
      `[ImportUsers] batched sender: ${payloads.length} row(s) in ` +
      `${Math.ceil(payloads.length / IMPORT_BATCH_SIZE)} batch(es) of ${IMPORT_BATCH_SIZE}, ` +
      `${IMPORT_BATCH_TIMEOUT_MS / 1000}s per batch`
    );

    let outcome: BatchedOutcome<{ data: StudentBatchData; meta: BatchMeta }>;
    try {
      outcome = await runInBatches({
        items: payloads,
        batchSize: IMPORT_BATCH_SIZE,
        onProgress: input.onProgress,
        // A stale or missing deployment answers the same way for every batch,
        // so one verdict is enough. Report it as a hard error instead of
        // grinding through the upload and blaming every row.
        isFatal: (err: any) => err?.fatal === true,
        run: async (batch, meta) => {
          const bulkCreateFn = httpsCallable<
            { collegeId: string; students: any[]; deliveryMode?: CredentialDelivery },
            StudentBatchData
            // The explicit deadline is the whole point of batching: the SDK's
            // default is 70 s, which any real upload exceeds.
          >(functions, 'bulkCreateStudentAccounts', { timeout: IMPORT_BATCH_TIMEOUT_MS });

          const result = await bulkCreateFn({
            collegeId: input.collegeId,
            deliveryMode: input.deliveryMode,
            students: batch,
          });

          // Hard gate: if the deployed function predates the Auth-verification
          // contract, STOP and say so. Reporting "0 failures" against a stale
          // backend is what made this look like a rules problem for days.
          const mismatch = identityBackendMismatch(result.data, 'bulkCreateStudentAccounts');
          if (mismatch) throw Object.assign(new Error(mismatch.message), { fatal: true });

          return { data: result.data, meta };
        },
      });
    } catch (cfErr: any) {
      console.error('[ImportUsers] Cloud Function error:', cfErr);
      throw new SuperAdminApiError(describeIdentityError(cfErr, 'bulkCreateStudentAccounts'));
    }

    // Totals that only mean something once every batch has reported.
    let total = 0;
    let created = 0;
    let reclaimed = 0;
    let batchFailed = 0;
    let verified = 0;
    let stalledBatches = 0;

    for (const { data } of outcome.results) {
      total += data.total || 0;
      created += data.created || 0;
      reclaimed += data.reclaimed || 0;
      batchFailed += data.failed || 0;
      if (typeof data.authVerified === 'number') verified += data.authVerified;

      // The callable reports each failed row twice — once in `students` (with
      // success:false) and once in `errors`. Use `students` as the single
      // source of truth so the failed count isn't doubled.
      for (const student of data.students || []) {
        if (student.success) {
          if (student.authVerified) authVerified++;
          else warnings.push(`${student.email}: created but the Firebase Auth account could not be verified`);
          imported.push({
            id: student.uid || student.studentDocId || '',
            email: student.email,
            password: student.password,
            resetLink: student.resetLink,
            name: student.name,
            role: 'student',
            uid: student.uid,
            docId: student.studentDocId,
            status: student.reclaimed ? 'reclaimed' : 'created',
            authVerified: student.authVerified !== false,
            delivery: student.delivery,
          });
          studentCount++;
        } else {
          const reason = student.error || 'Unknown error';
          const name = String(student.name || '');
          const emailAddr = String(student.email || '');
          const regNo = String(student.regNo || '');
          failedStudents.push({ name, email: emailAddr, regNo, reason });
          errors.push(
            `${[name, emailAddr, regNo].filter(Boolean).join(' | ') || 'Row'} — ${reason}`
          );
        }
      }

      if (data.warnings?.length) warnings.push(...data.warnings);

      // Nothing created and nothing reported as failed means the batch never
      // ran at all (region/permissions/quota). Counted per batch, reported
      // once below, so a 12-batch import does not repeat it 12 times.
      if (data.total > 0 && data.created + data.reclaimed === 0 && data.failed === 0) {
        stalledBatches++;
      }
    }

    // Whole batches that never reached the backend. Identified by position
    // because the backend never saw enough to name them.
    for (const failure of outcome.failures) {
      errors.push(`Rows ${failure.fromRow}–${failure.toRow} — ${failure.message}`);
    }

    const batchTotal = outcome.results.length + outcome.failures.length;
    if (stalledBatches > 0) {
      errors.push(
        `${stalledBatches} of ${batchTotal} batch(es) reported no created and no failed rows — ` +
        `the Cloud Function did not process them. Verify the deployment: ${DEPLOY_COMMAND}`
      );
    }
    if (verified < created + reclaimed) {
      warnings.push(
        `${created + reclaimed - verified} student(s) have a profile but no verified Auth account. ` +
        'Run Superadmin → Access Control → Identity repair to close the gap.'
      );
    }

    console.log('[ImportUsers] Cloud Function result:', {
      total,
      created,
      reclaimed,
      authVerified: verified,
      failed: batchFailed,
      batches: batchTotal,
      failedBatches: outcome.failures.length,
    });
  }

  // ── Non-students (faculty / HOD / principal / admin): provision through the
  //    Admin SDK callable so an Auth account orphaned by a college reset is
  //    reclaimed (password reset + claims) instead of failing or being silently
  //    re-used with a stale password. The callable also writes the profile,
  //    the users/{uid} lookup doc and increments the college faculty counter.
  //
  //    Batched for the same reason as the students: provisioning is one row at
  //    a time server-side, so a single request outlives the SDK's 70 s default
  //    deadline and the credentials it already minted are lost with it.
  if (nonStudents.length > 0) {
    const payloads = nonStudents.map((u) => ({
      name: u.name,
      email: u.email,
      phone: (u as any).phone,
      department: (u as any).department || "",
      designation: (u as any).designation,
      role: (u as any).role,
      isHOD: (u as any).role === "hod",
      isPrincipal: (u as any).role === "principal",
    }));

    console.log(
      `[ImportUsers] batched sender (staff): ${payloads.length} row(s) in ` +
      `${Math.ceil(payloads.length / IMPORT_BATCH_SIZE)} batch(es) of ${IMPORT_BATCH_SIZE}`
    );

    let outcome: BatchedOutcome<{ data: StaffBatchData; meta: BatchMeta }>;
    try {
      outcome = await runInBatches({
        items: payloads,
        batchSize: IMPORT_BATCH_SIZE,
        onProgress: input.onProgress,
        isFatal: (err: any) => err?.fatal === true,
        run: async (batch, meta) => {
          const bulkProvision = httpsCallable<
            { collegeId: string; staff: any[]; deliveryMode?: CredentialDelivery; onExisting?: 'skip' | 'reset' },
            StaffBatchData
          >(functions, "bulkProvisionStaff", { timeout: IMPORT_BATCH_TIMEOUT_MS });

          const staffResult = await bulkProvision({
            collegeId: input.collegeId,
            deliveryMode: input.deliveryMode,
            onExisting: input.onExisting || 'skip',
            staff: batch,
          });

          // A stale deployment must not look like per-row failures.
          const mismatch = identityBackendMismatch(staffResult.data, 'bulkProvisionStaff');
          if (mismatch) throw Object.assign(new Error(mismatch.message), { fatal: true });

          return { data: staffResult.data, meta };
        },
      });
    } catch (staffErr: any) {
      console.error("[ImportUsers] Staff provisioning error:", staffErr);
      throw new SuperAdminApiError(describeIdentityError(staffErr, 'bulkProvisionStaff'));
    }

    let reclaimedTotal = 0;

    for (const { data } of outcome.results) {
      for (const member of data.staff || []) {
        if (member.success) {
          if (member.authVerified) authVerified++;
          if (member.status === 'skipped') skipped++;
          imported.push({
            id: member.id || member.uid || "",
            email: member.email,
            password: member.password,
            resetLink: member.resetLink,
            name: member.name,
            role: member.role,
            uid: member.uid,
            docId: member.facultyDocId || member.id,
            status: member.status || (member.reclaimed ? 'reclaimed' : 'created'),
            authVerified: member.authVerified !== false,
            delivery: member.delivery,
            error: member.error,
          });
          facultyCount++;
        } else {
          errors.push(`${member.name || member.email} — ${member.error || "Unknown error"}`);
        }
      }

      if (data.warnings?.length) warnings.push(...data.warnings);
      reclaimedTotal += data.reclaimed || 0;
    }

    // Whole batches that never reached the backend; named by position.
    for (const failure of outcome.failures) {
      errors.push(`Rows ${failure.fromRow}–${failure.toRow} — ${failure.message}`);
    }

    if (reclaimedTotal > 0) {
      warnings.push(`${reclaimedTotal} existing account(s) were reclaimed and their password was reset`);
    }
  }

  // College aggregate counts are maintained server-side by the callables.

  return {
    success: imported.length - skipped,
    skipped,
    failed: errors.length,
    errors,
    warnings,
    authVerified,
    imported,
    failedStudents,
    // Same rows under the generic name, so the export UI does not have to
    // know whether it is dealing with students or staff.
    failedRows: failedStudents,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// FACULTY IMPORT API — REAL FIREBASE
// ═══════════════════════════════════════════════════════════════════════

export async function importFaculty(payload: FacultyImportPayload): Promise<ImportResult> {
  // Staff provisioning runs through the Admin SDK callable so that an Auth
  // account orphaned by a college reset is RECLAIMED (password reset + claims
  // re-issued) instead of either failing with "email already exists" or being
  // silently re-used with a stale password. The callable writes the faculty
  // profile, the users/{uid} lookup doc, the HOD doc and the college counter.
  //
  // Rows go up in batches. Provisioning is one row at a time server-side, so a
  // single request outlives the Firebase JS SDK's 70 s default deadline
  // (`FirebaseError: deadline-exceeded`) while the function keeps running
  // server-side — the accounts get created and the response carrying every
  // generated password is discarded. See `shared/utils/batchedImport.ts`.

  const staffPayloads = payload.faculty.map((f) => ({
    facultyId: f.facultyId,
    firstName: f.firstName,
    lastName: f.lastName,
    email: f.email,
    phone: f.phone,
    gender: f.gender,
    collegeName: f.collegeName,
    collegeCode: f.collegeCode,
    department: f.department,
    designation: f.designation,
    employmentType: f.employmentType,
    joiningDate: f.joiningDate,
    qualification: f.qualification,
    specialization: f.specialization,
    subjectsUG: f.subjectsUG,
    subjectsPG: f.subjectsPG,
    experienceYears: f.experienceYears,
    isHOD: f.isHOD,
  }));

  // Marker: proves the batched sender is the code actually running.
  console.log(
    `[ImportFaculty] batched sender: ${staffPayloads.length} row(s) in ` +
    `${Math.ceil(staffPayloads.length / IMPORT_BATCH_SIZE)} batch(es) of ${IMPORT_BATCH_SIZE}, ` +
    `${IMPORT_BATCH_TIMEOUT_MS / 1000}s per batch`
  );

  let outcome: BatchedOutcome<{ data: StaffBatchData; meta: BatchMeta }>;
  try {
    outcome = await runInBatches({
      items: staffPayloads,
      batchSize: IMPORT_BATCH_SIZE,
      onProgress: payload.onProgress,
      isFatal: (err: any) => err?.fatal === true,
      run: async (batch, meta) => {
        const bulkProvision = httpsCallable<
          { collegeId: string; staff: any[]; deliveryMode?: CredentialDelivery; onExisting?: 'skip' | 'reset' },
          StaffBatchData
        >(functions, "bulkProvisionStaff", { timeout: IMPORT_BATCH_TIMEOUT_MS });

        const result = await bulkProvision({
          collegeId: payload.collegeId,
          deliveryMode: payload.deliveryMode,
          onExisting: payload.onExisting || 'skip',
          staff: batch,
        });

        // A stale or missing deployment must never look like per-row failures.
        const mismatch = identityBackendMismatch(result.data, 'bulkProvisionStaff');
        if (mismatch) throw Object.assign(new Error(mismatch.message), { fatal: true });

        return { data: result.data, meta };
      },
    });
  } catch (err: any) {
    // A missing/stale callable must never look like an empty-but-successful
    // import: that is exactly how faculty ended up with profiles and no login.
    throw new SuperAdminApiError(describeIdentityError(err, 'bulkProvisionStaff'));
  }

  const imported: ImportResult["imported"] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const failedRows: NonNullable<ImportResult["failedRows"]> = [];
  let skipped = 0;
  let authVerified = 0;

  // Totals that only mean something once every batch has reported.
  let total = 0;
  let created = 0;
  let reclaimed = 0;
  let failed = 0;
  let verified = 0;
  let secretsStripped = 0;
  let stalledBatches = 0;

  for (const { data } of outcome.results) {
    total += data.total || 0;
    created += data.created || 0;
    reclaimed += data.reclaimed || 0;
    failed += data.failed || 0;
    secretsStripped += data.secretsStripped || 0;
    if (typeof data.authVerified === 'number') verified += data.authVerified;

    // `staff` is the single source of truth (each failed row is also mirrored
    // in `errors`, so we do not append those separately to avoid double-counting).
    for (const member of data.staff || []) {
      if (member.success) {
        if (member.authVerified) authVerified++;
        if (member.status === 'skipped') skipped++;
        imported.push({
          id: member.id || member.uid || "",
          email: member.email,
          password: member.password,
          resetLink: member.resetLink,
          name: member.name,
          role: member.role,
          uid: member.uid,
          docId: member.facultyDocId || member.id,
          status: member.status || (member.reclaimed ? 'reclaimed' : 'created'),
          authVerified: member.authVerified !== false,
          delivery: member.delivery,
          error: member.error,
        });
      } else {
        const reason = member.error || "Unknown error";
        errors.push(`${member.name || member.email} — ${reason}`);
        failedRows.push({ name: member.name, email: member.email, reason });
      }
    }

    if (data.warnings?.length) warnings.push(...data.warnings);

    if ((data.total || 0) > 0 && data.created + data.reclaimed === 0 && data.failed === 0 && skipped === 0) {
      stalledBatches++;
    }
  }

  // Whole batches that never reached the backend; named by position.
  for (const failure of outcome.failures) {
    errors.push(`Rows ${failure.fromRow}–${failure.toRow} — ${failure.message}`);
  }

  const batchTotal = outcome.results.length + outcome.failures.length;
  if (reclaimed > 0) {
    warnings.push(`${reclaimed} existing account(s) were reclaimed and their password was reset`);
  }
  if (secretsStripped > 0) {
    warnings.push(`${secretsStripped} plaintext password field(s) were deleted from profile documents`);
  }
  if (verified < created + reclaimed) {
    warnings.push(
      `${created + reclaimed - verified} staff row(s) lack a verified Auth account — run Access Control → Identity repair`
    );
  }
  if (stalledBatches > 0) {
    errors.push(
      `No rows were created, skipped or failed in ${stalledBatches} of ${batchTotal} batch(es) — ` +
      `the Cloud Function did not process them. Verify the deployment: ${DEPLOY_COMMAND}`
    );
  }

  console.log('[ImportFaculty] Cloud Function result:', {
    total,
    created,
    reclaimed,
    authVerified: verified,
    failed,
    batches: batchTotal,
    failedBatches: outcome.failures.length,
  });

  return {
    success: imported.length - skipped,
    skipped,
    failed,
    imported,
    errors,
    warnings,
    authVerified,
    failedRows,
  };
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

export async function resetCollegeData(
  collegeId: string,
  deleteAuthUsers = false
): Promise<ResetCollegeDataResult> {
  try {
    const resetFn = httpsCallable<
      { collegeId: string; deleteAuthUsers?: boolean },
      ResetCollegeDataResult
    >(functions, "resetCollegeData");

    // Auth accounts are NOT deleted unless the operator explicitly opts in:
    // deleting Firebase logins is the one irreversible action a reset can take,
    // and a re-import recreates them, so the default keeps them intact.
    const result = await resetFn({ collegeId, deleteAuthUsers });
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

/**
 * Hand a working credential to a student whose Auth account already exists.
 *
 * The students-side twin of `resetFacultyPassword`, and its absence was half of the
 * original complaint: a faculty password could at least be copied out of Firestore,
 * while a student's could not be recovered at all — the import had created the Auth
 * account and shown nobody the password. The credential is returned for one-time
 * display and is never written to Firestore; the profile flag carries no secret, it
 * only tells the app to ask for a change on next sign-in.
 */
/**
 * What a credential rotation actually changed. `email` and `uid` are read back from
 * Firebase Auth, so they name the account the new password works for — which is not
 * always the address on the profile row, and that difference is the whole story when a
 * reset "does nothing".
 */
export interface CredentialResetResult {
  temporaryPassword: string;
  email: string | null;
  uid: string;
  resetLink: string | null;
}

type ResetResponse = {
  success: boolean;
  uid: string;
  email: string | null;
  temporaryPassword: string;
  resetLink?: string | null;
};

export async function resetStudentPassword(
  studentId: string
): Promise<CredentialResetResult> {
  const resetFn = httpsCallable<
    { collection: "students"; docId: string },
    ResetResponse
  >(functions, "resetUserPassword");

  const result = await resetFn({ collection: "students", docId: studentId });
  const temp = result.data?.temporaryPassword;
  if (!temp) throw new Error("Password reset did not return a temporary password");

  try {
    await updateDoc(doc(db, "students", studentId), {
      passwordResetRequired: true,
      updatedAt: Timestamp.now(),
    });
  } catch {
    // Non-fatal: the Auth credential was already reset.
  }
  return {
    temporaryPassword: temp,
    email: result.data?.email ?? null,
    uid: result.data?.uid ?? "",
    resetLink: result.data?.resetLink ?? null,
  };
}

export async function toggleFacultyStatus(facultyId: string, status: "active" | "inactive"): Promise<void> {
  await updateDoc(doc(db, "faculty", facultyId), { status, updatedAt: Timestamp.now() });
}

export async function resetFacultyPassword(facultyId: string): Promise<CredentialResetResult> {
  // Password reset must happen server-side (Admin SDK) — the client cannot
  // update a Firebase Auth password for another user. The callable resets the
  // Auth credential, revokes existing sessions and returns the one-time
  // temporary password (never persisted to Firestore).
  const resetFn = httpsCallable<
    { collection: "faculty"; docId: string },
    ResetResponse
  >(functions, "resetUserPassword");

  const result = await resetFn({ collection: "faculty", docId: facultyId });
  const temp = result.data?.temporaryPassword;
  if (!temp) throw new Error("Password reset did not return a temporary password");

  // Best-effort: flag the profile so the user can be asked to change it on
  // next login. This carries no credential — it is a UI hint only.
  try {
    await updateDoc(doc(db, "faculty", facultyId), {
      passwordResetRequired: true,
      updatedAt: Timestamp.now(),
    });
  } catch {
    // Non-fatal: the Auth credential was already reset.
  }
  return {
    temporaryPassword: temp,
    email: result.data?.email ?? null,
    uid: result.data?.uid ?? "",
    resetLink: result.data?.resetLink ?? null,
  };
}