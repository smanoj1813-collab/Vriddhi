// ═══════════════════════════════════════════════════════════════════════
// api/curriculumMappingApi.ts — Curriculum Faculty Mapping & Scheduling
// ═══════════════════════════════════════════════════════════════════════

import { db } from "../../../Firebase/config";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, writeBatch,
  DocumentData, QueryDocumentSnapshot, Query,
} from "firebase/firestore";

import type {
  CurriculumFacultyMapping,
  CreateMappingInput,
  UpdateMappingInput,
  MappingFilterOptions,
  FacultyCurriculumView,
} from "../../../../superadmin/types/curriculum";

const MAPPINGS_COLLECTION = "curriculumFacultyMappings";

// ═══════════════════════════════════════════════════════════════════════
// Deep Sanitizer (reused from curriculumApi.ts)
// ═══════════════════════════════════════════════════════════════════════
function deepSanitize<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as T;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize).filter(v => v !== undefined) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = deepSanitize(value);
    }
  }
  return result as T;
}

// ═══════════════════════════════════════════════════════════════════════
// Mapper
// ═══════════════════════════════════════════════════════════════════════
function docToMapping(docSnap: QueryDocumentSnapshot<DocumentData>): CurriculumFacultyMapping {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    curriculumId: data.curriculumId || "",
    collegeId: data.collegeId || "",
    courseId: data.courseId || "",
    courseCode: data.courseCode || "",
    courseName: data.courseName || "",
    facultyId: data.facultyId || "",
    facultyName: data.facultyName || "",
    facultyEmail: data.facultyEmail ?? null,
    branch: data.branch || "",
    semester: data.semester || 0,
    batch: data.batch || "",
    division: data.division ?? null,
    section: data.section ?? null,
    totalHours: data.totalHours || 0,
    credits: data.credits || 0,
    modulesCount: data.modulesCount || 0,
    assignedAt: data.assignedAt?.toDate?.().toISOString() || new Date().toISOString(),
    assignedBy: data.assignedBy || "",
    status: data.status || "active",
  } as CurriculumFacultyMapping;
}

// ═══════════════════════════════════════════════════════════════════════
// CRUD Operations
// ═══════════════════════════════════════════════════════════════════════

export async function createMapping(input: CreateMappingInput): Promise<CurriculumFacultyMapping> {
  const now = Timestamp.now();
  const data = deepSanitize({
    ...input,
    status: 'active',
    assignedAt: now,
  });
  const docRef = await addDoc(collection(db, MAPPINGS_COLLECTION), data);
  return { id: docRef.id, ...data, assignedAt: now.toDate().toISOString() } as CurriculumFacultyMapping;
}

export async function getMappingById(mappingId: string): Promise<CurriculumFacultyMapping | null> {
  try {
    const docRef = doc(db, MAPPINGS_COLLECTION, mappingId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docToMapping(docSnap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error fetching mapping:", error);
    return null;
  }
}

export async function listMappings(options: MappingFilterOptions = {}): Promise<CurriculumFacultyMapping[]> {
  try {
    let q: Query<DocumentData> = query(collection(db, MAPPINGS_COLLECTION), orderBy("assignedAt", "desc"));

    if (options.collegeId) {
      q = query(collection(db, MAPPINGS_COLLECTION), where("collegeId", "==", options.collegeId));
    }
    if (options.curriculumId) {
      q = query(q, where("curriculumId", "==", options.curriculumId));
    }
    if (options.facultyId) {
      q = query(q, where("facultyId", "==", options.facultyId));
    }
    if (options.branch) {
      q = query(q, where("branch", "==", options.branch));
    }
    if (options.semester) {
      q = query(q, where("semester", "==", options.semester));
    }
    if (options.batch) {
      q = query(q, where("batch", "==", options.batch));
    }
    if (options.status && options.status !== 'all') {
      q = query(q, where("status", "==", options.status));
    }

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(docToMapping);

    // Client-side sort if we added filters that break ordering
    if (options.collegeId || options.facultyId) {
      items = items.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    }

    return items;
  } catch (error) {
    console.error("Error fetching mappings:", error);
    return [];
  }
}

export async function updateMapping(mappingId: string, updates: UpdateMappingInput): Promise<CurriculumFacultyMapping> {
  try {
    const docRef = doc(db, MAPPINGS_COLLECTION, mappingId);
    await updateDoc(docRef, deepSanitize({ ...updates, updatedAt: Timestamp.now() }));
    const updated = await getDoc(docRef);
    if (!updated.exists()) throw new Error("Mapping not found after update");
    return docToMapping(updated as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to update mapping");
  }
}

export async function deleteMapping(mappingId: string): Promise<void> {
  try {
    await updateDoc(doc(db, MAPPINGS_COLLECTION, mappingId), deepSanitize({
      status: 'removed',
      updatedAt: Timestamp.now(),
    }));
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to delete mapping");
  }
}

export async function bulkCreateMappings(inputs: CreateMappingInput[]): Promise<CurriculumFacultyMapping[]> {
  const batch = writeBatch(db);
  const mappingsRef = collection(db, MAPPINGS_COLLECTION);
  const now = Timestamp.now();
  const results: CurriculumFacultyMapping[] = [];

  for (const input of inputs) {
    const docRef = doc(mappingsRef);
    const data = deepSanitize({ ...input, status: 'active', assignedAt: now });
    batch.set(docRef, data);
    results.push({ id: docRef.id, ...data, assignedAt: now.toDate().toISOString() } as CurriculumFacultyMapping);
  }

  await batch.commit();
  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// Faculty Curriculum View
// ═══════════════════════════════════════════════════════════════════════

export async function getFacultyCurriculum(facultyId: string): Promise<FacultyCurriculumView[]> {
  try {
    const mappings = await listMappings({ facultyId, status: 'active' });
    const views: FacultyCurriculumView[] = [];

    for (const mapping of mappings) {
      // Fetch curriculum to get modules
      const curriculumRef = doc(db, "curriculum", mapping.curriculumId);
      const curriculumSnap = await getDoc(curriculumRef);
      let modules: any[] = [];
      let curriculumTitle = mapping.courseName;

      if (curriculumSnap.exists()) {
        const curriculumData = curriculumSnap.data();
        curriculumTitle = curriculumData.title || curriculumTitle;
        const course = (curriculumData.courses || []).find((c: any) => c.id === mapping.courseId);
        if (course) {
          modules = course.modules || [];
        }
      }

      views.push({
        mappingId: mapping.id,
        curriculumId: mapping.curriculumId,
        curriculumTitle,
        courseId: mapping.courseId,
        courseCode: mapping.courseCode,
        courseName: mapping.courseName,
        branch: mapping.branch,
        semester: mapping.semester,
        batch: mapping.batch,
        division: mapping.division,
        section: mapping.section,
        totalHours: mapping.totalHours,
        credits: mapping.credits,
        modules,
        assignedAt: mapping.assignedAt,
      });
    }

    return views;
  } catch (error) {
    console.error("Error fetching faculty curriculum:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Stats
// ═══════════════════════════════════════════════════════════════════════

export async function getMappingStats(collegeId: string): Promise<{
  totalMappings: number;
  activeMappings: number;
  facultyCount: number;
  courseCount: number;
  byBranch: Record<string, number>;
  bySemester: Record<string, number>;
}> {
  try {
    const mappings = await listMappings({ collegeId });
    const active = mappings.filter(m => m.status === 'active');
    const facultyIds = new Set(active.map(m => m.facultyId));
    const courseIds = new Set(active.map(m => m.courseId));

    const byBranch: Record<string, number> = {};
    const bySemester: Record<string, number> = {};

    for (const m of active) {
      byBranch[m.branch] = (byBranch[m.branch] || 0) + 1;
      bySemester[String(m.semester)] = (bySemester[String(m.semester)] || 0) + 1;
    }

    return {
      totalMappings: mappings.length,
      activeMappings: active.length,
      facultyCount: facultyIds.size,
      courseCount: courseIds.size,
      byBranch,
      bySemester,
    };
  } catch (error) {
    console.error("Error fetching mapping stats:", error);
    return { totalMappings: 0, activeMappings: 0, facultyCount: 0, courseCount: 0, byBranch: {}, bySemester: {} };
  }
}
