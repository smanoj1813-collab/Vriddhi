import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CODE_RUNNER_DAILY_LIMIT,
  CODE_RUNNER_MAX_OUTPUT_CHARS,
  CODE_RUNNER_PER_MINUTE_LIMIT,
  CodeRunInputError,
  decideCodeRunnerQuota,
  findJudge0LanguageId,
  isBcaProgram,
  limitRunnerOutput,
  parseCodeRunRequest,
} from '../src/codeRunnerCore'

describe('isBcaProgram', () => {
  it('recognises the BCA degree and common labels only', () => {
    assert.equal(isBcaProgram('BCA'), true)
    assert.equal(isBcaProgram('B.C.A.'), true)
    assert.equal(isBcaProgram('Bachelor of Computer Applications'), true)
    assert.equal(isBcaProgram('BCA (Computer Applications)'), true)
    assert.equal(isBcaProgram('B.Sc Computer Science'), false)
    assert.equal(isBcaProgram('MCA'), false)
    assert.equal(isBcaProgram('BBA'), false)
    assert.equal(isBcaProgram(''), false)
  })
})

describe('parseCodeRunRequest', () => {
  it('accepts only allowlisted languages and plain source and input text', () => {
    assert.deepEqual(parseCodeRunRequest({
      language: ' Cpp ',
      sourceCode: '#include <iostream>\nint main() {}',
      stdin: '7 8',
    }), {
      language: 'cpp',
      sourceCode: '#include <iostream>\nint main() {}',
      stdin: '7 8',
    })
    assert.equal(parseCodeRunRequest({ language: 'python', sourceCode: 'print(1)' }).stdin, '')
  })

  it('rejects missing code and unsupported languages', () => {
    assert.throws(() => parseCodeRunRequest(null), CodeRunInputError)
    assert.throws(() => parseCodeRunRequest({ language: 'ruby', sourceCode: 'puts 1' }), /Choose C/)
    assert.throws(() => parseCodeRunRequest({ language: 'c', sourceCode: '   ' }), /Enter some source code/)
  })

  it('enforces request-size limits and rejects non-string stdin', () => {
    assert.throws(() => parseCodeRunRequest({
      language: 'c', sourceCode: 'x'.repeat(16_001),
    }), /at most/)
    assert.throws(() => parseCodeRunRequest({
      language: 'java', sourceCode: 'class Main {}', stdin: { secret: 'not text' },
    }), /plain text/)
    assert.throws(() => parseCodeRunRequest({
      language: 'python', sourceCode: 'print(1)', stdin: 'x'.repeat(4_001),
    }), /at most/)
  })
})

describe('findJudge0LanguageId', () => {
  const languages = [
    { id: 50, name: 'C (GCC 9.2.0)' },
    { id: 54, name: 'C++ (GCC 9.2.0)' },
    { id: 62, name: 'Java (OpenJDK 13.0.1)' },
    { id: 71, name: 'Python (3.8.1)' },
  ]

  it('matches compiler names without confusing C with C++', () => {
    assert.equal(findJudge0LanguageId('c', languages), 50)
    assert.equal(findJudge0LanguageId('cpp', languages), 54)
    assert.equal(findJudge0LanguageId('java', languages), 62)
    assert.equal(findJudge0LanguageId('python', languages), 71)
  })

  it('returns null if the configured Judge0 host does not offer a language', () => {
    assert.equal(findJudge0LanguageId('cpp', [{ id: 50, name: 'C (GCC)' }]), null)
    assert.equal(findJudge0LanguageId('java', [{ id: 'invalid', name: 'Java' }]), null)
  })
})

describe('decideCodeRunnerQuota', () => {
  const now = Date.parse('2026-10-01T12:34:10.000Z')
  const dayKey = '2026-10-01'
  const minuteKey = '2026-10-01T12:34'

  it('starts a fresh daily and per-minute window', () => {
    assert.deepEqual(decideCodeRunnerQuota(undefined, now), {
      allowed: true,
      dayKey,
      minuteKey,
      dailyRuns: 1,
      minuteRuns: 1,
      dailyRemaining: CODE_RUNNER_DAILY_LIMIT - 1,
    })
  })

  it('resets counters when the day or minute changes', () => {
    const decision = decideCodeRunnerQuota({
      dayKey: '2026-09-30', dailyRuns: 30,
      minuteKey: '2026-10-01T12:33', minuteRuns: 6,
    }, now)
    assert.equal(decision.allowed, true)
    assert.equal(decision.dailyRuns, 1)
    assert.equal(decision.minuteRuns, 1)
  })

  it('blocks a user at the daily cap', () => {
    const decision = decideCodeRunnerQuota({ dayKey, dailyRuns: CODE_RUNNER_DAILY_LIMIT }, now)
    assert.equal(decision.allowed, false)
    assert.equal(decision.reason, 'daily')
    assert.equal(decision.dailyRemaining, 0)
  })

  it('blocks a user at the per-minute cap without spending more daily quota', () => {
    const decision = decideCodeRunnerQuota({
      dayKey, dailyRuns: 4,
      minuteKey, minuteRuns: CODE_RUNNER_PER_MINUTE_LIMIT,
    }, now)
    assert.equal(decision.allowed, false)
    assert.equal(decision.reason, 'minute')
    assert.equal(decision.dailyRuns, 4)
    assert.equal(decision.dailyRemaining, CODE_RUNNER_DAILY_LIMIT - 4)
  })
})

describe('limitRunnerOutput', () => {
  it('leaves short output intact and truncates oversized output', () => {
    assert.equal(limitRunnerOutput('hello'), 'hello')
    const limited = limitRunnerOutput('x'.repeat(CODE_RUNNER_MAX_OUTPUT_CHARS + 5))
    assert.ok(limited.length < CODE_RUNNER_MAX_OUTPUT_CHARS + 100)
    assert.match(limited, /output truncated/)
  })
})
