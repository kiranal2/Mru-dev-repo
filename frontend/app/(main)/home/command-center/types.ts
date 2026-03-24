import { StreamingEvent } from "@/lib/streaming-types";

export type Chip = {
  id: string;
  text: string;
  isOpen?: boolean;
};

/* ─── Rich Card types for cross-module navigation in Command Center ─── */

export interface RichCardKpi {
  label: string;
  value: string;
  color?: "red" | "amber" | "emerald" | "blue" | "slate" | "purple";
  trend?: "up" | "down" | "flat";
}

export interface RichCardItem {
  id: string;
  label: string;
  description?: string;
  severity?: "High" | "Medium" | "Low";
  route?: string;
  type?: "reconciliation" | "variance" | "close-task" | "cash-app" | "collections" | "statement" | "exception";
}

export interface RichCardLink {
  label: string;
  route: string;
  severity?: "High" | "Medium" | "Low";
}

export interface RichCard {
  id: string;
  type: "close-health" | "exceptions" | "navigation" | "kpi-summary" | "alert";
  title: string;
  status?: "at-risk" | "amber" | "on-track";
  kpis?: RichCardKpi[];
  items?: RichCardItem[];
  links?: RichCardLink[];
  progress?: { completed: number; total: number; label?: string };
}

export type Message = {
  id: string;
  message: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: string;
  isStreaming?: boolean;
  financialData?: { tables: any[]; charts: any[] };
  recommendations?: string[];
  nextSteps?: string[];
  dataAnalysis?: string;
  followUpPrompts?: string[];
  richCards?: RichCard[];
  streamingEvents?: StreamingEvent[]; // Streaming events for this message
};

/** Status of restoring a session from URL */
export type SessionRestoreStatus = "idle" | "loading" | "restored" | "denied";

export interface CommandCenterContainerProps {
  /** Session ID from the URL path (e.g. /home/command-center/{sessionId}) */
  initialSessionId?: string;
}
