// src/shared/services/aiChatService.ts
import { auth } from '@/Firebase/config';
import { apiUrl, assertJsonResponse } from '@/shared/api/apiBase';
import { buildLocalReply, deriveChatActions, type AIChatReply, type ChatAction } from './chatResponseRules';

/**
 * Vriddhi AI chat transport.
 *
 *  1. Ask the `/api/ai/chat` Cloud Function for a grounded answer. The URL is
 *     built from the shared `API_BASE_URL` (src/shared/api/apiBase.ts) — never
 *     a relative path, which the SPA hosting rewrite would answer with
 *     index.html (HTTP 200, text/html) and silently break the feature.
 *  2. Fall back to the deterministic, role-aware composer when the AI backend
 *     is unreachable (offline, emulator without keys, cold deploy). The
 *     fallback is never silent: the failure is logged with `console.warn` and
 *     the reply is flagged `source: 'local'` so the UI can show a degraded-mode
 *     indicator.
 *
 * Formatting, the student/faculty role boundary and the action-pill mapping live
 * in `chatResponseRules.ts`, keeping that privacy-critical logic import-free.
 */

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  /** One-click deep links rendered under assistant replies. */
  actions?: ChatAction[];
  /** Where the answer came from; `local` means the offline composer answered. */
  source?: AIChatReplySource;
}

export interface SendChatMessageParams {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  context?: Record<string, unknown>;
}

/** `server` = LLM/grounded answer from the Cloud Function; `local` = offline composer. */
export type AIChatReplySource = 'server' | 'local';

export interface AIChatTransportReply extends AIChatReply {
  source: AIChatReplySource;
  /** Populated when `source === 'local'`: why the server path was not used. */
  fallbackReason?: string;
}

export type { AIChatReply, ChatAction, ChatActionIcon } from './chatResponseRules';
export { deriveChatActions, isPaperAuthoringRole } from './chatResponseRules';

export const AI_CHAT_ENDPOINT = apiUrl('/ai/chat');

/** Sends the conversation to the AI backend, falling back to local composition. */
export async function sendAIChatMessage({ messages, context }: SendChatMessageParams): Promise<AIChatTransportReply> {
  const currentUser = auth.currentUser;
  let token = '';
  if (currentUser) {
    try {
      token = await currentUser.getIdToken();
    } catch {
      // ignore — fall through to unauthenticated request
    }
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const role = String(context?.role || 'student').toLowerCase();

  // 1. Ask the backend for a live, context-grounded answer.
  let fallbackReason: string;
  try {
    const response = await fetch(AI_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, context }),
    });

    // Throws on non-2xx AND on 2xx-but-not-JSON (e.g. the SPA shell), so a
    // hosting-rewrite mishit can never masquerade as an answer.
    await assertJsonResponse(response, AI_CHAT_ENDPOINT);

    const data = await response.json();
    const content: unknown = data?.message?.content;
    if (typeof content === 'string' && content.trim()) {
      return { content, actions: deriveChatActions(lastUserMessage, role), source: 'server' };
    }
    fallbackReason = `Empty reply payload from ${AI_CHAT_ENDPOINT}`;
  } catch (err) {
    fallbackReason = err instanceof Error ? err.message : String(err);
  }

  console.warn('[AI Chat] server path failed, using local composer:', fallbackReason);

  // 2. Client-side grounded reply.
  const local = buildLocalReply(lastUserMessage, {
    role,
    name: String(context?.name || 'there'),
  });
  return { ...local, source: 'local', fallbackReason };
}
