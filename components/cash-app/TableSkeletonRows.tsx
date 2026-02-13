"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonRowsProps {
  rowCount?: number;
  columnCount?: number;
}

export function TableSkeletonRows({ rowCount = 10, columnCount = 12 }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b animate-pulse">
          {Array.from({ length: columnCount }).map((_, colIdx) => (
            <td key={colIdx} className="px-3 py-2">
              {colIdx === 0 ? (
                <Skeleton className="h-4 w-4 rounded" />
              ) : colIdx === 3 ? (
                <Skeleton className="h-4 w-20 rounded" />
              ) : colIdx === 7 ? (
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ) : colIdx === 10 ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-1.5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-8 rounded" />
                </div>
              ) : colIdx === 11 ? (
                <Skeleton className="h-7 w-24 rounded" />
              ) : (
                <Skeleton className="h-4 w-full max-w-[100px] rounded" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
