// Research evidence is deliberately NOT a UniversitySchemePack. Missing rules
// stay missing; neither a search result nor a draft PDF can become live policy.
import drafts from './research/karnataka-scheme-drafts.json'

export type ResearchVerification = 'partial' | 'conflict' | 'source-required' | 'identity-review'
export interface ResearchSource {
  id: string
  url: string
  title: string
  authority: 'university' | 'university-linked' | 'college-mirror' | 'candidate' | 'seed'
  access: 'read-partial' | 'index-only' | 'unavailable' | 'search-only' | 'linked-not-read'
  readScope: string
}
export interface ResearchObservation {
  topic: string
  detail: string
  locator: string
  sourceIds: string[]
  /** Extracted evidence, not defaults consumed by the assessment engine. */
  value?: unknown
}
export interface ResearchCourseRow {
  code: string
  name: string
  credits: number
  semester: number
  internalMaxMarks: number
  externalMaxMarks: number
  sourceId: string
}
export interface SchemeResearchDraft {
  format: 'vriddhi-karnataka-research-pack/v1'
  code: string
  universityCode: string
  universityName: string
  status: 'draft'
  assignable: false
  verification: ResearchVerification
  reviewedOn: string
  scope: { programme: string; framework: string; admissions: string; reviewedSemesters: number[] }
  sources: ResearchSource[]
  observations: ResearchObservation[]
  courseRows: ResearchCourseRow[]
  blockers: string[]
  identityNotes: string[]
}

/** 23 seed identities, not 23 certified university-wide regulations. */
export const KARNATAKA_SCHEME_RESEARCH = drafts as SchemeResearchDraft[]
export const RESEARCH_VERIFICATION_LABEL: Record<ResearchVerification, string> = {
  partial: 'Partial source evidence',
  conflict: 'Conflicting / unapproved source',
  'source-required': 'Governing source required',
  'identity-review': 'University identity needs review',
}
export function researchForUniversity(code: string) {
  return KARNATAKA_SCHEME_RESEARCH.find(draft => draft.universityCode === code)
}
