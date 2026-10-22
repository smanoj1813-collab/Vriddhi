import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isWindowOpen, normalizeWindows } from './registrationEngine'

describe('registrationEngine (client mirror)', () => {
  it('normalizes windows and slugs ids', () => {
    const [w] = normalizeWindows({ windows: [{ id: 'Sem 3 Electives!', title: 'Sem 3', semester: 3, status: 'open', groups: [{ label: 'Open elective', options: [{ name: 'Carnatic Musics', code: 'OE-1' }] }] }] })
    assert.equal(w.id, 'sem-3-electives')
    assert.equal(w.groups[0].options[0].id, 'oe-1') // id slugs prefer the stable subject code
    assert.equal(isWindowOpen(w), true)
    assert.equal(isWindowOpen({ ...w, closesOn: '2020-01-01' }), false)
  })
  it('drops empty baskets', () => {
    const [w] = normalizeWindows({ windows: [{ title: 'X', semester: 1, groups: [{ label: 'Empty', options: [] }] }] })
    assert.equal(w.groups.length, 0)
  })
})
