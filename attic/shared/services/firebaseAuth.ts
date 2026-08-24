import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from '@/Firebase/config';

export type UserRole = 'superadmin' | 'admin' | 'faculty' | 'student' | 'parent' | 'hod' | 'mentor';

interface FirebaseUserData {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  collegeId?: string;
  department?: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

/** Privileged registration is server-only (callable provisionUser). */
export const registerUser = async (
  _email: string,
  _password: string,
  _name: string,
  _role: UserRole,
  _collegeId?: string
) => {
  throw new Error(
    'Account provisioning must be performed by an authorized administrator via the provisionUser Cloud Function.'
  );
};

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const getUserData = async (uid: string): Promise<FirebaseUserData | null> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data() as FirebaseUserData;
  }
  return null;
};

export const updateUserRole = async (_uid: string, _role: UserRole) => {
  throw new Error('Role changes must be performed server-side with Admin SDK custom claims.');
};
