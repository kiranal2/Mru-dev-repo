"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            Showing {Math.min((page - 1) * pageSize + 1, total)} to{" "}
            {Math.min(page * pageSize, total)} of {total}
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </footer>
  );
}
