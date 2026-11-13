// Optional, additive visual companions to the original Markdown course packs.
// All content is plain data: no raw HTML, external embeds or charting runtime.

export const COURSE_DIAGRAM_ICONS = [
  'target', 'users', 'search', 'globe', 'message', 'mail', 'chart', 'shield',
  'check', 'clock', 'heart', 'file', 'layers', 'filter', 'repeat', 'megaphone',
  'cursor', 'sparkles', 'briefcase', 'link',
] as const
export type CourseDiagramIcon = typeof COURSE_DIAGRAM_ICONS[number]

export interface CourseDiagramItem {
  label: string
  detail: string
  icon?: CourseDiagramIcon
}

export interface CourseScheduleTask extends CourseDiagramItem {
  id: string
  /** Positive whole working days; this is duration, not person-hours. */
  duration: number
  /** Finish-to-start dependencies, no lag, on the same day-zero calendar. */
  predecessors: string[]
}

export interface CourseScheduleDiagram {
  kind: 'schedule'
  unit: 'working days'
  items: CourseScheduleTask[]
  view?: 'timeline' | 'network'
  interactive?: boolean
  /** Optional classroom scenario: one specialist must do these tasks in order. */
  resourceConstraint?: { before: string; after: string; label: string }
}

export interface CourseBoardCard {
  id: string
  label: string
  detail: string
  blocked?: boolean
}

export interface CourseBoardColumn extends CourseDiagramItem {
  cards: CourseBoardCard[]
  wipLimit?: number
  complete?: boolean
}

export type CourseRaciCode = 'R' | 'A' | 'C' | 'I' | 'RA' | '—'
export interface CourseRaciRow extends CourseDiagramItem {
  assignments: CourseRaciCode[]
}

export type CourseDiagram =
  | CourseScheduleDiagram
  | { kind: 'board'; items: CourseBoardColumn[] }
  | { kind: 'raci'; roles: string[]; items: CourseRaciRow[] }
  | { kind: 'flow' | 'cycle' | 'hub' | 'compare'; items: CourseDiagramItem[]; center?: string }
  | { kind: 'bars'; unit: string; items: (CourseDiagramItem & { value: number })[] }
  | { kind: 'funnel'; unit: string; items: (CourseDiagramItem & { value: number })[]; interactive?: boolean }
  | {
      kind: 'matrix'
      xLabel: string
      yLabel: string
      columns: [string, string]
      rows: [string, string]
      /** Row-major order: top-left, top-right, bottom-left, bottom-right. */
      items: [CourseDiagramItem, CourseDiagramItem, CourseDiagramItem, CourseDiagramItem]
    }

export interface CourseIllustration {
  id: string
  /** Exact Markdown heading. The reading itself is never edited or replaced. */
  section: string
  title: string
  explanation: string
  diagram: CourseDiagram
  /** A visible source/scale note; numeric examples must be labelled synthetic. */
  caption: string
  takeaway: string
  checkpoint?: { question: string; answer: string }
}

export interface CourseTopicIllustrations {
  introduction: string
  sections: CourseIllustration[]
}

/** One lazy-loaded file per module, including its project briefs. */
export interface CourseIllustrationBank {
  moduleId: string
  topics: Record<string, CourseTopicIllustrations>
}
