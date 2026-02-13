"use client";

import { Badge } from "@/components/ui/badge";
import { CashAppStats } from "@/lib/cash-app-types";
import { X } from "lucide-react";

interface CashAppStatusChipsProps {
  stats: CashAppStats;
  onChipClick?: (filter: string) => void;
  activeFilter?: string;
  onClearFilter?: () => void;
}

export function CashAppStatusChips({
  stats,
  onChipClick,
  activeFilter,
  onClearFilter,
}: CashAppStatusChipsProps) {
  const chips = [
    { label: "Auto-Matched", count: stats.autoMatched, variant: "default", filter: "AutoMatched" },
    { label: "Exceptions", count: stats.exceptions, variant: "destructive", filter: "Exception" },
    { label: "Critical", count: stats.critical, variant: "destructive", filter: "critical" },
    {
      label: "Pending to Post",
      count: stats.pendingToPost,
      variant: "secondary",
      filter: "PendingToPost",
    },
    {
      label: "Settlement Pending",
      count: stats.settlementPending,
      variant: "outline",
      filter: "SettlementPending",
    },
  ];

  return (
    <div className="flex items-center gap-3">
      {chips.map((chip) => {
        const isActive = activeFilter === chip.filter;
        return (
          <div
            key={chip.label}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              isActive ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            <button onClick={() => onChipClick?.(chip.filter)} className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}
              >
                {chip.label}
              </span>
              <Badge
                variant={isActive ? "secondary" : (chip.variant as any)}
                className={`ml-1 ${isActive ? "bg-blue-200 text-blue-700 hover:bg-blue-300 border-blue-300" : ""}`}
              >
                {chip.count}
              </Badge>
            </button>
            {isActive && (
              <>
                <div className="w-px h-4 bg-blue-300" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearFilter?.();
                  }}
                  className="p-0.5 hover:bg-blue-100 rounded transition-colors"
                  aria-label="Clear filter"
                >
                  <X className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
