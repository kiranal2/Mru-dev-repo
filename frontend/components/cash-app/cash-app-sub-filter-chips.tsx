"use client";

import { Badge } from "@/components/ui/badge";
import { Target, SlidersHorizontal, ArrowLeftRight, AlertTriangle, Layers, X } from "lucide-react";

interface SubFilterChipsProps {
  counts: {
    exact: number;
    tolerance: number;
    intercompany: number;
    warnings: number;
    bulkReady: number;
  };
  activeFilter: string;
  onFilterClick: (filter: string) => void;
}

export function CashAppSubFilterChips({
  counts,
  activeFilter,
  onFilterClick,
}: SubFilterChipsProps) {
  const chips = [
    {
      label: "Exact",
      count: counts.exact,
      filter: "exact",
      icon: Target,
      activeBg: "bg-emerald-50",
      activeBorder: "border-emerald-300",
      activeText: "text-emerald-800",
    },
    {
      label: "Tolerance",
      count: counts.tolerance,
      filter: "tolerance",
      icon: SlidersHorizontal,
      activeBg: "bg-blue-50",
      activeBorder: "border-blue-300",
      activeText: "text-blue-800",
    },
    {
      label: "Interco",
      count: counts.intercompany,
      filter: "intercompany",
      icon: ArrowLeftRight,
      activeBg: "bg-amber-50",
      activeBorder: "border-amber-300",
      activeText: "text-amber-800",
    },
    {
      label: "Warnings",
      count: counts.warnings,
      filter: "warnings",
      icon: AlertTriangle,
      activeBg: "bg-orange-50",
      activeBorder: "border-orange-300",
      activeText: "text-orange-800",
    },
    {
      label: "Bulk-Ready",
      count: counts.bulkReady,
      filter: "bulkReady",
      icon: Layers,
      activeBg: "bg-slate-50",
      activeBorder: "border-slate-300",
      activeText: "text-slate-800",
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {chips.map((chip) => {
        const Icon = chip.icon;
        const isActive = activeFilter === chip.filter;
        return (
          <button
            key={chip.label}
            onClick={() => onFilterClick(chip.filter)}
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs
              transition-all duration-150 ease-out whitespace-nowrap
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${
                isActive
                  ? `${chip.activeBg} ${chip.activeBorder} ${chip.activeText}`
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }
            `}
          >
            <Icon className={`w-3 h-3 ${isActive ? chip.activeText : "text-slate-400"}`} />
            <span className="font-medium">{chip.label}</span>
            <span
              className={`text-[10px] font-semibold px-1 py-0 rounded ${isActive ? "bg-white/60" : "bg-slate-100"}`}
            >
              {chip.count}
            </span>
            {isActive && <X className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />}
          </button>
        );
      })}
    </div>
  );
}
