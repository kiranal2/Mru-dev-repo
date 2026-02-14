"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, DollarSign, Layers, TrendingUp } from "lucide-react";
import { TIME_RANGES, formatCurrency, formatHours } from "./constants";
import { useReports } from "./hooks/useReports";
import { PostingTrendChart } from "./components/PostingTrendChart";
import { WorkstreamsFunnel } from "./components/WorkstreamsFunnel";
import { DriverBreakdownTable } from "./components/DriverBreakdownTable";
import { PendingAgingSection } from "./components/PendingAgingSection";
import { AnalystSection } from "./components/AnalystSection";
import { ProcessingCategoriesCards } from "./components/ProcessingCategoriesCards";

export default function CashApplicationReportsPage() {
  const {
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
  } = useReports();

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
        {/* Summary Cards */}
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

        {/* Processing Buckets */}
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

        {/* KPI Sub Row */}
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

        {/* Insight Strip */}
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

        {/* Posting Trend + Workstreams Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PostingTrendChart trendSeries={trendSeries} />
          <WorkstreamsFunnel
            funnelBuckets={funnelBuckets}
            funnelMetric={funnelMetric}
            setFunnelMetric={setFunnelMetric}
          />
        </div>

        {/* Exception Drivers + Top Drivers Table */}
        <DriverBreakdownTable
          driverBreakdown={driverBreakdown}
          exceptionPareto={exceptionPareto}
        />

        {/* Pending Aging & SLA */}
        <PendingAgingSection agingBuckets={agingBuckets} slaTable={slaTable} />

        {/* Analyst Throughput + Workload */}
        <AnalystSection
          analystThroughput={analystThroughput}
          analystWorkload={analystWorkload}
        />

        {/* Processing Categories (BRD Buckets) */}
        <ProcessingCategoriesCards processingBuckets={processingBuckets} />
      </div>
    </div>
  );
}
