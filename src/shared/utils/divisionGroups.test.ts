import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  divisionOptions,
  divisionSelection,
  divisionSelectionLabel,
  divisionSelectionValue,
  divisionValuesFromStudentRecords,
  isMergedDivision,
  teachingGroupScopeLabel,
  mergedDivisionLabel,
} from './divisionGroups'

describe('division group selection', () => {
  it('normalises comma/list spellings into the canonical plain letter list', () => {
    assert.deepEqual(divisionSelection('Div A, div. B / C'), ['A', 'B', 'C'])
    assert.equal(divisionSelectionValue(['A', 'B']), 'A,B')
    assert.equal(divisionSelectionValue('B,A,B'), 'B,A')
  })

  it('creates stable options from existing roster and schedule values', () => {
    assert.deepEqual(divisionOptions(['A', 'Div B', 'A,B', '', 'C']), ['A', 'B', 'C'])
  })

  it('collects division and section values from the enrolled roster', () => {
    assert.deepEqual(divisionValuesFromStudentRecords([
      { division: 'A', section: 'B' },
      { section: 'Div C' },
      { division: 'A,B' },
      {},
    ]), ['A', 'B', 'C'])
  })

  it('labels a merged teaching group clearly in roster diagnostics', () => {
    assert.equal(teachingGroupScopeLabel('A,B'), 'Merged teaching group A+B')
    assert.equal(teachingGroupScopeLabel('', 'C'), 'Teaching group C')
    assert.equal(teachingGroupScopeLabel('', ''), '')
  })

  it('distinguishes a merged group from a single division and labels it', () => {
    assert.equal(isMergedDivision('A'), false)
    assert.equal(isMergedDivision('A,B'), true)
    assert.equal(mergedDivisionLabel('A,B'), 'A+B')
    assert.equal(divisionSelectionLabel('A,B'), 'A + B')
    assert.equal(divisionSelectionLabel(''), 'All divisions')
  })
})
