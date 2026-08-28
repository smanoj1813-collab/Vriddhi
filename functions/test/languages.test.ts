import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildLanguagePromptBlock,
  getLanguageDefinition,
  normalizeLanguage,
} from '../src/services/languages.ts'
import { buildSystemPrompt } from '../src/services/promptBuilder.ts'

describe('South Indian language catalog', () => {
  it('normalizes Kannada, Tamil, Telugu, and Malayalam aliases', () => {
    assert.equal(normalizeLanguage('kannada'), 'kn')
    assert.equal(normalizeLanguage('Tamil'), 'ta')
    assert.equal(normalizeLanguage('TELUGU'), 'te')
    assert.equal(normalizeLanguage('malayalam'), 'ml')
    assert.equal(normalizeLanguage('kn'), 'kn')
  })

  it('builds native-script prompt instructions for each South Indian language', () => {
    for (const code of ['kn', 'ta', 'te', 'ml'] as const) {
      const block = buildLanguagePromptBlock(code)
      const def = getLanguageDefinition(code)
      assert.match(block, /LANGUAGE \(STRICT\)/)
      assert.ok(block.includes(def.promptName))
      assert.ok(block.includes(def.scriptName))
      assert.ok(block.includes('Do NOT transliterate'))
    }
  })

  it('embeds Kannada instructions in the AI system prompt', () => {
    const prompt = buildSystemPrompt({
      subject: 'Accountancy',
      topic: 'Journal Entries',
      branch: 'B.Com',
      course: 'B.Com',
      semester: '1',
      questionType: 'mcq',
      difficulty: 'medium',
      numQuestions: 3,
      language: 'kannada',
    })
    assert.match(prompt, /Kannada/)
    assert.match(prompt, /ಕನ್ನಡ/)
    assert.match(prompt, /South Indian/)
  })
})
