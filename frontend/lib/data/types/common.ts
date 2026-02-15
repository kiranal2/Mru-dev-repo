/**
 * @module common
 * @description Shared type definitions used across the Meeru AI frontend
 * including notifications, audit entries, users, and chat sessions.
 */

/**
 * Severity level of a notification.
 *
 * - **info** -- Informational; no action required.
 * - **warning** -- Something may need attention soon.
 * - **error** -- An error occurred that requires action.
 * - **success** -- An operation completed successfully.
 */
export type NotificationType = "info" | "warning" | "error" | "success";

/**
 * Module that originated or is associated with a notification.
 */
export type NotificationModule =
  | "igrs"
  | "revenue"
  | "cash"
  | "reports"
  | "close"
  | "recons"
  | "workspace"
  | "automation"
  | "system";

/**
 * An in-app notification delivered to the user.
 * Notifications can optionally link to a specific entity or page.
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  /** Severity level */
  type: NotificationType;
  /** Module that generated the notification */
  module: NotificationModule;
  /** Short notification title */
  title: string;
  /** Detailed notification message */
  message: string;
  /** Whether the user has read this notification */
  read: boolean;
  /** Optional URL the user is directed to when clicking the notification */
  actionUrl?: string;
  /** Optional identifier of a related entity */
  entityId?: string;
  /** ISO-8601 timestamp when the notification was created */
  createdAt: string;
}

/**
 * A single entry in the system audit log.
 * Audit entries provide a tamper-evident trail of all significant actions.
 */
export interface AuditEntry {
  /** Unique identifier for the audit entry */
  id: string;
  /** ISO-8601 timestamp when the action occurred */
  timestamp: string;
  /** Name or identifier of the user or system that performed the action */
  actor: string;
  /** Machine-readable action identifier (e.g. "case.create", "rule.update") */
  action: string;
  /** Human-readable description of what happened */
  detail: string;
  /** Module where the action took place */
  module: string;
  /** Type of the entity affected (e.g. "case", "rule", "user") */
  entityType?: string;
  /** Identifier of the affected entity */
  entityId?: string;
  /** High-level category for filtering and grouping */
  category: "system" | "rule" | "user" | "case" | "export" | "config" | "data";
  /** IP address of the client that performed the action */
  ipAddress?: string;
}

/**
 * A platform user with role-based access control.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** Full display name */
  name: string;
  /** Email address (used for login and notifications) */
  email: string;
  /** Access role that determines permissions */
  role: "Admin" | "Manager" | "Analyst" | "Viewer";
  /** Department the user belongs to */
  department?: string;
  /** List of module identifiers the user has access to */
  modules: string[];
  /** Account status */
  status: "Active" | "Inactive";
  /** ISO-8601 timestamp of the user's last activity */
  lastActive: string;
  /** URL to the user's avatar image */
  avatar?: string;
  /** ISO-8601 timestamp when the user account was created */
  createdAt: string;
}

/**
 * A single message within an AI chat session.
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Role of the message author */
  role: "user" | "assistant" | "system";
  /** Text content of the message */
  content: string;
  /** ISO-8601 timestamp when the message was sent */
  timestamp: string;
  /** Arbitrary metadata attached to the message (e.g. citations, tool calls) */
  metadata?: Record<string, unknown>;
}

/**
 * A persisted AI chat session containing an ordered list of messages.
 * Sessions belong to a specific module context and can be starred for quick access.
 */
export interface ChatSession {
  /** Unique identifier for the session */
  id: string;
  /** Display title (auto-generated or user-provided) */
  title: string;
  /** Module context the chat was initiated from */
  module: string;
  /** Ordered list of messages in the conversation */
  messages: ChatMessage[];
  /** ISO-8601 timestamp when the session was created */
  createdAt: string;
  /** ISO-8601 timestamp when the session was last updated */
  updatedAt: string;
  /** Whether the user has starred this session for quick access */
  starred?: boolean;
}
