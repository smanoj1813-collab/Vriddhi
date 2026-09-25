import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_NODUES_SETTINGS as D, canActOnSection, effectiveSections, normalizeNoDuesSettings, overallStatus, progress } from './noDuesEngine'

test('settings normalisation: keys slugged, duplicates dropped, bad roles defaulted', () => {
  const s = normalizeNoDuesSettings({ sections: [{ label: 'Hostel Office', ownerRole: 'warden' }, { key: 'hostel_office', label: 'dup' }, { label: 'Fees', ownerRole: 'accounts', auto: 'fees' }], certificatePrefix: 'nd c' })
  assert.deepEqual(s.sections, [
    { key: 'hostel_office', label: 'Hostel Office', ownerRole: 'operations', auto: 'none' },
    { key: 'fees', label: 'Fees', ownerRole: 'accounts', auto: 'fees' },
  ])
  assert.equal(s.certificatePrefix, 'NDC')
  assert.deepEqual(normalizeNoDuesSettings(null).sections, D.sections)
  assert.deepEqual(normalizeNoDuesSettings({ sections: [] }).sections, D.sections)
})

test('missing sections are pending; overall cleared only when every section is cleared', () => {
  const defs = D.sections
  assert.equal(effectiveSections(defs, {})[0].status, 'pending')
  const partial = { library: { status: 'cleared' as const }, accounts: { status: 'blocked' as const, dues: 1200 } }
  assert.equal(overallStatus(defs, partial), 'open')
  assert.deepEqual(progress(defs, partial), { cleared: 1, blocked: 1, total: 4 })
  const all = Object.fromEntries(defs.map(d => [d.key, { status: 'cleared' as const }]))
  assert.equal(overallStatus(defs, all), 'cleared')
})

test('who can act on a section', () => {
  assert.equal(canActOnSection({ ownerRole: 'operations' }, 'operations', undefined, 'CSE'), true)
  assert.equal(canActOnSection({ ownerRole: 'operations' }, 'accounts', undefined, 'CSE'), false)
  assert.equal(canActOnSection({ ownerRole: 'hod' }, 'hod', 'cse', 'CSE'), true)
  assert.equal(canActOnSection({ ownerRole: 'hod' }, 'admin', 'ECE', 'CSE'), false)
  assert.equal(canActOnSection({ ownerRole: 'hod' }, 'hod', undefined, 'CSE'), false)
  assert.equal(canActOnSection({ ownerRole: 'accounts' }, 'principal', undefined, 'CSE'), true)
})
