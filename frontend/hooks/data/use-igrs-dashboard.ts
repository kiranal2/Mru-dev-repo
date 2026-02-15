"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { IGRSDashboardKPIs } from "@/lib/data/types";

export function useIGRSDashboard() {
  const [data, setData] = useState<IGRSDashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const kpis = await dataService.igrsRevenue.getDashboardKPIs();
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
