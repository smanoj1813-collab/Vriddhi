// One resolution contract for all exam/credit consumers. Missing/unreadable
// configuration is an actionable error, never another university's rules.
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/Firebase/data';
import { SCHEME_PACK_PRESETS, type AcademicContext, type UniversitySchemePack } from '@/shared/types/schemePack';
import { normalizeSchemePack } from '@/shared/utils/schemeEngine';
import { readCollegeScheme, readCollegeSchemes, type ResolvedCollegeScheme } from '../../../../functions/src/academic/schemeResolution';

import type { CollegeSchemeSelection } from '../../../../functions/src/academic/collegeSchemes';

export interface ListedSchemePack { pack: UniversitySchemePack; origin: 'preset' | 'custom' }
function currentCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id');
  if (!id) throw new Error('No college is linked to this account');
  return id;
}
export async function fetchSchemePacks(collegeId = currentCollegeId()): Promise<ListedSchemePack[]> {
  const snap = collegeId ? await getDocs(query(collection(db, 'schemePacks'), where('collegeId', '==', collegeId))) : { docs: [] };
  return [
    ...SCHEME_PACK_PRESETS.map(p => ({ pack: normalizeSchemePack(p), origin: 'preset' as const })),
    ...snap.docs.map(d => ({ pack: normalizeSchemePack({ ...d.data(), id: d.id }), origin: 'custom' as const })),
  ];
}
export async function getCollegeSchemePack(collegeId = currentCollegeId(), context?: AcademicContext): Promise<ResolvedCollegeScheme> {
  return readCollegeScheme(collegeId, {
    college: async id => { const snap = await getDoc(doc(db, 'colleges', id)); return snap.exists() ? snap.data() : undefined; },
    customPack: async id => { const snap = await getDoc(doc(db, 'schemePacks', id)); return snap.exists() ? snap.data() : undefined; },
  }, context);
}
export async function getCollegeSchemeConfiguration(collegeId = currentCollegeId()) {
  return readCollegeSchemes(collegeId, {
    college: async id => { const snap = await getDoc(doc(db, 'colleges', id)); return snap.exists() ? snap.data() : undefined; },
    customPack: async id => { const snap = await getDoc(doc(db, 'schemePacks', id)); return snap.exists() ? snap.data() : undefined; },
  });
}
export async function configureCollegeSchemePacks(selection: CollegeSchemeSelection, expectedConfigurationRevision: number, collegeId = currentCollegeId()) {
  const fn = httpsCallable<Record<string, unknown>, { collegeId: string; configurationRevision: number }>(functions, 'configureCollegeSchemePacks');
  return (await fn({ collegeId, selection, expectedConfigurationRevision })).data;
}
export interface SaveSchemePackResult { id: string; code: string; name: string; updated: boolean; revision: number }
export async function saveSchemePack(pack: Record<string, unknown>, collegeId = currentCollegeId()): Promise<SaveSchemePackResult> {
  const fn = httpsCallable<{ pack: Record<string, unknown>; collegeId: string }, SaveSchemePackResult>(functions, 'saveSchemePack');
  return (await fn({ pack, collegeId })).data;
}
export interface AssignSchemePackResult { collegeId: string; schemePackId: string | null; revision: number | null; resolvedName: string }
export async function assignCollegeSchemePack(schemePackId: string | null, revision?: number, collegeId = currentCollegeId()): Promise<AssignSchemePackResult> {
  const fn = httpsCallable<Record<string, unknown>, AssignSchemePackResult>(functions, 'assignCollegeSchemePack');
  return (await fn({ schemePackId: schemePackId ?? '', collegeId, ...(revision === undefined ? {} : { revision }) })).data;
}
export type { UniversitySchemePack };
