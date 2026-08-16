export interface College {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  status?: 'active' | 'inactive' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  name: string | null;
  role: string;
  collegeId?: string;
  department?: string;
  avatar?: string;
  phone?: string;
}

export interface AuthContextType {
  user: User | null;
  college: College | null;
  loading: boolean;
}
