// src/shared/utils/pdfGenerator.ts
// Client-side PDF generation using jspdf + html2canvas.
//
// This is the browser-side fallback for the Puppeteer renderer in the `api`
// Cloud Function (see pdfDownloader.ts). Output is an image-based PDF, so text
// is not selectable and pagination is approximate — good enough to never leave
// a teacher without a printable paper.

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Self-contained interface — decoupled from question bank Paper type
export interface PaperPDF {
  title: string
  subject?: string
  duration: number
  totalMarks: number
  instructions?: string | string[]
  negativeMarking?: boolean
  passingPercentage?: number
  sections?: Array<{
    name?: string
    title?: string
    numQuestions?: number
    marksPerQuestion?: number
    instructions?: string
    questions?: Array<{
      text: string
      marks?: number
      options?: Array<{ text?: string } | string>
    }>
  }>
}

/** Minimal question shape for the question-bank export fallback. */
export interface QuestionPDF {
  id: string
  text: string
  type?: string
  difficulty?: string
  subject?: string
  chapter?: string
  topic?: string
  marks?: number
  options?: Array<{ text?: string; isCorrect?: boolean } | string>
  correctAnswer?: string | string[]
  explanation?: string
}

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function downloadElementAsPDF(
  elementId: string,
  filename: string,
  options: { orientation?: 'p' | 'l'; scale?: number; root?: Document } = {}
): Promise<void> {
  const root = options.root || document
  const element = root.getElementById(elementId)
  if (!element) {
    console.error(`[PDF] Element #${elementId} not found`)
    return
  }

  const canvas = await html2canvas(element, {
    scale: options.scale || 2,
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const orientation = options.orientation || 'p'
  const pdf = new jsPDF(orientation, 'mm', 'a4')

  const pageWidth = orientation === 'p' ? 210 : 297
  const pageHeight = orientation === 'p' ? 297 : 210
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(`${filename}.pdf`)
}

const PAPER_STYLES = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; background: #fff; }
    .paper-container { max-width: 210mm; margin: 0 auto; padding: 20mm; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
    .college-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; }
    .exam-title { font-size: 14pt; font-weight: bold; margin-top: 8px; }
    .meta-row { display: flex; justify-content: space-between; margin: 15px 0; font-size: 11pt; }
    .meta-box { border: 1px solid #000; padding: 8px 12px; min-width: 120px; }
    .instructions { background: #f5f5f5; border: 1px solid #ccc; padding: 10px; margin: 15px 0; font-size: 10pt; }
    .section { margin-top: 25px; }
    .section-header { font-size: 13pt; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 12px; }
    .question { margin: 15px 0; padding-left: 10px; }
    .question-num { font-weight: bold; margin-right: 8px; }
    .options { margin: 8px 0 8px 25px; }
    .option { margin: 4px 0; }
    .marks { float: right; font-weight: bold; }
    .footer { margin-top: 30px; text-align: center; font-size: 10pt; border-top: 1px solid #ccc; padding-top: 10px; }
    .page-break { page-break-after: always; }
    .clear { clear: both; }
`

export function generatePaperHTML(paper: PaperPDF, collegeName?: string): string {
  const sections = paper.sections || []
  const instructions = Array.isArray(paper.instructions)
    ? paper.instructions.map(escapeHtml).join('<br/>')
    : escapeHtml(paper.instructions)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${PAPER_STYLES}</style>
</head>
<body>
  <div class="paper-container">
    <div class="header">
      <div class="college-name">${escapeHtml(collegeName || 'VRIDDHI INSTITUTION')}</div>
      <div class="exam-title">${escapeHtml(paper.title || 'Internal Assessment')}</div>
      <div style="margin-top: 5px; font-size: 11pt;">Subject: ${escapeHtml(paper.subject || '')} | Duration: ${escapeHtml(paper.duration)} minutes | Max Marks: ${escapeHtml(paper.totalMarks)}</div>
    </div>

    <div class="meta-row">
      <div><strong>Name:</strong> _________________________</div>
      <div><strong>Roll No:</strong> _________________________</div>
      <div><strong>Date:</strong> _________________________</div>
    </div>

    ${paper.instructions ? `
    <div class="instructions">
      <strong>Instructions:</strong><br/>
      ${instructions}
      ${paper.negativeMarking ? '<br/>• Negative marking applies for wrong answers.' : ''}
      ${paper.passingPercentage ? `<br/>• Passing marks: ${escapeHtml(paper.passingPercentage)}%` : ''}
    </div>
    ` : ''}

    ${sections.map((section, sIdx) => {
      const questions = section.questions || []
      const numQuestions = section.numQuestions ?? questions.length
      const sectionMarks = section.marksPerQuestion !== undefined
        ? numQuestions * section.marksPerQuestion
        : questions.reduce((sum, q) => sum + (q.marks || 0), 0)
      const marksLabel = section.marksPerQuestion !== undefined
        ? `${escapeHtml(numQuestions)} × ${escapeHtml(section.marksPerQuestion)} = ${escapeHtml(sectionMarks)} marks`
        : `${escapeHtml(numQuestions)} questions · ${escapeHtml(sectionMarks)} marks`
      return `
      <div class="section${sIdx < sections.length - 1 ? ' page-break' : ''}">
        <div class="section-header">
          Section ${String.fromCharCode(65 + sIdx)}: ${escapeHtml(section.name || section.title || '')}
          <span style="float: right; font-size: 11pt;">[${marksLabel}]</span>
          <div class="clear"></div>
        </div>
        ${section.instructions ? `<div style="font-size: 10pt; margin-bottom: 10px; font-style: italic;">${escapeHtml(section.instructions)}</div>` : ''}

        ${questions.map((q, qIdx) => {
          const marks = q.marks ?? section.marksPerQuestion
          return `
          <div class="question">
            <span class="question-num">Q${qIdx + 1}.</span>
            ${escapeHtml(q.text)}
            ${marks !== undefined ? `<span class="marks">[${escapeHtml(marks)} marks]</span>` : ''}
            <div class="clear"></div>

            ${q.options && q.options.length ? `
              <div class="options">
                ${q.options.map((opt, oIdx) => `
                  <div class="option">${String.fromCharCode(65 + oIdx)}. ${escapeHtml(typeof opt === 'string' ? opt : opt?.text || '')}</div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `}).join('')}
      </div>
    `}).join('')}

    <div class="footer">
      *** END OF QUESTION PAPER ***<br/>
      Generated via VRIDDHI Platform
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function generateQuestionsHTML(questions: QuestionPDF[], title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #000; background: #fff; }
    .paper-container { max-width: 210mm; margin: 0 auto; padding: 15mm; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
    .title { font-size: 16pt; font-weight: bold; }
    .subtitle { font-size: 11pt; color: #666; margin-top: 4px; }
    .question { margin: 15px 0; padding: 10px; border: 1px solid #ddd; }
    .question-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .question-meta { font-size: 9pt; color: #666; }
    .question-text { font-weight: 500; margin-bottom: 6px; }
    .options { margin-left: 20px; }
    .option { margin: 3px 0; }
    .answer { margin-top: 6px; padding: 6px; background: #f0f8f0; border-left: 3px solid #006400; }
    .explanation { margin-top: 4px; font-size: 10pt; color: #444; font-style: italic; }
    .footer { margin-top: 20px; text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="paper-container">
    <div class="header">
      <div class="title">${escapeHtml(title)}</div>
      <div class="subtitle">${questions.length} Questions | Generated on ${escapeHtml(new Date().toLocaleDateString())}</div>
    </div>

    ${questions.map((q, idx) => `
      <div class="question">
        <div class="question-header">
          <span class="question-meta">#${idx + 1}${q.type ? ` | ${escapeHtml(q.type)}` : ''}${q.difficulty ? ` | ${escapeHtml(q.difficulty)}` : ''}${q.marks !== undefined ? ` | ${escapeHtml(q.marks)} marks` : ''}</span>
          <span class="question-meta">${escapeHtml(q.subject || '')}${q.chapter ? ' > ' + escapeHtml(q.chapter) : ''}</span>
        </div>
        <div class="question-text">${escapeHtml(q.text)}</div>

        ${q.options && q.options.length ? `
          <div class="options">
            ${q.options.map((opt, oIdx) => {
              const text = typeof opt === 'string' ? opt : opt?.text || ''
              const correct = typeof opt === 'object' && opt?.isCorrect ? ' ✓' : ''
              return `<div class="option">${String.fromCharCode(65 + oIdx)}. ${escapeHtml(text)}${correct}</div>`
            }).join('')}
          </div>
        ` : ''}

        ${q.correctAnswer ? `<div class="answer"><strong>Answer:</strong> ${escapeHtml(Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer)}</div>` : ''}
        ${q.explanation ? `<div class="explanation">${escapeHtml(q.explanation)}</div>` : ''}
      </div>
    `).join('')}

    <div class="footer">Generated via VRIDDHI Platform</div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Renders a standalone HTML document in an offscreen iframe and saves the
 * `.paper-container` element as a PDF. Always removes the iframe.
 */
async function renderHtmlDocumentToPDF(html: string, filename: string): Promise<void> {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.top = '0'
  iframe.style.width = '210mm'
  iframe.style.height = '297mm'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  try {
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve()
      iframe.srcdoc = html
    })

    // Give the iframe a frame to lay out fonts before rasterising.
    await new Promise((resolve) => setTimeout(resolve, 300))

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    const container = iframeDoc?.querySelector('.paper-container') as HTMLElement | null
    if (!iframeDoc || !container) {
      throw new Error('Local PDF renderer could not lay out the document')
    }

    container.id = 'vriddhi-local-pdf-root'
    await downloadElementAsPDF(container.id, filename, { scale: 2, root: iframeDoc })
  } finally {
    document.body.removeChild(iframe)
  }
}

/** Client-side paper renderer: `generatePaperHTML` → offscreen iframe → jsPDF/html2canvas. */
export async function downloadPaperPreviewPDF(
  paper: PaperPDF,
  collegeName?: string,
  filename?: string
): Promise<void> {
  await renderHtmlDocumentToPDF(generatePaperHTML(paper, collegeName), filename || `${paper.title || 'paper'}_preview`)
}

/** Client-side question-list renderer used when the server PDF route is unavailable. */
export async function downloadQuestionsPreviewPDF(
  questions: QuestionPDF[],
  title: string,
  filename?: string
): Promise<void> {
  await renderHtmlDocumentToPDF(generateQuestionsHTML(questions, title), filename || 'questions')
}
