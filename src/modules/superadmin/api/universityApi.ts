// src/api/universityApi.ts
// Firestore CRUD for universities collection + college classification updates

import { db } from '@/Firebase/config';
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
} from '../types/superAdmin';

import type {
  University,
  CreateUniversityInput,
  UpdateUniversityInput,
  ListUniversitiesOptions,
  CollegeClassification,
  UpdateCollegeClassificationInput,
  UniversityStats,
  UniversityRolloutProgress,
} from "../types/university";

import { KARNATAKA_UNIVERSITIES, getUniversityByCode } from '../../../shared/data/karnatakaUniversities';

// ═══════════════════════════════════════════════════════════════════════
// ERROR CLASS
// ═══════════════════════════════════════════════════════════════════════

export class UniversityApiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "UniversityApiError";
  }
}

// ═══════════════════════════════════════════════════════════════════════
// FIRESTORE HELPERS
// ═══════════════════════════════════════════════════════════════════════

function docToUniversity(docSnap: QueryDocumentSnapshot<DocumentData>): University {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "",
    shortName: data.shortName || "",
    code: data.code || "",
    managementType: data.managementType || "Government",
    priority: data.priority ?? null,
    districts: data.districts || [],
    collegeCountMin: data.collegeCountMin || 0,
    collegeCountMax: data.collegeCountMax || 0,
    courses: data.courses || [],
    isWomensUniversity: data.isWomensUniversity || false,
    isNewUniversity: data.isNewUniversity || false,
    website: data.website,
    location: data.location,
    establishedYear: data.establishedYear,
    onboardedColleges: data.onboardedColleges || 0,
    activeColleges: data.activeColleges || 0,
    status: data.status || "active",
    createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
  } as University;
}

// ═══════════════════════════════════════════════════════════════════════
// SEED: Populate Firestore with static Karnataka data
// ═══════════════════════════════════════════════════════════════════════

/**
 * One-time seed function. Call this from SuperAdmin to initialize
 * the universities collection with all 23 Karnataka government universities.
 */
export async function seedUniversities(): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const result = { created: 0, updated: 0, errors: [] as string[] };

  for (const uni of KARNATAKA_UNIVERSITIES) {
    try {
      // Check if university already exists by code
      const existingQuery = query(
        collection(db, "universities"),
        where("code", "==", uni.code)
      );
      const existingSnap = await getDocs(existingQuery);

      const now = Timestamp.now();
      const uniData = {
        ...uni,
        status: "active",
        onboardedColleges: 0,
        activeColleges: 0,
        createdAt: now,
        updatedAt: now,
      };

      if (existingSnap.empty) {
        await addDoc(collection(db, "universities"), uniData);
        result.created++;
      } else {
        const docRef = existingSnap.docs[0].ref;
        await updateDoc(docRef, { ...uniData, updatedAt: now });
        result.updated++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      result.errors.push(`${uni.name}: ${msg}`);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// UNIVERSITY CRUD
// ═══════════════════════════════════════════════════════════════════════

export async function createUniversity(input: CreateUniversityInput): Promise<University> {
  const now = Timestamp.now();
  const uniData = {
    ...input,
    status: "active",
    onboardedColleges: 0,
    activeColleges: 0,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, "universities"), uniData);

  return {
    id: docRef.id,
    ...uniData,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  } as University;
}

export async function listUniversities(
  options: ListUniversitiesOptions = {}
): Promise<PaginatedResult<University>> {
  try {
    let constraints: any[] = [];
    let appliedOrderBy = false;

    if (options.status && options.status !== "all") {
      constraints.push(where("status", "==", options.status));
    }
    if (options.managementType && options.managementType !== "all") {
      constraints.push(where("managementType", "==", options.managementType));
    }
    if (options.priority && options.priority !== "all") {
      constraints.push(where("priority", "==", Number(options.priority)));
    }
    if (constraints.length === 0) {
      constraints.push(orderBy("priority", "asc"));
      appliedOrderBy = true;
    }

    let q = query(collection(db, "universities"), ...constraints);
    const limitCount = options.limit || options.pageSize || 50;
    q = query(q, limit(limitCount));

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(docToUniversity);

    // Client-side search
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      items = items.filter(
        (u) =>
          u.name.toLowerCase().includes(searchLower) ||
          u.code.toLowerCase().includes(searchLower) ||
          (u.shortName && u.shortName.toLowerCase().includes(searchLower))
      );
    }

    const total = items.length;
    const hasMore = snapshot.docs.length === limitCount;
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return { items, data: items, total, hasMore, lastDoc };
  } catch (error) {
    console.error("Error fetching universities:", error);
    return { items: [], data: [], total: 0, hasMore: false };
  }
}

export async function getUniversityById(universityId: string): Promise<University | null> {
  try {
    const docRef = doc(db, "universities", universityId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docToUniversity(docSnap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error fetching university:", error);
    return null;
  }
}

export async function getUniversityByCodeFromDb(code: string): Promise<University | null> {
  try {
    const q = query(collection(db, "universities"), where("code", "==", code), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return docToUniversity(snapshot.docs[0] as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error fetching university by code:", error);
    return null;
  }
}

export async function updateUniversity(
  universityId: string,
  updates: UpdateUniversityInput
): Promise<University> {
  try {
    const docRef = doc(db, "universities", universityId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(docRef, updateData);

    const updated = await getDoc(docRef);
    if (!updated.exists()) throw new UniversityApiError("University not found after update");
    return docToUniversity(updated as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    throw new UniversityApiError(
      error instanceof Error ? error.message : "Failed to update university"
    );
  }
}

export async function deleteUniversity(universityId: string): Promise<void> {
  try {
    // Check if any colleges are affiliated
    const collegesQuery = query(
      collection(db, "colleges"),
      where("universityId", "==", universityId)
    );
    const collegesSnap = await getDocs(collegesQuery);
    if (!collegesSnap.empty) {
      throw new UniversityApiError(
        `Cannot delete: ${collegesSnap.size} colleges are still affiliated`
      );
    }
    await deleteDoc(doc(db, "universities", universityId));
  } catch (error) {
    throw new UniversityApiError(
      error instanceof Error ? error.message : "Failed to delete university"
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// COLLEGE CLASSIFICATION API
// ═══════════════════════════════════════════════════════════════════════

/**
 * Update a college's classification (university, management type, autonomy, etc.)
 * Called during college onboarding or when reclassifying.
 */
export async function updateCollegeClassification(
  collegeId: string,
  input: UpdateCollegeClassificationInput
): Promise<void> {
  try {
    const docRef = doc(db, "colleges", collegeId);
    const updateData: Record<string, unknown> = {
      ...input,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(docRef, updateData);
  } catch (error) {
    throw new UniversityApiError(
      error instanceof Error ? error.message : "Failed to update college classification"
    );
  }
}

/**
 * Get all colleges affiliated with a university
 */
export async function getCollegesByUniversity(
  universityId: string
): Promise<Array<{ id: string; name: string; code: string; status: string; district: string }>> {
  try {
    const q = query(
      collection(db, "colleges"),
      where("universityId", "==", universityId),
      orderBy("name", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || "",
        code: data.code || "",
        status: data.status || "active",
        district: data.district || "",
      };
    });
  } catch (error) {
    console.error("Error fetching colleges by university:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ANALYTICS / DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

export async function getUniversityStats(): Promise<UniversityStats> {
  try {
    const [unisSnap, collegesSnap] = await Promise.all([
      getDocs(collection(db, "universities")),
      getDocs(collection(db, "colleges")),
    ]);

    const universities = unisSnap.docs.map(docToUniversity);
    const colleges = collegesSnap.docs.map((d) => d.data());

    const byManagementType: Record<string, number> = { Government: 0, "Government Aided": 0, Private: 0 };
    const byPriority: Record<string, number> = {};
    const byDistrict: Record<string, number> = {};

    let onboardedColleges = 0;
    let activeColleges = 0;

    for (const c of colleges) {
      const mgmt = c.managementType || "Government";
      byManagementType[mgmt] = (byManagementType[mgmt] || 0) + 1;

      const district = c.district || "Unknown";
      byDistrict[district] = (byDistrict[district] || 0) + 1;

      if (c.vriddhiStatus === "active" || c.vriddhiStatus === "onboarding") {
        onboardedColleges++;
      }
      if (c.vriddhiStatus === "active") {
        activeColleges++;
      }
    }

    for (const u of universities) {
      const p = u.priority?.toString() || "unprioritized";
      byPriority[p] = (byPriority[p] || 0) + 1;
    }

    const totalEstimatedColleges = universities.reduce((s, u) => s + u.collegeCountMax, 0);

    return {
      totalUniversities: universities.length,
      totalColleges: colleges.length,
      onboardedColleges,
      activeColleges,
      byManagementType,
      byPriority,
      byDistrict,
      coveragePercentage: totalEstimatedColleges > 0 ? (onboardedColleges / totalEstimatedColleges) * 100 : 0,
    };
  } catch (error) {
    console.error("Error fetching university stats:", error);
    return {
      totalUniversities: 0,
      totalColleges: 0,
      onboardedColleges: 0,
      activeColleges: 0,
      byManagementType: { Government: 0, "Government Aided": 0, Private: 0 },
      byPriority: {},
      byDistrict: {},
      coveragePercentage: 0,
    };
  }
}

export async function getRolloutProgress(): Promise<UniversityRolloutProgress[]> {
  try {
    const unisSnap = await getDocs(query(collection(db, "universities"), orderBy("priority", "asc")));
    const universities = unisSnap.docs.map(docToUniversity);

    const result: UniversityRolloutProgress[] = [];

    for (const u of universities) {
      const collegesQuery = query(
        collection(db, "colleges"),
        where("universityId", "==", u.id)
      );
      const collegesSnap = await getDocs(collegesQuery);

      const onboarded = collegesSnap.docs.filter(
        (d) => d.data().vriddhiStatus === "active" || d.data().vriddhiStatus === "onboarding"
      ).length;
      const active = collegesSnap.docs.filter((d) => d.data().vriddhiStatus === "active").length;

      const target = u.collegeCountMax;
      const percentage = target > 0 ? Math.round((onboarded / target) * 100) : 0;

      result.push({
        universityId: u.id,
        universityName: u.name,
        priority: u.priority || 99,
        targetColleges: target,
        onboardedColleges: onboarded,
        activeColleges: active,
        percentageComplete: percentage,
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching rollout progress:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════════════════════════════════

export async function bulkUpdateUniversityStatus(
  universityIds: string[],
  status: "active" | "inactive" | "pending"
): Promise<void> {
  const batch = writeBatch(db);
  universityIds.forEach((id) => {
    const ref = doc(db, "universities", id);
    batch.update(ref, { status, updatedAt: Timestamp.now() });
  });
  await batch.commit();
}
