import './Firebase/config'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { AuthProvider } from './modules/auth/context/AuthContext'
import { AppThemeProvider } from './shared/contexts/ThemeProvider'
import { LanguageProvider } from './shared/contexts/LanguageProvider'
import { NotificationProvider } from './shared/providers/NotificationProvider'
import { PwaPrompts } from './shared/pwa/PwaPrompts'
import IdleSessionTimeout from './modules/auth/components/IdleSessionTimeout'
import ErrorBoundary from './shared/components/ErrorBoundary'
import ConfigRequiredScreen from './components/ConfigRequiredScreen'
import { firebaseConfigStatus } from './Firebase/config'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {firebaseConfigStatus.configured || !import.meta.env.PROD ? (
        <BrowserRouter>                          {/* ← ONLY Router in entire app */}
          <QueryClientProvider client={queryClient}>
            <AuthProvider>                       {/* ← ONLY AuthProvider in entire app */}
              <AppThemeProvider>
                <LanguageProvider>
                  <NotificationProvider>
                    <App />
                    <PwaPrompts />
                    <IdleSessionTimeout />
                  </NotificationProvider>
                </LanguageProvider>
              </AppThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      ) : (
        // Firebase web config was not embedded at build time — show an explicit,
        // actionable screen instead of a cryptically broken app.
        <ConfigRequiredScreen status={firebaseConfigStatus} />
      )}
    </ErrorBoundary>
  </React.StrictMode>,
)