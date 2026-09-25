// functions/src/resume/templates.ts
//
// The five ATS-safe resume templates, rendered to HTML from ResumeData. One
// document structure, five stylesheets — which is exactly what "ATS-safe"
// means in practice:
//
//   • single column, top-to-bottom reading order (no sidebars, no tables,
//     no text boxes, no columns)
//   • real text everywhere: no icons, images, charts or skill bars
//   • standard section titles a parser recognises ("Education", "Experience",
//     "Skills" …)
//   • conventional fonts (Inter / Source Serif 4) at 9.5–10.5 pt
//   • dates on the same line as the entry they describe
//
// The same function feeds the in-app preview (mode 'preview': Google-Fonts
// links, watermark, page guides) and Chrome's PDF export (mode 'print':
// embedded fonts, nothing else). Because the HTML is identical the preview is
// what the PDF looks like — students are never surprised by their download.

import type { PDFOptions } from 'puppeteer'
import {
  getResumeTemplate,
  type ResumeData,
  type ResumeSectionId,
  type ResumeTemplateId,
  type ResumeTemplateMeta,
} from './model'
import { inlineFontCss, linkedFontHtml, type ResumeFontFace } from './fonts'

export type ResumeRenderMode = 'preview' | 'print'

export interface RenderResumeOptions {
  templateId: ResumeTemplateId
  mode: ResumeRenderMode
  /** Defaults to `mode === 'preview'`. */
  watermark?: boolean
  /** Test seam: replaces the embedded/linked font markup entirely. */
  fontMarkup?: string
}

// ─── Escaping ───────────────────────────────────────────────────────────────

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function e(value: string | undefined | null): string {
  return escapeHtml(value ?? '')
}

/** Multi-line text → escaped HTML with <br> line breaks. */
function multiline(value: string): string {
  return value.split('\n').map((line) => e(line)).join('<br>')
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '')
}

function linkOrText(url: string): string {
  if (!url) return ''
  const text = e(displayUrl(url))
  return /^https?:\/\//i.test(url) ? `<a href="${e(url)}">${text}</a>` : text
}

// ─── Section labels ─────────────────────────────────────────────────────────

const DEFAULT_LABELS: Record<ResumeSectionId, string> = {
  summary: 'Professional Summary',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  achievements: 'Achievements',
  languages: 'Languages',
}

const TEMPLATE_LABELS: Partial<Record<ResumeTemplateId, Partial<Record<ResumeSectionId, string>>>> = {
  fresher: { experience: 'Internships & Experience', projects: 'Academic Projects', summary: 'Career Objective' },
  executive: { summary: 'Profile' },
  compact: { summary: 'Summary' },
}

export function sectionLabel(templateId: ResumeTemplateId, section: ResumeSectionId): string {
  return TEMPLATE_LABELS[templateId]?.[section] ?? DEFAULT_LABELS[section]
}

// ─── Body builders ──────────────────────────────────────────────────────────

function joinPresent(parts: Array<string | undefined>, sep: string): string {
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join(sep)
}

function dateRange(start: string, end: string, current = false): string {
  const to = current ? 'Present' : end
  return joinPresent([start, to], ' – ')
}

function bulletList(items: string[]): string {
  if (!items.length) return ''
  return `<ul>${items.map((item) => `<li>${e(item)}</li>`).join('')}</ul>`
}

function renderHeader(data: ResumeData): string {
  const c = data.contact
  const contactBits = [
    c.email ? `<span>${e(c.email)}</span>` : '',
    c.phone ? `<span>${e(c.phone)}</span>` : '',
    c.location ? `<span>${e(c.location)}</span>` : '',
    c.linkedin ? `<span>${linkOrText(c.linkedin)}</span>` : '',
    c.github ? `<span>${linkOrText(c.github)}</span>` : '',
    c.website ? `<span>${linkOrText(c.website)}</span>` : '',
  ].filter(Boolean)
  return (
    `<header class="hd">` +
    `<h1>${e(c.fullName) || 'Your Name'}</h1>` +
    (c.headline ? `<p class="headline">${e(c.headline)}</p>` : '') +
    (contactBits.length ? `<p class="contact">${contactBits.join('<span class="sep"> | </span>')}</p>` : '') +
    `</header>`
  )
}

function renderSummary(data: ResumeData): string {
  return data.summary ? `<p class="summary">${multiline(data.summary)}</p>` : ''
}

function renderEducation(data: ResumeData): string {
  return data.education
    .filter((ed) => ed.institution || ed.degree)
    .map((ed) => {
      const degree = joinPresent([ed.degree, ed.field], ' in ')
      return (
        `<div class="entry">` +
        `<div class="row"><span class="title">${e(degree || ed.institution)}</span><span class="date">${e(dateRange(ed.startYear, ed.endYear))}</span></div>` +
        (degree
          ? `<div class="row sub"><span>${e(joinPresent([ed.institution, ed.location], ', '))}</span>${ed.score ? `<span class="meta">${e(ed.score)}</span>` : ''}</div>`
          : ed.score
            ? `<div class="row sub"><span>${e(ed.location)}</span><span class="meta">${e(ed.score)}</span></div>`
            : '') +
        bulletList(ed.highlights) +
        `</div>`
      )
    })
    .join('')
}

function renderExperience(data: ResumeData): string {
  return data.experience
    .filter((x) => x.organisation || x.role)
    .map(
      (x) =>
        `<div class="entry">` +
        `<div class="row"><span class="title">${e(x.role || x.organisation)}</span><span class="date">${e(dateRange(x.startDate, x.endDate, x.current))}</span></div>` +
        (x.role ? `<div class="row sub"><span>${e(joinPresent([x.organisation, x.location], ', '))}</span></div>` : x.location ? `<div class="row sub"><span>${e(x.location)}</span></div>` : '') +
        bulletList(x.bullets) +
        `</div>`,
    )
    .join('')
}

function renderProjects(data: ResumeData): string {
  return data.projects
    .filter((p) => p.name)
    .map(
      (p) =>
        `<div class="entry">` +
        `<div class="row"><span class="title">${e(p.name)}${p.role ? `<span class="role"> — ${e(p.role)}</span>` : ''}</span><span class="date">${e(dateRange(p.startDate, p.endDate))}</span></div>` +
        (p.techStack.length || p.link
          ? `<div class="row sub"><span>${p.techStack.length ? `<span class="meta">Tech: </span>${e(p.techStack.join(', '))}` : ''}</span>${p.link ? `<span class="meta">${linkOrText(p.link)}</span>` : ''}</div>`
          : '') +
        bulletList(p.bullets) +
        `</div>`,
    )
    .join('')
}

function renderSkills(data: ResumeData): string {
  const groups = data.skills.filter((g) => g.skills.length)
  if (!groups.length) return ''
  return `<div class="skills">${groups
    .map((g) => `<p>${g.name ? `<b>${e(g.name)}:</b> ` : ''}${e(g.skills.join(', '))}</p>`)
    .join('')}</div>`
}

function renderCertifications(data: ResumeData): string {
  return data.certifications
    .filter((c) => c.name)
    .map(
      (c) =>
        `<div class="entry tight"><div class="row"><span><span class="title">${e(c.name)}</span>${
          c.issuer ? ` — ${e(c.issuer)}` : ''
        }${c.credentialId ? `<span class="meta"> (ID: ${e(c.credentialId)})</span>` : ''}</span><span class="date">${e(c.year)}</span></div></div>`,
    )
    .join('')
}

function renderAchievements(data: ResumeData): string {
  return bulletList(data.achievements)
}

function renderLanguages(data: ResumeData): string {
  return data.languages.length ? `<p class="inline-list">${e(data.languages.join(', '))}</p>` : ''
}

const SECTION_RENDERERS: Record<ResumeSectionId, (data: ResumeData) => string> = {
  summary: renderSummary,
  education: renderEducation,
  experience: renderExperience,
  projects: renderProjects,
  skills: renderSkills,
  certifications: renderCertifications,
  achievements: renderAchievements,
  languages: renderLanguages,
}

/** Sections in the student's order, empty ones skipped (an empty "Experience" heading is an ATS red flag). */
export function orderedSections(data: ResumeData, template: ResumeTemplateMeta): ResumeSectionId[] {
  const order = data.sectionOrder.length ? data.sectionOrder : template.defaultSectionOrder
  const seen = new Set<ResumeSectionId>()
  const result: ResumeSectionId[] = []
  for (const id of [...order, ...template.defaultSectionOrder]) {
    if (!seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }
  return result
}

function renderSections(data: ResumeData, template: ResumeTemplateMeta): string {
  return orderedSections(data, template)
    .map((id) => {
      const body = SECTION_RENDERERS[id](data)
      if (!body) return ''
      return `<section class="sec sec-${id}"><h2>${e(sectionLabel(template.id, id))}</h2>${body}</section>`
    })
    .join('')
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const SANS = "'Inter', Arial, Helvetica, sans-serif"
const SERIF = "'Source Serif 4', Georgia, 'Times New Roman', serif"

function fontFaces(template: ResumeTemplateMeta): ResumeFontFace[] {
  if (template.family === 'sans') return ['inter']
  if (template.family === 'serif') return ['source-serif-4']
  return ['inter', 'source-serif-4']
}

function baseCss(template: ResumeTemplateMeta, mode: ResumeRenderMode): string {
  const family = template.family === 'serif' ? SERIF : SANS
  const pagePadding = mode === 'preview' ? `${template.marginMm}mm` : '0'
  const pageWidth = mode === 'preview' ? '210mm' : 'auto'
  const pageMinHeight = mode === 'preview' ? '297mm' : '0'
  return `
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:${mode === 'preview' ? '#e2e8f0' : '#fff'}}
body{color:#111827;font-family:${family};font-size:${template.bodyPt}pt;line-height:1.38;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:relative;width:${pageWidth};min-height:${pageMinHeight};margin:0 auto;padding:${pagePadding};background:#fff;${
    mode === 'preview'
      ? 'background-image:linear-gradient(to bottom,transparent calc(297mm - 1px),#94a3b8 calc(297mm - 1px),#94a3b8 297mm);background-size:100% 297mm;background-repeat:repeat-y;box-shadow:0 1px 4px rgba(15,23,42,.15);'
      : ''
  }}
a{color:inherit;text-decoration:none}
h1{margin:0;font-size:21pt;line-height:1.15;font-weight:700;letter-spacing:.01em}
.headline{margin:3pt 0 0;font-size:${template.bodyPt + 0.5}pt;color:#1f2937}
.contact{margin:4pt 0 0;font-size:${template.bodyPt - 1}pt;color:#1f2937}
.contact .sep{color:#9ca3af}
.sec{margin-top:11pt}
h2{margin:0 0 5pt;font-size:${template.bodyPt + 0.5}pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${template.accent}}
.summary{margin:0;text-align:left}
.entry{margin-top:6pt;break-inside:avoid;page-break-inside:avoid}
.entry.tight{margin-top:2pt}
.row{display:flex;justify-content:space-between;align-items:baseline;gap:12pt}
.row .title{font-weight:600}
.row .date{white-space:nowrap;color:#374151;font-size:${template.bodyPt - 0.5}pt}
.row.sub{color:#374151;margin-top:1pt}
.meta{color:#4b5563}
.role{font-weight:400;color:#374151}
ul{margin:2pt 0 0;padding-left:14pt}
li{margin:1.5pt 0}
.skills p{margin:1.5pt 0}
.skills b{font-weight:600}
.inline-list{margin:0}
${mode === 'preview' ? '@media (max-width:820px){.page{zoom:.62}}@media (max-width:480px){.page{zoom:.46}}' : ''}
`
}

const TEMPLATE_CSS: Record<ResumeTemplateId, string> = {
  classic: `
.hd{text-align:center;padding-bottom:6pt;border-bottom:1.5px solid #111827}
h1{font-size:22pt;letter-spacing:.05em;text-transform:uppercase;font-weight:600}
.headline{font-weight:600}
h2{border-bottom:1px solid #111827;padding-bottom:2pt;letter-spacing:.12em;font-weight:600}
.row .title{font-weight:700}
`,
  modern: `
.hd{padding-left:10pt;border-left:4px solid #0f766e}
h1{font-size:24pt;font-weight:700;color:#0f172a}
.headline{color:#0f766e;font-weight:600}
h2{border-bottom:1.5px solid #0f766e;padding-bottom:2pt}
.row .title{font-weight:700;color:#0f172a}
`,
  compact: `
h1{font-size:18pt}
.headline{margin-top:1pt}
.contact{margin-top:2pt}
.sec{margin-top:7pt}
h2{margin-bottom:3pt;font-size:9.5pt;border-bottom:1px solid #94a3b8;padding-bottom:1pt}
.entry{margin-top:3.5pt}
ul{padding-left:12pt;margin-top:1pt}
li{margin:0.5pt 0}
body{line-height:1.3}
`,
  fresher: `
.hd{padding-bottom:6pt;border-bottom:2px solid #334155}
h1{font-size:22pt}
h2{background:#f1f5f9;border-left:4px solid #334155;padding:2.5pt 7pt;letter-spacing:.06em;color:#0f172a}
.row .title{font-weight:700}
`,
  executive: `
.hd{padding-bottom:8pt;border-bottom:3px double #7c2d12}
h1{font-family:${SERIF};font-size:27pt;font-weight:600;letter-spacing:.02em;color:#1c1917}
.headline{font-family:${SERIF};font-size:12pt;color:#44403c}
.sec{margin-top:14pt}
h2{font-family:${SERIF};font-size:12pt;font-weight:600;letter-spacing:.14em;color:#7c2d12;margin-bottom:6pt}
.summary{font-size:11pt;line-height:1.45}
.row .title{font-weight:600}
`,
}

const WATERMARK_CSS = `
.wm{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:5}
.wm span{position:absolute;font-family:${SANS};font-size:40pt;font-weight:800;letter-spacing:.2em;color:rgba(15,118,110,.09);transform:rotate(-30deg);white-space:nowrap;user-select:none}
`

function watermarkHtml(): string {
  const spans: string[] = []
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      spans.push(`<span style="top:${row * 18 - 4}%;left:${col * 55 - 12}%">VRIDDHI PREVIEW</span>`)
    }
  }
  return `<div class="wm" aria-hidden="true">${spans.join('')}</div>`
}

// ─── Entry point ────────────────────────────────────────────────────────────

export function renderResumeHtml(data: ResumeData, options: RenderResumeOptions): string {
  const template = getResumeTemplate(options.templateId)
  const mode = options.mode
  const watermark = options.watermark ?? mode === 'preview'
  const faces = fontFaces(template)
  const fontMarkup =
    options.fontMarkup ??
    (mode === 'print' ? `<style>${inlineFontCss(faces)}</style>` : linkedFontHtml(faces))
  const title = `${data.contact.fullName || 'Resume'} – Resume`

  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${e(title)}</title>` +
    fontMarkup +
    `<style>${baseCss(template, mode)}${TEMPLATE_CSS[template.id]}${watermark ? WATERMARK_CSS : ''}</style>` +
    `</head><body class="tpl-${template.id} mode-${mode}">` +
    `<div class="page">${renderHeader(data)}${renderSections(data, template)}</div>` +
    (watermark ? watermarkHtml() : '') +
    `</body></html>`
  )
}

/** Chrome `page.pdf()` options for a template: A4, template margins, no header/footer (ATS-clean). */
export function pdfOptionsForTemplate(templateId: ResumeTemplateId): PDFOptions {
  const m = `${getResumeTemplate(templateId).marginMm}mm`
  return {
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: false,
    displayHeaderFooter: false,
    margin: { top: m, right: m, bottom: m, left: m },
  }
}
