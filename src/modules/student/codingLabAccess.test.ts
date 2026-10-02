import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canStudentUseCodingLab, isBcaStudent } from './codingLabAccess'

test('coding lab entitlement recognises BCA course labels from common student fields', () => {
  assert.equal(isBcaStudent({ course: 'BCA' }), true)
  assert.equal(isBcaStudent({ branch: 'B.C.A.' }), true)
  assert.equal(isBcaStudent({ course: 'Bachelor of Computer Applications' }), true)
  assert.equal(isBcaStudent({ department: 'BCA (Bachelor of Computer Applications)' }), true)
  assert.equal(isBcaStudent({ course: 'BCA IT' }), true)
})

test('coding lab entitlement does not expose the lab to other or unknown programmes', () => {
  assert.equal(isBcaStudent({ course: 'B.Sc Computer Science' }), false)
  assert.equal(isBcaStudent({ branch: 'BBA' }), false)
  assert.equal(isBcaStudent({ course: 'MCA' }), false)
  assert.equal(isBcaStudent(null), false)
  assert.equal(isBcaStudent(undefined), false)
})

test('Coding Lab access requires both BCA identity and a college assignment', () => {
  assert.equal(canStudentUseCodingLab({ course: 'BCA' }, true), true)
  assert.equal(canStudentUseCodingLab({ course: 'BCA' }, false), false)
  assert.equal(canStudentUseCodingLab({ course: 'B.Com' }, true), false)
  assert.equal(canStudentUseCodingLab(null, true), false)
})
