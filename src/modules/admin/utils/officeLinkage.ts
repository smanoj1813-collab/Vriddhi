// src/modules/admin/utils/officeLinkage.ts
//
// Why the finance / operations desk is looking at an empty college.
//
// The office portals are the only part of the app whose tenant comes from a
// LOCAL value (`vriddhi_college_id`, written by AuthContext from the verified
// identity) while the Cloud Functions and the Firestore rules take the tenant
// from the ID-token CLAIM. Those two are the same value when everything is
// healthy, and drift apart silently in four ways:
//
//   1. the account has no collegeId claim  → every tenant read is refused,
//      while the header still shows a college name (it reads the profile
//      document). The desk looks empty and nothing says why;
//   2. the account is not linked to any college at all → the query builder
//      throws "This sign-in carries no college";
//   3. the deployed rules predate the office roles → the refusal arrives as
//      "Missing or insufficient permissions";
//   4. the college genuinely has no students yet.
//
// All four used to render as ONE thing: an empty list, and — in the Record
// Payment modal — the sentence "No students found for this college." That sends
// the accounts team to audit student imports when the account is the problem.
//
// Pure and dependency-free, so the copy is unit-tested rather than trusted.

/** Why a college-scoped read came back without data. */
export type OfficeLinkageFailure =
  | 'no-college'
  | 'permission-denied'
  | 'missing-index'
  | 'unknown'

export interface OfficeLinkageFacts {
  /** Firebase error code, e.g. `permission-denied` or a callable code. */
  code?: unknown
  /** Error message. */
  message?: unknown
  /**
   * The college the query was scoped to, when one is known. An empty string
   * is itself the diagnosis: the account never resolved a college.
   */
  collegeId?: string | null
}

/** Classify a failed office read. Mirrors the message shapes used app-wide. */
export function classifyOfficeLinkageFailure(facts: OfficeLinkageFacts): OfficeLinkageFailure {
  const code = String(facts.code ?? '').toLowerCase()
  const message = String(facts.message ?? '')
  const haystack = `${code} ${message}`.toLowerCase()

  if (!String(facts.collegeId ?? '').trim() || /carries no college|no college selected/.test(haystack)) {
    return 'no-college'
  }
  if (
    code.includes('permission-denied') ||
    code.includes('insufficient-permissions') ||
    /missing or insufficient permissions/.test(haystack)
  ) {
    return 'permission-denied'
  }
  // The SDK's two shapes: "The query requires an index. You can enable it
  // here: …" and "failed to get document because the backend encountered an
  // error." (the latter is what a composite-index gap reports on a `get`).
  if (/requires an index|needs an index|missing or required index|failed to get document because the backend/.test(haystack)) {
    return 'missing-index'
  }
  return 'unknown'
}

/**
 * What the desk should be told. Every branch names the ONE action that fixes
 * it, because the operator reading this has no access to the console.
 */
export function describeOfficeLinkageFailure(
  failure: OfficeLinkageFailure,
  context: { desk: string; collegeName?: string }
): string {
  const where = context.collegeName ? `${context.collegeName}` : 'this college'
  switch (failure) {
    case 'no-college':
      return (
        `Your sign-in is not linked to a college, so the ${context.desk} cannot read anything for ${where}. ` +
        `Sign out and sign back in to refresh your token. If it persists, a superadmin must re-issue your ` +
        `role/college claims (Access Control → Admins → your account), and make sure the account row names a college.`
      )
    case 'permission-denied':
      return (
        `Security rules refused this ${context.desk} read, so nothing is shown for ${where}. This usually means ` +
        `your sign-in token carries no college claim (sign out and back in), or the deployed security rules are ` +
        `older than this app. If a sign-out does not help, ask a superadmin to redeploy the rules ` +
        `(npm run deploy:rules) and run Access Control → Identity repair for your account.`
      )
    case 'missing-index':
      return (
        `This ${context.desk} query needs a Firestore index that has not been created yet, so nothing could be ` +
        `loaded for ${where}. Ask a superadmin to run npm run deploy:indexes, then reload.`
      )
    default:
      return (
        `Could not load the ${context.desk} data for ${where}. The details are in the browser console; ` +
        `retry, and if it keeps failing ask a superadmin to check this account's college link.`
      )
  }
}

/**
 * The empty-state sentence for a list that loaded successfully and is empty.
 * Deliberately different from every failure message above: "nothing here" and
 * "you may not see anything here" must never look the same.
 */
export function describeOfficeEmptyState(subject: string, collegeName?: string): string {
  const where = collegeName ? ` in ${collegeName}` : ''
  return `No ${subject} found${where}.`
}
