"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { CashReconciliationRecord } from "@/lib/data/types";

export function useIGRSCashReconciliation(srCode?: string) {
  const [data, setData] = useState<CashReconciliationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await dataService.igrsRevenue.getCashReconciliation(srCode);
      setData(records);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cash reconciliation data");
    } finally {
      setLoading(false);
    }
  }, [srCode]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
