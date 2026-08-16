// src/scripts/seedFaculty.ts
// ============================================================
// Faculty Seed + Mentor Linking Script
// Creates 3 faculty docs + links students by mentor name
// ============================================================

import { collection, doc, setDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../Firebase/config';
import { createFirebaseAuthUser } from '../modules/superadmin/api/superAdminApi';

/** Faculty onboarding data derived from student CSV + faculty CSV */
const FACULTY_SEED = [
  {
    facultyId: 'FAC001',
    firstName: 'Jayashree',
    lastName: 'G',
    email: 'jayashree199528@gmail.com',
    phone: '8088230042',
    gender: 'Female',
    collegeCode: 'VA-001',
    collegeId: 'NhARLOkWJof1JbnLGijV',
    department: 'Commerce',
    designation: 'Assistant Professor',
    employmentType: 'Full Time',
    joiningDate: '15-06-2020',
    qualification: 'M.Com',
    specialization: 'UGC-NET',
    subjectsUG: ['Financial Accounting'],
    subjectsPG: ['BCom101', 'BCom102'],
    experienceYears: 5,
    isHOD: false,
    status: 'active',
    mentorNameMatch: ['Jayashree g', 'Jayashree G'],
  },
  {
    facultyId: 'FAC002',
    firstName: 'Supreeth',
    lastName: '',
    email: 'supreethi@vriddhi.com',
    phone: '',
    gender: '',
    collegeCode: 'VA-001',
    collegeId: 'NhARLOkWJof1JbnLGijV',
    department: '',
    designation: 'Assistant Professor',
    employmentType: 'Full Time',
    joiningDate: '',
    qualification: '',
    specialization: '',
    subjectsUG: [],
    subjectsPG: [],
    experienceYears: 0,
    isHOD: false,
    status: 'active',
    mentorNameMatch: ['Supreeth'],
  },
  {
    facultyId: 'FAC003',
    firstName: 'Gangadhar',
    lastName: '',
    email: 'gangadhar@vriddhi.com',
    phone: '',
    gender: '',
    collegeCode: 'VA-001',
    collegeId: 'NhARLOkWJof1JbnLGijV',
    department: '',
    designation: 'Assistant Professor',
    employmentType: 'Full Time',
    joiningDate: '',
    qualification: '',
    specialization: '',
    subjectsUG: [],
    subjectsPG: [],
    experienceYears: 0,
    isHOD: false,
    status: 'active',
    mentorNameMatch: ['Gangandhar', 'Gangadhar'],
  },
];

/** Create faculty docs in Firestore */
export async function seedFaculty(): Promise<{
  success: boolean;
  created: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let created = 0;

  for (const f of FACULTY_SEED) {
    try {
      const docId = f.facultyId;
      await setDoc(doc(db, 'faculty', docId), {
        ...f,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      created++;
      console.log(`[SeedFaculty] Created ${docId}: ${f.firstName} ${f.lastName}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      errors.push(`${f.facultyId}: ${msg}`);
    }
  }

  return { success: errors.length === 0, created, errors };
}

/** Link students to faculty by mentor name */
export async function linkStudentsToFaculty(
  collegeId: string
): Promise<{
  success: boolean;
  linked: number;
  skipped: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let linked = 0;
  let skipped = 0;

  // Build name → facultyId map
  const nameToFacultyId: Record<string, string> = {};
  FACULTY_SEED.forEach((f) => {
    f.mentorNameMatch.forEach((name) => {
      nameToFacultyId[name.toLowerCase().trim()] = f.facultyId;
    });
  });

  console.log('[Link] Name map:', nameToFacultyId);

  // Query all students in the college
  const studentsCol = collection(db, 'colleges', collegeId, 'students');
  const snap = await getDocs(studentsCol);

  // Group updates by batch
  const updates: Array<{
    ref: ReturnType<typeof doc>;
    facultyId: string;
    mentorName: string;
    department: string;
    division: string;
  }> = [];

  for (const d of snap.docs) {
    const data = d.data();
    const mentorName = (data.mentorName || '').toLowerCase().trim();
    const facultyId = nameToFacultyId[mentorName];

    if (!facultyId) {
      skipped++;
      console.warn(`[Link] No faculty match for mentor: "${data.mentorName}"`);
      continue;
    }

    updates.push({
      ref: d.ref,
      facultyId,
      mentorName: data.mentorName,
      department: data.department || '',
      division: data.division || '',
    });
  }

  // Batch update (400 per batch)
  for (let i = 0; i < updates.length; i += 400) {
    const batch = writeBatch(db);
    updates.slice(i, i + 400).forEach((u) => {
      batch.update(u.ref, {
        facultyId: u.facultyId,
        mentorId: u.facultyId,
        // Legacy fields for existing faculty API compat
        mentor: u.mentorName,
        branch: u.department,
        section: u.division,
      });
    });
    await batch.commit();
    linked += Math.min(400, updates.length - i);
  }

  return { success: errors.length === 0, linked, skipped, errors };
}

/** One-shot: seed faculty + create auth accounts + link students */
export async function onboardFacultyAndLinkStudents(
  collegeId: string,
  opts: { createAuthAccounts?: boolean } = {}
): Promise<{
  facultyCreated: number;
  authAccounts: number;
  studentsLinked: number;
  errors: string[];
}> {
  const errors: string[] = [];

  // 1. Seed faculty docs
  const seedResult = await seedFaculty();
  errors.push(...seedResult.errors);

  // 2. Create auth accounts (optional)
  let authAccounts = 0;
  if (opts.createAuthAccounts) {
    for (const f of FACULTY_SEED) {
      try {
        const tempPwd = Math.random().toString(36).slice(2, 14) + 'A1!';
        const uid = await createFirebaseAuthUser(f.email, tempPwd);
        await updateDoc(doc(db, 'faculty', f.facultyId), {
          uid,
          passwordResetRequired: true,
        });
        // Create users doc for login
        await setDoc(doc(db, 'users', uid), {
          uid,
          email: f.email,
          name: `${f.firstName} ${f.lastName}`.trim(),
          role: 'faculty',
          collegeId: f.collegeId,
          department: f.department,
          createdAt: new Date().toISOString(),
        });
        authAccounts++;
        console.log(`[Auth] Created account for ${f.email}`);
      } catch (err) {
        errors.push(`Auth ${f.facultyId}: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }
  }

  // 3. Link students
  const linkResult = await linkStudentsToFaculty(collegeId);
  errors.push(...linkResult.errors);

  return {
    facultyCreated: seedResult.created,
    authAccounts,
    studentsLinked: linkResult.linked,
    errors,
  };
}