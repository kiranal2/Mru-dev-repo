import type { ReportPayment, StatusBucket, TimeRange } from "./types";

export const TIME_RANGES: TimeRange[] = ["Today", "Week", "Month"];

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatHours = (hours: number) => `${hours.toFixed(1)} hrs`;

const makeDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  date.setHours(9, 0, 0, 0);
  return date.toISOString().split("T")[0];
};

export const generateReportPayments = (): ReportPayment[] => {
  const reasons = [
    "Missing Remittance",
    "JE Required",
    "Amount Mismatch",
    "Duplicate Suspected",
    "Settlement Pending",
    "NetSuite Sync Pending",
    "Other",
  ];
  const analysts = [
    "Sarah Chen",
    "Michael Roberts",
    "Jessica Martinez",
    "David Kim",
    "Emily Taylor",
  ];
  const records: ReportPayment[] = [];

  for (let i = 0; i < 36; i += 1) {
    const offset = i % 20;
    const amount = 12000 + ((i * 3700) % 85000);
    const statusBucket: StatusBucket =
      i % 9 === 0
        ? "SETTLEMENT_PENDING"
        : i % 7 === 0
          ? "PENDING_POST"
          : i % 5 === 0
            ? "EXCEPTION"
            : i % 4 === 0
              ? "POSTED"
              : "AUTO_MATCHED";
    const postedFlag = statusBucket === "POSTED" || statusBucket === "AUTO_MATCHED";
    const postedDate = postedFlag ? makeDate(Math.max(0, offset - 1)) : undefined;
    const exceptionReason = statusBucket === "EXCEPTION" ? reasons[i % reasons.length] : undefined;
    const pendingPostState =
      statusBucket === "PENDING_POST"
        ? i % 2 === 0
          ? "JE_APPROVAL_PENDING"
          : "SYNC_PENDING"
        : undefined;
    const jeRequired =
      statusBucket === "PENDING_POST" || (statusBucket === "EXCEPTION" && i % 3 === 0);
    const slaAgeHours = 4 + ((i * 3) % 60);
    const slaBreached = slaAgeHours > 48;
    const remittancePresent = i % 6 !== 0;
    const remittanceParseError = i % 17 === 0;
    const netsuiteSyncRisk = i % 11 === 0;
    const assignedTo = i % 4 === 0 ? analysts[i % analysts.length] : undefined;

    records.push({
      payment_id: `PMT-REP-${1000 + i}`,
      received_date: makeDate(offset),
      amount,
      status_bucket: statusBucket,
      posted_flag: postedFlag,
      posted_date: postedDate,
      exception_reason: exceptionReason,
      pending_post_state: pendingPostState,
      je_required: jeRequired,
      je_type: jeRequired ? (i % 2 === 0 ? "Intercompany" : "Manual JE") : undefined,
      assigned_to: assignedTo,
      sla_age_hours: slaAgeHours,
      sla_breached: slaBreached,
      remittance_present: remittancePresent,
      remittance_parse_error: remittanceParseError,
      netsuite_sync_risk: netsuiteSyncRisk,
    });
  }

  return records;
};

export const getQueueLink = (driver: string) => {
  const params = new URLSearchParams();
  const map: Record<string, { segment?: string; status?: string; context?: string }> = {
    "Missing Remittance": {
      segment: "Exception",
      status: "Exception",
      context: "MissingRemittance",
    },
    "JE Required": {
      segment: "PendingToPost",
      status: "PendingToPost",
      context: "JE_APPROVAL_PENDING",
    },
    "Settlement Pending": { segment: "SettlementPending", status: "SettlementPending" },
    "NetSuite Sync Pending": {
      segment: "PendingToPost",
      status: "PendingToPost",
      context: "SYNC_PENDING",
    },
    "Amount Mismatch": { segment: "Exception", status: "Exception", context: "AmountMismatch" },
    "Duplicate Suspected": {
      segment: "Exception",
      status: "Exception",
      context: "DuplicateSuspected",
    },
    Other: { segment: "Exception", status: "Exception", context: "Other" },
  };
  const config = map[driver];
  if (config?.segment) params.set("segment", config.segment);
  if (config?.status) params.set("status", config.status);
  if (config?.context) params.set("context", config.context);
  const query = params.toString();
  return `/workbench/order-to-cash/cash-application/payments${query ? `?${query}` : ""}`;
};
