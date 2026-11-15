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
