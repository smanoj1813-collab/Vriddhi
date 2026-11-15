import assert from 'node:assert/strict'
import { after, beforeEach, describe, it } from 'node:test'
import { ACCENT_COLORS, DEFAULT_APPEARANCE, normalizeAppearance, readLocalAppearance, sameAppearance } from './appearance'

const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
const values = new Map<string, string>()
beforeEach(() => {
  values.clear()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => values.get(key) ?? null },
  })
})
after(() => {
  if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

describe('account appearance preferences', () => {
  it('uses safe defaults for absent and malformed data', () => {
    for (const value of [undefined, null, [], 'red', 123, { accentColor: 'url(javascript:alert(1))', fontSize: '99px', compactMode: 'true', animationsEnabled: 0 }]) {
      assert.deepEqual(normalizeAppearance(value), DEFAULT_APPEARANCE)
    }
  })

  it('normalizes all palette colours and valid font sizes', () => {
    for (const { color } of ACCENT_COLORS) {
      for (const fontSize of ['small', 'medium', 'large']) {
        const input = { accentColor: color.toUpperCase(), fontSize, compactMode: true, animationsEnabled: false }
        assert.deepEqual(normalizeAppearance(input), { ...input, accentColor: color })
      }
    }
  })

  it('never copies identity, tenant, privileges or extra cloud metadata', () => {
    const result = normalizeAppearance({ ...DEFAULT_APPEARANCE, uid: 'other', role: 'superadmin', collegeId: 'other-college', permissions: ['*'], updatedAt: 'yesterday' })
    assert.deepEqual(result, DEFAULT_APPEARANCE)
    assert.deepEqual(Object.keys(result).sort(), ['accentColor', 'animationsEnabled', 'compactMode', 'fontSize'])
  })

  it('reads only the current account keys, not another user or legacy browser-wide values', () => {
    values.set('vriddhi_accent_color', '#ef4444')
    values.set('vriddhi_accent_color__other', '#6366f1')
    values.set('vriddhi_font_size__other', 'large')
    assert.deepEqual(readLocalAppearance('mine'), DEFAULT_APPEARANCE)
    assert.equal(readLocalAppearance('other').accentColor, '#6366f1')
  })

  it('uses old profile appearance only as a read-only migration fallback', () => {
    const legacy = { accentColor: '#8b5cf6', fontSize: 'large', compactMode: true }
    assert.deepEqual(readLocalAppearance('mine', legacy), { ...DEFAULT_APPEARANCE, ...legacy })
    assert.equal(values.size, 0)
  })

  it('preserves valid account-local preferences over old profile values', () => {
    values.set('vriddhi_accent_color__mine', '#06b6d4')
    values.set('vriddhi_font_size__mine', 'small')
    values.set('vriddhi_compact_mode__mine', 'false')
    values.set('vriddhi_animations__mine', 'false')
    assert.deepEqual(readLocalAppearance('mine', { accentColor: '#ef4444', fontSize: 'large', compactMode: true }), {
      accentColor: '#06b6d4', fontSize: 'small', compactMode: false, animationsEnabled: false,
    })
  })

  it('does not trust malformed cached preferences', () => {
    values.set('vriddhi_accent_color__mine', '#fff')
    values.set('vriddhi_font_size__mine', '400px')
    values.set('vriddhi_compact_mode__mine', 'yes')
    values.set('vriddhi_animations__mine', '{}')
    assert.deepEqual(readLocalAppearance('mine'), DEFAULT_APPEARANCE)
  })

  it('continues with defaults if browser storage is unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('Storage blocked') } })
    assert.deepEqual(readLocalAppearance('mine'), DEFAULT_APPEARANCE)
  })

  it('detects unchanged snapshots without relying on object key order', () => {
    assert.equal(sameAppearance(DEFAULT_APPEARANCE, { animationsEnabled: true, compactMode: false, fontSize: 'medium', accentColor: '#14b8a6' }), true)
    assert.equal(sameAppearance(null, { ...DEFAULT_APPEARANCE }), false)
    for (const patch of [{ accentColor: '#6366f1' }, { fontSize: 'large' as const }, { compactMode: true }, { animationsEnabled: false }]) {
      assert.equal(sameAppearance(DEFAULT_APPEARANCE, { ...DEFAULT_APPEARANCE, ...patch }), false)
    }
  })
})
