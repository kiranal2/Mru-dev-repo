"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { SignalsService, SignalListParams } from "../../services/SignalsService";
import { FiltersService } from "../../services/FiltersService";
import { ViewsService } from "../../services/ViewsService";
import { exportToCSV, parseCSV } from "../../utils/csv";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { INITIAL_NEW_PO_FORM } from "../constants";
import type { BulkActionModal, SortState, NewPOForm } from "../types";
import {
  MOCK_SUPPLIERS,
  MOCK_SEVERITY_COUNTS,
  MOCK_QUICKVIEW_COUNTS,
  MOCK_GROUPED_COUNTS,
  MOCK_METRICS,
  filterMockSignals,
  getMockSeverityCounts,
} from "../mock-data";

function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setAndPersist: React.Dispatch<React.SetStateAction<T>> = (newValue) => {
    setValue((prev) => {
      const resolved = typeof newValue === "function" ? (newValue as (prev: T) => T)(prev) : newValue;
      localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  };

  return [value, setAndPersist];
}

function useLocalStorageString(key: string, defaultValue: string): [string, (v: string) => void] {
  const [value, setValue] = useState<string>(() => {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setAndPersist = (newValue: string) => {
    try {
      localStorage.setItem(key, newValue);
    } catch {
      // ignore
    }
    setValue(newValue);
  };

  return [value, setAndPersist];
}

export function useMrp() {
  const queryClient = useQueryClient();

  // Persisted filter state
  const [searchQuery, setSearchQuery] = useLocalStorageString("workbench_searchQuery", "");
  const [selectedSuppliers, setSelectedSuppliers] = useLocalStorage<string[]>(
    "workbench_selectedSuppliers",
    []
  );
  const [selectedSeverities, setSelectedSeverities] = useLocalStorage<("HIGH" | "MEDIUM" | "LOW")[]>(
    "workbench_selectedSeverities",
    ["HIGH"]
  );
  const [selectedAIConfidence, setSelectedAIConfidence] = useLocalStorage<{ min: number; max: number }[]>(
    "workbench_selectedAIConfidence",
    []
  );
  const [quickView, setQuickView] = useLocalStorageString("workbench_quickView", "NEW");

  // UI state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState>({ field: "score", direction: "desc" });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [drawerSignalId, setDrawerSignalId] = useState<string | null>(null);
  const [bulkActionModal, setBulkActionModal] = useState<BulkActionModal>(null);
  const [counterDate, setCounterDate] = useState("");
  const [trackingMessage, setTrackingMessage] = useState(
    "Please provide tracking and ship plan for the selected PO lines."
  );
  const [escalateMessage, setEscalateMessage] = useState("Chronic noncompliance observed (3x).");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["NEW"]));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [newPOForm, setNewPOForm] = useState<NewPOForm>({ ...INITIAL_NEW_PO_FORM });

  // Query params
  const params: SignalListParams = {
    page,
    pageSize,
    q: searchQuery,
    supplierIds: selectedSuppliers,
    severities: selectedSeverities,
    aiConfidenceRanges: selectedAIConfidence,
    quickView,
    sort,
  };

  // Queries — each falls back to mock data on error or empty result
  const { data: signalsData, isLoading } = useQuery({
    queryKey: ["signals", params],
    queryFn: async () => {
      try {
        const result = await SignalsService.list(params);
        if (result.rows.length > 0) return result;
        // Supabase returned empty — use mock
        return filterMockSignals({
          quickView,
          severities: selectedSeverities,
          supplierIds: selectedSuppliers,
          q: searchQuery,
          sort,
          page,
          pageSize,
        });
      } catch {
        return filterMockSignals({
          quickView,
          severities: selectedSeverities,
          supplierIds: selectedSuppliers,
          q: searchQuery,
          sort,
          page,
          pageSize,
        });
      }
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      try {
        const result = await FiltersService.getSuppliers();
        return result.length > 0 ? result : MOCK_SUPPLIERS;
      } catch {
        return MOCK_SUPPLIERS;
      }
    },
  });

  const { data: severityCounts } = useQuery({
    queryKey: ["severity-counts", quickView],
    queryFn: async () => {
      try {
        const result = await FiltersService.getSeverityCounts(quickView);
        const total = result.HIGH + result.MEDIUM + result.LOW;
        return total > 0 ? result : getMockSeverityCounts(quickView);
      } catch {
        return getMockSeverityCounts(quickView);
      }
    },
    refetchInterval: false,
  });

  const { data: quickViewCounts } = useQuery({
    queryKey: ["quickview-counts"],
    queryFn: async () => {
      try {
        const result = await FiltersService.getQuickViewCounts();
        return result.NEW + result.MONITORING + result.COMPLETED > 0 ? result : MOCK_QUICKVIEW_COUNTS;
      } catch {
        return MOCK_QUICKVIEW_COUNTS;
      }
    },
    refetchInterval: false,
  });

  const { data: groupedCounts } = useQuery({
    queryKey: ["grouped-counts"],
    queryFn: async () => {
      try {
        const result = await FiltersService.getGroupedCounts();
        const total = result.NEW.total + result.MONITORING.total + result.COMPLETED.total;
        return total > 0 ? result : MOCK_GROUPED_COUNTS;
      } catch {
        return MOCK_GROUPED_COUNTS;
      }
    },
    refetchInterval: false,
  });

  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      try {
        const result = await FiltersService.getMetrics();
        return result.exceptionsCount > 0 ? result : MOCK_METRICS;
      } catch {
        return MOCK_METRICS;
      }
    },
    refetchInterval: false,
  });

  const rows = signalsData?.rows || [];
  const total = signalsData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Active signal for detail sheet (looked up from current rows)
  const activeSignal = useMemo(() => {
    if (!drawerSignalId) return null;
    return rows.find((r: any) => r.signal_id === drawerSignalId) || null;
  }, [drawerSignalId, rows]);

  // Invalidation helper
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["signals"] });
    queryClient.invalidateQueries({ queryKey: ["severity-counts"] });
    queryClient.invalidateQueries({ queryKey: ["quickview-counts"] });
    queryClient.invalidateQueries({ queryKey: ["grouped-counts"] });
    queryClient.invalidateQueries({ queryKey: ["metrics"] });
  };

  // Mutations
  const bulkActionMutation = useMutation({
    mutationFn: async ({
      signalIds,
      actionType,
      payload,
    }: {
      signalIds: string[];
      actionType: string;
      payload?: any;
    }) => {
      await Promise.all(
        signalIds.map((signalId) =>
          SignalsService.act(signalId, {
            type: actionType as "ACCEPT_COMMIT" | "COUNTER_DATE" | "REQUEST_TRACKING" | "ESCALATE",
            payload,
          })
        )
      );
    },
    onSuccess: () => {
      invalidateAll();
      setSelectedRows(new Set());
      setBulkActionModal(null);
      setCounterDate("");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const csvRows = parseCSV(text);
      return await SignalsService.uploadCSV(csvRows);
    },
    onSuccess: (result) => {
      setUploadResult(result.message);
      setUploadFile(null);
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error: any) => {
      setUploadResult(`Error: ${error.message}`);
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async (data: NewPOForm) => {
      const { data: poLine, error: poError } = await supabase
        .from("po_lines")
        .insert([
          {
            po_number: data.po_number,
            supplier_id: data.supplier_id || null,
            item: data.item || null,
            item_description: data.item_description || null,
            mrp_required_date: data.mrp_required_date || null,
            po_promise_date: data.po_promise_date || null,
            commit_date: data.commit_date || null,
            lead_date: data.lead_date || null,
            po_date: data.po_date || null,
            need_qty: data.need_qty ? parseFloat(data.need_qty) : null,
            uom: data.uom || null,
            org_code: data.org_code || null,
            supplier_action: data.supplier_action || null,
            supplier_commit: data.supplier_commit || null,
            delta_mrp: data.delta_mrp || null,
            quarter_end: data.quarter_end || null,
          },
        ])
        .select()
        .single();

      if (poError) throw poError;

      const mrpDate = data.mrp_required_date ? new Date(data.mrp_required_date) : null;
      const poPromiseDate = data.po_promise_date ? new Date(data.po_promise_date) : null;

      let signalType = "SIG_OTHER";
      let label = "New PO Line";
      let severity: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
      let recommendation = "MONITOR";

      if (mrpDate && poPromiseDate) {
        if (mrpDate < poPromiseDate) {
          signalType = "SIG_PULL_IN";
          label = "Pull-in Required";
          severity = "HIGH";
          recommendation = "COUNTER_DATE";
        } else if (mrpDate > poPromiseDate) {
          signalType = "SIG_PUSH_OUT";
          label = "Push-out Required";
          severity = "MEDIUM";
          recommendation = "COUNTER_DATE";
        }
      }

      const { error: signalError } = await supabase.from("signals").insert([
        {
          po_line_id: poLine.po_line_id,
          type: signalType,
          label,
          severity,
          recommendation,
          status: "NEW",
          rationale: "Manually created PO line",
          score: 50,
          is_open: true,
          ai_confidence: 0.95,
          current_workflow_status: "NEW",
        },
      ]);

      if (signalError) throw signalError;
      return poLine;
    },
    onSuccess: () => {
      setBulkActionModal(null);
      setNewPOForm({ ...INITIAL_NEW_PO_FORM });
      invalidateAll();
    },
  });

  // Handlers
  const handleSort = (field: string) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectAll = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((r: any) => r.signal_id)));
    }
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  const handleRowClick = (signalId: string) => {
    setDrawerSignalId(signalId);
  };

  const handleExport = () => {
    exportToCSV(rows, `exceptions-${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  const handleBulkAction = (action: BulkActionModal) => {
    if (action === "upload") {
      setBulkActionModal("upload");
      setUploadResult(null);
      return;
    }
    if (action === "new_po") {
      setBulkActionModal("new_po");
      return;
    }
    if (selectedRows.size === 0) {
      setCounterDate("");
      return;
    }

    if (action === "counter" && signalsData?.rows) {
      const selectedSignals = signalsData.rows.filter((signal: any) =>
        selectedRows.has(signal.signal_id)
      );

      if (selectedSignals.length > 0) {
        if (selectedSignals.length === 1) {
          const signal = selectedSignals[0] as any;
          if (signal.po_line.mrp_required_date) {
            setCounterDate(format(new Date(signal.po_line.mrp_required_date), "yyyy-MM-dd"));
          }
        } else {
          const latestMrpDate = selectedSignals.reduce(
            (latest: Date | null, signal: any) => {
              if (!signal.po_line.mrp_required_date) return latest;
              const currentDate = new Date(signal.po_line.mrp_required_date);
              return !latest || currentDate > latest ? currentDate : latest;
            },
            null as Date | null
          );

          if (latestMrpDate) {
            setCounterDate(format(latestMrpDate, "yyyy-MM-dd"));
          }
        }
      }
    }

    setBulkActionModal(action);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setUploadFile(file);
      setUploadResult(null);
    } else {
      alert("Please select a valid CSV file");
    }
  };

  const confirmUpload = () => {
    if (!uploadFile) return;
    uploadMutation.mutate(uploadFile);
  };

  const confirmBulkAction = () => {
    const signalIds = Array.from(selectedRows);

    switch (bulkActionModal) {
      case "accept":
        bulkActionMutation.mutate({ signalIds, actionType: "ACCEPT_COMMIT" });
        break;
      case "counter":
        if (!counterDate) {
          alert("Please select a date");
          return;
        }
        bulkActionMutation.mutate({
          signalIds,
          actionType: "COUNTER_DATE",
          payload: { new_commit_date: counterDate },
        });
        break;
      case "tracking":
        bulkActionMutation.mutate({
          signalIds,
          actionType: "REQUEST_TRACKING",
          payload: { message: trackingMessage },
        });
        break;
      case "escalate":
        bulkActionMutation.mutate({
          signalIds,
          actionType: "ESCALATE",
          payload: { message: escalateMessage },
        });
        break;
    }
  };

  const handleApplyView = (viewParams: Record<string, any>) => {
    if (viewParams.supplierIds) setSelectedSuppliers(viewParams.supplierIds);
    if (viewParams.severities) setSelectedSeverities(viewParams.severities);
    if (viewParams.aiConfidenceRanges) setSelectedAIConfidence(viewParams.aiConfidenceRanges);
    if (viewParams.quickView) setQuickView(viewParams.quickView);
    if (viewParams.sort) setSort(viewParams.sort);
    if (viewParams.pageSize) setPageSize(viewParams.pageSize);
    setPage(1);
  };

  const handleSaveView = async (name: string) => {
    await ViewsService.create(name, {
      q: searchQuery,
      supplierIds: selectedSuppliers,
      severities: selectedSeverities,
      aiConfidenceRanges: selectedAIConfidence,
      quickView,
      sort,
      pageSize,
    });
    queryClient.invalidateQueries({ queryKey: ["saved-views"] });
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const handleQuickViewClick = (viewKey: string, statusFilter?: string) => {
    if (viewKey.startsWith("SIG_") && statusFilter) {
      setQuickView(`${statusFilter}:${viewKey}`);
    } else {
      setQuickView(viewKey);
    }
  };

  const toggleRowSelection = (signalId: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(signalId)) {
      newSet.delete(signalId);
    } else {
      newSet.add(signalId);
    }
    setSelectedRows(newSet);
  };

  return {
    // Filter state
    searchQuery,
    setSearchQuery,
    selectedSuppliers,
    setSelectedSuppliers,
    selectedSeverities,
    setSelectedSeverities,
    selectedAIConfidence,
    quickView,

    // UI state
    page,
    setPage,
    pageSize,
    setPageSize,
    sort,
    selectedRows,
    sidebarCollapsed,
    setSidebarCollapsed,
    drawerSignalId,
    setDrawerSignalId,
    bulkActionModal,
    setBulkActionModal,
    counterDate,
    setCounterDate,
    trackingMessage,
    setTrackingMessage,
    escalateMessage,
    setEscalateMessage,
    uploadFile,
    uploadResult,
    setUploadResult,
    setUploadFile,
    fileInputRef,
    expandedGroups,
    autoRefresh,
    setAutoRefresh,
    showDashboard,
    setShowDashboard,
    newPOForm,
    setNewPOForm,

    // Data
    rows,
    total,
    totalPages,
    isLoading,
    suppliers,
    activeSignal,
    severityCounts,
    quickViewCounts,
    groupedCounts,
    metrics,

    // Mutations
    bulkActionMutation,
    uploadMutation,
    createPOMutation,

    // Handlers
    handleSort,
    handleSelectAll,
    clearSelection,
    handleRowClick,
    handleExport,
    handleBulkAction,
    handleFileSelect,
    confirmUpload,
    confirmBulkAction,
    handleApplyView,
    handleSaveView,
    toggleGroup,
    handleQuickViewClick,
    toggleRowSelection,
    invalidateAll,
  };
}
