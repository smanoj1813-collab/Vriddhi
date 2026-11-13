import { postRiskPushBinding, isCurrentRiskPushAccount } from '../pwa/riskPushAccount';

const key = (uid: string) => `vriddhi.riskPushOptIn.${uid}`;
const tokenCache = new Map<string, string>();
export function riskPushOptedIn(uid: string): boolean {
  try { return localStorage.getItem(key(uid)) === 'yes'; } catch { return false; }
}
export function riskPushUnavailableReason(): string | null {
  if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) return 'Push has not been configured for this build. Your portal inbox still works.';
  if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'Push is not supported in this browser. On iPhone or iPad, install the app to your Home Screen first. Your portal inbox still works.';
  if (Notification.permission === 'denied') return 'Notifications are blocked in this browser. Change the site permission to opt in; your portal inbox still works.';
  return null;
}
async function workerRegistration(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration?.active) throw new Error('Install or update the app service worker, then reload to enable push. Push is unavailable in the development preview.');
  return registration;
}
export async function enableRiskPush(uid: string, requestPermission: boolean): Promise<void> {
  const unavailable = riskPushUnavailableReason();
  if (unavailable) throw new Error(unavailable);
  // Must be called directly from an explicit click. Never prompt on login or
  // while restoring an already opted-in browser session.
  const permission = requestPermission ? await Notification.requestPermission() : Notification.permission;
  if (permission !== 'granted') throw new Error('Notification permission was not granted. Your portal inbox remains available.');
  const [{ default: app, auth }, messaging, api, registration] = await Promise.all([
    import('@/Firebase/config'), import('firebase/messaging'), import('./riskAlertsApi'), workerRegistration(),
  ]);
  if (auth.currentUser?.uid !== uid) throw new Error('Your account changed. Open alerts in the current account and try again.');
  if (!await messaging.isSupported()) throw new Error('This browser cannot receive web push. Use your portal inbox or an installed supported browser.');
  const token = await messaging.getToken(messaging.getMessaging(app), { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('The browser did not return a push registration. Please retry.');
  if (auth.currentUser?.uid !== uid) throw new Error('Your account changed before registration completed.');
  await api.registerAcademicRiskDevice(token);
  if (auth.currentUser?.uid !== uid) throw new Error('Your account changed before registration completed.');
  if (!isCurrentRiskPushAccount(uid)) throw new Error('Your sign-in session changed. Reopen alerts before enabling push.');
  await postRiskPushBinding(registration, uid);
  if (auth.currentUser?.uid !== uid || !isCurrentRiskPushAccount(uid)) throw new Error('Your account changed before notification enrollment finished.');
  tokenCache.set(uid, token);
  try { localStorage.setItem(key(uid), 'yes'); } catch { /* optional preference */ }
}
export async function disableRiskPushOnThisDevice(uid: string): Promise<void> {
  const wasOptedIn = riskPushOptedIn(uid);
  try { localStorage.removeItem(key(uid)); } catch { /* optional preference */ }
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  // Local privacy boundary is cleared FIRST, even if the network is offline.
  if (registration?.active) await postRiskPushBinding(registration, null, uid);
  if (!wasOptedIn && !tokenCache.has(uid)) return;
  const [{ default: app, auth }, messaging, api] = await Promise.all([import('@/Firebase/config'), import('firebase/messaging'), import('./riskAlertsApi')]);
  if (auth.currentUser?.uid !== uid || !await messaging.isSupported()) return;
  const token = tokenCache.get(uid) || (Notification.permission === 'granted' && registration ? await messaging.getToken(messaging.getMessaging(app), { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration }) : '');
  if (token && auth.currentUser?.uid === uid) await api.unregisterAcademicRiskDevice(token);
  if (auth.currentUser?.uid === uid) await messaging.deleteToken(messaging.getMessaging(app));
  tokenCache.delete(uid);
}
