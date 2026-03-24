"use client";

import type { BsRollRow } from "@/lib/data/types/flux-analysis";
import { fmtMoney } from "@/app/(main)/reports/analysis/flux-analysis/helpers";
import { cn } from "@/lib/utils";

interface FluxBsRollforwardTableProps {
  rows: BsRollRow[];
}

export function FluxBsRollforwardTable({ rows }: FluxBsRollforwardTableProps) {
  return (
    <div className="border-t border-slate-200 p-4">
      <h4 className="mb-2 text-xs font-semibold text-slate-800">Balance Sheet Roll-forward</h4>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Account</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Opening</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Activity</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Closing</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.acct} className="border-b border-slate-100">
                <td className="px-3 py-2 text-xs text-slate-700">{row.acct}</td>
                <td className="px-3 py-2 text-xs text-slate-700">{fmtMoney(row.open)}</td>
                <td className={cn("px-3 py-2 text-xs font-semibold", row.activity >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {row.activity >= 0 ? "+" : ""}{fmtMoney(row.activity)}
                </td>
                <td className="px-3 py-2 text-xs text-slate-700">{fmtMoney(row.close)}</td>
                <td className="px-3 py-2 text-xs text-slate-600">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
