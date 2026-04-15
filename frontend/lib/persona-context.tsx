"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────
export type Persona = "cfo" | "cao" | "cao-controller";
export type Industry = "technology" | "healthcare" | "manufacturing";

export interface DemoConfig {
  persona: Persona;
  industry: Industry;
}

export interface PersonaInfo {
  id: Persona;
  title: string;
  subtitle: string;
  keywords: string[];
}

export interface IndustryInfo {
  id: Industry;
  title: string;
  subtitle: string;
}

export const PERSONAS: PersonaInfo[] = [
  {
    id: "cfo",
    title: "Chief Financial Officer",
    subtitle: "Board-level view · Strategic performance · Capital allocation",
    keywords: ["Performance Intelligence", "UberFlux", "Margin"],
  },
  {
    id: "cao",
    title: "CAO",
    subtitle: "Financial oversight · Variance analysis · Operational reporting",
    keywords: ["Flux Analysis", "Forecasting", "Variance"],
  },
  {
    id: "cao-controller",
    title: "CAO / Controller",
    subtitle: "Close management · Flux analysis · Audit-ready explanations",
    keywords: ["Close Intelligence", "Reconciliation", "Close Workbench"],
  },
];

export const INDUSTRIES: IndustryInfo[] = [
  {
    id: "technology",
    title: "Technology",
    subtitle: "SaaS revenue · ARR/MRR · Cloud infrastructure · Subscription metrics",
  },
  {
    id: "healthcare",
    title: "Healthcare",
    subtitle: "Patient revenue · Payer mix · Reimbursement · Compliance",
  },
  {
    id: "manufacturing",
    title: "Manufacturing",
    subtitle: "Production lines · COGS · BOM · Inventory valuation",
  },
];

// ─── Landing routes per persona ────────────────────────────────────
const LANDING_ROUTES: Record<Persona, string> = {
  cfo: "/home/dashboard",
  "cao": "/home/dashboard",
  "cao-controller": "/home/dashboard",
};

// ─── Storage key ──────────────────────────────────────────────────
const STORAGE_KEY = "meeru-demo-config";

// ─── Context ──────────────────────────────────────────────────────
interface PersonaContextValue {
  persona: Persona | null;
  industry: Industry | null;
  demoConfig: DemoConfig | null;
  landingRoute: string | null;
  setPersona: (p: Persona) => void;
  setIndustry: (i: Industry) => void;
  saveDemoConfig: (config: DemoConfig) => void;
  resetDemo: () => void;
  isConfigured: boolean;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────
export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersonaState] = useState<Persona | null>(null);
  const [industry, setIndustryState] = useState<Industry | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config: DemoConfig = JSON.parse(stored);
        if (config.persona) setPersonaState(config.persona);
        if (config.industry) setIndustryState(config.industry);
      }
    } catch {
      // Ignore parse errors
    }
    setLoaded(true);
  }, []);

  const setPersona = useCallback((p: Persona) => {
    setPersonaState(p);
  }, []);

  const setIndustry = useCallback((i: Industry) => {
    setIndustryState(i);
  }, []);

  const saveDemoConfig = useCallback((config: DemoConfig) => {
    setPersonaState(config.persona);
    setIndustryState(config.industry);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const resetDemo = useCallback(() => {
    setPersonaState(null);
    setIndustryState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const demoConfig: DemoConfig | null =
    persona && industry ? { persona, industry } : null;

  const landingRoute = persona ? LANDING_ROUTES[persona] : null;
  const isConfigured = loaded && !!persona && !!industry;

  // Don't render children until we've checked localStorage
  if (!loaded) return null;

  return (
    <PersonaContext.Provider
      value={{
        persona,
        industry,
        demoConfig,
        landingRoute,
        setPersona,
        setIndustry,
        saveDemoConfig,
        resetDemo,
        isConfigured,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────
export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return ctx;
}

/** Get landing route for a persona (static, no context needed) */
export function getPersonaLandingRoute(persona: Persona): string {
  return LANDING_ROUTES[persona];
}
