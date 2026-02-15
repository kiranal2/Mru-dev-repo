/**
 * @module mrp
 * @description Type definitions for MRP (Material Requirements Planning)
 * supply chain finance data layer including suppliers, PO lines, signals,
 * and aggregate counts.
 */

/**
 * A supplier in the MRP system.
 */
export interface MrpSupplier {
  supplier_id: string;
  supplier_name: string;
  code: string | null;
  country: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * A purchase order line item.
 */
export interface MrpPOLine {
  po_line_id: string;
  po_number: string;
  supplier_id: string;
  item: string | null;
  item_description: string | null;
  po_date: string | null;
  mrp_required_date: string | null;
  po_promise_date: string | null;
  commit_date: string | null;
  lead_date: string | null;
  need_qty: number | null;
  uom: string | null;
  org_code: string | null;
  supplier_action: string | null;
  supplier_commit: string | null;
  delta_mrp: string | null;
  quarter_end: string | null;
  created_at: string;
  updated_at: string;
  supplier?: MrpSupplier;
}

/**
 * Signal types in the MRP exception management system.
 */
export type MrpSignalType =
  | "SIG_PULL_IN"
  | "SIG_PUSH_OUT"
  | "SIG_ACKNOWLEDGE"
  | "SIG_NO_ACK_T5"
  | "SIG_OK_CONFIRM"
  | "SIG_PAST_DUE"
  | "SIG_CANCEL"
  | "SIG_SUPPLIER_NO_RESPONSE"
  | "SIG_PARTIAL_COMMIT"
  | "SIG_CANCEL_REQUEST";

/**
 * An MRP signal (exception) with its related PO line and supplier data.
 */
export interface MrpSignal {
  signal_id: string;
  po_line_id: string;
  type: MrpSignalType;
  label: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  recommendation: string | null;
  status: "NEW" | "MONITORING" | "COMPLETED";
  rationale: string | null;
  score: number | null;
  is_open: boolean;
  ai_confidence: number | null;
  ai_auto_resolved: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  po_line: MrpPOLine;
  supplier: MrpSupplier;
}

/**
 * Severity count breakdown.
 */
export interface MrpSeverityCounts {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

/**
 * Group-level counts for each status category.
 */
export interface MrpStatusGroupCounts {
  total: number;
  SIG_PULL_IN: number;
  SIG_PUSH_OUT: number;
  SIG_ACKNOWLEDGE: number;
  SIG_NO_ACK_T5: number;
  SIG_OK_CONFIRM: number;
  SIG_PAST_DUE: number;
  SIG_CANCEL: number;
  SIG_PARTIAL_COMMIT: number;
  SIG_CANCEL_REQUEST: number;
  SIG_SUPPLIER_NO_RESPONSE: number;
}

/**
 * Grouped counts by status.
 */
export interface MrpGroupedCounts {
  NEW: MrpStatusGroupCounts;
  MONITORING: MrpStatusGroupCounts;
  COMPLETED: MrpStatusGroupCounts;
}

/**
 * Toolbar metrics for the MRP workbench.
 */
export interface MrpMetrics {
  autoClearPercent: number;
  exceptionsCount: number;
  slaStatus: string;
}
