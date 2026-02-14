"use client";

import { useMemo, useState } from "react";
import type {
  TimeRange,
  ReportPayment,
  Summary,
  ProcessingBucket,
  KpiSubRow,
  InsightStrip,
  TrendSeries,
  FunnelBucket,
  DriverBreakdownItem,
  ExceptionParetoItem,
  AgingBucket,
  AnalystWorkloadItem,
  AnalystThroughput,
  StatusBucket,
} from "../types";
import { generateReportPayments } from "../constants";

export function useReports() {
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

  const summary: Summary = useMemo(() => {
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

  const processingBuckets: ProcessingBucket[] = useMemo(() => {
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

  const kpiSubRow: KpiSubRow = useMemo(() => {
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

  const insightStrip: InsightStrip = useMemo(() => {
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

  const trendSeries: TrendSeries = useMemo(() => {
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

  const funnelBuckets: FunnelBucket[] = useMemo(() => {
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

  const driverBreakdown: DriverBreakdownItem[] = useMemo(() => {
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

  const exceptionPareto: ExceptionParetoItem[] = useMemo(() => {
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

  const agingBuckets: AgingBucket[] = useMemo(() => {
    const buckets = [
      { label: "0\u20134 hrs", min: 0, max: 4 },
      { label: "4\u201312 hrs", min: 4, max: 12 },
      { label: "12\u201324 hrs", min: 12, max: 24 },
      { label: "24\u201348 hrs", min: 24, max: 48 },
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

  const slaTable: ReportPayment[] = useMemo(() => {
    return paymentsInRange
      .filter((item) => item.sla_breached)
      .sort((a, b) => b.sla_age_hours - a.sla_age_hours)
      .slice(0, 10);
  }, [paymentsInRange]);

  const analystWorkload: AnalystWorkloadItem[] = useMemo(() => {
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

  const analystThroughput: AnalystThroughput = useMemo(() => {
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

  return {
    range,
    setRange,
    funnelMetric,
    setFunnelMetric,
    summary,
    processingBuckets,
    kpiSubRow,
    insightStrip,
    trendSeries,
    funnelBuckets,
    driverBreakdown,
    exceptionPareto,
    agingBuckets,
    slaTable,
    analystWorkload,
    analystThroughput,
  };
}
