/**
 * @module automation
 * @description Type definitions for Meeru AI automation layer including
 * workflows, workflow steps, and execution records.
 */

/**
 * Possible lifecycle states of a workflow.
 *
 * - **Active** -- The workflow is live and will execute on its trigger.
 * - **Paused** -- Temporarily suspended; will not execute until resumed.
 * - **Draft** -- Under construction; not yet published.
 * - **Error** -- The workflow encountered a fatal error and requires attention.
 */
export type WorkflowStatus = "Active" | "Paused" | "Draft" | "Error";

/**
 * The mechanism that initiates a workflow run.
 *
 * - **Schedule** -- Runs on a cron-like schedule.
 * - **Event** -- Triggered by a system or domain event.
 * - **Manual** -- Triggered explicitly by a user.
 * - **Threshold** -- Triggered when a monitored metric crosses a threshold.
 */
export type WorkflowTrigger = "Schedule" | "Event" | "Manual" | "Threshold";

/**
 * A single step within a workflow definition.
 * Steps are executed sequentially according to their {@link order}.
 */
export interface WorkflowStep {
  /** Unique identifier for the step */
  id: string;
  /** Human-readable step name */
  name: string;
  /** Classification of the step's behaviour */
  type: "condition" | "action" | "notification" | "approval" | "transform";
  /** Step-specific configuration; schema varies by {@link type} */
  config: Record<string, unknown>;
  /** Execution order within the workflow (lower numbers run first) */
  order: number;
}

/**
 * A record of a single workflow execution.
 * Created each time a workflow is triggered and updated as steps complete.
 */
export interface WorkflowExecution {
  /** Unique identifier for the execution */
  id: string;
  /** Identifier of the parent workflow */
  workflowId: string;
  /** ISO-8601 timestamp when execution started */
  startedAt: string;
  /** ISO-8601 timestamp when execution finished; undefined while running */
  completedAt?: string;
  /** Current execution status */
  status: "Running" | "Completed" | "Failed" | "Cancelled";
  /** Number of steps that have finished so far */
  stepsCompleted: number;
  /** Total number of steps in the workflow at the time of execution */
  totalSteps: number;
  /** Identifier of the user or system that initiated the run */
  triggeredBy: string;
  /** Serialised output produced by the final step */
  output?: string;
  /** Error message if the execution failed */
  error?: string;
}

/**
 * A complete workflow definition including its steps, trigger configuration,
 * runtime statistics, and recent execution history.
 */
export interface Workflow {
  /** Unique identifier for the workflow */
  id: string;
  /** Human-readable workflow name */
  name: string;
  /** Description of what the workflow does */
  description: string;
  /** Module this workflow belongs to */
  module: string;
  /** Mechanism that starts the workflow */
  trigger: WorkflowTrigger;
  /** Trigger-specific configuration (e.g. cron expression, event name) */
  triggerConfig?: Record<string, unknown>;
  /** Current lifecycle status */
  status: WorkflowStatus;
  /** Ordered list of steps executed when the workflow runs */
  steps: WorkflowStep[];
  /** ISO-8601 timestamp of the most recent execution */
  lastRunAt?: string;
  /** ISO-8601 timestamp of the next scheduled execution */
  nextRunAt?: string;
  /** Total number of times the workflow has been executed */
  runCount: number;
  /** Percentage of executions that completed successfully (0-100) */
  successRate: number;
  /** Most recent execution records, ordered newest first */
  recentExecutions: WorkflowExecution[];
  /** Identifier of the user who created the workflow */
  createdBy: string;
  /** ISO-8601 timestamp when the workflow was created */
  createdAt: string;
  /** ISO-8601 timestamp when the workflow was last modified */
  updatedAt: string;
}
