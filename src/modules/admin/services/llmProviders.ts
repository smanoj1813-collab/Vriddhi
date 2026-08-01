// src/services/llmProviders.ts
// LLM provider integrations with type-safe config

import type { AIQuestionConfig, LLMProvider } from '../types/aiQuestion'

// ─── OpenAI ─────────────────────────────────────────────────────────────
export async function callOpenAI(prompt: string, config: AIQuestionConfig): Promise<any> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured')

  const numQuestions = config.numQuestions || config.count || 5

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert educational content creator. Generate questions in valid JSON format.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: numQuestions * 800,
      temperature: config.temperature ?? 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI error: ${res.status}`)
  }

  const data = await res.json()
  return {
    text: data.choices?.[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens,
    model: data.model,
  }
}

// ─── Claude (Anthropic) ─────────────────────────────────────────────────
export async function callClaude(prompt: string, config: AIQuestionConfig): Promise<any> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Anthropic API key not configured')

  const numQuestions = config.numQuestions || config.count || 5

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: numQuestions * 800,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature ?? 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Claude error: ${res.status}`)
  }

  const data = await res.json()
  return {
    text: data.content?.[0]?.text || '',
    tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
    model: data.model,
  }
}

// ─── Gemini (Google) ──────────────────────────────────────────────────────
export async function callGemini(prompt: string, config: AIQuestionConfig): Promise<any> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const numQuestions = config.numQuestions || config.count || 5

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: numQuestions * 800,
          temperature: config.temperature ?? 0.7,
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini error: ${res.status}`)
  }

  const data = await res.json()
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    tokensUsed: data.usageMetadata?.totalTokenCount,
    model: 'gemini-1.5-flash',
  }
}

// ─── Azure OpenAI (stub) ────────────────────────────────────────────────
export async function callAzureOpenAI(prompt: string, config: AIQuestionConfig): Promise<any> {
  throw new Error('Azure OpenAI not yet implemented')
}

// ─── Cohere (stub) ──────────────────────────────────────────────────────
export async function callCohere(prompt: string, config: AIQuestionConfig): Promise<any> {
  throw new Error('Cohere not yet implemented')
}