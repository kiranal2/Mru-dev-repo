"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  CollectionRecord,
  CollectionFilters,
  PaginatedResult,
} from "@/lib/data/types";

export function useCollections(filters?: CollectionFilters) {
  const [result, setResult] = useState<PaginatedResult<CollectionRecord>>({
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
      const r = await dataService.collections.getRecords(filters);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}

export function useCollection(id: string | undefined) {
  const [data, setData] = useState<CollectionRecord | null>(null);
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
      const r = await dataService.collections.getRecord(id);
      setData(r ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load collection record");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useCollectionMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRecord = useCallback(async (id: string, updates: Partial<CollectionRecord>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.collections.updateRecord(id, updates);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update collection record";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateRecord, loading, error };
}
