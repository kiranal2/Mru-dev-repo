"use client";

import { CashAppSubFilterChips } from "@/components/cash-app/cash-app-sub-filter-chips";
import { CashAppContextualSubFilters } from "@/components/cash-app/cash-app-contextual-sub-filters";
import { CashAppFilterRail } from "@/components/cash-app/cash-app-filter-rail";
import { CashAppEmptyState } from "@/components/cash-app/cash-app-empty-state";
import { WhyIndicator } from "@/components/cash-app/why-indicator";
import { PaymentQueuePagination } from "@/components/cash-app/payment-queue-pagination";
import { KPISummaryStrip } from "@/components/cash-app/kpi-summary-strip";
import { SegmentedControl } from "@/components/cash-app/segmented-control";
import { ConfidenceMeter } from "@/components/cash-app/confidence-meter";
import { TableRowActions } from "@/components/cash-app/table-row-actions";
import { BulkActionBar } from "@/components/cash-app/bulk-action-bar";
import { TableSkeletonRows } from "@/components/cash-app/table-skeleton-rows";
import { DensityToggle } from "@/components/cash-app/density-toggle";
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
  PanelLeftClose,
  PanelLeft,
  Target,
  SlidersHorizontal,
  ArrowLeftRight,
  BookOpen,
  Search,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { usePaymentsQueue } from "./hooks/usePaymentsQueue";

export default function PaymentsQueuePage() {
  const q = usePaymentsQueue();

  const getStatusBadge = (status: Payment["status"]) => {
    const variants: Record<Payment["status"], any> = {
      New: "outline",
      AutoMatched: "default",
      Exception: "destructive",
      SettlementPending: "secondary",
      PendingToPost: "secondary",
      Posted: "default",
      Reconciled: "default",
      Void: "outline",
      Failed: "destructive",
      NonAR: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
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
      <Badge variant="outline" className={styles[matchType]}>
        {labels[matchType]}
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
    if (!status) {
      return <span className="text-xs text-slate-400">—</span>;
    }
    const styleMap: Record<string, string> = {
      READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
      RISK: "bg-amber-50 text-amber-700 border-amber-200",
      PENDING: "bg-slate-100 text-slate-700 border-slate-300",
    };
    const label = status === "READY" ? "Ready" : status === "RISK" ? "Risk" : "Pending";
    return (
      <Badge variant="outline" className={`${styleMap[status] || styleMap.PENDING} text-xs`}>
        {label}
      </Badge>
    );
  };

  const getExceptionReasonBadge = (payment: Payment) => {
    const fallback = payment.exceptionType || payment.exception_core_type || null;
    const label = payment.exception_reason_label || payment.exception_reason_code || fallback;
    if (!label) return null;
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        {label}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-1 overflow-auto">
        <div className="px-4 pt-2 pb-4">
          <KPISummaryStrip stats={q.stats} />

          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => q.setShowFilterSidebar(!q.showFilterSidebar)}
                  className="h-[38px] border-slate-200 hover:bg-slate-100"
                >
                  {q.showFilterSidebar ? (
                    <PanelLeftClose className="w-4 h-4" />
                  ) : (
                    <PanelLeft className="w-4 h-4" />
                  )}
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search payments..."
                    value={q.filters.search}
                    onChange={(e) => q.setFilters({ ...q.filters, search: e.target.value })}
                    className="pl-9 w-64 h-[38px] bg-white"
                  />
                </div>
                <SegmentedControl
                  stats={q.stats}
                  activeSegment={q.activeSegment}
                  onSegmentChange={q.handleSegmentChange}
                  onClearFilter={q.handleClearSegmentFilter}
                />
              </div>
              <DensityToggle density={q.density} onDensityChange={q.setDensity} />
            </div>

            {/* Sub-filters row */}
            {(q.filters.status === "AutoMatched" ||
              q.filters.status === "Exception" ||
              q.isCriticalFilterActive ||
              q.filters.status === "PendingToPost" ||
              q.filters.status === "SettlementPending" ||
              q.activeSignalFilter) && (
              <div className="flex items-center gap-2 pl-1">
                {q.activeSegment && (
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mr-0.5">
                    {q.activeSegment === "critical"
                      ? "Critical"
                      : q.filters.status === "AutoMatched"
                        ? "Match Type"
                        : q.filters.status === "Exception"
                          ? "Exception Type"
                          : q.filters.status === "SettlementPending"
                            ? "Settlement Status"
                            : "Post Status"}
                    :
                  </span>
                )}
                {q.filters.status === "AutoMatched" && (
                  <CashAppSubFilterChips
                    counts={q.subFilterCounts}
                    activeFilter={q.activeSubFilter}
                    onFilterClick={q.handleSubFilterClick}
                  />
                )}
                {q.filters.status === "Exception" && (
                  <CashAppContextualSubFilters
                    context="exceptions"
                    counts={q.contextualSubFilterCounts}
                    activeFilter={q.activeContextualFilter}
                    onFilterClick={q.handleContextualFilterClick}
                    onClearFilter={q.handleClearContextualFilter}
                  />
                )}
                {q.isCriticalFilterActive && (
                  <CashAppContextualSubFilters
                    context="critical"
                    counts={q.contextualSubFilterCounts}
                    activeFilter={q.activeContextualFilter}
                    onFilterClick={q.handleContextualFilterClick}
                    onClearFilter={q.handleClearContextualFilter}
                  />
                )}
                {q.filters.status === "PendingToPost" && (
                  <CashAppContextualSubFilters
                    context="pendingToPost"
                    counts={q.contextualSubFilterCounts}
                    activeFilter={q.activeContextualFilter}
                    onFilterClick={q.handleContextualFilterClick}
                    onClearFilter={q.handleClearContextualFilter}
                  />
                )}
                {q.filters.status === "SettlementPending" && (
                  <CashAppContextualSubFilters
                    context="settlementPending"
                    counts={q.contextualSubFilterCounts}
                    activeFilter={q.activeContextualFilter}
                    onFilterClick={q.handleContextualFilterClick}
                    onClearFilter={q.handleClearContextualFilter}
                  />
                )}
                {q.activeSignalFilter && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs"
                  >
                    <span>Signal: {q.activeSignalFilter}</span>
                    <button onClick={q.handleClearSignalFilter} className="ml-0.5 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Active Filter Pills */}
          {(q.filters.bankAccount !== "all" ||
            q.filters.dateRange !== "all" ||
            q.filters.amountRange !== "all" ||
            q.filters.method !== "all" ||
            q.filters.remittanceSource !== "all" ||
            q.filters.assignedTo !== "all") && (
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-xs font-medium text-slate-500">Filters:</span>
              {q.filters.bankAccount !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
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
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {q.filters.dateRange !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
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
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {q.filters.amountRange !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
                >
                  Amount: {q.filters.amountRange}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, amountRange: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {q.filters.method !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
                >
                  Method: {q.filters.method}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, method: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {q.filters.remittanceSource !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
                >
                  Source: {q.filters.remittanceSource}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, remittanceSource: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {q.filters.assignedTo !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
                >
                  Assigned: {q.filters.assignedTo}
                  <button
                    onClick={() => q.setFilters({ ...q.filters, assignedTo: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={() =>
                  q.setFilters({
                    ...q.filters,
                    bankAccount: "all",
                    dateRange: "all",
                    amountRange: "all",
                    method: "all",
                    remittanceSource: "all",
                    assignedTo: "all",
                  })
                }
                className="text-xs text-slate-500 hover:text-red-600 underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="flex gap-4">
            {q.showFilterSidebar && (
              <CashAppFilterRail filters={q.filters} onFilterChange={q.setFilters} />
            )}

            <div className="flex-1">
              {q.selectedIds.length > 0 && (
                <Card className="mb-4 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {q.selectedIds.length} payment{q.selectedIds.length !== 1 ? "s" : ""} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => q.handleBulkAction("approve")}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve Auto-Matches
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => q.handleBulkAction("reprocess")}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reprocess
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => q.handleBulkAction("generate")}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate Output
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => q.handleBulkAction("email")}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => q.handleBulkAction("assign")}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => q.handleBulkAction("non-ar")}>
                        <Ban className="w-4 h-4 mr-2" />
                        Mark Non-AR
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => q.handleBulkAction("ignore")}>
                        <EyeOff className="w-4 h-4 mr-2" />
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
                          <th className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left w-10`}>
                            <Checkbox
                              checked={q.areAllOnPageSelected}
                              onCheckedChange={q.handleSelectAll}
                              className="border-slate-300"
                            />
                          </th>
                          {["Payment #", "Date", "Amount", "Payer Name", "Customer", "Remittance", "Status", "Match Type", "JE", "Bank Match", "Confidence", "Actions"].map((header) => (
                            <th
                              key={header}
                              className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {q.isLoading ? (
                          <TableSkeletonRows rowCount={q.pageSize} columnCount={13} />
                        ) : (
                          <>
                            {q.showSelectAllBanner && (
                              <tr className="bg-blue-50 border-b-2 border-blue-200">
                                <td
                                  colSpan={13}
                                  className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-blue-900">
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
                              const isCritical =
                                payment.tags?.includes("High Priority") || payment.amount > 100000;
                              return (
                                <tr
                                  key={payment.id}
                                  className={`
                                    relative cursor-pointer transition-all duration-150 ease-out
                                    ${isSelected ? "bg-blue-50" : isHovered ? "bg-slate-50" : "bg-white"}
                                    ${isCritical ? "border-l-2 border-l-red-500" : isSelected ? "border-l-2 border-l-blue-500" : ""}
                                  `}
                                  onMouseEnter={() => q.setHoveredRowId(payment.id)}
                                  onMouseLeave={() => q.setHoveredRowId(null)}
                                  onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                                    if ((e.target as HTMLElement).closest("button")) return;
                                    q.handleRowClick(payment);
                                  }}
                                >
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}>
                                    <div className="flex items-center gap-2">
                                      {isCritical && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => q.handleSelectPayment(payment.id, checked as boolean)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="border-slate-300"
                                      />
                                    </div>
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm font-medium text-blue-600`}>
                                    {payment.paymentNumber}
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm text-slate-700`}>
                                    {payment.date}
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm font-semibold text-slate-900`}>
                                    {q.formatCurrency(payment.amount)}
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm font-medium text-slate-800`}>
                                    {payment.payerNameRaw}
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm text-slate-700`}>
                                    {payment.customerName}
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm text-slate-500`}>
                                    {payment.remittanceSource}
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}>
                                    <div className="flex flex-col gap-1">
                                      {getStatusBadge(
                                        payment.je_workflow_state === "POSTED" ? "Posted" : payment.status
                                      )}
                                      {payment.status === "Exception" && getExceptionReasonBadge(payment)}
                                    </div>
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}>
                                    {payment.status === "AutoMatched" ? (
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
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}>
                                    {payment.je_flow_state === "SUBMITTED" ? (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                                        Pending
                                      </Badge>
                                    ) : payment.je_required ? (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                                        <BookOpen className="w-3 h-3 mr-1" />
                                        JE
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}>
                                    {getBankMatchBadge(payment)}
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}>
                                    <div className="flex items-center gap-2">
                                      <ConfidenceMeter confidence={payment.confidenceScore} />
                                      <WhyIndicator explainability={payment.explainability} />
                                    </div>
                                  </td>
                                  <td className={`${q.density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}>
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
                                      isHovered={isHovered}
                                    />
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
