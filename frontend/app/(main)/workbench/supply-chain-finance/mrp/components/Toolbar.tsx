"use client";

import {
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Plus,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewsMenu } from "../../components/ViewsMenu";
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
  onBulkAction: (action: BulkActionModal) => void;
  metrics: { autoClearPercent: number; exceptionsCount: number } | undefined;
}

export function Toolbar({
  sidebarCollapsed,
  onToggleSidebar,
  showDashboard,
  onToggleDashboard,
  onNewPO,
  onApplyView,
  onSaveView,
  selectedRows,
  rowCount,
  onSelectAll,
  onBulkAction,
  metrics,
}: ToolbarProps) {
  return (
    <>
      <div className="border-b border-gray-200 bg-gray-50 px-3 py-1">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDashboard}
              title="Toggle Dashboard"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Button>

            <Button onClick={onNewPO} size="sm" title="Create New PO Line">
              <Plus className="h-4 w-4 mr-2" />
              New PO Line
            </Button>

            <ViewsMenu onApply={onApplyView} onSave={onSaveView} />
          </div>
        </div>
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="flex items-center gap-2"
            >
              {selectedRows.size === rowCount && rowCount > 0 ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Select All
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedRows.size === 0}
                onClick={() => onBulkAction("accept")}
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 disabled:opacity-50"
              >
                Accept Commit
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedRows.size === 0}
                onClick={() => onBulkAction("counter")}
                className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 disabled:opacity-50"
              >
                Counter-Date
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedRows.size === 0}
                onClick={() => onBulkAction("tracking")}
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50"
              >
                Request Tracking
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedRows.size === 0}
                onClick={() => onBulkAction("escalate")}
                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 disabled:opacity-50"
              >
                Escalate
              </Button>
            </div>
          </div>

          {metrics && (
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-slate-600">Auto-clear:</span>{" "}
                <span className="text-green-600 font-medium">
                  {metrics.autoClearPercent}%
                </span>
              </div>
              <div className="text-sm">
                <span className="text-slate-600">Exceptions:</span>{" "}
                <span className="text-[#000000] font-medium">
                  {metrics.exceptionsCount}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
