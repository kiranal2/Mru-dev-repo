"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CashAppWorkbenchHeaderProps {
  title: string;
  onExport?: () => void;
}

export function CashAppWorkbenchHeader({ title, onExport }: CashAppWorkbenchHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      )}
    </div>
  );
}
