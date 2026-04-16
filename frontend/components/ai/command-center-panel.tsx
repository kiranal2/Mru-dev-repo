"use client";

import React, { useRef, useEffect } from "react";
import { RotateCcw, Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useEmbeddedCommandCenter,
  EmbeddedMessage,
} from "@/hooks/use-embedded-command-center";
import {
  SuggestedPrompt,
  getPromptsForContext,
} from "@/components/ai/suggested-prompts-config";

// ─── Streaming event label helper ─────────────────────────────────
function eventLabel(eventType: string): string {
  switch (eventType) {
    case "thinking_start":
    case "thinking":
      return "Thinking";
    case "agent_delegation":
    case "delegation":
      return "Delegating to agent";
    case "mcp_tool_call":
    case "tool_start":
      return "Running tool";
    case "agent_finish":
      return "Agent finished";
    default:
      return eventType.replace(/_/g, " ");
  }
}

// ─── Props ────────────────────────────────────────────────────────
interface CommandCenterPanelProps {
  workbenchContext: string;
  suggestedPrompts?: SuggestedPrompt[];
  isOpen: boolean;
  onClose: () => void;
  theme?: "light" | "dark";
  className?: string;
}

// ─── Message bubble (matches StandardFluxAiPanel style) ───────────
function MessageBubble({ message }: { message: EmbeddedMessage }) {
  const isUser = message.role === "user";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0",
            isUser ? "bg-primary text-white" : "bg-primary/90 text-white"
          )}
        >
          {isUser ? "Q" : <Sparkles className="h-3.5 w-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          {message.isStreaming ? (
            <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI is analyzing</p>
              {message.streamingEvents && message.streamingEvents.length > 0 ? (
                message.streamingEvents.slice(-3).map((evt, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span>{eventLabel(evt.event_type)}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-xs text-slate-500">{message.content}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">{message.content}</p>
              {message.financialData?.follow_up_prompts && message.financialData.follow_up_prompts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {message.financialData.follow_up_prompts.slice(0, 3).map((fp, i) => (
                    <span
                      key={i}
                      className="inline-block text-[10px] px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      {fp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel Component ─────────────────────────────────────────
export function CommandCenterPanel({
  workbenchContext,
  suggestedPrompts,
  isOpen,
  onClose,
  theme = "light",
  className,
}: CommandCenterPanelProps) {
  const prompts = suggestedPrompts || getPromptsForContext(workbenchContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    composerValue,
    setComposerValue,
    isLoading,
    sendMessage,
    clearChat,
  } = useEmbeddedCommandCenter({ workbenchContext });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Render empty shell when closed
  if (!isOpen) {
    return <div className="flex flex-col h-full" />;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (prompt: SuggestedPrompt) => {
    sendMessage(prompt.prompt);
  };

  return (
    <div
      className={cn("flex flex-col h-full min-h-0 overflow-hidden bg-white", className)}
    >
      {/* ── Header (matches StandardFluxAiPanel) ── */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-semibold text-slate-900">AI Analysis</h3>
          </div>
          <button
            type="button"
            onClick={() => { clearChat(); }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Chat
          </button>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Empty state */}
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-3 rounded-full bg-slate-100 p-3">
                <Sparkles className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">Ask a question or click a row to scope the AI</p>
            </div>

            {/* Suggested prompts */}
            {prompts.length > 0 && (
              <div className="space-y-1.5">
                <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 -mx-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Suggestions
                </div>
                {prompts.slice(0, 5).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(p)}
                    className={cn(
                      "w-full text-left text-xs font-medium text-slate-700 px-3 py-2 transition-colors hover:bg-slate-50 rounded-md",
                      i > 0 && "border-t border-slate-50"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area (matches StandardFluxAiPanel) ── */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={composerValue}
            onChange={(e) => setComposerValue(e.target.value)}
            placeholder={isLoading ? "AI is analyzing your request..." : "Ask: Explain AR increase and cash impact"}
            disabled={isLoading}
            className="min-h-[60px] resize-none border-2 border-slate-200 bg-white text-sm focus-visible:ring-primary"
            onKeyDown={handleKeyDown}
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90"
            onClick={() => sendMessage()}
            disabled={isLoading || !composerValue.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick suggestion chips when there are messages */}
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {prompts.slice(0, 3).map((p, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(p)}
                disabled={isLoading}
                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
