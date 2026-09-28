// src/shared/utils/sessionErrorMessage.ts
//
// What to SAY when a class-session callable refuses.
//
// WHY THIS IS ITS OWN MODULE: it is pure. `classSessionApi.ts` imports
// `firebase/functions`, so a unit test cannot reach into it, and the bug this
// fixes was exactly a piece of copy nobody could test — one shared
// code→message table answered every failure of every callable in the file with
// "Only college administrators (admin, principal, HOD) can generate or cancel
// class sessions." A faculty member pressing "Mark topics covered" on their own
// class was told the feature was admin-only, and the server's actual reason —
// an unrecognised account, another teacher's class, another college's class —
// was thrown away, because the Firebase SDK puts the HttpsError message in
// `error.message` and the old `toMessage()` ignored it.
//
// The rule the tables encode: a permission problem in this area has several
// causes and only ONE of them is "you are not an administrator". Never tell a
// teacher that about their own class.

/**
 * Generating and cancelling the timetable is a scheduling-administration act.
 */
export const SCHEDULING_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'Your session has expired. Sign out and back in, then try again.',
  'functions/permission-denied':
    'Only college administrators (admin, principal, HOD) can generate or cancel class sessions.',
  'functions/invalid-argument': 'The date range is not valid. Use a start and end date within one term (92 days).',
  'functions/not-found': 'That weekly schedule no longer exists. Refresh the page and try again.',
  // S2.5: most failed-preconditions in this module are the server refusing a
  // double-booking, so the copy leads with that and names the escape hatch.
  'functions/failed-precondition':
    'This would double-book a faculty member or a room. Fix the timetable first, or skip the conflicting slots.',
}

/**
 * Ensuring, completing and reading progress on a class is what a teacher does
 * in front of their own class — the opposite audience to the table above.
 */
export const SESSION_WRITER_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'Your session has expired. Sign out and back in, then try again.',
  'functions/permission-denied':
    'This class session is not yours to change. You can only manage your own classes — if this is your class, sign out and back in, or ask your college admin to run Access Control → Identity repair.',
  'functions/invalid-argument': 'That request was not valid. Reload the page and try again.',
  'functions/not-found': 'That class session no longer exists. Reload the page and try again.',
  'functions/failed-precondition': 'This class cannot be completed in its current state.',
}

/**
 * The message the callable actually sent. For a v2 httpsCallable the Firebase
 * SDK puts the HttpsError message here, so this is the one piece of copy that
 * names the real cause — it must never be dropped in favour of a generic line.
 */
export function serverMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : String((error as { message?: string } | null)?.message || '')
  return raw
    .replace(/^Firebase:\s*/i, '')
    // The SDK appends the status code and a full stop: "… (functions/x)."
    .replace(/\s*\(\s*functions\/[a-z-]+\s*\)\s*\.?\s*$/i, '')
    .trim()
}

/**
 * Resolve what to show: the table frames the code ("what this means for you"),
 * the server's own message is appended whenever it adds something, and the page
 * never sees a raw stack or a bare code.
 */
export function describeSessionError(
  error: unknown,
  fallback: string,
  messages: Record<string, string> = SCHEDULING_MESSAGES
): string {
  const code = String((error as { code?: string } | null)?.code || '')
  const framed = messages[code] || fallback
  const detail = serverMessage(error)
  if (!detail || detail === framed) return framed
  return `${framed} (${detail})`
}

/** True when a callable failure is an authorisation refusal. */
export function isSessionPermissionDenied(error: unknown): boolean {
  return String((error as { code?: string } | null)?.code || '').includes('permission-denied')
}
