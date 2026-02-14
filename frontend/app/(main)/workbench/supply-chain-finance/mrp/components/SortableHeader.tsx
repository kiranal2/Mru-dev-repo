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
  highlighted = false,
}: SortableHeaderProps) {
  return (
    <th
      onClick={() => onSort(field)}
      className={`p-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-gray-700 transition ${
        aiGenerated
          ? "text-blue-600 bg-blue-50"
          : highlighted
            ? "text-amber-600 bg-amber-50"
            : "text-slate-600"
      }`}
    >
      <div className="flex items-center gap-1">
        {label}
        {sort.field === field && (
          <span className="text-[#0A3B77]">{sort.direction === "asc" ? "\u2191" : "\u2193"}</span>
        )}
      </div>
    </th>
  );
}
