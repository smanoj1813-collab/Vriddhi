// src/Firebase/config.ts
//
// ONLY the app handle, Auth, and the build-time config check live here.
//
// This module is imported by the entry point (main.tsx line 1), so everything in
// it is preloaded before the login screen paints. Firestore, Storage and Cloud
// Functions were initialised here too, which put ~213 kB gzip of `firebase` on
// the critical path; they now live in ./data, which no entry-reachable module
// imports. Keep it that way — see the note at the top of ./data.ts.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;

// ── Build-time configuration check ─────────────────────────────────────
// Vite inlines these at build time. If they are absent from the build
// environment the app would boot and then fail cryptically on the first
// Auth/Firestore call. Exposing the status lets main.tsx show a clear
// "Firebase not configured" screen instead. Correctly configured builds
// report `configured: true` and the app renders normally.
const REQUIRED_FIREBASE_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export interface FirebaseConfigStatus {
  configured: boolean;
  missing: string[];
}

export const firebaseConfigStatus: FirebaseConfigStatus = (() => {
  const missing = REQUIRED_FIREBASE_ENV.filter(
    (k) => !import.meta.env[k as keyof ImportMetaEnv],
  );
  return { configured: missing.length === 0, missing };
})();