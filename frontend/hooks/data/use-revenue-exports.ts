"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { RevenueExport } from "@/lib/data/types";

export function useRevenueExports() {
  const [data, setData] = useState<RevenueExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const exports = await dataService.revenueAssurance.getExports();
      setData(exports);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load exports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
