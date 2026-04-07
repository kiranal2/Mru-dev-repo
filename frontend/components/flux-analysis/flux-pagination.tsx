"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FluxPaginationProps {
  page: number;
  totalPages: number;
  tableStart: number;
  tableEnd: number;
  totalRows: number;
  onPageChange: (page: number) => void;
}

export function FluxPagination({
  page,
  totalPages,
  tableStart,
  tableEnd,
  totalRows,
  onPageChange,
}: FluxPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-t border-slate-200 bg-slate-50/70">
      <span className="text-xs text-slate-500">
        Showing {tableStart}–{tableEnd} of {totalRows}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Prev
        </Button>
        <span className="text-xs text-slate-600">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
