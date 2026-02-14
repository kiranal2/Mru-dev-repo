"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface MenuVisibility {
  insights: boolean;
  patterns: boolean;
  rules: boolean;
}

interface MenuVisibilityContextValue {
  visibility: MenuVisibility;
  setVisibility: (key: keyof MenuVisibility, visible: boolean) => void;
}

const STORAGE_KEY = "rl-menu-visibility";

const defaults: MenuVisibility = { insights: true, patterns: true, rules: true };

const MenuVisibilityContext = createContext<MenuVisibilityContextValue | null>(null);

function loadFromStorage(): MenuVisibility {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaults;
}

export function MenuVisibilityProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibilityState] = useState<MenuVisibility>(defaults);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setVisibilityState(loadFromStorage());
  }, []);

  const setVisibility = (key: keyof MenuVisibility, visible: boolean) => {
    setVisibilityState((prev) => {
      const next = { ...prev, [key]: visible };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <MenuVisibilityContext.Provider value={{ visibility, setVisibility }}>
      {children}
    </MenuVisibilityContext.Provider>
  );
}

export function useMenuVisibility() {
  const ctx = useContext(MenuVisibilityContext);
  if (!ctx) throw new Error("useMenuVisibility must be used within MenuVisibilityProvider");
  return ctx;
}
