// Quarantined: browser-side LLM providers must not hold API keys.
// All generation goes through authenticated Cloud Functions.

function disabled(provider: string): never {
  throw new Error(
    `${provider} cannot be called from the browser. Use the authenticated /api/ai-questions/generate endpoint.`
  )
}

export async function callOpenAI(): Promise<never> {
  return disabled('OpenAI')
}

export async function callClaude(): Promise<never> {
  return disabled('Anthropic')
}

export async function callGemini(): Promise<never> {
  return disabled('Gemini')
}

export async function callAzureOpenAI(): Promise<never> {
  return disabled('Azure OpenAI')
}

export async function callCohere(): Promise<never> {
  return disabled('Cohere')
}
