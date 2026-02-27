"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  MerchantAccount,
  MerchantInvoice,
  MerchantPayment,
  MerchantDispute,
  MerchantCreditMemo,
  MerchantPaymentMethod,
  MerchantNotification,
  MerchantInvoiceFilters,
  PaginatedResult,
  BaseFilters,
} from "@/lib/data/types";

// ─── Account Hooks ───────────────────────────────────────────────────────────

export function useMerchantAccounts(filters?: BaseFilters) {
  const [result, setResult] = useState<PaginatedResult<MerchantAccount>>({
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
      const r = await dataService.merchantPortal.getAccounts(filters);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}

export function useMerchantAccount(id: string | undefined) {
  const [data, setData] = useState<MerchantAccount | null>(null);
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
      const r = await dataService.merchantPortal.getAccount(id);
      setData(r ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load account");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Invoice Hooks ───────────────────────────────────────────────────────────

export function useMerchantInvoices(filters?: MerchantInvoiceFilters) {
  const [result, setResult] = useState<PaginatedResult<MerchantInvoice>>({
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
      const r = await dataService.merchantPortal.getInvoices(filters);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}

// ─── Payment Hooks ───────────────────────────────────────────────────────────

export function useMerchantPayments(accountId?: string) {
  const [result, setResult] = useState<PaginatedResult<MerchantPayment>>({
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
      const r = await dataService.merchantPortal.getPayments(accountId);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}

export function useMerchantPaymentMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = useCallback(async (data: Partial<MerchantPayment>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.merchantPortal.createPayment(data);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create payment";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPayment, loading, error };
}

// ─── Dispute Hooks ───────────────────────────────────────────────────────────

export function useMerchantDisputes(accountId?: string) {
  const [result, setResult] = useState<PaginatedResult<MerchantDispute>>({
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
      const r = await dataService.merchantPortal.getDisputes(accountId);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}

export function useMerchantDisputeMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDispute = useCallback(async (data: Partial<MerchantDispute>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.merchantPortal.createDispute(data);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create dispute";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDispute = useCallback(async (id: string, updates: Partial<MerchantDispute>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataService.merchantPortal.updateDispute(id, updates);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update dispute";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createDispute, updateDispute, loading, error };
}

// ─── Credit Memo Hooks ───────────────────────────────────────────────────────

export function useMerchantCreditMemos(accountId?: string) {
  const [data, setData] = useState<MerchantCreditMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await dataService.merchantPortal.getCreditMemos(accountId);
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load credit memos");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Payment Method Hooks ────────────────────────────────────────────────────

export function useMerchantPaymentMethods(accountId?: string) {
  const [data, setData] = useState<MerchantPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await dataService.merchantPortal.getPaymentMethods(accountId);
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Notification Hooks ──────────────────────────────────────────────────────

export function useMerchantNotifications(accountId?: string) {
  const [data, setData] = useState<MerchantNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await dataService.merchantPortal.getNotifications(accountId);
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
