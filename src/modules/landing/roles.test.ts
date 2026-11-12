import assert from 'node:assert/strict';
import test from 'node:test';
import { LANDING_ROLES, landingRoleFromSearch } from './roles';

test('the public homepage advertises exactly the six requested roles', () => {
  assert.deepEqual(LANDING_ROLES.map((role) => role.label), [
    'Principal', 'HOD', 'Faculty', 'Operations', 'Finance', 'Students',
  ]);
});

test('finance is a public label for the staff sign-in, not a new authorization role', () => {
  assert.equal(landingRoleFromSearch('?role=finance')?.loginPath, '/login?role=finance');
  assert.equal(landingRoleFromSearch('?role=operations')?.loginPath, '/login?role=operations');
});

test('students use the existing student portal', () => {
  assert.equal(landingRoleFromSearch('?role=students')?.loginPath, '/student/login');
});

test('unknown or internal-only role hints are ignored', () => {
  for (const search of ['', '?role=superadmin', '?role=admin', '?role=accounts', '?role=unknown', '?role=']) {
    assert.equal(landingRoleFromSearch(search), undefined);
  }
});
