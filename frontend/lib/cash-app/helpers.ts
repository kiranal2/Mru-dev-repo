import type {
  Payment,
  ExceptionReasonCode,
  ExceptionCoreType,
  SettlementState,
  InvoiceStatusFlag,
  CreditMemoStatusFlag,
} from "./types";

export const EXCEPTION_REASON_LABELS: Record<ExceptionReasonCode, string> = {
  MISSING_REMIT: "Missing Remit",
  SHORT_PAY: "Short Pay",
  OVER_PAY: "Over Pay",
  AMOUNT_MISMATCH: "Mismatch",
  DUPLICATE_SUSPECTED: "Suspected",
  DUPLICATE_CONFIRMED: "Confirmed",
  DUPLICATE_DISMISSED: "Dismissed",
  INVOICE_NOT_FOUND: "Invoice Not Found",
  INVOICE_CLOSED: "Invoice Closed",
  INVOICE_PAID: "Invoice Paid",
  INVALID_INVOICE: "Invalid Invoice",
  INVALID_REFERENCE: "Invalid Ref",
  AMBIGUOUS_MATCH: "Ambiguous",
  INVALID_CM: "Invalid Credit Memo",
  CM_NOT_FOUND: "CM Not Found",
  CM_ALREADY_APPLIED: "CM Already Applied",
  MULTI_ENTITY: "Multi-Entity",
  IC_SPLIT_REQUIRED: "IC Split Needed",
  SETTLEMENT_PENDING: "Pending",
  SETTLEMENT_FAILED: "Failed",
  BANK_RETURN: "Bank Return",
  ACH_FAILED: "ACH Failed",
  BAD_DEBT_RECOVERY: "Bad Debt",
  TEST_DEPOSIT: "Test Deposit",
  UNAPPLIED_CASH: "On Account",
  MANUAL_JE_REQUIRED: "Manual JE",
  REMIT_PARSE_ERROR: "Parse Error",
};

export const EXCEPTION_REASON_TO_CORE: Record<ExceptionReasonCode, ExceptionCoreType> = {
  MISSING_REMIT: "MISSING_REMIT",
  SHORT_PAY: "AMOUNT_ISSUE",
  OVER_PAY: "AMOUNT_ISSUE",
  AMOUNT_MISMATCH: "AMOUNT_ISSUE",
  DUPLICATE_SUSPECTED: "DUPLICATE",
  DUPLICATE_CONFIRMED: "DUPLICATE",
  DUPLICATE_DISMISSED: "DUPLICATE",
  INVOICE_NOT_FOUND: "INVOICE_ISSUE",
  INVOICE_CLOSED: "INVOICE_ISSUE",
  INVOICE_PAID: "INVOICE_ISSUE",
  INVALID_INVOICE: "INVOICE_ISSUE",
  INVALID_REFERENCE: "INVOICE_ISSUE",
  AMBIGUOUS_MATCH: "INVOICE_ISSUE",
  INVALID_CM: "CREDIT_ISSUE",
  CM_NOT_FOUND: "CREDIT_ISSUE",
  CM_ALREADY_APPLIED: "CREDIT_ISSUE",
  MULTI_ENTITY: "INTERCOMPANY",
  IC_SPLIT_REQUIRED: "INTERCOMPANY",
  SETTLEMENT_PENDING: "SETTLEMENT",
  SETTLEMENT_FAILED: "SETTLEMENT",
  BANK_RETURN: "SETTLEMENT",
  ACH_FAILED: "SETTLEMENT",
  BAD_DEBT_RECOVERY: "JE_NEEDED",
  TEST_DEPOSIT: "JE_NEEDED",
  UNAPPLIED_CASH: "JE_NEEDED",
  MANUAL_JE_REQUIRED: "JE_NEEDED",
  REMIT_PARSE_ERROR: "MISSING_REMIT",
};

export const EXCEPTION_TYPE_MAPPING: Record<
  NonNullable<Payment["exceptionType"]>,
  { core: ExceptionCoreType; reason: ExceptionReasonCode }
> = {
  MissingRemittance: { core: "MISSING_REMIT", reason: "MISSING_REMIT" },
  ShortPay: { core: "AMOUNT_ISSUE", reason: "SHORT_PAY" },
  OverPay: { core: "AMOUNT_ISSUE", reason: "OVER_PAY" },
  DuplicateSuspected: { core: "DUPLICATE", reason: "DUPLICATE_SUSPECTED" },
  MultiEntity: { core: "INTERCOMPANY", reason: "MULTI_ENTITY" },
  SettlementFailed: { core: "SETTLEMENT", reason: "SETTLEMENT_FAILED" },
  AmbiguousMatch: { core: "INVOICE_ISSUE", reason: "AMBIGUOUS_MATCH" },
  InvalidRef: { core: "INVOICE_ISSUE", reason: "INVALID_REFERENCE" },
  NeedsJE: { core: "JE_NEEDED", reason: "MANUAL_JE_REQUIRED" },
};

export const INVOICE_STATUS_TO_REASON: Record<InvoiceStatusFlag, ExceptionReasonCode> = {
  NOT_FOUND: "INVOICE_NOT_FOUND",
  CLOSED: "INVOICE_CLOSED",
  PAID: "INVOICE_PAID",
  INVALID: "INVALID_INVOICE",
};

export const CREDIT_MEMO_STATUS_TO_REASON: Record<CreditMemoStatusFlag, ExceptionReasonCode> = {
  INVALID_CM: "INVALID_CM",
  CM_APPLIED: "CM_ALREADY_APPLIED",
  CM_NOT_FOUND: "CM_NOT_FOUND",
};

export const deriveSettlementState = (payment: Payment): SettlementState => {
  if (payment.settlement_state) return payment.settlement_state;
  if (payment.status === "SettlementPending") return "PENDING";
  if (payment.settlement_status === "FAILED" || payment.settlementStatus === "Failed")
    return "FAILED";
  if (payment.settlement_status === "FINAL_CONFIRMED" || payment.settlementStatus === "Final")
    return "CONFIRMED";
  return "NONE";
};

export const resolveExceptionMetadata = (payment: Payment): Partial<Payment> => {
  const updates: Partial<Payment> = {};
  const settlementState = deriveSettlementState(payment);

  if (!payment.settlement_state && settlementState !== "NONE") {
    updates.settlement_state = settlementState;
  }

  if (payment.status === "Exception" && !payment.exception_resolution_state) {
    updates.exception_resolution_state = "OPEN";
  }

  if (payment.je_required !== undefined && payment.je_required_flag === undefined) {
    updates.je_required_flag = payment.je_required;
  }

  let reasonCode = (payment.exception_reason_code as ExceptionReasonCode | null) || null;
  let coreType = (payment.exception_core_type as ExceptionCoreType | null) || null;
  let reasonLabel = payment.exception_reason_label || null;

  const applyReason = (reason: ExceptionReasonCode, core: ExceptionCoreType) => {
    reasonCode = reason;
    coreType = core;
    reasonLabel = EXCEPTION_REASON_LABELS[reason];
  };

  if (!reasonCode || !coreType || !reasonLabel) {
    if (!reasonCode) {
      if (payment.parse_error_flag) {
        applyReason("REMIT_PARSE_ERROR", "MISSING_REMIT");
      } else if (payment.invoice_status_flag) {
        applyReason(INVOICE_STATUS_TO_REASON[payment.invoice_status_flag], "INVOICE_ISSUE");
      } else if (payment.credit_memo_status_flag) {
        applyReason(CREDIT_MEMO_STATUS_TO_REASON[payment.credit_memo_status_flag], "CREDIT_ISSUE");
      } else if (settlementState === "PENDING") {
        applyReason("SETTLEMENT_PENDING", "SETTLEMENT");
      } else if (payment.ach_return_flag) {
        applyReason("ACH_FAILED", "SETTLEMENT");
      } else if (payment.settlementReason === "Reversed") {
        applyReason("BANK_RETURN", "SETTLEMENT");
      } else if (settlementState === "FAILED") {
        applyReason("SETTLEMENT_FAILED", "SETTLEMENT");
      } else if (payment.on_account_flag) {
        applyReason("UNAPPLIED_CASH", "JE_NEEDED");
      } else if (payment.je_required_flag || payment.je_required) {
        applyReason("MANUAL_JE_REQUIRED", "JE_NEEDED");
      } else if (payment.exceptionType) {
        const mapped = EXCEPTION_TYPE_MAPPING[payment.exceptionType];
        if (mapped) {
          applyReason(mapped.reason, mapped.core);
        }
      }
    } else {
      const inferredCore = EXCEPTION_REASON_TO_CORE[reasonCode];
      if (!coreType && inferredCore) {
        coreType = inferredCore;
      }
      if (!reasonLabel) {
        reasonLabel = EXCEPTION_REASON_LABELS[reasonCode] || reasonCode;
      }
    }
  }

  if (reasonCode && payment.exception_reason_code !== reasonCode) {
    updates.exception_reason_code = reasonCode;
  }
  if (reasonLabel && payment.exception_reason_label !== reasonLabel) {
    updates.exception_reason_label = reasonLabel;
  }
  if (coreType && payment.exception_core_type !== coreType) {
    updates.exception_core_type = coreType;
  }
  if (!payment.settlement_state && reasonCode) {
    if (reasonCode === "SETTLEMENT_PENDING") {
      updates.settlement_state = "PENDING";
    } else if (
      reasonCode === "SETTLEMENT_FAILED" ||
      reasonCode === "ACH_FAILED" ||
      reasonCode === "BANK_RETURN"
    ) {
      updates.settlement_state = "FAILED";
    }
  }

  return updates;
};
