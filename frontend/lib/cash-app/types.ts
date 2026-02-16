export type PaymentStatus =
  | "New"
  | "AutoMatched"
  | "Exception"
  | "SettlementPending"
  | "PendingToPost"
  | "Posted"
  | "Reconciled"
  | "Void"
  | "Failed"
  | "NonAR";

export type ExceptionType =
  | "MissingRemittance"
  | "ShortPay"
  | "OverPay"
  | "DuplicateSuspected"
  | "MultiEntity"
  | "SettlementFailed"
  | "AmbiguousMatch"
  | "InvalidRef"
  | "NeedsJE"
  | null;

export type ExceptionCoreType =
  | "MISSING_REMIT"
  | "AMOUNT_ISSUE"
  | "DUPLICATE"
  | "INVOICE_ISSUE"
  | "CREDIT_ISSUE"
  | "INTERCOMPANY"
  | "SETTLEMENT"
  | "JE_NEEDED";

export type ExceptionReasonCode =
  | "MISSING_REMIT"
  | "SHORT_PAY"
  | "OVER_PAY"
  | "AMOUNT_MISMATCH"
  | "DUPLICATE_SUSPECTED"
  | "DUPLICATE_CONFIRMED"
  | "DUPLICATE_DISMISSED"
  | "INVOICE_NOT_FOUND"
  | "INVOICE_CLOSED"
  | "INVOICE_PAID"
  | "INVALID_INVOICE"
  | "INVALID_REFERENCE"
  | "AMBIGUOUS_MATCH"
  | "INVALID_CM"
  | "CM_NOT_FOUND"
  | "CM_ALREADY_APPLIED"
  | "MULTI_ENTITY"
  | "IC_SPLIT_REQUIRED"
  | "SETTLEMENT_PENDING"
  | "SETTLEMENT_FAILED"
  | "BANK_RETURN"
  | "ACH_FAILED"
  | "BAD_DEBT_RECOVERY"
  | "TEST_DEPOSIT"
  | "UNAPPLIED_CASH"
  | "MANUAL_JE_REQUIRED"
  | "REMIT_PARSE_ERROR";

export type ExceptionResolutionState = "OPEN" | "RESOLVED" | "REJECTED";
export type SettlementState = "NONE" | "PENDING" | "FAILED" | "CONFIRMED";
export type InvoiceStatusFlag = "NOT_FOUND" | "CLOSED" | "PAID" | "INVALID";
export type CreditMemoStatusFlag = "INVALID_CM" | "CM_APPLIED" | "CM_NOT_FOUND";

export type RemittanceSource = "Email" | "Bank Portal" | "EDI" | "API" | "Manual Upload" | "None";

export type RemittanceExtractStatus = "NOT_EXTRACTED" | "EXTRACTED" | "PARTIAL" | "FAILED";

export type RemittanceLinkStatus = "LINKED" | "UNLINKED" | "MULTI_MATCH";

export type RemittanceValidationStatus = "PASS" | "WARN" | "FAIL";

export type MailboxProvider = "Google" | "O365" | "IMAP";

export interface MailboxConfig {
  id: string;
  address: string;
  displayName: string;
  provider: MailboxProvider;
  enabled: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type IngestionSourceType = "Mailbox";
export type IngestionStatus = "Success" | "Partial" | "Failed";

export interface IngestionRun {
  id: string;
  sourceType: IngestionSourceType;
  sourceId: string;
  startedAt: string;
  finishedAt: string;
  status: IngestionStatus;
  rawItemsPulled: number;
  itemsParsed: number;
  itemsFailed: number;
  errorSummary: string[];
  createdAt: string;
}

export type ParseStatus = "Unparsed" | "Parsed" | "Partial" | "Failed";

export type EmailMailbox = "AR.REMIT" | "AR" | "OTHER";
export type EmailStatus = "NEW" | "EXTRACTED" | "PARTIAL" | "FAILED" | "PROCESSED";

export interface EmailAttachment {
  id: string;
  name: string;
  type: "PDF" | "XLS" | "CSV" | "OTHER";
}

export interface EmailExtraction {
  payer: string;
  customer?: string;
  amount_total: number;
  currency: string;
  payment_date?: string;
  invoice_numbers: string[];
  confidence_overall: number;
  confidence_sections: {
    header: number;
    invoices: number;
    amounts: number;
  };
  errors?: string[];
}

export interface RawEmailMessage {
  id: string;
  mailboxId: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  receivedAt: string;
  bodyText: string;
  attachmentIds: string[];
  parseStatus: ParseStatus;
  parserConfidence: number;
  errorReason?: string;
  candidateCustomerName?: string;
  candidateCustomerNumber?: string;
  linkedRemittanceId?: string;
  mailbox: EmailMailbox;
  status: EmailStatus;
  labels: string[];
  assigned_to?: string;
  attachments: EmailAttachment[];
  extraction?: EmailExtraction;
  linked_payment_id?: string;
  activity_timeline: ActivityTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RawAttachment {
  id: string;
  emailId: string;
  fileName: string;
  fileType: "PDF" | "CSV" | "XLSX" | "TXT";
  fileSizeKb: number;
  downloadUrl: string;
  parseStatus: ParseStatus;
  parserConfidence: number;
  errorReason?: string;
  extractedInvoiceRefs?: string[];
  createdAt: string;
}

export type PaymentMethod = "ACH" | "Wire" | "Check" | "Credit Card" | "Other";

export type ProcessingCategory = "AUTO" | "MANUAL" | "NON_AR";
export type ManualReason = "MATCH_EDITED" | "JE_CREATED" | "EMAIL_SENT" | "ON_ACCOUNT" | "OTHER";
export type PostedStatus = "NOT_POSTED" | "POSTED" | "POST_FAILED";
export type SettlementLedgerStatus = "PRELIM" | "FINAL_CONFIRMED" | "FAILED";
export type BankMatchStatus = "READY" | "RISK" | "PENDING";

export type BankFeedProvider = "JPMorgan";
export type BankFeedMode = "PrelimFinal";
export type BankFeedStatus = "Success" | "Partial" | "Failed";
export type BankFeedType = "Preliminary" | "Final";
export type BankTransactionDirection = "Credit" | "Debit";
export type BankTransactionStatus = "Observed" | "LinkedToPayment" | "Reconciled";
export type LockboxItemStatus = "Captured" | "Applied" | "Exception";
export type SettlementStatus = "Pending" | "Final" | "Failed";
export type SettlementReason =
  | "AwaitingFinalFeed"
  | "FinalNotFound"
  | "Reversed"
  | "AmountMismatch";

export interface BankFeedConfig {
  id: string;
  provider: BankFeedProvider;
  accountId: string;
  accountName: string;
  currency: string;
  enabled: boolean;
  mode: BankFeedMode;
  createdAt: string;
  updatedAt: string;
}

export interface BankFeedRun {
  id: string;
  bankFeedId: string;
  feedType: BankFeedType;
  statementDate: string;
  startedAt: string;
  finishedAt: string;
  status: BankFeedStatus;
  transactionsPulled: number;
  transactionsCreated: number;
  transactionsUpdated: number;
  errorSummary: string[];
}

export interface BankTransaction {
  id: string;
  bankFeedId: string;
  feedType: BankFeedType;
  statementDate: string;
  transactionDate: string;
  amount: number;
  direction: BankTransactionDirection;
  method: "ACH" | "Wire" | "EFT" | "Check" | "Lockbox";
  bankReference: string;
  payerRaw: string;
  memoRaw: string;
  checkNumber?: string;
  lockboxBatchId?: string;
  status: BankTransactionStatus;
  linkedPaymentId?: string;
  createdAt: string;
}

export interface LockboxItem {
  id: string;
  bankTransactionId: string;
  checkNumber: string;
  checkAmount: number;
  payerNameRaw: string;
  imageUrl?: string;
  micrRaw?: string;
  status: LockboxItemStatus;
  createdAt: string;
}

export interface SettlementEvent {
  id: string;
  paymentId: string;
  bankReference: string;
  prelimTransactionId?: string;
  finalTransactionId?: string;
  settlementStatus: SettlementStatus;
  reason: SettlementReason;
  firstSeenAt: string;
  lastCheckedAt: string;
  ageHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransformedLine {
  id: string;
  erpReference: string;
  referenceField: string;
  discountAmount: number;
  paymentAmount: number;
  reasonCode: string;
  reasonDescription: string;
  customerNumber: string;
  subsidiary?: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

export interface ActivityTimelineEntry {
  event: string;
  detail?: string;
  actor: "System" | "User";
  ts: string;
}

export type MatchSignalType =
  | "InvoiceRef"
  | "AmountExact"
  | "RemittanceLink"
  | "PayerAlias"
  | "CustomerMap"
  | "CMComposite";

export interface MatchSignal {
  type: MatchSignalType;
  value: string;
  weight: number;
}

export interface MatchExplanation {
  summary: string;
  signals: MatchSignal[];
  sanitizedTokens: string[];
  confidence: number;
}

export interface MatchCandidate {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  score: number;
}

export interface PaymentPostingRefs {
  nsCustomerId?: string;
  nsCustomerNumber?: string;
  nsPaymentId?: string;
  nsPaymentTranId?: string;
  nsDepositId?: string;
  nsJeId?: string;
  nsExternalId?: string;
  postedAt?: string;
  postRunId?: string;
  postStatus?: "NotPosted" | "Ready" | "Posted" | "PostFailed";
  postError?: string;
}

export interface PostRunArtifact {
  id: string;
  type: "CSV" | "JSON";
  filename: string;
  url: string;
  createdAt: string;
}

export interface PostRun {
  id: string;
  createdAt: string;
  startedAt: string;
  completedAt: string;
  source: "PaymentBatch" | "BulkPost";
  status: "Success" | "Partial" | "Failed";
  bankAccount: string;
  totalPayments: number;
  postedPayments: number;
  failedPayments: number;
  paymentNumbers: string[];
  exportArtifacts: PostRunArtifact[];
  errorSummary?: string;
  notes?: string;
}

export interface MatchBankDataExportRow {
  bankTranId: string;
  bankAccount: string;
  bankAmount: number;
  bankDate: string;
  paymentNumber: string;
  nsPaymentId: string;
  nsDepositId: string;
  nsTranId: string;
  meeruMatchKey: string;
  memoReference: string;
  customerNumber: string;
  customerName: string;
}

export interface MatchBankDataExport {
  id: string;
  createdAt: string;
  postRunId: string;
  rows: MatchBankDataExportRow[];
}

export interface DraftAllocation {
  invoiceId: string;
  allocatedAmount: number;
  remainingAmount: number;
  note?: string;
}

export interface IntercompanyJEDraft {
  jeId: string;
  type: string;
  status: string;
  entities: string[];
  lines: {
    entity: string;
    description: string;
    debit: number;
    credit: number;
  }[];
}

export type MatchType = "EXACT" | "TOLERANCE" | "INTERCOMPANY";

export type EvidenceSource = "Bank" | "NetSuite" | "Remit" | "System";

export interface EvidenceItem {
  text: string;
  source: EvidenceSource;
  artifact_ref?: string;
}

export interface ArtifactLinks {
  bank_line_url?: string;
  remittance_url?: string;
  invoice_set_url?: string;
  je_draft_url?: string;
  netsuite_post_url?: string;
}

export interface PaymentExplainability {
  primary_reason_code: string;
  primary_reason_label: string;
  reason_codes: string[];
  evidence_items: EvidenceItem[];
  artifact_links: ArtifactLinks;
}

export interface TimelineEventEnriched {
  ts: string;
  title: string;
  actor: string;
  reason_label?: string;
  confidence_delta?: number;
  artifact_ref?: string;
  details?: string;
}

export interface PaymentRouting {
  routing_stream: "AutoMatched" | "Exceptions" | "Critical" | "PendingToPost";
  routing_subfilter: string | null;
  routing_rules_applied: string[];
}

export type JEWorkflowState =
  | "NONE"
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVAL_PENDING"
  | "POSTED"
  | "REJECTED";
export type JEFlowState =
  | "NOT_STARTED"
  | "TYPE_SELECTED"
  | "DRAFTED"
  | "SUBMITTED"
  | "APPROVED"
  | "POSTED";
export type JEStatus = "NONE" | "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "POSTED" | "REJECTED";

export type AllocationState = "DRAFT" | "CONFIRMED";
export type PendingPostState =
  | "READY"
  | "APPROVAL_NEEDED"
  | "JE_APPROVAL_PENDING"
  | "SYNC_PENDING"
  | "FAILED";
export type PaymentApprovalState = "APPROVED" | "NEEDS_APPROVAL";

export interface MatchAllocation {
  invoice_id: string;
  invoice_number: string;
  entity: string;
  allocated_amount: number;
}

export interface MatchResult {
  payment_id: string;
  allocations: MatchAllocation[];
  remainder_amount: number;
  remainder_mode: "NONE" | "ON_ACCOUNT" | "ADJUSTMENT" | "CREDIT_MEMO";
  adjustment_type?: "DISCOUNT" | "SHORT_PAY" | "FX_DIFFERENCE" | "BANK_FEE";
  confidence_after_manual: number;
  multi_entity: boolean;
  je_required: boolean;
}

export interface JEDraftLine {
  account: string;
  debit: number;
  credit: number;
  memo?: string;
  dimensions?: {
    department?: string;
    class?: string;
    location?: string;
  };
}

export interface JEDraft {
  header: {
    subsidiary: string;
    currency: string;
    memo: string;
    posting_date: string;
  };
  lines: JEDraftLine[];
}

export interface JEDraftRecordLine {
  id: string;
  drCr: "DR" | "CR";
  gl_account: string;
  gl_name: string;
  amount: number;
  memo: string;
}

export interface JEDraftRecord {
  je_id: string;
  je_type_code: string;
  entity: string;
  currency: string;
  lines: JEDraftRecordLine[];
  evidence_required: boolean;
  evidence_attached: boolean;
  evidence_files?: string[];
  approval_required: boolean;
  status: JEStatus;
}

export interface JEDraftTemplateLine {
  dc: "DR" | "CR";
  gl_account_id: string;
  gl_account_label: string;
  amount: number;
  memo: string;
}

export interface JEDraftTemplateRecord {
  template_code: string;
  template_label: string;
  requires_approval: boolean;
  requires_evidence: boolean;
  lines: JEDraftTemplateLine[];
  evidence_attached: boolean;
  evidence_files?: string[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  paymentHeaderId: string;
  amount: number;
  date: string;
  bankAccount: string;
  method: PaymentMethod;
  payerNameRaw: string;
  memoReferenceRaw: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  identificationCriteria: string;
  remittanceSource: RemittanceSource;
  remittance_status?: string;
  originalPaymentFileUrl: string;
  linkedRemittanceFileUrl?: string;
  status: PaymentStatus;
  exceptionType: ExceptionType;
  confidenceScore: number;
  transformedLines: TransformedLine[];
  activityLog: ActivityLogEntry[];
  assignedTo?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  bankFeedId?: string;
  bankReference?: string;
  settlementStatus?: SettlementStatus;
  settlementEventId?: string;
  settlementFirstSeenAt?: string;
  settlementLastCheckedAt?: string;
  settlementReason?: SettlementReason;
  lockboxBatchId?: string;
  checkNumber?: string;
  postingHoldReasons?: string[];
  matchVersion?: string;
  matchExplanation?: MatchExplanation;
  candidateMatches?: MatchCandidate[];
  autoMatchEligible?: boolean;
  autoMatchedAt?: string;
  postingRefs?: PaymentPostingRefs;
  bankTranId?: string;
  meeruMatchKey?: string;
  engineMeta?: {
    engineRunId: string;
    mode: "AutoMatch" | "Sanitization" | "Composite";
    matchedBy: ("RemittanceRefs" | "InvoiceToken" | "AmountExact" | "CompositeCM")[];
    sanitizedTokens?: string[];
    candidateInvoiceIds?: string[];
    candidateCreditMemoIds?: string[];
    explain: string;
  };
  suggestedAction?: string;
  aiRecommendation?: string;
  aiRationale?: string;
  warnings?: string[];
  draftAllocation?: DraftAllocation;
  intercompanyJEDraft?: IntercompanyJEDraft;
  match_type?: MatchType;
  tolerance_applied?: boolean;
  intercompany_flag?: boolean;
  je_required?: boolean;
  work_status?: PaymentStatus;
  explainability?: PaymentExplainability;
  timeline?: TimelineEventEnriched[];
  routing?: PaymentRouting;
  exception_core_type?: ExceptionCoreType | null;
  exception_reason_code?: ExceptionReasonCode | string | null;
  exception_reason_label?: string | null;
  exception_resolution_state?: ExceptionResolutionState;
  settlement_state?: SettlementState;
  ach_return_flag?: boolean;
  parse_error_flag?: boolean;
  on_account_flag?: boolean;
  je_required_flag?: boolean;
  invoice_status_flag?: InvoiceStatusFlag;
  credit_memo_status_flag?: CreditMemoStatusFlag;
  je_workflow_state?: JEWorkflowState;
  je_type?: string | null;
  je_type_code?: string | null;
  je_type_label?: string | null;
  je_flow_state?: JEFlowState;
  je_status?: JEStatus;
  je_draft?: JEDraft | JEDraftRecord | JEDraftTemplateRecord | null;
  activity_timeline?: ActivityTimelineEntry[];
  match_result?: MatchResult | null;
  allocation_state?: AllocationState;
  pending_post_state?: PendingPostState;
  approval_state?: PaymentApprovalState;
  linked_invoice_ref?: string;
  linked_invoice_status?: string;
  processing_category?: ProcessingCategory;
  manual_reason?: ManualReason | null;
  received_at?: string;
  posted_status?: PostedStatus;
  posted_at?: string | null;
  settlement_status?: SettlementLedgerStatus | null;
  sla_age_hours?: number | null;
  assigned_to?: string;
  bank_txn_ref?: string | null;
  bank_account_token?: string | null;
  clearing_gl?: string | null;
  bank_match_ready?: boolean;
  bank_match_status?: BankMatchStatus;
  bank_match_risk_reason?: string | null;
}

export type BankLineStatus = "LINKED_POSTED" | "LINKED_NOT_POSTED" | "UNLINKED" | "RISK";

export interface BankLine {
  bank_line_id: string;
  bank_date: string;
  amount: number;
  bank_txn_ref: string;
  bank_account_token: string;
  linked_payment_id?: string | null;
  status: BankLineStatus;
}

export type BatchStatus = "DRAFT" | "READY" | "POSTING" | "POSTED" | "PARTIAL" | "FAILED";
export type BatchLineWorkstream = "AUTO_MATCHED" | "INTERCOMPANY" | "JE_REQUIRED" | "EXCEPTION";
export type BatchLineReadyState = "READY" | "BLOCKED" | "FAILED" | "POSTED";
export type BatchLineBlockedReason =
  | "JE_APPROVAL"
  | "SYNC_PENDING"
  | "DIMENSIONS_MISSING"
  | "EVIDENCE_REQUIRED"
  | "PERIOD_LOCKED";
export type NetSuitePostStatus = "NOT_STARTED" | "SUCCESS" | "ERROR";
export type NetSuiteSyncHealth = "Healthy" | "Degraded" | "Down";

export interface NetSuitePostResult {
  status: NetSuitePostStatus;
  netsuite_payment_id?: string | null;
  netsuite_je_id?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  last_attempt_ts?: string | null;
}

export interface BatchLineItem {
  payment_id: string;
  payer_name: string;
  customer_name: string;
  amount: number;
  workstream: BatchLineWorkstream;
  ready_state: BatchLineReadyState;
  blocked_reason?: BatchLineBlockedReason;
  netsuite_post_result: NetSuitePostResult;
}

export interface BatchAuditEvent {
  event: string;
  detail: string;
  actor: string;
  ts: string;
}

export interface PaymentBatch {
  batch_id: string;
  status: BatchStatus;
  posting_date: string;
  created_at: string;
  created_by: string;
  posted_at?: string | null;
  posted_by?: string | null;
  bank_account?: string;
  bank_accounts?: string[];
  entity: string;
  currency: string;
  total_payments: number;
  total_amount: number;
  netsuite_sync_health: NetSuiteSyncHealth;
  ready_count: number;
  blocked_count: number;
  failed_count: number;
  line_items: BatchLineItem[];
  audit_timeline: BatchAuditEvent[];
}

export interface Remittance {
  id: string;
  remittanceNumber: string;
  remittanceHeaderId?: string;
  source: RemittanceSource;
  receivedDate: string;
  effectiveDate?: string;
  customerName: string;
  customerId: string;
  customerNumber?: string;
  totalAmount: number;
  remittanceAmount?: number;
  status: string;
  emailSubject?: string;
  subject?: string;
  emailIdentifier?: string;
  // attachments?: string[];
  extractedReferences?: { invoice: string; amount: number }[];
  extractedReferencesDetailed?: {
    invoiceNumber: string;
    amount: number;
    discountAmount?: number;
    reasonCode?: string;
  }[];
  linkStatus?: string;
  inputFileUrl?: string;
  exceptionDetails?: string;
  parserConfidence?: number;
  extract_status?: RemittanceExtractStatus;
  link_status?: RemittanceLinkStatus;
  confidence_score?: number | null;
  key_reference?: string;
  invoices_found_count?: number;
  extract_reason?: string;
  link_reason?: string;
  linked_payment_id?: string | null;
  email_metadata?: {
    from: string;
    to: string;
    subject: string;
    received_ts: string;
    body: string;
  };
  attachments?: Array<{
    name: string;
    type: string;
    size: string;
    url?: string;
  }>;
  extracted_fields?: {
    customer: string;
    payment_date: string;
    amount: number;
    currency: string;
    reference: string;
    method: string;
  };
  extracted_line_items?: Array<{
    invoice_number: string;
    invoice_amount: number;
    paid_amount: number;
    discount: number;
    credit_memo_ref?: string;
    notes?: string;
  }>;
  validation_checks?: Array<{
    status: RemittanceValidationStatus;
    label: string;
    detail?: string;
  }>;
  activity_log?: Array<{
    event: string;
    actor: string;
    ts: string;
    detail?: string;
  }>;
  createdAt: string;
}

export interface RemittanceRecord {
  remittance_id: string;
  email_id: string;
  linked_payment_id?: string;
  extracted_fields: EmailExtraction;
  created_at: string;
}

export interface ARItem {
  id: string;
  type?: "Invoice" | "CreditMemo";
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: string;
  subsidiary?: string;
  businessUnit?: string;
  currency?: string;
  createdAt: string;
}

export interface CashAppStats {
  autoMatched: number;
  exceptions: number;
  critical: number;
  pendingToPost: number;
  settlementPending: number;
  missingRemittance: number;
  overPay: number;
  duplicateSuspected: number;
  multiEntity: number;
  highValue: number;
  invoiceIssue: number;
  amountMismatch: number;
  jeRequired: number;
  remittanceParseError: number;
  unappliedOnAccount: number;
  achFailure: number;
  slaBreach: number;
  netSuiteSyncRisk: number;
  settlementRisk: number;
  customerEscalation: number;
  postingBlocked: number;
  readyToPost: number;
  approvalNeeded: number;
  jeApprovalPending: number;
  syncPending: number;
  postingFailed: number;
  bankMatchPending: number;
}

export type SyncEntityType = "Invoices" | "CreditMemos" | "Payments" | "Customers";
export type SyncStatus = "Success" | "Partial" | "Failed";

export interface SyncRun {
  id: string;
  source: "NetSuite";
  entityType: SyncEntityType;
  watermarkFrom?: string;
  watermarkTo?: string;
  startedAt: string;
  finishedAt?: string;
  status: SyncStatus;
  recordsFetched: number;
  recordsUpserted: number;
  errorsCount: number;
  errorSummary?: string[];
}

export interface DataFreshness {
  entityType: SyncEntityType;
  lastSuccessfulSyncAt?: string;
  ageMinutes?: number;
}

export type IntegrityGuardState = "Healthy" | "Degraded" | "BlockPosting";
export type IntegrityGuardReasonCode =
  | "InvoicesStale"
  | "PaymentsStale"
  | "CustomerMasterStale"
  | "PartialSyncDetected"
  | "FailedSyncDetected";

export interface IntegrityGuardReason {
  code: IntegrityGuardReasonCode;
  message: string;
  entityType?: SyncEntityType;
  lastSuccessfulSyncAt?: string;
  ageMinutes?: number;
}

export interface IntegrityGuard {
  overallState: IntegrityGuardState;
  reasons: IntegrityGuardReason[];
  computedAt: string;
}

export interface CashAppDataHealth {
  syncRuns: SyncRun[];
  freshness: DataFreshness[];
  guard: IntegrityGuard;
}

export type Workstream = "AutoMatched" | "Exception" | "Critical" | "PendingToPost";
export type MatchTypeEnum = "EXACT" | "TOLERANCE" | "OUTSIDE";
export type ParseStatusEnum = "Success" | "Failed" | "Partial" | "None";

export interface TolerancePolicy {
  amount?: number;
  percent?: number;
  label: string;
}

export interface BankEvidence {
  bankAccount: string;
  currency: string;
  amount: number;
  paymentDate: string;
  payerName: string;
  memo?: string;
  reference?: string;
  traceId?: string;
}

export interface ParsedInvoice {
  invoiceNumber: string;
  amount: number;
}

export interface RemittanceEvidenceData {
  source: "Email" | "Portal" | "API" | "Upload" | "None";
  parsedInvoices?: ParsedInvoice[];
  parseStatus: ParseStatusEnum;
  filename?: string;
}

export interface InvoiceWarning {
  invoiceNumber: string;
  warning: string;
}

export interface NetSuiteEvidenceData {
  entities: string[];
  customerIds: string[];
  invoiceWarnings?: InvoiceWarning[];
}

export interface MatchSignals {
  invoiceRefsFound: boolean;
  remittanceLinked: boolean;
  amountAligns: boolean;
  toleranceApplied: boolean;
  multiEntityInvoices: boolean;
  jeRequired: boolean;
  closedInvoicePresent: boolean;
}

export interface MatchingContext {
  workstream: Workstream;
  match_type: MatchTypeEnum;
  confidence_score: number;
  tolerance_policy?: TolerancePolicy;
  signals: MatchSignals;
  reasons: string[];
  multi_entity: boolean;
  evidence: {
    bank: BankEvidence;
    remittance: RemittanceEvidenceData;
    netsuite: NetSuiteEvidenceData;
  };
}

export interface EnhancedARItem extends ARItem {
  entity?: string;
  openAmount?: number;
  is_from_remittance_candidate?: boolean;
  match_hint_score?: number;
}
