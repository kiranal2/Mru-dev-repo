"use client";

import type { FluxRow } from "@/lib/data/types/flux-analysis";
import { fmtMoney, fmtPct, statusClass } from "@/app/(main)/reports/analysis/flux-analysis/helpers";
import { cn } from "@/lib/utils";
import { Minus, Paperclip, TrendingDown, TrendingUp } from "lucide-react";

/* ─── Driver Taxonomy ─── */

const DRIVER_TAXONOMY: Record<string, { abbr: string; color: string }> = {
  "Price/Volume/Mix": { abbr: "PV/M", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "Volume/Price": { abbr: "PV/M", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "Utilization": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Renewals": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Input costs/Volume": { abbr: "PV/M", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "Commodity Prices": { abbr: "PV/M", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "Headcount/Overtime": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Allocation Rate": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Price > COGS": { abbr: "PV/M", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "Headcount Rate": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Programs/Campaigns": { abbr: "One-time", color: "bg-orange-50 text-orange-700 border-orange-200" },
  "One-time/Timing": { abbr: "One-time", color: "bg-orange-50 text-orange-700 border-orange-200" },
  "Asset Base": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Intangibles": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Headcount/Grants": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Debt Paydown": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "FX / Gains": { abbr: "FX", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  "Effective Rate": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Revenue - OpEx": { abbr: "PV/M", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "Op Leverage": { abbr: "PV/M", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "Collections timing": { abbr: "Timing", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "Terms and timing": { abbr: "Timing", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "Billings > Rev": { abbr: "Timing", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "Cash deployment": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Usage/Obsolescence": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Operating Cash Flow": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Collections/DSO": { abbr: "Timing", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "Payment Terms": { abbr: "Timing", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "Usage/Reserves": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Operational mix": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "New Logos": { abbr: "PV/M", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "Churn": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Volume/Rates": { abbr: "PV/M", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "Claims Rate": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Project Spend": { abbr: "One-time", color: "bg-orange-50 text-orange-700 border-orange-200" },
  "Headcount": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Lease terms": { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Audit/Legal": { abbr: "One-time", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

function getDriverChip(driver: string) {
  const taxonomy = DRIVER_TAXONOMY[driver];
  if (taxonomy) return taxonomy;
  // Fallback: derive from keywords
  if (/fx|currency|exchange/i.test(driver)) return { abbr: "FX", color: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  if (/time|timing|delay/i.test(driver)) return { abbr: "Timing", color: "bg-purple-50 text-purple-700 border-purple-200" };
  if (/one.?time|reclass/i.test(driver)) return { abbr: "One-time", color: "bg-orange-50 text-orange-700 border-orange-200" };
  if (/price|volume|mix/i.test(driver)) return { abbr: "PV/M", color: "bg-blue-50 text-blue-700 border-blue-200" };
  return { abbr: "Operational", color: "bg-slate-100 text-slate-700 border-slate-300" };
}

/* ─── Quick Filter Options ─── */

const QUICK_FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "missing-evidence", label: "Missing Evidence" },
  { key: "high-impact", label: "High Impact" },
] as const;

/* ─── Component ─── */

interface WorklistTableProps {
  rows: FluxRow[];
  title: string;
  accountCount: number;
  quickFilter: string;
  onQuickFilterChange: (filter: string) => void;
  onRowClick: (row: FluxRow) => void;
  onAddEvidence: (row: FluxRow) => void;
  hasEvidence: (row: Pick<FluxRow, "id" | "evidence">) => boolean;
}

export function WorklistTable({
  rows,
  title,
  accountCount,
  quickFilter,
  onQuickFilterChange,
  onRowClick,
  onAddEvidence,
  hasEvidence,
}: WorklistTableProps) {
  return (
    <>
      {/* Header with quick filter pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-semibold text-slate-800">{title}</span>
          <div className="flex flex-wrap items-center gap-1">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => onQuickFilterChange(f.key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  quickFilter === f.key
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-slate-400">
          {accountCount} accounts
        </span>
      </div>

      {/* ── Phone: compact list items (< md, 768px) ── */}
      <div className="md:hidden">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">No items match your current filters.</div>
        ) : (
          rows.map((row) => {
            const delta = row.actual - row.base;
            const pct = row.base ? delta / row.base : 0;
            const rowHasEvidence = hasEvidence(row);
            const chip = getDriverChip(row.driver);
            const accentColor = row.status === "Closed" ? "border-l-emerald-500" : row.status === "In Review" ? "border-l-amber-400" : "border-l-blue-400";

            return (
              <div
                key={row.id}
                className={cn("flex border-b border-slate-100 border-l-[3px] cursor-pointer transition-colors active:bg-slate-50", accentColor)}
                onClick={() => onRowClick(row)}
              >
                <div className="flex-1 min-w-0 px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-semibold text-slate-900 truncate">{row.name}</span>
                    <span className={cn("text-[13px] font-bold tabular-nums shrink-0", delta >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {delta >= 0 ? "+" : ""}{fmtMoney(delta)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="tabular-nums">{row.acct}</span>
                    <span className="text-slate-300">&middot;</span>
                    <span className={cn("rounded border px-1 py-px text-[10px] font-semibold", chip.color)}>{chip.abbr}</span>
                    <span className="truncate">{row.owner || "Unassigned"}</span>
                    <span className="ml-auto shrink-0">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] font-semibold", statusClass(row.status))}>
                        <span className={cn("h-1 w-1 rounded-full", row.status === "Closed" ? "bg-emerald-500" : row.status === "In Review" ? "bg-amber-500" : "bg-blue-500")} />
                        {row.status}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center pr-2 text-slate-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Tablet: compact 6-column table (md to xl, 768–1279px) ── */}
      <div className="hidden md:block xl:hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-[3px] p-0" />
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Account</th>
              <th className="px-3 py-2 text-right text-[11px] font-medium text-slate-500 uppercase tracking-wide">Base</th>
              <th className="px-3 py-2 text-right text-[11px] font-medium text-slate-500 uppercase tracking-wide">Actual</th>
              <th className="px-3 py-2 text-right text-[11px] font-medium text-slate-500 uppercase tracking-wide">&Delta;</th>
              <th className="px-3 py-2 text-right text-[11px] font-medium text-slate-500 uppercase tracking-wide">&Delta;%</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Owner</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-500">No items match your current filters.</td></tr>
            ) : (
              rows.map((row) => {
                const delta = row.actual - row.base;
                const pct = row.base ? delta / row.base : 0;
                const rowHasEvidence = hasEvidence(row);
                const chip = getDriverChip(row.driver);
                const accentBg = row.status === "Closed" ? "bg-emerald-500" : row.status === "In Review" ? "bg-amber-400" : "bg-blue-400";

                return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 cursor-pointer transition-colors hover:bg-blue-50/40"
                    onClick={() => onRowClick(row)}
                  >
                    {/* Left accent strip */}
                    <td className="w-[3px] p-0"><div className={cn("h-full w-[3px]", accentBg)} /></td>
                    {/* Account name + code + driver */}
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-semibold text-slate-900">{row.name}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <span>{row.acct}</span>
                        <span className="text-slate-300">&middot;</span>
                        <span className={cn("rounded border px-1 py-px text-[10px] font-semibold", chip.color)}>{chip.abbr}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums text-slate-500">{fmtMoney(row.base)}</td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums font-medium text-slate-900">{fmtMoney(row.actual)}</td>
                    <td className={cn("px-3 py-2.5 text-right text-xs tabular-nums font-bold", delta >= 0 ? "text-emerald-600" : "text-red-600")}>
                      <span className="inline-flex items-center gap-0.5">
                        {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        {delta >= 0 ? "+" : ""}{fmtMoney(delta)}
                      </span>
                    </td>
                    <td className={cn("px-3 py-2.5 text-right text-xs tabular-nums font-semibold", pct >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {fmtPct(pct)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{row.owner || <span className="text-red-500 font-medium">—</span>}</td>
                    <td className="px-3 py-2.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusClass(row.status))}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", row.status === "Closed" ? "bg-emerald-500" : row.status === "In Review" ? "bg-amber-500" : "bg-blue-500")} />
                          {row.status}
                        </span>
                        {!rowHasEvidence && row.status !== "Closed" && (
                          <Paperclip className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Desktop Table View (>= xl) */}
      <div className="hidden xl:block overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          {/* Column Group Headers */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100">
              <th colSpan={2} className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Account
              </th>
              <th colSpan={4} className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-l border-slate-200">
                Variance
              </th>
              <th colSpan={1} className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-l border-slate-200">
                Attribution
              </th>
              <th colSpan={2} className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-l border-slate-200">
                Ownership
              </th>
              <th colSpan={1} className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-l border-slate-200">
                Support
              </th>
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide w-[60px]">Acct</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Name</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide border-l border-slate-100">Base</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Actual</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">&Delta;</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">&Delta;%</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide border-l border-slate-100">Driver</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide border-l border-slate-100">Owner</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide min-w-[100px]">Status</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide border-l border-slate-100">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-sm text-slate-500">
                  No items match your current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const delta = row.actual - row.base;
                const pct = row.base ? delta / row.base : 0;
                const rowHasEvidence = hasEvidence(row);
                const chip = getDriverChip(row.driver);
                const needsAttention = !rowHasEvidence && row.status !== "Closed";

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "cursor-pointer border-b border-slate-100 transition-colors hover:bg-blue-50/40",
                      needsAttention && "border-l-2 border-l-amber-400"
                    )}
                    onClick={() => onRowClick(row)}
                  >
                    <td className="px-3 py-2 text-xs font-medium text-slate-900">{row.acct}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{row.name}</td>
                    <td className="px-3 py-2 text-xs text-slate-700 border-l border-slate-50">{fmtMoney(row.base)}</td>
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
                    {/* Driver with taxonomy chip */}
                    <td className="px-3 py-2 text-xs border-l border-slate-50">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold", chip.color)}>
                          {chip.abbr}
                        </span>
                        <span className="text-slate-600 truncate max-w-[100px]" title={row.driver}>
                          {row.driver}
                        </span>
                      </div>
                    </td>
                    {/* Owner */}
                    <td className="px-3 py-2 text-xs text-slate-600 border-l border-slate-50">
                      {row.owner || <span className="text-red-500 font-medium">Unassigned</span>}
                    </td>
                    {/* Status */}
                    <td className="min-w-[100px] px-3 py-2 text-xs">
                      <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", statusClass(row.status))}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", row.status === "Closed" ? "bg-emerald-500" : row.status === "In Review" ? "bg-amber-500" : "bg-blue-500")} />
                        {row.status}
                      </span>
                    </td>
                    {/* Evidence */}
                    <td className="px-3 py-2 text-xs border-l border-slate-50">
                      {rowHasEvidence ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                          <Paperclip className="h-3 w-3" /> Attached
                        </span>
                      ) : (
                        <button
                          className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddEvidence(row);
                          }}
                        >
                          <Paperclip className="h-3 w-3" /> Add Evidence
                        </button>
                      )}
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
