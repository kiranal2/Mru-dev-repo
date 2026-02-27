/**
 * @module filters
 * @description Type definitions for filter parameters used by data hooks
 * and the data service layer. Every domain-specific filter interface extends
 * {@link BaseFilters} so pagination, sorting, and free-text search are
 * available uniformly across all list endpoints.
 */

/**
 * Pagination parameters for list queries.
 */
export interface PaginationParams {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
}

/**
 * Sort parameters for list queries.
 */
export interface SortParams {
  /** Column key to sort by */
  sortBy: string;
  /** Sort direction */
  sortOrder: "asc" | "desc";
}

/**
 * Base filter interface that all domain-specific filters extend.
 * Provides optional pagination, sorting, and free-text search.
 */
export interface BaseFilters extends Partial<PaginationParams>, Partial<SortParams> {
  /** Free-text search query applied across searchable fields */
  search?: string;
}

/**
 * Filters for querying IGRS (Inspector General of Registration & Stamps) cases.
 */
export interface IGRSCaseFilters extends BaseFilters {
  /** Filter by one or more case statuses */
  status?: string[];
  /** Filter by one or more risk levels */
  riskLevel?: string[];
  /** Filter by detected signal types */
  signals?: string[];
  /** Filter by registration office */
  office?: string[];
  /** Filter by district */
  district?: string[];
  /** Start of the date range (ISO-8601) */
  dateFrom?: string;
  /** End of the date range (ISO-8601) */
  dateTo?: string;
  /** Filter by assigned analyst identifier */
  assignedTo?: string;
  /** Minimum gap value for gap-based filtering */
  minGap?: number;
  /** Maximum gap value for gap-based filtering */
  maxGap?: number;
}

/**
 * Filters for querying revenue leakage cases.
 */
export interface RevenueCaseFilters extends BaseFilters {
  /** Filter by one or more case statuses */
  status?: string[];
  /** Filter by one or more risk levels */
  riskLevel?: string[];
  /** Filter by revenue leakage category */
  category?: string[];
  /** Filter by specific customer identifier */
  customerId?: string;
  /** Filter by one or more customer tiers */
  customerTier?: string[];
  /** Filter by assigned analyst identifier */
  assignedTo?: string;
  /** Filter by assigned team identifier */
  assignedTeam?: string;
  /** Start of the date range (ISO-8601) */
  dateFrom?: string;
  /** End of the date range (ISO-8601) */
  dateTo?: string;
  /** Minimum transaction amount */
  minAmount?: number;
  /** Maximum transaction amount */
  maxAmount?: number;
  /** Filter for recurring revenue issues only */
  recurrence?: boolean;
}

/**
 * Filters for querying payment records in the cash management module.
 */
export interface PaymentFilters extends BaseFilters {
  /** Filter by one or more payment statuses */
  status?: string[];
  /** Filter by payment method (e.g. "wire", "ach", "check") */
  method?: string[];
  /** Filter by one or more exception types */
  exceptionType?: string[];
  /** Filter by customer name (partial match) */
  customerName?: string;
  /** Start of the date range (ISO-8601) */
  dateFrom?: string;
  /** End of the date range (ISO-8601) */
  dateTo?: string;
  /** Minimum payment amount */
  minAmount?: number;
  /** Maximum payment amount */
  maxAmount?: number;
  /** Filter by bank account identifier */
  bankAccount?: string;
}

/**
 * Filters for querying remittance records.
 */
export interface RemittanceFilters extends BaseFilters {
  /** Filter by one or more remittance sources */
  source?: string[];
  /** Filter by one or more remittance statuses */
  status?: string[];
  /** Filter by customer name (partial match) */
  customerName?: string;
  /** Start of the date range (ISO-8601) */
  dateFrom?: string;
  /** End of the date range (ISO-8601) */
  dateTo?: string;
}

/**
 * Filters for querying exception records.
 */
export interface ExceptionFilters extends BaseFilters {
  /** Filter by one or more exception types */
  exceptionType?: string[];
  /** Filter by one or more exception statuses */
  status?: string[];
  /** Filter by assigned analyst identifier */
  assignedTo?: string;
  /** Start of the date range (ISO-8601) */
  dateFrom?: string;
  /** End of the date range (ISO-8601) */
  dateTo?: string;
}

/**
 * Filters for querying reconciliation records.
 */
export interface ReconFilters extends BaseFilters {
  /** Filter by one or more reconciliation types */
  type?: string[];
  /** Filter by one or more reconciliation statuses */
  status?: string[];
  /** Filter by assigned analyst identifier */
  assignedTo?: string;
}

/**
 * Filters for querying close tasks in the financial close module.
 */
export interface CloseTaskFilters extends BaseFilters {
  /** Filter by one or more close phases */
  phase?: string[];
  /** Filter by one or more task statuses */
  status?: string[];
  /** Filter by one or more priority levels */
  priority?: string[];
  /** Filter by assigned analyst identifier */
  assignedTo?: string;
  /** Filter by subsidiary name or identifier */
  subsidiary?: string;
}

/**
 * Filters for querying MRP signals (supply chain exceptions).
 */
export interface MrpSignalFilters extends BaseFilters {
  /** Filter by one or more signal statuses */
  status?: string[];
  /** Filter by one or more severity levels */
  severities?: ("HIGH" | "MEDIUM" | "LOW")[];
  /** Filter by one or more supplier identifiers */
  supplierIds?: string[];
  /** Quick view filter key (e.g. "NEW", "MONITORING", "COMPLETED", or "STATUS:TYPE") */
  quickView?: string;
  /** Filter by one or more exception types */
  exceptionTypes?: string[];
  /** AI confidence range filters */
  aiConfidenceRanges?: { min: number; max: number }[];
  /** Sort configuration */
  sort?: { field: string; direction: "asc" | "desc" };
}

/**
 * Filters for querying audit log entries.
 */
export interface AuditFilters extends BaseFilters {
  /** Filter by one or more audit categories */
  category?: string[];
  /** Filter by one or more modules */
  module?: string[];
  /** Filter by actor name or identifier */
  actor?: string;
  /** Start of the date range (ISO-8601) */
  dateFrom?: string;
  /** End of the date range (ISO-8601) */
  dateTo?: string;
}

/**
 * Filters for querying merchant invoices.
 */
export interface MerchantInvoiceFilters extends BaseFilters {
  /** Filter by one or more invoice statuses */
  status?: string[];
  /** Start of the date range (ISO-8601) */
  dateFrom?: string;
  /** End of the date range (ISO-8601) */
  dateTo?: string;
  /** Minimum invoice amount */
  minAmount?: number;
  /** Maximum invoice amount */
  maxAmount?: number;
  /** Filter by merchant account ID */
  accountId?: string;
}

/**
 * Filters for querying collection records.
 */
export interface CollectionFilters extends BaseFilters {
  /** Filter by one or more severity levels */
  severity?: string[];
  /** Filter by one or more collection statuses */
  status?: string[];
  /** Filter by assigned collector */
  collector?: string;
  /** Filter by aging bucket */
  bucket?: string[];
  /** Minimum past due amount */
  minPastDue?: number;
  /** Maximum past due amount */
  maxPastDue?: number;
}

/**
 * Filters for querying dunning sequences.
 */
export interface DunningFilters extends BaseFilters {
  /** Filter by one or more dunning statuses */
  status?: string[];
  /** Filter by current dunning step */
  currentStep?: string[];
  /** Filter by customer ID */
  customerId?: string;
}

/**
 * Generic paginated result wrapper returned by all list endpoints.
 * Wraps an array of items with pagination metadata.
 *
 * @typeParam T - The type of items in the result set
 */
export interface PaginatedResult<T> {
  /** Array of items for the current page */
  data: T[];
  /** Total number of items matching the filters (across all pages) */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages available */
  totalPages: number;
}
