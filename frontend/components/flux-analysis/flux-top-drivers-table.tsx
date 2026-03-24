"use client";

import type { DriverRow } from "@/lib/data/types/flux-analysis";
import { fmtMoney, fmtPct, confidenceClass } from "@/app/(main)/reports/analysis/flux-analysis/helpers";
import { cn } from "@/lib/utils";

interface FluxTopDriversTableProps {
  drivers: DriverRow[];
  baseRevenue: number;
}

export function FluxTopDriversTable({ drivers, baseRevenue }: FluxTopDriversTableProps) {
  const safeBase = Math.max(1, baseRevenue);

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-800">Top Drivers (All Accounts)</span>
        <div className="flex gap-1.5">
          <span className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">Rate &times; Volume</span>
          <span className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">Price &times; Volume &times; Mix &times; FX</span>
          <span className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">Timing / One-time</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Driver</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Impact ($)</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Impact (%)</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Confidence</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Trend</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((row) => {
              const pct = row.impact / safeBase;
              return (
                <tr key={row.driver} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-xs font-medium text-slate-900">{row.driver}</td>
                  <td className={cn("px-3 py-2 text-xs font-semibold", row.impact >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {row.impact >= 0 ? "+" : ""}{fmtMoney(row.impact)}
                  </td>
                  <td className={cn("px-3 py-2 text-xs font-semibold", pct >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {fmtPct(pct)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", confidenceClass(row.confidence))}>
                      {row.confidence}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn("h-full rounded-full", pct >= 0 ? "bg-slate-700" : "bg-red-400")}
                          style={{ width: `${Math.min(100, Math.abs(pct) * 260)}%` }}
                        />
                      </div>
                      <span className={cn("h-1.5 w-1.5 rounded-full", pct >= 0 ? "bg-slate-700" : "bg-red-400")} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
