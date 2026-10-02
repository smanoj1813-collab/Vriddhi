// Original-PDF PYQs: catalogue the user's files without inventing university,
// exam metadata, transcriptions or answer keys. No Drive/API requests here.
import { createHash } from 'node:crypto'
import { PREP_PROGRAM_CATALOG } from './prepShared'
import type { PrepPaper, PrepPaperSource } from './prepPapers'

export const PREP_PAPER_FILE_SEED_CODE = 'pyq-files'
export type PrepPaperLanguage = 'en' | 'kn' | 'mixed' | 'und'

// Paper-only categories do NOT create academic study packs or claim enrolment.
export const PREP_PAPER_FILE_PROGRAMS = [
  { code: 'bsw', label: 'BSW', degreeLevel: 'undergraduate' as const },
  { code: 'ma', label: 'MA', degreeLevel: 'postgraduate' as const },
  { code: 'med', label: 'M.Ed', degreeLevel: 'postgraduate' as const },
  { code: 'mlib', label: 'M.Lib', degreeLevel: 'postgraduate' as const },
  { code: 'msw', label: 'MSW', degreeLevel: 'postgraduate' as const },
  { code: 'languages', label: 'Languages', degreeLevel: 'undergraduate' as const },
  { code: 'open-electives', label: 'Open Electives', degreeLevel: 'postgraduate' as const },
  { code: 'ug-open-elective', label: 'UG Open Elective', degreeLevel: 'undergraduate' as const },
]

export interface PrepPaperFileReference {
  fileName: string
  url: string
  folderPath?: string
  driveFileId?: string
}

export interface PrepPaperFileSeed {
  contentType: 'source_pdf'
  id?: string
  program: string
  semester?: number
  subject?: string
  subjectName?: string
  subjectArea?: string
  language?: PrepPaperLanguage
  // Only supply metadata verified against the original. Absent numbers expand
  // to 0 (unknown), and MUST NOT appear as "year 0" / "0 marks" in the UI.
  scheme?: string
  paperCode?: string
  examMonth?: string
  examYear?: number
  durationMinutes?: number
  maxMarks?: number
  sourceFile: PrepPaperFileReference
  source: PrepPaperSource
  tags?: string[]
  status?: 'draft' | 'published'
}

export interface DrivePyqGroup {
  folderPath: string
  program: string
  semester: number
  /** Original filename and case-sensitive public Drive file id. */
  files: Array<[string, string]>
}

export function sourcePdfPaperId(file: PrepPaperFileReference): string {
  const identity = file.driveFileId || file.url
  return `pyq-file-${createHash('sha256').update(identity).digest('hex').slice(0, 24)}`
}

export function isSafePaperUrl(raw: unknown): boolean {
  try {
    const url = new URL(String(raw || ''))
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password
  } catch {
    return false
  }
}

/** Restrict language SUBJECTS, not the script of an untranscribed business paper. */
export function pyqLanguageSelection(folderPath: string, fileName: string): { include: boolean; language: PrepPaperLanguage; reason?: string } {
  const path = folderPath.toLowerCase().replace(/\\/g, '/')
  const name = fileName.toLowerCase()
  if (/(?:^|\/)(?:hindi|sanskrit|telugu|urdu|tamil|malayalam)(?:\/|$)/.test(path) ||
      /^(?:bhn|bsn|btu|bur)[-\s_]/.test(name) || /^elm(?:hn|tl|ur)[-\s_]/.test(name)) {
    return { include: false, language: 'und', reason: 'Language subject other than English or Kannada' }
  }
  if (/(?:^|\/)kannada(?:\/|$)/.test(path) || /kannada|ಕನ್ನಡ/.test(name) || /^bkn[-\s_]/.test(name) || /^elmkan[-\s_]/.test(name)) {
    return { include: true, language: 'kn' }
  }
  if (/(?:^|\/)english(?:\/|$)/.test(path) || /\benglish\b/.test(name) || /^ben[-\s_]/.test(name) || /^elmen[-\s_]/.test(name)) {
    return { include: true, language: 'en' }
  }
  if (/(?:^|\/)languages(?:\/|$)/.test(path)) {
    return { include: false, language: 'und', reason: 'Unrecognised language subject; needs review' }
  }
  return { include: true, language: 'und' }
}

export function expandPrepPaperFileSeed(seed: PrepPaperFileSeed): PrepPaper {
  const program = String(seed.program || '').toLowerCase().trim()
  const info = [...PREP_PROGRAM_CATALOG, ...PREP_PAPER_FILE_PROGRAMS].find((p) => p.code === program)
  const rawFile = seed.sourceFile
  const file: PrepPaperFileReference = {
    fileName: String(rawFile?.fileName || ''),
    url: String(rawFile?.url || ''),
    ...(rawFile?.folderPath ? { folderPath: String(rawFile.folderPath) } : {}),
    ...(rawFile?.driveFileId ? { driveFileId: String(rawFile.driveFileId) } : {}),
  }
  const year = seed.examYear == null ? 0 : Number(seed.examYear)
  const month = String(seed.examMonth || '').trim()
  const semester = seed.semester == null ? 0 : Number(seed.semester)
  const language = seed.language || 'und'
  return {
    id: seed.id ? String(seed.id) : sourcePdfPaperId(file),
    contentType: 'source_pdf',
    isPYQ: true,
    sourceFile: file,
    program,
    programLabel: info?.label || program.toUpperCase(),
    degreeLevel: info?.degreeLevel || 'undergraduate',
    universityCode: '',
    universityName: '',
    scheme: String(seed.scheme || '').trim(),
    semester,
    subjectName: String(seed.subject || seed.subjectName || file.fileName.replace(/\.pdf$/i, '')).trim(),
    subjectArea: seed.subjectArea || null,
    paperCode: seed.paperCode || null,
    paperNumber: null,
    examMonth: month,
    examYear: year,
    examLabel: [month, year > 0 ? String(year) : ''].filter(Boolean).join(' '),
    durationMinutes: seed.durationMinutes == null ? 0 : Number(seed.durationMinutes),
    maxMarks: seed.maxMarks == null ? 0 : Number(seed.maxMarks),
    instructions: [],
    sections: [],
    questionCount: 0,
    prepSubjectId: null,
    tags: Array.from(new Set(['pyq', 'original-pdf', 'user-supplied', program,
      ...(semester ? [`sem-${semester}`] : []), ...(Array.isArray(seed.tags) ? seed.tags.map(String) : []),
      ...(language !== 'und' ? [language] : [])])),
    source: seed.source,
    language,
    status: seed.status === 'draft' ? 'draft' : 'published',
    tier: 'free',
    contentVersion: 1,
  }
}

/** Public folder listing → link-only seeds. Never download/OCR/publish files. */
export function prepareDrivePyqFiles(groups: DrivePyqGroup[], recordedOn: string): {
  papers: PrepPaper[]
  excluded: Array<{ folderPath: string; fileName: string; reason: string }>
  duplicateFileIds: string[]
} {
  const papers: PrepPaper[] = []
  const excluded: Array<{ folderPath: string; fileName: string; reason: string }> = []
  const seen = new Set<string>()
  const duplicateFileIds: string[] = []
  for (const group of groups) {
    for (const [fileName, fileId] of group.files) {
      if (!/\.pdf$/i.test(fileName)) {
        excluded.push({ folderPath: group.folderPath, fileName, reason: 'Not a PDF paper' })
        continue
      }
      const selection = pyqLanguageSelection(group.folderPath, fileName)
      if (!selection.include) {
        excluded.push({ folderPath: group.folderPath, fileName, reason: selection.reason! })
        continue
      }
      if (seen.has(fileId)) { duplicateFileIds.push(fileId); continue }
      seen.add(fileId)
      const url = `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`
      const languageLabel = group.program === 'languages' ? (selection.language === 'kn' ? 'Kannada' : 'English') : ''
      papers.push(expandPrepPaperFileSeed({
        contentType: 'source_pdf',
        program: group.program,
        semester: group.semester,
        subject: [languageLabel, fileName.replace(/\.pdf$/i, '')].filter(Boolean).join(' — '),
        language: selection.language,
        sourceFile: { fileName, url, folderPath: group.folderPath, driveFileId: fileId },
        source: {
          title: fileName,
          url,
          publisher: 'User-provided PYQ collection',
          retrievedOn: recordedOn,
          note: 'Original PDF link. University not assigned; question text and exam metadata have not been transcribed or inferred.',
        },
      }))
    }
  }
  return { papers, excluded, duplicateFileIds }
}

/** Create-only seeding preserves reviewed/transcribed or hidden existing rows. */
export function planNewPaperFileSeeds(papers: PrepPaper[], existingIds: Iterable<string>): { papers: PrepPaper[]; skipped: number } {
  const existing = new Set(existingIds)
  const pending = papers.filter((paper) => !existing.has(paper.id))
  return { papers: pending, skipped: papers.length - pending.length }
}

/** Operator-facing result for first and repeat source-file seeding passes. */
export function paperFileSeedResultMessage(added: number, skipped: number): string {
  return `Added ${added} original-PDF PYQ link${added === 1 ? '' : 's'}; preserved ${skipped} existing record${skipped === 1 ? '' : 's'}.`
}
