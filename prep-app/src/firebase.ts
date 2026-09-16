// prep-app/src/firebase.ts
// Shared Firebase project (vriddhi-academic) configuration for Vriddhi Prep.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForVriddhiAcademicPrep',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'vriddhi-academic.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vriddhi-academic',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'vriddhi-academic.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:vriddhiprep',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
