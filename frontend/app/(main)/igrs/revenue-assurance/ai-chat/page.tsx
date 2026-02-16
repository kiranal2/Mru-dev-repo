"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChatSessions } from "@/hooks/data/use-common";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  processRevenueQuery,
  getAvailableZones,
  getAvailableDistricts,
} from "@/lib/revenue-leakage/revenueIntelligenceChat";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import { RevenueConversationThread } from "@/components/revenue-leakage/revenue-conversation-thread";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Lightbulb,
  MessageSquarePlus,
  Sparkles,
  Star,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PromptSuggestion {
  text: string;
  category:
    | "Summary"
    | "High Value"
    | "Risk"
    | "Exemption"
    | "Prohibited"
    | "Delay"
    | "Payment"
    | "SLA"
    | "District"
    | "Date"
    | "Status"
    | "Market"
    | "Drill";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    stage?: "text" | "clarifier" | "result";
    clarifier?: {
      missing: string[];
      suggestions?: Record<string, string>;
    };
    presentation?: unknown;
  };
}

const REVENUE_QUICK_CHIPS = [
  "Leakage Summary",
  "High Value Gaps",
  "Exemption Usage",
  "Payment Gaps",
  "Prohibited Land",
  "SLA Breached",
  "Challan Delays",
] as const;

const CHIP_PROMPTS: Record<(typeof REVENUE_QUICK_CHIPS)[number], string> = {
  "Leakage Summary": "Show me the overall revenue leakage summary",
  "High Value Gaps": "Show top 10 documents with high value payment gaps above 1 lakh",
  "Exemption Usage": "Show all exemption risk cases",
  "Payment Gaps": "Show all cases with revenue gap signals",
  "Prohibited Land": "Show prohibited land matches",
  "SLA Breached": "Show high risk cases breaching SLA",
  "Challan Delays": "Show cases with challan delay signals",
};

const SUGGESTED_PROMPTS = [
  "Show me high risk cases in Visakhapatnam with gap above 1 lakh",
  "Which offices have the most revenue gaps?",
  "List all SLA-breached cases from the last 30 days",
  "Show exemption risk cases in Srikakulam",
  "Top 10 high value documents with payment gaps",
  "Find prohibited land matches in the Coastal zone",
  "Show me challan delays above 7 days",
  "Cases with market value deviation in East Godavari",
];

const PROMPT_CATALOG: PromptSuggestion[] = [
  { text: "Show me the overall revenue leakage summary", category: "Summary" },
  { text: "Show overall leakage summary", category: "Summary" },
  { text: "Show leakage summary for North zone", category: "Summary" },
  { text: "Show leakage summary for South zone", category: "Summary" },
  { text: "Show leakage summary for East zone", category: "Summary" },
  { text: "Show leakage summary for West zone", category: "Summary" },
  { text: "Show leakage summary for Central zone", category: "Summary" },
  { text: "Show leakage summary for Visakhapatnam", category: "Summary" },
  { text: "Show leakage summary for Guntur", category: "Summary" },
  { text: "Top 10 by gap amount", category: "High Value" },
  { text: "Show top 10 cases by gap amount", category: "High Value" },
  { text: "Show cases with gap above 10 lakhs", category: "High Value" },
  { text: "Show cases with gap above 50 lakhs", category: "High Value" },
  { text: "Show cases with gap above 1 crore", category: "High Value" },
  { text: "Show high value documents with payment gaps above 1 lakh", category: "High Value" },
  { text: "Show all high risk cases", category: "Risk" },
  { text: "Show high risk cases in Vizag", category: "Risk" },
  { text: "Show high risk cases in Visakhapatnam", category: "Risk" },
  { text: "Show high risk cases in Guntur with gap above 5 lakhs", category: "Risk" },
  { text: "Show medium risk cases in East zone", category: "Risk" },
  { text: "Show all exemption risk cases", category: "Exemption" },
  { text: "Show exemption misuse cases in Vizag", category: "Exemption" },
  { text: "Show exemption risk cases in Srikakulam", category: "Exemption" },
  { text: "Show all prohibited land transaction cases", category: "Prohibited" },
  { text: "Show prohibited land matches in North zone", category: "Prohibited" },
  { text: "Find prohibited land matches in East Godavari", category: "Prohibited" },
  { text: "Show cases with challan delay signals", category: "Delay" },
  { text: "Show challan delay cases in North zone", category: "Delay" },
  { text: "Show challan delays above 7 days", category: "Delay" },
  { text: "Show all cases with revenue gap signals", category: "Payment" },
  { text: "Show payment gap cases above 40 lakhs", category: "Payment" },
  { text: "Show all SLA breached cases", category: "SLA" },
  { text: "Show SLA-breached cases in last 30 days", category: "SLA" },
  { text: "Show high risk SLA breached cases", category: "SLA" },
  { text: "Show cases in Guntur", category: "District" },
  { text: "Show cases in Kakinada", category: "District" },
  { text: "Show cases in Nellore district", category: "District" },
  { text: "Which district has the most high risk cases?", category: "District" },
  { text: "Show cases registered in the last 30 days", category: "Date" },
  { text: "Show cases from last 7 days", category: "Date" },
  { text: "Show cases registered today", category: "Date" },
  { text: "Show all new cases", category: "Status" },
  { text: "Show cases in review", category: "Status" },
  { text: "Show resolved cases", category: "Status" },
  { text: "Show cases with market value deviation", category: "Market" },
  { text: "Show market value risk cases in East Godavari", category: "Market" },
  { text: "Show high risk exemption cases in Vizag above 10 lakhs", category: "Drill" },
  { text: "Show SLA breached cases with payment gaps in North zone", category: "Drill" },
];

const CATEGORY_BADGE: Record<PromptSuggestion["category"], string> = {
  Summary: "bg-blue-50 text-blue-700 border-blue-200",
  "High Value": "bg-amber-50 text-amber-700 border-amber-200",
  Risk: "bg-red-50 text-red-700 border-red-200",
  Exemption: "bg-purple-50 text-purple-700 border-purple-200",
  Prohibited: "bg-pink-50 text-pink-700 border-pink-200",
  Delay: "bg-orange-50 text-orange-700 border-orange-200",
  Payment: "bg-rose-50 text-rose-700 border-rose-200",
  SLA: "bg-yellow-50 text-yellow-700 border-yellow-200",
  District: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Date: "bg-lime-50 text-lime-700 border-lime-200",
  Status: "bg-slate-100 text-slate-700 border-slate-200",
  Market: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Drill: "bg-violet-50 text-violet-700 border-violet-200",
};

function filterSuggestions(input: string): PromptSuggestion[] {
  if (!input || input.length < 2) return [];
  const lower = input.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 1);

  return PROMPT_CATALOG.map((item) => {
    const itemLower = item.text.toLowerCase();
    let score = 0;
    if (itemLower.includes(lower)) score += 10;
    const wordMatches = words.filter((w) => itemLower.includes(w)).length;
    if (wordMatches === words.length) score += 5;
    score += wordMatches;
    return { ...item, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
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
      <span className="font-semibold text-[#6B7EF3]">{text.slice(idx, idx + qLower.length)}</span>
      {text.slice(idx + qLower.length)}
    </>
  );
}

export default function AIChatPage() {
  const { loading: sessionsLoading } = useChatSessions();

  const [messages, setMessages] = useState<Message[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [zoneOptions, setZoneOptions] = useState<string[]>([]);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    revenueLeakageApi.getCases().then((cases) => {
      setZoneOptions(getAvailableZones(cases));
      setDistrictOptions(getAvailableDistricts(cases));
    });
  }, []);

  const submitPrompt = async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setComposerValue("");
    setShowPlaceholder(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIdx(-1);

    try {
      const [response] = await Promise.all([
        processRevenueQuery(text, messages),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);

      const assistantMsg: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        metadata: {
          stage: response.stage,
          clarifier: response.clarifier,
          presentation: response.presentation,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Revenue query error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content: "Sorry, there was an error processing your query. Please try again.",
          timestamp: new Date().toISOString(),
          metadata: { stage: "text" },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendClick = () => {
    submitPrompt(composerValue);
  };

  const handleClarifierResolve = (slots: Record<string, unknown>) => {
    const parts = Object.entries(slots)
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
      .join(", ");
    submitPrompt(parts);
  };

  const handleChipClick = (chipText: (typeof REVENUE_QUICK_CHIPS)[number]) => {
    const prompt = CHIP_PROMPTS[chipText] || chipText;
    submitPrompt(prompt);
  };

  const handleNewChat = () => {
    setMessages([]);
    setComposerValue("");
    setShowPlaceholder(true);
    setIsLoading(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIdx(-1);
  };

  const handleSelectSuggestion = (text: string) => {
    setComposerValue(text);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIdx(-1);
    submitPrompt(text);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setComposerValue(val);
    setShowPlaceholder(!val);

    const filtered = filterSuggestions(val);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0 && val.length >= 2);
    setSelectedSuggestionIdx(-1);
  };

  const handleSuggestionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendClick();
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
        handleSelectSuggestion(suggestions[selectedSuggestionIdx].text);
      } else {
        setShowSuggestions(false);
        handleSendClick();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedSuggestionIdx(-1);
    }
  };

  const resultTone = useMemo(() => {
    if (!messages.length) return "idle";
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && /error|sorry/i.test(last.content)) return "warning";
    return "normal";
  }, [messages]);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {messages.length === 0 ? (
          <div
            className="flex-1 flex flex-col items-center justify-center px-4"
            style={{ transform: "translateY(-5vh)" }}
          >
            <div className="text-center mb-8">
              <div className="text-[24px] text-slate-900 leading-tight">Revenue Intelligence</div>
              <div className="text-[24px] text-slate-900 leading-tight">
                What would you like to <span className="text-[#6B7EF3]">audit today?</span>
              </div>
            </div>

            <div className="w-full max-w-[720px] mb-4 relative">
              <div
                className="h-[132px] border border-[#CFE4EA] bg-white rounded-[12px] p-4 relative hover:border-[#6B7EF3] hover:shadow-lg transition-all duration-300 ease-out focus-within:border-[#6B7EF3] focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#6B7EF3]/20"
                style={{ boxShadow: "0 4px 8px 0 rgba(14, 42, 82, 0.06)" }}
              >
                {showPlaceholder && (
                  <div className="absolute top-4 left-4 right-4 flex items-center gap-2 pointer-events-none z-10">
                    <Sparkles size={12} className="text-slate-400" />
                    <span className="text-[13px] text-slate-400">
                      Sample prompt: Show revenue leakage summary for Visakhapatnam from Feb 1 to
                      Feb 12
                    </span>
                  </div>
                )}

                <textarea
                  value={composerValue}
                  onChange={handleTextareaChange}
                  onFocus={() => setShowPlaceholder(false)}
                  onBlur={() => {
                    if (!composerValue.trim()) setShowPlaceholder(true);
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  onKeyDown={handleSuggestionKeyDown}
                  className="w-full flex-1 resize-none border-none outline-none text-slate-900 text-sm transition-all duration-200 pt-7"
                  style={{ height: "calc(100% - 40px)" }}
                  aria-label="Enter your audit query"
                />

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <CircularButton
                          icon={<Clock size={14} />}
                          aria-label="History"
                          onClick={() => toast.message("History view is not enabled yet")}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top">History</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <CircularButton
                          icon={<Star size={14} />}
                          aria-label="Favorites"
                          onClick={() => toast.message("Favorite prompts are not enabled yet")}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top">Favorites</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <CircularButton
                          icon={<Lightbulb size={14} />}
                          aria-label="Suggested Prompts"
                          onClick={() => {
                            if (composerValue.length >= 2) {
                              const filtered = filterSuggestions(composerValue);
                              setSuggestions(filtered);
                              setShowSuggestions(filtered.length > 0);
                            }
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top">Suggested Prompts</TooltipContent>
                    </Tooltip>
                  </div>
                  <button
                    onClick={handleSendClick}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-[#6B7EF3] hover:bg-[#6B7EF3] hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 group"
                    aria-label="Send prompt"
                    disabled={isLoading || !composerValue.trim()}
                  >
                    <ArrowRight
                      size={18}
                      className="text-slate-400 group-hover:text-white transition-colors duration-200"
                    />
                  </button>
                </div>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-0 right-0 top-[136px] z-30 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50/80">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      Suggestions
                    </span>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(item.text);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors duration-100",
                          idx === selectedSuggestionIdx
                            ? "bg-[#EEF8FF] text-slate-900"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <span className="flex-1 truncate">{highlightMatch(item.text, composerValue)}</span>
                        <span
                          className={cn(
                            "text-[10px] flex-shrink-0 border px-1.5 py-0.5 rounded",
                            CATEGORY_BADGE[item.category]
                          )}
                        >
                          {item.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {REVENUE_QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  className="h-8 px-3.5 border rounded-full text-sm bg-slate-50 text-slate-600 border-slate-200 hover:border-[#6B7EF3] hover:bg-[#EEF8FF] hover:text-[#6B7EF3] hover:shadow-md hover:scale-105 transition-all duration-200 ease-out active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="w-full max-w-[720px]">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Suggested Prompts</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.slice(0, 6).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => submitPrompt(prompt)}
                    className="text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors duration-150 flex items-center gap-2 group"
                  >
                    <ChevronRight
                      size={12}
                      className="text-slate-300 group-hover:text-[#6B7EF3] transition-colors"
                    />
                    <span className="group-hover:text-slate-900 transition-colors">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 bg-gray-50">
              <RevenueConversationThread
                messages={messages}
                onClarifierResolve={handleClarifierResolve}
                isLoading={isLoading}
                zoneOptions={zoneOptions}
                districtOptions={districtOptions}
                expandPath="/igrs/revenue-assurance/cases"
              />
            </div>

            <div className="bg-white border-t border-slate-200 px-4 py-3">
              <div className="max-w-[960px] mx-auto">
                <div className="flex items-center gap-3">
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleNewChat}
                        className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-[#6B7EF3] hover:bg-[#EEF8FF] hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95"
                        aria-label="New Chat"
                      >
                        <MessageSquarePlus size={18} className="text-slate-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">New Chat</TooltipContent>
                  </Tooltip>

                  <div className="flex-1 relative">
                    <textarea
                      value={composerValue}
                      onChange={handleTextareaChange}
                      onFocus={() => {
                        if (composerValue.length >= 2) {
                          const filtered = filterSuggestions(composerValue);
                          setSuggestions(filtered);
                          setShowSuggestions(filtered.length > 0);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onKeyDown={handleSuggestionKeyDown}
                      placeholder="Ask a follow-up question..."
                      className="w-full resize-none border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#6B7EF3] focus:ring-2 focus:ring-[#6B7EF3]/20 transition-all"
                      rows={1}
                      disabled={isLoading}
                    />

                    {showSuggestions && suggestions.length > 0 && messages.length > 0 && (
                      <div className="absolute left-0 right-0 bottom-[44px] z-30 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                        <div className="max-h-[240px] overflow-y-auto">
                          {suggestions.map((item, idx) => (
                            <button
                              key={idx}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectSuggestion(item.text);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors duration-100",
                                idx === selectedSuggestionIdx
                                  ? "bg-[#EEF8FF] text-slate-900"
                                  : "text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              <span className="flex-1 truncate">
                                {highlightMatch(item.text, composerValue)}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] flex-shrink-0 border px-1.5 py-0.5 rounded",
                                  CATEGORY_BADGE[item.category]
                                )}
                              >
                                {item.category}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSendClick}
                    disabled={isLoading || !composerValue.trim()}
                    className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed hover:scale-110 transition-all duration-200 ease-out active:scale-95"
                    aria-label="Send message"
                  >
                    <ArrowRight size={20} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="sr-only" aria-live="polite">
          {sessionsLoading
            ? "Loading chat session context"
            : resultTone === "warning"
              ? "Assistant returned warning response"
              : "Assistant ready"}
        </div>
      </div>
    </TooltipProvider>
  );
}

function CircularButton({
  icon,
  "aria-label": ariaLabel,
  onClick,
}: {
  icon: React.ReactNode;
  "aria-label": string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-[#6B7EF3] hover:bg-[#EEF8FF] hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95"
      aria-label={ariaLabel}
    >
      <span className="text-slate-400">{icon}</span>
    </button>
  );
}
