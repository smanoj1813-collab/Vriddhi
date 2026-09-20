import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isPwaStandalone,
  PWA_INSTALL_REQUEST_EVENT,
  pwaInstallGuidance,
  requestPwaInstall,
} from './install'

describe('PWA install helpers', () => {
  it('is safe outside a browser', () => {
    assert.equal(isPwaStandalone(), false)
  })

  it('dispatches the global event used by the permanent navigation action', () => {
    const originalWindow = globalThis.window
    let eventType = ''
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        dispatchEvent(event: Event) {
          eventType = event.type
          return true
        },
      },
    })

    try {
      requestPwaInstall()
      assert.equal(eventType, PWA_INSTALL_REQUEST_EVENT)
    } finally {
      if (originalWindow) {
        Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow })
      } else {
        Reflect.deleteProperty(globalThis, 'window')
      }
    }
  })

  it('gives iOS-specific Add to Home Screen instructions', () => {
    assert.match(pwaInstallGuidance('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), /Share.*Add to Home Screen/i)
  })

  it('gives Android and desktop browser-menu instructions', () => {
    assert.match(pwaInstallGuidance('Mozilla/5.0 (Linux; Android 15)'), /Install app.*Add to Home screen/i)
  })
})
