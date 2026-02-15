"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  BalanceSheetNode,
  IncomeStatementLine,
  TrialBalanceAccount,
  JournalEntry,
  FluxVariance,
} from "@/lib/data/types";

export function useBalanceSheet() {
  const [data, setData] = useState<BalanceSheetNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const nodes = await dataService.reports.getBalanceSheet();
      setData(nodes);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load balance sheet"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useIncomeStatement() {
  const [data, setData] = useState<IncomeStatementLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const lines = await dataService.reports.getIncomeStatement();
      setData(lines);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load income statement"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useTrialBalance() {
  const [data, setData] = useState<TrialBalanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const accounts = await dataService.reports.getTrialBalance();
      setData(accounts);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load trial balance"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useJournalEntries() {
  const [data, setData] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const entries = await dataService.reports.getJournalEntries();
      setData(entries);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load journal entries"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useFluxAnalysis() {
  const [data, setData] = useState<FluxVariance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const variances = await dataService.reports.getFluxAnalysis();
      setData(variances);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load flux analysis"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
