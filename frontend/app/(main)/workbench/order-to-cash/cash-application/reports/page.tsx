"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, DollarSign, Layers, TrendingUp } from "lucide-react";

type TimeRange = "Today" | "Week" | "Month";
type StatusBucket = "AUTO_MATCHED" | "EXCEPTION" | "PENDING_POST" | "SETTLEMENT_PENDING" | "POSTED";

type ReportPayment = {
  payment_id: string;
  received_date: string;
  amount: number;
  status_bucket: StatusBucket;
  posted_flag: boolean;
  posted_date?: string;
  exception_reason?: string;
  pending_post_state?: string;
  je_required: boolean;
  je_type?: string;
  assigned_to?: string;
  sla_age_hours: number;
  sla_breached: boolean;
  remittance_present: boolean;
  remittance_parse_error: boolean;
  netsuite_sync_risk: boolean;
};

const TIME_RANGES: TimeRange[] = ["Today", "Week", "Month"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatHours = (hours: number) => `${hours.toFixed(1)} hrs`;

const makeDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  date.setHours(9, 0, 0, 0);
  return date.toISOString().split("T")[0];
};

const generateReportPayments = (): ReportPayment[] => {
  const reasons = [
    "Missing Remittance",
    "JE Required",
    "Amount Mismatch",
    "Duplicate Suspected",
    "Settlement Pending",
    "NetSuite Sync Pending",
    "Other",
  ];
  const analysts = [
    "Sarah Chen",
    "Michael Roberts",
    "Jessica Martinez",
    "David Kim",
    "Emily Taylor",
  ];
  const records: ReportPayment[] = [];

  for (let i = 0; i < 36; i += 1) {
    const offset = i % 20;
    const amount = 12000 + ((i * 3700) % 85000);
    const statusBucket: StatusBucket =
      i % 9 === 0
        ? "SETTLEMENT_PENDING"
        : i % 7 === 0
          ? "PENDING_POST"
          : i % 5 === 0
            ? "EXCEPTION"
            : i % 4 === 0
              ? "POSTED"
              : "AUTO_MATCHED";
    const postedFlag = statusBucket === "POSTED" || statusBucket === "AUTO_MATCHED";
    const postedDate = postedFlag ? makeDate(Math.max(0, offset - 1)) : undefined;
    const exceptionReason = statusBucket === "EXCEPTION" ? reasons[i % reasons.length] : undefined;
    const pendingPostState =
      statusBucket === "PENDING_POST"
        ? i % 2 === 0
          ? "JE_APPROVAL_PENDING"
          : "SYNC_PENDING"
        : undefined;
    const jeRequired =
      statusBucket === "PENDING_POST" || (statusBucket === "EXCEPTION" && i % 3 === 0);
    const slaAgeHours = 4 + ((i * 3) % 60);
    const slaBreached = slaAgeHours > 48;
    const remittancePresent = i % 6 !== 0;
    const remittanceParseError = i % 17 === 0;
    const netsuiteSyncRisk = i % 11 === 0;
    const assignedTo = i % 4 === 0 ? analysts[i % analysts.length] : undefined;

    records.push({
      payment_id: `PMT-REP-${1000 + i}`,
      received_date: makeDate(offset),
      amount,
      status_bucket: statusBucket,
      posted_flag: postedFlag,
      posted_date: postedDate,
      exception_reason: exceptionReason,
      pending_post_state: pendingPostState,
      je_required: jeRequired,
      je_type: jeRequired ? (i % 2 === 0 ? "Intercompany" : "Manual JE") : undefined,
      assigned_to: assignedTo,
      sla_age_hours: slaAgeHours,
      sla_breached: slaBreached,
      remittance_present: remittancePresent,
      remittance_parse_error: remittanceParseError,
      netsuite_sync_risk: netsuiteSyncRisk,
    });
  }

  return records;
};

const getQueueLink = (driver: string) => {
  const params = new URLSearchParams();
  const map: Record<string, { segment?: string; status?: string; context?: string }> = {
    "Missing Remittance": {
      segment: "Exception",
      status: "Exception",
      context: "MissingRemittance",
    },
    "JE Required": {
      segment: "PendingToPost",
      status: "PendingToPost",
      context: "JE_APPROVAL_PENDING",
    },
    "Settlement Pending": { segment: "SettlementPending", status: "SettlementPending" },
    "NetSuite Sync Pending": {
      segment: "PendingToPost",
      status: "PendingToPost",
      context: "SYNC_PENDING",
    },
    "Amount Mismatch": { segment: "Exception", status: "Exception", context: "AmountMismatch" },
    "Duplicate Suspected": {
      segment: "Exception",
      status: "Exception",
      context: "DuplicateSuspected",
    },
    Other: { segment: "Exception", status: "Exception", context: "Other" },
  };
  const config = map[driver];
  if (config?.segment) params.set("segment", config.segment);
  if (config?.status) params.set("status", config.status);
  if (config?.context) params.set("context", config.context);
  const query = params.toString();
  return `/workbench/order-to-cash/cash-application/payments${query ? `?${query}` : ""}`;
};

export default function CashApplicationReportsPage() {
  const router = useRouter();
  const [range, setRange] = useState<TimeRange>("Month");
  const [funnelMetric, setFunnelMetric] = useState<"count" | "amount">("count");

  const reportPayments = useMemo(() => generateReportPayments(), []);

  const anchorDate = useMemo(() => {
    const dates = reportPayments.map((item) => new Date(item.received_date));
    return new Date(Math.max(...dates.map((date) => date.getTime())));
  }, [reportPayments]);

  const rangeStart = useMemo(() => {
    const start = new Date(anchorDate);
    if (range === "Today") {
      start.setHours(0, 0, 0, 0);
      return start;
    }
    const days = range === "Week" ? 7 : 30;
    start.setDate(start.getDate() - days);
    return start;
  }, [anchorDate, range]);

  const paymentsInRange = useMemo(() => {
    return reportPayments.filter((item) => {
      const receivedAt = new Date(item.received_date);
      return receivedAt >= rangeStart && receivedAt <= anchorDate;
    });
  }, [reportPayments, rangeStart, anchorDate]);

  const summary = useMemo(() => {
    const totalAmount = paymentsInRange.reduce((sum, payment) => sum + payment.amount, 0);
    const postedPayments = paymentsInRange.filter((payment) => payment.posted_flag);
    const pendingPayments = paymentsInRange.filter((payment) => !payment.posted_flag);

    return {
      totalAmount,
      totalCount: paymentsInRange.length,
      postedAmount: postedPayments.reduce((sum, payment) => sum + payment.amount, 0),
      postedCount: postedPayments.length,
      pendingAmount: pendingPayments.reduce((sum, payment) => sum + payment.amount, 0),
      pendingCount: pendingPayments.length,
    };
  }, [paymentsInRange]);

  const processingBuckets = useMemo(() => {
    const totalAmount = paymentsInRange.reduce((sum, payment) => sum + payment.amount, 0) || 1;
    const autoItems = paymentsInRange.filter((item) => item.status_bucket === "AUTO_MATCHED");
    const manualItems = paymentsInRange.filter(
      (item) => item.status_bucket === "EXCEPTION" || item.status_bucket === "PENDING_POST"
    );
    const nonArItems = paymentsInRange.filter(
      (item) => item.exception_reason === "Other" && !item.remittance_present
    );

    return [
      {
        key: "AUTO",
        label: "Auto Processed",
        count: autoItems.length,
        amount: autoItems.reduce((sum, item) => sum + item.amount, 0),
      },
      {
        key: "MANUAL",
        label: "Manual Processed (incl. JE)",
        count: manualItems.length,
        amount: manualItems.reduce((sum, item) => sum + item.amount, 0),
      },
      {
        key: "NON_AR",
        label: "Non-AR",
        count: nonArItems.length,
        amount: nonArItems.reduce((sum, item) => sum + item.amount, 0),
      },
    ].map((bucket) => ({
      ...bucket,
      share: Math.round((bucket.amount / totalAmount) * 100),
    }));
  }, [paymentsInRange]);

  const kpiSubRow = useMemo(() => {
    const posted = paymentsInRange.filter((item) => item.posted_flag && item.posted_date);
    const postDurations = posted.map((item) => {
      const received = new Date(item.received_date).getTime();
      const postedAt = new Date(item.posted_date || item.received_date).getTime();
      return Math.max(0.5, (postedAt - received) / 3600000);
    });
    const avgTime = postDurations.length
      ? postDurations.reduce((sum, val) => sum + val, 0) / postDurations.length
      : 0;
    const medianTime = postDurations.length
      ? [...postDurations].sort((a, b) => a - b)[Math.floor(postDurations.length / 2)]
      : 0;
    const slaBreaches = paymentsInRange.filter((item) => item.sla_breached).length;
    const autoMatchRate = summary.totalCount
      ? Math.round(
          (paymentsInRange.filter((item) => item.status_bucket === "AUTO_MATCHED").length /
            summary.totalCount) *
            100
        )
      : 0;
    const jeVolume = paymentsInRange.filter((item) => item.je_required).length;
    const remittanceCoverage = summary.totalCount
      ? Math.round(
          (paymentsInRange.filter((item) => item.remittance_present).length / summary.totalCount) *
            100
        )
      : 0;
    const settlementPending = paymentsInRange.filter(
      (item) => item.status_bucket === "SETTLEMENT_PENDING"
    ).length;

    return {
      avgTime,
      medianTime,
      slaBreaches,
      autoMatchRate,
      jeVolume,
      remittanceCoverage,
      settlementPending,
    };
  }, [paymentsInRange, summary.totalCount]);

  const insightStrip = useMemo(() => {
    const pending = paymentsInRange.filter((item) => !item.posted_flag);
    const pendingByReason = pending.reduce<Record<string, number>>((acc, item) => {
      const reason = item.exception_reason || "Other";
      acc[reason] = (acc[reason] || 0) + item.amount;
      return acc;
    }, {});
    const biggest = Object.entries(pendingByReason).sort((a, b) => b[1] - a[1])[0];
    const agingRisk = pending.filter((item) => item.sla_age_hours > 24).length;

    const currentErrors = paymentsInRange.filter((item) => item.remittance_parse_error).length;
    const previousPeriodStart = new Date(rangeStart);
    previousPeriodStart.setDate(
      previousPeriodStart.getDate() - (range === "Today" ? 1 : range === "Week" ? 7 : 30)
    );
    const previousPeriodEnd = rangeStart;
    const previousErrors = reportPayments.filter((item) => {
      const date = new Date(item.received_date);
      return date >= previousPeriodStart && date < previousPeriodEnd && item.remittance_parse_error;
    }).length;

    return {
      blocker: biggest
        ? `${biggest[0]} is driving ${Math.round((biggest[1] / Math.max(summary.pendingAmount, 1)) * 100)}% of pending dollars.`
        : "No pending blockers detected.",
      aging: `${agingRisk} payments are older than 24 hours and trending to SLA breach.`,
      quality: `Remittance parse failures increased vs last period (${previousErrors} → ${currentErrors}).`,
    };
  }, [paymentsInRange, rangeStart, range, reportPayments, summary.pendingAmount]);

  const trendSeries = useMemo(() => {
    const days = range === "Today" ? 1 : range === "Week" ? 7 : 14;
    const labels: string[] = [];
    const receivedSeries: number[] = [];
    const postedSeries: number[] = [];
    const pendingSeries: number[] = [];

    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(anchorDate);
      date.setDate(date.getDate() - i);
      const label = date.toISOString().split("T")[0];
      labels.push(label.slice(5));
      const daily = paymentsInRange.filter((item) => item.received_date === label);
      receivedSeries.push(daily.reduce((sum, item) => sum + item.amount, 0));
      postedSeries.push(
        daily.filter((item) => item.posted_flag).reduce((sum, item) => sum + item.amount, 0)
      );
      pendingSeries.push(
        daily.filter((item) => !item.posted_flag).reduce((sum, item) => sum + item.amount, 0)
      );
    }

    const max = Math.max(...receivedSeries, ...postedSeries, ...pendingSeries, 1);
    return {
      labels,
      received: receivedSeries.map((value) => Math.round((value / max) * 100)),
      posted: postedSeries.map((value) => Math.round((value / max) * 100)),
      pending: pendingSeries.map((value) => Math.round((value / max) * 100)),
      tooltip: labels.map((label, idx) => ({
        label,
        received: receivedSeries[idx],
        posted: postedSeries[idx],
        pending: pendingSeries[idx],
        count: paymentsInRange.filter((item) => item.received_date.endsWith(label)).length,
      })),
    };
  }, [anchorDate, paymentsInRange, range]);

  const funnelBuckets = useMemo(() => {
    const buckets: Array<{ label: string; key: StatusBucket }> = [
      { label: "Auto-Matched", key: "AUTO_MATCHED" },
      { label: "Exceptions", key: "EXCEPTION" },
      { label: "Pending to Post", key: "PENDING_POST" },
      { label: "Settlement Pending", key: "SETTLEMENT_PENDING" },
      { label: "Posted", key: "POSTED" },
    ];
    const total =
      paymentsInRange.reduce(
        (sum, item) => sum + (funnelMetric === "count" ? 1 : item.amount),
        0
      ) || 1;

    return buckets.map((bucket) => {
      const items = paymentsInRange.filter((item) => item.status_bucket === bucket.key);
      const value = items.reduce(
        (sum, item) => sum + (funnelMetric === "count" ? 1 : item.amount),
        0
      );
      return {
        ...bucket,
        value,
        percent: Math.round((value / total) * 100),
      };
    });
  }, [paymentsInRange, funnelMetric]);

  const driverBreakdown = useMemo(() => {
    const pending = paymentsInRange.filter((item) => !item.posted_flag);
    const drivers = [
      "Missing Remittance",
      "JE Required",
      "Settlement Pending",
      "NetSuite Sync Pending",
      "Amount Mismatch",
      "Duplicate Suspected",
      "Other",
    ];
    const summaryMap = drivers.reduce<
      Record<string, { count: number; amount: number; ages: number[]; analysts: string[] }>
    >((acc, driver) => {
      acc[driver] = { count: 0, amount: 0, ages: [], analysts: [] };
      return acc;
    }, {});

    pending.forEach((item) => {
      const reason = item.exception_reason || "Other";
      const driver = drivers.includes(reason) ? reason : "Other";
      summaryMap[driver].count += 1;
      summaryMap[driver].amount += item.amount;
      summaryMap[driver].ages.push(item.sla_age_hours);
      if (item.assigned_to) summaryMap[driver].analysts.push(item.assigned_to);
    });

    return drivers.map((driver) => {
      const entry = summaryMap[driver];
      const avgAge = entry.ages.length
        ? entry.ages.reduce((sum, age) => sum + age, 0) / entry.ages.length
        : 0;
      const topAnalyst =
        entry.analysts.sort(
          (a, b) =>
            entry.analysts.filter((name) => name === b).length -
            entry.analysts.filter((name) => name === a).length
        )[0] || "Unassigned";
      const percentPending = summary.pendingAmount
        ? Math.round((entry.amount / summary.pendingAmount) * 100)
        : 0;
      const slaRisk = avgAge > 48 ? "High" : avgAge > 24 ? "Med" : "Low";
      return {
        driver,
        count: entry.count,
        amount: entry.amount,
        avgAge,
        topAnalyst,
        percentPending,
        slaRisk,
      };
    });
  }, [paymentsInRange, summary.pendingAmount]);

  const exceptionPareto = useMemo(() => {
    const sorted = [...driverBreakdown].sort((a, b) => b.amount - a.amount);
    const total = sorted.reduce((sum, item) => sum + item.amount, 0) || 1;
    let cumulative = 0;
    return sorted.map((item) => {
      cumulative += item.amount;
      return {
        ...item,
        cumulativePercent: Math.round((cumulative / total) * 100),
        percent: Math.round((item.amount / total) * 100),
      };
    });
  }, [driverBreakdown]);

  const agingBuckets = useMemo(() => {
    const buckets = [
      { label: "0–4 hrs", min: 0, max: 4 },
      { label: "4–12 hrs", min: 4, max: 12 },
      { label: "12–24 hrs", min: 12, max: 24 },
      { label: "24–48 hrs", min: 24, max: 48 },
      { label: "48+ hrs", min: 48, max: Infinity },
    ];
    return buckets.map((bucket) => {
      const items = paymentsInRange.filter(
        (item) =>
          !item.posted_flag && item.sla_age_hours >= bucket.min && item.sla_age_hours < bucket.max
      );
      const byStream = {
        Exceptions: items.filter((item) => item.status_bucket === "EXCEPTION").length,
        Pending: items.filter((item) => item.status_bucket === "PENDING_POST").length,
        Settlement: items.filter((item) => item.status_bucket === "SETTLEMENT_PENDING").length,
      };
      const total = byStream.Exceptions + byStream.Pending + byStream.Settlement || 1;
      return { ...bucket, byStream, total };
    });
  }, [paymentsInRange]);

  const slaTable = useMemo(() => {
    return paymentsInRange
      .filter((item) => item.sla_breached)
      .sort((a, b) => b.sla_age_hours - a.sla_age_hours)
      .slice(0, 10);
  }, [paymentsInRange]);

  const analystWorkload = useMemo(() => {
    const analystMap = new Map<string, ReportPayment[]>();
    paymentsInRange.forEach((item) => {
      if (!item.assigned_to) return;
      if (!analystMap.has(item.assigned_to)) analystMap.set(item.assigned_to, []);
      analystMap.get(item.assigned_to)?.push(item);
    });

    return Array.from(analystMap.entries()).map(([analyst, items]) => {
      const completed = items.filter((item) => item.posted_flag);
      const inQueue = items.filter((item) => !item.posted_flag).length;
      const pendingAmount = items
        .filter((item) => !item.posted_flag)
        .reduce((sum, item) => sum + item.amount, 0);
      const autoCleared = items.filter((item) => item.status_bucket === "AUTO_MATCHED").length;
      const manualActions = items.filter(
        (item) => item.status_bucket === "EXCEPTION" || item.status_bucket === "PENDING_POST"
      ).length;
      const jeTasks = items.filter((item) => item.je_required).length;
      const remittanceRequests = items.filter((item) => !item.remittance_present).length;
      const utilization = items.length ? Math.round((completed.length / items.length) * 100) : 0;
      const avgTime = completed.length
        ? Math.round(
            completed.reduce((sum, item) => sum + (item.sla_age_hours || 0), 0) / completed.length
          )
        : 0;
      const breaches = items.filter((item) => item.sla_breached).length;

      return {
        analyst,
        assigned: items.length,
        completed: completed.length,
        breaches,
        avgHours: avgTime,
        inQueue,
        pendingAmount,
        autoCleared,
        manualActions,
        jeTasks,
        remittanceRequests,
        utilization,
      };
    });
  }, [paymentsInRange]);

  const analystThroughput = useMemo(() => {
    const days = 7;
    const labels: string[] = [];
    const series = Array.from({ length: days }, () => ({
      posted: 0,
      resolved: 0,
      escalated: 0,
    }));

    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(anchorDate);
      date.setDate(date.getDate() - i);
      labels.push(date.toISOString().split("T")[0].slice(5));
    }

    paymentsInRange.forEach((item) => {
      const index = labels.findIndex((label) => item.received_date.endsWith(label));
      if (index === -1) return;
      if (item.posted_flag) {
        series[index].posted += 1;
      } else if (item.status_bucket === "EXCEPTION") {
        series[index].escalated += 1;
      } else {
        series[index].resolved += 1;
      }
    });

    const max = Math.max(...series.map((item) => item.posted + item.resolved + item.escalated), 1);
    return { labels, series, max };
  }, [paymentsInRange, anchorDate]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Cash Application — Reports</h1>
            <p className="text-sm text-gray-600 mt-1">
              Operational workload + posting visibility (Phase 1)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {TIME_RANGES.map((option) => (
              <Button
                key={option}
                variant={range === option ? "default" : "outline"}
                size="sm"
                onClick={() => setRange(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Cash Received</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(summary.totalAmount)}
                </p>
                <p className="text-[11px] text-gray-500">Count: {summary.totalCount} payments</p>
              </div>
              <DollarSign className="w-6 h-6 text-emerald-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Posted to NetSuite</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(summary.postedAmount)}
                </p>
                <p className="text-[11px] text-gray-500">Count: {summary.postedCount} payments</p>
              </div>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Pending / Not Posted</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(summary.pendingAmount)}
                </p>
                <p className="text-[11px] text-gray-500">Count: {summary.pendingCount} payments</p>
              </div>
              <Layers className="w-6 h-6 text-amber-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {processingBuckets.map((bucket) => (
            <Card key={bucket.key} className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{bucket.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{bucket.count} payments</p>
                  <p className="text-xs text-gray-700">{formatCurrency(bucket.amount)}</p>
                  <p className="text-[11px] text-gray-500">{bucket.share}% of total</p>
                </div>
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <Card className="p-3">
            <p className="text-xs text-gray-500">Avg Time to Post</p>
            <p className="text-lg font-semibold text-gray-900">{formatHours(kpiSubRow.avgTime)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Median: {formatHours(kpiSubRow.medianTime)}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">SLA Breaches</p>
            <p className="text-lg font-semibold text-gray-900">{kpiSubRow.slaBreaches}</p>
            <p className="text-xs text-gray-500 mt-1">This period</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">Auto-Match Rate</p>
            <p className="text-lg font-semibold text-gray-900">{kpiSubRow.autoMatchRate}%</p>
            <p className="text-xs text-gray-500 mt-1">of received</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">JE Volume</p>
            <p className="text-lg font-semibold text-gray-900">{kpiSubRow.jeVolume}</p>
            <p className="text-xs text-gray-500 mt-1">incl. intercompany + manual</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">Remittance Coverage</p>
            <p className="text-lg font-semibold text-gray-900">{kpiSubRow.remittanceCoverage}%</p>
            <p className="text-xs text-gray-500 mt-1">payments with remittance</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">Settlement Pending</p>
            <p className="text-lg font-semibold text-gray-900">{kpiSubRow.settlementPending}</p>
            <p className="text-xs text-gray-500 mt-1">awaiting final file</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Biggest blocker today</p>
            <p className="text-sm font-medium text-gray-900">{insightStrip.blocker}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Aging risk</p>
            <p className="text-sm font-medium text-gray-900">{insightStrip.aging}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">Data quality</p>
            <p className="text-sm font-medium text-gray-900">{insightStrip.quality}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Posting Trend</h2>
                <p className="text-xs text-gray-500">Cash received vs posted vs pending</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Cash Received
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Posted
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Pending
                </span>
              </div>
            </div>
            <div className="relative h-44 w-full">
              <div className="absolute inset-0 grid grid-rows-4 gap-0.5 text-xs text-gray-300">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={`grid-${idx}`} className="border-t border-dashed border-gray-200" />
                ))}
              </div>
              <svg viewBox="0 0 100 100" className="relative h-full w-full">
                {trendSeries.pending.map((value, idx) => {
                  const x = (idx / Math.max(trendSeries.pending.length - 1, 1)) * 100;
                  const y = 100 - value;
                  return (
                    <circle
                      key={`pending-${idx}`}
                      cx={x}
                      cy={y}
                      r="1.6"
                      fill="#f59e0b"
                      opacity="0.5"
                    />
                  );
                })}
                {trendSeries.received.map((value, idx) => {
                  const x = (idx / Math.max(trendSeries.received.length - 1, 1)) * 100;
                  const y = 100 - value;
                  const tooltip = trendSeries.tooltip[idx];
                  return (
                    <circle key={`received-${idx}`} cx={x} cy={y} r="2" fill="#2563eb">
                      <title>
                        {`${tooltip.label} • Received ${formatCurrency(tooltip.received)} • Posted ${formatCurrency(tooltip.posted)} • Pending ${formatCurrency(tooltip.pending)}`}
                      </title>
                    </circle>
                  );
                })}
                {trendSeries.posted.map((value, idx) => {
                  const x = (idx / Math.max(trendSeries.posted.length - 1, 1)) * 100;
                  const y = 100 - value;
                  return <circle key={`posted-${idx}`} cx={x} cy={y} r="2" fill="#10b981" />;
                })}
              </svg>
              <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                {trendSeries.labels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Workstreams Funnel</h2>
                <p className="text-xs text-gray-500">Workload distribution</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={funnelMetric === "count" ? "default" : "outline"}
                  onClick={() => setFunnelMetric("count")}
                >
                  Count
                </Button>
                <Button
                  size="sm"
                  variant={funnelMetric === "amount" ? "default" : "outline"}
                  onClick={() => setFunnelMetric("amount")}
                >
                  Amount
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {funnelBuckets.map((bucket) => (
                <div key={bucket.key}>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>{bucket.label}</span>
                    <span>{bucket.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${bucket.percent}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {funnelMetric === "count"
                      ? `${bucket.value} items`
                      : formatCurrency(bucket.value)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Exception Drivers (Pareto)</h2>
              <p className="text-xs text-gray-500">Pending amount by reason with cumulative %</p>
            </div>
          </div>
          <div className="space-y-2">
            {exceptionPareto.map((item) => (
              <div key={item.driver} className="flex items-center gap-3">
                <div className="w-40 text-xs text-gray-600">{item.driver}</div>
                <div className="flex-1">
                  <div className="h-3 bg-slate-100 rounded-full">
                    <div
                      className="h-3 rounded-full bg-amber-500"
                      style={{ width: `${item.percent}%` }}
                      title={`${formatCurrency(item.amount)} (${item.percent}%)`}
                    />
                  </div>
                </div>
                <div className="w-14 text-xs text-gray-500">{item.cumulativePercent}%</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-0">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-900">Top Drivers of Pending Work</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Avg Age (hrs)</TableHead>
                <TableHead>SLA Risk</TableHead>
                <TableHead>Top Analyst</TableHead>
                <TableHead>% of Pending $</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverBreakdown.map((row) => (
                <TableRow key={row.driver}>
                  <TableCell className="font-medium">{row.driver}</TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>{formatCurrency(row.amount)}</TableCell>
                  <TableCell>{row.avgAge.toFixed(1)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        row.slaRisk === "High"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : row.slaRisk === "Med"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    >
                      {row.slaRisk}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.topAnalyst}</TableCell>
                  <TableCell>{row.percentPending}%</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => router.push(getQueueLink(row.driver))}
                    >
                      View in Queue
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Pending Aging &amp; SLA</h2>
              <p className="text-xs text-gray-500">Aging buckets split by stream</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-6">
            {agingBuckets.map((bucket) => (
              <div key={bucket.label} className="border rounded-md p-3">
                <div className="text-xs text-gray-500 mb-2">{bucket.label}</div>
                <div className="space-y-1">
                  {(["Exceptions", "Pending", "Settlement"] as const).map((stream) => {
                    const count = bucket.byStream[stream];
                    const percent = Math.round((count / bucket.total) * 100);
                    const color =
                      stream === "Exceptions"
                        ? "bg-amber-500"
                        : stream === "Pending"
                          ? "bg-blue-500"
                          : "bg-slate-500";
                    return (
                      <div key={stream}>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>{stream}</span>
                          <span>{count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full">
                          <div
                            className={`h-1.5 rounded-full ${color}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border rounded-md">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-gray-900">SLA Breach Watchlist</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Age (hrs)</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slaTable.map((item) => (
                  <TableRow key={item.payment_id}>
                    <TableCell className="font-medium text-blue-600">{item.payment_id}</TableCell>
                    <TableCell>{item.assigned_to || "Unassigned"}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{item.sla_age_hours}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200"
                      >
                        {item.exception_reason || item.status_bucket}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.assigned_to || "Unassigned"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/workbench/order-to-cash/cash-application/payments?paymentId=${item.payment_id}`
                          )
                        }
                      >
                        Open Record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Analyst Throughput (Daily)</h2>
              <p className="text-xs text-gray-500">Posted vs resolved vs escalated</p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-28">
            {analystThroughput.series.map((day, idx) => {
              const total = day.posted + day.resolved + day.escalated || 1;
              return (
                <div key={`throughput-${idx}`} className="flex-1 flex flex-col justify-end gap-1">
                  <div className="flex flex-col justify-end h-24 bg-slate-100 rounded-md overflow-hidden">
                    <div
                      className="bg-emerald-500"
                      style={{ height: `${(day.posted / total) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ height: `${(day.resolved / total) * 100}%` }}
                    />
                    <div
                      className="bg-amber-500"
                      style={{ height: `${(day.escalated / total) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 text-center">
                    {analystThroughput.labels[idx]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Posted
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Resolved
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Escalated
            </span>
          </div>
        </Card>

        <Card className="p-0">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-900">Analyst Workload</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analyst</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>SLA Breaches</TableHead>
                <TableHead>Avg time to post</TableHead>
                <TableHead>In Queue</TableHead>
                <TableHead>Pending $</TableHead>
                <TableHead>Auto Cleared</TableHead>
                <TableHead>Manual Actions</TableHead>
                <TableHead>JE Tasks</TableHead>
                <TableHead>Remittance Requests Sent</TableHead>
                <TableHead>Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analystWorkload.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-sm text-gray-500">
                    No analyst assignments in this period.
                  </TableCell>
                </TableRow>
              ) : (
                analystWorkload.map((row) => (
                  <TableRow key={row.analyst}>
                    <TableCell className="font-medium">{row.analyst}</TableCell>
                    <TableCell>{row.assigned}</TableCell>
                    <TableCell>{row.completed}</TableCell>
                    <TableCell>{row.breaches}</TableCell>
                    <TableCell>{row.avgHours} hrs</TableCell>
                    <TableCell>{row.inQueue}</TableCell>
                    <TableCell>{formatCurrency(row.pendingAmount)}</TableCell>
                    <TableCell>{row.autoCleared}</TableCell>
                    <TableCell>{row.manualActions}</TableCell>
                    <TableCell>{row.jeTasks}</TableCell>
                    <TableCell>{row.remittanceRequests}</TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${row.utilization}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">
                          {row.utilization}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing Categories (BRD Buckets)</p>
                <p className="text-xs text-gray-500 mt-1">Automatically Processed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {processingBuckets[0].count} payments
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(processingBuckets[0].amount)} • {processingBuckets[0].share}%
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() =>
                  router.push(
                    "/workbench/order-to-cash/cash-application/payments?segment=AutoMatched&status=AutoMatched"
                  )
                }
              >
                View Payments
              </Button>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mt-1">Manually Processed (incl. JE)</p>
                <p className="text-lg font-semibold text-gray-900">
                  {processingBuckets[1].count} payments
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(processingBuckets[1].amount)} • {processingBuckets[1].share}%
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() =>
                  router.push(
                    "/workbench/order-to-cash/cash-application/payments?segment=Exception&status=Exception"
                  )
                }
              >
                View Payments
              </Button>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mt-1">Non-AR</p>
                <p className="text-lg font-semibold text-gray-900">
                  {processingBuckets[2].count} payments
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(processingBuckets[2].amount)} • {processingBuckets[2].share}%
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() =>
                  router.push("/workbench/order-to-cash/cash-application/payments?status=NonAR")
                }
              >
                View Payments
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
