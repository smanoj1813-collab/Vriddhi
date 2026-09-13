import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classifyFacultyLink } from '../src/collegeLinks.ts'

const target = { id: 'college-new', name: 'Vriddhi Demo College', code: 'VA-001' }
const live = new Set(['college-new', 'college-other'])
const exists = (id: string) => live.has(id)

describe('classifyFacultyLink', () => {
  it('ignores faculty already linked to the target college', () => {
    assert.equal(
      classifyFacultyLink({ collegeId: 'college-new', collegeName: 'Vriddhi Demo College' }, target, exists),
      null
    )
  })

  it('never guesses when nothing on the profile references the target', () => {
    assert.equal(classifyFacultyLink({ collegeId: 'college-dead' }, target, exists), null)
    assert.equal(classifyFacultyLink({ collegeId: '', collegeName: 'Other College' }, target, exists), null)
    assert.equal(classifyFacultyLink({ collegeId: 'college-other', collegeCode: 'XX-9' }, target, exists), null)
  })

  it('flags a dead collegeId whose label points at the target (deleted + re-created college)', () => {
    assert.equal(
      classifyFacultyLink({ collegeId: 'college-dead', collegeName: 'Vriddhi Demo College' }, target, exists),
      'orphaned-college'
    )
    assert.equal(
      classifyFacultyLink({ collegeId: '', collegeCode: 'VA-001' }, target, exists),
      'orphaned-college'
    )
  })

  it('matches name/code case- and whitespace-insensitively', () => {
    assert.equal(
      classifyFacultyLink({ collegeId: 'gone', collegeName: '  vriddhi   demo college ' }, target, exists),
      'orphaned-college'
    )
    assert.equal(
      classifyFacultyLink({ collegeId: 'gone', collegeCode: 'va-001' }, target, exists),
      'orphaned-college'
    )
  })

  it('reports a live link to a different college when the label points here (duplicate college)', () => {
    assert.equal(
      classifyFacultyLink({ collegeId: 'college-other', collegeCode: 'VA-001', collegeName: 'Something' }, target, exists),
      'matching-code'
    )
    assert.equal(
      classifyFacultyLink({ collegeId: 'college-other', collegeName: 'Vriddhi Demo College' }, target, exists),
      'matching-name'
    )
  })

  it('does not treat an empty target code/name as a wildcard', () => {
    const bare = { id: 'c', name: '', code: '' }
    assert.equal(classifyFacultyLink({ collegeId: 'gone', collegeName: '' , collegeCode: '' }, bare, exists), null)
  })
})
