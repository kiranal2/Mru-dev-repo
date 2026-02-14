"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import type { PeriodNode, SubsidiaryNode } from "@/lib/balance-sheet-api";
import type { AccountActivityRow } from "../types";
import {
  PERIOD_STRUCTURE,
  SUBSIDIARY_STRUCTURE,
  GL_ACCOUNTS,
  DEFAULT_START_PERIOD,
  DEFAULT_END_PERIOD,
  DEFAULT_GL_ACCOUNT,
  DEFAULT_SUBSIDIARIES,
} from "../constants";

export function useAccountActivity() {
  const gridRef = useRef<AgGridReact>(null);

  // Applied filter states
  const [startPeriod, setStartPeriod] = useState<string>(DEFAULT_START_PERIOD);
  const [endPeriod, setEndPeriod] = useState<string>(DEFAULT_END_PERIOD);
  const [glAccount, setGlAccount] = useState<string>(DEFAULT_GL_ACCOUNT);
  const [subsidiaries, setSubsidiaries] = useState<string[]>([...DEFAULT_SUBSIDIARIES]);
  const [currency, setCurrency] = useState<"USD" | "Functional">("USD");
  const [displayMode, setDisplayMode] = useState<"millions" | "full">("millions");

  // Pending filter states (before clicking Go)
  const [pendingStartPeriod, setPendingStartPeriod] = useState<string>(DEFAULT_START_PERIOD);
  const [pendingEndPeriod, setPendingEndPeriod] = useState<string>(DEFAULT_END_PERIOD);
  const [pendingGlAccount, setPendingGlAccount] = useState<string>(DEFAULT_GL_ACCOUNT);
  const [pendingSubsidiaries, setPendingSubsidiaries] = useState<string[]>([...DEFAULT_SUBSIDIARIES]);

  // Popover states
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const [subsidiaryPopoverOpen, setSubsidiaryPopoverOpen] = useState(false);
  const [glAccountPopoverOpen, setGlAccountPopoverOpen] = useState(false);

  // Hierarchical filter states
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(["FY-2024"]));
  const [expandedSubsidiaries, setExpandedSubsidiaries] = useState<Set<string>>(
    new Set(["betaFoods-consolidated"])
  );

  // Search states
  const [periodSearch, setPeriodSearch] = useState("");
  const [subsidiarySearch, setSubsidiarySearch] = useState("");
  const [glAccountSearch, setGlAccountSearch] = useState("");

  // Format currency based on display mode
  const formatCurrency = useMemo(
    () =>
      (value: number | undefined): string => {
        if (value === undefined || value === null) return "$0.00";
        if (displayMode === "millions") {
          const absValue = Math.abs(value);
          const sign = value < 0 ? "-" : "";
          return `${sign}$${absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
        }
        // Convert from millions to full amount
        const valueInFull = value * 1000000;
        const absValue = Math.abs(valueInFull);
        const sign = valueInFull < 0 ? "-" : "";
        return `${sign}$${absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    [displayMode]
  );

  // Filter period nodes based on search
  const filterPeriodNodes = useCallback(
    (nodes: PeriodNode[], search: string): PeriodNode[] => {
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
    },
    []
  );

  // Filter subsidiary nodes based on search
  const filterSubsidiaryNodes = useCallback(
    (nodes: SubsidiaryNode[], search: string): SubsidiaryNode[] => {
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
    },
    []
  );

  const togglePeriodExpanded = useCallback((id: string) => {
    setExpandedPeriods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSubsidiaryExpanded = useCallback((id: string) => {
    setExpandedSubsidiaries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSubsidiaryToggle = useCallback((label: string, checked: boolean) => {
    setPendingSubsidiaries((prev) => {
      if (checked) {
        return [label];
      } else {
        return prev.filter((s) => s !== label);
      }
    });
  }, []);

  const handleRemoveSubsidiary = useCallback((sub: string) => {
    setPendingSubsidiaries((prev) => prev.filter((s) => s !== sub));
  }, []);

  const filteredPeriodNodes = useMemo(
    () => filterPeriodNodes(PERIOD_STRUCTURE, periodSearch),
    [filterPeriodNodes, periodSearch]
  );

  const filteredSubsidiaryNodes = useMemo(
    () => filterSubsidiaryNodes(SUBSIDIARY_STRUCTURE, subsidiarySearch),
    [filterSubsidiaryNodes, subsidiarySearch]
  );

  const filteredGlAccounts = useMemo(() => {
    if (!glAccountSearch) return GL_ACCOUNTS;
    return GL_ACCOUNTS.filter((account) =>
      account.toLowerCase().includes(glAccountSearch.toLowerCase())
    );
  }, [glAccountSearch]);

  // Column definitions for AG Grid
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "type",
        headerName: "Type",
        flex: 2,
        minWidth: 150,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          return (
            <a href="#" className="text-blue-600 underline hover:text-blue-800">
              {params.value}
            </a>
          );
        },
      },
      {
        field: "date",
        headerName: "Date",
        flex: 2,
        minWidth: 150,
        sortable: true,
        filter: true,
      },
      {
        field: "documentNumber",
        headerName: "Document Number",
        flex: 3,
        minWidth: 200,
        sortable: true,
        filter: true,
      },
      {
        field: "name",
        headerName: "Name",
        flex: 3,
        minWidth: 200,
        sortable: true,
        filter: true,
      },
      {
        field: "credit",
        headerName: "Credit",
        flex: 2.5,
        minWidth: 180,
        sortable: true,
        filter: true,
        valueFormatter: (params) => {
          if (params.value === 0 || params.value === null || params.value === undefined)
            return "$0.00";
          if (params.value < 0) {
            return formatCurrency(Math.abs(params.value)).replace("$", "-$");
          }
          return formatCurrency(params.value);
        },
        cellStyle: { textAlign: "right" },
      },
      {
        field: "debit",
        headerName: "Debit",
        flex: 2.5,
        minWidth: 180,
        sortable: true,
        filter: true,
        valueFormatter: (params) => {
          if (params.value === 0 || params.value === null || params.value === undefined)
            return "$0.00";
          return formatCurrency(params.value);
        },
        cellStyle: { textAlign: "right" },
      },
      {
        field: "memo",
        headerName: "Memo",
        flex: 4,
        minWidth: 250,
        sortable: true,
        filter: true,
      },
    ],
    [formatCurrency]
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  const handleApplyFilters = useCallback(() => {
    setStartPeriod(pendingStartPeriod);
    setEndPeriod(pendingEndPeriod);
    setGlAccount(pendingGlAccount);
    setSubsidiaries([...pendingSubsidiaries]);
    setPeriodPopoverOpen(false);
    setSubsidiaryPopoverOpen(false);
    setGlAccountPopoverOpen(false);
  }, [pendingStartPeriod, pendingEndPeriod, pendingGlAccount, pendingSubsidiaries]);

  const handleExportCSV = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `account-activity-${glAccount.replace(" ", "-").toLowerCase()}.csv`,
      });
    }
  }, [glAccount]);

  return {
    // Refs
    gridRef,

    // Applied filter states
    glAccount,
    currency,
    setCurrency,
    displayMode,
    setDisplayMode,

    // Pending filter states
    pendingStartPeriod,
    setPendingStartPeriod,
    pendingEndPeriod,
    setPendingEndPeriod,
    pendingGlAccount,
    setPendingGlAccount,
    pendingSubsidiaries,

    // Popover states
    periodPopoverOpen,
    setPeriodPopoverOpen,
    subsidiaryPopoverOpen,
    setSubsidiaryPopoverOpen,
    glAccountPopoverOpen,
    setGlAccountPopoverOpen,

    // Search states
    periodSearch,
    setPeriodSearch,
    subsidiarySearch,
    setSubsidiarySearch,
    glAccountSearch,
    setGlAccountSearch,

    // Expanded states
    expandedPeriods,
    expandedSubsidiaries,

    // Computed values
    formatCurrency,
    filteredPeriodNodes,
    filteredSubsidiaryNodes,
    filteredGlAccounts,
    columnDefs,
    defaultColDef,

    // Handlers
    togglePeriodExpanded,
    toggleSubsidiaryExpanded,
    handleSubsidiaryToggle,
    handleRemoveSubsidiary,
    handleApplyFilters,
    handleExportCSV,
  };
}
