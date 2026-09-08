// src/shared/services/aiChatService.ts
import { auth } from '@/Firebase/config';
import { buildLocalReply, deriveChatActions, type AIChatReply, type ChatAction } from './chatResponseRules';

/**
 * Vriddhi AI chat transport.
 *
 *  1. Ask the `/api/ai/chat` Cloud Function for a grounded answer.
 *  2. Fall back to the deterministic, role-aware composer when the AI backend
 *     is unreachable (offline, emulator without keys, cold deploy).
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
}

export interface SendChatMessageParams {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  context?: Record<string, unknown>;
}

export type { AIChatReply, ChatAction, ChatActionIcon } from './chatResponseRules';
export { deriveChatActions, isPaperAuthoringRole } from './chatResponseRules';

/** Sends the conversation to the AI backend, falling back to local composition. */
export async function sendAIChatMessage({ messages, context }: SendChatMessageParams): Promise<AIChatReply> {
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
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, context }),
    });

    if (response.ok) {
      const data = await response.json();
      const content: string | undefined = data?.message?.content;
      if (content) {
        return { content, actions: deriveChatActions(lastUserMessage, role) };
      }
    }
  } catch {
    // Network or server unreachable — handled by the local fallback below.
  }

  // 2. Client-side grounded reply.
  return buildLocalReply(lastUserMessage, {
    role,
    name: String(context?.name || 'there'),
  });
}
