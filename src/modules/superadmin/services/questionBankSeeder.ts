// ═══════════════════════════════════════════════════════════════════════
// src/modules/superadmin/services/questionBankSeeder.ts
//
// Firestore side of the platform question-bank seeder: works out what is
// already in the universal pool, then writes the missing rows through
// `questionStorageApi.createQuestions`.
//
// The pure CSV → document mapping lives in ../data/questionBankSeed.ts so it
// can be unit tested without a database.
// ═══════════════════════════════════════════════════════════════════════

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { questionStorageApi } from '../../admin/api/cloudStorageApi';
import type { QuestionMetadata } from '../../admin/types/universalQuestionBank';
import {
  buildSeedPayload,
  fingerprintMetaDoc,
  fingerprintSeedRow,
  type SeedAuthor,
  type SeedPayload,
  type SeedRow,
} from '../data/questionBankSeed';

const META_COLLECTION = 'questionBank_meta';

export interface SeedPlanOptions {
  visibility?: 'public' | 'college_only' | 'shared_with';
  status?: 'approved' | 'pending';
  source?: string;
  shuffleOptions?: boolean;
  author: SeedAuthor;
}

export interface SeedPlan {
  /** Fingerprints already present in `questionBank_meta`. */
  existingFingerprints: Set<string>;
  /** Rows that would be written (valid, branch-filtered, not already present). */
  toSeed: SeedPayload[];
  /** Valid rows skipped because their fingerprint is already in the pool. */
  skipped: SeedRow[];
  /** Total documents in the pool before this run. */
  poolSize: number;
  /** True when the pool could not be read (dedupe unavailable). */
  scanFailed: boolean;
  scanError?: string;
}

/**
 * Reads the whole `questionBank_meta` collection and fingerprints it.
 *
 * The collection is small by design (the bank is curated, not user-generated at
 * scale) and the API already reads it in full for stats, so a single unfiltered
 * read is both the cheapest and the most accurate dedupe available — it catches
 * duplicates no matter which importer created them.
 */
export async function scanExistingQuestionFingerprints(): Promise<{
  fingerprints: Set<string>;
  poolSize: number;
  error?: string;
}> {
  const fingerprints = new Set<string>();
  try {
    const snap = await getDocs(collection(db, META_COLLECTION));
    snap.forEach((d) => {
      const data = d.data() as Record<string, any>;
      fingerprints.add(fingerprintMetaDoc({ ...data, id: d.id }));
    });
    return { fingerprints, poolSize: snap.size };
  } catch (error) {
    return {
      fingerprints,
      poolSize: 0,
      error: (error as Error).message || 'Could not read the question bank',
    };
  }
}

/**
 * Builds the write plan for a set of validated rows: maps each one to its
 * universal-pool documents and drops anything whose fingerprint already exists.
 */
export async function buildSeedPlan(
  rows: SeedRow[],
  opts: SeedPlanOptions
): Promise<SeedPlan> {
  const { fingerprints, poolSize, error } = await scanExistingQuestionFingerprints();

  const toSeed: SeedPayload[] = [];
  const skipped: SeedRow[] = [];
  // Two identical rows inside the same CSV must not both be written either.
  const seenInRun = new Set<string>();

  for (const row of rows) {
    const fingerprint = fingerprintSeedRow(row);
    if (fingerprints.has(fingerprint) || seenInRun.has(fingerprint)) {
      skipped.push(row);
      continue;
    }
    seenInRun.add(fingerprint);
    toSeed.push(
      buildSeedPayload(row, {
        visibility: opts.visibility || 'public',
        status: opts.status || 'approved',
        source: opts.source || 'platform',
        shuffleOptions: opts.shuffleOptions !== false,
        author: opts.author,
      })
    );
  }

  return {
    existingFingerprints: fingerprints,
    toSeed,
    skipped,
    poolSize,
    scanFailed: Boolean(error),
    scanError: error,
  };
}

export interface SeedRunResult {
  created: number;
  skipped: number;
  failed: number;
  errors: string[];
  createdIds: string[];
}

/** Executes a plan, reporting progress as each batch commits. */
export async function runSeedPlan(
  plan: SeedPlan,
  onProgress?: (done: number, total: number) => void
): Promise<SeedRunResult> {
  const inputs = plan.toSeed.map((p) => ({ meta: p.meta, content: p.content }));

  if (!inputs.length) {
    onProgress?.(0, 0);
    return {
      created: 0,
      skipped: plan.skipped.length,
      failed: 0,
      errors: [],
      createdIds: [],
    };
  }

  const res = await questionStorageApi.createQuestions(inputs, {
    writeReview: true,
    chunkSize: 120,
    onProgress,
  });

  const data = res.data || { createdIds: [], created: 0, failed: inputs.length, errors: [] };

  return {
    created: data.created || 0,
    skipped: plan.skipped.length,
    failed: data.failed || 0,
    errors: [...(data.errors || []), ...(res.success ? [] : [res.error || 'Seeding failed'])],
    createdIds: data.createdIds || [],
  };
}

/**
 * Writes rows without a dedupe scan. Used only when the pool could not be read
 * and the superadmin explicitly confirms they want to seed anyway.
 */
export async function forceSeedRows(
  rows: SeedRow[],
  opts: SeedPlanOptions,
  onProgress?: (done: number, total: number) => void
): Promise<SeedRunResult> {
  const payloads = rows.map((row) =>
    buildSeedPayload(row, {
      visibility: opts.visibility || 'public',
      status: opts.status || 'approved',
      source: opts.source || 'platform',
      shuffleOptions: opts.shuffleOptions !== false,
      author: opts.author,
    })
  );
  const plan: SeedPlan = {
    existingFingerprints: new Set<string>(),
    toSeed: payloads,
    skipped: [],
    poolSize: 0,
    scanFailed: true,
  };
  return runSeedPlan(plan, onProgress);
}

/** Convenience type re-export for callers that only need the metadata shape. */
export type { QuestionMetadata };
