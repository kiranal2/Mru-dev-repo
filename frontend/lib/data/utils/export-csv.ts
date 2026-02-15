/**
 * Generic CSV export utility for all modules.
 * Handles any array of objects by extracting column headers from keys.
 */

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: any, row: T) => string;
}

/**
 * Export an array of objects to a CSV file and trigger download.
 */
export function exportToCSV<T extends Record<string, any>>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  if (rows.length === 0) return;

  const headers = columns.map((c) => c.header);

  const csvRows = rows.map((row) =>
    columns.map((col) => {
      const value = getNestedValue(row, col.key as string);
      const formatted = col.formatter ? col.formatter(value, row) : String(value ?? "");
      // Escape quotes and wrap in quotes
      return `"${formatted.replace(/"/g, '""')}"`;
    })
  );

  const csvContent = [
    headers.map((h) => `"${h}"`).join(","),
    ...csvRows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Quick export — auto-generates columns from the first row's keys.
 */
export function exportToCSVAuto<T extends Record<string, any>>(
  rows: T[],
  filename: string
): void {
  if (rows.length === 0) return;

  const columns: ExportColumn<T>[] = Object.keys(rows[0]).map((key) => ({
    key,
    header: key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim(),
  }));

  exportToCSV(rows, columns, filename);
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}
