// No network, project or real account. Only loaded by the sign-in runner.
export async function sendPasswordResetEmail(_auth: unknown, email: string) {
  const fixture = (globalThis as any).__RC_LOGIN;
  fixture.resets.push(email);
  if (fixture.resetError) throw fixture.resetError;
}
