import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../Firebase/config";

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

export const registerUser = async (email: string, password: string, name: string, role: UserRole, collegeId?: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  const userData: FirebaseUserData = {
    uid: user.uid,
    email: user.email!,
    name,
    role,
    collegeId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "users", user.uid), userData);
  return user;
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

export const updateUserRole = async (uid: string, role: UserRole) => {
  await updateDoc(doc(db, "users", uid), { role, updatedAt: new Date().toISOString() });
};
