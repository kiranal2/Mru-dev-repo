import { StreamingEvent } from "@/lib/streaming-types";

export type Chip = {
  id: string;
  text: string;
  isOpen?: boolean;
};

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
  streamingEvents?: StreamingEvent[]; // Streaming events for this message
};

/** Status of restoring a session from URL */
export type SessionRestoreStatus = "idle" | "loading" | "restored" | "denied";

export interface CommandCenterContainerProps {
  /** Session ID from the URL path (e.g. /home/command-center/{sessionId}) */
  initialSessionId?: string;
}
