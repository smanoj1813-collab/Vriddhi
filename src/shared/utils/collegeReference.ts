/**
 * College reference resolution for operator-facing forms.
 *
 * Claims, profile rows and every tenant rule key on the college's Firestore
 * document id — an opaque auto-id ("k3Jd9sLp2QwErTyUiOp1") that appears
 * nowhere in the product except the URL. Operators, however, know their
 * college by the *code* they chose on Create College: the Colleges page shows
 * it and the CSV importers key on it. The old free-text "College ID" box on
 * Access Control accepted only the document id, so a perfectly correct code
 * was refused as "college does not exist".
 *
 * This resolver accepts the id, the code (case/whitespace-insensitive) or the
 * exact name, and returns null rather than guessing when a code or name is
 * shared by more than one college. The backend applies the same precedence
 * (functions/src/collegeResolve.ts), so anything that resolves here resolves
 * there too.
 */

export interface CollegeOption {
  id: string
  name: string
  code: string
}

export const squashCollegeText = (value: string): string =>
  String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

/** "Name (CODE)" for lists; falls back to whatever identifies the college. */
export const collegeLabel = (c: CollegeOption): string =>
  c.code ? `${c.name || c.id} (${c.code})` : c.name || c.id

export function resolveCollegeInput(typed: string, colleges: CollegeOption[]): CollegeOption | null {
  const value = String(typed ?? '').trim()
  if (!value) return null

  const byId = colleges.find(c => c.id === value)
  if (byId) return byId

  // Exact code first, then case/whitespace-insensitive — same precedence as
  // the backend, so an exact code still wins when a case-variant duplicate
  // exists, and a loose hit on several colleges is refused rather than guessed.
  const exactCode = colleges.filter(c => c.code && c.code.trim() === value)
  if (exactCode.length === 1) return exactCode[0]
  if (exactCode.length > 1) return null

  const byCode = colleges.filter(c => c.code && squashCollegeText(c.code) === squashCollegeText(value))
  if (byCode.length === 1) return byCode[0]
  if (byCode.length > 1) return null

  const byName = colleges.filter(c => c.name && squashCollegeText(c.name) === squashCollegeText(value))
  if (byName.length === 1) return byName[0]
  return null
}

/** Substring match over the label or an exact id, for the picker's filter. */
export function collegeMatchesQuery(c: CollegeOption, query: string): boolean {
  const q = squashCollegeText(query)
  if (!q) return true
  return squashCollegeText(collegeLabel(c)).includes(q) || c.id === query.trim()
}
