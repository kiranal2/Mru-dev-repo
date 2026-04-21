"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  RotateCcw,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type AiResponsePayload, normalizeAiResponse } from "@/lib/derive-chat-actions";

interface AiMessage {
  role: "user" | "ai";
  text: string;
}

export type AiFeedTone = "up" | "down" | "warn" | "info";

export interface AiFeedItem {
  id: string;
  tone: AiFeedTone;
  headline: string;
  detail: string;
  timestamp?: string;
}

const FEED_TONE_META: Record<
  AiFeedTone,
  { icon: typeof Sparkles; dotCls: string; bgCls: string }
> = {
  up: { icon: TrendingUp, dotCls: "bg-emerald-500", bgCls: "bg-emerald-50 text-emerald-700" },
  down: { icon: TrendingDown, dotCls: "bg-red-500", bgCls: "bg-red-50 text-red-700" },
  warn: { icon: AlertTriangle, dotCls: "bg-amber-500", bgCls: "bg-amber-50 text-amber-700" },
  info: { icon: Info, dotCls: "bg-blue-500", bgCls: "bg-blue-50 text-blue-700" },
};

interface WorkbenchAiPanelProps {
  title?: string;
  suggestions: string[];
  /** External message list — if provided, the panel is "controlled" */
  messages?: AiMessage[];
  /** Called when the user sends a prompt */
  onAsk?: (prompt: string) => void;
  /** Called when "New Chat" is clicked */
  onNewChat?: () => void;
  /**
   * If provided, generates the AI response internally (uncontrolled mode).
   * Returning a `AiResponsePayload` lets the page emit explicit action cards;
   * returning a plain string falls back to keyword-derived actions.
   */
  generateResponse?: (prompt: string) => string | AiResponsePayload;
  /** Called with the full response payload after it's rendered. Used to drive adaptive UI. */
  onAiResponse?: (payload: AiResponsePayload) => void;
  /** Default feed of insights shown in empty state (before user chats). */
  feedItems?: AiFeedItem[];
  /** Optional adaptive-UI strip rendered directly above the chat input. */
  actionStrip?: React.ReactNode;
}

export function WorkbenchAiPanel({
  title = "AI Analysis",
  suggestions,
  messages: controlledMessages,
  onAsk,
  onNewChat,
  generateResponse,
  onAiResponse,
  feedItems = [],
  actionStrip,
}: WorkbenchAiPanelProps) {
  const [internalMessages, setInternalMessages] = useState<AiMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [feedCollapsed, setFeedCollapsed] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = controlledMessages ?? internalMessages;
  const hasConversation = messages.length > 0 || isTyping;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  const handleAsk = useCallback(
    (text?: string) => {
      const q = (text ?? prompt).trim();
      if (!q || isTyping) return;
      setPrompt("");

      if (onAsk) {
        onAsk(q);
        return;
      }

      // Uncontrolled mode — manage messages internally
      setInternalMessages((prev) => [...prev, { role: "user", text: q }]);
      setIsTyping(true);
      scrollToBottom();

      if (typingRef.current) clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => {
        const raw = generateResponse
          ? generateResponse(q)
          : `Analysis for "${q}" is being processed. This is a demo response.`;
        const payload = normalizeAiResponse(raw);
        setInternalMessages((prev) => [...prev, { role: "ai", text: payload.text }]);
        setIsTyping(false);
        scrollToBottom();
        onAiResponse?.(payload);
      }, 800);
    },
    [prompt, isTyping, onAsk, generateResponse, scrollToBottom, onAiResponse]
  );

  const handleNewChat = useCallback(() => {
    setInternalMessages([]);
    setPrompt("");
    setIsTyping(false);
    if (typingRef.current) clearTimeout(typingRef.current);
    onNewChat?.();
    onAiResponse?.({ text: "" });
  }, [onNewChat, onAiResponse]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="h-full overflow-hidden bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Chat
          </button>
        </div>
      </div>

      {/* Messages / Empty state */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" ref={messagesRef}>
        {!hasConversation ? (
          <div className="space-y-4">
            {/* Feed of live insights (default feed before user chats) */}
            {feedItems.length > 0 && (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setFeedCollapsed((v) => !v)}
                  className="flex w-full items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2 -mx-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100 transition-colors"
                  aria-expanded={!feedCollapsed}
                  aria-controls="ai-insights-feed"
                >
                  <span>Insights feed</span>
                  {feedCollapsed ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>
                {!feedCollapsed && (
                <div id="ai-insights-feed" className="space-y-1.5">
                  {feedItems.map((item) => {
                    const meta = FEED_TONE_META[item.tone];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2 hover:border-slate-200 transition-colors"
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                            meta.bgCls,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className="text-[12px] font-semibold text-slate-800 truncate">
                              {item.headline}
                            </p>
                            {item.timestamp && (
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {item.timestamp}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}

            {/* Empty state prompt (only when no feed) */}
            {feedItems.length === 0 && (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="mb-3 rounded-full bg-slate-100 p-3">
                  <Sparkles className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500">Ask a question or click a row to scope the AI</p>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 -mx-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Suggestions
                </div>
                {suggestions.slice(0, 6).map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAsk(s)}
                    className={cn(
                      "w-full text-left text-xs font-medium text-slate-700 px-3 py-2 transition-colors hover:bg-slate-50 rounded-md",
                      i > 0 && "border-t border-slate-50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex items-start gap-2", msg.role === "ai" && "mt-1")}>
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                    msg.role === "user" ? "bg-primary" : "bg-primary/90"
                  )}
                >
                  {msg.role === "user" ? "Q" : <Sparkles className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  {msg.role === "user" ? (
                    <p className="text-sm font-semibold text-slate-800">{msg.text}</p>
                  ) : (
                    <div
                      className="text-sm leading-6 text-slate-700 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_.uf-sig-list]:mt-2 [&_.uf-sig-list]:space-y-1 [&_.uf-sig-item]:flex [&_.uf-sig-item]:items-start [&_.uf-sig-item]:gap-2 [&_.uf-sig-item]:text-xs [&_.uf-sig-dot]:mt-1.5 [&_.uf-sig-dot]:h-2 [&_.uf-sig-dot]:w-2 [&_.uf-sig-dot]:shrink-0 [&_.uf-sig-dot]:rounded-full"
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/90 text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI is analyzing</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adaptive-UI action strip — sits directly above the chat input */}
      {actionStrip && (
        <div className="shrink-0">
          {actionStrip}
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isTyping ? "AI is analyzing..." : "Ask about this workbench..."}
            disabled={isTyping}
            className="min-h-[60px] resize-none border-slate-200 bg-white text-sm focus-visible:ring-primary"
            onKeyDown={handleKeyDown}
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90"
            onClick={() => handleAsk()}
            disabled={isTyping || !prompt.trim()}
          >
            {isTyping ? (
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse [animation-delay:0.3s]" />
              </div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
