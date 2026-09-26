// functions/test/contentEngine.test.ts
//
// Item 4.1. The cache is the mitigation for the 3.x price change, so the two
// ways it can go wrong are pinned here:
//   1. It serves the WRONG content (a key that is too coarse, or a stale entry).
//   2. It silently never hits (a key that changes on every request) and the
//      saving quietly disappears while the code still looks correct.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  AI_CONTENT_CACHE_COLLECTION,
  AI_PROMPT_VERSIONS,
  DEFAULT_CACHE_MAX_AGE_MS,
  cacheDocId,
  cacheKeyString,
  decideCacheUse,
  generateContentWithCache,
  isCacheEntryFresh,
  normalizeKeyPart,
  primaryModelForTier,
  type CacheEntry,
  type ContentEngineDeps,
} from '../src/ai/contentEngine'

const DAY = 24 * 60 * 60 * 1000

function key(overrides: Partial<Parameters<typeof cacheDocId>[0]> = {}) {
  return {
    kind: 'studyPack' as const,
    key: 'bba|sem1|microeconomics|demand and supply',
    model: 'gemini-2.5-flash-lite',
    promptVersion: AI_PROMPT_VERSIONS.studyPack,
    ...overrides,
  }
}

/** Deps harness: in-memory cache, counting generator. */
function harness(seed: Record<string, CacheEntry> = {}, now = Date.parse('2026-09-26T00:00:00.000Z')) {
  const store = new Map<string, CacheEntry>(Object.entries(seed))
  const events: Array<{ status: string; kind: string; tokensOut: number }> = []
  let generateCalls = 0
  let lastPrompt = ''
  const deps: Partial<ContentEngineDeps> = {
    readCache: async (docId) => store.get(docId) ?? null,
    writeCache: async (docId, entry) => {
      store.set(docId, entry)
    },
    recordUsage: async (event) => {
      events.push({ status: event.status, kind: event.kind, tokensOut: event.tokensOut })
    },
    generate: async ({ prompt }) => {
      generateCalls += 1
      lastPrompt = prompt
      return {
        raw: '{"title":"Demand and Supply"}',
        model: 'gemini-2.5-flash-lite',
        tokensIn: 300,
        tokensOut: 700,
        thinkingTokens: 0,
        cachedTokens: 0,
      }
    },
    now: () => now,
  }
  return {
    deps,
    store,
    events,
    get generateCalls() {
      return generateCalls
    },
    get lastPrompt() {
      return lastPrompt
    },
  }
}

describe('cache keys', () => {
  it('normalises case and whitespace so the same topic shares one entry', () => {
    assert.equal(normalizeKeyPart('  Financial   Accounting '), 'financial accounting')
    assert.equal(
      cacheKeyString(key({ key: 'BBA|Sem1|Microeconomics' })),
      cacheKeyString(key({ key: 'bba|sem1|microeconomics' })),
    )
  })

  it('changes when the prompt version changes — bumping a prompt invalidates the cache', () => {
    assert.notEqual(
      cacheDocId(key()),
      cacheDocId(key({ promptVersion: 'study-pack-v2' })),
    )
  })

  it('changes when the model changes — a new model never reuses old output', () => {
    assert.notEqual(cacheDocId(key()), cacheDocId(key({ model: 'gemini-3.6-flash' })))
  })

  it('is a stable sha256 hex string usable as a document id', () => {
    const id = cacheDocId(key())
    assert.match(id, /^[0-9a-f]{64}$/)
    assert.equal(id, cacheDocId(key()))
    assert.equal(id.includes('/'), false)
  })

  it('separates kinds with the same key, so a study pack never serves an MCQ set', () => {
    assert.notEqual(cacheDocId(key()), cacheDocId(key({ kind: 'mcqSet' })))
  })
})

describe('freshness', () => {
  const now = Date.parse('2026-09-26T00:00:00.000Z')

  it('reuses an entry inside the window and refuses one outside it', () => {
    assert.equal(isCacheEntryFresh({ content: 'x', createdAt: new Date(now - DAY).toISOString() }, { now }), true)
    assert.equal(
      isCacheEntryFresh({ content: 'x', createdAt: new Date(now - DEFAULT_CACHE_MAX_AGE_MS - DAY).toISOString() }, { now }),
      false,
    )
  })

  it('treats a missing or unparseable timestamp as stale, never as fresh', () => {
    assert.equal(isCacheEntryFresh({ content: 'x' }, { now }), false)
    assert.equal(isCacheEntryFresh({ content: 'x', createdAt: 'yesterday' }, { now }), false)
  })

  it('treats empty content as a miss', () => {
    assert.equal(isCacheEntryFresh({ content: '', createdAt: new Date(now).toISOString() }, { now }), false)
    assert.equal(isCacheEntryFresh(null, { now }), false)
  })

  it('reports miss / hit / stale distinctly', () => {
    assert.equal(decideCacheUse(null, { now }).status, 'miss')
    assert.equal(
      decideCacheUse({ content: 'x', createdAt: new Date(now).toISOString() }, { now }).status,
      'hit',
    )
    assert.equal(
      decideCacheUse({ content: 'x', createdAt: new Date(now - 400 * DAY).toISOString() }, { now }).status,
      'stale',
    )
  })
})

describe('generateContentWithCache', () => {
  it('generates, stores and counts a miss on the first ask', async () => {
    const h = harness()
    const result = await generateContentWithCache(
      {
        kind: 'studyPack',
        key: 'bba|sem1|micro|demand',
        tier: 'fast',
        prompt: 'generate',
        parse: (raw) => JSON.parse(raw),
      },
      h.deps,
    )
    assert.equal(result.source, 'model')
    assert.deepEqual(result.content, { title: 'Demand and Supply' })
    assert.equal(h.generateCalls, 1)
    assert.deepEqual(h.events.map((e) => e.status), ['miss'])
    assert.equal(h.store.size, 1)
    assert.equal(h.store.has(result.cacheDocId), true)
    assert.ok(Array.from(h.store.keys())[0].length === 64, 'stored under the sha256 id')
  })

  it('serves the second ask from the cache without calling the model again', async () => {
    const h = harness()
    const request = {
      kind: 'studyPack' as const,
      key: 'bba|sem1|micro|demand',
      tier: 'fast' as const,
      prompt: 'generate',
      parse: (raw: string) => JSON.parse(raw),
    }
    const first = await generateContentWithCache(request, h.deps)
    const second = await generateContentWithCache(request, h.deps)
    assert.equal(h.generateCalls, 1, 'the model must be called exactly once for two identical asks')
    assert.equal(second.source, 'cache')
    assert.deepEqual(second.content, first.content)
    assert.equal(second.tokensIn, 0)
    assert.equal(second.tokensOut, 0)
    assert.deepEqual(h.events.map((e) => e.status), ['miss', 'hit'])
  })

  it('shares one entry between two different students of the same topic', async () => {
    // The request has no student fields at all — that is the point. This test
    // documents that the key cannot see them.
    const h = harness()
    const base = { kind: 'studyPack' as const, key: 'bba|sem1|micro|demand', tier: 'fast' as const, prompt: 'p' }
    await generateContentWithCache({ ...base, parse: (raw: string) => JSON.parse(raw) }, h.deps)
    await generateContentWithCache({ ...base, parse: (raw: string) => JSON.parse(raw) }, h.deps)
    assert.equal(h.generateCalls, 1)
  })

  it('regenerates when the caller asks to bypass the cache, and re-stores', async () => {
    const h = harness()
    const request = {
      kind: 'studyPack' as const,
      key: 'bba|sem1|micro|demand',
      tier: 'fast' as const,
      prompt: 'generate',
      parse: (raw: string) => JSON.parse(raw),
    }
    await generateContentWithCache(request, h.deps)
    const forced = await generateContentWithCache({ ...request, allowCache: false }, h.deps)
    assert.equal(h.generateCalls, 2)
    assert.equal(forced.source, 'model')
  })

  it('regenerates over a stale entry instead of serving it', async () => {
    const now = Date.parse('2026-09-26T00:00:00.000Z')
    const id = cacheDocId({
      kind: 'studyPack',
      key: 'bba|sem1|micro|demand',
      model: primaryModelForTier('fast'),
      promptVersion: AI_PROMPT_VERSIONS.studyPack,
    })
    const h = harness(
      { [id]: { content: '{"title":"Old"}', model: primaryModelForTier('fast'), promptVersion: AI_PROMPT_VERSIONS.studyPack, createdAt: new Date(now - 400 * DAY).toISOString() } },
      now,
    )
    const result = await generateContentWithCache(
      { kind: 'studyPack', key: 'bba|sem1|micro|demand', tier: 'fast', prompt: 'p', parse: (raw) => JSON.parse(raw) },
      h.deps,
    )
    assert.equal(result.source, 'model')
    assert.equal(h.generateCalls, 1)
    assert.deepEqual(h.events.map((e) => e.status), ['miss'])
  })

  it('treats unparseable stored content as a miss, not an error', async () => {
    const now = Date.parse('2026-09-26T00:00:00.000Z')
    const id = cacheDocId({
      kind: 'studyPack',
      key: 'k',
      model: primaryModelForTier('fast'),
      promptVersion: AI_PROMPT_VERSIONS.studyPack,
    })
    const h = harness(
      { [id]: { content: '<html>not json</html>', model: primaryModelForTier('fast'), promptVersion: AI_PROMPT_VERSIONS.studyPack, createdAt: new Date(now).toISOString() } },
      now,
    )
    const result = await generateContentWithCache(
      { kind: 'studyPack', key: 'k', tier: 'fast', prompt: 'p', parse: (raw) => JSON.parse(raw) },
      h.deps,
    )
    assert.equal(result.source, 'model')
    assert.deepEqual(result.content, { title: 'Demand and Supply' })
  })

  it('still answers when the cache read throws', async () => {
    const h = harness()
    const result = await generateContentWithCache(
      { kind: 'studyPack', key: 'k', tier: 'fast', prompt: 'p', parse: (raw) => JSON.parse(raw) },
      {
        ...h.deps,
        readCache: async () => {
          throw new Error('FIRESTORE down')
        },
      },
    )
    assert.equal(result.source, 'model')
  })

  it('still answers when writing the cache or counting usage fails', async () => {
    const h = harness()
    const result = await generateContentWithCache(
      { kind: 'studyPack', key: 'k', tier: 'fast', prompt: 'p', parse: (raw) => JSON.parse(raw) },
      {
        ...h.deps,
        writeCache: async () => {
          throw new Error('quota exceeded')
        },
        recordUsage: async () => {
          throw new Error('quota exceeded')
        },
      },
    )
    assert.equal(result.source, 'model')
    assert.deepEqual(result.content, { title: 'Demand and Supply' })
  })

  it('gives the caller the prompt unchanged', async () => {
    const h = harness()
    await generateContentWithCache(
      { kind: 'prepDraft', key: 'bcom|5|financial accounting', tier: 'fast', prompt: 'PROMPT FOR LESSON 7', parse: (raw) => raw },
      h.deps,
    )
    assert.equal(h.lastPrompt, 'PROMPT FOR LESSON 7')
  })

  it('counts thinking tokens into the output telemetry it reports', async () => {
    const h = harness()
    const result = await generateContentWithCache(
      { kind: 'prepDraft', key: 'k', tier: 'fast', prompt: 'p', parse: (raw) => raw },
      {
        ...h.deps,
        generate: async () => ({
          raw: 'ok',
          model: 'gemini-3.1-flash-lite',
          tokensIn: 100,
          tokensOut: 500,
          thinkingTokens: 250,
          cachedTokens: 0,
        }),
      },
    )
    assert.equal(result.thinkingTokens, 250)
    assert.equal(result.tokensOut, 500)
  })

  it('keys on the tier primary model, so a tier fallback stores under the model that answered', async () => {
    const h = harness()
    const result = await generateContentWithCache(
      { kind: 'paperAnswer', key: 'bcu|bcom|dcbb103|q1', tier: 'fast', prompt: 'p', parse: (raw) => raw },
      {
        ...h.deps,
        // The model that actually answered is NOT the primary of the tier.
        generate: async () => ({
          raw: 'answer',
          model: 'gemini-2.5-flash-lite',
          tokensIn: 1,
          tokensOut: 2,
          thinkingTokens: 0,
          cachedTokens: 0,
        }),
      },
    )
    assert.equal(result.model, 'gemini-2.5-flash-lite')
    assert.equal(
      result.cacheDocId,
      cacheDocId({
        kind: 'paperAnswer',
        key: 'bcu|bcom|dcbb103|q1',
        model: 'gemini-2.5-flash-lite',
        promptVersion: AI_PROMPT_VERSIONS.paperAnswer,
      }),
      'stored under the answering model, so the next fallback reuses it',
    )
    assert.equal(h.store.has(result.cacheDocId), true)
  })
})

describe('cache topology', () => {
  it('lives in a server-only collection', () => {
    assert.equal(AI_CONTENT_CACHE_COLLECTION, 'aiContentCache')
    // The rules test asserts client read/write are denied for this collection;
    // this test guards the name the rules were written against.
  })
})
