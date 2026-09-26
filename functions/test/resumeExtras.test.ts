// functions/test/resumeExtras.test.ts
//
// Item 4.2. Three things can go wrong with generated application text and all
// three reach a recruiter rather than a student: an invented fact, an unfilled
// [placeholder], and a letter that ignores the job description. The sanitiser
// catches the second, the prompts forbid the first and third, and the readiness
// score is checked for the property the placement cell actually relies on —
// that a filled resume scores high and an empty one scores low.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DEFAULT_INTERVIEW_QUESTIONS,
  MAX_INTERVIEW_QUESTIONS,
  buildCoverLetterPrompt,
  buildInterviewQuestionsPrompt,
  buildLinkedinAboutPrompt,
  clampText,
  csvCell,
  profileDigest,
  readinessFor,
  sanitiseInterviewQuestions,
  sanitiseResumeDoc,
  skillNames,
} from '../src/resume/extras'

const profile = {
  fullName: 'Bala Kumar',
  headline: 'Final-year B.Com student | Accounting & GST',
  email: 'bala@example.edu',
  phone: '+91 90000 00000',
  location: 'Bengaluru',
  course: 'B.Com',
  branch: 'Commerce',
  graduationYear: 2027,
  summary: 'Final-year commerce student specialising in indirect taxation and audit, with internship experience in GST filings and ledger reconciliation for mid-size textile and manufacturing clients across Bengaluru.',
  skills: [{ name: 'Tally' }, { name: 'GST filing' }, { name: 'Advanced Excel' }, { name: 'Costing' }, { name: 'TDS returns' }],
  experience: [
    {
      company: 'Rao & Associates',
      role: 'Audit Intern',
      bullets: ['Reconciled 120+ purchase ledgers for a mid-size textile client', 'Prepared GST returns for 8 monthly filings'],
    },
  ],
  projects: [{ title: 'Cost sheet model', bullets: ['Built an Excel cost sheet that cut a client reporting cycle by 2 days'] }],
  education: [{ institution: 'St Joseph’s College, Bengaluru', degree: 'B.Com', field: 'Commerce', score: '78%' }],
  achievements: ['Won the inter-college tax quiz, 2025'],
}

describe('prompt inputs', () => {
  it('clamps free text instead of trusting it', () => {
    assert.equal(clampText('  a   b \n c ', 100), 'a b c')
    assert.equal(clampText('x'.repeat(500), 20).length, 20)
    assert.equal(clampText(undefined, 20), '')
  })

  it('reads skill names from both the object and string shapes', () => {
    assert.deepEqual(skillNames({ skills: [{ name: 'Tally' }, 'GST filing'] }), ['Tally', 'GST filing'])
    assert.deepEqual(skillNames({ skills: [{ category: 'software' }] }), [])
  })

  it('builds a digest that carries the facts a prompt needs', () => {
    const digest = profileDigest(profile)
    assert.match(digest, /Headline: Final-year B\.Com/)
    assert.match(digest, /Course: B\.Com Commerce/)
    assert.match(digest, /Skills: Tally, GST filing/)
    assert.match(digest, /Experience: Audit Intern at Rao & Associates/)
  })

  it('is empty-safe: a brand-new profile produces an empty digest, not "undefined"', () => {
    assert.equal(profileDigest({ skills: [] }), '')
    assert.doesNotMatch(profileDigest({ skills: [] }), /undefined/)
  })
})

describe('cover letter prompt', () => {
  const prompt = buildCoverLetterPrompt({
    profile,
    jobTitle: 'Article Assistant',
    company: 'Rao & Associates',
    jobDescription: 'Must know Tally and GST filing. Audit exposure preferred.',
  })

  it('carries the candidate facts and the job description', () => {
    assert.match(prompt, /Article Assistant/)
    assert.match(prompt, /Rao & Associates/)
    assert.match(prompt, /Must know Tally and GST filing/)
    assert.match(prompt, /Reconciled 120\+ purchase ledgers/)
  })

  it('forbids the two failure modes: inventing facts and clichés', () => {
    assert.match(prompt, /Never invent experience, employers, marks or certifications/)
    assert.match(prompt, /no flattery, no clichés/)
    assert.match(prompt, /250–350 words/)
  })

  it('caps a pasted job description so one request cannot blow up the token bill', () => {
    const huge = buildCoverLetterPrompt({ profile, jobTitle: 'X', jobDescription: 'y'.repeat(20_000) })
    assert.ok(huge.length < 20_000, `prompt was ${huge.length} chars`)
  })
})

describe('linkedin about prompt', () => {
  const prompt = buildLinkedinAboutPrompt({ profile, goal: 'Looking for an audit articleship in Bengaluru' })
  it('asks for the length and bans buzzwords', () => {
    assert.match(prompt, /120–180 words/)
    assert.match(prompt, /no buzzword salad/)
    assert.match(prompt, /Invent nothing/)
  })
})

describe('interview questions prompt', () => {
  it('asks for the requested count and the JSON shape', () => {
    const prompt = buildInterviewQuestionsPrompt({ profile, jobTitle: 'Article Assistant', count: 8 })
    assert.match(prompt, /exactly 8 interview questions/)
    assert.match(prompt, /"answerHint"/)
  })

  it('clamps an absurd count to the platform maximum', () => {
    const prompt = buildInterviewQuestionsPrompt({ profile, jobTitle: 'X', count: 500 })
    assert.match(prompt, new RegExp(`exactly ${MAX_INTERVIEW_QUESTIONS} interview questions`))
  })

  it('defaults to the documented count', () => {
    const prompt = buildInterviewQuestionsPrompt({ profile, jobTitle: 'X' })
    assert.match(prompt, new RegExp(`exactly ${DEFAULT_INTERVIEW_QUESTIONS} interview questions`))
  })

  it('asks for questions about what the candidate actually claimed', () => {
    const prompt = buildInterviewQuestionsPrompt({ profile, jobTitle: 'X' })
    assert.match(prompt, /their own projects\/internships/)
    assert.match(prompt, /answerable from the profile or the job description/)
  })
})

describe('resume document sanitiser', () => {
  it('keeps a normal letter', () => {
    const letter = 'Dear Hiring Team,\n\nI am applying for the Article Assistant role. ' + 'I reconciled ledgers and filed GST returns. '.repeat(20)
    const result = sanitiseResumeDoc(letter, 'coverLetter')
    assert.equal(result.ok, true)
    assert.ok(result.wordCount > 150)
  })

  it('strips a code fence, a preamble and a chat sign-off', () => {
    const body = 'I am applying for the role at your firm. ' + 'I have filed GST returns and reconciled ledgers. '.repeat(20)
    const result = sanitiseResumeDoc(`Sure! Here is a cover letter.\n\n\`\`\`markdown\n${body}\n\`\`\`\n\nLet me know if you want it shorter!`, 'coverLetter')
    assert.equal(result.ok, true)
    assert.doesNotMatch(result.text, /```/)
    assert.doesNotMatch(result.text, /Sure!/)
    assert.doesNotMatch(result.text, /Let me know/)
    assert.ok(result.issues.some((issue) => /fence/.test(issue)))
  })

  it('removes an unfilled placeholder — the thing a recruiter would see', () => {
    const body = 'I am [Your Name] and I am applying for the role. ' + 'I have hands-on experience with Tally and GST filing. '.repeat(20)
    const result = sanitiseResumeDoc(body, 'coverLetter')
    assert.equal(result.ok, true)
    assert.doesNotMatch(result.text, /\[Your Name\]/)
    assert.ok(result.issues.some((issue) => /placeholder/.test(issue)))
  })

  it('rejects an empty or stub answer', () => {
    assert.equal(sanitiseResumeDoc('', 'coverLetter').ok, false)
    assert.equal(sanitiseResumeDoc('Dear Hiring Team, I am interested.', 'coverLetter').ok, false)
  })

  it('flags a letter that overshoots the length it was asked for', () => {
    const result = sanitiseResumeDoc('word '.repeat(600), 'coverLetter')
    assert.equal(result.ok, true)
    assert.ok(result.issues.some((issue) => /longer than asked/.test(issue)))
  })

  it('holds the LinkedIn About to its shorter length', () => {
    const result = sanitiseResumeDoc('word '.repeat(300), 'linkedinAbout')
    assert.ok(result.issues.some((issue) => /longer than asked/.test(issue)))
    assert.equal(sanitiseResumeDoc('one two three', 'linkedinAbout').ok, false)
  })
})

describe('interview question parser', () => {
  const good = { question: 'Walk me through how you reconciled 120 purchase ledgers.', why: 'Checks real ownership', answerHint: 'Name the tool, the volume and the error rate.' }

  it('parses an array and an { items } wrapper, with or without a fence', () => {
    assert.equal(sanitiseInterviewQuestions(JSON.stringify([good])).items.length, 1)
    assert.equal(sanitiseInterviewQuestions(JSON.stringify({ items: [good] })).items.length, 1)
    assert.equal(sanitiseInterviewQuestions('```json\n' + JSON.stringify([good]) + '\n```').items.length, 1)
  })

  it('fails cleanly on prose', () => {
    const result = sanitiseInterviewQuestions('Here are some questions you might be asked.')
    assert.equal(result.ok, false)
    assert.deepEqual(result.items, [])
  })

  it('drops duplicates and unusable entries but keeps the rest', () => {
    const result = sanitiseInterviewQuestions(JSON.stringify([good, good, { question: 'hi' }]))
    assert.equal(result.items.length, 1)
    assert.ok(result.issues.some((issue) => /duplicate/.test(issue)))
    assert.ok(result.issues.some((issue) => /too short/.test(issue)))
  })

  it('truncates an over-long answer hint instead of storing a wall of text', () => {
    const result = sanitiseInterviewQuestions(JSON.stringify([{ ...good, answerHint: 'x'.repeat(2000) }]))
    assert.equal(result.items[0].answerHint.length, 500)
  })
})

describe('placement readiness', () => {
  it('scores a complete resume as Ready', () => {
    const readiness = readinessFor({ ...profile, resumeUpdatedAt: '2026-09-26T00:00:00.000Z' })
    assert.equal(readiness.score, 100)
    assert.equal(readiness.band, 'Ready')
    assert.deepEqual(readiness.missing, [])
  })

  it('marks exactly the imperfect signal, not the whole profile', () => {
    // Same profile, but the bullets carry no numbers: only that check is lost.
    const readiness = readinessFor({
      ...profile,
      resumeUpdatedAt: '2026-09-26T00:00:00.000Z',
      experience: [{ company: 'Rao & Associates', role: 'Audit Intern', bullets: ['Worked on client ledgers'] }],
      projects: [{ title: 'Cost sheet model', bullets: ['Built a cost sheet in Excel'] }],
      achievements: ['Won the inter-college tax quiz'],
    })
    assert.equal(readiness.score, 90)
    assert.deepEqual(readiness.missing, ['at least one bullet with a number in it'])
  })

  it('scores an empty resume at the bottom and says what is missing', () => {
    const readiness = readinessFor({ skills: [] })
    assert.ok(readiness.score < 15, `expected a low score, got ${readiness.score}`)
    assert.equal(readiness.band, 'Barely started')
    for (const expected of ['name or contact details', 'an education entry', 'at least five skills', 'a saved resume']) {
      assert.ok(readiness.missing.includes(expected), `missing should include "${expected}": ${readiness.missing.join(', ')}`)
    }
  })

  it('does not count a project-heavy profile as empty', () => {
    const readiness = readinessFor({
      fullName: 'Anita',
      email: 'a@example.edu',
      skills: ['Tally', 'Excel', 'GST', 'Costing', 'TDS'],
      projects: [{ title: 'Cost sheet', bullets: ['Cut reporting by 2 days'] }],
    })
    assert.ok(readiness.score >= 60, `expected >= 60, got ${readiness.score}`)
    assert.equal(readiness.missing.includes('an internship, job or project'), false)
  })

  it('flags unquantified bullets, which is the one thing recruiters notice', () => {
    const readiness = readinessFor({
      fullName: 'Anita', email: 'a@example.edu',
      skills: ['Tally', 'Excel', 'GST', 'Costing', 'TDS'],
      education: [{ institution: 'St Joseph’s' }],
      experience: [{ company: 'Rao & Associates', role: 'Intern', bullets: ['Worked on client files'] }],
    })
    assert.ok(readiness.missing.includes('at least one bullet with a number in it'))
  })

  it('never exceeds 100 or drops below 0', () => {
    const score = readinessFor({ ...profile, resumeUpdatedAt: 'x', downloads: 99 }).score
    assert.ok(score >= 0 && score <= 100)
  })
})

describe('csv export', () => {
  it('quotes cells that contain commas, quotes or newlines', () => {
    assert.equal(csvCell('Bala Kumar'), 'Bala Kumar')
    assert.equal(csvCell('Kumar, Bala'), '"Kumar, Bala"')
    assert.equal(csvCell('He said "hi"'), '"He said ""hi"""')
    assert.equal(csvCell('line one\nline two'), '"line one\nline two"')
    assert.equal(csvCell(undefined), '')
  })
})
