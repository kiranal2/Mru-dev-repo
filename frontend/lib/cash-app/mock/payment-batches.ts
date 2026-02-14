import type {
  Payment,
  PaymentBatch,
  BatchLineItem,
  BatchLineWorkstream,
  BatchLineReadyState,
  BatchLineBlockedReason,
  NetSuitePostResult,
} from "../types";
import { bankAccounts } from "./constants";

export const getLast4 = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const last4 = digits.slice(-4) || value.slice(-4);
  return last4.padStart(4, "0");
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1000;
  }
  return hash;
};

export const shouldSucceed = (value: string, successRate: number) => {
  const threshold = Math.round(successRate * 100);
  return hashString(value) % 100 < threshold;
};

export const pickErrorMessage = (value: string) => {
  return hashString(value) % 2 === 0 ? "Missing department dimension" : "Period locked";
};

const deriveWorkstream = (payment: Payment): BatchLineWorkstream => {
  if (payment.je_required) return "JE_REQUIRED";
  if (payment.intercompany_flag) return "INTERCOMPANY";
  if (payment.status === "Exception") return "EXCEPTION";
  return "AUTO_MATCHED";
};

const deriveReadyState = (payment: Payment): BatchLineReadyState => {
  if (payment.pending_post_state === "FAILED") return "FAILED";
  if (payment.approval_state === "APPROVED" && payment.pending_post_state === "READY") {
    return "READY";
  }
  return "BLOCKED";
};

const deriveBlockedReason = (payment: Payment): BatchLineBlockedReason => {
  switch (payment.pending_post_state) {
    case "JE_APPROVAL_PENDING":
      return "JE_APPROVAL";
    case "SYNC_PENDING":
      return "SYNC_PENDING";
    case "APPROVAL_NEEDED":
      return "EVIDENCE_REQUIRED";
    default:
      return payment.je_required ? "JE_APPROVAL" : "DIMENSIONS_MISSING";
  }
};

const createBatchLineItem = (
  payment: Payment,
  overrides: Partial<BatchLineItem> = {}
): BatchLineItem => {
  const workstream = overrides.workstream ?? deriveWorkstream(payment);
  const ready_state = overrides.ready_state ?? deriveReadyState(payment);
  const blocked_reason =
    overrides.blocked_reason ??
    (ready_state === "BLOCKED" ? deriveBlockedReason(payment) : undefined);
  const baseResult: NetSuitePostResult = {
    status:
      ready_state === "POSTED" ? "SUCCESS" : ready_state === "FAILED" ? "ERROR" : "NOT_STARTED",
    netsuite_payment_id: ready_state === "POSTED" ? `NS-PMT-${getLast4(payment.id)}` : null,
    netsuite_je_id:
      ready_state === "POSTED" && (workstream === "JE_REQUIRED" || workstream === "INTERCOMPANY")
        ? `NS-JE-${getLast4(payment.id)}`
        : null,
    error_code: ready_state === "FAILED" ? "NS_VALIDATION" : null,
    error_message: ready_state === "FAILED" ? pickErrorMessage(payment.id) : null,
    last_attempt_ts: ready_state === "FAILED" ? new Date().toISOString() : null,
  };

  return {
    payment_id: payment.id,
    payer_name: payment.payerNameRaw,
    customer_name: payment.customerName,
    amount: payment.amount,
    workstream,
    ready_state,
    blocked_reason,
    netsuite_post_result: overrides.netsuite_post_result ?? baseResult,
  };
};

export const refreshBatchMetrics = (batch: PaymentBatch): PaymentBatch => {
  const total_payments = batch.line_items.length;
  const total_amount = batch.line_items.reduce((sum, item) => sum + item.amount, 0);
  const ready_count = batch.line_items.filter((item) => item.ready_state === "READY").length;
  const blocked_count = batch.line_items.filter((item) => item.ready_state === "BLOCKED").length;
  const failed_count = batch.line_items.filter((item) => item.ready_state === "FAILED").length;
  return {
    ...batch,
    total_payments,
    total_amount,
    ready_count,
    blocked_count,
    failed_count,
  };
};

export const generateMockPaymentBatches = (payments: Payment[]): PaymentBatch[] => {
  const postedPayments = payments.filter((payment) => payment.status === "Posted");
  const pendingPayments = payments.filter((payment) => payment.status === "PendingToPost");

  const batch1Payments = postedPayments.slice(0, 8);
  const batch2Payments = postedPayments.slice(8, 23);
  const batch3Payments = pendingPayments.slice(0, 12);

  batch3Payments.forEach((payment, index) => {
    if (index < 2) {
      payment.status = "Posted";
      payment.approval_state = "APPROVED";
      payment.pending_post_state = "READY";
    } else if (index < 7) {
      payment.approval_state = "APPROVED";
      payment.pending_post_state = "READY";
      if (index === 2 || index === 5) {
        payment.je_required = true;
      }
    } else if (index < 10) {
      payment.approval_state = index === 9 ? "NEEDS_APPROVAL" : "APPROVED";
      payment.pending_post_state =
        index === 7 ? "JE_APPROVAL_PENDING" : index === 8 ? "SYNC_PENDING" : "APPROVAL_NEEDED";
      payment.je_required = index === 7;
    } else {
      payment.approval_state = "APPROVED";
      payment.pending_post_state = "FAILED";
    }
  });

  const batch1LineItems = batch1Payments.map((payment) =>
    createBatchLineItem(payment, { ready_state: "POSTED" })
  );
  const batch2LineItems = batch2Payments.map((payment) =>
    createBatchLineItem(payment, { ready_state: "POSTED" })
  );
  const batch3LineItems = batch3Payments.map((payment, index) => {
    if (index < 2) {
      return createBatchLineItem(payment, { ready_state: "POSTED" });
    }
    if (index >= 10) {
      return createBatchLineItem(payment, {
        ready_state: "FAILED",
        netsuite_post_result: {
          status: "ERROR",
          netsuite_payment_id: null,
          netsuite_je_id: null,
          error_code: "NS_VALIDATION",
          error_message: pickErrorMessage(payment.id),
          last_attempt_ts: new Date("2024-12-09T09:15:00Z").toISOString(),
        },
      });
    }
    return createBatchLineItem(payment);
  });

  const batch1: PaymentBatch = refreshBatchMetrics({
    batch_id: "BATCH-001",
    status: "POSTED",
    posting_date: "2024-12-15",
    created_at: "2024-12-14T08:30:00Z",
    created_by: "Sarah Chen",
    posted_at: "2024-12-15T09:10:00Z",
    posted_by: "Sarah Chen",
    bank_account: bankAccounts[0],
    entity: "US01",
    currency: "USD",
    total_payments: 0,
    total_amount: 0,
    netsuite_sync_health: "Healthy",
    ready_count: 0,
    blocked_count: 0,
    failed_count: 0,
    line_items: batch1LineItems,
    audit_timeline: [
      {
        event: "Batch Created",
        detail: "8 payments staged for posting",
        actor: "Sarah Chen",
        ts: "2024-12-14T08:30:00Z",
      },
      {
        event: "Status Changed",
        detail: "Status changed to Ready",
        actor: "System",
        ts: "2024-12-14T09:05:00Z",
      },
      {
        event: "Posting Started",
        detail: "Posting initiated from Payment Batches",
        actor: "System",
        ts: "2024-12-15T09:00:00Z",
      },
      {
        event: "Posting Completed",
        detail: "8 posted, 0 failed",
        actor: "System",
        ts: "2024-12-15T09:10:00Z",
      },
    ],
  });

  const batch2: PaymentBatch = refreshBatchMetrics({
    batch_id: "BATCH-002",
    status: "POSTED",
    posting_date: "2024-12-12",
    created_at: "2024-12-11T15:20:00Z",
    created_by: "Michael Roberts",
    posted_at: "2024-12-12T10:12:00Z",
    posted_by: "Michael Roberts",
    bank_account: bankAccounts[1],
    entity: "US01",
    currency: "USD",
    total_payments: 0,
    total_amount: 0,
    netsuite_sync_health: "Healthy",
    ready_count: 0,
    blocked_count: 0,
    failed_count: 0,
    line_items: batch2LineItems,
    audit_timeline: [
      {
        event: "Batch Created",
        detail: "15 payments staged for posting",
        actor: "Michael Roberts",
        ts: "2024-12-11T15:20:00Z",
      },
      {
        event: "Status Changed",
        detail: "Status changed to Ready",
        actor: "System",
        ts: "2024-12-11T16:05:00Z",
      },
      {
        event: "Posting Started",
        detail: "Posting initiated from Payment Batches",
        actor: "System",
        ts: "2024-12-12T10:00:00Z",
      },
      {
        event: "Posting Completed",
        detail: "15 posted, 0 failed",
        actor: "System",
        ts: "2024-12-12T10:12:00Z",
      },
    ],
  });

  const batch3: PaymentBatch = refreshBatchMetrics({
    batch_id: "BATCH-003",
    status: batch3LineItems.some((item) => item.ready_state === "FAILED") ? "PARTIAL" : "READY",
    posting_date: "2024-12-08",
    created_at: "2024-12-08T07:55:00Z",
    created_by: "Jessica Martinez",
    posted_at: null,
    posted_by: null,
    bank_account: bankAccounts[2],
    entity: "US01",
    currency: "USD",
    total_payments: 0,
    total_amount: 0,
    netsuite_sync_health: "Healthy",
    ready_count: 0,
    blocked_count: 0,
    failed_count: 0,
    line_items: batch3LineItems,
    audit_timeline: [
      {
        event: "Batch Created",
        detail: "12 payments grouped for posting",
        actor: "Jessica Martinez",
        ts: "2024-12-08T07:55:00Z",
      },
      {
        event: "Status Changed",
        detail: "Status changed to Ready",
        actor: "System",
        ts: "2024-12-08T08:10:00Z",
      },
      {
        event: "Posting Started",
        detail: "Initial posting attempt started",
        actor: "System",
        ts: "2024-12-09T09:00:00Z",
      },
      {
        event: "Posting Completed",
        detail: "2 posted, 2 failed",
        actor: "System",
        ts: "2024-12-09T09:20:00Z",
      },
    ],
  });

  return [batch1, batch2, batch3];
};
