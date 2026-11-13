/* Imported by the EXISTING Workbox /sw.js, not a competing root worker.
 * FCM is deliberately data-only: check the active account before displaying.
 * No external scripts, Firebase credentials, academic content or tokens here. */
(() => {
  const DB = 'vriddhi-risk-push-account';
  const STORE = 'binding';
  const TAG = 'vriddhi-risk-';
  // Serialize binding changes and displays so a sign-out cannot race a
  // previously-read binding and leave an old notice visible afterward.
  let operations = Promise.resolve();
  const enqueue = operation => { const next = operations.then(operation); operations = next.catch(() => {}); return next; };
  const open = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const read = async () => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get('current');
      req.onsuccess = () => resolve(req.result || {});
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  };
  const update = async message => {
    const db = await open();
    let staleEnrollment = false;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite'), store = tx.objectStore(STORE);
      const get = store.get('current');
      get.onsuccess = () => {
        const previous = get.result || {};
        const uid = typeof message.uid === 'string' ? message.uid : null;
        let next;
        if (message.type === 'RISK_PUSH_BIND') {
          // Enrollment is not an authentication event. A delayed opt-in from
          // an old tab/session cannot restore an account cleared by sign-out.
          if (!uid || previous.activeUid !== uid) { staleEnrollment = true; return; }
          next = { activeUid: uid, enrolledUid: uid };
        } else if (message.type === 'RISK_PUSH_DISABLE') {
          // Old-account logout cleanup may finish after a new opt-in. It must
          // not disable the new account's enrollment on this browser.
          if (typeof message.ownerUid === 'string' && previous.enrolledUid !== message.ownerUid) return;
          next = { activeUid: previous.activeUid || null, enrolledUid: null };
        } else next = { activeUid: uid, enrolledUid: previous.enrolledUid === uid ? uid : null };
        store.put(next, 'current');
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    });
    if (staleEnrollment) throw new Error('Notification enrollment no longer matches the active account');
    // Notifications from a previous login must not remain on a shared device.
    const state = await read();
    for (const notice of await self.registration.getNotifications()) {
      if (notice.tag.startsWith(TAG) && (notice.data?.recipientUid !== state.activeUid || state.enrolledUid !== state.activeUid)) notice.close();
    }
  };
  self.addEventListener('message', event => {
    if (!['RISK_PUSH_ACCOUNT', 'RISK_PUSH_BIND', 'RISK_PUSH_DISABLE'].includes(event.data?.type)) return;
    event.waitUntil(enqueue(() => update(event.data)).then(() => event.ports[0]?.postMessage({ ok: true })).catch(() => event.ports[0]?.postMessage({ ok: false })));
  });
  const allowedPath = path => ['/student/risk-alerts', '/faculty/risk-alerts', '/admin/risk-alerts'].includes(path);
  self.addEventListener('push', event => {
    let message;
    try { message = event.data?.json()?.data; } catch { return; }
    if (message?.kind !== 'vriddhi-academic-risk') return;
    event.waitUntil(enqueue(async () => {
      const state = await read();
      if (!state.activeUid || state.activeUid !== state.enrolledUid || state.activeUid !== message.recipientUid
        || !/^[a-f0-9]{64}$/.test(message.alertId || '') || !allowedPath(message.path)) return;
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) client.postMessage({ type: 'VRIDDHI_ACADEMIC_RISK_UPDATED', recipientUid: message.recipientUid });
      // Generic on purpose: institutional details are visible only after the
      // server has rechecked the signed-in recipient and department scope.
      await self.registration.showNotification('Vriddhi · Academic alert', {
        body: 'A new item needs your attention. Open your private Risk Alerts inbox.',
        icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
        tag: `${TAG}${message.alertId}`, renotify: false,
        data: { recipientUid: message.recipientUid, path: message.path, alertId: message.alertId },
      });
    }).catch(() => { /* Fail closed if account storage cannot be read. */ }));
  });
  self.addEventListener('notificationclick', event => {
    if (!event.notification.tag.startsWith(TAG)) return;
    event.notification.close();
    event.waitUntil(enqueue(async () => {
      const state = await read(), data = event.notification.data || {};
      if (!state.activeUid || state.activeUid !== state.enrolledUid || state.activeUid !== data.recipientUid || !allowedPath(data.path)) return;
      const destination = new URL(data.path, self.location.origin).href;
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const client = windows.find(w => new URL(w.url).origin === self.location.origin);
      if (client) { await client.navigate(destination); await client.focus(); }
      else await self.clients.openWindow(destination);
    }).catch(() => {}));
  });
})();
