"use client";

import {
  AlertTriangle,
  Info,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FluxRow, AiResponse, PromptSuggestion } from "@/lib/data/types/flux-analysis";
import { metricToneClass } from "@/app/(main)/reports/analysis/flux-analysis/helpers";
import type { AiFeedItem, AiFeedTone } from "@/components/shared/workbench-ai-panel";

const FEED_TONE_META: Record<
  AiFeedTone,
  { icon: typeof Sparkles; bgCls: string }
> = {
  up: { icon: TrendingUp, bgCls: "bg-emerald-50 text-emerald-700" },
  down: { icon: TrendingDown, bgCls: "bg-red-50 text-red-700" },
  warn: { icon: AlertTriangle, bgCls: "bg-amber-50 text-amber-700" },
  info: { icon: Info, bgCls: "bg-blue-50 text-blue-700" },
};

interface StandardFluxAiPanelProps {
  scopedRow: FluxRow | null;
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  aiResponses: AiResponse[];
  aiIsThinking: boolean;
  aiPendingQuestion: string;
  aiThinkingSteps: string[];
  showAutocomplete: boolean;
  autocompleteSuggestions: PromptSuggestion[];
  defaultSuggestions?: PromptSuggestion[];
  feedItems?: AiFeedItem[];
  /** Optional adaptive-UI strip rendered directly above the chat input. */
  actionStrip?: React.ReactNode;
  onAsk: (prompt?: string) => void;
  onSelectSuggestion: (prompt: string) => void;
  onNewChat: () => void;
}

export function StandardFluxAiPanel({
  scopedRow,
  aiPrompt,
  onAiPromptChange,
  aiResponses,
  aiIsThinking,
  aiPendingQuestion,
  aiThinkingSteps,
  showAutocomplete,
  autocompleteSuggestions,
  defaultSuggestions = [],
  feedItems = [],
  actionStrip,
  onAsk,
  onSelectSuggestion,
  onNewChat,
}: StandardFluxAiPanelProps) {
  const hasAiConversation = aiResponses.length > 0 || aiIsThinking;

  // Row-specific quick suggestions
  const rowSuggestions = scopedRow
    ? [
        `Explain ${scopedRow.name} variance drivers`,
        ...(scopedRow.evidence ? [] : [`What evidence supports ${scopedRow.name}?`]),
        ...(scopedRow.status === "Open" ? [`Who should own ${scopedRow.name}?`] : []),
        `What's the risk if ${scopedRow.name} is unresolved?`,
      ]
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAsk();
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-semibold text-slate-900">AI Analysis</h3>
          </div>
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Chat
          </button>
        </div>
      </div>

      {/* Scoped Row Context */}
      {scopedRow && (
        <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2 shrink-0">
          <Target className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-[11px] font-medium text-blue-700">
            Scoped to: {scopedRow.name} ({scopedRow.acct}) — {scopedRow.driver}
          </span>
        </div>
      )}

      {/* Messages area */}
      <div className="p-4 space-y-3">
        {/* Row-specific suggestions */}
        {scopedRow && rowSuggestions.length > 0 && !hasAiConversation && (
          <div className="flex flex-wrap gap-1.5">
            {rowSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onAsk(s)}
                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {!hasAiConversation && !scopedRow ? (
          <div className="space-y-4">
            {/* Insights feed */}
            {feedItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 -mx-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Insights feed
                </div>
                <div className="space-y-1.5">
                  {feedItems.map((item) => {
                    const meta = FEED_TONE_META[item.tone];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2 hover:border-slate-200 transition-colors"
                      >
                        <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md", meta.bgCls)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className="text-[12px] font-semibold text-slate-800 truncate">{item.headline}</p>
                            {item.timestamp && (
                              <span className="text-[10px] text-slate-400 shrink-0">{item.timestamp}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state (only when no feed) */}
            {feedItems.length === 0 && (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="mb-3 rounded-full bg-slate-100 p-3">
                  <Sparkles className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500">Ask a question or click a row to scope the AI</p>
              </div>
            )}

            {/* Default suggestions */}
            {defaultSuggestions.length > 0 && (
              <div className="space-y-1.5">
                <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 -mx-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Suggestions
                </div>
                {defaultSuggestions.slice(0, 5).map((s, i) => (
                  <button
                    key={s.prompt}
                    type="button"
                    onClick={() => onAsk(s.prompt)}
                    className={cn(
                      "w-full text-left text-xs font-medium text-slate-700 px-3 py-2 transition-colors hover:bg-slate-50 rounded-md",
                      i > 0 && "border-t border-slate-50"
                    )}
                  >
                    {s.prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {aiIsThinking ? (
              <div className="animate-fade-slide-up rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">Q</div>
                  <div className="flex-1 text-sm font-semibold text-slate-800">{aiPendingQuestion}</div>
                </div>
                <div className="mt-2 flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/90 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 space-y-1.5 rounded-lg border border-slate-200 bg-white p-2.5" aria-live="polite" aria-busy="true">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI is analyzing</p>
                    {aiThinkingSteps.map((step, idx) => {
                      const isLatest = idx === aiThinkingSteps.length - 1;
                      return (
                        <div key={`${step}-${idx}`} className={cn("text-xs", isLatest ? "font-medium text-slate-700" : "text-slate-500")}>
                          {step}
                          {isLatest ? (
                            <span className="ml-1.5 inline-flex items-center gap-1 align-middle">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 typing-dot-1" />
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 typing-dot-2" />
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 typing-dot-3" />
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {aiResponses.map((response) => (
              <div key={response.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">Q</div>
                  <div className="flex-1 text-sm font-semibold text-slate-800">{response.q}</div>
                </div>
                <div className="mt-2 flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/90 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm leading-6 text-slate-700">{response.summary}</p>
                    {response.matchedPrompt ? (
                      <p className="text-[11px] text-slate-500">Matched saved prompt: {response.matchedPrompt}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5">
                      {response.metrics.map((metric) => (
                        <Badge
                          key={`${response.id}-${metric.label}`}
                          className={cn("border text-[11px] font-semibold", metricToneClass(metric.tone))}
                        >
                          {metric.label}: {metric.value}
                        </Badge>
                      ))}
                    </div>
                    <ul className="space-y-1">
                      {response.bullets.map((bullet, index) => (
                        <li key={`${response.id}-${index}`} className="text-xs text-slate-700">
                          &bull; {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
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
            value={aiPrompt}
            onChange={(e) => onAiPromptChange(e.target.value)}
            placeholder={
              aiIsThinking
                ? "AI is analyzing your request..."
                : scopedRow
                ? `Ask about ${scopedRow.name}...`
                : "Ask: Explain AR increase and cash impact"
            }
            disabled={aiIsThinking}
            className="min-h-[60px] resize-none border-slate-200 bg-white text-sm focus-visible:ring-primary"
            onKeyDown={handleKeyDown}
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90"
            onClick={() => onAsk()}
            disabled={aiIsThinking || !aiPrompt.trim()}
          >
            {aiIsThinking ? (
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-1" />
                <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-2" />
                <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-3" />
              </div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Autocomplete suggestions */}
        {showAutocomplete ? (
          <div className="mt-2 space-y-1.5">
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 -mx-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Suggestions
            </div>
            {autocompleteSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.prompt}
                type="button"
                onClick={() => onSelectSuggestion(suggestion.prompt)}
                className={cn(
                  "w-full text-left text-xs font-medium text-slate-700 px-3 py-2 transition-colors hover:bg-slate-50 rounded-md",
                  index > 0 && "border-t border-slate-50"
                )}
              >
                {suggestion.prompt}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
