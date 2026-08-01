// src/services/collegeService.ts
// Full Firebase service functions for College, Admin, and Student management

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  increment,
  runTransaction
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  getAuth
} from 'firebase/auth';
import { db } from '../../Firebase/config';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface College {
  id?: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  establishedYear?: number;
  accreditation?: string;
  departments: string[];
  batches: string[];
  divisions: string[];
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  status: 'active' | 'inactive' | 'suspended';
  studentCount: number;
  facultyCount: number;
  adminCount: number;
  settings?: {
    maxStudentsPerBatch: number;
    attendanceThreshold: number;
    gradingSystem: string;
  };
}

export interface CollegeAdmin {
  uid?: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'hod';
  collegeId: string;
  collegeCode: string;
  collegeName: string;
  department?: string;
  designation?: string;
  avatar?: string;
  createdBy: string;
  createdAt?: Timestamp;
  status: 'active' | 'inactive';
  lastLoginAt?: Timestamp;
}

export interface Faculty {
  uid?: string;
  name: string;
  email: string;
  phone: string;
  role: 'faculty' | 'hod' | 'mentor';
  collegeId: string;
  collegeCode: string;
  department: string;
  designation: string;
  subjects: string[];
  mentorBatches?: string[];
  mentorDivisions?: string[];
  avatar?: string;
  createdBy: string;
  createdAt?: Timestamp;
  status: 'active' | 'inactive';
}

export interface Student {
  id?: string;
  regNo: string;
  name: string;
  email: string;
  phone: string;
  collegeId: string;
  collegeCode: string;
  department: string;
  batch: string;
  division: string;
  semester: number;
  mentorId?: string;
  cgpa?: number;
  attendancePercentage?: number;
  dob?: string;
  gender?: string;
  address?: string;
  avatar?: string;
  createdAt?: Timestamp;
  status: 'active' | 'inactive' | 'alumni';
}

export interface StudentCSV {
  reg_no: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  batch: string;
  division: string;
  semester: string;
  dob?: string;
  gender?: string;
  address?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  duplicates: string[];
}

// ═══════════════════════════════════════════════════════════════
// COLLEGE SERVICES
// ═══════════════════════════════════════════════════════════════

export const createCollege = async (
  collegeData: Omit<College, 'id' | 'createdAt' | 'studentCount' | 'facultyCount' | 'adminCount'>,
  superAdminUid: string
): Promise<{ success: boolean; collegeId?: string; error?: string }> => {
  try {
    const codeQuery = query(collection(db, 'colleges'), where('code', '==', collegeData.code));
    const codeSnapshot = await getDocs(codeQuery);
    if (!codeSnapshot.empty) {
      return { success: false, error: `College code "${collegeData.code}" already exists` };
    }
    const collegeRef = doc(collection(db, 'colleges'));
    const college: College = {
      ...collegeData,
      id: collegeRef.id,
      createdBy: superAdminUid,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      studentCount: 0,
      facultyCount: 0,
      adminCount: 0,
      status: 'active'
    };
    await setDoc(collegeRef, college);
    await setDoc(doc(collection(db, 'logs')), {
      action: 'COLLEGE_CREATED',
      collegeId: collegeRef.id,
      collegeCode: collegeData.code,
      performedBy: superAdminUid,
      timestamp: serverTimestamp()
    });
    return { success: true, collegeId: collegeRef.id };
  } catch (error: any) {
    console.error('Error creating college:', error);
    return { success: false, error: error.message };
  }
};

export const getAllColleges = async (): Promise<College[]> => {
  try {
    const q = query(collection(db, 'colleges'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as College));
  } catch (error) {
    console.error('Error fetching colleges:', error);
    return [];
  }
};

export const getCollegeById = async (collegeId: string): Promise<College | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'colleges', collegeId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as College;
    }
    return null;
  } catch (error) {
    console.error('Error fetching college:', error);
    return null;
  }
};

export const updateCollege = async (
  collegeId: string,
  updates: Partial<College>
): Promise<{ success: boolean; error?: string }> => {
  try {
    await updateDoc(doc(db, 'colleges', collegeId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════
// COLLEGE ADMIN SERVICES
// ═══════════════════════════════════════════════════════════════

export const createCollegeAdmin = async (
  adminData: Omit<CollegeAdmin, 'uid' | 'createdAt'>,
  password: string,
  superAdminUid: string
): Promise<{ success: boolean; uid?: string; error?: string }> => {
  try {
    const collegeDoc = await getDoc(doc(db, 'colleges', adminData.collegeId));
    if (!collegeDoc.exists()) {
      return { success: false, error: 'College not found' };
    }
    const college = collegeDoc.data() as College;
    const emailQuery = query(collection(db, 'users'), where('email', '==', adminData.email));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      return { success: false, error: 'Email already registered' };
    }
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, password);
    const uid = userCredential.user.uid;
    await updateProfile(userCredential.user, { displayName: adminData.name });
    const admin: CollegeAdmin = {
      ...adminData,
      uid,
      collegeCode: college.code,
      collegeName: college.name,
      createdBy: superAdminUid,
      createdAt: serverTimestamp() as any,
      status: 'active'
    };
    await setDoc(doc(db, 'users', uid), admin);
    await updateDoc(doc(db, 'colleges', adminData.collegeId), {
      adminCount: increment(1),
      updatedAt: serverTimestamp()
    });
    await setDoc(doc(collection(db, 'logs')), {
      action: 'ADMIN_CREATED',
      userId: uid,
      collegeId: adminData.collegeId,
      performedBy: superAdminUid,
      timestamp: serverTimestamp()
    });
    return { success: true, uid };
  } catch (error: any) {
    console.error('Error creating admin:', error);
    const auth = getAuth();
    if (auth.currentUser) {
      await deleteUser(auth.currentUser).catch(() => {});
    }
    return { success: false, error: error.message };
  }
};

export const getCollegeAdmins = async (collegeId: string): Promise<CollegeAdmin[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('collegeId', '==', collegeId),
      where('role', 'in', ['admin', 'hod']),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as CollegeAdmin));
  } catch (error) {
    console.error('Error fetching college admins:', error);
    return [];
  }
};

export const getCollegeUsers = async (collegeId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('collegeId', '==', collegeId),
      where('status', '==', 'active'),
      orderBy('role'),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching college users:', error);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════
// FACULTY SERVICES
// ═══════════════════════════════════════════════════════════════

export const createFaculty = async (
  facultyData: Omit<Faculty, 'uid' | 'createdAt'>,
  password: string,
  createdByUid: string
): Promise<{ success: boolean; uid?: string; error?: string }> => {
  try {
    const collegeDoc = await getDoc(doc(db, 'colleges', facultyData.collegeId));
    if (!collegeDoc.exists()) {
      return { success: false, error: 'College not found' };
    }
    const college = collegeDoc.data() as College;
    const emailQuery = query(collection(db, 'users'), where('email', '==', facultyData.email));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      return { success: false, error: 'Email already registered' };
    }
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, facultyData.email, password);
    const uid = userCredential.user.uid;
    await updateProfile(userCredential.user, { displayName: facultyData.name });
    const faculty: Faculty = {
      ...facultyData,
      uid,
      collegeCode: college.code,
      createdBy: createdByUid,
      createdAt: serverTimestamp() as any,
      status: 'active'
    };
    await setDoc(doc(db, 'users', uid), faculty);
    await updateDoc(doc(db, 'colleges', facultyData.collegeId), {
      facultyCount: increment(1),
      updatedAt: serverTimestamp()
    });
    return { success: true, uid };
  } catch (error: any) {
    const auth = getAuth();
    if (auth.currentUser) await deleteUser(auth.currentUser).catch(() => {});
    return { success: false, error: error.message };
  }
};

export const getCollegeFaculty = async (collegeId: string): Promise<Faculty[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('collegeId', '==', collegeId),
      where('role', 'in', ['faculty', 'hod', 'mentor']),
      where('status', '==', 'active'),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Faculty));
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return [];
  }
};

export const getAvailableMentors = async (collegeId: string, department?: string): Promise<Faculty[]> => {
  try {
    let q = query(
      collection(db, 'users'),
      where('collegeId', '==', collegeId),
      where('role', 'in', ['mentor', 'hod']),
      where('status', '==', 'active')
    );
    if (department) {
      q = query(q, where('department', '==', department));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Faculty));
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════
// STUDENT SERVICES
// ═══════════════════════════════════════════════════════════════

export const importStudents = async (
  collegeId: string,
  csvData: StudentCSV[],
  defaultMentorId?: string
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    duplicates: []
  };
  try {
    const collegeDoc = await getDoc(doc(db, 'colleges', collegeId));
    if (!collegeDoc.exists()) {
      return { ...result, success: false, errors: ['College not found'] };
    }
    const college = collegeDoc.data() as College;
    const existingQuery = query(collection(db, 'students'), where('collegeId', '==', collegeId));
    const existingSnapshot = await getDocs(existingQuery);
    const existingRegNos = new Set(existingSnapshot.docs.map(d => d.data().regNo));
    const BATCH_SIZE = 500;
    const batches: StudentCSV[][] = [];
    for (let i = 0; i < csvData.length; i += BATCH_SIZE) {
      batches.push(csvData.slice(i, i + BATCH_SIZE));
    }
    for (const batchGroup of batches) {
      const batch = writeBatch(db);
      let batchCount = 0;
      for (const row of batchGroup) {
        if (!row.reg_no || !row.name || !row.email || !row.department || !row.batch || !row.division) {
          result.failed++;
          result.errors.push(`Missing required fields for: ${row.name || 'Unknown'}`);
          continue;
        }
        if (existingRegNos.has(row.reg_no)) {
          result.failed++;
          result.duplicates.push(row.reg_no);
          continue;
        }
        const emailQuery = query(collection(db, 'students'), where('email', '==', row.email));
        const emailSnap = await getDocs(emailQuery);
        if (!emailSnap.empty) {
          result.failed++;
          result.errors.push(`Email ${row.email} already exists`);
          continue;
        }
        const studentRef = doc(collection(db, 'students'));
        const student: Student = {
          id: studentRef.id,
          regNo: row.reg_no,
          name: row.name,
          email: row.email,
          phone: row.phone || '',
          collegeId: collegeId,
          collegeCode: college.code,
          department: row.department,
          batch: row.batch,
          division: row.division,
          semester: parseInt(row.semester) || 1,
          mentorId: defaultMentorId || '',
          dob: row.dob || '',
          gender: row.gender || '',
          address: row.address || '',
          createdAt: serverTimestamp() as any,
          status: 'active'
        };
        batch.set(studentRef, student);
        existingRegNos.add(row.reg_no);
        batchCount++;
      }
      if (batchCount > 0) {
        await batch.commit();
        result.imported += batchCount;
      }
    }
    if (result.imported > 0) {
      await updateDoc(doc(db, 'colleges', collegeId), {
        studentCount: increment(result.imported),
        updatedAt: serverTimestamp()
      });
    }
    result.success = result.failed === 0;
    return result;
  } catch (error: any) {
    console.error('Error importing students:', error);
    return { ...result, success: false, errors: [...result.errors, error.message] };
  }
};

export const getCollegeStudents = async (
  collegeId: string,
  lastDoc?: DocumentSnapshot,
  pageSize: number = 50
): Promise<{ students: Student[]; lastDoc: DocumentSnapshot | null }> => {
  try {
    let q = query(
      collection(db, 'students'),
      where('collegeId', '==', collegeId),
      orderBy('regNo'),
      limit(pageSize)
    );
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    const snapshot = await getDocs(q);
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    return { students, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error fetching students:', error);
    return { students: [], lastDoc: null };
  }
};

export const getStudentsByDepartment = async (collegeId: string, department: string): Promise<Student[]> => {
  try {
    const q = query(
      collection(db, 'students'),
      where('collegeId', '==', collegeId),
      where('department', '==', department),
      orderBy('regNo')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
  } catch (error) {
    console.error('Error fetching students by department:', error);
    return [];
  }
};

export const getStudentsByBatch = async (collegeId: string, batch: string): Promise<Student[]> => {
  try {
    const q = query(
      collection(db, 'students'),
      where('collegeId', '==', collegeId),
      where('batch', '==', batch),
      orderBy('division'),
      orderBy('regNo')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
  } catch (error) {
    console.error('Error fetching students by batch:', error);
    return [];
  }
};

export const getStudentsByMentor = async (mentorId: string): Promise<Student[]> => {
  try {
    const q = query(collection(db, 'students'), where('mentorId', '==', mentorId), orderBy('regNo'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
  } catch (error) {
    console.error('Error fetching mentor students:', error);
    return [];
  }
};

export const assignMentorToStudents = async (
  studentIds: string[],
  mentorId: string,
  performedBy: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const batch = writeBatch(db);
    for (const studentId of studentIds) {
      batch.update(doc(db, 'students', studentId), {
        mentorId: mentorId,
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();
    await setDoc(doc(collection(db, 'logs')), {
      action: 'MENTOR_ASSIGNED',
      studentIds,
      mentorId,
      performedBy,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getStudentByRegNo = async (collegeId: string, regNo: string): Promise<Student | null> => {
  try {
    const q = query(
      collection(db, 'students'),
      where('collegeId', '==', collegeId),
      where('regNo', '==', regNo),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Student;
    }
    return null;
  } catch (error) {
    console.error('Error fetching student:', error);
    return null;
  }
};

export const updateStudent = async (
  studentId: string,
  updates: Partial<Student>
): Promise<{ success: boolean; error?: string }> => {
  try {
    await updateDoc(doc(db, 'students', studentId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD / ANALYTICS SERVICES
// ═══════════════════════════════════════════════════════════════

export const getCollegeStats = async (collegeId: string) => {
  try {
    const collegeDoc = await getDoc(doc(db, 'colleges', collegeId));
    if (!collegeDoc.exists()) return null;
    const college = collegeDoc.data() as College;
    const studentsQuery = query(collection(db, 'students'), where('collegeId', '==', collegeId));
    const studentsSnap = await getDocs(studentsQuery);
    const deptCounts: Record<string, number> = {};
    const batchCounts: Record<string, number> = {};
    const divisionCounts: Record<string, number> = {};
    studentsSnap.docs.forEach(doc => {
      const s = doc.data() as Student;
      deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
      batchCounts[s.batch] = (batchCounts[s.batch] || 0) + 1;
      divisionCounts[s.division] = (divisionCounts[s.division] || 0) + 1;
    });
    return {
      totalStudents: college.studentCount,
      totalFaculty: college.facultyCount,
      totalAdmins: college.adminCount,
      departmentWise: deptCounts,
      batchWise: batchCounts,
      divisionWise: divisionCounts,
      status: college.status
    };
  } catch (error) {
    console.error('Error fetching college stats:', error);
    return null;
  }
};

export const getSuperAdminStats = async () => {
  try {
    const collegesSnap = await getDocs(collection(db, 'colleges'));
    const usersSnap = await getDocs(collection(db, 'users'));
    const studentsSnap = await getDocs(collection(db, 'students'));
    return {
      totalColleges: collegesSnap.size,
      totalUsers: usersSnap.size,
      totalStudents: studentsSnap.size,
      activeColleges: collegesSnap.docs.filter(d => d.data().status === 'active').length,
      colleges: collegesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    };
  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    return null;
  }
};

export default {
  createCollege,
  getAllColleges,
  getCollegeById,
  updateCollege,
  createCollegeAdmin,
  getCollegeAdmins,
  getCollegeUsers,
  createFaculty,
  getCollegeFaculty,
  getAvailableMentors,
  importStudents,
  getCollegeStudents,
  getStudentsByDepartment,
  getStudentsByBatch,
  getStudentsByMentor,
  assignMentorToStudents,
  getStudentByRegNo,
  updateStudent,
  getCollegeStats,
  getSuperAdminStats
};
