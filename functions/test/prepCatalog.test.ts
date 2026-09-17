// functions/test/prepCatalog.test.ts
//
// Data-integrity tests for the seeded Karnataka NEP/CBCS prep catalogues.
//
// These run the real `validatePrepCatalog()` from src/prepShared.ts against the
// real exported seed data for every degree program, so a referential break
// (orphan topic, missing featured question, unknown subject tag, short
// explanation, …) fails the build rather than surfacing in production.
//
// Covered programs: M.Com, B.Sc and BA are held to the full completeness
// contract (5 modules per subject, 2 questions per module, zero integrity
// errors). The pre-existing BBA seed file is a partial catalogue — 20 subjects
// with 1-3 topics each and no `degreeLevel` — so it is asserted against the
// weaker structural contract it actually satisfies, and is documented as such.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  validatePrepCatalog,
  PREP_PROGRAM_CATALOG,
  PREP_PROGRAM_CODES,
  getPrepProgramsForLevel,
  resolveSeedPrograms,
  chunkArray,
  type PrepCatalogBundle,
  type PrepSubject,
  type PrepTopic,
  type UniversalQuestion,
} from '../src/prepShared.ts'

import { BBA_SUBJECTS, SEEDED_BBA_TOPICS, SEEDED_UNIVERSAL_QUESTIONS } from '../src/data/bbaSeedData.ts'
import { MCOM_SUBJECTS, SEEDED_MCOM_TOPICS, SEEDED_MCOM_QUESTIONS } from '../src/data/mcomSeedData.ts'
import { BSC_SUBJECTS, SEEDED_BSC_TOPICS, SEEDED_BSC_QUESTIONS } from '../src/data/bscSeedData.ts'
import { BA_SUBJECTS, SEEDED_BA_TOPICS, SEEDED_BA_QUESTIONS } from '../src/data/baSeedData.ts'

interface ProgramFixture {
  programCode: string
  degreeLevel: 'undergraduate' | 'postgraduate'
  expectedSubjects: number
  expectedQuestions: number
  subjects: PrepSubject[]
  topics: Record<string, PrepTopic[]>
  questions: UniversalQuestion[]
}

/** Programs authored to the full 5-module / 80-question completeness contract. */
const COMPLETE_FIXTURES: ProgramFixture[] = [
  {
    programCode: 'mcom',
    degreeLevel: 'postgraduate',
    expectedSubjects: 8,
    expectedQuestions: 80,
    subjects: MCOM_SUBJECTS,
    topics: SEEDED_MCOM_TOPICS,
    questions: SEEDED_MCOM_QUESTIONS,
  },
  {
    programCode: 'bsc',
    degreeLevel: 'undergraduate',
    expectedSubjects: 8,
    expectedQuestions: 80,
    subjects: BSC_SUBJECTS,
    topics: SEEDED_BSC_TOPICS,
    questions: SEEDED_BSC_QUESTIONS,
  },
  {
    programCode: 'ba',
    degreeLevel: 'undergraduate',
    expectedSubjects: 8,
    expectedQuestions: 80,
    subjects: BA_SUBJECTS,
    topics: SEEDED_BA_TOPICS,
    questions: SEEDED_BA_QUESTIONS,
  },
]

/**
 * The original BBA seed file predates the completeness contract. It is checked
 * for referential soundness only, and its partial shape is pinned here so that
 * an accidental regression is still caught.
 */
const LEGACY_BBA: ProgramFixture = {
  programCode: 'bba',
  degreeLevel: 'undergraduate',
  expectedSubjects: 20,
  expectedQuestions: SEEDED_UNIVERSAL_QUESTIONS.length,
  subjects: BBA_SUBJECTS,
  topics: SEEDED_BBA_TOPICS,
  questions: SEEDED_UNIVERSAL_QUESTIONS,
}

function flattenTopics(topics: Record<string, PrepTopic[]>): PrepTopic[] {
  return Object.values(topics).flat()
}

function bundleFor(f: ProgramFixture): PrepCatalogBundle {
  return {
    programCode: f.programCode,
    subjects: f.subjects,
    topics: f.topics,
    questions: f.questions,
  }
}

describe('validatePrepCatalog over the new Karnataka catalogues', () => {
  for (const fixture of COMPLETE_FIXTURES) {
    it(`${fixture.programCode}: reports zero integrity errors`, () => {
      const report = validatePrepCatalog(bundleFor(fixture))
      const messages = report.issues
        .filter((i) => i.level === 'error')
        .map((i) => `${i.code}: ${i.message}`)
      assert.deepEqual(messages, [], `${fixture.programCode} integrity errors:\n${messages.join('\n')}`)
      assert.equal(report.valid, true)
      assert.equal(report.errorCount, 0)
    })
  }
})

describe('module counts', () => {
  for (const fixture of COMPLETE_FIXTURES) {
    it(`${fixture.programCode}: has the expected subject count`, () => {
      assert.equal(fixture.subjects.length, fixture.expectedSubjects)
    })

    it(`${fixture.programCode}: every subject has exactly five modules`, () => {
      for (const subject of fixture.subjects) {
        const topics = fixture.topics[subject.id] ?? []
        assert.equal(topics.length, 5, `${subject.id} has ${topics.length} topics, expected 5`)
      }
    })

    it(`${fixture.programCode}: module numbers run 1..5 in order within each subject`, () => {
      for (const subject of fixture.subjects) {
        const topics = fixture.topics[subject.id] ?? []
        assert.deepEqual(
          topics.map((t) => t.moduleNumber),
          [1, 2, 3, 4, 5],
          `${subject.id} module numbers out of order`
        )
        assert.deepEqual(
          topics.map((t) => t.order),
          [1, 2, 3, 4, 5],
          `${subject.id} topic order out of sequence`
        )
      }
    })

    it(`${fixture.programCode}: total topic count is five per subject`, () => {
      const report = validatePrepCatalog(bundleFor(fixture))
      assert.equal(report.topicCount, fixture.subjects.length * 5)
      assert.equal(report.subjectCount, fixture.expectedSubjects)
    })
  }
})

describe('question mapping', () => {
  for (const fixture of COMPLETE_FIXTURES) {
    const topics = flattenTopics(fixture.topics)
    const questionIds = new Set(fixture.questions.map((q) => q.id))
    const topicIds = new Set(topics.map((t) => t.id))
    const subjectIds = new Set(fixture.subjects.map((s) => s.id))

    it(`${fixture.programCode}: question ids are unique`, () => {
      assert.equal(questionIds.size, fixture.questions.length)
    })

    it(`${fixture.programCode}: has two questions per module`, () => {
      assert.equal(fixture.questions.length, topics.length * 2)
      assert.equal(fixture.questions.length, fixture.expectedQuestions)
    })

    it(`${fixture.programCode}: every featured question id resolves to a real question`, () => {
      for (const topic of topics) {
        assert.equal(topic.featuredQuestionIds.length, 2, `${topic.id} must feature two questions`)
        for (const qid of topic.featuredQuestionIds) {
          assert.ok(questionIds.has(qid), `${topic.id} features unknown question "${qid}"`)
        }
      }
    })

    it(`${fixture.programCode}: every question tags a known subject and topic`, () => {
      for (const q of fixture.questions) {
        assert.ok(subjectIds.has(q.prepTags.subjectId), `${q.id} tags unknown subject "${q.prepTags.subjectId}"`)
        for (const tid of q.prepTags.topicIds) {
          assert.ok(topicIds.has(tid), `${q.id} tags unknown topic "${tid}"`)
        }
      }
    })

    it(`${fixture.programCode}: every question is reachable from the topic that features it`, () => {
      const featured = new Set<string>()
      for (const topic of topics) {
        for (const qid of topic.featuredQuestionIds) featured.add(qid)
      }
      for (const q of fixture.questions) {
        assert.ok(featured.has(q.id), `${q.id} is not featured by any topic`)
      }
      assert.equal(featured.size, fixture.questions.length)
    })

    it(`${fixture.programCode}: questions are approved and carry at least two options`, () => {
      for (const q of fixture.questions) {
        assert.equal(q.status, 'approved', `${q.id} is not approved`)
        assert.ok(q.options.length >= 2, `${q.id} has fewer than two options`)
        assert.ok(
          q.correctIndex >= 0 && q.correctIndex < q.options.length,
          `${q.id} has an out-of-range correctIndex`
        )
      }
    })
  }
})

describe('subject metadata', () => {
  for (const fixture of COMPLETE_FIXTURES) {
    it(`${fixture.programCode}: every subject declares the matching degree level`, () => {
      for (const subject of fixture.subjects) {
        assert.equal(subject.degreeLevel, fixture.degreeLevel, `${subject.id} has the wrong degreeLevel`)
      }
    })

    it(`${fixture.programCode}: every subject lists its own program code`, () => {
      for (const subject of fixture.subjects) {
        assert.ok(
          subject.programs.includes(fixture.programCode),
          `${subject.id} does not list program "${fixture.programCode}"`
        )
      }
    })
  }

  it('new Karnataka programs exist in PREP_PROGRAM_CATALOG with the right level', () => {
    const byCode = new Map(PREP_PROGRAM_CATALOG.map((p) => [p.code, p]))
    for (const code of ['ba', 'bsc', 'mcom']) {
      assert.ok(byCode.has(code), `PREP_PROGRAM_CATALOG is missing "${code}"`)
    }
    assert.equal(byCode.get('mcom')!.degreeLevel, 'postgraduate')
    assert.equal(byCode.get('bsc')!.degreeLevel, 'undergraduate')
    assert.equal(byCode.get('ba')!.degreeLevel, 'undergraduate')
  })

  it('getPrepProgramsForLevel splits the catalog by degree level', () => {
    const ug = getPrepProgramsForLevel('undergraduate').map((p) => p.code)
    const pg = getPrepProgramsForLevel('postgraduate').map((p) => p.code)
    const all = getPrepProgramsForLevel('all').map((p) => p.code)

    assert.ok(ug.includes('ba') && ug.includes('bsc') && ug.includes('bba'))
    assert.ok(pg.includes('mcom') && pg.includes('mba'))
    assert.ok(!ug.includes('mcom') && !pg.includes('ba'))
    assert.equal(all.length, PREP_PROGRAM_CATALOG.length)
    assert.equal(all.length, ug.length + pg.length)
  })
})

describe('legacy BBA catalogue (partial, pre-dates the completeness contract)', () => {
  const topics = flattenTopics(LEGACY_BBA.topics)
  const questionIds = new Set(LEGACY_BBA.questions.map((q) => q.id))
  const topicIds = new Set(topics.map((t) => t.id))
  const subjectIds = new Set(LEGACY_BBA.subjects.map((s) => s.id))

  it('pins the known partial shape so silent drift is caught', () => {
    assert.equal(LEGACY_BBA.subjects.length, 20)
    assert.equal(topics.length, 31)
    assert.equal(LEGACY_BBA.questions.length, 31)
  })

  it('has unique subject, topic and question ids', () => {
    assert.equal(subjectIds.size, LEGACY_BBA.subjects.length)
    assert.equal(topicIds.size, topics.length)
    assert.equal(questionIds.size, LEGACY_BBA.questions.length)
  })

  it('keeps every topic under its declared subject bucket', () => {
    for (const [subjectId, list] of Object.entries(LEGACY_BBA.topics)) {
      assert.ok(subjectIds.has(subjectId), `unknown subject bucket "${subjectId}"`)
      for (const topic of list) {
        assert.equal(topic.subjectId, subjectId, `${topic.id} is filed under the wrong subject`)
      }
    }
  })

  it('tags every question with a known subject and topic', () => {
    for (const q of LEGACY_BBA.questions) {
      assert.ok(subjectIds.has(q.prepTags.subjectId), `${q.id} tags unknown subject`)
      for (const tid of q.prepTags.topicIds) {
        assert.ok(topicIds.has(tid), `${q.id} tags unknown topic "${tid}"`)
      }
    }
  })

  it('keeps questions well-formed', () => {
    for (const q of LEGACY_BBA.questions) {
      assert.ok(q.questionText.trim().length > 0, `${q.id} has no text`)
      assert.ok(q.options.length >= 2, `${q.id} has fewer than two options`)
      assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `${q.id} correctIndex out of range`)
    }
  })
})


describe('resolveSeedPrograms (master seeder selection)', () => {
  it('defaults to every program when nothing is supplied', () => {
    for (const input of [undefined, null, '', 'all', 'ALL']) {
      const r = resolveSeedPrograms(input)
      assert.equal(r.all, true, `expected all=true for ${JSON.stringify(input)}`)
      assert.deepEqual(r.programs, PREP_PROGRAM_CODES)
      assert.deepEqual(r.errors, [])
    }
  })

  it('resolves a comma-separated list and trims / lowercases it', () => {
    const r = resolveSeedPrograms(' BA , mcom ')
    assert.equal(r.all, false)
    assert.deepEqual(r.programs, ['ba', 'mcom'])
    assert.deepEqual(r.errors, [])
  })

  it('resolves an array of codes', () => {
    const r = resolveSeedPrograms(['bsc', 'ba'])
    assert.deepEqual(r.programs, ['bsc', 'ba'])
    assert.equal(r.errors.length, 0)
  })

  it('de-duplicates repeated codes', () => {
    const r = resolveSeedPrograms('ba,ba,BA')
    assert.deepEqual(r.programs, ['ba'])
  })

  it('preserves request order so the operator controls seeding sequence', () => {
    assert.deepEqual(resolveSeedPrograms(['mcom', 'bba']).programs, ['mcom', 'bba'])
    assert.deepEqual(resolveSeedPrograms('mcom,bba').programs, ['mcom', 'bba'])
    // Reversing the request reverses the result.
    assert.deepEqual(resolveSeedPrograms('bba,mcom').programs, ['bba', 'mcom'])
  })

  it('reports unknown codes instead of silently dropping them', () => {
    const r = resolveSeedPrograms('ba,phd')
    assert.deepEqual(r.programs, ['ba'])
    assert.equal(r.errors.length, 1)
    assert.match(r.errors[0], /phd/)
  })

  it('rejects a non-string, non-array payload', () => {
    const r = resolveSeedPrograms(42)
    assert.equal(r.all, false)
    assert.deepEqual(r.programs, [])
    assert.equal(r.errors.length, 1)
  })

  it('escalates to all when the token "all" appears inside a list', () => {
    const r = resolveSeedPrograms('ba,all')
    assert.equal(r.all, true)
    assert.deepEqual(r.programs, PREP_PROGRAM_CODES)
  })
})

describe('chunkArray (Firestore batch splitting)', () => {
  it('returns an empty list for empty or non-array input', () => {
    assert.deepEqual(chunkArray([], 400), [])
    assert.deepEqual(chunkArray(undefined as any, 400), [])
  })

  it('splits into chunks no larger than the limit', () => {
    const items = Array.from({ length: 900 }, (_, i) => i)
    const chunks = chunkArray(items, 400)
    assert.deepEqual(chunks.map((c) => c.length), [400, 400, 100])
    assert.deepEqual(chunks.flat(), items)
  })

  it('never produces a chunk exceeding Firestore 500-write ceiling', () => {
    const chunks = chunkArray(Array.from({ length: 466 }, (_, i) => i), 400)
    for (const c of chunks) assert.ok(c.length <= 500)
  })

  it('keeps a single chunk when the input already fits', () => {
    assert.deepEqual(chunkArray([1, 2, 3], 400), [[1, 2, 3]])
  })

  it('falls back to width 1 for a non-positive size', () => {
    assert.deepEqual(chunkArray([1, 2], 0), [[1], [2]])
  })
})
