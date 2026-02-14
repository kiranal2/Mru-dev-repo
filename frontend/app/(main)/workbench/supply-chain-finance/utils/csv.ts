import { SignalRow } from "../lib/supabase";
import { format } from "date-fns";

export interface CSVRow {
  po_number: string;
  supplier_name: string;
  org_code?: string;
  item?: string;
  item_description?: string;
  po_date?: string;
  po_promise_date?: string;
  mrp_required_date?: string;
  supplier_action?: string;
  supplier_commit?: string;
  commit_date?: string;
  delta_mrp?: string;
  lead_date?: string;
  quarter_end?: string;
  exception: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  recommended: string;
  status: string;
  rationale?: string;
}

export function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid");
  }

  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim());

    const row: any = {};
    headers.forEach((header, index) => {
      const value = values[index] || "";

      switch (header) {
        case "PO Number":
          row.po_number = value;
          break;
        case "Supplier Name":
          row.supplier_name = value;
          break;
        case "Org Code":
          row.org_code = value;
          break;
        case "Item":
          row.item = value;
          break;
        case "Item Description":
          row.item_description = value;
          break;
        case "PO Date":
          row.po_date = value;
          break;
        case "PO Promise Date":
          row.po_promise_date = value;
          break;
        case "MRP Required Date":
          row.mrp_required_date = value;
          break;
        case "Supplier Action":
          row.supplier_action = value;
          break;
        case "Commit":
          row.commit_date = value;
          break;
        case "Δ vs MRP":
          row.delta_mrp = value;
          break;
        case "Lead Date":
          row.lead_date = value;
          break;
        case "Quarter End":
          row.quarter_end = value;
          break;
        case "Exception":
          row.exception = value;
          break;
        case "Severity":
          row.severity = value;
          break;
        case "Recommended":
          row.recommended = value;
          break;
        case "Status":
          row.status = value;
          break;
        case "Rationale":
          row.rationale = value;
          break;
      }
    });

    if (row.po_number) {
      rows.push(row as CSVRow);
    }
  }

  return rows;
}

export function exportToCSV(rows: SignalRow[], filename: string = "po-exceptions.csv") {
  const headers = [
    "PO Number",
    "Supplier Name",
    "Org Code",
    "Item",
    "Item Description",
    "PO Date",
    "PO Promise Date",
    "MRP Required Date",
    "Supplier Action",
    "Commit",
    "Lead Date",
    "Exception",
    "Severity",
    "Recommended",
    "Status",
    "Rationale",
  ];

  const csvRows = rows.map((row) => [
    row.po_line.po_number,
    row.supplier.supplier_name,
    row.po_line.org_code || "",
    row.po_line.item || "",
    row.po_line.item_description || "",
    row.po_line.po_date ? format(new Date(row.po_line.po_date), "yyyy-MM-dd") : "",
    row.po_line.po_promise_date ? format(new Date(row.po_line.po_promise_date), "yyyy-MM-dd") : "",
    row.po_line.mrp_required_date
      ? format(new Date(row.po_line.mrp_required_date), "yyyy-MM-dd")
      : "",
    row.po_line.supplier_action || "",
    row.po_line.commit_date ? format(new Date(row.po_line.commit_date), "yyyy-MM-dd") : "",
    row.po_line.lead_date ? format(new Date(row.po_line.lead_date), "yyyy-MM-dd") : "",
    row.label,
    row.severity,
    row.recommended,
    row.status,
    row.rationale || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
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
}
