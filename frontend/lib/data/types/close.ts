/**
 * Financial Close Domain Types
 *
 * Defines the data structures for the period-end close management
 * module, including task tracking across close phases with dependency
 * management and time estimation.
 */

// ---------------------------------------------------------------------------
// Enumerations / Union Types
// ---------------------------------------------------------------------------

/** Lifecycle status of a close task. */
export type CloseTaskStatus =
  | "Not Started"
  | "In Progress"
  | "Pending Review"
  | "Completed"
  | "Blocked";

/** Phase of the close calendar in which a task falls. */
export type CloseTaskPhase =
  | "Pre-Close"
  | "Core Close"
  | "Post-Close"
  | "Reporting";

/** Priority level for ordering and escalation. */
export type CloseTaskPriority =
  | "Critical"
  | "High"
  | "Medium"
  | "Low";

// ---------------------------------------------------------------------------
// Core Interfaces
// ---------------------------------------------------------------------------

/**
 * A single task within the period-end close checklist.
 *
 * Tasks are organised by phase and may declare dependencies on other
 * tasks. Each task tracks estimated vs. actual effort and supports an
 * optional inline checklist for sub-steps.
 */
export interface CloseTask {
  /** Unique identifier. */
  id: string;
  /** Short, descriptive task name. */
  name: string;
  /** Detailed description of what the task involves. */
  description: string;
  /** Close phase this task belongs to. */
  phase: CloseTaskPhase;
  /** Current lifecycle status. */
  status: CloseTaskStatus;
  /** Priority level. */
  priority: CloseTaskPriority;
  /** User responsible for completing the task. */
  assignedTo: string;
  /** Target completion date (ISO 8601). */
  dueDate: string;
  /** Timestamp when the task was marked completed (ISO 8601). */
  completedAt?: string;
  /** IDs of tasks that must be completed before this one can start. */
  dependencies: string[];
  /** Subsidiary or legal entity the task applies to, if scoped. */
  subsidiary?: string;
  /** Estimated effort in minutes. */
  estimatedMinutes: number;
  /** Actual effort recorded in minutes. */
  actualMinutes?: number;
  /** Optional inline checklist of sub-steps. */
  checklist?: Array<{
    /** Description of the sub-step. */
    label: string;
    /** Whether the sub-step has been completed. */
    checked: boolean;
  }>;
  /** Free-form notes or comments. */
  notes?: string;
  /** Timestamp when the record was created (ISO 8601). */
  createdAt: string;
  /** Timestamp when the record was last updated (ISO 8601). */
  updatedAt: string;
}
