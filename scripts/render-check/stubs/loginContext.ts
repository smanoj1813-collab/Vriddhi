// Sign-in form tests only. Auth/provider and recovery I/O are replaced at the
// boundary; the shipped form handlers, role decisions and translations run.
export function useAuth() {
  const fixture = (globalThis as any).__RC_LOGIN;
  return {
    user: fixture.user,
    isAuthenticated: !!fixture.user,
    isLoading: !!fixture.loading,
    login: async (email: string, password: string) => {
      fixture.attempts.push({ email, password });
      if (fixture.pending) await fixture.pending;
      if (fixture.error) throw fixture.error;
      return fixture.result;
    },
    logout: async () => { fixture.signouts += 1; },
  };
}
