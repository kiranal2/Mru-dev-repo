"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  RevenueCase,
  RevenueCaseFilters,
  PaginatedResult,
} from "@/lib/data/types";

export function useRevenueCases(filters?: RevenueCaseFilters) {
  const [result, setResult] = useState<PaginatedResult<RevenueCase>>({
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
      const r = await dataService.revenueAssurance.getCases(filters);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}

export function useRevenueCase(id: string | undefined) {
  const [data, setData] = useState<RevenueCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const c = await dataService.revenueAssurance.getCase(id);
      setData(c ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useRevenueCaseMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: Partial<RevenueCase>) => {
    try {
      setLoading(true);
      setError(null);
      return await dataService.revenueAssurance.createCase(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create case");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, updates: Partial<RevenueCase>) => {
    try {
      setLoading(true);
      setError(null);
      return await dataService.revenueAssurance.updateCase(id, updates);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update case");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await dataService.revenueAssurance.deleteCase(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete case");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading, error };
}
