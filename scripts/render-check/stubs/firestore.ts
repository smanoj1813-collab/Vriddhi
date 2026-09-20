// Records the calls components make, and returns empty docs so no network I/O.
export const calls: string[] = [];
export function collection(_db: any, ...p: string[]) { calls.push('collection:' + p.join('/')); return {}; }
export function doc(_db: any, ...p: string[]) { calls.push('doc:' + p.join('/')); return { __path: p.join('/') }; }
export function query(..._a: any[]) { return {}; }
export function where(f: string, op: string, v: any) { calls.push(`where:${f}${op}${v}`); return {}; }
export function orderBy(..._a: any[]) { return {}; }
export function limit(_n: number) { return {}; }
export async function getDoc(ref: any) {
  calls.push('getDoc:' + (ref?.__path ?? '?'));
  return { exists: () => false, data: () => undefined, id: '' };
}
export async function getDocs(_q: any) { return { empty: true, size: 0, docs: [], forEach: () => {} }; }
export async function setDoc(..._a: any[]) { calls.push('setDoc'); }
// Write/listen surfaces reached by pages further down the module graph
// (curriculum, superadmin, layout). They are stubs like everything else here:
// recorded, never persisted.
export async function addDoc(..._a: any[]) { calls.push('addDoc'); return { id: 'stub-id' }; }
export async function updateDoc(..._a: any[]) { calls.push('updateDoc'); }
export async function deleteDoc(..._a: any[]) { calls.push('deleteDoc'); }
export async function runTransaction(_db: any, fn: (t: any) => Promise<any>) {
  return fn({ set: async () => {}, update: async () => {}, get: async () => ({ exists: () => false, data: () => undefined }) });
}
export function onSnapshot(..._a: any[]) { calls.push('onSnapshot'); return () => {}; }
export function writeBatch(..._a: any[]) {
  return { set: async () => calls.push('batch.set'), update: async () => calls.push('batch.update'), delete: async () => calls.push('batch.delete'), commit: async () => calls.push('batch.commit') };
}
export function arrayUnion(...v: any[]) { return { __stub: 'arrayUnion', v }; }
export function arrayRemove(...v: any[]) { return { __stub: 'arrayRemove', v }; }
export function increment(n: number) { return { __stub: 'increment', n }; }
export function serverTimestamp() { return { __stub: 'serverTimestamp' }; }
export function deleteField() { return { __stub: 'deleteField' }; }
export function getFirestore(..._a: any[]) { return { __stub: 'firestore' }; }
export function collectionGroup(..._a: any[]) { return {}; }
export function startAfter(..._a: any[]) { return {}; }
export function endBefore(..._a: any[]) { return {}; }
export class Timestamp {
  static now() { return new Timestamp(); }
  toDate() { return new Date(); }
}
export default {
  collection, doc, query, where, orderBy, limit, getDoc, getDocs, setDoc,
  addDoc, updateDoc, deleteDoc, runTransaction, onSnapshot, arrayUnion,
  arrayRemove, increment, serverTimestamp, deleteField, getFirestore, Timestamp,
};
