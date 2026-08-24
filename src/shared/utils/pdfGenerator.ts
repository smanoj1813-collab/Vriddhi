// src/shared/utils/pdfGenerator.ts
// Client-side PDF generation using jspdf + html2canvas

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Self-contained interface — decoupled from question bank Paper type
interface PaperPDF {
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
    numQuestions: number
    marksPerQuestion: number
    instructions?: string
    questions?: Array<{
      text: string
      marks: number
      options?: Array<{ text?: string } | string>
    }>
  }>
}

export async function downloadElementAsPDF(
  elementId: string,
  filename: string,
  options: { orientation?: 'p' | 'l'; scale?: number } = {}
): Promise<void> {
  const element = document.getElementById(elementId)
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

export function generatePaperHTML(paper: PaperPDF, collegeName?: string): string {
  const sections = paper.sections || []

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; }
    .paper-container { max-width: 210mm; margin: 0 auto; padding: 20mm; }
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
  </style>
</head>
<body>
  <div class="paper-container">
    <div class="header">
      <div class="college-name">${collegeName || 'VRIDDHI INSTITUTION'}</div>
      <div class="exam-title">${paper.title || 'Internal Assessment'}</div>
      <div style="margin-top: 5px; font-size: 11pt;">Subject: ${paper.subject || ''} | Duration: ${paper.duration} minutes | Max Marks: ${paper.totalMarks}</div>
    </div>

    <div class="meta-row">
      <div><strong>Name:</strong> _________________________</div>
      <div><strong>Roll No:</strong> _________________________</div>
      <div><strong>Date:</strong> _________________________</div>
    </div>

    ${paper.instructions ? `
    <div class="instructions">
      <strong>Instructions:</strong><br/>
      ${Array.isArray(paper.instructions) ? paper.instructions.join('<br/>') : paper.instructions}
      ${paper.negativeMarking ? '<br/>• Negative marking applies for wrong answers.' : ''}
      ${paper.passingPercentage ? `<br/>• Passing marks: ${paper.passingPercentage}%` : ''}
    </div>
    ` : ''}

    ${sections.map((section, sIdx) => `
      <div class="section${sIdx < sections.length - 1 ? ' page-break' : ''}">
        <div class="section-header">
          Section ${String.fromCharCode(65 + sIdx)}: ${section.name || section.title || ''}
          <span style="float: right; font-size: 11pt;">[${section.numQuestions} × ${section.marksPerQuestion} = ${section.numQuestions * section.marksPerQuestion} marks]</span>
          <div class="clear"></div>
        </div>
        ${section.instructions ? `<div style="font-size: 10pt; margin-bottom: 10px; font-style: italic;">${section.instructions}</div>` : ''}

        ${(section.questions || []).map((q, qIdx) => `
          <div class="question">
            <span class="question-num">Q${qIdx + 1}.</span>
            ${q.text}
            <span class="marks">[${q.marks} marks]</span>
            <div class="clear"></div>

            ${q.options ? `
              <div class="options">
                ${q.options.map((opt, oIdx) => `
                  <div class="option">${String.fromCharCode(65 + oIdx)}. ${typeof opt === 'string' ? opt : opt.text || ''}</div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}

    <div class="footer">
      *** END OF QUESTION PAPER ***<br/>
      Generated via VRIDDHI Platform
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function downloadPaperPreviewPDF(
  paper: PaperPDF,
  collegeName?: string
): Promise<void> {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.width = '210mm'
  iframe.style.height = '297mm'
  document.body.appendChild(iframe)

  const html = generatePaperHTML(paper, collegeName)
  iframe.srcdoc = html

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve()
  })

  await new Promise((resolve) => setTimeout(resolve, 500))

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) {
    document.body.removeChild(iframe)
    return
  }

  const container = iframeDoc.querySelector('.paper-container') as HTMLElement
  if (!container) {
    document.body.removeChild(iframe)
    return
  }

  container.id = 'paper-preview-container'

  await downloadElementAsPDF(
    container.id,
    `${paper.title || 'paper'}_preview`,
    { scale: 2 }
  )

  document.body.removeChild(iframe)
}
