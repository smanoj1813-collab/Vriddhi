import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { requireRole } from '../src/middleware/authz.ts'
import { AuthenticatedRequest } from '../src/middleware/authTypes.ts'

function mockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }
  return res
}

describe('requireRole', () => {
  it('denies a student write', () => {
    const req = { user: { uid: 's1', role: 'student', collegeId: 'college-a' } } as AuthenticatedRequest
    const res = mockRes()
    let nextCalled = false
    requireRole('faculty', 'admin', 'hod', 'superadmin')(req, res, () => {
      nextCalled = true
    })
    assert.equal(nextCalled, false)
    assert.equal(res.statusCode, 403)
  })

  it('allows faculty draft write', () => {
    const req = { user: { uid: 'f1', role: 'faculty', collegeId: 'college-a' } } as AuthenticatedRequest
    const res = mockRes()
    let nextCalled = false
    requireRole('faculty', 'admin')(req, res, () => {
      nextCalled = true
    })
    assert.equal(nextCalled, true)
    assert.equal(res.statusCode, 200)
  })
})
