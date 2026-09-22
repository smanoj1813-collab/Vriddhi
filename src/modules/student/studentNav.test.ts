import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STUDENT_NAV_GROUPS, STUDENT_NAV_ITEMS, findNavItem, groupTilesByNavSection } from './studentNav'

const DASHBOARD_TILES = [
  '/student/hall-tickets', '/student/attendance', '/student/assessments', '/student/assignments',
  '/student/grades', '/student/materials', '/student/timetable', '/student/curriculum',
  '/student/fees', '/student/challans', '/student/library', '/student/events', '/student/notifications',
].map((to) => ({ to }))

test('grouping: every dashboard tile lands under a heading, none dropped', () => {
  const groups = groupTilesByNavSection(DASHBOARD_TILES)
  const rendered = groups.flatMap((group) => group.tiles.map((tile) => tile.to)).sort()
  assert.deepEqual(rendered, DASHBOARD_TILES.map((tile) => tile.to).sort())
})

test('grouping: money pages sit together, study pages with learning', () => {
  const groups = groupTilesByNavSection(DASHBOARD_TILES)
  const of = (path: string) => groups.find((g) => g.tiles.some((tile) => tile.to === path))?.label
  assert.equal(of('/student/challans'), 'Fees & exams')
  assert.equal(of('/student/fees'), 'Fees & exams')
  assert.equal(of('/student/hall-tickets'), 'Fees & exams')
  assert.equal(of('/student/materials'), 'Learning')
  assert.equal(of('/student/attendance'), 'Academics')
  assert.equal(of('/student/notifications'), 'Account')
})

test('grouping: headings come from the nav model, in its order', () => {
  const groups = groupTilesByNavSection(DASHBOARD_TILES)
  assert.deepEqual(groups.map((g) => g.label), STUDENT_NAV_GROUPS.map((g) => g.label))
  // A group with no tiles is skipped rather than printed as an empty heading.
  const onlyStudy = groupTilesByNavSection([{ to: '/student/grades' }])
  assert.deepEqual(onlyStudy.map((g) => g.label), ['Academics'])
})

test('grouping: an unknown route is kept under "More" instead of vanishing', () => {
  const groups = groupTilesByNavSection([{ to: '/student/grades' }, { to: '/student/brand-new-page' }])
  const last = groups[groups.length - 1]
  assert.equal(last.label, 'More')
  assert.deepEqual(last.tiles.map((tile) => tile.to), ['/student/brand-new-page'])
})

test('grouping: alias routes resolve to the group of the page they duplicate', () => {
  // /student/fee-portal is the old spelling of Fees; a tile or a link using it
  // must not end up orphaned under "More".
  assert.equal(findNavItem('/student/fee-portal')?.group, 'money')
  assert.equal(groupTilesByNavSection([{ to: '/student/fee-portal' }])[0].label, 'Fees & exams')
})

test('nav model: every item belongs to a declared group', () => {
  const declared = new Set(STUDENT_NAV_GROUPS.map((g) => g.id))
  for (const item of STUDENT_NAV_ITEMS) {
    assert.ok(declared.has(item.group), `${item.id} has group "${item.group}"`)
  }
})
