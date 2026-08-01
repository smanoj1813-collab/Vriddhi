import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type UserRole = 'superadmin' | 'admin' | 'faculty' | 'student' | 'parent' | 'hod' | 'mentor';

export interface User {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  name: string | null;
  photoURL: string | null;
  avatar?: string | null;
  role: UserRole;
  collegeId?: string;
  department?: string;
  phoneNumber?: string;
  mentor?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('vriddhi_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.log('Login attempt', email);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('vriddhi_user');
  }, []);

  const refreshUser = useCallback(() => {
    // TODO: Refresh user data from Firestore
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
