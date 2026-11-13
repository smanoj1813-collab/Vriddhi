// Actual push client and account module, with only browser/SDK transport I/O
// replaced. No network, permission request to a real browser or Firebase token.
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const saved = new Map(['window', 'navigator', 'Notification', 'localStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const messages = [], values = new Map(), listeners = new Map();
let server, push, account, auth, registration, ack, onBinding, requestCount, messaging;
const worker = { postMessage(message, ports) {
  messages.push(message);
  if (ports?.[0]) {
    const respond = () => { ports[0].postMessage({ ok: true }); ports[0].close(); };
    if (ack) ack.push(respond); else respond();
    onBinding?.();
  }
} };
const ticks = async () => { await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve)); };
before(async () => {
  const globals = {
    window: { isSecureContext: true, PushManager: class {}, Notification: {} },
    navigator: { serviceWorker: { controller: worker, ready: Promise.resolve({ active: worker }), getRegistration: async () => registration, addEventListener: (type, fn) => listeners.set(type, fn) } },
    Notification: { permission: 'granted', requestPermission: async () => { requestCount++; return 'granted'; } },
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) },
  };
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  server = await createServer({ root, configFile: path.join(root, 'scripts/render-check/vite.config.mts'),
    server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom', logLevel: 'error', define: { 'import.meta.env.VITE_FIREBASE_VAPID_KEY': JSON.stringify('fixture-public-vapid-key') },
    resolve: { alias: [{ find: /^firebase\/messaging$/, replacement: path.join(root, 'scripts/render-check/stubs/riskMessaging.ts') }] },
  });
  account = await server.ssrLoadModule('/src/shared/pwa/riskPushAccount.ts');
  push = await server.ssrLoadModule('/src/shared/services/riskPush.ts');
  ({ auth } = await server.ssrLoadModule('/scripts/render-check/stubs/firebaseConfig.ts'));
});
after(async () => {
  await server?.close();
  for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  for (const key of ['__RC_RISK_MESSAGING', '__RC_CALLABLE_DATA', '__RC_CALLABLE_PAYLOADS', '__RC_CALLABLE_ERRORS']) delete globalThis[key];
});
beforeEach(async () => {
  registration = { active: worker }; ack = null; onBinding = null; requestCount = 0; values.clear(); messages.length = 0;
  Notification.permission = 'granted';
  auth.currentUser = { uid: 'current-user' };
  messaging = { supported: true, getToken: async () => 'fixture-token', deleted: 0 };
  globalThis.__RC_RISK_MESSAGING = messaging;
  globalThis.__RC_CALLABLE_DATA = { registerMyAcademicRiskDevice: { success: true }, unregisterMyAcademicRiskDevice: { success: true } };
  globalThis.__RC_CALLABLE_ERRORS = {}; globalThis.__RC_CALLABLE_PAYLOADS = [];
  account.setRiskPushAccount('current-user'); await ticks(); messages.length = 0;
});
describe('actual academic risk push client account boundary', () => {
  it('never prompts while restoring explicit opt-in, and registers only the token', async () => {
    await push.enableRiskPush('current-user', false);
    assert.equal(requestCount, 0); assert.equal(push.riskPushOptedIn('current-user'), true);
    assert.deepEqual(globalThis.__RC_CALLABLE_PAYLOADS, [{ name: 'registerMyAcademicRiskDevice', payload: { token: 'fixture-token' } }]);
    assert.deepEqual(messages.filter(m => m.type === 'RISK_PUSH_BIND'), [{ type: 'RISK_PUSH_BIND', uid: 'current-user' }]);
  });
  it('requests permission only from the explicit enable action', async () => { await push.enableRiskPush('current-user', true); assert.equal(requestCount, 1); });
  it('a blocked permission cannot register a token or bind an account', async () => {
    Notification.permission = 'denied'; await assert.rejects(push.enableRiskPush('current-user', false), /blocked/);
    assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.length, 0); assert.equal(messages.length, 0);
  });
  it('explains why a preview/worker-free browser cannot enroll', async () => {
    registration = null; await assert.rejects(push.enableRiskPush('current-user', false), /development preview/);
    assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.length, 0);
  });
  it('sign-out during token acquisition cannot restore the old active account', async () => {
    let release, started; const entered = new Promise(resolve => { started = resolve; });
    messaging.getToken = () => { started(); return new Promise(resolve => { release = resolve; }); };
    const enabling = push.enableRiskPush('current-user', false); const rejected = assert.rejects(enabling, /session changed/);
    await entered; account.setRiskPushAccount(null); await ticks(); release('old-token'); await rejected;
    assert.equal(account.isCurrentRiskPushAccount('current-user'), false);
    assert.equal(messages.some(m => m.type === 'RISK_PUSH_BIND'), false); assert.equal(push.riskPushOptedIn('current-user'), false);
  });
  it('account switching while a token is loading cannot register it for the new user', async () => {
    let release, started; const entered = new Promise(resolve => { started = resolve; });
    messaging.getToken = () => { started(); return new Promise(resolve => { release = resolve; }); };
    const enabling = push.enableRiskPush('current-user', false); const rejected = assert.rejects(enabling, /account changed/);
    await entered; auth.currentUser = { uid: 'next-user' }; account.setRiskPushAccount('next-user'); release('old-token'); await rejected;
    assert.equal(globalThis.__RC_CALLABLE_PAYLOADS.length, 0); assert.equal(messages.some(m => m.type === 'RISK_PUSH_BIND'), false);
  });
  it('does not rewrite opt-in after a sign-out while the worker acknowledgement is pending', async () => {
    ack = []; const entered = new Promise(resolve => { onBinding = resolve; });
    const enabling = push.enableRiskPush('current-user', false); const rejected = assert.rejects(enabling, /account changed/);
    // An actual worker handshake signals this interleaving, not a timer/poll.
    await entered;
    account.setRiskPushAccount(null); ack.splice(0).forEach(respond => respond()); await rejected;
    assert.equal(push.riskPushOptedIn('current-user'), false);
  });
  it('disable clears local preference/binding before reporting an offline unregister failure', async () => {
    await push.enableRiskPush('current-user', false);
    globalThis.__RC_CALLABLE_ERRORS.unregisterMyAcademicRiskDevice = { code: 'functions/unavailable', message: 'fixture offline' };
    await assert.rejects(push.disableRiskPushOnThisDevice('current-user'), /fixture offline/);
    assert.equal(push.riskPushOptedIn('current-user'), false);
    assert.deepEqual(messages.at(-1), { type: 'RISK_PUSH_DISABLE', uid: null, ownerUid: 'current-user' });
  });
  it('deferred controller messages always contain the latest account, never a captured old uid', async () => {
    account.setRiskPushAccount('old-user'); account.setRiskPushAccount('next-user'); await ticks(); messages.length = 0;
    listeners.get('controllerchange')(); assert.deepEqual(messages, [{ type: 'RISK_PUSH_ACCOUNT', uid: 'next-user' }]);
  });
});
