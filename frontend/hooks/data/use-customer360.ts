"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  Customer360,
  BaseFilters,
  PaginatedResult,
} from "@/lib/data/types";

export function useCustomer360(customerId: string | undefined) {
  const [data, setData] = useState<Customer360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!customerId) {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const r = await dataService.collections.getCustomer360(customerId);
      setData(r ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useCustomer360List(filters?: BaseFilters) {
  const [result, setResult] = useState<PaginatedResult<Customer360>>({
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
      const r = await dataService.collections.getCustomer360List(filters);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customer list");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}
