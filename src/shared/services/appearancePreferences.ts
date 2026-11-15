import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/Firebase/data'
import { normalizeAppearance, type AppearancePreferences } from '../theme/appearance'

// This private cosmetic document is intentionally separate from faculty,
// student and admin identity/academic records. Its rules authorize only the
// signed-in owner, even for platform accounts with no college/profile record.
function appearanceRef(uid: string) {
  if (!uid || uid.includes('/')) throw new Error('A signed-in account is required')
  return doc(db, 'users', uid, 'preferences', 'appearance')
}

export async function loadAppearancePreferences(uid: string): Promise<AppearancePreferences | null> {
  const snapshot = await getDoc(appearanceRef(uid))
  return snapshot.exists() ? normalizeAppearance(snapshot.data()) : null
}

export async function saveAppearancePreferences(uid: string, preferences: AppearancePreferences): Promise<void> {
  await setDoc(appearanceRef(uid), {
    ...normalizeAppearance(preferences),
    updatedAt: serverTimestamp(),
  })
}
