import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { istDate, text } from './riskCore'
import { loadCollegeRiskEvidence, refreshRiskSubject, resolveRiskPerson, riskHash } from './riskService'

export const MONTHLY_RISK_SCHEDULE = '0 3 1 * *'
export const MONTHLY_RISK_PUSH_RECOVERY_SCHEDULE = '0 6 1 * *'
export const RISK_SWEEP_REQUESTS = 'riskSweepRequests'
const PAGE_SIZE = 25
const MAX_DISCOVERED_PER_CHUNK = 1000
const MAX_CHUNK_MS = 7 * 60_000
const MAX_CHUNK_ATTEMPTS = 3
const MAX_MONTHLY_CHUNKS = 200
const db = () => admin.firestore()
const jobRef = () => db().collection('riskJobs').doc('academic-sweep')
const requestId = (period: string, sequence: number) => `${period}__${sequence}`
const pendingRequest = (period: string, sequence: number) => ({ period, sequence, status: 'pending', attempts: 0, createdAt: Date.now() })

/** One durable cycle per IST calendar month. A scheduler retry (including an
 * old 15-minute delivery during rollout) must not start another full scan. */
export async function queueMonthlyRiskSweep(scheduledTime?: string) {
  const now = Date.now(), scheduled = scheduledTime === undefined ? now : Date.parse(scheduledTime)
  if (!Number.isFinite(scheduled)) throw new Error('Academic review requires a valid scheduler timestamp')
  const period = istDate(scheduled).slice(0, 7)
  // Never resurrect last month's review from a delayed scheduler delivery.
  if (period !== istDate(now).slice(0, 7)) return
  const job = jobRef()
  await db().runTransaction(async tx => {
    const old = (await tx.get(job)).data()
    if (old?.cadence === 'monthly' && text(old.period) >= period) return
    // During rollout an old deployed worker may still be finishing a page.
    // Wait for its lease before replacing the legacy checkpoint document.
    if (Number(old?.leaseUntil) > now) throw new Error('Previous academic review is still running; retry after lease expiry')
    tx.set(job, { cadence: 'monthly', period, sequence: 0, status: 'running', cursor: '', lease: '', leaseUntil: 0,
      startedAt: now, processed: 0, errors: 0, discovered: 0, cycleComplete: false })
    tx.create(db().collection(RISK_SWEEP_REQUESTS).doc(requestId(period, 0)), pendingRequest(period, 0))
  })
}

/** Firestore-created continuations run ONLY while a monthly cycle has work.
 * No daily/hourly polling scheduler or new queue service is required. Each
 * completed page checkpoints the cursor. Only an interrupted page can repeat. */
export async function processMonthlyRiskSweepRequest(id: string) {
  const parsed = /^(\d{4}-(?:0[1-9]|1[0-2]))__(0|[1-9]\d{0,2})$/.exec(id)
  if (!parsed) return
  const period = parsed[1], sequence = Number(parsed[2]), started = Date.now()
  if (period !== istDate(started).slice(0, 7) || sequence >= MAX_MONTHLY_CHUNKS) return
  const job = jobRef(), request = db().collection(RISK_SWEEP_REQUESTS).doc(id)
  const lease = riskHash(id, String(started), String(Math.random()))
  const acquired = await db().runTransaction(async tx => {
    const [jobSnap, requestSnap] = await Promise.all([tx.get(job), tx.get(request)])
    const state = jobSnap.data(), item = requestSnap.data()
    if (!item || item.period !== period || item.sequence !== sequence || item.status !== 'pending'
      || state?.cadence !== 'monthly' || state.period !== period || state.sequence !== sequence || state.status !== 'running') return null
    // Do not acknowledge a pending delivery just because a crashed worker's
    // lease has not expired yet: the create trigger retries this delivery.
    if (Number(state.leaseUntil) > started) throw new Error('Academic review chunk is already leased; retry after lease expiry')
    if (Number(item.attempts) >= MAX_CHUNK_ATTEMPTS) {
      tx.update(request, { status: 'failed', finishedAt: started })
      tx.update(job, { status: 'failed', failure: 'chunk-attempt-budget', lease: '', leaseUntil: 0, finishedAt: started })
      logger.error('[academicRisk] monthly review stopped at retry budget', { period, sequence })
      return null
    }
    tx.update(job, { lease, leaseUntil: started + 9 * 60_000 })
    tx.update(request, { attempts: (Number(item.attempts) || 0) + 1, startedAt: started })
    return { cursor: text(state.cursor) }
  })
  if (!acquired) return

  const owns = (state: FirebaseFirestore.DocumentData | undefined) => state?.period === period && state.sequence === sequence && state.lease === lease && state.status === 'running'
  const colleges = new Map<string, ReturnType<typeof loadCollegeRiskEvidence>>()
  let cursor = acquired.cursor, discovered = 0, processed = 0, errors = 0, complete = false
  try {
    while (Date.now() - started < MAX_CHUNK_MS && discovered < MAX_DISCOVERED_PER_CHUNK) {
      let query = db().collection('users').where('role', 'in', ['student', 'faculty', 'mentor'])
        .orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE_SIZE)
      if (cursor) query = query.startAfter(cursor)
      const page = await query.get()
      if (page.empty) { complete = true; break }
      const auth = await admin.auth().getUsers(page.docs.map(d => ({ uid: d.id })))
      let pageProcessed = 0, pageErrors = 0
      for (let offset = 0; offset < auth.users.length; offset += 3) {
        await Promise.all(auth.users.slice(offset, offset + 3).map(async record => {
          try {
            const person = await resolveRiskPerson(record)
            if (!person || !['student', 'faculty', 'mentor'].includes(person.role)) return
            let college = colleges.get(person.collegeId)
            if (!college) { college = loadCollegeRiskEvidence(person.collegeId); colleges.set(person.collegeId, college) }
            await refreshRiskSubject(person, await college)
            pageProcessed++
          } catch (error) {
            pageErrors++
            logger.error('[academicRisk] monthly subject check failed', { uid: record.uid, period, error: String(error) })
          }
        }))
      }
      cursor = page.docs[page.docs.length - 1].id
      discovered += page.size; processed += pageProcessed; errors += pageErrors
      const checkpointed = await db().runTransaction(async tx => {
        const state = (await tx.get(job)).data()
        if (!owns(state)) return false
        tx.update(job, { cursor, discovered: (Number(state!.discovered) || 0) + page.size,
          processed: (Number(state!.processed) || 0) + pageProcessed, errors: (Number(state!.errors) || 0) + pageErrors, checkpointAt: Date.now() })
        return true
      })
      if (!checkpointed) return
      if (page.size < PAGE_SIZE) { complete = true; break }
    }
    await db().runTransaction(async tx => {
      const state = (await tx.get(job)).data()
      if (!owns(state)) return
      const budgetReached = !complete && sequence + 1 >= MAX_MONTHLY_CHUNKS
      tx.update(request, { status: 'done', finishedAt: Date.now(), processed, errors, discovered })
      tx.update(job, { cursor: complete ? '' : cursor, cycleComplete: complete, lease: '', leaseUntil: 0, finishedAt: Date.now(),
        status: complete ? 'complete' : budgetReached ? 'failed' : 'running', sequence: complete || budgetReached ? sequence : sequence + 1,
        ...(budgetReached ? { failure: 'monthly-chunk-budget' } : {}) })
      if (!complete && !budgetReached) tx.create(db().collection(RISK_SWEEP_REQUESTS).doc(requestId(period, sequence + 1)), pendingRequest(period, sequence + 1))
      if (budgetReached) logger.error('[academicRisk] monthly review stopped at chunk budget', { period, sequence })
    })
    logger.info('[academicRisk] monthly review chunk finished', { period, sequence, processed, errors, discovered, complete })
  } catch (error) {
    // Retain the last completed-page cursor, release our lease and let the
    // create trigger retry. Claimed attempts are capped; no endless rescan.
    await db().runTransaction(async tx => {
      const state = (await tx.get(job)).data()
      if (!owns(state)) return
      tx.update(job, { lease: '', leaseUntil: 0, lastErrorAt: Date.now() })
      tx.update(request, { lastErrorAt: Date.now() })
    })
    throw error
  }
}
