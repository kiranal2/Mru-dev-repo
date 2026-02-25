/**
 * IGRS (Indian Government Registration System) Revenue Assurance Types
 *
 * Simplified and reorganised type definitions for the IGRS data layer.
 * Based on the original revenue-leakage types but uses camelCase field
 * names, flattened structures, and cleaner generics suitable for the
 * new provider/hook architecture.
 */

// ---------------------------------------------------------------------------
// Enumerations & Literal Types
// ---------------------------------------------------------------------------

/** Risk severity classification for an IGRS case. */
export type IGRSRiskLevel = "High" | "Medium" | "Low";

/** Lifecycle status of a revenue-leakage case. */
export type IGRSCaseStatus =
  | "New"
  | "In Review"
  | "Confirmed"
  | "Resolved"
  | "Rejected";

/**
 * Discrete signal categories that indicate potential revenue leakage.
 *
 * - `RevenueGap`          -- Mismatch between payable and paid amounts.
 * - `ChallanDelay`        -- Abnormal delay between receipt and challan dates.
 * - `ExemptionRisk`       -- Suspicious or ineligible exemption claims.
 * - `MarketValueRisk`     -- Declared value deviates from market rate card.
 * - `ProhibitedLand`      -- Property falls in a prohibited-transaction zone.
 * - `DataIntegrity`       -- Missing or inconsistent data fields.
 * - `CashReconciliation`  -- Cash collection vs treasury reconciliation mismatch.
 * - `StampInventory`      -- Physical stamp paper inventory discrepancy.
 */
export type IGRSLeakageSignal =
  | "RevenueGap"
  | "ChallanDelay"
  | "ExemptionRisk"
  | "MarketValueRisk"
  | "ProhibitedLand"
  | "DataIntegrity"
  | "CashReconciliation"
  | "StampInventory"
  | "ClassificationFraud";

/** Rule categories that group detection logic into functional domains. */
export type IGRSRuleCategory =
  | "Valuation"
  | "StampDuty"
  | "Exemption"
  | "Compliance"
  | "Operational"
  | "Systemic"
  | "StampIntelligence"
  | "Classification";

/** Market-value hotspot severity classification. */
export type MVSeverity = "Critical" | "High" | "Medium" | "Watch" | "Normal";

/** Location classification for property registrations. */
export type MVLocationType = "RURAL" | "URBAN";

/** Status of a market-value hotspot. */
export type MVHotspotStatus = "New" | "In Review" | "Confirmed";

/** Types of statistical patterns detected through trend analysis. */
export type IGRSPatternType = "spike" | "drop" | "drift" | "seasonal";

/** Sync health indicator for the data pipeline. */
export type IGRSSyncStatus = "Healthy" | "Degraded" | "Down";

/** Export job lifecycle status. */
export type IGRSExportStatus = "Queued" | "Ready" | "Running" | "Failed";

/** Signal triage status. */
export type IGRSSignalStatus = "Open" | "Acknowledged" | "Resolved" | "Dismissed";

// ---------------------------------------------------------------------------
// Document & Office Sub-structures
// ---------------------------------------------------------------------------

/** Composite key that uniquely identifies a registered document. */
export interface IGRSDocumentKey {
  /** Sub-Registrar office code. */
  srCode: string;
  /** Book number. */
  bookNo: string;
  /** Document number. */
  doctNo: string;
  /** Registration year (e.g. "2024"). */
  regYear: string;
}

/** Sub-Registrar office reference attached to a case. */
export interface IGRSOfficeRef {
  /** Sub-Registrar office code. */
  srCode: string;
  /** Sub-Registrar office name. */
  srName: string;
  /** District the office belongs to. */
  district: string;
  /** Administrative zone. */
  zone: string;
}

/** Document type classification for the registered instrument. */
export interface IGRSDocType {
  /** Major transaction code. */
  tranMajCode: string;
  /** Minor transaction code. */
  tranMinCode: string;
  /** Full transaction description. */
  tranDesc: string;
  /** Abbreviated description. */
  abDesc: string;
}

/** Key dates associated with a registration document. */
export interface IGRSDates {
  /** Presentation date. */
  pDate: string;
  /** Execution date. */
  eDate: string;
  /** Registration date. */
  rDate: string;
}

/** Summarised property information. */
export interface IGRSPropertySummary {
  /** Whether the property is classified as urban. */
  isUrban: boolean;
  /** Nature of land (Dry, Wet, Converted, etc.). Only relevant for rural. */
  landNature?: string;
  /** Extent / area of the property. */
  extent: string;
  /** Unit of measurement for the extent (e.g. "acres", "sq.ft"). */
  unit: string;
}

/** Condensed party (buyer/seller) information. */
export interface IGRSPartySummary {
  /** Party role code. */
  code: string;
  /** Full name of the party. */
  name: string;
  /** PAN number, if available. */
  panNo?: string | null;
}

// ---------------------------------------------------------------------------
// Financial Breakdown
// ---------------------------------------------------------------------------

/** Itemised breakdown of payable government fees. */
export interface IGRSPayableBreakdown {
  /** Stamp duty payable. */
  sdPayable: number;
  /** Transfer duty payable. */
  tdPayable: number;
  /** Registration fee payable. */
  rfPayable: number;
  /** Deficit stamp duty payable. */
  dsdPayable: number;
  /** Other miscellaneous fees. */
  otherFee: number;
  /** Final taxable value used to compute duties. */
  finalTaxableValue: number;
}

// ---------------------------------------------------------------------------
// Evidence & Rules
// ---------------------------------------------------------------------------

/** A single detection rule hit attached to a case. */
export interface IGRSTriggeredRule {
  /** Unique rule identifier (e.g. "R-001"). */
  ruleId: string;
  /** Human-readable rule name. */
  ruleName: string;
  /** Functional category the rule belongs to. */
  category: string;
  /** Severity of the rule match. */
  severity: string;
  /** Monetary impact in INR attributed to this rule. */
  impactInr: number;
  /** Plain-language explanation of why the rule fired. */
  explanation: string;
  /** Confidence score between 0 and 1. */
  confidence: number;
}

/** Aggregated evidence block for an IGRS case. */
export interface IGRSCaseEvidence {
  /** Detection rules that were triggered. */
  triggeredRules: IGRSTriggeredRule[];
  /** Number of receipt records considered. */
  receiptCount: number;
  /** Number of prohibited-land matches found. */
  prohibitedMatchCount: number;
  /** Percentage deviation from market value rate card. */
  mvDeviationPct: number;
  /** Number of exemption entries on the document. */
  exemptionCount: number;
}

// ---------------------------------------------------------------------------
// SLA & Workflow
// ---------------------------------------------------------------------------

/** Service-level agreement tracking for a case. */
export interface IGRSCaseSLA {
  /** Number of days since case creation. */
  ageingDays: number;
  /** Human-friendly ageing bucket (e.g. "0-7d", "8-14d", "15-30d", "30d+"). */
  ageingBucket: string;
  /** Whether the case has breached its SLA target. */
  slaBreached: boolean;
}

/** A free-text note attached to a case by an analyst. */
export interface IGRSCaseNote {
  /** Unique note identifier. */
  id: string;
  /** Author (user name or system). */
  author: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** Note body. */
  note: string;
}

/** A single entry in a case's activity / audit log. */
export interface IGRSActivityLogEntry {
  /** Unique log entry identifier. */
  id: string;
  /** ISO-8601 timestamp. */
  ts: string;
  /** Actor who performed the action. */
  actor: string;
  /** Short action label (e.g. "StatusChange", "NoteAdded"). */
  action: string;
  /** Human-readable detail string. */
  detail: string;
}

// ---------------------------------------------------------------------------
// IGRSCase -- the central case entity
// ---------------------------------------------------------------------------

/**
 * Primary case record for IGRS revenue assurance.
 *
 * Each case represents a single registered document that has been flagged
 * by the detection engine for one or more revenue-leakage signals.
 */
export interface IGRSCase {
  /** Internal surrogate identifier. */
  id: string;
  /** Human-readable case identifier (e.g. "IGRS-2024-00123"). */
  caseId: string;
  /** Composite document key that ties back to the IGRS registry. */
  documentKey: IGRSDocumentKey;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string;

  // --- Risk Assessment ---
  /** Overall risk classification. */
  riskLevel: IGRSRiskLevel;
  /** Numeric risk score (0-100). */
  riskScore: number;
  /** Model confidence (0-1). */
  confidence: number;

  // --- Workflow ---
  /** Current lifecycle status. */
  status: IGRSCaseStatus;
  /** Username of the assigned analyst, or null if unassigned. */
  assignedTo: string | null;

  // --- Signals & Financials ---
  /** Set of leakage signal types detected. */
  leakageSignals: IGRSLeakageSignal[];
  /** Estimated monetary impact in INR. */
  impactAmountInr: number;
  /** Total government fee payable in INR. */
  payableTotalInr: number;
  /** Total amount actually paid in INR. */
  paidTotalInr: number;
  /** Gap between payable and paid (payable - paid) in INR. */
  gapInr: number;

  // --- Reference Data ---
  /** Originating Sub-Registrar office. */
  office: IGRSOfficeRef;
  /** Document type classification. */
  docType: IGRSDocType;
  /** Key registration dates. */
  dates: IGRSDates;
  /** Summarised property details. */
  propertySummary: IGRSPropertySummary;
  /** Condensed list of parties involved. */
  partiesSummary: IGRSPartySummary[];
  /** Itemised payable breakdown. */
  payableBreakdown: IGRSPayableBreakdown;

  // --- Evidence ---
  /** Aggregated evidence supporting the risk assessment. */
  evidence: IGRSCaseEvidence;
  /** Extended Cash Reconciliation evidence (present only for CashReconciliation signal cases). */
  cashReconciliationEvidence?: CashReconciliationEvidenceExtended;
  /** Extended Stamp Inventory evidence (present only for StampInventory signal cases). */
  stampInventoryEvidence?: StampInventoryEvidenceExtended;
  /** Extended Classification Fraud evidence (present only for ClassificationFraud signal cases). */
  classificationFraudEvidence?: ClassificationFraudEvidenceExtended;

  // --- SLA & Workflow Metadata ---
  /** SLA tracking (optional -- may be absent for newly ingested cases). */
  sla?: IGRSCaseSLA;
  /** Analyst notes attached to the case. */
  notes: IGRSCaseNote[];
  /** Chronological activity log. */
  activityLog: IGRSActivityLogEntry[];
}

// ---------------------------------------------------------------------------
// IGRSRule -- detection rule catalogue entry
// ---------------------------------------------------------------------------

/**
 * A detection rule in the IGRS revenue-assurance rule catalogue.
 *
 * Rules encapsulate the logic used to flag potential leakage on a
 * document. They are version-controlled and can be toggled on/off.
 */
export interface IGRSRule {
  /** Unique rule identifier (e.g. "R-001"). */
  ruleId: string;
  /** Functional category. */
  category: IGRSRuleCategory;
  /** Human-readable rule name. */
  ruleName: string;
  /** Longer description of what the rule detects. */
  description: string;
  /** Default severity when the rule fires. */
  severity: IGRSRiskLevel;
  /** List of input field / data-source names the rule consumes. */
  inputs: string[];
  /** Description of the rule's output / signal. */
  output: string;
  /** Whether the rule is currently enabled for detection runs. */
  enabled: boolean;
  /** Implementation phase (e.g. "Phase 1", "Phase 2 Enhanced"). */
  phase: string;
  /** Plain-language description of the rule's evaluation logic. */
  logic: string;
  /** Fields that must be present for the rule to execute. */
  requiredFields: string[];
  /** Known conditions that can produce false positives. */
  falsePositiveNotes: string[];
  /** Illustrative example of the rule firing. */
  example: string;
}

// ---------------------------------------------------------------------------
// SROOffice -- Sub-Registrar Office risk profile
// ---------------------------------------------------------------------------

/**
 * Risk profile for a Sub-Registrar Office (SRO).
 *
 * Aggregates case-level signals into an office-level risk score used
 * for heatmaps and comparative dashboards.
 */
export interface SROOffice {
  /** Sub-Registrar office code. */
  srCode: string;
  /** Sub-Registrar office name. */
  srName: string;
  /** District. */
  district: string;
  /** Administrative zone. */
  zone: string;
  /** Latitude for map rendering. */
  lat: number;
  /** Longitude for map rendering. */
  lng: number;
  /** Composite risk score (0-100). */
  riskScore: number;
  /** Derived risk level. */
  riskLevel: IGRSRiskLevel;
  /** Total number of cases originating from this office. */
  totalCases: number;
  /** Number of high-risk cases. */
  highRiskCases: number;
  /** Total revenue gap in INR across all cases. */
  totalGapInr: number;
  /** Cash collection risk score (0-100) for this office. */
  cashRiskScore?: number;
  /** Gap between physical stamp inventory and sold amount in INR. */
  stampInventoryGap?: number;
  /** Officer accountability composite score (0-100). */
  officerAccountabilityScore?: number;
  /** Breakdown of the composite risk score by component. */
  componentScores: {
    /** Revenue-gap component score. */
    revenueGap: number;
    /** Challan-delay component score. */
    challanDelay: number;
    /** Prohibited-land match component score. */
    prohibitedMatch: number;
    /** Market-value deviation component score. */
    mvDeviation: number;
    /** Exemption-anomaly component score. */
    exemptionAnomaly: number;
  };
}

// ---------------------------------------------------------------------------
// Dashboard KPIs
// ---------------------------------------------------------------------------

/**
 * Top-level dashboard KPI payload.
 *
 * Returned by the overview API and consumed by the main dashboard view
 * to render summary cards, charts, and alert banners.
 */
export interface IGRSDashboardKPIs {
  // --- Headline Financials ---
  /** Total government fee payable across all cases in INR. */
  totalPayable: number;
  /** Total amount actually paid across all cases in INR. */
  totalPaid: number;
  /** Aggregate gap (payable - paid) in INR. */
  totalGap: number;

  // --- Case Counts ---
  /** Number of high-risk cases. */
  highRiskCases: number;
  /** Average challan delay in days. */
  avgChallanDelayDays: number;
  /** Cases currently in "New" or "In Review" status. */
  casesAwaitingReview: number;

  // --- Breakdowns ---
  /** Leakage case counts broken down by signal type. */
  leakageBySignal: Array<{
    signal: IGRSLeakageSignal;
    high: number;
    medium: number;
    low: number;
  }>;

  /** Top offices ranked by total gap amount. */
  topOfficesByGap: Array<{
    srCode: string;
    srName: string;
    gapInr: number;
    cases: number;
  }>;

  // --- SLA ---
  /** SLA compliance summary. */
  slaSummary: {
    /** Cases within SLA. */
    withinSla: number;
    /** Cases that have breached SLA. */
    breached: number;
    /** Distribution across ageing buckets. */
    ageingBuckets: Record<string, number>;
  };

  // --- Exemptions ---
  /** Exemption usage summary. */
  exemptionSummary: {
    /** Total exemption claims. */
    totalExemptions: number;
    /** Total exempted amount in INR. */
    totalAmount: number;
    /** Claims that failed eligibility checks. */
    failedEligibility: number;
    /** Parties with repeat exemption usage. */
    repeatOffenders: number;
    /** Detailed repeat exemption party records. */
    repeatExemptionParties?: RepeatExemptionParty[];
  };

  // --- Rules Engine ---
  /** Health snapshot of the detection rules engine. */
  rulesHealth: {
    /** Number of enabled rules. */
    enabled: number;
    /** ISO-8601 timestamp of the last detection run. */
    lastRun: string;
    /** Number of rule execution failures in the last run. */
    failures: number;
  };

  // --- Trends & Insights ---
  /** Monthly trend data for time-series charts. */
  monthlyTrends: IGRSTrend[];

  /** Auto-generated narrative highlights for the dashboard. */
  highlights: Array<{
    /** Icon hint for the UI (e.g. "trending-up", "alert"). */
    icon: string;
    /** Plain-text highlight sentence. */
    text: string;
  }>;

  // --- New KPIs (Phase 1) ---
  /** Estimated revenue leakage from market-value deviations in INR. */
  estimatedMVLeakage?: number;
  /** Composite daily cash risk score across all offices (0-100). */
  dailyCashRiskScore?: number;
  /** Count of exemption abuse flags currently active. */
  exemptionAbuseFlags?: number;
  /** Count of cash reconciliation alerts pending resolution. */
  cashReconAlerts?: number;

  // --- Exemption Abuse Index ---
  /** Office-wise exemption abuse index for detecting exemption misuse patterns. */
  exemptionAbuseByOffice?: Array<{
    srCode: string;
    srName: string;
    district: string;
    totalExemptions: number;
    flaggedExemptions: number;
    abuseRate: number;
    abuseScore: number;
    repeatPartyCount: number;
    estimatedLeakage: number;
    topCategory: string;
  }>;

  // --- Meta ---
  /** ISO-8601 timestamp of the last data refresh. */
  lastRefresh: string;
  /** Current health of the upstream data sync pipeline. */
  syncStatus: IGRSSyncStatus;
}

// ---------------------------------------------------------------------------
// Trend & Pattern Analysis
// ---------------------------------------------------------------------------

/** A single month's aggregated trend data point. */
export interface IGRSTrend {
  /** Month label (e.g. "2024-06"). */
  month: string;
  /** Total cases in the month. */
  cases: number;
  /** Total gap amount in INR for the month. */
  gapInr: number;
  /** Number of high-risk cases in the month. */
  highRisk: number;
}

/**
 * A statistical pattern detected across IGRS data.
 *
 * Patterns are surfaced by the analytics engine to draw attention to
 * unusual shifts in registration volumes, gap amounts, or risk profiles.
 */
export interface IGRSPattern {
  /** Unique pattern identifier. */
  id: string;
  /** Category of the detected pattern. */
  type: IGRSPatternType;
  /** The metric exhibiting the pattern (e.g. "gapInr", "highRiskCases"). */
  metric: string;
  /** Office code the pattern relates to, if office-specific. */
  office?: string;
  /** Time period over which the pattern was observed (e.g. "2024-Q2"). */
  period: string;
  /** Human-readable magnitude description (e.g. "+34%", "-12 cases"). */
  magnitude: string;
  /** Plain-language explanation of the pattern and its potential impact. */
  explanation: string;
}

// ---------------------------------------------------------------------------
// Market Value Hotspot
// ---------------------------------------------------------------------------

/**
 * A market-value hotspot flagging locations where declared values
 * consistently deviate from the government rate card.
 */
export interface MVHotspot {
  /** Associated case identifier. */
  caseId: string;
  /** Sub-Registrar office code. */
  sroCode: string;
  /** Sub-Registrar office name. */
  sroName: string;
  /** District name. */
  district: string;
  /** Human-readable location label (village / ward name). */
  locationLabel: string;
  /** Whether the location is rural or urban. */
  locationType: MVLocationType;
  /** Declared-to-Rate-card Ratio (lower = more suspect). */
  drr: number;
  /** Government rate-card unit rate in INR. */
  rateCardUnitRate: number;
  /** Median declared value per unit across recent transactions. */
  medianDeclared: number;
  /** Number of transactions in the hotspot window. */
  transactionCount: number;
  /** Severity classification of the hotspot. */
  severity: MVSeverity;
  /** Estimated revenue loss in INR. */
  estimatedLoss: number;
  /** Current triage status. */
  status: MVHotspotStatus;
}

// ---------------------------------------------------------------------------
// Settings / Configuration
// ---------------------------------------------------------------------------

/**
 * IGRS system configuration parameters.
 *
 * Encapsulates stamp-duty rates, registration-fee slabs, and detection
 * thresholds that govern the revenue-assurance engine's behaviour.
 */
export interface IGRSSettings {
  /** Stamp duty rate schedule keyed by document type or slab. */
  stampDutyRates: Record<string, number>;
  /** Registration fee slab definitions. */
  registrationFeeSlabs: Array<{
    /** Lower bound of the slab in INR (inclusive). */
    minValue: number;
    /** Upper bound of the slab in INR (exclusive). Use Infinity for open-ended. */
    maxValue: number;
    /** Fee percentage applicable within this slab. */
    feePct: number;
    /** Fixed fee component in INR, if any. */
    fixedFee: number;
  }>;
  /** Detection engine thresholds. */
  thresholds: {
    /** Minimum gap in INR to flag a case. */
    minGapInr: number;
    /** Minimum risk score (0-100) to classify as high risk. */
    highRiskScoreMin: number;
    /** Maximum acceptable challan delay in days. */
    maxChallanDelayDays: number;
    /** MV deviation percentage above which to raise MarketValueRisk. */
    mvDeviationPct: number;
    /** SLA target in days for case resolution. */
    slaTargetDays: number;
  };
}

// ---------------------------------------------------------------------------
// Export Records
// ---------------------------------------------------------------------------

/**
 * Tracks an export job initiated by a user (e.g. CSV / PDF download
 * of filtered case data).
 */
export interface IGRSExport {
  /** Unique export job identifier. */
  exportId: string;
  /** Username of the user who requested the export. */
  createdBy: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** Export type descriptor (e.g. "CaseList-CSV", "Dashboard-PDF"). */
  type: string;
  /** Serialised filter criteria that were active when the export was requested. */
  filtersUsed: string;
  /** Current status of the export job. */
  status: IGRSExportStatus;
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

/**
 * An individual detection signal raised against a case.
 *
 * While `IGRSCase.leakageSignals` carries a summarised list of signal
 * types, this interface represents the full signal record with metadata
 * for audit and triage workflows.
 */
export interface IGRSSignal {
  /** Unique signal identifier. */
  id: string;
  /** Case the signal belongs to. */
  caseId: string;
  /** Rule that produced this signal. */
  ruleId: string;
  /** High-level signal type. */
  signalType: IGRSLeakageSignal;
  /** Severity of the signal. */
  severity: IGRSRiskLevel;
  /** Monetary impact attributed to this signal in INR. */
  impactInr: number;
  /** Plain-language explanation. */
  explanation: string;
  /** ISO-8601 timestamp when the signal was first raised. */
  createdAt: string;
  /** Triage status of the signal. */
  status: IGRSSignalStatus;
}

// ---------------------------------------------------------------------------
// Cash Reconciliation
// ---------------------------------------------------------------------------

/**
 * A cash reconciliation record comparing SRO daily collections against
 * treasury deposit records.
 */
export interface CashReconciliationRecord {
  /** Unique record identifier. */
  id: string;
  /** Sub-Registrar office code. */
  srCode: string;
  /** Date of collection (ISO-8601). */
  collectionDate: string;
  /** Total amount collected at the SRO counter in INR. */
  collectedAmountInr: number;
  /** Amount deposited to treasury in INR. */
  depositedAmountInr: number;
  /** Difference between collected and deposited in INR. */
  discrepancyInr: number;
  /** Number of individual transactions in the collection batch. */
  transactionCount: number;
  /** Reconciliation status. */
  status: "Matched" | "Discrepant" | "Pending" | "Escalated";
  /** Plain-language explanation of the discrepancy, if any. */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Stamp Inventory
// ---------------------------------------------------------------------------

/**
 * A stamp paper inventory record tracking physical stock versus
 * sold/issued stamps at an SRO.
 */
export interface StampInventoryRecord {
  /** Unique record identifier. */
  id: string;
  /** Sub-Registrar office code. */
  srCode: string;
  /** Stamp denomination in INR. */
  denomination: number;
  /** Date of inventory snapshot (ISO-8601). */
  snapshotDate: string;
  /** Opening stock count. */
  openingStock: number;
  /** Stamps received from treasury during the period. */
  received: number;
  /** Stamps sold/issued during the period. */
  sold: number;
  /** Physical closing stock count. */
  closingStock: number;
  /** Expected closing stock (opening + received - sold). */
  expectedClosingStock: number;
  /** Variance between expected and actual closing stock. */
  variance: number;
  /** Inventory status. */
  status: "Balanced" | "Shortage" | "Surplus" | "Under Investigation";
}

// ---------------------------------------------------------------------------
// Signal Display Configuration
// ---------------------------------------------------------------------------

/** Display configuration for a signal type — used for consistent colours & labels. */
export interface SignalDisplayConfig {
  /** The signal type this config applies to. */
  signal: IGRSLeakageSignal;
  /** Human-readable label. */
  label: string;
  /** Tailwind text colour class (e.g. "text-red-600"). */
  color: string;
  /** Tailwind background colour class (e.g. "bg-red-50"). */
  bgColor: string;
  /** Short description for tooltips. */
  description: string;
}

/** Signal type → display config lookup. */
export const IGRS_SIGNAL_CONFIG: Record<IGRSLeakageSignal, SignalDisplayConfig> = {
  RevenueGap: {
    signal: "RevenueGap",
    label: "Revenue Gap",
    color: "text-red-700",
    bgColor: "bg-red-50",
    description: "Mismatch between payable and paid amounts",
  },
  ChallanDelay: {
    signal: "ChallanDelay",
    label: "Challan Delay",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    description: "Abnormal delay between receipt and challan dates",
  },
  ExemptionRisk: {
    signal: "ExemptionRisk",
    label: "Exemption Risk",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    description: "Suspicious or ineligible exemption claims",
  },
  MarketValueRisk: {
    signal: "MarketValueRisk",
    label: "Market Value Risk",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    description: "Declared value deviates from market rate card",
  },
  ProhibitedLand: {
    signal: "ProhibitedLand",
    label: "Prohibited Land",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    description: "Property in a prohibited-transaction zone",
  },
  DataIntegrity: {
    signal: "DataIntegrity",
    label: "Data Integrity",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    description: "Missing or inconsistent data fields",
  },
  CashReconciliation: {
    signal: "CashReconciliation",
    label: "Cash Reconciliation",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    description: "Cash collection vs treasury deposit mismatch",
  },
  StampInventory: {
    signal: "StampInventory",
    label: "Stamp Inventory",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    description: "Physical stamp paper inventory discrepancy",
  },
  ClassificationFraud: {
    signal: "ClassificationFraud",
    label: "Classification Fraud",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    description: "Wrong property classification to reduce stamp duty",
  },
};

// ---------------------------------------------------------------------------
// Phase 3: Stamp Intelligence Types
// ---------------------------------------------------------------------------

/** A stamp vendor with risk scoring and usage data. */
export interface StampVendor {
  vendorId: string;
  vendorName: string;
  jurisdiction: string;
  sroCode: string;
  stampType: "Non-Judicial" | "Judicial" | "Franking" | "e-Stamp";
  usageCurrent: number;
  usageExpected: number;
  deviationPercent: number;
  vendorRiskScore: number;
  riskLevel: IGRSRiskLevel;
  flaggedDate: string;
  monthlyUsage: { month: string; count: number }[];
}

/** NJ stamp denomination anomaly detection record. */
export interface NJStampAnomaly {
  vendorId: string;
  vendorName: string;
  jurisdiction: string;
  njStampCount: number;
  njStampDenominations: number[];
  estimatedImpact: number;
  detectedDate: string;
}

/** Franking transaction above threshold. */
export interface FrankingAlert {
  documentId: string;
  frankingDate: string;
  frankingAmount: number;
  sroCode: string;
  officeName: string;
  vendorName: string;
  expectedAmount: number;
  variance: number;
  reviewStatus: "Pending" | "Reviewed" | "Cleared" | "Escalated";
}

/** Monthly stamp usage trend entry per jurisdiction. */
export interface StampUsageTrend {
  month: string;
  jurisdiction: string;
  stampCount: number;
  expectedCount: number;
  anomaly: boolean;
}

/** Summary KPIs for the Stamp Intelligence tab. */
export interface StampIntelligenceSummary {
  totalVendors: number;
  atRiskVendors: number;
  atRiskVendorPercent: number;
  njStampAnomalies: number;
  njStampImpact: number;
  frankingAlerts: number;
  stampLeakageIndex: number;
  totalStampLeakage: number;
}

/** Top-level stamp vendor analysis payload. */
export interface StampVendorAnalysis {
  summary: StampIntelligenceSummary;
  vendorRiskRanking: StampVendor[];
  stampLeakageByType: { type: string; percent: number; amount: number; color: string }[];
  njStampAnomalies: NJStampAnomaly[];
  frankingAlerts: FrankingAlert[];
  usageTrends: StampUsageTrend[];
}

// ---------------------------------------------------------------------------
// Phase 3: MV Growth Attribution Types
// ---------------------------------------------------------------------------

/** Monthly revenue attribution split between MV-driven and volume-driven. */
export interface MVMonthlyAttribution {
  month: string;
  totalRevenue: number;
  mvDrivenRevenue: number;
  volumeDrivenRevenue: number;
  documentCount: number;
  avgMVPerDocument: number;
}

/** District-level revenue growth attribution. */
export interface MVDistrictAttribution {
  districtCode: string;
  districtName: string;
  totalGrowth: number;
  mvContribution: number;
  mvContributionPercent: number;
  volumeContribution: number;
  volumeContributionPercent: number;
  lastMVRevisionDate: string;
  docCountChange: number;
  revenuePerDoc: number;
}

/** Hierarchical node for district → SRO → mandal → village drill-down. */
export interface MVHierarchyNode {
  code: string;
  name: string;
  revenue: number;
  mvDriven: number;
  volumeDriven: number;
  docCount: number;
  children?: MVHierarchyNode[];
}

/** MV growth attribution payload. */
export interface MVGrowthAttribution {
  summary: {
    totalRevenueGrowth: number;
    mvDrivenGrowth: number;
    mvDrivenPercent: number;
    volumeDrivenGrowth: number;
    volumeDrivenPercent: number;
    netMVRevisionImpact: number;
  };
  monthlyAttribution: MVMonthlyAttribution[];
  districtAttribution: MVDistrictAttribution[];
  hierarchyData: { districts: MVHierarchyNode[] };
  mvRevisionTimeline: {
    date: string;
    district: string;
    avgMVIncrease: number;
    revenueImpact: number;
    documentImpact: number;
  }[];
}

// ---------------------------------------------------------------------------
// Phase 3: MV Anomalies Types
// ---------------------------------------------------------------------------

/** MV anomaly type classification. */
export type MVAnomalyType =
  | "ExecutionRegistrationGap"
  | "AbnormalUDS"
  | "CompositeRateMisuse"
  | "ClassificationDowngrade";

/** A single MV manipulation anomaly case. */
export interface MVAnomaly {
  caseId: string;
  anomalyType: MVAnomalyType;
  documentKey: string;
  mvDeclared: number;
  mvExpected: number;
  deviationPercent: number;
  estimatedLeakage: number;
  sroCode: string;
  officeName: string;
  riskScore: number;
  status: IGRSCaseStatus;
}

/** MV anomalies data payload. */
export interface MVAnomaliesData {
  summary: {
    totalAnomalies: number;
    executionGapCases: number;
    udsAnomalies: number;
    compositeRateCases: number;
    classificationCases: number;
    totalEstimatedLeakage: number;
  };
  anomalies: MVAnomaly[];
  anomalyDistribution: { type: MVAnomalyType; count: number; amount: number }[];
  sroRiskHeatmap: { sroCode: string; officeName: string; score: number; anomalyCount: number }[];
}

// ---------------------------------------------------------------------------
// Phase 3: MV Revision Comparison Types
// ---------------------------------------------------------------------------

/** Pre/Post MV revision comparison data. */
export interface MVRevisionComparison {
  revisions: {
    district: string;
    sroCode: string;
    revisionDate: string;
    preRevision: {
      avgDocsPerMonth: number;
      avgMV: number;
      totalRevenue: number;
      avgGap: number;
      highRiskRate: number;
      exemptionClaims: number;
    };
    postRevision: {
      avgDocsPerMonth: number;
      avgMV: number;
      totalRevenue: number;
      avgGap: number;
      highRiskRate: number;
      exemptionClaims: number;
    };
    documentVolumeTimeline: { month: string; count: number; phase: "pre" | "post" }[];
  }[];
  sroPeerComparison: {
    sroCode: string;
    officeName: string;
    district: string;
    revenue: number;
    revenueGrowth: number;
    mvCompliance: number;
    avgGap: number;
    highRiskPercent: number;
    rank: number;
  }[];
}

// ---------------------------------------------------------------------------
// Phase 3: Governance Dashboard Types
// ---------------------------------------------------------------------------

/** Common metadata for governance data files. */
export interface GovernanceMetadata {
  lastUpdated: string;
  period: string;
  totalDistricts: number;
  totalSROs: number;
}

/** Governance Tab 1: Revenue Growth. */
export interface GovernanceRevenueGrowth {
  metadata: GovernanceMetadata;
  summary: {
    currentMonthRevenue: number;
    previousMonthRevenue: number;
    momGrowth: number;
    ytdRevenue: number;
  };
  monthlyRevenue: {
    month: string;
    stampDuty: number;
    transferDuty: number;
    registrationFee: number;
    dsd: number;
    other: number;
    total: number;
    growthPercent: number;
    docCount: number;
  }[];
}

/** Governance Tab 2: District Ranking. */
export interface GovernanceDistrictRanking {
  metadata: GovernanceMetadata;
  rankings: {
    rank: number;
    districtCode: string;
    districtName: string;
    revenue: number;
    target: number;
    achievementPercent: number;
    growthPercent: number;
    docCount: number;
    avgMV: number;
    sroCount: number;
    zone: string;
  }[];
}

/** Governance Tab 3: Low Performer analysis. */
export interface GovernanceLowPerformer {
  districtCode: string;
  districtName: string;
  rank: number;
  revenue: number;
  target: number;
  achievement: number;
  growth: number;
  reasons: string[];
  suggestedActions: string[];
  keyMetrics: {
    docCountVsPrev: number;
    avgMVVsState: number;
    exemptionRate: number;
    vacantSROCount: number;
  };
}

/** Governance Tab 4: Classification-wise revenue. */
export interface GovernanceClassification {
  metadata: GovernanceMetadata;
  classifications: {
    type: string;
    docCount: number;
    revenue: number;
    sharePercent: number;
    avgMV: number;
    growthPercent: number;
    topDistrict: string;
  }[];
  districtClassificationMatrix: {
    district: string;
    residential: number;
    commercial: number;
    agricultural: number;
    industrial: number;
    mixed: number;
    govt: number;
  }[];
  conversionCases?: {
    summary: {
      totalConversions: number;
      commercialToResidential: number;
      agriculturalToCommercial: number;
      otherConversions: number;
      estimatedRevenueImpact: number;
      flaggedCases: number;
    };
    cases: {
      caseId: string;
      documentKey: string;
      sroCode: string;
      officeName: string;
      district: string;
      weblandClassification: string;
      form1Classification: string;
      form2Classification: string;
      declaredClassification: string;
      conversionType: string;
      mvDeclared: number;
      mvExpected: number;
      revenueImpact: number;
      status: "Flagged" | "Under Review" | "Confirmed" | "Cleared";
      detectedDate: string;
    }[];
    monthlyTrend: { month: string; conversions: number; flagged: number; revenueImpact: number }[];
  };
}

/** Governance Tab 5: Prohibited Property trends. */
export interface GovernanceProhibitedProperty {
  metadata: GovernanceMetadata;
  summary: {
    totalNotifications: number;
    totalDenotifications: number;
    activePPCount: number;
    registrationBlocks: number;
  };
  trends: { month: string; notifications: number; denotifications: number }[];
  registry: {
    notificationNo: string;
    date: string;
    category: string;
    district: string;
    location: string;
    status: "Active" | "Denotified";
    documentsBlocked: number;
  }[];
  categoryDistribution: { category: string; count: number; percent: number }[];
}

/** Governance Tab 6: Anywhere Registration trends. */
export interface GovernanceAnywhereRegistration {
  metadata: GovernanceMetadata;
  summary: {
    totalAnywhereRegs: number;
    percentOfTotal: number;
    topDestinationSRO: string;
    topSourceDistrict: string;
  };
  flows: {
    propertyLocation: string;
    registeredAt: string;
    docCount: number;
    revenue: number;
    avgMV: number;
  }[];
  monthlyTrend: { month: string; count: number; percent: number }[];
}

/** Governance Tab 7: SLA Monitoring. */
export interface GovernanceSLAMonitoring {
  metadata: GovernanceMetadata;
  summary: {
    totalPending: number;
    withinSLA: number;
    slaBreached: number;
    avgProcessingDays: number;
    oldestPendingDays: number;
    compliancePercent: number;
  };
  ageingBuckets: { bucket: string; count: number; color: string }[];
  officeSLA: {
    officeCode: string;
    officeName: string;
    total: number;
    withinSLA: number;
    breached: number;
    avgDays: number;
    oldestDays: number;
    compliancePercent: number;
  }[];
  pendingByDocType: { docType: string; count: number; percent: number }[];
  monthlyCompliance: { month: string; compliancePercent: number }[];
}

/** Entity type for party verification. */
export type PartyEntityType = "Individual" | "Private Company" | "Government" | "Trust" | "Partnership" | "LLP";

/** Verification status for PAN/Aadhaar cross-check. */
export type PartyVerificationStatus = "Verified" | "Mismatch" | "Pending" | "Not Available";

/** Governance Tab 8: Demographics. */
export interface GovernanceDemographics {
  metadata: GovernanceMetadata;
  gender: {
    distribution: { gender: string; count: number; percent: number; revenue: number }[];
    femaleBuyerPercent: number;
    jointRegistrationPercent: number;
    avgMVFemale: number;
    avgMVMale: number;
    monthlyTrend: { month: string; femalePercent: number; malePercent: number; jointPercent: number }[];
  };
  topParties: {
    partyName: string;
    pan: string;
    aadhaar: string;
    entityType: PartyEntityType;
    declaredAs: "Government" | "Private" | "Individual";
    verificationStatus: PartyVerificationStatus;
    verificationRemark?: string;
    role: "Buyer" | "Seller" | "Both";
    registrations: number;
    totalValue: number;
    districts: string[];
    flagged: boolean;
  }[];
  departments: {
    department: string;
    docCount: number;
    revenue: number;
    exemptionsClaimed: number;
    exemptAmount: number;
    netRevenue: number;
  }[];
}

// ---------------------------------------------------------------------------
// Phase 3: Case Drawer Evidence Enrichment Types
// ---------------------------------------------------------------------------

/** A single event in a challan reuse timeline. */
export interface ChallanTimelineEvent {
  date: string;
  event: string;
  documentId: string | null;
  amount: number;
  status: "normal" | "warning" | "critical";
  detail: string;
}

/** A row in the CFMS comparison table. */
export interface CFMSComparisonRow {
  field: string;
  challanValue: string;
  cfmsValue: string;
  mismatch: boolean;
}

/** Extended Cash Reconciliation evidence for enriched case drawer. */
export interface CashReconciliationEvidenceExtended {
  cashRiskScore: number;
  challanId: string;
  challanStatus: string;
  originalDocumentId?: string;
  challanTimeline: ChallanTimelineEvent[];
  cfmsComparison: CFMSComparisonRow[];
  dailyCashSummary: {
    officeDate: string;
    cashCollected: number;
    misRemittance: number;
    variance: number;
  };
  officerName: string;
  officerId: string;
  cashReconSubtype?: "mismatch" | "challanReuse" | "failedChallan" | "misRemittance";
  challanReuseEvidence?: ChallanReuseEvidence;
  failedChallanEvidence?: FailedChallanEvidence;
  misRemittanceEvidence?: MISRemittanceEvidence;
}

export interface ChallanReuseLinkedDocument {
  documentId: string;
  documentKey: string;
  registrationDate: string;
  hoaCode: string;
  hoaDescription: string;
  amountInr: number;
  sroCode: string;
  officeName: string;
}

export interface ChallanReuseEvidence {
  reusedChallanId: string;
  originalChallanAmountInr: number;
  totalAmountInvolvedInr: number;
  reuseCount: number;
  reuseSeverity: "warning" | "critical";
  crossHOA: boolean;
  linkedDocuments: ChallanReuseLinkedDocument[];
}

export interface FailedChallanEvidence {
  failedChallanId: string;
  cfmsStatus: "Rejected by Treasury" | "Expired" | "Invalid HOA" | "Cancelled" | "Bounced" | "Defaced";
  failureReason: string;
  cfmsRejectionDate: string;
  registrationDate: string;
  timeGapDays: number;
  challanAmountInr: number;
  registrationDocumentId: string;
  registrationCompleted: boolean;
  failureSeverity: "warning" | "critical";
}

export interface MISRemittanceEvidence {
  collectionDate: string;
  misSubmissionDate: string;
  collectionAmountInr: number;
  misReportedAmountInr: number;
  varianceInr: number;
  variancePercent: number;
  delayDays: number;
  expectedSubmissionDate: string;
  misReportId: string;
  receiptCount: number;
  misReportedReceiptCount: number;
  receiptCountMismatch: boolean;
  remittanceSeverity: "warning" | "critical";
}

/** Extended Stamp Inventory evidence for enriched case drawer. */
export interface StampInventoryEvidenceExtended {
  vendorRiskScore: number;
  vendorId: string;
  vendorName: string;
  jurisdiction: string;
  stampType: string;
  usageCount: number;
  expectedUsage: number;
  deviationPercent: number;
  monthlyUsage: { month: string; count: number; expected: number }[];
  revenuePerStamp: { month: string; avgRevenue: number }[];
  peerVendors: {
    vendorId: string;
    vendorName: string;
    usage: number;
    expected: number;
    deviation: number;
    riskScore: number;
  }[];
  stampTypeDistribution: {
    vendor: { type: string; percent: number }[];
    jurisdictionAvg: { type: string; percent: number }[];
  };
}

// ---------------------------------------------------------------------------
// Classification Fraud Evidence (extended drawer)
// ---------------------------------------------------------------------------

/** A single row comparing a field across Form 1, Form 2, and Webland records. */
export interface ClassificationCrossVerificationRow {
  field: string;
  form1Value: string;
  form2Value: string;
  weblandValue: string;
  mismatch: boolean;
}

/** A historical reclassification entry for the property/party. */
export interface ClassificationHistoryEntry {
  date: string;
  fromClassification: string;
  toClassification: string;
  documentId: string;
  registeredBy: string;
  suspicious: boolean;
}

/** Duty rate and value impact analysis for classification fraud. */
export interface ClassificationDutyImpact {
  declaredDutyRate: number;
  correctDutyRate: number;
  declaredValue: number;
  correctValue: number;
  dutyPaid: number;
  dutyOwed: number;
  dutyGap: number;
}

/** Extended Classification Fraud evidence for enriched case drawer. */
export interface ClassificationFraudEvidenceExtended {
  declaredClassification: string;
  actualClassification: string;
  weblandClassification: string;
  form1Classification: string;
  form2Classification: string;
  classificationRiskScore: number;
  estimatedDutyLoss: number;
  crossVerification: ClassificationCrossVerificationRow[];
  conversionHistory: ClassificationHistoryEntry[];
  dutyImpact: ClassificationDutyImpact;
}

// ---------------------------------------------------------------------------
// Phase 4: AI Intelligence Types
// ---------------------------------------------------------------------------

// --- Predictive Forecasting ---

export type ForecastScenario = "baseline" | "optimistic" | "conservative";

export interface ForecastScenarioValues {
  forecast: number;
  upper95: number;
  lower95: number;
  upper80: number;
  lower80: number;
}

export interface ForecastHistoricalMonth {
  month: string;
  actual: number;
  isMVRevision: boolean;
  mvRevisionLabel?: string;
}

export interface ForecastFutureMonth {
  month: string;
  scenarios: Record<ForecastScenario, ForecastScenarioValues>;
  isMVRevision: boolean;
  mvRevisionLabel?: string;
}

export interface ForecastGrowthAttribution {
  month: string;
  mvRevision: number;
  volumeGrowth: number;
  newAreas: number;
  complianceImprovement: number;
}

export interface DistrictForecast {
  district: string;
  actualLTM: number;
  forecastNTM: number;
  yoyGrowth: number;
  mvRevisionImpact: number;
  volumeGrowth: number;
  confidenceRange: number;
  riskFlag: "low" | "medium" | "high";
  monthlyTrend: number[];
}

export interface ForecastModelPerformance {
  mape: number;
  r2: number;
  mae: number;
  rmse: number;
  lastValidation: string;
}

export interface PredictiveForecastingData {
  metadata: {
    lastComputedAt: string;
    modelVersion: string;
    trainingPeriod: string;
    trainingMonths: number;
    modelType: string;
  };
  modelPerformance: ForecastModelPerformance;
  stateLevel: {
    forecastNarrative: string;
    historicalMonths: ForecastHistoricalMonth[];
    forecastMonths: ForecastFutureMonth[];
    growthAttribution: ForecastGrowthAttribution[];
  };
  districtForecasts: DistrictForecast[];
  scenarioAssumptions: Record<ForecastScenario, string>;
}

// --- Document Risk Scoring ---

export type RiskBand = "low" | "moderate" | "elevated" | "high" | "critical";

export type RiskDimension = "revenue" | "exemption" | "classification" | "cash";

export interface RiskDistributionBucket {
  band: string;
  label: string;
  count: number;
  pct: number;
  color: string;
}

export interface RiskDimensionAvg {
  avg: number;
  max: number;
  pct: number;
  prevAvg: number;
}

export interface RiskMonthlyTrend {
  month: string;
  avgScore: number;
  highRiskCount: number;
  annotation?: string;
}

export interface RiskDimensionWeight {
  dimension: string;
  weight: number;
  maxScore: number;
  avgContribution: number;
  rules: string[];
  color: string;
}

export interface RiskScoredDocument {
  rank: number;
  documentId: string;
  sro: string;
  sroName: string;
  compositeScore: number;
  revenueScore: number;
  exemptionScore: number;
  classificationScore: number;
  cashScore: number;
  gapAmount: number;
  signals: string[];
  caseId?: string;
}

export interface DocumentRiskScoringData {
  metadata: {
    lastComputedAt: string;
    modelVersion: string;
    scoringDate: string;
    totalDocumentsScored: number;
    period: string;
  };
  summary: {
    avgCompositeScore: number;
    avgCompositeScoreChange: number;
    highRiskCount: number;
    highRiskPct: number;
    criticalCount: number;
    criticalPct: number;
    estimatedRevenueAtRisk: number;
    estimatedRevenueAtRiskChange: number;
  };
  distribution: RiskDistributionBucket[];
  dimensionAvg: Record<RiskDimension, RiskDimensionAvg>;
  monthlyTrend: RiskMonthlyTrend[];
  dimensionWeights: RiskDimensionWeight[];
  topDocuments: RiskScoredDocument[];
  aiExplanation: string;
}

// --- SRO Integrity Index ---

export type IntegrityBand = "excellent" | "good" | "needsImprovement" | "atRisk" | "critical";

export type IntegrityComponent = "revenueCompliance" | "cashHandling" | "exemptionAdherence" | "slaCompliance" | "dataQuality";

export interface IntegrityComponentDefinition {
  id: IntegrityComponent;
  label: string;
  maxScore: number;
  color: string;
  description: string;
}

export interface SROMonthlyIntegrity {
  month: string;
  score: number;
  rc: number;
  ch: number;
  ea: number;
  sc: number;
  dq: number;
}

export interface SROIntegrityRecord {
  code: string;
  name: string;
  district: string;
  currentScore: number;
  previousScore: number;
  momChange: number;
  rank: number;
  previousRank: number;
  band: IntegrityBand;
  components: Record<IntegrityComponent, number>;
  monthlyHistory: SROMonthlyIntegrity[];
  aiAssessment: string;
  improvementActions: string[];
}

export interface SROIntegrityIndexData {
  metadata: {
    lastComputedAt: string;
    currentMonth: string;
    totalSROs: number;
    scoringModel: string;
  };
  summary: {
    stateAvgScore: number;
    stateAvgChange: number;
    topSRO: { code: string; name: string; score: number };
    bottomSRO: { code: string; name: string; score: number };
    improvingSROCount: number;
    decliningSROCount: number;
    stableSROCount: number;
  };
  componentDefinitions: IntegrityComponentDefinition[];
  sros: SROIntegrityRecord[];
}

// --- Natural Language Prompt Engine ---

export type PromptCategory = "revenue" | "performance" | "risk" | "forecasting" | "compliance" | "sla";

export interface PromptCategoryDefinition {
  id: PromptCategory;
  label: string;
  icon: string;
  color: string;
}

export interface InlineTableData {
  headers: string[];
  rows: (string | number)[][];
  highlightColumn?: number;
}

export interface InlineChartData {
  type: "bar" | "line" | "donut";
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export interface PromptResponseData {
  narrative: string;
  inlineTable?: InlineTableData;
  inlineChart?: InlineChartData;
  keyInsight: string;
  followUpPrompts: string[];
}

export interface PromptTemplate {
  id: string;
  promptText: string;
  category: PromptCategory;
  role?: "IG" | "DIG" | "DR" | "SR";
  response: PromptResponseData;
}

export interface PromptEngineData {
  metadata: {
    lastUpdated: string;
    totalPrompts: number;
    version: string;
  };
  categories: PromptCategoryDefinition[];
  prompts: PromptTemplate[];
}

// --- Combined AI Intelligence Metadata ---

export interface AIIntelligenceMetadata {
  lastComputedAt: string;
  modelStatuses: {
    forecasting: "active" | "training" | "error";
    riskScoring: "active" | "training" | "error";
    integrityIndex: "active" | "training" | "error";
  };
}

// ---------------------------------------------------------------------------
// Webland Cross-Verification Types
// ---------------------------------------------------------------------------

/** Result of cross-verifying Webland classification with Form 1/Form 2 entries. */
export interface WeblandVerificationRecord {
  documentKey: string;
  sroCode: string;
  officeName: string;
  district: string;
  weblandClassification: string;
  form1Classification: string;
  form2Classification: string;
  declaredClassification: string;
  weblandVsForm1Match: boolean;
  weblandVsForm2Match: boolean;
  form1VsDeclaredMatch: boolean;
  deviationReason?: string;
  riskScore: number;
  estimatedImpact: number;
  status: "Match" | "Mismatch" | "Partial Match" | "Under Review";
}

/** Webland cross-verification data payload. */
export interface WeblandVerificationData {
  metadata: { lastUpdated: string; totalVerified: number; period: string };
  summary: {
    totalDocuments: number;
    matchCount: number;
    mismatchCount: number;
    partialMatchCount: number;
    mismatchRate: number;
    estimatedRevenueImpact: number;
  };
  records: WeblandVerificationRecord[];
  classificationMismatchBreakdown: {
    fromType: string;
    toType: string;
    count: number;
    revenueImpact: number;
  }[];
  sroMismatchHeatmap: {
    sroCode: string;
    officeName: string;
    mismatchCount: number;
    mismatchRate: number;
    topMismatchType: string;
  }[];
}

// ---------------------------------------------------------------------------
// Officer Accountability Types
// ---------------------------------------------------------------------------

/** Individual officer accountability record. */
export interface OfficerAccountabilityRecord {
  officerId: string;
  officerName: string;
  designation: string;
  sroCode: string;
  officeName: string;
  district: string;
  dailyCashRiskScore: number;
  challanAnomalyCount: number;
  cashVarianceInr: number;
  stampDiscrepancyCount: number;
  pendingReconciliations: number;
  slaBreachCount: number;
  accountabilityScore: number;
  trend: "improving" | "stable" | "declining";
  lastAuditDate: string;
  flagged: boolean;
}

/** Officer Accountability data payload (Governance Tab 9). */
export interface OfficerAccountabilityData {
  metadata: GovernanceMetadata;
  summary: {
    totalOfficers: number;
    flaggedOfficers: number;
    avgAccountabilityScore: number;
    highRiskOfficers: number;
    totalCashVariance: number;
    pendingReconciliations: number;
  };
  officers: OfficerAccountabilityRecord[];
  sroAccountabilitySummary: {
    sroCode: string;
    officeName: string;
    avgScore: number;
    officerCount: number;
    flaggedCount: number;
    totalVariance: number;
  }[];
}

// ---------------------------------------------------------------------------
// Repeat Exemption Parties
// ---------------------------------------------------------------------------

/** A party flagged for repeated exemption usage across registrations. */
export interface RepeatExemptionParty {
  partyName: string;
  pan: string;
  aadhaarLast4: string;
  entityType: string;
  exemptionCount: number;
  documentsInvolved: string[];
  totalExemptedAmount: number;
  offices: string[];
  categories: string[];
  firstSeen: string;
  lastSeen: string;
  riskFlag: "High" | "Medium" | "Low";
  remarks: string;
}

// ---------------------------------------------------------------------------
// Escalation Workflow Types
// ---------------------------------------------------------------------------

export type EscalationStatus = "Open" | "Responded" | "Accepted" | "Rejected" | "Overdue";
export type EscalationPriority = "High" | "Medium" | "Low";

export interface EscalationResponse {
  respondedAt: string;
  respondedBy: { role: string; name: string };
  explanation: string;
  evidence: string[];
  status: "Recovered" | "Justified" | "Rejected";
}

export interface EscalationRecord {
  id: string;
  caseId: string;
  createdAt: string;
  createdBy: { role: string; name: string };
  assignedTo: { role: string; name: string; email: string };
  slaDeadline: string;
  status: EscalationStatus;
  priority: EscalationPriority;
  comment: string;
  responses: EscalationResponse[];
  auditLog: { ts: string; actor: string; action: string; detail: string }[];
}
