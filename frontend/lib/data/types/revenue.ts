// ─── Enterprise Revenue Assurance Types ───
// Domain: Corporate revenue leakage detection — billing errors, pricing
// discrepancies, contract violations, discount abuse, and recognition gaps.
// All monetary values are in USD ($).

// ─── Enums / Union Types ──────────────────────────────────────────────

/** Severity classification for a revenue leakage case. */
export type RevenueRiskLevel = "Critical" | "High" | "Medium" | "Low";

/** Lifecycle status of a revenue assurance case. */
export type RevenueCaseStatus =
  | "Open"
  | "Investigating"
  | "Confirmed"
  | "Recovered"
  | "Closed"
  | "False Positive";

/** High-level category describing the nature of the leakage. */
export type RevenueLeakageCategory =
  | "Pricing"
  | "Billing"
  | "Contract"
  | "Discount"
  | "Subscription"
  | "Commission"
  | "Recognition";

/** Account segmentation tier. */
export type CustomerTier = "Enterprise" | "Mid-Market" | "SMB";

// ─── Core Case ────────────────────────────────────────────────────────

/** A single revenue-leakage investigation case. */
export interface RevenueCase {
  /** Unique identifier (UUID). */
  id: string;
  /** Human-readable case number, e.g. "RA-2026-00042". */
  caseNumber: string;
  /** Short summary of the detected leakage. */
  title: string;
  /** Detailed description including context and affected line items. */
  description: string;
  /** Leakage category this case falls under. */
  category: RevenueLeakageCategory;
  /** Current workflow status. */
  status: RevenueCaseStatus;
  /** Assessed risk level. */
  riskLevel: RevenueRiskLevel;
  /** Numeric risk score (0 – 100). */
  riskScore: number;
  /** ID of the affected customer account. */
  customerId: string;
  /** Display name of the affected customer. */
  customerName: string;
  /** Segment tier of the affected customer. */
  customerTier: CustomerTier;
  /** Associated contract ID, if applicable. */
  contractId?: string;
  /** Associated contract name, if applicable. */
  contractName?: string;
  /** Estimated total leakage amount in USD. */
  leakageAmountUsd: number;
  /** Amount already recovered in USD. */
  recoveredAmountUsd: number;
  /** Whether this leakage pattern has occurred before for the same customer. */
  recurrenceFlag: boolean;
  /** ISO-8601 timestamp when the leakage was first detected. */
  detectedAt: string;
  /** ISO-8601 timestamp when the case was resolved, if applicable. */
  resolvedAt?: string;
  /** User ID of the assigned analyst, or null if unassigned. */
  assignedTo: string | null;
  /** Team responsible for investigating the case. */
  assignedTeam: string;
  /** Identified root cause after investigation. */
  rootCause?: string;
  /** AI-generated explanation of why this was flagged. */
  aiExplanation?: string;
  /** List of invoice IDs related to this case. */
  relatedInvoices: string[];
  /** List of product / SKU identifiers involved. */
  relatedProducts: string[];
  /** Freeform tags for filtering and grouping. */
  tags: string[];
  /** Analyst notes attached to the case. */
  notes: Array<{
    id: string;
    author: string;
    createdAt: string;
    note: string;
  }>;
  /** Chronological log of all actions taken on the case. */
  activityLog: Array<{
    id: string;
    ts: string;
    actor: string;
    action: string;
    detail: string;
  }>;
  /** ISO-8601 timestamp when the case record was created. */
  createdAt: string;
  /** ISO-8601 timestamp of the last modification. */
  updatedAt: string;
}

// ─── Detection Rules ──────────────────────────────────────────────────

/** A configurable rule that the detection engine evaluates against transaction data. */
export interface RevenueRule {
  /** Unique rule identifier. */
  id: string;
  /** Leakage category the rule targets. */
  category: RevenueLeakageCategory;
  /** Human-readable rule name. */
  name: string;
  /** Longer description of what the rule checks. */
  description: string;
  /** Severity assigned when the rule fires. */
  severity: RevenueRiskLevel;
  /** Pseudocode or expression describing the detection logic. */
  logic: string;
  /** Whether the rule is currently active. */
  enabled: boolean;
  /** Numeric threshold that triggers the rule (interpretation depends on the rule). */
  threshold: number;
  /** ISO-8601 timestamp of the most recent trigger, if any. */
  lastTriggered: string | null;
  /** Total number of times this rule has fired. */
  triggerCount: number;
}

// ─── Customer ─────────────────────────────────────────────────────────

/** An enterprise customer account in the revenue assurance system. */
export interface Customer {
  /** Unique customer identifier. */
  id: string;
  /** Company / account name. */
  name: string;
  /** Account segmentation tier. */
  tier: CustomerTier;
  /** Industry vertical, e.g. "Financial Services", "Healthcare". */
  industry: string;
  /** Geographic region, e.g. "NA", "EMEA", "APAC". */
  region: string;
  /** Annual recurring revenue in USD. */
  annualRevenue: number;
  /** Number of active contracts. */
  contractCount: number;
  /** Number of currently open leakage cases. */
  activeLeakageCases: number;
  /** Cumulative leakage detected in USD. */
  totalLeakageUsd: number;
  /** Composite risk score (0 – 100). */
  riskScore: number;
  /** Name or ID of the assigned account manager. */
  accountManager: string;
  /** ISO-8601 timestamp when the customer record was created. */
  createdAt: string;
}

// ─── Contract ─────────────────────────────────────────────────────────

/** Status of a customer contract. */
export type ContractStatus = "Active" | "Expiring" | "Expired" | "Renewed";

/** A customer contract tracked by the revenue assurance system. */
export interface Contract {
  /** Unique contract identifier. */
  id: string;
  /** ID of the customer who owns this contract. */
  customerId: string;
  /** Display name of the customer. */
  customerName: string;
  /** Contract title or reference name. */
  name: string;
  /** Contract type, e.g. "SaaS", "Professional Services", "Licensing". */
  type: string;
  /** ISO-8601 date when the contract starts. */
  startDate: string;
  /** ISO-8601 date when the contract ends. */
  endDate: string;
  /** Total contract value in USD over its full term. */
  totalValue: number;
  /** Monthly recurring value in USD. */
  monthlyValue: number;
  /** Product / SKU identifiers covered by the contract. */
  products: string[];
  /** Agreed discount percentage (0 – 100). */
  discountPct: number;
  /** How often the customer is billed, e.g. "Monthly", "Quarterly", "Annual". */
  billingFrequency: string;
  /** Compliance score (0 – 100) reflecting how well billing matches the contract. */
  complianceScore: number;
  /** Current contract lifecycle status. */
  status: ContractStatus;
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────

/** Top-level KPI payload for the Revenue Assurance dashboard. */
export interface RevenueDashboardKPIs {
  /** Total leakage detected in USD across all active cases. */
  totalLeakageDetected: number;
  /** Total leakage successfully recovered in USD. */
  totalRecovered: number;
  /** Recovery rate as a percentage (0 – 100). */
  recoveryRate: number;
  /** Number of currently active (non-closed) cases. */
  activeCases: number;
  /** Average number of days to resolve a case. */
  avgResolutionDays: number;
  /** Leakage broken down by category. */
  leakageByCategory: Array<{
    category: RevenueLeakageCategory;
    amountUsd: number;
    caseCount: number;
  }>;
  /** Leakage broken down by customer tier. */
  leakageByTier: Array<{
    tier: CustomerTier;
    amountUsd: number;
    caseCount: number;
  }>;
  /** Customers ranked by total leakage in USD. */
  topCustomersByLeakage: Array<{
    customerId: string;
    customerName: string;
    tier: CustomerTier;
    leakageUsd: number;
    caseCount: number;
  }>;
  /** Case counts grouped by status for pipeline visualization. */
  casePipeline: Array<{
    status: RevenueCaseStatus;
    count: number;
  }>;
  /** Monthly trend data for charts. */
  monthlyTrends: RevenueTrend[];
  /** AI-generated or rule-based highlights for the dashboard. */
  highlights: Array<{
    icon: string;
    text: string;
  }>;
}

// ─── Trends ───────────────────────────────────────────────────────────

/** Monthly aggregated revenue assurance metrics. */
export interface RevenueTrend {
  /** Month label, e.g. "2026-01". */
  month: string;
  /** Total leakage detected that month in USD. */
  leakageUsd: number;
  /** Total leakage recovered that month in USD. */
  recoveredUsd: number;
  /** Number of cases opened or active during the month. */
  caseCount: number;
}

// ─── Patterns ─────────────────────────────────────────────────────────

/** An AI-detected or rule-mined leakage pattern across multiple transactions. */
export interface RevenuePattern {
  /** Unique pattern identifier. */
  id: string;
  /** Pattern classification, e.g. "recurring", "seasonal", "anomaly". */
  type: string;
  /** Leakage category the pattern relates to. */
  category: RevenueLeakageCategory;
  /** Human-readable description of the pattern. */
  description: string;
  /** Number of distinct customers affected by this pattern. */
  affectedCustomers: number;
  /** Estimated total financial impact in USD. */
  estimatedImpactUsd: number;
  /** Confidence score (0 – 1) indicating pattern reliability. */
  confidence: number;
  /** ISO-8601 timestamp when the pattern was first identified. */
  detectedAt: string;
}

// ─── Exports ──────────────────────────────────────────────────────────

/** A record of an exported report or data extract. */
export interface RevenueExport {
  /** Unique export identifier. */
  id: string;
  /** User who initiated the export. */
  createdBy: string;
  /** ISO-8601 timestamp of the export request. */
  createdAt: string;
  /** Export type, e.g. "Cases", "Trends", "Audit". */
  type: string;
  /** Human-readable summary of filters applied. */
  filtersUsed: string;
  /** Processing status of the export job. */
  status: "Queued" | "Running" | "Ready" | "Failed";
  /** Output file format. */
  format: "CSV" | "PDF" | "XLSX";
}

// ─── Settings ─────────────────────────────────────────────────────────

/** Global configuration for the revenue assurance module. */
export interface RevenueSettings {
  /** Acceptable pricing deviation before flagging (percentage, e.g. 5 means 5 %). */
  pricingTolerancePct: number;
  /** How often billing audits run, e.g. "Daily", "Weekly", "Monthly". */
  billingCheckFrequency: string;
  /** Discount percentage above which manual approval is required. */
  discountApprovalThreshold: number;
  /** Whether the automated detection engine is active. */
  autoDetectionEnabled: boolean;
  /** Per-channel notification preferences. */
  notificationPreferences: {
    email: boolean;
    slack: boolean;
    inApp: boolean;
    /** Risk levels that trigger notifications. */
    riskLevels: RevenueRiskLevel[];
  };
}

// ─── Signals ──────────────────────────────────────────────────────────

/** A discrete detection signal emitted when a rule fires against a transaction. */
export interface RevenueSignal {
  /** Unique signal identifier. */
  id: string;
  /** ID of the case this signal is associated with. */
  caseId: string;
  /** ID of the rule that generated this signal. */
  ruleId: string;
  /** Leakage category of the signal. */
  category: RevenueLeakageCategory;
  /** Severity of the signal. */
  severity: RevenueRiskLevel;
  /** Estimated financial impact of this individual signal in USD. */
  impactUsd: number;
  /** Human-readable explanation of why the signal was raised. */
  explanation: string;
  /** ISO-8601 timestamp when the signal was created. */
  createdAt: string;
  /** Current disposition of the signal. */
  status: "New" | "Acknowledged" | "Dismissed";
}
