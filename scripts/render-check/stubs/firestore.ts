// Records the calls components make. By default every read returns empty so
// there is no network I/O; a test can install fixture rows per collection on
// `globalThis.__RC_FIRESTORE_DATA` (keyed by collection path) and getDocs
// will serve them, which lets pages that resolve a picker (e.g. the
// superadmin college selector) render for real.
export const calls: string[] = [];
export function collection(_db: any, ...p: string[]) { calls.push('collection:' + p.join('/')); return { __collection: p.join('/') }; }
export function doc(_db: any, ...p: string[]) { calls.push('doc:' + p.join('/')); return { __path: p.join('/') }; }
export function query(...a: any[]) { return { __query: a }; }
export function where(f: string, op: string, v: any) { calls.push(`where:${f}${op}${v}`); return {}; }
export function orderBy(..._a: any[]) { return {}; }
export function limit(_n: number) { return {}; }
export async function getDoc(ref: any) {
  calls.push('getDoc:' + (ref?.__path ?? '?'));
  return { exists: () => false, data: () => undefined, id: '' };
}
export async function getDocs(q: any) {
  const store = (globalThis as any).__RC_FIRESTORE_DATA as
    | Record<string, Array<Record<string, any>>>
    | undefined;
  const coll: string | undefined =
    q?.__collection ?? q?.__query?.find((x: any) => x?.__collection)?.__collection;
  const rows = (coll && store?.[coll]) || [];
  const docs = rows.map((row, i) => ({
    id: String(row.id ?? `doc-${i}`),
    exists: () => true,
    data: () => row,
  }));
  return { empty: docs.length === 0, size: docs.length, docs, forEach: (cb: any) => docs.forEach(cb) };
}
export async function setDoc(..._a: any[]) { calls.push('setDoc'); }
export class Timestamp {
  static now() { return new Timestamp(); }
  toDate() { return new Date(); }
}
