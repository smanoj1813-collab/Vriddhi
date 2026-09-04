// src/modules/student/services/studentRecordResolver.ts
// ------------------------------------------------------------------
// Resolve "the student record that belongs to this signed-in uid" using only
// document reads the caller is guaranteed to be allowed to perform.
//
// WHY
// The previous implementation searched `students` with queries
// (`where('userId','==',uid)`). Firestore rules CANNOT authorise a LIST for a
// student: a list request has no `resource`, so the ownership test
// (`resource.data.userId == request.auth.uid`) cannot be evaluated and the whole
// query is denied with "Missing or insufficient permissions". The result was
// that a perfectly valid, correctly provisioned student landed on a dashboard
// saying "your account is not linked to a student profile".
//
// HOW
// Provisioning stores `users/{uid}.studentDocId` (and `collegeId`/`regNo`).
// `users/{uid}` is the caller's own document, so rules allow the read
// (`isOwner`), and reading `students/{thatId}` then satisfies
// `ownsStudentProfile` because the doc id is known. Two owned `get` reads, no
// query, no composite index, no permission ambiguity.
//
// The legacy order (document id == uid, then queries) is kept afterwards purely
// so accounts that predate `studentDocId` keep working as they always did —
// Access Control → Identity repair backfills the field for them.
// ------------------------------------------------------------------
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '@/Firebase/config'

export interface ResolvedStudentRecord {
  id: string
  data: Record<string, any>
  /** How the record was found — surfaced in diagnostics only. */
  via: 'users.studentDocId' | 'collegeMirror' | 'documentId' | 'userIdQuery' | 'uidQuery'
}

export interface StudentLookupResult {
  record: ResolvedStudentRecord | null
  /** True when a read was refused by the rules — a config problem, not a data one. */
  permissionDenied: boolean
  errors: string[]
}

/**
 * @param uid  Firebase Auth uid of the signed-in student
 * @param email optional fallback used only by the final legacy query
 */
export async function resolveStudentRecord(uid: string, email?: string): Promise<StudentLookupResult> {
  const errors: string[] = []
  let permissionDenied = false

  if (!uid) return { record: null, permissionDenied, errors: ['no uid'] }

  // 1. The caller's own lookup document, which names the student record.
  let lookup: Record<string, any> | null = null
  try {
    const usersSnap = await getDoc(doc(db, 'users', uid))
    if (usersSnap.exists()) lookup = usersSnap.data() as Record<string, any>
  } catch (err: any) {
    permissionDenied = permissionDenied || isPermissionError(err)
    errors.push(`users/${uid}: ${err?.message || err}`)
  }

  if (lookup) {
    const studentDocId = typeof lookup.studentDocId === 'string' ? lookup.studentDocId : null
    if (studentDocId) {
      try {
        const snap = await getDoc(doc(db, 'students', studentDocId))
        if (snap.exists()) {
          return {
            record: { id: snap.id, data: snap.data() as Record<string, any>, via: 'users.studentDocId' },
            permissionDenied,
            errors,
          }
        }
      } catch (err: any) {
        permissionDenied = permissionDenied || isPermissionError(err)
        errors.push(`students/${studentDocId}: ${err?.message || err}`)
      }
    }

    // 2. The per-college mirror written by provisioning (id == registration no).
    const collegeId = typeof lookup.collegeId === 'string' ? lookup.collegeId : null
    const regNo = typeof lookup.regNo === 'string' ? lookup.regNo : null
    if (collegeId && regNo) {
      try {
        const snap = await getDoc(doc(db, 'colleges', collegeId, 'students', regNo))
        if (snap.exists()) {
          return {
            record: { id: snap.id, data: snap.data() as Record<string, any>, via: 'collegeMirror' },
            permissionDenied,
            errors,
          }
        }
      } catch (err: any) {
        permissionDenied = permissionDenied || isPermissionError(err)
        errors.push(`colleges/${collegeId}/students/${regNo}: ${err?.message || err}`)
      }
    }
  }

  // 3. Legacy: profile document keyed by the uid itself.
  try {
    const byId = await getDoc(doc(db, 'students', uid))
    if (byId.exists()) {
      return { record: { id: byId.id, data: byId.data() as Record<string, any>, via: 'documentId' }, permissionDenied, errors }
    }
  } catch (err: any) {
    permissionDenied = permissionDenied || isPermissionError(err)
    errors.push(`students/${uid}: ${err?.message || err}`)
  }

  // 4/5. Legacy queries. Kept because staff-operated screens reuse this
  // resolver and a staff LIST on `students` IS allowed by the rules; for a
  // student these fail with permission-denied, which we report rather than
  // turning into "no profile".
  for (const [field, value, via] of [
    ['userId', uid, 'userIdQuery'],
    ['uid', uid, 'uidQuery'],
  ] as const) {
    try {
      const snap = await getDocs(query(collection(db, 'students'), where(field, '==', value), limit(1)))
      if (!snap.empty) {
        const d = snap.docs[0]
        return { record: { id: d.id, data: d.data() as Record<string, any>, via }, permissionDenied, errors }
      }
    } catch (err: any) {
      permissionDenied = permissionDenied || isPermissionError(err)
      errors.push(`students where ${field}: ${err?.message || err}`)
    }
  }

  if (email) {
    try {
      const snap = await getDocs(query(collection(db, 'students'), where('email', '==', email), limit(1)))
      if (!snap.empty) {
        const d = snap.docs[0]
        const data = d.data() as Record<string, any>
        // An email match alone is not ownership; only accept it when the row
        // points back at this uid.
        if (data.userId === uid || data.uid === uid || d.id === uid) {
          return { record: { id: d.id, data, via: 'userIdQuery' }, permissionDenied, errors }
        }
        errors.push('email match found but it is not linked to this uid — ignored')
      }
    } catch (err: any) {
      permissionDenied = permissionDenied || isPermissionError(err)
      errors.push(`students where email: ${err?.message || err}`)
    }
  }

  return { record: null, permissionDenied, errors }
}

function isPermissionError(err: any): boolean {
  const code = String(err?.code || '').toLowerCase()
  return (
    code.includes('permission-denied') ||
    code.includes('failed-precondition') ||
    /missing or insufficient permissions/i.test(String(err?.message || ''))
  )
}
