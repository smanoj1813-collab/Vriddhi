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
  mode: 'system',
  resolvedMode: 'dark',
  setMode: () => {},
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

// Light theme - clean, light colors
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f8fafc', // slate-50
      paper: '#ffffff',   // white
    },
    text: {
      primary: '#1e293b', // slate-800
      secondary: '#64748b', // slate-500
    },
    primary: {
      main: '#14b8a6', // teal-500
      light: '#5eead4', // teal-300
      dark: '#0d9488', // teal-600
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
      main: '#22c55e',
      light: '#86efac',
      dark: '#16a34a',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1e293b',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '0 8px',
          '&.Mui-selected': {
            backgroundColor: '#14b8a6',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#0d9488',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(20, 184, 166, 0.08)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 500,
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

// Dark theme - your existing palette
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0f172a', // slate-900
      paper: '#1e293b',   // slate-800
    },
    text: {
      primary: '#f8fafc', // slate-50
      secondary: '#94a3b8', // slate-400
    },
    primary: {
      main: '#14b8a6', // teal-500
      light: '#5eead4',
      dark: '#0d9488',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366f1',
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
      main: '#22c55e',
      light: '#86efac',
      dark: '#16a34a',
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e293b',
          borderRight: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f172a',
          boxShadow: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '0 8px',
          '&.Mui-selected': {
            backgroundColor: '#14b8a6',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#0d9488',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.05)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 500,
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
    return (saved as ThemeMode) || 'system';
  });

  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('dark');

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

  // Listen for system theme changes when in system mode
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
    const newMode = mode === 'dark' ? 'light' : 'dark';
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