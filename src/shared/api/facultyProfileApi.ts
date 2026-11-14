// One college-scoped resolver for the faculty profile behind an Auth identity.
// Faculty profiles are top-level documents, often keyed FAC001 rather than uid.
import { collection, documentId, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '@/Firebase/data'
import { normalizeSessionDate } from '@/shared/utils/sessionDate'

export interface FacultyProfile {
  id: string
  collegeId: string
  uid?: string
  facultyId?: string
  legacyId?: string
  name?: string
  firstName?: string
  lastName?: string
  designation?: string
  department?: string
  email: string
  joiningDate?: string
  papersUploaded?: number
}

export interface FacultyProfileLookup {
  collegeId: string
  uid?: string | null
  email?: string | null
}

export interface FacultyTimelineIdentity {
  collegeId: string
  ids: string[]
  emails: string[]
  names: string[]
}

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''
const unique = (values: Array<string | null | undefined>): string[] => [...new Set(values.map(text).filter(Boolean))]

export function facultyIdentityFor(
  user: { uid: string; collegeId: string; email?: string | null; name?: string | null },
  profile: FacultyProfile | null,
): FacultyTimelineIdentity {
  return {
    collegeId: user.collegeId,
    ids: unique([user.uid, profile?.id, profile?.uid, profile?.facultyId, profile?.legacyId]),
    emails: unique([user.email, profile?.email]).map(email => email.toLowerCase()),
    names: unique([profile?.name, [profile?.firstName, profile?.lastName].filter(Boolean).join(' '), user.name]),
  }
}

export async function fetchFacultyProfile({ collegeId, uid, email }: FacultyProfileLookup): Promise<FacultyProfile | null> {
  if (!collegeId.trim()) throw new Error('A college is required to load a faculty profile.')

  const lookup = async (field: string, value: string): Promise<FacultyProfile | null> => {
    const snap = await getDocs(query(
      collection(db, 'faculty'),
      where('collegeId', '==', collegeId),
      where(field === '__name__' ? documentId() : field, '==', value),
      limit(2),
    ))
    if (snap.size > 1) {
      throw new Error('More than one faculty profile matches this sign-in. Ask your college administrator to repair the profile link.')
    }
    const match = snap.docs[0]
    if (!match) return null
    const data = match.data()
    // The query is tenant-scoped; keep this check as defence in depth too.
    if (data.collegeId !== collegeId) return null
    return {
      id: match.id,
      collegeId,
      uid: text(data.uid),
      facultyId: text(data.facultyId),
      legacyId: text(data.id),
      name: text(data.name),
      firstName: text(data.firstName),
      lastName: text(data.lastName),
      designation: text(data.designation),
      department: text(data.department),
      email: text(data.email),
      joiningDate: normalizeSessionDate(data.joiningDate),
      papersUploaded: typeof data.papersUploaded === 'number' && Number.isFinite(data.papersUploaded) && data.papersUploaded >= 0
        ? data.papersUploaded : undefined,
    }
  }

  const id = text(uid)
  if (id) {
    const byUid = await lookup('uid', id)
    if (byUid) return byUid
    const byDocument = await lookup('__name__', id)
    if (byDocument) return byDocument
    const byFacultyId = await lookup('facultyId', id)
    if (byFacultyId) return byFacultyId
  }
  // Imports and older accounts may have an email but no uid link yet.
  for (const address of unique([email?.toLowerCase(), email])) {
    const byEmail = await lookup('email', address)
    if (byEmail) return byEmail
  }
  return null
}
