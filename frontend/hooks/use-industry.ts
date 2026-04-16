"use client";

import { useState, useEffect } from "react";
import type { Industry } from "@/lib/persona-context";
import { getIndustryConfig, type IndustryConfig } from "@/lib/industry-data";

/**
 * Hook to get the current industry config.
 * Reads from localStorage (meeru-demo-config) and returns the industry data.
 * Falls back to "technology" if no industry is configured.
 */
export function useIndustry(): {
  industry: Industry;
  config: IndustryConfig;
  isDemoMode: boolean;
} {
  const [industry, setIndustry] = useState<Industry>("technology");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("meeru-demo-config");
      if (stored) {
        const config = JSON.parse(stored);
        if (config.industry) setIndustry(config.industry);
        if (config.demoMode) setIsDemoMode(true);
      }
    } catch {
      // Ignore
    }

    // Listen for storage changes (when context switcher updates)
    const handler = () => {
      try {
        const stored = localStorage.getItem("meeru-demo-config");
        if (stored) {
          const config = JSON.parse(stored);
          if (config.industry) setIndustry(config.industry);
          if (config.demoMode) setIsDemoMode(true);
        }
      } catch {
        // Ignore
      }
    };
    window.addEventListener("storage", handler);
    // Also listen for a custom event for same-tab updates
    window.addEventListener("meeru-config-changed", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("meeru-config-changed", handler);
    };
  }, []);

  return {
    industry,
    config: getIndustryConfig(industry),
    isDemoMode,
  };
}
