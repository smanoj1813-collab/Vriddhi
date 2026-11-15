import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

// Exercise the exact transitive package Express uses for req.ip. Pinning a
// version alone would miss a nested vulnerable copy after a dependency update.
const expressRequire = require('node:module').createRequire(require.resolve('express'))
const proxyAddress = expressRequire('proxy-addr') as {
  (request: { socket: { remoteAddress: string }; headers: Record<string, string> }, trust: (address: string) => boolean): string
  compile(subnet: string): (address: string) => boolean
}

describe('Express proxy-address security', () => {
  it('does not trust every IPv4 caller for a short IPv4-mapped IPv6 prefix (GHSA-jqcg-44mw-7w3h)', () => {
    const trust = proxyAddress.compile('::ffff:10.0.0.0/8')
    const request = { socket: { remoteAddress: '203.0.113.10' }, headers: { 'x-forwarded-for': '198.51.100.250' } }
    assert.equal(trust(request.socket.remoteAddress), false)
    assert.equal(proxyAddress(request, trust), request.socket.remoteAddress)
  })

  it('does not reinterpret a zero-leading native IPv6 trust subnet as all IPv4 addresses', () => {
    assert.equal(proxyAddress.compile('::/1')('203.0.113.10'), false)
    assert.equal(proxyAddress.compile('2001:db8::/32')('2001:db8::1234'), true)
  })

  it('preserves correctly configured IPv4 and mapped-IPv6 trusted proxy behavior', () => {
    for (const subnet of ['10.0.0.0/8', '::ffff:10.0.0.0/104']) {
      const trust = proxyAddress.compile(subnet)
      assert.equal(trust('10.2.3.4'), true)
      assert.equal(trust('203.0.113.10'), false)
      assert.equal(proxyAddress({ socket: { remoteAddress: '10.2.3.4' }, headers: { 'x-forwarded-for': '198.51.100.250' } }, trust), '198.51.100.250')
    }
  })
})

// SDK major changes are intentionally exercised offline. No real mail,
// provider request, credentials or user account is touched by these tests.
describe('patched SDK compatibility', () => {
  it('preserves validation defaults, transformed pagination and structured failures', async () => {
    const { questionFilterSchema, questionSchema, aiGenerateSchema } = await import('../src/validation/questionSchema')
    const { validateRequest, validateQuery } = await import('../src/validation/validateRequest')
    assert.deepEqual(questionFilterSchema.parse({}), { limit: 50, offset: 0 })
    assert.deepEqual(questionFilterSchema.parse({ limit: '25', offset: '50', subject: 'Maths' }), { limit: 25, offset: 50, subject: 'Maths' })
    for (const value of [{ limit: '0' }, { limit: '101' }, { offset: '-1' }, { limit: 'NaN' }]) assert.equal(questionFilterSchema.safeParse(value).success, false)
    const valid = { text: 'What is a prime number?', subject: 'Maths', topic: 'Numbers' }
    assert.equal(questionSchema.parse(valid).marks, 1)
    assert.equal(questionSchema.parse(valid).questionType, 'mcq')
    assert.equal(aiGenerateSchema.parse({ subject: 'Maths', topic: 'Numbers', count: 2 }).provider, 'gemini')
    assert.equal(aiGenerateSchema.safeParse({ subject: 'Maths', topic: 'Numbers' }).success, false)
    let nextCalls = 0
    const responses: any[] = []
    const res: any = { status: (code: number) => { responses.push(code); return res }, json: (value: unknown) => responses.push(value) }
    const req: any = { body: valid, query: {} }
    validateRequest(questionSchema)(req, res, () => { nextCalls++ })
    validateQuery(questionFilterSchema)(req, res, () => { nextCalls++ })
    assert.equal(req.body.marks, 1)
    assert.deepEqual(req.query, { limit: 50, offset: 0 })
    assert.equal(nextCalls, 2)
    req.body = { ...valid, text: '' }
    validateRequest(questionSchema)(req, res, () => { nextCalls++ })
    assert.equal(nextCalls, 2)
    assert.equal(responses[0], 400)
    assert.equal(responses[1].error, 'Validation failed')
    assert.ok(responses[1].details.some((error: any) => error.field === 'text'))
  })

  it('retains OpenAI and DeepSeek chat-completion URLs, payload and token usage with mocked fetch', async () => {
    const OpenAI = (await import('openai')).default
    for (const baseURL of ['https://api.openai.com/v1', 'https://api.deepseek.com/v1']) {
      const requests: any[] = []
      const client = new OpenAI({
        apiKey: 'offline-fixture-only', baseURL, maxRetries: 0,
        fetch: async (url, options) => {
          requests.push({ url: String(url), body: JSON.parse(String(options?.body)) })
          return new Response(JSON.stringify({
            id: 'offline-completion', object: 'chat.completion', created: 1, model: 'fixture-model',
            choices: [{ index: 0, message: { role: 'assistant', content: '{"questions":[]}' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 },
          }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        },
      })
      const result = await client.chat.completions.create({ model: 'fixture-model', messages: [{ role: 'user', content: 'An offline fixture' }], temperature: 0.7, response_format: { type: 'json_object' } })
      assert.equal(requests.length, 1)
      assert.equal(requests[0].url, `${baseURL}/chat/completions`)
      assert.deepEqual(requests[0].body.messages, [{ role: 'user', content: 'An offline fixture' }])
      assert.deepEqual(requests[0].body.response_format, { type: 'json_object' })
      assert.equal(result.choices[0].message.content, '{"questions":[]}')
      assert.equal(result.usage?.total_tokens, 18)
    }
  })

  it('keeps SMTP template MIME/envelope delivery compatible with an offline stream transport', async () => {
    const nodemailer = (await import('nodemailer')).default
    const { deliverMail } = await import('../src/mail')
    const { buildMailMessage } = await import('../src/mailCore')
    const original = nodemailer.createTransport
    const captured: any[] = []
    const outputs: any[] = []
    // Exercise the actual delivery function and Nodemailer's MIME/envelope
    // compiler; only the socket transport is replaced with an in-memory stream.
    nodemailer.createTransport = ((options: any) => {
      captured.push(options)
      const transport = original({ streamTransport: true, buffer: true, newline: 'unix', disableFileAccess: options.disableFileAccess, disableUrlAccess: options.disableUrlAccess })
      return { sendMail: async (message: any) => { const info = await transport.sendMail(message); outputs.push(info); return info } }
    }) as typeof original
    try {
      const message = buildMailMessage('generic', 'learner@example.edu', { college: 'Fixture College', title: 'Offline announcement', body: 'No network delivery' })
      const id = await deliverMail({ provider: 'smtp', from: 'no-reply@example.edu', fromName: 'Fixture College', smtp: { host: 'unused.invalid', port: 587, secure: false, user: 'fixture', pass: 'not-a-real-secret' } }, message)
      assert.ok(id)
      assert.equal(captured.length, 1)
      assert.equal(captured[0].host, 'unused.invalid')
      assert.equal(captured[0].disableFileAccess, true)
      assert.equal(captured[0].disableUrlAccess, true)
      assert.deepEqual(outputs[0].envelope.to, ['learner@example.edu'])
      const mime = outputs[0].message.toString('utf8')
      assert.match(mime, /multipart\/alternative/)
      assert.match(mime, /text\/plain/)
      assert.match(mime, /text\/html/)
      assert.match(mime, /To: learner@example.edu/)
      assert.match(mime, /Offline announcement/)
    } finally { nodemailer.createTransport = original }
  })
})
