"use client";

import React, { useRef, useEffect } from "react";
import { X, Sparkles, Send, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

// ─── Message bubble ───────────────────────────────────────────────
function MessageBubble({
  message,
  theme,
}: {
  message: EmbeddedMessage;
  theme: "light" | "dark";
}) {
  const isUser = message.role === "user";
  const isDark = theme === "dark";

  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0",
          isUser
            ? isDark
              ? "bg-amber-500/20 text-amber-400"
              : "bg-primary/10 text-primary"
            : isDark
              ? "bg-white/10 text-amber-400"
              : "bg-slate-100 text-primary"
        )}
      >
        {isUser ? "U" : "✦"}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser ? "text-right" : "text-left")}>
        <div
          className={cn(
            "inline-block rounded-lg px-3 py-2 text-[11px] leading-relaxed max-w-[90%] text-left",
            isUser
              ? isDark
                ? "bg-amber-500/15 text-amber-100"
                : "bg-primary/10 text-slate-800"
              : isDark
                ? "bg-white/5 text-slate-200"
                : "bg-slate-50 text-slate-700"
          )}
        >
          {message.isStreaming ? (
            <div className="space-y-1">
              {/* Show streaming events */}
              {message.streamingEvents && message.streamingEvents.length > 0 ? (
                <div className="space-y-0.5">
                  {message.streamingEvents.slice(-3).map((evt, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-1.5 text-[10px]",
                        isDark ? "text-slate-400" : "text-slate-500"
                      )}
                    >
                      <div
                        className={cn(
                          "w-1 h-1 rounded-full animate-pulse",
                          isDark ? "bg-amber-400" : "bg-primary"
                        )}
                      />
                      <span>{eventLabel(evt.event_type)}</span>
                      {evt.message && (
                        <span className="truncate opacity-70">
                          — {evt.message.substring(0, 60)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Loader2
                    className={cn(
                      "w-3 h-3 animate-spin",
                      isDark ? "text-amber-400" : "text-primary"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px]",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    {message.content}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {/* Follow-up prompts from result */}
        {!message.isStreaming &&
          message.financialData?.follow_up_prompts &&
          message.financialData.follow_up_prompts.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {message.financialData.follow_up_prompts.slice(0, 3).map((fp, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-block text-[9px] px-2 py-0.5 rounded-full cursor-pointer transition-colors",
                    isDark
                      ? "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-amber-300"
                      : "bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  {fp}
                </span>
              ))}
            </div>
          )}
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
  const isDark = theme === "dark";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    composerValue,
    setComposerValue,
    isLoading,
    sendMessage,
    clearChat,
  } = useEmbeddedCommandCenter({ workbenchContext });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      className={cn(
        "flex flex-col h-full overflow-hidden",
        isDark
          ? "bg-[#0C1E2A]/95 border-l border-white/10"
          : "bg-white border-l border-slate-200",
        className
      )}
    >
      {/* ── Header ── */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 border-b shrink-0",
          isDark ? "border-white/10" : "border-slate-200"
        )}
      >
        <div
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center",
            isDark ? "bg-amber-500/20" : "bg-primary/10"
          )}
        >
          <Sparkles
            className={cn(
              "w-3.5 h-3.5",
              isDark ? "text-amber-400" : "text-primary"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "text-xs font-semibold",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            AI Query
          </div>
          <div
            className={cn(
              "text-[10px]",
              isDark ? "text-slate-400" : "text-slate-500"
            )}
          >
            Ask anything about this view
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className={cn(
              "p-1 rounded transition-colors",
              isDark
                ? "hover:bg-white/10 text-slate-400"
                : "hover:bg-slate-100 text-slate-400"
            )}
            title="Clear chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onClose}
          className={cn(
            "p-1 rounded transition-colors",
            isDark
              ? "hover:bg-white/10 text-slate-400"
              : "hover:bg-slate-100 text-slate-400"
          )}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="space-y-3">
            {/* Welcome */}
            <div
              className={cn(
                "text-center py-4",
                isDark ? "text-slate-400" : "text-slate-500"
              )}
            >
              <Sparkles
                className={cn(
                  "w-8 h-8 mx-auto mb-2 opacity-40",
                  isDark ? "text-amber-400" : "text-primary"
                )}
              />
              <p className="text-[11px] font-medium">Finance Command Center</p>
              <p className="text-[10px] mt-0.5 opacity-70">
                Ask questions, get insights, take action
              </p>
            </div>

            {/* Suggested prompts */}
            <div className="space-y-1">
              <div
                className={cn(
                  "text-[9px] font-medium uppercase tracking-wider px-1",
                  isDark ? "text-slate-500" : "text-slate-400"
                )}
              >
                Suggested
              </div>
              {prompts.slice(0, 5).map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(p)}
                  className={cn(
                    "w-full text-left text-[11px] px-2.5 py-2 rounded-md transition-colors",
                    isDark
                      ? "text-slate-300 hover:bg-white/5 hover:text-amber-300"
                      : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} theme={theme} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div
        className={cn(
          "shrink-0 border-t px-3 py-2",
          isDark ? "border-white/10" : "border-slate-200"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md border",
            isDark
              ? "border-white/10 bg-white/5"
              : "border-slate-200 bg-slate-50"
          )}
        >
          <input
            type="text"
            value={composerValue}
            onChange={(e) => setComposerValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any data or signal..."
            disabled={isLoading}
            className={cn(
              "flex-1 bg-transparent border-none outline-none text-[11px] px-2.5 py-2",
              isDark
                ? "text-slate-200 placeholder:text-slate-500"
                : "text-slate-800 placeholder:text-slate-400"
            )}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !composerValue.trim()}
            className={cn(
              "p-1.5 rounded-md mr-0.5 transition-colors",
              isDark
                ? "text-amber-400 hover:bg-amber-500/20 disabled:text-slate-600"
                : "text-primary hover:bg-primary/10 disabled:text-slate-300"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Quick suggestion chips when there are messages */}
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {prompts.slice(0, 3).map((p, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(p)}
                disabled={isLoading}
                className={cn(
                  "text-[9px] px-2 py-0.5 rounded-full transition-colors",
                  isDark
                    ? "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-amber-300"
                    : "bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary",
                  "disabled:opacity-50"
                )}
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
