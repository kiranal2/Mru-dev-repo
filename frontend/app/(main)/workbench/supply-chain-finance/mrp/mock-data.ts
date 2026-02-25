/**
 * Mock / fallback data for MRP Workbench when Supabase is unavailable.
 */

import type { SeverityCounts, QuickViewCounts, GroupedCounts } from "../services/FiltersService";
import type { Signal, SignalRow } from "../lib/supabase";

/* ─── Suppliers ─── */
export const MOCK_SUPPLIERS = [
  { supplier_id: "sup-001", supplier_name: "Apex Manufacturing", code: "APX", country: "US", rating: 4.2, created_at: "2025-01-10T00:00:00Z", updated_at: "2025-01-10T00:00:00Z" },
  { supplier_id: "sup-002", supplier_name: "Delta Components", code: "DLT", country: "DE", rating: 3.8, created_at: "2025-01-10T00:00:00Z", updated_at: "2025-01-10T00:00:00Z" },
  { supplier_id: "sup-003", supplier_name: "Pacific Materials", code: "PAC", country: "JP", rating: 4.5, created_at: "2025-01-10T00:00:00Z", updated_at: "2025-01-10T00:00:00Z" },
  { supplier_id: "sup-004", supplier_name: "GlobalTech Parts", code: "GTP", country: "CN", rating: 3.5, created_at: "2025-01-10T00:00:00Z", updated_at: "2025-01-10T00:00:00Z" },
  { supplier_id: "sup-005", supplier_name: "Nordic Precision", code: "NPC", country: "SE", rating: 4.7, created_at: "2025-01-10T00:00:00Z", updated_at: "2025-01-10T00:00:00Z" },
  { supplier_id: "sup-006", supplier_name: "Reliable Fasteners", code: "RLF", country: "US", rating: 4.0, created_at: "2025-01-10T00:00:00Z", updated_at: "2025-01-10T00:00:00Z" },
];

/* ─── Map recommendation text to enum ─── */
function toRecommended(rec: string): Signal["recommended"] {
  if (rec.toLowerCase().includes("escalate")) return "ESCALATE";
  if (rec.toLowerCase().includes("counter")) return "COUNTER_DATE";
  if (rec.toLowerCase().includes("tracking")) return "REQUEST_TRACKING";
  return "ACCEPT";
}

/* ─── Helper to build a mock signal row ─── */
function mkSignal(
  idx: number,
  supplierIdx: number,
  opts: {
    type: Signal["type"];
    label: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    status: "NEW" | "MONITORING" | "COMPLETED";
    recommendation: string;
    supplierAction: string;
    daysDelta: number;
    item: string;
    itemDesc: string;
    score: number;
    aiConf: number;
  }
): SignalRow {
  const today = new Date();
  const poDate = new Date(today);
  poDate.setDate(poDate.getDate() - 14 - idx);
  const mrpDate = new Date(today);
  mrpDate.setDate(mrpDate.getDate() + 10 + idx);
  const promiseDate = new Date(mrpDate);
  promiseDate.setDate(promiseDate.getDate() + opts.daysDelta);
  const commitDate = opts.status === "COMPLETED" ? mrpDate.toISOString().slice(0, 10) : null;
  const sup = MOCK_SUPPLIERS[supplierIdx];

  return {
    signal_id: `sig-${String(idx).padStart(3, "0")}`,
    po_line_id: `pol-${String(idx).padStart(3, "0")}`,
    type: opts.type,
    label: opts.label,
    severity: opts.severity,
    status: opts.status,
    recommended: toRecommended(opts.recommendation),
    recommendation: opts.recommendation,
    rationale: `AI-detected ${opts.label.toLowerCase()} signal for ${opts.item}`,
    score: opts.score,
    is_open: opts.status !== "COMPLETED",
    ai_confidence: opts.aiConf,
    ai_auto_resolved: false,
    created_at: new Date(today.getTime() - (30 - idx) * 86400000).toISOString(),
    updated_at: new Date(today.getTime() - idx * 86400000).toISOString(),
    resolved_at: opts.status === "COMPLETED" ? today.toISOString() : null,
    po_line: {
      po_line_id: `pol-${String(idx).padStart(3, "0")}`,
      po_number: `PO-${2025000 + idx}`,
      supplier_id: sup.supplier_id,
      item: opts.item,
      item_description: opts.itemDesc,
      po_date: poDate.toISOString().slice(0, 10),
      mrp_required_date: mrpDate.toISOString().slice(0, 10),
      po_promise_date: promiseDate.toISOString().slice(0, 10),
      commit_date: commitDate,
      lead_date: null,
      need_qty: 100 + idx * 25,
      uom: "EA",
      org_code: "MFG-01",
      supplier_action: opts.supplierAction,
      supplier_commit: promiseDate.toISOString().slice(0, 10),
      delta_mrp: `${opts.daysDelta}d`,
      quarter_end: "2025-06-30",
      created_at: poDate.toISOString(),
      updated_at: today.toISOString(),
    },
    supplier: sup,
  };
}

const BASE_MOCK_SIGNALS: SignalRow[] = [
  mkSignal(1, 0, { type: "SIG_PULL_IN", label: "Pull-in Required", severity: "HIGH", status: "NEW", recommendation: "Counter Date", supplierAction: "PUSH OUT", daysDelta: 7, item: "ALU-BRACKET-7X", itemDesc: "Aluminum Mounting Bracket 7X", score: 92, aiConf: 0.95 }),
  mkSignal(2, 1, { type: "SIG_PUSH_OUT", label: "Push-out Required", severity: "HIGH", status: "NEW", recommendation: "Counter Date", supplierAction: "PULL IN", daysDelta: -5, item: "STL-SHAFT-12", itemDesc: "Steel Drive Shaft 12mm", score: 88, aiConf: 0.91 }),
  mkSignal(3, 2, { type: "SIG_NO_ACK_T5", label: "No Ack T+5", severity: "HIGH", status: "NEW", recommendation: "Escalate", supplierAction: "", daysDelta: 0, item: "PCB-CTRL-V3", itemDesc: "Control Board PCB v3.2", score: 95, aiConf: 0.98 }),
  mkSignal(4, 3, { type: "SIG_PAST_DUE", label: "Past Due", severity: "HIGH", status: "NEW", recommendation: "Escalate", supplierAction: "PAST DUE", daysDelta: -12, item: "SEAL-HYD-45", itemDesc: "Hydraulic Seal Kit 45mm", score: 97, aiConf: 0.99 }),
  mkSignal(5, 4, { type: "SIG_SUPPLIER_NO_RESPONSE", label: "Supplier No Response", severity: "HIGH", status: "NEW", recommendation: "Escalate", supplierAction: "", daysDelta: 0, item: "GEAR-SET-M8", itemDesc: "Precision Gear Set Module 8", score: 90, aiConf: 0.93 }),
  mkSignal(6, 5, { type: "SIG_PULL_IN", label: "Pull-in Required", severity: "HIGH", status: "NEW", recommendation: "Counter Date", supplierAction: "PUSH OUT", daysDelta: 4, item: "BEARING-6205", itemDesc: "Ball Bearing 6205-2RS", score: 85, aiConf: 0.88 }),
  mkSignal(7, 0, { type: "SIG_PUSH_OUT", label: "Push-out Required", severity: "MEDIUM", status: "NEW", recommendation: "Counter Date", supplierAction: "PULL IN", daysDelta: -3, item: "WIRE-HARN-16", itemDesc: "Wire Harness Assembly 16-pin", score: 72, aiConf: 0.82 }),
  mkSignal(8, 1, { type: "SIG_ACKNOWLEDGE", label: "Acknowledge", severity: "LOW", status: "NEW", recommendation: "AI Auto-Remind T+N / Auto-Respond", supplierAction: "ACKNOWLEDGE", daysDelta: 1, item: "CAP-CER-100", itemDesc: "Ceramic Capacitor 100nF", score: 30, aiConf: 0.75 }),
  mkSignal(9, 2, { type: "SIG_PULL_IN", label: "Pull-in Required", severity: "HIGH", status: "MONITORING", recommendation: "Counter Date", supplierAction: "PUSH OUT", daysDelta: 6, item: "MOTOR-BL-48V", itemDesc: "Brushless Motor 48V 500W", score: 89, aiConf: 0.92 }),
  mkSignal(10, 3, { type: "SIG_PUSH_OUT", label: "Push-out Required", severity: "HIGH", status: "MONITORING", recommendation: "Counter Date", supplierAction: "PULL IN", daysDelta: -8, item: "FILTER-HEPA-H13", itemDesc: "HEPA Filter H13 Grade", score: 86, aiConf: 0.89 }),
  mkSignal(11, 4, { type: "SIG_NO_ACK_T5", label: "No Ack T+5", severity: "HIGH", status: "MONITORING", recommendation: "Escalate", supplierAction: "", daysDelta: 0, item: "LENS-OPT-50", itemDesc: "Optical Lens 50mm f/1.8", score: 93, aiConf: 0.96 }),
  mkSignal(12, 5, { type: "SIG_PAST_DUE", label: "Past Due", severity: "HIGH", status: "MONITORING", recommendation: "Escalate", supplierAction: "PAST DUE", daysDelta: -15, item: "PUMP-CEN-20", itemDesc: "Centrifugal Pump 20L/min", score: 96, aiConf: 0.97 }),
  mkSignal(13, 0, { type: "SIG_OK_CONFIRM", label: "OK/Confirm", severity: "LOW", status: "MONITORING", recommendation: "AI Auto-Remind T+N / Auto-Respond", supplierAction: "CONFIRM", daysDelta: 0, item: "BOLT-HEX-M10", itemDesc: "Hex Bolt M10x40 Grade 8.8", score: 15, aiConf: 0.70 }),
  mkSignal(14, 1, { type: "SIG_PULL_IN", label: "Pull-in Required", severity: "HIGH", status: "COMPLETED", recommendation: "Counter Date", supplierAction: "OK/CONFIRM", daysDelta: 0, item: "SPRING-COMP-50", itemDesc: "Compression Spring 50N/mm", score: 88, aiConf: 0.90 }),
  mkSignal(15, 2, { type: "SIG_PUSH_OUT", label: "Push-out Required", severity: "MEDIUM", status: "COMPLETED", recommendation: "Counter Date", supplierAction: "CONFIRM", daysDelta: 0, item: "GASKET-FLG-DN80", itemDesc: "Flange Gasket DN80 EPDM", score: 75, aiConf: 0.84 }),
  mkSignal(16, 3, { type: "SIG_OK_CONFIRM", label: "OK/Confirm", severity: "LOW", status: "COMPLETED", recommendation: "AI Auto-Remind T+N / Auto-Respond", supplierAction: "OK/CONFIRM", daysDelta: 0, item: "NUT-LOC-M12", itemDesc: "Locking Nut M12 Nylon Insert", score: 10, aiConf: 0.68 }),
  mkSignal(17, 4, { type: "SIG_ACKNOWLEDGE", label: "Acknowledge", severity: "LOW", status: "COMPLETED", recommendation: "AI Auto-Remind T+N / Auto-Respond", supplierAction: "ACKNOWLEDGE", daysDelta: 0, item: "WASHER-FL-M8", itemDesc: "Flat Washer M8 SS304", score: 12, aiConf: 0.65 }),
  mkSignal(18, 5, { type: "SIG_CANCEL", label: "Cancel", severity: "HIGH", status: "NEW", recommendation: "Escalate", supplierAction: "CANCEL", daysDelta: 0, item: "VALVE-SOL-24V", itemDesc: "Solenoid Valve 24V NC", score: 94, aiConf: 0.97 }),
  mkSignal(19, 0, { type: "SIG_PARTIAL_COMMIT", label: "Partial Commit", severity: "MEDIUM", status: "NEW", recommendation: "Counter Date", supplierAction: "EXPEDITE", daysDelta: 2, item: "TUBE-SS-1/4", itemDesc: "SS Tube 1/4 inch Seamless", score: 70, aiConf: 0.80 }),
  mkSignal(20, 1, { type: "SIG_CANCEL_REQUEST", label: "Cancel Request", severity: "HIGH", status: "MONITORING", recommendation: "Escalate", supplierAction: "CANCEL", daysDelta: 0, item: "RELAY-SSR-40A", itemDesc: "Solid State Relay 40A", score: 91, aiConf: 0.94 }),
  mkSignal(21, 2, { type: "SIG_PULL_IN", label: "Pull-in Required", severity: "HIGH", status: "NEW", recommendation: "Counter Date", supplierAction: "PUSH OUT", daysDelta: 9, item: "SENSOR-PROX-5M", itemDesc: "Proximity Sensor 5mm NPN", score: 87, aiConf: 0.90 }),
  mkSignal(22, 3, { type: "SIG_PUSH_OUT", label: "Push-out Required", severity: "MEDIUM", status: "NEW", recommendation: "Counter Date", supplierAction: "PULL IN", daysDelta: -4, item: "HOSE-FLEX-DN25", itemDesc: "Flexible Hose DN25 PTFE", score: 68, aiConf: 0.78 }),
  mkSignal(23, 4, { type: "SIG_SUPPLIER_NO_RESPONSE", label: "Supplier No Response", severity: "HIGH", status: "NEW", recommendation: "Escalate", supplierAction: "", daysDelta: 0, item: "CONNECTOR-DB25", itemDesc: "D-Sub Connector 25-pin Male", score: 88, aiConf: 0.91 }),
  mkSignal(24, 5, { type: "SIG_PAST_DUE", label: "Past Due", severity: "HIGH", status: "NEW", recommendation: "Escalate", supplierAction: "PAST DUE", daysDelta: -20, item: "CHAIN-ROLLER-08B", itemDesc: "Roller Chain 08B-1 Simplex", score: 98, aiConf: 0.99 }),
  mkSignal(25, 0, { type: "SIG_NO_ACK_T5", label: "No Ack T+5", severity: "HIGH", status: "MONITORING", recommendation: "Escalate", supplierAction: "", daysDelta: 0, item: "CYLINDER-HYD-63", itemDesc: "Hydraulic Cylinder 63mm Bore", score: 94, aiConf: 0.96 }),
];

const TARGET_MOCK_SIGNAL_COUNT = 100;

function recommendationFromSignal(signal: SignalRow): string {
  if (signal.recommendation && signal.recommendation.trim()) return signal.recommendation;
  if (signal.recommended === "ESCALATE") return "Escalate";
  if (signal.recommended === "COUNTER_DATE") return "Counter Date";
  if (signal.recommended === "REQUEST_TRACKING") return "Request Tracking";
  return "AI Auto-Remind T+N / Auto-Respond";
}

function nextStatus(index: number, seedStatus: Signal["status"]): Signal["status"] {
  if (index % 12 === 0) return "COMPLETED";
  if (index % 3 === 0) return "MONITORING";
  if (seedStatus === "COMPLETED" && index % 2 === 0) return "MONITORING";
  return "NEW";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildMockSignals(targetCount: number = TARGET_MOCK_SIGNAL_COUNT): SignalRow[] {
  const rows: SignalRow[] = [...BASE_MOCK_SIGNALS];
  if (targetCount <= rows.length) return rows.slice(0, targetCount);

  for (let i = rows.length; i < targetCount; i += 1) {
    const seed = BASE_MOCK_SIGNALS[i % BASE_MOCK_SIGNALS.length];
    const idx = i + 1;
    const status = nextStatus(i, seed.status);
    const shift = (i % 9) - 4; // -4..+4
    const parsedDaysDelta = Number.parseInt(seed.po_line.delta_mrp || "0", 10) || 0;
    const scoreBase = seed.score ?? 70;
    const aiConfBase = seed.ai_confidence ?? 0.85;

    rows.push(
      mkSignal(idx, i % MOCK_SUPPLIERS.length, {
        type: seed.type,
        label: seed.label,
        severity:
          status === "COMPLETED" && seed.severity === "HIGH" && i % 2 === 0
            ? "MEDIUM"
            : seed.severity,
        status,
        recommendation: recommendationFromSignal(seed),
        supplierAction: seed.po_line.supplier_action || "",
        daysDelta: parsedDaysDelta + shift,
        item: `${seed.po_line.item || "PART"}-${String(idx).padStart(3, "0")}`,
        itemDesc: `${seed.po_line.item_description || "Component"} Batch ${1000 + idx}`,
        score: clamp(scoreBase + shift * 2, 8, 99),
        aiConf: clamp(Number((aiConfBase + shift * 0.01).toFixed(2)), 0.6, 0.99),
      })
    );
  }

  return rows;
}

export const MOCK_SIGNALS: SignalRow[] = buildMockSignals();

/* ─── Severity counts for "NEW" quickView (default) ─── */
export const MOCK_SEVERITY_COUNTS: SeverityCounts = {
  HIGH: MOCK_SIGNALS.filter((s) => s.status === "NEW" && s.severity === "HIGH").length,
  MEDIUM: MOCK_SIGNALS.filter((s) => s.status === "NEW" && s.severity === "MEDIUM").length,
  LOW: MOCK_SIGNALS.filter((s) => s.status === "NEW" && s.severity === "LOW").length,
};

/* ─── Quick-view counts ─── */
export const MOCK_QUICKVIEW_COUNTS: QuickViewCounts = {
  NEW: MOCK_SIGNALS.filter((s) => s.status === "NEW" && s.severity !== "LOW").length,
  MONITORING: MOCK_SIGNALS.filter((s) => s.status === "MONITORING").length,
  COMPLETED: MOCK_SIGNALS.filter((s) => s.status === "COMPLETED").length,
  SIG_PULL_IN: MOCK_SIGNALS.filter((s) => s.type === "SIG_PULL_IN").length,
  SIG_PUSH_OUT: MOCK_SIGNALS.filter((s) => s.type === "SIG_PUSH_OUT").length,
  SIG_ACKNOWLEDGE: MOCK_SIGNALS.filter((s) => s.type === "SIG_ACKNOWLEDGE").length,
  SIG_NO_ACK_T5: MOCK_SIGNALS.filter((s) => s.type === "SIG_NO_ACK_T5").length,
  SIG_OK_CONFIRM: MOCK_SIGNALS.filter((s) => s.type === "SIG_OK_CONFIRM").length,
  SIG_PAST_DUE: MOCK_SIGNALS.filter((s) => s.type === "SIG_PAST_DUE").length,
  SIG_CANCEL: MOCK_SIGNALS.filter((s) => s.type === "SIG_CANCEL").length,
};

/* ─── Grouped counts by status > exception type ─── */
function countByStatusAndType(status: string) {
  const filtered = MOCK_SIGNALS.filter((s) => {
    if (status === "NEW" && (s.severity === "LOW")) return false;
    return s.status === status;
  });
  const result: Record<string, number> = { total: filtered.length };
  const types = ["SIG_PULL_IN", "SIG_PUSH_OUT", "SIG_ACKNOWLEDGE", "SIG_NO_ACK_T5", "SIG_OK_CONFIRM", "SIG_PAST_DUE", "SIG_CANCEL", "SIG_PARTIAL_COMMIT", "SIG_CANCEL_REQUEST", "SIG_SUPPLIER_NO_RESPONSE"];
  types.forEach((t) => { result[t] = filtered.filter((s) => s.type === t).length; });
  return result;
}

export const MOCK_GROUPED_COUNTS: GroupedCounts = {
  NEW: countByStatusAndType("NEW") as GroupedCounts["NEW"],
  MONITORING: countByStatusAndType("MONITORING") as GroupedCounts["MONITORING"],
  COMPLETED: countByStatusAndType("COMPLETED") as GroupedCounts["COMPLETED"],
};

/* ─── Metrics ─── */
export const MOCK_METRICS = {
  autoClearPercent: 65,
  exceptionsCount: MOCK_SIGNALS.filter((s) => s.status !== "COMPLETED").length,
  slaStatus: "AT RISK" as const,
};

/* ─── Dashboard stats ─── */
export const MOCK_DASHBOARD_STATS = {
  totalOpen: MOCK_SIGNALS.filter((s) => s.is_open).length,
  openChange: -8,
  avgResolutionTime: 3,
  resolutionTimeChange: -15,
  supplierResponseRate: 78,
  responseRateChange: 5,
  onTimeDeliveryRate: 92,
  deliveryRateChange: 3,
  autoClearPercent: 65,
  autoClearChange: 12,
};

/**
 * Client-side filtering for mock data (replicates what Supabase queries do).
 */
export function filterMockSignals(params: {
  quickView: string;
  severities: string[];
  supplierIds: string[];
  q: string;
  sort: { field: string; direction: "asc" | "desc" };
  page: number;
  pageSize: number;
}) {
  let rows = [...MOCK_SIGNALS];

  // Quick view filter
  if (params.quickView.includes(":")) {
    const [status, type] = params.quickView.split(":");
    rows = rows.filter((r) => r.status === status && r.type === type);
  } else if (params.quickView === "NEW") {
    rows = rows.filter((r) => r.status === "NEW" && r.severity !== "LOW");
  } else if (params.quickView === "MONITORING") {
    rows = rows.filter((r) => r.status === "MONITORING");
  } else if (params.quickView === "COMPLETED") {
    rows = rows.filter((r) => r.status === "COMPLETED");
  } else if (params.quickView.startsWith("SIG_")) {
    rows = rows.filter((r) => r.type === params.quickView);
  }

  // Severity filter
  if (params.severities.length > 0) {
    rows = rows.filter((r) => params.severities.includes(r.severity));
  }

  // Supplier filter
  if (params.supplierIds.length > 0) {
    rows = rows.filter((r) => params.supplierIds.includes(r.supplier.supplier_id));
  }

  // Search filter
  if (params.q) {
    const term = params.q.toLowerCase();
    rows = rows.filter((r) =>
      r.po_line.po_number.toLowerCase().includes(term) ||
      r.supplier.supplier_name.toLowerCase().includes(term) ||
      (r.po_line.item || "").toLowerCase().includes(term) ||
      (r.po_line.item_description || "").toLowerCase().includes(term) ||
      r.label.toLowerCase().includes(term)
    );
  }

  // Sort
  const { field, direction } = params.sort;
  const dir = direction === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    let va: string | number = 0;
    let vb: string | number = 0;
    if (field === "score") { va = a.score ?? 0; vb = b.score ?? 0; }
    else if (field === "severity") { va = a.severity; vb = b.severity; }
    else if (field === "status") { va = a.status; vb = b.status; }
    else if (field === "label") { va = a.label; vb = b.label; }
    else if (field === "po_number") { va = a.po_line.po_number; vb = b.po_line.po_number; }
    else if (field === "supplier_name") { va = a.supplier.supplier_name; vb = b.supplier.supplier_name; }
    else if (field === "po_date") { va = a.po_line.po_date || ""; vb = b.po_line.po_date || ""; }
    else if (field === "mrp_required_date") { va = a.po_line.mrp_required_date || ""; vb = b.po_line.mrp_required_date || ""; }
    else if (field === "po_promise_date") { va = a.po_line.po_promise_date || ""; vb = b.po_line.po_promise_date || ""; }
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  const total = rows.length;
  const from = (params.page - 1) * params.pageSize;
  const paged = rows.slice(from, from + params.pageSize);

  return { rows: paged, total } as { rows: SignalRow[]; total: number };
}

/**
 * Get severity counts from mock data for a given quickView.
 */
export function getMockSeverityCounts(quickView: string): SeverityCounts {
  let rows = [...MOCK_SIGNALS];
  if (quickView.includes(":")) {
    const [status, type] = quickView.split(":");
    rows = rows.filter((r) => r.status === status && r.type === type);
  } else if (quickView === "NEW") {
    rows = rows.filter((r) => r.status === "NEW" && r.severity !== "LOW");
  } else if (quickView === "MONITORING") {
    rows = rows.filter((r) => r.status === "MONITORING");
  } else if (quickView === "COMPLETED") {
    rows = rows.filter((r) => r.status === "COMPLETED");
  }
  return {
    HIGH: rows.filter((r) => r.severity === "HIGH").length,
    MEDIUM: rows.filter((r) => r.severity === "MEDIUM").length,
    LOW: rows.filter((r) => r.severity === "LOW").length,
  };
}
