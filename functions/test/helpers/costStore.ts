import assert from 'node:assert/strict'

/** Firestore transport model for the real assessment handlers: query result
 * sizes, metadata versions, atomic transactions and transform semantics. This
 * is not a replacement for security-rule/emulator tests. */
export function makeCostStore() {
  const data = new Map<string, any>()
  const versions = new Map<string, number>()
  const reads: string[] = []
  const writes: string[] = []
  const queries: Array<{ path: string; filters: any[]; returned: number; limit: number; selected: boolean }> = []
  let sequence = 0
  let onRead: ((path: string) => void) | undefined
  let tail: Promise<unknown> = Promise.resolve()
  const failures = new Map<string, string | number>()
  const copy = (value: any) => value === undefined ? undefined : structuredClone(value)
  function seed(path: string, value: any) { data.set(path, copy(value)); versions.set(path, ++sequence) }
  function snapshot(ref: Ref, fields?: string[]) {
    const row = data.get(ref.path)
    const version = versions.get(ref.path) || 0
    return { id: ref.id, ref, exists: row !== undefined, updateTime: { seconds: version, nanoseconds: 0 },
      data: () => row === undefined ? undefined : fields ? Object.fromEntries(fields.filter(key => key in row).map(key => [key, copy(row[key])])) : copy(row) }
  }
  function transformed(value: any, previous: any): any {
    if (value?.constructor?.name === 'NumericIncrementTransform') return (Number(previous) || 0) + value.operand
    if (value?.constructor?.name === 'ServerTimestampTransform') return new Date(Date.now() + sequence)
    if (Array.isArray(value)) return value.map((entry, i) => transformed(entry, previous?.[i]))
    if (value instanceof Date) return value
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, transformed(item, previous?.[key])]))
    return value
  }
  type Write = { ref: Ref; value: any; merge?: boolean }
  const apply = (pending: Write[]) => {
    assert.ok(pending.length <= 500)
    for (const item of pending) {
      const previous = data.get(item.ref.path)
      const value = transformed(item.value, previous)
      seed(item.ref.path, item.merge ? { ...previous, ...value } : value)
      writes.push(item.ref.path)
    }
  }
  class Ref {
    constructor(readonly path: string) {}
    get id() { return this.path.split('/').pop()! }
    async get() { onRead?.(this.path); reads.push(this.path); return snapshot(this) }
    collection(name: string) { return new Query(this.path + '/' + name) }
    async update(value: any) { apply([{ ref: this, value, merge: true }]) }
    async set(value: any, options?: { merge: boolean }) { apply([{ ref: this, value, merge: options?.merge }]) }
  }
  const comparable = (value: any) => value instanceof Date ? value.getTime() : value?.toMillis ? value.toMillis() : value
  class Query {
    constructor(readonly path: string, readonly filters: any[] = [], readonly max = Infinity, readonly order?: [string, string], readonly fields?: string[], readonly cursor?: string) {}
    doc(id: string) { return new Ref(this.path + '/' + id) }
    where(field: string, op: string, value: any) { return new Query(this.path, [...this.filters, [field, op, value]], this.max, this.order, this.fields, this.cursor) }
    orderBy(field: any, direction = 'asc') { return new Query(this.path, this.filters, this.max, [typeof field === 'string' ? field : '__name__', direction], this.fields, this.cursor) }
    limit(max: number) { return new Query(this.path, this.filters, max, this.order, this.fields, this.cursor) }
    select(...fields: string[]) { return new Query(this.path, this.filters, this.max, this.order, fields, this.cursor) }
    startAfter(cursor: string) { return new Query(this.path, this.filters, this.max, this.order, this.fields, cursor) }
    count() { return { get: async () => { const result = await this.get(); return { data: () => ({ count: result.size }) } } } }
    async get() {
      const failure = failures.get(this.path + (this.order ? ':ordered' : '')) ?? failures.get(this.path)
      if (failure !== undefined) throw Object.assign(new Error('Fixture query failure'), { code: failure })
      let found = [...data.entries()].filter(([path, row]) => path.startsWith(this.path + '/') && path.split('/').length === this.path.split('/').length + 1 && this.filters.every(([field, op, expected]) => {
        const actual = row[field]
        if (op === '==') return actual === expected
        if (op === 'in') return expected.includes(actual)
        if (actual === undefined) return false
        if (op === '<=') return comparable(actual) <= comparable(expected)
        if (op === '>=') return comparable(actual) >= comparable(expected)
        throw new Error('Unsupported fixture operator ' + op)
      }))
      if (this.order) {
        const [field, direction] = this.order
        found = found.filter(([, row]) => field === '__name__' || row[field] !== undefined)
        found.sort(([ap, a], [bp, b]) => {
          const av = field === '__name__' ? ap.split('/').pop() : comparable(a[field])
          const bv = field === '__name__' ? bp.split('/').pop() : comparable(b[field])
          return (av < bv ? -1 : av > bv ? 1 : ap.localeCompare(bp)) * (direction === 'desc' ? -1 : 1)
        })
      }
      if (this.cursor) found = found.filter(([path]) => path.split('/').pop()! > this.cursor!)
      const docs = found.slice(0, this.max).map(([path]) => snapshot(new Ref(path), this.fields))
      reads.push(...docs.map(doc => doc.ref.path))
      queries.push({ path: this.path, filters: this.filters, returned: docs.length, limit: this.max, selected: !!this.fields })
      return { docs, size: docs.length, empty: !docs.length }
    }
  }
  const db = {
    collection: (path: string) => new Query(path), doc: (path: string) => new Ref(path),
    getAll: async (...refs: Ref[]) => Promise.all(refs.map(ref => ref.get())),
    runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
      const result = tail.then(async () => {
        const pending: Write[] = []
        const tx = {
          get: async (ref: Ref | Query) => { assert.equal(pending.length, 0, 'all reads before writes'); return ref.get() },
          set: (ref: Ref, value: any, options?: { merge: boolean }) => pending.push({ ref, value, merge: options?.merge }),
          update: (ref: Ref, value: any) => pending.push({ ref, value, merge: true }),
        }
        const value = await fn(tx)
        apply(pending)
        return value
      })
      tail = result.catch(() => {})
      return result
    },
  }
  return { data, reads, writes, queries, db, failures, seed, observeReads: (fn?: (path: string) => void) => { onRead = fn },
    reset() { data.clear(); versions.clear(); reads.length = writes.length = queries.length = 0; sequence = 0; failures.clear(); onRead = undefined } }
}
