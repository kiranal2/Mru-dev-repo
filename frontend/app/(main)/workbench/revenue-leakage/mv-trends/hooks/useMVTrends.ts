"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import {
  mvTrendsData,
  getMVHotspotDetail,
} from "@/lib/revenue-leakage/mvTrendsData";
import {
  MVHotspotDetail,
  MVHotspotItem,
  MVSeverity,
  MVOfficeComparison,
  MVRateCardAnomaly,
  MVDeclaredTrend,
  MVSeasonalPattern,
} from "@/lib/revenue-leakage/types";
import { DistrictData } from "@/components/revenue-leakage/ap-district-map";
import { toast } from "sonner";
import type { ActiveView, MapViewMode, SortByOption, TypeFilter, TopRule, SeverityDistributionItem } from "../types";

export function useChartTooltip() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const showTooltip = useCallback((e: React.MouseEvent, content: React.ReactNode) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, content });
  }, []);
  const hideTooltip = useCallback(() => setTooltip(null), []);
  return { tooltip, containerRef, showTooltip, hideTooltip };
}

export function useMVTrends() {
  // --- View state ---
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [selectedQuarter, setSelectedQuarter] = useState(
    mvTrendsData.quarters[mvTrendsData.quarters.length - 1] || "2024-Q4"
  );

  // --- Data (static) ---
  const [hotspots] = useState<MVHotspotItem[]>(mvTrendsData.hotspots);
  const [sroTiles] = useState(mvTrendsData.sroTiles);
  const [officePairs] = useState<MVOfficeComparison[]>(mvTrendsData.pairs);
  const [rateCardAnomalies] = useState<MVRateCardAnomaly[]>(mvTrendsData.rateCardAnomalies);
  const [declaredTrends] = useState<MVDeclaredTrend[]>(mvTrendsData.declaredTrends);
  const [seasonalPatterns] = useState<MVSeasonalPattern[]>(mvTrendsData.seasonalPatterns);

  // --- Filter state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilters, setSeverityFilters] = useState<MVSeverity[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortByOption>("loss");
  const [filterOpen, setFilterOpen] = useState(false);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sroFilter, setSroFilter] = useState("all");
  const [minTxns, setMinTxns] = useState("");
  const [minLoss, setMinLoss] = useState("");

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // --- Drawer ---
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<MVHotspotDetail | null>(null);

  // --- Map state ---
  const [mapView, setMapView] = useState<MapViewMode>("state");
  const [selectedSro, setSelectedSro] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  // --- Comparison state ---
  const [expandedPair, setExpandedPair] = useState<string | null>(null);

  const dashboard = mvTrendsData.dashboard;
  const quarters = [...mvTrendsData.quarters].reverse();

  // --- Filtered & sorted hotspots ---
  const filteredHotspots = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return hotspots
      .filter((item) => {
        if (searchQuery) {
          const haystack = `${item.location_label} ${item.sro_code} ${item.sro_name}`.toLowerCase();
          if (!haystack.includes(searchLower)) return false;
        }
        if (severityFilters.length && !severityFilters.includes(item.severity)) return false;
        if (typeFilter !== "all" && item.location_type !== typeFilter) return false;
        if (districtFilter !== "all" && item.district !== districtFilter) return false;
        if (sroFilter !== "all" && item.sro_code !== sroFilter) return false;
        if (minTxns && item.transaction_count < Number(minTxns)) return false;
        if (minLoss && item.estimated_loss < Number(minLoss)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "drr") return a.drr - b.drr;
        if (sortBy === "transactions") return b.transaction_count - a.transaction_count;
        if (sortBy === "severity") {
          const order: MVSeverity[] = ["Critical", "High", "Medium", "Watch", "Normal"];
          return order.indexOf(a.severity) - order.indexOf(b.severity);
        }
        return b.estimated_loss - a.estimated_loss;
      });
  }, [hotspots, searchQuery, severityFilters, typeFilter, districtFilter, sroFilter, minTxns, minLoss, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredHotspots.length / pageSize));
  const paginatedHotspots = filteredHotspots.slice((page - 1) * pageSize, page * pageSize);

  // --- Open hotspot detail drawer ---
  const openHotspot = useCallback(
    (item: MVHotspotItem) => {
      const detail = getMVHotspotDetail(item.case_id);
      if (!detail) {
        toast.error("Hotspot details unavailable");
        return;
      }
      setSelectedHotspot(detail);
      setDrawerOpen(true);
    },
    []
  );

  // --- Top rules ---
  const topRules: TopRule[] = useMemo(() => {
    const map = new Map<
      string,
      { rule_id: string; rule_name: string; count: number; impact: number; avg_drr: number }
    >();
    hotspots.forEach((h) => {
      h.rules_triggered.forEach((ruleId) => {
        const existing = map.get(ruleId) || {
          rule_id: ruleId,
          rule_name: ruleId,
          count: 0,
          impact: 0,
          avg_drr: 0,
        };
        existing.count += 1;
        existing.impact += h.estimated_loss;
        existing.avg_drr += h.drr;
        map.set(ruleId, existing);
      });
    });
    return Array.from(map.values())
      .map((item) => ({ ...item, avg_drr: Number((item.avg_drr / item.count).toFixed(2)) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [hotspots]);

  // --- Severity distribution ---
  const severityDistribution: SeverityDistributionItem[] = [
    { label: "Critical", count: dashboard.critical_hotspots, color: "#dc2626" },
    { label: "High", count: dashboard.high_hotspots, color: "#ea580c" },
    { label: "Medium", count: dashboard.medium_hotspots, color: "#f59e0b" },
    { label: "Watch", count: dashboard.watch_hotspots, color: "#0d9488" },
  ];

  // --- District data for map ---
  const districtDataList: DistrictData[] = useMemo(() => {
    const map = new Map<
      string,
      { drrs: number[]; hotspots: number; sros: Set<string>; txns: number; loss: number }
    >();
    sroTiles.forEach((tile) => {
      const entry = map.get(tile.district) || {
        drrs: [],
        hotspots: 0,
        sros: new Set<string>(),
        txns: 0,
        loss: 0,
      };
      entry.drrs.push(tile.avg_drr);
      entry.hotspots += tile.hotspot_count;
      entry.sros.add(tile.sro_code);
      entry.txns += tile.transaction_count;
      entry.loss += tile.estimated_loss;
      map.set(tile.district, entry);
    });
    return Array.from(map.entries()).map(([name, d]) => ({
      name,
      avgDrr: Number((d.drrs.reduce((s, v) => s + v, 0) / d.drrs.length).toFixed(2)),
      hotspotCount: d.hotspots,
      sroCount: d.sros.size,
      transactionCount: d.txns,
      estimatedLoss: d.loss,
    }));
  }, [sroTiles]);

  return {
    // View
    activeView,
    setActiveView,
    selectedQuarter,
    setSelectedQuarter,
    quarters,
    dashboard,

    // Data
    hotspots,
    sroTiles,
    officePairs,
    rateCardAnomalies,
    declaredTrends,
    seasonalPatterns,

    // Filters
    searchQuery,
    setSearchQuery,
    severityFilters,
    setSeverityFilters,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    filterOpen,
    setFilterOpen,
    districtFilter,
    setDistrictFilter,
    sroFilter,
    setSroFilter,
    minTxns,
    setMinTxns,
    minLoss,
    setMinLoss,

    // Pagination
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    filteredHotspots,
    paginatedHotspots,

    // Drawer
    drawerOpen,
    setDrawerOpen,
    selectedHotspot,
    openHotspot,

    // Map
    mapView,
    setMapView,
    selectedSro,
    setSelectedSro,
    selectedDistrict,
    setSelectedDistrict,

    // Comparison
    expandedPair,
    setExpandedPair,

    // Derived
    topRules,
    severityDistribution,
    districtDataList,
  };
}
