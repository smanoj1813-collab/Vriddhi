import assert from 'node:assert/strict';
import test from 'node:test';
import { LANDING_ROLES } from './roles';
import { ROLE_ICONS } from './roleIcons';
import { getDrilldownContent, type DrilldownSelection, type PlatformDrilldownId } from './drilldowns';
import { drilldownKey, getDrilldownVisuals } from './drilldownVisuals';

const PLATFORM_IDS: PlatformDrilldownId[] = ['academics', 'assessments', 'campus-operations'];

const SELECTIONS: DrilldownSelection[] = [
  ...PLATFORM_IDS.map((id) => ({ kind: 'platform', id }) as DrilldownSelection),
  ...LANDING_ROLES.map((role) => ({ kind: 'role', id: role.id }) as DrilldownSelection),
  { kind: 'upskilling' },
];

test('every Explore dialog has a themed scene and one icon per highlight/workflow step', () => {
  for (const selection of SELECTIONS) {
    const content = getDrilldownContent(selection);
    const visuals = getDrilldownVisuals(selection);
    assert.equal(visuals.scene, drilldownKey(selection));
    assert.equal(visuals.highlights.length, content.highlights.length);
    assert.equal(visuals.workflow.length, content.workflow.length);
    for (const Icon of [...visuals.highlights, ...visuals.workflow]) assert.equal(typeof Icon, 'object');
  }
});

test('every public role has a presentation icon for connection chips', () => {
  for (const role of LANDING_ROLES) assert.ok(ROLE_ICONS[role.id]);
});
