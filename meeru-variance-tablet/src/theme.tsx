import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { vars } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

// Palette mirrors the web prototype (meeru-variance-app/src/index.css).
// Values are raw hex strings that get applied to the root View via NativeWind's
// `vars()` helper, which exposes them as real CSS custom properties that every
// `bg-surface` / `text-ink` class picks up automatically.
const PALETTES: Record<Theme, Record<string, string>> = {
  light: {
    '--color-ink': '#0F172A',
    '--color-muted': '#475569',
    '--color-faint': '#94A3B8',
    '--color-rule': '#E2E8F0',
    '--color-surface': '#FFFFFF',
    '--color-surface-alt': '#F8FAFC',
    '--color-surface-soft': '#F1F5F9',
    '--color-brand': '#F16922',
    '--color-brand-weak': '#FED5BC',
    '--color-brand-tint': '#FFF1E7',
    '--color-positive': '#16A34A',
    '--color-positive-weak': '#DCFCE7',
    '--color-warning': '#D97706',
    '--color-warning-weak': '#FEF3C7',
    '--color-negative': '#DC2626',
    '--color-negative-weak': '#FEE2E2',
  },
  // Pure-black dark theme matching the web prototype — cards layer via
  // subtle steps surface (#0A0A0A) → surface-alt (#141414) → surface-soft
  // (#1F1F1F). Borders (rule) are neutral-800 so edges read without
  // dominating. Brand is the same coral #FF9B6C (lighter coral for contrast
  // on near-black).
  dark: {
    '--color-ink': '#F5F5F5',
    '--color-muted': '#A3A3A3',
    '--color-faint': '#737373',
    '--color-rule': '#262626',
    '--color-surface': '#0A0A0A',
    '--color-surface-alt': '#141414',
    '--color-surface-soft': '#1F1F1F',
    '--color-brand': '#FF9B6C',
    '--color-brand-weak': '#7A2E10',
    '--color-brand-tint': '#3A1607',
    '--color-positive': '#22C55E',
    '--color-positive-weak': '#14532D',
    '--color-warning': '#F59E0B',
    '--color-warning-weak': '#78350F',
    '--color-negative': '#F87171',
    '--color-negative-weak': '#7F1D1D',
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
