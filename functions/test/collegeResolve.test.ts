import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { describeCollegeResolutionFailure, pickCollege, type CollegeRef } from '../src/collegeResolve.ts'

const colleges: CollegeRef[] = [
  { id: 'k3Jd9sLp2QwErTyUiOp1', name: 'Vriddhi Demo College', code: 'VDC-001' },
  { id: 'aZ8bN2mQ7xC4vB1nM6kL', name: 'Seshadripuram College', code: 'SPM' },
  { id: 'pQ1wE2rT3yU4iO5pA6sD', name: 'St Agnes College', code: 'SAC' },
]

describe('pickCollege — Access Control "College ID" resolution', () => {
  it('accepts the Firestore document id', () => {
    const r = pickCollege('k3Jd9sLp2QwErTyUiOp1', colleges)
    assert.equal(r.kind, 'resolved')
    if (r.kind === 'resolved') {
      assert.equal(r.matchedBy, 'id')
      assert.equal(r.college.code, 'VDC-001')
    }
  })

  it('accepts the college code the operator chose on Create College (the reported bug)', () => {
    const r = pickCollege('VDC-001', colleges)
    assert.equal(r.kind, 'resolved')
    if (r.kind === 'resolved') {
      assert.equal(r.matchedBy, 'code')
      assert.equal(r.college.id, 'k3Jd9sLp2QwErTyUiOp1')
    }
  })

  it('tolerates case and stray whitespace around the code', () => {
    for (const typed of ['vdc-001', '  VDC-001 ', 'Vdc-001']) {
      const r = pickCollege(typed, colleges)
      assert.equal(r.kind, 'resolved', typed)
      if (r.kind === 'resolved') assert.equal(r.college.id, 'k3Jd9sLp2QwErTyUiOp1')
    }
  })

  it('falls back to the exact college name, ignoring case and repeated spaces', () => {
    const r = pickCollege('  st agnes   college ', colleges)
    assert.equal(r.kind, 'resolved')
    if (r.kind === 'resolved') {
      assert.equal(r.matchedBy, 'name')
      assert.equal(r.college.code, 'SAC')
    }
  })

  it('prefers an id hit over a code that happens to look the same', () => {
    const tricky: CollegeRef[] = [
      ...colleges,
      { id: 'SPM', name: 'Some Other College', code: 'OTHER' },
    ]
    const r = pickCollege('SPM', tricky)
    assert.equal(r.kind, 'resolved')
    if (r.kind === 'resolved') {
      assert.equal(r.matchedBy, 'id')
      assert.equal(r.college.name, 'Some Other College')
    }
  })

  it('refuses to guess when a code matches more than one college', () => {
    const dup: CollegeRef[] = [
      ...colleges,
      { id: 'dupe0000000000000001', name: 'Vriddhi Demo College (old)', code: 'vdc-001' },
    ]
    // Exact-case code still wins when it is unique…
    const exact = pickCollege('VDC-001', dup)
    assert.equal(exact.kind, 'resolved')
    // …but a case-insensitive hit on two documents is ambiguous.
    const loose = pickCollege('Vdc-001', dup)
    assert.equal(loose.kind, 'ambiguous')
    if (loose.kind === 'ambiguous') {
      assert.equal(loose.matchedBy, 'code')
      assert.equal(loose.candidates.length, 2)
    }
  })

  it('reports not-found (with the known colleges) for an unknown value or an empty string', () => {
    const r = pickCollege('nope', colleges)
    assert.equal(r.kind, 'not-found')
    if (r.kind === 'not-found') assert.equal(r.known.length, 3)
    assert.equal(pickCollege('', colleges).kind, 'not-found')
    assert.equal(pickCollege('   ', colleges).kind, 'not-found')
  })

  it('never lets an empty code or name act as a wildcard', () => {
    const bare: CollegeRef[] = [{ id: 'bare000000000000000001', name: '', code: '' }]
    assert.equal(pickCollege('', bare).kind, 'not-found')
    assert.equal(pickCollege('anything', bare).kind, 'not-found')
  })
})

describe('describeCollegeResolutionFailure', () => {
  it('tells the operator what will work and lists the known colleges', () => {
    const r = pickCollege('VDC', colleges)
    assert.equal(r.kind, 'not-found')
    if (r.kind === 'not-found') {
      const msg = describeCollegeResolutionFailure('VDC', r)
      assert.match(msg, /No college matches "VDC"/)
      assert.match(msg, /college code/i)
      assert.match(msg, /Vriddhi Demo College \(VDC-001\)/)
      assert.match(msg, /Seshadripuram College \(SPM\)/)
    }
  })

  it('names every candidate (with ids) when the value is ambiguous', () => {
    const dup: CollegeRef[] = [
      ...colleges,
      { id: 'dupe0000000000000001', name: 'Vriddhi Demo College (old)', code: 'vdc-001' },
    ]
    const r = pickCollege('vDc-001', dup)
    assert.equal(r.kind, 'ambiguous')
    if (r.kind === 'ambiguous') {
      const msg = describeCollegeResolutionFailure('vDc-001', r)
      assert.match(msg, /matches 2 colleges by code/)
      assert.match(msg, /k3Jd9sLp2QwErTyUiOp1/)
      assert.match(msg, /dupe0000000000000001/)
    }
  })

  it('points at Create College when no colleges exist at all', () => {
    const msg = describeCollegeResolutionFailure('X', { kind: 'not-found', known: [] })
    assert.match(msg, /No colleges exist yet/)
  })
})
