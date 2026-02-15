"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import type { FinancialRow, PeriodNode, SubsidiaryNode } from "@/lib/balance-sheet-api";
import type { ViewMode, DisplayMode } from "../types";
import {
  defaultFilters,
  PERIOD_STRUCTURE,
  SUBSIDIARY_STRUCTURE,
  DOORDASH_DATA,
  WOLT_DATA,
} from "../constants";
import { useBalanceSheet as useBalanceSheetData } from "@/hooks/data";
import type { BalanceSheetNode } from "@/lib/data/types";

// Helper to get all leaf nodes (selectable items)
const getLeafNodes = (
  nodes: PeriodNode[] | SubsidiaryNode[],
  type: "period" | "subsidiary"
): string[] => {
  const leaves: string[] = [];
  nodes.forEach((node) => {
    if (!node.children || node.children.length === 0) {
      leaves.push(type === "period" ? (node as PeriodNode).label : (node as SubsidiaryNode).label);
    } else {
      leaves.push(...getLeafNodes(node.children, type));
    }
  });
  return leaves;
};

// Filter period nodes based on search
const filterPeriodNodes = (nodes: PeriodNode[], search: string): PeriodNode[] => {
  if (!search) return nodes;
  const lowerSearch = search.toLowerCase();
  const filtered: PeriodNode[] = [];
  nodes.forEach((node) => {
    const matches = node.label.toLowerCase().includes(lowerSearch);
    const children = node.children ? filterPeriodNodes(node.children, search) : [];
    if (matches || children.length > 0) {
      filtered.push({ ...node, children: children.length > 0 ? children : node.children });
    }
  });
  return filtered;
};

// Filter subsidiary nodes based on search
const filterSubsidiaryNodes = (nodes: SubsidiaryNode[], search: string): SubsidiaryNode[] => {
  if (!search) return nodes;
  const lowerSearch = search.toLowerCase();
  const filtered: SubsidiaryNode[] = [];
  nodes.forEach((node) => {
    const matches = node.label.toLowerCase().includes(lowerSearch);
    const children = node.children ? filterSubsidiaryNodes(node.children, search) : [];
    if (matches || children.length > 0) {
      filtered.push({ ...node, children: children.length > 0 ? children : node.children });
    }
  });
  return filtered;
};

// Transform BalanceSheetNode[] from the data layer into FinancialRow[] for the grid
function transformBalanceSheetNodes(nodes: BalanceSheetNode[]): FinancialRow[] {
  return nodes.map((node) => {
    const row: FinancialRow = {
      financialRow: node.label,
      level: node.level,
      group: node.group,
      expanded: node.isSummary,
    };
    // Map period-keyed values to q*_* fields
    Object.entries(node.values).forEach(([period, value]) => {
      if (value !== null) {
        (row as any)[period] = value;
      }
    });
    return row;
  });
}

export function useBalanceSheet() {
  const gridRef = useRef<AgGridReact>(null);

  // Fetch data from the new data layer
  const { data: balanceSheetNodes, loading: dataLoading, error: dataError } = useBalanceSheetData();

  // Applied filter states
  const [view, setView] = useState<ViewMode>(defaultFilters.defaultView);
  const [asOfPeriods, setAsOfPeriods] = useState<string[]>(defaultFilters.defaultPeriods);
  const [subsidiaries, setSubsidiaries] = useState<string[]>(defaultFilters.defaultSubsidiaries);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(defaultFilters.defaultDisplayMode);

  // Pending filter states (before clicking Go)
  const [pendingPeriods, setPendingPeriods] = useState<string[]>(defaultFilters.defaultPeriods);
  const [pendingSubsidiaries, setPendingSubsidiaries] = useState<string[]>(
    defaultFilters.defaultSubsidiaries
  );
  const [pendingView, setPendingView] = useState<ViewMode>(defaultFilters.defaultView);
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const [subsidiaryPopoverOpen, setSubsidiaryPopoverOpen] = useState(false);

  // Hierarchical filter states
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(["FY-2024"]));
  const [expandedSubsidiaries, setExpandedSubsidiaries] = useState<Set<string>>(
    new Set(["betaFoods-consolidated"])
  );
  const [periodSearch, setPeriodSearch] = useState("");
  const [subsidiarySearch, setSubsidiarySearch] = useState("");

  // Format helpers
  const formatCurrency = useMemo(
    () =>
      (value: number | undefined): string => {
        if (value === undefined || value === null) return "-";
        if (displayMode === "millions") {
          return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
        }
        const valueInFull = value * 1000000;
        return `$${valueInFull.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    [displayMode]
  );

  const formatPercent = useMemo(
    () =>
      (value: number | undefined): string => {
        if (value === undefined || value === null) return "-";
        return `${value.toFixed(2)}%`;
      },
    []
  );

  // Row class for styling
  const getRowClass = (params: any) => {
    if (params.data.level === 0) {
      return "bg-blue-50 font-bold";
    }
    return "";
  };

  // Handler functions
  const handleRemovePeriod = (period: string) => {
    setPendingPeriods((prev) => prev.filter((p) => p !== period));
  };

  const handleRemoveSubsidiary = (subsidiary: string) => {
    setPendingSubsidiaries((prev) => prev.filter((s) => s !== subsidiary));
  };

  const togglePeriodExpanded = (id: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSubsidiaryExpanded = (id: string) => {
    setExpandedSubsidiaries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePeriodToggle = (period: string, checked: boolean) => {
    if (checked) {
      const maxSelections = pendingView === "consolidated" ? 1 : 2;

      if (pendingPeriods.length >= maxSelections) {
        if (pendingView === "consolidated") {
          setPendingPeriods([period]);
          return;
        }
        if (
          (pendingView === "comparative" || pendingView === "trended") &&
          pendingPeriods.length >= 2
        ) {
          return;
        }
      }

      setPendingPeriods((prev) => {
        if (prev.includes(period)) {
          return prev;
        }
        return [...prev, period];
      });
    } else {
      setPendingPeriods((prev) => prev.filter((p) => p !== period));
    }
  };

  const handleSubsidiaryToggle = (subsidiary: string, checked: boolean) => {
    if (checked) {
      setPendingSubsidiaries((prev) => [...prev, subsidiary]);
    } else {
      setPendingSubsidiaries((prev) => prev.filter((s) => s !== subsidiary));
    }
  };

  const handleApplyFilters = () => {
    setAsOfPeriods([...pendingPeriods]);
    setSubsidiaries([...pendingSubsidiaries]);
    setView(pendingView);
    setPeriodPopoverOpen(false);
    setSubsidiaryPopoverOpen(false);
  };

  // Filtered tree nodes
  const filteredPeriodNodes = useMemo(
    () => filterPeriodNodes(PERIOD_STRUCTURE, periodSearch),
    [periodSearch]
  );
  const filteredSubsidiaryNodes = useMemo(
    () => filterSubsidiaryNodes(SUBSIDIARY_STRUCTURE, subsidiarySearch),
    [subsidiarySearch]
  );

  // Transform data-layer nodes into grid-compatible rows
  const dataLayerRows = useMemo(() => {
    if (balanceSheetNodes.length > 0) {
      return transformBalanceSheetNodes(balanceSheetNodes);
    }
    return null;
  }, [balanceSheetNodes]);

  // Filter the data based on selected filters
  // Prefer data-layer data when available; fall back to inline constants during loading or error
  const filteredData = useMemo(() => {
    if (subsidiaries.length === 0) {
      return [];
    }

    // Use data-layer data when available
    if (dataLayerRows && dataLayerRows.length > 0) {
      return [...dataLayerRows];
    }

    // Fallback to inline mock data
    if (
      subsidiaries.includes("BetaFoods, Inc. (Consolidated)") &&
      !subsidiaries.includes("Averra Oy (Consolidated)")
    ) {
      return [...DOORDASH_DATA];
    } else if (
      subsidiaries.includes("Averra Oy (Consolidated)") &&
      !subsidiaries.includes("BetaFoods, Inc. (Consolidated)")
    ) {
      return [...WOLT_DATA];
    } else {
      return [...DOORDASH_DATA];
    }
  }, [subsidiaries, asOfPeriods, dataLayerRows]);

  // Sync pending states when applied filters change
  useEffect(() => {
    setPendingPeriods([...asOfPeriods]);
    setPendingSubsidiaries([...subsidiaries]);
    setPendingView(view);
  }, [asOfPeriods, subsidiaries, view]);

  // Adjust period selections when view mode changes
  useEffect(() => {
    const maxSelections = pendingView === "consolidated" ? 1 : 2;
    if (pendingPeriods.length > maxSelections) {
      if (pendingView === "consolidated") {
        setPendingPeriods((prev) => prev.slice(0, 1));
      } else if (pendingView === "comparative" || pendingView === "trended") {
        setPendingPeriods((prev) => prev.slice(0, 2));
      }
    }
  }, [pendingView, pendingPeriods.length]);

  // Update grid when filtered data changes
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("rowData", filteredData);
    }
  }, [filteredData]);

  return {
    // Refs
    gridRef,

    // Data loading states
    dataLoading,
    dataError,

    // Applied filters
    view,
    asOfPeriods,
    subsidiaries,
    displayMode,
    setDisplayMode,

    // Pending filters
    pendingView,
    setPendingView,
    pendingPeriods,
    pendingSubsidiaries,

    // Popover states
    periodPopoverOpen,
    setPeriodPopoverOpen,
    subsidiaryPopoverOpen,
    setSubsidiaryPopoverOpen,

    // Hierarchical filter states
    expandedPeriods,
    expandedSubsidiaries,
    periodSearch,
    setPeriodSearch,
    subsidiarySearch,
    setSubsidiarySearch,

    // Format helpers
    formatCurrency,
    formatPercent,
    getRowClass,

    // Handlers
    handleRemovePeriod,
    handleRemoveSubsidiary,
    togglePeriodExpanded,
    toggleSubsidiaryExpanded,
    handlePeriodToggle,
    handleSubsidiaryToggle,
    handleApplyFilters,

    // Computed data
    filteredPeriodNodes,
    filteredSubsidiaryNodes,
    filteredData,
  };
}
