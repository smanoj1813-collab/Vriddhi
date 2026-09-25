// src/shared/utils/resumeAts.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyResumeData, prefillResumeData, type ResumeData } from '../types/resume'
import { estimateResumePages, extractKeywords, keywordCoverage, runAtsCheck } from './resumeAts'

function strongResume(): ResumeData {
  const d = emptyResumeData()
  d.contact = {
    fullName: 'Ananya Rao',
    headline: 'B.Com Final Year | Aspiring Financial Analyst',
    email: 'ananya.rao@example.com',
    phone: '+91 98450 12345',
    location: 'Bengaluru',
    linkedin: 'https://linkedin.com/in/ananyarao',
    github: '',
    website: '',
  }
  d.summary =
    'Detail-oriented B.Com final-year student with hands-on Tally Prime, advanced Excel and GST filing experience from a six-month audit internship. ' +
    'Reconciled 120+ vendor ledgers and automated month-end reports that cut closing time by two days. Seeking a financial analyst role where accuracy and speed matter.'
  d.education = [{ id: 'e1', institution: 'SPM College', degree: 'B.Com', field: 'Accounting', location: 'Bengaluru', startYear: '2023', endYear: '2026', score: 'CGPA 8.4/10', highlights: [] }]
  d.experience = [
    {
      id: 'x1', organisation: 'ABC & Co', role: 'Audit Intern', location: 'Bengaluru', startDate: 'Jan 2025', endDate: 'Jun 2025', current: false,
      bullets: [
        'Reconciled 120+ vendor ledgers in Tally Prime, reducing month-end close by 2 days',
        'Prepared GST returns for 15 SME clients with zero notices in two quarters',
        'Built Excel dashboards tracking receivables worth ₹3.2 crore',
      ],
    },
  ]
  d.projects = [
    { id: 'p1', name: 'GST Compliance Tracker', role: 'Team lead', link: '', startDate: 'Jan 2025', endDate: 'Mar 2025', techStack: ['Excel', 'Power Query'], bullets: ['Led a team of 3 to deliver a tracker adopted by 4 local firms'] },
  ]
  d.skills = [{ id: 's1', name: 'Tools', skills: ['Tally Prime', 'MS Excel', 'Power BI', 'GST filing', 'Bank reconciliation', 'Financial modelling', 'SQL'] }]
  d.achievements = ['Won first place in the State Commerce Quiz 2024 among 200 teams']
  d.languages = ['English', 'Kannada']
  return d
}

test('a complete, quantified resume scores Excellent', () => {
  const report = runAtsCheck(strongResume())
  assert.ok(report.score >= 85, `score ${report.score}`)
  assert.equal(report.grade, 'Excellent')
  assert.equal(report.checks.find((c) => c.id === 'email')?.status, 'pass')
  assert.equal(report.checks.find((c) => c.id === 'verbs')?.status, 'pass')
  assert.equal(report.checks.find((c) => c.id === 'numbers')?.status, 'pass')
  assert.equal(report.checks.find((c) => c.id === 'dates')?.status, 'pass')
  assert.equal(report.checks.find((c) => c.id === 'pronouns')?.status, 'pass')
  assert.equal(report.keywords, null, 'no job description → no keyword check')
})

test('an empty resume is Weak and names the missing basics', () => {
  const report = runAtsCheck(emptyResumeData())
  assert.ok(report.score < 30, `score ${report.score}`)
  assert.equal(report.grade, 'Weak')
  for (const id of ['email', 'phone', 'summary', 'education', 'substance', 'skills']) {
    assert.equal(report.checks.find((c) => c.id === id)?.status, 'fail', id)
  }
  assert.equal(report.estimatedPages, 1)
})

test('first-person prose, weak verbs and missing numbers are flagged', () => {
  const d = strongResume()
  d.summary = 'I am a hardworking student and my goal is to learn. ' + d.summary
  d.experience[0].bullets = ['Responsible for ledgers', 'Was part of the audit team', 'Helped with returns']
  d.projects[0].bullets = ['Worked on a tracker']
  d.achievements = []
  const report = runAtsCheck(d)
  assert.equal(report.checks.find((c) => c.id === 'pronouns')?.status, 'warn')
  assert.equal(report.checks.find((c) => c.id === 'verbs')?.status, 'fail')
  assert.equal(report.checks.find((c) => c.id === 'numbers')?.status, 'fail')
  assert.ok(report.score < 85)
})

test('inconsistent date formats and missing start dates only warn', () => {
  const d = strongResume()
  d.experience[0].startDate = '2025'
  d.experience[0].endDate = 'June 2025'
  let report = runAtsCheck(d)
  assert.equal(report.checks.find((c) => c.id === 'dates')?.status, 'warn')
  d.experience[0].startDate = ''
  report = runAtsCheck(d)
  assert.match(report.checks.find((c) => c.id === 'dates')?.detail || '', /missing a start date/)
})

test('length check: two pages is fine, three is not', () => {
  const d = strongResume()
  d.achievements = Array.from({ length: 15 }, (_, i) => `Achievement number ${i} with a fairly long sentence of supporting detail to pad the words out considerably`)
  d.education[0].highlights = Array.from({ length: 8 }, (_, i) => `Highlight ${i} with plenty of extra words to push the total count upward and beyond the limit`)
  d.projects = Array.from({ length: 12 }, (_, i) => ({ ...d.projects[0], id: `p${i}`, bullets: Array.from({ length: 8 }, (_, j) => `Delivered milestone ${j} for project ${i} with a long explanatory clause about impact`) }))
  const report = runAtsCheck(d)
  assert.ok(report.wordCount > 950, `words ${report.wordCount}`)
  assert.equal(report.checks.find((c) => c.id === 'length')?.status, 'fail')
  assert.ok(report.estimatedPages >= 3)
  assert.equal(estimateResumePages(480), 1)
  assert.equal(estimateResumePages(481), 2)
})

test('keyword coverage against a pasted job description', () => {
  const jd =
    'We are hiring a Financial Analyst. Requirements: advanced Excel, financial modelling, GST compliance, SQL, Power BI dashboards, ' +
    'bank reconciliation and strong communication. Experience with SAP and Python is a plus. Knowledge of IFRS preferred.'
  const kws = extractKeywords(jd)
  assert.ok(kws.includes('excel') && kws.includes('sql') && kws.includes('sap'))
  assert.ok(!kws.includes('the') && !kws.includes('requirements') && !kws.includes('strong'))
  const d = strongResume()
  const coverage = keywordCoverage(d, jd)!
  assert.ok(coverage.matched.includes('excel') && coverage.matched.includes('sql') && coverage.matched.includes('gst'))
  assert.ok(coverage.missing.includes('sap') && coverage.missing.includes('python') && coverage.missing.includes('ifrs'))
  d.targetJobDescription = jd
  const report = runAtsCheck(d)
  assert.ok(report.keywords && report.keywords.coverage === coverage.coverage)
  assert.ok(report.checks.some((c) => c.id === 'keywords'))
})

test('emoji and symbol soup is caught; Indian-language names and ₹ are not', () => {
  const clean = strongResume()
  clean.contact.fullName = 'ಅನನ್ಯಾ ರಾವ್'
  assert.equal(runAtsCheck(clean).checks.find((c) => c.id === 'characters')?.status, 'pass')
  const noisy = strongResume()
  noisy.summary += ' 🚀 ★★★'
  assert.equal(runAtsCheck(noisy).checks.find((c) => c.id === 'characters')?.status, 'warn')
})

test('prefillResumeData seeds contact + education from the student record', () => {
  const d = prefillResumeData({ name: 'Bala Kumar', email: 'bala@example.com', course: 'BCA', batch: '2021-2024', collegeName: 'SPM College' })
  assert.equal(d.contact.fullName, 'Bala Kumar')
  assert.equal(d.contact.headline, 'BCA student')
  assert.equal(d.education.length, 1)
  assert.deepEqual([d.education[0].institution, d.education[0].degree, d.education[0].startYear, d.education[0].endYear], ['SPM College', 'BCA', '2021', '2024'])
  assert.equal(d.sectionOrder.length, 8)
  assert.equal(prefillResumeData({}).education.length, 0)
})
