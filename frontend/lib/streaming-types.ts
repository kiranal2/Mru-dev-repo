// Types for streaming events from FincoPilot backend
// Hybrid Streaming Pattern: WebSocket for progress, REST for results

export type StreamingEventType =
  | "connected" // SSE connection established
  | "thinking_start"
  | "thinking_end"
  | "thinking" // Backend sends 'thinking' instead of 'thinking_start'
  | "agent_delegation"
  | "delegation" // Backend sends 'delegation' instead of 'agent_delegation'
  | "mcp_tool_call"
  | "tool_start" // Backend sends 'tool_start' for tool calls
  | "tool_end"
  | "agent_finish"
  | "query_complete" // Signals to fetch results via REST
  | "error"
  | "cancelled" // Query was cancelled by client
  | "final_result"; // Kept for backwards compatibility

export interface StreamingEvent {
  event_type: StreamingEventType;
  message: string;
  agent?: string;
  tool?: string;
  timestamp?: string;
  elapsed?: number;
  data?: any;
  success?: boolean;
  query_id?: string; // For query_complete event
  thread_id?: string; // Thread ID for conversation context
  session_id?: string; // Session ID
  result_ttl_seconds?: number; // How long results are available
  data_analysis?: string; // LLM response from query_complete event
}

export interface QueryResult {
  success: boolean;
  data_analysis: string;
  recommendations: string[];
  next_steps: string[];
  follow_up_prompts?: string[];
  tool_results: any[];
}

// Response from GET /query/{query_id}/result
export interface QueryResultResponse {
  success: boolean;
  query_id: string;
  data: QueryResult;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// Chat session item returned by GET /sessions/{user_id}
export interface ChatSessionItem {
  session_id: string;
  thread_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

// History message returned by GET /sessions/{user_id}/{thread_id}/history
export interface HistoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  data_analysis?: string;
  tool_results?: any[];
  recommendations?: string[];
  next_steps?: string[];
}
