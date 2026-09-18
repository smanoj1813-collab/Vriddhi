// functions/src/data/aptitudeSeedData.ts
//
// Aggregates the three placement-aptitude catalogues (Quantitative Aptitude,
// Logical Reasoning, Verbal Ability) into one seed bundle. The bundle is
// registered under the seed code 'aptitude' (see routes/prep.ts) rather than
// under a program code because every UG and PG program shares the same
// subjects — seeding it once populates it for all of them.

import type { PrepSubject, PrepTopic, UniversalQuestion } from '../prepShared'
import { QUANT_SUBJECT, QUANT_TOPICS, QUANT_QUESTIONS } from './aptitudeQuantSeedData'
import { REASONING_SUBJECT, REASONING_TOPICS, REASONING_QUESTIONS } from './aptitudeReasoningSeedData'
import { VERBAL_SUBJECT, VERBAL_TOPICS, VERBAL_QUESTIONS } from './aptitudeVerbalSeedData'

export const APTITUDE_SUBJECTS: PrepSubject[] = [QUANT_SUBJECT, REASONING_SUBJECT, VERBAL_SUBJECT]

export const SEEDED_APTITUDE_TOPICS: Record<string, PrepTopic[]> = {
  [QUANT_SUBJECT.id]: QUANT_TOPICS,
  [REASONING_SUBJECT.id]: REASONING_TOPICS,
  [VERBAL_SUBJECT.id]: VERBAL_TOPICS,
}

export const SEEDED_APTITUDE_QUESTIONS: UniversalQuestion[] = [
  ...QUANT_QUESTIONS,
  ...REASONING_QUESTIONS,
  ...VERBAL_QUESTIONS,
]
