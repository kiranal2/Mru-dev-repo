"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PaymentQueuePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  selectedCount?: number;
  className?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500];

export function PaymentQueuePagination({
  currentPage,
  totalPages,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  selectedCount = 0,
  className,
}: PaymentQueuePaginationProps) {
  const [jumpToPage, setJumpToPage] = useState("");

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalRecords);

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpToPage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJumpToPage();
    }
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50",
        className
      )}
    >
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div>
          Showing{" "}
          <span className="font-medium text-gray-900">
            {startIndex}-{endIndex}
          </span>{" "}
          of <span className="font-medium text-gray-900">{totalRecords}</span> payments
        </div>
        {selectedCount > 0 && (
          <div className="text-blue-600 font-medium">{selectedCount} selected</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Go to first page"
          className="h-8 w-8"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <div key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </div>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
                className={cn(
                  "h-8 w-8",
                  currentPage === page && "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {page}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Go to last page"
          className="h-8 w-8"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 ml-4 pl-4 border-l">
          <span className="text-sm text-gray-600">Go to:</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentPage.toString()}
            className="h-8 w-16 text-center"
            aria-label="Jump to page number"
          />
        </div>

        <div className="flex items-center gap-2 ml-4 pl-4 border-l">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
