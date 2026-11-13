// Safe on the login critical path: no Firebase/data SDK or permission prompt.
// Account bindings are also enforced in the service worker, including when no
// portal tab is open. The worker never shows academic details on a lock screen.
let activeUid: string | null = null;
let bindingStarted = false;

export function setRiskPushAccount(uid: string | null): void {
  activeUid = uid;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const send = (worker?: ServiceWorker | null) => worker?.postMessage({ type: 'RISK_PUSH_ACCOUNT', uid: activeUid });
  send(navigator.serviceWorker.controller);
  void navigator.serviceWorker.getRegistration('/').then(reg => send(reg?.active)).catch(() => {});
  if (!bindingStarted) {
    bindingStarted = true;
    void navigator.serviceWorker.ready.then(reg => send(reg.active)).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => send(navigator.serviceWorker.controller));
  }
}
export function isCurrentRiskPushAccount(uid: string): boolean { return activeUid === uid; }
export async function postRiskPushBinding(registration: ServiceWorkerRegistration, uid: string | null, disablingUid?: string): Promise<void> {
  const worker = registration.active;
  if (!worker) throw new Error('The app update is still installing. Reload and try again.');
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('The notification worker did not respond. Update the app and retry.')); }, 5000);
    channel.port1.onmessage = event => {
      clearTimeout(timer); channel.port1.close();
      if (event.data?.ok === true) resolve();
      else reject(new Error('The browser could not save the notification account binding.'));
    };
    worker.postMessage({ type: uid ? 'RISK_PUSH_BIND' : 'RISK_PUSH_DISABLE', uid, ...(disablingUid ? { ownerUid: disablingUid } : {}) }, [channel.port2]);
  });
}
