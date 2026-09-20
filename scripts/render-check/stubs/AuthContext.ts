// Feeds the components a signed-in principal / faculty identity.
// The role is read per useAuth() call (not at module load) so a section can
// stage a different role via `globalThis.__RC_ROLE` and restore it after.
export function useAuth() {
  const role = (globalThis as any).__RC_ROLE ?? 'principal';
  const __user = {
    uid: 'faculty-1',
    id: 'faculty-1',
    name: 'Bala Kumar',
    displayName: 'Bala Kumar',
    email: 'bala@example.edu',
    role,
    collegeId: 'college-a',
    department: 'Science',
  };
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
