import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

// ─── LAZY INITIALIZATION ───
// Firebase v2 only injects env vars at runtime, not at module init
let _geminiClient: GoogleGenerativeAI | null = null
let _openaiClient: OpenAI | null = null
let _deepseekClient: OpenAI | null = null

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!_geminiClient) {
    const key = process.env.GEMINI_API_KEY || ''
    if (key) _geminiClient = new GoogleGenerativeAI(key)
  }
  return _geminiClient
}

function getOpenAIClient(): OpenAI | null {
  if (!_openaiClient) {
    const key = process.env.OPENAI_API_KEY || ''
    if (key) _openaiClient = new OpenAI({ apiKey: key })
  }
  return _openaiClient
}

function getDeepSeekClient(): OpenAI | null {
  if (!_deepseekClient) {
    const key = process.env.DEEPSEEK_API_KEY || ''
    if (key) _deepseekClient = new OpenAI({ apiKey: key, baseURL: 'https://api.deepseek.com/v1' })
  }
  return _deepseekClient
}

export function getAvailableProviders() {
  return {
    gemini: !!getGeminiClient(),
    openai: !!getOpenAIClient(),
    deepseek: !!getDeepSeekClient(),
  }
}

export { getGeminiClient as geminiClient, getOpenAIClient as openaiClient, getDeepSeekClient as deepseekClient }

export const providerCosts = {
  gemini: 0,
  deepseek: 0.001,
  openai: 0.15,
}

export const TIER_CONFIG = {
  basic: {
    name: 'Basic',
    dailyQuestionLimit: 10,
    providers: ['gemini'] as const,
    features: {
      mcqOnly: true,
      manualTopic: true,
      uploadMaterial: false,
      topicSearch: false,
      curriculumRoadmap: false,
      examPattern: false,
    },
  },
  premium: {
    name: 'Premium',
    dailyQuestionLimit: 100,
    providers: ['gemini', 'deepseek', 'openai'] as const,
    features: {
      mcqOnly: false,
      manualTopic: true,
      uploadMaterial: true,
      topicSearch: true,
      curriculumRoadmap: false,
      examPattern: false,
    },
  },
  advanced: {
    name: 'Advanced',
    dailyQuestionLimit: 500,
    providers: ['gemini', 'deepseek', 'openai'] as const,
    features: {
      mcqOnly: false,
      manualTopic: true,
      uploadMaterial: true,
      topicSearch: true,
      curriculumRoadmap: true,
      examPattern: true,
    },
  },
}

export type TierType = keyof typeof TIER_CONFIG