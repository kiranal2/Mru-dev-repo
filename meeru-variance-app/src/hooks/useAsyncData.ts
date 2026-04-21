import { useCallback, useEffect, useRef, useState } from 'react';
import { useLoading } from '../store';

interface Options {
  /** Base delay in ms before resolving (default 480) */
  delayMs?: number;
  /** Max random jitter added to delay (default 280) */
  jitterMs?: number;
  /**
   * If true, keep showing previous `data` while a new fetch is in-flight
   * (good for filter changes — avoids full-page skeleton flash).
   * If false, clear `data` to null and render skeleton (good for first load).
   */
  keepPrevious?: boolean;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  /** True only on the very first load (data has never been set) */
  initialLoading: boolean;
  /** True when fetching but previous `data` is still visible */
  refreshing: boolean;
  refresh: () => void;
}

/**
 * Simulates an async data fetch with realistic delay + jitter.
 * Reacts to `deps` changes — every change re-fetches.
 *
 * Usage:
 *   const { data, loading, initialLoading, refresh } = useAsyncData(
 *     () => computeMyData(region, compare),
 *     [region, compare],
 *     { keepPrevious: true }
 *   );
 */
export function useAsyncData<T>(
  loader: () => T,
  deps: readonly unknown[],
  options: Options = {},
): AsyncState<T> {
  const { delayMs = 480, jitterMs = 280, keepPrevious = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);
  const [tick, setTick] = useState(0);
  const { begin, end } = useLoading();

  useEffect(() => {
    setLoading(true);
    if (!keepPrevious) setData(null);
    begin();
    const ms = delayMs + Math.random() * jitterMs;
    const id = setTimeout(() => {
      setData(loader());
      setLoading(false);
      hasLoadedOnce.current = true;
      end();
    }, ms);
    return () => { clearTimeout(id); end(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  return {
    data,
    loading,
    initialLoading: loading && !hasLoadedOnce.current && data === null,
    refreshing: loading && data !== null,
    refresh,
  };
}
