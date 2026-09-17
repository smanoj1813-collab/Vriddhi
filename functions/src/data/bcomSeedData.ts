// functions/src/data/bcomSeedData.ts
//
// B.Com (Bachelor of Commerce) seed catalogue — DERIVED, not hand-authored.
//
// WHY DERIVED
// The platform's commerce content was authored under the BA and BBA seed
// bundles (shared NEP 2020 / CBCS papers: Accounting, Economics, Business
// Law, Taxation, GST, Statistics — each tagged `programs: [..., 'bcom']` at
// authoring time) plus the two common-foundation statistics papers that live
// in the B.Sc bundle and are likewise tagged for bcom. There is no separate
// B.Com authoring pass, so inventing one here would duplicate content the
// studio already edits in place. Instead this module selects the bcom-tagged
// slice of the existing bundles:
//
//   * BCOM_SUBJECTS  — every subject whose `programs` includes 'bcom'
//                      (BA, BBA, B.Sc bundles), ordered by year/semester;
//   * SEEDED_BCOM_TOPICS — the full topic buckets of those subjects;
//   * SEEDED_BCOM_QUESTIONS — every universal practice question tagged with
//                      one of those subjects.
//
// Consequences the seeder relies on:
//   * subject documents are written EXACTLY as their source bundle writes
//     them (same id, same fields) — seeding 'bcom' and 'bba' in either order
//     never overwrites the other, because both write identical bytes for the
//     shared subjects;
//   * question / topic ids keep their source prefixes, so the ids stay
//     unique across the whole seeded database.
//
// Extend the B.Com offering by adding 'bcom' to a subject's `programs` in the
// source bundle (or authoring a dedicated bcomSeedData subject) and re-running
// Prep Studio → Seed (B.Com); the derivation picks it up automatically.

import {
  filterCatalogByPrograms,
  type PrepSubject,
  type PrepTopic,
  type UniversalQuestion,
} from '../prepShared'
import {
  BBA_SUBJECTS,
  SEEDED_BBA_TOPICS,
  SEEDED_UNIVERSAL_QUESTIONS,
} from './bbaSeedData'
import {
  BA_SUBJECTS,
  SEEDED_BA_TOPICS,
  SEEDED_BA_QUESTIONS,
} from './baSeedData'
import {
  BSC_SUBJECTS,
  SEEDED_BSC_TOPICS,
  SEEDED_BSC_QUESTIONS,
} from './bscSeedData'

const BCOM_PROGRAM = 'bcom'

interface SourceBundle {
  subjects: PrepSubject[]
  topics: Record<string, PrepTopic[]>
  questions: UniversalQuestion[]
}

/** Authoring order of the commerce content: core commerce papers first. */
const SOURCES: SourceBundle[] = [
  { subjects: BBA_SUBJECTS, topics: SEEDED_BBA_TOPICS, questions: SEEDED_UNIVERSAL_QUESTIONS },
  { subjects: BA_SUBJECTS, topics: SEEDED_BA_TOPICS, questions: SEEDED_BA_QUESTIONS },
  { subjects: BSC_SUBJECTS, topics: SEEDED_BSC_TOPICS, questions: SEEDED_BSC_QUESTIONS },
]

const YEAR_ORDER: Record<string, number> = {
  '1st-year': 1,
  '2nd-year': 2,
  'final-year': 3,
}

/**
 * Selects the bcom-tagged subjects from every source bundle and orders them
 * the way a B.Com student meets them: year group, then semester, then the
 * subject's original order within its bundle. `order` is renumbered 1..N so
 * the studio's "by order" listing is stable across mixed bundles (the source
 * bundles each start their own numbering at 1).
 */
function deriveSubjects(): PrepSubject[] {
  const picked: PrepSubject[] = []
  for (const source of SOURCES) {
    const tagged = filterCatalogByPrograms(source.subjects, [BCOM_PROGRAM])
    picked.push(...tagged)
  }
  picked.sort((a, b) => {
    const year = (YEAR_ORDER[a.yearGroup || ''] || 99) - (YEAR_ORDER[b.yearGroup || ''] || 99)
    if (year !== 0) return year
    const sem = (a.semester || 99) - (b.semester || 99)
    if (sem !== 0) return sem
    return (a.order || 0) - (b.order || 0)
  })
  return picked.map((subject, index) => ({ ...subject, order: index + 1 }))
}

const BCOM_SUBJECT_LIST: PrepSubject[] = deriveSubjects()
const BCOM_SUBJECT_IDS: ReadonlySet<string> = new Set(BCOM_SUBJECT_LIST.map((s) => s.id))

/**
 * Topic buckets for the picked subjects only, copied verbatim from the
 * source bundle that owns each subject. Buckets whose subject was not picked
 * are excluded so the bundle never references a subject it does not seed.
 */
function deriveTopics(): Record<string, PrepTopic[]> {
  const topics: Record<string, PrepTopic[]> = {}
  for (const source of SOURCES) {
    for (const [subjectId, list] of Object.entries(source.topics)) {
      if (BCOM_SUBJECT_IDS.has(subjectId) && !topics[subjectId]) {
        topics[subjectId] = list
      }
    }
  }
  return topics
}

const BCOM_TOPIC_MAP: Record<string, PrepTopic[]> = deriveTopics()

/**
 * Practice questions that hang off a picked subject. The `program` tag on a
 * question is authorship metadata (it says which bundle wrote it), so it is
 * left untouched — practice selection filters by topic/subject, not program.
 * A seen-id guard makes duplicate tags across bundles impossible-by-
 * construction rather than by hope.
 */
function deriveQuestions(): UniversalQuestion[] {
  const questions: UniversalQuestion[] = []
  const seen = new Set<string>()
  for (const source of SOURCES) {
    for (const question of source.questions) {
      const subjectId = question.prepTags?.subjectId
      if (subjectId && BCOM_SUBJECT_IDS.has(subjectId) && !seen.has(question.id)) {
        seen.add(question.id)
        questions.push(question)
      }
    }
  }
  return questions
}

const BCOM_QUESTIONS: UniversalQuestion[] = deriveQuestions()

export const BCOM_SUBJECTS: PrepSubject[] = BCOM_SUBJECT_LIST
export const SEEDED_BCOM_TOPICS: Record<string, PrepTopic[]> = BCOM_TOPIC_MAP
export const SEEDED_BCOM_QUESTIONS: UniversalQuestion[] = BCOM_QUESTIONS
