export const db = { __stub: true };
export const auth = { currentUser: { uid: 'render-manager', getIdTokenResult: async () => {
  const fixture = globalThis as any;
  const explicit = Object.prototype.hasOwnProperty.call(fixture, '__RC_AUTH_USER');
  const user = explicit ? fixture.__RC_AUTH_USER : { role: fixture.__RC_ROLE || 'principal', collegeId: 'college-a' };
  return { claims: { role: user?.role, collegeId: user?.collegeId } };
} } };
export const storage = {};
export const functions = {};
export default { __stub: true };
