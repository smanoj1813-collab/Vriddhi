// Which section transitions owe a student the mandatory gap screen.
//
// The 30-second break exists so nobody free-reads the next section's questions
// by flicking past the last one — it is an *entry* requirement for material the
// student has not met yet. It is not a toll: charging it on every crossing made
// students pay exam clock for navigation the question palette offers freely
// (section A → B → A cost 60 seconds and punished exactly the reviewing
// behaviour the palette encourages), and the copy had to promise a break "before
// each new section" while doing something harsher.
//
// So: a section plays the break the first time the student lands in it, and is
// open instantly afterwards, in either direction.
import type { PaperQuestion } from './types/assessment'

/** Sections are keyed by `sectionId`, with unsectioned papers sharing `sec-0`. */
export function sectionKeyOf(question: PaperQuestion | undefined): string {
  return question?.sectionId || 'sec-0'
}

/**
 * Does moving to `targetKey` owe a break? Never for the section the student is
 * standing in, and never for one already entered this sitting.
 */
export function shouldPlaySectionBreak(input: {
  targetKey: string
  currentKey: string
  enteredKeys: ReadonlySet<string>
}): boolean {
  if (input.targetKey === input.currentKey) return false
  return !input.enteredKeys.has(input.targetKey)
}

/**
 * Sections a resumed attempt has already been inside. Any saved entry counts —
 * including the bare `visitedAt` the page writes when a question is opened — so
 * a refresh does not bill the student another 30 seconds for a section they have
 * already worked in. This is deliberately derived from the attempt rather than
 * from component state, because the set has to survive a reload.
 */
export function enteredSectionsFromAnswers(
  questions: PaperQuestion[],
  answers: Record<string, unknown> | undefined
): Set<string> {
  const entered = new Set<string>()
  if (!answers) return entered
  for (const question of questions) {
    if (answers[question.id]) entered.add(sectionKeyOf(question))
  }
  return entered
}
