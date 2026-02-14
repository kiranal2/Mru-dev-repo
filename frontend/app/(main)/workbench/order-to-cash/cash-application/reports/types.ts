export type TimeRange = "Today" | "Week" | "Month";

export type StatusBucket =
  | "AUTO_MATCHED"
  | "EXCEPTION"
  | "PENDING_POST"
  | "SETTLEMENT_PENDING"
  | "POSTED";

export type ReportPayment = {
  payment_id: string;
  received_date: string;
  amount: number;
  status_bucket: StatusBucket;
  posted_flag: boolean;
  posted_date?: string;
  exception_reason?: string;
  pending_post_state?: string;
  je_required: boolean;
  je_type?: string;
  assigned_to?: string;
  sla_age_hours: number;
  sla_breached: boolean;
  remittance_present: boolean;
  remittance_parse_error: boolean;
  netsuite_sync_risk: boolean;
};

export type Summary = {
  totalAmount: number;
  totalCount: number;
  postedAmount: number;
  postedCount: number;
  pendingAmount: number;
  pendingCount: number;
};

export type ProcessingBucket = {
  key: string;
  label: string;
  count: number;
  amount: number;
  share: number;
};

export type KpiSubRow = {
  avgTime: number;
  medianTime: number;
  slaBreaches: number;
  autoMatchRate: number;
  jeVolume: number;
  remittanceCoverage: number;
  settlementPending: number;
};

export type InsightStrip = {
  blocker: string;
  aging: string;
  quality: string;
};

export type TrendSeries = {
  labels: string[];
  received: number[];
  posted: number[];
  pending: number[];
  tooltip: Array<{
    label: string;
    received: number;
    posted: number;
    pending: number;
    count: number;
  }>;
};

export type FunnelBucket = {
  label: string;
  key: StatusBucket;
  value: number;
  percent: number;
};

export type DriverBreakdownItem = {
  driver: string;
  count: number;
  amount: number;
  avgAge: number;
  topAnalyst: string;
  percentPending: number;
  slaRisk: string;
};

export type ExceptionParetoItem = DriverBreakdownItem & {
  cumulativePercent: number;
  percent: number;
};

export type AgingBucket = {
  label: string;
  min: number;
  max: number;
  byStream: {
    Exceptions: number;
    Pending: number;
    Settlement: number;
  };
  total: number;
};

export type AnalystWorkloadItem = {
  analyst: string;
  assigned: number;
  completed: number;
  breaches: number;
  avgHours: number;
  inQueue: number;
  pendingAmount: number;
  autoCleared: number;
  manualActions: number;
  jeTasks: number;
  remittanceRequests: number;
  utilization: number;
};

export type AnalystThroughput = {
  labels: string[];
  series: Array<{ posted: number; resolved: number; escalated: number }>;
  max: number;
};
