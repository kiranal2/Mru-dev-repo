/**
 * Reconciliation Domain Types
 *
 * Defines the data structures for the reconciliation module, covering
 * reconciliation definitions and individual run results. Supports
 * bank, intercompany, subledger, and custom reconciliation types.
 */

// ---------------------------------------------------------------------------
// Enumerations / Union Types
// ---------------------------------------------------------------------------

/** Overall status of a reconciliation definition. */
export type ReconStatus =
  | "Not Started"
  | "In Progress"
  | "Matched"
  | "Exceptions"
  | "Completed";

/** Classification of the reconciliation by data source pairing. */
export type ReconType =
  | "Bank"
  | "Intercompany"
  | "Subledger"
  | "Custom";

// ---------------------------------------------------------------------------
// Core Interfaces
// ---------------------------------------------------------------------------

/**
 * A reconciliation definition that pairs a source system against a
 * target system for a given period end.
 *
 * Contains aggregate statistics from the most recent run and optional
 * scheduling configuration for automated execution.
 */
export interface Reconciliation {
  /** Unique identifier. */
  id: string;
  /** Human-readable reconciliation name. */
  name: string;
  /** Classification of the reconciliation. */
  type: ReconType;
  /** Current overall status. */
  status: ReconStatus;
  /** Name of the source system (e.g. "Bank of America", "SAP GL"). */
  sourceSystem: string;
  /** Name of the target system (e.g. "NetSuite", "Oracle AR"). */
  targetSystem: string;
  /** Period-end date this reconciliation covers (ISO 8601). */
  periodEnd: string;
  /** Total number of records from the source system. */
  totalSourceRecords: number;
  /** Total number of records from the target system. */
  totalTargetRecords: number;
  /** Number of records that matched successfully. */
  matchedRecords: number;
  /** Number of records that could not be matched. */
  unmatchedRecords: number;
  /** Total monetary amount of outstanding exceptions. */
  exceptionAmount: number;
  /** Match rate as a percentage (0-100). */
  matchRate: number;
  /** User responsible for reviewing the reconciliation. */
  assignedTo: string;
  /** Timestamp of the most recent run (ISO 8601). */
  lastRunAt?: string;
  /** Scheduled timestamp for the next run (ISO 8601). */
  nextRunAt?: string;
  /** Cron expression or human-readable schedule description. */
  schedule?: string;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
  /** Timestamp when the record was last updated (ISO 8601). */
  updatedAt: string;
}

/**
 * A single execution of a reconciliation, capturing point-in-time
 * matching statistics and run metadata.
 */
export interface ReconRun {
  /** Unique identifier. */
  id: string;
  /** Foreign key to the parent {@link Reconciliation}. */
  reconciliationId: string;
  /** Timestamp when the run started (ISO 8601). */
  startedAt: string;
  /** Timestamp when the run completed (ISO 8601). */
  completedAt?: string;
  /** Execution status of this run. */
  status: "Running" | "Completed" | "Failed";
  /** Number of source records processed. */
  sourceRecords: number;
  /** Number of target records processed. */
  targetRecords: number;
  /** Number of records matched in this run. */
  matched: number;
  /** Number of records that remained unmatched. */
  unmatched: number;
  /** Number of exceptions raised during the run. */
  exceptions: number;
  /** Wall-clock duration of the run in seconds. */
  duration?: number;
  /** User or system that triggered the run. */
  triggeredBy: string;
}
