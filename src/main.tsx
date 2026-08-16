import './Firebase/config'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { AuthProvider } from './modules/auth/context/AuthContext'
import { AppThemeProvider } from './shared/contexts/ThemeProvider'
import { NotificationProvider } from './shared/providers/NotificationProvider'
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
    <BrowserRouter>                          {/* ← ONLY Router in entire app */}
      <QueryClientProvider client={queryClient}>
        <AuthProvider>                       {/* ← ONLY AuthProvider in entire app */}
          <AppThemeProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AppThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)