"use client";

import { useState, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ListFilter,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useReconciliations } from "@/hooks/data";
import type { Reconciliation, ReconFilters } from "@/lib/data/types";

/* ─── Helpers ─── */

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "Not Started", label: "Not Started" },
  { key: "In Progress", label: "In Progress" },
  { key: "Matched", label: "Matched" },
  { key: "Exceptions", label: "Exceptions" },
  { key: "Completed", label: "Completed" },
] as const;

const TYPE_OPTIONS = ["Bank", "Intercompany", "Subledger", "Custom"] as const;

function statusClass(status: string): string {
  switch (status) {
    case "Completed": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Matched": return "border-blue-200 bg-blue-50 text-blue-700";
    case "In Progress": return "border-amber-200 bg-amber-50 text-amber-700";
    case "Exceptions": return "border-red-200 bg-red-50 text-red-700";
    default: return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function statusDot(status: string): string {
  switch (status) {
    case "Completed": return "bg-emerald-500";
    case "Matched": return "bg-blue-500";
    case "In Progress": return "bg-amber-500";
    case "Exceptions": return "bg-red-500";
    default: return "bg-slate-400";
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isAtRisk(recon: Reconciliation): boolean {
  return recon.status === "Exceptions" || recon.unmatchedRecords > 0;
}

/* ─── Page Component ─── */

export default function ReconciliationWorkbenchPage() {
  // Filter & view state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drawer
  const [selectedRecon, setSelectedRecon] = useState<Reconciliation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"details" | "runs" | "activity">("details");

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    area: "Bank",
    name: "",
    owner_id: "",
    threshold_abs: 1000,
    threshold_pct: 1.0,
  });

  // Build filters for hook
  const filters: ReconFilters = useMemo(() => {
    const f: ReconFilters = { page, pageSize, search: searchQuery || undefined };
    if (statusFilter !== "ALL") f.status = [statusFilter];
    if (typeFilter !== "ALL") f.type = [typeFilter];
    return f;
  }, [page, pageSize, searchQuery, statusFilter, typeFilter]);

  const { data: recons, total, loading, error, refetch } = useReconciliations(filters);

  // KPI totals (from current page data)
  const totals = useMemo(() => {
    if (!recons?.length) return { open: 0, atRisk: 0, review: 0, closed: 0, totalExceptions: 0, avgMatch: 0 };
    return {
      open: recons.filter((r) => r.status === "Not Started" || r.status === "In Progress").length,
      atRisk: recons.filter((r) => isAtRisk(r)).length,
      review: recons.filter((r) => r.status === "Matched").length,
      closed: recons.filter((r) => r.status === "Completed").length,
      totalExceptions: recons.reduce((s, r) => s + r.exceptionAmount, 0),
      avgMatch: recons.length ? Math.round(recons.reduce((s, r) => s + r.matchRate, 0) / recons.length * 10) / 10 : 0,
    };
  }, [recons]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil((total || recons.length) / pageSize));
  const tableStart = recons.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const tableEnd = Math.min((page - 1) * pageSize + pageSize, total || recons.length);

  // Active filter count for popover badge
  const activeFilterCount = [typeFilter !== "ALL"].filter(Boolean).length;

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === recons.length && recons.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recons.map((r) => r.id)));
    }
  }, [selectedIds.size, recons]);

  const handleRowClick = useCallback((recon: Reconciliation) => {
    setSelectedRecon(recon);
    setDrawerTab("details");
    setDrawerOpen(true);
  }, []);

  const handleRunSelected = useCallback(() => {
    toast.success(`Queued ${selectedIds.size} reconciliation(s) for execution`);
    setSelectedIds(new Set());
  }, [selectedIds.size]);

  const handleRunNow = useCallback(() => {
    if (!selectedRecon) return;
    toast.success(`Run started for ${selectedRecon.name}`);
  }, [selectedRecon]);

  const handleMarkReviewed = useCallback(() => {
    if (!selectedRecon) return;
    toast.success(`${selectedRecon.name} marked as reviewed`);
    setDrawerOpen(false);
  }, [selectedRecon]);

  const handleClose = useCallback(() => {
    if (!selectedRecon) return;
    if (selectedRecon.unmatchedRecords > 0) {
      toast.error("Cannot close: there are unmatched records");
      return;
    }
    toast.success(`${selectedRecon.name} closed`);
    setDrawerOpen(false);
  }, [selectedRecon]);

  const handleReopen = useCallback(() => {
    if (!selectedRecon) return;
    toast.success(`${selectedRecon.name} reopened`);
    setDrawerOpen(false);
  }, [selectedRecon]);

  const handleCreateRecon = useCallback(() => {
    toast.success(`Reconciliation "${wizardData.name}" created`);
    setWizardOpen(false);
    setWizardStep(1);
    setWizardData({ area: "Bank", name: "", owner_id: "", threshold_abs: 1000, threshold_pct: 1.0 });
    refetch();
  }, [wizardData.name, refetch]);

  // Error state
  if (error) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-slate-50">
        <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Error loading reconciliations</h2>
        <p className="mb-4 text-sm text-slate-600">{error}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    );
  }

  // Detail drawer computed values
  const detailRow = selectedRecon;
  const detailDelta = detailRow ? detailRow.matchedRecords - detailRow.totalSourceRecords : 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      {/* ─── Title ─── */}
      <div className="px-5 pt-3 pb-1 bg-slate-50">
        <h1 className="text-sm font-semibold text-slate-900">Reconciliations</h1>
        <p className="text-[11px] text-slate-500">GL-to-subledger matching, exception management &amp; certification</p>
      </div>

      {/* ─── Toolbar ─── */}
      <div className="px-5 py-2 bg-slate-50">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Status tabs + Search + Filters */}
          <div className="flex items-center gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter((prev) => prev === tab.key && tab.key !== "ALL" ? "ALL" : tab.key);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                  statusFilter === tab.key
                    ? "bg-white text-primary shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                {tab.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="h-7 w-48 pl-8 text-xs rounded-md border-slate-200 bg-white"
              />
            </div>

            {/* Filters Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <ListFilter className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-3 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Type</label>
                  <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>

            {/* Actions */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> New Recon
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleRunSelected}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <Play className="h-3.5 w-3.5" /> Run {selectedIds.size}
              </button>
            )}
          </div>

          {/* Right: KPI stat chips */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1">
              <span className="text-[11px] text-slate-500">Total</span>
              <span className="text-[11px] font-bold text-slate-900">{total || recons.length}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1">
              <span className="text-[11px] text-slate-500">At Risk</span>
              <span className={cn("text-[11px] font-bold", totals.atRisk > 0 ? "text-red-600" : "text-slate-900")}>{totals.atRisk}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1">
              <span className="text-[11px] text-slate-500">Avg Match</span>
              <span className={cn("text-[11px] font-bold", totals.avgMatch >= 95 ? "text-emerald-600" : totals.avgMatch >= 80 ? "text-amber-600" : "text-red-600")}>{totals.avgMatch}%</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1">
              <span className="text-[11px] text-slate-500">Exceptions</span>
              <span className={cn("text-[11px] font-bold", totals.totalExceptions > 0 ? "text-red-600" : "text-emerald-600")}>{formatCurrency(totals.totalExceptions)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <div className="space-y-3 px-5 py-3">
          {loading && !recons.length ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-slate-500">Loading reconciliations...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* ─── LEFT: Table ─── */}
              <div className="min-w-0 space-y-3">
                <div className="bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-800">Reconciliation Queue</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleSelectAll}
                        className="text-[11px] text-slate-500 hover:text-slate-700"
                      >
                        {selectedIds.size === recons.length && recons.length > 0 ? "Deselect All" : "Select All"}
                      </button>
                      <span className="text-xs text-slate-400">{recons.length} reconciliations</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="w-10 px-3 py-2" />
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Name</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Type</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Assigned</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Source</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Matched</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide min-w-[120px]">Match Rate</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Exceptions</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide min-w-[100px]">Status</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Last Run</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recons.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-10 text-center text-sm text-slate-500">
                              No reconciliations match your current filters.
                            </td>
                          </tr>
                        ) : (
                          recons.map((recon) => (
                            <tr
                              key={recon.id}
                              className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-blue-50/40"
                              onClick={() => handleRowClick(recon)}
                            >
                              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedIds.has(recon.id)}
                                  onCheckedChange={() => toggleSelection(recon.id)}
                                />
                              </td>
                              <td className="px-3 py-2 text-xs font-medium text-slate-900">
                                <span className="inline-flex items-center gap-1.5">
                                  {recon.name}
                                  {isAtRisk(recon) && <AlertTriangle className="h-3 w-3 text-red-500" />}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-600">{recon.type}</td>
                              <td className="px-3 py-2 text-xs text-slate-600">{recon.assignedTo || "—"}</td>
                              <td className="px-3 py-2 text-xs text-slate-700">{recon.totalSourceRecords.toLocaleString()}</td>
                              <td className="px-3 py-2 text-xs text-slate-700">
                                {recon.matchedRecords.toLocaleString()}
                                {recon.unmatchedRecords > 0 && (
                                  <span className="ml-1 text-red-600">({recon.unmatchedRecords} unmatched)</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className={cn(
                                        "h-full rounded-full",
                                        recon.matchRate >= 95 ? "bg-emerald-500" : recon.matchRate >= 80 ? "bg-amber-400" : "bg-red-400"
                                      )}
                                      style={{ width: `${recon.matchRate}%` }}
                                    />
                                  </div>
                                  <span className={cn(
                                    "text-xs font-semibold",
                                    recon.matchRate >= 95 ? "text-emerald-600" : recon.matchRate >= 80 ? "text-amber-600" : "text-red-600"
                                  )}>
                                    {recon.matchRate}%
                                  </span>
                                </div>
                              </td>
                              <td className={cn("px-3 py-2 text-xs font-semibold", recon.exceptionAmount > 0 ? "text-red-600" : "text-emerald-600")}>
                                {recon.exceptionAmount > 0 ? formatCurrency(recon.exceptionAmount) : "—"}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", statusClass(recon.status))}>
                                  <span className={cn("h-1.5 w-1.5 rounded-full", statusDot(recon.status))} />
                                  {recon.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-600">{formatDate(recon.lastRunAt || "")}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50/70">
                    <span className="text-xs text-slate-500">
                      Showing {tableStart}–{tableEnd} of {total || recons.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                      </Button>
                      <span className="text-xs text-slate-600">Page {page} of {totalPages}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── RIGHT: Summary Sidebar ─── */}
              <aside className="min-w-0 space-y-3">
                {/* Match Distribution */}
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-xs font-semibold text-slate-900">Match Distribution</h3>
                  </div>
                  <div className="space-y-2.5">
                    {recons.map((r) => (
                      <div key={r.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-600 truncate max-w-[200px]">{r.name.replace(/Reconciliation\s*[-—]?\s*/i, "").trim() || r.name}</span>
                          <span className={cn(
                            "text-[11px] font-semibold",
                            r.matchRate >= 95 ? "text-emerald-600" : r.matchRate >= 80 ? "text-amber-600" : "text-red-600"
                          )}>
                            {r.matchRate}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              r.matchRate >= 95 ? "bg-emerald-500" : r.matchRate >= 80 ? "bg-amber-400" : "bg-red-400"
                            )}
                            style={{ width: `${r.matchRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-xs font-semibold text-slate-900">Status Breakdown</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Not Started", count: recons.filter((r) => r.status === "Not Started").length, color: "bg-slate-400" },
                      { label: "In Progress", count: recons.filter((r) => r.status === "In Progress").length, color: "bg-amber-500" },
                      { label: "Matched", count: recons.filter((r) => r.status === "Matched").length, color: "bg-blue-500" },
                      { label: "Exceptions", count: recons.filter((r) => r.status === "Exceptions").length, color: "bg-red-500" },
                      { label: "Completed", count: recons.filter((r) => r.status === "Completed").length, color: "bg-emerald-500" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", item.color)} />
                          <span className="text-xs text-slate-600">{item.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exception Summary */}
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-xs font-semibold text-slate-900">Top Exceptions</h3>
                  <div className="space-y-2">
                    {recons
                      .filter((r) => r.exceptionAmount > 0)
                      .sort((a, b) => b.exceptionAmount - a.exceptionAmount)
                      .slice(0, 5)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-md border border-slate-100 px-2.5 py-1.5 hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => handleRowClick(r)}
                        >
                          <div>
                            <div className="text-xs font-medium text-slate-800">{r.type}</div>
                            <div className="text-[11px] text-slate-500">{r.assignedTo}</div>
                          </div>
                          <span className="text-xs font-bold text-red-600">{formatCurrency(r.exceptionAmount)}</span>
                        </div>
                      ))}
                    {recons.filter((r) => r.exceptionAmount > 0).length === 0 && (
                      <p className="text-xs text-slate-400">No exceptions found</p>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      {/* ─── Detail Drawer ─── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg p-0">
          {detailRow && (
            <>
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <SheetHeader className="pb-0">
                  <SheetTitle className="text-lg font-bold text-slate-900">{detailRow.name}</SheetTitle>
                  <p className="text-sm text-slate-500">
                    {detailRow.type} &nbsp;|&nbsp; {detailRow.assignedTo || "Unassigned"}
                  </p>
                </SheetHeader>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", statusClass(detailRow.status))}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", statusDot(detailRow.status))} />
                    {detailRow.status}
                  </span>
                  {isAtRisk(detailRow) && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                      <AlertTriangle className="h-3 w-3" /> At Risk
                    </span>
                  )}
                </div>
              </div>

              {/* Tab buttons */}
              <div className="flex border-b border-slate-200 px-6">
                {(["details", "runs", "activity"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className={cn(
                      "px-4 py-2.5 text-xs font-medium border-b-2 transition-colors capitalize",
                      drawerTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="px-6 py-5 space-y-5">
                {drawerTab === "details" && (
                  <>
                    {/* Match Rate card */}
                    <div className={cn(
                      "rounded-lg border p-4",
                      detailRow.matchRate >= 95 ? "border-emerald-200 bg-emerald-50" : detailRow.matchRate >= 80 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-slate-500">Match Rate</div>
                          <div className={cn(
                            "mt-1 text-3xl font-bold",
                            detailRow.matchRate >= 95 ? "text-emerald-700" : detailRow.matchRate >= 80 ? "text-amber-700" : "text-red-700"
                          )}>
                            {detailRow.matchRate}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">{detailRow.matchedRecords.toLocaleString()} matched</div>
                          <div className="text-xs text-slate-500">{detailRow.unmatchedRecords.toLocaleString()} unmatched</div>
                        </div>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/60">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            detailRow.matchRate >= 95 ? "bg-emerald-500" : detailRow.matchRate >= 80 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${detailRow.matchRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-[11px] font-medium text-slate-500">Source Records</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">{detailRow.totalSourceRecords.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-400">{detailRow.sourceSystem}</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-[11px] font-medium text-slate-500">Target Records</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">{detailRow.totalTargetRecords.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-400">{detailRow.targetSystem}</div>
                      </div>
                      <div className={cn("rounded-lg border p-3", detailRow.exceptionAmount > 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50")}>
                        <div className="text-[11px] font-medium text-slate-500">Exceptions</div>
                        <div className={cn("mt-1 text-lg font-bold", detailRow.exceptionAmount > 0 ? "text-red-700" : "text-emerald-700")}>
                          {detailRow.exceptionAmount > 0 ? formatCurrency(detailRow.exceptionAmount) : "$0"}
                        </div>
                        <div className="text-[11px] text-slate-400">{detailRow.unmatchedRecords} items</div>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="rounded-lg border border-slate-200 p-4">
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Configuration</h4>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        <div>
                          <div className="text-[11px] text-slate-400">Period End</div>
                          <div className="text-xs font-medium text-slate-700">{detailRow.periodEnd}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Schedule</div>
                          <div className="text-xs font-medium text-slate-700">{detailRow.schedule || "Manual"}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Last Run</div>
                          <div className="text-xs font-medium text-slate-700">{formatDate(detailRow.lastRunAt || "")}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Next Run</div>
                          <div className="text-xs font-medium text-slate-700">{formatDate(detailRow.nextRunAt || "")}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Created</div>
                          <div className="text-xs font-medium text-slate-700">{formatDate(detailRow.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Updated</div>
                          <div className="text-xs font-medium text-slate-700">{formatDate(detailRow.updatedAt)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" className="h-8 text-xs" onClick={handleRunNow}>
                        <Play className="mr-1.5 h-3 w-3" /> Run Now
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleMarkReviewed} disabled={detailRow.status === "Matched"}>
                        <CheckCircle2 className="mr-1.5 h-3 w-3" /> Mark Reviewed
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleClose} disabled={detailRow.status === "Completed"}>
                        <Clock className="mr-1.5 h-3 w-3" /> Close
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleReopen} disabled={detailRow.status === "Not Started"}>
                        <RotateCcw className="mr-1.5 h-3 w-3" /> Reopen
                      </Button>
                    </div>
                  </>
                )}

                {drawerTab === "runs" && (
                  <div className="py-8 text-center">
                    <Play className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm text-slate-500">No run history available</p>
                    <p className="mt-1 text-xs text-slate-400">Click "Run Now" to execute this reconciliation</p>
                  </div>
                )}

                {drawerTab === "activity" && (
                  <div className="py-8 text-center">
                    <Clock className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm text-slate-500">No activity recorded</p>
                    <p className="mt-1 text-xs text-slate-400">Actions on this reconciliation will appear here</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── New Reconciliation Wizard ─── */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-h-[88vh] gap-3 overflow-y-auto p-4 sm:max-w-[500px]">
          <DialogHeader className="space-y-1 pr-8">
            <DialogTitle className="text-lg font-bold text-slate-900">
              New Reconciliation — Step {wizardStep}/3
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {wizardStep === 1 && "Select the reconciliation type"}
              {wizardStep === 2 && "Enter basic information"}
              {wizardStep === 3 && "Configure control thresholds"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            {wizardStep === 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Type</Label>
                <Select value={wizardData.area} onValueChange={(v) => setWizardData({ ...wizardData, area: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {wizardStep === 2 && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Name</Label>
                  <Input
                    value={wizardData.name}
                    onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                    placeholder="e.g., Operating Account Reconciliation"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Owner</Label>
                  <Input
                    value={wizardData.owner_id}
                    onChange={(e) => setWizardData({ ...wizardData, owner_id: e.target.value })}
                    placeholder="e.g., sarah.accountant"
                    className="h-9 text-sm"
                  />
                </div>
              </>
            )}

            {wizardStep === 3 && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Absolute Threshold ($)</Label>
                  <Input
                    type="number"
                    value={wizardData.threshold_abs}
                    onChange={(e) => setWizardData({ ...wizardData, threshold_abs: parseFloat(e.target.value) || 0 })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Percentage Threshold (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={wizardData.threshold_pct}
                    onChange={(e) => setWizardData({ ...wizardData, threshold_pct: parseFloat(e.target.value) || 0 })}
                    className="h-9 text-sm"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            {wizardStep > 1 && (
              <Button variant="outline" size="sm" onClick={() => setWizardStep(wizardStep - 1)}>
                Back
              </Button>
            )}
            {wizardStep < 3 ? (
              <Button size="sm" onClick={() => setWizardStep(wizardStep + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={handleCreateRecon} disabled={!wizardData.name}>
                Create Reconciliation
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
