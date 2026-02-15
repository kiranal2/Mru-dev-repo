"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cashAppStore } from "@/lib/cash-app-store";
import { useCashExceptions } from "@/hooks/data/use-cash-exceptions";
import { Payment } from "@/lib/cash-app-types";
import { Search, Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ExceptionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [exceptionFilter, setExceptionFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [resolutionFilter, setResolutionFilter] = useState<string>("OPEN");

  // Bridge: data hook for fetch lifecycle, store for rich Payment objects
  const { loading: dataLoading, error: dataError } = useCashExceptions();
  const payments = cashAppStore.getPayments().filter((p) => p.status === "Exception");

  const coreTypeOptions = [
    { value: "MISSING_REMIT", label: "Missing Remit" },
    { value: "AMOUNT_ISSUE", label: "Amount Issue" },
    { value: "DUPLICATE", label: "Duplicate" },
    { value: "INVOICE_ISSUE", label: "Invoice Issue" },
    { value: "CREDIT_ISSUE", label: "Credit Issue" },
    { value: "INTERCOMPANY", label: "IC / Multi-Entity" },
    { value: "SETTLEMENT", label: "Settlement" },
    { value: "JE_NEEDED", label: "JE Needed" },
  ];

  const reasonOptions = [
    { value: "MISSING_REMIT", label: "Missing Remit", core: "MISSING_REMIT" },
    { value: "REMIT_PARSE_ERROR", label: "Parse Error", core: "MISSING_REMIT" },
    { value: "SHORT_PAY", label: "Short Pay", core: "AMOUNT_ISSUE" },
    { value: "OVER_PAY", label: "Over Pay", core: "AMOUNT_ISSUE" },
    { value: "AMOUNT_MISMATCH", label: "Mismatch", core: "AMOUNT_ISSUE" },
    { value: "DUPLICATE_SUSPECTED", label: "Suspected", core: "DUPLICATE" },
    { value: "DUPLICATE_CONFIRMED", label: "Confirmed", core: "DUPLICATE" },
    { value: "DUPLICATE_DISMISSED", label: "Dismissed", core: "DUPLICATE" },
    { value: "INVOICE_NOT_FOUND", label: "Invoice Not Found", core: "INVOICE_ISSUE" },
    { value: "INVOICE_CLOSED", label: "Invoice Closed", core: "INVOICE_ISSUE" },
    { value: "INVOICE_PAID", label: "Invoice Paid", core: "INVOICE_ISSUE" },
    { value: "INVALID_INVOICE", label: "Invalid Invoice", core: "INVOICE_ISSUE" },
    { value: "INVALID_REFERENCE", label: "Invalid Ref", core: "INVOICE_ISSUE" },
    { value: "AMBIGUOUS_MATCH", label: "Ambiguous", core: "INVOICE_ISSUE" },
    { value: "INVALID_CM", label: "Invalid Credit Memo", core: "CREDIT_ISSUE" },
    { value: "CM_NOT_FOUND", label: "CM Not Found", core: "CREDIT_ISSUE" },
    { value: "CM_ALREADY_APPLIED", label: "CM Already Applied", core: "CREDIT_ISSUE" },
    { value: "MULTI_ENTITY", label: "Multi-Entity", core: "INTERCOMPANY" },
    { value: "IC_SPLIT_REQUIRED", label: "IC Split Needed", core: "INTERCOMPANY" },
    { value: "SETTLEMENT_PENDING", label: "Pending", core: "SETTLEMENT" },
    { value: "SETTLEMENT_FAILED", label: "Failed", core: "SETTLEMENT" },
    { value: "BANK_RETURN", label: "Bank Return", core: "SETTLEMENT" },
    { value: "ACH_FAILED", label: "ACH Failed", core: "SETTLEMENT" },
    { value: "BAD_DEBT_RECOVERY", label: "Bad Debt", core: "JE_NEEDED" },
    { value: "TEST_DEPOSIT", label: "Test Deposit", core: "JE_NEEDED" },
    { value: "UNAPPLIED_CASH", label: "On Account", core: "JE_NEEDED" },
    { value: "MANUAL_JE_REQUIRED", label: "Manual JE", core: "JE_NEEDED" },
  ];

  const filteredReasonOptions =
    exceptionFilter === "all"
      ? reasonOptions
      : reasonOptions.filter((option) => option.core === exceptionFilter);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      search === "" ||
      payment.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      payment.customerName.toLowerCase().includes(search.toLowerCase()) ||
      payment.customerNumber.toLowerCase().includes(search.toLowerCase());

    const matchesException =
      exceptionFilter === "all" || payment.exception_core_type === exceptionFilter;
    const matchesReason = reasonFilter === "all" || payment.exception_reason_code === reasonFilter;
    const resolvedState = payment.exception_resolution_state || "OPEN";
    const matchesResolution = resolutionFilter === "all" || resolvedState === resolutionFilter;

    return matchesSearch && matchesException && matchesReason && matchesResolution;
  });

  const exceptionCounts = {
    MissingRemittance: payments.filter((p) => p.exception_core_type === "MISSING_REMIT").length,
    ShortPay: payments.filter((p) => p.exception_core_type === "AMOUNT_ISSUE").length,
    DuplicateSuspected: payments.filter((p) => p.exception_core_type === "DUPLICATE").length,
    MultiEntity: payments.filter((p) => p.exception_core_type === "INTERCOMPANY").length,
  };

  const exceptionKPIs = [
    {
      key: "missing",
      filterValue: "MISSING_REMIT",
      label: "Missing Remit",
      count: exceptionCounts.MissingRemittance,
      dotColor: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-700",
      hoverBg: "hover:bg-amber-100",
      activeBg: "bg-amber-100",
      activeText: "text-amber-800",
      ring: "ring-amber-300",
    },
    {
      key: "amount",
      filterValue: "AMOUNT_ISSUE",
      label: "Amount Issue",
      count: exceptionCounts.ShortPay,
      dotColor: "bg-red-500",
      bg: "bg-red-50",
      text: "text-red-700",
      hoverBg: "hover:bg-red-100",
      activeBg: "bg-red-100",
      activeText: "text-red-800",
      ring: "ring-red-300",
    },
    {
      key: "duplicate",
      filterValue: "DUPLICATE",
      label: "Duplicate",
      count: exceptionCounts.DuplicateSuspected,
      dotColor: "bg-orange-500",
      bg: "bg-orange-50",
      text: "text-orange-700",
      hoverBg: "hover:bg-orange-100",
      activeBg: "bg-orange-100",
      activeText: "text-orange-800",
      ring: "ring-orange-300",
    },
    {
      key: "multi",
      filterValue: "INTERCOMPANY",
      label: "Multi Entity",
      count: exceptionCounts.MultiEntity,
      dotColor: "bg-purple-500",
      bg: "bg-purple-50",
      text: "text-purple-700",
      hoverBg: "hover:bg-purple-100",
      activeBg: "bg-purple-100",
      activeText: "text-purple-800",
      ring: "ring-purple-300",
    },
  ];

  const handleResolve = (paymentId: string) => {
    cashAppStore.updatePayment(paymentId, {
      exception_resolution_state: "RESOLVED",
    });

    cashAppStore.addActivityLog(paymentId, {
      timestamp: new Date().toISOString(),
      user: "Current User",
      action: "Resolved",
      details: "Exception marked as resolved",
    });

    toast.success("Exception resolved");
  };

  const handleReject = (paymentId: string) => {
    cashAppStore.updatePayment(paymentId, {
      exception_resolution_state: "REJECTED",
      tags: ["Rejected"],
    });

    cashAppStore.addActivityLog(paymentId, {
      timestamp: new Date().toISOString(),
      user: "Current User",
      action: "Rejected",
      details: "Exception rejected",
    });

    toast.success("Exception rejected");
  };

  const getExceptionBadge = (payment: Payment) => {
    const config = {
      MissingRemittance: { label: "Missing Remittance", color: "bg-amber-100 text-amber-800" },
      ShortPay: { label: "Short Pay", color: "bg-red-100 text-red-800" },
      OverPay: { label: "Over Pay", color: "bg-blue-100 text-blue-800" },
      DuplicateSuspected: { label: "Duplicate Suspected", color: "bg-orange-100 text-orange-800" },
      MultiEntity: { label: "Multi Entity", color: "bg-purple-100 text-purple-800" },
      SettlementFailed: { label: "Settlement Failed", color: "bg-rose-100 text-rose-800" },
      AmbiguousMatch: { label: "Ambiguous Match", color: "bg-yellow-100 text-yellow-800" },
      InvalidRef: { label: "Invalid Reference", color: "bg-gray-100 text-gray-800" },
      NeedsJE: { label: "Needs Journal Entry", color: "bg-indigo-100 text-indigo-800" },
    };
    const coreLabelMap: Record<string, string> = {
      MISSING_REMIT: "Missing Remit",
      AMOUNT_ISSUE: "Amount Issue",
      DUPLICATE: "Duplicate",
      INVOICE_ISSUE: "Invoice Issue",
      CREDIT_ISSUE: "Credit Issue",
      INTERCOMPANY: "IC / Multi-Entity",
      SETTLEMENT: "Settlement",
      JE_NEEDED: "JE Needed",
    };

    if (payment.exceptionType && config[payment.exceptionType]) {
      const entry = config[payment.exceptionType];
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${entry.color}`}>
          {entry.label}
        </span>
      );
    }

    if (payment.exception_core_type) {
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
          {coreLabelMap[payment.exception_core_type] || payment.exception_core_type}
        </span>
      );
    }

    return null;
  };

  const getReasonBadge = (payment: Payment) => {
    const label =
      payment.exception_reason_label || payment.exception_reason_code || payment.exceptionType;
    if (!label) return <span className="text-xs text-gray-400">—</span>;
    return (
      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
        {label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (dataError) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="px-6 pt-3 pb-6 flex-1 overflow-auto">
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">Error loading exceptions: {dataError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-6 pt-3 pb-6 flex-1 overflow-auto">
        {/* Compact KPI pills */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <button
            onClick={() => {
              setExceptionFilter("all");
              setReasonFilter("all");
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              exceptionFilter === "all"
                ? "bg-slate-200 text-slate-800 ring-1 ring-slate-300"
                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            All <span className="font-bold">{payments.length}</span>
          </button>
          {exceptionKPIs.map((kpi) => (
            <button
              key={kpi.key}
              onClick={() => {
                setExceptionFilter(kpi.filterValue);
                setReasonFilter("all");
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                exceptionFilter === kpi.filterValue
                  ? `${kpi.activeBg} ${kpi.activeText} ring-1 ${kpi.ring}`
                  : `${kpi.bg} ${kpi.text} ${kpi.hoverBg}`
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${kpi.dotColor}`} />
              <span className="font-bold">{kpi.count}</span>
              <span>{kpi.label}</span>
            </button>
          ))}
        </div>

        {/* Compact filter row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Search payment, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select
            value={exceptionFilter}
            onValueChange={(value) => {
              setExceptionFilter(value);
              const nextReasonOptions =
                value === "all"
                  ? reasonOptions
                  : reasonOptions.filter((option) => option.core === value);
              if (
                reasonFilter !== "all" &&
                !nextReasonOptions.some((option) => option.value === reasonFilter)
              ) {
                setReasonFilter("all");
              }
            }}
          >
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {coreTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue placeholder="All Reasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {filteredReasonOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resolutionFilter} onValueChange={setResolutionFilter}>
            <SelectTrigger className="w-[120px] h-9 text-sm">
              <SelectValue placeholder="Open" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="all">All States</SelectItem>
            </SelectContent>
          </Select>
          {(exceptionFilter !== "all" || reasonFilter !== "all" || resolutionFilter !== "OPEN") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setExceptionFilter("all");
                setReasonFilter("all");
                setResolutionFilter("OPEN");
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50/80">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Payment #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Customer
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Exception Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Assigned To
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() =>
                          router.push(
                            `/workbench/order-to-cash/cash-application/payments/${payment.id}?from=exceptions`
                          )
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {payment.paymentNumber}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-gray-600">{payment.date}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-900">{payment.customerName}</td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-3 py-2.5">{getExceptionBadge(payment)}</td>
                    <td className="px-3 py-2.5">{getReasonBadge(payment)}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-600">
                      {payment.assignedTo || <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResolve(payment.id)}
                          className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(payment.id)}
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No exceptions found matching your filters.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
