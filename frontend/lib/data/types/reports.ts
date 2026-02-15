/**
 * Financial Reporting Domain Types
 *
 * Defines the data structures used across financial reports including
 * the Balance Sheet, Income Statement, Trial Balance, Journal Entries,
 * and Flux / Variance Analysis.
 */

// ---------------------------------------------------------------------------
// Balance Sheet
// ---------------------------------------------------------------------------

/**
 * A single node in the hierarchical Balance Sheet tree.
 *
 * Nodes can represent individual accounts or summary roll-ups.
 * The `values` map is keyed by period label (e.g. "2024-Q4") with
 * the corresponding monetary value, or `null` when no data exists
 * for that period.
 */
export interface BalanceSheetNode {
  /** Unique identifier. */
  id: string;
  /** Display label for the row. */
  label: string;
  /** Depth in the hierarchy (0 = top-level). */
  level: number;
  /** ID of the parent node, or `null` for root nodes. */
  parentId: string | null;
  /** Whether this row is a subtotal / total line. */
  isSummary: boolean;
  /** Period-keyed monetary values. */
  values: Record<string, number | null>;
  /** Optional grouping category (e.g. "Current Assets"). */
  group?: string;
}

// ---------------------------------------------------------------------------
// Income Statement
// ---------------------------------------------------------------------------

/**
 * A single line in the Income Statement (P&L).
 *
 * Follows the same hierarchical pattern as {@link BalanceSheetNode},
 * allowing roll-ups for revenue, COGS, operating expenses, etc.
 */
export interface IncomeStatementLine {
  /** Unique identifier. */
  id: string;
  /** Display label for the row. */
  label: string;
  /** Depth in the hierarchy (0 = top-level). */
  level: number;
  /** ID of the parent line, or `null` for root lines. */
  parentId: string | null;
  /** Whether this row is a subtotal / total line. */
  isSummary: boolean;
  /** Period-keyed monetary values. */
  values: Record<string, number | null>;
  /** Optional grouping category (e.g. "Operating Expenses"). */
  group?: string;
}

// ---------------------------------------------------------------------------
// Trial Balance
// ---------------------------------------------------------------------------

/**
 * An account row in the Trial Balance report, showing debit and credit
 * totals for the selected period.
 */
export interface TrialBalanceAccount {
  /** Unique identifier. */
  id: string;
  /** Chart-of-accounts number. */
  accountNumber: string;
  /** Human-readable account name. */
  accountName: string;
  /** High-level account classification. */
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  /** Total debit balance. */
  debit: number;
  /** Total credit balance. */
  credit: number;
  /** Net balance (debit minus credit). */
  netBalance: number;
  /** Department or cost centre, if applicable. */
  department?: string;
  /** Subsidiary or legal entity, if applicable. */
  subsidiary?: string;
}

// ---------------------------------------------------------------------------
// Journal Entries
// ---------------------------------------------------------------------------

/**
 * A journal entry with its constituent debit/credit lines.
 *
 * Journal entries may be created manually, by the close process, or
 * generated automatically by the AI engine (e.g. reclassifications).
 */
export interface JournalEntry {
  /** Unique identifier. */
  id: string;
  /** Sequential journal entry number. */
  entryNumber: string;
  /** Effective date of the entry (ISO 8601). */
  date: string;
  /** Description or memo for the overall entry. */
  description: string;
  /** Subsidiary or legal entity the entry belongs to. */
  subsidiary: string;
  /** Approval / posting status. */
  status: "Draft" | "Pending" | "Posted" | "Reversed";
  /** User who created the entry. */
  createdBy: string;
  /** Individual debit/credit lines that comprise the entry. */
  lines: Array<{
    /** Account number. */
    account: string;
    /** Account display name. */
    accountName: string;
    /** Debit amount (0 if this line is a credit). */
    debit: number;
    /** Credit amount (0 if this line is a debit). */
    credit: number;
    /** Optional line-level memo. */
    memo?: string;
  }>;
  /** Sum of all line debits (should equal totalCredit). */
  totalDebit: number;
  /** Sum of all line credits (should equal totalDebit). */
  totalCredit: number;
  /** Timestamp when the entry was created (ISO 8601). */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Flux / Variance Analysis
// ---------------------------------------------------------------------------

/**
 * A single row in the Flux (Variance) Analysis report, comparing an
 * account balance across two periods and highlighting material changes.
 */
export interface FluxVariance {
  /** Unique identifier. */
  id: string;
  /** Account display name. */
  accountName: string;
  /** Chart-of-accounts number. */
  accountNumber: string;
  /** Balance in the current (latest) period. */
  currentPeriod: number;
  /** Balance in the prior (comparison) period. */
  priorPeriod: number;
  /** Absolute variance (currentPeriod - priorPeriod). */
  varianceAmount: number;
  /** Percentage variance ((variance / priorPeriod) * 100). */
  variancePct: number;
  /** Whether the variance has been explained. */
  status: "Explained" | "Unexplained" | "In Progress";
  /** AI-generated explanation for the variance, if available. */
  aiExplanation?: string;
  /** User assigned to explain or review this variance. */
  assignedTo?: string;
  /** Optional variance category for grouping. */
  category?: string;
  /** Whether the variance exceeds the materiality threshold. */
  materialityFlag: boolean;
}
