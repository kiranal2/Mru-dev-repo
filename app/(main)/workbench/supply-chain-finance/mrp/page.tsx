"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Search,
  Download,
  Upload,
  Plus,
  CheckSquare,
  Square,
  PanelLeftClose,
  PanelLeft,
  X,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Package,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignalsService, SignalListParams } from "../services/SignalsService";
import { FiltersService } from "../services/FiltersService";
import { ViewsService } from "../services/ViewsService";
import { exportToCSV, parseCSV } from "../utils/csv";
import { supabase } from "../lib/supabase";
import { SignalDrawer } from "../components/SignalDrawer";
import { ViewsMenu } from "../components/ViewsMenu";
import { DashboardMetrics } from "../components/DashboardMetrics";
import { format } from "date-fns";

type BulkActionModal = "accept" | "counter" | "tracking" | "escalate" | "upload" | "new_po" | null;

export default function WorkbenchPage() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem("workbench_searchQuery") || "";
  });
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(() => {
    const saved = localStorage.getItem("workbench_selectedSuppliers");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedSeverities, setSelectedSeverities] = useState<("HIGH" | "MEDIUM" | "LOW")[]>(
    () => {
      const saved = localStorage.getItem("workbench_selectedSeverities");
      return saved ? JSON.parse(saved) : ["HIGH"];
    }
  );
  const [selectedAIConfidence, setSelectedAIConfidence] = useState<{ min: number; max: number }[]>(
    () => {
      const saved = localStorage.getItem("workbench_selectedAIConfidence");
      return saved ? JSON.parse(saved) : [];
    }
  );
  const [quickView, setQuickView] = useState(() => {
    return localStorage.getItem("workbench_quickView") || "NEW";
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>({
    field: "score",
    direction: "desc",
  });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerSignalId, setDrawerSignalId] = useState<string | null>(null);
  const [bulkActionModal, setBulkActionModal] = useState<BulkActionModal>(null);
  const [counterDate, setCounterDate] = useState("");
  const [trackingMessage, setTrackingMessage] = useState(
    "Please provide tracking and ship plan for the selected PO lines."
  );
  const [escalateMessage, setEscalateMessage] = useState("Chronic noncompliance observed (3x).");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["NEW"]));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [newPOForm, setNewPOForm] = useState({
    po_number: "",
    supplier_id: "",
    item: "",
    item_description: "",
    mrp_required_date: "",
    po_promise_date: "",
    commit_date: "",
    lead_date: "",
    po_date: "",
    need_qty: "",
    uom: "",
    org_code: "",
    supplier_action: "",
    supplier_commit: "",
    delta_mrp: "",
    quarter_end: "",
  });

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

  const { data: signalsData, isLoading } = useQuery({
    queryKey: ["signals", params],
    queryFn: () => SignalsService.list(params),
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => FiltersService.getSuppliers(),
  });

  const { data: severityCounts } = useQuery({
    queryKey: ["severity-counts", quickView],
    queryFn: () => FiltersService.getSeverityCounts(quickView),
    refetchInterval: false,
  });

  const { data: quickViewCounts } = useQuery({
    queryKey: ["quickview-counts"],
    queryFn: () => FiltersService.getQuickViewCounts(),
    refetchInterval: false,
  });

  const { data: groupedCounts } = useQuery({
    queryKey: ["grouped-counts"],
    queryFn: () => FiltersService.getGroupedCounts(),
    refetchInterval: false,
  });

  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: () => FiltersService.getMetrics(),
    refetchInterval: false,
  });

  useEffect(() => {
    localStorage.setItem("workbench_searchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem("workbench_selectedSuppliers", JSON.stringify(selectedSuppliers));
  }, [selectedSuppliers]);

  useEffect(() => {
    localStorage.setItem("workbench_selectedSeverities", JSON.stringify(selectedSeverities));
  }, [selectedSeverities]);

  useEffect(() => {
    localStorage.setItem("workbench_selectedAIConfidence", JSON.stringify(selectedAIConfidence));
  }, [selectedAIConfidence]);

  useEffect(() => {
    localStorage.setItem("workbench_quickView", quickView);
  }, [quickView]);

  const rows = signalsData?.rows || [];
  const total = signalsData?.total || 0;

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
      setSelectedRows(new Set(rows.map((r) => r.signal_id)));
    }
  };

  const handleRowClick = (signalId: string) => {
    setDrawerSignalId(signalId);
  };

  const handleExport = () => {
    exportToCSV(rows, `exceptions-${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

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
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["severity-counts"] });
      queryClient.invalidateQueries({ queryKey: ["quickview-counts"] });
      queryClient.invalidateQueries({ queryKey: ["grouped-counts"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
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
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["severity-counts"] });
      queryClient.invalidateQueries({ queryKey: ["quickview-counts"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error: any) => {
      setUploadResult(`Error: ${error.message}`);
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async (data: typeof newPOForm) => {
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

      // Create a signal for the new PO line
      const mrpDate = data.mrp_required_date ? new Date(data.mrp_required_date) : null;
      const poPromiseDate = data.po_promise_date ? new Date(data.po_promise_date) : null;

      let signalType = "SIG_OTHER";
      let label = "New PO Line";
      let severity: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
      let recommendation = "MONITOR";

      // Determine signal type based on dates
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
          label: label,
          severity: severity,
          recommendation: recommendation,
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
      setNewPOForm({
        po_number: "",
        supplier_id: "",
        item: "",
        item_description: "",
        mrp_required_date: "",
        po_promise_date: "",
        commit_date: "",
        lead_date: "",
        po_date: "",
        need_qty: "",
        uom: "",
        org_code: "",
        supplier_action: "",
        supplier_commit: "",
        delta_mrp: "",
        quarter_end: "",
      });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["severity-counts"] });
      queryClient.invalidateQueries({ queryKey: ["quickview-counts"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });

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

    // Calculate intelligent counter date for counter action
    if (action === "counter" && signalsData?.rows) {
      const selectedSignals = signalsData.rows.filter((signal) =>
        selectedRows.has(signal.signal_id)
      );

      if (selectedSignals.length > 0) {
        // For single selection, use the MRP Required Date
        if (selectedSignals.length === 1) {
          const signal = selectedSignals[0];
          if (signal.po_line.mrp_required_date) {
            setCounterDate(format(new Date(signal.po_line.mrp_required_date), "yyyy-MM-dd"));
          }
        } else {
          // For multiple selections, find the latest MRP Required Date
          const latestMrpDate = selectedSignals.reduce(
            (latest, signal) => {
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/supply-chain-finance/mrp" className="mb-1.5" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-slate-700" />
            <h1 className="text-2xl font-bold text-[#000000] mt-2">MRP Workbench</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("upload")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full overflow-hidden bg-white text-gray-900">
          <aside
            className={`border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-0 overflow-hidden" : "w-80"}`}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search PO Lines, Suppliers, Exceptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-slate-600 mb-2 block">Supplier</label>
                <div className="space-y-1">
                  <Button
                    variant={selectedSuppliers.length === 0 ? "default" : "outline"}
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setSelectedSuppliers([])}
                  >
                    All Suppliers
                  </Button>
                  {suppliers?.map((s) => (
                    <Button
                      key={s.supplier_id}
                      variant={selectedSuppliers.includes(s.supplier_id) ? "default" : "outline"}
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setSelectedSuppliers([s.supplier_id])}
                    >
                      {s.supplier_name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-slate-600 mb-2 block">Severity</label>
                <div className="flex gap-2">
                  {(["HIGH", "MEDIUM", "LOW"] as const).map((severity) => {
                    const isSelected = selectedSeverities.includes(severity);
                    const colorMap: Record<
                      "HIGH" | "MEDIUM" | "LOW",
                      {
                        bg: string;
                        text: string;
                        border: string;
                        hoverBg: string;
                        hoverText: string;
                      }
                    > = {
                      HIGH: {
                        bg: "bg-red-50",
                        text: "text-red-700",
                        border: "border-red-200",
                        hoverBg: "hover:bg-red-100",
                        hoverText: "hover:text-red-800",
                      },
                      MEDIUM: {
                        bg: "bg-amber-50",
                        text: "text-amber-700",
                        border: "border-amber-200",
                        hoverBg: "hover:bg-amber-100",
                        hoverText: "hover:text-amber-800",
                      },
                      LOW: {
                        bg: "bg-green-50",
                        text: "text-green-700",
                        border: "border-green-200",
                        hoverBg: "hover:bg-green-100",
                        hoverText: "hover:text-green-800",
                      },
                    };
                    const colors = colorMap[severity];
                    return (
                      <Button
                        key={severity}
                        variant="outline"
                        size="sm"
                        className={`flex-1 text-xs ${
                          isSelected
                            ? `${colors.bg} ${colors.text} ${colors.border} ${colors.hoverBg} ${colors.hoverText}`
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedSeverities((prev) =>
                            prev.includes(severity)
                              ? prev.filter((s) => s !== severity)
                              : [...prev, severity]
                          );
                        }}
                      >
                        {severity}
                        {severityCounts && (
                          <span className="ml-1">({severityCounts[severity]})</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Quick Views</h3>
              <div className="space-y-1">
                {[
                  { key: "NEW", label: "New Exceptions" },
                  { key: "MONITORING", label: "Monitoring" },
                  { key: "COMPLETED", label: "Completed" },
                ].map((statusGroup) => {
                  const isExpanded = expandedGroups.has(statusGroup.key);
                  const groupData = groupedCounts?.[statusGroup.key as keyof typeof groupedCounts];
                  const isActive =
                    quickView === statusGroup.key || quickView.startsWith(`${statusGroup.key}:`);

                  return (
                    <div key={statusGroup.key} className="space-y-1">
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-between"
                        size="sm"
                        onClick={() => {
                          toggleGroup(statusGroup.key);
                          handleQuickViewClick(statusGroup.key);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>{statusGroup.label}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {groupData?.total || 0}
                        </Badge>
                      </Button>

                      {isExpanded && groupData && (
                        <div className="ml-6 space-y-1">
                          {[
                            { key: "SIG_PULL_IN", label: "MRP Required < Supplier Commit" },
                            { key: "SIG_PUSH_OUT", label: "MRP Required > Supplier Commit" },
                            { key: "SIG_ACKNOWLEDGE", label: "Acknowledge" },
                            { key: "SIG_NO_ACK_T5", label: "No Ack T+5" },
                            { key: "SIG_OK_CONFIRM", label: "OK/Confirm" },
                            { key: "SIG_PAST_DUE", label: "Past Due" },
                            { key: "SIG_CANCEL", label: "Cancel" },
                            { key: "SIG_PARTIAL_COMMIT", label: "Partial Commit" },
                            { key: "SIG_CANCEL_REQUEST", label: "Cancel Request" },
                            { key: "SIG_SUPPLIER_NO_RESPONSE", label: "Supplier No Response" },
                          ].map((exceptionType) => {
                            const count =
                              groupData[exceptionType.key as keyof typeof groupData] || 0;
                            const isTypeActive =
                              quickView === `${statusGroup.key}:${exceptionType.key}`;

                            return (
                              <Button
                                key={exceptionType.key}
                                variant={isTypeActive ? "default" : "ghost"}
                                className="w-full justify-between text-xs"
                                size="sm"
                                onClick={() =>
                                  handleQuickViewClick(exceptionType.key, statusGroup.key)
                                }
                              >
                                <span>{exceptionType.label}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {count}
                                </Badge>
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-3 py-1">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="h-5 w-5" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5" />
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDashboard(!showDashboard)}
                    title="Toggle Dashboard"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                  </Button>

                  <Button
                    onClick={() => handleBulkAction("new_po")}
                    size="sm"
                    title="Create New PO Line"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New PO Line
                  </Button>

                  <ViewsMenu onApply={handleApplyView} onSave={handleSaveView} />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {showDashboard && (
                <div className="p-6 pt-4">
                  <DashboardMetrics
                    autoRefresh={autoRefresh}
                    onToggleRefresh={() => setAutoRefresh(!autoRefresh)}
                  />
                </div>
              )}

              <div className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="flex items-center gap-2"
                    >
                      {selectedRows.size === rows.length && rows.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      Select All
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedRows.size === 0}
                        onClick={() => handleBulkAction("accept")}
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 disabled:opacity-50"
                      >
                        Accept Commit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedRows.size === 0}
                        onClick={() => handleBulkAction("counter")}
                        className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 disabled:opacity-50"
                      >
                        Counter-Date
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedRows.size === 0}
                        onClick={() => handleBulkAction("tracking")}
                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50"
                      >
                        Request Tracking
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedRows.size === 0}
                        onClick={() => handleBulkAction("escalate")}
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 disabled:opacity-50"
                      >
                        Escalate
                      </Button>
                    </div>
                  </div>

                  {metrics && (
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-slate-600">Auto-clear:</span>{" "}
                        <span className="text-green-600 font-medium">
                          {metrics.autoClearPercent}%
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-600">Exceptions:</span>{" "}
                        <span className="text-[#000000] font-medium">
                          {metrics.exceptionsCount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
                    <tr>
                      <th className="p-3 text-left">
                        <input type="checkbox" />
                      </th>
                      <SortableHeader
                        label="PO Number"
                        field="po_number"
                        sort={sort}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Supplier Name"
                        field="supplier_name"
                        sort={sort}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="PO Date"
                        field="po_date"
                        sort={sort}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="PO Promised Date"
                        field="supplier_commit"
                        sort={sort}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="MRP Required Date"
                        field="mrp_required_date"
                        sort={sort}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Supplier Action"
                        field="supplier_action"
                        sort={sort}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Supplier Commit"
                        field="po_promise_date"
                        sort={sort}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Exception"
                        field="label"
                        sort={sort}
                        onSort={handleSort}
                        aiGenerated={true}
                      />
                      <SortableHeader
                        label="Severity"
                        field="severity"
                        sort={sort}
                        onSort={handleSort}
                        aiGenerated={true}
                      />
                      <SortableHeader
                        label="Recommendation"
                        field="recommendation"
                        sort={sort}
                        onSort={handleSort}
                        aiGenerated={true}
                      />
                      <SortableHeader
                        label="Status"
                        field="status"
                        sort={sort}
                        onSort={handleSort}
                        aiGenerated={true}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-500">
                          Loading...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-500">
                          No exceptions found
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.signal_id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(row.signal_id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedRows);
                                if (newSet.has(row.signal_id)) {
                                  newSet.delete(row.signal_id);
                                } else {
                                  newSet.add(row.signal_id);
                                }
                                setSelectedRows(newSet);
                              }}
                            />
                          </td>
                          <td
                            className="p-3 text-sm font-medium cursor-pointer hover:text-blue-400 transition whitespace-nowrap"
                            onClick={() => handleRowClick(row.signal_id)}
                          >
                            {row.po_line.po_number}
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            {row.supplier.supplier_name}
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            {row.po_line.po_date
                              ? format(new Date(row.po_line.po_date), "MMM dd, yyyy")
                              : "-"}
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            {(row.po_line as any).supplier_commit
                              ? format(
                                  new Date((row.po_line as any).supplier_commit),
                                  "MMM dd, yyyy"
                                )
                              : "-"}
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            {row.po_line.mrp_required_date
                              ? format(new Date(row.po_line.mrp_required_date), "MMM dd, yyyy")
                              : "-"}
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            <SupplierActionBadge action={row.po_line.supplier_action} />
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            {row.po_line.po_promise_date
                              ? format(new Date(row.po_line.po_promise_date), "MMM dd, yyyy")
                              : "-"}
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">{row.label}</td>
                          <td className="p-3 whitespace-nowrap">
                            <SeverityBadge severity={row.severity} />
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            {row.recommendation || row.recommended || "-"}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <StatusBadge status={row.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">
                    Showing {Math.min((page - 1) * pageSize + 1, total)} to{" "}
                    {Math.min(page * pageSize, total)} of {total}
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {drawerSignalId && (
        <SignalDrawer
          signalId={drawerSignalId}
          onClose={() => setDrawerSignalId(null)}
          onAction={() => {
            queryClient.invalidateQueries({ queryKey: ["signals"] });
            queryClient.invalidateQueries({ queryKey: ["severity-counts"] });
            queryClient.invalidateQueries({ queryKey: ["quickview-counts"] });
            queryClient.invalidateQueries({ queryKey: ["metrics"] });
          }}
        />
      )}

      {bulkActionModal === "accept" && (
        <Modal
          title="Accept Commit"
          onClose={() => setBulkActionModal(null)}
          onConfirm={confirmBulkAction}
          confirmLabel="Confirm"
          confirmColor="green"
          isLoading={bulkActionMutation.isPending}
        >
          <p className="text-slate-700">
            Accept commits for {selectedRows.size} selected line{selectedRows.size > 1 ? "s" : ""}?
          </p>
        </Modal>
      )}

      {bulkActionModal === "counter" && (
        <Modal
          title="Counter-Date"
          onClose={() => {
            setBulkActionModal(null);
            setCounterDate("");
          }}
          onConfirm={confirmBulkAction}
          confirmLabel="Confirm"
          confirmColor="amber"
          isLoading={bulkActionMutation.isPending}
        >
          <p className="text-slate-700 mb-4">
            Proposed date for {selectedRows.size} line{selectedRows.size > 1 ? "s" : ""}:
          </p>
          {counterDate && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-700">
                Suggested: {format(new Date(counterDate), "dd-MMM-yyyy")}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {selectedRows.size === 1
                  ? "Based on MRP Required Date for this PO line"
                  : `Based on the latest MRP Required Date across ${selectedRows.size} selected lines`}
              </p>
            </div>
          )}
          <div>
            <label className="text-sm text-slate-700 mb-2 block">Proposed date</label>
            <Input
              type="date"
              value={counterDate}
              onChange={(e) => setCounterDate(e.target.value)}
              placeholder="dd/mm/yyyy"
            />
          </div>
        </Modal>
      )}

      {bulkActionModal === "tracking" && (
        <Modal
          title="Request Tracking"
          onClose={() => setBulkActionModal(null)}
          onConfirm={confirmBulkAction}
          confirmLabel="Confirm"
          confirmColor="blue"
          isLoading={bulkActionMutation.isPending}
        >
          <div>
            <label className="text-sm text-slate-700 mb-2 block">Message</label>
            <Textarea
              value={trackingMessage}
              onChange={(e) => setTrackingMessage(e.target.value)}
              placeholder="Enter message..."
            />
          </div>
        </Modal>
      )}

      {bulkActionModal === "escalate" && (
        <Modal
          title="Escalate"
          onClose={() => setBulkActionModal(null)}
          onConfirm={confirmBulkAction}
          confirmLabel="Confirm"
          confirmColor="red"
          isLoading={bulkActionMutation.isPending}
        >
          <p className="text-slate-700 mb-4">
            Escalate to AM and supplier exec for {selectedRows.size} line
            {selectedRows.size > 1 ? "s" : ""}. Add context:
          </p>
          <Textarea
            value={escalateMessage}
            onChange={(e) => setEscalateMessage(e.target.value)}
            placeholder="Enter escalation context..."
          />
        </Modal>
      )}

      {bulkActionModal === "upload" && (
        <Modal
          title="Upload CSV"
          onClose={() => {
            setBulkActionModal(null);
            setUploadFile(null);
            setUploadResult(null);
          }}
          onConfirm={confirmUpload}
          confirmLabel="Upload"
          confirmColor="blue"
          isLoading={uploadMutation.isPending}
        >
          <div className="space-y-4">
            <p className="text-slate-700">
              Upload a CSV file with PO line exceptions. Only unique PO lines that don't already
              exist will be imported.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadFile ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadFile.name}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Click to select CSV file
                </>
              )}
            </Button>

            {uploadResult && (
              <div
                className={`p-3 rounded ${
                  uploadResult.startsWith("Error")
                    ? "bg-red-500/20 text-red-400 border border-red-500"
                    : "bg-green-500/20 text-green-400 border border-green-500"
                }`}
              >
                {uploadResult}
              </div>
            )}

            <div className="text-xs text-slate-600">
              <p className="font-semibold mb-1">Expected CSV format:</p>
              <p>
                PO Line, Supplier, Org, Item, PO Promise, MRP, Supplier Action, Commit, Lead Date,
                Exception, Severity, Recommended, Status, Rationale
              </p>
            </div>
          </div>
        </Modal>
      )}

      {bulkActionModal === "new_po" && (
        <Modal
          title="Create New PO Line"
          onClose={() => setBulkActionModal(null)}
          onConfirm={() => createPOMutation.mutate(newPOForm)}
          confirmLabel="Create"
          confirmColor="blue"
          isLoading={createPOMutation.isPending}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-2 block">PO Number *</label>
                <Input
                  type="text"
                  value={newPOForm.po_number}
                  onChange={(e) => setNewPOForm({ ...newPOForm, po_number: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 mb-2 block">Supplier</label>
                <Select
                  value={newPOForm.supplier_id}
                  onValueChange={(value) => setNewPOForm({ ...newPOForm, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((s) => (
                      <SelectItem key={s.supplier_id} value={s.supplier_id}>
                        {s.supplier_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Item</label>
                <Input
                  type="text"
                  value={newPOForm.item}
                  onChange={(e) => setNewPOForm({ ...newPOForm, item: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 mb-2 block">Org Code</label>
                <Input
                  type="text"
                  value={newPOForm.org_code}
                  onChange={(e) => setNewPOForm({ ...newPOForm, org_code: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-600 mb-2 block">Item Description</label>
              <Input
                type="text"
                value={newPOForm.item_description}
                onChange={(e) => setNewPOForm({ ...newPOForm, item_description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Need Qty</label>
                <Input
                  type="number"
                  value={newPOForm.need_qty}
                  onChange={(e) => setNewPOForm({ ...newPOForm, need_qty: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 mb-2 block">UOM</label>
                <Input
                  type="text"
                  value={newPOForm.uom}
                  onChange={(e) => setNewPOForm({ ...newPOForm, uom: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Dates</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">PO Date</label>
                  <Input
                    type="date"
                    value={newPOForm.po_date}
                    onChange={(e) => setNewPOForm({ ...newPOForm, po_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-2 block">MRP Required Date</label>
                  <Input
                    type="date"
                    value={newPOForm.mrp_required_date}
                    onChange={(e) =>
                      setNewPOForm({ ...newPOForm, mrp_required_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">PO Promise Date</label>
                  <Input
                    type="date"
                    value={newPOForm.po_promise_date}
                    onChange={(e) =>
                      setNewPOForm({ ...newPOForm, po_promise_date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Commit Date</label>
                  <Input
                    type="date"
                    value={newPOForm.commit_date}
                    onChange={(e) => setNewPOForm({ ...newPOForm, commit_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Supplier Commit</label>
                  <Input
                    type="date"
                    value={newPOForm.supplier_commit}
                    onChange={(e) =>
                      setNewPOForm({ ...newPOForm, supplier_commit: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Lead Date</label>
                  <Input
                    type="date"
                    value={newPOForm.lead_date}
                    onChange={(e) => setNewPOForm({ ...newPOForm, lead_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel,
  confirmColor,
  isLoading,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmColor: "green" | "amber" | "blue" | "red";
  isLoading?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const getButtonVariant = (color: string) => {
    if (color === "green") return "secondary";
    if (color === "amber") return "secondary";
    if (color === "red") return "destructive";
    return "default";
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#000000]">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-6">{children}</div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={getButtonVariant(confirmColor) as any}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}

function SortableHeader({
  label,
  field,
  sort,
  onSort,
  aiGenerated = false,
  highlighted = false,
}: {
  label: string;
  field: string;
  sort: { field: string; direction: "asc" | "desc" };
  onSort: (field: string) => void;
  aiGenerated?: boolean;
  highlighted?: boolean;
}) {
  return (
    <th
      onClick={() => onSort(field)}
      className={`p-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-gray-700 transition ${
        aiGenerated
          ? "text-blue-600 bg-blue-50"
          : highlighted
            ? "text-amber-600 bg-amber-50"
            : "text-slate-600"
      }`}
    >
      <div className="flex items-center gap-1">
        {label}
        {sort.field === field && (
          <span className="text-[#0A3B77]">{sort.direction === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </th>
  );
}

function SupplierActionBadge({ action }: { action: string | null }) {
  if (!action) return <span className="text-slate-500">-</span>;

  const normalizedAction = action.toUpperCase();

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    "PUSH OUT": {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    "PULL IN": {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    "PULL OUT": {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    "PAST DUE": {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    CANCEL: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    CONFIRM: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    OK: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    "OK/CONFIRM": {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    ACKNOWLEDGE: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
    },
    EXPEDITE: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    "ON TIME": {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
  };

  const colors = colorMap[normalizedAction] || {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {action}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: "HIGH" | "MEDIUM" | "LOW" | "high" | "low" }) {
  const normalizedSeverity = severity.toUpperCase() as "HIGH" | "MEDIUM" | "LOW";

  const colorMap: Record<"HIGH" | "MEDIUM" | "LOW", { bg: string; text: string; border: string }> =
    {
      HIGH: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      },
      MEDIUM: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
      },
      LOW: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      },
    };

  const colors = colorMap[normalizedSeverity];

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {normalizedSeverity}
    </span>
  );
}

function StatusBadge({ status }: { status: "NEW" | "MONITORING" | "COMPLETED" }) {
  const variantMap = {
    NEW: "default" as const,
    MONITORING: "secondary" as const,
    COMPLETED: "outline" as const,
  };

  return (
    <Badge variant={variantMap[status]} className="text-xs">
      {status}
    </Badge>
  );
}

function AIConfidenceBadge({
  confidence,
  autoResolved,
}: {
  confidence: number | null;
  autoResolved: boolean;
}) {
  if (confidence === null) {
    return <span className="text-slate-500 text-sm">-</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <Badge variant="outline" className="text-xs">
        {confidence}%
      </Badge>
      {autoResolved && (
        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500 rounded">
          AI Auto-Resolved
        </span>
      )}
    </div>
  );
}
