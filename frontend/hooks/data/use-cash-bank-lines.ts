"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { CashBankLine } from "@/lib/data/types";

export function useCashBankLines() {
  const [data, setData] = useState<CashBankLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const lines = await dataService.cashApplication.getBankLines();
      setData(lines);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bank lines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
