"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, UserPlus, Download, Eye, X } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onApprovePost: () => void;
  onAssign: () => void;
  onExport: () => void;
  onMarkReviewed: () => void;
  onClearSelection: () => void;
  isVisible: boolean;
}

export function BulkActionBar({
  selectedCount,
  onApprovePost,
  onAssign,
  onExport,
  onMarkReviewed,
  onClearSelection,
  isVisible,
}: BulkActionBarProps) {
  return (
    <div
      className={`
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        bg-slate-900 text-white rounded-xl shadow-2xl
        px-6 py-3
        flex items-center gap-4
        transition-all duration-200 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
      `}
    >
      <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
        <span className="bg-blue-600 text-white text-sm font-semibold px-2.5 py-0.5 rounded-full">
          {selectedCount}
        </span>
        <span className="text-sm text-slate-300">
          payment{selectedCount !== 1 ? "s" : ""} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white h-8"
          onClick={onApprovePost}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          Approve & Post
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="text-slate-300 hover:text-white hover:bg-slate-800 h-8"
          onClick={onAssign}
        >
          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
          Assign
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="text-slate-300 hover:text-white hover:bg-slate-800 h-8"
          onClick={onExport}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="text-slate-300 hover:text-white hover:bg-slate-800 h-8"
          onClick={onMarkReviewed}
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          Mark Reviewed
        </Button>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 p-0 ml-2"
        onClick={onClearSelection}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
