// Mentor assignment normalisation shared by student onboarding.
//
// Faculty profiles are keyed by a human-facing faculty code (for example
// FAC001), while authorization and faculty-owned data use the Firebase Auth uid.
// Student CSVs historically called the column "Mentor" and could contain the
// code, name, email, profile id, or uid. Resolve all unambiguous forms to the uid
// once during import and retain the display/stable-code fields for compatibility.

export interface FacultyMentorProfile {
  docId: string
  data: Record<string, unknown>
}

export interface ResolvedMentorAssignment {
  /** Firebase Auth uid used for ownership and queries. */
  mentorId: string
  /** Stable human-facing faculty/profile id, e.g. FAC001. */
  mentorFacultyId: string
  /** Display name. */
  mentor: string
}

export type MentorDirectory = Map<string, ResolvedMentorAssignment>

export function normalizeMentorReference(value: unknown): string {
  return String(value ?? '').trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ')
}

function displayName(data: Record<string, unknown>): string {
  const explicit = String(data.name ?? '').trim()
  if (explicit) return explicit
  return `${String(data.firstName ?? '').trim()} ${String(data.lastName ?? '').trim()}`.trim()
}

/**
 * Build an alias directory. Ambiguous aliases (normally duplicate names) are
 * deliberately removed instead of assigning a student to whichever document
 * Firestore happened to return first.
 */
export function buildMentorDirectory(profiles: FacultyMentorProfile[]): MentorDirectory {
  const directory = new Map<string, ResolvedMentorAssignment>()
  const ambiguous = new Set<string>()

  for (const profile of profiles) {
    const data = profile.data
    const uid = String(data.uid ?? '').trim()
    if (!uid) continue

    const facultyId = String(data.facultyId ?? data.id ?? profile.docId).trim() || profile.docId
    const name = displayName(data)
    const assignment: ResolvedMentorAssignment = {
      mentorId: uid,
      mentorFacultyId: facultyId,
      mentor: name || facultyId,
    }
    const aliases = [profile.docId, facultyId, uid, data.email, name]

    for (const alias of aliases) {
      const key = normalizeMentorReference(alias)
      if (!key || ambiguous.has(key)) continue
      const existing = directory.get(key)
      if (existing && existing.mentorId !== uid) {
        directory.delete(key)
        ambiguous.add(key)
      } else {
        directory.set(key, assignment)
      }
    }
  }

  return directory
}

export function resolveMentorAssignment(
  directory: MentorDirectory,
  rawReference: unknown
): ResolvedMentorAssignment | null {
  const key = normalizeMentorReference(rawReference)
  return key ? directory.get(key) ?? null : null
}
