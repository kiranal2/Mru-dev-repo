"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useStreamingQuery } from "@/hooks/use-streaming-query";
import { StreamingEvent, QueryResult } from "@/lib/streaming-types";

export interface EmbeddedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  streamingEvents?: StreamingEvent[];
  financialData?: QueryResult | null;
}

interface UseEmbeddedCommandCenterOptions {
  workbenchContext: string;
}

interface UseEmbeddedCommandCenterReturn {
  messages: EmbeddedMessage[];
  composerValue: string;
  setComposerValue: (value: string) => void;
  isLoading: boolean;
  connectionStatus: string;
  currentMessage: string;
  streamingEvents: StreamingEvent[];
  sendMessage: (text?: string) => void;
  clearChat: () => void;
}

export function useEmbeddedCommandCenter(
  options: UseEmbeddedCommandCenterOptions
): UseEmbeddedCommandCenterReturn {
  const { workbenchContext } = options;

  const [messages, setMessages] = useState<EmbeddedMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const messageIdCounter = useRef(0);

  const {
    events,
    result,
    isLoading,
    error,
    connectionStatus,
    currentMessage,
    sendQuery,
    clearConversation,
  } = useStreamingQuery();

  // Track which message is waiting for a result
  const pendingAssistantIdRef = useRef<string | null>(null);

  // When streaming result arrives, attach it to the pending assistant message
  useEffect(() => {
    if (result && pendingAssistantIdRef.current) {
      const assistantId = pendingAssistantIdRef.current;
      pendingAssistantIdRef.current = null;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: result.data_analysis || "Analysis complete.",
                isStreaming: false,
                financialData: result,
              }
            : msg
        )
      );
    }
  }, [result]);

  // Update streaming message with current progress
  useEffect(() => {
    if (currentMessage && pendingAssistantIdRef.current) {
      const assistantId = pendingAssistantIdRef.current;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId && msg.isStreaming
            ? { ...msg, content: currentMessage, streamingEvents: events }
            : msg
        )
      );
    }
  }, [currentMessage, events]);

  // Handle errors
  useEffect(() => {
    if (error && pendingAssistantIdRef.current) {
      const assistantId = pendingAssistantIdRef.current;
      pendingAssistantIdRef.current = null;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: `Error: ${error}`,
                isStreaming: false,
              }
            : msg
        )
      );
    }
  }, [error]);

  const sendMessage = useCallback(
    (text?: string) => {
      const messageText = (text || composerValue).trim();
      if (!messageText) return;

      // Create user message
      const userId = `msg-${++messageIdCounter.current}`;
      const userMessage: EmbeddedMessage = {
        id: userId,
        role: "user",
        content: messageText,
        timestamp: new Date().toISOString(),
      };

      // Create placeholder assistant message
      const assistantId = `msg-${++messageIdCounter.current}`;
      const assistantMessage: EmbeddedMessage = {
        id: assistantId,
        role: "assistant",
        content: "Analyzing...",
        timestamp: new Date().toISOString(),
        isStreaming: true,
        streamingEvents: [],
      };

      pendingAssistantIdRef.current = assistantId;
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setComposerValue("");

      // Prepend workbench context to the query
      const contextualPrompt = `[Context: ${workbenchContext}] ${messageText}`;
      sendQuery(contextualPrompt);
    },
    [composerValue, workbenchContext, sendQuery]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setComposerValue("");
    pendingAssistantIdRef.current = null;
    clearConversation();
  }, [clearConversation]);

  return {
    messages,
    composerValue,
    setComposerValue,
    isLoading,
    connectionStatus,
    currentMessage,
    streamingEvents: events,
    sendMessage,
    clearChat,
  };
}
