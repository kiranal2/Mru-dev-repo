"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { IGRSExport } from "@/lib/data/types";

export function useIGRSExports() {
  const [data, setData] = useState<IGRSExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const exports = await dataService.igrsRevenue.getExports();
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
