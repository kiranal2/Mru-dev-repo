"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { RevenueDashboardKPIs } from "@/lib/data/types";

export function useRevenueDashboard() {
  const [data, setData] = useState<RevenueDashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const kpis = await dataService.revenueAssurance.getDashboardKPIs();
      setData(kpis);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load dashboard KPIs"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
