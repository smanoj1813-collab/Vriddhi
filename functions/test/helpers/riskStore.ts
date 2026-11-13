import assert from 'node:assert/strict'

/** Atomic in-memory SDK boundary for real risk callables. This is intentionally
 * not a rules emulator; no deployed project/network is used by these tests. */
export function makeRiskStore() {
  const data = new Map<string, Record<string, any>>()
  const accounts = new Map<string, any>()
  const failedCollections = new Set<string>()
  const pushes: any[] = []
  const reads: string[] = []
  let nextId = 0
  let failPush = false
  let transactionTail: Promise<unknown> = Promise.resolve()
  const clone = (v: any) => v === undefined ? undefined : structuredClone(v)
  class Ref {
    constructor(readonly path: string) {}
    get id() { return this.path.split('/').pop()! }
    collection(name: string) { return new Query(`${this.path}/${name}`) }
    async get() { reads.push(this.path); if (failedCollections.has(this.path.split('/')[0])) throw new Error('Fixture read failure'); return snap(this) }
    async set(value: any, options?: { merge?: boolean }) { apply([{ op: 'set', ref: this, value, options }]) }
    async update(value: any) { apply([{ op: 'update', ref: this, value }]) }
    async delete() { apply([{ op: 'delete', ref: this }]) }
  }
  class Query {
    constructor(readonly path: string, readonly filters: Array<[string, string, any]> = [], readonly max = Infinity, readonly ordering?: [string, string], readonly after?: string) {}
    where(field: string, op: string, value: unknown) { return new Query(this.path, [...this.filters, [field, op, value]], this.max, this.ordering, this.after) }
    limit(max: number) { return new Query(this.path, this.filters, max, this.ordering, this.after) }
    orderBy(field: string | { _documentId: boolean }, direction = 'asc') { return new Query(this.path, this.filters, this.max, [typeof field === 'string' ? field : '__name__', direction], this.after) }
    startAfter(value: string) { return new Query(this.path, this.filters, this.max, this.ordering, value) }
    doc(id = `auto-${++nextId}`) { return new Ref(`${this.path}/${id}`) }
    async get() {
      reads.push(this.path)
      if (failedCollections.has(this.path.split('/')[0])) throw new Error('Fixture read failure')
      let rows = [...data.entries()].filter(([path, value]) => path.startsWith(`${this.path}/`) && path.split('/').length === this.path.split('/').length + 1 && this.filters.every(([field, op, expected]) => {
        const actual = value[field]
        if (op === '==') return actual === expected
        if (op === 'in') return expected.includes(actual)
        if (op === '>=') return actual >= expected
        if (op === '<=') return actual <= expected
        throw new Error(`Unimplemented fixture operator ${op}`)
      }))
      if (this.ordering) {
        const [field, direction] = this.ordering
        rows = rows.filter(([, value]) => field === '__name__' || value[field] !== undefined)
        rows.sort(([ap, a], [bp, b]) => {
          const av = field === '__name__' ? ap.split('/').pop()! : a[field]
          const bv = field === '__name__' ? bp.split('/').pop()! : b[field]
          return (av < bv ? -1 : av > bv ? 1 : 0) * (direction === 'desc' ? -1 : 1)
        })
      }
      if (this.after) rows = rows.filter(([p]) => p.split('/').pop()! > this.after!)
      const docs = rows.slice(0, this.max).map(([p]) => snap(new Ref(p)))
      return { docs, empty: !docs.length, size: docs.length }
    }
  }
  function snap(ref: Ref) {
    return { id: ref.id, ref, exists: data.has(ref.path), data: () => clone(data.get(ref.path)) }
  }
  type Write = { op: string; ref: Ref; value?: any; options?: { merge?: boolean } }
  function apply(writes: Write[]) {
    assert.ok(writes.length <= 500, 'Firestore write batch is capped at 500')
    const next = new Map(data)
    for (const w of writes) {
      if (w.op === 'create') assert.ok(!next.has(w.ref.path), 'create is not overwrite')
      if (w.op === 'update') assert.ok(next.has(w.ref.path), 'update needs an existing row')
      if (w.op === 'delete') next.delete(w.ref.path)
      else next.set(w.ref.path, w.op === 'update' || w.options?.merge ? { ...next.get(w.ref.path), ...clone(w.value) } : clone(w.value))
    }
    data.clear(); for (const [path, value] of next) data.set(path, value)
  }
  const batch = () => {
    const writes: Write[] = []
    const b: any = { commit: async () => apply(writes) }
    for (const op of ['set', 'update', 'create', 'delete']) b[op] = (ref: Ref, value?: any, options?: { merge?: boolean }) => { writes.push({ op, ref, value, options }); return b }
    return b
  }
  const db = {
    collection: (name: string) => new Query(name), batch,
    getAll: async (...refs: Ref[]) => Promise.all(refs.map(r => r.get())),
    runTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
      const operation = transactionTail.then(async () => {
        let writesStarted = false
        const writes: Write[] = []
        const tx: any = { get: async (ref: Ref | Query) => { assert.equal(writesStarted, false, 'transaction reads must precede writes'); return ref.get() } }
        for (const op of ['set', 'update', 'create', 'delete']) tx[op] = (ref: Ref, value?: any, options?: { merge?: boolean }) => { writesStarted = true; writes.push({ op, ref, value, options }); return tx }
        const result = await callback(tx)
        apply(writes)
        return result
      })
      transactionTail = operation.catch(() => {})
      return operation
    },
  }
  const auth = {
    async getUser(uid: string) {
      const record = accounts.get(uid)
      if (!record) throw Object.assign(new Error('Fixture account not found'), { code: 'auth/user-not-found' })
      return clone(record)
    },
    async getUsers(ids: Array<{ uid: string }>) {
      return { users: ids.filter(i => accounts.has(i.uid)).map(i => clone(accounts.get(i.uid))), notFound: ids.filter(i => !accounts.has(i.uid)) }
    },
  }
  const messaging = { async sendEachForMulticast(message: any) { pushes.push(message); if (failPush) throw new Error('Fixture transient FCM error'); return { successCount: message.tokens.length, failureCount: 0, responses: message.tokens.map(() => ({ success: true })) } } }
  return { data, accounts, failedCollections, pushes, reads, db, auth, messaging, setFailPush: (value: boolean) => { failPush = value }, reset: () => { data.clear(); accounts.clear(); failedCollections.clear(); pushes.length = 0; reads.length = 0; failPush = false; nextId = 0 } }
}
