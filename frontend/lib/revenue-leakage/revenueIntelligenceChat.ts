import { revenueLeakageApi } from "./revenueLeakageApi";
import { LeakageCase, LeakageSignal, RiskLevel, CaseStatus } from "./types";
import { formatINR } from "./formatINR";

// ── Types ──────────────────────────────────────────────────────────

export type RevenueIntent =
  | "LEAKAGE_SUMMARY"
  | "EXEMPTION_USAGE"
  | "PROHIBITED_LAND"
  | "CHALLAN_DELAYS"
  | "HIGH_VALUE_DOCS"
  | "SLA_BREACH"
  | "PAYMENT_GAPS"
  | "GENERAL_QUERY";

export interface ExtractedParams {
  zone?: string;
  district?: string;
  risk_level?: RiskLevel;
  signal_type?: LeakageSignal;
  date_from?: string;
  date_to?: string;
  min_gap?: number;
  min_payable?: number;
  case_status?: CaseStatus;
  sla_breached?: boolean;
  limit?: number;
}

export interface RevenueResultRow {
  case_id: string;
  office_code: string;
  office_name: string;
  district: string;
  doc_type: string;
  reg_date: string;
  payable_inr: number;
  paid_inr: number;
  gap_inr: number;
  risk_level: RiskLevel;
  risk_score: number;
  signals: LeakageSignal[];
  case_status: CaseStatus;
  confidence: number;
}

export interface RevenueSummaryData {
  total_registrations: number;
  total_payable: number;
  total_paid: number;
  total_gap: number;
  high_risk_count: number;
  avg_confidence: number;
}

export interface RevenueChatResponse {
  stage: "text" | "clarifier" | "result";
  intent: RevenueIntent;
  response: string;
  clarifier?: {
    missing: string[];
    suggestions?: Record<string, string>;
  };
  presentation?: {
    summary: RevenueSummaryData;
    meta: { as_of: string; row_count: number; duration_ms: number };
    rows: RevenueResultRow[];
    filters: Record<string, string>;
  };
}

// ── Known Data ─────────────────────────────────────────────────────

const KNOWN_DISTRICTS = [
  "Srikakulam",
  "Vizianagaram",
  "Visakhapatnam",
  "Anakapalli",
  "Alluri Sitharama Raju",
  "East Godavari",
  "Kakinada",
  "Konaseema",
  "West Godavari",
  "Eluru",
  "Krishna",
  "NTR",
  "Guntur",
  "Palnadu",
  "Bapatla",
  "Prakasam",
  "Nellore",
  "Tirupati",
  "Chittoor",
  "Kadapa",
  "Annamayya",
  "Anantapur",
  "Sri Sathya Sai",
  "Kurnool",
  "Nandyal",
];

const DISTRICT_ALIASES: Record<string, string> = {
  vizag: "Visakhapatnam",
  visakha: "Visakhapatnam",
  "east godavari": "East Godavari",
  "west godavari": "West Godavari",
  "ysr kadapa": "Kadapa",
  ysr: "Kadapa",
  ntr: "NTR",
  "sri sathya sai": "Sri Sathya Sai",
  "sathya sai": "Sri Sathya Sai",
  alluri: "Alluri Sitharama Raju",
  anakapalle: "Anakapalli",
  ongole: "Prakasam",
  nellore: "Nellore",
  rajahmundry: "East Godavari",
  vijayawada: "Krishna",
  guntur: "Guntur",
  tenali: "Guntur",
  kurnool: "Kurnool",
  anantapur: "Anantapur",
  tirupati: "Tirupati",
  chittoor: "Chittoor",
  eluru: "Eluru",
  kakinada: "Kakinada",
  machilipatnam: "Krishna",
  adoni: "Kurnool",
  proddatur: "Kadapa",
  hindupur: "Anantapur",
  madanapalle: "Annamayya",
  chirala: "Prakasam",
  kavali: "Nellore",
  gudur: "Nellore",
  markapur: "Prakasam",
  bapatla: "Bapatla",
  narasaraopet: "Palnadu",
  macherla: "Palnadu",
};

// ── Intent Detection ───────────────────────────────────────────────

function detectRevenueIntent(text: string): RevenueIntent {
  const lower = text.toLowerCase();

  // Check from most specific to most general
  if (/exempt/.test(lower)) return "EXEMPTION_USAGE";
  if (/prohibited|prohibit/.test(lower)) return "PROHIBITED_LAND";
  if (/delay|challan/.test(lower)) return "CHALLAN_DELAYS";
  if (/sla|breach|overdue/.test(lower)) return "SLA_BREACH";
  if (/high.?value|above\s*[₹rs]|lakh|crore|large|top\s+\d+/.test(lower)) return "HIGH_VALUE_DOCS";
  if (/payment\s*gap/.test(lower)) return "PAYMENT_GAPS";
  if (/leakage|gap|revenue|deficit|loss|summary|overview/.test(lower)) return "LEAKAGE_SUMMARY";

  // "Show cases in Guntur", "cases in North zone", "list cases", district/zone-only queries
  if (/\bcases?\b/.test(lower)) return "LEAKAGE_SUMMARY";
  if (/\bshow\b.*\bin\b/.test(lower)) return "LEAKAGE_SUMMARY";

  return "GENERAL_QUERY";
}

// ── Parameter Extraction ───────────────────────────────────────────

function extractParameters(text: string): ExtractedParams {
  const lower = text.toLowerCase();
  const params: ExtractedParams = {};

  // Zone extraction — "zone North", "North zone", "in the North zone", "central zone"
  const zoneMatch = lower.match(
    /(?:zone\s+|^|\s)(north|south|east|west|central|coastal|rayalaseema)(?:\s+zone)?/i
  );
  if (zoneMatch) {
    params.zone = zoneMatch[1].charAt(0).toUpperCase() + zoneMatch[1].slice(1);
  }

  // District extraction — check aliases first, then known names
  for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
    if (lower.includes(alias)) {
      params.district = canonical;
      break;
    }
  }
  if (!params.district) {
    for (const d of KNOWN_DISTRICTS) {
      if (lower.includes(d.toLowerCase())) {
        params.district = d;
        break;
      }
    }
  }

  // Risk level
  const riskMatch = lower.match(/\b(high|medium|low)\s*(?:risk)?/i);
  if (riskMatch) {
    const level = riskMatch[1].toLowerCase();
    params.risk_level = (level.charAt(0).toUpperCase() + level.slice(1)) as RiskLevel;
  }

  // Signal type
  if (/payment\s*gap|revenue\s*gap/.test(lower)) params.signal_type = "RevenueGap";
  else if (/challan\s*delay/.test(lower)) params.signal_type = "ChallanDelay";
  else if (/exempt/.test(lower)) params.signal_type = "ExemptionRisk";
  else if (/market\s*value|mv\s/.test(lower)) params.signal_type = "MarketValueRisk";
  else if (/prohibit/.test(lower)) params.signal_type = "ProhibitedLand";
  else if (/data\s*integrity/.test(lower)) params.signal_type = "DataIntegrity";
  else if (/holiday\s*fee/.test(lower)) params.signal_type = "HolidayFee";

  // Amount threshold — above ₹40L, above Rs 10 lakhs, above 40 lakhs, > 50000, etc.
  const amountMatch = lower.match(
    /(?:above|over|more\s+than|greater\s+than|>\s*)[₹rs.\s]*(\d+[\d,.]*)\s*(l|lakh|lakhs|cr|crore|crores|k)?/i
  );
  if (amountMatch) {
    let value = parseFloat(amountMatch[1].replace(/,/g, ""));
    const unit = amountMatch[2]?.toLowerCase();
    if (unit?.startsWith("l")) value *= 100000;
    else if (unit?.startsWith("cr")) value *= 10000000;
    else if (unit === "k") value *= 1000;
    params.min_gap = value;
  }

  // Top N limit
  const topMatch = lower.match(/top\s+(\d+)/i);
  if (topMatch) {
    params.limit = parseInt(topMatch[1]);
  }

  // Date range — "last N days"
  const lastDaysMatch = lower.match(/last\s+(\d+)\s+days/i);
  if (lastDaysMatch) {
    const days = parseInt(lastDaysMatch[1]);
    const from = new Date();
    from.setDate(from.getDate() - days);
    params.date_from = from.toISOString().slice(0, 10);
    params.date_to = new Date().toISOString().slice(0, 10);
  }

  // Date range — "today"
  if (/\btoday\b/.test(lower)) {
    const today = new Date().toISOString().slice(0, 10);
    params.date_from = today;
    params.date_to = today;
  }

  // Date range — "from Feb 1 to Feb 12" or "from 2025-02-01 to 2025-02-12"
  const dateRangeMatch = lower.match(/from\s+([\w\s\d,-]+?)\s+to\s+([\w\s\d,-]+?)(?:\s|$)/i);
  if (dateRangeMatch) {
    const fromDate = parseFuzzyDate(dateRangeMatch[1].trim());
    const toDate = parseFuzzyDate(dateRangeMatch[2].trim());
    if (fromDate) params.date_from = fromDate;
    if (toDate) params.date_to = toDate;
  }

  // SLA breach
  if (/sla\s*breach/i.test(lower) || /breach/i.test(lower)) {
    params.sla_breached = true;
  }

  // Status
  const statusMatch = lower.match(/\b(new|in\s*review|confirmed|resolved|rejected)\b/i);
  if (statusMatch) {
    const s = statusMatch[1].trim();
    if (/^new$/i.test(s)) params.case_status = "New";
    else if (/in\s*review/i.test(s)) params.case_status = "In Review";
    else if (/confirmed/i.test(s)) params.case_status = "Confirmed";
    else if (/resolved/i.test(s)) params.case_status = "Resolved";
    else if (/rejected/i.test(s)) params.case_status = "Rejected";
  }

  return params;
}

function parseFuzzyDate(text: string): string | null {
  // Try ISO format first
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  // Try "Feb 1" / "February 1" / "Feb 12" format
  const months: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  const monthMatch = text.match(/(\w+)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?/i);
  if (monthMatch) {
    const monthName = monthMatch[1].toLowerCase();
    const day = parseInt(monthMatch[2]);
    const year = monthMatch[3] ? parseInt(monthMatch[3]) : new Date().getFullYear();
    if (months[monthName] !== undefined) {
      const d = new Date(year, months[monthName], day);
      return d.toISOString().slice(0, 10);
    }
  }

  return null;
}

// ── Case Filtering ─────────────────────────────────────────────────

function filterCases(cases: LeakageCase[], params: ExtractedParams): LeakageCase[] {
  return cases
    .filter((c) => {
      if (params.zone && c.office.zone?.toLowerCase() !== params.zone.toLowerCase()) return false;
      if (params.district && c.office.district?.toLowerCase() !== params.district.toLowerCase())
        return false;
      if (params.risk_level && c.risk_level !== params.risk_level) return false;
      if (params.signal_type && !c.leakage_signals.includes(params.signal_type)) return false;
      if (params.case_status && c.case_status !== params.case_status) return false;
      if (params.min_gap && c.gap_inr < params.min_gap) return false;
      if (params.min_payable && c.payable_total_inr < params.min_payable) return false;
      if (params.sla_breached && c.sla && !c.sla.sla_breached) return false;
      if (params.date_from) {
        const regDate = c.dates?.R_DATE ? new Date(c.dates.R_DATE) : null;
        if (regDate && regDate < new Date(params.date_from)) return false;
      }
      if (params.date_to) {
        const regDate = c.dates?.R_DATE ? new Date(c.dates.R_DATE) : null;
        if (regDate && regDate > new Date(params.date_to)) return false;
      }
      return true;
    })
    .sort((a, b) => b.risk_score - a.risk_score);
}

// ── Summary Aggregation ────────────────────────────────────────────

function aggregateSummary(cases: LeakageCase[]): RevenueSummaryData {
  let total_payable = 0;
  let total_paid = 0;
  let total_gap = 0;
  let high_risk_count = 0;
  let total_confidence = 0;

  for (const c of cases) {
    total_payable += c.payable_total_inr || 0;
    total_paid += c.paid_total_inr || 0;
    total_gap += c.gap_inr || 0;
    if (c.risk_level === "High") high_risk_count++;
    total_confidence += c.confidence || 0;
  }

  return {
    total_registrations: cases.length,
    total_payable,
    total_paid,
    total_gap,
    high_risk_count,
    avg_confidence: cases.length > 0 ? Math.round(total_confidence / cases.length) : 0,
  };
}

// ── Case → Result Row ──────────────────────────────────────────────

function caseToResultRow(c: LeakageCase): RevenueResultRow {
  return {
    case_id: c.case_id,
    office_code: c.office?.SR_CODE || "",
    office_name: c.office?.SR_NAME || "",
    district: c.office?.district || "",
    doc_type: c.doc_type?.TRAN_DESC || c.doc_type?.AB_DESC || "",
    reg_date: c.dates?.R_DATE || "",
    payable_inr: c.payable_total_inr || 0,
    paid_inr: c.paid_total_inr || 0,
    gap_inr: c.gap_inr || 0,
    risk_level: c.risk_level,
    risk_score: c.risk_score,
    signals: c.leakage_signals || [],
    case_status: c.case_status,
    confidence: c.confidence || 0,
  };
}

// ── Response Generation ────────────────────────────────────────────

function generateResultMessage(
  intent: RevenueIntent,
  summary: RevenueSummaryData,
  totalFiltered: number,
  params: ExtractedParams
): string {
  const locationPart = [params.district, params.zone].filter(Boolean).join(", ");
  const locationStr = locationPart ? ` in ${locationPart}` : "";

  const gapStr = formatINR(summary.total_gap);
  const payableStr = formatINR(summary.total_payable);
  const paidStr = formatINR(summary.total_paid);

  switch (intent) {
    case "LEAKAGE_SUMMARY":
      return `Found ${totalFiltered} registrations${locationStr}. Total payable ${payableStr}, total paid ${paidStr}, gap ${gapStr}. ${summary.high_risk_count} high-risk cases detected.`;

    case "HIGH_VALUE_DOCS":
      return `Found ${totalFiltered} high-value documents${locationStr}. Total gap: ${gapStr}. ${summary.high_risk_count} flagged as high risk.`;

    case "EXEMPTION_USAGE":
      return `Found ${totalFiltered} cases with exemption risk signals${locationStr}. Total gap: ${gapStr}.`;

    case "PROHIBITED_LAND":
      return `Found ${totalFiltered} prohibited land matches${locationStr}. Total gap: ${gapStr}.`;

    case "CHALLAN_DELAYS":
      return `Found ${totalFiltered} cases with challan delay signals${locationStr}. Total gap: ${gapStr}.`;

    case "SLA_BREACH":
      return `Found ${totalFiltered} SLA-breached cases${locationStr}. Total gap: ${gapStr}. ${summary.high_risk_count} are high risk.`;

    case "PAYMENT_GAPS":
      return `Found ${totalFiltered} cases with payment gap signals${locationStr}. Total gap: ${gapStr}. Payable ${payableStr} vs paid ${paidStr}.`;

    default:
      return `Found ${totalFiltered} cases${locationStr}. Total gap: ${gapStr}.`;
  }
}

function generateClarifierMessage(intent: RevenueIntent, missing: string[]): string {
  const missingNames = missing.map((m) => {
    switch (m) {
      case "zone":
        return "zone";
      case "district":
        return "district";
      case "risk_level":
        return "risk level";
      case "signal_type":
        return "signal type";
      case "date_range":
        return "date range";
      case "min_gap":
        return "minimum gap amount";
      default:
        return m;
    }
  });

  return `I can help with that. Could you specify the ${missingNames.join(" and ")} to narrow down the results?`;
}

function determineMissingParams(intent: RevenueIntent, params: ExtractedParams): string[] {
  // For most intents, we can return results without any required params
  // Only ask for clarification for GENERAL_QUERY which is too vague
  if (intent === "GENERAL_QUERY") {
    const missing: string[] = [];
    if (!params.zone && !params.district) missing.push("zone");
    if (!params.signal_type && !params.risk_level) missing.push("signal_type");
    return missing;
  }

  return [];
}

// ── Build URL Filters ──────────────────────────────────────────────

function buildFilters(params: ExtractedParams): Record<string, string> {
  const filters: Record<string, string> = {};
  if (params.zone) filters.zone = params.zone;
  if (params.district) filters.district = params.district;
  if (params.risk_level) filters.risk = params.risk_level;
  if (params.signal_type) filters.signal = params.signal_type;
  if (params.min_gap) filters.minGap = params.min_gap.toString();
  if (params.date_from) filters.from = params.date_from;
  if (params.date_to) filters.to = params.date_to;
  if (params.sla_breached) filters.sla = "breached";
  if (params.case_status) filters.status = params.case_status;
  return filters;
}

// ── Public API ─────────────────────────────────────────────────────

export async function processRevenueQuery(
  message: string,
  _history?: any[]
): Promise<RevenueChatResponse> {
  const startTime = Date.now();

  // 1. Detect intent
  const intent = detectRevenueIntent(message);

  // 2. Extract parameters
  const params = extractParameters(message);

  // 3. Determine if clarification needed
  const missing = determineMissingParams(intent, params);

  if (missing.length > 0) {
    return {
      stage: "clarifier",
      intent,
      response: generateClarifierMessage(intent, missing),
      clarifier: {
        missing,
        suggestions: generateSuggestions(),
      },
    };
  }

  // 4. Fetch and filter cases
  const allCases = await revenueLeakageApi.getCases();
  const filtered = filterCases(allCases, params);

  // 5. Aggregate summary
  const summary = aggregateSummary(filtered);

  // 6. Build result rows (respect limit or default 15)
  const limit = params.limit || 15;
  const rows = filtered.slice(0, limit).map(caseToResultRow);

  // 7. Build filters for Expand URL
  const filters = buildFilters(params);

  const duration = Date.now() - startTime;

  return {
    stage: "result",
    intent,
    response: generateResultMessage(intent, summary, filtered.length, params),
    presentation: {
      summary,
      meta: {
        as_of: new Date().toISOString().slice(0, 10),
        row_count: filtered.length,
        duration_ms: duration,
      },
      rows,
      filters,
    },
  };
}

function generateSuggestions(): Record<string, string> {
  return {
    zone: "Coastal",
    district: "Visakhapatnam",
    signal_type: "RevenueGap",
    risk_level: "High",
  };
}

// ── Helpers for the UI ─────────────────────────────────────────────

export function getAvailableZones(cases: LeakageCase[]): string[] {
  const zones = new Set<string>();
  for (const c of cases) {
    if (c.office?.zone) zones.add(c.office.zone);
  }
  return Array.from(zones).sort();
}

export function getAvailableDistricts(cases: LeakageCase[]): string[] {
  const districts = new Set<string>();
  for (const c of cases) {
    if (c.office?.district) districts.add(c.office.district);
  }
  return Array.from(districts).sort();
}
