import React, { createContext, useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/Firebase/config';
import { resolveIdentity, type FirebaseUserData, type UserRole } from './auth';
import { roleHasPermission } from '../permissions';
import { syncMyIdentity } from '@/shared/services/identityBackend';

export { UserRole };
export type { FirebaseUserData };

export interface AppUser {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  name: string | null;
  role: UserRole;
  collegeId?: string;
  department?: string;
  avatar?: string;
  phone?: string;
}

export type User = AppUser;

export interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const justLoggedIn = useRef(false);

  const resolveUserData = useCallback(async (fbUser: FirebaseUser): Promise<AppUser> => {
    const resolution = await resolveIdentity(fbUser.uid, fbUser.email || undefined);
    let data = resolution.user;

    // Self-heal once: the Firestore rules take the authoritative role from the
    // ID-token claim, while a profile document may exist without one (accounts
    // created before the claims work, or through the Identity Toolkit REST API
    // which cannot set claims). Those accounts sign in successfully and then see
    // "permission denied" everywhere. `syncMyIdentity` re-issues the claim from
    // users/{uid} — a document whose role/college fields are not self-writable —
    // and the token is refreshed so the very next read is authorised.
    if (data && resolution.claimMissing) {
      try {
        const sync = await syncMyIdentity();
        if (sync?.updated) {
          await fbUser.getIdToken(true);
          const afterRepair = await resolveIdentity(fbUser.uid, fbUser.email || undefined);
          if (afterRepair.user) data = afterRepair.user;
        }
      } catch (err) {
        console.warn('[AuthContext] claim self-heal failed:', err);
      }
    }

    if (!data) {
      // Distinguish the three real causes — they need different fixes, and the
      // old blanket ACCOUNT_NOT_FOUND sent everyone down the wrong path.
      if (resolution.permissionDenied) {
        console.error('[AuthContext] identity reads denied by Firestore rules', resolution.errors);
        throw new Error(
          'AUTHORIZATION_STALE: your profile exists but security rules refused to read it. ' +
          'This normally means your sign-in token has no role claim, or the deployed Firestore rules ' +
          'are not the version in this repository. Sign out and sign in again; if it persists, a ' +
          'superadmin must run Access Control → Identity repair and redeploy the rules.'
        );
      }
      console.error('[AuthContext] No user data found for uid:', fbUser.uid, resolution.errors);
      throw new Error('ACCOUNT_NOT_FOUND');
    }
    const name = data.name || fbUser.displayName;
    const email = data.email || fbUser.email;
    const role = data.role;
    const appUser: AppUser = {
      uid: fbUser.uid, id: fbUser.uid, email,
      displayName: name, name, role,
      collegeId: data.collegeId, department: data.department,
      avatar: data.avatar, phone: data.phone,
    };
    // Persist collegeId to localStorage for APIs that read it directly.
    // This is a *path selector only* — never an authorization boundary — and
    // must not leak across accounts: set it when present, remove it when not.
    if (appUser.collegeId) {
      localStorage.setItem('vriddhi_college_id', appUser.collegeId);
    } else {
      localStorage.removeItem('vriddhi_college_id');
    }
    console.log('[AuthContext] Resolved user:', appUser.name, '| role:', appUser.role, '| source:', resolution.source);
    return appUser;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (justLoggedIn.current) { justLoggedIn.current = false; return; }
      setFirebaseUser(fbUser);
      if (fbUser) {
        try { setUser(await resolveUserData(fbUser)); }
        catch (err: any) { console.error('Failed to resolve user data:', err); setUser(null); }
      } else {
        setUser(null);
        // Defense-in-depth: any sign-out path (explicit logout, token expiry,
        // account deletion) must not leave the previous user's college id.
        localStorage.removeItem('vriddhi_college_id');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [resolveUserData]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    console.log('[AuthContext] login() started');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log('[AuthContext] Firebase auth success, uid:', cred.user.uid);
      const appUser = await resolveUserData(cred.user);
      console.log('[AuthContext] resolveUserData success, role:', appUser.role);
      justLoggedIn.current = true;
      setUser(appUser);
      setFirebaseUser(cred.user);
      console.log('[AuthContext] User state set');
      return appUser;
    } catch (err) {
      console.error('[AuthContext] login() error:', err);
      justLoggedIn.current = false; 
      throw err; 
    }
    finally { 
      setIsLoading(false);
      console.log('[AuthContext] login() finished');
    }
  }, [resolveUserData]);

  const logout = useCallback(async () => {
    // Clear the collegeId path selector so a later session on a shared browser
    // cannot observe (or act on) the previous user's college.
    localStorage.removeItem('vriddhi_college_id');
    await signOut(auth); setUser(null); setFirebaseUser(null);
  }, []);

  // FIX: Roles must be explicit. Do NOT conflate principal/hod with faculty.
  // A principal is a principal. A faculty is a faculty.
  const hasRole = useCallback((roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    // Explicit role checks only — no inheritance
    const allowed = roles.includes(user.role);
    if (!allowed) console.warn('[AuthContext] hasRole REJECTED — user role:', user.role, 'allowed:', roles);
    return allowed;
  }, [user]);

  // FIX: Permissions must be deny-by-default. `hasPermission` previously
  // returned `true` for every input, which would have silently authorised any
  // future caller. It now resolves against the role matrix (superadmin bypass,
  // unknown permissions denied). This is a UX hint only — Firestore rules and
  // Cloud Functions remain the trusted enforcement boundary.
  const hasPermission = useCallback(
    (permission: string) => roleHasPermission(user?.role, permission),
    [user?.role]
  );

  const value = useMemo<AuthContextType>(() => ({
    user, firebaseUser, isLoading, loading: isLoading, isAuthenticated: !!user,
    login, logout, hasRole, hasPermission,
  }), [user, firebaseUser, isLoading, login, logout, hasRole, hasPermission]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;