// src/Firebase/data.ts
//
// The data services live here, not in ./config, purely so that the entry bundle
// can boot without them.
//
// `main.tsx` imports ./config on its very first line, and Vite turns everything
// reachable from the entry into a `modulepreload`: the login screen was pulling
// Firestore, Storage, the Realtime Database and Cloud Functions (~213 kB gzip of
// `firebase`, of which Auth alone is needed to decide whether someone is signed
// in). A college student on 4G in a tier-2 town paid for all four before the app
// could ask for a password.
//
// Splitting the modules is not enough on its own — `db` is a module-scope value
// passed straight into `doc()`, `collection()` and friends, so every consumer
// must keep importing it statically. Keeping those consumers out of the entry
// graph is what moves the bytes: nothing reachable from main.tsx/App.tsx imports
// this file, and vite.config.ts splits it into its own `firebase-data` chunk.
//
// If a future entry-reachable module needs Firestore, import it dynamically
// (`await import('@/Firebase/data')`) rather than statically, or the preload
// comes straight back.

import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import app from './config';

export const db = getFirestore(app);

export const storage = getStorage(app);

// All callable functions in this repository are deployed in asia-south1.
// Using the SDK default (us-central1) makes valid callables look unavailable.
export const functions = getFunctions(app, 'asia-south1');
