import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assertCollegeAccess, resolveCollegeId } from '../src/middleware/authz.ts'
import { AuthenticatedRequest } from '../src/middleware/authTypes.ts'

describe('tenant college scoping', () => {
  it('ignores client collegeId for non-superadmin', () => {
    const req = {
      user: { uid: 'u1', role: 'faculty', collegeId: 'college-a' },
      body: { collegeId: 'college-b' },
      query: { collegeId: 'college-b' },
      headers: { 'x-college-id': 'college-b' },
    } as unknown as AuthenticatedRequest
    assert.equal(resolveCollegeId(req), 'college-a')
  })

  it('denies college A user access to college B resource', () => {
    const req = {
      user: { uid: 'u1', role: 'admin', collegeId: 'college-a' },
    } as AuthenticatedRequest
    assert.equal(assertCollegeAccess(req, 'college-b'), false)
  })

  it('allows superadmin override', () => {
    const req = {
      user: { uid: 'sa', role: 'superadmin' },
      body: { collegeId: 'college-b' },
      query: {},
      headers: {},
    } as unknown as AuthenticatedRequest
    assert.equal(resolveCollegeId(req), 'college-b')
    assert.equal(assertCollegeAccess(req, 'college-b'), true)
  })
})
