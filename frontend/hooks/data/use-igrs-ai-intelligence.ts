"use client";

import { useState, useEffect } from "react";
import type {
  PredictiveForecastingData,
  DocumentRiskScoringData,
  SROIntegrityIndexData,
} from "@/lib/data/types/igrs";

type AIIntelligenceTab = "forecasting" | "risk-scoring" | "integrity-index";

interface AIIntelligenceState {
  forecasting: PredictiveForecastingData | null;
  riskScoring: DocumentRiskScoringData | null;
  integrityIndex: SROIntegrityIndexData | null;
  isLoading: boolean;
  error: string | null;
}

export function useAIIntelligence(activeTab: AIIntelligenceTab) {
  const [state, setState] = useState<AIIntelligenceState>({
    forecasting: null,
    riskScoring: null,
    integrityIndex: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        switch (activeTab) {
          case "forecasting": {
            if (!state.forecasting) {
              const res = await fetch("/data/igrs/ai-predictive-forecasting.json");
              const data: PredictiveForecastingData = await res.json();
              if (!cancelled) setState(prev => ({ ...prev, forecasting: data, isLoading: false }));
            } else {
              if (!cancelled) setState(prev => ({ ...prev, isLoading: false }));
            }
            break;
          }
          case "risk-scoring": {
            if (!state.riskScoring) {
              const res = await fetch("/data/igrs/ai-risk-scoring.json");
              const data: DocumentRiskScoringData = await res.json();
              if (!cancelled) setState(prev => ({ ...prev, riskScoring: data, isLoading: false }));
            } else {
              if (!cancelled) setState(prev => ({ ...prev, isLoading: false }));
            }
            break;
          }
          case "integrity-index": {
            if (!state.integrityIndex) {
              const res = await fetch("/data/igrs/ai-sro-integrity.json");
              const data: SROIntegrityIndexData = await res.json();
              if (!cancelled) setState(prev => ({ ...prev, integrityIndex: data, isLoading: false }));
            } else {
              if (!cancelled) setState(prev => ({ ...prev, isLoading: false }));
            }
            break;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load AI intelligence data",
          }));
        }
      }
    }

    loadData();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return state;
}
