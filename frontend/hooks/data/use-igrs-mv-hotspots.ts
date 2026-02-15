"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { MVHotspot } from "@/lib/data/types";

export function useIGRSMVHotspots() {
  const [data, setData] = useState<MVHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const hotspots = await dataService.igrsRevenue.getMvHotspots();
      setData(hotspots);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load MV hotspots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
