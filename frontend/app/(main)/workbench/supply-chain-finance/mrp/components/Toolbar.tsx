"use client";

import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Search,
  X,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Truck,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ViewsMenu } from "../../components/ViewsMenu";
import { cn } from "@/lib/utils";
import type { BulkActionModal } from "../types";

interface ToolbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  showDashboard: boolean;
  onToggleDashboard: () => void;
  onNewPO: () => void;
  onApplyView: (viewParams: Record<string, any>) => void;
  onSaveView: (name: string) => Promise<void>;
  selectedRows: Set<string>;
  rowCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAction: (action: BulkActionModal) => void;
  metrics: { autoClearPercent: number; exceptionsCount: number; slaStatus?: string } | undefined;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function Toolbar({
  sidebarCollapsed,
  onToggleSidebar,
  onNewPO,
  onApplyView,
  onSaveView,
  selectedRows,
  onClearSelection,
  onBulkAction,
  metrics,
  searchQuery,
  onSearchChange,
}: ToolbarProps) {
  const count = selectedRows.size;
  const hasSelection = count > 0;

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        {/* Left side */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          <div className="h-5 w-px bg-slate-200 shrink-0" />

          {/* Selection bar — replaces search when active */}
          {hasSelection ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-1.5 py-1">
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                {count} selected
              </span>
              <button
                onClick={onClearSelection}
                className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-200 mx-0.5" />

              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                onClick={() => onBulkAction("accept")}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-[11px] font-medium text-amber-700 hover:bg-amber-50"
                onClick={() => onBulkAction("counter")}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Counter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-[11px] font-medium text-blue-700 hover:bg-blue-50"
                onClick={() => onBulkAction("tracking")}
              >
                <Truck className="h-3 w-3 mr-1" />
                Tracking
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-[11px] font-medium text-red-700 hover:bg-red-50"
                onClick={() => onBulkAction("escalate")}
              >
                <Flag className="h-3 w-3 mr-1" />
                Escalate
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search PO, supplier, item..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-8 pl-8 w-64 text-xs bg-white"
              />
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {metrics && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-slate-500">Auto-clear:</span>
                <span className="font-semibold text-emerald-600">{metrics.autoClearPercent}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-slate-500">Open:</span>
                <span className="font-semibold text-slate-900">{metrics.exceptionsCount}</span>
              </div>
              {metrics.slaStatus && (
                <Badge
                  className={cn(
                    "text-[10px] border font-bold",
                    metrics.slaStatus === "AT RISK"
                      ? "border-red-200 bg-red-100 text-red-700"
                      : "border-emerald-200 bg-emerald-100 text-emerald-700"
                  )}
                >
                  {metrics.slaStatus}
                </Badge>
              )}
            </div>
          )}

          <div className="h-5 w-px bg-slate-200" />

          <Button
            onClick={onNewPO}
            size="sm"
            className="h-8 text-xs bg-slate-800 hover:bg-slate-700"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New PO
          </Button>

          <ViewsMenu onApply={onApplyView} onSave={onSaveView} />
        </div>
      </div>
    </div>
  );
}
