"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  AlertTriangle,
  Shield,
  CalendarClock,
  ArrowLeft,
  Phone,
  Mail,
  HandCoins,
  Play,
  User,
  Star,
  Clock,
  MessageSquare,
  FileText,
  Send,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Breadcrumb from "@/components/layout/breadcrumb";
import {
  useCustomer360,
  useCollections,
  useCorrespondence,
  usePromisesToPay,
  useDunningSequences,
} from "@/hooks/data";
import type {
  Correspondence,
  PromiseToPay,
  DunningSequence,
  CorrespondenceType,
} from "@/lib/data/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = [
  "AR Summary",
  "Collection Activity",
  "Promises & Commitments",
  "Dunning Status",
  "Contacts",
] as const;
type Tab = (typeof TABS)[number];

const AGING_LABELS = ["Current", "1-30", "31-60", "61-90", "90+"] as const;
const AGING_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444"];

const CORRESPONDENCE_TYPE_COLORS: Record<CorrespondenceType, string> = {
  Dunning: "bg-red-50 text-red-700 border-red-200",
  "Follow-up": "bg-blue-50 text-blue-700 border-blue-200",
  Acknowledgement: "bg-green-50 text-green-700 border-green-200",
  Escalation: "bg-orange-50 text-orange-700 border-orange-200",
  Resolution: "bg-emerald-50 text-emerald-700 border-emerald-200",
  General: "bg-slate-50 text-slate-700 border-slate-200",
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  Email: <Mail className="h-3.5 w-3.5" />,
  Phone: <Phone className="h-3.5 w-3.5" />,
  Letter: <FileText className="h-3.5 w-3.5" />,
  SMS: <MessageSquare className="h-3.5 w-3.5" />,
  Portal: <Send className="h-3.5 w-3.5" />,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUsd(value: number): string {
  return (
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function riskBadge(risk: "Low" | "Medium" | "High" | "Critical") {
  switch (risk) {
    case "Critical":
      return <Badge variant="destructive">Critical Risk</Badge>;
    case "High":
      return (
        <Badge className="bg-orange-50 text-orange-700 border-orange-200">
          High Risk
        </Badge>
      );
    case "Medium":
      return <Badge variant="secondary">Medium Risk</Badge>;
    case "Low":
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          Low Risk
        </Badge>
      );
  }
}

function promiseStatusBadge(status: PromiseToPay["status"]) {
  switch (status) {
    case "Active":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Active
        </Badge>
      );
    case "Due Today":
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
          Due Today
        </Badge>
      );
    case "Overdue":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200">
          Overdue
        </Badge>
      );
    case "Fulfilled":
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          Fulfilled
        </Badge>
      );
    case "Broken":
      return <Badge variant="destructive">Broken</Badge>;
    case "Cancelled":
      return <Badge variant="outline">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function dunningStatusBadge(status: DunningSequence["status"]) {
  switch (status) {
    case "Active":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Active
        </Badge>
      );
    case "Paused":
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
          Paused
        </Badge>
      );
    case "Completed":
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          Completed
        </Badge>
      );
    case "Cancelled":
      return <Badge variant="outline">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function Customer360Page({
  params,
}: {
  params: { customerId: string };
}) {
  const customerId = params.customerId;

  // ── State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("AR Summary");
  const [correspondenceFilter, setCorrespondenceFilter] =
    useState<string>("All");

  // ── Data hooks ───────────────────────────────────────────────────────────
  const { data: customer, loading: customerLoading, error: customerError } =
    useCustomer360(customerId);
  const { data: allCollections, loading: collectionsLoading } =
    useCollections();
  const { data: allCorrespondence, loading: correspondenceLoading } =
    useCorrespondence(customerId);
  const { data: allPromises, loading: promisesLoading } = usePromisesToPay();
  const { data: allDunning, loading: dunningLoading } = useDunningSequences();

  const isLoading =
    customerLoading ||
    collectionsLoading ||
    correspondenceLoading ||
    promisesLoading ||
    dunningLoading;

  // ── Filtered data ────────────────────────────────────────────────────────
  const customerCorrespondence = useMemo(() => {
    return allCorrespondence.filter((c) => c.customerId === customerId);
  }, [allCorrespondence, customerId]);

  const filteredCorrespondence = useMemo(() => {
    if (correspondenceFilter === "All") return customerCorrespondence;
    return customerCorrespondence.filter(
      (c) => c.type === correspondenceFilter
    );
  }, [customerCorrespondence, correspondenceFilter]);

  const customerPromises = useMemo(() => {
    return allPromises.filter((p) => p.customerId === customerId);
  }, [allPromises, customerId]);

  const promiseSummary = useMemo(() => {
    const totalPromised = customerPromises.reduce(
      (s, p) => s + p.promisedAmount,
      0
    );
    const totalReceived = customerPromises.reduce(
      (s, p) => s + (p.receivedAmount || 0),
      0
    );
    return { totalPromised, totalReceived };
  }, [customerPromises]);

  const customerDunning = useMemo(() => {
    return allDunning.filter((d) => d.customerId === customerId);
  }, [allDunning, customerId]);

  const hasActiveDunning = useMemo(() => {
    return customerDunning.some((d) => d.status === "Active");
  }, [customerDunning]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="flex flex-col bg-white"
        style={{ height: "100%", minHeight: 0 }}
      >
        <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
          <Breadcrumb
            activeRoute="workbench/order-to-cash/collections"
            className="mb-1.5"
          />
          <div className="flex items-center gap-3 mb-1">
            <User className="h-6 w-6 text-slate-700" />
            <h1 className="text-2xl font-bold text-[#000000] mt-2">
              Customer 360
            </h1>
          </div>
          <p className="text-sm text-[#606060]">Loading customer profile...</p>
          <div className="border-b border-[#B7B7B7] mt-4" />
        </header>
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (customerError || !customer) {
    return (
      <div
        className="flex flex-col bg-white"
        style={{ height: "100%", minHeight: 0 }}
      >
        <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
          <Breadcrumb
            activeRoute="workbench/order-to-cash/collections"
            className="mb-1.5"
          />
          <div className="flex items-center gap-3 mb-1">
            <User className="h-6 w-6 text-slate-700" />
            <h1 className="text-2xl font-bold text-[#000000] mt-2">
              Customer 360
            </h1>
          </div>
          <div className="border-b border-[#B7B7B7] mt-4" />
        </header>
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-sm">
              {customerError || "Customer not found"}
            </p>
            <Link href="/workbench/order-to-cash/collections">
              <Button variant="outline" size="sm" className="gap-2 mt-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Collections
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Aging breakdown ──────────────────────────────────────────────────────
  const agingValues = [
    customer.agingBreakdown.current,
    customer.agingBreakdown.days1to30,
    customer.agingBreakdown.days31to60,
    customer.agingBreakdown.days61to90,
    customer.agingBreakdown.days90plus,
  ];
  const agingTotal = agingValues.reduce((s, v) => s + v, 0);

  // ── Credit score color ───────────────────────────────────────────────────
  const creditScoreColor =
    customer.creditScore > 70
      ? "text-green-700"
      : customer.creditScore >= 40
        ? "text-amber-700"
        : "text-red-700";
  const creditBarColor =
    customer.creditScore > 70
      ? "bg-green-500"
      : customer.creditScore >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  // ── Credit utilization ───────────────────────────────────────────────────
  const creditUtilization =
    customer.creditLimit > 0
      ? Math.min(
          Math.round((customer.totalOutstanding / customer.creditLimit) * 100),
          100
        )
      : 0;
  const creditUtilColor =
    creditUtilization > 80
      ? "bg-red-500"
      : creditUtilization > 60
        ? "bg-amber-500"
        : "bg-blue-500";

  // ── Payment history chart data ───────────────────────────────────────────
  const paymentMax = Math.max(
    ...customer.paymentHistory.map((p) => p.amountPaid),
    1
  );

  return (
    <div
      className="flex flex-col bg-white"
      style={{ height: "100%", minHeight: 0 }}
    >
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb
          activeRoute="workbench/order-to-cash/collections"
          className="mb-1.5"
        />
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/workbench/order-to-cash/collections"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Collections
          </Link>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <User className="h-6 w-6 text-slate-700" />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#000000]">
              {customer.customerName}
            </h1>
            {riskBadge(customer.riskFlag)}
          </div>
        </div>
        <p className="text-sm text-[#606060] mt-1">
          {customer.industry} | {customer.segment} | {customer.paymentTerms}
        </p>
        <div className="border-b border-[#B7B7B7] mt-4" />
      </header>

      {/* ── Scrollable Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-[1363px] mx-auto px-6 py-6 space-y-6">
          {/* ── Summary Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-4">
            {/* Total Outstanding */}
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Outstanding
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {formatUsd(customer.totalOutstanding)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Limit: {formatUsd(customer.creditLimit)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Past Due */}
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Past Due
                    </p>
                    <p className="text-2xl font-bold text-red-700 mt-1">
                      {formatUsd(customer.totalPastDue)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {customer.openDisputeCount} open dispute
                      {customer.openDisputeCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credit Score */}
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Credit Score
                    </p>
                    <p className={cn("text-2xl font-bold mt-1", creditScoreColor)}>
                      {customer.creditScore}
                      <span className="text-sm font-normal text-slate-400">
                        /100
                      </span>
                    </p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
                      <div
                        className={cn("h-1.5 rounded-full", creditBarColor)}
                        style={{ width: `${customer.creditScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center ml-3">
                    <Shield className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DSO */}
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      DSO
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {customer.dso}
                      <span className="text-sm font-normal text-slate-400 ml-1">
                        days
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Avg pay: {customer.avgDaysToPay}d vs{" "}
                      {customer.paymentTerms}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <CalendarClock className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Action Buttons ──────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Phone className="h-4 w-4" />
              Log Call
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <HandCoins className="h-4 w-4" />
              Record Promise
            </Button>
            {!hasActiveDunning && (
              <Button variant="outline" size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Start Dunning
              </Button>
            )}
          </div>

          {/* ── Tab Bar ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 border-b border-slate-200">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px",
                  activeTab === tab
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Tab Content ─────────────────────────────────────────────── */}

          {/* Tab 1: AR Summary */}
          {activeTab === "AR Summary" && (
            <div className="space-y-6">
              {/* Aging Breakdown */}
              <Card>
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-slate-800 mb-4">
                    Aging Breakdown
                  </h2>

                  {/* Stacked bar chart */}
                  <svg
                    width="100%"
                    height="48"
                    viewBox="0 0 800 48"
                    preserveAspectRatio="xMinYMid meet"
                    className="w-full mb-4"
                  >
                    {(() => {
                      let xOffset = 0;
                      const barWidth = 800;
                      return agingValues.map((val, i) => {
                        const segWidth =
                          agingTotal > 0 ? (val / agingTotal) * barWidth : 0;
                        const x = xOffset;
                        xOffset += segWidth;
                        return (
                          <g key={AGING_LABELS[i]}>
                            <rect
                              x={x}
                              y={4}
                              width={Math.max(segWidth - 1, 0)}
                              height={32}
                              rx={i === 0 ? 6 : 0}
                              fill={AGING_COLORS[i]}
                              opacity={0.85}
                            />
                            {segWidth > 60 && (
                              <text
                                x={x + segWidth / 2}
                                y={24}
                                textAnchor="middle"
                                fontSize={11}
                                fill="white"
                                fontWeight={600}
                              >
                                {AGING_LABELS[i]}
                              </text>
                            )}
                          </g>
                        );
                      });
                    })()}
                  </svg>

                  {/* Bucket grid */}
                  <div className="grid grid-cols-5 gap-3">
                    {AGING_LABELS.map((label, i) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-100 p-3 text-center"
                      >
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: AGING_COLORS[i] }}
                          />
                          <span className="text-xs font-medium text-slate-500">
                            {label}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {formatUsd(agingValues[i])}
                        </p>
                        {agingTotal > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {Math.round((agingValues[i] / agingTotal) * 100)}%
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-slate-800 mb-4">
                    Payment History (12 Months)
                  </h2>
                  <svg
                    width="100%"
                    height="200"
                    viewBox="0 0 800 200"
                    preserveAspectRatio="xMinYMid meet"
                    className="w-full"
                  >
                    {/* Y-axis labels */}
                    <text
                      x={0}
                      y={16}
                      fontSize={10}
                      fill="#94a3b8"
                      fontWeight={500}
                    >
                      {formatUsd(paymentMax)}
                    </text>
                    <text
                      x={0}
                      y={96}
                      fontSize={10}
                      fill="#94a3b8"
                      fontWeight={500}
                    >
                      {formatUsd(Math.round(paymentMax / 2))}
                    </text>
                    <text
                      x={0}
                      y={176}
                      fontSize={10}
                      fill="#94a3b8"
                      fontWeight={500}
                    >
                      $0
                    </text>

                    {/* Grid lines */}
                    <line
                      x1={80}
                      y1={10}
                      x2={780}
                      y2={10}
                      stroke="#f1f5f9"
                      strokeWidth={1}
                    />
                    <line
                      x1={80}
                      y1={90}
                      x2={780}
                      y2={90}
                      stroke="#f1f5f9"
                      strokeWidth={1}
                    />
                    <line
                      x1={80}
                      y1={170}
                      x2={780}
                      y2={170}
                      stroke="#e2e8f0"
                      strokeWidth={1}
                    />

                    {/* Bars */}
                    {customer.paymentHistory.map((entry, i) => {
                      const barAreaWidth = 700;
                      const barCount = customer.paymentHistory.length;
                      const gap = barAreaWidth / barCount;
                      const barW = Math.min(gap * 0.6, 42);
                      const x = 80 + i * gap + (gap - barW) / 2;
                      const barH =
                        paymentMax > 0
                          ? (entry.amountPaid / paymentMax) * 160
                          : 0;
                      const y = 170 - barH;
                      return (
                        <g key={entry.month}>
                          <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={Math.max(barH, 1)}
                            rx={3}
                            fill={entry.onTime ? "#22c55e" : "#ef4444"}
                            opacity={0.85}
                          />
                          <text
                            x={x + barW / 2}
                            y={190}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#64748b"
                            fontWeight={500}
                          >
                            {entry.month.length > 3
                              ? entry.month.slice(0, 3)
                              : entry.month}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-green-500" />
                      <span className="text-xs text-slate-500">On Time</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-red-500" />
                      <span className="text-xs text-slate-500">Late</span>
                    </div>
                    {customer.lastPaymentDate && (
                      <span className="text-xs text-slate-400 ml-auto">
                        Last payment: {formatDate(customer.lastPaymentDate)} -{" "}
                        {formatUsd(customer.lastPaymentAmount || 0)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Credit Utilization */}
              <Card>
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-slate-800 mb-4">
                    Credit Utilization
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-4 rounded-full transition-all",
                            creditUtilColor
                          )}
                          style={{ width: `${creditUtilization}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-lg font-bold min-w-[60px] text-right",
                        creditUtilization > 80
                          ? "text-red-700"
                          : creditUtilization > 60
                            ? "text-amber-700"
                            : "text-blue-700"
                      )}
                    >
                      {creditUtilization}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-500">
                      Outstanding: {formatUsd(customer.totalOutstanding)}
                    </span>
                    <span className="text-xs text-slate-500">
                      Credit Limit: {formatUsd(customer.creditLimit)}
                    </span>
                  </div>
                  {creditUtilization > 80 && (
                    <div className="mt-3 p-2.5 bg-red-50 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-xs text-red-700">
                        Credit utilization exceeds 80%. Consider reviewing
                        credit limit or escalating for collections.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab 2: Collection Activity */}
          {activeTab === "Collection Activity" && (
            <div className="space-y-4">
              {/* Type filter */}
              <div className="flex items-center gap-2">
                {["All", "Dunning", "Follow-up", "Escalation", "Acknowledgement", "Resolution", "General"].map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setCorrespondenceFilter(type)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                        correspondenceFilter === type
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>

              {/* Timeline */}
              {filteredCorrespondence.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      No correspondence found
                      {correspondenceFilter !== "All" &&
                        ` for type "${correspondenceFilter}"`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative pl-8">
                  {/* Vertical timeline line */}
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />

                  {filteredCorrespondence
                    .sort(
                      (a, b) =>
                        new Date(b.sentAt).getTime() -
                        new Date(a.sentAt).getTime()
                    )
                    .map((entry) => (
                      <div key={entry.id} className="relative mb-4">
                        {/* Dot on timeline */}
                        <div className="absolute -left-5 top-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white ring-1 ring-slate-200" />

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  <Badge
                                    className={cn(
                                      "text-xs",
                                      CORRESPONDENCE_TYPE_COLORS[entry.type]
                                    )}
                                  >
                                    {entry.type}
                                  </Badge>
                                  <span className="flex items-center gap-1 text-xs text-slate-500">
                                    {CHANNEL_ICONS[entry.channel]}
                                    {entry.channel}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {entry.direction}
                                  </Badge>
                                  {entry.durationMinutes != null && (
                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                      <Clock className="h-3 w-3" />
                                      {entry.durationMinutes} min
                                    </span>
                                  )}
                                </div>
                                {entry.subject && (
                                  <p className="text-sm font-medium text-slate-800 mb-1">
                                    {entry.subject}
                                  </p>
                                )}
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {entry.content}
                                </p>
                                {entry.outcome && (
                                  <div className="mt-2 flex items-center gap-1.5">
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-xs text-slate-500">
                                      Outcome:{" "}
                                      <span className="font-medium text-slate-700">
                                        {entry.outcome}
                                      </span>
                                    </span>
                                  </div>
                                )}
                                {entry.contactPerson && (
                                  <p className="text-xs text-slate-400 mt-1.5">
                                    Contact: {entry.contactPerson}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-slate-500">
                                  {formatDateTime(entry.sentAt)}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  by {entry.sentBy}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Promises & Commitments */}
          {activeTab === "Promises & Commitments" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="card-interactive">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Promised
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {formatUsd(promiseSummary.totalPromised)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      across {customerPromises.length} promise
                      {customerPromises.length !== 1 ? "s" : ""}
                    </p>
                  </CardContent>
                </Card>
                <Card className="card-interactive">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Received
                    </p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {formatUsd(promiseSummary.totalReceived)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {promiseSummary.totalPromised > 0
                        ? Math.round(
                            (promiseSummary.totalReceived /
                              promiseSummary.totalPromised) *
                              100
                          )
                        : 0}
                      % fulfillment rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              {customerPromises.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <HandCoins className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      No promises recorded for this customer
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="font-semibold text-slate-700">
                              Promised Date
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">
                              Amount
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 text-center">
                              Method
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 text-center">
                              Status
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">
                              Received
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700">
                              Notes
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700">
                              Captured By
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerPromises
                            .sort(
                              (a, b) =>
                                new Date(b.promisedDate).getTime() -
                                new Date(a.promisedDate).getTime()
                            )
                            .map((promise) => (
                              <TableRow
                                key={promise.id}
                                className="hover:bg-slate-50/50"
                              >
                                <TableCell className="font-medium text-slate-800">
                                  {formatDate(promise.promisedDate)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-slate-900">
                                  {formatUsd(promise.promisedAmount)}
                                </TableCell>
                                <TableCell className="text-center text-slate-600">
                                  {promise.paymentMethod || "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                  {promiseStatusBadge(promise.status)}
                                </TableCell>
                                <TableCell className="text-right text-slate-700">
                                  {promise.receivedAmount != null
                                    ? formatUsd(promise.receivedAmount)
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-slate-600 text-sm max-w-[200px] truncate">
                                  {promise.notes || "-"}
                                </TableCell>
                                <TableCell className="text-slate-600 text-sm">
                                  {promise.capturedBy}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tab 4: Dunning Status */}
          {activeTab === "Dunning Status" && (
            <div className="space-y-4">
              {customerDunning.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Send className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      No dunning sequences for this customer
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 mt-3"
                    >
                      <Play className="h-4 w-4" />
                      Start Dunning Sequence
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                customerDunning
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((seq) => (
                    <Card key={seq.id}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-semibold text-slate-800">
                              Dunning Sequence {seq.id}
                            </h3>
                            {dunningStatusBadge(seq.status)}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatUsd(seq.totalAmount)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {seq.invoiceIds.length} invoice
                              {seq.invoiceIds.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        {/* Step progress visualization */}
                        <div className="flex items-center justify-between mb-4 px-2">
                          {seq.steps.map((step, i) => (
                            <React.Fragment key={step.stepNumber}>
                              {/* Circle */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                                    step.completed
                                      ? "bg-green-500 border-green-500 text-white"
                                      : step.stepNumber ===
                                          seq.currentStepNumber
                                        ? "bg-primary border-primary text-white ring-4 ring-primary/20"
                                        : "bg-white border-slate-300 text-slate-400"
                                  )}
                                >
                                  {step.stepNumber}
                                </div>
                                <span
                                  className={cn(
                                    "text-xs mt-1.5 text-center max-w-[80px] leading-tight",
                                    step.completed
                                      ? "text-green-700 font-medium"
                                      : step.stepNumber ===
                                          seq.currentStepNumber
                                        ? "text-primary font-semibold"
                                        : "text-slate-400"
                                  )}
                                >
                                  {step.name}
                                </span>
                                {step.executedDate && (
                                  <span className="text-[10px] text-slate-400 mt-0.5">
                                    {formatDate(step.executedDate)}
                                  </span>
                                )}
                              </div>
                              {/* Connecting line */}
                              {i < seq.steps.length - 1 && (
                                <div
                                  className={cn(
                                    "flex-1 h-0.5 mx-1",
                                    step.completed
                                      ? "bg-green-400"
                                      : "bg-slate-200"
                                  )}
                                />
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-6 text-xs text-slate-500 border-t border-slate-100 pt-3">
                          <span>
                            Started:{" "}
                            <span className="font-medium text-slate-700">
                              {formatDate(seq.startDate)}
                            </span>
                          </span>
                          {seq.nextActionDate && (
                            <span>
                              Next Action:{" "}
                              <span className="font-medium text-slate-700">
                                {formatDate(seq.nextActionDate)}
                              </span>
                            </span>
                          )}
                          <span>
                            Step {seq.currentStepNumber} of {seq.totalSteps}
                          </span>
                        </div>

                        {/* Pause reason */}
                        {seq.status === "Paused" && seq.pauseReason && (
                          <div className="mt-3 p-2.5 bg-amber-50 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <span className="text-xs text-amber-700">
                              Paused: {seq.pauseReason}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          )}

          {/* Tab 5: Contacts */}
          {activeTab === "Contacts" && (
            <div className="space-y-4">
              {customer.contacts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      No contacts on file
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {customer.contacts.map((contact, i) => (
                    <Card
                      key={i}
                      className={cn(
                        "card-interactive",
                        contact.isPrimary && "ring-2 ring-primary/30"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {contact.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {contact.title}
                              </p>
                            </div>
                          </div>
                          {contact.isPrimary && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                              <Star className="h-3 w-3" />
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2 mt-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {contact.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {contact.phone}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes section (always visible at bottom if notes exist) */}
          {customer.notes && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Notes
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {customer.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
