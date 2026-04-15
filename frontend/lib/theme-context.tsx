"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export type AppTheme = "light" | "dark"

export interface ThemeConfig {
  id: AppTheme
  label: string
  accent: string
}

export const THEMES: ThemeConfig[] = [
  { id: "light", label: "Light", accent: "#1E40AF" },
  { id: "dark", label: "Dark", accent: "#3B82F6" },
]

interface ThemeContextValue {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  toggleTheme: () => void
  themeConfig: ThemeConfig
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  themeConfig: THEMES[0],
  isDark: false,
})

const STORAGE_KEY = "meeru-app-theme"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppTheme | null
      if (saved && (saved === "light" || saved === "dark")) {
        setThemeState(saved)
        document.documentElement.setAttribute("data-theme", saved)
      }
      // Migrate old theme values
      if (saved === "default") {
        setThemeState("light")
        document.documentElement.setAttribute("data-theme", "light")
        localStorage.setItem(STORAGE_KEY, "light")
      } else if (saved === "uberflux" || saved === "formfactor") {
        setThemeState("dark")
        document.documentElement.setAttribute("data-theme", "dark")
        localStorage.setItem(STORAGE_KEY, "dark")
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
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // no-op
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
  }, [theme, setTheme])

  const themeConfig = THEMES.find((t) => t.id === theme) || THEMES[0]
  const isDark = theme === "dark"

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme)
    }
  }, [mounted, theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themeConfig, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
