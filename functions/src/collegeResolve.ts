// ─────────────────────────────────────────────────────────────────────────────
// College reference resolution — turn whatever an operator typed into a live
// colleges/{id} document.
//
// WHY THIS EXISTS
// Every college-scoped write (claims, profile rows, tenant rules) keys on the
// Firestore document id of the college, which is an opaque auto-id such as
// "k3Jd9sLp2QwErTyUiOp1". Nothing in the product calls that string the
// "College ID", though: the Create College form asks for a *College Code*
// (e.g. "VDC-001"), the Colleges list shows the code, and the CSV importers
// key on the code. So when Access Control asked for a "College ID" the
// operator naturally pasted the code — and grantUserRole, which only tried
// `colleges/{value}`, refused it as a college that "does not exist" even
// though the operator had copied the id they knew exactly.
//
// This resolver accepts the document id, the college code (exact, then
// case-insensitive) or the exact college name (case/whitespace-insensitive),
// and refuses to guess when a code or name matches more than one college.
// ─────────────────────────────────────────────────────────────────────────────

import type * as admin from 'firebase-admin'

export interface CollegeRef {
  id: string
  name: string
  code: string
}

export type CollegeResolution =
  | { kind: 'resolved'; college: CollegeRef; matchedBy: 'id' | 'code' | 'name' }
  | { kind: 'ambiguous'; candidates: CollegeRef[]; matchedBy: 'code' | 'name' }
  | { kind: 'not-found'; known: CollegeRef[] }

const norm = (value: unknown): string => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Pure matcher over an in-memory college list. Precedence: document id →
 * exact code → case-insensitive code → case/whitespace-insensitive name.
 * A tier that matches several colleges is reported as ambiguous rather than
 * falling through to a looser tier — silently picking one is how an admin
 * ends up scoped to the wrong tenant.
 */
export function pickCollege(rawValue: string, colleges: CollegeRef[]): CollegeResolution {
  const value = String(rawValue ?? '').trim()
  if (!value) return { kind: 'not-found', known: colleges }

  const byId = colleges.find((c) => c.id === value)
  if (byId) return { kind: 'resolved', college: byId, matchedBy: 'id' }

  const exactCode = colleges.filter((c) => c.code && c.code.trim() === value)
  if (exactCode.length === 1) return { kind: 'resolved', college: exactCode[0], matchedBy: 'code' }
  if (exactCode.length > 1) return { kind: 'ambiguous', candidates: exactCode, matchedBy: 'code' }

  const looseCode = colleges.filter((c) => c.code && norm(c.code) === norm(value))
  if (looseCode.length === 1) return { kind: 'resolved', college: looseCode[0], matchedBy: 'code' }
  if (looseCode.length > 1) return { kind: 'ambiguous', candidates: looseCode, matchedBy: 'code' }

  const byName = colleges.filter((c) => c.name && norm(c.name) === norm(value))
  if (byName.length === 1) return { kind: 'resolved', college: byName[0], matchedBy: 'name' }
  if (byName.length > 1) return { kind: 'ambiguous', candidates: byName, matchedBy: 'name' }

  return { kind: 'not-found', known: colleges }
}

const label = (c: CollegeRef): string => (c.code ? `${c.name || c.id} (${c.code})` : c.name || c.id)

/**
 * Human-readable explanation for a failed resolution. Lists what the operator
 * can type so the next attempt succeeds instead of sending them to the
 * Firestore console.
 */
export function describeCollegeResolutionFailure(
  value: string,
  result: Exclude<CollegeResolution, { kind: 'resolved' }>,
): string {
  if (result.kind === 'ambiguous') {
    return (
      `"${value}" matches ${result.candidates.length} colleges by ${result.matchedBy} ` +
      `(${result.candidates.map((c) => `${label(c)} → id ${c.id}`).join('; ')}). ` +
      `Pick the college from the list, or enter the document id of the one you mean.`
    )
  }
  const known = result.known.filter((c) => c.code || c.name).slice(0, 8).map(label)
  const hint = known.length
    ? ` Known colleges: ${known.join(', ')}${result.known.length > 8 ? `, … (${result.known.length} total)` : ''}.`
    : ' No colleges exist yet — create the college first (Superadmin → Colleges → Create).'
  return (
    `No college matches "${value}". Enter the college code exactly as shown on the Colleges page, ` +
    `the college name, or the document id (Colleges → View Details → the id in the URL).${hint}`
  )
}

/**
 * Firestore-backed resolution. Tries the cheap direct read first, then
 * falls back to the pure matcher over the (small) colleges collection.
 */
export async function resolveCollegeReference(
  db: admin.firestore.Firestore,
  rawValue: string,
): Promise<CollegeResolution> {
  const value = String(rawValue ?? '').trim()
  if (!value) return { kind: 'not-found', known: [] }

  const direct = await db.doc(`colleges/${value}`).get()
  if (direct.exists) {
    const c = direct.data() || {}
    return {
      kind: 'resolved',
      college: { id: direct.id, name: String(c.name || ''), code: String(c.code || '') },
      matchedBy: 'id',
    }
  }

  // Tenant count is small (tens, not thousands), so one bounded list read is
  // cheaper and more robust than a chain of exact-match queries that cannot
  // express case-insensitivity anyway.
  const snap = await db.collection('colleges').limit(500).get()
  const colleges: CollegeRef[] = snap.docs.map((d) => {
    const c = d.data() || {}
    return { id: d.id, name: String(c.name || ''), code: String(c.code || '') }
  })
  return pickCollege(value, colleges)
}
