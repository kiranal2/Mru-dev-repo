import type { Payment, PaymentExplainability, PaymentRouting } from "../types";
import { companies, bankAccounts, users } from "./constants";
import { EXCEPTION_REASON_LABELS, EXCEPTION_TYPE_MAPPING } from "../helpers";

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

export function generateMockPayments(): Payment[] {
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
