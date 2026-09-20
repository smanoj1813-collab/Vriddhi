// Feeds the components a signed-in principal / faculty identity.
// The role is read per useAuth() call (not at module load) so a section can
// stage a different role via `globalThis.__RC_ROLE` and restore it after.
// The user object itself is cached per role: hooks across the app memoize on
// `user` identity (e.g. useMyStaffAttendance's selfHealOnce → load →
// useEffect), so a fresh object every render would set off an infinite
// render→effect→render loop that never existed with real auth.
const __users = new Map<string, any>();
function userForRole(role: string) {
  let user = __users.get(role);
  if (!user) {
    user = {
      uid: 'faculty-1',
      id: 'faculty-1',
      name: 'Bala Kumar',
      displayName: 'Bala Kumar',
      email: 'bala@example.edu',
      role,
      collegeId: 'college-a',
      department: 'Science',
    };
    __users.set(role, user);
  }
  return user;
}
export function useAuth() {
  const role = (globalThis as any).__RC_ROLE ?? 'principal';
  const __user = userForRole(role);
  return {
    user: __user,
    firebaseUser: null,
    isLoading: false,
    loading: false,
    isAuthenticated: true,
    login: async () => __user,
    logout: async () => {},
    hasRole: () => true,
    hasPermission: () => true,
  };
}
export default { useAuth };
