"use client";

import {
  Payment,
  Remittance,
  ARItem,
  CashAppStats,
  ActivityLogEntry,
  ActivityTimelineEntry,
  IntercompanyJEDraft,
  CashAppDataHealth,
  SyncRun,
  DataFreshness,
  IntegrityGuard,
  SyncEntityType,
  IntegrityGuardReason,
  IntegrityGuardReasonCode,
  MailboxConfig,
  IngestionRun,
  RawEmailMessage,
  RawAttachment,
  BankFeedConfig,
  BankFeedRun,
  BankTransaction,
  LockboxItem,
  SettlementEvent,
  PostRun,
  MatchBankDataExport,
  PaymentExplainability,
  EvidenceItem,
  PaymentRouting,
  PaymentBatch,
  BatchLineItem,
  BatchLineReadyState,
  BatchLineBlockedReason,
  BatchLineWorkstream,
  NetSuitePostResult,
  EmailMailbox,
  EmailStatus,
  EmailAttachment,
  EmailExtraction,
  RemittanceRecord,
  RemittanceValidationStatus,
  ParseStatus,
  BankLine,
  ExceptionCoreType,
  ExceptionReasonCode,
  SettlementState,
  InvoiceStatusFlag,
  CreditMemoStatusFlag,
} from "./cash-app-types";

const companies = [
  "Amazon Web Services",
  "Microsoft Corporation",
  "Google LLC",
  "Apple Inc.",
  "Salesforce",
  "Oracle Corporation",
  "SAP America",
  "Adobe Systems",
  "IBM Corporation",
  "Dell Technologies",
  "HP Inc.",
  "Cisco Systems",
  "Intel Corporation",
  "NVIDIA Corporation",
  "AMD",
  "Qualcomm",
  "Tesla Inc.",
  "General Electric",
  "Boeing Company",
  "Lockheed Martin",
  "Northrop Grumman",
  "Raytheon Technologies",
  "Honeywell International",
  "Caterpillar Inc.",
  "3M Company",
  "Johnson & Johnson",
  "Pfizer Inc.",
  "Merck & Co.",
  "Abbott Laboratories",
  "Medtronic",
];

const bankAccounts = [
  "US Bank - *****4521",
  "Chase - *****7892",
  "Wells Fargo - *****3456",
  "Bank of America - *****9012",
  "Citibank - *****6789",
];

const users = ["Sarah Chen", "Michael Roberts", "Jessica Martinez", "David Kim", "Emily Taylor"];

const MATCH_CONFIDENCE_AUTOMATCH = 90;
const MATCH_CONFIDENCE_REVIEW = 70;

const EXCEPTION_REASON_LABELS: Record<ExceptionReasonCode, string> = {
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

const EXCEPTION_REASON_TO_CORE: Record<ExceptionReasonCode, ExceptionCoreType> = {
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

const EXCEPTION_TYPE_MAPPING: Record<
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

const INVOICE_STATUS_TO_REASON: Record<InvoiceStatusFlag, ExceptionReasonCode> = {
  NOT_FOUND: "INVOICE_NOT_FOUND",
  CLOSED: "INVOICE_CLOSED",
  PAID: "INVOICE_PAID",
  INVALID: "INVALID_INVOICE",
};

const CREDIT_MEMO_STATUS_TO_REASON: Record<CreditMemoStatusFlag, ExceptionReasonCode> = {
  INVALID_CM: "INVALID_CM",
  CM_APPLIED: "CM_ALREADY_APPLIED",
  CM_NOT_FOUND: "CM_NOT_FOUND",
};

const deriveSettlementState = (payment: Payment): SettlementState => {
  if (payment.settlement_state) return payment.settlement_state;
  if (payment.status === "SettlementPending") return "PENDING";
  if (payment.settlement_status === "FAILED" || payment.settlementStatus === "Failed")
    return "FAILED";
  if (payment.settlement_status === "FINAL_CONFIRMED" || payment.settlementStatus === "Final")
    return "CONFIRMED";
  return "NONE";
};

const resolveExceptionMetadata = (payment: Payment): Partial<Payment> => {
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

function generateMockPayments(): Payment[] {
  const payments: Payment[] = [];
  const statuses: Array<Payment["status"]> = [
    "AutoMatched",
    "AutoMatched",
    "AutoMatched",
    "AutoMatched",
    "AutoMatched",
    "AutoMatched",
    "AutoMatched",
    "AutoMatched",
    "AutoMatched",
    "Exception",
    "Exception",
    "Exception",
    "Exception",
    "Exception",
    "New",
    "New",
    "New",
    "PendingToPost",
    "PendingToPost",
    "PendingToPost",
    "SettlementPending",
    "SettlementPending",
    "SettlementPending",
    "Posted",
    "Posted",
    "Posted",
    "Posted",
    "Posted",
    "NonAR",
    "NonAR",
  ];

  const exceptionTypes: Array<Payment["exceptionType"]> = [
    "MissingRemittance",
    "ShortPay",
    "DuplicateSuspected",
    "MultiEntity",
  ];

  const remittanceSources: Array<Payment["remittanceSource"]> = [
    "Email",
    "Bank Portal",
    "EDI",
    "API",
    "Manual Upload",
  ];

  const methods: Array<Payment["method"]> = ["ACH", "Wire", "Check", "Credit Card"];

  for (let i = 0; i < 30; i++) {
    const status = statuses[i];
    const isException = status === "Exception";
    const isAutoMatched = status === "AutoMatched";
    const company = companies[i % companies.length];
    const amount = Math.floor(Math.random() * 500000) + 5000;
    const date = new Date(2024, 11, Math.floor(Math.random() * 28) + 1);
    const hasRemittance = !isException || Math.random() > 0.5;
    const receivedAt = new Date(date);
    receivedAt.setHours(8 + (i % 10), 15 + (i % 40), 0, 0);

    let matchType: "EXACT" | "TOLERANCE" | "INTERCOMPANY" | undefined;
    let toleranceApplied = false;
    let intercompanyFlag = false;
    let jeRequired = false;
    let paymentWarnings: string[] = [];

    if (isAutoMatched) {
      const matchTypeRandom = Math.random();
      if (matchTypeRandom == 0.0) {
        matchType = "EXACT";
      } else if (matchTypeRandom < 0.85) {
        matchType = "TOLERANCE";
        toleranceApplied = true;
        if (Math.random() > 0.7) {
          paymentWarnings.push("Tolerance applied: within 2% threshold");
        }
      } else {
        matchType = "INTERCOMPANY";
        intercompanyFlag = true;
        jeRequired = true;
        paymentWarnings.push("Intercompany transaction detected");
      }
    }

    const activityLog = generateActivityLog(i, status);
    const hasUserAction = activityLog.some((entry) => entry.user !== "System");
    const processingCategory =
      status === "NonAR"
        ? "NON_AR"
        : status === "AutoMatched" && !hasUserAction
          ? "AUTO"
          : jeRequired || hasUserAction
            ? "MANUAL"
            : "AUTO";
    const manualReason =
      processingCategory === "MANUAL"
        ? jeRequired
          ? "JE_CREATED"
          : isException
            ? "MATCH_EDITED"
            : i % 3 === 0
              ? "EMAIL_SENT"
              : "OTHER"
        : null;
    const exceptionMapping =
      isException && exceptionTypes[i % exceptionTypes.length]
        ? EXCEPTION_TYPE_MAPPING[
            exceptionTypes[i % exceptionTypes.length] as NonNullable<Payment["exceptionType"]>
          ]
        : null;
    const pendingPostStates: Array<NonNullable<Payment["pending_post_state"]>> = [
      "READY",
      "APPROVAL_NEEDED",
      "JE_APPROVAL_PENDING",
      "SYNC_PENDING",
      "FAILED",
    ];
    const pendingPostState =
      status === "PendingToPost" ? pendingPostStates[i % pendingPostStates.length] : undefined;
    const postedStatus =
      status === "Posted" ? "POSTED" : pendingPostState === "FAILED" ? "POST_FAILED" : "NOT_POSTED";
    const postedAt =
      postedStatus === "POSTED" ? new Date(date.getTime() + 86400000).toISOString() : null;
    const settlementStatus =
      status === "SettlementPending"
        ? i % 3 === 0
          ? "PRELIM"
          : i % 3 === 1
            ? "FAILED"
            : "FINAL_CONFIRMED"
        : null;
    const slaAgeHours =
      isException || status === "PendingToPost" ? Math.round(6 + Math.random() * 72) : null;
    const bankTxnRef = Math.random() > 0.18 ? `TR-${100000 + i}` : null;
    const bankAccountToken = `****${(4520 + i).toString().slice(-4)}`;
    const clearingGl = Math.random() > 0.12 ? `1010-CLR-${(i % 4) + 1}` : null;
    const bankMatchReady =
      postedStatus === "POSTED" && !!bankTxnRef && !!clearingGl && settlementStatus !== "FAILED";
    const bankMatchStatus =
      postedStatus !== "POSTED" ? "PENDING" : bankMatchReady ? "READY" : "RISK";
    const bankMatchRiskReason =
      bankMatchStatus === "READY"
        ? null
        : postedStatus !== "POSTED"
          ? "Not posted yet"
          : !bankTxnRef
            ? "Missing trace ID"
            : !clearingGl
              ? "Wrong clearing GL"
              : settlementStatus === "FAILED"
                ? "Date mismatch risk"
                : "Amount mismatch";

    const payment: Payment = {
      id: `pay-${1000 + i}`,
      paymentNumber: `PMT-2024-${(10000 + i).toString()}`,
      paymentHeaderId: `HDR-${(50000 + i).toString()}`,
      amount,
      date: date.toISOString().split("T")[0],
      bankAccount: bankAccounts[i % bankAccounts.length],
      method: methods[i % methods.length],
      payerNameRaw: company,
      memoReferenceRaw: `Invoice payment ${Math.floor(Math.random() * 10000)}`,
      customerId: `CUST-${(1000 + i).toString()}`,
      customerName: company,
      customerNumber: `C${(10000 + i).toString()}`,
      identificationCriteria: Math.random() > 0.5 ? "Customer Name" : "Customer Number",
      remittanceSource: hasRemittance ? remittanceSources[i % remittanceSources.length] : "None",
      originalPaymentFileUrl: `/files/payments/payment_${1000 + i}.xml`,
      linkedRemittanceFileUrl: hasRemittance ? `/files/remittances/rem_${1000 + i}.pdf` : undefined,
      status,
      exceptionType: isException ? exceptionTypes[i % exceptionTypes.length] : null,
      confidenceScore: isException
        ? Math.floor(Math.random() * 50) + 20
        : isAutoMatched && matchType === "EXACT"
          ? Math.floor(Math.random() * 5) + 95
          : Math.floor(Math.random() * 20) + 75,
      transformedLines: generateTransformedLines(i, amount),
      activityLog,
      assignedTo: isException ? users[i % users.length] : undefined,
      assigned_to: isException ? users[i % users.length] : undefined,
      tags: isException ? ["High Priority"] : [],
      createdAt: new Date(date.getTime() - 86400000).toISOString(),
      updatedAt: date.toISOString(),
      suggestedAction: getSuggestedAction(status, isException),
      aiRecommendation: getAIRecommendation(status, isException),
      aiRationale: getAIRationale(status, isException),
      warnings: isException
        ? getWarnings(exceptionTypes[i % exceptionTypes.length])
        : paymentWarnings,
      match_type: matchType,
      tolerance_applied: toleranceApplied,
      intercompany_flag: intercompanyFlag,
      je_required: jeRequired,
      work_status: status,
      explainability: generateExplainability(
        status,
        matchType,
        isException ? exceptionTypes[i % exceptionTypes.length] : null,
        i,
        hasRemittance
      ),
      routing: generateRouting(
        status,
        matchType,
        isException ? exceptionTypes[i % exceptionTypes.length] : null,
        amount
      ),
      processing_category: processingCategory,
      manual_reason: manualReason,
      received_at: receivedAt.toISOString(),
      posted_status: postedStatus,
      posted_at: postedAt,
      pending_post_state: pendingPostState,
      settlement_status: settlementStatus,
      sla_age_hours: slaAgeHours,
      exception_core_type: exceptionMapping?.core || null,
      exception_reason_code: exceptionMapping?.reason || null,
      exception_reason_label: exceptionMapping?.reason
        ? EXCEPTION_REASON_LABELS[exceptionMapping.reason]
        : null,
      exception_resolution_state: isException ? "OPEN" : undefined,
      bank_txn_ref: bankTxnRef,
      bank_account_token: bankAccountToken,
      clearing_gl: clearingGl,
      bank_match_ready: bankMatchReady,
      bank_match_status: bankMatchStatus,
      bank_match_risk_reason: bankMatchRiskReason,
    };

    payments.push(payment);
  }

  return payments;
}

function generateTransformedLines(index: number, totalAmount: number): any[] {
  const lineCount = Math.floor(Math.random() * 3) + 1;
  const lines = [];
  const amountPerLine = Math.floor(totalAmount / lineCount);

  for (let i = 0; i < lineCount; i++) {
    const discount = Math.floor(Math.random() * 500);
    lines.push({
      id: `line-${index}-${i}`,
      erpReference: `INV-${(20000 + index * 10 + i).toString()}`,
      referenceField: `REF-${Math.floor(Math.random() * 100000)}`,
      discountAmount: discount,
      paymentAmount: amountPerLine - discount,
      reasonCode: discount > 0 ? "DISC" : "FULL",
      reasonDescription: discount > 0 ? "Early Payment Discount" : "Full Payment",
      customerNumber: `C${(10000 + index).toString()}`,
    });
  }

  return lines;
}

function generateActivityLog(index: number, status: Payment["status"]): any[] {
  const log = [
    {
      id: `log-${index}-1`,
      timestamp: new Date(2024, 11, 15, 9, 30).toISOString(),
      user: "System",
      action: "Payment Received",
      details: "Payment file processed from bank feed",
    },
    {
      id: `log-${index}-2`,
      timestamp: new Date(2024, 11, 15, 9, 35).toISOString(),
      user: "System",
      action: "Auto-Match Attempted",
      details: "Matching engine processed payment",
    },
  ];

  if (status === "Exception") {
    log.push({
      id: `log-${index}-3`,
      timestamp: new Date(2024, 11, 15, 10, 0).toISOString(),
      user: "System",
      action: "Exception Flagged",
      details: "Payment requires manual review",
    });
    log.push({
      id: `log-${index}-4`,
      timestamp: new Date(2024, 11, 15, 14, 30).toISOString(),
      user: users[index % users.length],
      action: "Assigned",
      details: `Assigned to ${users[index % users.length]}`,
    });
  } else if (status === "AutoMatched" || status === "PendingToPost") {
    log.push({
      id: `log-${index}-3`,
      timestamp: new Date(2024, 11, 15, 9, 36).toISOString(),
      user: "System",
      action: "Auto-Matched",
      details: "Successfully matched to invoices",
    });
  }

  return log;
}

function getSuggestedAction(status: Payment["status"], isException: boolean): string {
  if (status === "AutoMatched") return "Approve & Post";
  if (status === "Exception") return "Review & Resolve";
  if (status === "PendingToPost") return "Post to ERP";
  if (status === "New") return "Process";
  return "Review";
}

function getAIRecommendation(status: Payment["status"], isException: boolean): string {
  if (status === "AutoMatched") {
    return "High confidence match. Recommend immediate approval and posting to ERP.";
  }
  if (isException) {
    return "Exception detected. Manual review required before posting.";
  }
  return "Payment ready for review and processing.";
}

function getAIRationale(status: Payment["status"], isException: boolean): string {
  if (status === "AutoMatched") {
    return "Matched based on exact amount, customer identification, and invoice references. All validation checks passed.";
  }
  if (isException) {
    return "Unable to auto-match due to missing remittance data or discrepancies in payment amount.";
  }
  return "Standard processing workflow applies.";
}

function getWarnings(exceptionType: Payment["exceptionType"]): string[] {
  const warnings: Record<string, string[]> = {
    MissingRemittance: ["No remittance advice attached", "Unable to identify invoices"],
    ShortPay: ["Payment amount less than expected", "Possible dispute or discount"],
    DuplicateSuspected: ["Similar payment detected", "Verify before posting"],
    MultiEntity: ["Payment spans multiple entities", "Split posting required"],
  };
  return exceptionType ? warnings[exceptionType] || [] : [];
}

function generateExplainability(
  status: Payment["status"],
  matchType: "EXACT" | "TOLERANCE" | "INTERCOMPANY" | undefined,
  exceptionType: Payment["exceptionType"],
  index: number,
  hasRemittance: boolean
): PaymentExplainability {
  if (status === "AutoMatched" && matchType === "EXACT") {
    return {
      primary_reason_code: "EXACT_MATCH",
      primary_reason_label: "Exact Match",
      reason_codes: ["AMT_EXACT", "REM_INV_REF_FOUND", "JE_NOT_REQUIRED"],
      evidence_items: [
        {
          text: `Payment amount equals invoice sum ($${Math.floor(Math.random() * 100000) + 10000})`,
          source: "Bank",
        },
        {
          text: `Invoice refs found: INV-${20000 + index}, INV-${20001 + index}`,
          source: "Remit",
        },
        {
          text: "Invoices open at time of match",
          source: "NetSuite",
        },
      ],
      artifact_links: {
        bank_line_url: `/artifacts/bank/${1000 + index}`,
        remittance_url: hasRemittance ? `/artifacts/remit/${1000 + index}` : undefined,
        invoice_set_url: `/artifacts/invoices/${1000 + index}`,
      },
    };
  }

  if (status === "AutoMatched" && matchType === "TOLERANCE") {
    return {
      primary_reason_code: "WITHIN_TOLERANCE",
      primary_reason_label: "Within Tolerance",
      reason_codes: ["AMT_TOLERANCE", "REM_INV_REF_FOUND", "JE_NOT_REQUIRED"],
      evidence_items: [
        {
          text: "Payment within 2% tolerance threshold",
          source: "System",
        },
        {
          text: `Variance: $${Math.floor(Math.random() * 500) + 50} (1.${Math.floor(Math.random() * 9)}%)`,
          source: "System",
        },
        {
          text: `Invoice refs matched from remittance`,
          source: "Remit",
        },
      ],
      artifact_links: {
        bank_line_url: `/artifacts/bank/${1000 + index}`,
        remittance_url: hasRemittance ? `/artifacts/remit/${1000 + index}` : undefined,
        invoice_set_url: `/artifacts/invoices/${1000 + index}`,
      },
    };
  }

  if (status === "AutoMatched" && matchType === "INTERCOMPANY") {
    return {
      primary_reason_code: "INTERCOMPANY_DETECTED",
      primary_reason_label: "Intercompany Detected",
      reason_codes: ["IC_MULTI_ENTITY", "AMT_EXACT", "JE_REQUIRED"],
      evidence_items: [
        {
          text: "Subsidiaries differ: US + CA",
          source: "NetSuite",
        },
        {
          text: "Intercompany JE drafted",
          source: "System",
        },
        {
          text: `Payment amount matches invoice total`,
          source: "Bank",
        },
      ],
      artifact_links: {
        bank_line_url: `/artifacts/bank/${1000 + index}`,
        remittance_url: hasRemittance ? `/artifacts/remit/${1000 + index}` : undefined,
        invoice_set_url: `/artifacts/invoices/${1000 + index}`,
        je_draft_url: `/artifacts/je/${1000 + index}`,
      },
    };
  }

  if (status === "Exception" && exceptionType === "MissingRemittance") {
    return {
      primary_reason_code: "EXC_MISSING_REMIT",
      primary_reason_label: "Missing Remit",
      reason_codes: ["EXC_MISSING_REMIT"],
      evidence_items: [
        {
          text: "No remit linked after 24h",
          source: "System",
        },
        {
          text: "Payment captured from bank feed",
          source: "Bank",
        },
      ],
      artifact_links: {
        bank_line_url: `/artifacts/bank/${1000 + index}`,
      },
    };
  }

  if (status === "Exception" && exceptionType === "ShortPay") {
    return {
      primary_reason_code: "EXC_AMOUNT_MISMATCH",
      primary_reason_label: "Amount Mismatch",
      reason_codes: ["EXC_SHORT_PAY"],
      evidence_items: [
        {
          text: `Payment short by $${Math.floor(Math.random() * 5000) + 100}`,
          source: "System",
        },
        {
          text: "Invoice amounts exceed payment",
          source: "NetSuite",
        },
      ],
      artifact_links: {
        bank_line_url: `/artifacts/bank/${1000 + index}`,
        remittance_url: hasRemittance ? `/artifacts/remit/${1000 + index}` : undefined,
        invoice_set_url: `/artifacts/invoices/${1000 + index}`,
      },
    };
  }

  return {
    primary_reason_code: "STANDARD",
    primary_reason_label: "Standard Processing",
    reason_codes: [],
    evidence_items: [
      {
        text: "Payment received from bank",
        source: "Bank",
      },
    ],
    artifact_links: {
      bank_line_url: `/artifacts/bank/${1000 + index}`,
    },
  };
}

function generateRouting(
  status: Payment["status"],
  matchType: "EXACT" | "TOLERANCE" | "INTERCOMPANY" | undefined,
  exceptionType: Payment["exceptionType"],
  amount: number
): PaymentRouting {
  const isCritical = amount > 100000;

  if (status === "AutoMatched" && matchType === "EXACT") {
    return {
      routing_stream: "AutoMatched",
      routing_subfilter: "Exact",
      routing_rules_applied: [
        "AMT_EXACT → Auto-Matched",
        "CONFIDENCE_HIGH → Exact sub-filter",
        "JE_NOT_REQUIRED → Ready to post",
      ],
    };
  }

  if (status === "AutoMatched" && matchType === "TOLERANCE") {
    return {
      routing_stream: "AutoMatched",
      routing_subfilter: "Tolerance",
      routing_rules_applied: [
        "AMT_TOLERANCE → Auto-Matched",
        "VARIANCE_2PCT → Tolerance sub-filter",
        "JE_NOT_REQUIRED → Ready to post",
      ],
    };
  }

  if (status === "AutoMatched" && matchType === "INTERCOMPANY") {
    return {
      routing_stream: "AutoMatched",
      routing_subfilter: "Intercompany",
      routing_rules_applied: [
        "IC_MULTI_ENTITY → Auto-Matched",
        "MULTI_SUB → Intercompany sub-filter",
        "JE_REQUIRED → Requires manual approval",
      ],
    };
  }

  if (status === "Exception" && exceptionType === "MissingRemittance") {
    return {
      routing_stream: "Exceptions",
      routing_subfilter: "Missing Remittance",
      routing_rules_applied: [
        "EXC_MISSING_REMIT → Exceptions",
        "NO_REMIT_24H → Missing Remittance sub-filter",
        "REQUIRES_INVESTIGATION → Manual review",
      ],
    };
  }

  if (status === "Exception" && exceptionType === "ShortPay") {
    return {
      routing_stream: "Exceptions",
      routing_subfilter: "Amount Mismatch",
      routing_rules_applied: [
        "EXC_SHORT_PAY → Exceptions",
        "AMT_DIFF → Amount Mismatch sub-filter",
        "REQUIRES_INVESTIGATION → Manual review",
      ],
    };
  }

  if (status === "Exception" && exceptionType === "MultiEntity") {
    return {
      routing_stream: "Exceptions",
      routing_subfilter: "Multi Entity",
      routing_rules_applied: [
        "EXC_MULTI_ENTITY → Exceptions",
        "MULTI_SUB_DETECTED → Multi Entity sub-filter",
        "REQUIRES_INVESTIGATION → Manual review",
      ],
    };
  }

  if (status === "PendingToPost") {
    return {
      routing_stream: "PendingToPost",
      routing_subfilter: "Ready",
      routing_rules_applied: [
        "APPROVED → Pending to Post",
        "READY_TO_POST → Ready sub-filter",
        "AWAITING_ERP_POST → Post queue",
      ],
    };
  }

  if (isCritical) {
    return {
      routing_stream: "Critical",
      routing_subfilter: "High Value",
      routing_rules_applied: [
        "AMT_100K_PLUS → Critical",
        "HIGH_VALUE → High Value sub-filter",
        "PRIORITY_REVIEW → Expedited processing",
      ],
    };
  }

  return {
    routing_stream: "AutoMatched",
    routing_subfilter: null,
    routing_rules_applied: ["STANDARD_PROCESSING → Auto-Matched", "DEFAULT_ROUTING → Main queue"],
  };
}

function generateMockRemittances(): Remittance[] {
  const remittances: Remittance[] = [];

  for (let i = 0; i < 15; i++) {
    const extractStatus =
      i % 5 === 0
        ? "NOT_EXTRACTED"
        : i % 5 === 1
          ? "EXTRACTED"
          : i % 5 === 2
            ? "PARTIAL"
            : "FAILED";
    const linkStatus = i % 4 === 0 ? "UNLINKED" : i % 4 === 1 ? "MULTI_MATCH" : "LINKED";
    const invoicesFound = extractStatus === "NOT_EXTRACTED" ? 0 : (i % 4) + 1;
    const confidence = extractStatus === "NOT_EXTRACTED" ? null : 62 + ((i * 7) % 34);
    const keyReference =
      i % 3 === 0 ? `WIRE-${90010 + i}` : i % 3 === 1 ? `CHK-${10300 + i}` : `WT${24000 + i}`;
    const invoiceLines = Array.from({ length: Math.max(1, invoicesFound) }).map((_, idx) => ({
      invoice_number: `INV-${21000 + i * 4 + idx}`,
      invoice_amount: 12000 + idx * 2500,
      paid_amount: 12000 + idx * 2500,
      discount: idx === 0 && extractStatus === "PARTIAL" ? 320 : 0,
      credit_memo_ref: idx === 2 ? `CM-${1200 + i}` : undefined,
      notes: idx === 1 ? "Short paid line item" : undefined,
    }));

    remittances.push({
      id: `rem-${2000 + i}`,
      remittanceNumber: `REM-2024-${(20000 + i).toString()}`,
      source: i % 3 === 0 ? "Email" : i % 3 === 1 ? "EDI" : "Bank Portal",
      receivedDate: new Date(2024, 11, Math.floor(Math.random() * 28) + 1)
        .toISOString()
        .split("T")[0],
      customerName: companies[i % companies.length],
      customerId: `CUST-${(1000 + i).toString()}`,
      totalAmount: Math.floor(Math.random() * 500000) + 5000,
      status: i % 5 === 0 ? "Unmatched" : "Matched",
      emailSubject: i % 3 === 0 ? `Payment Advice - Invoice ${20000 + i}` : undefined,
      extract_status: extractStatus,
      link_status: linkStatus,
      confidence_score: confidence,
      key_reference: keyReference,
      invoices_found_count: invoicesFound,
      extract_reason:
        extractStatus === "FAILED"
          ? "PDF unreadable"
          : extractStatus === "PARTIAL"
            ? "No invoice numbers found"
            : undefined,
      link_reason:
        linkStatus === "UNLINKED"
          ? "Missing payment reference"
          : linkStatus === "MULTI_MATCH"
            ? "Multiple payments match amount"
            : undefined,
      linked_payment_id: linkStatus === "LINKED" ? `PMT-2026-00${220 + i}` : null,
      email_metadata:
        i % 3 === 0
          ? {
              from: "ap@customer.com",
              to: "ar@meeru.ai",
              subject: `Remittance ${20000 + i}`,
              received_ts: new Date(2024, 11, Math.floor(Math.random() * 28) + 1).toISOString(),
              body: "Please find remittance details in the attached file.",
            }
          : undefined,
      attachments: [
        {
          name: `remittance_${20000 + i}.pdf`,
          type: "PDF",
          size: "1.2 MB",
          url: `/mock/downloads/remittances/remittance_${20000 + i}.pdf`,
        },
      ],
      extracted_fields:
        extractStatus === "NOT_EXTRACTED"
          ? undefined
          : {
              customer: companies[i % companies.length],
              payment_date: new Date(2024, 11, Math.floor(Math.random() * 28) + 1)
                .toISOString()
                .split("T")[0],
              amount: Math.floor(Math.random() * 500000) + 5000,
              currency: "USD",
              reference: keyReference,
              method: "AI",
            },
      extracted_line_items: extractStatus === "NOT_EXTRACTED" ? [] : invoiceLines,
      validation_checks:
        extractStatus === "NOT_EXTRACTED"
          ? []
          : [
              { status: "PASS", label: "Invoices exist in NetSuite" },
              {
                status: extractStatus === "PARTIAL" ? "WARN" : "PASS",
                label: extractStatus === "PARTIAL" ? "Totals match" : "Totals match",
                detail: extractStatus === "PARTIAL" ? "Difference: $320" : undefined,
              },
              {
                status: linkStatus === "MULTI_MATCH" ? "WARN" : "PASS",
                label: "Currency match",
              },
            ],
      activity_log: [
        {
          event: "Remittance Captured",
          actor: "System",
          ts: new Date(2024, 11, Math.floor(Math.random() * 28) + 1).toISOString(),
          detail: `Source: ${i % 3 === 0 ? "Email" : i % 3 === 1 ? "EDI" : "Bank Portal"}`,
        },
      ],
      createdAt: new Date(2024, 11, Math.floor(Math.random() * 28) + 1).toISOString(),
    });
  }

  return remittances;
}

function generateMockARItems(): ARItem[] {
  const items: ARItem[] = [];

  for (let i = 0; i < 40; i++) {
    items.push({
      id: `ar-${3000 + i}`,
      invoiceNumber: `INV-${(30000 + i).toString()}`,
      customerId: `CUST-${(1000 + (i % 20)).toString()}`,
      customerName: companies[i % companies.length],
      amount: Math.floor(Math.random() * 200000) + 1000,
      dueDate: new Date(2024, 11, Math.floor(Math.random() * 28) + 1).toISOString().split("T")[0],
      status: i % 4 === 0 ? "Overdue" : "Open",
      createdAt: new Date(2024, 10, Math.floor(Math.random() * 28) + 1).toISOString(),
    });
  }

  return items;
}

const ENABLE_BLOCK_POSTING_DEMO = false;

const getLast4 = (value: string) => {
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

const shouldSucceed = (value: string, successRate: number) => {
  const threshold = Math.round(successRate * 100);
  return hashString(value) % 100 < threshold;
};

const pickErrorMessage = (value: string) => {
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

const refreshBatchMetrics = (batch: PaymentBatch): PaymentBatch => {
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

const generateMockPaymentBatches = (payments: Payment[]): PaymentBatch[] => {
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

const generateMockBankLines = (payments: Payment[]): BankLine[] => {
  const lines: BankLine[] = [];
  const candidatePayments = payments.slice(0, 18);

  candidatePayments.forEach((payment, idx) => {
    const isLinked = idx % 3 !== 0;
    const bankRef = payment.bank_txn_ref || `TR-${200000 + idx}`;
    const bankAccountToken =
      payment.bank_account_token || `****${(3000 + idx).toString().slice(-4)}`;
    const status =
      isLinked && payment.posted_status === "POSTED" && payment.bank_match_ready
        ? "LINKED_POSTED"
        : isLinked && payment.posted_status !== "POSTED"
          ? "LINKED_NOT_POSTED"
          : isLinked && payment.bank_match_ready === false
            ? "RISK"
            : "UNLINKED";

    lines.push({
      bank_line_id: `BL-${9000 + idx}`,
      bank_date: payment.received_at?.split("T")[0] || payment.date,
      amount: payment.amount,
      bank_txn_ref: bankRef,
      bank_account_token: bankAccountToken,
      linked_payment_id: isLinked ? payment.id : null,
      status,
    });
  });

  for (let i = 0; i < 6; i++) {
    lines.push({
      bank_line_id: `BL-${9100 + i}`,
      bank_date: `2024-12-${10 + i}`,
      amount: Math.floor(Math.random() * 90000) + 5000,
      bank_txn_ref: `TR-${300000 + i}`,
      bank_account_token: `****${(6100 + i).toString().slice(-4)}`,
      linked_payment_id: null,
      status: "UNLINKED",
    });
  }

  return lines;
};

class CashAppStore {
  private payments: Payment[];
  private remittances: Remittance[];
  private remittanceRecords: RemittanceRecord[];
  private arItems: ARItem[];
  private mailboxConfigs: MailboxConfig[];
  private ingestionRuns: IngestionRun[];
  private rawEmailMessages: RawEmailMessage[];
  private rawAttachments: RawAttachment[];
  private bankFeedConfigs: BankFeedConfig[];
  private bankFeedRuns: BankFeedRun[];
  private bankTransactions: BankTransaction[];
  private lockboxItems: LockboxItem[];
  private settlementEvents: SettlementEvent[];
  private postRuns: PostRun[];
  private matchBankDataExports: MatchBankDataExport[];
  private bankLines: BankLine[];
  private dataHealth!: CashAppDataHealth;
  private paymentBatches: PaymentBatch[];
  private uiState: { lastPaymentId: string | null; returnTo: "QUEUE" | "PAYMENT_DETAIL" };

  constructor() {
    this.payments = generateMockPayments();
    this.remittances = generateMockRemittances();
    this.remittanceRecords = [];
    this.arItems = generateMockARItems();
    this.mailboxConfigs = [];
    this.ingestionRuns = [];
    this.rawEmailMessages = [];
    this.rawAttachments = [];
    this.bankFeedConfigs = [];
    this.bankFeedRuns = [];
    this.bankTransactions = [];
    this.lockboxItems = [];
    this.settlementEvents = [];
    this.postRuns = [];
    this.matchBankDataExports = [];
    this.bankLines = [];
    this.paymentBatches = [];
    this.uiState = { lastPaymentId: null, returnTo: "QUEUE" };

    this.appendHappyPathScenario();
    this.appendMissingRemittanceScenario();
    this.appendOverPayScenario();
    this.appendIntercompanyScenarioUS01CA01();
    this.appendMailboxIngestionPhase1();
    this.appendBankFeedSettlementPhase2();
    this.appendPhase3AutoMatchEngineAndScenarios();
    this.appendMatchingEngineCompletenessScenarios();
    this.appendPhase4PostingSimulation();
    this.appendBadDebtRecoveryScenario();
    this.appendExceptionTaxonomyScenarios();

    this.appendNetSuiteSyncHealthScenario();
    this.overrideAWSExactPayment();
    this.overrideMicrosoftTolerancePayment();
    this.normalizeExceptionMappings();
    this.paymentBatches = generateMockPaymentBatches(this.payments);
    this.bankLines = generateMockBankLines(this.payments);
  }

  /**
   * Override PMT-2024-10001 to be a Tolerance match with Microsoft Corporation
   * with early payment discounts applied across 3 invoices.
   */
  private overrideMicrosoftTolerancePayment(): void {
    const paymentIndex = this.payments.findIndex((p) => p.paymentNumber === "PMT-2024-10001");
    if (paymentIndex === -1) return;

    const payment = this.payments[paymentIndex];

    // Update the payment with correct Tolerance match data
    this.payments[paymentIndex] = {
      ...payment,
      id: "pay-1001",
      paymentNumber: "PMT-2024-10001",
      paymentHeaderId: "HDR-50001",
      amount: 147228,
      date: "2024-12-12",
      bankAccount: "US Bank - *****4521",
      method: "ACH",
      payerNameRaw: "Microsoft Corporation",
      memoReferenceRaw: "Invoice payment 1491",
      customerId: "C10001",
      customerName: "Microsoft Corporation",
      customerNumber: "C10001",
      identificationCriteria: "Customer Name",
      remittanceSource: "Bank Portal",
      status: "AutoMatched",
      confidenceScore: 95,
      match_type: "TOLERANCE",
      tolerance_applied: true,
      intercompany_flag: false,
      je_required: false,
      work_status: "AutoMatched",
      transformedLines: [
        {
          id: "line-1-0",
          erpReference: "INV-20010",
          referenceField: "REF-4792",
          discountAmount: 32,
          paymentAmount: 49044,
          reasonCode: "DISC",
          reasonDescription: "Early Payment Discount",
          customerNumber: "C10001",
        },
        {
          id: "line-1-1",
          erpReference: "INV-20011",
          referenceField: "REF-76154",
          discountAmount: 343,
          paymentAmount: 48733,
          reasonCode: "DISC",
          reasonDescription: "Early Payment Discount",
          customerNumber: "C10001",
        },
        {
          id: "line-1-2",
          erpReference: "INV-20012",
          referenceField: "REF-27338",
          discountAmount: 493,
          paymentAmount: 48583,
          reasonCode: "DISC",
          reasonDescription: "Early Payment Discount",
          customerNumber: "C10001",
        },
      ],
      aiRecommendation: "High confidence match. Recommend immediate approval and posting to ERP.",
      aiRationale:
        "Matched based on exact amount with $868 early payment discount applied across 3 invoices. Discount validated against 2/10 Net 30 payment terms. All validation checks passed.",
      suggestedAction: "Approve & Post",
      warnings: ["Tolerance applied: Early payment discount of $868 (0.59%)"],
      explainability: {
        primary_reason_code: "WITHIN_TOLERANCE",
        primary_reason_label: "Within Tolerance",
        reason_codes: ["AMT_TOLERANCE", "REM_INV_REF_FOUND", "DISCOUNT_APPLIED", "JE_NOT_REQUIRED"],
        evidence_items: [
          {
            text: "Payment amount $147,228 with $868 early payment discount applied",
            source: "Bank",
          },
          {
            text: "Discount validated against 2/10 Net 30 payment terms",
            source: "System",
          },
          {
            text: "Invoice refs matched: INV-20010, INV-20011, INV-20012",
            source: "Remit",
          },
          {
            text: "Net applied: $146,360 (discounts: $32 + $343 + $493 = $868)",
            source: "System",
          },
        ],
        artifact_links: {
          bank_line_url: "/artifacts/bank/1001",
          remittance_url: "/artifacts/remit/1001",
          invoice_set_url: "/artifacts/invoices/1001",
        },
      },
      routing: {
        routing_stream: "AutoMatched",
        routing_subfilter: "tolerance",
        routing_rules_applied: ["TOLERANCE_MATCH", "DISCOUNT_VALIDATED", "WITHIN_THRESHOLD"],
      },
      activityLog: [
        {
          id: "log-1-1",
          timestamp: "2024-12-15T09:30:00.000Z",
          user: "System",
          action: "Payment Received",
          details: "Payment file processed from bank feed",
        },
        {
          id: "log-1-2",
          timestamp: "2024-12-15T09:35:00.000Z",
          user: "System",
          action: "Auto-Match Attempted",
          details: "Matching engine processed payment",
        },
        {
          id: "log-1-3",
          timestamp: "2024-12-15T09:36:00.000Z",
          user: "System",
          action: "Auto-Matched",
          details: "Successfully matched to invoices with tolerance (early payment discount $868)",
        },
      ],
      processing_category: "AUTO",
      manual_reason: null,
      received_at: "2024-12-15T09:30:00.000Z",
      posted_status: "NOT_POSTED",
      posted_at: null,
      pending_post_state: undefined,
      settlement_status: null,
      sla_age_hours: null,
      exception_core_type: null,
      exception_reason_code: null,
      exception_reason_label: null,
      exceptionType: null,
      bank_txn_ref: "TR-100001",
      bank_account_token: "****4521",
      clearing_gl: "1010-CLR-1",
      bank_match_ready: false,
      bank_match_status: "PENDING",
      bank_match_risk_reason: "Not posted yet",
    };
  }

  /**
   * Override PMT-2024-10000 to be an EXACT match with Amazon Web Services
   * with no discounts applied - payment amount equals invoice sum exactly.
   */
  private overrideAWSExactPayment(): void {
    const paymentIndex = this.payments.findIndex((p) => p.paymentNumber === "PMT-2024-10000");
    if (paymentIndex === -1) return;

    const payment = this.payments[paymentIndex];

    // Update the payment with correct EXACT match data - no discounts
    this.payments[paymentIndex] = {
      ...payment,
      id: "pay-1000",
      paymentNumber: "PMT-2024-10000",
      paymentHeaderId: "HDR-50000",
      amount: 105850,
      date: "2024-12-12",
      bankAccount: "US Bank - *****4521",
      method: "ACH",
      payerNameRaw: "Amazon Web Services",
      memoReferenceRaw: "Invoice payment 6764",
      customerId: "C10000",
      customerName: "Amazon Web Services",
      customerNumber: "C10000",
      identificationCriteria: "Customer Name",
      remittanceSource: "Email",
      status: "AutoMatched",
      confidenceScore: 98,
      match_type: "EXACT",
      tolerance_applied: false,
      intercompany_flag: false,
      je_required: false,
      work_status: "AutoMatched",
      transformedLines: [
        {
          id: "line-0-0",
          erpReference: "INV-20000",
          referenceField: "REF-36158",
          discountAmount: 0,
          paymentAmount: 105850,
          reasonCode: "FULL",
          reasonDescription: "Full Payment",
          customerNumber: "C10000",
        },
      ],
      aiRecommendation: "High confidence match. Recommend immediate approval and posting to ERP.",
      aiRationale:
        "Matched based on exact amount, customer identification, and invoice references. All validation checks passed.",
      suggestedAction: "Approve & Post",
      warnings: [],
      explainability: {
        primary_reason_code: "EXACT_MATCH",
        primary_reason_label: "Exact Match",
        reason_codes: ["AMT_EXACT", "REM_INV_REF_FOUND", "JE_NOT_REQUIRED"],
        evidence_items: [
          {
            text: "Payment amount $105,850 equals invoice sum exactly",
            source: "Bank",
          },
          {
            text: "Invoice ref matched: INV-20000",
            source: "Remit",
          },
          {
            text: "Invoice open at time of match",
            source: "NetSuite",
          },
        ],
        artifact_links: {
          bank_line_url: "/artifacts/bank/1000",
          remittance_url: "/artifacts/remit/1000",
          invoice_set_url: "/artifacts/invoices/1000",
        },
      },
      routing: {
        routing_stream: "AutoMatched",
        routing_subfilter: "exact",
        routing_rules_applied: ["EXACT_MATCH", "AMOUNT_VERIFIED", "CUSTOMER_MATCHED"],
      },
      activityLog: [
        {
          id: "log-0-1",
          timestamp: "2024-12-15T09:30:00.000Z",
          user: "System",
          action: "Payment Received",
          details: "Payment file processed from bank feed",
        },
        {
          id: "log-0-2",
          timestamp: "2024-12-15T09:35:00.000Z",
          user: "System",
          action: "Auto-Match Attempted",
          details: "Matching engine processed payment",
        },
        {
          id: "log-0-3",
          timestamp: "2024-12-15T09:36:00.000Z",
          user: "System",
          action: "Auto-Matched",
          details: "Successfully matched to invoices",
        },
      ],
      processing_category: "AUTO",
      manual_reason: null,
      received_at: "2024-12-15T09:30:00.000Z",
      posted_status: "NOT_POSTED",
      posted_at: null,
      pending_post_state: undefined,
      settlement_status: null,
      sla_age_hours: null,
      exception_core_type: null,
      exception_reason_code: null,
      exception_reason_label: null,
      exceptionType: null,
      bank_txn_ref: "TR-100000",
      bank_account_token: "****4521",
      clearing_gl: "1010-CLR-1",
      bank_match_ready: false,
      bank_match_status: "PENDING",
      bank_match_risk_reason: "Not posted yet",
    };
  }

  private normalizeExceptionMappings(): void {
    this.payments = this.payments.map((payment) => ({
      ...payment,
      ...resolveExceptionMetadata(payment),
    }));
  }

  private appendHappyPathScenario(): void {
    const arItem1: ARItem = {
      id: "AR-INV-1001",
      invoiceNumber: "INV-1001",
      customerId: "CUST-WALMART-1670029",
      customerName: "Walmart INC",
      amount: 20000.0,
      dueDate: "2024-02-25",
      status: "Open",
      createdAt: "2024-01-15T08:00:00Z",
    };

    const arItem2: ARItem = {
      id: "AR-INV-1002",
      invoiceNumber: "INV-1002",
      customerId: "CUST-WALMART-1670029",
      customerName: "Walmart INC",
      amount: 16409.0,
      dueDate: "2024-02-25",
      status: "Open",
      createdAt: "2024-01-16T08:00:00Z",
    };

    this.arItems.push(arItem1, arItem2);

    const remittance: Remittance = {
      id: "REM-R1-1",
      remittanceNumber: "R1-1",
      source: "Email",
      receivedDate: "2024-02-12",
      customerName: "Walmart INC",
      customerId: "CUST-WALMART-1670029",
      totalAmount: 36409.0,
      status: "Matched",
      emailSubject: "Remittance INV-1001 & INV-1002 - Total 36,409",
      createdAt: "2024-02-12T08:54:01Z",
    };

    this.remittances.push(remittance);

    const payment: Payment = {
      id: "PAY-40067",
      paymentNumber: "40067",
      paymentHeaderId: "8886704",
      amount: 36409.0,
      date: "2024-02-12",
      bankAccount: "US-OPERATING-001",
      method: "ACH",
      payerNameRaw: "Walmart",
      memoReferenceRaw: "Payment for INV-1001 & INV-1002",
      customerId: "CUST-WALMART-1670029",
      customerName: "Walmart INC",
      customerNumber: "1670029",
      identificationCriteria: "Alias",
      remittanceSource: "Email",
      originalPaymentFileUrl: "/mock/downloads/payment_40067.bai2",
      linkedRemittanceFileUrl: "/mock/downloads/walmart_remittance_R1-1.csv",
      status: "PendingToPost",
      exceptionType: null,
      confidenceScore: 98,
      transformedLines: [
        {
          id: "line-walmart-1",
          erpReference: "INV-1001",
          referenceField: "INV-1001",
          discountAmount: 0.0,
          paymentAmount: 20000.0,
          reasonCode: "FULL",
          reasonDescription: "Full Payment",
          customerNumber: "1670029",
        },
        {
          id: "line-walmart-2",
          erpReference: "INV-1002",
          referenceField: "INV-1002",
          discountAmount: 0.0,
          paymentAmount: 16409.0,
          reasonCode: "FULL",
          reasonDescription: "Full Payment",
          customerNumber: "1670029",
        },
      ],
      activityLog: [
        {
          id: "log-walmart-1",
          timestamp: "2024-02-12T08:55:00Z",
          user: "System",
          action: "Payment Received",
          details: "Payment captured from bank feed (EFT)",
        },
        {
          id: "log-walmart-2",
          timestamp: "2024-02-12T08:56:30Z",
          user: "System",
          action: "Remittance Captured",
          details: "Remittance captured from Email (ID: REM-R1-1)",
        },
        {
          id: "log-walmart-3",
          timestamp: "2024-02-12T08:57:10Z",
          user: "System",
          action: "Customer Identified",
          details: "Customer identified via Alias match (Customer #1670029)",
        },
        {
          id: "log-walmart-4",
          timestamp: "2024-02-12T08:58:00Z",
          user: "System",
          action: "Payment Linked",
          details: "Payment linked to remittance REM-R1-1",
        },
        {
          id: "log-walmart-5",
          timestamp: "2024-02-12T08:59:30Z",
          user: "System",
          action: "Invoices Matched",
          details: "Matched to invoices INV-1001, INV-1002 with 0.00 difference",
        },
        {
          id: "log-walmart-6",
          timestamp: "2024-02-12T09:00:10Z",
          user: "System",
          action: "Ready to Post",
          details: "Payment ready for posting to ERP",
        },
      ],
      assignedTo: undefined,
      tags: ["auto-matched"],
      createdAt: "2024-02-12T09:00:00Z",
      updatedAt: "2024-02-12T09:05:00Z",
      suggestedAction: "Approve & Post",
      aiRecommendation:
        "Perfect match with zero variance. Payment amount matches invoices exactly. Remittance details clearly identify both invoices. Recommend immediate approval and posting to ERP.",
      aiRationale:
        "Customer identified via alias match. Payment amount (36,409) exactly matches combined invoice total (20,000 + 16,409). Remittance advice provided detailed invoice breakdown with no discrepancies. All validation checks passed with 98% confidence.",
      warnings: [],
      match_type: "EXACT",
      tolerance_applied: false,
      intercompany_flag: false,
      je_required: false,
      work_status: "PendingToPost",
    };

    this.payments.push(payment);
  }

  private appendMissingRemittanceScenario(): void {
    const arItem1: ARItem = {
      id: "AR-INV-21001",
      invoiceNumber: "INV-21001",
      customerId: "CUST-AMERGLASS-04050017234",
      customerName: "American Glass Dist.",
      amount: 4850.0,
      dueDate: "2024-03-10",
      status: "Open",
      createdAt: "2024-02-01T08:00:00Z",
    };

    const arItem2: ARItem = {
      id: "AR-INV-21002",
      invoiceNumber: "INV-21002",
      customerId: "CUST-AMERGLASS-04050017234",
      customerName: "American Glass Dist.",
      amount: 3200.0,
      dueDate: "2024-03-10",
      status: "Open",
      createdAt: "2024-02-05T08:00:00Z",
    };

    const arItem3: ARItem = {
      id: "AR-INV-21003",
      invoiceNumber: "INV-21003",
      customerId: "CUST-AMERGLASS-04050017234",
      customerName: "American Glass Dist.",
      amount: 1950.0,
      dueDate: "2024-03-10",
      status: "Open",
      createdAt: "2024-02-08T08:00:00Z",
    };

    this.arItems.push(arItem1, arItem2, arItem3);

    const payment: Payment = {
      id: "PAY-MISS-51021",
      paymentNumber: "51021",
      paymentHeaderId: "8899001",
      amount: 10000.0,
      date: "2024-02-20",
      bankAccount: "US-OPERATING-001",
      method: "ACH",
      payerNameRaw: "AMERICAN GLASS DIST",
      memoReferenceRaw: "ACH PAYMENT - AMER GLASS - FEB",
      customerId: "CUST-AMERGLASS-04050017234",
      customerName: "American Glass Dist.",
      customerNumber: "04050017234",
      identificationCriteria: "Bank Mapping",
      remittanceSource: "None",
      originalPaymentFileUrl: "/mock/downloads/payment_51021.bai2",
      linkedRemittanceFileUrl: undefined,
      status: "Exception",
      exceptionType: "MissingRemittance",
      confidenceScore: 78,
      transformedLines: [],
      activityLog: [
        {
          id: "log-amerglass-1",
          timestamp: "2024-02-20T09:00:00Z",
          user: "System",
          action: "Payment Received",
          details: "Payment captured from bank feed (ACH)",
        },
        {
          id: "log-amerglass-2",
          timestamp: "2024-02-20T09:01:30Z",
          user: "System",
          action: "Customer Identified",
          details: "Customer identified via Bank Mapping (Customer #04050017234)",
        },
        {
          id: "log-amerglass-3",
          timestamp: "2024-02-20T09:02:30Z",
          user: "System",
          action: "Remittance Lookup",
          details: "Searched remittance sources: Email Inbox, AP Portal, EDI - Not Found",
        },
        {
          id: "log-amerglass-4",
          timestamp: "2024-02-20T09:03:00Z",
          user: "System",
          action: "Exception Created",
          details: "Exception created: Missing Remittance (Severity: High)",
        },
        {
          id: "log-amerglass-5",
          timestamp: "2024-02-20T09:04:00Z",
          user: "System",
          action: "Next Step Suggested",
          details: "Suggested action: Send Missing Remittance Request email",
        },
      ],
      assignedTo: undefined,
      tags: ["missing-remittance", "controlled-exception"],
      createdAt: "2024-02-20T09:00:00Z",
      updatedAt: "2024-02-20T09:05:00Z",
      suggestedAction: "Request Remittance",
      aiRecommendation:
        "Payment found in bank feed but no remittance email/portal/EDI record linked. Recommend sending missing remittance request to customer to identify which invoices this payment should apply to.",
      aiRationale:
        "Customer identified via bank mapping with 78% confidence. Payment amount ($10,000) could match multiple open invoice combinations. Without remittance details, cannot auto-match to specific invoices. Manual intervention required.",
      warnings: [
        "No remittance advice attached",
        "Unable to identify invoices",
        "Customer has 3 open invoices totaling $10,000",
      ],
      match_type: undefined,
      tolerance_applied: false,
      intercompany_flag: false,
      je_required: false,
      work_status: "Exception",
    };

    this.payments.push(payment);
  }

  private appendOverPayScenario(): void {
    const arItem1: ARItem = {
      id: "AR-HP-INV-10000",
      invoiceNumber: "INV-10000",
      customerId: "CUST-HP-001",
      customerName: "HP Inc.",
      amount: 220451,
      dueDate: "2024-12-14",
      status: "Open",
      createdAt: "2024-11-01T08:00:00Z",
    };

    const arItem2: ARItem = {
      id: "AR-HP-INV-10001",
      invoiceNumber: "INV-10001",
      customerId: "CUST-HP-001",
      customerName: "HP Inc.",
      amount: 54383,
      dueDate: "2024-12-20",
      status: "Open",
      createdAt: "2024-11-15T08:00:00Z",
    };

    this.arItems.push(arItem1, arItem2);

    const payment: Payment = {
      id: "PAY-51090",
      paymentNumber: "PMT-2024-51090",
      paymentHeaderId: "8899102",
      amount: 239034,
      date: "2024-12-14",
      bankAccount: "US-BOFA-OPERATING-001",
      method: "ACH",
      payerNameRaw: "HP INC",
      memoReferenceRaw: "ACH PAY HP INC DEC",
      customerId: "CUST-HP-001",
      customerName: "HP Inc.",
      customerNumber: "HP-0001",
      identificationCriteria: "Bank Mapping",
      remittanceSource: "None",
      originalPaymentFileUrl: "/mock/downloads/payments/PMT-2024-51090.csv",
      linkedRemittanceFileUrl: undefined,
      status: "Exception",
      exceptionType: "OverPay",
      confidenceScore: 72,
      transformedLines: [],
      activityLog: [
        {
          id: "log-hp-1",
          timestamp: "2024-12-14T10:12:00Z",
          user: "System",
          action: "Payment Received",
          details: "Payment captured from bank feed (ACH)",
        },
        {
          id: "log-hp-2",
          timestamp: "2024-12-14T10:12:30Z",
          user: "System",
          action: "Customer Identified",
          details: "Customer identified via Bank Mapping",
        },
        {
          id: "log-hp-3",
          timestamp: "2024-12-14T10:13:00Z",
          user: "System",
          action: "Remittance Lookup",
          details: "Searched Email/Portal/EDI sources — not found",
        },
        {
          id: "log-hp-4",
          timestamp: "2024-12-14T10:13:30Z",
          user: "System",
          action: "Exception Created",
          details:
            "Exception: OverPay (Unapplied Cash). Remaining amount must be allocated or placed On Account.",
        },
        {
          id: "log-hp-5",
          timestamp: "2024-12-14T10:14:00Z",
          user: "System",
          action: "Next Step Suggested",
          details:
            "Open Matching Studio to allocate remaining $54,383 (suggest INV-10001) or mark remaining as On Account (if enabled).",
        },
      ],
      assignedTo: undefined,
      tags: ["controlled-exception", "matching-studio", "overpay-unapplied"],
      createdAt: "2024-12-14T10:12:00Z",
      updatedAt: "2024-12-14T10:14:00Z",
      suggestedAction: "Allocate Remaining",
      aiRecommendation:
        "Allocation incomplete: unapplied cash. Payment exceeds selected invoice allocation. Remaining $54,383 matches open invoice INV-10001.",
      aiRationale:
        "Customer identified via bank mapping with 72% confidence. Payment amount ($239,034) exceeds first invoice ($184,651 allocated from INV-10000). Remaining balance of $54,383 exactly matches second open invoice INV-10001. Use Matching Studio to complete allocation.",
      warnings: [
        "Unapplied cash: $54,383 remaining",
        "Payment not fully allocated",
        "Suggest allocating to INV-10001 ($54,383)",
      ],
      match_type: undefined,
      tolerance_applied: false,
      intercompany_flag: false,
      je_required: false,
      work_status: "Exception",
      draftAllocation: {
        invoiceId: "AR-HP-INV-10000",
        allocatedAmount: 184651,
        remainingAmount: 54383,
        note: "User started matching but payment not fully allocated; confirm match disabled.",
      },
    };

    this.payments.push(payment);
  }

  private appendIntercompanyScenarioUS01CA01(): void {
    // Create AR Items for US01 and CA01
    const arItemUS: ARItem = {
      id: "AR-INV-US-70001",
      invoiceNumber: "INV-US-70001",
      customerId: "CUST-GLOBAL-RETAIL-001",
      customerName: "Global Retail Group",
      amount: 60000,
      dueDate: "2024-02-20",
      status: "Open",
      subsidiary: "US01",
      businessUnit: "US",
      currency: "USD",
      createdAt: "2024-01-15T08:00:00Z",
    };

    const arItemCA: ARItem = {
      id: "AR-INV-CA-80001",
      invoiceNumber: "INV-CA-80001",
      customerId: "CUST-GLOBAL-RETAIL-001",
      customerName: "Global Retail Group",
      amount: 40000,
      dueDate: "2024-02-22",
      status: "Open",
      subsidiary: "CA01",
      businessUnit: "CA",
      currency: "USD",
      createdAt: "2024-01-18T08:00:00Z",
    };

    this.arItems.push(arItemUS, arItemCA);

    // Create Remittance (Email)
    const remittance: Remittance = {
      id: "REM-51110",
      remittanceNumber: "EML-775310",
      source: "Email",
      receivedDate: "2024-02-25",
      customerName: "Global Retail Group",
      customerId: "CUST-GLOBAL-RETAIL-001",
      totalAmount: 100000,
      status: "Linked",
      emailSubject: "Payment Advice - Global Retail Group - Feb 25",
      emailIdentifier: "EML-775310",
      attachments: [
        {
          name: "remittance_51110.pdf",
          type: "PDF",
          size: "1.1 MB",
          url: "/mock/downloads/remittances/remittance_51110.pdf",
        },
      ],
      extractedReferences: [
        { invoice: "INV-US-70001", amount: 60000 },
        { invoice: "INV-CA-80001", amount: 40000 },
      ],
      linkStatus: "Linked",
      extract_status: "EXTRACTED",
      link_status: "LINKED",
      confidence_score: 92,
      key_reference: "WIRE-90128",
      invoices_found_count: 2,
      linked_payment_id: "PMT-2024-51110",
      email_metadata: {
        from: "ap@globalretail.com",
        to: "ar@meeru.ai",
        subject: "Payment Advice - Global Retail Group - Feb 25",
        received_ts: "2024-02-25T09:10:00Z",
        body: "Remittance details attached for INV-US-70001 and INV-CA-80001.",
      },
      extracted_fields: {
        customer: "Global Retail Group",
        payment_date: "2024-02-25",
        amount: 100000,
        currency: "USD",
        reference: "WIRE-90128",
        method: "AI",
      },
      extracted_line_items: [
        {
          invoice_number: "INV-US-70001",
          invoice_amount: 60000,
          paid_amount: 60000,
          discount: 0,
        },
        {
          invoice_number: "INV-CA-80001",
          invoice_amount: 40000,
          paid_amount: 40000,
          discount: 0,
        },
      ],
      validation_checks: [
        { status: "PASS", label: "Invoices exist in NetSuite" },
        { status: "PASS", label: "Totals match" },
        { status: "PASS", label: "Currency match" },
      ],
      activity_log: [
        {
          event: "Remittance Captured",
          actor: "System",
          ts: "2024-02-25T09:15:00Z",
          detail: "Email inbox ingestion",
        },
        {
          event: "Linked to Payment",
          actor: "User",
          ts: "2024-02-25T09:20:00Z",
          detail: "Linked to PMT-2024-51110",
        },
      ],
      parserConfidence: 92,
      createdAt: "2024-02-25T09:15:00Z",
    };

    this.remittances.push(remittance);

    // Create Intercompany JE Draft
    const intercompanyJE: IntercompanyJEDraft = {
      jeId: "JE-IC-51110",
      type: "Intercompany Transfer",
      status: "Draft",
      entities: ["US01", "CA01"],
      lines: [
        {
          entity: "US01",
          description: "Due From CA01",
          debit: 40000,
          credit: 0,
        },
        {
          entity: "US01",
          description: "Cash Clearing",
          debit: 0,
          credit: 40000,
        },
        {
          entity: "CA01",
          description: "Cash Clearing",
          debit: 40000,
          credit: 0,
        },
        {
          entity: "CA01",
          description: "Due To US01",
          debit: 0,
          credit: 40000,
        },
      ],
    };

    // Create Payment with full scenario
    const payment: Payment = {
      id: "PAY-51110",
      paymentNumber: "PMT-2024-51110",
      paymentHeaderId: "8899103",
      amount: 100000,
      date: "2024-02-25",
      bankAccount: "US-BOFA-OPERATING-001",
      method: "ACH",
      payerNameRaw: "GLOBAL RETAIL GROUP",
      memoReferenceRaw: "ACH PAY GLOBAL RETAIL FEB25",
      customerId: "CUST-GLOBAL-RETAIL-001",
      customerName: "Global Retail Group",
      customerNumber: "USGRP-1001",
      identificationCriteria: "Invoice Reference",
      remittanceSource: "Email",
      originalPaymentFileUrl: "/mock/downloads/payments/PMT-2024-51110.csv",
      linkedRemittanceFileUrl: "/mock/downloads/remittances/remittance_51110.pdf",
      status: "PendingToPost",
      exceptionType: null,
      confidenceScore: 92,
      transformedLines: [
        {
          id: "TL-51110-1",
          erpReference: "INV-US-70001",
          referenceField: "Invoice",
          discountAmount: 0,
          paymentAmount: 60000,
          reasonCode: "",
          reasonDescription: "",
          customerNumber: "USGRP-1001",
          subsidiary: "US01",
        },
        {
          id: "TL-51110-2",
          erpReference: "INV-CA-80001",
          referenceField: "Invoice",
          discountAmount: 0,
          paymentAmount: 40000,
          reasonCode: "",
          reasonDescription: "",
          customerNumber: "USGRP-1001",
          subsidiary: "CA01",
        },
      ],
      activityLog: [
        {
          id: "log-ic-1",
          timestamp: "2024-02-25T09:00:00Z",
          user: "System",
          action: "Payment Received",
          details: "Payment captured from bank feed (ACH)",
        },
        {
          id: "log-ic-2",
          timestamp: "2024-02-25T09:05:00Z",
          user: "System",
          action: "Customer Identified",
          details: "Customer identified via invoice reference matching",
        },
        {
          id: "log-ic-3",
          timestamp: "2024-02-25T09:15:00Z",
          user: "System",
          action: "Remittance Captured",
          details: "Remittance captured from email (EML-775310)",
        },
        {
          id: "log-ic-4",
          timestamp: "2024-02-25T09:16:00Z",
          user: "System",
          action: "Remittance Linked to Payment",
          details: "Remittance successfully linked with 92% confidence",
        },
        {
          id: "log-ic-5",
          timestamp: "2024-02-25T09:17:00Z",
          user: "System",
          action: "Multi-Entity Detected",
          details: "Payment spans US01 ($60,000) and CA01 ($40,000)",
        },
        {
          id: "log-ic-6",
          timestamp: "2024-02-25T09:18:00Z",
          user: "System",
          action: "Intercompany JE Draft Generated",
          details: "Generated intercompany journal entry JE-IC-51110 to balance entities",
        },
        {
          id: "log-ic-7",
          timestamp: "2024-02-25T09:19:00Z",
          user: "System",
          action: "Match Confirmed",
          details: "Invoices applied: INV-US-70001 ($60k), INV-CA-80001 ($40k)",
        },
        {
          id: "log-ic-8",
          timestamp: "2024-02-25T09:20:00Z",
          user: "System",
          action: "Status Updated → PendingToPost",
          details: "Payment ready for posting to ERP with intercompany JE",
        },
      ],
      assignedTo: undefined,
      tags: ["controlled-scenario", "intercompany", "multi-entity", "zero-touch"],
      createdAt: "2024-02-25T09:00:00Z",
      updatedAt: "2024-02-25T09:20:00Z",
      suggestedAction: "Post to ERP",
      aiRecommendation:
        "Multi-entity payment fully reconciled across US01 and CA01. Intercompany JE draft generated and ready for posting.",
      aiRationale:
        "Payment of $100,000 successfully allocated across two subsidiaries (US01: $60,000, CA01: $40,000). Email remittance provided detailed invoice breakdown. System automatically generated intercompany journal entry to balance cash landing in US bank account with CA entity allocation. Zero-touch resolution achieved.",
      warnings: ["Intercompany transaction detected"],
      match_type: "INTERCOMPANY",
      tolerance_applied: false,
      intercompany_flag: true,
      je_required: true,
      work_status: "PendingToPost",
      intercompanyJEDraft: intercompanyJE,
    };

    this.payments.push(payment);
  }

  private appendBadDebtRecoveryScenario(): void {
    const badDebtPayment: Payment = {
      id: "pay-bad-debt-001",
      paymentNumber: "PMT-2026-001234",
      paymentHeaderId: "HDR-BD-001",
      amount: 12500,
      date: new Date().toISOString().split("T")[0],
      bankAccount: "JPM-US-OPER-001",
      method: "ACH",
      payerNameRaw: "DoorDash Merchant Group",
      memoReferenceRaw: "Payment for INV-908771",
      customerId: "CUST-DOORDASH-001",
      customerName: "DoorDash Merchant Group",
      customerNumber: "C-DOORDASH",
      identificationCriteria: "Customer Name",
      remittanceSource: "Bank Portal",
      originalPaymentFileUrl: "/files/payments/payment_bd_001.xml",
      linkedRemittanceFileUrl: "/files/remittances/rem_bd_001.pdf",
      status: "Exception",
      exceptionType: null,
      confidenceScore: 45,
      transformedLines: [],
      activityLog: [
        {
          id: "log-bd-001",
          timestamp: new Date().toISOString(),
          user: "System",
          action: "Exception Created",
          details: "Invoice closed (write-off); JE required",
        },
      ],
      assignedTo: "Sarah Chen",
      tags: ["Bad Debt", "JE Required"],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      suggestedAction: "Create JE",
      aiRecommendation:
        "This payment references invoice INV-908771 which was previously written off as bad debt. A Bad Debt Recovery journal entry is required to reverse the write-off and apply the payment.",
      aiRationale:
        "Invoice INV-908771 was closed with a write-off on 2025-08-15. Customer has now remitted payment. Standard Bad Debt Recovery JE template applies.",
      warnings: ["Invoice was written off as bad debt", "Manual JE required for recovery"],
      je_required: true,
      je_required_flag: true,
      je_workflow_state: "NONE",
      je_type: null,
      je_draft: null,
      exception_core_type: "JE_NEEDED",
      exception_reason_code: "BAD_DEBT_RECOVERY",
      exception_reason_label: EXCEPTION_REASON_LABELS.BAD_DEBT_RECOVERY,
      exception_resolution_state: "OPEN",
      linked_invoice_ref: "INV-908771",
      linked_invoice_status: "Closed - Write-off",
      explainability: {
        primary_reason_code: "EXC_BAD_DEBT",
        primary_reason_label: "Bad Debt Recovery Required",
        reason_codes: ["EXC_BAD_DEBT", "INV_CLOSED", "JE_REQUIRED"],
        evidence_items: [
          {
            text: "Invoice INV-908771 was written off as bad debt on 2025-08-15",
            source: "NetSuite",
          },
          {
            text: "Payment received for $12,500.00 matching write-off amount",
            source: "Bank",
          },
          {
            text: "Bad Debt Recovery JE required to reverse write-off",
            source: "System",
          },
        ],
        artifact_links: {
          bank_line_url: "/artifacts/bank/bd-001",
          invoice_set_url: "/artifacts/invoices/bd-001",
        },
      },
      routing: {
        routing_stream: "Exceptions",
        routing_subfilter: "Bad Debt",
        routing_rules_applied: [
          "INV_CLOSED_WRITEOFF → Exceptions",
          "BAD_DEBT_RECOVERY → JE Required",
          "MANUAL_JE_FLOW → Bad Debt sub-filter",
        ],
      },
    };

    this.payments.push(badDebtPayment);
  }

  private appendExceptionTaxonomyScenarios(): void {
    const basePayment = this.payments[0];
    const today = new Date();
    const makeExceptionPayment = (idSuffix: string, overrides: Partial<Payment>): Payment => {
      const createdAt = new Date(today.getTime() - 6 * 60 * 60 * 1000).toISOString();
      const updatedAt = today.toISOString();
      return {
        ...basePayment,
        id: `pay-exc-${idSuffix}`,
        paymentNumber: `PMT-2026-${idSuffix}`,
        paymentHeaderId: `HDR-EXC-${idSuffix}`,
        amount: overrides.amount ?? basePayment.amount,
        date: updatedAt.split("T")[0],
        status: "Exception",
        exception_resolution_state: "OPEN",
        transformedLines: [],
        activityLog: [
          ...(basePayment.activityLog || []),
          {
            id: `log-exc-${idSuffix}`,
            timestamp: updatedAt,
            user: "System",
            action: "Exception Created",
            details:
              overrides.exception_reason_label ||
              overrides.exception_reason_code ||
              "Exception identified",
          },
        ],
        createdAt,
        updatedAt,
        ...overrides,
      };
    };

    const exceptionPayments: Payment[] = [
      makeExceptionPayment("INVNF-01", {
        payerNameRaw: "Apex Mobility",
        customerName: "Apex Mobility",
        customerNumber: "C-APEX-100",
        amount: 28400,
        exceptionType: "InvalidRef",
        exception_core_type: "INVOICE_ISSUE",
        exception_reason_code: "INVOICE_NOT_FOUND",
        exception_reason_label: EXCEPTION_REASON_LABELS.INVOICE_NOT_FOUND,
        invoice_status_flag: "NOT_FOUND",
      }),
      makeExceptionPayment("INVNF-02", {
        payerNameRaw: "BlueWave Logistics",
        customerName: "BlueWave Logistics",
        customerNumber: "C-BW-221",
        amount: 19250,
        exceptionType: "InvalidRef",
        exception_core_type: "INVOICE_ISSUE",
        exception_reason_code: "INVOICE_NOT_FOUND",
        exception_reason_label: EXCEPTION_REASON_LABELS.INVOICE_NOT_FOUND,
        invoice_status_flag: "NOT_FOUND",
      }),
      makeExceptionPayment("INVC-01", {
        payerNameRaw: "Northwind Foods",
        customerName: "Northwind Foods",
        customerNumber: "C-NORTH-078",
        amount: 33500,
        exceptionType: "InvalidRef",
        exception_core_type: "INVOICE_ISSUE",
        exception_reason_code: "INVOICE_CLOSED",
        exception_reason_label: EXCEPTION_REASON_LABELS.INVOICE_CLOSED,
        invoice_status_flag: "CLOSED",
      }),
      makeExceptionPayment("CMINV-01", {
        payerNameRaw: "Summit Retail",
        customerName: "Summit Retail",
        customerNumber: "C-SUM-554",
        amount: 15800,
        exception_core_type: "CREDIT_ISSUE",
        exception_reason_code: "INVALID_CM",
        exception_reason_label: EXCEPTION_REASON_LABELS.INVALID_CM,
        credit_memo_status_flag: "INVALID_CM",
        memoReferenceRaw: "Credit memo CM-8831 invalid",
      }),
      makeExceptionPayment("ONACC-01", {
        payerNameRaw: "Metro Hardware",
        customerName: "Metro Hardware",
        customerNumber: "C-METRO-044",
        amount: 22300,
        exception_core_type: "JE_NEEDED",
        exception_reason_code: "UNAPPLIED_CASH",
        exception_reason_label: EXCEPTION_REASON_LABELS.UNAPPLIED_CASH,
        on_account_flag: true,
      }),
      makeExceptionPayment("PARSE-01", {
        payerNameRaw: "Riverside Parts",
        customerName: "Riverside Parts",
        customerNumber: "C-RIV-991",
        amount: 17650,
        exceptionType: "MissingRemittance",
        exception_core_type: "MISSING_REMIT",
        exception_reason_code: "REMIT_PARSE_ERROR",
        exception_reason_label: EXCEPTION_REASON_LABELS.REMIT_PARSE_ERROR,
        parse_error_flag: true,
        remittanceSource: "Email",
      }),
      makeExceptionPayment("SET-PEND-01", {
        payerNameRaw: "Kite Data Services",
        customerName: "Kite Data Services",
        customerNumber: "C-KITE-017",
        amount: 45200,
        exception_core_type: "SETTLEMENT",
        exception_reason_code: "SETTLEMENT_PENDING",
        exception_reason_label: EXCEPTION_REASON_LABELS.SETTLEMENT_PENDING,
        settlement_state: "PENDING",
        method: "ACH",
      }),
    ];

    this.payments.push(...exceptionPayments);
  }

  private appendMailboxIngestionPhase1(): void {
    const mailboxes: MailboxConfig[] = [
      {
        id: "MBX-AR-001",
        address: "ar@meeru.ai",
        displayName: "Meeru AR Mailbox",
        provider: "O365",
        enabled: true,
        tags: ["AR"],
        createdAt: "2024-12-10T08:00:00Z",
        updatedAt: "2024-12-15T08:00:00Z",
      },
      {
        id: "MBX-REMIT-001",
        address: "ar.remit@meeru.ai",
        displayName: "Meeru Remittance Mailbox",
        provider: "O365",
        enabled: true,
        tags: ["REMIT"],
        createdAt: "2024-12-10T08:05:00Z",
        updatedAt: "2024-12-15T08:05:00Z",
      },
      {
        id: "MBX-ESC-001",
        address: "ar.escalations@meeru.ai",
        displayName: "Meeru Escalations",
        provider: "Google",
        enabled: true,
        tags: ["ESCALATIONS"],
        createdAt: "2024-12-10T08:10:00Z",
        updatedAt: "2024-12-15T08:10:00Z",
      },
    ];

    const ingestionRuns: IngestionRun[] = [
      {
        id: "INGEST-AR-20241215",
        sourceType: "Mailbox",
        sourceId: "MBX-AR-001",
        startedAt: "2024-12-15T09:00:00Z",
        finishedAt: "2024-12-15T09:06:00Z",
        status: "Success",
        rawItemsPulled: 10,
        itemsParsed: 7,
        itemsFailed: 1,
        errorSummary: [],
        createdAt: "2024-12-15T09:06:00Z",
      },
      {
        id: "INGEST-REMIT-20241215",
        sourceType: "Mailbox",
        sourceId: "MBX-REMIT-001",
        startedAt: "2024-12-15T09:10:00Z",
        finishedAt: "2024-12-15T09:18:00Z",
        status: "Partial",
        rawItemsPulled: 10,
        itemsParsed: 6,
        itemsFailed: 2,
        errorSummary: ["2 emails contained unreadable attachments", "1 CSV totals mismatch"],
        createdAt: "2024-12-15T09:18:00Z",
      },
      {
        id: "INGEST-ESC-20241215",
        sourceType: "Mailbox",
        sourceId: "MBX-ESC-001",
        startedAt: "2024-12-15T09:20:00Z",
        finishedAt: "2024-12-15T09:23:00Z",
        status: "Success",
        rawItemsPulled: 5,
        itemsParsed: 2,
        itemsFailed: 0,
        errorSummary: [],
        createdAt: "2024-12-15T09:23:00Z",
      },
    ];

    const attachments: RawAttachment[] = [
      {
        id: "ATT-000901",
        emailId: "EML-000501",
        fileName: "remit_pmt_10006.pdf",
        fileType: "PDF",
        fileSizeKb: 842,
        downloadUrl: "/mock/downloads/attachments/ATT-000901",
        parseStatus: "Parsed",
        parserConfidence: 92,
        extractedInvoiceRefs: ["INV-20060"],
        createdAt: "2024-12-15T09:12:10Z",
      },
      {
        id: "ATT-000902",
        emailId: "EML-000502",
        fileName: "remit_pmt_10012.pdf",
        fileType: "PDF",
        fileSizeKb: 911,
        downloadUrl: "/mock/downloads/attachments/ATT-000902",
        parseStatus: "Parsed",
        parserConfidence: 90,
        extractedInvoiceRefs: ["INV-20120", "INV-20125"],
        createdAt: "2024-12-15T09:14:02Z",
      },
      {
        id: "ATT-000903",
        emailId: "EML-000503",
        fileName: "remittance_caspian.pdf",
        fileType: "PDF",
        fileSizeKb: 778,
        downloadUrl: "/mock/downloads/attachments/ATT-000903",
        parseStatus: "Parsed",
        parserConfidence: 81,
        extractedInvoiceRefs: ["INV-20140"],
        createdAt: "2024-12-15T09:18:22Z",
      },
      {
        id: "ATT-000904",
        emailId: "EML-000504",
        fileName: "dynamo_dec_remit.pdf",
        fileType: "PDF",
        fileSizeKb: 654,
        downloadUrl: "/mock/downloads/attachments/ATT-000904",
        parseStatus: "Parsed",
        parserConfidence: 83,
        extractedInvoiceRefs: ["INV-22550", "INV-22551"],
        createdAt: "2024-12-15T09:21:10Z",
      },
      {
        id: "ATT-000905",
        emailId: "EML-000505",
        fileName: "remittance_scan.pdf",
        fileType: "PDF",
        fileSizeKb: 502,
        downloadUrl: "/mock/downloads/attachments/ATT-000905",
        parseStatus: "Failed",
        parserConfidence: 18,
        errorReason: "Unreadable scanned PDF",
        createdAt: "2024-12-15T09:24:44Z",
      },
      {
        id: "ATT-000906",
        emailId: "EML-000506",
        fileName: "foxtrot_remittance.pdf",
        fileType: "PDF",
        fileSizeKb: 733,
        downloadUrl: "/mock/downloads/attachments/ATT-000906",
        parseStatus: "Parsed",
        parserConfidence: 89,
        extractedInvoiceRefs: ["INV-30510"],
        createdAt: "2024-12-15T09:26:18Z",
      },
      {
        id: "ATT-000907",
        emailId: "EML-000508",
        fileName: "global_retail_advice.pdf",
        fileType: "PDF",
        fileSizeKb: 988,
        downloadUrl: "/mock/downloads/attachments/ATT-000907",
        parseStatus: "Parsed",
        parserConfidence: 90,
        extractedInvoiceRefs: ["INV-US-70001", "INV-CA-80001"],
        createdAt: "2024-12-15T09:31:42Z",
      },
      {
        id: "ATT-000908",
        emailId: "EML-000509",
        fileName: "intercompany_remit_51110.pdf",
        fileType: "PDF",
        fileSizeKb: 1102,
        downloadUrl: "/mock/downloads/attachments/ATT-000908",
        parseStatus: "Parsed",
        parserConfidence: 94,
        extractedInvoiceRefs: ["INV-US-70001", "INV-CA-80001"],
        createdAt: "2024-12-15T09:33:12Z",
      },
      {
        id: "ATT-000909",
        emailId: "EML-000510",
        fileName: "fwd_remittance.pdf",
        fileType: "PDF",
        fileSizeKb: 612,
        downloadUrl: "/mock/downloads/attachments/ATT-000909",
        parseStatus: "Unparsed",
        parserConfidence: 0,
        createdAt: "2024-12-15T09:36:05Z",
      },
      {
        id: "ATT-000910",
        emailId: "EML-000511",
        fileName: "hp_remittance_51090.pdf",
        fileType: "PDF",
        fileSizeKb: 970,
        downloadUrl: "/mock/downloads/attachments/ATT-000910",
        parseStatus: "Parsed",
        parserConfidence: 88,
        extractedInvoiceRefs: ["INV-10000", "INV-10001"],
        createdAt: "2024-12-15T09:40:32Z",
      },
      {
        id: "ATT-000911",
        emailId: "EML-000512",
        fileName: "jupiter_remit_10018.pdf",
        fileType: "PDF",
        fileSizeKb: 801,
        downloadUrl: "/mock/downloads/attachments/ATT-000911",
        parseStatus: "Parsed",
        parserConfidence: 90,
        extractedInvoiceRefs: ["INV-20180"],
        createdAt: "2024-12-15T09:41:44Z",
      },
      {
        id: "ATT-000912",
        emailId: "EML-000513",
        fileName: "secure_payment.pdf",
        fileType: "PDF",
        fileSizeKb: 435,
        downloadUrl: "/mock/downloads/attachments/ATT-000912",
        parseStatus: "Failed",
        parserConfidence: 15,
        errorReason: "PDF is password-protected",
        createdAt: "2024-12-15T09:44:10Z",
      },
      {
        id: "ATT-000913",
        emailId: "EML-000514",
        fileName: "lumen_remittance.pdf",
        fileType: "PDF",
        fileSizeKb: 690,
        downloadUrl: "/mock/downloads/attachments/ATT-000913",
        parseStatus: "Partial",
        parserConfidence: 78,
        extractedInvoiceRefs: ["INV-22110", "INV-22111"],
        createdAt: "2024-12-15T09:47:12Z",
      },
      {
        id: "ATT-000914",
        emailId: "EML-000515",
        fileName: "metro_remittance.pdf",
        fileType: "PDF",
        fileSizeKb: 744,
        downloadUrl: "/mock/downloads/attachments/ATT-000914",
        parseStatus: "Parsed",
        parserConfidence: 86,
        extractedInvoiceRefs: ["INV-22220"],
        createdAt: "2024-12-15T09:49:01Z",
      },
      {
        id: "ATT-000915",
        emailId: "EML-000516",
        fileName: "nadir_payment.pdf",
        fileType: "PDF",
        fileSizeKb: 612,
        downloadUrl: "/mock/downloads/attachments/ATT-000915",
        parseStatus: "Unparsed",
        parserConfidence: 0,
        createdAt: "2024-12-15T09:52:44Z",
      },
      {
        id: "ATT-000916",
        emailId: "EML-000502",
        fileName: "bluebird_remit.csv",
        fileType: "CSV",
        fileSizeKb: 184,
        downloadUrl: "/mock/downloads/attachments/ATT-000916",
        parseStatus: "Parsed",
        parserConfidence: 88,
        extractedInvoiceRefs: ["INV-20120", "INV-20125", "INV-20126"],
        createdAt: "2024-12-15T09:14:14Z",
      },
      {
        id: "ATT-000917",
        emailId: "EML-000517",
        fileName: "omega_multi_invoice.csv",
        fileType: "CSV",
        fileSizeKb: 210,
        downloadUrl: "/mock/downloads/attachments/ATT-000917",
        parseStatus: "Failed",
        parserConfidence: 42,
        errorReason: "Totals mismatch in CSV",
        extractedInvoiceRefs: ["INV-33010", "INV-33011", "INV-33012"],
        createdAt: "2024-12-15T09:55:36Z",
      },
      {
        id: "ATT-000918",
        emailId: "EML-000518",
        fileName: "pinnacle_remit.csv",
        fileType: "CSV",
        fileSizeKb: 168,
        downloadUrl: "/mock/downloads/attachments/ATT-000918",
        parseStatus: "Unparsed",
        parserConfidence: 0,
        createdAt: "2024-12-15T09:57:11Z",
      },
      {
        id: "ATT-000919",
        emailId: "EML-000519",
        fileName: "quantum_remit.csv",
        fileType: "CSV",
        fileSizeKb: 176,
        downloadUrl: "/mock/downloads/attachments/ATT-000919",
        parseStatus: "Unparsed",
        parserConfidence: 0,
        createdAt: "2024-12-15T09:58:33Z",
      },
      {
        id: "ATT-000920",
        emailId: "EML-000520",
        fileName: "raptor_multi_invoice.csv",
        fileType: "CSV",
        fileSizeKb: 205,
        downloadUrl: "/mock/downloads/attachments/ATT-000920",
        parseStatus: "Failed",
        parserConfidence: 52,
        errorReason: "Payment record missing for CSV batch",
        extractedInvoiceRefs: ["INV-44001", "INV-44002", "INV-44003"],
        createdAt: "2024-12-15T09:59:50Z",
      },
      {
        id: "ATT-000921",
        emailId: "EML-000521",
        fileName: "starlight_remit.csv",
        fileType: "CSV",
        fileSizeKb: 140,
        downloadUrl: "/mock/downloads/attachments/ATT-000921",
        parseStatus: "Unparsed",
        parserConfidence: 0,
        createdAt: "2024-12-15T10:01:20Z",
      },
      {
        id: "ATT-000922",
        emailId: "EML-000522",
        fileName: "titan_remit.csv",
        fileType: "CSV",
        fileSizeKb: 152,
        downloadUrl: "/mock/downloads/attachments/ATT-000922",
        parseStatus: "Parsed",
        parserConfidence: 88,
        extractedInvoiceRefs: ["INV-45010"],
        createdAt: "2024-12-15T10:03:14Z",
      },
      {
        id: "ATT-000923",
        emailId: "EML-000524",
        fileName: "vector_remit.csv",
        fileType: "CSV",
        fileSizeKb: 162,
        downloadUrl: "/mock/downloads/attachments/ATT-000923",
        parseStatus: "Parsed",
        parserConfidence: 85,
        extractedInvoiceRefs: ["INV-46020"],
        createdAt: "2024-12-15T10:05:42Z",
      },
      {
        id: "ATT-000924",
        emailId: "EML-000525",
        fileName: "waveline_remit.csv",
        fileType: "CSV",
        fileSizeKb: 133,
        downloadUrl: "/mock/downloads/attachments/ATT-000924",
        parseStatus: "Unparsed",
        parserConfidence: 0,
        createdAt: "2024-12-15T10:06:51Z",
      },
      {
        id: "ATT-000925",
        emailId: "EML-000503",
        fileName: "caspian_summary.csv",
        fileType: "CSV",
        fileSizeKb: 120,
        downloadUrl: "/mock/downloads/attachments/ATT-000925",
        parseStatus: "Parsed",
        parserConfidence: 80,
        extractedInvoiceRefs: ["INV-20140"],
        createdAt: "2024-12-15T09:18:42Z",
      },
      {
        id: "ATT-000926",
        emailId: "EML-000501",
        fileName: "remit_pmt_10006.xlsx",
        fileType: "XLSX",
        fileSizeKb: 244,
        downloadUrl: "/mock/downloads/attachments/ATT-000926",
        parseStatus: "Parsed",
        parserConfidence: 91,
        extractedInvoiceRefs: ["INV-20060"],
        createdAt: "2024-12-15T09:12:16Z",
      },
      {
        id: "ATT-000927",
        emailId: "EML-000502",
        fileName: "remit_pmt_10012.xlsx",
        fileType: "XLSX",
        fileSizeKb: 260,
        downloadUrl: "/mock/downloads/attachments/ATT-000927",
        parseStatus: "Parsed",
        parserConfidence: 89,
        extractedInvoiceRefs: ["INV-20120", "INV-20125"],
        createdAt: "2024-12-15T09:14:22Z",
      },
      {
        id: "ATT-000928",
        emailId: "EML-000503",
        fileName: "caspian_breakdown.xlsx",
        fileType: "XLSX",
        fileSizeKb: 221,
        downloadUrl: "/mock/downloads/attachments/ATT-000928",
        parseStatus: "Parsed",
        parserConfidence: 82,
        extractedInvoiceRefs: ["INV-20140"],
        createdAt: "2024-12-15T09:18:48Z",
      },
      {
        id: "ATT-000929",
        emailId: "EML-000504",
        fileName: "dynamo_discount_detail.xlsx",
        fileType: "XLSX",
        fileSizeKb: 238,
        downloadUrl: "/mock/downloads/attachments/ATT-000929",
        parseStatus: "Parsed",
        parserConfidence: 84,
        extractedInvoiceRefs: ["INV-22550", "INV-22551"],
        createdAt: "2024-12-15T09:21:18Z",
      },
      {
        id: "ATT-000930",
        emailId: "EML-000506",
        fileName: "foxtrot_discount_detail.xlsx",
        fileType: "XLSX",
        fileSizeKb: 232,
        downloadUrl: "/mock/downloads/attachments/ATT-000930",
        parseStatus: "Parsed",
        parserConfidence: 85,
        extractedInvoiceRefs: ["INV-30510"],
        createdAt: "2024-12-15T09:26:24Z",
      },
      {
        id: "ATT-000931",
        emailId: "EML-000508",
        fileName: "global_retail_detail.xlsx",
        fileType: "XLSX",
        fileSizeKb: 242,
        downloadUrl: "/mock/downloads/attachments/ATT-000931",
        parseStatus: "Parsed",
        parserConfidence: 90,
        extractedInvoiceRefs: ["INV-US-70001", "INV-CA-80001"],
        createdAt: "2024-12-15T09:31:46Z",
      },
      {
        id: "ATT-000932",
        emailId: "EML-000509",
        fileName: "intercompany_detail.xlsx",
        fileType: "XLSX",
        fileSizeKb: 254,
        downloadUrl: "/mock/downloads/attachments/ATT-000932",
        parseStatus: "Parsed",
        parserConfidence: 94,
        extractedInvoiceRefs: ["INV-US-70001", "INV-CA-80001"],
        createdAt: "2024-12-15T09:33:18Z",
      },
      {
        id: "ATT-000933",
        emailId: "EML-000514",
        fileName: "lumen_discount.xlsx",
        fileType: "XLSX",
        fileSizeKb: 229,
        downloadUrl: "/mock/downloads/attachments/ATT-000933",
        parseStatus: "Partial",
        parserConfidence: 78,
        extractedInvoiceRefs: ["INV-22110", "INV-22111"],
        createdAt: "2024-12-15T09:47:20Z",
      },
      {
        id: "ATT-000934",
        emailId: "EML-000515",
        fileName: "metro_detail.xlsx",
        fileType: "XLSX",
        fileSizeKb: 218,
        downloadUrl: "/mock/downloads/attachments/ATT-000934",
        parseStatus: "Parsed",
        parserConfidence: 86,
        extractedInvoiceRefs: ["INV-22220"],
        createdAt: "2024-12-15T09:49:08Z",
      },
      {
        id: "ATT-000935",
        emailId: "EML-000522",
        fileName: "titan_detail.xlsx",
        fileType: "XLSX",
        fileSizeKb: 219,
        downloadUrl: "/mock/downloads/attachments/ATT-000935",
        parseStatus: "Parsed",
        parserConfidence: 88,
        extractedInvoiceRefs: ["INV-45010"],
        createdAt: "2024-12-15T10:03:20Z",
      },
      {
        id: "ATT-000936",
        emailId: "EML-000518",
        fileName: "pinnacle_notes.txt",
        fileType: "TXT",
        fileSizeKb: 12,
        downloadUrl: "/mock/downloads/attachments/ATT-000936",
        parseStatus: "Unparsed",
        parserConfidence: 0,
        createdAt: "2024-12-15T09:57:22Z",
      },
      {
        id: "ATT-000937",
        emailId: "EML-000519",
        fileName: "quantum_notes.txt",
        fileType: "TXT",
        fileSizeKb: 14,
        downloadUrl: "/mock/downloads/attachments/ATT-000937",
        parseStatus: "Unparsed",
        parserConfidence: 0,
        createdAt: "2024-12-15T09:58:40Z",
      },
      {
        id: "ATT-000938",
        emailId: "EML-000520",
        fileName: "raptor_notes.txt",
        fileType: "TXT",
        fileSizeKb: 10,
        downloadUrl: "/mock/downloads/attachments/ATT-000938",
        parseStatus: "Failed",
        parserConfidence: 50,
        errorReason: "Notes did not contain invoice amounts",
        createdAt: "2024-12-15T10:00:02Z",
      },
      {
        id: "ATT-000939",
        emailId: "EML-000521",
        fileName: "starlight_notes.txt",
        fileType: "TXT",
        fileSizeKb: 11,
        downloadUrl: "/mock/downloads/attachments/ATT-000939",
        parseStatus: "Unparsed",
        parserConfidence: 0,
        createdAt: "2024-12-15T10:01:28Z",
      },
      {
        id: "ATT-000940",
        emailId: "EML-000524",
        fileName: "vector_notes.txt",
        fileType: "TXT",
        fileSizeKb: 9,
        downloadUrl: "/mock/downloads/attachments/ATT-000940",
        parseStatus: "Parsed",
        parserConfidence: 85,
        extractedInvoiceRefs: ["INV-46020"],
        createdAt: "2024-12-15T10:05:48Z",
      },
    ];

    const attachmentIdsByEmail = new Map<string, string[]>();
    attachments.forEach((attachment) => {
      const existing = attachmentIdsByEmail.get(attachment.emailId) || [];
      existing.push(attachment.id);
      attachmentIdsByEmail.set(attachment.emailId, existing);
    });

    type EmailSeed = Omit<
      RawEmailMessage,
      | "mailbox"
      | "status"
      | "labels"
      | "assigned_to"
      | "attachments"
      | "extraction"
      | "linked_payment_id"
      | "activity_timeline"
    >;

    const baseEmails: EmailSeed[] = [
      {
        id: "EML-000501",
        mailboxId: "MBX-AR-001",
        fromName: "Acme Retail AP",
        fromEmail: "ap@acmeretail.com",
        toEmail: "ar@meeru.ai",
        subject: "Remittance Advice - PMT-2024-10006",
        receivedAt: "2024-12-15T09:12:00Z",
        bodyText: "Attached remittance for INV-20060 (payment PMT-2024-10006).",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 92,
        candidateCustomerName: "Acme Retail",
        candidateCustomerNumber: "AC-1001",
        linkedRemittanceId: "REM-EMAIL-10006",
        createdAt: "2024-12-15T09:12:00Z",
        updatedAt: "2024-12-15T09:20:00Z",
      },
      {
        id: "EML-000502",
        mailboxId: "MBX-AR-001",
        fromName: "Bluebird Supply",
        fromEmail: "ap@bluebird.com",
        toEmail: "ar@meeru.ai",
        subject: "Payment Advice PMT-2024-10012",
        receivedAt: "2024-12-15T09:14:00Z",
        bodyText: "Please see attached remittance for INV-20120 and INV-20125.",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 90,
        candidateCustomerName: "Bluebird Supply",
        candidateCustomerNumber: "BB-2012",
        linkedRemittanceId: "REM-EMAIL-10012",
        createdAt: "2024-12-15T09:14:00Z",
        updatedAt: "2024-12-15T09:21:00Z",
      },
      {
        id: "EML-000503",
        mailboxId: "MBX-AR-001",
        fromName: "Caspian Tech",
        fromEmail: "payments@caspian.com",
        toEmail: "ar@meeru.ai",
        subject: "Remittance INV-20140 summary",
        receivedAt: "2024-12-15T09:18:00Z",
        bodyText: "Summary remittance attached.",
        attachmentIds: [],
        parseStatus: "Unparsed",
        parserConfidence: 0,
        candidateCustomerName: "Caspian Tech",
        candidateCustomerNumber: "CT-4400",
        createdAt: "2024-12-15T09:18:00Z",
        updatedAt: "2024-12-15T09:18:00Z",
      },
      {
        id: "EML-000504",
        mailboxId: "MBX-AR-001",
        fromName: "Dynamo Parts",
        fromEmail: "ap@dynamoparts.com",
        toEmail: "ar@meeru.ai",
        subject: "December Payment Detail",
        receivedAt: "2024-12-15T09:21:00Z",
        bodyText: "Remittance detail attached (includes discounts).",
        attachmentIds: [],
        parseStatus: "Unparsed",
        parserConfidence: 0,
        candidateCustomerName: "Dynamo Parts",
        candidateCustomerNumber: "DY-2200",
        createdAt: "2024-12-15T09:21:00Z",
        updatedAt: "2024-12-15T09:21:00Z",
      },
      {
        id: "EML-000505",
        mailboxId: "MBX-AR-001",
        fromName: "Echo Manufacturing",
        fromEmail: "ap@echomfg.com",
        toEmail: "ar@meeru.ai",
        subject: "Remittance Attachment",
        receivedAt: "2024-12-15T09:24:00Z",
        bodyText: "Unable to open attached scan.",
        attachmentIds: [],
        parseStatus: "Failed",
        parserConfidence: 18,
        errorReason: "Unreadable scanned PDF",
        candidateCustomerName: "Echo Manufacturing",
        candidateCustomerNumber: "EM-3300",
        createdAt: "2024-12-15T09:24:00Z",
        updatedAt: "2024-12-15T09:24:30Z",
      },
      {
        id: "EML-000506",
        mailboxId: "MBX-AR-001",
        fromName: "Foxtrot Foods",
        fromEmail: "ap@foxtrotfoods.com",
        toEmail: "ar@meeru.ai",
        subject: "Remittance Advice INV-30510",
        receivedAt: "2024-12-15T09:26:00Z",
        bodyText: "Invoice INV-30510 paid in full. See XLSX for discount column.",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 89,
        candidateCustomerName: "Foxtrot Foods",
        candidateCustomerNumber: "FF-30510",
        createdAt: "2024-12-15T09:26:00Z",
        updatedAt: "2024-12-15T09:27:00Z",
      },
      {
        id: "EML-000507",
        mailboxId: "MBX-AR-001",
        fromName: "American Glass Dist.",
        fromEmail: "ar@amerglass.com",
        toEmail: "ar@meeru.ai",
        subject: "Missing Remittance Details for Payment 51021",
        receivedAt: "2024-12-15T09:28:00Z",
        bodyText: "Payment 51021 applies to INV-21001, INV-21002, INV-21003.",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 87,
        candidateCustomerName: "American Glass Dist.",
        candidateCustomerNumber: "04050017234",
        linkedRemittanceId: "REM-EMAIL-51021",
        createdAt: "2024-12-15T09:28:00Z",
        updatedAt: "2024-12-15T09:29:00Z",
      },
      {
        id: "EML-000508",
        mailboxId: "MBX-AR-001",
        fromName: "Global Retail Group",
        fromEmail: "ap@globalretail.com",
        toEmail: "ar@meeru.ai",
        subject: "Payment Advice - Global Retail Group",
        receivedAt: "2024-12-15T09:31:00Z",
        bodyText: "Remittance attached for cross-entity invoices.",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 90,
        candidateCustomerName: "Global Retail Group",
        candidateCustomerNumber: "USGRP-1001",
        createdAt: "2024-12-15T09:31:00Z",
        updatedAt: "2024-12-15T09:33:00Z",
      },
      {
        id: "EML-000509",
        mailboxId: "MBX-AR-001",
        fromName: "Global Retail Group",
        fromEmail: "ap@globalretail.com",
        toEmail: "ar@meeru.ai",
        subject: "Intercompany Remittance INV-US-70001 / INV-CA-80001",
        receivedAt: "2024-12-15T09:33:00Z",
        bodyText: "Payment 51110 remittance attached.",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 94,
        candidateCustomerName: "Global Retail Group",
        candidateCustomerNumber: "USGRP-1001",
        linkedRemittanceId: "REM-EMAIL-51110",
        createdAt: "2024-12-15T09:33:00Z",
        updatedAt: "2024-12-15T09:34:00Z",
      },
      {
        id: "EML-000510",
        mailboxId: "MBX-AR-001",
        fromName: "Indigo Labs",
        fromEmail: "ap@indigo.com",
        toEmail: "ar@meeru.ai",
        subject: "FW: Remittance",
        receivedAt: "2024-12-15T09:36:00Z",
        bodyText: "Forwarded remittance, not yet processed.",
        attachmentIds: [],
        parseStatus: "Unparsed",
        parserConfidence: 0,
        candidateCustomerName: "Indigo Labs",
        candidateCustomerNumber: "IL-7800",
        createdAt: "2024-12-15T09:36:00Z",
        updatedAt: "2024-12-15T09:36:00Z",
      },
      {
        id: "EML-000511",
        mailboxId: "MBX-REMIT-001",
        fromName: "HP Inc.",
        fromEmail: "ap@hp.com",
        toEmail: "ar.remit@meeru.ai",
        subject: "Remittance - PMT-2024-51090",
        receivedAt: "2024-12-15T09:40:00Z",
        bodyText: "Payment PMT-2024-51090 remittance attached.",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 88,
        candidateCustomerName: "HP Inc.",
        candidateCustomerNumber: "HP-0001",
        linkedRemittanceId: "REM-EMAIL-51090",
        createdAt: "2024-12-15T09:40:00Z",
        updatedAt: "2024-12-15T09:41:00Z",
      },
      {
        id: "EML-000512",
        mailboxId: "MBX-REMIT-001",
        fromName: "Jupiter Logistics",
        fromEmail: "ap@jupiter.com",
        toEmail: "ar.remit@meeru.ai",
        subject: "Remittance PMT-2024-10018",
        receivedAt: "2024-12-15T09:41:00Z",
        bodyText: "See attached remittance for INV-20180.",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 90,
        candidateCustomerName: "Jupiter Logistics",
        candidateCustomerNumber: "JL-10018",
        linkedRemittanceId: "REM-EMAIL-10018",
        createdAt: "2024-12-15T09:41:00Z",
        updatedAt: "2024-12-15T09:42:00Z",
      },
      {
        id: "EML-000513",
        mailboxId: "MBX-REMIT-001",
        fromName: "Keystone Motors",
        fromEmail: "ap@keystone.com",
        toEmail: "ar.remit@meeru.ai",
        subject: "Payment detail",
        receivedAt: "2024-12-15T09:44:00Z",
        bodyText: "Attachment is secure and requires password.",
        attachmentIds: [],
        parseStatus: "Failed",
        parserConfidence: 15,
        errorReason: "PDF is password-protected",
        candidateCustomerName: "Keystone Motors",
        candidateCustomerNumber: "KM-9910",
        createdAt: "2024-12-15T09:44:00Z",
        updatedAt: "2024-12-15T09:44:30Z",
      },
      {
        id: "EML-000514",
        mailboxId: "MBX-REMIT-001",
        fromName: "Lumen Healthcare",
        fromEmail: "ap@lumen.com",
        toEmail: "ar.remit@meeru.ai",
        subject: "Remittance Advice INV-22110",
        receivedAt: "2024-12-15T09:47:00Z",
        bodyText: "Totals mismatch: invoices include discount column.",
        attachmentIds: [],
        parseStatus: "Partial",
        parserConfidence: 78,
        errorReason: "Totals mismatch by $320",
        candidateCustomerName: "Lumen Healthcare",
        candidateCustomerNumber: "LH-22110",
        linkedRemittanceId: "REM-EMAIL-PART-1",
        createdAt: "2024-12-15T09:47:00Z",
        updatedAt: "2024-12-15T09:48:00Z",
      },
      {
        id: "EML-000515",
        mailboxId: "MBX-REMIT-001",
        fromName: "Metro Wholesale",
        fromEmail: "ap@metrowholesale.com",
        toEmail: "ar.remit@meeru.ai",
        subject: "Remittance Advice",
        receivedAt: "2024-12-15T09:49:00Z",
        bodyText: "See attachments for invoice breakdown.",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 86,
        candidateCustomerName: "Metro Wholesale",
        candidateCustomerNumber: "MW-22220",
        createdAt: "2024-12-15T09:49:00Z",
        updatedAt: "2024-12-15T09:50:00Z",
      },
      {
        id: "EML-000516",
        mailboxId: "MBX-REMIT-001",
        fromName: "Nadir Services",
        fromEmail: "ap@nadir.com",
        toEmail: "ar.remit@meeru.ai",
        subject: "Payment Advice INV-22340",
        receivedAt: "2024-12-15T09:52:00Z",
        bodyText: "Forwarded remittance; pending parse.",
        attachmentIds: [],
        parseStatus: "Unparsed",
        parserConfidence: 0,
        candidateCustomerName: "Nadir Services",
        candidateCustomerNumber: "NS-22340",
        createdAt: "2024-12-15T09:52:00Z",
        updatedAt: "2024-12-15T09:52:00Z",
      },
      {
        id: "EML-000517",
        mailboxId: "MBX-REMIT-001",
        fromName: "Omega Retail",
        fromEmail: "ap@omegaretail.com",
        toEmail: "ar.remit@meeru.ai",
        subject: "CSV Remittance",
        receivedAt: "2024-12-15T09:55:00Z",
        bodyText: "CSV totals do not match payment record.",
        attachmentIds: [],
        parseStatus: "Failed",
        parserConfidence: 42,
        errorReason: "Payment not found; CSV totals mismatch",
        candidateCustomerName: "Omega Retail",
        candidateCustomerNumber: "OR-33010",
        linkedRemittanceId: "REM-EMAIL-UNL-1",
        createdAt: "2024-12-15T09:55:00Z",
        updatedAt: "2024-12-15T09:56:00Z",
      },
      {
        id: "EML-000518",
        mailboxId: "MBX-REMIT-001",
        fromName: "Pinnacle Systems",
        fromEmail: "ap@pinnaclesys.com",
        toEmail: "ar.remit@meeru.ai",
        subject: "Remittance CSV + Notes",
        receivedAt: "2024-12-15T09:57:00Z",
        bodyText: "CSV attached with notes file.",
        attachmentIds: [],
        parseStatus: "Unparsed",
        parserConfidence: 0,
        candidateCustomerName: "Pinnacle Systems",
        candidateCustomerNumber: "PS-8870",
        createdAt: "2024-12-15T09:57:00Z",
        updatedAt: "2024-12-15T09:57:00Z",
      },
      {
        id: "EML-000519",
        mailboxId: "MBX-REMIT-001",
        fromName: "Quantum Energy",
        fromEmail: "ap@quantum.com",
        toEmail: "ar.remit@meeru.ai",
        subject: "Remittance CSV",
        receivedAt: "2024-12-15T09:58:00Z",
        bodyText: "CSV attached; pending parse.",
        attachmentIds: [],
        parseStatus: "Unparsed",
        parserConfidence: 0,
        candidateCustomerName: "Quantum Energy",
        candidateCustomerNumber: "QE-9012",
        createdAt: "2024-12-15T09:58:00Z",
        updatedAt: "2024-12-15T09:58:00Z",
      },
      {
        id: "EML-000520",
        mailboxId: "MBX-REMIT-001",
        fromName: "Raptor Holdings",
        fromEmail: "ap@raptor.com",
        toEmail: "ar.remit@meeru.ai",
        subject: "Remittance Multiple Invoices",
        receivedAt: "2024-12-15T10:00:00Z",
        bodyText: "Multiple invoices with missing payment reference.",
        attachmentIds: [],
        parseStatus: "Failed",
        parserConfidence: 52,
        errorReason: "Missing payment record; totals mismatch",
        candidateCustomerName: "Raptor Holdings",
        candidateCustomerNumber: "RH-44001",
        linkedRemittanceId: "REM-EMAIL-UNL-2",
        createdAt: "2024-12-15T10:00:00Z",
        updatedAt: "2024-12-15T10:01:00Z",
      },
      {
        id: "EML-000521",
        mailboxId: "MBX-ESC-001",
        fromName: "Starlight Media",
        fromEmail: "ap@starlight.com",
        toEmail: "ar.escalations@meeru.ai",
        subject: "Escalation: Remittance not recognized",
        receivedAt: "2024-12-15T10:01:00Z",
        bodyText: "Customer is asking for confirmation.",
        attachmentIds: [],
        parseStatus: "Unparsed",
        parserConfidence: 0,
        candidateCustomerName: "Starlight Media",
        candidateCustomerNumber: "SM-1200",
        createdAt: "2024-12-15T10:01:00Z",
        updatedAt: "2024-12-15T10:01:00Z",
      },
      {
        id: "EML-000522",
        mailboxId: "MBX-ESC-001",
        fromName: "Titan Aerospace",
        fromEmail: "ap@titan.com",
        toEmail: "ar.escalations@meeru.ai",
        subject: "Remittance XLSX",
        receivedAt: "2024-12-15T10:03:00Z",
        bodyText: "XLSX detail attached for invoice INV-45010.",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 88,
        candidateCustomerName: "Titan Aerospace",
        candidateCustomerNumber: "TA-45010",
        createdAt: "2024-12-15T10:03:00Z",
        updatedAt: "2024-12-15T10:04:00Z",
      },
      {
        id: "EML-000523",
        mailboxId: "MBX-ESC-001",
        fromName: "Umbra Tech",
        fromEmail: "ap@umbra.com",
        toEmail: "ar.escalations@meeru.ai",
        subject: "Invoice references for Dec payment",
        receivedAt: "2024-12-15T10:04:00Z",
        bodyText: "Invoices: INV-47001, INV-47002. Amounts not specified.",
        attachmentIds: [],
        parseStatus: "Partial",
        parserConfidence: 80,
        errorReason: "Invoice refs present without amounts",
        candidateCustomerName: "Umbra Tech",
        candidateCustomerNumber: "UT-4700",
        linkedRemittanceId: "REM-EMAIL-PART-2",
        createdAt: "2024-12-15T10:04:00Z",
        updatedAt: "2024-12-15T10:05:00Z",
      },
      {
        id: "EML-000524",
        mailboxId: "MBX-ESC-001",
        fromName: "Vector Data",
        fromEmail: "ap@vector.com",
        toEmail: "ar.escalations@meeru.ai",
        subject: "Remittance CSV + Notes",
        receivedAt: "2024-12-15T10:05:00Z",
        bodyText: "CSV and TXT notes attached for INV-46020.",
        attachmentIds: [],
        parseStatus: "Parsed",
        parserConfidence: 85,
        candidateCustomerName: "Vector Data",
        candidateCustomerNumber: "VD-46020",
        createdAt: "2024-12-15T10:05:00Z",
        updatedAt: "2024-12-15T10:06:00Z",
      },
      {
        id: "EML-000525",
        mailboxId: "MBX-ESC-001",
        fromName: "Waveline Goods",
        fromEmail: "ap@waveline.com",
        toEmail: "ar.escalations@meeru.ai",
        subject: "Remittance CSV",
        receivedAt: "2024-12-15T10:06:00Z",
        bodyText: "Remittance CSV attached.",
        attachmentIds: [],
        parseStatus: "Unparsed",
        parserConfidence: 0,
        candidateCustomerName: "Waveline Goods",
        candidateCustomerNumber: "WG-8800",
        createdAt: "2024-12-15T10:06:00Z",
        updatedAt: "2024-12-15T10:06:00Z",
      },
    ];

    const mailboxById: Record<string, EmailMailbox> = {
      "MBX-REMIT-001": "AR.REMIT",
      "MBX-AR-001": "AR",
      "MBX-ESC-001": "OTHER",
    };
    const statusFromParse: Record<ParseStatus, EmailStatus> = {
      Unparsed: "NEW",
      Parsed: "EXTRACTED",
      Partial: "PARTIAL",
      Failed: "FAILED",
    };
    const statusOverrides: Record<string, EmailStatus> = {
      "EML-000501": "PROCESSED",
      "EML-000511": "EXTRACTED",
      "EML-000512": "EXTRACTED",
      "EML-000503": "NEW",
      "EML-000504": "NEW",
      "EML-000510": "NEW",
      "EML-000514": "PARTIAL",
      "EML-000513": "FAILED",
    };
    const linkedPaymentByEmail: Record<string, string> = {
      "EML-000511": "pay-1011",
      "EML-000512": "pay-1018",
    };
    const labelsByEmail: Record<string, string[]> = {
      "EML-000514": ["Dispute", "Follow-up"],
      "EML-000513": ["Escalation"],
      "EML-000521": ["Follow-up"],
    };
    const assignedByEmail: Record<string, string> = {
      "EML-000514": "Jessica Martinez",
      "EML-000513": "Michael Roberts",
    };

    const attachmentTypeMap = (type: RawAttachment["fileType"]): EmailAttachment["type"] => {
      if (type === "PDF") return "PDF";
      if (type === "CSV") return "CSV";
      if (type === "XLSX") return "XLS";
      return "OTHER";
    };

    let emails: RawEmailMessage[] = baseEmails.map((email) => {
      const mailbox = mailboxById[email.mailboxId] || "OTHER";
      const status = statusOverrides[email.id] || statusFromParse[email.parseStatus];
      const linkedPayment = linkedPaymentByEmail[email.id];
      const attachmentsForEmail = attachments
        .filter((attachment) => attachment.emailId === email.id)
        .map((attachment) => ({
          id: attachment.id,
          name: attachment.fileName,
          type: attachmentTypeMap(attachment.fileType),
        }));
      const baseTimeline: ActivityTimelineEntry[] = [
        {
          event: "Email Received",
          detail: `From ${email.fromEmail}`,
          actor: "System",
          ts: email.receivedAt,
        },
      ];
      if (status === "FAILED") {
        baseTimeline.push({
          event: "Extraction Failed",
          detail: email.errorReason || "Extraction failed",
          actor: "System",
          ts: email.updatedAt,
        });
      } else if (status === "PARTIAL") {
        baseTimeline.push({
          event: "Marked Partial",
          detail: email.errorReason || "Manual review required",
          actor: "System",
          ts: email.updatedAt,
        });
      } else if (status === "EXTRACTED" || status === "PROCESSED") {
        baseTimeline.push({
          event: "Extraction Run",
          detail: "Extraction completed",
          actor: "System",
          ts: email.updatedAt,
        });
      }
      if (linkedPayment) {
        baseTimeline.push({
          event: "Linked to Payment",
          detail: `Linked to ${linkedPayment}`,
          actor: "User",
          ts: email.updatedAt,
        });
      }

      return {
        ...email,
        attachmentIds: attachmentIdsByEmail.get(email.id) || [],
        mailbox,
        status,
        labels: labelsByEmail[email.id] || [],
        assigned_to: assignedByEmail[email.id],
        attachments: attachmentsForEmail,
        linked_payment_id: linkedPayment,
        activity_timeline: baseTimeline,
      };
    });

    const remittanceSeeds = [
      {
        id: "REM-EMAIL-10006",
        emailId: "EML-000501",
        remittanceNumber: "REM-2024-10006",
        remittanceHeaderId: "HDR-REM-10006",
        receivedDate: "2024-12-15",
        effectiveDate: "2024-12-14",
        customerName: "Acme Retail",
        customerId: "CUST-ACME-1001",
        customerNumber: "AC-1001",
        remittanceAmount: 45210,
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-20060", amount: 45210, discountAmount: 0, reasonCode: "FULL" },
        ],
        linkStatus: "Linked",
        status: "Parsed",
        inputFileUrl: "/mock/downloads/remittances/remit_pmt_10006.pdf",
        parserConfidence: 92,
      },
      {
        id: "REM-EMAIL-10012",
        emailId: "EML-000502",
        remittanceNumber: "REM-2024-10012",
        remittanceHeaderId: "HDR-REM-10012",
        receivedDate: "2024-12-15",
        effectiveDate: "2024-12-14",
        customerName: "Bluebird Supply",
        customerId: "CUST-BB-2012",
        customerNumber: "BB-2012",
        remittanceAmount: 78000,
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-20120", amount: 52000, discountAmount: 0, reasonCode: "FULL" },
          { invoiceNumber: "INV-20125", amount: 26000, discountAmount: 0, reasonCode: "FULL" },
        ],
        linkStatus: "Linked",
        status: "Parsed",
        inputFileUrl: "/mock/downloads/remittances/remit_pmt_10012.pdf",
        parserConfidence: 90,
      },
      {
        id: "REM-EMAIL-51021",
        emailId: "EML-000507",
        remittanceNumber: "REM-2024-51021",
        remittanceHeaderId: "HDR-REM-51021",
        receivedDate: "2024-12-15",
        effectiveDate: "2024-12-15",
        customerName: "American Glass Dist.",
        customerId: "CUST-AMERGLASS-04050017234",
        customerNumber: "04050017234",
        remittanceAmount: 10000,
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-21001", amount: 4850, discountAmount: 0, reasonCode: "FULL" },
          { invoiceNumber: "INV-21002", amount: 3200, discountAmount: 0, reasonCode: "FULL" },
          { invoiceNumber: "INV-21003", amount: 1950, discountAmount: 0, reasonCode: "FULL" },
        ],
        linkStatus: "Linked",
        status: "Parsed",
        inputFileUrl: "/mock/downloads/remittances/remit_51021.txt",
        parserConfidence: 87,
      },
      {
        id: "REM-EMAIL-51110",
        emailId: "EML-000509",
        remittanceNumber: "REM-2024-51110",
        remittanceHeaderId: "HDR-REM-51110",
        receivedDate: "2024-12-15",
        effectiveDate: "2024-12-15",
        customerName: "Global Retail Group",
        customerId: "CUST-GLOBAL-RETAIL-001",
        customerNumber: "USGRP-1001",
        remittanceAmount: 100000,
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-US-70001", amount: 60000, discountAmount: 0, reasonCode: "FULL" },
          { invoiceNumber: "INV-CA-80001", amount: 40000, discountAmount: 0, reasonCode: "FULL" },
        ],
        linkStatus: "Linked",
        status: "Parsed",
        inputFileUrl: "/mock/downloads/remittances/remit_51110.pdf",
        parserConfidence: 94,
      },
      {
        id: "REM-EMAIL-51090",
        emailId: "EML-000511",
        remittanceNumber: "REM-2024-51090",
        remittanceHeaderId: "HDR-REM-51090",
        receivedDate: "2024-12-15",
        effectiveDate: "2024-12-14",
        customerName: "HP Inc.",
        customerId: "CUST-HP-001",
        customerNumber: "HP-0001",
        remittanceAmount: 239034,
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-10000", amount: 184651, discountAmount: 0, reasonCode: "FULL" },
          { invoiceNumber: "INV-10001", amount: 54383, discountAmount: 0, reasonCode: "FULL" },
        ],
        linkStatus: "Linked",
        status: "Parsed",
        inputFileUrl: "/mock/downloads/remittances/remit_51090.pdf",
        parserConfidence: 88,
      },
      {
        id: "REM-EMAIL-10018",
        emailId: "EML-000512",
        remittanceNumber: "REM-2024-10018",
        remittanceHeaderId: "HDR-REM-10018",
        receivedDate: "2024-12-15",
        effectiveDate: "2024-12-14",
        customerName: "Jupiter Logistics",
        customerId: "CUST-JL-10018",
        customerNumber: "JL-10018",
        remittanceAmount: 56000,
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-20180", amount: 56000, discountAmount: 0, reasonCode: "FULL" },
        ],
        linkStatus: "Linked",
        status: "Parsed",
        inputFileUrl: "/mock/downloads/remittances/remit_10018.pdf",
        parserConfidence: 90,
      },
      {
        id: "REM-EMAIL-UNL-1",
        emailId: "EML-000517",
        remittanceNumber: "REM-2024-UNL-1",
        remittanceHeaderId: "HDR-REM-UNL-1",
        receivedDate: "2024-12-15",
        effectiveDate: "2024-12-15",
        customerName: "Omega Retail",
        customerId: "CUST-OR-33010",
        customerNumber: "OR-33010",
        remittanceAmount: 42000,
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-33010", amount: 14000 },
          { invoiceNumber: "INV-33011", amount: 14000 },
          { invoiceNumber: "INV-33012", amount: 14000 },
        ],
        linkStatus: "Unlinked",
        status: "Failed",
        inputFileUrl: "/mock/downloads/remittances/omega_multi.csv",
        exceptionDetails: "No payment found; CSV totals mismatch",
        parserConfidence: 42,
      },
      {
        id: "REM-EMAIL-UNL-2",
        emailId: "EML-000520",
        remittanceNumber: "REM-2024-UNL-2",
        remittanceHeaderId: "HDR-REM-UNL-2",
        receivedDate: "2024-12-15",
        effectiveDate: "2024-12-15",
        customerName: "Raptor Holdings",
        customerId: "CUST-RH-44001",
        customerNumber: "RH-44001",
        remittanceAmount: 60000,
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-44001", amount: 20000 },
          { invoiceNumber: "INV-44002", amount: 20000 },
          { invoiceNumber: "INV-44003", amount: 20000 },
        ],
        linkStatus: "Unlinked",
        status: "Failed",
        inputFileUrl: "/mock/downloads/remittances/raptor_multi.csv",
        exceptionDetails: "Missing payment record; totals mismatch",
        parserConfidence: 50,
      },
      {
        id: "REM-EMAIL-PART-1",
        emailId: "EML-000514",
        remittanceNumber: "REM-2024-PART-1",
        remittanceHeaderId: "HDR-REM-PART-1",
        receivedDate: "2024-12-15",
        effectiveDate: "2024-12-14",
        customerName: "Lumen Healthcare",
        customerId: "CUST-LH-22110",
        customerNumber: "LH-22110",
        remittanceAmount: 39800,
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-22110", amount: 21000, discountAmount: 200, reasonCode: "DISC" },
          { invoiceNumber: "INV-22111", amount: 19000, discountAmount: 120, reasonCode: "DISC" },
        ],
        linkStatus: "Partial",
        status: "Partial",
        inputFileUrl: "/mock/downloads/remittances/lumen_discount.xlsx",
        exceptionDetails: "Totals mismatch by $320",
        parserConfidence: 78,
      },
      {
        id: "REM-EMAIL-PART-2",
        emailId: "EML-000523",
        remittanceNumber: "REM-2024-PART-2",
        remittanceHeaderId: "HDR-REM-PART-2",
        receivedDate: "2024-12-15",
        effectiveDate: "2024-12-15",
        customerName: "Umbra Tech",
        customerId: "CUST-UT-4700",
        customerNumber: "UT-4700",
        remittanceAmount: 0,
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-47001", amount: 0 },
          { invoiceNumber: "INV-47002", amount: 0 },
        ],
        linkStatus: "Partial",
        status: "Partial",
        inputFileUrl: "/mock/downloads/remittances/umbra_body_only.txt",
        exceptionDetails: "Invoice refs without amounts",
        parserConfidence: 80,
      },
    ];

    const remittanceSeedByEmailId = new Map(remittanceSeeds.map((seed) => [seed.emailId, seed]));
    const buildExtractionFromSeed = (
      seed: (typeof remittanceSeeds)[number],
      email: RawEmailMessage
    ): EmailExtraction => {
      const invoiceNumbers =
        seed.extractedReferencesDetailed?.map((ref) => ref.invoiceNumber) || [];
      const baseConfidence = seed.parserConfidence ?? email.parserConfidence ?? 75;
      return {
        payer: email.candidateCustomerName || email.fromName,
        customer: email.candidateCustomerName,
        amount_total: seed.remittanceAmount,
        currency: "USD",
        payment_date: seed.effectiveDate,
        invoice_numbers: invoiceNumbers,
        confidence_overall: baseConfidence,
        confidence_sections: {
          header: Math.min(98, baseConfidence + 4),
          invoices: Math.max(40, baseConfidence - 6),
          amounts: Math.max(35, baseConfidence - 8),
        },
        errors:
          seed.status === "Failed" || seed.linkStatus === "Failed"
            ? [seed.exceptionDetails || email.errorReason || "Extraction failed"]
            : undefined,
      };
    };

    emails = emails.map((email) => {
      const seed = remittanceSeedByEmailId.get(email.id);
      if (!seed) return email;
      return {
        ...email,
        extraction: email.extraction || buildExtractionFromSeed(seed, email),
      };
    });

    const emailLookup = new Map(emails.map((email) => [email.id, email]));
    const remittances: Remittance[] = remittanceSeeds.map((seed) => {
      const email = emailLookup.get(seed.emailId);
      const attachmentNames = attachments
        .filter((attachment) => attachment.emailId === seed.emailId)
        .map((attachment) => attachment.fileName);
      const attachmentItems = attachmentNames.map((name) => {
        const extension = name.split(".").pop() || "";
        return {
          name,
          type: extension ? extension.toUpperCase() : "FILE",
          size: extension === "PDF" ? "1.2 MB" : "420 KB",
          url: seed.inputFileUrl,
        };
      });
      const extractedReferences = seed.extractedReferencesDetailed?.map((ref) => ({
        invoice: ref.invoiceNumber,
        amount: ref.amount,
      }));
      const extractStatus =
        seed.status === "Parsed"
          ? "EXTRACTED"
          : seed.status === "Partial"
            ? "PARTIAL"
            : seed.status === "Failed"
              ? "FAILED"
              : "NOT_EXTRACTED";
      const linkStatus =
        seed.linkStatus === "Linked"
          ? "LINKED"
          : seed.linkStatus === "Unlinked"
            ? "UNLINKED"
            : "MULTI_MATCH";
      const extraction =
        email?.extraction || (email ? buildExtractionFromSeed(seed, email) : undefined);
      const extractedFields = extraction
        ? {
            customer: extraction.customer || seed.customerName,
            payment_date: extraction.payment_date || seed.effectiveDate,
            amount: extraction.amount_total,
            currency: extraction.currency,
            reference: seed.remittanceNumber,
            method: seed.inputFileUrl?.endsWith(".xlsx") ? "OCR" : "AI",
          }
        : undefined;
      const extractedLineItems = (seed.extractedReferencesDetailed || []).map((ref) => {
        const discount = "discountAmount" in ref ? ref.discountAmount : 0;
        const reasonCode = "reasonCode" in ref ? ref.reasonCode : undefined;
        return {
          invoice_number: ref.invoiceNumber,
          invoice_amount: ref.amount,
          paid_amount: ref.amount - (discount || 0),
          discount: discount || 0,
          credit_memo_ref: reasonCode === "CM" ? `CM-${ref.invoiceNumber}` : undefined,
          notes: reasonCode === "DISC" ? "Early pay discount" : undefined,
        };
      });
      const validationChecks: Array<{
        status: RemittanceValidationStatus;
        label: string;
        detail?: string;
      }> = extraction
        ? [
            { status: "PASS", label: "Invoices exist in NetSuite" },
            {
              status: (extractStatus === "PARTIAL" ? "WARN" : "PASS") as RemittanceValidationStatus,
              label: "Totals match",
              detail:
                extractStatus === "PARTIAL"
                  ? seed.exceptionDetails || "Difference: $320"
                  : undefined,
            },
            {
              status: (linkStatus === "MULTI_MATCH"
                ? "WARN"
                : "PASS") as RemittanceValidationStatus,
              label: "Currency match",
            },
            {
              status: (seed.status === "Failed" ? "WARN" : "PASS") as RemittanceValidationStatus,
              label: seed.status === "Failed" ? "Invoice closed" : "Invoice status ok",
            },
          ]
        : [];
      const activityLog = (email?.activity_timeline || []).map((entry) => ({
        event: entry.event,
        actor: entry.actor,
        ts: entry.ts,
        detail: entry.detail,
      }));

      return {
        id: seed.id,
        remittanceNumber: seed.remittanceNumber,
        remittanceHeaderId: seed.remittanceHeaderId,
        source: "Email",
        receivedDate: seed.receivedDate,
        effectiveDate: seed.effectiveDate,
        customerName: seed.customerName,
        customerId: seed.customerId,
        customerNumber: seed.customerNumber,
        totalAmount: seed.remittanceAmount,
        remittanceAmount: seed.remittanceAmount,
        status: seed.status,
        emailSubject: email?.subject,
        subject: email?.subject,
        emailIdentifier: seed.emailId,
        attachments: attachmentItems,
        extractedReferences,
        extractedReferencesDetailed: seed.extractedReferencesDetailed,
        linkStatus: seed.linkStatus,
        extract_status: extractStatus,
        link_status: linkStatus,
        confidence_score: seed.parserConfidence ?? extraction?.confidence_overall ?? null,
        key_reference: seed.remittanceNumber.replace("REM-", "WT"),
        invoices_found_count: seed.extractedReferencesDetailed?.length || 0,
        extract_reason:
          extractStatus === "FAILED" || extractStatus === "PARTIAL"
            ? seed.exceptionDetails || email?.errorReason || "Missing invoice numbers"
            : undefined,
        link_reason:
          linkStatus === "UNLINKED" || linkStatus === "MULTI_MATCH"
            ? seed.exceptionDetails || "Missing payment reference"
            : undefined,
        linked_payment_id: email?.linked_payment_id || null,
        email_metadata: email
          ? {
              from: email.fromEmail,
              to: email.toEmail,
              subject: email.subject,
              received_ts: email.receivedAt,
              body: email.bodyText,
            }
          : undefined,
        extracted_fields: extractedFields,
        extracted_line_items: extractedLineItems,
        validation_checks: validationChecks,
        activity_log: activityLog,
        inputFileUrl: seed.inputFileUrl,
        exceptionDetails: seed.exceptionDetails,
        parserConfidence: seed.parserConfidence,
        createdAt: email?.receivedAt || `${seed.receivedDate}T00:00:00Z`,
      };
    });

    const remittanceRecords: RemittanceRecord[] = remittanceSeeds
      .filter((seed) => seed.linkStatus === "Linked")
      .flatMap((seed) => {
        const email = emailLookup.get(seed.emailId);
        if (!email) return [];
        return [
          {
            remittance_id: seed.remittanceNumber,
            email_id: seed.emailId,
            linked_payment_id: email.linked_payment_id,
            extracted_fields: email.extraction || buildExtractionFromSeed(seed, email),
            created_at: email.receivedAt || `${seed.receivedDate}T00:00:00Z`,
          },
        ];
      });

    this.mailboxConfigs.push(...mailboxes);
    this.ingestionRuns.push(...ingestionRuns);
    this.rawAttachments.push(...attachments);
    this.rawEmailMessages.push(...emails);
    this.remittances.push(...remittances);
    this.remittanceRecords.push(...remittanceRecords);
  }

  private appendBankFeedSettlementPhase2(): void {
    const GHOST_PAYMENT_THRESHOLD_HOURS = 48;

    const bankFeedConfigs: BankFeedConfig[] = [
      {
        id: "BF-JPM-001",
        provider: "JPMorgan",
        accountId: "JPM-US-OPER-001",
        accountName: "JPM US Operating (US01)",
        currency: "USD",
        enabled: true,
        mode: "PrelimFinal",
        createdAt: "2024-12-14T08:00:00Z",
        updatedAt: "2024-12-15T08:00:00Z",
      },
      {
        id: "BF-JPM-002",
        provider: "JPMorgan",
        accountId: "JPM-US-LBX-001",
        accountName: "JPM Lockbox (US01)",
        currency: "USD",
        enabled: true,
        mode: "PrelimFinal",
        createdAt: "2024-12-14T08:00:00Z",
        updatedAt: "2024-12-15T08:00:00Z",
      },
    ];

    const bankFeedRuns: BankFeedRun[] = [
      {
        id: "BFR-PRELIM-20241216",
        bankFeedId: "BF-JPM-001",
        feedType: "Preliminary",
        statementDate: "2024-12-16",
        startedAt: "2024-12-16T06:00:00Z",
        finishedAt: "2024-12-16T06:04:00Z",
        status: "Success",
        transactionsPulled: 7,
        transactionsCreated: 7,
        transactionsUpdated: 0,
        errorSummary: [],
      },
      {
        id: "BFR-FINAL-20241217",
        bankFeedId: "BF-JPM-001",
        feedType: "Final",
        statementDate: "2024-12-17",
        startedAt: "2024-12-17T06:00:00Z",
        finishedAt: "2024-12-17T06:03:00Z",
        status: "Success",
        transactionsPulled: 3,
        transactionsCreated: 0,
        transactionsUpdated: 3,
        errorSummary: [],
      },
      {
        id: "BFR-PRELIM-20241217-LBX",
        bankFeedId: "BF-JPM-002",
        feedType: "Preliminary",
        statementDate: "2024-12-17",
        startedAt: "2024-12-17T06:05:00Z",
        finishedAt: "2024-12-17T06:12:00Z",
        status: "Partial",
        transactionsPulled: 2,
        transactionsCreated: 2,
        transactionsUpdated: 0,
        errorSummary: [
          "Missing check images for 2 items",
          "Lockbox detail truncated for batch LBX-1002",
        ],
      },
    ];

    const bankTransactions: BankTransaction[] = [
      {
        id: "BTX-PRE-900001",
        bankFeedId: "BF-JPM-001",
        feedType: "Preliminary",
        statementDate: "2024-12-16",
        transactionDate: "2024-12-16",
        amount: 125000,
        direction: "Credit",
        method: "ACH",
        bankReference: "JPM-PRE-900001",
        payerRaw: "NORTHRIDGE SUPPLY CO",
        memoRaw: "ACH CREDIT PAYMENTS DEC16",
        status: "Observed",
        createdAt: "2024-12-16T06:00:30Z",
      },
      {
        id: "BTX-PRE-900002",
        bankFeedId: "BF-JPM-001",
        feedType: "Preliminary",
        statementDate: "2024-12-16",
        transactionDate: "2024-12-16",
        amount: 485000,
        direction: "Credit",
        method: "Wire",
        bankReference: "JPM-PRE-900002",
        payerRaw: "VECTOR GLOBAL SERVICES",
        memoRaw: "WIRE TRANSFER DEC16",
        status: "Observed",
        createdAt: "2024-12-16T06:01:10Z",
      },
      {
        id: "BTX-PRE-900003",
        bankFeedId: "BF-JPM-002",
        feedType: "Preliminary",
        statementDate: "2024-12-16",
        transactionDate: "2024-12-16",
        amount: 94000,
        direction: "Credit",
        method: "Lockbox",
        bankReference: "LBX-PRE-1001",
        payerRaw: "LOCKBOX BATCH 1001",
        memoRaw: "LOCKBOX DEPOSITS",
        lockboxBatchId: "LBX-1001",
        status: "Observed",
        createdAt: "2024-12-16T06:02:05Z",
      },
      {
        id: "BTX-PRE-900004",
        bankFeedId: "BF-JPM-001",
        feedType: "Preliminary",
        statementDate: "2024-12-16",
        transactionDate: "2024-12-16",
        amount: 62000,
        direction: "Credit",
        method: "Check",
        bankReference: "JPM-PRE-900004",
        payerRaw: "STONE RIDGE GROUP",
        memoRaw: "CHK 78112",
        checkNumber: "78112",
        status: "Observed",
        createdAt: "2024-12-16T06:02:45Z",
      },
      {
        id: "BTX-PRE-900005",
        bankFeedId: "BF-JPM-001",
        feedType: "Preliminary",
        statementDate: "2024-12-16",
        transactionDate: "2024-12-16",
        amount: 88000,
        direction: "Credit",
        method: "EFT",
        bankReference: "JPM-PRE-900005",
        payerRaw: "APEX INDUSTRIAL",
        memoRaw: "EFT CREDIT",
        status: "Observed",
        createdAt: "2024-12-16T06:03:10Z",
      },
      {
        id: "BTX-PRE-900006",
        bankFeedId: "BF-JPM-001",
        feedType: "Preliminary",
        statementDate: "2024-12-16",
        transactionDate: "2024-12-16",
        amount: 132000,
        direction: "Credit",
        method: "ACH",
        bankReference: "JPM-PRE-900006",
        payerRaw: "SUMMIT HEALTH",
        memoRaw: "ACH CREDIT",
        status: "Observed",
        createdAt: "2024-12-16T06:03:40Z",
      },
      {
        id: "BTX-PRE-900007",
        bankFeedId: "BF-JPM-001",
        feedType: "Preliminary",
        statementDate: "2024-12-16",
        transactionDate: "2024-12-16",
        amount: 104000,
        direction: "Credit",
        method: "ACH",
        bankReference: "JPM-PRE-900007",
        payerRaw: "OASIS TECH",
        memoRaw: "ACH CREDIT PRELIM",
        status: "Observed",
        createdAt: "2024-12-16T06:04:10Z",
      },
      {
        id: "BTX-PRE-900008",
        bankFeedId: "BF-JPM-001",
        feedType: "Preliminary",
        statementDate: "2024-12-16",
        transactionDate: "2024-12-16",
        amount: 215000,
        direction: "Credit",
        method: "Wire",
        bankReference: "JPM-PRE-900008",
        payerRaw: "HARBOR WHOLESALE",
        memoRaw: "WIRE CREDIT PRELIM",
        status: "Observed",
        createdAt: "2024-12-16T06:04:40Z",
      },
      {
        id: "BTX-PRE-900009",
        bankFeedId: "BF-JPM-002",
        feedType: "Preliminary",
        statementDate: "2024-12-16",
        transactionDate: "2024-12-16",
        amount: 158000,
        direction: "Credit",
        method: "Lockbox",
        bankReference: "LBX-PRE-1002",
        payerRaw: "LOCKBOX BATCH 1002",
        memoRaw: "LOCKBOX DEPOSITS",
        lockboxBatchId: "LBX-1002",
        status: "Observed",
        createdAt: "2024-12-16T06:05:10Z",
      },
      {
        id: "BTX-FIN-900007",
        bankFeedId: "BF-JPM-001",
        feedType: "Final",
        statementDate: "2024-12-17",
        transactionDate: "2024-12-17",
        amount: 104000,
        direction: "Credit",
        method: "ACH",
        bankReference: "JPM-PRE-900007",
        payerRaw: "OASIS TECH",
        memoRaw: "ACH CREDIT FINAL",
        status: "Reconciled",
        createdAt: "2024-12-17T06:01:10Z",
      },
      {
        id: "BTX-FIN-900008",
        bankFeedId: "BF-JPM-001",
        feedType: "Final",
        statementDate: "2024-12-17",
        transactionDate: "2024-12-17",
        amount: 215000,
        direction: "Credit",
        method: "Wire",
        bankReference: "JPM-PRE-900008",
        payerRaw: "HARBOR WHOLESALE",
        memoRaw: "WIRE CREDIT FINAL",
        status: "Reconciled",
        createdAt: "2024-12-17T06:01:40Z",
      },
      {
        id: "BTX-FIN-900009",
        bankFeedId: "BF-JPM-002",
        feedType: "Final",
        statementDate: "2024-12-17",
        transactionDate: "2024-12-17",
        amount: 158000,
        direction: "Credit",
        method: "Lockbox",
        bankReference: "LBX-PRE-1002",
        payerRaw: "LOCKBOX BATCH 1002",
        memoRaw: "LOCKBOX FINAL",
        lockboxBatchId: "LBX-1002",
        status: "Reconciled",
        createdAt: "2024-12-17T06:02:10Z",
      },
    ];

    const lockboxItems: LockboxItem[] = [
      {
        id: "LBX-ITEM-1001-1",
        bankTransactionId: "BTX-PRE-900003",
        checkNumber: "514201",
        checkAmount: 42000,
        payerNameRaw: "GRANITE FOODS",
        imageUrl: "/mock/lockbox/514201.png",
        micrRaw: "MICR-514201-001",
        status: "Captured",
        createdAt: "2024-12-16T06:02:20Z",
      },
      {
        id: "LBX-ITEM-1001-2",
        bankTransactionId: "BTX-PRE-900003",
        checkNumber: "514202",
        checkAmount: 52000,
        payerNameRaw: "EVEREST MEDICAL",
        imageUrl: "/mock/lockbox/514202.png",
        micrRaw: "MICR-514202-002",
        status: "Captured",
        createdAt: "2024-12-16T06:02:25Z",
      },
      {
        id: "LBX-ITEM-1002-1",
        bankTransactionId: "BTX-PRE-900009",
        checkNumber: "621901",
        checkAmount: 62000,
        payerNameRaw: "PHOENIX ENERGY",
        imageUrl: "/mock/lockbox/621901.png",
        micrRaw: "MICR-621901-003",
        status: "Applied",
        createdAt: "2024-12-16T06:05:20Z",
      },
      {
        id: "LBX-ITEM-1002-2",
        bankTransactionId: "BTX-PRE-900009",
        checkNumber: "621902",
        checkAmount: 54000,
        payerNameRaw: "MAPLE INDUSTRIES",
        imageUrl: "/mock/lockbox/621902.png",
        micrRaw: "MICR-621902-004",
        status: "Applied",
        createdAt: "2024-12-16T06:05:25Z",
      },
      {
        id: "LBX-ITEM-1002-3",
        bankTransactionId: "BTX-PRE-900009",
        checkNumber: "621903",
        checkAmount: 42000,
        payerNameRaw: "ZENITH SYSTEMS",
        imageUrl: "/mock/lockbox/621903.png",
        micrRaw: "MICR-621903-005",
        status: "Captured",
        createdAt: "2024-12-16T06:05:30Z",
      },
    ];

    const createTimeline = (timestamps: string[], actions: string[], details: string[]) => {
      return timestamps.map((timestamp, index) => ({
        id: `log-settlement-${timestamp}-${index}`,
        timestamp,
        user: "System",
        action: actions[index],
        details: details[index],
      }));
    };

    const pendingPayments: Payment[] = [
      {
        id: "PAY-BF-900001",
        paymentNumber: "PMT-2024-900001",
        paymentHeaderId: "HDR-900001",
        amount: 125000,
        date: "2024-12-16",
        bankAccount: "US Bank - *****4521",
        method: "ACH",
        payerNameRaw: "NORTHRIDGE SUPPLY CO",
        memoReferenceRaw: "ACH CREDIT PAYMENTS DEC16",
        customerId: "CUST-NORTHRIDGE-001",
        customerName: "Northridge Supply Co",
        customerNumber: "NR-001",
        identificationCriteria: "Bank Feed",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/bank-feed/JPM-PRE-900001",
        status: "SettlementPending",
        exceptionType: null,
        confidenceScore: 74,
        transformedLines: [],
        activityLog: createTimeline(
          ["2024-12-16T06:00:30Z", "2024-12-16T06:01:00Z", "2024-12-16T06:01:10Z"],
          ["Bank Feed Received", "Payment Created from Bank Feed", "Settlement Pending"],
          [
            "Preliminary bank feed received",
            "Payment created from preliminary bank feed",
            "Awaiting final settlement feed",
          ]
        ),
        tags: ["bank-feed", "settlement-pending"],
        createdAt: "2024-12-16T06:01:00Z",
        updatedAt: "2024-12-16T06:01:10Z",
        bankFeedId: "BF-JPM-001",
        bankReference: "JPM-PRE-900001",
        settlementStatus: "Pending",
        settlementEventId: "SET-900001",
        settlementFirstSeenAt: "2024-12-16T06:00:30Z",
        settlementLastCheckedAt: "2024-12-16T06:01:10Z",
        settlementReason: "AwaitingFinalFeed",
      },
      {
        id: "PAY-BF-900002",
        paymentNumber: "PMT-2024-900002",
        paymentHeaderId: "HDR-900002",
        amount: 485000,
        date: "2024-12-16",
        bankAccount: "US Bank - *****4521",
        method: "Wire",
        payerNameRaw: "VECTOR GLOBAL SERVICES",
        memoReferenceRaw: "WIRE TRANSFER DEC16",
        customerId: "CUST-VECTOR-002",
        customerName: "Vector Global Services",
        customerNumber: "VG-002",
        identificationCriteria: "Bank Feed",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/bank-feed/JPM-PRE-900002",
        status: "SettlementPending",
        exceptionType: null,
        confidenceScore: 70,
        transformedLines: [],
        activityLog: createTimeline(
          ["2024-12-16T06:01:10Z", "2024-12-16T06:01:40Z", "2024-12-16T06:01:50Z"],
          ["Bank Feed Received", "Payment Created from Bank Feed", "Settlement Pending"],
          [
            "Preliminary bank feed received",
            "Payment created from preliminary bank feed",
            "Awaiting final settlement feed",
          ]
        ),
        tags: ["bank-feed", "settlement-pending", "high-value"],
        createdAt: "2024-12-16T06:01:40Z",
        updatedAt: "2024-12-16T06:01:50Z",
        bankFeedId: "BF-JPM-001",
        bankReference: "JPM-PRE-900002",
        settlementStatus: "Pending",
        settlementEventId: "SET-900002",
        settlementFirstSeenAt: "2024-12-16T06:01:10Z",
        settlementLastCheckedAt: "2024-12-16T06:01:50Z",
        settlementReason: "AwaitingFinalFeed",
      },
      {
        id: "PAY-BF-900003-A",
        paymentNumber: "PMT-2024-900003-A",
        paymentHeaderId: "HDR-900003-A",
        amount: 42000,
        date: "2024-12-16",
        bankAccount: "US Bank - *****4521",
        method: "Check",
        payerNameRaw: "GRANITE FOODS",
        memoReferenceRaw: "LOCKBOX CHK 514201",
        customerId: "CUST-GRANITE-003",
        customerName: "Granite Foods",
        customerNumber: "GF-003",
        identificationCriteria: "Lockbox Item",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/bank-feed/LBX-1001/514201",
        status: "SettlementPending",
        exceptionType: null,
        confidenceScore: 68,
        transformedLines: [],
        activityLog: createTimeline(
          [
            "2024-12-16T06:02:05Z",
            "2024-12-16T06:02:30Z",
            "2024-12-16T06:02:40Z",
            "2024-12-16T06:02:50Z",
          ],
          [
            "Bank Feed Received",
            "Lockbox Details Captured",
            "Payment Created from Bank Feed",
            "Settlement Pending",
          ],
          [
            "Preliminary lockbox feed received",
            "Check detail captured for 514201",
            "Payment created from lockbox check",
            "Awaiting final settlement feed",
          ]
        ),
        tags: ["bank-feed", "lockbox", "settlement-pending"],
        createdAt: "2024-12-16T06:02:30Z",
        updatedAt: "2024-12-16T06:02:50Z",
        bankFeedId: "BF-JPM-002",
        bankReference: "LBX-PRE-1001",
        settlementStatus: "Pending",
        settlementEventId: "SET-900003-A",
        settlementFirstSeenAt: "2024-12-16T06:02:05Z",
        settlementLastCheckedAt: "2024-12-16T06:02:50Z",
        settlementReason: "AwaitingFinalFeed",
        lockboxBatchId: "LBX-1001",
        checkNumber: "514201",
      },
      {
        id: "PAY-BF-900003-B",
        paymentNumber: "PMT-2024-900003-B",
        paymentHeaderId: "HDR-900003-B",
        amount: 52000,
        date: "2024-12-16",
        bankAccount: "US Bank - *****4521",
        method: "Check",
        payerNameRaw: "EVEREST MEDICAL",
        memoReferenceRaw: "LOCKBOX CHK 514202",
        customerId: "CUST-EVEREST-004",
        customerName: "Everest Medical",
        customerNumber: "EM-004",
        identificationCriteria: "Lockbox Item",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/bank-feed/LBX-1001/514202",
        status: "SettlementPending",
        exceptionType: null,
        confidenceScore: 67,
        transformedLines: [],
        activityLog: createTimeline(
          [
            "2024-12-16T06:02:05Z",
            "2024-12-16T06:02:34Z",
            "2024-12-16T06:02:44Z",
            "2024-12-16T06:02:55Z",
          ],
          [
            "Bank Feed Received",
            "Lockbox Details Captured",
            "Payment Created from Bank Feed",
            "Settlement Pending",
          ],
          [
            "Preliminary lockbox feed received",
            "Check detail captured for 514202",
            "Payment created from lockbox check",
            "Awaiting final settlement feed",
          ]
        ),
        tags: ["bank-feed", "lockbox", "settlement-pending"],
        createdAt: "2024-12-16T06:02:34Z",
        updatedAt: "2024-12-16T06:02:55Z",
        bankFeedId: "BF-JPM-002",
        bankReference: "LBX-PRE-1001",
        settlementStatus: "Pending",
        settlementEventId: "SET-900003-B",
        settlementFirstSeenAt: "2024-12-16T06:02:05Z",
        settlementLastCheckedAt: "2024-12-16T06:02:55Z",
        settlementReason: "AwaitingFinalFeed",
        lockboxBatchId: "LBX-1001",
        checkNumber: "514202",
      },
      {
        id: "PAY-BF-900004",
        paymentNumber: "PMT-2024-900004",
        paymentHeaderId: "HDR-900004",
        amount: 62000,
        date: "2024-12-16",
        bankAccount: "US Bank - *****4521",
        method: "Check",
        payerNameRaw: "STONE RIDGE GROUP",
        memoReferenceRaw: "CHK 78112",
        customerId: "CUST-STONERIDGE-005",
        customerName: "Stone Ridge Group",
        customerNumber: "SR-005",
        identificationCriteria: "Bank Feed",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/bank-feed/JPM-PRE-900004",
        status: "SettlementPending",
        exceptionType: null,
        confidenceScore: 66,
        transformedLines: [],
        activityLog: createTimeline(
          ["2024-12-16T06:02:45Z", "2024-12-16T06:03:05Z", "2024-12-16T06:03:15Z"],
          ["Bank Feed Received", "Payment Created from Bank Feed", "Settlement Pending"],
          [
            "Preliminary bank feed received",
            "Payment created from preliminary bank feed",
            "Awaiting final settlement feed",
          ]
        ),
        tags: ["bank-feed", "settlement-pending"],
        createdAt: "2024-12-16T06:03:05Z",
        updatedAt: "2024-12-16T06:03:15Z",
        bankFeedId: "BF-JPM-001",
        bankReference: "JPM-PRE-900004",
        settlementStatus: "Pending",
        settlementEventId: "SET-900004",
        settlementFirstSeenAt: "2024-12-16T06:02:45Z",
        settlementLastCheckedAt: "2024-12-16T06:03:15Z",
        settlementReason: "AwaitingFinalFeed",
        checkNumber: "78112",
      },
    ];

    const ghostPayments: Payment[] = [
      {
        id: "PAY-BF-900005",
        paymentNumber: "PMT-2024-900005",
        paymentHeaderId: "HDR-900005",
        amount: 88000,
        date: "2024-12-16",
        bankAccount: "US Bank - *****4521",
        method: "ACH",
        payerNameRaw: "APEX INDUSTRIAL",
        memoReferenceRaw: "EFT CREDIT",
        customerId: "CUST-APEX-006",
        customerName: "Apex Industrial",
        customerNumber: "AI-006",
        identificationCriteria: "Bank Feed",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/bank-feed/JPM-PRE-900005",
        status: "Exception",
        exceptionType: "SettlementFailed",
        confidenceScore: 55,
        transformedLines: [],
        activityLog: createTimeline(
          ["2024-12-16T06:03:10Z", "2024-12-16T06:03:40Z", "2024-12-18T07:00:00Z"],
          ["Bank Feed Received", "Payment Created from Bank Feed", "Settlement Failed"],
          [
            "Preliminary bank feed received",
            "Payment created from preliminary bank feed",
            "Final feed not found within 48 hours",
          ]
        ),
        tags: ["bank-feed", "settlement-failed", "ghost-payment"],
        createdAt: "2024-12-16T06:03:40Z",
        updatedAt: "2024-12-18T07:00:00Z",
        bankFeedId: "BF-JPM-001",
        bankReference: "JPM-PRE-900005",
        settlementStatus: "Failed",
        settlementEventId: "SET-900005",
        settlementFirstSeenAt: "2024-12-16T06:03:10Z",
        settlementLastCheckedAt: "2024-12-18T07:00:00Z",
        settlementReason: "FinalNotFound",
        postingHoldReasons: ["Final bank feed not received within threshold"],
      },
      {
        id: "PAY-BF-900006",
        paymentNumber: "PMT-2024-900006",
        paymentHeaderId: "HDR-900006",
        amount: 132000,
        date: "2024-12-16",
        bankAccount: "US Bank - *****4521",
        method: "ACH",
        payerNameRaw: "SUMMIT HEALTH",
        memoReferenceRaw: "ACH CREDIT",
        customerId: "CUST-SUMMIT-007",
        customerName: "Summit Health",
        customerNumber: "SH-007",
        identificationCriteria: "Bank Feed",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/bank-feed/JPM-PRE-900006",
        status: "Exception",
        exceptionType: "SettlementFailed",
        confidenceScore: 52,
        transformedLines: [],
        activityLog: createTimeline(
          ["2024-12-16T06:03:40Z", "2024-12-16T06:04:00Z", "2024-12-18T07:15:00Z"],
          ["Bank Feed Received", "Payment Created from Bank Feed", "Settlement Failed"],
          [
            "Preliminary bank feed received",
            "Payment created from preliminary bank feed",
            "Final feed not found within 48 hours",
          ]
        ),
        tags: ["bank-feed", "settlement-failed", "ghost-payment"],
        createdAt: "2024-12-16T06:04:00Z",
        updatedAt: "2024-12-18T07:15:00Z",
        bankFeedId: "BF-JPM-001",
        bankReference: "JPM-PRE-900006",
        settlementStatus: "Failed",
        settlementEventId: "SET-900006",
        settlementFirstSeenAt: "2024-12-16T06:03:40Z",
        settlementLastCheckedAt: "2024-12-18T07:15:00Z",
        settlementReason: "FinalNotFound",
        postingHoldReasons: ["Final bank feed not received within threshold"],
      },
    ];

    const finalizedPayments: Payment[] = [
      {
        id: "PAY-BF-900007",
        paymentNumber: "PMT-2024-900007",
        paymentHeaderId: "HDR-900007",
        amount: 104000,
        date: "2024-12-16",
        bankAccount: "US Bank - *****4521",
        method: "ACH",
        payerNameRaw: "OASIS TECH",
        memoReferenceRaw: "ACH CREDIT PRELIM",
        customerId: "CUST-OASIS-008",
        customerName: "Oasis Tech",
        customerNumber: "OT-008",
        identificationCriteria: "Bank Feed",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/bank-feed/JPM-PRE-900007",
        status: "New",
        exceptionType: null,
        confidenceScore: 80,
        transformedLines: [],
        activityLog: createTimeline(
          [
            "2024-12-16T06:04:10Z",
            "2024-12-16T06:04:30Z",
            "2024-12-16T06:04:40Z",
            "2024-12-17T06:01:10Z",
            "2024-12-17T06:01:30Z",
          ],
          [
            "Bank Feed Received",
            "Payment Created from Bank Feed",
            "Settlement Pending",
            "Final Feed Received",
            "Settlement Finalized",
          ],
          [
            "Preliminary bank feed received",
            "Payment created from preliminary bank feed",
            "Awaiting final settlement feed",
            "Final bank feed received",
            "Settlement finalized; payment cleared",
          ]
        ),
        tags: ["bank-feed", "settlement-final"],
        createdAt: "2024-12-16T06:04:30Z",
        updatedAt: "2024-12-17T06:01:30Z",
        bankFeedId: "BF-JPM-001",
        bankReference: "JPM-PRE-900007",
        settlementStatus: "Final",
        settlementEventId: "SET-900007",
        settlementFirstSeenAt: "2024-12-16T06:04:10Z",
        settlementLastCheckedAt: "2024-12-17T06:01:30Z",
        settlementReason: "AwaitingFinalFeed",
      },
      {
        id: "PAY-BF-900008",
        paymentNumber: "PMT-2024-900008",
        paymentHeaderId: "HDR-900008",
        amount: 215000,
        date: "2024-12-16",
        bankAccount: "US Bank - *****4521",
        method: "Wire",
        payerNameRaw: "HARBOR WHOLESALE",
        memoReferenceRaw: "WIRE CREDIT PRELIM",
        customerId: "CUST-HARBOR-009",
        customerName: "Harbor Wholesale",
        customerNumber: "HW-009",
        identificationCriteria: "Bank Feed",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/bank-feed/JPM-PRE-900008",
        status: "New",
        exceptionType: null,
        confidenceScore: 82,
        transformedLines: [],
        activityLog: createTimeline(
          [
            "2024-12-16T06:04:40Z",
            "2024-12-16T06:05:00Z",
            "2024-12-16T06:05:10Z",
            "2024-12-17T06:01:40Z",
            "2024-12-17T06:02:00Z",
          ],
          [
            "Bank Feed Received",
            "Payment Created from Bank Feed",
            "Settlement Pending",
            "Final Feed Received",
            "Settlement Finalized",
          ],
          [
            "Preliminary bank feed received",
            "Payment created from preliminary bank feed",
            "Awaiting final settlement feed",
            "Final bank feed received",
            "Settlement finalized; payment cleared",
          ]
        ),
        tags: ["bank-feed", "settlement-final"],
        createdAt: "2024-12-16T06:05:00Z",
        updatedAt: "2024-12-17T06:02:00Z",
        bankFeedId: "BF-JPM-001",
        bankReference: "JPM-PRE-900008",
        settlementStatus: "Final",
        settlementEventId: "SET-900008",
        settlementFirstSeenAt: "2024-12-16T06:04:40Z",
        settlementLastCheckedAt: "2024-12-17T06:02:00Z",
        settlementReason: "AwaitingFinalFeed",
      },
      {
        id: "PAY-BF-900009",
        paymentNumber: "PMT-2024-900009",
        paymentHeaderId: "HDR-900009",
        amount: 158000,
        date: "2024-12-16",
        bankAccount: "US Bank - *****4521",
        method: "Check",
        payerNameRaw: "LOCKBOX BATCH 1002",
        memoReferenceRaw: "LOCKBOX DEPOSITS",
        customerId: "CUST-LBX-010",
        customerName: "Lockbox Batch 1002",
        customerNumber: "LBX-1002",
        identificationCriteria: "Lockbox Batch",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/bank-feed/LBX-1002",
        status: "New",
        exceptionType: null,
        confidenceScore: 78,
        transformedLines: [],
        activityLog: createTimeline(
          [
            "2024-12-16T06:05:10Z",
            "2024-12-16T06:05:30Z",
            "2024-12-16T06:05:40Z",
            "2024-12-17T06:02:10Z",
            "2024-12-17T06:02:30Z",
          ],
          [
            "Bank Feed Received",
            "Lockbox Details Captured",
            "Settlement Pending",
            "Final Feed Received",
            "Settlement Finalized",
          ],
          [
            "Preliminary lockbox feed received",
            "Check detail captured for lockbox batch 1002",
            "Awaiting final settlement feed",
            "Final bank feed received",
            "Settlement finalized; payment cleared",
          ]
        ),
        tags: ["bank-feed", "lockbox", "settlement-final"],
        createdAt: "2024-12-16T06:05:30Z",
        updatedAt: "2024-12-17T06:02:30Z",
        bankFeedId: "BF-JPM-002",
        bankReference: "LBX-PRE-1002",
        settlementStatus: "Final",
        settlementEventId: "SET-900009",
        settlementFirstSeenAt: "2024-12-16T06:05:10Z",
        settlementLastCheckedAt: "2024-12-17T06:02:30Z",
        settlementReason: "AwaitingFinalFeed",
        lockboxBatchId: "LBX-1002",
      },
    ];

    const settlementEvents: SettlementEvent[] = [
      {
        id: "SET-900001",
        paymentId: "PAY-BF-900001",
        bankReference: "JPM-PRE-900001",
        prelimTransactionId: "BTX-PRE-900001",
        settlementStatus: "Pending",
        reason: "AwaitingFinalFeed",
        firstSeenAt: "2024-12-16T06:00:30Z",
        lastCheckedAt: "2024-12-16T06:01:10Z",
        ageHours: 4,
        createdAt: "2024-12-16T06:01:10Z",
        updatedAt: "2024-12-16T06:01:10Z",
      },
      {
        id: "SET-900002",
        paymentId: "PAY-BF-900002",
        bankReference: "JPM-PRE-900002",
        prelimTransactionId: "BTX-PRE-900002",
        settlementStatus: "Pending",
        reason: "AwaitingFinalFeed",
        firstSeenAt: "2024-12-16T06:01:10Z",
        lastCheckedAt: "2024-12-16T06:01:50Z",
        ageHours: 4,
        createdAt: "2024-12-16T06:01:50Z",
        updatedAt: "2024-12-16T06:01:50Z",
      },
      {
        id: "SET-900003-A",
        paymentId: "PAY-BF-900003-A",
        bankReference: "LBX-PRE-1001",
        prelimTransactionId: "BTX-PRE-900003",
        settlementStatus: "Pending",
        reason: "AwaitingFinalFeed",
        firstSeenAt: "2024-12-16T06:02:05Z",
        lastCheckedAt: "2024-12-16T06:02:50Z",
        ageHours: 4,
        createdAt: "2024-12-16T06:02:50Z",
        updatedAt: "2024-12-16T06:02:50Z",
      },
      {
        id: "SET-900003-B",
        paymentId: "PAY-BF-900003-B",
        bankReference: "LBX-PRE-1001",
        prelimTransactionId: "BTX-PRE-900003",
        settlementStatus: "Pending",
        reason: "AwaitingFinalFeed",
        firstSeenAt: "2024-12-16T06:02:05Z",
        lastCheckedAt: "2024-12-16T06:02:55Z",
        ageHours: 4,
        createdAt: "2024-12-16T06:02:55Z",
        updatedAt: "2024-12-16T06:02:55Z",
      },
      {
        id: "SET-900004",
        paymentId: "PAY-BF-900004",
        bankReference: "JPM-PRE-900004",
        prelimTransactionId: "BTX-PRE-900004",
        settlementStatus: "Pending",
        reason: "AwaitingFinalFeed",
        firstSeenAt: "2024-12-16T06:02:45Z",
        lastCheckedAt: "2024-12-16T06:03:15Z",
        ageHours: 4,
        createdAt: "2024-12-16T06:03:15Z",
        updatedAt: "2024-12-16T06:03:15Z",
      },
      {
        id: "SET-900005",
        paymentId: "PAY-BF-900005",
        bankReference: "JPM-PRE-900005",
        prelimTransactionId: "BTX-PRE-900005",
        settlementStatus: "Failed",
        reason: "FinalNotFound",
        firstSeenAt: "2024-12-16T06:03:10Z",
        lastCheckedAt: "2024-12-18T07:00:00Z",
        ageHours: GHOST_PAYMENT_THRESHOLD_HOURS + 1,
        createdAt: "2024-12-18T07:00:00Z",
        updatedAt: "2024-12-18T07:00:00Z",
      },
      {
        id: "SET-900006",
        paymentId: "PAY-BF-900006",
        bankReference: "JPM-PRE-900006",
        prelimTransactionId: "BTX-PRE-900006",
        settlementStatus: "Failed",
        reason: "FinalNotFound",
        firstSeenAt: "2024-12-16T06:03:40Z",
        lastCheckedAt: "2024-12-18T07:15:00Z",
        ageHours: GHOST_PAYMENT_THRESHOLD_HOURS + 3,
        createdAt: "2024-12-18T07:15:00Z",
        updatedAt: "2024-12-18T07:15:00Z",
      },
      {
        id: "SET-900007",
        paymentId: "PAY-BF-900007",
        bankReference: "JPM-PRE-900007",
        prelimTransactionId: "BTX-PRE-900007",
        finalTransactionId: "BTX-FIN-900007",
        settlementStatus: "Final",
        reason: "AwaitingFinalFeed",
        firstSeenAt: "2024-12-16T06:04:10Z",
        lastCheckedAt: "2024-12-17T06:01:30Z",
        ageHours: 24,
        createdAt: "2024-12-16T06:04:30Z",
        updatedAt: "2024-12-17T06:01:30Z",
      },
      {
        id: "SET-900008",
        paymentId: "PAY-BF-900008",
        bankReference: "JPM-PRE-900008",
        prelimTransactionId: "BTX-PRE-900008",
        finalTransactionId: "BTX-FIN-900008",
        settlementStatus: "Final",
        reason: "AwaitingFinalFeed",
        firstSeenAt: "2024-12-16T06:04:40Z",
        lastCheckedAt: "2024-12-17T06:02:00Z",
        ageHours: 24,
        createdAt: "2024-12-16T06:05:00Z",
        updatedAt: "2024-12-17T06:02:00Z",
      },
      {
        id: "SET-900009",
        paymentId: "PAY-BF-900009",
        bankReference: "LBX-PRE-1002",
        prelimTransactionId: "BTX-PRE-900009",
        finalTransactionId: "BTX-FIN-900009",
        settlementStatus: "Final",
        reason: "AwaitingFinalFeed",
        firstSeenAt: "2024-12-16T06:05:10Z",
        lastCheckedAt: "2024-12-17T06:02:30Z",
        ageHours: 24,
        createdAt: "2024-12-16T06:05:30Z",
        updatedAt: "2024-12-17T06:02:30Z",
      },
    ];

    this.bankFeedConfigs.push(...bankFeedConfigs);
    this.bankFeedRuns.push(...bankFeedRuns);
    this.bankTransactions.push(...bankTransactions);
    this.lockboxItems.push(...lockboxItems);
    this.settlementEvents.push(...settlementEvents);
    this.payments.push(...pendingPayments, ...ghostPayments, ...finalizedPayments);
  }

  private appendPhase3AutoMatchEngineAndScenarios(): void {
    const arItems: ARItem[] = [
      {
        id: "AR-INV-20061",
        invoiceNumber: "INV-20061",
        customerId: "CUST-ACME-LOG-001",
        customerName: "Acme Logistics",
        amount: 12480,
        dueDate: "2024-12-30",
        status: "Open",
        createdAt: "2024-12-10T08:00:00Z",
      },
      {
        id: "AR-INV-20062",
        invoiceNumber: "INV-20062",
        customerId: "CUST-ACME-LOG-001",
        customerName: "Acme Logistics",
        amount: 9999,
        dueDate: "2024-12-30",
        status: "Open",
        createdAt: "2024-12-10T08:05:00Z",
      },
      {
        id: "AR-INV-30010",
        invoiceNumber: "INV-30010",
        customerId: "CUST-OMEGA-INT-010",
        customerName: "Omega Industrial",
        amount: 50000,
        dueDate: "2025-01-05",
        status: "Open",
        createdAt: "2024-12-11T08:00:00Z",
      },
      {
        id: "AR-CM-30010",
        invoiceNumber: "CM-30010",
        customerId: "CUST-OMEGA-INT-010",
        customerName: "Omega Industrial",
        amount: -5000,
        dueDate: "2025-01-05",
        status: "Credit Memo",
        createdAt: "2024-12-11T08:10:00Z",
      },
      {
        id: "AR-INV-40001",
        invoiceNumber: "INV-40001",
        customerId: "CUST-DELTA-RET-011",
        customerName: "Delta Retail",
        amount: 7500,
        dueDate: "2025-01-10",
        status: "Open",
        createdAt: "2024-12-12T08:00:00Z",
      },
      {
        id: "AR-INV-40002",
        invoiceNumber: "INV-40002",
        customerId: "CUST-DELTA-RET-011",
        customerName: "Delta Retail",
        amount: 7500,
        dueDate: "2025-01-10",
        status: "Open",
        createdAt: "2024-12-12T08:05:00Z",
      },
    ];

    const payments: Payment[] = [
      {
        id: "PAY-51150",
        paymentNumber: "51150",
        paymentHeaderId: "HDR-51150",
        amount: 12480,
        date: "2024-12-18",
        bankAccount: "US-OPERATING-001",
        method: "ACH",
        payerNameRaw: "ACME LOGISTICS",
        memoReferenceRaw: "Payment for inv 20061 / THANKS",
        customerId: "CUST-ACME-LOG-001",
        customerName: "Acme Logistics",
        customerNumber: "AL-001",
        identificationCriteria: "Invoice Reference",
        remittanceSource: "Email",
        originalPaymentFileUrl: "/mock/downloads/payments/PMT-2024-51150.csv",
        linkedRemittanceFileUrl: "/mock/downloads/remittances/rem_51150.pdf",
        status: "New",
        exceptionType: null,
        confidenceScore: 82,
        transformedLines: [],
        activityLog: [
          {
            id: "log-51150-1",
            timestamp: "2024-12-18T09:00:00Z",
            user: "System",
            action: "Payment Received",
            details: "Payment captured from bank feed (ACH)",
          },
        ],
        tags: ["phase3", "auto-match-candidate"],
        createdAt: "2024-12-18T09:00:00Z",
        updatedAt: "2024-12-18T09:00:00Z",
        autoMatchEligible: true,
      },
      {
        id: "PAY-51151",
        paymentNumber: "51151",
        paymentHeaderId: "HDR-51151",
        amount: 9999,
        date: "2024-12-18",
        bankAccount: "US-OPERATING-001",
        method: "ACH",
        payerNameRaw: "ACME LOGISTICS",
        memoReferenceRaw: "INV#-20062.. paid",
        customerId: "CUST-ACME-LOG-001",
        customerName: "Acme Logistics",
        customerNumber: "AL-001",
        identificationCriteria: "Invoice Reference",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/downloads/payments/PMT-2024-51151.csv",
        status: "New",
        exceptionType: null,
        confidenceScore: 78,
        transformedLines: [],
        activityLog: [
          {
            id: "log-51151-1",
            timestamp: "2024-12-18T09:05:00Z",
            user: "System",
            action: "Payment Received",
            details: "Payment captured from bank feed (ACH)",
          },
        ],
        tags: ["phase3", "auto-match-candidate"],
        createdAt: "2024-12-18T09:05:00Z",
        updatedAt: "2024-12-18T09:05:00Z",
        autoMatchEligible: true,
      },
      {
        id: "PAY-51152",
        paymentNumber: "51152",
        paymentHeaderId: "HDR-51152",
        amount: 45000,
        date: "2024-12-18",
        bankAccount: "US-OPERATING-001",
        method: "Wire",
        payerNameRaw: "OMEGA INDUSTRIAL",
        memoReferenceRaw: "Remit: INV-30010 + CM-30010 applied",
        customerId: "CUST-OMEGA-INT-010",
        customerName: "Omega Industrial",
        customerNumber: "OI-010",
        identificationCriteria: "Remittance",
        remittanceSource: "Email",
        originalPaymentFileUrl: "/mock/downloads/payments/PMT-2024-51152.csv",
        linkedRemittanceFileUrl: "/mock/downloads/remittances/rem_51152.pdf",
        status: "New",
        exceptionType: null,
        confidenceScore: 80,
        transformedLines: [],
        activityLog: [
          {
            id: "log-51152-1",
            timestamp: "2024-12-18T09:10:00Z",
            user: "System",
            action: "Payment Received",
            details: "Payment captured from bank feed (Wire)",
          },
        ],
        tags: ["phase3", "auto-match-candidate", "composite"],
        createdAt: "2024-12-18T09:10:00Z",
        updatedAt: "2024-12-18T09:10:00Z",
        autoMatchEligible: true,
      },
      {
        id: "PAY-51153",
        paymentNumber: "51153",
        paymentHeaderId: "HDR-51153",
        amount: 7500,
        date: "2024-12-18",
        bankAccount: "US-OPERATING-001",
        method: "ACH",
        payerNameRaw: "DELTA RETAIL",
        memoReferenceRaw: "INV 4000",
        customerId: "CUST-DELTA-RET-011",
        customerName: "Delta Retail",
        customerNumber: "DR-011",
        identificationCriteria: "Invoice Reference",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/downloads/payments/PMT-2024-51153.csv",
        status: "New",
        exceptionType: null,
        confidenceScore: 60,
        transformedLines: [],
        activityLog: [
          {
            id: "log-51153-1",
            timestamp: "2024-12-18T09:15:00Z",
            user: "System",
            action: "Payment Received",
            details: "Payment captured from bank feed (ACH)",
          },
        ],
        tags: ["phase3", "needs-review"],
        createdAt: "2024-12-18T09:15:00Z",
        updatedAt: "2024-12-18T09:15:00Z",
        autoMatchEligible: true,
      },
      {
        id: "PAY-51154",
        paymentNumber: "51154",
        paymentHeaderId: "HDR-51154",
        amount: 3210,
        date: "2024-12-18",
        bankAccount: "US-OPERATING-001",
        method: "ACH",
        payerNameRaw: "NOVA SERVICES",
        memoReferenceRaw: "for services Jan",
        customerId: "CUST-NOVA-012",
        customerName: "Nova Services",
        customerNumber: "NS-012",
        identificationCriteria: "Bank Mapping",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/downloads/payments/PMT-2024-51154.csv",
        status: "New",
        exceptionType: null,
        confidenceScore: 45,
        transformedLines: [],
        activityLog: [
          {
            id: "log-51154-1",
            timestamp: "2024-12-18T09:20:00Z",
            user: "System",
            action: "Payment Received",
            details: "Payment captured from bank feed (ACH)",
          },
        ],
        tags: ["phase3", "invalid-ref"],
        createdAt: "2024-12-18T09:20:00Z",
        updatedAt: "2024-12-18T09:20:00Z",
        autoMatchEligible: true,
      },
    ];

    const remittance: Remittance = {
      id: "REM-EMAIL-51152",
      remittanceNumber: "REM-2024-51152",
      remittanceHeaderId: "HDR-REM-51152",
      source: "Email",
      receivedDate: "2024-12-18",
      effectiveDate: "2024-12-18",
      customerName: "Omega Industrial",
      customerId: "CUST-OMEGA-INT-010",
      customerNumber: "OI-010",
      totalAmount: 45000,
      remittanceAmount: 45000,
      status: "Parsed",
      emailSubject: "Remittance Advice for Payment 51152",
      emailIdentifier: "EML-51152",
      attachments: [
        {
          name: "rem_51152.pdf",
          type: "PDF",
          size: "980 KB",
          url: "/mock/downloads/remittances/rem_51152.pdf",
        },
      ],
      extractedReferences: [
        { invoice: "INV-30010", amount: 50000 },
        { invoice: "CM-30010", amount: -5000 },
      ],
      extractedReferencesDetailed: [
        { invoiceNumber: "INV-30010", amount: 50000, reasonCode: "FULL" },
        { invoiceNumber: "CM-30010", amount: -5000, reasonCode: "CM" },
      ],
      linkStatus: "Linked",
      extract_status: "EXTRACTED",
      link_status: "LINKED",
      confidence_score: 91,
      key_reference: "WIRE-90152",
      invoices_found_count: 2,
      linked_payment_id: "PAY-51152",
      email_metadata: {
        from: "ap@omegaindustrial.com",
        to: "ar@meeru.ai",
        subject: "Remittance Advice for Payment 51152",
        received_ts: "2024-12-18T09:10:00Z",
        body: "Remittance advice attached for INV-30010 and CM-30010.",
      },
      extracted_fields: {
        customer: "Omega Industrial",
        payment_date: "2024-12-18",
        amount: 45000,
        currency: "USD",
        reference: "WIRE-90152",
        method: "AI",
      },
      extracted_line_items: [
        {
          invoice_number: "INV-30010",
          invoice_amount: 50000,
          paid_amount: 50000,
          discount: 0,
        },
        {
          invoice_number: "CM-30010",
          invoice_amount: -5000,
          paid_amount: -5000,
          discount: 0,
          credit_memo_ref: "CM-30010",
        },
      ],
      validation_checks: [
        { status: "PASS", label: "Invoices exist in NetSuite" },
        { status: "PASS", label: "Totals match" },
        { status: "PASS", label: "Currency match" },
      ],
      activity_log: [
        {
          event: "Remittance Captured",
          actor: "System",
          ts: "2024-12-18T09:12:00Z",
          detail: "Email ingestion",
        },
      ],
      inputFileUrl: "/mock/downloads/remittances/rem_51152.pdf",
      parserConfidence: 91,
      createdAt: "2024-12-18T09:12:00Z",
    };

    this.arItems.push(...arItems);
    this.payments.push(...payments);
    this.remittances.push(remittance);

    this.runMatchingEngineForPayments(payments.map((payment) => payment.id));
  }

  private appendMatchingEngineCompletenessScenarios(): void {
    const arItems: ARItem[] = [
      {
        id: "AR-INV-51201-A",
        type: "Invoice",
        invoiceNumber: "INV-51201",
        customerId: "CUST-NS-2001",
        customerName: "Nova Services",
        amount: 42000,
        dueDate: "2024-03-30",
        status: "Open",
        subsidiary: "US01",
        businessUnit: "US",
        currency: "USD",
        createdAt: "2024-02-20T08:00:00Z",
      },
      {
        id: "AR-INV-51202-A",
        type: "Invoice",
        invoiceNumber: "INV-51202",
        customerId: "CUST-NS-2001",
        customerName: "Nova Services",
        amount: 3210,
        dueDate: "2024-03-20",
        status: "Open",
        subsidiary: "US01",
        currency: "USD",
        createdAt: "2024-02-21T08:00:00Z",
      },
      {
        id: "AR-INV-51203-A",
        type: "Invoice",
        invoiceNumber: "INV-51203",
        customerId: "CUST-DR-3001",
        customerName: "Delta Retail",
        amount: 10000,
        dueDate: "2024-03-25",
        status: "Open",
        subsidiary: "US01",
        currency: "USD",
        createdAt: "2024-02-22T08:00:00Z",
      },
      {
        id: "AR-CM-90003",
        type: "CreditMemo",
        invoiceNumber: "CM-90003",
        customerId: "CUST-DR-3001",
        customerName: "Delta Retail",
        amount: -2000,
        dueDate: "2024-03-25",
        status: "Open",
        subsidiary: "US01",
        currency: "USD",
        createdAt: "2024-02-22T08:05:00Z",
      },
    ];

    const remittances: Remittance[] = [
      {
        id: "REM-51201",
        remittanceNumber: "REM-51201",
        remittanceHeaderId: "REMHDR-51201",
        source: "Email",
        receivedDate: "2024-03-02",
        effectiveDate: "2024-03-02",
        customerName: "Nova Services",
        customerId: "CUST-NS-2001",
        customerNumber: "NS-2001",
        totalAmount: 42000,
        remittanceAmount: 42000,
        status: "Parsed",
        emailSubject: "Payment Advice - Nova Services - INV-51201",
        subject: "Payment Advice - Nova Services - INV-51201",
        emailIdentifier: "EML-51201",
        attachments: [
          {
            name: "rem_51201.pdf",
            type: "PDF",
            size: "820 KB",
            url: "/mock/downloads/remittances/rem_51201.pdf",
          },
        ],
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-51201", amount: 42000, discountAmount: 0, reasonCode: "FULL" },
        ],
        linkStatus: "Linked",
        extract_status: "EXTRACTED",
        link_status: "LINKED",
        confidence_score: 95,
        key_reference: "WT2506250TT",
        invoices_found_count: 1,
        linked_payment_id: "PAY-51201",
        email_metadata: {
          from: "ap@novaservices.com",
          to: "ar@meeru.ai",
          subject: "Payment Advice - Nova Services - INV-51201",
          received_ts: "2024-03-02T09:01:00Z",
          body: "Payment advice attached for INV-51201.",
        },
        extracted_fields: {
          customer: "Nova Services",
          payment_date: "2024-03-02",
          amount: 42000,
          currency: "USD",
          reference: "WT2506250TT",
          method: "AI",
        },
        extracted_line_items: [
          {
            invoice_number: "INV-51201",
            invoice_amount: 42000,
            paid_amount: 42000,
            discount: 0,
          },
        ],
        validation_checks: [
          { status: "PASS", label: "Invoices exist in NetSuite" },
          { status: "PASS", label: "Totals match" },
          { status: "PASS", label: "Currency match" },
        ],
        activity_log: [
          {
            event: "Remittance Captured",
            actor: "System",
            ts: "2024-03-02T09:02:00Z",
            detail: "Email ingestion",
          },
        ],
        inputFileUrl: "/mock/downloads/remittances/rem_51201.pdf",
        parserConfidence: 95,
        createdAt: "2024-03-02T09:02:00Z",
      },
      {
        id: "REM-51203",
        remittanceNumber: "REM-51203",
        remittanceHeaderId: "REMHDR-51203",
        source: "Email",
        receivedDate: "2024-03-04",
        effectiveDate: "2024-03-04",
        customerName: "Delta Retail",
        customerId: "CUST-DR-3001",
        customerNumber: "DR-3001",
        totalAmount: 8000,
        remittanceAmount: 8000,
        status: "Parsed",
        emailSubject: "Payment Advice - Delta Retail - INV-51203",
        subject: "Payment Advice - Delta Retail - INV-51203",
        emailIdentifier: "EML-51203",
        attachments: [
          {
            name: "rem_51203.pdf",
            type: "PDF",
            size: "760 KB",
            url: "/mock/downloads/remittances/rem_51203.pdf",
          },
        ],
        extractedReferencesDetailed: [
          { invoiceNumber: "INV-51203", amount: 8000, reasonCode: "PAY" },
          { invoiceNumber: "CM-90003", amount: 2000, reasonCode: "CM_APPLY" },
        ],
        linkStatus: "Linked",
        extract_status: "EXTRACTED",
        link_status: "LINKED",
        confidence_score: 88,
        key_reference: "CHK-10421",
        invoices_found_count: 2,
        linked_payment_id: "PAY-51203",
        email_metadata: {
          from: "ap@deltaretail.com",
          to: "ar@meeru.ai",
          subject: "Payment Advice - Delta Retail - INV-51203",
          received_ts: "2024-03-04T10:08:00Z",
          body: "Remittance for INV-51203 with credit memo CM-90003.",
        },
        extracted_fields: {
          customer: "Delta Retail",
          payment_date: "2024-03-04",
          amount: 8000,
          currency: "USD",
          reference: "CHK-10421",
          method: "AI",
        },
        extracted_line_items: [
          {
            invoice_number: "INV-51203",
            invoice_amount: 8000,
            paid_amount: 8000,
            discount: 0,
          },
          {
            invoice_number: "CM-90003",
            invoice_amount: 2000,
            paid_amount: 2000,
            discount: 0,
            credit_memo_ref: "CM-90003",
          },
        ],
        validation_checks: [
          { status: "PASS", label: "Invoices exist in NetSuite" },
          { status: "PASS", label: "Totals match" },
          { status: "PASS", label: "Currency match" },
        ],
        activity_log: [
          {
            event: "Remittance Captured",
            actor: "System",
            ts: "2024-03-04T10:12:00Z",
            detail: "Email ingestion",
          },
        ],
        inputFileUrl: "/mock/downloads/remittances/rem_51203.pdf",
        parserConfidence: 88,
        createdAt: "2024-03-04T10:12:00Z",
      },
    ];

    const payments: Payment[] = [
      {
        id: "PAY-51201",
        paymentNumber: "51201",
        paymentHeaderId: "8899201",
        amount: 42000,
        date: "2024-03-02",
        bankAccount: "US-OPERATING-001",
        method: "ACH",
        payerNameRaw: "NOVA SERVICES",
        memoReferenceRaw: "Payment advice INV-51201",
        customerId: "CUST-NS-2001",
        customerName: "Nova Services",
        customerNumber: "NS-2001",
        identificationCriteria: "InvoiceRef",
        remittanceSource: "Email",
        originalPaymentFileUrl: "/mock/downloads/payments/PMT-2024-51201.csv",
        linkedRemittanceFileUrl: "/mock/downloads/remittances/rem_51201.pdf",
        status: "New",
        exceptionType: null,
        confidenceScore: 96,
        transformedLines: [
          {
            id: "TL-51201-1",
            erpReference: "INV-51201",
            referenceField: "Invoice",
            discountAmount: 0,
            paymentAmount: 42000,
            reasonCode: "FULL",
            reasonDescription: "Full Payment",
            customerNumber: "NS-2001",
            subsidiary: "US01",
          },
        ],
        activityLog: [
          {
            id: "log-51201-1",
            timestamp: "2024-03-02T09:00:00Z",
            user: "System",
            action: "Payment Received",
            details: "Payment captured from bank feed (ACH)",
          },
          {
            id: "log-51201-2",
            timestamp: "2024-03-02T09:01:00Z",
            user: "System",
            action: "Customer Identified",
            details: "Customer identified via invoice reference",
          },
          {
            id: "log-51201-3",
            timestamp: "2024-03-02T09:02:00Z",
            user: "System",
            action: "Remittance Captured",
            details: "Remittance captured from Email (EML-51201)",
          },
          {
            id: "log-51201-4",
            timestamp: "2024-03-02T09:03:00Z",
            user: "System",
            action: "Remittance Linked to Payment",
            details: "Remittance linked with 95% confidence",
          },
          {
            id: "log-51201-5",
            timestamp: "2024-03-02T09:04:00Z",
            user: "System",
            action: "Matching Engine Evaluated (AutoMatch)",
            details: "To-the-penny match found for INV-51201",
          },
          {
            id: "log-51201-6",
            timestamp: "2024-03-02T09:05:00Z",
            user: "System",
            action: "Auto-match created posting lines (INV-51201)",
            details: "Posting line generated for full invoice amount",
          },
          {
            id: "log-51201-7",
            timestamp: "2024-03-02T09:06:00Z",
            user: "System",
            action: "Status Updated → PendingToPost",
            details: "Payment ready for posting",
          },
        ],
        tags: ["phase3", "engine-auto", "to-the-penny"],
        createdAt: "2024-03-02T09:00:00Z",
        updatedAt: "2024-03-02T09:06:00Z",
        engineMeta: {
          engineRunId: "ENGRUN-51201",
          mode: "AutoMatch",
          matchedBy: ["RemittanceRefs", "AmountExact"],
          sanitizedTokens: ["INV51201"],
          candidateInvoiceIds: ["AR-INV-51201-A"],
          explain: "Remittance references and exact amount match invoice INV-51201.",
        },
      },
      {
        id: "PAY-51202",
        paymentNumber: "51202",
        paymentHeaderId: "8899202",
        amount: 3210,
        date: "2024-03-03",
        bankAccount: "US-OPERATING-001",
        method: "ACH",
        payerNameRaw: "NOVA SERVICES",
        memoReferenceRaw: "pymt for inv  51202!! / thanks - nova",
        customerId: "CUST-NS-2001",
        customerName: "Nova Services",
        customerNumber: "NS-2001",
        identificationCriteria: "InvoiceRef",
        remittanceSource: "None",
        originalPaymentFileUrl: "/mock/downloads/payments/PMT-2024-51202.csv",
        status: "New",
        exceptionType: null,
        confidenceScore: 91,
        transformedLines: [
          {
            id: "TL-51202-1",
            erpReference: "INV-51202",
            referenceField: "Invoice",
            discountAmount: 0,
            paymentAmount: 3210,
            reasonCode: "FULL",
            reasonDescription: "Full Payment",
            customerNumber: "NS-2001",
            subsidiary: "US01",
          },
        ],
        activityLog: [
          {
            id: "log-51202-1",
            timestamp: "2024-03-03T09:00:00Z",
            user: "System",
            action: "Payment Received",
            details: "Payment captured from bank feed (ACH)",
          },
          {
            id: "log-51202-2",
            timestamp: "2024-03-03T09:01:00Z",
            user: "System",
            action: "Customer Identified",
            details: "Customer identified via invoice reference",
          },
          {
            id: "log-51202-3",
            timestamp: "2024-03-03T09:02:00Z",
            user: "System",
            action: "Matching Engine Evaluated (Sanitization)",
            details: 'Sanitized reference tokens: ["INV51202"]',
          },
          {
            id: "log-51202-4",
            timestamp: "2024-03-03T09:03:00Z",
            user: "System",
            action: "Auto-match created posting lines (INV-51202)",
            details: "Posting line generated for full invoice amount",
          },
          {
            id: "log-51202-5",
            timestamp: "2024-03-03T09:04:00Z",
            user: "System",
            action: "Status Updated → PendingToPost",
            details: "Payment ready for posting",
          },
        ],
        tags: ["phase3", "engine-auto", "sanitization"],
        createdAt: "2024-03-03T09:00:00Z",
        updatedAt: "2024-03-03T09:04:00Z",
        engineMeta: {
          engineRunId: "ENGRUN-51202",
          mode: "Sanitization",
          matchedBy: ["InvoiceToken", "AmountExact"],
          sanitizedTokens: ["INV51202"],
          candidateInvoiceIds: ["AR-INV-51202-A"],
          explain: "Extracted INV51202 from memo after stripping punctuation and spacing.",
        },
      },
      {
        id: "PAY-51203",
        paymentNumber: "51203",
        paymentHeaderId: "8899203",
        amount: 8000,
        date: "2024-03-04",
        bankAccount: "US-OPERATING-001",
        method: "Wire",
        payerNameRaw: "DELTA RETAIL",
        memoReferenceRaw: "INV-51203 less CM-90003",
        customerId: "CUST-DR-3001",
        customerName: "Delta Retail",
        customerNumber: "DR-3001",
        identificationCriteria: "InvoiceRef",
        remittanceSource: "Email",
        originalPaymentFileUrl: "/mock/downloads/payments/PMT-2024-51203.csv",
        linkedRemittanceFileUrl: "/mock/downloads/remittances/rem_51203.pdf",
        status: "New",
        exceptionType: null,
        confidenceScore: 89,
        transformedLines: [
          {
            id: "TL-51203-1",
            erpReference: "INV-51203",
            referenceField: "Invoice",
            discountAmount: 0,
            paymentAmount: 8000,
            reasonCode: "PAY",
            reasonDescription: "Payment Applied",
            customerNumber: "DR-3001",
            subsidiary: "US01",
          },
          {
            id: "TL-51203-2",
            erpReference: "CM-90003",
            referenceField: "Credit Memo",
            discountAmount: 0,
            paymentAmount: 2000,
            reasonCode: "CM_APPLY",
            reasonDescription: "Credit Memo Applied",
            customerNumber: "DR-3001",
            subsidiary: "US01",
          },
        ],
        activityLog: [
          {
            id: "log-51203-1",
            timestamp: "2024-03-04T09:00:00Z",
            user: "System",
            action: "Payment Received",
            details: "Payment captured from bank feed (Wire)",
          },
          {
            id: "log-51203-2",
            timestamp: "2024-03-04T09:01:00Z",
            user: "System",
            action: "Customer Identified",
            details: "Customer identified via invoice reference",
          },
          {
            id: "log-51203-3",
            timestamp: "2024-03-04T09:02:00Z",
            user: "System",
            action: "Remittance Captured",
            details: "Remittance captured from Email (EML-51203)",
          },
          {
            id: "log-51203-4",
            timestamp: "2024-03-04T09:03:00Z",
            user: "System",
            action: "Remittance Linked",
            details: "Remittance linked with 88% confidence",
          },
          {
            id: "log-51203-5",
            timestamp: "2024-03-04T09:04:00Z",
            user: "System",
            action: "Matching Engine Evaluated (Composite)",
            details: "Composite match detected: Payment + Credit Memo closes invoice",
          },
          {
            id: "log-51203-6",
            timestamp: "2024-03-04T09:05:00Z",
            user: "System",
            action: "Auto-match created posting lines (INV-51203 + CM-90003)",
            details: "Applied payment and credit memo",
          },
          {
            id: "log-51203-7",
            timestamp: "2024-03-04T09:06:00Z",
            user: "System",
            action: "Status Updated → PendingToPost",
            details: "Payment ready for posting",
          },
        ],
        tags: ["phase3", "engine-auto", "composite-cm"],
        createdAt: "2024-03-04T09:00:00Z",
        updatedAt: "2024-03-04T09:06:00Z",
        engineMeta: {
          engineRunId: "ENGRUN-51203",
          mode: "Composite",
          matchedBy: ["CompositeCM", "RemittanceRefs"],
          sanitizedTokens: ["INV51203", "CM90003"],
          candidateInvoiceIds: ["AR-INV-51203-A"],
          candidateCreditMemoIds: ["AR-CM-90003"],
          explain:
            "Composite match applied using remittance references for invoice and credit memo.",
        },
      },
    ];

    this.arItems.push(...arItems);
    this.remittances.push(...remittances);
    this.payments.push(...payments);
  }

  private appendPhase4PostingSimulation(): void {
    const postedAt = "2024-02-25T18:30:00Z";
    const postRunId = "POSTRUN-20240225-01";
    const postedPaymentNumbers = ["51110", "51150", "40067"];

    const postRun: PostRun = {
      id: postRunId,
      createdAt: postedAt,
      startedAt: "2024-02-25T18:25:00Z",
      completedAt: postedAt,
      source: "PaymentBatch",
      status: "Success",
      bankAccount: "JPMC-USD-001",
      totalPayments: 3,
      postedPayments: 3,
      failedPayments: 0,
      paymentNumbers: postedPaymentNumbers,
      exportArtifacts: [
        {
          id: "POSTART-20240225-01",
          type: "CSV",
          filename: "match_bank_data_POSTRUN-20240225-01.csv",
          url: "/mock/exports/match_bank_data_POSTRUN-20240225-01.csv",
          createdAt: postedAt,
        },
      ],
      notes: "Phase 4 posting simulation run",
    };

    const postedBankTransactions: BankTransaction[] = [
      {
        id: "BTX-FIN-POST-51110",
        bankFeedId: "BF-JPM-001",
        feedType: "Final",
        statementDate: "2024-02-25",
        transactionDate: "2024-02-25",
        amount: 100000,
        direction: "Credit",
        method: "ACH",
        bankReference: "POST-BANK-51110",
        payerRaw: "GLOBAL RETAIL GROUP",
        memoRaw: "POSTING SETTLEMENT",
        status: "Reconciled",
        createdAt: postedAt,
      },
      {
        id: "BTX-FIN-POST-51150",
        bankFeedId: "BF-JPM-001",
        feedType: "Final",
        statementDate: "2024-02-25",
        transactionDate: "2024-02-25",
        amount: 12480,
        direction: "Credit",
        method: "ACH",
        bankReference: "POST-BANK-51150",
        payerRaw: "ACME LOGISTICS",
        memoRaw: "POSTING SETTLEMENT",
        status: "Reconciled",
        createdAt: postedAt,
      },
      {
        id: "BTX-FIN-POST-40067",
        bankFeedId: "BF-JPM-001",
        feedType: "Final",
        statementDate: "2024-02-25",
        transactionDate: "2024-02-25",
        amount: 36409,
        direction: "Credit",
        method: "ACH",
        bankReference: "POST-BANK-40067",
        payerRaw: "WALMART",
        memoRaw: "POSTING SETTLEMENT",
        status: "Reconciled",
        createdAt: postedAt,
      },
    ];

    const postEventDetails = [
      {
        paymentNumber: "51110",
        bankTranId: "BTX-FIN-POST-51110",
        amount: 100000,
      },
      {
        paymentNumber: "51150",
        bankTranId: "BTX-FIN-POST-51150",
        amount: 12480,
      },
      {
        paymentNumber: "40067",
        bankTranId: "BTX-FIN-POST-40067",
        amount: 36409,
      },
    ];

    postEventDetails.forEach((detail) => {
      const payment = this.payments.find((p) => p.paymentNumber === detail.paymentNumber);
      if (!payment) return;

      const meeruMatchKey = `BANKTRAN:${detail.bankTranId}|PAYMENT:${payment.paymentNumber}`;
      const nsExternalId = `MEERU-PAY-${payment.paymentNumber}`;
      const postingRefs = {
        nsCustomerId: `NSCUST-${payment.customerNumber}`,
        nsCustomerNumber: payment.customerNumber,
        nsPaymentId: `NSPAY-${payment.paymentNumber}`,
        nsPaymentTranId: `CP-${payment.paymentNumber}`,
        nsDepositId: `NSDEP-${payment.paymentNumber}`,
        nsJeId: payment.paymentNumber === "51110" ? "NSJE-IC-51110" : undefined,
        nsExternalId,
        postedAt,
        postRunId,
        postStatus: "Posted" as const,
      };

      this.updatePayment(payment.id, {
        status: "Posted",
        exceptionType: null,
        confidenceScore: Math.max(payment.confidenceScore, 95),
        postingRefs,
        bankTranId: detail.bankTranId,
        meeruMatchKey,
      });

      this.addActivityLog(payment.id, {
        timestamp: postedAt,
        user: "System",
        action: `Posting simulation started (${postRunId})`,
        details: "Prepared payment for posting simulation",
      });
      this.addActivityLog(payment.id, {
        timestamp: postedAt,
        user: "System",
        action: "Generated Match Bank Data export key",
        details: `Match key: ${meeruMatchKey}`,
      });
      this.addActivityLog(payment.id, {
        timestamp: postedAt,
        user: "System",
        action: "Posted to NetSuite (simulated)",
        details: `nsPaymentId=${postingRefs.nsPaymentId}, nsDepositId=${postingRefs.nsDepositId}`,
      });
      if (postingRefs.nsJeId) {
        this.addActivityLog(payment.id, {
          timestamp: postedAt,
          user: "System",
          action: "Intercompany JE posted (simulated)",
          details: `nsJeId=${postingRefs.nsJeId}`,
        });
      }
    });

    const matchBankDataExport: MatchBankDataExport = {
      id: "MBDX-20240225-01",
      createdAt: postedAt,
      postRunId,
      rows: postEventDetails.map((detail) => {
        const payment = this.payments.find((p) => p.paymentNumber === detail.paymentNumber);
        if (!payment) {
          return {
            bankTranId: detail.bankTranId,
            bankAccount: postRun.bankAccount,
            bankAmount: detail.amount,
            bankDate: "2024-02-25",
            paymentNumber: detail.paymentNumber,
            nsPaymentId: "",
            nsDepositId: "",
            nsTranId: "",
            meeruMatchKey: `BANKTRAN:${detail.bankTranId}|PAYMENT:${detail.paymentNumber}`,
            memoReference: "",
            customerNumber: "",
            customerName: "",
          };
        }
        return {
          bankTranId: detail.bankTranId,
          bankAccount: postRun.bankAccount,
          bankAmount: detail.amount,
          bankDate: "2024-02-25",
          paymentNumber: payment.paymentNumber,
          nsPaymentId: `NSPAY-${payment.paymentNumber}`,
          nsDepositId: `NSDEP-${payment.paymentNumber}`,
          nsTranId: `CP-${payment.paymentNumber}`,
          meeruMatchKey: `BANKTRAN:${detail.bankTranId}|PAYMENT:${payment.paymentNumber}`,
          memoReference: payment.memoReferenceRaw,
          customerNumber: payment.customerNumber,
          customerName: payment.customerName,
        };
      }),
    };

    this.bankTransactions.push(...postedBankTransactions);
    this.postRuns.push(postRun);
    this.matchBankDataExports.push(matchBankDataExport);
  }

  private runMatchingEngineForPayments(paymentIds: string[]): void {
    paymentIds.forEach((paymentId) => {
      const payment = this.getPaymentById(paymentId);
      if (!payment || !payment.autoMatchEligible) return;
      if (payment.settlementStatus && payment.settlementStatus !== "Final") {
        return;
      }

      const now = "2024-12-18T10:00:00Z";
      const memoContext = `${payment.memoReferenceRaw} ${payment.payerNameRaw} ${payment.paymentNumber}`;
      const { tokens, sanitizedTokens } = this.extractInvoiceTokens(memoContext);

      const remittanceRefs = this.getRemittanceReferences(payment);
      if (remittanceRefs.length > 0) {
        const remittanceMatch = this.matchFromRemittance(
          payment,
          remittanceRefs,
          sanitizedTokens,
          now
        );
        if (remittanceMatch) {
          return;
        }
      }

      if (tokens.length === 0) {
        this.applyMatchException(payment, {
          exceptionType: "InvalidRef",
          summary: "No invoice references detected in memo",
          sanitizedTokens,
          now,
          candidates: [],
        });
        return;
      }

      const candidates = this.findARItemCandidates(tokens, payment.amount);
      if (candidates.length === 0) {
        this.applyMatchException(payment, {
          exceptionType: "InvalidRef",
          summary: "Invoice references could not be resolved",
          sanitizedTokens,
          now,
          candidates,
        });
        return;
      }

      const sortedCandidates = candidates.sort((a, b) => b.score - a.score);
      const top = sortedCandidates[0];
      const second = sortedCandidates[1];
      if (second && second.score >= top.score - 0.1) {
        this.applyMatchException(payment, {
          exceptionType: "AmbiguousMatch",
          summary: "Multiple invoices match the memo reference",
          sanitizedTokens,
          now,
          candidates: sortedCandidates.slice(0, 2),
        });
        return;
      }

      const amountDifference = payment.amount - top.amount;
      if (Math.abs(amountDifference) > 0.5) {
        const exceptionType = amountDifference < 0 ? "ShortPay" : "OverPay";
        this.applyMatchException(payment, {
          exceptionType,
          summary: `Payment amount differs from invoice by ${Math.abs(amountDifference).toFixed(2)}`,
          sanitizedTokens,
          now,
          candidates: [top],
        });
        return;
      }

      const confidence = Math.round(top.score * 100);
      const isAutoMatch = confidence >= MATCH_CONFIDENCE_AUTOMATCH;
      const status = isAutoMatch ? "PendingToPost" : "Exception";

      const transformedLines = [
        {
          id: `TL-${payment.paymentNumber}-1`,
          erpReference: top.invoiceNumber,
          referenceField: "Invoice",
          discountAmount: 0,
          paymentAmount: payment.amount,
          reasonCode: "FULL",
          reasonDescription: "Full Payment",
          customerNumber: payment.customerNumber,
        },
      ];

      this.updatePayment(payment.id, {
        status,
        exceptionType: isAutoMatch ? null : "AmbiguousMatch",
        confidenceScore: confidence,
        transformedLines,
        matchVersion: "v0.3",
        matchExplanation: {
          summary: "Exact invoice reference and amount match",
          signals: [
            { type: "InvoiceRef", value: top.invoiceNumber, weight: 0.6 },
            { type: "AmountExact", value: payment.amount.toString(), weight: 0.4 },
          ],
          sanitizedTokens,
          confidence,
        },
        candidateMatches: isAutoMatch
          ? undefined
          : [
              {
                invoiceId: top.invoiceId,
                invoiceNumber: top.invoiceNumber,
                amount: top.amount,
                score: top.score,
              },
            ],
        autoMatchedAt: isAutoMatch ? now : undefined,
        autoMatchEligible: false,
      });

      this.addActivityLog(payment.id, {
        timestamp: now,
        user: "System",
        action: "Matching Engine Evaluated",
        details: "Invoice reference matched to AR items",
      });

      if (isAutoMatch) {
        this.addActivityLog(payment.id, {
          timestamp: now,
          user: "System",
          action: "Auto-match created posting lines",
          details: `Applied ${top.invoiceNumber} in full`,
        });
        this.addActivityLog(payment.id, {
          timestamp: now,
          user: "System",
          action: "Moved to PendingToPost",
          details: "Payment ready for posting",
        });
      } else {
        this.addActivityLog(payment.id, {
          timestamp: now,
          user: "System",
          action: "Exception created: AmbiguousMatch",
          details: "Manual review required",
        });
      }
    });
  }

  private sanitizeRef(value: string): string {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .replace(/O/g, "0")
      .replace(/I/g, "1");
  }

  private extractInvoiceTokens(text: string): { tokens: string[]; sanitizedTokens: string[] } {
    const tokens = new Set<string>();
    const regex = /\b(?:INV|CM)[\s#:\-]*[A-Z]*\d{3,}\b/gi;
    let match = regex.exec(text);
    while (match) {
      tokens.add(match[0]);
      match = regex.exec(text);
    }

    const digitRegex = /\b\d{4,}\b/g;
    let digitMatch = digitRegex.exec(text);
    while (digitMatch) {
      tokens.add(`INV-${digitMatch[0]}`);
      digitMatch = digitRegex.exec(text);
    }

    const sanitizedTokens = Array.from(tokens).map((token) => this.sanitizeRef(token));
    return { tokens: Array.from(tokens), sanitizedTokens };
  }

  private findARItemCandidates(
    tokens: string[],
    amount: number
  ): { invoiceId: string; invoiceNumber: string; amount: number; score: number }[] {
    const candidates: {
      invoiceId: string;
      invoiceNumber: string;
      amount: number;
      score: number;
    }[] = [];
    const sanitizedTokens = tokens.map((token) => this.sanitizeRef(token));

    this.arItems.forEach((item) => {
      const sanitizedInvoice = this.sanitizeRef(item.invoiceNumber);
      const invoiceCore = sanitizedInvoice.replace(/^[A-Z]+/, "");
      let score = 0;

      sanitizedTokens.forEach((token) => {
        if (sanitizedInvoice.includes(token) || token.includes(sanitizedInvoice)) {
          score = Math.max(score, 0.6);
        }
        if (invoiceCore && (token.includes(invoiceCore) || invoiceCore.includes(token))) {
          score = Math.max(score, 0.5);
        }
        if (token.startsWith("CM") && item.invoiceNumber.startsWith("CM")) {
          score = Math.max(score, 0.65);
        }
      });

      if (Math.abs(Math.abs(item.amount) - Math.abs(amount)) < 0.5) {
        score += 0.3;
      }

      if (score > 0.4) {
        candidates.push({
          invoiceId: item.id,
          invoiceNumber: item.invoiceNumber,
          amount: item.amount,
          score: Math.min(score, 1),
        });
      }
    });

    return candidates;
  }

  private getRemittanceReferences(payment: Payment): { invoiceNumber: string; amount: number }[] {
    if (payment.remittanceSource === "None") return [];
    const remittance = this.remittances.find(
      (rem) =>
        rem.emailSubject?.includes(payment.paymentNumber) ||
        rem.remittanceNumber.includes(payment.paymentNumber)
    );
    return (
      remittance?.extractedReferencesDetailed?.map((ref) => ({
        invoiceNumber: ref.invoiceNumber,
        amount: ref.amount,
      })) ||
      remittance?.extractedReferences?.map((ref) => ({
        invoiceNumber: (ref as any).invoice || (ref as any).invoiceNumber,
        amount: ref.amount,
      })) ||
      []
    );
  }

  private matchFromRemittance(
    payment: Payment,
    remittanceRefs: { invoiceNumber: string; amount: number }[],
    sanitizedTokens: string[],
    now: string
  ): boolean {
    const invoiceRefs = remittanceRefs.filter((ref) => !ref.invoiceNumber.startsWith("CM"));
    const creditRefs = remittanceRefs.filter(
      (ref) => ref.invoiceNumber.startsWith("CM") || ref.amount < 0
    );

    const invoiceTotal = invoiceRefs.reduce((sum, ref) => sum + ref.amount, 0);
    const creditTotal = creditRefs.reduce((sum, ref) => sum + ref.amount, 0);
    const expectedTotal = invoiceTotal + creditTotal;
    const totalsMatch = Math.abs(expectedTotal - payment.amount) < 0.5;

    if (!totalsMatch) {
      const exceptionType = payment.amount < expectedTotal ? "ShortPay" : "OverPay";
      this.applyMatchException(payment, {
        exceptionType,
        summary: "Remittance totals do not reconcile to payment amount",
        sanitizedTokens,
        now,
        candidates: [],
      });
      return true;
    }

    const transformedLines = remittanceRefs.map((ref, index) => ({
      id: `TL-${payment.paymentNumber}-${index + 1}`,
      erpReference: ref.invoiceNumber,
      referenceField: ref.invoiceNumber.startsWith("CM") ? "Credit Memo" : "Invoice",
      discountAmount: 0,
      paymentAmount: ref.amount,
      reasonCode: ref.invoiceNumber.startsWith("CM") ? "CM" : "FULL",
      reasonDescription: ref.invoiceNumber.startsWith("CM")
        ? "Credit Memo Applied"
        : "Full Payment",
      customerNumber: payment.customerNumber,
    }));

    const confidence = 94;
    this.updatePayment(payment.id, {
      status: "PendingToPost",
      exceptionType: null,
      confidenceScore: confidence,
      transformedLines,
      matchVersion: "v0.3",
      matchExplanation: {
        summary:
          creditRefs.length > 0
            ? "Composite match applied (invoice + credit memo)"
            : "Remittance references matched to invoices",
        signals: [
          {
            type: "RemittanceLink",
            value: payment.linkedRemittanceFileUrl || "remittance",
            weight: 0.5,
          },
          { type: "AmountExact", value: payment.amount.toString(), weight: 0.3 },
          ...(creditRefs.length > 0
            ? [{ type: "CMComposite" as const, value: creditRefs[0].invoiceNumber, weight: 0.2 }]
            : []),
        ],
        sanitizedTokens,
        confidence,
      },
      autoMatchedAt: now,
      autoMatchEligible: false,
    });

    this.addActivityLog(payment.id, {
      timestamp: now,
      user: "System",
      action: "Matching Engine Evaluated",
      details: "Remittance references used for matching",
    });
    if (creditRefs.length > 0) {
      this.addActivityLog(payment.id, {
        timestamp: now,
        user: "System",
        action: "Composite match applied (CM + Payment)",
        details: `Applied credit memo ${creditRefs.map((ref) => ref.invoiceNumber).join(", ")}`,
      });
    }
    this.addActivityLog(payment.id, {
      timestamp: now,
      user: "System",
      action: "Auto-match created posting lines",
      details: `Applied ${remittanceRefs.length} remittance line(s)`,
    });
    this.addActivityLog(payment.id, {
      timestamp: now,
      user: "System",
      action: "Moved to PendingToPost",
      details: "Payment ready for posting",
    });

    return true;
  }

  private applyMatchException(
    payment: Payment,
    args: {
      exceptionType: Payment["exceptionType"];
      summary: string;
      sanitizedTokens: string[];
      now: string;
      candidates: { invoiceId: string; invoiceNumber: string; amount: number; score: number }[];
    }
  ): void {
    const confidence = args.candidates.length > 0 ? Math.round(args.candidates[0].score * 100) : 60;

    this.updatePayment(payment.id, {
      status: "Exception",
      exceptionType: args.exceptionType,
      confidenceScore: confidence,
      matchVersion: "v0.3",
      matchExplanation: {
        summary: args.summary,
        signals:
          args.candidates.length > 0
            ? [
                { type: "InvoiceRef", value: args.candidates[0].invoiceNumber, weight: 0.4 },
                { type: "AmountExact", value: payment.amount.toString(), weight: 0.2 },
              ]
            : [{ type: "InvoiceRef", value: "none", weight: 0.1 }],
        sanitizedTokens: args.sanitizedTokens,
        confidence,
      },
      candidateMatches: args.candidates.map((candidate) => ({
        invoiceId: candidate.invoiceId,
        invoiceNumber: candidate.invoiceNumber,
        amount: candidate.amount,
        score: candidate.score,
      })),
      autoMatchEligible: false,
    });

    this.addActivityLog(payment.id, {
      timestamp: args.now,
      user: "System",
      action: "Matching Engine Evaluated",
      details: args.summary,
    });
    this.addActivityLog(payment.id, {
      timestamp: args.now,
      user: "System",
      action: `Exception created: ${args.exceptionType || "Unknown"}`,
      details: "Manual review required",
    });
  }

  private appendNetSuiteSyncHealthScenario(): void {
    const now = new Date();
    const syncRuns: SyncRun[] = [];

    if (ENABLE_BLOCK_POSTING_DEMO) {
      syncRuns.push({
        id: "sync-inv-001",
        source: "NetSuite",
        entityType: "Invoices",
        watermarkFrom: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        watermarkTo: new Date(now.getTime() - 47 * 60 * 1000).toISOString(),
        startedAt: new Date(now.getTime() - 47 * 60 * 1000).toISOString(),
        finishedAt: new Date(now.getTime() - 47 * 60 * 1000).toISOString(),
        status: "Partial",
        recordsFetched: 1247,
        recordsUpserted: 1103,
        errorsCount: 144,
        errorSummary: ["API timeout on batch 12/15", "Connection reset on batch 15/15"],
      });
    } else {
      syncRuns.push({
        id: "sync-inv-001",
        source: "NetSuite",
        entityType: "Invoices",
        watermarkFrom: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        watermarkTo: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
        startedAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
        finishedAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
        status: "Success",
        recordsFetched: 523,
        recordsUpserted: 523,
        errorsCount: 0,
      });
    }

    syncRuns.push(
      {
        id: "sync-cm-001",
        source: "NetSuite",
        entityType: "CreditMemos",
        watermarkFrom: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        watermarkTo: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
        startedAt: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
        finishedAt: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
        status: "Success",
        recordsFetched: 87,
        recordsUpserted: 87,
        errorsCount: 0,
      },
      {
        id: "sync-pay-001",
        source: "NetSuite",
        entityType: "Payments",
        watermarkFrom: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        watermarkTo: new Date(now.getTime() - 9 * 60 * 1000).toISOString(),
        startedAt: new Date(now.getTime() - 9 * 60 * 1000).toISOString(),
        finishedAt: new Date(now.getTime() - 9 * 60 * 1000).toISOString(),
        status: "Success",
        recordsFetched: 341,
        recordsUpserted: 341,
        errorsCount: 0,
      },
      {
        id: "sync-cust-001",
        source: "NetSuite",
        entityType: "Customers",
        watermarkFrom: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        watermarkTo: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        startedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        finishedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        status: "Success",
        recordsFetched: 156,
        recordsUpserted: 156,
        errorsCount: 0,
      }
    );

    const freshness = this.getDataFreshnessFromRuns(syncRuns);
    const guard = this.computeIntegrityGuard(syncRuns, freshness);

    this.dataHealth = {
      syncRuns,
      freshness,
      guard,
    };
  }

  private getDataFreshnessFromRuns(syncRuns: SyncRun[]): DataFreshness[] {
    const now = new Date();
    const freshnessMap = new Map<SyncEntityType, DataFreshness>();

    syncRuns.forEach((run) => {
      if (run.status === "Success" && run.finishedAt) {
        const existing = freshnessMap.get(run.entityType);
        if (!existing || run.finishedAt > (existing.lastSuccessfulSyncAt || "")) {
          const lastSync = new Date(run.finishedAt);
          const ageMinutes = Math.floor((now.getTime() - lastSync.getTime()) / 60000);
          freshnessMap.set(run.entityType, {
            entityType: run.entityType,
            lastSuccessfulSyncAt: run.finishedAt,
            ageMinutes,
          });
        }
      }
    });

    return Array.from(freshnessMap.values());
  }

  private computeIntegrityGuard(syncRuns: SyncRun[], freshness: DataFreshness[]): IntegrityGuard {
    const now = new Date().toISOString();
    const reasons: IntegrityGuardReason[] = [];
    let overallState: IntegrityGuard["overallState"] = "Healthy";

    const latestRunsByEntity = new Map<SyncEntityType, SyncRun>();
    syncRuns.forEach((run) => {
      const existing = latestRunsByEntity.get(run.entityType);
      if (!existing || run.startedAt > existing.startedAt) {
        latestRunsByEntity.set(run.entityType, run);
      }
    });

    latestRunsByEntity.forEach((run, entityType) => {
      if (run.status === "Partial") {
        reasons.push({
          code: "PartialSyncDetected",
          message: `${entityType} sync was partial — ${run.errorsCount} records failed. Posting blocked until resolved.`,
          entityType,
          lastSuccessfulSyncAt: run.finishedAt,
        });
        overallState = "BlockPosting";
      } else if (run.status === "Failed") {
        reasons.push({
          code: "FailedSyncDetected",
          message: `${entityType} sync failed completely. Posting blocked.`,
          entityType,
          lastSuccessfulSyncAt: run.finishedAt,
        });
        overallState = "BlockPosting";
      }
    });

    freshness.forEach((fresh) => {
      if (fresh.ageMinutes && fresh.ageMinutes > 30) {
        const reasonCode = `${fresh.entityType}Stale` as IntegrityGuardReasonCode;
        reasons.push({
          code: reasonCode,
          message: `${fresh.entityType} data is ${fresh.ageMinutes} minutes old (threshold: 30 min).`,
          entityType: fresh.entityType,
          lastSuccessfulSyncAt: fresh.lastSuccessfulSyncAt,
          ageMinutes: fresh.ageMinutes,
        });
        if (overallState === "Healthy") {
          overallState = "Degraded";
        }
      }
    });

    return {
      overallState,
      reasons,
      computedAt: now,
    };
  }

  getDataHealth(): CashAppDataHealth {
    return this.dataHealth;
  }

  canPostToERP(paymentId: string): { allowed: boolean; reason?: string } {
    if (this.dataHealth.guard.overallState === "BlockPosting") {
      const firstReason = this.dataHealth.guard.reasons[0];
      return {
        allowed: false,
        reason: firstReason?.message || "Data sync issues detected. Posting blocked.",
      };
    }
    return { allowed: true };
  }

  getPayments(): Payment[] {
    this.payments = this.payments.map((payment) => ({
      ...payment,
      ...resolveExceptionMetadata(payment),
    }));
    return this.payments;
  }

  getBankLines(): BankLine[] {
    return this.bankLines;
  }

  getUiState(): { lastPaymentId: string | null; returnTo: "QUEUE" | "PAYMENT_DETAIL" } {
    return this.uiState;
  }

  setUiState(
    update: Partial<{ lastPaymentId: string | null; returnTo: "QUEUE" | "PAYMENT_DETAIL" }>
  ): void {
    this.uiState = { ...this.uiState, ...update };
  }

  getPaymentById(id: string): Payment | undefined {
    const payment = this.payments.find((p) => p.id === id || p.paymentNumber === id);
    if (!payment) return undefined;
    const updates = resolveExceptionMetadata(payment);
    if (Object.keys(updates).length > 0) {
      Object.assign(payment, updates);
    }
    return payment;
  }

  updatePayment(id: string, updates: Partial<Payment>): void {
    const index = this.payments.findIndex((p) => p.id === id);
    if (index !== -1) {
      const nextPayment = {
        ...this.payments[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.payments[index] = {
        ...nextPayment,
        ...resolveExceptionMetadata(nextPayment),
      };
    }
  }

  addPaymentTimelineEntry(paymentId: string, entry: ActivityTimelineEntry): void {
    const payment = this.getPaymentById(paymentId);
    if (!payment) return;
    const timeline = payment.activity_timeline || [];
    this.updatePayment(paymentId, { activity_timeline: [...timeline, entry] });
  }

  updateBankLine(id: string, updates: Partial<BankLine>): void {
    const index = this.bankLines.findIndex((line) => line.bank_line_id === id);
    if (index !== -1) {
      this.bankLines[index] = { ...this.bankLines[index], ...updates };
    }
  }

  linkBankLine(bankLineId: string, paymentId: string): void {
    const payment = this.getPaymentById(paymentId);
    const line = this.bankLines.find((item) => item.bank_line_id === bankLineId);
    if (!payment || !line) return;
    const status =
      payment.posted_status === "POSTED" && payment.bank_match_ready
        ? "LINKED_POSTED"
        : payment.posted_status === "POSTED"
          ? "RISK"
          : "LINKED_NOT_POSTED";
    this.updateBankLine(bankLineId, {
      linked_payment_id: payment.id,
      status,
      bank_txn_ref: line.bank_txn_ref,
    });
    this.addPaymentTimelineEntry(payment.id, {
      event: "Bank Line Linked",
      detail: `${line.bank_txn_ref} • ${line.amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 })}`,
      actor: "User",
      ts: new Date().toISOString(),
    });
  }

  unlinkBankLine(bankLineId: string): void {
    const line = this.bankLines.find((item) => item.bank_line_id === bankLineId);
    if (!line) return;
    const paymentId = line.linked_payment_id;
    this.updateBankLine(bankLineId, {
      linked_payment_id: null,
      status: "UNLINKED",
    });
    if (paymentId) {
      this.addPaymentTimelineEntry(paymentId, {
        event: "Bank Line Unlinked",
        detail: `${line.bank_txn_ref} • ${line.amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 })}`,
        actor: "User",
        ts: new Date().toISOString(),
      });
    }
  }

  updatePayments(ids: string[], updates: Partial<Payment>): void {
    ids.forEach((id) => this.updatePayment(id, updates));
  }

  private appendBatchTimelineEvent(
    batch: PaymentBatch,
    event: string,
    detail: string,
    actor: string
  ): void {
    batch.audit_timeline.push({
      event,
      detail,
      actor,
      ts: new Date().toISOString(),
    });
  }

  getPaymentBatches(): PaymentBatch[] {
    return this.paymentBatches;
  }

  getPaymentBatchById(batchId: string): PaymentBatch | undefined {
    return this.paymentBatches.find((batch) => batch.batch_id === batchId);
  }

  updatePaymentBatch(batchId: string, updates: Partial<PaymentBatch>): void {
    const index = this.paymentBatches.findIndex((batch) => batch.batch_id === batchId);
    if (index !== -1) {
      this.paymentBatches[index] = refreshBatchMetrics({
        ...this.paymentBatches[index],
        ...updates,
      });
    }
  }

  postPaymentBatch(batchId: string, mode: "all" | "ready" | "retry"): PaymentBatch | undefined {
    const batch = this.getPaymentBatchById(batchId);
    if (!batch) return undefined;

    const now = new Date().toISOString();
    if (mode === "retry") {
      this.appendBatchTimelineEvent(
        batch,
        "Retry Attempted",
        "Retry initiated for failed items",
        "System"
      );
    } else {
      batch.status = "POSTING";
      this.appendBatchTimelineEvent(
        batch,
        "Posting Started",
        "Posting initiated from Payment Batches",
        "System"
      );
    }

    const successRate = mode === "retry" ? 0.9 : 0.8;
    const eligibleState: BatchLineReadyState = mode === "retry" ? "FAILED" : "READY";
    let postedThisRun = 0;
    let failedThisRun = 0;

    batch.line_items = batch.line_items.map((item) => {
      if (item.ready_state !== eligibleState) return item;

      const succeeded = shouldSucceed(item.payment_id, successRate);
      if (succeeded) {
        postedThisRun += 1;
        this.updatePayment(item.payment_id, {
          status: "Posted",
        });
        return {
          ...item,
          ready_state: "POSTED",
          blocked_reason: undefined,
          netsuite_post_result: {
            status: "SUCCESS",
            netsuite_payment_id: `NS-PMT-${getLast4(item.payment_id)}`,
            netsuite_je_id:
              item.workstream === "JE_REQUIRED" || item.workstream === "INTERCOMPANY"
                ? `NS-JE-${getLast4(item.payment_id)}`
                : null,
            error_code: null,
            error_message: null,
            last_attempt_ts: now,
          },
        };
      }

      failedThisRun += 1;
      this.updatePayment(item.payment_id, {
        pending_post_state: "FAILED",
      });
      return {
        ...item,
        ready_state: "FAILED",
        netsuite_post_result: {
          status: "ERROR",
          netsuite_payment_id: null,
          netsuite_je_id: null,
          error_code: "NS_VALIDATION",
          error_message: pickErrorMessage(item.payment_id),
          last_attempt_ts: now,
        },
      };
    });

    const postedCount = batch.line_items.filter((item) => item.ready_state === "POSTED").length;
    const failedCount = batch.line_items.filter((item) => item.ready_state === "FAILED").length;

    if (postedCount === batch.line_items.length) {
      batch.status = "POSTED";
    } else if (failedCount === batch.line_items.length) {
      batch.status = "FAILED";
    } else if (failedCount > 0 || postedCount > 0) {
      batch.status = "PARTIAL";
    } else {
      batch.status = "READY";
    }

    if (postedThisRun > 0) {
      batch.posted_at = now;
      batch.posted_by = "Current User";
    }

    this.appendBatchTimelineEvent(
      batch,
      "Posting Completed",
      `${postedThisRun} posted, ${failedThisRun} failed`,
      "System"
    );
    const updated = refreshBatchMetrics(batch);
    this.updatePaymentBatch(batchId, updated);
    return updated;
  }

  retryPaymentBatchLineItem(batchId: string, paymentId: string): PaymentBatch | undefined {
    const batch = this.getPaymentBatchById(batchId);
    if (!batch) return undefined;
    const now = new Date().toISOString();
    const target = batch.line_items.find((item) => item.payment_id === paymentId);
    if (!target || target.ready_state !== "FAILED") return batch;

    const succeeded = shouldSucceed(paymentId, 0.9);
    if (succeeded) {
      this.updatePayment(paymentId, { status: "Posted" });
      target.ready_state = "POSTED";
      target.netsuite_post_result = {
        status: "SUCCESS",
        netsuite_payment_id: `NS-PMT-${getLast4(paymentId)}`,
        netsuite_je_id:
          target.workstream === "JE_REQUIRED" || target.workstream === "INTERCOMPANY"
            ? `NS-JE-${getLast4(paymentId)}`
            : null,
        error_code: null,
        error_message: null,
        last_attempt_ts: now,
      };
    } else {
      this.updatePayment(paymentId, { pending_post_state: "FAILED" });
      target.ready_state = "FAILED";
      target.netsuite_post_result = {
        status: "ERROR",
        netsuite_payment_id: null,
        netsuite_je_id: null,
        error_code: "NS_VALIDATION",
        error_message: pickErrorMessage(paymentId),
        last_attempt_ts: now,
      };
    }

    this.appendBatchTimelineEvent(
      batch,
      "Retry Attempted",
      `Retry attempted for ${paymentId}`,
      "System"
    );
    const updated = refreshBatchMetrics(batch);
    this.updatePaymentBatch(batchId, updated);
    return updated;
  }

  exportPaymentBatchReport(batchId: string): string | undefined {
    const batch = this.getPaymentBatchById(batchId);
    if (!batch) return undefined;

    const headers = [
      "batch_id",
      "payment_id",
      "payer_name",
      "customer_name",
      "amount",
      "workstream",
      "state",
      "netsuite_payment_id",
      "netsuite_je_id",
      "error_code",
      "error_message",
      "last_attempt_ts",
    ];

    const rows = batch.line_items.map((item) => [
      batch.batch_id,
      item.payment_id,
      item.payer_name,
      item.customer_name,
      item.amount.toFixed(2),
      item.workstream,
      item.ready_state,
      item.netsuite_post_result.netsuite_payment_id ?? "",
      item.netsuite_post_result.netsuite_je_id ?? "",
      item.netsuite_post_result.error_code ?? "",
      item.netsuite_post_result.error_message ?? "",
      item.netsuite_post_result.last_attempt_ts ?? "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    this.appendBatchTimelineEvent(
      batch,
      "Report Exported",
      "Posting report exported to CSV",
      "System"
    );
    return csv;
  }

  addActivityLog(paymentId: string, entry: Omit<ActivityLogEntry, "id">): void {
    const payment = this.getPaymentById(paymentId);
    if (payment) {
      const newEntry = {
        ...entry,
        id: `log-${Date.now()}`,
      };
      payment.activityLog.push(newEntry);
      this.updatePayment(paymentId, { activityLog: payment.activityLog });
    }
  }

  getStats(): CashAppStats {
    const autoMatched = this.payments.filter((p) => p.status === "AutoMatched").length;
    const exceptions = this.payments.filter((p) => p.status === "Exception").length;
    const critical = this.payments.filter(
      (p) => p.tags.includes("High Priority") || p.amount > 100000
    ).length;
    const pendingToPost = this.payments.filter((p) => p.status === "PendingToPost").length;
    const settlementPending = this.payments.filter((p) => p.status === "SettlementPending").length;
    const missingRemittance = this.payments.filter(
      (p) => p.exception_core_type === "MISSING_REMIT"
    ).length;
    const overPay = this.payments.filter((p) => p.exception_reason_code === "OVER_PAY").length;
    const duplicateSuspected = this.payments.filter(
      (p) => p.exception_reason_code === "DUPLICATE_SUSPECTED"
    ).length;
    const multiEntity = this.payments.filter(
      (p) => p.exception_reason_code === "MULTI_ENTITY"
    ).length;
    const highValue = this.payments.filter((p) => p.amount > 100000).length;

    const exceptionPayments = this.payments.filter((p) => p.status === "Exception");
    const criticalPayments = this.payments.filter(
      (p) => p.tags?.includes("High Priority") || p.amount > 100000
    );
    const pendingPayments = this.payments.filter((p) => p.status === "PendingToPost");

    const invoiceIssue = exceptionPayments.filter(
      (p) => p.exception_core_type === "INVOICE_ISSUE"
    ).length;
    const amountMismatch = exceptionPayments.filter(
      (p) => p.exception_core_type === "AMOUNT_ISSUE"
    ).length;
    const jeRequired = exceptionPayments.filter(
      (p) => p.exception_core_type === "JE_NEEDED"
    ).length;
    const remittanceParseError = exceptionPayments.filter(
      (p) => p.exception_reason_code === "REMIT_PARSE_ERROR"
    ).length;
    const unappliedOnAccount = exceptionPayments.filter(
      (p) => p.exception_reason_code === "UNAPPLIED_CASH"
    ).length;
    const achFailure = exceptionPayments.filter(
      (p) => p.exception_reason_code === "ACH_FAILED"
    ).length;

    const slaBreach = criticalPayments.filter((p) => p.tags?.includes("SLA Breach")).length;
    const netSuiteSyncRisk = criticalPayments.filter((p) => p.tags?.includes("Sync Risk")).length;
    const postingBlocked = criticalPayments.filter(
      (p) => p.postingHoldReasons && p.postingHoldReasons.length > 0
    ).length;
    const customerEscalation = criticalPayments.filter((p) => p.tags?.includes("Escalated")).length;
    const settlementRisk = criticalPayments.filter((p) => p.settlementStatus === "Failed").length;

    const readyToPost = pendingPayments.filter((p) => p.postingRefs?.postStatus === "Ready").length;
    const approvalNeeded = pendingPayments.filter(
      (p) => !p.postingRefs?.postStatus || p.postingRefs?.postStatus === "NotPosted"
    ).length;
    const jeApprovalPending = pendingPayments.filter(
      (p) => p.je_required && !p.intercompanyJEDraft
    ).length;
    const syncPending = pendingPayments.filter(
      (p) => p.postingRefs?.postStatus === "NotPosted"
    ).length;
    const postingFailed = pendingPayments.filter(
      (p) => p.postingRefs?.postStatus === "PostFailed"
    ).length;
    const bankMatchPending = pendingPayments.filter((p) => p.settlementStatus === "Pending").length;

    return {
      autoMatched,
      exceptions,
      critical,
      pendingToPost,
      settlementPending,
      missingRemittance,
      overPay,
      duplicateSuspected,
      multiEntity,
      highValue,
      invoiceIssue,
      amountMismatch,
      jeRequired,
      remittanceParseError,
      unappliedOnAccount,
      achFailure,
      slaBreach,
      netSuiteSyncRisk,
      settlementRisk,
      customerEscalation,
      postingBlocked,
      readyToPost,
      approvalNeeded,
      jeApprovalPending,
      syncPending,
      postingFailed,
      bankMatchPending,
    };
  }

  getRemittances(): Remittance[] {
    return this.remittances;
  }

  updateRemittance(id: string, updates: Partial<Remittance>): void {
    const index = this.remittances.findIndex((rem) => rem.id === id || rem.remittanceNumber === id);
    if (index !== -1) {
      this.remittances[index] = {
        ...this.remittances[index],
        ...updates,
      };
    }
  }

  addRemittanceActivity(
    id: string,
    entry: { event: string; actor: string; ts: string; detail?: string }
  ): void {
    const remittance = this.remittances.find((rem) => rem.id === id || rem.remittanceNumber === id);
    if (!remittance) return;
    const activity_log = [...(remittance.activity_log || []), entry];
    this.updateRemittance(remittance.id, { activity_log });
  }

  createExceptionPaymentFromRemittance(
    remittance: Remittance,
    reason: "Remittance Unlinked" | "Remittance Parse Failed"
  ): Payment {
    const basePayment = this.payments[0];
    const idSuffix = `${Date.now()}`.slice(-6);
    const paymentId = `PAY-EXC-${idSuffix}`;
    const paymentNumber = `PMT-2026-${idSuffix}`;
    const amount = remittance.remittanceAmount ?? remittance.totalAmount;
    const now = new Date().toISOString();

    const exceptionPayment: Payment = {
      ...basePayment,
      id: paymentId,
      paymentNumber,
      paymentHeaderId: `HDR-${paymentNumber}`,
      amount,
      date: remittance.receivedDate || remittance.effectiveDate || now.split("T")[0],
      bankAccount: basePayment.bankAccount,
      method: basePayment.method,
      payerNameRaw: remittance.customerName,
      memoReferenceRaw: remittance.key_reference || remittance.remittanceNumber,
      customerId: remittance.customerId,
      customerName: remittance.customerName,
      customerNumber: remittance.customerNumber || basePayment.customerNumber,
      identificationCriteria: "Remittance Exception",
      remittanceSource: remittance.source,
      linkedRemittanceFileUrl: remittance.inputFileUrl,
      status: "Exception",
      exceptionType: "MissingRemittance",
      confidenceScore: Math.min(88, Math.max(35, remittance.confidence_score || 50)),
      transformedLines: [],
      activityLog: [
        ...(basePayment.activityLog || []),
        {
          id: `log-${paymentId}`,
          timestamp: now,
          user: "System",
          action: "Exception Created",
          details: reason,
        },
      ],
      exception_core_type: "MISSING_REMIT",
      exception_reason_code:
        reason === "Remittance Parse Failed" ? "REMIT_PARSE_ERROR" : "MISSING_REMIT",
      exception_reason_label:
        reason === "Remittance Parse Failed"
          ? EXCEPTION_REASON_LABELS.REMIT_PARSE_ERROR
          : EXCEPTION_REASON_LABELS.MISSING_REMIT,
      exception_resolution_state: "OPEN",
      parse_error_flag: reason === "Remittance Parse Failed",
      tags: ["remittance-exception"],
      createdAt: now,
      updatedAt: now,
    };

    this.payments = [exceptionPayment, ...this.payments];
    return exceptionPayment;
  }

  getMailboxConfigs(): MailboxConfig[] {
    return this.mailboxConfigs;
  }

  getIngestionRuns(): IngestionRun[] {
    return this.ingestionRuns;
  }

  getRawEmails(): RawEmailMessage[] {
    return this.rawEmailMessages;
  }

  getEmailInboxMessages(): RawEmailMessage[] {
    return this.rawEmailMessages;
  }

  updateEmailMessage(id: string, updates: Partial<RawEmailMessage>): void {
    const index = this.rawEmailMessages.findIndex((email) => email.id === id);
    if (index !== -1) {
      this.rawEmailMessages[index] = {
        ...this.rawEmailMessages[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  addEmailTimelineEntry(id: string, entry: ActivityTimelineEntry): void {
    const email = this.rawEmailMessages.find((item) => item.id === id);
    if (!email) return;
    email.activity_timeline = [...(email.activity_timeline || []), entry];
    this.updateEmailMessage(id, { activity_timeline: email.activity_timeline });
  }

  getRemittanceRecords(): RemittanceRecord[] {
    return this.remittanceRecords;
  }

  addRemittanceRecord(record: RemittanceRecord): void {
    this.remittanceRecords = [...this.remittanceRecords, record];
  }

  getRawAttachments(): RawAttachment[] {
    return this.rawAttachments;
  }

  getLatestPostRun(): PostRun | undefined {
    return this.postRuns[this.postRuns.length - 1];
  }

  getMatchBankDataExport(postRunId: string): MatchBankDataExport | undefined {
    return this.matchBankDataExports.find((exportRun) => exportRun.postRunId === postRunId);
  }

  getEmailInboxRows(): {
    id: string;
    from: string;
    subject: string;
    date: string;
    hasAttachment: boolean;
    status: string;
    amount: string;
    mailbox: EmailMailbox;
    linked_payment_id?: string;
  }[] {
    const remittanceByEmail = new Map(
      this.remittances
        .filter((remittance) => remittance.emailIdentifier)
        .map((remittance) => [remittance.emailIdentifier as string, remittance])
    );
    const statusMap: Record<string, string> = {
      NEW: "New",
      EXTRACTED: "Extracted",
      PARTIAL: "Partial",
      FAILED: "Failed",
      PROCESSED: "Processed",
    };
    const formatDate = (iso: string) => {
      const date = new Date(iso);
      const yyyy = date.getUTCFullYear();
      const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(date.getUTCDate()).padStart(2, "0");
      let hours = date.getUTCHours();
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return `${yyyy}-${mm}-${dd} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    };
    const formatCurrency = (amount?: number) => {
      if (!amount) return "--";
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    return this.rawEmailMessages
      .slice()
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      .map((email) => {
        const remittance = remittanceByEmail.get(email.id);
        const amount = remittance?.remittanceAmount ?? remittance?.totalAmount;
        return {
          id: email.id,
          from: `${email.fromName} <${email.fromEmail}>`,
          subject: email.subject,
          date: formatDate(email.receivedAt),
          hasAttachment: email.attachmentIds.length > 0,
          status: statusMap[email.status] || email.status,
          amount: formatCurrency(amount),
          mailbox: email.mailbox,
          linked_payment_id: email.linked_payment_id,
        };
      });
  }

  getARItems(): ARItem[] {
    return this.arItems;
  }

  getO2CSummary() {
    const today = new Date().toISOString().split("T")[0];
    const cashReceivedToday = this.payments
      .filter((p) => p.date === today)
      .reduce((sum, p) => sum + p.amount, 0);

    const appliedToday = this.payments.filter((p) => p.status !== "New" && p.date === today);

    const pendingToPost = this.payments.filter((p) => p.status === "PendingToPost");
    const exceptions = this.payments.filter((p) => p.status === "Exception");
    const criticalExceptions = exceptions.filter(
      (p) => p.tags.includes("High Priority") || p.amount > 100000
    );

    const autoMatchEligible = this.payments.filter((p) =>
      ["New", "AutoMatched", "Exception", "PendingToPost", "Posted"].includes(p.status)
    ).length;
    const autoMatched = this.payments.filter((p) => p.status === "AutoMatched").length;
    const autoMatchRate = autoMatchEligible > 0 ? (autoMatched / autoMatchEligible) * 100 : 0;

    const settlementRisk = this.payments.filter(
      (p) => p.status === "SettlementPending" || p.settlementStatus === "Failed"
    );

    const remittances = this.getRemittances();
    const linkedRemittances = remittances.filter((r) => r.linkStatus === "Linked").length;
    const failedParsing = remittances.filter(
      (r) => r.linkStatus === "Failed" || r.status === "Failed"
    ).length;
    const remittanceHealthPct =
      remittances.length > 0 ? (linkedRemittances / remittances.length) * 100 : 0;

    return {
      cashReceivedToday,
      cashReceivedTodayCount: this.payments.filter((p) => p.date === today).length,
      appliedToday: appliedToday.reduce((sum, p) => sum + p.amount, 0),
      appliedTodayCount: appliedToday.length,
      pendingToPostAmount: pendingToPost.reduce((sum, p) => sum + p.amount, 0),
      pendingToPostCount: pendingToPost.length,
      exceptionsCount: exceptions.length,
      criticalExceptionsCount: criticalExceptions.length,
      autoMatchRate: Math.round(autoMatchRate),
      settlementRiskCount: settlementRisk.length,
      settlementRiskAmount: settlementRisk.reduce((sum, p) => sum + p.amount, 0),
      remittanceHealthPct: Math.round(remittanceHealthPct),
      failedParsingCount: failedParsing,
    };
  }

  getPipelineMetrics() {
    const arItems = this.getARItems();
    const payments = this.payments;
    const remittances = this.getRemittances();

    return {
      invoicesIssued: { count: arItems.length, amount: arItems.reduce((s, i) => s + i.amount, 0) },
      dueSoonOverdue: {
        count: arItems.filter((i) => new Date(i.dueDate) <= new Date()).length,
        amount: arItems
          .filter((i) => new Date(i.dueDate) <= new Date())
          .reduce((s, i) => s + i.amount, 0),
      },
      paymentsReceived: {
        count: payments.length,
        amount: payments.reduce((s, p) => s + p.amount, 0),
      },
      remittanceCaptured: {
        count: remittances.length,
        amount: remittances.reduce((s, r) => s + r.totalAmount, 0),
      },
      linked: {
        count: payments.filter((p) => p.remittanceSource !== "None").length,
        amount: payments
          .filter((p) => p.remittanceSource !== "None")
          .reduce((s, p) => s + p.amount, 0),
      },
      matched: {
        count: payments.filter((p) => p.status === "AutoMatched").length,
        amount: payments
          .filter((p) => p.status === "AutoMatched")
          .reduce((s, p) => s + p.amount, 0),
      },
      pendingToPost: {
        count: payments.filter((p) => p.status === "PendingToPost").length,
        amount: payments
          .filter((p) => p.status === "PendingToPost")
          .reduce((s, p) => s + p.amount, 0),
      },
      posted: {
        count: payments.filter((p) => p.status === "Posted").length,
        amount: payments.filter((p) => p.status === "Posted").reduce((s, p) => s + p.amount, 0),
      },
      reconciled: {
        count: payments.filter((p) => p.status === "Posted" && p.postingRefs?.nsDepositId).length,
        amount: payments
          .filter((p) => p.status === "Posted" && p.postingRefs?.nsDepositId)
          .reduce((s, p) => s + p.amount, 0),
      },
    };
  }

  getExceptionSummary() {
    const payments = this.payments;
    const exceptions = payments.filter((p) => p.status === "Exception");

    const getOldestAge = (items: Payment[]) => {
      if (items.length === 0) return 0;
      const oldest = items.reduce((oldest, p) => {
        const age = Math.floor(
          (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return age > oldest ? age : oldest;
      }, 0);
      return oldest;
    };

    const byType = (type: string) => exceptions.filter((p) => p.exceptionType === type);
    const byCore = (core: ExceptionCoreType) =>
      exceptions.filter((p) => p.exception_core_type === core);
    const byReason = (reason: ExceptionReasonCode) =>
      exceptions.filter((p) => p.exception_reason_code === reason);

    return {
      missingRemittance: {
        count: byCore("MISSING_REMIT").length,
        amount: byCore("MISSING_REMIT").reduce((s, p) => s + p.amount, 0),
        oldestAge: getOldestAge(byCore("MISSING_REMIT")),
      },
      ambiguousCustomer: {
        count: byCore("INVOICE_ISSUE").length,
        amount: byCore("INVOICE_ISSUE").reduce((s, p) => s + p.amount, 0),
        oldestAge: getOldestAge(byCore("INVOICE_ISSUE")),
      },
      overPay: {
        count: byReason("OVER_PAY").length,
        amount: byReason("OVER_PAY").reduce((s, p) => s + p.amount, 0),
        oldestAge: getOldestAge(byReason("OVER_PAY")),
      },
      shortPay: {
        count: byReason("SHORT_PAY").length,
        amount: byReason("SHORT_PAY").reduce((s, p) => s + p.amount, 0),
        oldestAge: getOldestAge(byReason("SHORT_PAY")),
      },
      duplicateSuspected: {
        count: byReason("DUPLICATE_SUSPECTED").length,
        amount: byReason("DUPLICATE_SUSPECTED").reduce((s, p) => s + p.amount, 0),
        oldestAge: getOldestAge(byReason("DUPLICATE_SUSPECTED")),
      },
      multiEntity: {
        count: byReason("MULTI_ENTITY").length,
        amount: byReason("MULTI_ENTITY").reduce((s, p) => s + p.amount, 0),
        oldestAge: getOldestAge(byReason("MULTI_ENTITY")),
      },
      settlementPending: {
        count: payments.filter((p) => p.status === "SettlementPending").length,
        amount: payments
          .filter((p) => p.status === "SettlementPending")
          .reduce((s, p) => s + p.amount, 0),
        oldestAge: getOldestAge(payments.filter((p) => p.status === "SettlementPending")),
      },
      settlementFailed: {
        count: byReason("SETTLEMENT_FAILED").length,
        amount: byReason("SETTLEMENT_FAILED").reduce((s, p) => s + p.amount, 0),
        oldestAge: getOldestAge(byReason("SETTLEMENT_FAILED")),
      },
    };
  }

  getSLAWorkloadSummary() {
    const payments = this.payments;
    const exceptions = payments.filter((p) => p.status === "Exception");

    const avgTimeToMatch = payments
      .filter((p) => p.autoMatchedAt)
      .reduce((sum, p, _, arr) => {
        const timeToMatch =
          (new Date(p.autoMatchedAt!).getTime() - new Date(p.createdAt).getTime()) /
          (1000 * 60 * 60);
        return sum + timeToMatch / arr.length;
      }, 0);

    const avgTimeToResolve = exceptions
      .filter((p) => p.updatedAt !== p.createdAt)
      .reduce((sum, p, _, arr) => {
        const timeToResolve =
          (new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60);
        return sum + timeToResolve / arr.length;
      }, 0);

    const backlogAgeBuckets = {
      "0-1d": exceptions.filter((p) => {
        const age = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return age <= 1;
      }).length,
      "2-3d": exceptions.filter((p) => {
        const age = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return age > 1 && age <= 3;
      }).length,
      "4-7d": exceptions.filter((p) => {
        const age = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return age > 3 && age <= 7;
      }).length,
      "8+d": exceptions.filter((p) => {
        const age = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return age > 7;
      }).length,
    };

    const assigned = exceptions.filter((p) => p.assignedTo).length;
    const unassigned = exceptions.filter((p) => !p.assignedTo).length;

    const analystWorkload: Record<string, number> = {};
    exceptions.forEach((p) => {
      if (p.assignedTo) {
        analystWorkload[p.assignedTo] = (analystWorkload[p.assignedTo] || 0) + 1;
      }
    });

    return {
      avgTimeToMatchHours: Math.round(avgTimeToMatch * 10) / 10,
      avgTimeToResolveHours: Math.round(avgTimeToResolve * 10) / 10,
      pctResolvedWithinSLA: 85,
      backlogAgeBuckets,
      assigned,
      unassigned,
      analystWorkload,
    };
  }

  getPostingReadinessSummary() {
    const pendingToPost = this.payments.filter((p) => p.status === "PendingToPost");
    const blockedBySync = this.payments.filter(
      (p) => p.postingHoldReasons && p.postingHoldReasons.length > 0
    );

    const postRuns = this.postRuns || [];
    const last24h = postRuns.filter((r) => {
      const age = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
      return age <= 24;
    });

    const latestExport =
      this.matchBankDataExports && this.matchBankDataExports.length > 0
        ? this.matchBankDataExports[this.matchBankDataExports.length - 1]
        : null;

    return {
      readyToPostCount: pendingToPost.length,
      readyToPostAmount: pendingToPost.reduce((s, p) => s + p.amount, 0),
      blockedBySyncCount: blockedBySync.length,
      postRunsLast24h: {
        success: last24h.filter((r) => r.status === "Success").length,
        failed: last24h.filter((r) => r.status === "Failed").length,
      },
      latestMatchBankDataExport: latestExport
        ? {
            id: latestExport.id,
            rowCount: latestExport.rows.length,
            failures: 0,
          }
        : null,
    };
  }

  getDataHealthSummary() {
    const syncRuns = this.dataHealth?.syncRuns || [];
    const latestNetSuiteSync = syncRuns
      .filter((r) => r.source === "NetSuite")
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

    const ingestionRuns = this.getIngestionRuns();
    const latestMailboxRun = ingestionRuns.sort((a, b) =>
      b.startedAt.localeCompare(a.startedAt)
    )[0];

    const bankFeedRuns = this.bankFeedRuns || [];
    const latestBankFeedRun = bankFeedRuns.sort((a, b) =>
      b.startedAt.localeCompare(a.startedAt)
    )[0];

    return {
      netsuiteSync: {
        state:
          latestNetSuiteSync?.status === "Success"
            ? "Healthy"
            : latestNetSuiteSync?.status === "Partial"
              ? "Warning"
              : "Blocked",
        lastRunTime: latestNetSuiteSync?.finishedAt || "N/A",
        summary: latestNetSuiteSync
          ? `${latestNetSuiteSync.recordsUpserted} records synced`
          : "No sync runs",
      },
      mailboxParsing: {
        state:
          latestMailboxRun?.status === "Success"
            ? "Healthy"
            : latestMailboxRun?.status === "Partial"
              ? "Partial"
              : "Failed",
        lastRunTime: latestMailboxRun?.finishedAt || "N/A",
        summary: latestMailboxRun
          ? `${latestMailboxRun.itemsParsed} of ${latestMailboxRun.rawItemsPulled} parsed`
          : "No ingestion runs",
      },
      bankSettlement: {
        state:
          latestBankFeedRun?.status === "Success"
            ? "Healthy"
            : latestBankFeedRun?.status === "Partial"
              ? "Pending"
              : "Failed",
        lastRunTime: latestBankFeedRun?.finishedAt || "N/A",
        summary: latestBankFeedRun
          ? `${latestBankFeedRun.transactionsCreated} transactions created`
          : "No bank feed runs",
      },
    };
  }
}

export const cashAppStore = new CashAppStore();
