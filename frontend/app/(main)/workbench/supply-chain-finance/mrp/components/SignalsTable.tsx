"use client";

import { format } from "date-fns";
import { SortableHeader } from "./SortableHeader";
import { SupplierActionBadge } from "./SupplierActionBadge";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import type { SortState } from "../types";

interface SignalsTableProps {
  rows: any[];
  isLoading: boolean;
  sort: SortState;
  selectedRows: Set<string>;
  onSort: (field: string) => void;
  onRowClick: (signalId: string) => void;
  onToggleRow: (signalId: string) => void;
  onSelectAll: () => void;
}

export function SignalsTable({
  rows,
  isLoading,
  sort,
  selectedRows,
  onSort,
  onRowClick,
  onToggleRow,
  onSelectAll,
}: SignalsTableProps) {
  const allSelected = rows.length > 0 && selectedRows.size === rows.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < rows.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1400px] text-sm">
        <thead className="bg-slate-900 text-slate-100 text-xs uppercase tracking-wide">
          <tr>
            <th className="py-2 px-3 text-left w-[36px]">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-500 cursor-pointer"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={onSelectAll}
              />
            </th>
            <SortableHeader label="PO Number" field="po_number" sort={sort} onSort={onSort} />
            <SortableHeader label="Supplier" field="supplier_name" sort={sort} onSort={onSort} />
            <SortableHeader label="PO Date" field="po_date" sort={sort} onSort={onSort} />
            <SortableHeader label="PO Promise" field="supplier_commit" sort={sort} onSort={onSort} />
            <SortableHeader label="MRP Required" field="mrp_required_date" sort={sort} onSort={onSort} />
            <SortableHeader label="Supplier Action" field="supplier_action" sort={sort} onSort={onSort} />
            <SortableHeader label="Supplier Commit" field="po_promise_date" sort={sort} onSort={onSort} />
            <SortableHeader label="Exception" field="label" sort={sort} onSort={onSort} aiGenerated />
            <SortableHeader label="Severity" field="severity" sort={sort} onSort={onSort} aiGenerated />
            <SortableHeader label="Recommendation" field="recommendation" sort={sort} onSort={onSort} aiGenerated />
            <SortableHeader label="Status" field="status" sort={sort} onSort={onSort} aiGenerated />
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100 animate-pulse">
                <td className="py-2 px-3"><div className="h-3.5 w-3.5 bg-slate-200 rounded" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-24" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-28" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-20" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-20" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-20" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-16" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-20" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-20" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-14" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-24" /></td>
                <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 rounded w-16" /></td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={12} className="p-12 text-center">
                <div className="text-slate-400">
                  <svg className="mx-auto h-10 w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm font-medium text-slate-500">No exceptions found</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or quick view</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.signal_id}
                className={cn(
                  "border-b border-slate-100 transition-colors cursor-pointer",
                  selectedRows.has(row.signal_id)
                    ? "bg-blue-50/60"
                    : "hover:bg-blue-50/40"
                )}
              >
                <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer"
                    checked={selectedRows.has(row.signal_id)}
                    onChange={() => onToggleRow(row.signal_id)}
                  />
                </td>
                <td
                  className="py-2 px-3 text-sm font-semibold text-blue-700 cursor-pointer hover:underline whitespace-nowrap"
                  onClick={() => onRowClick(row.signal_id)}
                >
                  {row.po_line.po_number}
                </td>
                <td className="py-2 px-3 text-sm whitespace-nowrap text-slate-700">
                  {row.supplier?.supplier_name || "-"}
                </td>
                <td className="py-2 px-3 text-sm whitespace-nowrap text-slate-600">
                  {row.po_line.po_date
                    ? format(new Date(row.po_line.po_date), "MMM dd, yyyy")
                    : "-"}
                </td>
                <td className="py-2 px-3 text-sm whitespace-nowrap text-slate-600">
                  {(row.po_line as any).supplier_commit
                    ? format(
                        new Date((row.po_line as any).supplier_commit),
                        "MMM dd, yyyy"
                      )
                    : "-"}
                </td>
                <td className="py-2 px-3 text-sm whitespace-nowrap text-slate-600">
                  {row.po_line.mrp_required_date
                    ? format(new Date(row.po_line.mrp_required_date), "MMM dd, yyyy")
                    : "-"}
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  <SupplierActionBadge action={row.po_line.supplier_action} />
                </td>
                <td className="py-2 px-3 text-sm whitespace-nowrap text-slate-600">
                  {row.po_line.po_promise_date
                    ? format(new Date(row.po_line.po_promise_date), "MMM dd, yyyy")
                    : "-"}
                </td>
                <td className="py-2 px-3 text-sm whitespace-nowrap font-medium text-slate-700">{row.label}</td>
                <td className="py-2 px-3 whitespace-nowrap">
                  <SeverityBadge severity={row.severity} />
                </td>
                <td className="py-2 px-3 text-sm whitespace-nowrap text-slate-600">
                  {row.recommendation || row.recommended || "-"}
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
