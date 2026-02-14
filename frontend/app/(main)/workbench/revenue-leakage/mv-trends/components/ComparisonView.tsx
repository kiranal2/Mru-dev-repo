"use client";

import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { MVOfficeComparison } from "@/lib/revenue-leakage/types";
import { formatCurrency, formatShort, drrText } from "../constants";

interface ComparisonViewProps {
  officePairs: MVOfficeComparison[];
  expandedPair: string | null;
  setExpandedPair: (v: string | null) => void;
}

function PairCard({
  pair,
  maxDrr,
  isExpanded,
  onToggle,
  isFlagged,
}: {
  pair: MVOfficeComparison;
  maxDrr: number;
  isExpanded: boolean;
  onToggle: () => void;
  isFlagged: boolean;
}) {
  return (
    <Card className={`border-l-4 ${isFlagged ? "border-l-red-500" : "border-l-slate-300"} overflow-hidden`}>
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            {pair.sro_a.code} vs {pair.sro_b.code}
          </span>
          <span className={`text-xs font-${isFlagged ? "bold text-red-600" : "semibold text-slate-500"}`}>
            Gap {pair.drr_gap.toFixed(2)}
          </span>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-8 flex-shrink-0">{pair.sro_a.code}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(pair.sro_a.avg_drr / maxDrr) * 100}%` }}
              />
            </div>
            <span className={`text-[10px] font-bold w-7 text-right ${drrText(pair.sro_a.avg_drr)}`}>
              {pair.sro_a.avg_drr.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-8 flex-shrink-0">{pair.sro_b.code}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${(pair.sro_b.avg_drr / maxDrr) * 100}%` }}
              />
            </div>
            <span className={`text-[10px] font-bold w-7 text-right ${drrText(pair.sro_b.avg_drr)}`}>
              {pair.sro_b.avg_drr.toFixed(2)}
            </span>
          </div>
          {isFlagged && (
            <div className="relative h-0">
              <div
                className="absolute border-l border-dashed border-red-400"
                style={{
                  left: `calc(${(0.85 / maxDrr) * 100}% + 32px)`,
                  top: -20,
                  height: 20,
                }}
              />
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
          <span>
            Impact:{" "}
            <span className={`font-semibold ${isFlagged ? "text-emerald-600" : "text-slate-600"}`}>
              {formatShort(pair.estimated_impact)}
            </span>
          </span>
          <span>{pair.severity}</span>
          <button
            className="text-blue-600 hover:underline font-medium"
            onClick={onToggle}
          >
            {isExpanded ? "Hide" : "Details"}
          </button>
        </div>
        {isExpanded && (
          <div className="mt-2 border-t border-slate-100 pt-2 space-y-1.5 text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded p-1.5">
                <p className="font-bold text-slate-700">
                  {pair.sro_a.code} - {pair.sro_a.name}
                </p>
                <p className="text-slate-500">
                  Txns: {pair.sro_a.txn_count} | RC: {formatCurrency(pair.sro_a.rate_card_avg)}
                </p>
                <p className="text-slate-500">Declared: {formatCurrency(pair.sro_a.declared_avg)}</p>
              </div>
              <div className="bg-orange-50 rounded p-1.5">
                <p className="font-bold text-slate-700">
                  {pair.sro_b.code} - {pair.sro_b.name}
                </p>
                <p className="text-slate-500">
                  Txns: {pair.sro_b.txn_count} | RC: {formatCurrency(pair.sro_b.rate_card_avg)}
                </p>
                <p className="text-slate-500">Declared: {formatCurrency(pair.sro_b.declared_avg)}</p>
              </div>
            </div>
            <p className="text-slate-500 bg-slate-50 rounded p-1.5">
              {isFlagged
                ? `If ${pair.lower_drr_sro} matched peer DRR, additional stamp duty ~ ${formatShort(pair.estimated_impact)}/qtr. RC gap ${pair.rate_card_gap_pct}%, Declared gap ${pair.declared_gap_pct}%.`
                : `RC gap ${pair.rate_card_gap_pct}%, Declared gap ${pair.declared_gap_pct}%.`}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export function ComparisonView({
  officePairs,
  expandedPair,
  setExpandedPair,
}: ComparisonViewProps) {
  const sortedPairs = [...officePairs].sort((a, b) => b.drr_gap - a.drr_gap);
  const flaggedPairs = sortedPairs.filter((p) => p.drr_gap > 0.3);
  const unflaggedPairs = sortedPairs.filter((p) => p.drr_gap <= 0.3);
  const maxDrr = 1.3;

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="p-3 border-l-4 border-l-red-500">
          <p className="text-[11px] text-slate-500">Flagged Pairs</p>
          <p className="text-lg font-bold text-slate-900">{flaggedPairs.length}</p>
          <p className="text-[11px] text-slate-400">DRR gap &gt; 0.30</p>
        </Card>
        <Card className="p-3 border-l-4 border-l-orange-500">
          <p className="text-[11px] text-slate-500">Largest Gap</p>
          <p className="text-lg font-bold text-red-600">
            {sortedPairs[0]?.drr_gap.toFixed(2) || "--"}
          </p>
          <p className="text-[11px] text-slate-400">
            {sortedPairs[0]?.sro_a.code} vs {sortedPairs[0]?.sro_b.code}
          </p>
        </Card>
        <Card className="p-3 border-l-4 border-l-amber-500">
          <p className="text-[11px] text-slate-500">Total Est. Impact</p>
          <p className="text-lg font-bold text-slate-900">
            {formatShort(flaggedPairs.reduce((s, p) => s + p.estimated_impact, 0))}
          </p>
          <p className="text-[11px] text-slate-400">flagged pairs only</p>
        </Card>
        <Card className="p-3 border-l-4 border-l-slate-500">
          <p className="text-[11px] text-slate-500">Total Pairs</p>
          <p className="text-lg font-bold text-slate-900">{officePairs.length}</p>
          <p className="text-[11px] text-slate-400">monitored comparisons</p>
        </Card>
      </div>

      {/* Flagged Pairs */}
      {flaggedPairs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Flagged Pairs (Gap &gt; 0.30)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {flaggedPairs.map((pair) => {
              const rowKey = `${pair.sro_a.code}-${pair.sro_b.code}`;
              return (
                <PairCard
                  key={rowKey}
                  pair={pair}
                  maxDrr={maxDrr}
                  isExpanded={expandedPair === rowKey}
                  onToggle={() => setExpandedPair(expandedPair === rowKey ? null : rowKey)}
                  isFlagged
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Other Pairs */}
      {unflaggedPairs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Other Pairs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {unflaggedPairs.map((pair) => {
              const rowKey = `${pair.sro_a.code}-${pair.sro_b.code}`;
              return (
                <PairCard
                  key={rowKey}
                  pair={pair}
                  maxDrr={maxDrr}
                  isExpanded={expandedPair === rowKey}
                  onToggle={() => setExpandedPair(expandedPair === rowKey ? null : rowKey)}
                  isFlagged={false}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
