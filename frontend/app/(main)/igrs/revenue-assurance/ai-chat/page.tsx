"use client";

import { useMemo, useRef, useState, useEffect, Component, type ErrorInfo, type ReactNode } from "react";
import { useAIChat } from "@/hooks/data/use-igrs-ai-chat";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Lightbulb,
  Plus,
  Sparkles,
  Star,
  Bot,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type {
  PromptTemplate,
  PromptCategory,
  InlineChartData,
  PromptCategoryDefinition,
} from "@/lib/data/types/igrs";
import { useIGRSRole } from "@/lib/ai-chat-intelligence/role-context";
import { ResponseActionBar } from "./_components/response-action-bar";
import type { ConversationMessage } from "./_components/response-action-bar";

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

// ── Bubble Error Boundary ────────────────────────────────────────────────────

class BubbleErrorBoundary extends Component<
  { children: ReactNode },
  { error: unknown | null }
> {
  state: { error: unknown | null } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[AIBubble Error]", error, info.componentStack);
  }
  render() {
    if (this.state.error != null) {
      const message =
        this.state.error instanceof Error
          ? this.state.error.message
          : typeof this.state.error === "string"
            ? this.state.error
            : "Unknown rendering error";
      const stack = this.state.error instanceof Error ? this.state.error.stack : null;
      return (
        <div className="flex justify-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-red-500 text-xs font-bold">!</span>
          </div>
          <div className="rounded-2xl px-5 py-4 max-w-[80%] bg-red-50 border border-red-200">
            <p className="text-sm text-red-700 font-medium">Error rendering response</p>
            <p className="text-xs text-red-600 mt-1 font-mono">{message}</p>
            {stack && (
              <details className="mt-2">
                <summary className="text-xs text-red-500 cursor-pointer">Stack trace</summary>
                <pre className="text-[10px] text-red-400 mt-1 whitespace-pre-wrap max-h-40 overflow-auto">
                  {stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-2 text-xs text-red-600 underline"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── AI Message Bubble ────────────────────────────────────────────────────────

function AIBubble({
  msg,
  onFollowUp,
}: {
  msg: ConversationMessage;
  onFollowUp: (text: string) => void;
}) {
  const [chartVisible, setChartVisible] = useState(false);
  const hasChart = !!msg.data?.inlineChart;

  return (
    <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-500">
      <div className="w-full">
        <span className="text-xs text-gray-500 ml-2">{formatMessageTime(msg.timestamp)}</span>
        <ResponseActionBar msg={msg} />

        <div className="mt-2 space-y-3">
          {/* Narrative text */}
          <p className="text-sm text-[#191919] leading-[22px]">{msg.content}</p>

          {/* Inline Table */}
          {msg.data?.inlineTable && (
            <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    {msg.data.inlineTable.headers.map((h, hi) => (
                      <th
                        key={hi}
                        className={cn(
                          "text-left px-3 py-2 border-b border-slate-200 font-semibold text-[11px] uppercase tracking-wider",
                          msg.data?.inlineTable?.highlightColumn === hi
                            ? "bg-violet-50 text-violet-700"
                            : "text-slate-500"
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {msg.data.inlineTable.rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-slate-50/50 transition-colors">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={cn(
                            "px-3 py-2 border-b border-slate-50 text-slate-600",
                            msg.data?.inlineTable?.highlightColumn === ci && "bg-violet-50/50 font-medium text-violet-700"
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

          {/* Chart Toggle Button */}
          {hasChart && (
            <div>
              <button
                onClick={() => setChartVisible(!chartVisible)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  chartVisible
                    ? "bg-violet-100 text-violet-700 hover:bg-violet-150"
                    : "bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-600 border border-slate-200"
                )}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{chartVisible ? "Hide Chart" : "View Chart"}</span>
                {chartVisible ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>

              {/* Collapsible Chart */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  chartVisible ? "max-h-[300px] opacity-100 mt-2" : "max-h-0 opacity-0"
                )}
              >
                <div className="rounded-lg bg-slate-50/50 border border-slate-100 p-3">
                  <InlineChart chart={msg.data!.inlineChart!} />
                </div>
              </div>
            </div>
          )}

          {/* Key Insight */}
          {msg.data?.keyInsight && (
            <div className="rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 border-l-4 border-l-violet-400 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-violet-800 font-medium leading-relaxed">{msg.data.keyInsight}</p>
              </div>
            </div>
          )}

          {/* Follow-up prompts */}
          {msg.data?.followUpPrompts && msg.data.followUpPrompts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {msg.data.followUpPrompts.map((fp, fi) => (
                <button
                  key={fi}
                  onClick={() => onFollowUp(fp)}
                  className="group inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#E2E8F0] bg-white text-sm text-[#334155] hover:border-[#6B7EF3] hover:bg-[#F5F8FF] hover:text-slate-900 transition-all duration-200"
                >
                  <Lightbulb size={14} className="text-[#94A3B8] group-hover:text-[#6B7EF3] transition-colors" />
                  <span className="leading-snug">{fp}</span>
                  <ArrowRight size={12} className="text-[#CBD5E1] group-hover:text-[#6B7EF3] group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>
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

// ── Streaming Events ────────────────────────────────────────────────────────

const STREAMING_STEPS = [
  { message: "Understanding your query...", icon: "search" },
  { message: "Querying revenue databases...", icon: "database" },
  { message: "Analyzing zone-wise data...", icon: "chart" },
  { message: "Computing comparisons & trends...", icon: "compute" },
  { message: "Generating insights...", icon: "sparkle" },
];

function StreamingIndicator({ events }: { events: string[] }) {
  return (
    <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-500">
      <div className="w-full">
        <span className="text-xs text-gray-500 ml-2">
          {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
        <div className="mt-1 bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 w-full max-w-xl">
          <div className="space-y-2">
            {events.map((event, idx) => {
              const isLatest = idx === events.length - 1;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    isLatest ? "text-gray-800 font-medium" : "text-gray-500"
                  )}
                >
                  <span className="leading-relaxed">{event}</span>
                  {isLatest && (
                    <span className="flex ml-1">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
                        .
                      </span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
                        .
                      </span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
                        .
                      </span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
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

const SAMPLE_PROMPTS_BY_ROLE: Record<string, string[]> = {
  IG: [
    "State revenue summary this week",
    "Compare all zones leakage rate this month",
    "Which SROs granted most exemptions?",
    "Show all open escalations pending beyond SLA",
    "Zone performance comparison",
    "Monthly revenue growth trend",
  ],
  DIG: [
    "Zone revenue summary this month",
    "Top zone cases above 40 lakhs",
    "District comparison in my zone",
    "Escalation status in my zone",
    "SLA breaches in my zone this month",
    "High-risk documents in my zone",
  ],
  DR: [
    "District revenue summary this month",
    "Top district cases above 20 lakhs",
    "SRO performance in my district",
    "Pending escalations in my district",
    "Payment gap analysis for my district",
    "SLA compliance in my district",
  ],
  SR: [
    "My daily summary",
    "Pending cases at my SRO",
    "Today's registrations above 10 lakhs",
    "Escalations requiring my response",
    "Cash reconciliation status",
    "My performance vs district average",
  ],
};

const DEFAULT_SAMPLE_PROMPTS = [
  "Show monthly revenue growth for last quarter",
  "Which districts are performing best?",
  "Show high risk documents this month",
  "Revenue vs target comparison",
  "Top 5 revenue-generating SROs",
  "SLA breach rate by district",
];

function getSamplePrompts(role?: string): string[] {
  if (role && SAMPLE_PROMPTS_BY_ROLE[role]) return SAMPLE_PROMPTS_BY_ROLE[role];
  return DEFAULT_SAMPLE_PROMPTS;
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page Component
// ═════════════════════════════════════════════════════════════════════════════

export default function AIChatPage() {
  const { promptData, isLoading: dataLoading, error: dataError } = useAIChat();
  const { session } = useIGRSRole();

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingEvents, setStreamingEvents] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");
  const [samplePromptIdx, setSamplePromptIdx] = useState(0);
  const [suggestions, setSuggestions] = useState<PromptTemplate[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);

  const conversationEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const streamingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const categories = useMemo(() => promptData?.categories ?? [], [promptData?.categories]);
  const allPrompts = useMemo(() => promptData?.prompts ?? [], [promptData?.prompts]);

  // Filter prompts by role — show generic + role-specific prompts
  const roleFilteredPrompts = useMemo(() => {
    if (!session) return allPrompts;
    return allPrompts.filter((p) => !p.role || p.role === session.role);
  }, [allPrompts, session]);

  // Role-aware sample prompts
  const samplePrompts = useMemo(() => getSamplePrompts(session?.role), [session?.role]);
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Filter prompts by selected category (on top of role filter)
  const filteredPrompts = useMemo(() => {
    if (selectedCategory === "all") return roleFilteredPrompts;
    return roleFilteredPrompts.filter((p) => p.category === selectedCategory);
  }, [roleFilteredPrompts, selectedCategory]);

  // Rotate sample prompts in empty state
  useEffect(() => {
    if (messages.length > 0) return;
    const interval = setInterval(() => {
      setSamplePromptIdx((prev) => (prev + 1) % samplePrompts.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [messages.length, samplePrompts.length]);

  // Auto-scroll to bottom on new messages or streaming events
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, streamingEvents]);

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
    };
  }, []);

  function simulateStreaming(onComplete: () => void) {
    // Clear any previous streaming interval
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }

    const steps = STREAMING_STEPS
      .map((step) => step?.message)
      .filter((message): message is string => typeof message === "string" && message.length > 0);
    if (steps.length === 0) {
      onComplete();
      return;
    }
    let stepIndex = 0;

    setStreamingEvents([steps[0]]);
    stepIndex = 1;

    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        const nextStep = steps[stepIndex];
        if (nextStep) {
          setStreamingEvents((prev) => [...prev, nextStep]);
        }
        stepIndex++;
      } else {
        clearInterval(interval);
        streamingIntervalRef.current = null;
        setStreamingEvents([]);
        onComplete();
      }
    }, 350);

    streamingIntervalRef.current = interval;
  }

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

    simulateStreaming(() => {
      const match = findBestMatch(msg, roleFilteredPrompts);

      let aiMsg: ConversationMessage;
      if (match?.response) {
        aiMsg = {
          id: `msg-${Date.now()}-ai`,
          role: "ai",
          content: match.response.narrative ?? "Response data unavailable.",
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
    });
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

    const filtered = filterSuggestions(val, roleFilteredPrompts);
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

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    simulateStreaming(() => {
      const response = prompt?.response;
      const aiMsg: ConversationMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "ai",
        content: response?.narrative ?? "Response data unavailable.",
        data: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    });
  }

  function handleNewChat() {
    setMessages([]);
    setComposerValue("");
    setShowPlaceholder(true);
    setIsTyping(false);
    setStreamingEvents([]);
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
          <div className="h-full overflow-y-auto">
            <div className="w-full max-w-[980px] mx-auto px-4 pt-10 pb-8">
              <div className="text-center mb-8">
                <div className="text-[30px] text-[#0F172A] leading-tight">
                  {greeting} {session?.name ?? session?.designation ?? "Officer"},
                </div>
                <div className="text-[30px] text-[#0F172A] leading-tight">
                  How can I <span className="text-[#6B7EF3]">help you today?</span>
                </div>
                <p className="text-sm text-slate-500 mt-2 max-w-2xl mx-auto">
                  {session
                    ? `Ask role-aware questions for ${session.designation} covering revenue, leakages, pending cases, and escalations.`
                    : "Ask questions about revenue, performance, risk analysis, forecasting, compliance, and SLA metrics."}
                </p>
              </div>

              <div className="w-full max-w-[821px] mx-auto mb-5 relative">
                <div className="rounded-[24px] bg-[#F2FDFF] p-2">
                  <div
                    className="min-h-[184px] border border-[#656565] bg-white rounded-[24px] p-4 relative hover:border-[#6B7EF3] hover:shadow-lg transition-all duration-300 ease-out focus-within:border-[#6B7EF3] focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#6B7EF3]/20"
                    style={{ boxShadow: "0 4px 8px 0 rgba(14, 42, 82, 0.06)" }}
                  >
                    {showPlaceholder && (
                      <div className="absolute top-4 left-4 right-4 flex items-center gap-2 pointer-events-none z-10">
                        <Sparkles size={12} className="text-slate-400" />
                        <span
                          key={`sample-${samplePromptIdx}`}
                          className="text-[13px] text-slate-400 animate-[prompt-fade-slide_0.4s_ease-out]"
                        >
                          {samplePrompts[samplePromptIdx % samplePrompts.length]}
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
                      className="w-full h-full min-h-[132px] flex-1 resize-none border-none outline-none text-[#0F172A] text-sm transition-all duration-200"
                      aria-label="Enter your query"
                    />

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D2D2D2] bg-white">
                          <Clock size={14} />
                        </span>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D2D2D2] bg-white">
                          <Star size={14} />
                        </span>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D2D2D2] bg-white">
                          <Lightbulb size={14} />
                        </span>
                      </div>

                      <button
                        onClick={() => handleSend()}
                        disabled={isTyping || !composerValue.trim()}
                        className={cn(
                          "w-[38px] h-[38px] rounded-full border border-[#E5E7EB] bg-[#D2D2D2] flex items-center justify-center hover:border-slate-200 hover:bg-primary hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 group",
                          (isTyping || !composerValue.trim()) && "opacity-50 cursor-not-allowed"
                        )}
                        aria-label="Send prompt"
                      >
                        <ArrowRight
                          size={18}
                          className="text-white group-hover:text-white transition-colors duration-200"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-[194px] z-30 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
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

              <div className="mt-2 mb-6">
                <CategoryChips
                  categories={categories}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>

              <div className="w-full max-w-[980px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {filteredPrompts.slice(0, 6).map((prompt) => {
                    const cat = categories.find((c) => c.id === prompt.category);
                    return (
                      <button
                        key={prompt.id}
                        onClick={() => handlePromptClick(prompt)}
                        className="text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#6B7EF3] hover:bg-[#F8FAFF] transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#6B7EF3]">
                            <BarChart3 size={16} />
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-slate-300 group-hover:text-[#6B7EF3] transition-colors"
                          />
                        </div>
                        <p className="mt-3 text-[15px] text-[#1E293B] leading-6">{prompt.promptText}</p>
                        <p className="mt-2 text-xs text-slate-400">{cat?.label ?? "Insights"}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ═══ Conversation State ═══ */
          <div className="flex flex-col w-full h-full max-w-[1363px] mx-auto px-4">
            <div className="flex items-center justify-between my-2">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-[#6B7EF3]" />
                <span className="text-lg font-semibold text-[#0F172A]">IGRS Finance AI</span>
              </div>
              <button
                onClick={handleNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-900 border border-[#D2D2D2] rounded-lg hover:bg-[#E8F4FD] transition-colors"
              >
                <Plus size={14} />
                <span>New Chat</span>
              </button>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto space-y-6 mb-4 pr-2 pb-4 scrollbar-hide">
              {messages.map((msg, index) =>
                msg.role === "user" ? (
                  <div
                    key={msg.id}
                    className="flex justify-end animate-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="max-w-4xl ml-12">
                      <div className="flex flex-col items-end space-y-1">
                        <span className="text-xs text-gray-500 mr-2">
                          {formatMessageTime(msg.timestamp)}
                        </span>
                        <div className="bg-[#D1ECFF] rounded-xl rounded-tr-none px-3 py-4 max-w-md">
                          <p className="text-sm text-[#191919] leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <BubbleErrorBoundary key={msg.id}>
                    <AIBubble msg={msg} onFollowUp={handleSend} />
                  </BubbleErrorBoundary>
                )
              )}
              {isTyping && streamingEvents.length > 0 && (
                <StreamingIndicator events={streamingEvents} />
              )}
              <div ref={conversationEndRef} />
            </div>

            {/* Bottom Composer */}
            <div className="flex items-end gap-4 bg-[#F2FDFF] rounded-[24px] p-2 mb-3">
              <div className="flex-1 relative">
                <div
                  className="min-h-[128px] border border-[#656565] bg-white rounded-[24px] p-4 relative hover:border-[#6B7EF3] hover:shadow-lg transition-all duration-300 ease-out focus-within:border-[#6B7EF3] focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#6B7EF3]/20"
                  style={{ boxShadow: "0 4px 8px 0 rgba(14, 42, 82, 0.06)" }}
                >
                  <textarea
                    value={composerValue}
                    onChange={handleTextareaChange}
                    onFocus={() => {
                      if (composerValue.length >= 2) {
                        const filtered = filterSuggestions(composerValue, roleFilteredPrompts);
                        setSuggestions(filtered);
                        setShowSuggestions(filtered.length > 0);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder="Sample prompt: Show zone wise revenue trend for this month"
                    className="w-full h-full min-h-[90px] flex-1 resize-none border-none outline-none text-[#0F172A] text-sm transition-all duration-200 placeholder:text-[#7C8A9A]"
                    rows={4}
                    disabled={isTyping}
                  />

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-end">
                    <button
                      onClick={() => handleSend()}
                      disabled={isTyping || !composerValue.trim()}
                      className={cn(
                        "w-[38px] h-[38px] rounded-full border border-[#E5E7EB] bg-[#D2D2D2] flex items-center justify-center hover:border-slate-200 hover:bg-primary hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 group",
                        (isTyping || !composerValue.trim()) && "opacity-50 cursor-not-allowed"
                      )}
                      aria-label="Send prompt"
                    >
                      <ArrowRight
                        size={18}
                        className="text-white group-hover:text-white transition-colors duration-200"
                      />
                    </button>
                  </div>
                </div>

                {/* Suggestions Dropdown (conversation mode) */}
                {showSuggestions && suggestions.length > 0 && messages.length > 0 && (
                  <div className="absolute left-0 right-0 bottom-[132px] z-30 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
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
        `}</style>
      </div>
    </TooltipProvider>
  );
}
