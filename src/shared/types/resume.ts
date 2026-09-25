// src/shared/types/resume.ts
//
// Client mirror of functions/src/resume/model.ts (types + the template
// catalogue). The server is the source of truth for validation and credits;
// this file only exists so the editor can be typed without importing the
// functions package. Keep the two in step when a field is added.

export type ResumeTemplateId = 'classic' | 'modern' | 'compact' | 'fresher' | 'executive'

export type ResumeSectionId =
  | 'summary'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'achievements'
  | 'languages'

export const RESUME_SECTION_IDS: readonly ResumeSectionId[] = [
  'summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'achievements', 'languages',
]

export const RESUME_SECTION_LABELS: Record<ResumeSectionId, string> = {
  summary: 'Summary',
  education: 'Education',
  experience: 'Experience & internships',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  achievements: 'Achievements',
  languages: 'Languages',
}

export interface ResumeContact {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  website: string
}

export interface ResumeEducation {
  id: string
  institution: string
  degree: string
  field: string
  location: string
  startYear: string
  endYear: string
  score: string
  highlights: string[]
}

export interface ResumeExperience {
  id: string
  organisation: string
  role: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export interface ResumeProject {
  id: string
  name: string
  role: string
  link: string
  startDate: string
  endDate: string
  techStack: string[]
  bullets: string[]
}

export interface ResumeSkillGroup {
  id: string
  name: string
  skills: string[]
}

export interface ResumeCertification {
  id: string
  name: string
  issuer: string
  year: string
  credentialId: string
}

export interface ResumeData {
  contact: ResumeContact
  summary: string
  education: ResumeEducation[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  skills: ResumeSkillGroup[]
  certifications: ResumeCertification[]
  achievements: string[]
  languages: string[]
  sectionOrder: ResumeSectionId[]
  targetJobDescription: string
}

export interface ResumeTemplateInfo {
  id: ResumeTemplateId
  name: string
  tagline: string
  bestFor: string
  family: 'sans' | 'serif' | 'mixed'
  accent: string
  defaultSectionOrder: ResumeSectionId[]
  enabled: boolean
}

export interface ResumeTemplateCredit {
  templateId: ResumeTemplateId
  used: number
  allowed: number
  remaining: number
  enabled: boolean
}

export interface ResumeDownloadRow {
  id: string
  uid?: string
  templateId: ResumeTemplateId
  templateName: string
  version: number
  cycle: string
  fileName: string
  sizeBytes: number | null
  status: 'rendering' | 'ready' | 'failed'
  createdAt: string | null
  readyAt: string | null
  studentName?: string
  studentEmail?: string
}

export interface ResumePublicSettings {
  downloadsPerTemplate: number
  aiAssist: boolean
  aiCallsPerStudent: number
  templates: ResumeTemplateInfo[]
}

export interface ResumeMeResponse {
  enabled: boolean
  cycle: string
  settings: ResumePublicSettings
  resume: { data: ResumeData; templateId: ResumeTemplateId; updatedAt: string | null } | null
  credits: ResumeTemplateCredit[]
  aiCredits: { used: number; allowed: number; remaining: number } | null
  downloads: ResumeDownloadRow[]
}

export interface ResumeSettings {
  enabled: boolean
  downloadsPerTemplate: number
  disabledTemplates: ResumeTemplateId[]
  aiAssist: boolean
  aiCallsPerStudent: number
}

export interface ResumeUsageSummary {
  cycle: string
  resumes: number
  downloads: number
  failedRenders: number
  studentsWithDownloads: number
  byTemplate: Record<string, number>
  recent: ResumeDownloadRow[]
}

export interface ResumeAdminSettingsResponse {
  collegeId: string
  settings: ResumeSettings
  configured: boolean
  updatedAt: string | null
  updatedBy: string | null
  templates: Array<{ id: ResumeTemplateId; name: string; tagline: string; bestFor: string }>
  usage: ResumeUsageSummary
}

let idCounter = 0
/** Stable-enough ids for editor rows (the server re-validates them). */
export function newResumeId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}`
}

export function emptyResumeData(): ResumeData {
  return {
    contact: { fullName: '', headline: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
    summary: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    achievements: [],
    languages: [],
    sectionOrder: [...RESUME_SECTION_IDS],
    targetJobDescription: '',
  }
}

export interface ResumePrefillSource {
  name?: string
  email?: string
  phone?: string
  course?: string
  branch?: string
  batch?: string
  collegeName?: string
  location?: string
}

/** First-visit resume seeded from the student record so nobody starts from a blank page. */
export function prefillResumeData(source: ResumePrefillSource): ResumeData {
  const data = emptyResumeData()
  data.contact.fullName = source.name?.trim() || ''
  data.contact.email = source.email?.trim() || ''
  data.contact.phone = source.phone?.trim() || ''
  data.contact.location = source.location?.trim() || ''
  const programme = (source.course || source.branch || '').trim()
  if (programme) data.contact.headline = `${programme} student`
  const [startYear, endYear] = (source.batch || '').split(/[-–]/).map((s) => s.trim())
  if (programme || source.collegeName) {
    data.education.push({
      id: newResumeId('edu'),
      institution: source.collegeName?.trim() || '',
      degree: programme,
      field: source.course && source.branch && source.course !== source.branch ? source.branch : '',
      location: source.location?.trim() || '',
      startYear: startYear || '',
      endYear: endYear || '',
      score: '',
      highlights: [],
    })
  }
  data.skills.push({ id: newResumeId('skl'), name: 'Technical', skills: [] })
  data.languages = ['English']
  return data
}
