"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Wallet,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import { CashAppStats } from "@/lib/cash-app-types";

interface KPISummaryStripProps {
  stats: CashAppStats;
}

interface KPITile {
  label: string;
  count: number;
  amount?: number;
  icon: React.ElementType;
  accentColor: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
}

export function KPISummaryStrip({ stats }: KPISummaryStripProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const tiles: KPITile[] = [
    {
      label: "Auto-Matched",
      count: stats.autoMatched,
      amount: 1245000,
      icon: CheckCircle2,
      accentColor: "bg-emerald-500",
      bgColor: "bg-emerald-50 hover:bg-emerald-100",
      textColor: "text-emerald-700",
      dotColor: "bg-emerald-500",
    },
    {
      label: "Exceptions",
      count: stats.exceptions,
      amount: 342000,
      icon: AlertTriangle,
      accentColor: "bg-amber-500",
      bgColor: "bg-amber-50 hover:bg-amber-100",
      textColor: "text-amber-700",
      dotColor: "bg-amber-500",
    },
    {
      label: "Critical",
      count: stats.critical,
      amount: 89000,
      icon: AlertOctagon,
      accentColor: "bg-red-500",
      bgColor: "bg-red-50 hover:bg-red-100",
      textColor: "text-red-700",
      dotColor: "bg-red-500",
    },
    {
      label: "Pending to Post",
      count: stats.pendingToPost,
      icon: Clock,
      accentColor: "bg-blue-500",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      textColor: "text-blue-700",
      dotColor: "bg-blue-500",
    },
    {
      label: "Settlement Pending",
      count: stats.settlementPending,
      icon: Wallet,
      accentColor: "bg-slate-500",
      bgColor: "bg-slate-50 hover:bg-slate-100",
      textColor: "text-slate-700",
      dotColor: "bg-slate-400",
    },
  ];

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  const totalPayments = tiles.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="mb-2">
      {/* Toggle bar — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-1 group"
      >
        <BarChart3 className="w-3.5 h-3.5" />
        <span className="font-medium">KPIs</span>
        <span className="text-slate-400">{totalPayments} payments</span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
        )}
      </button>

      {/* KPI tiles — collapsible */}
      {isExpanded && (
        <div className="flex items-center gap-1">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${tile.bgColor} transition-colors cursor-default`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${tile.dotColor}`} />
              <span className={`text-sm font-bold ${tile.textColor}`}>{tile.count}</span>
              {tile.amount && (
                <span className="text-[11px] text-slate-500">
                  {formatCompactCurrency(tile.amount)}
                </span>
              )}
              <span className="text-[11px] text-slate-500">{tile.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
