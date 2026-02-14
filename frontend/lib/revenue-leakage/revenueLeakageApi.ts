import {
  LeakageCase,
  DocumentKey,
  RevenueLeakageOverview,
  LeakageSignal,
  RuleCatalogItem,
  ExportTemplate,
  ExportRecord,
  OverviewEnhanced,
  CaseStatus,
  PatternDimension,
  RegistrationPatternBucket,
  RegistrationPatternSummary,
  ValuationSlab,
  AdminData,
  ManualCaseInput,
  RuleEvaluationResult,
} from "./types";
import { evaluateRules } from "./ruleEngine";
import { mvTrendsData, getMVHotspotDetail, getMVLocationsForSro } from "./mvTrendsData";
import casesData from "./data/cases.json";
import rulesData from "./data/rules.json";

const nowIso = () => new Date().toISOString();

// ─── localStorage persistence helpers ────────────────────────────────────────

const LS_PREFIX = "rl-case-overrides::";

function getMergedCase(original: LeakageCase): LeakageCase {
  if (typeof window === "undefined") return original;
  try {
    const raw = localStorage.getItem(LS_PREFIX + original.case_id);
    if (!raw) return original;
    const overrides = JSON.parse(raw);
    return { ...original, ...overrides };
  } catch {
    return original;
  }
}

function persistCaseOverride(caseId: string, updates: Partial<LeakageCase>): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LS_PREFIX + caseId);
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem(LS_PREFIX + caseId, JSON.stringify({ ...existing, ...updates }));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function resetCaseOverride(caseId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_PREFIX + caseId);
}

function caseHasLocalOverrides(caseId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LS_PREFIX + caseId) !== null;
}

// ─── Static data from JSON ───────────────────────────────────────────────────

const rulesCatalog: RuleCatalogItem[] = rulesData as RuleCatalogItem[];

let leakageCases: LeakageCase[] = casesData as unknown as LeakageCase[];
let lastRefresh = "2024-12-13T09:00:00Z";

// Hydrate in-memory cases with any localStorage overrides
if (typeof window !== "undefined") {
  leakageCases = leakageCases.map((c) => getMergedCase(c));
}

const exportTemplates: ExportTemplate[] = [
  {
    id: "exp-001",
    name: "Case Summary CSV",
    description: "Case-level summary with gaps and signals",
    format: "CSV",
  },
  {
    id: "exp-002",
    name: "Office Summary CSV",
    description: "Office-wise totals and gap distribution",
    format: "CSV",
  },
  {
    id: "exp-003",
    name: "Rule Hits CSV",
    description: "Rule hit level evidence exports",
    format: "CSV",
  },
  {
    id: "exp-004",
    name: "Audit Pack PDF",
    description: "Case + evidence + rules hit summary for audit",
    format: "PDF",
  },
];

let exportHistory: ExportRecord[] = [
  {
    export_id: "EXP-2024-010",
    created_by: "DIG",
    created_at: "2024-12-12T15:10:00Z",
    type: "Case Summary CSV",
    filters_used: "Risk=High",
    status: "Ready",
  },
  {
    export_id: "EXP-2024-011",
    created_by: "System",
    created_at: "2024-12-12T18:40:00Z",
    type: "Rule Hits CSV",
    filters_used: "Signal=RevenueGap",
    status: "Ready",
  },
  {
    export_id: "EXP-2024-012",
    created_by: "DR",
    created_at: "2024-12-13T07:20:00Z",
    type: "Office Summary CSV",
    filters_used: "Zone=North",
    status: "Running",
  },
];

// ─── Overview builders ───────────────────────────────────────────────────────

const buildOverview = (): RevenueLeakageOverview => {
  const total_payable = leakageCases.reduce((sum, item) => sum + item.payable_total_inr, 0);
  const total_paid = leakageCases.reduce((sum, item) => sum + item.paid_total_inr, 0);
  const total_gap = leakageCases.reduce((sum, item) => sum + item.gap_inr, 0);
  const high_risk_cases = leakageCases.filter((item) => item.risk_level === "High").length;
  const cases_awaiting_review = leakageCases.filter(
    (item) => item.case_status === "New" || item.case_status === "In Review"
  ).length;

  const delaySamples = leakageCases.flatMap((item) =>
    item.evidence.included_receipts
      .map((receipt) => {
        if (!receipt.BANK_CHALLAN_DT || !receipt.RECEIPT_DATE) return null;
        const start = new Date(receipt.BANK_CHALLAN_DT).getTime();
        const end = new Date(receipt.RECEIPT_DATE).getTime();
        return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      })
      .filter((value): value is number => value !== null)
  );
  const avg_challan_delay_days = delaySamples.length
    ? Math.round(delaySamples.reduce((sum, value) => sum + value, 0) / delaySamples.length)
    : 0;

  const leakage_by_signal = (
    [
      "RevenueGap",
      "ChallanDelay",
      "ExemptionRisk",
      "MarketValueRisk",
      "ProhibitedLand",
      "DataIntegrity",
      "HolidayFee",
    ] as LeakageSignal[]
  ).map((signal) => {
    const matching = leakageCases.filter((item) => item.leakage_signals.includes(signal));
    return {
      signal,
      high: matching.filter((item) => item.risk_level === "High").length,
      medium: matching.filter((item) => item.risk_level === "Medium").length,
      low: matching.filter((item) => item.risk_level === "Low").length,
    };
  });

  const officeMap = new Map<
    string,
    { SR_CODE: string; SR_NAME: string; gap_inr: number; cases: number }
  >();
  leakageCases.forEach((item) => {
    const key = item.office.SR_CODE;
    const existing = officeMap.get(key) || {
      SR_CODE: item.office.SR_CODE,
      SR_NAME: item.office.SR_NAME,
      gap_inr: 0,
      cases: 0,
    };
    existing.gap_inr += item.gap_inr;
    existing.cases += 1;
    officeMap.set(key, existing);
  });

  const top_offices_by_gap = Array.from(officeMap.values())
    .sort((a, b) => b.gap_inr - a.gap_inr)
    .slice(0, 10);

  const newest_high_risk_cases = leakageCases
    .filter((item) => item.risk_level === "High")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
    .map((item) => ({
      case_id: item.case_id,
      document_key: item.document_key,
      risk_score: item.risk_score,
      gap_inr: item.gap_inr,
      created_at: item.created_at,
    }));

  // Office Risk Scoring
  const officeRiskMap = new Map<
    string,
    {
      office: (typeof leakageCases)[0]["office"];
      gaps: number;
      delays: number;
      prohibited: number;
      mv: number;
      exempt: number;
      total: number;
      highRisk: number;
      gap: number;
    }
  >();
  leakageCases.forEach((c) => {
    const key = c.office.SR_CODE;
    const e = officeRiskMap.get(key) || {
      office: c.office,
      gaps: 0,
      delays: 0,
      prohibited: 0,
      mv: 0,
      exempt: 0,
      total: 0,
      highRisk: 0,
      gap: 0,
    };
    e.total++;
    e.gap += c.gap_inr;
    if (c.risk_level === "High") e.highRisk++;
    if (c.leakage_signals.includes("RevenueGap")) e.gaps++;
    if (c.leakage_signals.includes("ChallanDelay")) e.delays++;
    if (c.leakage_signals.includes("ProhibitedLand")) e.prohibited++;
    if (c.leakage_signals.includes("MarketValueRisk")) e.mv++;
    if (c.leakage_signals.includes("ExemptionRisk")) e.exempt++;
    officeRiskMap.set(key, e);
  });
  const office_risk_scores = Array.from(officeRiskMap.entries())
    .map(([, v]) => {
      const gapScore = Math.min(35, v.gaps * 12);
      const delayScore = Math.min(25, v.delays * 15);
      const prohibScore = Math.min(25, v.prohibited * 25);
      const mvBase = Math.min(25, Math.round(Math.sqrt(v.mv) * 12));
      const mvHighBoost = v.mv > 0 ? Math.min(10, v.highRisk * 3) : 0;
      const mvScore = Math.min(35, mvBase + mvHighBoost);
      const exScore = Math.min(25, v.exempt * 5);
      const risk_score = Math.min(
        100,
        Math.round(gapScore + delayScore + prohibScore + mvScore + exScore)
      );
      const risk_level: import("./types").RiskLevel =
        risk_score >= 45 ? "High" : risk_score >= 20 ? "Medium" : "Low";
      return {
        SR_CODE: v.office.SR_CODE,
        SR_NAME: v.office.SR_NAME,
        district: v.office.district,
        zone: v.office.zone,
        risk_score,
        risk_level,
        component_scores: {
          revenue_gap: Math.round(gapScore),
          challan_delay: Math.round(delayScore),
          prohibited_match: Math.round(prohibScore),
          mv_deviation: Math.round(mvScore),
          exemption_anomaly: Math.round(exScore),
        },
        total_cases: v.total,
        high_risk_cases: v.highRisk,
        total_gap_inr: v.gap,
      };
    })
    .sort((a, b) => b.risk_score - a.risk_score);

  // Pattern Mining mock data
  const monthly_trends: import("./types").MonthlyTrend[] = [
    { month: "2024-07", cases: 8, gap_inr: 120000, high_risk: 2 },
    { month: "2024-08", cases: 12, gap_inr: 185000, high_risk: 4 },
    { month: "2024-09", cases: 10, gap_inr: 156000, high_risk: 3 },
    { month: "2024-10", cases: 15, gap_inr: 245000, high_risk: 5 },
    { month: "2024-11", cases: 14, gap_inr: 210000, high_risk: 4 },
    { month: "2024-12", cases: 18, gap_inr: 320000, high_risk: 7 },
  ];

  const pattern_insights: import("./types").PatternInsight[] = [
    {
      id: "PI-001",
      type: "spike",
      metric: "Revenue Gap",
      office: "SR01",
      period: "Dec 2024",
      magnitude: "+52%",
      explanation:
        "Vijayawada Central saw a 52% increase in revenue gap cases, driven by new Sale Deed registrations.",
    },
    {
      id: "PI-002",
      type: "seasonal",
      metric: "Case Volume",
      period: "Q4 2024",
      magnitude: "+38%",
      explanation: "Quarterly spike in registrations common during Oct-Dec; case volume follows.",
    },
    {
      id: "PI-003",
      type: "drift",
      metric: "Doc Type Distribution",
      office: "SR03",
      period: "2024",
      magnitude: "Gift +18%",
      explanation:
        "Kurnool East shows increasing Gift Deed proportion, potentially for exemption avoidance.",
    },
    {
      id: "PI-004",
      type: "drop",
      metric: "Unit Rate",
      office: "SR02",
      period: "Nov 2024",
      magnitude: "-22%",
      explanation: "Tirupati North saw a sudden drop in declared unit rates for rural properties.",
    },
    {
      id: "PI-005",
      type: "spike",
      metric: "Challan Delay",
      office: "SR06",
      period: "Nov 2024",
      magnitude: "+8 days",
      explanation: "Ongole South average delay increased from 5 to 13 days.",
    },
  ];

  // Exemption summary
  const exemptionCases = leakageCases.filter(
    (c) => c.evidence.exemption_evidence.status === "Available"
  );
  const allExemptions = exemptionCases.flatMap((c) => c.evidence.exemption_evidence.entries);
  const exemptCategories = new Map<string, { count: number; amount: number }>();
  allExemptions.forEach((e) => {
    const cur = exemptCategories.get(e.exemption_code) || { count: 0, amount: 0 };
    cur.count++;
    cur.amount += e.exemption_amount;
    exemptCategories.set(e.exemption_code, cur);
  });

  const exemption_summary = {
    total_exemptions: allExemptions.length,
    total_amount: allExemptions.reduce((s, e) => s + e.exemption_amount, 0),
    failed_eligibility: allExemptions.filter((e) => e.eligibility_result === "Fail").length,
    repeat_offenders: exemptionCases.filter((c) => c.evidence.exemption_evidence.repeat_usage_flag)
      .length,
    top_categories: Array.from(exemptCategories.entries()).map(([code, v]) => ({ code, ...v })),
  };

  // SLA summary
  const casesWithSLA = leakageCases.filter((c) => c.sla);
  const sla_summary = {
    within_sla: casesWithSLA.filter((c) => c.sla && !c.sla.sla_breached).length,
    breached: casesWithSLA.filter((c) => c.sla?.sla_breached).length,
    ageing_buckets: {
      "0-7d": casesWithSLA.filter((c) => c.sla?.ageing_bucket === "0-7d").length,
      "8-14d": casesWithSLA.filter((c) => c.sla?.ageing_bucket === "8-14d").length,
      "15-30d": casesWithSLA.filter((c) => c.sla?.ageing_bucket === "15-30d").length,
      "30d+": casesWithSLA.filter((c) => c.sla?.ageing_bucket === "30d+").length,
    } as Record<import("./types").AgeingBucket, number>,
  };

  return {
    last_refresh: lastRefresh,
    sync_status: "Healthy",
    total_payable,
    total_paid,
    total_gap,
    high_risk_cases,
    avg_challan_delay_days,
    cases_awaiting_review,
    leakage_by_signal,
    top_offices_by_gap,
    newest_high_risk_cases,
    rules_health: {
      enabled: rulesCatalog.filter((rule) => rule.enabled).length,
      last_run: lastRefresh,
      failures: 0,
    },
    office_risk_scores,
    monthly_trends,
    pattern_insights,
    exemption_summary,
    sla_summary,
  };
};

const buildOverviewEnhanced = (): OverviewEnhanced => {
  const base = buildOverview();

  // KPI deltas (mock 30-day comparison)
  const kpi_deltas = {
    total_payable_delta_pct: 8.2,
    total_paid_delta_pct: 5.1,
    total_gap_delta_pct: 14.7,
    high_risk_cases_delta_pct: 22.0,
    avg_challan_delay_delta_pct: -6.3,
    cases_awaiting_review_delta_pct: 10.5,
  };

  // Sparklines (6 data points each, normalised 0-100 for display)
  const kpi_sparklines = {
    total_payable: [62, 68, 65, 74, 78, 82],
    total_paid: [58, 60, 55, 62, 66, 64],
    total_gap: [30, 38, 42, 55, 48, 60],
    high_risk_cases: [3, 4, 5, 4, 7, 8],
    avg_challan_delay: [12, 10, 14, 11, 9, 8],
    cases_awaiting_review: [5, 6, 4, 7, 8, 9],
  };

  // Mini KPIs
  const mini_kpis = {
    prohibited_land_hits: leakageCases.filter((c) => c.leakage_signals.includes("ProhibitedLand"))
      .length,
    gap_above_threshold: leakageCases.filter((c) => c.gap_inr > 50000).length,
    delay_above_threshold: leakageCases.filter((c) => c.leakage_signals.includes("ChallanDelay"))
      .length,
    data_integrity_flags: leakageCases.filter((c) => c.leakage_signals.includes("DataIntegrity"))
      .length,
  };

  // Signal impact aggregation
  const allSignals: LeakageSignal[] = [
    "RevenueGap",
    "ChallanDelay",
    "ExemptionRisk",
    "MarketValueRisk",
    "ProhibitedLand",
    "DataIntegrity",
    "HolidayFee",
  ];
  const signal_impact = allSignals.map((signal) => {
    const matching = leakageCases.filter((c) => c.leakage_signals.includes(signal));
    return {
      signal,
      high: matching.filter((c) => c.risk_level === "High").length,
      medium: matching.filter((c) => c.risk_level === "Medium").length,
      low: matching.filter((c) => c.risk_level === "Low").length,
      total_impact_inr: matching.reduce((s, c) => s + c.impact_amount_inr, 0),
    };
  });

  // Status funnel
  const statusOrder: CaseStatus[] = ["New", "In Review", "Confirmed", "Resolved"];
  const totalCases = leakageCases.length || 1;
  const status_funnel = statusOrder.map((status) => {
    const count = leakageCases.filter((c) => c.case_status === status).length;
    return { status, count, pct: Math.round((count / totalCases) * 100) };
  });

  // Gap trend monthly (extend existing monthly_trends with extra fields)
  const gap_trend_monthly = base.monthly_trends.map((m, i) => ({
    month: m.month,
    total_gap: m.gap_inr,
    total_payable: m.gap_inr * (2.8 + Math.sin(i) * 0.4),
    rolling_avg:
      i >= 2
        ? Math.round(
            (base.monthly_trends[i].gap_inr +
              base.monthly_trends[i - 1].gap_inr +
              base.monthly_trends[i - 2].gap_inr) /
              3
          )
        : m.gap_inr,
  }));

  // Highlights
  const topSignal = signal_impact.reduce((a, b) =>
    a.total_impact_inr > b.total_impact_inr ? a : b
  );
  const topOffice = base.top_offices_by_gap[0];
  const highlights: OverviewEnhanced["highlights"] = [
    {
      icon: "trending-down",
      text: `Total leakage gap is ₹${(base.total_gap / 100000).toFixed(2)}L — ${kpi_deltas.total_gap_delta_pct > 0 ? "up" : "down"} ${Math.abs(kpi_deltas.total_gap_delta_pct)}% vs last 30 days`,
    },
    {
      icon: "bar-chart",
      text: `Top driver: ${topSignal.signal} contributed ₹${(topSignal.total_impact_inr / 100000).toFixed(2)}L across ${topSignal.high + topSignal.medium + topSignal.low} cases`,
    },
    {
      icon: "map-pin",
      text: `SRO with highest gap: ${topOffice?.SR_CODE || "—"} — ${topOffice?.SR_NAME || "—"} (₹${((topOffice?.gap_inr || 0) / 100000).toFixed(2)}L)`,
    },
    {
      icon: "clock",
      text: `Challan delay breaches: ${mini_kpis.delay_above_threshold} cases (Avg delay: ${base.avg_challan_delay_days} days)`,
    },
    {
      icon: "shield",
      text: `Prohibited land matches: ${mini_kpis.prohibited_land_hits} (all High risk)`,
    },
    {
      icon: "alert",
      text: `${mini_kpis.gap_above_threshold} cases with gap above ₹50,000 threshold`,
    },
    {
      icon: "trending-up",
      text: `${base.cases_awaiting_review} cases awaiting review — SLA breach risk for ${base.sla_summary.breached} cases`,
    },
  ];
  // Add holiday fee highlight if any R-COMP-05 cases exist
  const holidayCases = leakageCases.filter((c) =>
    c.evidence.triggered_rules.some((r) => r.rule_id === "R-COMP-05")
  );
  if (holidayCases.length > 0) {
    const holidayImpact = holidayCases.reduce(
      (s, c) =>
        s +
        c.evidence.triggered_rules
          .filter((r) => r.rule_id === "R-COMP-05")
          .reduce((rs, r) => rs + r.impact_inr, 0),
      0
    );
    const holidayOffice = holidayCases[0].office;
    highlights.push({
      icon: "alert",
      text: `Holiday registration fee missing — ${holidayCases.length} case${holidayCases.length > 1 ? "s" : ""} (₹${holidayImpact.toLocaleString("en-IN")}) at ${holidayOffice.SR_CODE} ${holidayOffice.SR_NAME}`,
    });
  }

  // Enhanced top offices
  const officeEnhanced = new Map<
    string,
    {
      SR_CODE: string;
      SR_NAME: string;
      gap_inr: number;
      cases: number;
      highRisk: number;
      delayTotal: number;
      delayCount: number;
      prohibited: number;
    }
  >();
  leakageCases.forEach((c) => {
    const key = c.office.SR_CODE;
    const e = officeEnhanced.get(key) || {
      SR_CODE: c.office.SR_CODE,
      SR_NAME: c.office.SR_NAME,
      gap_inr: 0,
      cases: 0,
      highRisk: 0,
      delayTotal: 0,
      delayCount: 0,
      prohibited: 0,
    };
    e.gap_inr += c.gap_inr;
    e.cases++;
    if (c.risk_level === "High") e.highRisk++;
    if (c.leakage_signals.includes("ProhibitedLand")) e.prohibited++;
    c.evidence.included_receipts.forEach((r) => {
      if (r.BANK_CHALLAN_DT && r.RECEIPT_DATE) {
        const days = Math.max(
          0,
          Math.round(
            (new Date(r.RECEIPT_DATE).getTime() - new Date(r.BANK_CHALLAN_DT).getTime()) / 86400000
          )
        );
        e.delayTotal += days;
        e.delayCount++;
      }
    });
    officeEnhanced.set(key, e);
  });
  const top_offices_enhanced = Array.from(officeEnhanced.values())
    .sort((a, b) => b.gap_inr - a.gap_inr)
    .slice(0, 10)
    .map((o) => ({
      SR_CODE: o.SR_CODE,
      SR_NAME: o.SR_NAME,
      gap_inr: o.gap_inr,
      cases: o.cases,
      high_risk_pct: o.cases > 0 ? Math.round((o.highRisk / o.cases) * 100) : 0,
      avg_delay_days: o.delayCount > 0 ? Math.round(o.delayTotal / o.delayCount) : 0,
      prohibited_hits: o.prohibited,
    }));

  // Top rules triggered
  const ruleAgg = new Map<
    string,
    {
      rule_id: string;
      rule_name: string;
      trigger_count: number;
      total_impact_inr: number;
      confidence_sum: number;
    }
  >();
  leakageCases.forEach((c) => {
    c.evidence.triggered_rules.forEach((r) => {
      const e = ruleAgg.get(r.rule_id) || {
        rule_id: r.rule_id,
        rule_name: r.rule_name,
        trigger_count: 0,
        total_impact_inr: 0,
        confidence_sum: 0,
      };
      e.trigger_count++;
      e.total_impact_inr += r.impact_inr;
      e.confidence_sum += r.confidence;
      ruleAgg.set(r.rule_id, e);
    });
  });
  const top_rules_triggered = Array.from(ruleAgg.values())
    .sort((a, b) => b.trigger_count - a.trigger_count)
    .slice(0, 10)
    .map((r) => ({
      rule_id: r.rule_id,
      rule_name: r.rule_name,
      trigger_count: r.trigger_count,
      total_impact_inr: r.total_impact_inr,
      avg_confidence: r.trigger_count > 0 ? Math.round(r.confidence_sum / r.trigger_count) : 0,
    }));

  // Enhanced newest high risk
  const newest_high_risk_enhanced = leakageCases
    .filter((c) => c.risk_level === "High")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8)
    .map((c) => ({
      case_id: c.case_id,
      document_key: c.document_key,
      risk_score: c.risk_score,
      gap_inr: c.gap_inr,
      created_at: c.created_at,
      signals: c.leakage_signals,
      confidence: c.confidence,
    }));

  return {
    ...base,
    kpi_deltas,
    kpi_sparklines,
    mini_kpis,
    signal_impact,
    status_funnel,
    gap_trend_monthly,
    highlights,
    top_offices_enhanced,
    top_rules_triggered,
    newest_high_risk_enhanced,
    last_detection_run: lastRefresh,
    docs_scanned: leakageCases.length * 12 + 340,
  };
};

// ─── Public API ──────────────────────────────────────────────────────────────

export const revenueLeakageApi = {
  async getOverview(): Promise<RevenueLeakageOverview> {
    return buildOverview();
  },
  async getOverviewEnhanced(): Promise<OverviewEnhanced> {
    return buildOverviewEnhanced();
  },
  async getCases(): Promise<LeakageCase[]> {
    return leakageCases.map((c) => getMergedCase(c));
  },
  async getCase(caseId: string): Promise<LeakageCase | undefined> {
    const found = leakageCases.find((item) => item.case_id === caseId);
    return found ? getMergedCase(found) : undefined;
  },
  async runDetection(): Promise<{ last_refresh: string }> {
    lastRefresh = nowIso();
    return { last_refresh: lastRefresh };
  },
  async createManualCase(documentKey: DocumentKey): Promise<LeakageCase> {
    const newCase: LeakageCase = {
      case_id: `RL-2024-${(leakageCases.length + 1).toString().padStart(4, "0")}`,
      document_key: documentKey,
      created_at: nowIso(),
      updated_at: nowIso(),
      risk_level: "Medium",
      risk_score: 55,
      confidence: 60,
      case_status: "New",
      assigned_to: null,
      leakage_signals: ["RevenueGap"],
      impact_amount_inr: 0,
      payable_total_inr: 0,
      paid_total_inr: 0,
      gap_inr: 0,
      office: {
        SR_CODE: documentKey.SR_CODE,
        SR_NAME: "Sub Registrar Office",
        district: "—",
        zone: "—",
      },
      doc_type: {
        TRAN_MAJ_CODE: "01",
        TRAN_MIN_CODE: "01",
        TRAN_DESC: "Sale Deed",
        AB_DESC: "Conveyance",
      },
      dates: { P_DATE: "2024-12-10", E_DATE: "2024-12-11", R_DATE: "2024-12-12" },
      property_summary: {
        is_urban: true,
        land_nature: "NA",
        urban: { WARD_NO: "—", BLOCK_NO: "—", DOOR_NO: "—", HAB_CODE: "—", LOCAL_BODY: "—" },
        extent: "—",
        unit: "—",
      },
      parties_summary: [],
      payable_breakdown: {
        SD_PAYABLE: 0,
        TD_PAYABLE: 0,
        RF_PAYABLE: 0,
        DSD_PAYABLE: 0,
        OTHER_FEE: 0,
        FINAL_TAXABLE_VALUE: 0,
      },
      evidence: {
        triggered_rules: [],
        included_receipts: [],
        excluded_receipts: [],
        prohibited_matches: [],
        mv_evidence: {
          status: "Placeholder",
          declared_value: 0,
          expected_value: 0,
          deviation_pct: 0,
          unit_rate_current: 0,
          unit_rate_previous: 0,
          note: "Awaiting rate card wiring.",
        },
        exemption_evidence: {
          status: "Placeholder",
          entries: [],
          repeat_usage_flag: false,
          note: "Awaiting exemption wiring.",
        },
      },
      notes: [],
      activity_log: [
        {
          id: `log-${Date.now()}`,
          ts: nowIso(),
          actor: "User",
          action: "Case created",
          detail: "Manual case created",
        },
      ],
    };
    leakageCases = [newCase, ...leakageCases];
    return newCase;
  },
  async updateCase(
    caseId: string,
    updates: Partial<LeakageCase>
  ): Promise<LeakageCase | undefined> {
    const index = leakageCases.findIndex((item) => item.case_id === caseId);
    if (index === -1) return undefined;
    const next = { ...leakageCases[index], ...updates, updated_at: nowIso() };
    leakageCases[index] = next;
    persistCaseOverride(caseId, { ...updates, updated_at: next.updated_at });
    return next;
  },
  async addNote(caseId: string, note: string, author: string): Promise<LeakageCase | undefined> {
    const target = leakageCases.find((item) => item.case_id === caseId);
    if (!target) return undefined;
    const updated = {
      ...target,
      notes: [{ id: `note-${Date.now()}`, author, created_at: nowIso(), note }, ...target.notes],
      activity_log: [
        {
          id: `log-${Date.now()}`,
          ts: nowIso(),
          actor: author,
          action: "Note added",
          detail: note,
        },
        ...target.activity_log,
      ],
      updated_at: nowIso(),
    };
    leakageCases = leakageCases.map((item) => (item.case_id === caseId ? updated : item));
    persistCaseOverride(caseId, {
      notes: updated.notes,
      activity_log: updated.activity_log,
      updated_at: updated.updated_at,
    });
    return updated;
  },
  async getRules(): Promise<RuleCatalogItem[]> {
    return rulesCatalog;
  },
  async addRule(rule: RuleCatalogItem): Promise<RuleCatalogItem> {
    rulesCatalog.push(rule);
    return rule;
  },
  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const target = rulesCatalog.find((r) => r.rule_id === ruleId);
    if (target) target.enabled = enabled;
  },
  async getExports(): Promise<{ templates: ExportTemplate[]; history: ExportRecord[] }> {
    return { templates: exportTemplates, history: exportHistory };
  },
  async createExport(templateId: string, createdBy: string): Promise<ExportRecord> {
    const template = exportTemplates.find((item) => item.id === templateId);
    const record: ExportRecord = {
      export_id: `EXP-2024-${(exportHistory.length + 13).toString().padStart(3, "0")}`,
      created_by: createdBy,
      created_at: nowIso(),
      type: template?.name || "Export",
      filters_used: "Current filters",
      status: "Running",
    };
    exportHistory = [record, ...exportHistory];
    return record;
  },
  // Escalation
  async escalateCase(
    caseId: string,
    escalatedBy: string,
    escalatedTo: string,
    reason: string
  ): Promise<import("./types").EscalationRecord> {
    const target = leakageCases.find((item) => item.case_id === caseId);
    const record: import("./types").EscalationRecord = {
      id: `ESC-${Date.now()}`,
      case_id: caseId,
      escalated_by: escalatedBy,
      escalated_to: escalatedTo,
      reason,
      created_at: nowIso(),
    };
    if (target) {
      target.escalations = [...(target.escalations || []), record];
      target.activity_log = [
        {
          id: `log-${Date.now()}`,
          ts: nowIso(),
          actor: escalatedBy,
          action: "Escalated",
          detail: `Escalated to ${escalatedTo}: ${reason}`,
        },
        ...target.activity_log,
      ];
      target.updated_at = nowIso();
    }
    return record;
  },
  // Audit Pack (mock — queues an export)
  async createAuditPack(caseId: string, createdBy: string): Promise<ExportRecord> {
    const record: ExportRecord = {
      export_id: `AP-${Date.now()}`,
      created_by: createdBy,
      created_at: nowIso(),
      type: "Audit Pack PDF",
      filters_used: `Case=${caseId}`,
      status: "Running",
    };
    exportHistory = [record, ...exportHistory];
    return record;
  },
  // Office Risk Scores
  async getOfficeRiskScores(): Promise<import("./types").OfficeRiskScore[]> {
    const overview = buildOverview();
    return overview.office_risk_scores;
  },
  // MV Trends (pass-through to mvTrendsData)
  async getMvQuarters(): Promise<string[]> {
    return mvTrendsData.quarters;
  },
  async getMvDashboard() {
    return mvTrendsData.dashboard;
  },
  async getMvHotspots() {
    return mvTrendsData.hotspots;
  },
  async getMvHotspotDetail(caseId: string) {
    return getMVHotspotDetail(caseId);
  },
  async getMvSroTiles() {
    return mvTrendsData.sroTiles;
  },
  async getMvSroLocations(sroCode: string) {
    return getMVLocationsForSro(sroCode);
  },
  async getMvOfficePairs() {
    return mvTrendsData.pairs;
  },
  async getMvGrowthAnomalies() {
    return {
      rateCardAnomalies: mvTrendsData.rateCardAnomalies,
      declaredTrends: mvTrendsData.declaredTrends,
      seasonalPatterns: mvTrendsData.seasonalPatterns,
    };
  },
  // ─── Admin ───
  async getAdminData(): Promise<AdminData> {
    return {
      users: [
        {
          id: "U-001",
          name: "DIG",
          role: "Admin",
          email: "dig@igrs.gov.in",
          cases_assigned: 0,
          status: "Active",
          last_active: "2025-01-15T09:30:00Z",
        },
        {
          id: "U-002",
          name: "DR",
          role: "Analyst",
          email: "dr@igrs.gov.in",
          cases_assigned: 12,
          status: "Active",
          last_active: "2025-01-15T08:45:00Z",
        },
        {
          id: "U-003",
          name: "Joint IG 1",
          role: "Analyst",
          email: "jointig1@igrs.gov.in",
          cases_assigned: 9,
          status: "Active",
          last_active: "2025-01-14T17:20:00Z",
        },
        {
          id: "U-004",
          name: "Joint IG 2",
          role: "Analyst",
          email: "jointig2@igrs.gov.in",
          cases_assigned: 7,
          status: "Active",
          last_active: "2025-01-15T10:10:00Z",
        },
        {
          id: "U-005",
          name: "Addl IG",
          role: "Analyst",
          email: "addlig@igrs.gov.in",
          cases_assigned: 0,
          status: "Active",
          last_active: "2025-01-10T14:00:00Z",
        },
        {
          id: "U-006",
          name: "Audit DR",
          role: "Viewer",
          email: "auditdr@igrs.gov.in",
          cases_assigned: 0,
          status: "Active",
          last_active: "2025-01-15T07:30:00Z",
        },
      ],
      auditLog: [
        {
          id: "AL-001",
          timestamp: "2025-01-15T10:05:00Z",
          actor: "System",
          action: "Detection Run Completed",
          detail: "1,247 documents scanned, 18 new cases flagged",
          category: "system",
        },
        {
          id: "AL-002",
          timestamp: "2025-01-15T09:32:00Z",
          actor: "DIG",
          action: "Rule Updated",
          detail: "Enabled rule R-MV-008 (Cross-Office DRR Divergence)",
          category: "rule",
        },
        {
          id: "AL-003",
          timestamp: "2025-01-15T09:30:00Z",
          actor: "DIG",
          action: "User Login",
          detail: "Admin login from 10.0.12.45",
          category: "user",
        },
        {
          id: "AL-004",
          timestamp: "2025-01-15T08:45:00Z",
          actor: "DR",
          action: "User Login",
          detail: "Analyst login from 10.0.12.78",
          category: "user",
        },
        {
          id: "AL-005",
          timestamp: "2025-01-14T17:30:00Z",
          actor: "System",
          action: "Data Sync Completed",
          detail: "IGRS master data synced — 45,230 records updated",
          category: "system",
        },
        {
          id: "AL-006",
          timestamp: "2025-01-14T16:50:00Z",
          actor: "Joint IG 1",
          action: "Case Escalated",
          detail: "Case RL-2024-0003 escalated to District Registrar",
          category: "case",
        },
        {
          id: "AL-007",
          timestamp: "2025-01-14T15:20:00Z",
          actor: "DR",
          action: "Export Generated",
          detail: "High Risk Cases CSV — 24 records exported",
          category: "export",
        },
        {
          id: "AL-008",
          timestamp: "2025-01-14T14:00:00Z",
          actor: "System",
          action: "Detection Run Completed",
          detail: "1,189 documents scanned, 14 new cases flagged",
          category: "system",
        },
        {
          id: "AL-009",
          timestamp: "2025-01-14T11:30:00Z",
          actor: "Joint IG 2",
          action: "Case Status Changed",
          detail: "Case RL-2024-0007 moved to Confirmed",
          category: "case",
        },
        {
          id: "AL-010",
          timestamp: "2025-01-14T10:15:00Z",
          actor: "DIG",
          action: "Threshold Updated",
          detail: "Gap threshold changed from ₹8,000 to ₹10,000",
          category: "rule",
        },
        {
          id: "AL-011",
          timestamp: "2025-01-13T18:00:00Z",
          actor: "System",
          action: "Nightly Batch Started",
          detail: "Scheduled detection run initiated",
          category: "system",
        },
        {
          id: "AL-012",
          timestamp: "2025-01-13T16:45:00Z",
          actor: "DR",
          action: "Case Resolved",
          detail: "Case RL-2024-0012 resolved — false positive",
          category: "case",
        },
        {
          id: "AL-013",
          timestamp: "2025-01-13T14:20:00Z",
          actor: "Audit DR",
          action: "User Login",
          detail: "Viewer login from 10.0.12.90",
          category: "user",
        },
        {
          id: "AL-014",
          timestamp: "2025-01-13T10:00:00Z",
          actor: "DIG",
          action: "Rule Disabled",
          detail: "Disabled rule R-EX-002 (Holiday Fee Check) for review",
          category: "rule",
        },
        {
          id: "AL-015",
          timestamp: "2025-01-12T17:30:00Z",
          actor: "System",
          action: "Data Sync Completed",
          detail: "Rate card data refreshed — 12,400 entries",
          category: "system",
        },
      ],
      dataSources: [
        {
          id: "DS-001",
          name: "IGRS Registration DB",
          type: "PostgreSQL",
          status: "Connected",
          last_sync: "2025-01-15T06:00:00Z",
          records: 2450000,
        },
        {
          id: "DS-002",
          name: "Challan Payment Gateway",
          type: "REST API",
          status: "Connected",
          last_sync: "2025-01-15T06:15:00Z",
          records: 1870000,
        },
        {
          id: "DS-003",
          name: "Market Value Rate Cards",
          type: "CSV Upload",
          status: "Connected",
          last_sync: "2025-01-12T17:30:00Z",
          records: 12400,
        },
        {
          id: "DS-004",
          name: "Prohibited Land Registry",
          type: "REST API",
          status: "Connected",
          last_sync: "2025-01-14T06:00:00Z",
          records: 3200,
        },
        {
          id: "DS-005",
          name: "Exemption Master",
          type: "PostgreSQL",
          status: "Disconnected",
          last_sync: "2025-01-10T06:00:00Z",
          records: 890,
        },
      ],
      systemHealth: {
        status: "Healthy",
        lastRun: "2025-01-15T10:05:00Z",
        lastSync: "2025-01-15T06:15:00Z",
        uptime: "99.8%",
      },
      detectionHistory: [
        {
          id: "DR-001",
          started_at: "2025-01-15T10:00:00Z",
          duration_sec: 312,
          cases_found: 18,
          status: "Completed",
        },
        {
          id: "DR-002",
          started_at: "2025-01-14T14:00:00Z",
          duration_sec: 287,
          cases_found: 14,
          status: "Completed",
        },
        {
          id: "DR-003",
          started_at: "2025-01-13T18:00:00Z",
          duration_sec: 345,
          cases_found: 21,
          status: "Completed",
        },
        {
          id: "DR-004",
          started_at: "2025-01-12T10:00:00Z",
          duration_sec: 298,
          cases_found: 16,
          status: "Completed",
        },
        {
          id: "DR-005",
          started_at: "2025-01-11T18:00:00Z",
          duration_sec: 0,
          cases_found: 0,
          status: "Failed",
        },
      ],
    };
  },
  // ─── Registration Pattern Analysis ───
  async getRegistrationPatterns(
    primaryDimension: PatternDimension,
    secondaryDimension: PatternDimension
  ): Promise<RegistrationPatternSummary> {
    const cases = leakageCases;
    const getValuationSlab = (mv: number): ValuationSlab => {
      if (mv < 1000000) return "Low";
      if (mv < 5000000) return "Medium";
      if (mv < 20000000) return "High";
      return "Premium";
    };
    const getDimensionKey = (c: LeakageCase, dim: PatternDimension): string => {
      switch (dim) {
        case "geography":
          return c.office.district || c.office.SR_CODE;
        case "time":
          return c.dates.R_DATE?.slice(0, 7) || "Unknown";
        case "propertyType":
          return c.property_summary.is_urban ? "Urban" : "Rural";
        case "landNature":
          return c.property_summary.land_nature || "NA";
        case "docType":
          return c.doc_type.TRAN_DESC || "Unknown";
        case "valuationSlab":
          return getValuationSlab(c.payable_breakdown.FINAL_TAXABLE_VALUE);
        default:
          return "Unknown";
      }
    };

    // Build primary dimension buckets
    const bucketMap = new Map<string, RegistrationPatternBucket>();
    cases.forEach((c) => {
      const key = getDimensionKey(c, primaryDimension);
      const existing = bucketMap.get(key);
      const mv = c.payable_breakdown.FINAL_TAXABLE_VALUE;
      if (existing) {
        existing.total_registrations += 1;
        existing.total_mv += mv;
        existing.total_gap += c.gap_inr;
        existing.high_risk_count += c.risk_level === "High" ? 1 : 0;
        existing.medium_risk_count += c.risk_level === "Medium" ? 1 : 0;
        existing.low_risk_count += c.risk_level === "Low" ? 1 : 0;
      } else {
        bucketMap.set(key, {
          key,
          label: key,
          total_registrations: 1,
          total_mv: mv,
          avg_mv: 0,
          total_gap: c.gap_inr,
          high_risk_count: c.risk_level === "High" ? 1 : 0,
          medium_risk_count: c.risk_level === "Medium" ? 1 : 0,
          low_risk_count: c.risk_level === "Low" ? 1 : 0,
        });
      }
    });
    const buckets = Array.from(bucketMap.values())
      .map((b) => ({
        ...b,
        avg_mv: b.total_registrations > 0 ? Math.round(b.total_mv / b.total_registrations) : 0,
      }))
      .sort((a, b) => b.total_registrations - a.total_registrations);

    // Build cross-dimension matrix
    const rowKeys = new Set<string>();
    const colKeys = new Set<string>();
    const cells: Record<string, Record<string, number>> = {};
    cases.forEach((c) => {
      const rk = getDimensionKey(c, primaryDimension);
      const ck = getDimensionKey(c, secondaryDimension);
      rowKeys.add(rk);
      colKeys.add(ck);
      if (!cells[rk]) cells[rk] = {};
      cells[rk][ck] = (cells[rk][ck] || 0) + 1;
    });

    const totalMv = cases.reduce((s, c) => s + c.payable_breakdown.FINAL_TAXABLE_VALUE, 0);
    const totalGap = cases.reduce((s, c) => s + c.gap_inr, 0);
    const highRisk = cases.filter((c) => c.risk_level === "High").length;

    return {
      total_registrations: cases.length,
      total_mv: totalMv,
      avg_mv: cases.length > 0 ? Math.round(totalMv / cases.length) : 0,
      total_gap: totalGap,
      high_risk_pct: cases.length > 0 ? Math.round((highRisk / cases.length) * 100) : 0,
      buckets,
      matrix: {
        row_dimension: primaryDimension,
        col_dimension: secondaryDimension,
        row_keys: Array.from(rowKeys),
        col_keys: Array.from(colKeys),
        cells,
      },
    };
  },
  // ─── Manual Case Creation ───
  async evaluateManualCase(input: ManualCaseInput): Promise<RuleEvaluationResult> {
    return evaluateRules(input);
  },
  async createManualCaseFromInput(input: ManualCaseInput): Promise<LeakageCase> {
    const result = evaluateRules(input);
    const includedReceipts = input.receipts.filter((r) => r.acc_canc === "A");
    const excludedReceipts = input.receipts.filter((r) => r.acc_canc !== "A");
    const paidTotal = includedReceipts.reduce((s, r) => s + r.amount, 0);

    const toReceiptEvidence = (
      r: (typeof input.receipts)[0]
    ): import("./types").ReceiptEvidence => ({
      C_RECEIPT_NO: r.receipt_no || `RCP-${Date.now()}`,
      RECEIPT_DATE: r.receipt_date,
      BANK_CHALLAN_NO: r.challan_no || null,
      BANK_CHALLAN_DT: r.challan_date || null,
      BANK_NAME: null,
      BANK_BRANCH: null,
      ECHALLAN_NO: null,
      ENTRY_DATE: null,
      ACC_CANC: r.acc_canc,
      exclude_reason: r.acc_canc !== "A" ? `ACC_CANC=${r.acc_canc}` : undefined,
      cash_paid:
        r.account_codes.length > 0
          ? r.account_codes.map((code) => ({
              ACCOUNT_CODE: code,
              AMOUNT: r.amount / r.account_codes.length,
            }))
          : [{ ACCOUNT_CODE: "0000", AMOUNT: r.amount }],
    });

    const mvStatus =
      input.declared_value > 0 || input.expected_value > 0
        ? ("Available" as const)
        : ("Placeholder" as const);
    const devPct =
      input.expected_value > 0
        ? ((input.declared_value - input.expected_value) / input.expected_value) * 100
        : 0;

    const exStatus =
      input.exemptions.length > 0 ? ("Available" as const) : ("NotApplicable" as const);
    const repeatFlag = input.exemptions.some((e) => e.repeat_usage_count > 2);

    const newCase: LeakageCase = {
      case_id: `RL-2024-${(leakageCases.length + 1).toString().padStart(4, "0")}`,
      document_key: {
        SR_CODE: input.SR_CODE,
        BOOK_NO: input.BOOK_NO,
        DOCT_NO: input.DOCT_NO,
        REG_YEAR: input.REG_YEAR,
      },
      created_at: nowIso(),
      updated_at: nowIso(),
      risk_level: result.risk_level,
      risk_score: result.risk_score,
      confidence: result.confidence,
      case_status: "New",
      assigned_to: null,
      leakage_signals: result.leakage_signals,
      impact_amount_inr: result.impact_amount_inr,
      payable_total_inr: result.payable_total_inr,
      paid_total_inr: paidTotal,
      gap_inr: result.gap_inr,
      office: {
        SR_CODE: input.SR_CODE,
        SR_NAME: input.SR_NAME || "Sub Registrar Office",
        district: input.district || "—",
        zone: input.zone || "—",
      },
      doc_type: {
        TRAN_MAJ_CODE: input.TRAN_MAJ_CODE || "01",
        TRAN_MIN_CODE: input.TRAN_MIN_CODE || "01",
        TRAN_DESC: input.doc_type || "Sale Deed",
        AB_DESC: input.doc_type || "Conveyance",
      },
      dates: {
        P_DATE: input.P_DATE || nowIso().slice(0, 10),
        E_DATE: input.E_DATE || nowIso().slice(0, 10),
        R_DATE: input.R_DATE || nowIso().slice(0, 10),
      },
      property_summary: {
        is_urban: input.is_urban,
        land_nature: input.land_nature || "NA",
        ...(input.is_urban
          ? {
              urban: {
                WARD_NO: input.WARD_NO || "—",
                BLOCK_NO: input.BLOCK_NO || "—",
                DOOR_NO: input.DOOR_NO || "—",
                HAB_CODE: "—",
                LOCAL_BODY: input.LOCAL_BODY || "—",
              },
            }
          : {
              rural: {
                VILLAGE_CODE: input.VILLAGE_CODE || "—",
                HAB_CODE: "—",
                SURVEY_NO: input.SURVEY_NO || "—",
                PLOT_NO: input.PLOT_NO || "—",
              },
            }),
        extent: input.extent || "—",
        unit: input.unit || "—",
      },
      parties_summary: input.parties.map((p) => ({
        CODE: p.CODE,
        NAME: p.NAME,
        PAN_NO: p.PAN_NO || null,
      })),
      payable_breakdown: {
        SD_PAYABLE: input.SD_PAYABLE,
        TD_PAYABLE: input.TD_PAYABLE,
        RF_PAYABLE: input.RF_PAYABLE,
        DSD_PAYABLE: input.DSD_PAYABLE,
        OTHER_FEE: input.OTHER_FEE,
        FINAL_TAXABLE_VALUE: input.FINAL_TAXABLE_VALUE,
      },
      evidence: {
        triggered_rules: result.triggered_rules,
        included_receipts: includedReceipts.map(toReceiptEvidence),
        excluded_receipts: excludedReceipts.map(toReceiptEvidence),
        prohibited_matches: input.prohibited_land_match
          ? [
              {
                PROHIB_CD: "MANUAL-001",
                NOTI_GAZ_NO: null,
                NOTI_GAZ_DT: null,
                DENOTI_GAZ_NO: null,
                DENOTI_GAZ_DT: null,
                H_NAME: null,
                ENTRY_DATE: null,
                match_level: input.is_urban ? ("Urban" as const) : ("Rural" as const),
                match_fields: input.is_urban
                  ? ["WARD_NO", "BLOCK_NO"]
                  : ["VILLAGE_CODE", "SURVEY_NO"],
              },
            ]
          : [],
        mv_evidence: {
          status: mvStatus,
          declared_value: input.declared_value,
          expected_value: input.expected_value,
          deviation_pct: Math.round(devPct * 10) / 10,
          unit_rate_current: input.unit_rate_current,
          unit_rate_previous: input.unit_rate_previous,
          note:
            mvStatus === "Placeholder"
              ? "Manual case — no rate card data provided."
              : "Values from manual entry.",
        },
        exemption_evidence: {
          status: exStatus,
          entries: input.exemptions.map((e) => ({
            exemption_code: e.code,
            exemption_amount: e.amount,
            exemption_reason: e.reason,
            eligibility_result: e.doc_type_eligible ? ("Pass" as const) : ("Fail" as const),
            doc_type_eligible: e.doc_type_eligible,
            cap_exceeded: e.cap_amount > 0 && e.amount > e.cap_amount,
          })),
          repeat_usage_flag: repeatFlag,
          repeat_party_pan: repeatFlag ? input.parties[0]?.PAN_NO || null : null,
          note:
            exStatus === "NotApplicable" ? "No exemptions claimed." : "Values from manual entry.",
        },
      },
      notes: [],
      activity_log: [
        {
          id: `log-${Date.now()}`,
          ts: nowIso(),
          actor: "User",
          action: "Manual case created",
          detail: `Created with ${result.triggered_rules.length} rules triggered, risk=${result.risk_level}`,
        },
      ],
    };
    leakageCases = [newCase, ...leakageCases];
    return newCase;
  },
  // ─── localStorage persistence ───
  async resetCase(caseId: string): Promise<LeakageCase | undefined> {
    resetCaseOverride(caseId);
    const original = (casesData as unknown as LeakageCase[]).find((c) => c.case_id === caseId);
    if (!original) return undefined;
    const idx = leakageCases.findIndex((c) => c.case_id === caseId);
    if (idx !== -1) leakageCases[idx] = { ...original };
    return original;
  },
  caseHasOverrides(caseId: string): boolean {
    return caseHasLocalOverrides(caseId);
  },
};
