"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export type AppTheme = "default" | "uberflux" | "formfactor"

export interface ThemeConfig {
  id: AppTheme
  label: string
  accent: string // hex color for preview swatch
}

export const THEMES: ThemeConfig[] = [
  { id: "default", label: "Default", accent: "#1E40AF" },
  { id: "uberflux", label: "FluxPlus", accent: "#FEA400" },
  { id: "formfactor", label: "Form Factor", accent: "#00D4AA" },
]

interface ThemeContextValue {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  themeConfig: ThemeConfig
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "default",
  setTheme: () => {},
  themeConfig: THEMES[0],
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("default")
  const [mounted, setMounted] = useState(false)

  // Load persisted theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("meeru-app-theme") as AppTheme | null
      if (saved && THEMES.some((t) => t.id === saved)) {
        setThemeState(saved)
        document.documentElement.setAttribute("data-theme", saved)
      }
    } catch {
      // no-op
    }
    setMounted(true)
  }, [])

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
    try {
      localStorage.setItem("meeru-app-theme", newTheme)
    } catch {
      // no-op
    }
  }, [])

  const themeConfig = THEMES.find((t) => t.id === theme) || THEMES[0]

  // Set initial data-theme attribute on mount
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme)
    }
  }, [mounted, theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeConfig }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
