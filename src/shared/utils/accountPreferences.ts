// Non-security preferences are an optional, account-isolated UI cache. Cloud
// records are authoritative. Never adopt an unattributed, browser-wide legacy
// value: on a shared device it may belong to a different person.
export const FACULTY_NOTIFICATION_DEFAULTS = {
  classes: true, attendance: true, assignments: true, announcements: true,
}
export const STUDENT_NOTIFICATION_DEFAULTS = {
  exams: true, fees: true, assignments: true, events: true,
}
export const ADMIN_NOTIFICATION_DEFAULTS = {
  emailAssessments: true, smsAttendance: true, weeklyReports: false,
  milestoneAlerts: true, maintenance: true, pushEnabled: true,
}

export function booleanPreferences<T extends Record<string, boolean>>(defaults: T, value: unknown): T {
  const result = { ...defaults }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const source = value as Record<string, unknown>
    for (const key of Object.keys(defaults) as Array<keyof T>) {
      if (typeof source[key as string] === 'boolean') result[key] = source[key as string] as T[keyof T]
    }
  }
  return result
}

export function readAccountPreferences<T extends Record<string, boolean>>(base: string, uid: string | null | undefined, defaults: T): T {
  if (!uid) return { ...defaults }
  try {
    const raw = localStorage.getItem(`${base}__${uid}`)
    return booleanPreferences(defaults, raw ? JSON.parse(raw) : null)
  } catch {
    return { ...defaults }
  }
}

export function cacheAccountPreferences<T extends Record<string, boolean>>(base: string, uid: string, defaults: T, value: T): void {
  if (!uid) return
  try {
    localStorage.setItem(`${base}__${uid}`, JSON.stringify(booleanPreferences(defaults, value)))
    localStorage.removeItem(base)
  } catch {
    // A successful server save is still successful when storage is unavailable.
  }
}
