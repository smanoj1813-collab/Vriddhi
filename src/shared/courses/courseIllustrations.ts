import type { CourseModuleManifest } from './types'
import { COURSE_DIAGRAM_ICONS } from './illustrationTypes'
import { validateCourseProjectDiagram } from './projectDiagramValidation'

/** Keep arithmetic unrounded until presentation: forecasts can be fractional. */
export function forecastFunnel(visitors: number, rates: number[]): number[] {
  if (!Number.isFinite(visitors) || visitors < 0
    || rates.some((rate) => !Number.isFinite(rate) || rate < 0 || rate > 100)) {
    throw new RangeError('Funnel inputs must be finite; visitors ≥ 0 and rates between 0 and 100.')
  }
  return rates.reduce<number[]>((counts, rate) => [...counts, counts[counts.length - 1] * rate / 100], [visitors])
}

export function costPerAcquisition(spend: number, customers: number): number | null {
  return Number.isFinite(spend) && spend >= 0 && Number.isFinite(customers) && customers > 0
    ? spend / customers
    : null
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

/** Shared by the lazy loader, content validation and unit tests. Never trusts JSON casts. */
export function validateIllustrationBank(bank: unknown, module: CourseModuleManifest): string[] {
  const problems: string[] = []
  if (!isRecord(bank)) return ['illustrations bank must be an object']
  if (bank.moduleId !== module.id) problems.push(`illustrations moduleId must be ${module.id}`)
  if (!isRecord(bank.topics)) return [...problems, 'illustrations topics must be an object']
  const topicIds = new Set(module.topics.map((topic) => topic.id))
  const ids = new Set<string>()
  for (const topicId of topicIds) {
    if (!bank.topics[topicId]) problems.push(`${topicId}: missing visual companion`)
  }
  for (const [topicId, topic] of Object.entries(bank.topics)) {
    if (!topicIds.has(topicId)) problems.push(`${topicId}: unknown topic in illustrations bank`)
    if (!isRecord(topic)) {
      problems.push(`${topicId}: visual companion must be an object`)
      continue
    }
    if (!hasText(topic.introduction)) problems.push(`${topicId}: missing introduction`)
    if (!Array.isArray(topic.sections) || topic.sections.length === 0) {
      problems.push(`${topicId}: sections must be a non-empty array`)
      continue
    }
    const headings = new Set<string>()
    topic.sections.forEach((section: unknown, index: number) => {
      const label = `${topicId} visual ${index + 1}`
      if (!isRecord(section)) {
        problems.push(`${label}: section must be an object`)
        return
      }
      for (const field of ['id', 'section', 'title', 'explanation', 'caption', 'takeaway']) {
        if (!hasText(section[field])) problems.push(`${label}: missing ${field}`)
      }
      if (hasText(section.id)) {
        if (!/^[a-z0-9-]+$/.test(section.id)) problems.push(`${label}: id must be a lowercase slug`)
        if (ids.has(section.id)) problems.push(`${label}: duplicate id ${section.id}`)
        ids.add(section.id)
      }
      if (hasText(section.section)) {
        if (headings.has(section.section)) problems.push(`${label}: duplicate section heading`)
        headings.add(section.section)
      }
      if (section.checkpoint !== undefined && (!isRecord(section.checkpoint)
        || !hasText(section.checkpoint.question) || !hasText(section.checkpoint.answer))) {
        problems.push(`${label}: checkpoint needs a question and answer`)
      }
      const diagram = section.diagram
      if (!isRecord(diagram)) {
        problems.push(`${label}: missing diagram`)
        return
      }
      if (!['flow', 'cycle', 'hub', 'compare', 'bars', 'funnel', 'matrix', 'schedule', 'board', 'raci'].includes(String(diagram.kind))) {
        problems.push(`${label}: unknown diagram kind`)
      }
      const maxItems = diagram.kind === 'schedule' ? 12 : 6
      if (!Array.isArray(diagram.items) || diagram.items.length < 2 || diagram.items.length > maxItems) {
        problems.push(`${label}: diagram needs 2–${maxItems} items`)
        return
      }
      diagram.items.forEach((item: unknown, itemIndex: number) => {
        if (!isRecord(item) || !hasText(item.label) || !hasText(item.detail)) {
          problems.push(`${label}: item ${itemIndex + 1} needs label and detail`)
          return
        }
        if (item.icon !== undefined && !COURSE_DIAGRAM_ICONS.includes(item.icon as typeof COURSE_DIAGRAM_ICONS[number])) {
          problems.push(`${label}: unknown icon ${item.icon}`)
        }
      })
      if (diagram.center !== undefined && !hasText(diagram.center)) problems.push(`${label}: center must be non-empty text`)
      if (['bars', 'funnel', 'schedule'].includes(String(diagram.kind))
        && (!hasText(section.caption) || !/synthetic|illustrative|hypothetical/i.test(section.caption))) {
        problems.push(`${label}: numeric examples must be labelled synthetic, illustrative or hypothetical`)
      }
      if (diagram.kind === 'schedule' || diagram.kind === 'board' || diagram.kind === 'raci') {
        problems.push(...validateCourseProjectDiagram(diagram).map((problem) => `${label}: ${problem}`))
      }
      if (diagram.kind === 'bars' || diagram.kind === 'funnel') {
        if (!hasText(diagram.unit)) problems.push(`${label}: numeric diagram needs a unit`)
        let previous = Infinity
        diagram.items.forEach((item: unknown) => {
          const value = isRecord(item) ? item.value : undefined
          if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
            problems.push(`${label}: values must be finite and non-negative`)
          } else {
            if (diagram.kind === 'funnel' && value > previous) problems.push(`${label}: funnel counts cannot increase`)
            previous = value
          }
        })
        if (diagram.interactive !== undefined) {
          if (diagram.kind !== 'funnel' || diagram.interactive !== true || diagram.items.length !== 4
            || diagram.items.some((item: unknown) => !isRecord(item) || typeof item.value !== 'number' || item.value <= 0)) {
            problems.push(`${label}: interactive funnel needs four positive starting counts`)
          }
        }
      } else if (diagram.interactive !== undefined && diagram.kind !== 'schedule') {
        problems.push(`${label}: only a funnel or schedule can be interactive`)
      }
      if (diagram.kind === 'matrix') {
        for (const field of ['xLabel', 'yLabel']) {
          if (!hasText(diagram[field])) problems.push(`${label}: matrix needs ${field}`)
        }
        for (const field of ['columns', 'rows']) {
          const axis = diagram[field]
          if (!Array.isArray(axis) || axis.length !== 2 || axis.some((value) => !hasText(value))) {
            problems.push(`${label}: matrix ${field} needs two labels`)
          }
        }
        if (diagram.items.length !== 4) problems.push(`${label}: matrix needs exactly four cells`)
      }
    })
  }
  return problems
}
