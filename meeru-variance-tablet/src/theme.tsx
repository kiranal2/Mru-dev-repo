import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { vars } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

// Palette: brand is orange (#FE9519) — same in light + dark. Warning is gold
// to pull away from brand's hue band. --color-info is reserved for links +
// tooltip accents so "click this" doesn't always read as brand.
const PALETTES: Record<Theme, Record<string, string>> = {
  light: {
    '--color-ink': '#0F172A',
    '--color-muted': '#475569',
    '--color-faint': '#94A3B8',
    '--color-rule': '#E2E8F0',
    '--color-surface': '#FFFFFF',
    '--color-surface-alt': '#F8FAFC',
    '--color-surface-soft': '#F1F5F9',
    '--color-brand': '#FE9519',
    '--color-brand-weak': '#FED5A8',
    '--color-brand-tint': '#FFF1E0',
    '--color-positive': '#16A34A',
    '--color-positive-weak': '#DCFCE7',
    '--color-warning': '#CA8A04',
    '--color-warning-weak': '#FEF3C7',
    '--color-negative': '#DC2626',
    '--color-negative-weak': '#FEE2E2',
    '--color-info': '#2563EB',
  },
  // Pure-black dark theme matching the web prototype — cards layer via
  // subtle steps surface (#0A0A0A) → surface-alt (#141414) → surface-soft
  // (#1F1F1F). Borders (rule) are neutral-800 so edges read without
  // dominating. Brand stays #FE9519 — bright orange reads cleanly on near-black.
  dark: {
    '--color-ink': '#F5F5F5',
    '--color-muted': '#A3A3A3',
    '--color-faint': '#737373',
    '--color-rule': '#262626',
    '--color-surface': '#0A0A0A',
    '--color-surface-alt': '#141414',
    '--color-surface-soft': '#1F1F1F',
    '--color-brand': '#FE9519',
    '--color-brand-weak': '#5C3A0A',
    '--color-brand-tint': '#2E1D05',
    '--color-positive': '#22C55E',
    '--color-positive-weak': '#14532D',
    '--color-warning': '#EAB308',
    '--color-warning-weak': '#713F12',
    '--color-negative': '#EF4444',
    '--color-negative-weak': '#7F1D1D',
    '--color-info': '#60A5FA',
  },
};

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}
const ThemeContext = createContext<ThemeCtx | null>(null);
export const useTheme = () => {
  const c = useContext(ThemeContext);
  if (!c) throw new Error('useTheme must be inside ThemeProvider');
  return c;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Dark is the default — matches the web prototype's near-black canvas.
  // AsyncStorage override below lets the user flip to light + persist it.
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    AsyncStorage.getItem('meeru.theme').then((raw) => {
      if (raw === 'light' || raw === 'dark') setThemeState(raw);
    });
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    AsyncStorage.setItem('meeru.theme', t).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem('meeru.theme', next).catch(() => {});
      return next;
    });
  }, []);

  const ctx = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);

  return (
    <ThemeContext.Provider value={ctx}>
      <View style={[{ flex: 1 }, vars(PALETTES[theme])]}>{children}</View>
    </ThemeContext.Provider>
  );
}
