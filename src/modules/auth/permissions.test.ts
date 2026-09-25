import test from 'node:test'
import assert from 'node:assert/strict'
import { canAccessAdminPath, roleHasPermission } from './permissions'

test('HODs and department admins hold no finance access', () => {
  for (const role of ['hod', 'admin'] as const) {
    assert.equal(roleHasPermission(role, 'fees.manage'), false)
    assert.equal(canAccessAdminPath(role, '/admin/fee-management'), false)
    assert.equal(canAccessAdminPath(role, '/admin/finance-settings'), false)
    assert.equal(canAccessAdminPath(role, '/admin/guest-faculty-billing'), false)
    assert.equal(canAccessAdminPath(role, '/admin/payroll'), false)
    assert.equal(canAccessAdminPath(role, '/admin/challans'), false)
    // academic pages unchanged
    assert.equal(canAccessAdminPath(role, '/admin/attendance'), true)
    assert.equal(canAccessAdminPath(role, '/admin/hod-dashboard'), true)
  }
})

test('accounts: finance only, never academic or library management', () => {
  assert.equal(canAccessAdminPath('accounts', '/admin/fee-management'), true)
  assert.equal(canAccessAdminPath('accounts', '/admin/accounts'), true)
  assert.equal(canAccessAdminPath('accounts', '/admin/library-fines'), true)
  assert.equal(canAccessAdminPath('accounts', '/admin/vendor-bills'), true)
  assert.equal(canAccessAdminPath('accounts', '/admin/library'), false)
  assert.equal(canAccessAdminPath('accounts', '/admin/library/catalogue'), false)
  assert.equal(canAccessAdminPath('accounts', '/admin/attendance'), false)
  assert.equal(canAccessAdminPath('accounts', '/admin/dashboard'), false)
  assert.equal(canAccessAdminPath('accounts', '/admin/office-staff'), false)
})

test('operations: library/inventory, shared fines, no finance', () => {
  assert.equal(canAccessAdminPath('operations', '/admin/library'), true)
  assert.equal(canAccessAdminPath('operations', '/admin/library/circulation'), true)
  assert.equal(canAccessAdminPath('operations', '/admin/library-fines'), true)
  assert.equal(canAccessAdminPath('operations', '/admin/inventory'), true)
  assert.equal(canAccessAdminPath('operations', '/admin/purchase-orders'), true)
  assert.equal(canAccessAdminPath('operations', '/admin/fee-management'), false)
  assert.equal(canAccessAdminPath('operations', '/admin/payroll'), false)
  assert.equal(canAccessAdminPath('operations', '/admin/vendor-bills'), false)
  assert.equal(canAccessAdminPath('operations', '/admin/students'), false)
})

test('payroll: principal always; accounts only when the college allows it', () => {
  assert.equal(canAccessAdminPath('principal', '/admin/payroll'), true)
  assert.equal(canAccessAdminPath('accounts', '/admin/payroll'), false)
  assert.equal(canAccessAdminPath('accounts', '/admin/payroll', { payrollRoles: ['accounts'] }), true)
  // a college cannot grant payroll to a role outside the grantable set
  assert.equal(canAccessAdminPath('hod', '/admin/payroll', { payrollRoles: ['hod'] }), false)
  assert.equal(canAccessAdminPath('operations', '/admin/payroll', { payrollRoles: ['operations'] }), false)
})

test('principal oversees everything; superadmin bypasses', () => {
  for (const p of ['/admin/fee-management', '/admin/library', '/admin/inventory', '/admin/office-staff', '/admin/dashboard'])
    assert.equal(canAccessAdminPath('principal', p), true, p)
  assert.equal(canAccessAdminPath('superadmin', '/admin/anything'), true)
  assert.equal(canAccessAdminPath(null, '/admin/dashboard'), false)
  assert.equal(canAccessAdminPath('faculty', '/admin/library'), false)
})

test('HODs may raise purchase requests', () => {
  assert.equal(canAccessAdminPath('hod', '/admin/purchase-requests'), true)
  assert.equal(canAccessAdminPath('faculty', '/admin/purchase-requests'), false)
})
