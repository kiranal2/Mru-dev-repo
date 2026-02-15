"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type { CashMatchResult } from "@/lib/data/types";

export function useCashMatching(paymentId?: string) {
  const [data, setData] = useState<CashMatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const results =
        await dataService.cashApplication.getMatchResults(paymentId);
      setData(results);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load match results"
      );
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const acceptMatch = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await dataService.cashApplication.updateMatchResult(id, {
        status: "Accepted",
      });
      if (updated) {
        setData((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: "Accepted" } : m))
        );
      }
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept match");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const rejectMatch = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await dataService.cashApplication.updateMatchResult(id, {
        status: "Rejected",
      });
      if (updated) {
        setData((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: "Rejected" } : m))
        );
      }
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject match");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetch, acceptMatch, rejectMatch };
}
