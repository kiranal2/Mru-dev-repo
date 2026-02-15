"use client";

import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/lib/data";
import type {
  Pin,
  WatchlistItem,
  ActivityEvent,
  DataTemplate,
} from "@/lib/data/types";

export function usePins() {
  const [data, setData] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const pins = await dataService.workspace.getPins();
      setData(pins);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addPin = async (pin: Partial<Pin>) => {
    try {
      setLoading(true);
      setError(null);
      const newPin = await dataService.workspace.addPin(pin);
      setData((prev) => [...prev, newPin]);
      return newPin;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add pin");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const removePin = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const removed = await dataService.workspace.removePin(id);
      if (removed) {
        setData((prev) => prev.filter((p) => p.id !== id));
      }
      return removed;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove pin");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetch, addPin, removePin };
}

export function useWatchlist() {
  const [data, setData] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await dataService.workspace.getWatchlist();
      setData(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addItem = async (item: Partial<WatchlistItem>) => {
    try {
      setLoading(true);
      setError(null);
      const newItem = await dataService.workspace.addWatchlistItem(item);
      setData((prev) => [...prev, newItem]);
      return newItem;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to add watchlist item"
      );
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const removed = await dataService.workspace.removeWatchlistItem(id);
      if (removed) {
        setData((prev) => prev.filter((w) => w.id !== id));
      }
      return removed;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to remove watchlist item"
      );
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetch, addItem, removeItem };
}

export function useActivityFeed() {
  const [data, setData] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const events = await dataService.workspace.getActivityFeed();
      setData(events);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load activity feed"
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

export function useDataTemplates() {
  const [data, setData] = useState<DataTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const templates = await dataService.workspace.getDataTemplates();
      setData(templates);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load data templates"
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
