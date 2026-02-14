"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import CommandCenter from "@/components/pages/CommandCenter";
import GridTable from "@/components/ui/GridTable";
import AgingSummaryCards from "@/components/ui/aging-summary-cards";
import LivePinModal from "@/components/ui/live-pin-modal";
import { CreateWatchModal } from "@/components/ui/create-watch-modal";
import { CreateTemplateModal } from "@/components/modals/CreateTemplateModal";
import { TemplateCreatedModal } from "@/components/modals/TemplateCreatedModal";
import { Bot, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useStreamingQuery } from "@/hooks/useStreamingQuery";
import { StreamingEvent, ChatSessionItem, HistoryMessage } from "@/lib/streaming-types";
import { useAuth } from "@/lib/auth-context";
import PageForbidden from "@/app/ErrorPages/PageForbidden";

// Feature flag to enable/disable WebSocket streaming
const USE_WEBSOCKET_STREAMING = true;

// Hardcoded user ID (until auth is implemented)
const HARDCODED_USER_ID = "user_12345";

// Base path for command center (used for URL sync)
const COMMAND_CENTER_BASE_PATH = "/home/command-center";

type Chip = {
  id: string;
  text: string;
  isOpen?: boolean;
};

type Message = {
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
  streamingEvents?: StreamingEvent[]; // Streaming events for this message
};

// Status of restoring a session from URL
type SessionRestoreStatus = "idle" | "loading" | "restored" | "denied";

interface CommandCenterContainerProps {
  /** Session ID from the URL path (e.g. /home/command-center/{sessionId}) */
  initialSessionId?: string;
}

export default function CommandCenterContainer({ initialSessionId }: CommandCenterContainerProps) {
  const [loadingState, setLoadingState] = useState<"loading" | "loaded">("loading");
  const [composerValue, setComposerValue] = useState("");
  const [activeChips, setActiveChips] = useState<Chip[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [showFinancialResults, setShowFinancialResults] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [isLivePinModalOpen, setIsLivePinModalOpen] = useState(false);
  const [isCreateWatchModalOpen, setIsCreateWatchModalOpen] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isTemplateCreatedModalOpen, setIsTemplateCreatedModalOpen] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState("");
  const [currentStreamingEvents, setCurrentStreamingEvents] = useState<StreamingEvent[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentQueryIdRef = useRef<string | null>(null);
  const sessionRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Session management state
  const [chatSessions, setChatSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Session restore from URL state
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [sessionsLoadFailed, setSessionsLoadFailed] = useState(false);
  const [sessionRestoreStatus, setSessionRestoreStatus] = useState<SessionRestoreStatus>(
    initialSessionId ? "loading" : "idle"
  );

  // Get user from auth context for episodic memory
  const { user } = useAuth();

  // WebSocket streaming hook (Hybrid Pattern: WS for progress, REST for results)
  const {
    events: streamingEvents,
    result: streamingResult,
    isLoading: wsIsLoading,
    isFetchingResult,
    error: wsError,
    connectionStatus,
    currentMessage,
    currentQueryId,
    currentSessionId,
    currentThreadId,
    sendQuery: wsSendQuery,
    cancelQuery,
    clearEvents,
    clearConversation,
    restoreSession,
  } = useStreamingQuery({ userId: user?.id });

  // Derived state
  const isLoading = USE_WEBSOCKET_STREAMING ? wsIsLoading || isFetchingResult : false;
  const isConnected = USE_WEBSOCKET_STREAMING ? connectionStatus !== "error" : true;

  // ==================== Session Management (callbacks defined before effects) ====================

  // Function to parse tool result as table (needed by loadSessionHistory)
  const parseToolResultAsTable = (agentName: string, result: any): any | null => {
    try {
      if (result && typeof result === "object" && result.data) {
        const data = result.data;
        const meta = data.meta || {};
        const rawColumns = meta.columns || [];
        const rows = data.preview_data_rows || data.rows || [];

        if (rawColumns.length > 0 && rows.length > 0) {
          const columns = rawColumns.map((col: any) => {
            if (typeof col === "string") {
              const colName = col;
              const isAmount =
                colName.toLowerCase().includes("amount") ||
                colName.toLowerCase().includes("balance") ||
                colName.toLowerCase().includes("usd");
              const isDate = colName.toLowerCase().includes("date");
              return {
                key: colName,
                title: colName.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
                type: isAmount ? "currency" : isDate ? "date" : "string",
                format: isAmount ? "currency" : isDate ? "date" : "text",
                description: "",
                hidden: false,
              };
            } else {
              return {
                key: col.id || col.key || col.name,
                title: col.name || col.title,
                type: col.data_type || col.type || "string",
                format:
                  col.data_type === "currency"
                    ? "currency"
                    : col.data_type === "date"
                      ? "date"
                      : col.data_type === "number"
                        ? "number"
                        : "text",
                description: col.description || "",
                hidden: col.is_hidden || col.hidden || false,
              };
            }
          });

          return {
            event_type: "DATA_TABLE",
            timestamp: new Date().toISOString(),
            event_id: Math.random().toString(),
            title: `${agentName.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} Results`,
            columns: columns,
            rows: rows,
            metadata: {
              total_rows: meta.total_row_count || rows.length,
              preview_rows: meta.preview_row_count || rows.length,
              execution_time: meta.execution_ms || 0,
              generated_at: meta.generated_at || new Date().toISOString(),
              tool_type: data.tool_type || agentName,
              tool_response_type: data.tool_response_type || "TABLE_PREVIEW",
              has_more_data: (meta.total_row_count || 0) > (meta.preview_row_count || rows.length),
            },
            interactive: true,
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Error parsing tool result as table:", error);
      return null;
    }
  };

  // Load session list from GET /sessions/{user_id}
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setSessionsLoadFailed(false);
    try {
      const response = await fetch(`/api/sessions/${HARDCODED_USER_ID}`);
      if (response.ok) {
        const data = await response.json();
        // API returns { success, user_id, sessions: [...], count, limit, offset }
        const sessionsList: ChatSessionItem[] = Array.isArray(data) ? data : data.sessions || [];
        // Sort by updated_at descending (most recent first)
        const sorted = sessionsList.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setChatSessions(sorted);
        setSessionsLoaded(true);
        console.log("📋 Loaded sessions:", sorted.length);
        if (sorted.length > 0) {
          console.log("📋 Session IDs:", sorted.map((s) => s.session_id).join(", "));
        }
      } else {
        console.warn("⚠️ Failed to load sessions:", response.status);
        setSessionsLoadFailed(true);
        setSessionsLoaded(true);
      }
    } catch (err) {
      console.error("❌ Error loading sessions:", err);
      setSessionsLoadFailed(true);
      setSessionsLoaded(true);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Normalize role strings from various backend conventions to UI-expected values.
  // LangChain/LangGraph backends may return 'ai' instead of 'assistant', and 'human' instead of 'user'.
  const normalizeRole = useCallback((role: string | undefined): "user" | "assistant" | "system" => {
    const lower = (role || "").toLowerCase();
    if (lower === "user" || lower === "human") return "user";
    if (lower === "assistant" || lower === "ai") return "assistant";
    return "system";
  }, []);

  // Build a table event from a data_preview object (flat columns + preview_data_rows).
  // This mirrors the shape that parseToolResultAsTable expects.
  const buildTableFromDataPreview = useCallback(
    (dataPreview: any, toolName: string): any | null => {
      try {
        if (!dataPreview) return null;
        const rawColumns: string[] = dataPreview.columns || [];
        const rows: any[] = dataPreview.preview_data_rows || dataPreview.rows || [];
        if (rawColumns.length === 0 || rows.length === 0) return null;

        const columns = rawColumns.map((colName: string) => {
          const lower = colName.toLowerCase();
          const isAmount =
            lower.includes("amount") || lower.includes("balance") || lower.includes("usd");
          const isDate = lower.includes("date");
          return {
            key: colName,
            title: colName.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
            type: isAmount ? "currency" : isDate ? "date" : "string",
            format: isAmount ? "currency" : isDate ? "date" : "text",
            description: "",
            hidden: false,
          };
        });

        return {
          event_type: "DATA_TABLE",
          timestamp: new Date().toISOString(),
          event_id: Math.random().toString(),
          title: `${toolName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Results`,
          columns,
          rows,
          metadata: {
            total_rows: rows.length,
            preview_rows: rows.length,
            execution_time: 0,
            generated_at: new Date().toISOString(),
            tool_type: toolName,
            tool_response_type: "TABLE_PREVIEW",
            has_more_data: false,
          },
          interactive: true,
        };
      } catch (error) {
        console.error("Error building table from data_preview:", error);
        return null;
      }
    },
    []
  );

  // Load session history from GET /sessions/{user_id}/{thread_id}/history
  const loadSessionHistory = useCallback(
    async (session: ChatSessionItem) => {
      try {
        const response = await fetch(
          `/api/sessions/${HARDCODED_USER_ID}/${session.thread_id}/history`
        );
        if (!response.ok) {
          throw new Error(`Failed to load history: ${response.status}`);
        }
        const data = await response.json();

        // API returns { success, thread_id, user_id, results: [{ conversation_view: [...], artifacts: [...] }] }
        // OR it may return a flat HistoryMessage[] array (handle both formats)
        //
        // conversation_view message shapes:
        //   User:      { type: "user", content: "..." }
        //   Assistant: { type: "assistant", analysis: "...", recommendations: "...",
        //                tool_name: "...", domain: "...", data_preview: { columns, preview_data_rows } }
        let rawMessages: any[] = [];

        if (Array.isArray(data)) {
          // Flat array format: HistoryMessage[]
          rawMessages = data;
        } else if (data.results && Array.isArray(data.results)) {
          // Wrapped format: extract conversation_view from each result
          for (const result of data.results) {
            if (result.conversation_view && Array.isArray(result.conversation_view)) {
              rawMessages.push(
                ...result.conversation_view.map((msg: any) => {
                  const role = normalizeRole(msg.type || msg.role);

                  // Assistant messages use 'analysis' for text and 'data_preview' for table data
                  const content = msg.content || msg.analysis || "";
                  const dataAnalysis = msg.analysis || msg.data_analysis || "";

                  // Build tool_results from data_preview if present (assistant messages)
                  let toolResults = msg.tool_results || undefined;
                  if (!toolResults && msg.data_preview) {
                    const table = buildTableFromDataPreview(
                      msg.data_preview,
                      msg.tool_name || msg.domain || "result"
                    );
                    if (table) {
                      toolResults = [
                        {
                          type: "table",
                          success: true,
                          agent_name: msg.tool_name || msg.domain || "result",
                          table,
                        },
                      ];
                    }
                  }

                  // Recommendations can be a string or array from the API
                  const recs = msg.recommendations;
                  const recommendations = recs ? (Array.isArray(recs) ? recs : [recs]) : undefined;

                  const ns = msg.next_steps;
                  const nextSteps = ns ? (Array.isArray(ns) ? ns : [ns]) : undefined;

                  return {
                    role,
                    content,
                    dataAnalysis,
                    timestamp: msg.timestamp || result.created_at || new Date().toISOString(),
                    toolResults,
                    recommendations,
                    nextSteps,
                  };
                })
              );
            }
          }
        }

        // Filter out injected episodic context messages (they start with "[Relevant context")
        rawMessages = rawMessages.filter((msg: any) => {
          if (normalizeRole(msg.role) === "user" && typeof msg.content === "string") {
            return !msg.content.startsWith("[Relevant context");
          }
          return true;
        });

        console.log("📜 Raw messages parsed:", rawMessages.length, "from API");
        if (rawMessages.length > 0) {
          console.log(
            "📜 Message roles:",
            rawMessages.map((m) => m.role)
          );
        }

        // Transform to UI Message format
        const historyMessages: Message[] = rawMessages.map((msg: any, idx: number) => {
          // Build financialData from toolResults
          let financialData: { tables: any[]; charts: any[] } | undefined;
          if (msg.toolResults && Array.isArray(msg.toolResults)) {
            // toolResults may already contain pre-built table objects (from data_preview)
            // or raw tool_result objects that need parsing via parseToolResultAsTable
            const tables = msg.toolResults
              .map((tr: any) => {
                // If the table was already built from data_preview, use it directly
                if (tr.table) return tr.table;
                // Otherwise parse the raw tool result
                if (tr.type === "table" && tr.success) {
                  return parseToolResultAsTable(tr.agent_name || "result", tr);
                }
                return null;
              })
              .filter(Boolean);
            if (tables.length > 0) {
              financialData = { tables, charts: [] };
            }
          }

          return {
            id: `history-${session.thread_id}-${idx}`,
            message: msg.content,
            content: msg.content,
            role: normalizeRole(msg.role),
            timestamp: msg.timestamp || new Date().toISOString(),
            isStreaming: false,
            dataAnalysis: msg.dataAnalysis || msg.data_analysis || undefined,
            financialData,
            recommendations: msg.recommendations || undefined,
            nextSteps: msg.nextSteps || msg.next_steps || undefined,
          };
        });

        setMessages(historyMessages);
        setShowFinancialResults(historyMessages.length > 0);
        setErrors([]);
        console.log("📜 Loaded history:", historyMessages.length, "messages");
      } catch (err) {
        console.error("❌ Error loading session history:", err);
        toast.error("Failed to load session history");
      }
    },
    [normalizeRole, buildTableFromDataPreview]
  );

  // ==================== Effects ====================

  // Handle loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingState("loaded");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Load session list on mount; clean up any pending refresh timer on unmount
  useEffect(() => {
    loadSessions();
    return () => {
      if (sessionRefreshTimerRef.current) {
        clearTimeout(sessionRefreshTimerRef.current);
        sessionRefreshTimerRef.current = null;
      }
    };
  }, []);

  // Update activeSessionId when currentSessionId changes (after connected event)
  useEffect(() => {
    if (currentSessionId) {
      setActiveSessionId(currentSessionId);
      // Refresh session list after a new session is created
      // Delay slightly to allow backend to populate the session
      const timer = setTimeout(() => {
        loadSessions();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentSessionId]);

  // Sync URL when activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      const targetPath = `${COMMAND_CENTER_BASE_PATH}/${activeSessionId}`;
      if (window.location.pathname !== targetPath) {
        window.history.replaceState({}, "", targetPath);
      }
    }
  }, [activeSessionId]);

  // Auto-restore session from URL on mount (when navigating directly to /command-center/{sessionId})
  useEffect(() => {
    if (initialSessionId && sessionsLoaded && sessionRestoreStatus === "loading") {
      console.log(
        "🔍 Looking for session:",
        initialSessionId,
        "in",
        chatSessions.length,
        "sessions"
      );

      if (sessionsLoadFailed) {
        // API failed - don't show 403, just start a new chat
        console.warn("⚠️ Sessions API failed, starting fresh session");
        setSessionRestoreStatus("restored");
        return;
      }

      const session = chatSessions.find((s) => s.session_id === initialSessionId);
      if (session) {
        // Found the session - restore it
        setActiveSessionId(session.session_id);
        restoreSession(session.session_id, session.thread_id);
        setErrors([]);
        setCurrentStreamingEvents([]);
        currentQueryIdRef.current = null;
        loadSessionHistory(session);
        setSessionRestoreStatus("restored");
        console.log("🔗 Session restored from URL:", session.session_id);
      } else {
        // Session not found under this user - deny access
        console.warn("🚫 Session not found for URL:", initialSessionId);
        console.warn(
          "🚫 Available session IDs:",
          chatSessions.map((s) => s.session_id)
        );
        setSessionRestoreStatus("denied");
      }
    }
  }, [
    initialSessionId,
    sessionsLoaded,
    sessionsLoadFailed,
    chatSessions,
    sessionRestoreStatus,
    restoreSession,
    loadSessionHistory,
  ]);

  // Update current streaming events as they arrive
  useEffect(() => {
    if (streamingEvents.length > 0) {
      setCurrentStreamingEvents(streamingEvents);
    }
  }, [streamingEvents]);

  // Handle streaming result when query completes
  useEffect(() => {
    console.log(
      "🔄 useEffect triggered - streamingResult:",
      !!streamingResult,
      "queryIdRef:",
      currentQueryIdRef.current
    );

    if (streamingResult && currentQueryIdRef.current) {
      const queryId = currentQueryIdRef.current;
      console.log("📊 Processing streamingResult for queryId:", queryId);

      // Process tool results (tables)
      const tables: any[] = [];
      const charts: any[] = [];

      if (streamingResult.tool_results && Array.isArray(streamingResult.tool_results)) {
        console.log("📊 Processing tool_results:", streamingResult.tool_results.length, "items");
        streamingResult.tool_results.forEach((toolResult: any, idx: number) => {
          console.log(`📊 tool_result[${idx}]:`, {
            type: toolResult.type,
            success: toolResult.success,
            hasData: !!toolResult.data,
            columns: toolResult.data?.meta?.columns?.length || 0,
            rows: toolResult.data?.preview_data_rows?.length || 0,
          });
          if (toolResult.type === "table" && toolResult.success) {
            const tableData = parseToolResultAsTable(toolResult.agent_name, toolResult);
            if (tableData) {
              tables.push(tableData);
              const chartData = createPieChartData(tableData);
              if (chartData) {
                charts.push(chartData);
              }
            }
          }
        });
      }

      // Update the assistant message with the result
      setMessages((prev) => {
        const updated = [...prev];
        const assistantIdx = updated.findIndex(
          (m) => m.id === `assistant-${queryId}` && m.role === "assistant"
        );

        if (assistantIdx >= 0) {
          const hasTableData = tables.length > 0;
          const totalRecords = tables.reduce(
            (sum, t) => sum + (t.metadata?.total_rows || t.rows?.length || 0),
            0
          );
          const fallbackAnalysis = hasTableData
            ? `Found ${totalRecords} records matching your query. The results are displayed in the table below.`
            : "Analysis completed successfully.";

          const finalDataAnalysis = streamingResult.data_analysis || fallbackAnalysis;

          updated[assistantIdx] = {
            ...updated[assistantIdx],
            content: finalDataAnalysis,
            isStreaming: false,
            financialData: { tables, charts },
            recommendations: streamingResult.recommendations || [],
            nextSteps: streamingResult.next_steps || [],
            dataAnalysis: finalDataAnalysis,
            streamingEvents: [...currentStreamingEvents],
          };
        } else {
          const newMessageContent =
            streamingResult.data_analysis || "Analysis completed successfully.";
          updated.push({
            id: `assistant-${queryId}-result`,
            content: newMessageContent,
            role: "assistant",
            message: "",
            timestamp: new Date().toISOString(),
            isStreaming: false,
            financialData: { tables, charts },
            recommendations: streamingResult.recommendations || [],
            nextSteps: streamingResult.next_steps || [],
            dataAnalysis: newMessageContent,
            streamingEvents: [...currentStreamingEvents],
          });
        }
        return updated;
      });

      currentQueryIdRef.current = null;
      setCurrentStreamingEvents([]);

      // Refresh sessions list after query completes (to get updated title)
      sessionRefreshTimerRef.current = setTimeout(() => loadSessions(), 2000);
    }
  }, [streamingResult, currentStreamingEvents]);

  // Handle streaming errors
  useEffect(() => {
    if (wsError && currentQueryIdRef.current) {
      setErrors((prev) => [
        ...prev,
        {
          event_type: "ERROR",
          timestamp: new Date().toISOString(),
          event_id: Math.random().toString(),
          message: wsError,
          code: "WEBSOCKET_ERROR",
        },
      ]);
    }
  }, [wsError]);

  // Scroll to bottom when messages change or streaming events update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentStreamingEvents]);

  // Handle "New Chat" click
  const handleNewChat = useCallback(() => {
    // Clear message list
    setMessages([]);
    setErrors([]);
    setShowFinancialResults(false);
    setCurrentStreamingEvents([]);
    setComposerValue("");
    currentQueryIdRef.current = null;
    setActiveSessionId(null);

    // Clear conversation context in the hook (sets isNewSession=true, clears thread/session)
    clearConversation();

    // Reset URL back to base command center path
    window.history.replaceState({}, "", COMMAND_CENTER_BASE_PATH);

    console.log("🆕 New chat started - ready for force_new_session");
  }, [clearConversation]);

  // Handle clicking a session in the sidebar
  const handleSessionClick = useCallback(
    async (session: ChatSessionItem) => {
      // Set the active session
      setActiveSessionId(session.session_id);

      // Restore session context in the hook (sets thread_id so follow-ups work)
      restoreSession(session.session_id, session.thread_id);

      // Clear current state
      setErrors([]);
      setCurrentStreamingEvents([]);
      currentQueryIdRef.current = null;

      // Load history for this session
      await loadSessionHistory(session);
    },
    [restoreSession, loadSessionHistory]
  );

  // Handle cancel query
  const handleCancelQuery = useCallback(async () => {
    await cancelQuery();

    // Remove the streaming placeholder assistant message
    setMessages((prev) => {
      const updated = prev.filter((m) => !m.isStreaming);
      return updated;
    });
    setCurrentStreamingEvents([]);
    currentQueryIdRef.current = null;

    toast.info("Query cancelled");
  }, [cancelQuery]);

  // ==================== Existing Handlers ====================

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComposerValue(e.target.value);
    setShowPlaceholder(e.target.value.length === 0);
  }, []);

  const handleTextareaFocus = () => {
    setShowPlaceholder(false);
    setOpenDropdownId(null);
  };

  const handleTextareaBlur = () => {
    if (composerValue.trim() === "") {
      setShowPlaceholder(true);
    }
  };

  // Function to create pie chart data from table data
  const createPieChartData = (tableData: any): any => {
    if (!tableData || !tableData.rows || tableData.rows.length === 0) return null;

    if (tableData.title.includes("Vendor")) {
      const vendorTypes = tableData.rows.reduce((acc: any, row: any) => {
        const vendorType = row[2];
        acc[vendorType] = (acc[vendorType] || 0) + 1;
        return acc;
      }, {});

      return {
        title: "Vendor Distribution by Type",
        chart_type: "pie",
        data: Object.entries(vendorTypes).map(([label, value]) => ({
          label,
          value,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        })),
      };
    }

    if (tableData.title.includes("Bill")) {
      const billStatuses = tableData.rows.reduce((acc: any, row: any) => {
        const status = row[5];
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      return {
        title: "Bill Distribution by Status",
        chart_type: "pie",
        data: Object.entries(billStatuses).map(([label, value]) => ({
          label,
          value,
          color:
            label === "PAID"
              ? "#10B981"
              : label === "OPEN"
                ? "#3B82F6"
                : label === "OVERDUE"
                  ? "#EF4444"
                  : "#6B7280",
        })),
      };
    }

    return null;
  };

  const handleSendClick = async () => {
    if (!composerValue.trim() || isLoading) {
      return;
    }

    const userMessage = composerValue.trim();
    const queryId = Date.now().toString();
    setComposerValue("");
    setOpenDropdownId(null);
    setShowFinancialResults(true);

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${queryId}`,
        content: userMessage,
        role: "user",
        message: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    // Use WebSocket streaming if enabled
    if (USE_WEBSOCKET_STREAMING) {
      console.log("🚀 Using WebSocket streaming...");
      currentQueryIdRef.current = queryId;
      clearEvents();
      setCurrentStreamingEvents([]);

      // Add placeholder assistant message for streaming
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${queryId}`,
          content: "",
          role: "assistant",
          message: userMessage,
          timestamp: new Date().toISOString(),
          isStreaming: true,
        },
      ]);

      // Send query via SSE (hook handles force_new_session vs thread_id automatically)
      wsSendQuery(userMessage);
      return;
    }

    // Fallback to REST API
    console.log("📡 Using REST API (fallback)...");
    try {
      const response = await fetch("/api/commandQuery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const apiResponse = await response.json();
      const tables: any[] = [];
      const charts: any[] = [];

      if (apiResponse.tool_results && Array.isArray(apiResponse.tool_results)) {
        apiResponse.tool_results.forEach((toolResult: any) => {
          if (toolResult.type === "table" && toolResult.success) {
            const tableData = parseToolResultAsTable(toolResult.agent_name, toolResult);
            if (tableData) {
              tables.push(tableData);
              const chartData = createPieChartData(tableData);
              if (chartData) {
                charts.push(chartData);
              }
            }
          }
        });
      }

      const responseData = {
        financialData: { tables, charts },
        recommendations:
          apiResponse.recommendations && Array.isArray(apiResponse.recommendations)
            ? apiResponse.recommendations
            : [],
        nextSteps:
          apiResponse.next_steps && Array.isArray(apiResponse.next_steps)
            ? apiResponse.next_steps
            : [],
        dataAnalysis: apiResponse.data_analysis || "",
      };

      const assistantResponse = apiResponse.data_analysis || "Analysis completed successfully.";
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          content: assistantResponse,
          role: "assistant",
          message: userMessage,
          timestamp: new Date().toISOString(),
          ...responseData,
        },
      ]);
    } catch (error) {
      console.error("Error calling FastAPI:", error);
      setErrors((prev) => [
        ...prev,
        {
          event_type: "ERROR",
          timestamp: new Date().toISOString(),
          event_id: Math.random().toString(),
          message: error instanceof Error ? error.message : "Failed to process query",
          code: "API_ERROR",
        },
      ]);
    }
  };

  const handleChipClick = (chipText: string) => {
    const existingChip = activeChips.find((chip) => chip.text === chipText);
    if (existingChip) {
      setOpenDropdownId(openDropdownId === existingChip.id ? null : existingChip.id);
    } else {
      const newChip: Chip = {
        id: `chip-${Date.now()}-${Math.random()}`,
        text: chipText,
      };
      setActiveChips((prev) => [...prev, newChip]);
      setOpenDropdownId(newChip.id);
      setShowPlaceholder(false);
    }
  };

  const handleRemoveChip = (chipId: string) => {
    setActiveChips((prev) => prev.filter((chip) => chip.id !== chipId));
    if (openDropdownId === chipId) {
      setOpenDropdownId(null);
    }
    if (activeChips.length === 1 && composerValue.trim() === "") {
      setShowPlaceholder(true);
    }
  };

  const handleOpenLivePinModal = () => {
    setIsLivePinModalOpen(true);
  };

  const handleCloseLivePinModal = () => {
    setIsLivePinModalOpen(false);
  };

  const handleAddToLivePins = () => {
    toast.success("Live pin tracker added for Amazon");
    setIsLivePinModalOpen(false);
  };

  const handleOpenCreateWatchModal = () => {
    setIsCreateWatchModalOpen(true);
  };

  const handleCloseCreateWatchModal = () => {
    setIsCreateWatchModalOpen(false);
  };

  const handleCreateWatch = () => {
    setIsCreateWatchModalOpen(false);
  };

  const handleOpenCreateTemplateModal = () => {
    setIsCreateTemplateModalOpen(true);
  };

  const handleCloseCreateTemplateModal = () => {
    setIsCreateTemplateModalOpen(false);
  };

  const handleSaveAndDownload = (name: string, description: string) => {
    const dummyData = [
      ["Account", "Balance", "Status", "Date"],
      ["AR-001", "$125,000.00", "Open", "2024-01-15"],
      ["AR-002", "$85,500.00", "Open", "2024-01-16"],
      ["AR-003", "$234,200.00", "Closed", "2024-01-17"],
      ["AR-004", "$67,800.00", "Open", "2024-01-18"],
      ["AR-005", "$156,900.00", "Open", "2024-01-19"],
    ];

    const csvContent = dummyData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const sanitizedName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const fileName = `${sanitizedName}_recon.xlsx`;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setDownloadedFileName(fileName);
    setIsCreateTemplateModalOpen(false);
    setIsTemplateCreatedModalOpen(true);
  };

  const handleCloseTemplateCreatedModal = () => {
    setIsTemplateCreatedModalOpen(false);
    setDownloadedFileName("");
  };

  // ==================== Render ====================

  // Show 403 if session from URL doesn't belong to this user
  if (sessionRestoreStatus === "denied") {
    return <PageForbidden />;
  }

  // Show loading state while restoring session from URL
  if (initialSessionId && sessionRestoreStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0A3B77]" />
          <p className="text-sm text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CommandCenter
        loadingState={loadingState}
        composerValue={composerValue}
        isLoading={isLoading}
        isConnected={isConnected}
        activeChips={activeChips}
        openDropdownId={openDropdownId}
        showPlaceholder={showPlaceholder}
        showFinancialResults={showFinancialResults}
        messages={messages}
        errors={errors}
        streamingEvents={currentStreamingEvents}
        currentStreamingMessage={currentMessage}
        onComposerChange={handleTextareaChange}
        onComposerFocus={handleTextareaFocus}
        onComposerBlur={handleTextareaBlur}
        onSendClick={handleSendClick}
        onChipClick={handleChipClick}
        onRemoveChip={handleRemoveChip}
        onDropdownToggle={setOpenDropdownId}
        onTestUI={() => setShowFinancialResults(true)}
        onOpenLivePinModal={handleOpenLivePinModal}
        onOpenCreateWatchModal={handleOpenCreateWatchModal}
        onOpenCreateTemplateModal={handleOpenCreateTemplateModal}
        messagesEndRef={messagesEndRef}
        // Session management props
        onNewChat={handleNewChat}
        onCancelQuery={handleCancelQuery}
        chatSessions={chatSessions}
        activeSessionId={activeSessionId}
        onSessionClick={handleSessionClick}
        isLoadingSessions={isLoadingSessions}
        sessionsLoadFailed={sessionsLoadFailed}
        onRetrySessions={loadSessions}
      />

      <LivePinModal
        open={isLivePinModalOpen}
        onClose={handleCloseLivePinModal}
        onAddToLivePins={handleAddToLivePins}
      />

      <CreateWatchModal
        open={isCreateWatchModalOpen}
        onClose={handleCloseCreateWatchModal}
        onSuccess={handleCreateWatch}
        entityId="amazon-001"
        entityName="Amazon"
        params={{ status: "Open", prompt: composerValue }}
        invoiceData={[]}
      />

      <CreateTemplateModal
        open={isCreateTemplateModalOpen}
        onClose={handleCloseCreateTemplateModal}
        onSaveAndDownload={handleSaveAndDownload}
      />

      <TemplateCreatedModal
        open={isTemplateCreatedModalOpen}
        onClose={handleCloseTemplateCreatedModal}
        fileName={downloadedFileName}
      />
    </>
  );
}
