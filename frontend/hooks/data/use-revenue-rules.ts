"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { RevenueRule } from "@/lib/data/types";

export function useRevenueRules() {
  const [data, setData] = useState<RevenueRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rules = await dataService.revenueAssurance.getRules();
      setData(rules);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useRevenueRuleMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRule = async (id: string, enabled: boolean) => {
    try {
      setLoading(true);
      setError(null);
      await dataService.revenueAssurance.toggleRule(id, enabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to toggle rule");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { toggleRule, loading, error };
}
