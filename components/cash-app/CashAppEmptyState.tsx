"use client";

import { FileX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CashAppEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function CashAppEmptyState({
  title = "No payments found",
  description = "There are no payments matching your current filters.",
  actionLabel,
  onAction,
}: CashAppEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FileX className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
