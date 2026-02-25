"use client";

import { Search, ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { STATUS_GROUPS, EXCEPTION_TYPES, SEVERITY_COLOR_MAP } from "../constants";

interface SidebarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSuppliers: string[];
  onSupplierChange: (suppliers: string[]) => void;
  suppliers: Array<{ supplier_id: string; supplier_name: string }> | undefined;
  selectedSeverities: ("HIGH" | "MEDIUM" | "LOW")[];
  onSeverityToggle: (severity: "HIGH" | "MEDIUM" | "LOW") => void;
  severityCounts: Record<string, number> | undefined;
  quickView: string;
  expandedGroups: Set<string>;
  groupedCounts: Record<string, any> | undefined;
  onToggleGroup: (groupKey: string) => void;
  onQuickViewClick: (viewKey: string, statusFilter?: string) => void;
}

export function Sidebar({
  searchQuery,
  onSearchChange,
  selectedSuppliers,
  onSupplierChange,
  suppliers,
  selectedSeverities,
  onSeverityToggle,
  severityCounts,
  quickView,
  expandedGroups,
  groupedCounts,
  onToggleGroup,
  onQuickViewClick,
}: SidebarProps) {
  return (
    <>
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filters</span>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search PO, supplier, item..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div className="mb-3">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
            Supplier
          </label>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            <button
              className={cn(
                "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors",
                selectedSuppliers.length === 0
                  ? "bg-[#205375] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              onClick={() => onSupplierChange([])}
            >
              All Suppliers
            </button>
            {suppliers?.map((s) => (
              <button
                key={s.supplier_id}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors truncate",
                  selectedSuppliers.includes(s.supplier_id)
                    ? "bg-[#205375] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
                onClick={() => onSupplierChange([s.supplier_id])}
              >
                {s.supplier_name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
            Severity
          </label>
          <div className="flex gap-1.5">
            {(["HIGH", "MEDIUM", "LOW"] as const).map((severity) => {
              const isSelected = selectedSeverities.includes(severity);
              const colors = SEVERITY_COLOR_MAP[severity];
              return (
                <button
                  key={severity}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                    isSelected
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : "border-slate-200 text-slate-500 hover:bg-slate-100"
                  )}
                  onClick={() => onSeverityToggle(severity)}
                >
                  {severity}
                  {severityCounts && (
                    <span className="ml-0.5 opacity-70">({severityCounts[severity] ?? 0})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Quick Views
        </h3>
        <div className="space-y-0.5">
          {STATUS_GROUPS.map((statusGroup) => {
            const isExpanded = expandedGroups.has(statusGroup.key);
            const groupData = groupedCounts?.[statusGroup.key as keyof typeof groupedCounts];
            const isActive =
              quickView === statusGroup.key || quickView.startsWith(`${statusGroup.key}:`);

            return (
              <div key={statusGroup.key}>
                <button
                  className={cn(
                    "w-full flex items-center justify-between rounded-md px-2.5 py-2 text-xs transition-colors",
                    isActive
                      ? "bg-[#205375] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                  onClick={() => {
                    onToggleGroup(statusGroup.key);
                    onQuickViewClick(statusGroup.key);
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="font-medium">{statusGroup.label}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] h-5 min-w-[24px] justify-center",
                      isActive && "bg-white/20 text-white"
                    )}
                  >
                    {groupData?.total ?? 0}
                  </Badge>
                </button>

                {isExpanded && groupData && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {EXCEPTION_TYPES.map((exceptionType) => {
                      const count =
                        groupData[exceptionType.key as keyof typeof groupData] || 0;
                      const isTypeActive =
                        quickView === `${statusGroup.key}:${exceptionType.key}`;

                      if (count === 0) return null;

                      return (
                        <button
                          key={exceptionType.key}
                          className={cn(
                            "w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] transition-colors",
                            isTypeActive
                              ? "bg-blue-50 text-[#205375] font-medium"
                              : "text-slate-600 hover:bg-slate-100"
                          )}
                          onClick={() =>
                            onQuickViewClick(exceptionType.key, statusGroup.key)
                          }
                        >
                          <span className="truncate pr-2">{exceptionType.label}</span>
                          <Badge variant="outline" className="text-[10px] h-4 min-w-[20px] justify-center shrink-0">
                            {count}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
