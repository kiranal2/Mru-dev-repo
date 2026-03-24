"use client";

import type { FluxRow } from "@/lib/data/types/flux-analysis";
import { fmtMoney, fmtPct, statusClass } from "@/app/(main)/reports/analysis/flux-analysis/helpers";
import { cn } from "@/lib/utils";
import { Minus, Paperclip, TrendingDown, TrendingUp } from "lucide-react";

interface FluxTableProps {
  rows: FluxRow[];
  title: string;
  accountCount: number;
  onRowClick: (row: FluxRow) => void;
  onAddEvidence: (row: FluxRow) => void;
  hasEvidence: (row: Pick<FluxRow, "id" | "evidence">) => boolean;
}

export function FluxTable({
  rows,
  title,
  accountCount,
  onRowClick,
  onAddEvidence,
  hasEvidence,
}: FluxTableProps) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-800">{title}</span>
        <span className="text-xs text-slate-400">
          {accountCount} accounts · Click row to view details
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Acct</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Name</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Base</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Actual</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">&Delta;</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">&Delta;%</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Driver</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Owner</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Evidence</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide min-w-[100px]">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-sm text-slate-500">
                  No rows match your current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const delta = row.actual - row.base;
                const pct = row.base ? delta / row.base : 0;
                const rowHasEvidence = hasEvidence(row);
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-blue-50/40"
                    onClick={() => onRowClick(row)}
                  >
                    <td className="px-3 py-2 text-xs font-medium text-slate-900">{row.acct}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{row.name}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{fmtMoney(row.base)}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-900">{fmtMoney(row.actual)}</td>
                    <td className={cn("px-3 py-2 text-xs font-semibold", delta >= 0 ? "text-emerald-600" : "text-red-600")}>
                      <span className="inline-flex items-center gap-1">
                        {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {delta >= 0 ? "+" : ""}{fmtMoney(delta)}
                      </span>
                    </td>
                    <td className={cn("px-3 py-2 text-xs font-semibold", pct >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {fmtPct(pct)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{row.driver}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{row.owner}</td>
                    <td className="px-3 py-2 text-xs">
                      {rowHasEvidence ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                          <Paperclip className="h-3 w-3" /> Attached
                        </span>
                      ) : (
                        <button
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddEvidence(row);
                          }}
                        >
                          <Paperclip className="h-3 w-3" /> Add Evidence
                        </button>
                      )}
                    </td>
                    <td className="min-w-[100px] px-3 py-2 text-xs">
                      <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", statusClass(row.status))}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", row.status === "Closed" ? "bg-emerald-500" : row.status === "In Review" ? "bg-amber-500" : "bg-blue-500")} />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
