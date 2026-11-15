// Only the password-settings runner uses this Auth I/O boundary. It never
// authenticates, rotates a real credential, sends mail, or contacts Firebase.
const fixture = () => (globalThis as any).__RC_PASSWORD_AUTH
export const EmailAuthProvider = {
  credential: (email: string, password: string) => ({ providerId: 'password', email, password }),
}
export async function reauthenticateWithCredential(_user: unknown, credential: unknown) {
  fixture().calls.push({ name: 'reauthenticate', credential })
  if (fixture().reauthError) throw fixture().reauthError
}
export async function updatePassword(_user: unknown, password: string) {
  fixture().calls.push({ name: 'updatePassword', password })
  if (fixture().updateError) throw fixture().updateError
}
export async function updateProfile(_user: unknown, value: unknown) {
  fixture().calls.push({ name: 'updateProfile', value })
}
