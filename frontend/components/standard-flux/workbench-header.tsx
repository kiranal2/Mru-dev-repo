"use client";

import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkbenchHeaderProps {
  totalVariance: number;
  topDrivers: { driver: string; impact: number }[];
  reviewStats: { closed: number; inReview: number; open: number; total: number };
  exceptionCount: number;
}

export function WorkbenchHeader({
  totalVariance,
  topDrivers,
  reviewStats,
  exceptionCount,
}: WorkbenchHeaderProps) {
  const closedPct = reviewStats.total ? (reviewStats.closed / reviewStats.total) * 100 : 0;
  const inReviewPct = reviewStats.total ? (reviewStats.inReview / reviewStats.total) * 100 : 0;
  const openPct = reviewStats.total ? (reviewStats.open / reviewStats.total) * 100 : 0;

  return (
    <div className="mx-5 mb-3 grid grid-cols-4 gap-3">
      {/* Total Net Variance */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Total Net Variance
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "text-2xl font-bold",
              totalVariance >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {totalVariance >= 0 ? "+" : ""}${Math.abs(totalVariance).toFixed(1)}M
          </span>
          {totalVariance >= 0 ? (
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-400">QoQ period change</div>
      </div>

      {/* Top Drivers */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Top Drivers
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {topDrivers.map((d) => (
            <span
              key={d.driver}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                d.impact >= 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              )}
            >
              {d.driver}
              <span className="font-bold">
                {d.impact >= 0 ? "+" : ""}${d.impact.toFixed(1)}M
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Review Progress */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Review Progress
        </div>
        <div className="mt-2">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            {closedPct > 0 && (
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${closedPct}%` }}
              />
            )}
            {inReviewPct > 0 && (
              <div
                className="bg-amber-400 transition-all"
                style={{ width: `${inReviewPct}%` }}
              />
            )}
            {openPct > 0 && (
              <div
                className="bg-blue-400 transition-all"
                style={{ width: `${openPct}%` }}
              />
            )}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Closed {reviewStats.closed}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-slate-600">In Review {reviewStats.inReview}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-slate-600">Open {reviewStats.open}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Needs Attention */}
      <div
        className={cn(
          "rounded-lg border bg-white p-4",
          exceptionCount > 0 ? "border-amber-200" : "border-slate-200"
        )}
      >
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Needs Attention
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "text-2xl font-bold",
              exceptionCount > 0 ? "text-amber-600" : "text-emerald-600"
            )}
          >
            {exceptionCount}
          </span>
          {exceptionCount > 0 && (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          {exceptionCount > 0
            ? "Open items missing evidence"
            : "All items addressed"}
        </div>
      </div>
    </div>
  );
}
