// Only used by risk-push-client.test.mjs. The shipped client module, account
// binding and callable wrapper execute unchanged; Firebase Messaging I/O is the
// boundary held/released to exercise real sign-out/enrollment interleavings.
const fixture = () => (globalThis as any).__RC_RISK_MESSAGING;
export const isSupported = async () => fixture()?.supported !== false;
export const getMessaging = (_app: unknown) => ({ __stub: 'risk-messaging' });
export const getToken = async (...args: unknown[]) => fixture().getToken(...args);
export const deleteToken = async () => { fixture().deleted++; return true; };
