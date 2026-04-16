"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────
export type Persona = "cfo" | "cao" | "cao-controller";
export type Industry = "technology" | "healthcare" | "manufacturing";
export type AnalysisType = "strategic" | "margin" | "flux";

export interface DemoConfig {
  persona: Persona;
  industry: Industry;
  analysisType?: AnalysisType;
  demoMode?: boolean;
}

export interface PersonaInfo {
  id: Persona;
  title: string;
  subtitle: string;
  keywords: string[];
  /** Fake profile for demo */
  profileName: string;
  profileInitials: string;
}

export interface IndustryInfo {
  id: Industry;
  title: string;
  subtitle: string;
}

export interface AnalysisTypeInfo {
  id: AnalysisType;
  title: string;
  subtitle: string;
  /** Route the user lands on after onboarding */
  workbenchRoute: string;
}

export const PERSONAS: PersonaInfo[] = [
  {
    id: "cfo",
    title: "Chief Financial Officer",
    subtitle: "Board-level view · Strategic performance · Capital allocation",
    keywords: ["Performance Intelligence", "UberFlux", "Margin"],
    profileName: "Sarah Chen",
    profileInitials: "SC",
  },
  {
    id: "cao",
    title: "CAO",
    subtitle: "Financial oversight · Variance analysis · Operational reporting",
    keywords: ["Flux Analysis", "Forecasting", "Variance"],
    profileName: "Michael Torres",
    profileInitials: "MT",
  },
  {
    id: "cao-controller",
    title: "CAO / Controller",
    subtitle: "Close management · Flux analysis · Audit-ready explanations",
    keywords: ["Close Intelligence", "Reconciliation", "Close Workbench"],
    profileName: "David Park",
    profileInitials: "DP",
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
    title: "Retail",
    subtitle: "Comp store sales · AUR · Basket size · Omnichannel",
  },
];

export const ANALYSIS_TYPES: AnalysisTypeInfo[] = [
  {
    id: "strategic",
    title: "Performance Intelligence",
    subtitle: "Weekly operating signals · Region & segment performance · Predictive flags",
    workbenchRoute: "/workbench/custom-workbench/uberflux",
  },
  {
    id: "margin",
    title: "Margin Intelligence",
    subtitle: "Price · Mix · Volume · Cost decomposition · Forecast vs actual",
    workbenchRoute: "/workbench/custom-workbench/form-factor",
  },
  {
    id: "flux",
    title: "Flux Intelligence",
    subtitle: "IS · BS · Cash flow · Materiality thresholds · Close workflow",
    workbenchRoute: "/workbench/record-to-report/standard-flux",
  },
];

// ─── Landing routes per persona (fallback when no analysisType) ───
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
  analysisType: AnalysisType | null;
  demoMode: boolean;
  demoConfig: DemoConfig | null;
  landingRoute: string | null;
  setPersona: (p: Persona) => void;
  setIndustry: (i: Industry) => void;
  setAnalysisType: (a: AnalysisType) => void;
  saveDemoConfig: (config: DemoConfig) => void;
  resetDemo: () => void;
  isConfigured: boolean;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────
export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersonaState] = useState<Persona | null>(null);
  const [industry, setIndustryState] = useState<Industry | null>(null);
  const [analysisType, setAnalysisTypeState] = useState<AnalysisType | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        if (config.persona) setPersonaState(config.persona);
        if (config.industry) setIndustryState(config.industry);
        if (config.analysisType) setAnalysisTypeState(config.analysisType);
        if (config.demoMode) setDemoMode(true);
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

  const setAnalysisType = useCallback((a: AnalysisType) => {
    setAnalysisTypeState(a);
  }, []);

  const saveDemoConfig = useCallback((config: DemoConfig) => {
    setPersonaState(config.persona);
    setIndustryState(config.industry);
    if (config.analysisType) setAnalysisTypeState(config.analysisType);
    if (config.demoMode) setDemoMode(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      // Notify same-tab listeners (useIndustry hook)
      window.dispatchEvent(new CustomEvent("meeru-config-changed"));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const resetDemo = useCallback(() => {
    setPersonaState(null);
    setIndustryState(null);
    setAnalysisTypeState(null);
    setDemoMode(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const demoConfig: DemoConfig | null =
    persona && industry ? { persona, industry, analysisType: analysisType || undefined, demoMode } : null;

  // Landing route: use analysis type workbench route if available, else persona default
  const landingRoute = analysisType
    ? ANALYSIS_TYPES.find((a) => a.id === analysisType)?.workbenchRoute || LANDING_ROUTES[persona || "cfo"]
    : persona
      ? LANDING_ROUTES[persona]
      : null;

  const isConfigured = loaded && !!persona && !!industry;

  // Don't render children until we've checked localStorage
  if (!loaded) return null;

  return (
    <PersonaContext.Provider
      value={{
        persona,
        industry,
        analysisType,
        demoMode,
        demoConfig,
        landingRoute,
        setPersona,
        setIndustry,
        setAnalysisType,
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

/** Get workbench route for an analysis type */
export function getAnalysisRoute(analysisType: AnalysisType): string {
  return ANALYSIS_TYPES.find((a) => a.id === analysisType)?.workbenchRoute || "/home/dashboard";
}
