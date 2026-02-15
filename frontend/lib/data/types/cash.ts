/**
 * Cash Application Domain Types
 *
 * Defines the core data structures for the Cash Application module,
 * covering payments, remittances, invoices, matching, exceptions,
 * bank lines, and remittance email extraction.
 */

// ---------------------------------------------------------------------------
// Enumerations / Union Types
// ---------------------------------------------------------------------------

/** Lifecycle status of a cash payment. */
export type CashPaymentStatus =
  | "New"
  | "AutoMatched"
  | "Exception"
  | "PendingToPost"
  | "Posted"
  | "NonAR";

/** Method through which a payment was received. */
export type CashPaymentMethod =
  | "ACH"
  | "Wire"
  | "Check"
  | "Credit Card"
  | "Other";

/** Channel from which remittance information was sourced. */
export type CashRemittanceSource =
  | "Email"
  | "Bank Portal"
  | "EDI"
  | "API"
  | "Manual Upload"
  | "None";

/** Classification of an exception raised during cash application. */
export type CashExceptionType =
  | "MissingRemittance"
  | "ShortPay"
  | "OverPay"
  | "DuplicateSuspected"
  | "MultiEntity"
  | "AmbiguousMatch"
  | "InvalidRef"
  | "NeedsJE"
  | null;

// ---------------------------------------------------------------------------
// Core Interfaces
// ---------------------------------------------------------------------------

/**
 * A single incoming payment recorded from the bank feed.
 *
 * Payments progress through statuses from `New` to `Posted` as they are
 * matched to invoices and approved for posting to the ERP.
 */
export interface CashPayment {
  /** Unique identifier. */
  id: string;
  /** Human-readable payment reference number. */
  paymentNumber: string;
  /** Gross payment amount in the ledger currency. */
  amount: number;
  /** Date the payment was received (ISO 8601). */
  date: string;
  /** Bank account into which the payment was deposited. */
  bankAccount: string;
  /** Payment instrument used. */
  method: CashPaymentMethod;
  /** Name of the entity that originated the payment. */
  payerName: string;
  /** Resolved customer name from the AR master. */
  customerName: string;
  /** Foreign key to the customer record. */
  customerId: string;
  /** Channel from which remittance detail was obtained. */
  remittanceSource: CashRemittanceSource;
  /** Current lifecycle status. */
  status: CashPaymentStatus;
  /** Exception classification, if any. */
  exceptionType: CashExceptionType;
  /** AI confidence score for the best match (0-100). */
  confidenceScore: number;
  /** User assigned to resolve or review this payment. */
  assignedTo?: string;
  /** Free-form tags for filtering and categorisation. */
  tags: string[];
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
  /** Timestamp when the record was last updated (ISO 8601). */
  updatedAt: string;
}

/**
 * Remittance advice received from a customer, describing which invoices
 * a payment is intended to cover.
 */
export interface CashRemittance {
  /** Unique identifier. */
  id: string;
  /** Remittance document reference number. */
  remittanceNumber: string;
  /** Channel through which the remittance was received. */
  source: CashRemittanceSource;
  /** Date the remittance was received (ISO 8601). */
  receivedDate: string;
  /** Customer name as stated on the remittance. */
  customerName: string;
  /** Foreign key to the customer record. */
  customerId: string;
  /** Total amount stated on the remittance. */
  totalAmount: number;
  /** Processing status of the remittance. */
  status: string;
  /** Invoice references extracted from the remittance document. */
  extractedReferences?: Array<{
    /** Invoice number referenced. */
    invoice: string;
    /** Amount allocated to this invoice. */
    amount: number;
  }>;
  /** ID of the payment this remittance has been linked to, if any. */
  linkedPaymentId?: string | null;
  /** AI extraction confidence score (0-100). */
  confidence?: number;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
}

/**
 * An open or recently closed AR invoice that can be matched against
 * incoming payments.
 */
export interface CashInvoice {
  /** Unique identifier. */
  id: string;
  /** Invoice document number. */
  invoiceNumber: string;
  /** Foreign key to the customer record. */
  customerId: string;
  /** Customer display name. */
  customerName: string;
  /** Outstanding invoice amount. */
  amount: number;
  /** Payment due date (ISO 8601). */
  dueDate: string;
  /** Current invoice status (e.g. Open, Partial, Closed). */
  status: string;
  /** Document type -- standard invoice or credit memo. */
  type?: "Invoice" | "CreditMemo";
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
}

/**
 * Result of matching a payment to an invoice, either automatically by the
 * AI engine or manually by a user.
 */
export interface CashMatchResult {
  /** Unique identifier. */
  id: string;
  /** Foreign key to the payment. */
  paymentId: string;
  /** Foreign key to the matched invoice. */
  invoiceId: string;
  /** Invoice number for display convenience. */
  invoiceNumber: string;
  /** Confidence score produced by the matching algorithm (0-100). */
  matchScore: number;
  /** How the match was determined. */
  matchType: "Exact" | "Tolerance" | "AI Suggested";
  /** Portion of the payment allocated to this invoice. */
  allocatedAmount: number;
  /** Approval status of the proposed match. */
  status: "Pending" | "Accepted" | "Rejected";
  /** AI-generated explanation for why this match was suggested. */
  aiExplanation?: string;
  /** Timestamp when the match was created (ISO 8601). */
  createdAt: string;
}

/**
 * An exception raised when a payment cannot be cleanly applied and
 * requires human review.
 */
export interface CashException {
  /** Unique identifier. */
  id: string;
  /** Foreign key to the originating payment. */
  paymentId: string;
  /** Payment number for display convenience. */
  paymentNumber: string;
  /** High-level exception classification. */
  exceptionType: string;
  /** Machine-readable reason code. */
  reasonCode: string;
  /** Human-readable reason label. */
  reasonLabel: string;
  /** Amount in dispute or unresolved. */
  amount: number;
  /** Customer associated with the payment. */
  customerName: string;
  /** Current resolution status. */
  status: "Open" | "Resolved" | "Rejected";
  /** User assigned to resolve the exception. */
  assignedTo?: string;
  /** Description of how the exception was resolved. */
  resolution?: string;
  /** Timestamp when the exception was created (ISO 8601). */
  createdAt: string;
  /** Timestamp when the exception was resolved (ISO 8601). */
  resolvedAt?: string;
}

/**
 * A single line from the daily bank statement feed, used for
 * reconciliation against recorded payments.
 */
export interface CashBankLine {
  /** Unique identifier. */
  id: string;
  /** Date of the bank transaction (ISO 8601). */
  bankDate: string;
  /** Transaction amount. */
  amount: number;
  /** Bank-assigned reference or transaction ID. */
  bankReference: string;
  /** Bank account the transaction belongs to. */
  bankAccount: string;
  /** ID of the payment this line has been linked to, if any. */
  linkedPaymentId?: string | null;
  /** Linking status of the bank line. */
  status: "Linked" | "Unlinked" | "Risk";
}

/**
 * An inbound email that may contain remittance advice as an attachment
 * or in the body, processed by the AI extraction pipeline.
 */
export interface CashRemittanceEmail {
  /** Unique identifier. */
  id: string;
  /** Display name of the sender. */
  fromName: string;
  /** Email address of the sender. */
  fromEmail: string;
  /** Email subject line. */
  subject: string;
  /** Timestamp when the email was received (ISO 8601). */
  receivedAt: string;
  /** Extraction pipeline status. */
  status: "New" | "Extracted" | "Partial" | "Failed" | "Processed";
  /** Number of attachments on the email. */
  attachmentCount: number;
  /** Total amount extracted from the remittance, if successful. */
  extractedAmount?: number;
  /** ID of the payment this email has been linked to, if any. */
  linkedPaymentId?: string;
  /** AI extraction confidence score (0-100). */
  confidence?: number;
}
