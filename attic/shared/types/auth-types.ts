// src/types/auth.ts or add to your existing AuthContext.tsx

export interface College {
  id: string;
  name: string;
  // add other college fields as needed
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  // add other user fields as needed
}

export interface AuthContextType {
  user: User | null;
  college: College | null;
  loading: boolean;
  // add other auth methods as needed
}