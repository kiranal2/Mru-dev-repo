"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  CashException,
  ExceptionFilters,
  PaginatedResult,
} from "@/lib/data/types";

export function useCashExceptions(filters?: ExceptionFilters) {
  const [result, setResult] = useState<PaginatedResult<CashException>>({
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
      const r = await dataService.cashApplication.getExceptions(filters);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load exceptions");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const resolveException = async (id: string, resolution: string) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await dataService.cashApplication.updateException(id, {
        status: "Resolved",
        resolution,
        resolvedAt: new Date().toISOString(),
      });
      if (updated) {
        setResult((prev) => ({
          ...prev,
          data: prev.data.map((ex) =>
            ex.id === id
              ? {
                  ...ex,
                  status: "Resolved" as const,
                  resolution,
                  resolvedAt: new Date().toISOString(),
                }
              : ex
          ),
        }));
      }
      return updated;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to resolve exception"
      );
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const rejectException = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await dataService.cashApplication.updateException(id, {
        status: "Rejected",
        resolvedAt: new Date().toISOString(),
      });
      if (updated) {
        setResult((prev) => ({
          ...prev,
          data: prev.data.map((ex) =>
            ex.id === id
              ? {
                  ...ex,
                  status: "Rejected" as const,
                  resolvedAt: new Date().toISOString(),
                }
              : ex
          ),
        }));
      }
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject exception");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    ...result,
    loading,
    error,
    refetch: fetch,
    resolveException,
    rejectException,
  };
}
