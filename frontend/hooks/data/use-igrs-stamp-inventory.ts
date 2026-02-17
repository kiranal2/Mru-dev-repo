"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { StampInventoryRecord } from "@/lib/data/types";

export function useIGRSStampInventory(srCode?: string) {
  const [data, setData] = useState<StampInventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await dataService.igrsRevenue.getStampInventory(srCode);
      setData(records);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stamp inventory data");
    } finally {
      setLoading(false);
    }
  }, [srCode]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
