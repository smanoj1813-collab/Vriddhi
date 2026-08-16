import React from 'react';
import { useRoutes } from 'react-router-dom';
import { appRoutes } from './routes';
import { AuthProvider } from './modules/auth/context/AuthContext';

function AppRoutes() {
  return useRoutes(appRoutes);
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;