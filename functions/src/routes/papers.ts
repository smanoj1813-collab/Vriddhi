// src/routes/papers.ts
// Backend routes for papers + PDF generation

import express from 'express'
import puppeteer from 'puppeteer'
import { db } from '../config/firebase'
import { verifyAuth } from '../middleware/auth'

const router = express.Router()

/**
 * GET /api/papers/:id/pdf
 * Generate and download a paper as proper text-based PDF
 * Requires: auth
 */
router.get('/:id/pdf', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    // Fetch paper from Firestore
    const paperDoc = await db.collection('papers').doc(id).get()
    if (!paperDoc.exists) {
      res.status(404).json({ message: 'Paper not found' })
      return
    }

    const paper = paperDoc.data()!

    // Ownership check
    if (paper.collegeId !== user.collegeId && user.role !== 'superadmin') {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    // Fetch college name
    let collegeName = 'VRIDDHI INSTITUTION'
    try {
      const collegeDoc = await db.collection('colleges').doc(paper.collegeId).get()
      if (collegeDoc.exists) {
        collegeName = collegeDoc.data()?.name || collegeName
      }
    } catch {
      // ignore
    }

    // Build HTML for PDF
    const html = buildPaperHTML(paper, collegeName, user)

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()

    // FIX: Use 'load' instead of 'networkidle0' for setContent
    await page.setContent(html, { waitUntil: 'load' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:9px; width:100%; text-align:center; color:#666; padding:5px 0;">${escapeHtml(collegeName)} — ${escapeHtml(paper.title || 'Paper')}</div>`,
      footerTemplate: `<div style="font-size:9px; width:100%; text-align:center; color:#666; padding:5px 0;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated via VRIDDHI</div>`,
    })

    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${paper.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'paper'}.pdf"`)
    res.setHeader('Content-Length', pdf.length)
    res.send(pdf)
    return

  } catch (error: any) {
    console.error('[PDF Generation] Error:', error)
    res.status(500).json({ message: error.message || 'Failed to generate PDF' })
    return
  }
})

/**
 * POST /api/questions/export/pdf
 * Export selected questions as PDF
 * Requires: auth
 */
router.post('/questions/export/pdf', verifyAuth, async (req, res) => {
  try {
    const { questionIds, title } = req.body
    const user = (req as any).user

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      res.status(400).json({ message: 'questionIds array required' })
      return
    }

    // Fetch questions
    const questions: any[] = []
    for (const qid of questionIds) {
      const qDoc = await db.collection('questions').doc(qid).get()
      if (qDoc.exists) {
        const q = qDoc.data()
        if (q?.collegeId === user.collegeId || user.role === 'superadmin') {
          questions.push({ id: qDoc.id, ...q })
        }
      }
    }

    // Build HTML
    const html = buildQuestionsHTML(questions, title || 'Question Export', user)

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()

    // FIX: Use 'load' instead of 'networkidle0' for setContent
    await page.setContent(html, { waitUntil: 'load' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    })

    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${title?.replace(/[^a-zA-Z0-9]/g, '_') || 'questions'}.pdf"`)
    res.setHeader('Content-Length', pdf.length)
    res.send(pdf)
    return

  } catch (error: any) {
    console.error('[Questions PDF] Error:', error)
    res.status(500).json({ message: error.message || 'Failed to generate PDF' })
    return
  }
})

// ═══════════════════════════════════════════════════════════════════════
// HTML Builders
// ═══════════════════════════════════════════════════════════════════════

function buildPaperHTML(paper: any, collegeName: string, user: any): string {
  const sections = paper.sections || []

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.6; color: #000; }
    .paper-container { max-width: 180mm; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 18px; }
    .college-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .exam-title { font-size: 14pt; font-weight: bold; margin-top: 6px; }
    .meta-row { display: flex; justify-content: space-between; margin: 12px 0; font-size: 11pt; }
    .meta-box { border: 1px solid #333; padding: 6px 10px; min-width: 100px; text-align: center; }
    .instructions { background: #f8f8f8; border: 1px solid #ddd; padding: 10px; margin: 12px 0; font-size: 10pt; }
    .section { margin-top: 20px; page-break-inside: avoid; }
    .section-header { font-size: 13pt; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 10px; display: flex; justify-content: space-between; }
    .question { margin: 12px 0; padding-left: 8px; page-break-inside: avoid; }
    .question-header { display: flex; align-items: flex-start; }
    .question-num { font-weight: bold; margin-right: 8px; min-width: 30px; }
    .question-text { flex: 1; }
    .marks { font-weight: bold; margin-left: 10px; white-space: nowrap; }
    .options { margin: 6px 0 6px 38px; }
    .option { margin: 3px 0; }
    .correct-answer { margin: 6px 0 6px 38px; color: #006400; font-weight: bold; }
    .explanation { margin: 6px 0 6px 38px; color: #444; font-size: 10pt; font-style: italic; }
    .footer { margin-top: 25px; text-align: center; font-size: 10pt; border-top: 1px solid #ccc; padding-top: 8px; color: #666; }
  </style>
</head>
<body>
  <div class="paper-container">
    <div class="header">
      <div class="college-name">${escapeHtml(collegeName)}</div>
      <div class="exam-title">${escapeHtml(paper.title || 'Internal Assessment')}</div>
      <div style="margin-top: 4px; font-size: 11pt;">
        Subject: ${escapeHtml(paper.subject)} | Duration: ${paper.duration} min | Max Marks: ${paper.totalMarks}
      </div>
    </div>

    <div class="meta-row">
      <div class="meta-box">Name: _______________</div>
      <div class="meta-box">Roll No: _______________</div>
      <div class="meta-box">Date: _______________</div>
    </div>

    ${paper.instructions ? `
    <div class="instructions">
      <strong>Instructions:</strong><br/>
      ${Array.isArray(paper.instructions) ? paper.instructions.map((i: string) => escapeHtml(i)).join('<br/>• ') : escapeHtml(paper.instructions)}
      ${paper.negativeMarking ? '<br/>• Negative marking applies for wrong answers.' : ''}
      ${paper.passingPercentage ? `<br/>• Passing marks: ${paper.passingPercentage}%` : ''}
    </div>
    ` : ''}

    ${sections.map((section: any, sIdx: number) => `
      <div class="section">
        <div class="section-header">
          <span>Section ${String.fromCharCode(65 + sIdx)}: ${escapeHtml(section.name || section.title || '')}</span>
          <span>[${section.numQuestions} × ${section.marksPerQuestion} = ${section.numQuestions * section.marksPerQuestion} marks]</span>
        </div>
        ${section.instructions ? `<div style="font-size: 10pt; margin-bottom: 8px; font-style: italic;">${escapeHtml(section.instructions)}</div>` : ''}

        ${(section.questions || []).map((q: any, qIdx: number) => `
          <div class="question">
            <div class="question-header">
              <span class="question-num">Q${qIdx + 1}.</span>
              <span class="question-text">${escapeHtml(q.text)}</span>
              <span class="marks">[${q.marks || section.marksPerQuestion} marks]</span>
            </div>

            ${q.options ? `
              <div class="options">
                ${q.options.map((opt: any, oIdx: number) => `
                  <div class="option">${String.fromCharCode(65 + oIdx)}. ${escapeHtml(opt.text || opt)}</div>
                `).join('')}
              </div>
            ` : ''}

            ${q.correctAnswer ? `<div class="correct-answer">Ans: ${escapeHtml(String(q.correctAnswer))}</div>` : ''}
            ${q.explanation ? `<div class="explanation">${escapeHtml(q.explanation)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}

    <div class="footer">
      *** END OF QUESTION PAPER ***<br/>
      Generated via VRIDDHI Platform | ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>
  `.trim()
}

function buildQuestionsHTML(questions: any[], title: string, user: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; }
    .container { max-width: 180mm; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
    .title { font-size: 16pt; font-weight: bold; }
    .subtitle { font-size: 11pt; color: #666; margin-top: 4px; }
    .question { margin: 15px 0; padding: 10px; border: 1px solid #ddd; page-break-inside: avoid; }
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
  <div class="container">
    <div class="header">
      <div class="title">${escapeHtml(title)}</div>
      <div class="subtitle">${questions.length} Questions | Generated on ${new Date().toLocaleDateString()}</div>
    </div>

    ${questions.map((q, idx) => `
      <div class="question">
        <div class="question-header">
          <span class="question-meta">#${idx + 1} | ${q.type} | ${q.difficulty} | ${q.marks} marks</span>
          <span class="question-meta">${q.subject}${q.chapter ? ' > ' + q.chapter : ''}</span>
        </div>
        <div class="question-text">${escapeHtml(q.text)}</div>

        ${q.options ? `
          <div class="options">
            ${q.options.map((opt: any, oIdx: number) => `
              <div class="option">${String.fromCharCode(65 + oIdx)}. ${escapeHtml(opt.text || opt)} ${opt.isCorrect ? '✓' : ''}</div>
            `).join('')}
          </div>
        ` : ''}

        ${q.correctAnswer ? `<div class="answer"><strong>Answer:</strong> ${escapeHtml(String(q.correctAnswer))}</div>` : ''}
        ${q.explanation ? `<div class="explanation">${escapeHtml(q.explanation)}</div>` : ''}
      </div>
    `).join('')}

    <div class="footer">
      Generated via VRIDDHI Platform | Confidential
    </div>
  </div>
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export { router }