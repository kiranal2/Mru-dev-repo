"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { MVAnomaliesData } from "@/lib/data/types";

export function useIGRSMVAnomalies() {
  const [data, setData] = useState<MVAnomaliesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.igrsRevenue.getMVAnomalies();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load MV anomalies data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
