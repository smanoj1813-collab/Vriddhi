import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { DEFAULT_RISK_SETTINGS, validateRiskSettings, text, type RiskRow } from './riskCore'
import { MONTHLY_RISK_SCHEDULE, MONTHLY_RISK_PUSH_RECOVERY_SCHEDULE, RISK_SWEEP_REQUESTS, queueMonthlyRiskSweep, processMonthlyRiskSweepRequest } from './riskSweep'
import {
  filterReadableRiskAlerts, personFromAuth,
  requireRiskPerson, riskHash, validateStaffRiskSchedule,
} from './riskService'

const OPTIONS = { region: 'asia-south1', memory: '512MiB' as const, timeoutSeconds: 180, maxInstances: 20 }
const firestore = () => admin.firestore()
const row = (d: FirebaseFirestore.DocumentSnapshot): RiskRow => ({ ...d.data(), id: d.id })
const fail = (error: unknown): never => { throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Invalid configuration') }

export const getMyAcademicRiskAlerts = onCall(OPTIONS, async request => {
  const person = await requireRiskPerson(request.auth?.uid)
  const snap = await firestore().collection('riskAlerts').where('recipientUid', '==', person.uid).where('collegeId', '==', person.collegeId)
    .orderBy('updatedAt', 'desc').limit(301).get()
  const readable = await filterReadableRiskAlerts(person, snap.docs.slice(0, 300).map(row))
  // Freshness belongs to one subject run, not to timestamp-only rewrites of
  // every alert/recipient copy. Only already-authorized subjects are exposed.
  const subjects = [...new Set([person.uid, ...readable.map(a => text(a.subjectUid)).filter(Boolean)])]
  const runs = await firestore().getAll(...subjects.map(uid => firestore().collection('riskSubjectRuns').doc(riskHash(person.collegeId, uid))))
  const checked = new Map<string, number>()
  runs.forEach((run, index) => {
    const data = run.data()
    if (data?.collegeId === person.collegeId && data.subjectUid === subjects[index] && Number.isFinite(data.checkedAt)) checked.set(subjects[index], data.checkedAt)
  })
  const alerts = readable.map(a => ['active', 'unverified'].includes(a.state)
    ? { ...a, checkedAt: Math.max(Number(a.checkedAt) || 0, checked.get(text(a.subjectUid)) || 0) } : a)
  return { alerts, truncated: snap.size > 300, checkedAt: Math.max(0, ...checked.values()) || null,
    // Compatibility for cached clients: never offer the retired scan action.
    canRefresh: false, canConfigure: person.role === 'principal' }
})
export const markMyAcademicRiskAlertRead = onCall(OPTIONS, async request => {
  const person = await requireRiskPerson(request.auth?.uid)
  const id = text(request.data?.id)
  if (!/^[a-f0-9]{64}$/.test(id)) throw new HttpsError('invalid-argument', 'A valid alert is required')
  const ref = firestore().collection('riskAlerts').doc(id), snap = await ref.get()
  if (!snap.exists || !(await filterReadableRiskAlerts(person, [row(snap)])).length) throw new HttpsError('not-found', 'Alert not found')
  await ref.update({ read: true, readAt: Date.now() })
  return { success: true }
})
/** Retired callable kept as a deny-only compatibility endpoint. Removing the
 * export alone can leave an older deployed scanner reachable. No role, payload
 * or college can trigger a check here; reject before Auth-admin/Firestore I/O. */
export const refreshMyAcademicRiskAlerts = onCall({ ...OPTIONS, memory: '128MiB', timeoutSeconds: 10, maxInstances: 2 }, async request => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in to view academic alerts')
  throw new HttpsError('permission-denied', 'Manual academic risk checks are disabled. Reviews run automatically once per month.')
})
export const getAcademicRiskConfiguration = onCall(OPTIONS, async request => {
  const person = await requireRiskPerson(request.auth?.uid)
  if (person.role !== 'principal') throw new HttpsError('permission-denied', 'Only the college Principal can manage academic warning settings')
  const [config, schedules, staff] = await Promise.all([
    firestore().collection('academicRiskSettings').doc(person.collegeId).get(),
    firestore().collection('riskStaffSchedules').where('collegeId', '==', person.collegeId).limit(501).get(),
    firestore().collection('users').where('collegeId', '==', person.collegeId).where('role', 'in', ['faculty', 'mentor']).limit(501).get(),
  ])
  const faculty: Array<{ uid: string; name: string }> = []
  for (let i = 0; i < Math.min(staff.size, 500); i += 100) {
    const records = await admin.auth().getUsers(staff.docs.slice(i, i + 100).map(d => ({ uid: d.id })))
    for (const record of records.users) {
      const member = personFromAuth(record)
      if (member && member.collegeId === person.collegeId && ['faculty', 'mentor'].includes(member.role)) faculty.push({ uid: member.uid, name: member.name })
    }
  }
  return { settings: config.data()?.settings || DEFAULT_RISK_SETTINGS, revision: Number(config.data()?.revision) || 0,
    schedules: schedules.docs.slice(0, 500).map(row), faculty, truncated: schedules.size > 500 || staff.size > 500 }
})
export const saveAcademicRiskConfiguration = onCall(OPTIONS, async request => {
  const person = await requireRiskPerson(request.auth?.uid)
  if (person.role !== 'principal') throw new HttpsError('permission-denied', 'Only the college Principal can change warning thresholds')
  let settings
  try { settings = validateRiskSettings(request.data?.settings) } catch (error) { return fail(error) }
  const revision = Number(request.data?.expectedRevision)
  if (!Number.isInteger(revision) || revision < 0) throw new HttpsError('invalid-argument', 'Review the current configuration revision')
  const ref = firestore().collection('academicRiskSettings').doc(person.collegeId)
  await firestore().runTransaction(async tx => {
    const previous = await tx.get(ref)
    if ((Number(previous.data()?.revision) || 0) !== revision) throw new HttpsError('aborted', 'Settings changed. Reload before saving your changes.')
    tx.set(ref, { collegeId: person.collegeId, settings, revision: revision + 1, updatedBy: person.uid, updatedAt: Date.now() })
    tx.create(firestore().collection('riskConfigurationAudit').doc(), { collegeId: person.collegeId, type: 'thresholds', before: previous.data()?.settings || null, after: settings, revision: revision + 1, uid: person.uid, createdAt: Date.now() })
  })
  return { revision: revision + 1 }
})
export const saveFacultyRiskWorkSchedule = onCall(OPTIONS, async request => {
  const principal = await requireRiskPerson(request.auth?.uid)
  if (principal.role !== 'principal') throw new HttpsError('permission-denied', 'Only the Principal can assign the working schedule used for staff alerts')
  const uid = text(request.data?.facultyUid)
  if (!uid || uid.includes('/') || uid.length > 200) throw new HttpsError('invalid-argument', 'Choose a faculty member')
  const faculty = personFromAuth(await admin.auth().getUser(uid))
  if (!faculty || faculty.collegeId !== principal.collegeId || !['faculty', 'mentor'].includes(faculty.role)) throw new HttpsError('permission-denied', 'Choose verified teaching staff from your college')
  const ref = firestore().collection('riskStaffSchedules').doc(riskHash(principal.collegeId, uid))
  const now = Date.now()
  let schedule: ReturnType<typeof validateStaffRiskSchedule> | null = null
  if (request.data?.remove !== true) { try { schedule = validateStaffRiskSchedule(request.data?.schedule) } catch (error) { return fail(error) } }
  await firestore().runTransaction(async tx => {
    const before = await tx.get(ref)
    if (schedule) tx.set(ref, { ...schedule, collegeId: principal.collegeId, facultyUid: uid, updatedBy: principal.uid, updatedAt: now })
    else tx.delete(ref)
    tx.create(firestore().collection('riskConfigurationAudit').doc(), { collegeId: principal.collegeId, type: 'staff-schedule', facultyUid: uid, uid: principal.uid, before: before.data() || null, after: schedule, createdAt: now })
  })
  return { success: true }
})

/** Monthly snapshot, not continuous early-warning monitoring. The starter
 * only queues one cycle; bounded create-triggered chunks finish large rosters
 * in the same month instead of waiting another month after the first 1,000. */
export const sweepAcademicRiskAlerts = onSchedule({ region: 'asia-south1', schedule: MONTHLY_RISK_SCHEDULE, timeZone: 'Asia/Kolkata', memory: '256MiB', timeoutSeconds: 60, maxInstances: 1, retryCount: 3, minBackoffSeconds: 300, maxBackoffSeconds: 600 }, async event => {
  await queueMonthlyRiskSweep(event.scheduleTime)
})
export const continueAcademicRiskSweep = onDocumentCreated({ region: 'asia-south1', document: `${RISK_SWEEP_REQUESTS}/{requestId}`, memory: '1GiB', timeoutSeconds: 540, concurrency: 1, maxInstances: 1, retry: true }, async event => {
  await processMonthlyRiskSweepRequest(event.params.requestId)
})

const TOKEN_PATTERN = /^[A-Za-z0-9_:.-]{50,4096}$/
export const registerMyAcademicRiskDevice = onCall(OPTIONS, async request => {
  const person = await requireRiskPerson(request.auth?.uid)
  const token = text(request.data?.token)
  if (!TOKEN_PATTERN.test(token)) throw new HttpsError('invalid-argument', 'A valid browser push token is required')
  const ref = firestore().collection('riskPushDevices').doc(riskHash(token)), now = Date.now()
  // A browser token has ONE owner. Registering it after a shared-device account
  // switch atomically replaces the old binding instead of creating duplicates.
  await firestore().runTransaction(async tx => {
    const existing = await tx.get(ref)
    tx.set(ref, { token, uid: person.uid, collegeId: person.collegeId, role: person.role, enabled: true, updatedAt: now, createdAt: existing.data()?.createdAt || now })
  })
  const devices = await firestore().collection('riskPushDevices').where('uid', '==', person.uid).get()
  const stale = devices.docs.filter(d => d.id !== ref.id).sort((a, b) => Number(b.data().updatedAt) - Number(a.data().updatedAt)).slice(9)
  for (const d of stale) await d.ref.delete()
  return { success: true }
})
export const unregisterMyAcademicRiskDevice = onCall(OPTIONS, async request => {
  const person = await requireRiskPerson(request.auth?.uid), token = text(request.data?.token)
  if (!TOKEN_PATTERN.test(token)) throw new HttpsError('invalid-argument', 'A valid browser push token is required')
  const ref = firestore().collection('riskPushDevices').doc(riskHash(token))
  await firestore().runTransaction(async tx => { const device = await tx.get(ref); if (device.data()?.uid === person.uid) tx.delete(ref) })
  return { success: true }
})
export async function deliverAcademicRiskPush(outboxId: string) {
  const outbox = firestore().collection('riskPushOutbox').doc(outboxId), now = Date.now()
  const item = await firestore().runTransaction(async tx => {
    const doc = await tx.get(outbox), data = doc.data()
    if (!data || data.status === 'sent' || data.status === 'skipped' || Number(data.leaseUntil) > now) return null
    if (Number(data.createdAt) < now - 24 * 3_600_000 || Number(data.attempts) >= 8) { tx.update(outbox, { status: 'skipped', reason: 'delivery-window-expired', leaseUntil: 0 }); return null }
    tx.update(outbox, { leaseUntil: now + 120_000, attempts: (Number(data.attempts) || 0) + 1 })
    return data
  })
  if (!item) return
  try {
    const alert = await firestore().collection('riskAlerts').doc(String(item.alertId)).get()
    const person = await requireRiskPerson(String(item.recipientUid))
    const readable = alert.exists && alert.data()?.state === 'active' && alert.data()?.category !== 'coverage'
      && Number(alert.data()?.generation) === Number(item.generation) && (await filterReadableRiskAlerts(person, [row(alert)])).length > 0
    if (!readable) { await outbox.update({ status: 'skipped', leaseUntil: 0, finishedAt: Date.now() }); return }
    const devices = await firestore().collection('riskPushDevices').where('uid', '==', person.uid).limit(10).get()
    const current = devices.docs.filter(d => d.data().enabled === true && d.data().collegeId === person.collegeId && d.data().role === person.role && Number(d.data().updatedAt) > now - 90 * 86_400_000)
    if (!current.length) { await outbox.update({ status: 'skipped', reason: 'no-registered-device', leaseUntil: 0, finishedAt: Date.now() }); return }
    const path = person.role === 'student' ? '/student/risk-alerts' : ['faculty', 'mentor'].includes(person.role) ? '/faculty/risk-alerts' : '/admin/risk-alerts'
    // Data-only: the service worker checks the active account binding BEFORE
    // displaying a generic notification. No student/faculty/academic details
    // are sent to the lock screen, and FCM cannot auto-display stale notices.
    const response = await admin.messaging().sendEachForMulticast({ tokens: current.map(d => String(d.data().token)),
      data: { kind: 'vriddhi-academic-risk', alertId: alert.id, recipientUid: person.uid, path, generation: String(item.generation) },
      webpush: { headers: { TTL: '900', Urgency: 'normal' } } })
    let transient = false
    for (let i = 0; i < response.responses.length; i++) {
      const result = response.responses[i]
      if (result.success) continue
      const code = result.error?.code
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') await current[i].ref.delete()
      else transient = true
    }
    if (transient) throw new Error('Some push deliveries need a retry')
    await outbox.update({ status: 'sent', leaseUntil: 0, finishedAt: Date.now(), successCount: response.successCount })
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (['auth/user-not-found', 'permission-denied'].includes(code || '')) { await outbox.update({ status: 'skipped', leaseUntil: 0, finishedAt: Date.now() }); return }
    await outbox.update({ leaseUntil: 0, lastErrorAt: Date.now() })
    throw error
  }
}
export const sendAcademicRiskPush = onDocumentCreated({ region: 'asia-south1', document: 'riskPushOutbox/{outboxId}', memory: '256MiB', timeoutSeconds: 120, retry: true, maxInstances: 10 }, async event => {
  await deliverAcademicRiskPush(event.params.outboxId)
})
/** Monthly recovery after the review, not a permanent 15-minute poller.
 * Transient sends still use the create trigger's retries and 24-hour budget. */
export const retryAcademicRiskPush = onSchedule({ region: 'asia-south1', schedule: MONTHLY_RISK_PUSH_RECOVERY_SCHEDULE, timeZone: 'Asia/Kolkata', timeoutSeconds: 180, maxInstances: 1 }, async () => {
  // An old undeliverable backlog must not crowd this month's fresh messages
  // out of the bounded recovery query. Retention is a separate operator task.
  const snap = await firestore().collection('riskPushOutbox').where('status', '==', 'pending')
    .where('createdAt', '>=', Date.now() - 24 * 3_600_000).orderBy('createdAt', 'asc').limit(100).get()
  for (const doc of snap.docs) {
    if (Number(doc.data().createdAt) < Date.now() - 24 * 3_600_000 || Number(doc.data().attempts) >= 8) { await doc.ref.update({ status: 'skipped', reason: 'delivery-window-expired', leaseUntil: 0 }); continue }
    try { await deliverAcademicRiskPush(doc.id) } catch (error) { logger.warn('[academicRisk] push retry failed', { outboxId: doc.id, error: String(error) }) }
  }
})
