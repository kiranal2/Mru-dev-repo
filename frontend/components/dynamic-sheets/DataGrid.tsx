"use client";

import { DynamicSheetColumn } from "@/lib/dynamic-sheets-store";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataGridProps {
  data: any[];
  columns: DynamicSheetColumn[];
}

export function DataGrid({ data, columns }: DataGridProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm mt-1">Run the sheet to load data</p>
        </div>
      </div>
    );
  }

  const formatValue = (value: any, dataType: DynamicSheetColumn["dataType"]) => {
    if (value === null || value === undefined) return "";

    switch (dataType) {
      case "currency":
        return typeof value === "number"
          ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : value;
      case "number":
        return typeof value === "number" ? value.toLocaleString("en-US") : value;
      case "date":
        try {
          return new Date(value).toLocaleDateString("en-US");
        } catch {
          return value;
        }
      case "boolean":
        return value ? "Yes" : "No";
      default:
        return String(value);
    }
  };

  return (
    <div className="w-full">
      <table
        className="w-full divide-y divide-slate-200 border-collapse"
        style={{ tableLayout: "auto", width: "100%" }}
      >
        <colgroup>
          {columns.map((col) => (
            <col
              key={col.id}
              style={{
                width: col.width ? `${col.width}px` : "auto",
                minWidth: col.width || 120,
              }}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider border-r last:border-r-0 whitespace-nowrap"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 50,
                  minWidth: col.width || 120,
                  backgroundColor: "#f8fafc",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                }}
              >
                <div className="truncate" title={col.label}>
                  {col.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50">
              {columns.map((col) => (
                <td
                  key={col.id}
                  className="px-4 py-3 text-sm text-slate-900 border-r last:border-r-0"
                  style={{
                    minWidth: col.width || 120,
                  }}
                >
                  <div
                    className="truncate"
                    title={String(formatValue(row[col.fieldKey], col.dataType))}
                  >
                    {formatValue(row[col.fieldKey], col.dataType)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
