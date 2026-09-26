// Stand-in for the Resume Builder API client so StudentResumePage and
// ResumeAddonPanel mount for real in jsdom without the `api` function.
//
// Fixtures: `globalThis.__RC_RESUME` = { me?: ResumeMeResponse, admin?: ResumeAdminSettingsResponse }.
// Every call is recorded on `globalThis.__RC_RESUME_CALLS` so a test can assert
// autosave/preview debounce and that a download asks the server (never a
// client-side rasteriser).

function g(): any {
  return globalThis as any
}

function record(fn: string, params?: any) {
  g().__RC_RESUME_CALLS = g().__RC_RESUME_CALLS ?? []
  g().__RC_RESUME_CALLS.push({ fn, params })
}

export class ResumeCreditsExhaustedError extends Error {
  constructor(message: string, readonly used: number, readonly allowed: number, readonly templateId: string) {
    super(message)
    this.name = 'ResumeCreditsExhaustedError'
  }
}

const TEMPLATES = [
  { id: 'classic', name: 'Classic', tagline: 'Centred serif header', bestFor: 'Banking, accounts, audit', family: 'serif', accent: '#111827', defaultSectionOrder: ['summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'achievements', 'languages'], enabled: true },
  { id: 'modern', name: 'Modern', tagline: 'Left-aligned sans-serif', bestFor: 'IT services, start-ups', family: 'sans', accent: '#0f766e', defaultSectionOrder: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements', 'languages'], enabled: true },
  { id: 'compact', name: 'Compact', tagline: 'Tighter type', bestFor: 'Many internships', family: 'sans', accent: '#1e3a8a', defaultSectionOrder: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'achievements', 'languages'], enabled: true },
  { id: 'fresher', name: 'Fresher', tagline: 'Education first', bestFor: 'First job', family: 'sans', accent: '#334155', defaultSectionOrder: ['summary', 'education', 'projects', 'skills', 'experience', 'certifications', 'achievements', 'languages'], enabled: true },
  { id: 'executive', name: 'Executive', tagline: 'Large serif name', bestFor: 'MBA / M.Com', family: 'mixed', accent: '#7c2d12', defaultSectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'languages'], enabled: false },
]

export function __defaultResumeMe(overrides: any = {}) {
  return {
    enabled: true,
    cycle: '2026-27',
    settings: { downloadsPerTemplate: 3, aiAssist: false, aiCallsPerStudent: 0, templates: TEMPLATES },
    resume: null,
    credits: TEMPLATES.map((t) => ({ templateId: t.id, used: t.id === 'classic' ? 2 : 0, allowed: 3, remaining: t.id === 'classic' ? 1 : 3, enabled: t.enabled })),
    aiCredits: { used: 0, allowed: 0, remaining: 0 },
    downloads: [
      { id: 'dl-1', templateId: 'classic', templateName: 'Classic', version: 1, cycle: '2026-27', fileName: 'Bala_Kumar_Resume_Classic_v1.pdf', sizeBytes: 48211, status: 'ready', createdAt: '2026-09-20T10:00:00.000Z', readyAt: '2026-09-20T10:00:03.000Z' },
      { id: 'dl-2', templateId: 'classic', templateName: 'Classic', version: 2, cycle: '2026-27', fileName: 'Bala_Kumar_Resume_Classic_v2.pdf', sizeBytes: 49120, status: 'ready', createdAt: '2026-09-22T10:00:00.000Z', readyAt: '2026-09-22T10:00:03.000Z' },
    ],
    ...overrides,
  }
}

export async function fetchMyResume(collegeId?: string) {
  record('fetchMyResume', { collegeId })
  return g().__RC_RESUME?.me ?? __defaultResumeMe()
}

export async function saveMyResume(data: any, templateId: string, collegeId?: string) {
  record('saveMyResume', { templateId, collegeId, fullName: data?.contact?.fullName })
  return { ok: true, savedAt: new Date().toISOString(), words: 10 }
}

export async function fetchResumePreview(data: any, templateId: string, collegeId?: string) {
  record('fetchResumePreview', { templateId, collegeId, fullName: data?.contact?.fullName })
  return { html: `<!DOCTYPE html><html><body class="tpl-${templateId}"><h1>${data?.contact?.fullName ?? ''}</h1></body></html>`, words: 10 }
}

export async function fetchMyResumeDownloads() {
  record('fetchMyResumeDownloads')
  return (g().__RC_RESUME?.me ?? __defaultResumeMe()).downloads
}

export async function generateResumePdf(templateId: string, data: any, collegeId?: string) {
  record('generateResumePdf', { templateId, collegeId })
  if (g().__RC_RESUME?.exhausted) {
    throw new ResumeCreditsExhaustedError('You have used all 3 PDF downloads for the Classic template this year.', 3, 3, templateId)
  }
  return { blob: new Blob(['%PDF-1.7 stub'], { type: 'application/pdf' }), fileName: 'Resume.pdf', downloadId: 'dl-new', version: 3, creditsRemaining: 0 }
}

export async function redownloadResumePdf(downloadId: string, fallbackName = 'Resume.pdf') {
  record('redownloadResumePdf', { downloadId })
  return { blob: new Blob(['%PDF-1.7 stub'], { type: 'application/pdf' }), fileName: fallbackName, downloadId, version: null, creditsRemaining: null }
}

export function saveBlobAs(_blob: Blob, fileName: string) {
  record('saveBlobAs', { fileName })
}

export async function improveWithAi(kind: string, text: string) {
  record('improveWithAi', { kind, text })
  return { text: `Improved: ${text}`, remaining: 19 }
}

export async function fetchResumeAdminSettings(collegeId?: string) {
  record('fetchResumeAdminSettings', { collegeId })
  return (
    g().__RC_RESUME?.admin ?? {
      collegeId: collegeId ?? 'college-a',
      settings: { enabled: false, downloadsPerTemplate: 3, disabledTemplates: [], aiAssist: false, aiCallsPerStudent: 20 },
      configured: false,
      updatedAt: null,
      updatedBy: null,
      templates: TEMPLATES.map((t) => ({ id: t.id, name: t.name, tagline: t.tagline, bestFor: t.bestFor })),
      usage: { cycle: '2026-27', resumes: 12, downloads: 7, failedRenders: 0, studentsWithDownloads: 5, byTemplate: { classic: 4, modern: 3 }, recent: [] },
    }
  )
}

export async function saveResumeAdminSettings(settings: any, collegeId?: string) {
  record('saveResumeAdminSettings', { settings, collegeId })
  return { collegeId: collegeId ?? 'college-a', settings: { enabled: false, downloadsPerTemplate: 3, disabledTemplates: [], aiAssist: false, aiCallsPerStudent: 20, ...settings } }
}

export async function resetResumeCredits(params: any) {
  record('resetResumeCredits', params)
  return { ok: true, uid: 'student-domain-a', credits: TEMPLATES.map((t) => ({ templateId: t.id, used: 0, allowed: 3, remaining: 3, enabled: true })), aiUsed: 0 }
}

export async function fetchResumeAdminDownloads() {
  record('fetchResumeAdminDownloads')
  return []
}

// ── Placement Pack extensions (item 4.2) ────────────────────────────────────
// Fixtures: __RC_RESUME.pack = { coverLetter?, about?, questions?, error? }.
export async function generateCoverLetter(params: any): Promise<any> {
  record('coverLetter', params)
  const pack = g().__RC_RESUME?.pack ?? {}
  if (pack.error) throw new Error(pack.error)
  return {
    coverLetter: pack.coverLetter ?? 'Dear Hiring Team,\n\nI am applying for the Article Assistant role. ' + 'I reconciled ledgers and filed GST returns for mid-size clients. '.repeat(8),
    wordCount: 180,
    issues: [],
    source: pack.source ?? 'model',
    aiRemaining: 4,
  }
}

export async function generateLinkedinAbout(params: any): Promise<any> {
  record('linkedinAbout', params)
  const pack = g().__RC_RESUME?.pack ?? {}
  if (pack.error) throw new Error(pack.error)
  return {
    about: pack.about ?? 'I am a final-year B.Com student specialising in indirect taxation and audit.',
    wordCount: 120,
    issues: [],
    source: 'model',
    aiRemaining: 3,
  }
}

export async function generateInterviewQuestions(params: any): Promise<any> {
  record('interviewQuestions', params)
  const pack = g().__RC_RESUME?.pack ?? {}
  if (pack.error) throw new Error(pack.error)
  return {
    questions:
      pack.questions ?? [
        { question: 'Walk me through how you reconciled 120 purchase ledgers.', why: 'Checks real ownership', answerHint: 'Name the tool, the volume and the error rate you worked to.' },
      ],
    count: 1,
    issues: [],
    source: 'model',
    aiRemaining: 2,
  }
}

export async function fetchResumePlacementStats(): Promise<any> {
  record('placementStats', undefined)
  return g().__RC_RESUME?.placement ?? { collegeId: 'college-a', cycle: '2026-27', summary: { students: 0, ready: 0, nearlyThere: 0, needsWork: 0, barelyStarted: 0, averageScore: 0, downloadsThisCycle: 0 }, students: [] }
}

export async function downloadResumePlacementCsv(): Promise<void> {
  record('placementCsv', undefined)
}
