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
export class Timestamp {
  static now() { return new Timestamp(); }
  toDate() { return new Date(); }
}
