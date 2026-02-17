"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { StreamingEvent, QueryResult, ConnectionStatus } from "@/lib/streaming-types";

interface UseStreamingQueryOptions {
  userId?: string; // User ID to include in requests for episodic memory
}

interface UseStreamingQueryReturn {
  // State
  events: StreamingEvent[];
  result: QueryResult | null;
  isLoading: boolean;
  isFetchingResult: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  currentMessage: string;
  currentQueryId: string | null;
  currentThreadId: string | null;
  currentSessionId: string | null;

  // Actions
  sendQuery: (prompt: string) => void;
  cancelQuery: () => Promise<void>;
  clearEvents: () => void;
  clearConversation: () => void;
  restoreSession: (sessionId: string, threadId: string) => void;
  fetchResult: (queryId: string, threadId?: string) => Promise<QueryResult | null>;
}

export function useStreamingQuery(options: UseStreamingQueryOptions = {}): UseStreamingQueryReturn {
  const { userId } = options;
  const [events, setEvents] = useState<StreamingEvent[]>([]);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingResult, setIsFetchingResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  // Track whether the next query should be a new session
  const isNewSessionRef = useRef<boolean>(true);
  // Track query_id via ref for cancel (avoids stale closure issues)
  const queryIdForCancelRef = useRef<string | null>(null);

  // Cleanup: abort any active SSE stream when the component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const fetchResult = useCallback(
    async (queryId: string, threadId?: string): Promise<QueryResult | null> => {
      console.log(`📥 Fetching result for query: ${queryId}, thread: ${threadId || "none"}`);
      setIsFetchingResult(true);

      try {
        // Include thread_id as query parameter if available
        const url = threadId
          ? `/api/query/${queryId}/result?thread_id=${threadId}`
          : `/api/query/${queryId}/result`;

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Query result not found or expired");
          }
          throw new Error(`Failed to fetch result: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ Result fetched successfully:", queryId);
        console.log("📦 Full API response:", JSON.stringify(data).substring(0, 500));

        // Transform API response format to expected QueryResult format
        // The /query/{id}/result endpoint returns:
        //   { results: [{ domain, query_type, result: { status, meta, preview_data_rows } }] }
        // But the frontend expects:
        //   { tool_results: [{ type: "table", success: true, agent_name, data: { meta, preview_data_rows } }] }
        let toolResults = data.tool_results || [];

        if (
          (!toolResults || toolResults.length === 0) &&
          data.results &&
          Array.isArray(data.results)
        ) {
          toolResults = data.results
            .filter((item: any) => item.result && item.result.meta && item.result.preview_data_rows)
            .map((item: any) => ({
              type: "table",
              success: item.result?.status === "success",
              agent_name: item.query_type || item.domain || "result",
              data: {
                meta: item.result.meta,
                preview_data_rows: item.result.preview_data_rows,
                tool_type: item.query_type,
                tool_response_type: "TABLE_PREVIEW",
              },
            }));
          console.log(
            "🔄 Transformed",
            data.results.length,
            "results into",
            toolResults.length,
            "tool_results"
          );
        }

        return {
          success: data.success ?? true,
          data_analysis: data.data_analysis || data.synthesized_results || "",
          recommendations: data.recommendations || [],
          next_steps: data.next_steps || [],
          tool_results: toolResults,
        };
      } catch (err) {
        console.error("❌ Failed to fetch result:", err);
        throw err;
      } finally {
        setIsFetchingResult(false);
      }
    },
    []
  );

  const processSSELine = useCallback(
    async (line: string) => {
      // SSE format: "data: {...}" or "event: eventType"
      if (!line.startsWith("data: ")) {
        return;
      }

      const jsonStr = line.slice(6); // Remove "data: " prefix
      if (!jsonStr || jsonStr === "[DONE]") {
        return;
      }

      try {
        const data: StreamingEvent = JSON.parse(jsonStr);
        console.log("📨 Received SSE event:", data.event_type, data.message);

        // Skip setting message for 'connected' event - it's just a handshake
        if (data.message && data.event_type !== "connected") {
          setCurrentMessage(data.message);
        }

        switch (data.event_type) {
          case "connected":
            // Capture query_id, session_id, and thread_id from connected event
            console.log("✅ SSE connection established:", data.query_id);
            if (data.query_id) {
              queryIdForCancelRef.current = data.query_id;
              setCurrentQueryId(data.query_id);
            }
            if (data.session_id) {
              console.log("📋 Session ID saved:", data.session_id);
              setCurrentSessionId(data.session_id);
            }
            if (data.thread_id) {
              console.log("🧵 Thread ID saved:", data.thread_id);
              setCurrentThreadId(data.thread_id);
            }
            // Mark that we're no longer in "new session" mode
            isNewSessionRef.current = false;
            break;

          case "thinking_start":
          case "thinking":
          case "agent_delegation":
          case "delegation":
          case "mcp_tool_call":
          case "tool_start":
            setEvents((prev) => [...prev, data]);
            break;

          case "agent_finish":
            setEvents((prev) => [...prev, data]);
            break;

          case "query_complete":
            setEvents((prev) => [...prev, data]);

            console.log("📝 query_complete FULL EVENT:", JSON.stringify(data).substring(0, 500));

            const queryId = data.query_id;
            const threadId = data.thread_id || currentThreadId;
            const sseDataAnalysis = data.data_analysis || (data as any).data?.data_analysis || "";

            console.log("📝 query_complete - query_id:", queryId, "thread_id:", threadId);
            console.log(
              "📝 SSE data_analysis:",
              sseDataAnalysis ? sseDataAnalysis.substring(0, 100) + "..." : "(empty)"
            );

            // Add a delay so user can see the final streaming message before results load
            await new Promise((resolve) => setTimeout(resolve, 1500));

            if (queryId) {
              setCurrentQueryId(queryId);
              setCurrentMessage("📥 Fetching results...");

              try {
                const queryResult = await fetchResult(queryId, threadId || undefined);
                console.log("🎯 queryResult received:", !!queryResult);

                const mergedResult: QueryResult = {
                  success: queryResult?.success ?? true,
                  data_analysis: sseDataAnalysis || queryResult?.data_analysis || "",
                  recommendations: queryResult?.recommendations || [],
                  next_steps: queryResult?.next_steps || [],
                  tool_results: queryResult?.tool_results || [],
                };

                const hasTableData =
                  mergedResult.tool_results &&
                  mergedResult.tool_results.length > 0 &&
                  mergedResult.tool_results.some(
                    (tr: any) =>
                      tr.data?.preview_data_rows?.length > 0 || tr.data?.meta?.total_row_count > 0
                  );

                console.log("🎯 Has table data:", hasTableData);
                console.log(
                  "🎯 Final data_analysis:",
                  mergedResult.data_analysis ? "present" : "empty"
                );

                setResult(mergedResult);
              } catch (fetchError) {
                console.error("🔴 Fetch error:", fetchError);
                if (sseDataAnalysis) {
                  setResult({
                    success: true,
                    data_analysis: sseDataAnalysis,
                    recommendations: [],
                    next_steps: [],
                    tool_results: [],
                  });
                } else {
                  setError(
                    fetchError instanceof Error ? fetchError.message : "Failed to fetch results"
                  );
                }
              }
            }

            setIsLoading(false);
            setConnectionStatus("disconnected");
            break;

          case "final_result":
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setResult(data.data);
            setIsLoading(false);
            setConnectionStatus("disconnected");
            break;

          case "error":
            setError(data.message);
            setIsLoading(false);
            setConnectionStatus("error");
            setEvents((prev) => [...prev, data]);
            break;

          case "cancelled":
            setCurrentMessage("Query cancelled");
            setIsLoading(false);
            setConnectionStatus("disconnected");
            setEvents((prev) => [...prev, data]);
            break;

          default:
            setEvents((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error("Failed to parse SSE message:", e, "Line:", line);
      }
    },
    [fetchResult, currentThreadId]
  );

  const sendQuery = useCallback(
    async (prompt: string) => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setEvents([]);
      setResult(null);
      setError(null);
      setIsLoading(true);
      setIsFetchingResult(false);
      setCurrentMessage("");
      setCurrentQueryId(null);
      queryIdForCancelRef.current = null;
      setConnectionStatus("connecting");

      const hardcodedUserId = "user_12345";

      // Build request body based on session state
      // "query" is required by the Next.js API route validation;
      // "user_prompt" is consumed by the backend SSE endpoint.
      const requestBody: Record<string, any> = {
        query: prompt,
        user_prompt: prompt,
        user_id: hardcodedUserId,
      };

      if (isNewSessionRef.current || !currentThreadId) {
        // New chat: send force_new_session, do NOT send thread_id or session_id
        requestBody.force_new_session = true;
        console.log("🆕 Sending as NEW session (force_new_session: true)");
      } else {
        // Follow-up: send thread_id, do NOT send force_new_session
        requestBody.thread_id = currentThreadId;
        console.log("🔄 Sending as FOLLOW-UP (thread_id:", currentThreadId, ")");
      }

      try {
        const response = await fetch("/api/sse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }

        setConnectionStatus("connected");
        console.log("✅ SSE connection established");

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body reader available");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("📭 SSE stream ended");
            if (buffer.trim()) {
              const lines = buffer.split("\n");
              for (const line of lines) {
                if (line.trim()) {
                  await processSSELine(line);
                }
              }
            }
            setConnectionStatus("disconnected");
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              await processSSELine(line);
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log("🛑 SSE request aborted");
          return;
        }

        console.error("❌ SSE error:", err);
        setError(err instanceof Error ? err.message : "Connection failed");
        setConnectionStatus("error");
        setIsLoading(false);
      }
    },
    [processSSELine, currentThreadId, userId]
  );

  // Cancel the active query - sends POST /sse/cancel/{query_id} and aborts connection
  const cancelQuery = useCallback(async () => {
    // const qId = queryIdForCancelRef.current;
    // if (qId) {
    //   try {
    //     const { apiBaseiUrl } = await loadRuntimeConfig();
    //     await fetch(`${apiBaseiUrl}/sse/cancel/${qId}`, { method: "POST" });
    //     console.log("🛑 Cancel request sent for query:", qId);
    //   } catch (err) {
    //     console.error("Failed to send cancel request:", err);
    //   }
    //   queryIdForCancelRef.current = null;
    // }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setConnectionStatus("disconnected");
    setCurrentMessage("Query cancelled");
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setResult(null);
    setError(null);
    setCurrentMessage("");
    setCurrentQueryId(null);
    queryIdForCancelRef.current = null;
    // Note: Don't clear thread_id - preserves conversation context
  }, []);

  // Clear conversation context to start a fresh conversation
  const clearConversation = useCallback(() => {
    setEvents([]);
    setResult(null);
    setError(null);
    setCurrentMessage("");
    setCurrentQueryId(null);
    setCurrentThreadId(null);
    setCurrentSessionId(null);
    queryIdForCancelRef.current = null;
    isNewSessionRef.current = true; // Next query will use force_new_session
    console.log("🔄 Conversation cleared - next query will start a new session");
  }, []);

  // Restore a previous session (when clicking a sidebar session)
  const restoreSession = useCallback((sessionId: string, threadId: string) => {
    setCurrentSessionId(sessionId);
    setCurrentThreadId(threadId);
    isNewSessionRef.current = false; // Follow-ups in this session use thread_id
    setEvents([]);
    setResult(null);
    setError(null);
    setCurrentMessage("");
    setCurrentQueryId(null);
    queryIdForCancelRef.current = null;
    console.log("🔄 Session restored - session:", sessionId, "thread:", threadId);
  }, []);

  return {
    events,
    result,
    isLoading,
    isFetchingResult,
    error,
    connectionStatus,
    currentMessage,
    currentQueryId,
    currentThreadId,
    currentSessionId,
    sendQuery,
    cancelQuery,
    clearEvents,
    clearConversation,
    restoreSession,
    fetchResult,
  };
}
