"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { GuidedTourOverlay, getWorkbenchTourSteps } from "@/components/guided-tour";
import type { AnalysisType, Persona } from "@/lib/persona-context";

const TOUR_STORAGE_KEY = "meeru-demo-tour-completed";
const CONFIG_KEY = "meeru-demo-config";

// Routes that trigger the workbench tour
const WORKBENCH_PREFIXES = [
  "/workbench/custom-workbench/uberflux",
  "/workbench/custom-workbench/form-factor",
  "/workbench/record-to-report/standard-flux",
];

/**
 * Shows the guided tour when entering a workbench for the first time.
 * Reads persona/analysisType from localStorage directly for reliability.
 * Listens for "meeru-restart-tour" custom events.
 */
export function DemoTourWrapper() {
  const pathname = usePathname();
  const [showTour, setShowTour] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);

  // Read config from localStorage on mount and when path changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        if (config.persona) setPersona(config.persona);
        if (config.analysisType) setAnalysisType(config.analysisType);
      }
    } catch { /* ignore */ }
  }, [pathname]);

  // Auto-start tour on first visit to a workbench
  useEffect(() => {
    if (!persona || !analysisType) return;
    const isWorkbench = WORKBENCH_PREFIXES.some((p) => pathname?.startsWith(p));
    if (!isWorkbench) return;

    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY);
      const completed: Record<string, boolean> = stored ? JSON.parse(stored) : {};
      const key = `${persona}-${analysisType}`;
      if (!completed[key]) {
        const timer = setTimeout(() => setShowTour(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch { /* ignore */ }
  }, [persona, analysisType, pathname]);

  // Listen for restart tour events
  useEffect(() => {
    const handler = () => setShowTour(true);
    window.addEventListener("meeru-restart-tour", handler);
    return () => window.removeEventListener("meeru-restart-tour", handler);
  }, []);

  const completeTour = useCallback(() => {
    if (!persona || !analysisType) return;
    setShowTour(false);
    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY);
      const completed: Record<string, boolean> = stored ? JSON.parse(stored) : {};
      completed[`${persona}-${analysisType}`] = true;
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(completed));
    } catch { /* ignore */ }
  }, [persona, analysisType]);

  if (!showTour || !persona || !analysisType) return null;

  const steps = getWorkbenchTourSteps(analysisType, persona);
  if (steps.length === 0) return null;

  return (
    <GuidedTourOverlay
      steps={steps}
      onComplete={completeTour}
      onSkip={completeTour}
    />
  );
}
