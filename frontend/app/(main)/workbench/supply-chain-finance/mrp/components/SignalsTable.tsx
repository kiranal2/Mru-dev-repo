"use client";

import { format } from "date-fns";
import { SortableHeader } from "./SortableHeader";
import { SupplierActionBadge } from "./SupplierActionBadge";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import type { SortState } from "../types";

interface SignalsTableProps {
  rows: any[];
  isLoading: boolean;
  sort: SortState;
  selectedRows: Set<string>;
  onSort: (field: string) => void;
  onRowClick: (signalId: string) => void;
  onToggleRow: (signalId: string) => void;
}

export function SignalsTable({
  rows,
  isLoading,
  sort,
  selectedRows,
  onSort,
  onRowClick,
  onToggleRow,
}: SignalsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
          <tr>
            <th className="p-3 text-left">
              <input type="checkbox" />
            </th>
            <SortableHeader label="PO Number" field="po_number" sort={sort} onSort={onSort} />
            <SortableHeader label="Supplier Name" field="supplier_name" sort={sort} onSort={onSort} />
            <SortableHeader label="PO Date" field="po_date" sort={sort} onSort={onSort} />
            <SortableHeader label="PO Promised Date" field="supplier_commit" sort={sort} onSort={onSort} />
            <SortableHeader label="MRP Required Date" field="mrp_required_date" sort={sort} onSort={onSort} />
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
            <tr>
              <td colSpan={12} className="p-8 text-center text-slate-500">
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={12} className="p-8 text-center text-slate-500">
                No exceptions found
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.signal_id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.signal_id)}
                    onChange={() => onToggleRow(row.signal_id)}
                  />
                </td>
                <td
                  className="p-3 text-sm font-medium cursor-pointer hover:text-blue-400 transition whitespace-nowrap"
                  onClick={() => onRowClick(row.signal_id)}
                >
                  {row.po_line.po_number}
                </td>
                <td className="p-3 text-sm whitespace-nowrap">
                  {row.supplier.supplier_name}
                </td>
                <td className="p-3 text-sm whitespace-nowrap">
                  {row.po_line.po_date
                    ? format(new Date(row.po_line.po_date), "MMM dd, yyyy")
                    : "-"}
                </td>
                <td className="p-3 text-sm whitespace-nowrap">
                  {(row.po_line as any).supplier_commit
                    ? format(
                        new Date((row.po_line as any).supplier_commit),
                        "MMM dd, yyyy"
                      )
                    : "-"}
                </td>
                <td className="p-3 text-sm whitespace-nowrap">
                  {row.po_line.mrp_required_date
                    ? format(new Date(row.po_line.mrp_required_date), "MMM dd, yyyy")
                    : "-"}
                </td>
                <td className="p-3 text-sm whitespace-nowrap">
                  <SupplierActionBadge action={row.po_line.supplier_action} />
                </td>
                <td className="p-3 text-sm whitespace-nowrap">
                  {row.po_line.po_promise_date
                    ? format(new Date(row.po_line.po_promise_date), "MMM dd, yyyy")
                    : "-"}
                </td>
                <td className="p-3 text-sm whitespace-nowrap">{row.label}</td>
                <td className="p-3 whitespace-nowrap">
                  <SeverityBadge severity={row.severity} />
                </td>
                <td className="p-3 text-sm whitespace-nowrap">
                  {row.recommendation || row.recommended || "-"}
                </td>
                <td className="p-3 whitespace-nowrap">
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
