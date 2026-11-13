// Execute the real worker (not a reimplementation) in an isolated event/IDB
// boundary. No FCM token, browser permission, Firebase project or network.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/risk-push-sw.js', import.meta.url), 'utf8');
function browserWorker() {
  let state;
  let blocked = false;
  const notices = [], messages = [], navigation = [], listeners = new Map();
  const client = { url: 'https://portal.example/faculty/dashboard', postMessage: m => messages.push(m), navigate: async u => navigation.push(u), focus: async () => {} };
  const idb = { open() {
    const request = {};
    const db = { createObjectStore() {}, close() {}, transaction() {
      const tx = { objectStore: () => ({
        get() { const r = {}; queueMicrotask(() => { r.result = structuredClone(state); r.onsuccess?.(); queueMicrotask(() => tx.oncomplete?.()); }); return r; },
        put(value) { state = structuredClone(value); },
      }) };
      return tx;
    } };
    queueMicrotask(() => { if (blocked) { request.error = new Error('storage blocked'); request.onerror?.(); return; } request.result = db; request.onupgradeneeded?.(); request.onsuccess?.(); });
    return request;
  } };
  const self = {
    location: { origin: 'https://portal.example' },
    addEventListener: (type, handler) => listeners.set(type, handler),
    clients: { matchAll: async () => [client], openWindow: async url => navigation.push(url) },
    registration: {
      getNotifications: async () => notices.filter(n => !n.closed),
      showNotification: async (title, options) => { notices.push({ title, ...structuredClone(options), closed: false, close() { this.closed = true; } }); },
    },
  };
  vm.runInNewContext(source, { self, indexedDB: idb, URL, Promise }, { filename: 'risk-push-sw.js' });
  const dispatch = async (type, event) => { let promise; listeners.get(type)({ ...event, waitUntil: p => { promise = p; } }); await promise; };
  const message = async (type, uid, extra = {}) => { const ack = []; await dispatch('message', { data: { type, uid, ...extra }, ports: [{ postMessage: m => ack.push(m) }] }); return ack; };
  const enroll = async uid => { await message('RISK_PUSH_ACCOUNT', uid); return message('RISK_PUSH_BIND', uid); };
  const payload = (uid = 'faculty-uid', path = '/faculty/risk-alerts') => ({ kind: 'vriddhi-academic-risk', alertId: 'a'.repeat(64), recipientUid: uid, path, generation: '1' });
  const push = (data = payload()) => dispatch('push', { data: { json: () => ({ data }) } });
  return { notices, messages, navigation, message, enroll, push, payload, dispatch, block: () => { blocked = true; } };
}
describe('actual academic risk push worker', () => {
  it('does not show a notification on an unbound/shared browser', async () => { const w = browserWorker(); await w.push(); assert.equal(w.notices.length, 0); });
  it('requires an explicit enrollment in addition to an active account', async () => { const w = browserWorker(); await w.message('RISK_PUSH_ACCOUNT', 'faculty-uid'); await w.push(); assert.equal(w.notices.length, 0); });
  it('shows a generic notice and foreground inbox event for the opted-in current user', async () => {
    const w = browserWorker(); const ack = await w.enroll('faculty-uid'); assert.equal(ack[0].ok, true);
    await w.push(); assert.equal(w.notices.length, 1); assert.equal(w.messages.length, 1);
    assert.equal(w.messages[0].type, 'VRIDDHI_ACADEMIC_RISK_UPDATED'); assert.equal(w.notices[0].title, 'Vriddhi · Academic alert');
    assert.doesNotMatch(w.notices[0].body, /DBMS|absent|grade|\d%/); assert.equal(w.notices[0].renotify, false);
  });
  it('drops another account’s queued push without a message or notice', async () => { const w = browserWorker(); await w.enroll('faculty-uid'); await w.push(w.payload('student-uid')); assert.equal(w.notices.length, 0); assert.equal(w.messages.length, 0); });
  it('sign-out closes displayed notices and blocks queued delivery', async () => { const w = browserWorker(); await w.enroll('faculty-uid'); await w.push(); await w.message('RISK_PUSH_ACCOUNT', null); assert.equal(w.notices[0].closed, true); await w.push(); assert.equal(w.notices.length, 1); });
  it('account switching never transfers enrollment automatically', async () => { const w = browserWorker(); await w.enroll('faculty-uid'); await w.message('RISK_PUSH_ACCOUNT', 'student-uid'); await w.push(w.payload('student-uid', '/student/risk-alerts')); await w.push(); assert.equal(w.notices.length, 0); });
  it('explicit disable takes effect locally even without a server/network', async () => { const w = browserWorker(); await w.enroll('faculty-uid'); await w.message('RISK_PUSH_DISABLE', null); await w.push(); assert.equal(w.notices.length, 0); });
  it('rejects malformed ids, external links and unknown push kinds', async () => {
    const w = browserWorker(); await w.enroll('faculty-uid');
    for (const payload of [{ ...w.payload(), alertId: '../secret' }, { ...w.payload(), path: 'https://evil.example/' }, { ...w.payload(), path: '//evil.example/' }, { ...w.payload(), kind: 'other' }]) await w.push(payload);
    assert.equal(w.notices.length, 0);
  });
  it('fails closed when account storage cannot be read', async () => { const w = browserWorker(); await w.enroll('faculty-uid'); w.block(); await w.push(); assert.equal(w.notices.length, 0); });
  it('opens only the private same-origin inbox on notification click', async () => { const w = browserWorker(); await w.enroll('faculty-uid'); await w.push(); await w.dispatch('notificationclick', { notification: w.notices[0] }); assert.deepEqual(w.navigation, ['https://portal.example/faculty/risk-alerts']); });
  it('a stale notification click after logout cannot open another account’s route', async () => { const w = browserWorker(); await w.enroll('faculty-uid'); await w.push(); await w.message('RISK_PUSH_ACCOUNT', 'student-uid'); await w.dispatch('notificationclick', { notification: w.notices[0] }); assert.equal(w.navigation.length, 0); });
  it('a delayed enrollment cannot restore the account after logout', async () => {
    const w = browserWorker(); await w.enroll('faculty-uid'); await w.message('RISK_PUSH_ACCOUNT', null);
    const ack = await w.message('RISK_PUSH_BIND', 'faculty-uid'); assert.equal(ack[0].ok, false);
    await w.push(); assert.equal(w.notices.length, 0);
  });
  it('an old tab cannot transfer its enrollment over a newly active account', async () => {
    const w = browserWorker(); await w.enroll('student-uid');
    const ack = await w.message('RISK_PUSH_BIND', 'faculty-uid'); assert.equal(ack[0].ok, false);
    await w.push(); await w.push(w.payload('student-uid', '/student/risk-alerts'));
    assert.equal(w.notices.length, 1); assert.equal(w.notices[0].data.recipientUid, 'student-uid');
  });
  it('delayed old-account disable does not erase a new enrollment', async () => {
    const w = browserWorker(); await w.enroll('student-uid');
    await w.message('RISK_PUSH_DISABLE', null, { ownerUid: 'faculty-uid' });
    await w.push(w.payload('student-uid', '/student/risk-alerts')); assert.equal(w.notices.length, 1);
    await w.message('RISK_PUSH_DISABLE', null, { ownerUid: 'student-uid' });
    assert.equal(w.notices[0].closed, true);
  });
  it('uses a stable replacement tag for delivery retries rather than stacking notices', async () => { const w = browserWorker(); await w.enroll('faculty-uid'); await w.push(); await w.push(); assert.equal(w.notices[0].tag, w.notices[1].tag); });
});
