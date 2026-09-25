// Records the calls components make, and returns empty docs so no network I/O.
export const calls: string[] = [];
export function collection(_db: any, ...p: string[]) { calls.push('collection:' + p.join('/')); return {}; }
export function doc(_db: any, ...p: string[]) {
  calls.push('doc:' + p.join('/'));
  // collectionPath/id mirror the real DocumentReference so a check can tell which
  // collection a batched write targeted (the path alone loses the collection of
  // an auto-id ref like doc(collection(db, 'questionBank_meta'))).
  const path = p.join('/');
  const lastSlash = path.lastIndexOf('/');
  // The real SDK hands out a fresh random id for an auto-id ref; a constant here
  // would collapse every doc in a batch onto one key.
  const autoId = lastSlash < 0 ? `stub-auto-${++autoIdSeq}` : '';
  return {
    __path: autoId ? `${path}/${autoId}` : path,
    id: lastSlash >= 0 ? path.slice(lastSlash + 1) : autoId,
    collectionPath: lastSlash >= 0 ? path.slice(0, lastSlash) : path,
  };
}
let autoIdSeq = 0;
export function query(..._a: any[]) { return {}; }
export function where(f: string, op: string, v: any) { calls.push(`where:${f}${op}${v}`); return {}; }
export function orderBy(..._a: any[]) { return {}; }
export function limit(_n: number) { return {}; }
export async function getDoc(ref: any) {
  calls.push('getDoc:' + (ref?.__path ?? '?'));
  // A check that needs a document to exist (a challan being declared paid, for
  // instance) sets globalThis.__RC_FIRESTORE_DOC = { data: {...} }; unset, a
  // read misses, exactly as an empty collection does.
  const seeded = (globalThis as any).__RC_FIRESTORE_DOC;
  if (seeded && seeded.data) {
    const path = String(ref?.__path ?? '');
    return { exists: () => true, data: () => seeded.data, id: path.split('/').pop() ?? '' };
  }
  return { exists: () => false, data: () => undefined, id: '' };
}
export async function getDocs(_q: any) {
  // A render check can stand in for real rows by setting
  // globalThis.__RC_FIRESTORE_DOCS to [{ id, data: () => ({...}) }]. Unset,
  // the stub behaves exactly as before: an empty collection.
  const seeded = (globalThis as any).__RC_FIRESTORE_DOCS;
  if (Array.isArray(seeded) && seeded.length > 0) {
    return { empty: false, size: seeded.length, docs: seeded, forEach: (cb: any) => seeded.forEach(cb) };
  }
  return { empty: true, size: 0, docs: [], forEach: () => {} };
}
export async function setDoc(..._a: any[]) { calls.push('setDoc'); }
// Write/listen surfaces reached by pages further down the module graph
// (curriculum, superadmin, layout). They are stubs like everything else here:
// recorded, never persisted.
export async function addDoc(_col: any, data?: any) {
  calls.push('addDoc');
  // Same idea as updateDoc: a check can assert what was written. Screens that
  // create records (scheduling a class) are otherwise unverifiable here.
  const writes = ((globalThis as any).__RC_WRITES ??= [] as any[]);
  writes.push({ path: 'addDoc', data });
  return { id: 'stub-id' };
}
export async function updateDoc(...a: any[]) {
  calls.push('updateDoc');
  // Beyond the bare call log, a check can assert what was written: the last
  // argument is the merge payload, and the first carries the document path.
  const writes = ((globalThis as any).__RC_WRITES ??= [] as any[]);
  writes.push({ path: (a[0] as any)?.__path, data: a[a.length - 1] });
}
export async function deleteDoc(..._a: any[]) { calls.push('deleteDoc'); }
export async function runTransaction(_db: any, fn: (t: any) => Promise<any>) {
  return fn({ set: async () => {}, update: async () => {}, get: async () => ({ exists: () => false, data: () => undefined }) });
}
export function onSnapshot(..._a: any[]) { calls.push('onSnapshot'); return () => {}; }
export function writeBatch(..._a: any[]) {
  return {
    set: async (...a: any[]) => {
      calls.push('batch.set');
      // Same idea as updateDoc/addDoc: a check can assert what a bulk write
      // actually committed (the question-bank seeder writes meta + content +
      // review per question through a batch, which is otherwise unverifiable).
      const writes = ((globalThis as any).__RC_WRITES ??= [] as any[]);
      writes.push({
        path: (a[0] as any)?.__path ?? 'batch.set',
        collectionPath: (a[0] as any)?.collectionPath ?? '',
        id: (a[0] as any)?.id ?? '',
        data: a[1],
      });
    },
    update: async () => calls.push('batch.update'),
    delete: async () => calls.push('batch.delete'),
    commit: async () => calls.push('batch.commit'),
  };
}
export function arrayUnion(...v: any[]) { return { __stub: 'arrayUnion', v }; }
export function arrayRemove(...v: any[]) { return { __stub: 'arrayRemove', v }; }
export function increment(n: number) { return { __stub: 'increment', n }; }
export function serverTimestamp() { return { __stub: 'serverTimestamp' }; }
export function deleteField() { return { __stub: 'deleteField' }; }
export function getFirestore(..._a: any[]) { return { __stub: 'firestore' }; }
export function collectionGroup(..._a: any[]) { return {}; }
// Aggregation reads (item 2.4/3.2 replaced row downloads with count()/sum()).
// A check can seed one via globalThis.__RC_FIRESTORE_COUNT; unset means zero.
export async function getCountFromServer(..._a: any[]) {
  calls.push('getCountFromServer');
  const seeded = Number((globalThis as any).__RC_FIRESTORE_COUNT);
  return { data: () => ({ count: Number.isFinite(seeded) ? seeded : 0 }) };
}
export async function getAggregateFromServer(..._a: any[]) {
  calls.push('getAggregateFromServer');
  const seeded = (globalThis as any).__RC_FIRESTORE_AGGREGATE;
  return { data: () => (seeded && typeof seeded === 'object' ? seeded : { sum: 0, average: 0, count: 0 }) };
}
export function startAfter(..._a: any[]) { return {}; }
export function endBefore(..._a: any[]) { return {}; }
export class Timestamp {
  // Real Timestamps carry the instant; fee code reads it back with toMillis(),
  // so the stub has to keep the number rather than only hand out a Date.
  private readonly ms = Date.now();
  static now() { return new Timestamp(); }
  toDate() { return new Date(this.ms); }
  toMillis() { return this.ms; }
  get seconds() { return Math.floor(this.ms / 1000); }
  get nanoseconds() { return (this.ms % 1000) * 1e6; }
}
export default {
  collection, doc, query, where, orderBy, limit, getDoc, getDocs, setDoc,
  addDoc, updateDoc, deleteDoc, runTransaction, onSnapshot, arrayUnion,
  arrayRemove, increment, serverTimestamp, deleteField, getFirestore, Timestamp,
};
