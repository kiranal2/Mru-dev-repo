"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Palette, Check } from "lucide-react"
import { useTheme, THEMES } from "@/lib/theme-context"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, right: 0 })

  const updatePos = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    updatePos()
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, updatePos])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen((prev) => !prev)
  }

  const dropdown = open ? createPortal(
    <div
      ref={menuRef}
      className="fixed w-56 rounded-xl py-2 shadow-elevation-3 animate-scale-in"
      style={{
        top: pos.top,
        right: pos.right,
        zIndex: 9999,
        background: "var(--theme-user-menu-bg)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--theme-border)",
      }}
    >
      <div
        className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--theme-text-muted)", borderBottom: "1px solid var(--theme-border)" }}
      >
        Application Theme
      </div>
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={(e) => {
            e.stopPropagation()
            setTheme(t.id)
            setOpen(false)
          }}
          className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-all duration-150"
          style={{
            color: theme === t.id ? "var(--theme-accent-text)" : "var(--theme-text-secondary)",
            background: theme === t.id ? "var(--theme-accent-subtle)" : "transparent",
            border: "none",
            outline: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{
              background: t.accent,
              border: theme === t.id ? `2px solid ${t.accent}` : "2px solid transparent",
              boxShadow: theme === t.id ? `0 0 0 2px var(--theme-surface), 0 0 0 4px ${t.accent}` : "none",
            }}
          />
          <span className="flex-1 font-medium">{t.label}</span>
          {theme === t.id && <Check size={14} style={{ color: "var(--theme-accent-text)" }} />}
        </button>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="p-2 rounded-lg transition-all duration-200 flex items-center gap-1.5"
        style={{ color: "var(--theme-text-secondary)", outline: "none", border: "none", cursor: "pointer" }}
        aria-label="Switch theme"
      >
        <Palette size={20} />
      </button>
      {dropdown}
    </>
  )
}
