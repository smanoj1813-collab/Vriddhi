// Stub for src/Firebase/data.ts.
//
// The app split its Firebase initialisation in two: ./config keeps the app
// handle + Auth (it is on the login screen's critical path), ./data owns
// Firestore, Storage, RTDB and the asia-south1 Functions handle (it is only
// needed once somebody is signed in). The harness already swaps ./config for
// ./firebaseConfig; without this twin, every module that imports from ./data
// would reach the real SDK and the mount would die on `auth/invalid-api-key`
// instead of on an assertion.
export const db = { __stub: true };
export const storage = {};
export const functions = {};
