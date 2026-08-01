// ═══════════════════════════════════════════════════════════════════════
// api/curriculumApi.ts — COMBINED: Legacy Curriculum + Syllabus Parser
// FIXED: All TS strict-null errors resolved
// ═══════════════════════════════════════════════════════════════════════

import { db } from '../../../Firebase/config';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, Timestamp, writeBatch,
  DocumentData, QueryDocumentSnapshot, Query,
} from "firebase/firestore";

import type {
  SyllabusExtract, ParsedCourse, ParsedModule, CurriculumDoc,
  ListSyllabusOptions, ListCurriculumOptions, AssignCurriculumInput,
  CurriculumStats, ParseConfidence, CurriculumStatus,
} from "../types/curriculum";

// ═══════════════════════════════════════════════════════════════════════
// LEGACY: Curriculum & Topics (for Question Bank)
// ═══════════════════════════════════════════════════════════════════════

export interface Curriculum {
  id: string;
  course: string;
  semester: number;
  subjects: string[];
  uploadedAt: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface Topic {
  id: string;
  name: string;
  subject: string;
  course: string;
  semester: number;
  questionCount?: number;
  status: 'active' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchCurriculum(): Promise<Curriculum[]> {
  try {
    const snapshot = await getDocs(collection(db, "curriculum"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Curriculum));
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    return [];
  }
}

export async function fetchTopics(): Promise<Topic[]> {
  try {
    const snapshot = await getDocs(collection(db, "topics"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
  } catch (error) {
    console.error("Error fetching topics:", error);
    return [];
  }
}

export async function fetchCurriculumByCourseSemester(course: string, semester: number): Promise<Curriculum | null> {
  try {
    const q = query(collection(db, "curriculum"), where("course", "==", course), where("semester", "==", semester));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Curriculum;
  } catch (error) {
    console.error("Error fetching curriculum by course/semester:", error);
    return null;
  }
}

export async function createCurriculum(data: Omit<Curriculum, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "curriculum"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateCurriculumSubjects(curriculumId: string, subjects: string[]): Promise<void> {
  await updateDoc(doc(db, "curriculum", curriculumId), { subjects, updatedAt: Timestamp.now() });
}

export async function createTopic(data: Omit<Topic, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "topics"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateTopic(topicId: string, data: Partial<Topic>): Promise<void> {
  await updateDoc(doc(db, "topics", topicId), { ...data, updatedAt: Timestamp.now() });
}

export async function archiveTopic(topicId: string): Promise<void> {
  await updateDoc(doc(db, "topics", topicId), { status: 'archived', updatedAt: Timestamp.now() });
}

export async function restoreTopic(topicId: string): Promise<void> {
  await updateDoc(doc(db, "topics", topicId), { status: 'active', updatedAt: Timestamp.now() });
}

// ═══════════════════════════════════════════════════════════════════════
// DEEP SANITIZER
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
// Mappers
// ═══════════════════════════════════════════════════════════════════════
function docToSyllabusExtract(docSnap: QueryDocumentSnapshot<DocumentData>): SyllabusExtract {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    fileName: data.fileName || "",
    fileUrl: data.fileUrl || "",
    fileSize: data.fileSize || 0,
    format: data.format || "docx",
    extractedBy: data.extractedBy || "",
    extractedByName: data.extractedByName ?? null,
    extractedAt: data.extractedAt?.toDate?.().toISOString() || new Date().toISOString(),
    status: data.status || "review",
    collegeId: data.collegeId ?? null,
    collegeName: data.collegeName ?? null,
    courses: (data.courses || []).map((c: any) => ({
      ...c,
      extractedAt: c.extractedAt || data.extractedAt?.toDate?.().toISOString() || new Date().toISOString(),
    })),
    totalCourses: data.totalCourses || 0,
    totalModules: data.totalModules || 0,
    totalHours: data.totalHours || 0,
    totalMarks: data.totalMarks || 0,
    averageConfidence: data.averageConfidence || "low",
    confidenceScore: data.confidenceScore || 0,
    reviewNotes: data.reviewNotes ?? null,
    reviewedBy: data.reviewedBy ?? null,
    reviewedAt: data.reviewedAt?.toDate?.().toISOString() ?? null,
    assignedAt: data.assignedAt?.toDate?.().toISOString() ?? null,
    assignedBy: data.assignedBy ?? null,
  } as SyllabusExtract;
}

function docToCurriculumDoc(docSnap: QueryDocumentSnapshot<DocumentData>): CurriculumDoc {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    collegeId: data.collegeId || "",
    collegeName: data.collegeName || "",
    syllabusExtractId: data.syllabusExtractId || "",
    title: data.title || "",
    description: data.description ?? null,
    scheme: data.scheme || "",
    branch: data.branch || "",
    semester: data.semester || 0,
    courses: data.courses || [],
    totalCourses: data.totalCourses || 0,
    totalModules: data.totalModules || 0,
    totalHours: data.totalHours || 0,
    totalMarks: data.totalMarks || 0,
    status: data.status || "active",
    createdBy: data.createdBy || "",
    createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? null,
    assignedBy: data.assignedBy || "",
    assignedAt: data.assignedAt?.toDate?.().toISOString() || new Date().toISOString(),
  } as CurriculumDoc;
}

// ═══════════════════════════════════════════════════════════════════════
// Syllabus Extract CRUD
// ═══════════════════════════════════════════════════════════════════════

export async function createSyllabusExtract(extract: Omit<SyllabusExtract, "id">): Promise<SyllabusExtract> {
  const now = Timestamp.now();
  const extractData = deepSanitize({
    ...extract,
    status: extract.status || "review",
    extractedAt: now,
  });
  const docRef = await addDoc(collection(db, "syllabusExtracts"), extractData);
  return { id: docRef.id, ...extractData, extractedAt: now.toDate().toISOString() } as SyllabusExtract;
}

export async function listSyllabusExtracts(options: ListSyllabusOptions = {}): Promise<{
  items: SyllabusExtract[]; total: number; hasMore: boolean;
}> {
  try {
    let q: Query<DocumentData>;
    if (options.status && options.status !== "all") {
      q = query(collection(db, "syllabusExtracts"), where("status", "==", options.status));
    } else {
      q = query(collection(db, "syllabusExtracts"), orderBy("extractedAt", "desc"));
    }
    if (options.collegeId) q = query(q, where("collegeId", "==", options.collegeId));
    const limitCount = options.limit || 50;
    q = query(q, limit(limitCount));
    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(docToSyllabusExtract);
    if (options.status && options.status !== "all") {
      items = items.sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime());
    }
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      items = items.filter(e =>
        e.fileName.toLowerCase().includes(searchLower) ||
        e.courses.some(c => c.name.toLowerCase().includes(searchLower) || c.code.toLowerCase().includes(searchLower))
      );
    }
    if (options.format && options.format !== "all") items = items.filter(e => e.format === options.format);
    return { items, total: items.length, hasMore: snapshot.docs.length === limitCount };
  } catch (error) {
    console.error("Error fetching syllabus extracts:", error);
    return { items: [], total: 0, hasMore: false };
  }
}

export async function getSyllabusExtractById(extractId: string): Promise<SyllabusExtract | null> {
  try {
    const docRef = doc(db, "syllabusExtracts", extractId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docToSyllabusExtract(docSnap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error fetching syllabus extract:", error);
    return null;
  }
}

export async function updateSyllabusExtract(extractId: string, updates: Partial<SyllabusExtract>): Promise<SyllabusExtract> {
  try {
    const docRef = doc(db, "syllabusExtracts", extractId);
    await updateDoc(docRef, deepSanitize({ ...updates, updatedAt: Timestamp.now() }));
    const updated = await getDoc(docRef);
    if (!updated.exists()) throw new Error("Syllabus extract not found after update");
    return docToSyllabusExtract(updated as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to update syllabus extract");
  }
}

export async function updateSyllabusExtractCourses(extractId: string, courses: ParsedCourse[]): Promise<void> {
  const totalModules = courses.reduce((sum, c) => sum + c.modules.length, 0);
  const totalHours = courses.reduce((sum, c) => sum + c.totalHours, 0);
  const totalMarks = courses.reduce((sum, c) => sum + c.totalMarks, 0);
  const confidenceScores = courses.map(c => c.confidence === "high" ? 85 : c.confidence === "medium" ? 60 : 30);
  const avgScore = confidenceScores.length > 0 ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length) : 0;
  const overallConfidence: ParseConfidence = avgScore >= 70 ? "high" : avgScore >= 40 ? "medium" : "low";
  await updateDoc(doc(db, "syllabusExtracts", extractId), deepSanitize({
    courses, totalCourses: courses.length, totalModules, totalHours, totalMarks,
    averageConfidence: overallConfidence, confidenceScore: avgScore, updatedAt: Timestamp.now(),
  }));
}

export async function updateSyllabusExtractStatus(extractId: string, status: CurriculumStatus): Promise<void> {
  await updateDoc(doc(db, "syllabusExtracts", extractId), deepSanitize({ status, updatedAt: Timestamp.now() }));
}

export async function deleteSyllabusExtract(extractId: string): Promise<void> {
  try { await deleteDoc(doc(db, "syllabusExtracts", extractId)); }
  catch (error) { throw new Error(error instanceof Error ? error.message : "Failed to delete"); }
}

export async function updateExtractCourse(extractId: string, input: { courseId: string; updates: Partial<ParsedCourse> }): Promise<void> {
  const extract = await getSyllabusExtractById(extractId);
  if (!extract) throw new Error("Syllabus extract not found");
  const updatedCourses = extract.courses.map(c => c.id === input.courseId ? { ...c, ...input.updates, isEdited: true } : c);
  await updateSyllabusExtractCourses(extractId, updatedCourses);
}

export async function updateExtractModule(extractId: string, input: { courseId: string; moduleId: string; updates: Partial<ParsedModule> }): Promise<void> {
  const extract = await getSyllabusExtractById(extractId);
  if (!extract) throw new Error("Syllabus extract not found");
  const updatedCourses = extract.courses.map(c => {
    if (c.id !== input.courseId) return c;
    return { ...c, modules: c.modules.map(m => m.id === input.moduleId ? { ...m, ...input.updates, isEdited: true } : m), isEdited: true };
  });
  await updateSyllabusExtractCourses(extractId, updatedCourses);
}

export async function createCurriculumDoc(curriculum: Omit<CurriculumDoc, "id">): Promise<CurriculumDoc> {
  const now = Timestamp.now();
  const curriculumData = deepSanitize({ ...curriculum, status: curriculum.status || "active", createdAt: now, updatedAt: now });
  const docRef = await addDoc(collection(db, "curriculum"), curriculumData);
  return { id: docRef.id, ...curriculumData, createdAt: now.toDate().toISOString(), updatedAt: now.toDate().toISOString() } as CurriculumDoc;
}

export async function listCurriculumDocs(options: ListCurriculumOptions = {}): Promise<{
  items: CurriculumDoc[]; total: number; hasMore: boolean;
}> {
  try {
    let q: Query<DocumentData>;
    if (options.collegeId) {
      q = query(collection(db, "curriculum"), where("collegeId", "==", options.collegeId));
    } else {
      q = query(collection(db, "curriculum"), orderBy("createdAt", "desc"));
    }
    if (options.status && options.status !== "all") q = query(q, where("status", "==", options.status));
    const limitCount = options.limit || 50;
    q = query(q, limit(limitCount));
    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(docToCurriculumDoc);
    if (options.collegeId) {
      items = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (options.branch) items = items.filter(c => c.branch === options.branch);
    if (options.semester) items = items.filter(c => c.semester === options.semester);
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      items = items.filter(c => c.title.toLowerCase().includes(searchLower) || c.branch.toLowerCase().includes(searchLower));
    }
    return { items, total: items.length, hasMore: snapshot.docs.length === limitCount };
  } catch (error) {
    console.error("Error fetching curriculum docs:", error);
    return { items: [], total: 0, hasMore: false };
  }
}

export async function getCurriculumById(curriculumId: string): Promise<CurriculumDoc | null> {
  try {
    const docRef = doc(db, "curriculum", curriculumId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docToCurriculumDoc(docSnap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    return null;
  }
}

export async function getCurriculumByCollegeId(collegeId: string): Promise<CurriculumDoc[]> {
  try {
    const q = query(collection(db, "curriculum"), where("collegeId", "==", collegeId), where("status", "==", "active"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToCurriculumDoc);
  } catch (error) {
    console.error("Error fetching curriculum by college:", error);
    return [];
  }
}

export async function updateCurriculumDoc(curriculumId: string, updates: Partial<CurriculumDoc>): Promise<CurriculumDoc> {
  try {
    const docRef = doc(db, "curriculum", curriculumId);
    await updateDoc(docRef, deepSanitize({ ...updates, updatedAt: Timestamp.now() }));
    const updated = await getDoc(docRef);
    if (!updated.exists()) throw new Error("Curriculum not found after update");
    return docToCurriculumDoc(updated as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to update curriculum");
  }
}

export async function deleteCurriculumDoc(curriculumId: string): Promise<void> {
  try { await deleteDoc(doc(db, "curriculum", curriculumId)); }
  catch (error) { throw new Error(error instanceof Error ? error.message : "Failed to delete curriculum"); }
}

export async function assignCurriculumToCollege(input: AssignCurriculumInput): Promise<CurriculumDoc> {
  const extract = await getSyllabusExtractById(input.syllabusExtractId);
  if (!extract) throw new Error("Syllabus extract not found");
  const now = Timestamp.now();
  const selectedCourses = input.selectedCourseIds ? extract.courses.filter(c => input.selectedCourseIds?.includes(c.id)) : extract.courses;
  if (selectedCourses.length === 0) throw new Error("No courses selected for assignment");
  const totalModules = selectedCourses.reduce((sum, c) => sum + c.modules.length, 0);
  const totalHours = selectedCourses.reduce((sum, c) => sum + c.totalHours, 0);
  const totalMarks = selectedCourses.reduce((sum, c) => sum + c.totalMarks, 0);
  const firstCourse = selectedCourses[0];
  const curriculumData = deepSanitize({
    collegeId: input.collegeId, collegeName: input.collegeName, syllabusExtractId: input.syllabusExtractId,
    title: `${firstCourse.branch || "Curriculum"} - Semester ${firstCourse.semester || ""}`,
    description: input.reviewNotes ?? null, scheme: firstCourse.scheme || "", branch: firstCourse.branch || "",
    semester: firstCourse.semester || 0, courses: selectedCourses, totalCourses: selectedCourses.length,
    totalModules, totalHours, totalMarks, status: "active" as const, createdBy: extract.extractedBy,
    assignedBy: extract.extractedBy, assignedAt: now,
  });
  const docRef = await addDoc(collection(db, "curriculum"), curriculumData);
  await updateDoc(doc(db, "syllabusExtracts", input.syllabusExtractId), deepSanitize({
    status: "assigned", collegeId: input.collegeId, collegeName: input.collegeName,
    assignedAt: now, assignedBy: extract.extractedBy, reviewNotes: input.reviewNotes ?? null, updatedAt: now,
  }));
  return { id: docRef.id, ...curriculumData, createdAt: now.toDate().toISOString(), updatedAt: now.toDate().toISOString(), assignedAt: now.toDate().toISOString() } as CurriculumDoc;
}

export async function getCurriculumStats(): Promise<CurriculumStats> {
  try {
    const extractsSnap = await getDocs(collection(db, "syllabusExtracts"));
    const extracts = extractsSnap.docs.map(docToSyllabusExtract);
    const byFormat: Record<string, number> = { docx: 0, pdf: 0, txt: 0 };
    const byStatus: Record<string, number> = { parsing: 0, review: 0, approved: 0, assigned: 0, archived: 0 };
    let totalCourses = 0, totalModules = 0, confidenceSum = 0;
    for (const e of extracts) {
      byFormat[e.format] = (byFormat[e.format] || 0) + 1;
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      totalCourses += e.totalCourses; totalModules += e.totalModules; confidenceSum += e.confidenceScore;
    }
    return {
      totalExtracts: extracts.length, pendingReview: byStatus.review, approved: byStatus.approved,
      assigned: byStatus.assigned, totalCourses, totalModules,
      averageConfidence: extracts.length > 0 ? Math.round(confidenceSum / extracts.length) : 0,
      byFormat, byStatus,
    };
  } catch (error) {
    console.error("Error fetching curriculum stats:", error);
    return { totalExtracts: 0, pendingReview: 0, approved: 0, assigned: 0, totalCourses: 0, totalModules: 0, averageConfidence: 0, byFormat: { docx: 0, pdf: 0, txt: 0 }, byStatus: { parsing: 0, review: 0, approved: 0, assigned: 0, archived: 0 } };
  }
}
