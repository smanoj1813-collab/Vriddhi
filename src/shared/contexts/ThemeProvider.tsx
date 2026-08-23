import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  resolvedMode: 'light',
  setMode: () => {},
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

// Light theme - clean, crisp, modern academic palette
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f8fafc', // slate-50
      paper: '#ffffff',   // clean white
    },
    text: {
      primary: '#0f172a', // slate-900
      secondary: '#475569', // slate-600
    },
    primary: {
      main: '#0d9488', // teal-600
      light: '#14b8a6', // teal-500
      dark: '#0f766e', // teal-700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366f1', // indigo-500
      light: '#818cf8',
      dark: '#4f46e5',
    },
    error: {
      main: '#ef4444',
      light: '#fca5a5',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fcd34d',
      dark: '#d97706',
    },
    success: {
      main: '#10b981',
      light: '#6ee7b7',
      dark: '#047857',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          padding: '8px 12px',
          '&.Mui-selected': {
            backgroundColor: '#0d9488',
            color: '#ffffff',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#0f766e',
            },
            '& .MuiListItemIcon-root': {
              color: '#ffffff',
            },
          },
          '&:hover': {
            backgroundColor: '#f1f5f9',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Dark theme - elegant dark slate palette
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0b0f19',
      paper: '#131b2e',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    primary: {
      main: '#14b8a6',
      light: '#2dd4bf',
      dark: '#0d9488',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#818cf8',
      light: '#a5b4fc',
      dark: '#6366f1',
    },
    error: {
      main: '#f87171',
      light: '#fca5a5',
      dark: '#ef4444',
    },
    warning: {
      main: '#fbbf24',
      light: '#fde68a',
      dark: '#f59e0b',
    },
    success: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981',
    },
    divider: '#1e293b',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#131b2e',
          borderRight: '1px solid #1e293b',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#131b2e',
          color: '#f8fafc',
          boxShadow: 'none',
          borderBottom: '1px solid #1e293b',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          padding: '8px 12px',
          '&.Mui-selected': {
            backgroundColor: '#14b8a6',
            color: '#ffffff',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#0d9488',
            },
            '& .MuiListItemIcon-root': {
              color: '#ffffff',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #1e293b',
          backgroundColor: '#131b2e',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('vriddhi-theme-mode');
    // Default to light mode for crisp academic branding
    return (saved as ThemeMode) || 'light';
  });

  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const resolveMode = (): 'light' | 'dark' => {
      if (mode === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return mode;
    };

    const resolved = resolveMode();
    setResolvedMode(resolved);

    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setResolvedMode(resolved);
      const root = document.documentElement;
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('vriddhi-theme-mode', newMode);
  };

  const toggleMode = () => {
    const newMode = resolvedMode === 'dark' ? 'light' : 'dark';
    handleSetMode(newMode);
  };

  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, setMode: handleSetMode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
