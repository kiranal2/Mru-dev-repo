import { ArrowUp, ArrowDown } from "lucide-react";
import type { SortState } from "../types";

interface SortableHeaderProps {
  label: string;
  field: string;
  sort: SortState;
  onSort: (field: string) => void;
  aiGenerated?: boolean;
  highlighted?: boolean;
}

export function SortableHeader({
  label,
  field,
  sort,
  onSort,
  aiGenerated = false,
}: SortableHeaderProps) {
  const isActive = sort.field === field;

  return (
    <th
      onClick={() => onSort(field)}
      className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
    >
      <div className="flex items-center gap-1">
        <span className={aiGenerated ? "text-blue-300" : "text-slate-100"}>
          {label}
        </span>
        {isActive && (
          sort.direction === "asc"
            ? <ArrowUp className="h-3 w-3 text-white" />
            : <ArrowDown className="h-3 w-3 text-white" />
        )}
      </div>
    </th>
  );
}
