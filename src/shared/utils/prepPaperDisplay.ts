// Honest metadata for structured papers and untranscribed, original-PDF PYQs.
// In original-file records 0 means unknown; never display it as exam metadata.
export interface PaperDisplayFields {
  contentType?: string
  programLabel?: string
  universityName?: string
  examLabel?: string
  semester?: number
  paperCode?: string | null
  maxMarks?: number
  questionCount?: number
  language?: string
  sourceFile?: { url: string }
}

export function isOriginalPdfPaper(paper: PaperDisplayFields): boolean {
  return paper.contentType === 'source_pdf'
}

export function paperLanguageLabel(language?: string): string {
  return ({ en: 'English', kn: 'Kannada', mixed: 'English / Kannada' } as Record<string, string>)[language || ''] || ''
}

export function paperMetadataLine(paper: PaperDisplayFields, universityLabel?: string, dense = false): string {
  const bits = [universityLabel ?? paper.universityName, paper.examLabel,
    paper.semester ? `Semester ${paper.semester}` : '', paper.paperCode]
  if (isOriginalPdfPaper(paper)) bits.push('PYQ · Original PDF')
  else if (!dense) {
    if (paper.maxMarks) bits.push(`${paper.maxMarks} marks`)
    if (paper.questionCount) bits.push(`${paper.questionCount} questions`)
  }
  return bits.filter(Boolean).join(' · ')
}

export function originalPaperUrl(paper: PaperDisplayFields): string | null {
  if (!isOriginalPdfPaper(paper)) return null
  try {
    const url = new URL(paper.sourceFile?.url || '')
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null
    return url.href
  } catch { return null }
}
