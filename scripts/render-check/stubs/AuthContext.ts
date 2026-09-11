// Feeds the components a signed-in principal / faculty identity.
const role = (globalThis as any).__RC_ROLE ?? 'principal';
export const __user = {
  uid: 'faculty-1',
  id: 'faculty-1',
  name: 'Bala Kumar',
  displayName: 'Bala Kumar',
  email: 'bala@example.edu',
  role,
  collegeId: 'college-a',
  department: 'Science',
};
export function useAuth() {
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
