import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { LANDING_ROLES } from './roles';
import { getDrilldownContent, type DrilldownSelection, type PlatformDrilldownId } from './drilldowns';

const PLATFORM_IDS: PlatformDrilldownId[] = ['academics', 'assessments', 'campus-operations'];
const allowedRoleIds = new Set(LANDING_ROLES.map((role) => role.id));

test('platform drill-downs describe capabilities without adding public roles', () => {
  for (const id of PLATFORM_IDS) {
    const content = getDrilldownContent({ kind: 'platform', id });
    assert.ok(content.title.length > 0);
    assert.ok(content.highlights.length >= 3);
    assert.ok(content.workflow.length >= 3);
    assert.deepEqual(content.action, { type: 'roles' });
    for (const roleId of content.roleIds) assert.ok(allowedRoleIds.has(roleId));
  }
});

test('every advertised role has a matching drill-down and sign-in action', () => {
  for (const role of LANDING_ROLES) {
    const content = getDrilldownContent({ kind: 'role', id: role.id });
    assert.deepEqual(content.action, { type: 'role-login', roleId: role.id });
    assert.ok(content.roleIds.includes(role.id));
    for (const roleId of content.roleIds) assert.ok(allowedRoleIds.has(roleId));
  }
});

test('the upskilling drill-down stays catalog-free', () => {
  const content = getDrilldownContent({ kind: 'upskilling' });
  assert.deepEqual(content.action, { type: 'courses' });
  assert.deepEqual(content.roleIds, ['students']);

  const contentRoot = path.resolve(process.cwd(), 'content/courses');
  const serialized = JSON.stringify(content);
  for (const entry of fs.readdirSync(contentRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(contentRoot, entry.name, 'course.json');
    if (!fs.existsSync(manifestPath)) continue;
    const title = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).title;
    if (typeof title === 'string') assert.equal(serialized.includes(title), false);
  }
});

test('drill-down selections are limited to the public platform, role, and upskilling surfaces', () => {
  const selections: DrilldownSelection[] = [
    ...PLATFORM_IDS.map((id) => ({ kind: 'platform', id }) as DrilldownSelection),
    ...LANDING_ROLES.map((role) => ({ kind: 'role', id: role.id }) as DrilldownSelection),
    { kind: 'upskilling' },
  ];
  assert.equal(selections.length, PLATFORM_IDS.length + LANDING_ROLES.length + 1);
  for (const selection of selections) assert.ok(getDrilldownContent(selection).note.length > 0);
});
