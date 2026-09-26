// functions/test/aiModels.test.ts
//
// Item 2.1 of docs/HANDOFF_OPTIMISATION_2026-09-25.md — the model registry.
//
// Three classes of regression are pinned here:
//   1. a model id typed into a call site (the class of bug that let three routes
//      call `gemini-1.5-flash` for a year after it was shut down) — source scan;
//   2. the fallback only firing when the MODEL is unusable, not on a transient
//      provider error (otherwise one quota blip multiplies every call);
//   3. thinking/cached tokens being counted, because 3.x bills thinking at the
//      OUTPUT rate and the old telemetry read only prompt+candidates.

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, it } from 'node:test'

import {
  DEFAULT_GEMINI_TIERS,
  describeModelLifecycle,
  geminiModelEntries,
  geminiModelsFor,
  generateWithGeminiFallback,
  isModelUnavailableError,
  primaryGeminiModel,
  readGeminiUsage,
  type AiTier,
} from '../src/config/aiModels'

const ENV_KEYS = ['GEMINI_MODEL_FAST', 'GEMINI_MODEL_QUALITY']
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key]
    else process.env[key] = originalEnv[key]
  }
})

describe('model tier registry', () => {
  it('lists cheap models first for the fast tier and the strong model first for quality', () => {
    delete process.env.GEMINI_MODEL_FAST
    delete process.env.GEMINI_MODEL_QUALITY
    assert.equal(primaryGeminiModel('fast'), 'gemini-2.5-flash-lite')
    assert.equal(primaryGeminiModel('quality'), 'gemini-2.5-flash')
    // Every tier ends with something that is NOT the cheapest entry, so a
    // cost-tier failure can still answer the user.
    assert.ok(geminiModelsFor('fast').length >= 2)
    assert.ok(geminiModelsFor('quality').length >= 2)
  })

  it('never lists the same model twice within a tier', () => {
    for (const tier of ['fast', 'quality'] as AiTier[]) {
      const ids = geminiModelsFor(tier)
      assert.equal(new Set(ids).size, ids.length, `${tier} has a duplicate model id`)
    }
  })

  it('carries a lifecycle date where a shutdown is announced', () => {
    const dated = Object.values(DEFAULT_GEMINI_TIERS)
      .flat()
      .filter((entry) => entry.shutdownOn)
    assert.ok(dated.length >= 2, 'expected at least two entries with a shutdown date')
    for (const entry of dated) {
      assert.match(entry.shutdownOn as string, /^\d{4}-\d{2}-\d{2}$/)
    }
    assert.ok(describeModelLifecycle().some((line) => line.includes('retires')))
  })

  it('lets the operator replace a whole tier from the environment', () => {
    process.env.GEMINI_MODEL_FAST = 'gemini-3.1-flash-lite, gemini-2.5-flash-lite'
    assert.deepEqual(geminiModelsFor('fast'), ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'])
    // Quality is untouched by the fast override.
    assert.equal(primaryGeminiModel('quality'), 'gemini-2.5-flash')
    process.env.GEMINI_MODEL_QUALITY = ''
    assert.equal(primaryGeminiModel('quality'), 'gemini-2.5-flash')
  })

  it('tries call-site overrides first and de-duplicates them', () => {
    delete process.env.GEMINI_MODEL_QUALITY
    const models = geminiModelsFor('quality', [process.env.QUESTION_IMPORT_AI_MODEL, 'gemini-2.5-flash'])
    assert.equal(models[0], 'gemini-2.5-flash')
    assert.equal(new Set(models).size, models.length)
    // An unset override contributes nothing.
    assert.deepEqual(
      geminiModelsFor('quality', [undefined, null, '   ']),
      geminiModelsFor('quality'),
    )
  })

  it('marks env-supplied entries so the log shows where they came from', () => {
    process.env.GEMINI_MODEL_FAST = 'gemini-3.1-flash-lite'
    const entries = geminiModelEntries('fast')
    assert.equal(entries.length, 1)
    assert.match(entries[0].note || '', /GEMINI_MODEL_FAST/)
    assert.equal(entries[0].shutdownOn, undefined)
  })
})

describe('model-unavailable detection', () => {
  it('recognises a retired or unknown model', () => {
    assert.equal(isModelUnavailableError({ status: 404, message: 'not found' }), true)
    assert.equal(
      isModelUnavailableError({
        message: 'models/gemini-1.5-flash is not found for API version v1beta',
      }),
      true,
    )
    assert.equal(
      isModelUnavailableError({ status: 400, message: 'models/gemini-9.9-flash is not supported' }),
      true,
    )
    assert.equal(isModelUnavailableError({ code: 'NOT_FOUND' }), true)
    assert.equal(isModelUnavailableError(new Error('The model gemini-2.5-flash has been retired')), true)
  })

  it('does NOT treat a transient provider failure as a model problem', () => {
    assert.equal(isModelUnavailableError(null), false)
    assert.equal(isModelUnavailableError(undefined), false)
    assert.equal(isModelUnavailableError({ status: 429, message: 'Quota exceeded for generateContent' }), false)
    assert.equal(isModelUnavailableError(new Error('socket hang up')), false)
    assert.equal(isModelUnavailableError({ status: 400, message: 'Invalid JSON payload received' }), false)
    assert.equal(isModelUnavailableError({ status: 503, message: 'The model is overloaded' }), false)
  })
})

describe('usage accounting', () => {
  it('adds thinking tokens to the billable output count', () => {
    const usage = readGeminiUsage({
      promptTokenCount: 1200,
      candidatesTokenCount: 300,
      thoughtsTokenCount: 700,
      cachedContentTokenCount: 800,
    })
    assert.equal(usage.tokensIn, 1200)
    assert.equal(usage.thinkingTokens, 700)
    assert.equal(usage.tokensOut, 1000) // 300 candidates + 700 thinking
    assert.equal(usage.cachedTokens, 800)
  })

  it('reports zeros for a provider that does not send the fields', () => {
    const usage = readGeminiUsage({ prompt_tokens: 40, completion_tokens: 12 })
    assert.deepEqual(usage, { tokensIn: 0, tokensOut: 0, thinkingTokens: 0, cachedTokens: 0 })
    assert.deepEqual(readGeminiUsage(null), { tokensIn: 0, tokensOut: 0, thinkingTokens: 0, cachedTokens: 0 })
  })
})

describe('fallback inside the tier', () => {
  it('uses the first model and reports which one answered', async () => {
    delete process.env.GEMINI_MODEL_FAST
    const seen: string[] = []
    const { result, model } = await generateWithGeminiFallback('fast', async (modelId) => {
      seen.push(modelId)
      return `reply from ${modelId}`
    })
    assert.deepEqual(seen, ['gemini-2.5-flash-lite'])
    assert.equal(model, 'gemini-2.5-flash-lite')
    assert.equal(result, 'reply from gemini-2.5-flash-lite')
  })

  it('moves to the next entry when a model is refused, and reports the fallback', async () => {
    delete process.env.GEMINI_MODEL_FAST
    const seen: string[] = []
    const fallbacks: string[] = []
    const { model } = await generateWithGeminiFallback(
      'fast',
      async (modelId) => {
        seen.push(modelId)
        if (modelId === 'gemini-2.5-flash-lite') {
          throw Object.assign(new Error('models/gemini-2.5-flash-lite is not found'), { status: 404 })
        }
        return 'ok'
      },
      { onFallback: ({ failedModel, nextModel }) => fallbacks.push(`${failedModel}->${nextModel}`) },
    )
    assert.deepEqual(seen, ['gemini-2.5-flash-lite', 'gemini-3.1-flash-lite'])
    assert.deepEqual(fallbacks, ['gemini-2.5-flash-lite->gemini-3.1-flash-lite'])
    assert.equal(model, 'gemini-3.1-flash-lite')
  })

  it('does not spend a second call on a transient error', async () => {
    delete process.env.GEMINI_MODEL_FAST
    let calls = 0
    await assert.rejects(
      generateWithGeminiFallback('fast', async () => {
        calls += 1
        throw Object.assign(new Error('Quota exceeded'), { status: 429 })
      }),
      /Quota exceeded/,
    )
    assert.equal(calls, 1)
  })

  it('surfaces the last error when every entry is refused', async () => {
    process.env.GEMINI_MODEL_FAST = 'gemini-a,gemini-b'
    let calls = 0
    await assert.rejects(
      generateWithGeminiFallback('fast', async (modelId) => {
        calls += 1
        throw Object.assign(new Error(`models/${modelId} is not found`), { status: 404 })
      }),
      /gemini-b is not found/,
    )
    assert.equal(calls, 2)
  })

  it('honours an operator override in the fallback order', async () => {
    process.env.GEMINI_MODEL_QUALITY = 'gemini-3.6-flash,gemini-2.5-flash'
    const seen: string[] = []
    const { model } = await generateWithGeminiFallback(
      'quality',
      async (modelId) => {
        seen.push(modelId)
        if (modelId === 'gemini-3.6-flash') throw new Error('The model gemini-3.6-flash is not supported')
        return 'ok'
      },
    )
    assert.deepEqual(seen, ['gemini-3.6-flash', 'gemini-2.5-flash'])
    assert.equal(model, 'gemini-2.5-flash')
  })
})

// ─── The guard that stops the outage coming back ────────────────────────────

function collectSources(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...collectSources(full))
    else if (entry.endsWith('.ts')) out.push(full)
  }
  return out
}

describe('no model id is typed into a call site', () => {
  const srcDir = resolve(process.cwd(), 'src')
  const registry = join(srcDir, 'config', 'aiModels.ts')
  const sources = collectSources(srcDir).filter((file) => file !== registry)

  it('finds no gemini-<number> literal anywhere outside the registry', () => {
    const offenders: string[] = []
    for (const file of sources) {
      const text = readFileSync(file, 'utf8')
      const matches = text.match(/\bgemini-\d[\w.\-]*/g)
      if (matches) offenders.push(`${file.replace(srcDir, 'src')}: ${[...new Set(matches)].join(', ')}`)
    }
    assert.deepEqual(
      offenders,
      [],
      'Model ids must come from src/config/aiModels.ts (clause A1). Offenders:\n' + offenders.join('\n'),
    )
  })

  it('keeps the retired 1.5 model out of the whole source tree', () => {
    const offenders = sources.filter((file) => readFileSync(file, 'utf8').includes('gemini-1.5'))
    assert.deepEqual(offenders, [])
  })
})

// ─── The canary document (clause A2) ────────────────────────────────────────

describe('model canary report', () => {
  it('names the degraded tiers and keeps the failure reason', async () => {
    const { buildCanaryDoc } = await import('../src/aiModelCanary')
    const doc = buildCanaryDoc(
      [
        { tier: 'fast', model: 'gemini-2.5-flash-lite', ok: true, unavailable: false, latencyMs: 210 },
        {
          tier: 'quality',
          model: 'gemini-2.5-flash',
          ok: false,
          unavailable: true,
          latencyMs: 90,
          error: 'models/gemini-2.5-flash is not found',
        },
      ],
      '2026-09-25T01:00:00.000Z',
    )
    assert.deepEqual(doc.degradedTiers, ['quality'])
    const tiers = doc.tiers as Record<string, { ok: boolean; unavailable: boolean; error?: string }>
    assert.equal(tiers.fast.ok, true)
    assert.equal(tiers.quality.unavailable, true)
    assert.match(tiers.quality.error || '', /is not found/)
    assert.ok(Array.isArray(doc.lifecycle))
  })
})
