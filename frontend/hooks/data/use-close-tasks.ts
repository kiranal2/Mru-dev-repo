"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  CloseTask,
  CloseTaskFilters,
  PaginatedResult,
} from "@/lib/data/types";

export function useCloseTasks(filters?: CloseTaskFilters) {
  const [result, setResult] = useState<PaginatedResult<CloseTask>>({
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
      const r = await dataService.closeManagement.getTasks(filters);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load close tasks");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateTask = async (id: string, updates: Partial<CloseTask>) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await dataService.closeManagement.updateTask(
        id,
        updates
      );
      if (updated) {
        setResult((prev) => ({
          ...prev,
          data: prev.data.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      }
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update task");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { ...result, loading, error, refetch: fetch, updateTask };
}
