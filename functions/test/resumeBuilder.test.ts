// functions/test/resumeBuilder.test.ts
//
// Resume Builder add-on — pure-logic coverage: the input sanitiser, the credit
// ledger maths that the /resume/pdf transaction relies on, college settings
// normalisation and the five HTML templates (ATS-safety invariants: text only,
// no tables/images, standard headings, escaping).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  RESUME_TEMPLATES,
  RESUME_TEMPLATE_IDS,
  countResumeWords,
  creditCycleKey,
  defaultResumeSettings,
  emptyResumeData,
  normaliseCreditState,
  normaliseResumeSettings,
  releaseAiCall,
  releaseCredit,
  reserveAiCall,
  reserveCredit,
  resumeFileName,
  sanitizeResumeData,
  summariseCredits,
  type ResumeData,
} from '../src/resume/model'
import { orderedSections, pdfOptionsForTemplate, renderResumeHtml, sectionLabel } from '../src/resume/templates'
import { inlineFontCss, linkedFontHtml } from '../src/resume/fonts'

function sample(): ResumeData {
  return sanitizeResumeData({
    contact: {
      fullName: 'Ananya Rao',
      headline: 'B.Com Final Year | Aspiring Financial Analyst',
      email: 'Ananya.Rao@Example.com',
      phone: '+91 98450 12345',
      location: 'Bengaluru, Karnataka',
      linkedin: 'https://linkedin.com/in/ananyarao',
      github: 'github.com/ananya',
      website: 'javascript:alert(1)',
    },
    summary: 'Detail-oriented commerce student with Tally and Excel experience.\n\nSeeking an analyst role.',
    education: [
      { institution: 'SPM College', degree: 'B.Com', field: 'Accounting & Finance', startYear: '2023', endYear: '2026', score: 'CGPA 8.4/10', highlights: ['Class representative'] },
    ],
    experience: [
      { organisation: 'ABC Chartered Accountants', role: 'Audit Intern', location: 'Bengaluru', startDate: 'May 2025', endDate: '', current: true, bullets: ['Reconciled 120+ vendor ledgers in Tally, cutting month-end close by 2 days'] },
    ],
    projects: [
      { name: 'GST Compliance Tracker', role: 'Team lead', link: 'https://github.com/ananya/gst', startDate: 'Jan 2025', endDate: 'Mar 2025', techStack: ['Excel', 'Power Query'], bullets: ['Built a tracker used by 3 SMEs'] },
    ],
    skills: [{ name: 'Tools', skills: ['Tally Prime', 'MS Excel', 'Power BI'] }],
    certifications: [{ name: 'Tally Essentials', issuer: 'Tally Education', year: '2024', credentialId: 'TE-991' }],
    achievements: ['Runner-up, State Commerce Quiz 2024'],
    languages: ['English', 'Kannada', 'Hindi'],
    sectionOrder: ['education', 'summary'],
  })
}

// ─── sanitiser ──────────────────────────────────────────────────────────────

test('sanitizeResumeData: trims, lowercases email, neutralises dangerous URL schemes, completes section order', () => {
  const data = sample()
  assert.equal(data.contact.email, 'ananya.rao@example.com')
  assert.equal(data.contact.github, 'github.com/ananya')
  assert.equal(data.contact.website, 'alert(1)', 'javascript: scheme is stripped')
  assert.equal(data.contact.linkedin, 'https://linkedin.com/in/ananyarao')
  assert.deepEqual(data.sectionOrder.slice(0, 2), ['education', 'summary'])
  assert.equal(data.sectionOrder.length, 8, 'every section id is present exactly once')
  assert.equal(new Set(data.sectionOrder).size, 8)
  assert.equal(data.experience[0].current, true)
  assert.equal(data.education[0].id, 'edu-1', 'missing ids are generated')
})

test('sanitizeResumeData: caps array sizes and string lengths, strips control characters', () => {
  const huge = sanitizeResumeData({
    contact: { fullName: 'A'.repeat(500) + '\u0007' },
    summary: 'x'.repeat(5000),
    education: Array.from({ length: 30 }, (_, i) => ({ institution: `Inst ${i}`, highlights: Array.from({ length: 20 }, (_, j) => `h${j}`) })),
    achievements: Array.from({ length: 40 }, (_, i) => `ach ${i}`),
    skills: [{ name: 'S', skills: Array.from({ length: 100 }, (_, i) => `s${i}`) }],
  })
  assert.equal(huge.contact.fullName.length, 160)
  assert.ok(!huge.contact.fullName.includes('\u0007'))
  assert.equal(huge.summary.length, 1200)
  assert.equal(huge.education.length, 8)
  assert.equal(huge.education[0].highlights.length, 8)
  assert.equal(huge.achievements.length, 15)
  assert.equal(huge.skills[0].skills.length, 30)
})

test('sanitizeResumeData: garbage in → empty resume out (never throws)', () => {
  for (const input of [undefined, null, 42, 'str', [], { contact: 'nope', education: 'x', sectionOrder: [1, 'bogus'] }]) {
    const out = sanitizeResumeData(input)
    assert.equal(out.contact.fullName, '')
    assert.deepEqual(out.education, [])
    assert.equal(out.sectionOrder.length, 8)
  }
  assert.deepEqual(sanitizeResumeData(undefined), emptyResumeData())
})

test('countResumeWords counts what prints (not the job description)', () => {
  const data = sample()
  const withJd = { ...data, targetJobDescription: 'lorem '.repeat(500) }
  assert.equal(countResumeWords(withJd), countResumeWords(data))
  assert.ok(countResumeWords(data) > 40)
})

// ─── credit cycle + ledger ──────────────────────────────────────────────────

test('creditCycleKey: academic year runs June → May', () => {
  assert.equal(creditCycleKey(new Date('2026-05-31T12:00:00Z')), '2025-26')
  assert.equal(creditCycleKey(new Date('2026-06-01T00:00:00Z')), '2026-27')
  assert.equal(creditCycleKey(new Date('2026-09-25T09:00:00Z')), '2026-27')
  assert.equal(creditCycleKey(new Date('2027-01-15T09:00:00Z')), '2026-27')
  assert.equal(creditCycleKey(new Date('2099-12-01T09:00:00Z')), '2099-00')
})

test('reserveCredit: exactly N renders per template per cycle, then refused', () => {
  let stored: unknown = undefined
  for (let i = 1; i <= 3; i += 1) {
    const r = reserveCredit(stored, 'classic', 3, '2026-27')
    assert.ok(r.ok, `reservation ${i} should pass`)
    if (r.ok) {
      assert.equal(r.version, i)
      assert.equal(r.remaining, 3 - i)
      stored = r.state
    }
  }
  const fourth = reserveCredit(stored, 'classic', 3, '2026-27')
  assert.equal(fourth.ok, false)
  if (!fourth.ok) {
    assert.equal(fourth.reason, 'exhausted')
    assert.equal(fourth.used, 3)
    assert.equal(fourth.allowed, 3)
  }
  // Other templates are independent buckets.
  const modern = reserveCredit(stored, 'modern', 3, '2026-27')
  assert.ok(modern.ok)
  if (modern.ok) assert.equal(modern.version, 1)
})

test('reserveCredit: a new academic year starts a fresh ledger; a raised cap unlocks immediately', () => {
  const exhausted = { cycle: '2025-26', used: { classic: 3, modern: 3 }, aiUsed: 20 }
  const next = reserveCredit(exhausted, 'classic', 3, '2026-27')
  assert.ok(next.ok)
  if (next.ok) {
    assert.equal(next.version, 1)
    assert.equal(next.state.cycle, '2026-27')
    assert.equal(next.state.aiUsed, 0, 'AI counter resets with the cycle too')
    assert.deepEqual(next.state.used, { classic: 1 })
  }
  const raised = reserveCredit(exhausted, 'classic', 5, '2025-26')
  assert.ok(raised.ok)
  if (raised.ok) assert.equal(raised.version, 4)
})

test('releaseCredit: gives one back, never below zero, never across cycles', () => {
  const state = { cycle: '2026-27', used: { classic: 2, modern: 1 }, aiUsed: 0 }
  assert.deepEqual(releaseCredit(state, 'classic', '2026-27').used, { classic: 1, modern: 1 })
  assert.deepEqual(releaseCredit(state, 'modern', '2026-27').used, { classic: 2 })
  assert.deepEqual(releaseCredit(state, 'compact', '2026-27').used, { classic: 2, modern: 1 })
  assert.deepEqual(releaseCredit(state, 'classic', '2027-28').used, {}, 'old-cycle state is discarded, nothing goes negative')
})

test('normaliseCreditState ignores junk values and other cycles', () => {
  assert.deepEqual(normaliseCreditState({ cycle: '2026-27', used: { classic: '3', modern: 2.7, bogus: 1, compact: -1 }, aiUsed: 'x' }, '2026-27'), {
    cycle: '2026-27',
    used: { modern: 2 },
    aiUsed: 0,
  })
  assert.deepEqual(normaliseCreditState({ cycle: '2020-21', used: { classic: 3 } }, '2026-27'), { cycle: '2026-27', used: {}, aiUsed: 0 })
})

test('summariseCredits reports remaining per template and honours the template allow-list', () => {
  const settings = { ...defaultResumeSettings(), enabled: true, disabledTemplates: ['executive' as const] }
  const rows = summariseCredits({ cycle: '2026-27', used: { classic: 2 }, aiUsed: 0 }, settings)
  assert.equal(rows.length, 5)
  const classic = rows.find((r) => r.templateId === 'classic')!
  assert.deepEqual({ used: classic.used, allowed: classic.allowed, remaining: classic.remaining }, { used: 2, allowed: 3, remaining: 1 })
  assert.equal(rows.find((r) => r.templateId === 'executive')!.enabled, false)
  assert.equal(rows.find((r) => r.templateId === 'modern')!.remaining, 3)
})

test('AI calls have their own capped ledger', () => {
  let stored: unknown = { cycle: '2026-27', used: { classic: 1 }, aiUsed: 19 }
  const ok = reserveAiCall(stored, 20, '2026-27')
  assert.ok(ok.ok)
  if (ok.ok) {
    assert.equal(ok.remaining, 0)
    assert.deepEqual(ok.state.used, { classic: 1 }, 'PDF credits untouched')
    stored = ok.state
  }
  const refused = reserveAiCall(stored, 20, '2026-27')
  assert.equal(refused.ok, false)
  assert.equal(releaseAiCall(stored, '2026-27').aiUsed, 19)
  assert.equal(releaseAiCall({ cycle: '2026-27', aiUsed: 0 }, '2026-27').aiUsed, 0)
})

// ─── settings ───────────────────────────────────────────────────────────────

test('normaliseResumeSettings: add-on is OFF by default, caps are clamped, unknown templates dropped', () => {
  const d = normaliseResumeSettings(undefined)
  assert.deepEqual(d, { enabled: false, downloadsPerTemplate: 3, disabledTemplates: [], aiAssist: false, aiCallsPerStudent: 20 })
  const s = normaliseResumeSettings({ enabled: true, downloadsPerTemplate: 99, disabledTemplates: ['executive', 'nope', 'executive'], aiAssist: true, aiCallsPerStudent: -5 })
  assert.deepEqual(s, { enabled: true, downloadsPerTemplate: 10, disabledTemplates: ['executive'], aiAssist: true, aiCallsPerStudent: 0 })
  assert.equal(normaliseResumeSettings({ downloadsPerTemplate: '2' }).downloadsPerTemplate, 2)
  assert.equal(normaliseResumeSettings({ downloadsPerTemplate: 0 }).downloadsPerTemplate, 1)
  // Partial PUT bodies keep the stored values they do not mention.
  const merged = normaliseResumeSettings({ aiAssist: true }, { ...defaultResumeSettings(), enabled: true, downloadsPerTemplate: 5 })
  assert.equal(merged.enabled, true)
  assert.equal(merged.downloadsPerTemplate, 5)
  assert.equal(merged.aiAssist, true)
})

// ─── templates ──────────────────────────────────────────────────────────────

test('every template renders the same content as single-column text (no tables, images, columns or scripts)', () => {
  const data = sample()
  assert.equal(RESUME_TEMPLATES.length, 5)
  for (const id of RESUME_TEMPLATE_IDS) {
    const html = renderResumeHtml(data, { templateId: id, mode: 'print', fontMarkup: '' })
    assert.ok(html.startsWith('<!DOCTYPE html>'), `${id}: full document`)
    assert.ok(html.includes('Ananya Rao'), `${id}: name`)
    assert.ok(html.includes('ananya.rao@example.com') && html.includes('+91 98450 12345'), `${id}: contact line`)
    assert.ok(html.includes('Reconciled 120+ vendor ledgers'), `${id}: bullets`)
    assert.ok(html.includes('Tally Prime, MS Excel, Power BI'), `${id}: skills as a comma list`)
    assert.ok(html.includes('CGPA 8.4/10') && html.includes('2023 – 2026'), `${id}: education dates + score`)
    assert.ok(html.includes('May 2025 – Present'), `${id}: current role shows Present`)
    assert.ok(html.includes('<h2>Education</h2>') && html.includes('<h2>Skills</h2>'), `${id}: standard headings`)
    for (const forbidden of ['<table', '<img', '<svg', '<script', 'column-count', 'position:absolute']) {
      assert.ok(!html.includes(forbidden), `${id}: must not contain ${forbidden}`)
    }
    assert.ok(!html.includes('VRIDDHI PREVIEW'), `${id}: print output carries no watermark`)
  }
})

test('user text is escaped, links are only emitted for http(s) URLs', () => {
  const data = sanitizeResumeData({
    contact: { fullName: '<script>alert("x")</script> Kumar', email: 'a@b.c', website: 'javascript:evil()', linkedin: 'https://linkedin.com/in/k' },
    achievements: ['Won "Best" <b>award</b> & more'],
  })
  const html = renderResumeHtml(data, { templateId: 'modern', mode: 'print', fontMarkup: '' })
  assert.ok(!html.includes('<script>alert'))
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; Kumar'))
  assert.ok(html.includes('Won &quot;Best&quot; &lt;b&gt;award&lt;/b&gt; &amp; more'))
  assert.ok(!html.includes('javascript:'))
  assert.ok(html.includes('<a href="https://linkedin.com/in/k">linkedin.com/in/k</a>'))
})

test('empty sections are skipped and the student\'s section order is respected', () => {
  const data = sample()
  const html = renderResumeHtml(data, { templateId: 'classic', mode: 'print', fontMarkup: '' })
  assert.ok(html.indexOf('<h2>Education</h2>') < html.indexOf('<h2>Professional Summary</h2>'), 'education was moved above the summary')
  const bare = sanitizeResumeData({ contact: { fullName: 'Solo Name' } })
  const bareHtml = renderResumeHtml(bare, { templateId: 'classic', mode: 'print', fontMarkup: '' })
  assert.ok(!bareHtml.includes('<h2>'), 'no empty headings')
  assert.ok(bareHtml.includes('Solo Name'))
  assert.deepEqual(orderedSections(emptyResumeData(), RESUME_TEMPLATES[0]).length, 8)
})

test('template-specific headings: Fresher speaks to campus drives, Executive opens with a Profile', () => {
  assert.equal(sectionLabel('fresher', 'projects'), 'Academic Projects')
  assert.equal(sectionLabel('fresher', 'experience'), 'Internships & Experience')
  assert.equal(sectionLabel('executive', 'summary'), 'Profile')
  assert.equal(sectionLabel('classic', 'summary'), 'Professional Summary')
  const html = renderResumeHtml(sample(), { templateId: 'fresher', mode: 'print', fontMarkup: '' })
  assert.ok(html.includes('<h2>Academic Projects</h2>'))
})

test('preview mode is watermarked, links Google Fonts and draws A4 page guides; print mode embeds the fonts', () => {
  const data = sample()
  const preview = renderResumeHtml(data, { templateId: 'executive', mode: 'preview' })
  assert.ok(preview.includes('VRIDDHI PREVIEW'))
  assert.ok(preview.includes('fonts.googleapis.com/css2?family=Inter') && preview.includes('Source+Serif+4'))
  assert.ok(preview.includes('width:210mm') && preview.includes('background-size:100% 297mm'))
  const print = renderResumeHtml(data, { templateId: 'executive', mode: 'print' })
  assert.ok(!print.includes('fonts.googleapis.com'))
  assert.ok(print.includes("@font-face{font-family:'Inter'") && print.includes("@font-face{font-family:'Source Serif 4'"), 'both faces embedded for the mixed template')
  assert.ok(print.includes('data:font/woff2;base64,'))
  assert.ok(!print.includes('VRIDDHI PREVIEW'))
})

test('fonts: only the faces a template needs are shipped', () => {
  const sansOnly = inlineFontCss(['inter'])
  assert.ok(sansOnly.includes("font-family:'Inter'") && !sansOnly.includes('Source Serif'))
  assert.equal((sansOnly.match(/@font-face/g) || []).length, 3, '400/600/700')
  assert.equal(linkedFontHtml([]), '')
  assert.ok(linkedFontHtml(['source-serif-4']).includes('Source+Serif+4') && !linkedFontHtml(['source-serif-4']).includes('Inter'))
})

test('pdfOptionsForTemplate: A4, template margins, no running header/footer', () => {
  const compact = pdfOptionsForTemplate('compact')
  assert.equal(compact.format, 'A4')
  assert.deepEqual(compact.margin, { top: '11mm', right: '11mm', bottom: '11mm', left: '11mm' })
  assert.equal(compact.displayHeaderFooter, false)
  assert.equal(pdfOptionsForTemplate('executive').margin?.top, '16mm')
})

test('resumeFileName is filesystem-safe and carries template + version', () => {
  assert.equal(resumeFileName(sample(), 'classic', 2), 'Ananya_Rao_Resume_Classic_v2.pdf')
  const odd = sanitizeResumeData({ contact: { fullName: '  Zoë / O\'Brien: "CEO"  ' } })
  assert.equal(resumeFileName(odd, 'modern', 1), 'Zoe_OBrien_CEO_Resume_Modern_v1.pdf')
  assert.equal(resumeFileName(emptyResumeData(), 'compact', 3), 'Resume_Resume_Compact_v3.pdf')
})
