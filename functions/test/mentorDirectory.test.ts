// functions/test/mentorDirectory.test.ts
// ─── Mentor directory projection ("Connect with mentors") ───────────────────
//
// Pins the pure half of listMentorDirectory: the entry projection that decides
// what a student may see about a faculty member. The callable's auth/tenancy
// legs are trivial claim checks exercised by the emulator suite and the
// function itself; everything that could leak (prefs, 2FA, appearance, phone)
// is decided HERE, by what the projection omits.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mentorDirectoryEntry } from '../src/studentPortal.ts'

describe('mentorDirectoryEntry', () => {
  it('keys the entry by the faculty uid, not the profile document id', () => {
    // Appointments and availability documents are keyed by uid (user.id ===
    // uid in AuthContext); a document id taken from an importer would silently
    // break the faculty side's `where facultyId == uid` lookup.
    const entry = mentorDirectoryEntry('legacy-doc-id', {
      uid: 'auth-uid-1',
      name: 'Dr. Rao',
      collegeId: 'c1',
    })
    assert.equal(entry?.id, 'auth-uid-1')
  })

  it('falls back to the document id when no uid field exists', () => {
    const entry = mentorDirectoryEntry('legacy-doc-id', { name: 'Dr. Rao' })
    assert.equal(entry?.id, 'legacy-doc-id')
  })

  it('accepts name, displayName, or a first/last import shape', () => {
    assert.equal(mentorDirectoryEntry('a', { name: ' A ' })?.name, 'A')
    assert.equal(mentorDirectoryEntry('a', { displayName: 'B' })?.name, 'B')
    assert.equal(
      mentorDirectoryEntry('a', { firstName: ' C ', lastName: 'D' })?.name,
      'C D'
    )
  })

  it('drops profile rows with no displayable name instead of fabricating one', () => {
    // A "(no name)" placeholder would become a selectable directory entry.
    assert.equal(mentorDirectoryEntry('a', { email: 'x@y.z' }), null)
    assert.equal(mentorDirectoryEntry('a', { name: '   ' }), null)
  })

  it('normalises email and folds department into branch', () => {
    const entry = mentorDirectoryEntry('a', {
      name: 'N',
      email: '  Prof@College.EDU ',
      branch: 'CSE',
      designation: 'Professor',
    })
    assert.equal(entry?.email, 'prof@college.edu')
    assert.equal(entry?.department, 'CSE')
    assert.equal(entry?.designation, 'Professor')
  })

  it('keeps an empty designation empty rather than inventing a default', () => {
    // 'Assistant Professor' used to be the client-side fallback, which made
    // every un-titled teacher look identically senior in the picker.
    const entry = mentorDirectoryEntry('a', { name: 'N' })
    assert.equal(entry?.designation, '')
  })

  it('normalises subjects from arrays and from the legacy single string', () => {
    assert.deepEqual(
      mentorDirectoryEntry('a', { name: 'N', subjects: [' DSA ', '', 42] })?.subjects,
      ['DSA', '42']
    )
    assert.deepEqual(
      mentorDirectoryEntry('a', { name: 'N', subject: 'DBMS' })?.subjects,
      ['DBMS']
    )
    assert.deepEqual(mentorDirectoryEntry('a', { name: 'N', subject: '  ' })?.subjects, [])
  })

  it('returns ONLY directory fields — profile settings never cross the wire', () => {
    const entry = mentorDirectoryEntry('a', {
      name: 'N',
      notificationPrefs: { exams: true },
      twoFAEnabled: true,
      appearance: { accentColor: 'teal' },
      phone: '+91 90000 00000',
      salary: 1,
      collegeId: 'c1',
    })
    assert.deepEqual(Object.keys(entry ?? {}).sort(), [
      'department',
      'designation',
      'email',
      'id',
      'name',
      'subjects',
    ])
  })
})
