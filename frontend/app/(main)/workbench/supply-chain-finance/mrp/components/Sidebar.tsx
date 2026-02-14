"use client";

import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
      <div className="p-6 border-b border-gray-200">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search PO Lines, Suppliers, Exceptions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-slate-600 mb-2 block">Supplier</label>
          <div className="space-y-1">
            <Button
              variant={selectedSuppliers.length === 0 ? "default" : "outline"}
              className="w-full justify-start"
              size="sm"
              onClick={() => onSupplierChange([])}
            >
              All Suppliers
            </Button>
            {suppliers?.map((s) => (
              <Button
                key={s.supplier_id}
                variant={selectedSuppliers.includes(s.supplier_id) ? "default" : "outline"}
                className="w-full justify-start"
                size="sm"
                onClick={() => onSupplierChange([s.supplier_id])}
              >
                {s.supplier_name}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-slate-600 mb-2 block">Severity</label>
          <div className="flex gap-2">
            {(["HIGH", "MEDIUM", "LOW"] as const).map((severity) => {
              const isSelected = selectedSeverities.includes(severity);
              const colors = SEVERITY_COLOR_MAP[severity];
              return (
                <Button
                  key={severity}
                  variant="outline"
                  size="sm"
                  className={`flex-1 text-xs ${
                    isSelected
                      ? `${colors.bg} ${colors.text} ${colors.border} ${colors.hoverBg} ${colors.hoverText}`
                      : ""
                  }`}
                  onClick={() => onSeverityToggle(severity)}
                >
                  {severity}
                  {severityCounts && (
                    <span className="ml-1">({severityCounts[severity]})</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-slate-600 mb-2">Quick Views</h3>
        <div className="space-y-1">
          {STATUS_GROUPS.map((statusGroup) => {
            const isExpanded = expandedGroups.has(statusGroup.key);
            const groupData = groupedCounts?.[statusGroup.key as keyof typeof groupedCounts];
            const isActive =
              quickView === statusGroup.key || quickView.startsWith(`${statusGroup.key}:`);

            return (
              <div key={statusGroup.key} className="space-y-1">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-between"
                  size="sm"
                  onClick={() => {
                    onToggleGroup(statusGroup.key);
                    onQuickViewClick(statusGroup.key);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>{statusGroup.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {groupData?.total || 0}
                  </Badge>
                </Button>

                {isExpanded && groupData && (
                  <div className="ml-6 space-y-1">
                    {EXCEPTION_TYPES.map((exceptionType) => {
                      const count =
                        groupData[exceptionType.key as keyof typeof groupData] || 0;
                      const isTypeActive =
                        quickView === `${statusGroup.key}:${exceptionType.key}`;

                      return (
                        <Button
                          key={exceptionType.key}
                          variant={isTypeActive ? "default" : "ghost"}
                          className="w-full justify-between text-xs"
                          size="sm"
                          onClick={() =>
                            onQuickViewClick(exceptionType.key, statusGroup.key)
                          }
                        >
                          <span>{exceptionType.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {count}
                          </Badge>
                        </Button>
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
