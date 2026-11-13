import type { CourseScheduleTask } from './illustrationTypes'
import { analyseCourseSchedule, applyCourseResourceConstraint } from './projectDiagrams'

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim()
const raciCodes = ['R', 'A', 'C', 'I', 'RA', '—']

/** Additional schema checks for project-specific diagrams. Common text fields are checked by the bank validator. */
export function validateCourseProjectDiagram(diagram: Record<string, unknown>): string[] {
  const problems: string[] = []
  if (!Array.isArray(diagram.items)) return ['project diagram needs an items array']
  if (diagram.kind === 'schedule') {
    if (diagram.unit !== 'working days') problems.push('schedule unit must be working days')
    if (diagram.view !== undefined && !['timeline', 'network'].includes(String(diagram.view))) problems.push('schedule view must be timeline or network')
    if (diagram.interactive !== undefined && typeof diagram.interactive !== 'boolean') problems.push('schedule interactive must be a boolean')
    let validTasks = false
    try {
      analyseCourseSchedule(diagram.items as CourseScheduleTask[])
      validTasks = true
    } catch (error) {
      problems.push(error instanceof Error ? error.message : 'invalid schedule')
    }
    if (diagram.interactive && diagram.items.some((task: unknown) => record(task) && typeof task.duration === 'number' && task.duration > 20)) {
      problems.push('interactive schedule starting durations must not exceed 20 days')
    }
    if (diagram.resourceConstraint !== undefined) {
      const constraint = diagram.resourceConstraint
      if (!record(constraint) || !text(constraint.before) || !text(constraint.after) || !text(constraint.label)) {
        problems.push('resource constraint needs before, after and label')
      } else if (validTasks) {
        try {
          applyCourseResourceConstraint(diagram.items as CourseScheduleTask[], { before: constraint.before, after: constraint.after })
        } catch (error) {
          problems.push(error instanceof Error ? error.message : 'invalid resource constraint')
        }
      }
    }
  }
  if (diagram.kind === 'board') {
    const ids = new Set<string>()
    diagram.items.forEach((column: unknown) => {
      if (!record(column)) return
      if (column.wipLimit !== undefined && (!Number.isInteger(column.wipLimit) || Number(column.wipLimit) < 1)) problems.push('board WIP limits must be positive integers')
      if (column.complete !== undefined && typeof column.complete !== 'boolean') problems.push('board complete must be a boolean')
      if (column.complete === true && column.wipLimit !== undefined) problems.push('a completed column must not have an active WIP limit')
      if (!Array.isArray(column.cards) || column.cards.length > 12) {
        problems.push('board columns need 0–12 cards')
        return
      }
      column.cards.forEach((card: unknown) => {
        if (!record(card) || !text(card.id) || !text(card.label) || !text(card.detail)) {
          problems.push('board cards need an id, label and detail')
          return
        }
        if (!/^[A-Za-z0-9-]+$/.test(card.id)) problems.push('board card IDs must be alphanumeric slugs')
        if (ids.has(card.id)) problems.push(`duplicate board card ID ${card.id}`)
        ids.add(card.id)
        if (card.blocked !== undefined && typeof card.blocked !== 'boolean') problems.push('board blocked must be a boolean')
      })
    })
  }
  if (diagram.kind === 'raci') {
    const roles = diagram.roles
    if (!Array.isArray(roles) || roles.length < 2 || roles.length > 6 || roles.some((role) => !text(role))
      || new Set(roles).size !== roles.length) problems.push('RACI needs 2–6 distinct role labels')
    diagram.items.forEach((row: unknown) => {
      if (!record(row) || !Array.isArray(row.assignments) || !Array.isArray(roles) || row.assignments.length !== roles.length) {
        problems.push('RACI assignments must match the role columns')
        return
      }
      if (row.assignments.some((code) => typeof code !== 'string' || !raciCodes.includes(code))) problems.push('invalid RACI code')
      if (row.assignments.filter((code) => code === 'A' || code === 'RA').length !== 1) problems.push('each RACI deliverable needs exactly one accountable role')
      if (!row.assignments.some((code) => code === 'R' || code === 'RA')) problems.push('each RACI deliverable needs a responsible role')
    })
  }
  return problems
}
