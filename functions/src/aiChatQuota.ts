// functions/src/aiChatQuota.ts
//
// Decision D2 of docs/HANDOFF_IMPLEMENTATION_2026-09-25.md: cap the AI chat.
//
// The review (§4) found `/chat` to be 40 % of the whole AI bill and the only
// UNBOUNDED line: 225,000 calls/year modelled, no ceiling in code or UI. The
// transport-level limiter (`aiGenerationLimiter`) allows 20 calls / 15 minutes,
// which still permits thousands of turns a day.
//
// This module implements a per-student, per-day turn budget:
//   ai_chat_quota/{uid}_{YYYY-MM-DD}  { uid, day, turns, updatedAt }
// One read + one write per turn, outside the aggregate `ai_usage` document so a
// chat-heavy day cannot make that document hot.
//
// Operator knob: AI_CHAT_DAILY_TURNS (default 20). Setting it to 0 disables the
// cap entirely — the deliberate escape hatch, because a cap that cannot be
// lifted in a hurry is worse than no cap.
//
// Staff and admin roles are NOT capped: their chat is a work tool and their
// volume is bounded by headcount, not by students.

export const AI_CHAT_QUOTA_COLLECTION = 'ai_chat_quota'
export const DEFAULT_CHAT_DAILY_TURNS = 20
/** Roles the cap does not apply to. */
export const CHAT_QUOTA_EXEMPT_ROLES = ['superadmin', 'admin', 'principal', 'hod', 'faculty', 'mentor', 'accounts', 'operations']

export interface ChatQuotaState {
  turns: number
  limit: number
  remaining: number
  exceeded: boolean
  /** True when no cap applies (staff role or the limit is switched off). */
  unlimited: boolean
}

/** Configured daily turn limit; 0 (or a bad value) means "no cap". */
export function chatDailyTurnLimit(env: NodeJS.ProcessEnv = process.env): number {
  const raw = String(env.AI_CHAT_DAILY_TURNS ?? '').trim()
  // Blank means "not configured"; anything that is not a whole number is a typo,
  // and a typo must keep the cap rather than silently lift it.
  if (raw === '' || !/^\d+$/.test(raw)) return DEFAULT_CHAT_DAILY_TURNS
  return Math.floor(Number(raw))
}

export function chatQuotaApplies(role: string | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  if (chatDailyTurnLimit(env) === 0) return false
  return !CHAT_QUOTA_EXEMPT_ROLES.includes(String(role || '').toLowerCase())
}

/** Document id for one user's day. Pure, so the format is pinned by a test. */
export function chatQuotaDocId(uid: string, day: string): string {
  return `${uid}_${day}`
}

/** Current quota state from a stored document (or nothing stored yet). */
export function chatQuotaState(
  stored: { turns?: unknown } | undefined,
  role: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
): ChatQuotaState {
  const limit = chatDailyTurnLimit(env)
  const turns = Math.max(0, Math.floor(Number(stored?.turns) || 0))
  if (!chatQuotaApplies(role, env)) {
    return { turns, limit, remaining: Number.POSITIVE_INFINITY, exceeded: false, unlimited: true }
  }
  return {
    turns,
    limit,
    remaining: Math.max(0, limit - turns),
    exceeded: turns >= limit,
    unlimited: false,
  }
}

/** The 429 body — the client shows `message` verbatim. */
export function chatQuotaExceededBody(state: ChatQuotaState): Record<string, unknown> {
  return {
    error: 'chat_quota_exceeded',
    limit: state.limit,
    turns: state.turns,
    message:
      `You have used all ${state.limit} AI assistant messages for today. ` +
      'The limit resets at midnight — your notes, tests and study material are unaffected.',
  }
}
