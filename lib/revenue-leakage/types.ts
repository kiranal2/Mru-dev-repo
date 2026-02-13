export type RiskLevel = "High" | "Medium" | "Low";
export type CaseStatus = "New" | "In Review" | "Confirmed" | "Resolved" | "Rejected";
export type LeakageSignal =
  | "RevenueGap"
  | "ChallanDelay"
  | "ExemptionRisk"
  | "MarketValueRisk"
  | "ProhibitedLand"
  | "DataIntegrity"
  | "HolidayFee";

export interface DocumentKey {
  SR_CODE: string;
  BOOK_NO: string;
  DOCT_NO: string;
  REG_YEAR: string;
}

export interface OfficeInfo {
  SR_CODE: string;
  SR_NAME: string;
  district: string;
  zone: string;
}

export interface DocTypeInfo {
  TRAN_MAJ_CODE: string;
  TRAN_MIN_CODE: string;
  TRAN_DESC: string;
  AB_DESC: string;
}

export interface DateInfo {
  P_DATE: string;
  E_DATE: string;
  R_DATE: string;
}

export type LandNature = "Dry" | "Wet" | "Converted" | "Garden" | "NA";
export type ValuationSlab = "Low" | "Medium" | "High" | "Premium";

export interface PropertySummary {
  is_urban: boolean;
  land_nature?: LandNature;
  rural?: {
    VILLAGE_CODE: string;
    HAB_CODE: string;
    SURVEY_NO: string;
    PLOT_NO: string;
  };
  urban?: {
    WARD_NO: string;
    BLOCK_NO: string;
    DOOR_NO: string;
    HAB_CODE: string;
    LOCAL_BODY: string;
  };
  extent: string;
  unit: string;
}

export interface PartyInfo {
  CODE: string;
  NAME: string;
  R_CODE?: string;
  R_NAME?: string;
  AGE?: number | null;
  PAN_NO?: string | null;
  PHONE_NO?: string | null;
  EMAIL_ID?: string | null;
}

export interface RuleHitCalculation {
  label: string;
  value: string;
}

export interface RuleHit {
  rule_id: string;
  rule_name: string;
  category: string;
  severity: "High" | "Medium" | "Low";
  impact_inr: number;
  explanation: string;
  fields_used: string[];
  calculations: RuleHitCalculation[];
  confidence: number;
}

export interface CashPaidLine {
  ACCOUNT_CODE: string;
  AMOUNT: number;
  AMOUNT_BY_CHALLAN?: number;
  AMOUNT_BY_DD?: number;
  AMOUNT_BY_ONLINE?: number;
  AMOUNT_BY_SHC?: number;
}

export interface ReceiptEvidence {
  C_RECEIPT_NO: string;
  RECEIPT_DATE: string;
  BANK_CHALLAN_NO?: string | null;
  BANK_CHALLAN_DT?: string | null;
  BANK_NAME?: string | null;
  BANK_BRANCH?: string | null;
  ECHALLAN_NO?: string | null;
  ENTRY_DATE?: string | null;
  ACC_CANC: "A" | "C" | "R";
  exclude_reason?: string;
  cash_paid: CashPaidLine[];
}

export interface ProhibitedEvidence {
  PROHIB_CD: string;
  NOTI_GAZ_NO?: string | null;
  NOTI_GAZ_DT?: string | null;
  DENOTI_GAZ_NO?: string | null;
  DENOTI_GAZ_DT?: string | null;
  H_NAME?: string | null;
  ENTRY_DATE?: string | null;
  match_level: "Rural" | "Urban";
  match_fields: string[];
}

// Phase 2A — Market Value Evidence (Rate Card Wiring)
export interface RateCardEntry {
  SRO_CODE: string;
  location_key: string; // VILLAGE_CODE+SURVEY for rural, WARD+BLOCK for urban
  UNIT_RATE: number;
  REV_RATE: number;
  PRE_REV_RATE: number;
  effective_from: string;
  source: "MV_BASIC_RUR_REG" | "MV_BASIC_URB_REG";
}

export interface MarketValueEvidence {
  status: "Available" | "Placeholder" | "NotApplicable";
  declared_value: number;
  expected_value: number;
  deviation_pct: number;
  unit_rate_current: number;
  unit_rate_previous: number;
  rate_card?: RateCardEntry;
  note: string;
}

// Phase 2B — Exemption Evidence
export interface ExemptionEntry {
  exemption_code: string;
  exemption_amount: number;
  exemption_reason: string;
  eligibility_result: "Pass" | "Fail" | "Unknown";
  doc_type_eligible: boolean;
  cap_exceeded: boolean;
}

export interface ExemptionEvidence {
  status: "Available" | "Placeholder" | "NotApplicable";
  entries: ExemptionEntry[];
  repeat_usage_flag: boolean;
  repeat_party_pan?: string | null;
  note: string;
}

// Phase 2C — Office Risk Scoring
export interface OfficeRiskScore {
  SR_CODE: string;
  SR_NAME: string;
  district: string;
  zone: string;
  risk_score: number;
  risk_level: RiskLevel;
  component_scores: {
    revenue_gap: number;
    challan_delay: number;
    prohibited_match: number;
    mv_deviation: number;
    exemption_anomaly: number;
  };
  total_cases: number;
  high_risk_cases: number;
  total_gap_inr: number;
}

// Phase 2D — Pattern Mining
export interface PatternInsight {
  id: string;
  type: "spike" | "drop" | "drift" | "seasonal";
  metric: string;
  office?: string;
  period: string;
  magnitude: string;
  explanation: string;
}

export interface MonthlyTrend {
  month: string;
  cases: number;
  gap_inr: number;
  high_risk: number;
}

// Phase 2E — Workflow Enhancements
export type AgeingBucket = "0-7d" | "8-14d" | "15-30d" | "30d+";

export interface CaseSLA {
  created_at: string;
  ageing_days: number;
  ageing_bucket: AgeingBucket;
  sla_breached: boolean;
  sla_target_days: number;
}

export interface EscalationRecord {
  id: string;
  case_id: string;
  escalated_by: string;
  escalated_to: string;
  reason: string;
  created_at: string;
}

export interface SuggestedAction {
  likely_cause: string;
  recommended_checks: string[];
}

export interface CaseNote {
  id: string;
  author: string;
  created_at: string;
  note: string;
}

export interface ActivityLogEntry {
  id: string;
  ts: string;
  actor: string;
  action: string;
  detail: string;
  diff?: string;
}

export interface PayableBreakdown {
  SD_PAYABLE: number;
  TD_PAYABLE: number;
  RF_PAYABLE: number;
  DSD_PAYABLE: number;
  OTHER_FEE: number;
  FINAL_TAXABLE_VALUE: number;
}

export interface LeakageCase {
  case_id: string;
  document_key: DocumentKey;
  created_at: string;
  updated_at: string;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  case_status: CaseStatus;
  assigned_to: string | null;
  leakage_signals: LeakageSignal[];
  impact_amount_inr: number;
  payable_total_inr: number;
  paid_total_inr: number;
  gap_inr: number;
  office: OfficeInfo;
  doc_type: DocTypeInfo;
  dates: DateInfo;
  property_summary: PropertySummary;
  parties_summary: PartyInfo[];
  payable_breakdown: PayableBreakdown;
  evidence: {
    triggered_rules: RuleHit[];
    included_receipts: ReceiptEvidence[];
    excluded_receipts: ReceiptEvidence[];
    prohibited_matches: ProhibitedEvidence[];
    mv_evidence: MarketValueEvidence;
    exemption_evidence: ExemptionEvidence;
  };
  // Phase 2E — Workflow
  sla?: CaseSLA;
  escalations?: EscalationRecord[];
  suggested_actions?: SuggestedAction;
  notes: CaseNote[];
  activity_log: ActivityLogEntry[];
  mv_trend?: MVHotspotDetail;
}

export type MVSeverity = "Critical" | "High" | "Medium" | "Watch" | "Normal";
export type MVLocationType = "RURAL" | "URBAN";
export type MVHotspotStatus = "New" | "In Review" | "Confirmed";

export interface MVHotspotItem {
  case_id: string;
  sro_code: string;
  sro_name: string;
  district: string;
  location_label: string;
  location_type: MVLocationType;
  drr: number;
  rate_card_unit_rate: number;
  median_declared: number;
  transaction_count: number;
  severity: MVSeverity;
  estimated_loss: number;
  consecutive_quarters: number;
  status: MVHotspotStatus;
  assigned_to: string | null;
  rules_triggered: string[];
}

export interface MVHotspotTransaction {
  doc_key: string;
  date: string;
  extent: number;
  extent_unit: string;
  declared_per_unit: number;
  rate_card_unit_rate: number;
  drr: number;
  gap: number;
}

export interface MVHotspotDetail extends MVHotspotItem {
  confidence: number;
  transactions: MVHotspotTransaction[];
  peer_locations: Array<{ label: string; drr: number; txn_count: number; is_sro_avg?: boolean }>;
  trend_history: Array<{ quarter: string; drr: number; sro_avg: number }>;
  rate_card_history: Array<{ year: string; unit_rate: number; prev_rate: number }>;
  scatter_points: Array<{
    date: string;
    declared_per_unit: number;
    drr: number;
    doc_key: string;
    rate_card_unit_rate: number;
  }>;
  rules_detail: Array<{
    rule_id: string;
    rule_name: string;
    severity: MVSeverity;
    explanation: string;
    thresholds: Array<{ label: string; value: string }>;
    fields_used: string[];
    confidence: number;
    impact: number;
  }>;
  activity_log?: ActivityLogEntry[];
}

export interface MVQuarterTrend {
  quarter: string;
  avg_drr: number;
  hotspot_count: number;
  loss: number;
}

export interface MVSroTile {
  sro_code: string;
  sro_name: string;
  district: string;
  avg_drr: number;
  hotspot_count: number;
  transaction_count: number;
  estimated_loss: number;
  color: "red" | "orange" | "yellow" | "green";
}

export interface MVOfficeComparison {
  sro_a: {
    code: string;
    name: string;
    avg_drr: number;
    txn_count: number;
    rate_card_avg: number;
    declared_avg: number;
  };
  sro_b: {
    code: string;
    name: string;
    avg_drr: number;
    txn_count: number;
    rate_card_avg: number;
    declared_avg: number;
  };
  drr_gap: number;
  lower_drr_sro: string;
  is_flagged: boolean;
  severity: "High" | "Medium";
  estimated_impact: number;
  rate_card_gap_pct: number;
  declared_gap_pct: number;
}

export interface MVRateCardAnomaly {
  location_label: string;
  sro_code: string;
  sro_name: string;
  prev_rate: number;
  current_rate: number;
  growth_pct: number;
  sro_avg_growth: number;
  z_score: number;
  rule_id: string;
  severity: MVSeverity;
}

export interface MVDeclaredTrend {
  location_label: string;
  sro_code: string;
  sro_name: string;
  q1_growth: number;
  q2_growth: number;
  q3_growth: number;
  q4_growth: number;
  rate_card_growth: number;
  divergence: number;
  rule_id: string;
  severity: MVSeverity;
}

export interface MVSeasonalPattern {
  location_label: string;
  sro_code: string;
  sro_name: string;
  monthly_delta: number[];
  persistent_alerts: number[];
}

export interface RevenueLeakageOverview {
  last_refresh: string;
  sync_status: "Healthy" | "Degraded" | "Down";
  total_payable: number;
  total_paid: number;
  total_gap: number;
  high_risk_cases: number;
  avg_challan_delay_days: number;
  cases_awaiting_review: number;
  leakage_by_signal: Array<{ signal: LeakageSignal; high: number; medium: number; low: number }>;
  top_offices_by_gap: Array<{ SR_CODE: string; SR_NAME: string; gap_inr: number; cases: number }>;
  newest_high_risk_cases: Array<{
    case_id: string;
    document_key: DocumentKey;
    risk_score: number;
    gap_inr: number;
    created_at: string;
  }>;
  rules_health: { enabled: number; last_run: string; failures: number };
  // Phase 2C
  office_risk_scores: OfficeRiskScore[];
  // Phase 2D
  monthly_trends: MonthlyTrend[];
  pattern_insights: PatternInsight[];
  // Phase 2B
  exemption_summary: {
    total_exemptions: number;
    total_amount: number;
    failed_eligibility: number;
    repeat_offenders: number;
    top_categories: Array<{ code: string; count: number; amount: number }>;
  };
  // Phase 2E
  sla_summary: {
    within_sla: number;
    breached: number;
    ageing_buckets: Record<AgeingBucket, number>;
  };
}

// Enhanced Overview types
export interface OverviewEnhanced extends RevenueLeakageOverview {
  kpi_deltas: {
    total_payable_delta_pct: number;
    total_paid_delta_pct: number;
    total_gap_delta_pct: number;
    high_risk_cases_delta_pct: number;
    avg_challan_delay_delta_pct: number;
    cases_awaiting_review_delta_pct: number;
  };
  kpi_sparklines: {
    total_payable: number[];
    total_paid: number[];
    total_gap: number[];
    high_risk_cases: number[];
    avg_challan_delay: number[];
    cases_awaiting_review: number[];
  };
  mini_kpis: {
    prohibited_land_hits: number;
    gap_above_threshold: number;
    delay_above_threshold: number;
    data_integrity_flags: number;
  };
  signal_impact: Array<{
    signal: LeakageSignal;
    high: number;
    medium: number;
    low: number;
    total_impact_inr: number;
  }>;
  status_funnel: Array<{
    status: CaseStatus;
    count: number;
    pct: number;
  }>;
  gap_trend_monthly: Array<{
    month: string;
    total_gap: number;
    total_payable: number;
    rolling_avg: number;
  }>;
  highlights: Array<{
    icon: "trending-down" | "trending-up" | "alert" | "clock" | "shield" | "bar-chart" | "map-pin";
    text: string;
  }>;
  top_offices_enhanced: Array<{
    SR_CODE: string;
    SR_NAME: string;
    gap_inr: number;
    cases: number;
    high_risk_pct: number;
    avg_delay_days: number;
    prohibited_hits: number;
  }>;
  top_rules_triggered: Array<{
    rule_id: string;
    rule_name: string;
    trigger_count: number;
    total_impact_inr: number;
    avg_confidence: number;
  }>;
  newest_high_risk_enhanced: Array<{
    case_id: string;
    document_key: DocumentKey;
    risk_score: number;
    gap_inr: number;
    created_at: string;
    signals: LeakageSignal[];
    confidence: number;
  }>;
  last_detection_run: string;
  docs_scanned: number;
}

export interface RuleCatalogItem {
  rule_id: string;
  category: string;
  rule_name: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  inputs: string[];
  output: string;
  enabled: boolean;
  phase: "Phase 1" | "Phase 2 Enhanced";
  details: {
    logic: string;
    required_fields: string[];
    false_positive_notes: string[];
    example: string;
  };
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: "CSV" | "PDF";
}

export interface ExportRecord {
  export_id: string;
  created_by: string;
  created_at: string;
  type: string;
  filters_used: string;
  status: "Queued" | "Ready" | "Running" | "Failed";
}

// ─── Registration Pattern Analysis ───

export type PatternDimension =
  | "geography"
  | "time"
  | "propertyType"
  | "landNature"
  | "docType"
  | "valuationSlab";

export interface RegistrationPatternBucket {
  key: string;
  label: string;
  total_registrations: number;
  total_mv: number;
  avg_mv: number;
  total_gap: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

export interface RegistrationPatternMatrix {
  row_dimension: PatternDimension;
  col_dimension: PatternDimension;
  row_keys: string[];
  col_keys: string[];
  cells: Record<string, Record<string, number>>; // row_key → col_key → count
}

export interface RegistrationPatternSummary {
  total_registrations: number;
  total_mv: number;
  avg_mv: number;
  total_gap: number;
  high_risk_pct: number;
  buckets: RegistrationPatternBucket[];
  matrix: RegistrationPatternMatrix;
}

// ─── Admin Page Types ───

export interface AdminUser {
  id: string;
  name: string;
  role: "Admin" | "Analyst" | "Viewer";
  email: string;
  cases_assigned: number;
  status: "Active" | "Inactive";
  last_active: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  category: "system" | "rule" | "user" | "case" | "export";
}

export interface DetectionRunRecord {
  id: string;
  started_at: string;
  duration_sec: number;
  cases_found: number;
  status: "Completed" | "Running" | "Failed";
}

export interface DataSourceConfig {
  id: string;
  name: string;
  type: string;
  status: "Connected" | "Disconnected";
  last_sync: string;
  records: number;
}

export interface AdminData {
  users: AdminUser[];
  auditLog: AuditLogEntry[];
  dataSources: DataSourceConfig[];
  systemHealth: {
    status: "Healthy" | "Degraded" | "Down";
    lastRun: string;
    lastSync: string;
    uptime: string;
  };
  detectionHistory: DetectionRunRecord[];
}

// ─── Manual Case Creation Types ───

export interface ManualReceiptInput {
  receipt_no: string;
  receipt_date: string;
  challan_no: string;
  challan_date: string;
  amount: number;
  acc_canc: "A" | "C" | "R";
  account_codes: string[];
}

export interface ManualExemptionInput {
  code: string;
  amount: number;
  reason: string;
  doc_type_eligible: boolean;
  cap_amount: number;
  repeat_usage_count: number;
}

export interface ManualPartyInput {
  CODE: string;
  NAME: string;
  PAN_NO: string;
}

export interface ManualCaseInput {
  // Document & Office
  SR_CODE: string;
  SR_NAME: string;
  district: string;
  zone: string;
  BOOK_NO: string;
  DOCT_NO: string;
  REG_YEAR: string;
  doc_type: string;
  TRAN_MAJ_CODE: string;
  TRAN_MIN_CODE: string;
  P_DATE: string;
  E_DATE: string;
  R_DATE: string;
  // Property
  is_urban: boolean;
  WARD_NO: string;
  BLOCK_NO: string;
  DOOR_NO: string;
  LOCAL_BODY: string;
  VILLAGE_CODE: string;
  SURVEY_NO: string;
  PLOT_NO: string;
  land_nature: LandNature;
  extent: string;
  unit: string;
  prohibited_land_match: boolean;
  schedule_data_exists: boolean;
  // Financials
  SD_PAYABLE: number;
  TD_PAYABLE: number;
  RF_PAYABLE: number;
  DSD_PAYABLE: number;
  OTHER_FEE: number;
  FINAL_TAXABLE_VALUE: number;
  receipts: ManualReceiptInput[];
  // Market Value
  declared_value: number;
  expected_value: number;
  unit_rate_current: number;
  unit_rate_previous: number;
  nearby_median_rate: number;
  // Exemptions
  exemptions: ManualExemptionInput[];
  // Flags
  holiday_registration: boolean;
  // Parties
  parties: ManualPartyInput[];
}

export interface RuleEvaluationResult {
  triggered_rules: RuleHit[];
  leakage_signals: LeakageSignal[];
  risk_score: number;
  risk_level: RiskLevel;
  confidence: number;
  impact_amount_inr: number;
  gap_inr: number;
  payable_total_inr: number;
}
