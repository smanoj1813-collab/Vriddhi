// functions/src/config/aiModels.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// THE ONLY PLACE A GEMINI MODEL ID MAY APPEAR AS A LITERAL
// ─────────────────────────────────────────────────────────────────────────────
//
// Why this file exists (clause A1/A2/A3 of docs/HANDOFF_REVIEW_2026-09-25.md):
//
//  * `gemini-1.5-flash` was shut down on 29 Sep 2025 and the code still called
//    it a year later from three routes. A model id written into a call site is
//    a silent outage waiting for a calendar date, so every call site now asks
//    this registry instead. `functions/test/aiModels.test.ts` greps the source
//    and fails the build if a `gemini-*` literal reappears outside this file.
//
//  * A tier is an ORDERED LIST, not one id. If a model stops answering, the
//    next one in the same tier is tried BEFORE the DeepSeek/OpenAI provider
//    fallback, so a retired model degrades quality instead of taking the
//    feature down (clause A1).
//
//  * Model ids carry a lifecycle (`shutdownOn`). The dates below come from
//    documented Google announcements and must be re-checked quarterly —
//    `describeModelLifecycle()` is what the daily canary logs, so an expiry is
//    a log line months ahead instead of a 404 in production (clause A2).
//
//  * 3.x models bill "thinking" tokens at the OUTPUT rate and cache hits at a
//    discount. `readGeminiUsage()` returns them so `ai_usage` stays honest
//    when the tiers change (clause A3).
//
// Operator knobs (no code change, no redeploy of app code):
//   GEMINI_MODEL_FAST="gemini-3.1-flash-lite"        — replace the fast list
//   GEMINI_MODEL_QUALITY="gemini-2.5-flash"          — replace the quality list
//   Both accept a comma-separated list, first entry first.
//
// Prices/retirement dates in the notes are the ones published on
// ai.google.dev on 25 Sep 2026 (see docs/HANDOFF_REVIEW_2026-09-25.md §4).
// ─────────────────────────────────────────────────────────────────────────────

export type AiTier = 'fast' | 'quality'

export interface GeminiModelEntry {
  /** The exact `model` argument passed to the SDK. */
  id: string
  /** ISO date the model is announced to stop answering. Absent = no published date. */
  shutdownOn?: string
  /** Why this entry sits where it sits in the list. */
  note?: string
}

/**
 * Default tiers.
 *
 * `fast`   — chat, study material, prep drafts, AI suggestions. Cheap, high volume.
 * `quality`— paper parsing, grading suggestions, question generation. Do not
 *            downgrade these to the fast tier: a cheaper model that mis-reads a
 *            question paper costs more in human review than it saves in tokens.
 */
export const DEFAULT_GEMINI_TIERS: Record<AiTier, GeminiModelEntry[]> = {
  fast: [
    {
      id: 'gemini-2.5-flash-lite',
      shutdownOn: '2026-10-20',
      note: 'cheapest tier today; retirement signalled on the Cloud/enterprise surface for Oct 2026',
    },
    {
      id: 'gemini-3.1-flash-lite',
      shutdownOn: '2027-05-07',
      note: 'the documented replacement once the 2.5 series retires',
    },
    {
      id: 'gemini-2.5-flash',
      note: 'last resort so a fast-tier outage still answers the user (pricier; telemetry logs the model actually used)',
    },
  ],
  quality: [
    {
      id: 'gemini-2.5-flash',
      shutdownOn: '2026-10-20',
      note: 'current baseline for parsing/grading; retire on the same signalled date as the fast tier',
    },
    {
      id: 'gemini-3.6-flash',
      note: 'replacement tier; list price doubles 1 Jan 2027',
    },
  ],
}

export const MODEL_ENV_KEYS: Record<AiTier, string> = {
  fast: 'GEMINI_MODEL_FAST',
  quality: 'GEMINI_MODEL_QUALITY',
}

function parseModelList(raw: string | undefined | null): string[] {
  return String(raw ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

/**
 * The ordered entries for a tier. Reads the environment on every call (v2
 * functions inject env at runtime, and tests need to switch it per case).
 */
export function geminiModelEntries(tier: AiTier): GeminiModelEntry[] {
  const override = parseModelList(process.env[MODEL_ENV_KEYS[tier]])
  if (override.length > 0) {
    return override.map((id) => ({ id, note: `set by ${MODEL_ENV_KEYS[tier]}` }))
  }
  return DEFAULT_GEMINI_TIERS[tier]
}

/**
 * Ordered model ids for a tier. `leading` entries (call-site-specific env
 * overrides such as RESUME_AI_MODEL / QUESTION_IMPORT_AI_MODEL) are tried first
 * and de-duplicated against the tier list.
 */
export function geminiModelsFor(tier: AiTier, leading?: Array<string | undefined | null>): string[] {
  const extras = (leading ?? []).map((id) => String(id ?? '').trim()).filter(Boolean)
  const all = [...extras, ...geminiModelEntries(tier).map((entry) => entry.id)]
  return all.filter((id, index) => all.indexOf(id) === index)
}

/** The first model a tier will try — for places that only need a name (logs, audit rows). */
export function primaryGeminiModel(tier: AiTier): string {
  return geminiModelsFor(tier)[0]
}

/** Human-readable lifecycle summary for logs / the canary / docs. */
export function describeModelLifecycle(): string[] {
  const lines: string[] = []
  for (const tier of Object.keys(DEFAULT_GEMINI_TIERS) as AiTier[]) {
    for (const entry of geminiModelEntries(tier)) {
      lines.push(
        `${tier}: ${entry.id}${entry.shutdownOn ? ` (retires ${entry.shutdownOn})` : ''}${
          entry.note ? ` — ${entry.note}` : ''
        }`,
      )
    }
  }
  return lines
}

// ─── Fallback ────────────────────────────────────────────────────────────────

const UNAVAILABLE_TEXT =
  /(not found|not supported|unsupported|does not exist|no longer (?:available|supported)|has been (?:deprecated|retired|shut ?down|discontinued)|invalid model|model[^.]{0,60}(?:retired|deprecated|shut ?down))/i
const NAMES_A_MODEL = /model/i

/**
 * True when the error says "this model is not usable" — as opposed to a
 * transient failure (timeout, quota, bad prompt) where trying a different
 * model would just spend another call on the same bad input.
 */
export function isModelUnavailableError(err: unknown): boolean {
  if (err === null || err === undefined) return false
  const candidate = err as { status?: unknown; statusCode?: unknown; code?: unknown; message?: unknown }
  const status = Number(candidate.status ?? candidate.statusCode ?? 0)
  const rawCode = String(candidate.code ?? '')
  const message = typeof candidate.message === 'string' ? candidate.message : String(candidate.message ?? '')

  if (status === 404) return true
  if (/NOT_FOUND|UNIMPLEMENTED|INVALID_ARGUMENT/i.test(rawCode)) return true
  if (status === 400 && NAMES_A_MODEL.test(message)) return true
  return NAMES_A_MODEL.test(message) && UNAVAILABLE_TEXT.test(message)
}

export interface GeminiUsage {
  /** promptTokenCount. Includes cached tokens — they are billed at a discount, not free. */
  tokensIn: number
  /** candidatesTokenCount + thoughtsTokenCount, ready to bill as output. */
  tokensOut: number
  /** Subset of tokensOut billed as thinking. Reported separately for the cost meter. */
  thinkingTokens: number
  /** Subset of tokensIn served from a context cache (prompt-priced, discounted). */
  cachedTokens: number
}

/** Normalises `response.usageMetadata` (or any provider's) into billable numbers. */
export function readGeminiUsage(metadata: unknown): GeminiUsage {
  const usage = (metadata ?? {}) as Record<string, unknown>
  const num = (key: string): number => {
    const value = Number(usage[key])
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
  }
  const candidates = num('candidatesTokenCount')
  const thinking = num('thoughtsTokenCount')
  return {
    tokensIn: num('promptTokenCount'),
    tokensOut: candidates + thinking,
    thinkingTokens: thinking,
    cachedTokens: num('cachedContentTokenCount'),
  }
}

export interface ModelFallbackHooks {
  /** Called when a model is rejected and the next one in the tier is about to be tried. */
  onFallback?: (info: { failedModel: string; nextModel: string; error: unknown }) => void
}

/**
 * Runs `run(modelId)` against the tier's models in order, moving to the next
 * entry only when the error means the model itself is unusable.
 * Returns the result and the model that produced it, so callers can log/audit
 * which model really answered.
 */
export async function generateWithGeminiFallback<T>(
  tier: AiTier,
  run: (modelId: string) => Promise<T>,
  hooks?: ModelFallbackHooks,
): Promise<{ result: T; model: string }> {
  const models = geminiModelsFor(tier)
  if (models.length === 0) throw new Error(`No Gemini model configured for the "${tier}" tier`)

  let lastError: unknown = new Error(`No Gemini model answered for the "${tier}" tier`)
  for (let index = 0; index < models.length; index += 1) {
    const model = models[index]
    try {
      return { result: await run(model), model }
    } catch (error) {
      lastError = error
      const hasNext = index < models.length - 1
      if (!hasNext || !isModelUnavailableError(error)) throw error
      hooks?.onFallback?.({ failedModel: model, nextModel: models[index + 1], error })
    }
  }
  throw lastError
}
