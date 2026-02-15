"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  IGRSCase,
  IGRSCaseFilters,
  PaginatedResult,
} from "@/lib/data/types";

export function useIGRSCases(filters?: IGRSCaseFilters) {
  const [result, setResult] = useState<PaginatedResult<IGRSCase>>({
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
      const r = await dataService.igrsRevenue.getCases(filters);
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

export function useIGRSCase(id: string | undefined) {
  const [data, setData] = useState<IGRSCase | null>(null);
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
      const c = await dataService.igrsRevenue.getCase(id);
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

export function useIGRSCaseMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: Partial<IGRSCase>) => {
    try {
      setLoading(true);
      setError(null);
      return await dataService.igrsRevenue.createCase(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create case");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, updates: Partial<IGRSCase>) => {
    try {
      setLoading(true);
      setError(null);
      return await dataService.igrsRevenue.updateCase(id, updates);
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
      return await dataService.igrsRevenue.deleteCase(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete case");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading, error };
}
