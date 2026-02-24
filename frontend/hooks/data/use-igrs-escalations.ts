"use client";

import { useState, useEffect, useCallback } from "react";
import type { EscalationRecord } from "@/lib/data/types/igrs";

const LS_KEY = "igrs_escalations";

interface UseIGRSEscalationsReturn {
  escalations: EscalationRecord[];
  isLoading: boolean;
  error: string | null;
  addEscalation: (esc: EscalationRecord) => void;
  updateEscalation: (id: string, updates: Partial<EscalationRecord>) => void;
  refetch: () => void;
}

export function useIGRSEscalations(): UseIGRSEscalationsReturn {
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try localStorage first
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        setEscalations(JSON.parse(stored));
        setIsLoading(false);
        return;
      }
    } catch {
      // localStorage unavailable or corrupt — fall through to fetch
    }

    try {
      const res = await fetch("/data/igrs/escalations.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data: EscalationRecord[] = json.escalations ?? [];
      setEscalations(data);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load escalations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback((data: EscalationRecord[]) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, []);

  const addEscalation = useCallback(
    (esc: EscalationRecord) => {
      setEscalations((prev) => {
        const next = [esc, ...prev];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateEscalation = useCallback(
    (id: string, updates: Partial<EscalationRecord>) => {
      setEscalations((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return { escalations, isLoading, error, addEscalation, updateEscalation, refetch: load };
}
