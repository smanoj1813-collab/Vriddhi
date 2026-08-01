// src/types/auth.ts
// Add these to your existing auth types, or create this file

export interface College {
  id: string;
  name: string;
  // add other fields as needed
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  // add other fields as needed
}

export interface AuthContextType {
  user: User | null;
  college: College | null;
  loading: boolean;
  // add login/logout methods as needed
}