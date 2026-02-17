"use client";

import { useState, useEffect } from "react";
import type { PromptEngineData } from "@/lib/data/types/igrs";

interface AIchatState {
  promptData: PromptEngineData | null;
  isLoading: boolean;
  error: string | null;
}

export function useAIChat() {
  const [state, setState] = useState<AIchatState>({
    promptData: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (state.promptData) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const res = await fetch("/data/igrs/ai-prompt-engine.json");
        const data: PromptEngineData = await res.json();
        if (!cancelled) {
          setState({ promptData: data, isLoading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load AI chat data",
          }));
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
