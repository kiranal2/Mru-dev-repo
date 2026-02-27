"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  DunningSequence,
  DunningTemplate,
  PromiseToPay,
  Correspondence,
  DunningFilters,
  BaseFilters,
  PaginatedResult,
} from "@/lib/data/types";

// ─── Dunning Sequence Hooks ──────────────────────────────────────────────────

export function useDunningSequences(filters?: DunningFilters) {
  const [result, setResult] = useState<PaginatedResult<DunningSequence>>({
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
      const r = await dataService.collections.getDunningSequences(filters);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dunning sequences");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}

export function useDunningSequenceMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSequence = useCallback(async (data: Partial<DunningSequence>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.collections.createDunningSequence(data);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create dunning sequence";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSequence = useCallback(async (id: string, updates: Partial<DunningSequence>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.collections.updateDunningSequence(id, updates);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update dunning sequence";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createSequence, updateSequence, loading, error };
}

// ─── Template Hooks ──────────────────────────────────────────────────────────

export function useDunningTemplates() {
  const [data, setData] = useState<DunningTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await dataService.collections.getDunningTemplates();
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Promise-to-Pay Hooks ────────────────────────────────────────────────────

export function usePromisesToPay(filters?: BaseFilters) {
  const [result, setResult] = useState<PaginatedResult<PromiseToPay>>({
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
      const r = await dataService.collections.getPromises(filters);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load promises");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}

export function usePromiseToPayMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPromise = useCallback(async (data: Partial<PromiseToPay>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.collections.createPromise(data);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create promise";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePromise = useCallback(async (id: string, updates: Partial<PromiseToPay>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.collections.updatePromise(id, updates);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update promise";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPromise, updatePromise, loading, error };
}

// ─── Correspondence Hooks ────────────────────────────────────────────────────

export function useCorrespondence(customerId?: string) {
  const [result, setResult] = useState<PaginatedResult<Correspondence>>({
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
      const r = await dataService.collections.getCorrespondence(customerId);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load correspondence");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}

export function useCorrespondenceMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCorrespondence = useCallback(async (data: Partial<Correspondence>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.collections.createCorrespondence(data);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to log correspondence";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createCorrespondence, loading, error };
}
