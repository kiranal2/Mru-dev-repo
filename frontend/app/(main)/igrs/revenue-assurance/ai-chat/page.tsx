"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useAIChat } from "@/hooks/data/use-igrs-ai-chat";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Brain,
  ChevronRight,
  Lightbulb,
  MessageSquarePlus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  PromptTemplate,
  PromptCategory,
  PromptResponseData,
  InlineChartData,
  PromptCategoryDefinition,
} from "@/lib/data/types/igrs";

// ── Types ────────────────────────────────────────────────────────────────────

interface ConversationMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  data?: PromptResponseData;
  timestamp: string;
}

// ── Fuzzy Matching ───────────────────────────────────────────────────────────

function findBestMatch(input: string, allPrompts: PromptTemplate[]): PromptTemplate | null {
  const normalized = input.toLowerCase().trim();
  const exact = allPrompts.find((p) => p.promptText.toLowerCase() === normalized);
  if (exact) return exact;

  const words = normalized.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return null;

  let best: PromptTemplate | null = null;
  let bestScore = 0;

  for (const p of allPrompts) {
    const pw = p.promptText.toLowerCase().split(/\s+/);
    const score = words.filter((w) => pw.some((x) => x.includes(w))).length / words.length;
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

// ── Inline Chart Renderer ────────────────────────────────────────────────────

function InlineChart({ chart }: { chart: InlineChartData }) {
  if (chart.type === "bar") {
    const maxVal = Math.max(...chart.datasets.flatMap((d) => d.data), 1);
    const barGroupW = 400 / Math.max(chart.labels.length, 1);
    const barW = (barGroupW * 0.6) / Math.max(chart.datasets.length, 1);
    return (
      <svg viewBox="0 0 420 160" className="w-full max-w-md mt-2">
        {chart.labels.map((label, li) => (
          <g key={label}>
            {chart.datasets.map((ds, di) => {
              const h = (ds.data[li] / maxVal) * 110;
              const x = 30 + li * barGroupW + di * barW;
              return (
                <rect key={di} x={x} y={130 - h} width={barW - 2} height={h} fill={ds.color} rx={2} />
              );
            })}
            <text
              x={30 + li * barGroupW + (barGroupW * 0.3) / 2}
              y={148}
              textAnchor="middle"
              className="text-[8px] fill-slate-500"
            >
              {label}
            </text>
          </g>
        ))}
        {chart.datasets.map((ds, di) => (
          <g key={di}>
            <rect x={30 + di * 80} y={2} width={8} height={8} rx={1} fill={ds.color} />
            <text x={42 + di * 80} y={10} className="text-[8px] fill-slate-500">
              {ds.label}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  if (chart.type === "line") {
    const maxVal = Math.max(...chart.datasets.flatMap((d) => d.data), 1);
    const minVal = Math.min(...chart.datasets.flatMap((d) => d.data), 0);
    const rng = maxVal - minVal || 1;
    return (
      <svg viewBox="0 0 420 160" className="w-full max-w-md mt-2">
        {chart.datasets.map((ds, di) => {
          const path = ds.data
            .map((v, i) => {
              const x = 30 + (i / Math.max(ds.data.length - 1, 1)) * 360;
              const y = 130 - ((v - minVal) / rng) * 110;
              return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
          return (
            <g key={di}>
              <path d={path} fill="none" stroke={ds.color} strokeWidth={2} />
              {ds.data.map((v, i) => {
                const x = 30 + (i / Math.max(ds.data.length - 1, 1)) * 360;
                const y = 130 - ((v - minVal) / rng) * 110;
                return <circle key={i} cx={x} cy={y} r={2.5} fill={ds.color} />;
              })}
            </g>
          );
        })}
        {chart.labels.map((label, i) => (
          <text
            key={i}
            x={30 + (i / Math.max(chart.labels.length - 1, 1)) * 360}
            y={148}
            textAnchor="middle"
            className="text-[8px] fill-slate-500"
          >
            {label}
          </text>
        ))}
        {chart.datasets.map((ds, di) => (
          <g key={di}>
            <rect x={30 + di * 80} y={2} width={8} height={8} rx={1} fill={ds.color} />
            <text x={42 + di * 80} y={10} className="text-[8px] fill-slate-500">
              {ds.label}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  if (chart.type === "donut") {
    const total = chart.datasets[0]?.data.reduce((s, v) => s + v, 0) || 1;
    let angle = -90;
    const cx = 80;
    const cy = 80;
    const r = 60;
    const innerR = 35;
    const colors = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

    return (
      <svg viewBox="0 0 250 170" className="w-full max-w-xs mt-2">
        {chart.datasets[0]?.data.map((val, i) => {
          const sliceAngle = (val / total) * 360;
          const startAngle = angle;
          const endAngle = angle + sliceAngle;
          angle = endAngle;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const largeArc = sliceAngle > 180 ? 1 : 0;

          const x1 = cx + r * Math.cos(startRad);
          const y1 = cy + r * Math.sin(startRad);
          const x2 = cx + r * Math.cos(endRad);
          const y2 = cy + r * Math.sin(endRad);
          const ix1 = cx + innerR * Math.cos(startRad);
          const iy1 = cy + innerR * Math.sin(startRad);
          const ix2 = cx + innerR * Math.cos(endRad);
          const iy2 = cy + innerR * Math.sin(endRad);

          const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
          return <path key={i} d={d} fill={colors[i % colors.length]} />;
        })}
        {chart.labels.map((label, i) => (
          <g key={i}>
            <rect x={170} y={20 + i * 18} width={8} height={8} rx={1} fill={colors[i % 6]} />
            <text x={182} y={28 + i * 18} className="text-[8px] fill-slate-600">
              {label}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  return null;
}

// ── AI Message Bubble ────────────────────────────────────────────────────────

function AIBubble({
  msg,
  onFollowUp,
}: {
  msg: ConversationMessage;
  onFollowUp: (text: string) => void;
}) {
  return (
    <div className="flex justify-start gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="rounded-2xl px-4 py-3 max-w-[80%] bg-white border border-slate-200">
        <p className="text-sm text-slate-700 leading-relaxed">{msg.content}</p>

        {/* Inline Table */}
        {msg.data?.inlineTable && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  {msg.data.inlineTable.headers.map((h, hi) => (
                    <th
                      key={hi}
                      className={cn(
                        "text-left px-2 py-1 border-b border-slate-200 font-semibold",
                        msg.data?.inlineTable?.highlightColumn === hi
                          ? "bg-violet-50 text-violet-700"
                          : "text-slate-600"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {msg.data.inlineTable.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn(
                          "px-2 py-1 border-b border-slate-100",
                          msg.data?.inlineTable?.highlightColumn === ci && "bg-violet-50/50 font-medium"
                        )}
                      >
                        {typeof cell === "number" ? cell.toLocaleString("en-IN") : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inline Chart */}
        {msg.data?.inlineChart && <InlineChart chart={msg.data.inlineChart} />}

        {/* Key Insight */}
        {msg.data?.keyInsight && (
          <div className="mt-3 rounded-lg bg-violet-50 border-l-4 border-l-violet-400 p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-800 font-medium">{msg.data.keyInsight}</p>
            </div>
          </div>
        )}

        {/* Follow-up prompts */}
        {msg.data?.followUpPrompts && msg.data.followUpPrompts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {msg.data.followUpPrompts.map((fp, fi) => (
              <button
                key={fi}
                onClick={() => onFollowUp(fp)}
                className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium hover:bg-violet-100 transition-colors"
              >
                {fp}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Category Chip Bar ────────────────────────────────────────────────────────

function CategoryChips({
  categories,
  selected,
  onSelect,
}: {
  categories: PromptCategoryDefinition[];
  selected: PromptCategory | "all";
  onSelect: (cat: PromptCategory | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
          selected === "all"
            ? "bg-violet-600 text-white"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            selected === cat.id ? "text-white" : "text-slate-600 hover:bg-slate-200"
          )}
          style={{
            backgroundColor: selected === cat.id ? cat.color : undefined,
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="rounded-2xl px-4 py-3 bg-white border border-slate-200">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ── Suggestion Filter & Highlight ─────────────────────────────────────────────

interface ScoredPrompt {
  prompt: PromptTemplate;
  score: number;
}

function filterSuggestions(input: string, allPrompts: PromptTemplate[]): PromptTemplate[] {
  if (!input || input.length < 2) return [];
  const lower = input.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 1);

  return allPrompts
    .map((prompt): ScoredPrompt => {
      const text = prompt.promptText.toLowerCase();
      let score = 0;
      if (text.includes(lower)) score += 10;
      const wordMatches = words.filter((w) => text.includes(w)).length;
      if (wordMatches === words.length) score += 5;
      score += wordMatches;
      return { prompt, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.prompt);
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase().trim();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return text;

  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-violet-600">{text.slice(idx, idx + qLower.length)}</span>
      {text.slice(idx + qLower.length)}
    </>
  );
}

// ── Dynamic Sample Prompt Rotation ───────────────────────────────────────────

const SAMPLE_PROMPTS = [
  "Show monthly revenue growth for last quarter",
  "Which districts are performing best?",
  "Show high risk documents this month",
  "Revenue vs target comparison",
  "Top 5 revenue-generating SROs",
  "SLA breach rate by district",
];

// ═════════════════════════════════════════════════════════════════════════════
// Main Page Component
// ═════════════════════════════════════════════════════════════════════════════

export default function AIChatPage() {
  const { promptData, isLoading: dataLoading, error: dataError } = useAIChat();

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");
  const [samplePromptIdx, setSamplePromptIdx] = useState(0);
  const [suggestions, setSuggestions] = useState<PromptTemplate[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);

  const conversationEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const categories = promptData?.categories ?? [];
  const prompts = promptData?.prompts ?? [];

  // Filter prompts by selected category
  const filteredPrompts = useMemo(() => {
    if (selectedCategory === "all") return prompts;
    return prompts.filter((p) => p.category === selectedCategory);
  }, [prompts, selectedCategory]);

  // Rotate sample prompts in empty state
  useEffect(() => {
    if (messages.length > 0) return;
    const interval = setInterval(() => {
      setSamplePromptIdx((prev) => (prev + 1) % SAMPLE_PROMPTS.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSend(text?: string) {
    const msg = text || composerValue.trim();
    if (!msg) return;

    const userMsg: ConversationMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setComposerValue("");
    setShowPlaceholder(true);
    setIsTyping(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIdx(-1);

    // Simulate AI thinking delay, then respond
    setTimeout(() => {
      const match = findBestMatch(msg, prompts);

      let aiMsg: ConversationMessage;
      if (match) {
        aiMsg = {
          id: `msg-${Date.now()}-ai`,
          role: "ai",
          content: match.response.narrative,
          data: match.response,
          timestamp: new Date().toISOString(),
        };
      } else {
        aiMsg = {
          id: `msg-${Date.now()}-ai`,
          role: "ai",
          content:
            "I don't have a pre-computed answer for that specific question yet. Try one of the suggested prompts, or the system administrator can add new prompt templates.",
          timestamp: new Date().toISOString(),
        };
      }

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  }

  function handleSelectSuggestion(prompt: PromptTemplate) {
    setComposerValue(prompt.promptText);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIdx(-1);
    handleSend(prompt.promptText);
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setComposerValue(val);
    setShowPlaceholder(!val);

    const filtered = filterSuggestions(val, prompts);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0 && val.length >= 2);
    setSelectedSuggestionIdx(-1);
  }

  function handlePromptClick(prompt: PromptTemplate) {
    const userMsg: ConversationMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: prompt.promptText,
      timestamp: new Date().toISOString(),
    };
    const aiMsg: ConversationMessage = {
      id: `msg-${Date.now()}-ai`,
      role: "ai",
      content: prompt.response.narrative,
      data: prompt.response,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
  }

  function handleNewChat() {
    setMessages([]);
    setComposerValue("");
    setShowPlaceholder(true);
    setIsTyping(false);
    setSelectedCategory("all");
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIdx(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selectedSuggestionIdx >= 0 && selectedSuggestionIdx < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedSuggestionIdx]);
      } else {
        setShowSuggestions(false);
        handleSend();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedSuggestionIdx(-1);
    }
  }

  // Loading state
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-violet-500">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading AI Chat...</span>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Error loading AI Chat data</p>
          <p className="text-red-600 text-sm mt-1">{dataError}</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {messages.length === 0 ? (
          /* ═══ Empty State ═══ */
          <div
            className="flex-1 flex flex-col items-center justify-center px-4"
            style={{ transform: "translateY(-3vh)" }}
          >
            {/* Hero */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="text-[24px] text-slate-900 leading-tight">IGRS Revenue Intelligence</div>
              <div className="text-[24px] text-slate-900 leading-tight">
                What would you like to <span className="text-violet-600">explore?</span>
              </div>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Ask questions about revenue, performance, risk analysis, forecasting, compliance, and SLA metrics.
              </p>
            </div>

            {/* Composer */}
            <div className="w-full max-w-[720px] mb-4 relative">
              <div className="relative rounded-[14px] p-[1.5px]">
                <div className="pointer-events-none absolute inset-0 rounded-[14px] overflow-hidden">
                  <div
                    className="absolute inset-[-70%] opacity-70"
                    style={{
                      background:
                        "conic-gradient(from 0deg, rgba(124,58,237,0.46), rgba(56,189,248,0.3), rgba(16,185,129,0.26), rgba(236,72,153,0.18), rgba(124,58,237,0.46))",
                      animation: "border-run 8s linear infinite",
                    }}
                  />
                </div>

                <div
                  className="group h-[120px] bg-white rounded-[12px] p-4 relative overflow-hidden hover:shadow-lg transition-all duration-300 ease-out focus-within:shadow-lg focus-within:ring-2 focus-within:ring-violet-500/20"
                  style={{ boxShadow: "0 4px 8px 0 rgba(14, 42, 82, 0.06)" }}
                >
                  {showPlaceholder && (
                    <div className="absolute top-4 left-4 right-4 flex items-center gap-2 pointer-events-none z-10">
                      <Sparkles size={12} className="text-slate-400" />
                      <span
                        key={`sample-${samplePromptIdx}`}
                        className="text-[13px] text-slate-400 animate-[prompt-fade-slide_0.4s_ease-out]"
                      >
                        {SAMPLE_PROMPTS[samplePromptIdx]}
                      </span>
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    value={composerValue}
                    onChange={handleTextareaChange}
                    onFocus={() => setShowPlaceholder(false)}
                    onBlur={() => {
                      if (!composerValue.trim()) setShowPlaceholder(true);
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full flex-1 resize-none border-none outline-none text-slate-900 text-sm transition-all duration-200 pt-0"
                    style={{ height: "calc(100% - 40px)" }}
                    aria-label="Enter your query"
                  />

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-end">
                    <button
                      onClick={() => handleSend()}
                      className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-violet-500 hover:bg-violet-600 hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 group"
                      aria-label="Send prompt"
                      disabled={isTyping || !composerValue.trim()}
                    >
                      <ArrowRight
                        size={18}
                        className="text-slate-400 group-hover:text-white transition-colors duration-200"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-0 right-0 top-[124px] z-30 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50/80">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      Suggestions
                    </span>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    {suggestions.map((item, idx) => {
                      const cat = categories.find((c) => c.id === item.category);
                      return (
                        <button
                          key={item.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSuggestion(item);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors duration-100",
                            idx === selectedSuggestionIdx
                              ? "bg-violet-50 text-slate-900"
                              : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span className="flex-1 truncate">
                            {highlightMatch(item.promptText, composerValue)}
                          </span>
                          {cat && (
                            <span
                              className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: cat.color }}
                            >
                              {cat.label}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Category Chips */}
            <div className="mb-4">
              <CategoryChips
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>

            {/* Suggested Prompts Grid */}
            <div className="w-full max-w-[720px]">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Suggested Prompts</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredPrompts.slice(0, 8).map((prompt) => {
                  const cat = categories.find((c) => c.id === prompt.category);
                  return (
                    <button
                      key={prompt.id}
                      onClick={() => handlePromptClick(prompt)}
                      className="text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 transition-colors flex items-start gap-2 group"
                    >
                      {cat && (
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium text-white flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.label}
                        </span>
                      )}
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                        <ChevronRight
                          size={12}
                          className="text-slate-300 group-hover:text-violet-500 transition-colors flex-shrink-0"
                        />
                        {prompt.promptText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ═══ Conversation State ═══ */
          <div className="flex flex-col h-full">
            {/* Category Chips (compact) */}
            <div className="px-4 py-2 border-b border-slate-100 bg-white/80 backdrop-blur">
              <div className="max-w-[960px] mx-auto flex items-center gap-3">
                <CategoryChips
                  categories={categories}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>
            </div>

            {/* Suggested Prompts (horizontal scroll) */}
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
              <div className="max-w-[960px] mx-auto flex gap-2 overflow-x-auto pb-1">
                {filteredPrompts.slice(0, 6).map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptClick(prompt)}
                    className="flex-shrink-0 text-left px-3 py-1.5 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 transition-colors max-w-[280px]"
                  >
                    <p className="text-xs text-slate-600 truncate">{prompt.promptText}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
              <div className="max-w-[960px] mx-auto px-4 py-6 space-y-4">
                {messages.map((msg) =>
                  msg.role === "user" ? (
                    <div key={msg.id} className="flex justify-end">
                      <div className="rounded-2xl px-4 py-3 max-w-[80%] bg-gray-100 text-slate-800">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <AIBubble key={msg.id} msg={msg} onFollowUp={handleSend} />
                  )
                )}
                {isTyping && <TypingIndicator />}
                <div ref={conversationEndRef} />
              </div>
            </div>

            {/* Bottom Composer */}
            <div className="bg-white border-t border-slate-200 px-4 py-3">
              <div className="max-w-[960px] mx-auto flex items-center gap-3">
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNewChat}
                      className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-violet-500 hover:bg-violet-50 hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95"
                      aria-label="New Chat"
                    >
                      <MessageSquarePlus size={18} className="text-slate-500" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">New Chat</TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNewChat}
                      className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-red-400 hover:bg-red-50 hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95"
                      aria-label="Clear Chat"
                    >
                      <Trash2 size={16} className="text-slate-500" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Clear Chat</TooltipContent>
                </Tooltip>

                <div className="flex-1 relative">
                  <textarea
                    value={composerValue}
                    onChange={handleTextareaChange}
                    onFocus={() => {
                      if (composerValue.length >= 2) {
                        const filtered = filterSuggestions(composerValue, prompts);
                        setSuggestions(filtered);
                        setShowSuggestions(filtered.length > 0);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up question..."
                    className="w-full resize-none border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    rows={1}
                    disabled={isTyping}
                  />

                  {/* Suggestions Dropdown (conversation mode) */}
                  {showSuggestions && suggestions.length > 0 && messages.length > 0 && (
                    <div className="absolute left-0 right-0 bottom-[44px] z-30 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                      <div className="max-h-[240px] overflow-y-auto">
                        {suggestions.map((item, idx) => {
                          const cat = categories.find((c) => c.id === item.category);
                          return (
                            <button
                              key={item.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectSuggestion(item);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors duration-100",
                                idx === selectedSuggestionIdx
                                  ? "bg-violet-50 text-slate-900"
                                  : "text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              <span className="flex-1 truncate">
                                {highlightMatch(item.promptText, composerValue)}
                              </span>
                              {cat && (
                                <span
                                  className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded text-white"
                                  style={{ backgroundColor: cat.color }}
                                >
                                  {cat.label}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSend()}
                  disabled={isTyping || !composerValue.trim()}
                  className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed hover:scale-110 transition-all duration-200 ease-out active:scale-95"
                  aria-label="Send message"
                >
                  <ArrowRight size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSS Animations */}
        <style jsx global>{`
          @keyframes prompt-fade-slide {
            0% {
              opacity: 0;
              transform: translateY(4px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes border-run {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
}
