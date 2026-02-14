"use client";

import { Card } from "@/components/ui/card";
import type { TrendSeries } from "../types";
import { formatCurrency } from "../constants";

type PostingTrendChartProps = {
  trendSeries: TrendSeries;
};

export function PostingTrendChart({ trendSeries }: PostingTrendChartProps) {
  return (
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
  );
}
