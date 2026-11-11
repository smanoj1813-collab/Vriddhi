// The printable "study guide" for a generated AI study pack.
//
// WHY THIS IS A SEPARATE, PURE FUNCTION
// It used to be a template literal built inside AIStudyCompanionModal and handed
// straight to `win.document.write()`. Every field in it — title, overview,
// concept definitions, exam answers — is written by a language model, which is
// steered by whatever the user typed and by any source document fed to it. An
// answer containing `<img src=x onerror=...>` therefore executed in the app's own
// origin, in a window with `window.opener` pointing back at the app.
//
// That is a stored-XSS path, and it was invisible to a grep for
// `dangerouslySetInnerHTML` because it uses document.write. Escaping is applied
// to every interpolated value below; the function is pure so the escaping can be
// asserted in a unit test instead of reviewed by eye.

import type { AIStudyPack } from '@/shared/services/aiStudyMaterialService'
import { escapeHtml as esc } from './escapeHtml'

export interface StudyPackHtmlOptions {
  moduleName?: string | null
}

export function buildStudyPackHtml(studyPack: AIStudyPack, options: StudyPackHtmlOptions = {}): string {
  return `
      <div style="font-family: Arial, sans-serif; padding: 30px; color: #111; line-height: 1.6;">
        <div style="border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="color: #0f766e; margin: 0 0 4px 0; font-size: 22px;">Vriddhi AI Study Guide: ${esc(studyPack.title)}</h1>
          <p style="margin: 0; color: #666; font-size: 13px;">Course: ${esc(studyPack.subject)} | Module: ${esc(options.moduleName || 'Syllabus')}</p>
        </div>

        <h2 style="font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">1. Core Concept Overview</h2>
        <p style="font-size: 13px; color: #334155;">${esc(studyPack.overview)}</p>

        <h3 style="font-size: 14px; margin-top: 15px;">Key Takeaways:</h3>
        <ul style="font-size: 12px; color: #475569;">
          ${studyPack.quickSummaryPoints.map(p => `<li>${esc(p)}</li>`).join('')}
        </ul>

        <h2 style="font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 25px;">2. Formulas &amp; Definitions Cheat Sheet</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Term / Principle</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Definition &amp; Rule</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Exam Relevance</th>
            </tr>
          </thead>
          <tbody>
            ${studyPack.keyConcepts.map(c => `
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${esc(c.term)}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">
                  ${esc(c.definition)}
                  ${c.formulaOrRule && c.formulaOrRule !== 'N/A' ? `<div style="margin-top: 4px; font-family: monospace; color: #0f766e;"><strong>Rule/Formula:</strong> ${esc(c.formulaOrRule)}</div>` : ''}
                </td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">${esc(c.importance || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${studyPack.workedExample ? `
          <h2 style="font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 25px;">3. Practical Worked Problem / Case Study</h2>
          <div style="background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px;">
            <p style="font-weight: bold; margin: 0 0 8px 0;">Scenario: ${esc(studyPack.workedExample.scenario)}</p>
            ${studyPack.workedExample.steps.map(s => `
              <div style="margin-bottom: 6px;">
                <strong>${esc(s.step)}:</strong> ${esc(s.details)}
              </div>
            `).join('')}
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-weight: bold; color: #047857;">
              Result: ${esc(studyPack.workedExample.solution)}
            </div>
          </div>
        ` : ''}

        <h2 style="font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 25px;">4. University Exam &amp; Viva Questions</h2>
        ${studyPack.examPrep.map((q, idx) => `
          <div style="margin-bottom: 12px; font-size: 12px;">
            <p style="font-weight: bold; margin: 0;">Q${idx + 1}. [${esc(q.marks)} Marks] ${esc(q.question)}</p>
            <p style="margin: 4px 0 0 15px; color: #334155;"><strong>Model Answer:</strong> ${esc(q.expectedAnswer)}</p>
            ${q.examTip ? `<p style="margin: 2px 0 0 15px; font-size: 11px; color: #d97706;"><em>Examiner Tip: ${esc(q.examTip)}</em></p>` : ''}
          </div>
        `).join('')}
      </div>
    `
}
