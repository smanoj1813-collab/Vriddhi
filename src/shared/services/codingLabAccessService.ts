import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/Firebase/config'

const configDoc = (collegeId: string) => doc(db, 'colleges', collegeId, 'config', 'codingLab')

/** Fails closed: no config or a read error can never grant college access. */
export async function fetchCollegeCodingLabAccess(collegeId: string): Promise<boolean> {
  const id = collegeId.trim()
  if (!id) return false
  const snapshot = await getDoc(configDoc(id))
  return snapshot.exists() && snapshot.data().enabled === true
}

/** Superadmin-only under Firestore rules; enforcement also happens in the runner callable. */
export async function saveCollegeCodingLabAccess(
  collegeId: string,
  enabled: boolean,
  updatedBy: string,
): Promise<void> {
  const id = collegeId.trim()
  if (!id) throw new Error('Choose a college before saving Coding Lab access.')
  await setDoc(configDoc(id), {
    enabled,
    updatedAt: serverTimestamp(),
    updatedBy: updatedBy.trim(),
  }, { merge: true })
}
