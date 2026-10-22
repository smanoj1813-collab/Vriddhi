import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { backupOutputUri } from '../src/backup'

describe('backupOutputUri', () => {
  it('builds a timestamped prefix and trims trailing slashes', () => {
    const uri = backupOutputUri('gs://vriddhi-backups/', new Date('2026-10-21T02:30:00.000Z'))
    assert.equal(uri, 'gs://vriddhi-backups/firestore-exports/2026-10-21T02-30-00-000Z')
  })
  it('rejects unset or malformed buckets (env-gated no-op)', () => {
    assert.equal(backupOutputUri(''), null)
    assert.equal(backupOutputUri('vriddhi-backups'), null)
    assert.equal(backupOutputUri('gs://'), null)
  })
})
