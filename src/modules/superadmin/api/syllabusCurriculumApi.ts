// ═══════════════════════════════════════════════════════════════════════
// api/syllabusCurriculumApi.ts — Firestore CRUD (deepSanitized)
// ═══════════════════════════════════════════════════════════════════════

import { db } from '@/Firebase/config';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, Timestamp, Query, QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";

import type {
  SyllabusExtract, ParsedCourse, ParsedModule, CurriculumDoc,
  ListSyllabusOptions, ListCurriculumOptions, AssignCurriculumInput,
  CurriculumStats, ParseConfidence, CurriculumStatus,
} from '../types/curriculum';

function deepSanitize<T>(obj: T): T {
  if (obj === undefined) return null as unknown as T;
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if (obj instanceof Timestamp) return obj;
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize) as unknown as T;
  }
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = deepSanitize(value);
    }
  }
  return sanitized as T;
}

function docToSyllabusExtract(docSnap: QueryDocumentSnapshot<DocumentData>): SyllabusExtract {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    fileName: data.fileName || "",
    fileUrl: data.fileUrl ?? null,
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
      shortName: c.shortName ?? null,
      scheme: c.scheme ?? null,
      internalMarks: c.internalMarks ?? null,
      externalMarks: c.externalMarks ?? null,
      isEdited: c.isEdited ?? false,
      modules: (c.modules || []).map((m: any) => ({
        ...m,
        description: m.description ?? null,
        learningOutcomes: m.learningOutcomes ?? null,
        isEdited: m.isEdited ?? false,
      })),
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

export async function createSyllabusExtract(
  extract: Omit<SyllabusExtract, "id">
): Promise<SyllabusExtract> {
  const now = Timestamp.now();
  const extractData = deepSanitize({
    ...extract,
    status: extract.status || "review",
    extractedAt: now,
    fileUrl: extract.fileUrl ?? null,
    collegeId: extract.collegeId ?? null,
    collegeName: extract.collegeName ?? null,
    reviewNotes: extract.reviewNotes ?? null,
    reviewedBy: extract.reviewedBy ?? null,
    reviewedAt: extract.reviewedAt ?? null,
    assignedAt: extract.assignedAt ?? null,
    assignedBy: extract.assignedBy ?? null,
    courses: extract.courses.map((c) =>
      deepSanitize({
        ...c,
        shortName: c.shortName ?? null,
        scheme: c.scheme ?? null,
        internalMarks: c.internalMarks ?? null,
        externalMarks: c.externalMarks ?? null,
        isEdited: c.isEdited ?? false,
        modules: c.modules.map((m) =>
          deepSanitize({
            ...m,
            description: m.description ?? null,
            learningOutcomes: m.learningOutcomes ?? null,
            isEdited: m.isEdited ?? false,
          })
        ),
      })
    ),
  });

  const docRef = await addDoc(collection(db, "syllabusExtracts"), extractData);
  return { id: docRef.id, ...extractData, extractedAt: now.toDate().toISOString() } as SyllabusExtract;
}

export async function listSyllabusExtracts(options: ListSyllabusOptions = {}): Promise<{
  items: SyllabusExtract[];
  total: number;
  hasMore: boolean;
}> {
  try {
    let q: Query<DocumentData>;
    if (options.status && options.status !== "all") {
      q = query(
        collection(db, "syllabusExtracts"),
        where("status", "==", options.status),
        orderBy("extractedAt", "desc"),
        limit(options.limit || 50)
      );
    } else {
      q = query(
        collection(db, "syllabusExtracts"),
        orderBy("extractedAt", "desc"),
        limit(options.limit || 50)
      );
    }
    if (options.collegeId) {
      q = query(q, where("collegeId", "==", options.collegeId));
    }
    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(docToSyllabusExtract);
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      items = items.filter(
        (e) =>
          e.fileName.toLowerCase().includes(searchLower) ||
          e.courses.some(
            (c) =>
              c.name.toLowerCase().includes(searchLower) ||
              c.code.toLowerCase().includes(searchLower)
          )
      );
    }
    if (options.format && options.format !== "all") {
      items = items.filter((e) => e.format === options.format);
    }
    return { items, total: items.length, hasMore: snapshot.docs.length === (options.limit || 50) };
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

export async function updateSyllabusExtract(
  extractId: string,
  updates: Partial<SyllabusExtract>
): Promise<SyllabusExtract> {
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
  const confidenceScores = courses.map((c) =>
    c.confidence === "high" ? 85 : c.confidence === "medium" ? 60 : 30
  );
  const avgScore =
    confidenceScores.length > 0
      ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
      : 0;
  const overallConfidence: ParseConfidence = avgScore >= 70 ? "high" : avgScore >= 40 ? "medium" : "low";

  await updateDoc(
    doc(db, "syllabusExtracts", extractId),
    deepSanitize({
      courses,
      totalCourses: courses.length,
      totalModules,
      totalHours,
      totalMarks,
      averageConfidence: overallConfidence,
      confidenceScore: avgScore,
      updatedAt: Timestamp.now(),
    })
  );
}

export async function updateSyllabusExtractStatus(extractId: string, status: CurriculumStatus): Promise<void> {
  await updateDoc(doc(db, "syllabusExtracts", extractId), { status, updatedAt: Timestamp.now() });
}

export async function deleteSyllabusExtract(extractId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "syllabusExtracts", extractId));
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to delete");
  }
}

export async function updateExtractCourse(
  extractId: string,
  input: { courseId: string; updates: Partial<ParsedCourse> }
): Promise<void> {
  const extract = await getSyllabusExtractById(extractId);
  if (!extract) throw new Error("Syllabus extract not found");
  const updatedCourses = extract.courses.map((c) =>
    c.id === input.courseId ? { ...c, ...input.updates, isEdited: true } : c
  );
  await updateSyllabusExtractCourses(extractId, updatedCourses);
}

export async function updateExtractModule(
  extractId: string,
  input: { courseId: string; moduleId: string; updates: Partial<ParsedModule> }
): Promise<void> {
  const extract = await getSyllabusExtractById(extractId);
  if (!extract) throw new Error("Syllabus extract not found");
  const updatedCourses = extract.courses.map((c) => {
    if (c.id !== input.courseId) return c;
    return {
      ...c,
      modules: c.modules.map((m) =>
        m.id === input.moduleId ? { ...m, ...input.updates, isEdited: true } : m
      ),
      isEdited: true,
    };
  });
  await updateSyllabusExtractCourses(extractId, updatedCourses);
}

export async function createCurriculumDoc(curriculum: Omit<CurriculumDoc, "id">): Promise<CurriculumDoc> {
  const now = Timestamp.now();
  const curriculumData = deepSanitize({
    ...curriculum,
    status: curriculum.status || "active",
    createdAt: now,
    updatedAt: now,
    description: curriculum.description ?? null,
  });
  const docRef = await addDoc(collection(db, "curriculum"), curriculumData);
  return {
    id: docRef.id,
    ...curriculumData,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  } as CurriculumDoc;
}

export async function listCurriculumDocs(options: ListCurriculumOptions = {}): Promise<{
  items: CurriculumDoc[];
  total: number;
  hasMore: boolean;
}> {
  try {
    let q: Query<DocumentData>;
    if (options.collegeId) {
      q = query(
        collection(db, "curriculum"),
        where("collegeId", "==", options.collegeId),
        orderBy("createdAt", "desc"),
        limit(options.limit || 50)
      );
    } else {
      q = query(collection(db, "curriculum"), orderBy("createdAt", "desc"), limit(options.limit || 50));
    }
    if (options.status && options.status !== "all") {
      q = query(q, where("status", "==", options.status));
    }
    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(docToCurriculumDoc);
    if (options.branch) items = items.filter((c) => c.branch === options.branch);
    if (options.semester) items = items.filter((c) => c.semester === options.semester);
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      items = items.filter(
        (c) => c.title.toLowerCase().includes(searchLower) || c.branch.toLowerCase().includes(searchLower)
      );
    }
    return { items, total: items.length, hasMore: snapshot.docs.length === (options.limit || 50) };
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
    const q = query(
      collection(db, "curriculum"),
      where("collegeId", "==", collegeId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToCurriculumDoc);
  } catch (error) {
    console.error("Error fetching curriculum by college:", error);
    return [];
  }
}

export async function updateCurriculumDoc(
  curriculumId: string,
  updates: Partial<CurriculumDoc>
): Promise<CurriculumDoc> {
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
  try {
    await deleteDoc(doc(db, "curriculum", curriculumId));
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to delete curriculum");
  }
}

export async function assignCurriculumToCollege(input: AssignCurriculumInput): Promise<CurriculumDoc> {
  const extract = await getSyllabusExtractById(input.syllabusExtractId);
  if (!extract) throw new Error("Syllabus extract not found");

  const now = Timestamp.now();
  const selectedCourses = input.selectedCourseIds
    ? extract.courses.filter((c) => input.selectedCourseIds?.includes(c.id))
    : extract.courses;

  if (selectedCourses.length === 0) throw new Error("No courses selected for assignment");

  const totalModules = selectedCourses.reduce((sum, c) => sum + c.modules.length, 0);
  const totalHours = selectedCourses.reduce((sum, c) => sum + c.totalHours, 0);
  const totalMarks = selectedCourses.reduce((sum, c) => sum + c.totalMarks, 0);
  const firstCourse = selectedCourses[0];

  const curriculumData = deepSanitize({
    collegeId: input.collegeId,
    collegeName: input.collegeName,
    syllabusExtractId: input.syllabusExtractId,
    title: `${firstCourse.branch || "Curriculum"} - Semester ${firstCourse.semester || ""}`,
    description: input.reviewNotes ?? null,
    scheme: firstCourse.scheme || "",
    branch: firstCourse.branch || "",
    semester: firstCourse.semester || 0,
    courses: selectedCourses,
    totalCourses: selectedCourses.length,
    totalModules,
    totalHours,
    totalMarks,
    status: "active" as const,
    createdBy: extract.extractedBy,
    assignedBy: extract.extractedBy,
    assignedAt: now,
  });

  const docRef = await addDoc(collection(db, "curriculum"), curriculumData);

  await updateDoc(doc(db, "syllabusExtracts", input.syllabusExtractId), {
    status: "assigned",
    collegeId: input.collegeId,
    collegeName: input.collegeName,
    assignedAt: now,
    assignedBy: extract.extractedBy,
    reviewNotes: input.reviewNotes ?? null,
    updatedAt: now,
  });

  return {
    id: docRef.id,
    ...curriculumData,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
    assignedAt: now.toDate().toISOString(),
  } as CurriculumDoc;
}

export async function getCurriculumStats(): Promise<CurriculumStats> {
  try {
    const extractsSnap = await getDocs(collection(db, "syllabusExtracts"));
    const extracts = extractsSnap.docs.map(docToSyllabusExtract);
    const byFormat: Record<string, number> = { docx: 0, pdf: 0, txt: 0 };
    const byStatus: Record<string, number> = { parsing: 0, review: 0, approved: 0, assigned: 0, archived: 0 };
    let totalCourses = 0,
      totalModules = 0,
      confidenceSum = 0;

    for (const e of extracts) {
      byFormat[e.format] = (byFormat[e.format] || 0) + 1;
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      totalCourses += e.totalCourses;
      totalModules += e.totalModules;
      confidenceSum += e.confidenceScore;
    }

    return {
      totalExtracts: extracts.length,
      pendingReview: byStatus.review,
      approved: byStatus.approved,
      assigned: byStatus.assigned,
      totalCourses,
      totalModules,
      averageConfidence: extracts.length > 0 ? Math.round(confidenceSum / extracts.length) : 0,
      byFormat: byFormat as Record<"docx" | "pdf" | "txt", number>,
      byStatus: byStatus as Record<CurriculumStatus, number>,
    };
  } catch (error) {
    console.error("Error fetching curriculum stats:", error);
    return {
      totalExtracts: 0,
      pendingReview: 0,
      approved: 0,
      assigned: 0,
      totalCourses: 0,
      totalModules: 0,
      averageConfidence: 0,
      byFormat: { docx: 0, pdf: 0, txt: 0 },
      byStatus: { parsing: 0, review: 0, approved: 0, assigned: 0, archived: 0 },
    };
  }
}
