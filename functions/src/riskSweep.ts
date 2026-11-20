import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { riskReviewPeriod, type RiskReviewCadence } from './riskCadence'
import { text, type RiskPerson } from './riskCore'
import { HttpsError } from 'firebase-functions/v2/https'
import { loadCollegeRiskEvidence, personFromAuth, refreshRiskSubject, resolveRiskPerson, riskHash } from './riskService'

// Delivery recovery is cheap, bounded and independent of full review cadence.
export const RISK_PUSH_RECOVERY_SCHEDULE = '0 6 * * *'
export const RISK_SWEEP_REQUESTS = 'riskSweepRequests'
const PAGE_SIZE = 25
const MAX_DISCOVERED_PER_CHUNK = 1000
const MAX_CHUNK_MS = 7 * 60_000
const MAX_CHUNK_ATTEMPTS = 3
const MAX_REVIEW_CHUNKS = 200
const db = () => admin.firestore()
const jobRef = () => db().collection('riskJobs').doc('academic-sweep')
const requestId = (period: string, sequence: number, cadence: RiskReviewCadence) => period.length === 7 ? `${period}__${sequence}` : `${cadence}_${period}__${sequence}`
const pendingRequest = (period: string, sequence: number, cadence: RiskReviewCadence) => ({ cadence, period, sequence, status: 'pending', attempts: 0, createdAt: Date.now() })

const MANUAL_REVIEW_WINDOW_MS = 24 * 60 * 60_000
const manualJobRef = (collegeKey: string) => db().collection('riskJobs').doc(`manual_${collegeKey}`)
const manualRequestId = (collegeKey: string, review: string, sequence: number) => `manual_${collegeKey}_${review}__${sequence}`

export function manualRiskScope(person: RiskPerson): 'college' | 'self' | null {
  return person.role === 'principal' ? 'college' : person.role === 'faculty' ? 'self' : null
}

export async function getManualRiskReviewStatus(person: RiskPerson) {
  const mode = manualRiskScope(person)
  if (!mode) return null
  const state = (await manualJobRef(riskHash(person.collegeId)).get()).data()
  if (state?.mode !== mode || (mode === 'self' && state.requesterUid !== person.uid)) return null
  const status = state.status === 'running' && Number(state.startedAt) + MANUAL_REVIEW_WINDOW_MS <= Date.now() ? 'failed' : state.status
  return { status, processed: Number(state.processed) || 0, errors: Number(state.errors) || 0 }
}

/** One request per scope per IST day. A single college job serializes faculty
 * checks with any overlapping Principal review. Duplicate clicks never scan. */
export async function queueManualRiskSweep(person: RiskPerson) {
  const mode = manualRiskScope(person)
  if (!mode) throw new HttpsError('permission-denied', 'Only verified Faculty and Principals can start a review')
  const now = Date.now(), period = riskReviewPeriod(now, 'daily')
  const collegeKey = riskHash(person.collegeId)
  const review = riskHash(collegeKey, mode, mode === 'self' ? person.uid : '', period)
  const job = manualJobRef(collegeKey)
  const request = db().collection(RISK_SWEEP_REQUESTS).doc(manualRequestId(collegeKey, review, 0))
  return db().runTransaction(async tx => {
    const [jobSnap, requestSnap, legacySnap] = await Promise.all([tx.get(job), tx.get(request), tx.get(jobRef())])
    const previous = jobSnap.data(), legacy = legacySnap.data()
    if (requestSnap.exists) return { accepted: false, reason: 'already-requested' as const }
    // Only a live scheduled worker blocks a manual review. Rollout leftovers
    // (a running checkpoint with no live lease) drain on their own trigger and
    // must never permanently disable manual reviews for a college.
    if (Number(legacy?.leaseUntil) > now) {
      throw new HttpsError('failed-precondition', 'A previous scheduled review is finishing. Try again later.')
    }
    if (Number(previous?.leaseUntil) > now || (previous?.status === 'running' && Number(previous.startedAt) + MANUAL_REVIEW_WINDOW_MS > now)) {
      throw new HttpsError('resource-exhausted', 'A review is already running for your college. Try again after it finishes.')
    }
    tx.set(job, { mode, collegeId: person.collegeId, requesterUid: person.uid, review, period, sequence: 0, status: 'running', cursor: '', lease: '', leaseUntil: 0,
      startedAt: now, processed: 0, errors: 0, discovered: 0, cycleComplete: false })
    tx.create(request, { review, period, sequence: 0, status: 'pending', attempts: 0, createdAt: now })
    return { accepted: true }
  })
}

/** Work exists only while a bounded review cycle has pages left. No polling
 * worker and no event-per-attendance risk scan are introduced. */
export async function processRiskSweepRequest(id: string) {
  const manual = /^manual_([a-f0-9]{64})_([a-f0-9]{64})__(0|[1-9]\d{0,2})$/.exec(id)
  const modern = /^(daily|weekly|monthly)_(\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))__(0|[1-9]\d{0,2})$/.exec(id)
  // Drain already-queued scheduled work during the rollout, but never start it.
  const legacy = /^(\d{4}-(?:0[1-9]|1[0-2]))__(0|[1-9]\d{0,2})$/.exec(id)
  if (!manual && !modern && !legacy) return
  const cadence = modern ? modern[1] as RiskReviewCadence : 'monthly'
  const legacyPeriod = modern?.[2] ?? legacy?.[1]
  const sequence = Number(manual?.[3] ?? modern?.[3] ?? legacy?.[2]), started = Date.now()
  const currentPeriod = riskReviewPeriod(started, cadence)
  if ((!manual && legacyPeriod !== (legacy ? currentPeriod.slice(0, 7) : currentPeriod)) || sequence >= MAX_REVIEW_CHUNKS) return
  const job = manual ? manualJobRef(manual[1]) : jobRef()
  const request = db().collection(RISK_SWEEP_REQUESTS).doc(id)
  const lease = riskHash(id, String(started), String(Math.random()))
  const acquired = await db().runTransaction(async tx => {
    const [jobSnap, requestSnap] = await Promise.all([tx.get(job), tx.get(request)])
    const state = jobSnap.data(), item = requestSnap.data()
    if (!item || !state || item.sequence !== sequence || state.sequence !== sequence || item.status !== 'pending' || state.status !== 'running') return null
    if (manual) {
      if (state.review !== manual[2] || item.review !== manual[2] || item.period !== state.period ||
        !['self', 'college'].includes(state.mode) || riskHash(state.collegeId) !== manual[1]) return null
      if (Number(state.startedAt) + MANUAL_REVIEW_WINDOW_MS <= started) {
        tx.update(request, { status: 'failed', finishedAt: started })
        tx.update(job, { status: 'failed', failure: 'review-expired', lease: '', leaseUntil: 0, finishedAt: started })
        return null
      }
    } else if ((modern && item.cadence !== cadence) || item.period !== legacyPeriod || state.cadence !== cadence || state.period !== legacyPeriod) return null
    // Do not acknowledge a pending delivery just because a crashed worker's
    // lease has not expired yet: the create trigger retries this delivery.
    if (Number(state.leaseUntil) > started) throw new Error('Academic review chunk is already leased; retry after lease expiry')
    if (Number(item.attempts) >= MAX_CHUNK_ATTEMPTS) {
      tx.update(request, { status: 'failed', finishedAt: started })
      tx.update(job, { status: 'failed', failure: 'chunk-attempt-budget', lease: '', leaseUntil: 0, finishedAt: started })
      logger.error('[academicRisk] review stopped at retry budget', { period: state.period, sequence })
      return null
    }
    tx.update(job, { lease, leaseUntil: started + 9 * 60_000 })
    tx.update(request, { attempts: (Number(item.attempts) || 0) + 1, startedAt: started })
    return { cursor: text(state.cursor), period: String(state.period), mode: state.mode, collegeId: state.collegeId, requesterUid: state.requesterUid }
  })
  if (!acquired) return

  const { period } = acquired
  const owns = (state: FirebaseFirestore.DocumentData | undefined) => !!state && (manual ? state.review === manual[2] : state.cadence === cadence)
    && state.period === period && state.sequence === sequence && state.lease === lease && state.status === 'running'
  // Only this durable worker can materialize a review. Fence every result
  // transaction against the chunk lease instead of creating a subject lock
  // document per account. Transaction retries revalidate ownership as well.
  const assertReviewLease = async (tx: FirebaseFirestore.Transaction) => {
    const state = (await tx.get(job)).data()
    if (!owns(state) || !(Number(state?.leaseUntil) > Date.now())) {
      throw new Error('Academic review chunk no longer owns a live lease')
    }
  }
  const colleges = new Map<string, ReturnType<typeof loadCollegeRiskEvidence>>()
  let cursor = acquired.cursor, discovered = 0, processed = 0, errors = 0, complete = false
  try {
    let requester: admin.auth.UserRecord | undefined
    if (manual) {
      try { requester = await admin.auth().getUser(acquired.requesterUid) }
      catch (error) { if ((error as { code?: string }).code !== 'auth/user-not-found') throw error }
      const verified = requester && personFromAuth(requester)
      if (!verified || verified.collegeId !== acquired.collegeId || manualRiskScope(verified) !== acquired.mode) {
        await db().runTransaction(async tx => {
          const state = (await tx.get(job)).data()
          if (!owns(state)) return
          tx.update(request, { status: 'failed', finishedAt: Date.now() })
          tx.update(job, { status: 'failed', failure: 'requester-unauthorized', lease: '', leaseUntil: 0, finishedAt: Date.now() })
        })
        return
      }
    }
    const self = Boolean(manual && acquired.mode === 'self')
    while (Date.now() - started < MAX_CHUNK_MS && discovered < MAX_DISCOVERED_PER_CHUNK) {
      let ids: string[]
      if (self) {
        if (cursor || !requester) { complete = true; break }
        ids = [requester.uid]
      } else {
        let query = db().collection('users').where('role', 'in', ['student', 'faculty', 'mentor'])
        if (manual) query = query.where('collegeId', '==', acquired.collegeId)
        query = query.orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE_SIZE)
        if (cursor) query = query.startAfter(cursor)
        ids = (await query.get()).docs.map(d => d.id)
      }
      if (!ids.length) { complete = true; break }
      const records = self && requester ? [requester] : (await admin.auth().getUsers(ids.map(uid => ({ uid })))).users
      let pageProcessed = 0, pageErrors = 0
      for (let offset = 0; offset < records.length; offset += 3) {
        await Promise.all(records.slice(offset, offset + 3).map(async record => {
          try {
            if (manual && personFromAuth(record)?.collegeId !== acquired.collegeId) return
            const person = await resolveRiskPerson(record)
            if (!person || !['student', 'faculty', 'mentor'].includes(person.role)) return
            let college = colleges.get(person.collegeId)
            if (!college) { college = loadCollegeRiskEvidence(person.collegeId); colleges.set(person.collegeId, college) }
            await refreshRiskSubject(person, await college, assertReviewLease)
            pageProcessed++
          } catch (error) {
            pageErrors++
            logger.error('[academicRisk] subject check failed', { uid: record.uid, period, error: String(error) })
          }
        }))
      }
      cursor = ids[ids.length - 1]
      discovered += ids.length; processed += pageProcessed; errors += pageErrors
      const checkpointed = await db().runTransaction(async tx => {
        const state = (await tx.get(job)).data()
        if (!owns(state)) return false
        if (!(Number(state?.leaseUntil) > Date.now())) throw new Error('Academic review chunk expired before its page checkpoint')
        tx.update(job, { cursor, discovered: (Number(state!.discovered) || 0) + ids.length,
          processed: (Number(state!.processed) || 0) + pageProcessed, errors: (Number(state!.errors) || 0) + pageErrors, checkpointAt: Date.now() })
        return true
      })
      if (!checkpointed) return
      if (ids.length < PAGE_SIZE) { complete = true; break }
    }
    await db().runTransaction(async tx => {
      const state = (await tx.get(job)).data()
      if (!owns(state)) return
      if (!(Number(state?.leaseUntil) > Date.now())) throw new Error('Academic review chunk expired before completion')
      const budgetReached = !complete && sequence + 1 >= MAX_REVIEW_CHUNKS
      tx.update(request, { status: 'done', finishedAt: Date.now(), processed, errors, discovered })
      tx.update(job, { cursor: complete ? '' : cursor, cycleComplete: complete, lease: '', leaseUntil: 0, finishedAt: Date.now(),
        status: complete ? 'complete' : budgetReached ? 'failed' : 'running', sequence: complete || budgetReached ? sequence : sequence + 1,
        ...(budgetReached ? { failure: 'review-chunk-budget' } : {}) })
      if (!complete && !budgetReached) {
        const nextId = manual ? manualRequestId(manual[1], manual[2], sequence + 1) : requestId(period, sequence + 1, cadence)
        tx.create(db().collection(RISK_SWEEP_REQUESTS).doc(nextId), { ...pendingRequest(period, sequence + 1, cadence), ...(manual ? { review: manual[2] } : {}) })
      }
      if (budgetReached) logger.error('[academicRisk] review stopped at chunk budget', { period, sequence })
    })
    logger.info('[academicRisk] review chunk finished', { period, sequence, processed, errors, discovered, complete })
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
