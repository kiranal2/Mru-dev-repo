"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { WeblandVerificationData } from "@/lib/data/types";

export function useIGRSWeblandVerification() {
  const [data, setData] = useState<WeblandVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.igrsRevenue.getWeblandVerification();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Webland verification data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
