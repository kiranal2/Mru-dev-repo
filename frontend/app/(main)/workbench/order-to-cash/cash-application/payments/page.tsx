"use client";

import { CashAppEmptyState } from "@/components/cash-app/cash-app-empty-state";
import { WhyIndicator } from "@/components/cash-app/why-indicator";
import { PaymentQueuePagination } from "@/components/cash-app/payment-queue-pagination";
import { cn } from "@/lib/utils";
import { ConfidenceMeter } from "@/components/cash-app/confidence-meter";
import { TableRowActions } from "@/components/cash-app/table-row-actions";
import { BulkActionBar } from "@/components/cash-app/bulk-action-bar";
import { TableSkeletonRows } from "@/components/cash-app/table-skeleton-rows";
import { EmailComposerDialog } from "@/components/cash-app/email-composer-dialog";
import { Payment } from "@/lib/cash-app-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Mail,
  UserPlus,
  Ban,
  EyeOff,
  Download,
  X,
  Edit,
  Settings,
  Upload,
  FileText,
  Lightbulb,
  Clock,
  AlertCircle,
  Tag,
  Target,
  SlidersHorizontal,
  ArrowLeftRight,
  Search,
  ListFilter,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { usePaymentsQueue } from "./hooks/usePaymentsQueue";

export default function PaymentsQueuePage() {
  const q = usePaymentsQueue();

  const queueStatusFilter = q.isCriticalFilterActive
    ? "critical"
    : q.filters.status !== "all"
      ? q.filters.status
      : "all";

  const activeFilterCount = [
    q.filters.bankAccount !== "all",
    q.filters.dateRange !== "all",
    q.filters.amountRange !== "all",
    q.filters.method !== "all",
    q.filters.jeStatus !== "all",
    q.filters.remittanceSource !== "all",
    q.filters.assignedTo !== "all",
    queueStatusFilter !== "all",
    q.activeSubFilter !== "",
    q.activeContextualFilter !== "",
  ].filter(Boolean).length;

  const queueStatusLabels: Record<string, string> = {
    all: "All",
    AutoMatched: "Auto-Matched",
    Exception: "Exceptions",
    critical: "Critical",
    PendingToPost: "Pending to Post",
    SettlementPending: "Settlement Pending",
  };

  const autoMatchedFilterLabels: Record<string, string> = {
    exact: "Exact",
    tolerance: "Tolerance",
    intercompany: "Intercompany",
    warnings: "Warnings",
    bulkReady: "Bulk-Ready",
  };

  const contextualFilterLabels: Record<string, string> = {
    MissingRemittance: "Missing Remittance",
    InvoiceIssue: "Invoice Issue",
    AmountMismatch: "Amount Mismatch",
    MultiEntity: "Multi-Entity",
    JERequired: "JE Required",
    DuplicateSuspected: "Duplicate Suspected",
    RemittanceParseError: "Remittance Parse Error",
    ACHFailure: "ACH Failure",
    UnappliedOnAccount: "Unapplied On Account",
    HighValue: "High Value",
    SLABreach: "SLA Breach",
    NetSuiteSyncRisk: "NetSuite Sync Risk",
    PostingBlocked: "Posting Blocked",
    CustomerEscalation: "Customer Escalation",
    SettlementRisk: "Settlement Risk",
    READY: "Ready",
    APPROVAL_NEEDED: "Approval Needed",
    JE_APPROVAL_PENDING: "JE Approval Pending",
    SYNC_PENDING: "Sync Pending",
    FAILED: "Failed",
    BANK_MATCH_PENDING: "Bank Match Pending",
  };

  const getStatusBadge = (status: Payment["status"]) => {
    const styles: Record<Payment["status"], string> = {
      New: "bg-slate-50 text-slate-700 border-slate-200",
      AutoMatched: "bg-blue-50 text-blue-700 border-blue-200",
      Exception: "bg-rose-50 text-rose-700 border-rose-200",
      SettlementPending: "bg-amber-50 text-amber-700 border-amber-200",
      PendingToPost: "bg-sky-50 text-sky-700 border-sky-200",
      Posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Reconciled: "bg-teal-50 text-teal-700 border-teal-200",
      Void: "bg-slate-50 text-slate-600 border-slate-200",
      Failed: "bg-red-50 text-red-700 border-red-200",
      NonAR: "bg-zinc-50 text-zinc-700 border-zinc-200",
    };
    const labels: Record<Payment["status"], string> = {
      New: "New",
      AutoMatched: "Auto-Matched",
      Exception: "Exception",
      SettlementPending: "Settlement Pending",
      PendingToPost: "Pending to Post",
      Posted: "Posted",
      Reconciled: "Reconciled",
      Void: "Void",
      Failed: "Failed",
      NonAR: "Non-AR",
    };
    return (
      <Badge
        variant="outline"
        className={cn(
          "min-w-[104px] justify-center px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap",
          styles[status] || "bg-slate-50 text-slate-700 border-slate-200"
        )}
      >
        {labels[status] || status}
      </Badge>
    );
  };

  const getMatchTypeBadge = (matchType?: string) => {
    if (!matchType) return null;
    const styles: Record<string, string> = {
      EXACT: "bg-green-100 text-green-800 border-green-200",
      TOLERANCE: "bg-blue-100 text-blue-800 border-blue-200",
      INTERCOMPANY: "bg-purple-100 text-purple-800 border-purple-200",
    };
    const labels: Record<string, string> = {
      EXACT: "Exact",
      TOLERANCE: "Tolerance",
      INTERCOMPANY: "Intercompany",
    };
    return (
      <Badge
        variant="outline"
        className={styles[matchType] || "bg-slate-100 text-slate-700 border-slate-300"}
      >
        {labels[matchType] || matchType}
      </Badge>
    );
  };

  const getBankMatchBadge = (payment: Payment) => {
    const status =
      payment.bank_match_status ||
      (payment.bank_match_ready === true
        ? "READY"
        : payment.bank_match_ready === false
          ? "RISK"
          : null);
    if (!status || status === "PENDING") {
      return <span className="text-xs text-slate-400">—</span>;
    }
    const styleMap: Record<string, string> = {
      READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
      RISK: "bg-amber-50 text-amber-700 border-amber-200",
    };
    const label = status === "READY" ? "Ready" : "Risk";
    return (
      <Badge variant="outline" className={`${styleMap[status]} text-xs`}>
        {label}
      </Badge>
    );
  };

  const showBankMatchColumn = q.filteredPayments.some((payment) => {
    const status =
      payment.bank_match_status ||
      (payment.bank_match_ready === true
        ? "READY"
        : payment.bank_match_ready === false
          ? "RISK"
          : null);
    return status === "READY" || status === "RISK";
  });

  const visibleHeaders = [
    "Payment #",
    "Date",
    "Amount",
    "Payer Name",
    "Customer",
    "Remittance",
    "Status",
    "Match Type",
    ...(showBankMatchColumn ? ["Bank Match"] : []),
    "Confidence",
  ];
  const tableColumnCount = visibleHeaders.length + 1;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-1 overflow-auto">
        <div className="px-3 sm:px-5 py-2">
          <div className="mb-1.5 xl:mb-2 space-y-1">
            {/* Single row: Search + Filters + Status tabs + KPI stats */}
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <Input
                    placeholder="Search payments..."
                    value={q.filters.search}
                    onChange={(e) => q.setFilters({ ...q.filters, search: e.target.value })}
                    className="pl-8 w-32 md:w-44 h-7 text-xs bg-white"
                  />
                </div>

                {/* Filters popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1.5 h-7 px-2.5 rounded border text-xs font-medium transition-colors",
                        activeFilterCount > 0
                          ? "border-primary/40 bg-primary/5 text-primary"
                          : "border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 p-3">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Filters
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                            Queue Status
                          </label>
                          <Select value={queueStatusFilter} onValueChange={q.handleQueueStatusChange}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="AutoMatched">Auto-Matched</SelectItem>
                              <SelectItem value="Exception">Exceptions</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                              <SelectItem value="PendingToPost">Pending to Post</SelectItem>
                              <SelectItem value="SettlementPending">Settlement Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {queueStatusFilter === "AutoMatched" && (
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                              Match Type
                            </label>
                            <Select
                              value={q.activeSubFilter || "all"}
                              onValueChange={q.handleAutoMatchedSubFilterChange}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="All Match Types" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Match Types</SelectItem>
                                <SelectItem value="exact">Exact ({q.subFilterCounts.exact})</SelectItem>
                                <SelectItem value="tolerance">
                                  Tolerance ({q.subFilterCounts.tolerance})
                                </SelectItem>
                                <SelectItem value="intercompany">
                                  Intercompany ({q.subFilterCounts.intercompany})
                                </SelectItem>
                                <SelectItem value="warnings">
                                  Warnings ({q.subFilterCounts.warnings})
                                </SelectItem>
                                <SelectItem value="bulkReady">
                                  Bulk-Ready ({q.subFilterCounts.bulkReady})
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {queueStatusFilter === "Exception" && (
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                              Exception Type
                            </label>
                            <Select
                              value={q.activeContextualFilter || "all"}
                              onValueChange={q.handleContextualSubFilterChange}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="All Exception Types" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Exception Types</SelectItem>
                                <SelectItem value="MissingRemittance">
                                  Missing Remittance ({q.contextualSubFilterCounts.missingRemittance})
                                </SelectItem>
                                <SelectItem value="InvoiceIssue">
                                  Invoice Issue ({q.contextualSubFilterCounts.invoiceIssue})
                                </SelectItem>
                                <SelectItem value="AmountMismatch">
                                  Amount Mismatch ({q.contextualSubFilterCounts.amountMismatch})
                                </SelectItem>
                                <SelectItem value="MultiEntity">
                                  Multi-Entity ({q.contextualSubFilterCounts.multiEntity})
                                </SelectItem>
                                <SelectItem value="JERequired">
                                  JE Required ({q.contextualSubFilterCounts.jeRequired})
                                </SelectItem>
                                <SelectItem value="DuplicateSuspected">
                                  Duplicate Suspected ({q.contextualSubFilterCounts.duplicateSuspected})
                                </SelectItem>
                                <SelectItem value="RemittanceParseError">
                                  Remittance Parse Error ({q.contextualSubFilterCounts.remittanceParseError})
                                </SelectItem>
                                <SelectItem value="ACHFailure">
                                  ACH Failure ({q.contextualSubFilterCounts.achFailure})
                                </SelectItem>
                                <SelectItem value="UnappliedOnAccount">
                                  Unapplied On Account ({q.contextualSubFilterCounts.unappliedOnAccount})
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {queueStatusFilter === "critical" && (
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                              Critical Type
                            </label>
                            <Select
                              value={q.activeContextualFilter || "all"}
                              onValueChange={q.handleContextualSubFilterChange}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="All Critical Types" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Critical Types</SelectItem>
                                <SelectItem value="HighValue">
                                  High Value ({q.contextualSubFilterCounts.highValue})
                                </SelectItem>
                                <SelectItem value="SLABreach">
                                  SLA Breach ({q.contextualSubFilterCounts.slaBreach})
                                </SelectItem>
                                <SelectItem value="NetSuiteSyncRisk">
                                  NetSuite Sync Risk ({q.contextualSubFilterCounts.netSuiteSyncRisk})
                                </SelectItem>
                                <SelectItem value="PostingBlocked">
                                  Posting Blocked ({q.contextualSubFilterCounts.postingBlocked})
                                </SelectItem>
                                <SelectItem value="CustomerEscalation">
                                  Customer Escalation ({q.contextualSubFilterCounts.customerEscalation})
                                </SelectItem>
                                <SelectItem value="SettlementRisk">
                                  Settlement Risk ({q.contextualSubFilterCounts.settlementRisk})
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {queueStatusFilter === "PendingToPost" && (
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                              Post Status
                            </label>
                            <Select
                              value={q.activeContextualFilter || "all"}
                              onValueChange={q.handleContextualSubFilterChange}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="All Post Statuses" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Post Statuses</SelectItem>
                                <SelectItem value="READY">
                                  Ready ({q.contextualSubFilterCounts.readyToPost})
                                </SelectItem>
                                <SelectItem value="APPROVAL_NEEDED">
                                  Approval Needed ({q.contextualSubFilterCounts.approvalNeeded})
                                </SelectItem>
                                <SelectItem value="JE_APPROVAL_PENDING">
                                  JE Approval Pending ({q.contextualSubFilterCounts.jeApprovalPending})
                                </SelectItem>
                                <SelectItem value="SYNC_PENDING">
                                  Sync Pending ({q.contextualSubFilterCounts.syncPending})
                                </SelectItem>
                                <SelectItem value="FAILED">
                                  Failed ({q.contextualSubFilterCounts.postingFailed})
                                </SelectItem>
                                <SelectItem value="BANK_MATCH_PENDING">
                                  Bank Match Pending ({q.contextualSubFilterCounts.bankMatchPending})
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div>
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                            Bank Account
                          </label>
                          <Select
                            value={q.filters.bankAccount}
                            onValueChange={(v) => q.setFilters({ ...q.filters, bankAccount: v })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="All Accounts" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Accounts</SelectItem>
                              <SelectItem value="us-bank">US Bank - *****4521</SelectItem>
                              <SelectItem value="chase">Chase - *****7892</SelectItem>
                              <SelectItem value="wells">Wells Fargo - *****3456</SelectItem>
                              <SelectItem value="boa">Bank of America - *****9012</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                            Date Range
                          </label>
                          <Select
                            value={q.filters.dateRange}
                            onValueChange={(v) => q.setFilters({ ...q.filters, dateRange: v })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="All Time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Time</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="week">This Week</SelectItem>
                              <SelectItem value="month">This Month</SelectItem>
                              <SelectItem value="quarter">This Quarter</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                            Amount Range
                          </label>
                          <Select
                            value={q.filters.amountRange}
                            onValueChange={(v) => q.setFilters({ ...q.filters, amountRange: v })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="All Amounts" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Amounts</SelectItem>
                              <SelectItem value="0-10k">$0 - $10,000</SelectItem>
                              <SelectItem value="10k-50k">$10,000 - $50,000</SelectItem>
                              <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                              <SelectItem value="100k+">$100,000+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                            Payment Method
                          </label>
                          <Select
                            value={q.filters.method}
                            onValueChange={(v) => q.setFilters({ ...q.filters, method: v })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="All Methods" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Methods</SelectItem>
                              <SelectItem value="ACH">ACH</SelectItem>
                              <SelectItem value="Wire">Wire</SelectItem>
                              <SelectItem value="Check">Check</SelectItem>
                              <SelectItem value="Credit Card">Credit Card</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                            JE Status
                          </label>
                          <Select
                            value={q.filters.jeStatus}
                            onValueChange={(v) => q.setFilters({ ...q.filters, jeStatus: v })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="required">JE Required</SelectItem>
                              <SelectItem value="submitted">JE Submitted</SelectItem>
                              <SelectItem value="none">No JE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                            Remittance Source
                          </label>
                          <Select
                            value={q.filters.remittanceSource}
                            onValueChange={(v) => q.setFilters({ ...q.filters, remittanceSource: v })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="All Sources" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Sources</SelectItem>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="Bank Portal">Bank Portal</SelectItem>
                              <SelectItem value="EDI">EDI</SelectItem>
                              <SelectItem value="API">API</SelectItem>
                              <SelectItem value="Manual Upload">Manual Upload</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                            Assigned To
                          </label>
                          <Select
                            value={q.filters.assignedTo}
                            onValueChange={(v) => q.setFilters({ ...q.filters, assignedTo: v })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Anyone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Anyone</SelectItem>
                              <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                              <SelectItem value="Michael Roberts">Michael Roberts</SelectItem>
                              <SelectItem value="Jessica Martinez">Jessica Martinez</SelectItem>
                              <SelectItem value="David Kim">David Kim</SelectItem>
                              <SelectItem value="Emily Taylor">Emily Taylor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => {
                            q.handleQueueStatusChange("all");
                            q.setFilters((prev) => ({
                              ...prev,
                              bankAccount: "all",
                              dateRange: "all",
                              amountRange: "all",
                              method: "all",
                              jeStatus: "all",
                              remittanceSource: "all",
                              assignedTo: "all",
                            }));
                          }}
                          className="w-full text-center text-[11px] text-slate-500 hover:text-red-600 py-1 border-t border-slate-100 mt-1"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Status tabs — scrollable on tablet */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  {[
                    { id: "all", label: "All", count: q.payments.length },
                    { id: "AutoMatched", label: "Auto-Matched", count: q.stats.autoMatched },
                    { id: "Exception", label: "Exceptions", count: q.stats.exceptions },
                    { id: "critical", label: "Critical", count: q.stats.critical },
                    { id: "PendingToPost", label: "Pending to Post", count: q.stats.pendingToPost },
                  ].map((seg) => (
                    <button
                      key={seg.id}
                      onClick={() =>
                        queueStatusFilter === seg.id
                          ? q.handleQueueStatusChange("all")
                          : q.handleQueueStatusChange(seg.id)
                      }
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0",
                        queueStatusFilter === seg.id
                          ? "bg-white text-primary shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      )}
                    >
                      {seg.label}
                      {seg.count !== undefined && (
                        <span className="ml-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 rounded-full">
                          {seg.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact KPI stat chips — desktop only, tablet uses status tab counts */}
              <div className="hidden xl:flex items-center gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                  <span className="text-slate-500">Total</span>
                  <span className="font-semibold text-slate-900">{q.payments.length}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                  <span className="text-slate-500">Auto-Match</span>
                  <span className="font-semibold text-green-700">{q.payments.length > 0 ? Math.round((q.stats.autoMatched / q.payments.length) * 100) : 0}%</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                  <span className="text-slate-500">Exceptions</span>
                  <span className={cn("font-semibold", q.stats.exceptions > 0 ? "text-red-600" : "text-slate-900")}>{q.stats.exceptions}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                  <span className="text-slate-500">Pending</span>
                  <span className="font-semibold text-slate-900">{q.stats.pendingToPost}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Pills */}
          {(queueStatusFilter !== "all" ||
            q.activeSubFilter !== "" ||
            q.activeContextualFilter !== "" ||
            q.activeSignalFilter ||
            q.filters.bankAccount !== "all" ||
            q.filters.dateRange !== "all" ||
            q.filters.amountRange !== "all" ||
            q.filters.method !== "all" ||
            q.filters.jeStatus !== "all" ||
            q.filters.remittanceSource !== "all" ||
            q.filters.assignedTo !== "all") && (
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className="text-[11px] font-medium text-slate-500">Filters:</span>
              {queueStatusFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  Queue: {queueStatusLabels[queueStatusFilter] || queueStatusFilter}
                  <button
                    onClick={() => q.handleQueueStatusChange("all")}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              {q.activeSubFilter !== "" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  Match Type: {autoMatchedFilterLabels[q.activeSubFilter] || q.activeSubFilter}
                  <button
                    onClick={() => q.handleAutoMatchedSubFilterChange("all")}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              {q.activeContextualFilter !== "" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  Focus: {contextualFilterLabels[q.activeContextualFilter] || q.activeContextualFilter}
                  <button
                    onClick={() => q.handleContextualSubFilterChange("all")}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              {q.activeSignalFilter && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  Signal: {q.activeSignalFilter}
                  <button
                    onClick={() => q.handleQueueStatusChange("all")}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              {q.filters.bankAccount !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  Bank:{" "}
                  {q.filters.bankAccount === "us-bank"
                    ? "US Bank"
                    : q.filters.bankAccount === "chase"
                      ? "Chase"
                      : q.filters.bankAccount === "wells"
                        ? "Wells Fargo"
                        : q.filters.bankAccount === "boa"
                          ? "Bank of America"
                          : q.filters.bankAccount}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, bankAccount: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              {q.filters.dateRange !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  Date:{" "}
                  {q.filters.dateRange === "today"
                    ? "Today"
                    : q.filters.dateRange === "week"
                      ? "This Week"
                      : q.filters.dateRange === "month"
                        ? "This Month"
                        : q.filters.dateRange === "quarter"
                          ? "This Quarter"
                          : q.filters.dateRange}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, dateRange: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              {q.filters.amountRange !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  Amount: {q.filters.amountRange}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, amountRange: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              {q.filters.method !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  Method: {q.filters.method}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, method: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              {q.filters.jeStatus !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  JE:{" "}
                  {q.filters.jeStatus === "required"
                    ? "Required"
                    : q.filters.jeStatus === "submitted"
                      ? "Submitted"
                      : q.filters.jeStatus === "none"
                        ? "No JE"
                        : q.filters.jeStatus}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, jeStatus: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              {q.filters.remittanceSource !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  Source: {q.filters.remittanceSource}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, remittanceSource: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              {q.filters.assignedTo !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200"
                >
                  Assigned: {q.filters.assignedTo}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, assignedTo: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              )}
              <button
                onClick={() => {
                  q.handleQueueStatusChange("all");
                  q.setFilters((prev) => ({
                    ...prev,
                    bankAccount: "all",
                    dateRange: "all",
                    amountRange: "all",
                    method: "all",
                    jeStatus: "all",
                    remittanceSource: "all",
                    assignedTo: "all",
                  }));
                }}
                className="text-[11px] text-slate-500 hover:text-red-600 underline ml-0.5"
              >
                Clear all
              </button>
            </div>
          )}

          <div>
              {q.selectedIds.length > 0 && (
                <Card className="mb-2 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      {q.selectedIds.length} payment{q.selectedIds.length !== 1 ? "s" : ""} selected
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => q.handleBulkAction("approve")}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => q.handleBulkAction("reprocess")}>
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Reprocess
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => q.handleBulkAction("generate")}>
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Export
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => q.handleBulkAction("email")}>
                        <Mail className="w-3.5 h-3.5 mr-1" />
                        Email
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => q.handleBulkAction("assign")}>
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        Assign
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => q.handleBulkAction("non-ar")}>
                        <Ban className="w-3.5 h-3.5 mr-1" />
                        Non-AR
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => q.handleBulkAction("ignore")}>
                        <EyeOff className="w-3.5 h-3.5 mr-1" />
                        Ignore
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {q.filteredPayments.length === 0 ? (
                <CashAppEmptyState />
              ) : (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-slate-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left w-8">
                            <Checkbox
                              checked={q.areAllOnPageSelected}
                              onCheckedChange={q.handleSelectAll}
                              className="border-slate-300"
                            />
                          </th>
                          {visibleHeaders.map((header) => {
                            // Hide certain columns on tablet/mobile for density
                            const hiddenOnTablet = header === "Payer Name" || header === "Remittance";
                            const hiddenOnMobile = header === "Date";
                            return (
                              <th
                                key={header}
                                className={cn(
                                  "px-2 xl:px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap",
                                  hiddenOnTablet && "hidden xl:table-cell",
                                  hiddenOnMobile && "hidden md:table-cell"
                                )}
                              >
                                {header}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {q.isLoading ? (
                          <TableSkeletonRows rowCount={q.pageSize} columnCount={tableColumnCount} />
                        ) : (
                          <>
                            {q.showSelectAllBanner && (
                              <tr className="bg-blue-50 border-b border-blue-200">
                                <td
                                  colSpan={tableColumnCount}
                                  className="px-3 py-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-blue-900">
                                      All{" "}
                                      <span className="font-semibold">
                                        {q.paginatedPayments.length}
                                      </span>{" "}
                                      payments on this page are selected.
                                    </span>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={q.handleSelectAllRecords}
                                      className="text-blue-700 hover:text-blue-900 font-semibold"
                                    >
                                      Select all {q.totalRecords} payments
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )}
                            {q.paginatedPayments.map((payment) => {
                              const isSelected = q.selectedIds.includes(payment.id);
                              const isHovered = q.hoveredRowId === payment.id;
                              return (
                                <tr
                                  key={payment.id}
                                  className={`
                                    relative cursor-pointer transition-all duration-150 ease-out
                                    ${isSelected ? "bg-blue-50" : isHovered ? "bg-slate-50" : "bg-white"}
                                  `}
                                  onMouseEnter={() => q.setHoveredRowId(payment.id)}
                                  onMouseLeave={() => q.setHoveredRowId(null)}
                                  onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                                    if ((e.target as HTMLElement).closest("button")) return;
                                    q.handleRowClick(payment);
                                  }}
                                >
                                  <td className={`px-3 py-1.5`}>
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => q.handleSelectPayment(payment.id, checked as boolean)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="border-slate-300"
                                      />
                                    </div>
                                  </td>
                                  <td className={`px-2 xl:px-3 py-1.5 text-xs font-medium text-blue-600 whitespace-nowrap`}>
                                    {payment.paymentNumber}
                                  </td>
                                  <td className={`px-2 xl:px-3 py-1.5 text-xs text-slate-700 whitespace-nowrap hidden md:table-cell`}>
                                    {payment.date}
                                  </td>
                                  <td className={`px-2 xl:px-3 py-1.5 text-xs font-semibold text-slate-900 whitespace-nowrap`}>
                                    {q.formatCurrency(payment.amount)}
                                  </td>
                                  <td className={`px-2 xl:px-3 py-1.5 text-xs font-medium text-slate-800 hidden xl:table-cell`}>
                                    {payment.payerNameRaw}
                                  </td>
                                  <td className={`px-2 xl:px-3 py-1.5 text-xs text-slate-700`}>
                                    {payment.customerName}
                                  </td>
                                  <td className={`px-2 xl:px-3 py-1.5 text-xs text-slate-500 hidden xl:table-cell`}>
                                    {payment.remittanceSource}
                                  </td>
                                  <td className={`px-3 py-1.5 whitespace-nowrap`}>
                                    <div className="flex flex-col gap-1">
                                      {getStatusBadge(
                                        payment.je_workflow_state === "POSTED" ? "Posted" : payment.status
                                      )}
                                    </div>
                                  </td>
                                  <td className={`px-3 py-1.5 whitespace-nowrap`}>
                                    {payment.match_type ? (
                                      <div className="flex items-center gap-1.5">
                                        {payment.match_type === "EXACT" && <Target className="w-3.5 h-3.5 text-emerald-600" />}
                                        {payment.match_type === "TOLERANCE" && <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />}
                                        {payment.match_type === "INTERCOMPANY" && <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />}
                                        {getMatchTypeBadge(payment.match_type)}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400">-</span>
                                    )}
                                  </td>
                                  {showBankMatchColumn && (
                                    <td className={`px-3 py-1.5 whitespace-nowrap`}>
                                      {getBankMatchBadge(payment)}
                                    </td>
                                  )}
                                  <td className={`px-3 py-1.5`}>
                                    <div className="flex items-center gap-2">
                                      <ConfidenceMeter confidence={payment.confidenceScore} />
                                      <WhyIndicator explainability={payment.explainability} />
                                      {isSelected && (
                                        <TableRowActions
                                          payment={payment}
                                          onViewDetails={q.handleRowClick}
                                          onAssign={q.handleAssignPayment}
                                          onSplit={q.handleSplitPayment}
                                          onCreateJE={q.handleCreateJE}
                                          onApprovePost={q.handleApprovePost}
                                          showPrimaryAction={
                                            payment.status === "AutoMatched" || payment.status === "PendingToPost"
                                          }
                                          isHovered={isSelected}
                                        />
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <PaymentQueuePagination
                    currentPage={q.validCurrentPage}
                    totalPages={q.totalPages}
                    pageSize={q.pageSize}
                    totalRecords={q.totalRecords}
                    onPageChange={q.handlePageChange}
                    onPageSizeChange={q.handlePageSizeChange}
                    selectedCount={q.selectedIds.length}
                  />
                </Card>
              )}
          </div>
        </div>
      </div>

      {/* Bulk action confirmation modal */}
      <AlertDialog open={q.showBulkModal} onOpenChange={q.setShowBulkModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {q.bulkAction === "approve" && "Approve Auto-Matches"}
              {q.bulkAction === "reprocess" && "Reprocess Payments"}
              {q.bulkAction === "generate" && "Generate Output"}
              {q.bulkAction === "email" && "Send Email"}
              {q.bulkAction === "assign" && "Assign Payments"}
              {q.bulkAction === "non-ar" && "Mark as Non-AR"}
              {q.bulkAction === "ignore" && "Ignore Payments"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {q.bulkAction === "assign" ? (
                <div className="space-y-4">
                  <p>Select a user to assign {q.selectedIds.length} payments to:</p>
                  <Select value={q.assignToUser} onValueChange={q.setAssignToUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                      <SelectItem value="Michael Roberts">Michael Roberts</SelectItem>
                      <SelectItem value="Jessica Martinez">Jessica Martinez</SelectItem>
                      <SelectItem value="David Kim">David Kim</SelectItem>
                      <SelectItem value="Emily Taylor">Emily Taylor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                `Are you sure you want to perform this action on ${q.selectedIds.length} selected payment${q.selectedIds.length !== 1 ? "s" : ""}?`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={q.executeBulkAction}
              disabled={q.bulkAction === "assign" && !q.assignToUser}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email composer dialog */}
      <EmailComposerDialog
        open={q.showEmailComposer}
        onOpenChange={q.setShowEmailComposer}
        emailMode={q.emailMode}
        selectedPayments={q.selectedPayments}
        selectedTemplateId={q.selectedTemplateId}
        onTemplateChange={q.handleTemplateChange}
        recipientScope={q.recipientScope}
        onRecipientScopeChange={q.setRecipientScope}
        emailSubject={q.emailSubject}
        onEmailSubjectChange={q.setEmailSubject}
        emailBody={q.emailBody}
        onEmailBodyChange={q.setEmailBody}
        toRecipients={q.toRecipients}
        onToRecipientsChange={q.setToRecipients}
        ccRecipients={q.ccRecipients}
        onCcRecipientsChange={q.setCcRecipients}
        toInput={q.toInput}
        onToInputChange={q.setToInput}
        ccInput={q.ccInput}
        onCcInputChange={q.setCcInput}
        saveRecipients={q.saveRecipients}
        onSaveRecipientsChange={q.setSaveRecipients}
        includeInternalCc={q.includeInternalCc}
        onIncludeInternalCcChange={q.setIncludeInternalCc}
        allowPersonalization={q.allowPersonalization}
        onAllowPersonalizationChange={q.setAllowPersonalization}
        selectedPreviewPaymentId={q.selectedPreviewPaymentId}
        onSelectedPreviewPaymentIdChange={q.setSelectedPreviewPaymentId}
        attachmentOptions={q.attachmentOptions}
        onAttachmentOptionsChange={q.setAttachmentOptions}
        attachmentSelections={q.attachmentSelections}
        onAttachmentSelectionsChange={q.setAttachmentSelections}
        includePaymentSummaryLink={q.includePaymentSummaryLink}
        onIncludePaymentSummaryLinkChange={q.setIncludePaymentSummaryLink}
        includeRemittanceUploadLink={q.includeRemittanceUploadLink}
        onIncludeRemittanceUploadLinkChange={q.setIncludeRemittanceUploadLink}
        skipMissingContacts={q.skipMissingContacts}
        onSkipMissingContactsChange={q.setSkipMissingContacts}
        manualContactInputs={q.manualContactInputs}
        onManualContactInputsChange={q.setManualContactInputs}
        emailOutbox={q.emailOutbox}
        onEmailOutboxChange={q.setEmailOutbox}
        emailGroups={q.emailGroups}
        uniqueCustomersCount={q.uniqueCustomersCount}
        emailCount={q.emailCount}
        missingContactCount={q.missingContactCount}
        previewPayment={q.previewPayment}
        addRecipient={q.addRecipient}
        removeRecipient={q.removeRecipient}
        getTemplateById={q.getTemplateById}
        getContactForCustomer={q.getContactForCustomer}
        resolveTemplateBody={q.resolveTemplateBody}
        onSendEmails={q.handleSendEmails}
      />

      {/* Payment details drawer */}
      <Sheet open={q.showPaymentDrawer} onOpenChange={q.setShowPaymentDrawer}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-4xl overflow-y-auto p-0"
          onClick={(e) => e.stopPropagation()}
        >
          {q.selectedPayment && (
            <div className="h-full flex flex-col">
              <SheetHeader className="px-6 py-4 border-b bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-xl">{q.selectedPayment.paymentNumber}</SheetTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={q.selectedPayment.status === "Exception" ? "destructive" : "default"}
                      >
                        {q.selectedPayment.status}
                      </Badge>
                      {q.selectedPayment.exceptionType && (
                        <Badge variant="outline">{q.selectedPayment.exceptionType}</Badge>
                      )}
                      {q.selectedPayment.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Mappings
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={q.selectedPayment.originalPaymentFileUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Original File
                      </a>
                    </Button>
                    {q.selectedPayment.linkedRemittanceFileUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={q.selectedPayment.linkedRemittanceFileUrl} download>
                          <FileText className="w-4 h-4 mr-2" />
                          Remittance File
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-auto">
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Payment Number</div>
                            <div className="text-sm font-medium">{q.selectedPayment.paymentNumber}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Payment Header ID</div>
                            <div className="text-sm font-medium">{q.selectedPayment.paymentHeaderId}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Payment Amount</div>
                            <div className="text-sm font-semibold">{q.formatCurrency(q.selectedPayment.amount)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Payment Date</div>
                            <div className="text-sm font-medium">{q.selectedPayment.date}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Customer Name</div>
                            <div className="text-sm font-medium">{q.selectedPayment.customerName}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Customer Number</div>
                            <div className="text-sm font-medium">{q.selectedPayment.customerNumber}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Identification Criteria</div>
                            <div className="text-sm font-medium">{q.selectedPayment.identificationCriteria}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Exception Status</div>
                            <div className="text-sm font-medium">
                              {q.selectedPayment.status === "Exception" ? "Exception" : "Success"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Payer Name</div>
                            <div className="text-sm font-medium">{q.selectedPayment.payerNameRaw}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Remittance Source</div>
                            <div className="text-sm font-medium">{q.selectedPayment.remittanceSource}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-sm text-gray-600 mb-1">Notes</div>
                            <div className="text-sm font-medium">{q.selectedPayment.memoReferenceRaw}</div>
                          </div>
                        </div>
                      </Card>

                      <Tabs defaultValue="transformed" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="received">Received Data</TabsTrigger>
                          <TabsTrigger value="transformed">Transformed Data</TabsTrigger>
                        </TabsList>

                        <TabsContent value="received" className="mt-4">
                          <Card className="p-6">
                            <h3 className="text-sm font-semibold mb-4">Raw Payment Data</h3>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Memo/Reference</div>
                                <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                                  {q.selectedPayment.memoReferenceRaw}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Payer</div>
                                <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                                  {q.selectedPayment.payerNameRaw}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Bank Account</div>
                                <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                                  {q.selectedPayment.bankAccount}
                                </div>
                              </div>
                              {q.selectedPayment.linkedRemittanceFileUrl && (
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Remittance Data</div>
                                  <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
                                    <div className="font-medium mb-2">Remittance Advice Attached</div>
                                    <div className="text-xs text-gray-600">
                                      Source: {q.selectedPayment.remittanceSource}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        </TabsContent>

                        <TabsContent value="transformed" className="mt-4">
                          <Card className="p-6">
                            <div className="mb-4">
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Payment Amount</div>
                                  <div className="text-lg font-semibold">
                                    {q.formatCurrency(q.selectedPayment.amount)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Net Amount</div>
                                  <div className="text-lg font-semibold">
                                    {q.formatCurrency(
                                      q.selectedPayment.transformedLines.reduce(
                                        (sum, line) => sum + line.paymentAmount,
                                        0
                                      )
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Difference</div>
                                  <div className="text-lg font-semibold text-green-600">
                                    {q.formatCurrency(
                                      q.selectedPayment.amount -
                                        q.selectedPayment.transformedLines.reduce(
                                          (sum, line) => sum + line.paymentAmount,
                                          0
                                        )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <h3 className="text-sm font-semibold mb-3">Posting Lines</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">ERP Reference</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Reference Field</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Discount Amount</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Payment Amount</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Reason Code</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Reason Description</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Customer #</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {q.selectedPayment.transformedLines.map((line) => (
                                    <tr key={line.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2">{line.erpReference}</td>
                                      <td className="px-3 py-2 text-gray-600">{line.referenceField}</td>
                                      <td className="px-3 py-2 text-right">
                                        {line.discountAmount < 0 && (
                                          <span className="text-red-600 font-medium">
                                            {q.formatCurrency(line.discountAmount)}
                                          </span>
                                        )}
                                        {line.discountAmount >= 0 && q.formatCurrency(line.discountAmount)}
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium">
                                        {q.formatCurrency(line.paymentAmount)}
                                      </td>
                                      <td className="px-3 py-2">{line.reasonCode}</td>
                                      <td className="px-3 py-2 text-gray-600">{line.reasonDescription}</td>
                                      <td className="px-3 py-2">{line.customerNumber}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Card>
                        </TabsContent>
                      </Tabs>

                      <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Activity Timeline
                        </h2>
                        <div className="space-y-4">
                          {q.selectedPayment.activityLog.map((log, index) => (
                            <div key={log.id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                {index !== q.selectedPayment!.activityLog.length - 1 && (
                                  <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-medium text-sm">{log.action}</div>
                                    <div className="text-xs text-gray-600 mt-1">{log.details}</div>
                                  </div>
                                  <div className="text-xs text-gray-500">{q.formatDate(log.timestamp)}</div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">by {log.user}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card className="p-6 sticky top-8">
                        <div className="flex items-start gap-3 mb-4">
                          <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-sm mb-1">AI Recommendation</h3>
                            <p className="text-sm text-gray-700">{q.selectedPayment.aiRecommendation}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Confidence Score</span>
                            <span className="text-sm font-semibold">{q.selectedPayment.confidenceScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                q.selectedPayment.confidenceScore >= 80
                                  ? "bg-green-500"
                                  : q.selectedPayment.confidenceScore >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${q.selectedPayment.confidenceScore}%` }}
                            ></div>
                          </div>
                        </div>

                        {q.selectedPayment.aiRationale && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded mb-4">
                            <div className="font-medium mb-1">Why?</div>
                            {q.selectedPayment.aiRationale}
                          </div>
                        )}

                        {q.selectedPayment.warnings && q.selectedPayment.warnings.length > 0 && (
                          <div className="mb-4">
                            {q.selectedPayment.warnings.map((warning, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded mb-2"
                              >
                                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <Separator className="my-4" />

                        <div className="space-y-2">
                          <Button className="w-full" onClick={() => q.handleAction("approve-post")}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve & Post
                          </Button>
                          <Button className="w-full" variant="outline" onClick={() => q.handleAction("approve")}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button className="w-full" variant="outline" onClick={() => q.handleAction("edit-match")}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Match
                          </Button>
                          <Button className="w-full" variant="outline" onClick={() => q.handleAction("missing-remittance")}>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Mark Missing Remittance
                          </Button>
                          <Button className="w-full" variant="outline" onClick={() => q.handleAction("duplicate")}>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Duplicate Payment
                          </Button>
                          <Button className="w-full" variant="outline" onClick={() => q.handleAction("je-type")}>
                            <FileText className="w-4 h-4 mr-2" />
                            Select JE Type
                          </Button>
                          <Button className="w-full" variant="outline" onClick={() => q.handleAction("assign")}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign / Tag
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Single-payment action modal */}
      <AlertDialog open={q.showActionModal} onOpenChange={q.setShowActionModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {q.currentAction === "je-type" && "Select JE Type"}
              {q.currentAction === "assign" && "Assign Payment"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {q.currentAction === "je-type" && (
                <div className="space-y-4">
                  <p>Select the journal entry type for this payment:</p>
                  <Select value={q.jeType} onValueChange={q.setJeType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select JE type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Cash Receipt</SelectItem>
                      <SelectItem value="unapplied">Unapplied Cash</SelectItem>
                      <SelectItem value="advance">Customer Advance</SelectItem>
                      <SelectItem value="intercompany">Intercompany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {q.currentAction === "assign" && (
                <div className="space-y-4">
                  <p>Assign this payment to a team member:</p>
                  <Select value={q.assignTo} onValueChange={q.setAssignTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                      <SelectItem value="Michael Roberts">Michael Roberts</SelectItem>
                      <SelectItem value="Jessica Martinez">Jessica Martinez</SelectItem>
                      <SelectItem value="David Kim">David Kim</SelectItem>
                      <SelectItem value="Emily Taylor">Emily Taylor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => q.executeAction()}
              disabled={
                (q.currentAction === "je-type" && !q.jeType) ||
                (q.currentAction === "assign" && !q.assignTo)
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkActionBar
        selectedCount={q.selectedIds.length}
        onApprovePost={q.handleBulkApprovePost}
        onAssign={q.handleBulkAssign}
        onExport={q.handleBulkExport}
        onMarkReviewed={q.handleBulkMarkReviewed}
        onClearSelection={() => q.setSelectedIds([])}
        isVisible={q.selectedIds.length > 0}
      />
    </div>
  );
}
