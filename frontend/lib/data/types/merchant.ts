/**
 * Merchant Invoicing Domain Types
 *
 * Defines the core data structures for the Merchant Portal and Collections
 * modules, covering merchant accounts, invoices, payments, disputes, credit
 * memos, dunning sequences, promise-to-pay, and correspondence.
 */

// ---------------------------------------------------------------------------
// Enumerations / Union Types
// ---------------------------------------------------------------------------

/** Lifecycle status of a merchant account. */
export type MerchantAccountStatus =
  | "Active"
  | "Suspended"
  | "Closed"
  | "Pending";

/** Status of a merchant-submitted payment. */
export type MerchantPaymentStatus =
  | "Pending"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Refunded";

/** Status of a merchant-submitted invoice. */
export type MerchantInvoiceStatus =
  | "Open"
  | "Partial"
  | "Paid"
  | "Disputed"
  | "Credit"
  | "Overdue"
  | "Void";

/** Status of a merchant-filed dispute. */
export type MerchantDisputeStatus =
  | "Open"
  | "Under Review"
  | "Resolved"
  | "Rejected"
  | "Escalated";

/** Classification of a merchant dispute. */
export type MerchantDisputeType =
  | "Billing Error"
  | "Service Issue"
  | "Duplicate Charge"
  | "Unauthorized"
  | "Quality"
  | "Other";

/** Severity level for collection records. */
export type CollectionSeverity =
  | "Critical"
  | "High"
  | "Medium"
  | "Low";

/** Lifecycle status of a collection record. */
export type CollectionStatus =
  | "Active"
  | "In Progress"
  | "Escalated"
  | "Resolved"
  | "Written Off"
  | "On Hold";

/** Step in a dunning sequence. */
export type DunningStep =
  | "Friendly Reminder"
  | "Second Notice"
  | "Urgent Notice"
  | "Pre-Collection"
  | "Final Notice";

/** Status of a dunning sequence. */
export type DunningStatus =
  | "Active"
  | "Paused"
  | "Completed"
  | "Cancelled";

/** Status of a promise-to-pay record. */
export type PromiseStatus =
  | "Active"
  | "Due Today"
  | "Overdue"
  | "Fulfilled"
  | "Broken"
  | "Cancelled";

/** Type of correspondence entry. */
export type CorrespondenceType =
  | "Dunning"
  | "Follow-up"
  | "Acknowledgement"
  | "Escalation"
  | "Resolution"
  | "General";

/** Channel used for correspondence. */
export type CorrespondenceChannel =
  | "Email"
  | "Phone"
  | "Letter"
  | "SMS"
  | "Portal";

/** Merchant payment method type. */
export type PaymentMethodType =
  | "ACH"
  | "Credit Card"
  | "Debit Card"
  | "Wire";

/** ACH verification status. */
export type ACHVerificationStatus =
  | "Verified"
  | "Pending"
  | "Failed"
  | "Not Started";

/** Status of a credit memo. */
export type CreditMemoStatus =
  | "Available"
  | "Partially Applied"
  | "Fully Applied"
  | "Expired"
  | "Void";

// ---------------------------------------------------------------------------
// Merchant Portal Interfaces
// ---------------------------------------------------------------------------

/**
 * A merchant account representing a business entity with billing relationship.
 */
export interface MerchantAccount {
  /** Unique identifier. */
  id: string;
  /** Display name of the merchant. */
  name: string;
  /** Account reference number. */
  accountNumber: string;
  /** Current account status. */
  status: MerchantAccountStatus;
  /** Industry classification. */
  industry: string;
  /** Primary contact email. */
  email: string;
  /** Primary contact phone. */
  phone: string;
  /** Billing address. */
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  /** Current outstanding balance in USD. */
  outstandingBalance: number;
  /** Credit limit in USD. */
  creditLimit: number;
  /** Payment terms (e.g. "Net 30", "Net 60"). */
  paymentTerms: string;
  /** Default payment method ID. */
  defaultPaymentMethodId?: string;
  /** Number of open invoices. */
  openInvoiceCount: number;
  /** Last payment date (ISO 8601). */
  lastPaymentDate?: string;
  /** Last payment amount in USD. */
  lastPaymentAmount?: number;
  /** Account creation date (ISO 8601). */
  createdAt: string;
  /** Last update timestamp (ISO 8601). */
  updatedAt: string;
}

/**
 * A line item on a merchant invoice.
 */
export interface MerchantInvoiceLineItem {
  /** Unique identifier. */
  id: string;
  /** Description of the line item. */
  description: string;
  /** Quantity. */
  quantity: number;
  /** Unit price in USD. */
  unitPrice: number;
  /** Total amount for this line (quantity * unitPrice). */
  amount: number;
  /** Tax amount in USD. */
  tax: number;
}

/**
 * A merchant invoice for services or products rendered.
 */
export interface MerchantInvoice {
  /** Unique identifier. */
  id: string;
  /** Invoice document number. */
  invoiceNumber: string;
  /** Foreign key to the merchant account. */
  accountId: string;
  /** Merchant account name for display. */
  accountName: string;
  /** Invoice status. */
  status: MerchantInvoiceStatus;
  /** Invoice issue date (ISO 8601). */
  issueDate: string;
  /** Payment due date (ISO 8601). */
  dueDate: string;
  /** Subtotal before tax in USD. */
  subtotal: number;
  /** Tax amount in USD. */
  tax: number;
  /** Total invoice amount in USD. */
  totalAmount: number;
  /** Amount already paid in USD. */
  paidAmount: number;
  /** Remaining balance in USD. */
  balanceDue: number;
  /** Invoice line items. */
  lineItems: MerchantInvoiceLineItem[];
  /** Purchase order reference, if any. */
  poNumber?: string;
  /** Notes or memo on the invoice. */
  notes?: string;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
  /** Timestamp when the record was last updated (ISO 8601). */
  updatedAt: string;
}

/**
 * Allocation of a payment to a specific invoice.
 */
export interface MerchantPaymentAllocation {
  /** Invoice ID. */
  invoiceId: string;
  /** Invoice number for display. */
  invoiceNumber: string;
  /** Amount allocated to this invoice. */
  amount: number;
}

/**
 * A payment submitted by or on behalf of a merchant.
 */
export interface MerchantPayment {
  /** Unique identifier. */
  id: string;
  /** Payment reference number. */
  paymentNumber: string;
  /** Foreign key to the merchant account. */
  accountId: string;
  /** Merchant account name for display. */
  accountName: string;
  /** Payment amount in USD. */
  amount: number;
  /** Payment method used. */
  method: PaymentMethodType;
  /** Current payment status. */
  status: MerchantPaymentStatus;
  /** Payment date (ISO 8601). */
  paymentDate: string;
  /** Payment method ID used. */
  paymentMethodId?: string;
  /** Allocations to specific invoices. */
  allocations: MerchantPaymentAllocation[];
  /** Bank reference or confirmation number. */
  referenceNumber?: string;
  /** Notes about the payment. */
  notes?: string;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
  /** Timestamp when the record was last updated (ISO 8601). */
  updatedAt: string;
}

/**
 * A saved payment method on a merchant account.
 */
export interface MerchantPaymentMethod {
  /** Unique identifier. */
  id: string;
  /** Foreign key to the merchant account. */
  accountId: string;
  /** Payment method type. */
  type: PaymentMethodType;
  /** Display label (e.g. "Chase ****1234"). */
  label: string;
  /** Whether this is the default method. */
  isDefault: boolean;
  /** Last 4 digits of account/card number. */
  lastFour: string;
  /** Bank name (for ACH/Wire). */
  bankName?: string;
  /** Routing number (for ACH). */
  routingNumber?: string;
  /** Card brand (for Credit/Debit). */
  cardBrand?: string;
  /** Expiration date (for cards, MM/YY format). */
  expirationDate?: string;
  /** ACH verification status. */
  verificationStatus?: ACHVerificationStatus;
  /** Whether the method is active. */
  isActive: boolean;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
}

/**
 * A communication entry on a dispute.
 */
export interface MerchantDisputeCommunication {
  /** Unique identifier. */
  id: string;
  /** Timestamp of the communication (ISO 8601). */
  timestamp: string;
  /** Author of the message. */
  author: string;
  /** Role of the author. */
  authorRole: "Merchant" | "Support" | "System";
  /** Message content. */
  message: string;
  /** Attached file names, if any. */
  attachments?: string[];
}

/**
 * A dispute filed by a merchant against an invoice or charge.
 */
export interface MerchantDispute {
  /** Unique identifier. */
  id: string;
  /** Dispute reference number. */
  disputeNumber: string;
  /** Foreign key to the merchant account. */
  accountId: string;
  /** Merchant account name for display. */
  accountName: string;
  /** Foreign key to the disputed invoice. */
  invoiceId: string;
  /** Invoice number for display. */
  invoiceNumber: string;
  /** Dispute classification. */
  type: MerchantDisputeType;
  /** Current dispute status. */
  status: MerchantDisputeStatus;
  /** Disputed amount in USD. */
  amount: number;
  /** Description of the dispute. */
  description: string;
  /** Resolution description, if resolved. */
  resolution?: string;
  /** Credited amount upon resolution. */
  creditedAmount?: number;
  /** Communication thread. */
  communications: MerchantDisputeCommunication[];
  /** Assigned support agent. */
  assignedTo?: string;
  /** Dispute filed date (ISO 8601). */
  filedDate: string;
  /** Resolution date (ISO 8601). */
  resolvedDate?: string;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
  /** Timestamp when the record was last updated (ISO 8601). */
  updatedAt: string;
}

/**
 * A credit memo issued to a merchant account.
 */
export interface MerchantCreditMemo {
  /** Unique identifier. */
  id: string;
  /** Credit memo reference number. */
  memoNumber: string;
  /** Foreign key to the merchant account. */
  accountId: string;
  /** Merchant account name for display. */
  accountName: string;
  /** Original amount of the credit memo in USD. */
  originalAmount: number;
  /** Remaining available balance in USD. */
  remainingBalance: number;
  /** Credit memo status. */
  status: CreditMemoStatus;
  /** Reason for the credit. */
  reason: string;
  /** Related invoice ID, if any. */
  relatedInvoiceId?: string;
  /** Related invoice number, if any. */
  relatedInvoiceNumber?: string;
  /** Issue date (ISO 8601). */
  issueDate: string;
  /** Expiration date (ISO 8601). */
  expirationDate?: string;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
}

/**
 * A notification for a merchant account.
 */
export interface MerchantNotification {
  /** Unique identifier. */
  id: string;
  /** Foreign key to the merchant account. */
  accountId: string;
  /** Notification type. */
  type: "payment" | "dispute" | "dunning" | "statement" | "account";
  /** Notification title. */
  title: string;
  /** Notification body message. */
  message: string;
  /** Whether the notification has been read. */
  isRead: boolean;
  /** Priority level. */
  priority: "high" | "medium" | "low";
  /** Link to the related entity. */
  link?: string;
  /** Timestamp when created (ISO 8601). */
  createdAt: string;
}

/**
 * A contact person for a merchant account.
 */
export interface MerchantContact {
  /** Unique identifier. */
  id: string;
  /** Foreign key to the merchant account. */
  accountId: string;
  /** Contact full name. */
  name: string;
  /** Contact email. */
  email: string;
  /** Contact phone. */
  phone: string;
  /** Job title. */
  title: string;
  /** Whether this is the primary contact. */
  isPrimary: boolean;
  /** Department. */
  department?: string;
}

// ---------------------------------------------------------------------------
// Collections Interfaces
// ---------------------------------------------------------------------------

/**
 * An AR collection record tracking a customer's overdue position.
 */
export interface CollectionRecord {
  /** Unique identifier. */
  id: string;
  /** Customer ID. */
  customerId: string;
  /** Customer display name. */
  customerName: string;
  /** Collection severity. */
  severity: CollectionSeverity;
  /** Collection status. */
  status: CollectionStatus;
  /** Total outstanding amount in USD. */
  totalOutstanding: number;
  /** Past due amount in USD. */
  pastDueAmount: number;
  /** Days past due (max across invoices). */
  daysPastDue: number;
  /** AR aging bucket. */
  agingBucket: "Current" | "1-30" | "31-60" | "61-90" | "90+";
  /** Number of open invoices. */
  openInvoiceCount: number;
  /** Assigned collector. */
  assignedTo?: string;
  /** Last contact date (ISO 8601). */
  lastContactDate?: string;
  /** Next follow-up date (ISO 8601). */
  nextFollowUpDate?: string;
  /** AI-generated recommendation. */
  recommendation?: string;
  /** Risk score (0-100). */
  riskScore: number;
  /** Active dunning sequence ID, if any. */
  dunningSequenceId?: string;
  /** Active promise-to-pay ID, if any. */
  promiseToPayId?: string;
  /** Notes. */
  notes?: string;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
  /** Timestamp when the record was last updated (ISO 8601). */
  updatedAt: string;
}

/**
 * An activity log entry for a collection record.
 */
export interface CollectionActivity {
  /** Unique identifier. */
  id: string;
  /** Foreign key to the collection record. */
  collectionId: string;
  /** Activity type. */
  type: "call" | "email" | "note" | "status_change" | "payment" | "dispute" | "escalation";
  /** Description of the activity. */
  description: string;
  /** Actor who performed the activity. */
  actor: string;
  /** Timestamp (ISO 8601). */
  timestamp: string;
}

/**
 * Contact person for a customer (used in Customer360).
 */
export interface CustomerContact {
  /** Contact full name. */
  name: string;
  /** Contact email. */
  email: string;
  /** Contact phone. */
  phone: string;
  /** Job title. */
  title: string;
  /** Whether this is the primary contact. */
  isPrimary: boolean;
}

/**
 * A comprehensive 360-degree view of a customer's financial relationship.
 */
export interface Customer360 {
  /** Customer ID. */
  customerId: string;
  /** Customer display name. */
  customerName: string;
  /** Industry. */
  industry: string;
  /** Customer segment/tier. */
  segment: string;
  /** Credit score (0-100). */
  creditScore: number;
  /** Credit limit in USD. */
  creditLimit: number;
  /** Total outstanding in USD. */
  totalOutstanding: number;
  /** Total past due in USD. */
  totalPastDue: number;
  /** Average days to pay. */
  avgDaysToPay: number;
  /** Days Sales Outstanding. */
  dso: number;
  /** Payment terms. */
  paymentTerms: string;
  /** AR aging breakdown in USD. */
  agingBreakdown: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
  };
  /** Payment history (last 12 months). */
  paymentHistory: Array<{
    month: string;
    amountPaid: number;
    onTime: boolean;
  }>;
  /** Open disputes count. */
  openDisputeCount: number;
  /** Total dispute amount. */
  totalDisputeAmount: number;
  /** Contacts. */
  contacts: CustomerContact[];
  /** Last payment date (ISO 8601). */
  lastPaymentDate?: string;
  /** Last payment amount. */
  lastPaymentAmount?: number;
  /** Risk flag. */
  riskFlag: "Low" | "Medium" | "High" | "Critical";
  /** Notes. */
  notes?: string;
}

/**
 * A step configuration within a dunning sequence.
 */
export interface DunningStepConfig {
  /** Step number (1-indexed). */
  stepNumber: number;
  /** Step name. */
  name: DunningStep;
  /** Days after due date to trigger this step. */
  daysAfterDue: number;
  /** Template ID to use. */
  templateId: string;
  /** Channel to send the communication. */
  channel: CorrespondenceChannel;
  /** Whether this step has been completed. */
  completed: boolean;
  /** Date step was executed (ISO 8601), if completed. */
  executedDate?: string;
}

/**
 * An active dunning sequence tracking automated collections outreach.
 */
export interface DunningSequence {
  /** Unique identifier. */
  id: string;
  /** Customer ID. */
  customerId: string;
  /** Customer display name. */
  customerName: string;
  /** Current step in the sequence. */
  currentStep: DunningStep;
  /** Current step number (1-indexed). */
  currentStepNumber: number;
  /** Total steps in the sequence. */
  totalSteps: number;
  /** Dunning sequence status. */
  status: DunningStatus;
  /** Total amount being dunned in USD. */
  totalAmount: number;
  /** Invoice IDs included in this sequence. */
  invoiceIds: string[];
  /** Step configurations. */
  steps: DunningStepConfig[];
  /** Date sequence was started (ISO 8601). */
  startDate: string;
  /** Next scheduled action date (ISO 8601). */
  nextActionDate?: string;
  /** Pause reason, if paused. */
  pauseReason?: string;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
  /** Timestamp when the record was last updated (ISO 8601). */
  updatedAt: string;
}

/**
 * A dunning email template.
 */
export interface DunningTemplate {
  /** Unique identifier. */
  id: string;
  /** Template name. */
  name: string;
  /** Template subject line. */
  subject: string;
  /** Template body (with merge field placeholders). */
  body: string;
  /** Dunning step this template is designed for. */
  step: DunningStep;
  /** Tone of the template. */
  tone: "Friendly" | "Firm" | "Urgent" | "Final";
  /** Whether the template is active. */
  isActive: boolean;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
}

/**
 * A promise-to-pay record from a customer.
 */
export interface PromiseToPay {
  /** Unique identifier. */
  id: string;
  /** Customer ID. */
  customerId: string;
  /** Customer display name. */
  customerName: string;
  /** Promised amount in USD. */
  promisedAmount: number;
  /** Promised payment date (ISO 8601). */
  promisedDate: string;
  /** Current status. */
  status: PromiseStatus;
  /** Payment method promised. */
  paymentMethod?: PaymentMethodType;
  /** Invoice IDs covered by this promise. */
  invoiceIds: string[];
  /** Amount actually received, if any. */
  receivedAmount?: number;
  /** Date payment was received (ISO 8601). */
  receivedDate?: string;
  /** Notes from the conversation. */
  notes?: string;
  /** Who captured this promise. */
  capturedBy: string;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
  /** Timestamp when the record was last updated (ISO 8601). */
  updatedAt: string;
}

/**
 * A correspondence entry logging outreach to a customer.
 */
export interface Correspondence {
  /** Unique identifier. */
  id: string;
  /** Customer ID. */
  customerId: string;
  /** Customer display name. */
  customerName: string;
  /** Correspondence type. */
  type: CorrespondenceType;
  /** Communication channel. */
  channel: CorrespondenceChannel;
  /** Subject line (for emails/letters). */
  subject?: string;
  /** Content or summary of the correspondence. */
  content: string;
  /** Direction of the correspondence. */
  direction: "Outbound" | "Inbound";
  /** Duration in minutes (for phone calls). */
  durationMinutes?: number;
  /** Contact person name. */
  contactPerson?: string;
  /** Outcome or result of the correspondence. */
  outcome?: string;
  /** Related dunning sequence ID. */
  dunningSequenceId?: string;
  /** Related collection record ID. */
  collectionId?: string;
  /** Who sent/logged the correspondence. */
  sentBy: string;
  /** Timestamp when sent/logged (ISO 8601). */
  sentAt: string;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
}
