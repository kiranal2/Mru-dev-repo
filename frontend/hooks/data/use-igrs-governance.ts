"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { dataService } from "@/lib/data";

type GovernanceTab =
  | "revenue-growth"
  | "district-ranking"
  | "low-performing"
  | "classification"
  | "prohibited-property"
  | "anywhere-registration"
  | "sla-monitoring"
  | "demographics";

export function useIGRSGovernance(activeTab: GovernanceTab) {
  const [data, setData] = useState<unknown>(null);
  const [dataTab, setDataTab] = useState<GovernanceTab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Record<string, unknown>>({});

  const fetchData = useCallback(async () => {
    if (cacheRef.current[activeTab]) {
      setData(cacheRef.current[activeTab]);
      setDataTab(activeTab);
      setLoading(false);
      return;
    }
    try {
      setData(null);
      setDataTab(null);
      setLoading(true);
      setError(null);
      const result = await dataService.igrsRevenue.getGovernanceData(activeTab);
      cacheRef.current[activeTab] = result;
      setData(result);
      setDataTab(activeTab);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load governance data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, dataTab };
}
