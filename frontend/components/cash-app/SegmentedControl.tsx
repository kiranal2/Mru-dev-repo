"use client";

import { CashAppStats } from "@/lib/cash-app-types";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface SegmentedControlProps {
  stats: CashAppStats;
  activeSegment: string | null;
  onSegmentChange: (segment: string) => void;
  onClearFilter?: () => void;
}

interface Segment {
  id: string;
  label: string;
  count: number;
}

export function SegmentedControl({
  stats,
  activeSegment,
  onSegmentChange,
  onClearFilter,
}: SegmentedControlProps) {
  const segments: Segment[] = [
    { id: "AutoMatched", label: "Auto-Matched", count: stats.autoMatched },
    { id: "Exception", label: "Exceptions", count: stats.exceptions },
    { id: "critical", label: "Critical", count: stats.critical },
    { id: "PendingToPost", label: "Pending to Post", count: stats.pendingToPost },
    { id: "SettlementPending", label: "Settlement Pending", count: stats.settlementPending },
  ];

  return (
    <div className="inline-flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
      {segments.map((segment) => {
        const isActive = activeSegment === segment.id;
        return (
          <div
            key={segment.id}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
              transition-all duration-150 ease-out
              ${
                isActive
                  ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }
            `}
          >
            <button
              onClick={() => onSegmentChange(segment.id)}
              className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            >
              <span>{segment.label}</span>
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={`
                  text-xs px-1.5 py-0 min-w-[1.5rem] h-5 flex items-center justify-center
                  transition-colors duration-150
                  ${isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}
                `}
              >
                {segment.count}
              </Badge>
            </button>
            {isActive && onClearFilter && (
              <>
                <div className="w-px h-4 bg-blue-300" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearFilter();
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
