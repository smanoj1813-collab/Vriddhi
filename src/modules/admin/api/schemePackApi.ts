// src/modules/admin/api/schemePackApi.ts
// Scheme-pack client API (G1): reads presets + college customs, resolves the
// college's ACTIVE pack (colleges/{id}.schemePackId), and wraps the two
// callables that guard the write path.
//
// Every exam-side consumer (result importer, hall tickets, compliance
// dashboard) should resolve the pack through getCollegeSchemePack — never
// reach for DEFAULT directly — so a college on Karnatak Dharwad gets KUD
// numbers end-to-end.

import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/Firebase/config';
import {
  DEFAULT_SCHEME_PACK,
  SCHEME_PACK_PRESETS,
  type UniversitySchemePack,
} from '@/shared/types/schemePack';
import { normalizeSchemePack } from '@/shared/utils/schemeEngine';

/** A pack as the UI lists it: `origin` distinguishes built-ins from customs. */
export interface ListedSchemePack {
  pack: UniversitySchemePack;
  origin: 'preset' | 'custom';
}

function currentCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id');
  if (!id) throw new Error('No college is linked to this account');
  return id;
}

/** Presets + the college's custom packs, presets first. */
export async function fetchSchemePacks(collegeId?: string): Promise<ListedSchemePack[]> {
  const cid = collegeId || currentCollegeId();
  const listed: ListedSchemePack[] = SCHEME_PACK_PRESETS.map((p) => ({ pack: p, origin: 'preset' }));
  try {
    const snap = await getDocs(
      query(collection(db, 'schemePacks'), where('collegeId', '==', cid)),
    );
    for (const d of snap.docs) {
      listed.push({ pack: normalizeSchemePack({ ...d.data(), id: d.id }) as UniversitySchemePack, origin: 'custom' });
    }
  } catch (err) {
    // Rules/index hiccups should not sink the page — presets still list.
    console.warn('[schemePackApi] custom packs unavailable:', err);
  }
  return listed;
}

/**
 * The pack the college actually runs on:
 *   colleges/{cid}.schemePackId
 *     → preset code? return the preset
 *     → custom doc id? read schemePacks/{id} (normalised)
 *     → unset/missing → DEFAULT_SCHEME_PACK (BCU — pre-G1 behaviour)
 * Also returns the raw binding so the page can show "assigned" chips.
 */
export async function getCollegeSchemePack(
  collegeId?: string,
): Promise<{ pack: UniversitySchemePack; schemePackId: string | null; origin: 'preset' | 'custom' }> {
  const cid = collegeId || currentCollegeId();
  let schemePackId: string | null = null;
  try {
    const collegeSnap = await getDoc(doc(db, 'colleges', cid));
    const raw = collegeSnap.data()?.schemePackId;
    schemePackId = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
  } catch (err) {
    console.warn('[schemePackApi] college doc unavailable:', err);
  }

  if (!schemePackId) {
    return { pack: DEFAULT_SCHEME_PACK, schemePackId: null, origin: 'preset' };
  }
  const preset = SCHEME_PACK_PRESETS.find((p) => p.code === schemePackId || p.id === schemePackId);
  if (preset) return { pack: preset, schemePackId, origin: 'preset' };

  try {
    const snap = await getDoc(doc(db, 'schemePacks', schemePackId));
    if (snap.exists()) {
      const data = snap.data() as Record<string, unknown>;
      if (String(data.collegeId ?? '') === cid || data.collegeId === undefined) {
        return {
          pack: normalizeSchemePack({ ...data, id: schemePackId }) as UniversitySchemePack,
          schemePackId,
          origin: 'custom',
        };
      }
    }
  } catch (err) {
    console.warn('[schemePackApi] assigned pack unreadable:', err);
  }
  // Dangling binding (deleted custom) — fail safe to the default.
  return { pack: DEFAULT_SCHEME_PACK, schemePackId: null, origin: 'preset' };
}

export interface SaveSchemePackResult {
  id: string;
  code: string;
  name: string;
  updated: boolean;
}

export async function saveSchemePack(pack: Record<string, unknown>): Promise<SaveSchemePackResult> {
  const fn = httpsCallable<{ pack: Record<string, unknown> }, SaveSchemePackResult>(functions, 'saveSchemePack');
  const res = await fn({ pack });
  return res.data;
}

export interface AssignSchemePackResult {
  collegeId: string;
  schemePackId: string | null;
  resolvedName: string;
}

export async function assignCollegeSchemePack(schemePackId: string | null): Promise<AssignSchemePackResult> {
  const fn = httpsCallable<{ schemePackId: string }, AssignSchemePackResult>(functions, 'assignCollegeSchemePack');
  const res = await fn({ schemePackId: schemePackId ?? '' });
  return res.data;
}

/** Conveniences for exam-side consumers that just want numbers. */
export type { UniversitySchemePack };
