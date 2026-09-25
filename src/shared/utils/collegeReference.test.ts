import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { collegeLabel, collegeMatchesQuery, resolveCollegeInput, type CollegeOption } from './collegeReference'

const colleges: CollegeOption[] = [
  { id: 'k3Jd9sLp2QwErTyUiOp1', name: 'Vriddhi Demo College', code: 'VDC-001' },
  { id: 'aZ8bN2mQ7xC4vB1nM6kL', name: 'Seshadripuram College', code: 'SPM' },
]

describe('resolveCollegeInput (Access Control college box)', () => {
  it('resolves the document id, the code and the name', () => {
    assert.equal(resolveCollegeInput('k3Jd9sLp2QwErTyUiOp1', colleges)?.code, 'VDC-001')
    assert.equal(resolveCollegeInput('VDC-001', colleges)?.id, 'k3Jd9sLp2QwErTyUiOp1')
    assert.equal(resolveCollegeInput('Seshadripuram College', colleges)?.code, 'SPM')
  })

  it('forgives case and whitespace in the code/name but not in the id', () => {
    assert.equal(resolveCollegeInput(' vdc-001 ', colleges)?.id, 'k3Jd9sLp2QwErTyUiOp1')
    assert.equal(resolveCollegeInput('seshadripuram   college', colleges)?.code, 'SPM')
    assert.equal(resolveCollegeInput('K3JD9SLP2QWERTYUIOP1', colleges), null)
  })

  it('returns null for unknown, empty or ambiguous values', () => {
    assert.equal(resolveCollegeInput('nope', colleges), null)
    assert.equal(resolveCollegeInput('', colleges), null)
    const dup = [...colleges, { id: 'dupe', name: 'Old demo', code: 'vdc-001' }]
    assert.equal(resolveCollegeInput('Vdc-001', dup), null)
    // …but an exact-case code that is unique still resolves (backend parity).
    assert.equal(resolveCollegeInput('VDC-001', dup)?.id, 'k3Jd9sLp2QwErTyUiOp1')
    assert.equal(resolveCollegeInput('vdc-001', dup)?.id, 'dupe')
  })

  it('never treats a blank code or name as a wildcard', () => {
    assert.equal(resolveCollegeInput('x', [{ id: 'bare', name: '', code: '' }]), null)
  })
})

describe('college picker helpers', () => {
  it('labels as "Name (CODE)" and degrades gracefully', () => {
    assert.equal(collegeLabel(colleges[0]), 'Vriddhi Demo College (VDC-001)')
    assert.equal(collegeLabel({ id: 'x1', name: 'No Code College', code: '' }), 'No Code College')
    assert.equal(collegeLabel({ id: 'x2', name: '', code: '' }), 'x2')
  })

  it('filters by any fragment of the label or the exact id', () => {
    assert.ok(collegeMatchesQuery(colleges[0], 'vdc'))
    assert.ok(collegeMatchesQuery(colleges[0], 'demo col'))
    assert.ok(collegeMatchesQuery(colleges[0], 'k3Jd9sLp2QwErTyUiOp1'))
    assert.ok(!collegeMatchesQuery(colleges[0], 'spm'))
    assert.ok(collegeMatchesQuery(colleges[1], ''))
  })
})
