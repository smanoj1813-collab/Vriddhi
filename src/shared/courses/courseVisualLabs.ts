import type { CourseWorkforceScenario } from './illustrationTypes'

/** A deliberately small classroom model: one entry/exit per person, no rehires or transfers. */
export function calculateCourseWorkforce(scenario: CourseWorkforceScenario) {
  const { opening, joiners, openingLeavers, joinerLeavers } = scenario
  if (Object.values(scenario).length !== 4 || [opening, joiners, openingLeavers, joinerLeavers]
    .some((value) => !Number.isSafeInteger(value) || value < 0 || value > 200)
    || openingLeavers > opening || joinerLeavers > joiners) {
    throw new RangeError('Use whole counts from 0–200; leavers cannot exceed their own cohort.')
  }
  const leavers = openingLeavers + joinerLeavers
  const retained = opening - openingLeavers
  const closing = opening + joiners - leavers
  const average = (opening + closing) / 2
  return {
    leavers, retained, closing, average,
    turnover: average > 0 ? leavers / average * 100 : null,
    retention: opening > 0 ? retained / opening * 100 : null,
  }
}

/** A brief assembler, NOT an AI call or an assessment of output quality. */
export function assembleCoursePrompt(parts: { label: string; example: string }[], included: boolean[]) {
  return parts.filter((_, index) => included[index]).map((part) => `${part.label.toUpperCase()}\n${part.example}`).join('\n\n')
}
