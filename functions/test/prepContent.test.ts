// functions/test/prepContent.test.ts
//
// Decision-table unit tests for the Prep content backbone pure helpers:
// 1. Status transition machine (draft → in_review → published, curation loops)
// 2. Draft parsing and sanitization for AI / curator payloads
// 3. Practice question bounded random sampling
// 4. Academic AI prompt construction

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  validatePublishTransition,
  parsePrepDraft,
  samplePracticeQuestions,
  buildPrepAiPrompt,
} from '../src/prepShared.ts'

describe('validatePublishTransition', () => {
  it('allows initial creation without current status', () => {
    assert.deepEqual(validatePublishTransition(null, 'draft'), { allowed: true })
    assert.deepEqual(validatePublishTransition(undefined, 'draft'), { allowed: true })
    assert.deepEqual(validatePublishTransition(null, 'published'), { allowed: true })
  })

  it('allows legitimate authoring forward workflow', () => {
    assert.deepEqual(validatePublishTransition('draft', 'in_review'), { allowed: true })
    assert.deepEqual(validatePublishTransition('in_review', 'published'), { allowed: true })
    // Superadmin direct publish from draft is permitted
    assert.deepEqual(validatePublishTransition('draft', 'published'), { allowed: true })
  })

  it('allows editorial revision and rollback workflows', () => {
    assert.deepEqual(validatePublishTransition('in_review', 'draft'), { allowed: true })
    assert.deepEqual(validatePublishTransition('published', 'in_review'), { allowed: true })
    assert.deepEqual(validatePublishTransition('published', 'draft'), { allowed: true })
  })

  it('is idempotent when target equals current status', () => {
    assert.deepEqual(validatePublishTransition('draft', 'draft'), { allowed: true })
    assert.deepEqual(validatePublishTransition('in_review', 'in_review'), { allowed: true })
    assert.deepEqual(validatePublishTransition('published', 'published'), { allowed: true })
  })

  it('rejects invalid or unknown target statuses', () => {
    const r1 = validatePublishTransition('draft', 'archived')
    assert.equal(r1.allowed, false)
    assert.match(r1.reason!, /not a valid status/)

    const r2 = validatePublishTransition('draft', '')
    assert.equal(r2.allowed, false)

    const r3 = validatePublishTransition('draft', null)
    assert.equal(r3.allowed, false)
  })

  it('rejects corrupt current status', () => {
    const res = validatePublishTransition('corrupt-state', 'published')
    assert.equal(res.allowed, false)
    assert.match(res.reason!, /Current status.*is invalid/)
  })
})

describe('parsePrepDraft', () => {
  it('parses a clean JSON object containing all 4 sections', () => {
    const input = {
      explanationMd: '# Break-Even Analysis\n\nBreak-even analysis examines the point where total revenue equals total cost.',
      formulas: [
        {
          label: 'Break-Even Point (Units)',
          formula: 'Fixed Costs / (Selling Price - Variable Cost per Unit)',
          exampleQ: 'Fixed costs are ₹50,000, Selling Price is ₹20, Variable Cost is ₹10. Calculate BEP.',
          exampleA: 'BEP = 50,000 / (20 - 10) = 5,000 units.',
        },
      ],
      tricks: [
        {
          title: 'Contribution Margin Rule',
          trick: 'Contribution is Sales minus Variable Cost; at BEP, total contribution equals total fixed costs.',
          whenToUse: 'Quick verification of MCQs in exams.',
        },
      ],
      howToSolve: [
        {
          step: 'Step 1: Calculate Contribution per Unit',
          detail: 'Subtract variable cost per unit from unit selling price.',
          questionType: 'Break-even numerical problem',
        },
      ],
    }

    const res = parsePrepDraft(input)
    assert.equal(res.valid, true)
    assert.ok(res.data)
    assert.equal(res.data.explanationMd, input.explanationMd)
    assert.equal(res.data.formulas.length, 1)
    assert.equal(res.data.formulas[0].id, 'formula-1')
    assert.equal(res.data.tricks.length, 1)
    assert.equal(res.data.howToSolve.length, 1)
    assert.equal(res.errors.length, 0)
  })

  it('strips markdown code fences when LLM wraps JSON', () => {
    const raw = `\`\`\`json
{
  "explanationMd": "### Financial Accounting Principles\\nDouble entry requires every debit to have a corresponding credit of equal value.",
  "formulas": [],
  "tricks": [],
  "howToSolve": []
}
\`\`\``

    const res = parsePrepDraft(raw)
    assert.equal(res.valid, true)
    assert.ok(res.data)
    assert.match(res.data.explanationMd, /Double entry requires/)
  })

  it('rejects invalid JSON string syntax', () => {
    const res = parsePrepDraft('{"explanationMd": "broken json...')
    assert.equal(res.valid, false)
    assert.match(res.errors[0], /Invalid JSON output/)
  })

  it('flags missing or too-short explanationMd', () => {
    const res = parsePrepDraft({
      explanationMd: 'Too short',
      formulas: [],
      tricks: [],
      howToSolve: [],
    })
    assert.equal(res.valid, false)
    assert.ok(res.errors.some((e) => e.includes('explanationMd')))
  })

  it('assigns auto-increment fallback IDs when omitted', () => {
    const input = {
      explanationMd: 'Detailed academic overview of Organizational Behavior and Hawthorne Experiments in workplace dynamics.',
      formulas: [{ label: 'Span of Control', formula: 'n / r' }],
      tricks: [{ title: 'Hawthorne Effect', trick: 'Observing people improves productivity' }],
      howToSolve: [{ step: 'Identify independent variable', detail: 'Locate experimental factor' }],
    }
    const res = parsePrepDraft(input)
    assert.equal(res.valid, true)
    assert.equal(res.data!.formulas[0].id, 'formula-1')
    assert.equal(res.data!.tricks[0].id, 'trick-1')
    assert.equal(res.data!.howToSolve[0].id, 'step-1')
  })
})

describe('samplePracticeQuestions', () => {
  const pool = [
    { id: 'q1', text: 'What is P/V Ratio?' },
    { id: 'q2', text: 'Define Opportunity Cost.' },
    { id: 'q3', text: 'Explain Fayol 14 principles.' },
    { id: 'q4', text: 'What is Working Capital?' },
    { id: 'q5', text: 'Define Acid-Test Ratio.' },
  ]

  it('returns an empty array when pool is empty or invalid', () => {
    assert.deepEqual(samplePracticeQuestions([], 5), [])
    assert.deepEqual(samplePracticeQuestions(null as any, 5), [])
  })

  it('clamps requested count to pool size when requested exceeds pool', () => {
    const res = samplePracticeQuestions(pool, 10)
    assert.equal(res.length, 5)
  })

  it('samples the requested subset size', () => {
    const res = samplePracticeQuestions(pool, 3)
    assert.equal(res.length, 3)
  })

  it('produces no duplicates in the sample', () => {
    const res = samplePracticeQuestions(pool, 4)
    const ids = res.map((r) => r.id)
    assert.equal(new Set(ids).size, 4)
  })

  it('caps max sample at 30 even if a massive count is requested', () => {
    const bigPool = Array.from({ length: 50 }, (_, i) => ({ id: `q-${i}` }))
    const res = samplePracticeQuestions(bigPool, 100)
    assert.equal(res.length, 30)
  })

  it('uses custom rng deterministically for reproducible sampling', () => {
    // Deterministic fake RNG always returning 0.5
    const res1 = samplePracticeQuestions(pool, 3, () => 0.5)
    const res2 = samplePracticeQuestions(pool, 3, () => 0.5)
    assert.deepEqual(res1, res2)
  })
})

describe('buildPrepAiPrompt', () => {
  it('includes subject, topic, stream, program and schema keys', () => {
    const prompt = buildPrepAiPrompt({
      subjectName: 'Cost & Management Accounting',
      topicTitle: 'Marginal Costing & BEP',
      stream: 'commerce',
      difficulty: 'core',
      program: 'bba',
    })

    assert.ok(prompt.includes('Cost & Management Accounting'))
    assert.ok(prompt.includes('Marginal Costing & BEP'))
    assert.ok(prompt.includes('BBA'))
    assert.ok(prompt.includes('"explanationMd"'))
    assert.ok(prompt.includes('"formulas"'))
    assert.ok(prompt.includes('"tricks"'))
    assert.ok(prompt.includes('"howToSolve"'))
    assert.ok(prompt.includes('"subtopics"'))
  })

  it('customizes prompt for Karnataka State NEP curriculum when region is specified', () => {
    const prompt = buildPrepAiPrompt({
      subjectName: 'Management Principles & Applications',
      topicTitle: 'Fayol and Taylor Principles',
      stream: 'management',
      difficulty: 'core',
      program: 'bba',
      semester: 1,
      universityRegion: 'karnataka',
    })

    assert.ok(prompt.includes('Karnataka State Higher Education Council'))
    assert.ok(prompt.includes('Bangalore University'))
    assert.ok(prompt.includes('Semester 1'))
  })
})

describe('parsePrepDraft module and subtopics parsing', () => {
  it('correctly extracts moduleNumber, moduleName, and subtopics array', () => {
    const input = {
      moduleNumber: 1,
      moduleName: 'Module 1: Principles of Management',
      subtopics: [
        'Henri Fayol 14 Principles',
        'Taylor Scientific Management',
        'Scalar Chain and Gang Plank',
      ],
      explanationMd: 'Comprehensive explanation of principles of management with Karnataka university references.',
      formulas: [],
      tricks: [],
      howToSolve: [],
    }

    const res = parsePrepDraft(input)
    assert.equal(res.valid, true)
    assert.equal(res.data?.moduleNumber, 1)
    assert.equal(res.data?.moduleName, 'Module 1: Principles of Management')
    assert.deepEqual(res.data?.subtopics, [
      'Henri Fayol 14 Principles',
      'Taylor Scientific Management',
      'Scalar Chain and Gang Plank',
    ])
  })
})
