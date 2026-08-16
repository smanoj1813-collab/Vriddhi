import React, { createContext, useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/Firebase/config';
import { getUserData, type FirebaseUserData, type UserRole } from './auth';

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
  login: (email: string, password: string) => Promise<void>;
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
    const data = await getUserData(fbUser.uid, fbUser.email || undefined);
    if (!data) {
      console.error('[AuthContext] No user data found for uid:', fbUser.uid);
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
    console.log('[AuthContext] Resolved user:', appUser.name, '| role:', appUser.role);
    return appUser;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (justLoggedIn.current) { justLoggedIn.current = false; return; }
      setFirebaseUser(fbUser);
      if (fbUser) {
        try { setUser(await resolveUserData(fbUser)); }
        catch (err: any) { console.error('Failed to resolve user data:', err); setUser(null); }
      } else { setUser(null); }
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

  const hasPermission = useCallback((_permission: string) => true, []);

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