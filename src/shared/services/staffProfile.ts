import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/data'
import { auth } from '@/Firebase/config'

export interface StaffSettings {
  uid: string
  name: string
  phone: string
  email: string
  department: string
  collegeId: string | null
  notificationPrefs: unknown
  appearance: unknown
}
export interface StaffProfileUpdate {
  name?: string
  phone?: string
  notificationPrefs?: Record<string, boolean>
}
interface StaffProfileResult {
  success: boolean
  uid: string
  authDisplayNameSynced: boolean
}

/** The server chooses the canonical document. No role, tenant or target ID is sent. */
export async function getMyStaffSettings(): Promise<StaffSettings> {
  const { data } = await httpsCallable<void, StaffSettings>(functions, 'getMyStaffSettings')()
  return data
}

export async function updateMyStaffProfile(uid: string, patch: StaffProfileUpdate): Promise<StaffProfileResult> {
  if (!uid || auth.currentUser?.uid !== uid) throw new Error('Your account changed. Reopen settings and try again.')
  const { data } = await httpsCallable<StaffProfileUpdate, StaffProfileResult>(functions, 'updateMyStaffProfile')(patch)
  if (!data?.success || data.uid !== uid) throw new Error('The profile save could not be confirmed. Reload settings before retrying.')
  return data
}
