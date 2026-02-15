"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { SROOffice } from "@/lib/data/types";

export function useIGRSOffices() {
  const [data, setData] = useState<SROOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const offices = await dataService.igrsRevenue.getOffices();
      setData(offices);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load offices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
