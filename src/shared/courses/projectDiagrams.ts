import type { CourseBoardColumn, CourseScheduleTask } from './illustrationTypes'

export interface ScheduledCourseTask extends CourseScheduleTask {
  earliestStart: number
  earliestFinish: number
  latestStart: number
  latestFinish: number
  totalFloat: number
  critical: boolean
  /** Topological depth for an illustrative network, not a time coordinate. */
  depth: number
}

export interface CourseScheduleAnalysis {
  duration: number
  tasks: ScheduledCourseTask[]
  /** A set, not a claimed single path: parallel critical branches are possible. */
  criticalTaskIds: string[]
}

/**
 * Small deterministic CPM teaching model: finish-to-start, no lag, day zero,
 * positive integral working-day durations, unlimited resources unless a
 * separate precedence constraint has explicitly been added by the scenario.
 */
export function analyseCourseSchedule(tasks: CourseScheduleTask[]): CourseScheduleAnalysis {
  if (!Array.isArray(tasks) || tasks.length < 2 || tasks.length > 12) {
    throw new RangeError('A teaching schedule needs 2–12 tasks.')
  }
  const byId = new Map<string, CourseScheduleTask>()
  for (const task of tasks) {
    if (!task || typeof task.id !== 'string' || !/^[A-Za-z][A-Za-z0-9-]*$/.test(task.id)) {
      throw new Error('Task IDs must be non-empty alphanumeric slugs starting with a letter.')
    }
    if (byId.has(task.id)) throw new Error(`Duplicate task ID: ${task.id}.`)
    if (!Number.isInteger(task.duration) || task.duration < 1 || task.duration > 60) {
      throw new RangeError(`${task.id}: duration must be 1–60 whole working days.`)
    }
    if (!Array.isArray(task.predecessors) || task.predecessors.some((id) => typeof id !== 'string' || !id.trim())) {
      throw new Error(`${task.id}: predecessors must be an array of task IDs.`)
    }
    if (new Set(task.predecessors).size !== task.predecessors.length) throw new Error(`${task.id}: duplicate dependency.`)
    byId.set(task.id, task)
  }
  const successors = new Map(tasks.map((task) => [task.id, [] as string[]]))
  for (const task of tasks) {
    for (const predecessor of task.predecessors) {
      if (!byId.has(predecessor)) throw new Error(`${task.id}: unknown predecessor ${predecessor}.`)
      if (predecessor === task.id) throw new Error(`${task.id}: self-dependency is not allowed.`)
      successors.get(predecessor)!.push(task.id)
    }
  }
  const indegree = new Map(tasks.map((task) => [task.id, task.predecessors.length]))
  const queue = tasks.filter((task) => !task.predecessors.length).map((task) => task.id)
  const scheduled = new Map<string, ScheduledCourseTask>()
  for (let index = 0; index < queue.length; index++) {
    const task = byId.get(queue[index])!
    const predecessors = task.predecessors.map((id) => scheduled.get(id)!)
    const start = Math.max(0, ...predecessors.map((item) => item.earliestFinish))
    scheduled.set(task.id, {
      ...task,
      predecessors: [...task.predecessors],
      earliestStart: start, earliestFinish: start + task.duration,
      latestStart: 0, latestFinish: 0, totalFloat: 0, critical: false,
      depth: predecessors.length ? Math.max(...predecessors.map((item) => item.depth)) + 1 : 0,
    })
    for (const successor of successors.get(task.id)!) {
      const remaining = indegree.get(successor)! - 1
      indegree.set(successor, remaining)
      if (remaining === 0) queue.push(successor)
    }
  }
  if (scheduled.size !== tasks.length) throw new Error('Schedule dependencies contain a cycle.')
  const duration = Math.max(...[...scheduled.values()].map((task) => task.earliestFinish))
  for (const id of [...queue].reverse()) {
    const task = scheduled.get(id)!
    const next = successors.get(id)!
    task.latestFinish = next.length ? Math.min(...next.map((successor) => scheduled.get(successor)!.latestStart)) : duration
    task.latestStart = task.latestFinish - task.duration
    task.totalFloat = task.latestStart - task.earliestStart
    task.critical = task.totalFloat === 0
  }
  const ordered = queue.map((id) => scheduled.get(id)!)
  return { duration, tasks: ordered, criticalTaskIds: ordered.filter((task) => task.critical).map((task) => task.id) }
}

/** Add the explicit resource-order assumption without changing the source tasks. */
export function applyCourseResourceConstraint(
  tasks: CourseScheduleTask[],
  constraint: { before: string; after: string },
): CourseScheduleTask[] {
  if (constraint.before === constraint.after || !tasks.some((task) => task.id === constraint.before)
    || !tasks.some((task) => task.id === constraint.after)) throw new Error('Resource constraint must reference two different known tasks.')
  const changed = tasks.map((task) => ({
    ...task,
    predecessors: task.id === constraint.after
      ? [...new Set([...task.predecessors, constraint.before])]
      : [...task.predecessors],
  }))
  analyseCourseSchedule(changed)
  return changed
}

/** Blocked items still count; only explicitly completed columns are outside WIP. */
export function summariseCourseBoard(columns: CourseBoardColumn[]) {
  return columns.map((column) => ({
    label: column.label,
    count: column.cards.length,
    blocked: column.cards.filter((card) => card.blocked).length,
    overLimit: column.wipLimit !== undefined && column.cards.length > column.wipLimit,
    activeCount: column.complete ? 0 : column.cards.length,
  }))
}
