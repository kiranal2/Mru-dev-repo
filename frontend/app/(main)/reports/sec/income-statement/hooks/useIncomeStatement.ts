"use client";

import { useState, useMemo, useEffect } from "react";
import { FinancialRow, PeriodNode, SubsidiaryNode } from "../types";
import { MOCK_DATA, WOLT_DATA, PERIOD_STRUCTURE, SUBSIDIARY_STRUCTURE } from "../constants";
import { useIncomeStatement as useIncomeStatementData } from "@/hooks/data";
import type { IncomeStatementLine } from "@/lib/data/types";

// Transform IncomeStatementLine[] from the data layer into FinancialRow[] for the grid
function transformIncomeStatementLines(lines: IncomeStatementLine[]): FinancialRow[] {
  return lines.map((line) => {
    const row: FinancialRow = {
      financialRow: line.label,
      level: line.level,
      group: line.group,
      expanded: line.isSummary,
    };
    // Map period-keyed values to dynamic fields
    Object.entries(line.values).forEach(([period, value]) => {
      if (value !== null) {
        (row as any)[period] = value;
      }
    });
    return row;
  });
}

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

export function useIncomeStatement() {
  // Fetch data from the new data layer
  const { data: incomeStatementLines, loading: dataLoading, error: dataError } = useIncomeStatementData();

  const [view, setView] = useState<"consolidated" | "comparative" | "trended">("comparative");
  const [asOfPeriods, setAsOfPeriods] = useState<string[]>(["Q1 2024", "Q2 2024"]);
  const [subsidiaries, setSubsidiaries] = useState<string[]>([
    "BetaFoods, Inc. (Consolidated)",
    "Averra Oy (Consolidated)",
  ]);
  const [displayMode, setDisplayMode] = useState<"millions" | "full">("millions");

  // Pending filter states (before clicking Go)
  const [pendingPeriods, setPendingPeriods] = useState<string[]>(["Q1 2024", "Q2 2024"]);
  const [pendingSubsidiaries, setPendingSubsidiaries] = useState<string[]>([
    "BetaFoods, Inc. (Consolidated)",
    "Averra Oy (Consolidated)",
  ]);
  const [pendingView, setPendingView] = useState<"consolidated" | "comparative" | "trended">(
    "comparative"
  );
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const [subsidiaryPopoverOpen, setSubsidiaryPopoverOpen] = useState(false);

  // Hierarchical filter states
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(["FY-2024"]));
  const [expandedSubsidiaries, setExpandedSubsidiaries] = useState<Set<string>>(
    new Set(["betaFoods-consolidated"])
  );
  const [periodSearch, setPeriodSearch] = useState("");
  const [subsidiarySearch, setSubsidiarySearch] = useState("");

  const formatCurrency = useMemo(
    () =>
      (value: number | undefined): string => {
        if (value === undefined || value === null) return "-";
        if (displayMode === "millions") {
          return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
        }
        // Convert from millions to full amount
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

  const filteredPeriodNodes = useMemo(
    () => filterPeriodNodes(PERIOD_STRUCTURE, periodSearch),
    [periodSearch]
  );
  const filteredSubsidiaryNodes = useMemo(
    () => filterSubsidiaryNodes(SUBSIDIARY_STRUCTURE, subsidiarySearch),
    [subsidiarySearch]
  );

  const handleApplyFilters = () => {
    setAsOfPeriods([...pendingPeriods]);
    setSubsidiaries([...pendingSubsidiaries]);
    setView(pendingView);
    setPeriodPopoverOpen(false);
    setSubsidiaryPopoverOpen(false);
  };

  // Transform data-layer lines into grid-compatible rows
  const dataLayerRows = useMemo(() => {
    if (incomeStatementLines.length > 0) {
      return transformIncomeStatementLines(incomeStatementLines);
    }
    return null;
  }, [incomeStatementLines]);

  // Filter the data based on selected filters (View, As Of, Subsidiary)
  // Prefer data-layer data when available; fall back to inline constants
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
      return [...MOCK_DATA];
    } else if (
      subsidiaries.includes("Averra Oy (Consolidated)") &&
      !subsidiaries.includes("BetaFoods, Inc. (Consolidated)")
    ) {
      return [...WOLT_DATA];
    } else {
      return [...MOCK_DATA];
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

  return {
    // Data loading states
    dataLoading,
    dataError,

    // Applied states
    view,
    asOfPeriods,
    subsidiaries,
    displayMode,
    setDisplayMode,
    filteredData,

    // Pending states
    pendingView,
    setPendingView,
    pendingPeriods,
    pendingSubsidiaries,

    // Popover states
    periodPopoverOpen,
    setPeriodPopoverOpen,
    subsidiaryPopoverOpen,
    setSubsidiaryPopoverOpen,

    // Hierarchical states
    expandedPeriods,
    expandedSubsidiaries,
    periodSearch,
    setPeriodSearch,
    subsidiarySearch,
    setSubsidiarySearch,

    // Formatters
    formatCurrency,
    formatPercent,

    // Handlers
    handleRemovePeriod,
    handleRemoveSubsidiary,
    togglePeriodExpanded,
    toggleSubsidiaryExpanded,
    handlePeriodToggle,
    handleSubsidiaryToggle,
    handleApplyFilters,

    // Filtered nodes
    filteredPeriodNodes,
    filteredSubsidiaryNodes,
  };
}
