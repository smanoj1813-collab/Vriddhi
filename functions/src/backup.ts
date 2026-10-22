// functions/src/backup.ts
//
// Weekly managed Firestore export to Cloud Storage — the "verified
// backups" half of the ops basics. Env-gated (the recurring pattern):
// until BACKUP_BUCKET is set, the scheduler runs, logs that backups are
// NOT configured, and exits — so a missing backup is visible in logs
// instead of silently assumed.
//
// One-time setup (docs/OPS_RUNBOOK.md): create the bucket in
// asia-south1, grant the functions service account
// roles/datastore.importExportAdmin + storage object admin on the
// bucket, set BACKUP_BUCKET=gs://<bucket> in functions/.env, and ALSO
// enable Firestore PITR in the console for 7-day point-in-time reads.
// Test a restore into a scratch database before the first customer.

import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { onSchedule } from 'firebase-functions/v2/scheduler'

/** gs://bucket → export prefix with a daily-unique timestamp folder. */
export function backupOutputUri(bucket: string, now = new Date()): string | null {
  const b = String(bucket || '').trim().replace(/\/+$/, '')
  if (!/^gs:\/\/[a-z0-9._-]{3,}$/i.test(b)) return null
  const stamp = now.toISOString().replace(/[:.]/g, '-')
  return `${b}/firestore-exports/${stamp}`
}

export async function runFirestoreExport(bucket: string): Promise<{ started: boolean; outputUri?: string; reason?: string }> {
  const outputUri = backupOutputUri(bucket)
  if (!outputUri) return { started: false, reason: 'BACKUP_BUCKET is not set or not a gs:// URI' }

  const app = admin.app()
  const projectId = String(app.options.projectId || process.env.GCLOUD_PROJECT || '')
  if (!projectId) return { started: false, reason: 'Project id unavailable' }
  const credential = app.options.credential
  if (!credential?.getAccessToken) return { started: false, reason: 'No credential available for access token' }
  const token = await credential.getAccessToken()

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default):exportDocuments`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputUriPrefix: outputUri }),
    },
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return { started: false, reason: `exportDocuments ${res.status}: ${detail.slice(0, 300)}` }
  }
  return { started: true, outputUri }
}

/** Every Sunday 02:30 IST (asia-south1 scheduler timezone set explicitly). */
export const scheduledFirestoreExport = onSchedule(
  { schedule: '30 2 * * 0', timeZone: 'Asia/Kolkata', region: 'asia-south1', memory: '256MiB', timeoutSeconds: 120, maxInstances: 1 },
  async () => {
    const result = await runFirestoreExport(String(process.env.BACKUP_BUCKET || ''))
    if (result.started) {
      logger.info('[Backup] Firestore export started', { outputUri: result.outputUri })
    } else {
      logger.warn('[Backup] Firestore export NOT started — backups may be unconfigured', { reason: result.reason })
    }
  },
)
