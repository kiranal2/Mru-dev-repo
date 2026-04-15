"use client";

import { useState, useEffect, useCallback } from "react";
import type { Persona } from "@/lib/persona-context";

const STORAGE_KEY = "meeru-tour-completed";

/**
 * Hook to manage guided tour state.
 * Tracks whether the user has completed the tour for their current persona.
 */
export function useGuidedTour(persona: Persona | null) {
  const [showTour, setShowTour] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!persona) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const completed: Record<string, boolean> = stored ? JSON.parse(stored) : {};
      if (!completed[persona]) {
        // Small delay so the dashboard renders first
        const timer = setTimeout(() => setShowTour(true), 800);
        setLoaded(true);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore parse errors
    }
    setLoaded(true);
  }, [persona]);

  const completeTour = useCallback(() => {
    if (!persona) return;
    setShowTour(false);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const completed: Record<string, boolean> = stored ? JSON.parse(stored) : {};
      completed[persona] = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch {
      // Ignore
    }
  }, [persona]);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const resetTour = useCallback(() => {
    if (!persona) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const completed: Record<string, boolean> = stored ? JSON.parse(stored) : {};
      delete completed[persona];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch {
      // Ignore
    }
    setShowTour(true);
  }, [persona]);

  return { showTour, loaded, completeTour, skipTour, resetTour };
}
