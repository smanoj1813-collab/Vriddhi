// src/pages/superadmin/seedUniversities.ts
// Standalone seed script for Karnataka Universities
// Run this once to populate Firestore with all 23 government universities

import { seedUniversities } from '../api/universityApi';

/**
 * Seeds the Firestore `universities` collection with all 23 Karnataka
 * government universities. Safe to run multiple times — existing docs
 * are updated, new ones are created.
 *
 * Usage:
 *   import { runUniversitySeed } from "./seedUniversities";
 *   await runUniversitySeed();
 */
export async function runUniversitySeed(): Promise<{
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
}> {
  console.log("[Seed] Starting Karnataka university seed...");
  try {
    const result = await seedUniversities();
    console.log(`[Seed] Complete: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`);
    if (result.errors.length > 0) {
      console.warn("[Seed] Errors:", result.errors);
    }
    return {
      success: result.errors.length === 0,
      created: result.created,
      updated: result.updated,
      errors: result.errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Seed] Failed:", msg);
    return {
      success: false,
      created: 0,
      updated: 0,
      errors: [msg],
    };
  }
}

/**
 * Check if universities collection is already seeded.
 */
export async function isUniversitiesSeeded(): Promise<boolean> {
  try {
    const { listUniversities } = await import("../api/universityApi"); // or actual relative path
    const result = await listUniversities({ limit: 1 });
    return result.total > 0;
  } catch {
    return false;
  }
}
