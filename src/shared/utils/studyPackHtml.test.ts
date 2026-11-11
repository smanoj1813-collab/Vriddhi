import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { escapeHtml } from './escapeHtml'
import { buildStudyPackHtml } from './studyPackHtml'
import type { AIStudyPack } from '@/shared/services/aiStudyMaterialService'

// A study pack is written by a language model, which is steered by user prompts
// and by any document fed to it. Its printable form is written into a same-origin
// window, so every field is an injection point. These tests exist because the
// original code escaped none of them — it was a `document.write` XSS that a grep
// for `dangerouslySetInnerHTML` would never have found.

const PAYLOAD = '<img src=x onerror="globalThis.__pwned=1">'

function packWith(payload: string): AIStudyPack {
  return {
    title: payload,
    subject: payload,
    overview: payload,
    quickSummaryPoints: [payload],
    keyConcepts: [{ term: payload, definition: payload, formulaOrRule: payload, importance: payload }],
    workedExample: {
      scenario: payload,
      steps: [{ step: payload, details: payload }],
      solution: payload,
    },
    examPrep: [{ marks: payload, question: payload, expectedAnswer: payload, examTip: payload }],
  } as unknown as AIStudyPack
}

describe('escapeHtml', () => {
  it('escapes the five characters that can start markup', () => {
    assert.equal(escapeHtml('<script>&"\''), '&lt;script&gt;&amp;&quot;&#039;')
  })

  it('treats null, undefined and numbers as text', () => {
    assert.equal(escapeHtml(null), '')
    assert.equal(escapeHtml(undefined), '')
    assert.equal(escapeHtml(40), '40')
  })

  it('does not double-escape the ampersand last', () => {
    // Replacing & after < would turn "&lt;" into "&amp;lt;" and print the entity.
    assert.equal(escapeHtml('<'), '&lt;')
  })
})

describe('buildStudyPackHtml', () => {
  it('never emits model-authored markup as markup', () => {
    const html = buildStudyPackHtml(packWith(PAYLOAD), { moduleName: PAYLOAD })

    // The payload must still be *readable* — it is a formula or a title, so
    // dropping it would be wrong — but it must arrive as text, not as a tag.
    assert.ok(!html.includes('<img'), 'an <img> tag from the model reached the print window')
    assert.ok(!html.includes('onerror="'), 'a live event-handler attribute reached the print window')
    assert.ok(
      html.includes('&lt;img src=x onerror=&quot;'),
      'the payload should be present, escaped, rather than stripped',
    )
  })

  it('escapes a <script> payload too', () => {
    // Same shape, the other classic: a closing tag breaks out of the surrounding
    // element even when the opening one is harmless.
    const html = buildStudyPackHtml(packWith('</div><script>alert(1)</script>'), { moduleName: 'M' })
    assert.ok(!html.includes('<script'))
    assert.ok(!html.includes('</div><script'))
  })

  it('keeps the document usable: escaping does not eat the template', () => {
    const html = buildStudyPackHtml(packWith('Ordinary text & 50% <margin>'), { moduleName: 'Module 2' })

    // Structure survives…
    assert.ok(html.includes('<table'), 'the cheat-sheet table is missing')
    assert.ok(html.includes('Module 2'), 'the module name is missing')
    // …and text is escaped rather than dropped.
    assert.ok(html.includes('Ordinary text &amp; 50% &lt;margin&gt;'))
  })

  it('falls back to the default module label, escaped', () => {
    const html = buildStudyPackHtml(packWith('x'))
    assert.ok(html.includes('Syllabus'))
  })
})
