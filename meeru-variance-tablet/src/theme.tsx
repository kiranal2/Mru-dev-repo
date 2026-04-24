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
    '--color-brand': '#1E40AF',
    '--color-brand-weak': '#DBEAFE',
    '--color-brand-tint': '#EFF6FF',
    '--color-positive': '#16A34A',
    '--color-positive-weak': '#DCFCE7',
    '--color-warning': '#D97706',
    '--color-warning-weak': '#FEF3C7',
    '--color-negative': '#DC2626',
    '--color-negative-weak': '#FEE2E2',
  },
  dark: {
    '--color-ink': '#F1F5F9',
    '--color-muted': '#CBD5E1',
    '--color-faint': '#64748B',
    '--color-rule': '#334155',
    '--color-surface': '#0F172A',
    '--color-surface-alt': '#1E293B',
    '--color-surface-soft': '#0B1220',
    '--color-brand': '#3B82F6',
    '--color-brand-weak': '#1E3A8A',
    '--color-brand-tint': '#172554',
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
  const [theme, setThemeState] = useState<Theme>('light');

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
