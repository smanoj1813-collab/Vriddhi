import React from 'react';
import { useRoutes } from 'react-router-dom';
import { appRoutes } from './routes';

// NOTE: AuthProvider is mounted ONCE, in src/main.tsx. It must NOT be
// re-applied here — a nested provider creates a second, independent auth
// state with its own onAuthStateChanged listener, duplicating Firestore
// identity resolution on every login/refresh and risking divergent state
// between the two providers.
function AppRoutes() {
  return useRoutes(appRoutes);
}

export default function App() {
  return <AppRoutes />;
}
