"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PeriodNode } from "../types";
import type { ViewMode } from "../types";

interface PeriodTreeSelectProps {
  nodes: PeriodNode[];
  level?: number;
  pendingView: ViewMode;
  pendingPeriods: string[];
  expandedPeriods: Set<string>;
  togglePeriodExpanded: (id: string) => void;
  handlePeriodToggle: (period: string, checked: boolean) => void;
}

export function PeriodTreeSelect({
  nodes,
  level = 0,
  pendingView,
  pendingPeriods,
  expandedPeriods,
  togglePeriodExpanded,
  handlePeriodToggle,
}: PeriodTreeSelectProps) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedPeriods.has(node.id);
        const isSelected = pendingPeriods.includes(node.label);
        const isLeafNode = !hasChildren;

        const maxSelections = pendingView === "consolidated" ? 1 : 2;
        const isLimitReached = pendingPeriods.length >= maxSelections;

        const canSelect =
          pendingView === "consolidated"
            ? isLeafNode && (!isLimitReached || isSelected)
            : !isLimitReached || isSelected;

        return (
          <div key={node.id}>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded",
                level > 0 && "ml-4",
                pendingView === "comparative" || pendingView === "trended" || isLeafNode
                  ? "hover:bg-gray-100 cursor-pointer"
                  : "cursor-pointer",
                !canSelect &&
                  (pendingView === "comparative" || pendingView === "trended" || isLeafNode) &&
                  "opacity-50"
              )}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePeriodExpanded(node.id);
                  }}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-4" />
              )}
              {pendingView === "comparative" || pendingView === "trended" || isLeafNode ? (
                <label
                  className={cn(
                    "flex items-center gap-2 flex-1",
                    canSelect ? "cursor-pointer" : "cursor-not-allowed"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!canSelect}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (canSelect) {
                        handlePeriodToggle(node.label, e.target.checked);
                      }
                    }}
                    onClick={(e) => {
                      if (!canSelect) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                      }
                      e.stopPropagation();
                    }}
                    className={cn(
                      "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500",
                      !canSelect && "opacity-50 cursor-not-allowed"
                    )}
                  />
                  <span className={cn("text-sm", !canSelect && "opacity-50")}>{node.label}</span>
                </label>
              ) : (
                <span className="text-sm flex-1">{node.label}</span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <div className="ml-2">
                <PeriodTreeSelect
                  nodes={node.children!}
                  level={level + 1}
                  pendingView={pendingView}
                  pendingPeriods={pendingPeriods}
                  expandedPeriods={expandedPeriods}
                  togglePeriodExpanded={togglePeriodExpanded}
                  handlePeriodToggle={handlePeriodToggle}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
