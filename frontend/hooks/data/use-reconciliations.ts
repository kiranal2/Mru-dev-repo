"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  Reconciliation,
  ReconFilters,
  PaginatedResult,
} from "@/lib/data/types";

export function useReconciliations(filters?: ReconFilters) {
  const [result, setResult] = useState<PaginatedResult<Reconciliation>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r =
        await dataService.reconciliations.getReconciliations(filters);
      setResult(r);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load reconciliations"
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}
