"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RevenueLeakageShell } from "@/components/revenue-leakage/revenue-leakage-shell";
import { RevenueConversationThread } from "@/components/revenue-leakage/revenue-conversation-thread";
import {
  processRevenueQuery,
  getAvailableZones,
  getAvailableDistricts,
} from "@/lib/revenue-leakage/revenueIntelligenceChat";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Clock,
  Star,
  Lightbulb,
  MessageSquarePlus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ── Quick Chips ────────────────────────────────────────────────────

const REVENUE_QUICK_CHIPS = [
  "Leakage Summary",
  "High Value Gaps",
  "Exemption Usage",
  "Payment Gaps",
  "Prohibited Land",
  "SLA Breached",
  "Challan Delays",
];

const CHIP_PROMPTS: Record<string, string> = {
  "Leakage Summary": "Show me the overall revenue leakage summary",
  "High Value Gaps": "Show top 10 documents with high value payment gaps above 1 lakh",
  "Exemption Usage": "Show all exemption risk cases",
  "Payment Gaps": "Show all cases with revenue gap signals",
  "Prohibited Land": "Show prohibited land matches",
  "SLA Breached": "Show high risk cases breaching SLA",
  "Challan Delays": "Show cases with challan delay signals",
};

// ── Suggested Prompts ──────────────────────────────────────────────

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

// ── Auto-Suggestion Catalog ──────────────────────────────────────

interface PromptSuggestion {
  text: string;
  category: string;
}

const PROMPT_CATALOG: PromptSuggestion[] = [
  // Leakage Summary
  { text: "Show me the overall revenue leakage summary", category: "Summary" },
  { text: "Show overall leakage summary", category: "Summary" },
  { text: "Show leakage summary for North zone", category: "Summary" },
  { text: "Show leakage summary for South zone", category: "Summary" },
  { text: "Show leakage summary for East zone", category: "Summary" },
  { text: "Show leakage summary for West zone", category: "Summary" },
  { text: "Show leakage summary for Central zone", category: "Summary" },
  { text: "Show leakage summary for Visakhapatnam", category: "Summary" },
  { text: "Show leakage summary for Guntur", category: "Summary" },
  { text: "Show leakage summary for Krishna district", category: "Summary" },
  { text: "Show leakage summary for Srikakulam", category: "Summary" },
  { text: "Show leakage summary for Tirupati", category: "Summary" },
  { text: "Show leakage summary for Kurnool", category: "Summary" },
  { text: "Show leakage summary for East Godavari", category: "Summary" },

  // High Value / Gap
  { text: "Top 10 by gap amount", category: "High Value" },
  { text: "Show top 10 cases by gap amount", category: "High Value" },
  { text: "Show cases with gap above 10 lakhs", category: "High Value" },
  { text: "Show cases with gap above 50 lakhs", category: "High Value" },
  { text: "Show cases with gap above 1 crore", category: "High Value" },
  { text: "Show high value documents with payment gaps above 1 lakh", category: "High Value" },
  { text: "Top 20 cases by gap amount in Central zone", category: "High Value" },

  // Risk
  { text: "Show all high risk cases", category: "Risk" },
  { text: "High risk cases in Vizag", category: "Risk" },
  { text: "Show high risk cases in Visakhapatnam", category: "Risk" },
  { text: "Show high risk cases in Guntur with gap above 5 lakhs", category: "Risk" },
  { text: "Show medium risk cases in East zone", category: "Risk" },
  { text: "Show high risk cases in North zone", category: "Risk" },
  { text: "Show high risk cases in Krishna district", category: "Risk" },
  { text: "How many high risk cases are there?", category: "Risk" },

  // Exemption
  { text: "Show all exemption risk cases", category: "Exemption" },
  { text: "Show exemption misuse cases in Vizag", category: "Exemption" },
  { text: "Show exemption misuse in Central zone", category: "Exemption" },
  { text: "Show exemption risk cases in Srikakulam", category: "Exemption" },
  { text: "Show exemption cases in Central zone above 20 lakhs", category: "Exemption" },
  { text: "Show exemption risk cases in Guntur", category: "Exemption" },

  // Prohibited Land
  { text: "Show all prohibited land transaction cases", category: "Prohibited Land" },
  { text: "Show prohibited land matches in North zone", category: "Prohibited Land" },
  { text: "Show prohibited land cases in Visakhapatnam", category: "Prohibited Land" },
  { text: "Find prohibited land matches in East Godavari", category: "Prohibited Land" },

  // Challan Delay
  { text: "Show cases with challan delay signals", category: "Challan Delay" },
  { text: "Show challan delay cases in North zone", category: "Challan Delay" },
  { text: "Show challan delay cases in Vizag", category: "Challan Delay" },
  { text: "Show challan delays above 7 days", category: "Challan Delay" },

  // Payment Gap
  { text: "Show all cases with revenue gap signals", category: "Payment Gap" },
  { text: "Show payment gap cases above 40 lakhs", category: "Payment Gap" },
  { text: "Show payment gap cases in South zone", category: "Payment Gap" },
  { text: "Show revenue gap cases in Anantapur", category: "Payment Gap" },

  // SLA
  { text: "Show all SLA breached cases", category: "SLA" },
  { text: "Show all cases where SLA has been breached", category: "SLA" },
  { text: "SLA breached cases", category: "SLA" },
  { text: "Show SLA-breached cases in last 30 days", category: "SLA" },
  { text: "Show high risk SLA breached cases", category: "SLA" },
  { text: "Show SLA breached cases in Central zone", category: "SLA" },
  { text: "Show SLA breached cases in Visakhapatnam", category: "SLA" },

  // District / Zone Drill-Down
  { text: "Show cases in Guntur", category: "District" },
  { text: "Show cases in Guntur district", category: "District" },
  { text: "Show cases in Kakinada", category: "District" },
  { text: "Show cases in Nellore district", category: "District" },
  { text: "Show cases in Chittoor", category: "District" },
  { text: "Show cases in Eluru", category: "District" },
  { text: "Show cases in West Godavari", category: "District" },
  { text: "Show cases in Kadapa", category: "District" },
  { text: "Show cases in Annamayya district", category: "District" },
  { text: "Show cases in Prakasam", category: "District" },
  { text: "Which zone has the highest gap amount?", category: "District" },
  { text: "Which district has the most high risk cases?", category: "District" },

  // Date-based
  { text: "Show cases registered in the last 30 days", category: "Date" },
  { text: "Show cases from last 7 days", category: "Date" },
  { text: "Show cases registered today", category: "Date" },
  { text: "Show new high risk cases since January", category: "Date" },

  // Status
  { text: "Show all new cases", category: "Status" },
  { text: "Show cases in review", category: "Status" },
  { text: "Show confirmed cases", category: "Status" },
  { text: "Show resolved cases", category: "Status" },

  // Market Value
  { text: "Show cases with market value deviation", category: "Market Value" },
  { text: "Show market value risk cases in East Godavari", category: "Market Value" },
  { text: "Show market value anomalies in South zone", category: "Market Value" },

  // Combined / Drill-Down
  { text: "Show high risk exemption cases in Vizag above 10 lakhs", category: "Drill-Down" },
  { text: "Show SLA breached cases with payment gaps in North zone", category: "Drill-Down" },
  { text: "Show prohibited land cases with high risk in Central zone", category: "Drill-Down" },
  { text: "Top 10 high value cases in Guntur with exemption risk", category: "Drill-Down" },
];

const CATEGORY_ICONS: Record<string, string> = {
  Summary: "📊",
  "High Value": "💰",
  Risk: "🔴",
  Exemption: "🛡️",
  "Prohibited Land": "🚫",
  "Challan Delay": "⏱️",
  "Payment Gap": "💸",
  SLA: "⚠️",
  District: "📍",
  Date: "📅",
  Status: "📋",
  "Market Value": "📈",
  "Drill-Down": "🔍",
};

function filterSuggestions(input: string): PromptSuggestion[] {
  if (!input || input.length < 2) return [];
  const lower = input.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 1);

  return PROMPT_CATALOG.map((item) => {
    const itemLower = item.text.toLowerCase();
    // Score: exact substring match = 10, all words match = 5, partial word match = 1 per word
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

// ── Message Type ───────────────────────────────────────────────────

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
    presentation?: any;
  };
}

// ── Page Component ─────────────────────────────────────────────────

export default function RevenueAIChatPage() {
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

  // Load zone/district options from case data
  useEffect(() => {
    revenueLeakageApi.getCases().then((cases) => {
      setZoneOptions(getAvailableZones(cases));
      setDistrictOptions(getAvailableDistricts(cases));
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────

  const submitPrompt = async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setComposerValue("");
    setShowPlaceholder(true);

    try {
      // Run query and enforce minimum delay so shimmer skeleton is visible
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
      const errorMsg: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "Sorry, there was an error processing your query. Please try again.",
        timestamp: new Date().toISOString(),
        metadata: { stage: "text" },
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendClick = () => {
    submitPrompt(composerValue);
  };

  const handleClarifierResolve = (slots: Record<string, any>) => {
    // Convert slots to a natural language message and re-submit
    const parts = Object.entries(slots)
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
      .join(", ");
    submitPrompt(parts);
  };

  const handleChipClick = (chipText: string) => {
    const prompt = CHIP_PROMPTS[chipText] || chipText;
    submitPrompt(prompt);
  };

  const handleSuggestedPromptClick = (prompt: string) => {
    submitPrompt(prompt);
  };

  const handleNewChat = () => {
    setMessages([]);
    setComposerValue("");
    setShowPlaceholder(true);
    setIsLoading(false);
  };

  const handleSelectSuggestion = useCallback((text: string) => {
    setComposerValue(text);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIdx(-1);
    submitPrompt(text);
  }, []);

  const handleTextareaFocus = () => setShowPlaceholder(false);
  const handleTextareaBlur = () => {
    if (!composerValue.trim()) setShowPlaceholder(true);
    // Delay hiding so click on suggestion registers
    setTimeout(() => setShowSuggestions(false), 200);
  };
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setComposerValue(val);
    setShowPlaceholder(!val);

    // Update suggestions
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

  // ── Render ───────────────────────────────────────────────────────

  return (
    <RevenueLeakageShell subtitle="AI-powered revenue intelligence assistant">
      <TooltipProvider>
        <div className="flex flex-col h-full">
          {/* ── No Messages: Greeting + Composer + Chips ────────── */}
          {messages.length === 0 ? (
            <div
              className="flex-1 flex flex-col items-center justify-center px-4"
              style={{ transform: "translateY(-5vh)" }}
            >
              {/* Greeting */}
              <div className="text-center mb-8">
                <div className="text-[24px] text-slate-900 leading-tight">Revenue Intelligence</div>
                <div className="text-[24px] text-slate-900 leading-tight">
                  What would you like to <span className="text-[#6B7EF3]">audit today?</span>
                </div>
              </div>

              {/* Prompt Composer */}
              <div className="w-full max-w-[720px] mb-4 relative">
                <div
                  className="h-[132px] border border-[#CFE4EA] bg-white rounded-[12px] p-4 relative hover:border-[#6B7EF3] hover:shadow-lg transition-all duration-300 ease-out focus-within:border-[#6B7EF3] focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#6B7EF3]/20"
                  style={{ boxShadow: "0 4px 8px 0 rgba(14, 42, 82, 0.06)" }}
                >
                  {/* Placeholder (pointer-events-none so clicks pass to textarea) */}
                  {showPlaceholder && (
                    <div className="absolute top-4 left-4 right-4 flex items-center gap-2 pointer-events-none z-10">
                      <Sparkles size={12} className="text-slate-400" />
                      <span className="text-[13px] text-slate-400">
                        Sample prompt: Show revenue leakage summary for Visakhapatnam from Feb 1 to
                        Feb 12
                      </span>
                    </div>
                  )}

                  {/* Textarea */}
                  <textarea
                    value={composerValue}
                    onChange={handleTextareaChange}
                    onFocus={handleTextareaFocus}
                    onBlur={handleTextareaBlur}
                    onKeyDown={handleSuggestionKeyDown}
                    className="w-full flex-1 resize-none border-none outline-none text-slate-900 text-sm transition-all duration-200 pt-7"
                    style={{ height: "calc(100% - 40px)" }}
                    aria-label="Enter your audit query"
                  />

                  {/* Bottom controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tooltip delayDuration={150}>
                        <TooltipTrigger asChild>
                          <CircularButton icon={<Clock size={14} />} aria-label="History" />
                        </TooltipTrigger>
                        <TooltipContent side="top">History</TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={150}>
                        <TooltipTrigger asChild>
                          <CircularButton icon={<Star size={14} />} aria-label="Favorites" />
                        </TooltipTrigger>
                        <TooltipContent side="top">Favorites</TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={150}>
                        <TooltipTrigger asChild>
                          <CircularButton
                            icon={<Lightbulb size={14} />}
                            aria-label="Suggested Prompts"
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top">Suggested Prompts</TooltipContent>
                      </Tooltip>
                    </div>
                    <button
                      onClick={handleSendClick}
                      className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-[#6B7EF3] hover:bg-[#6B7EF3] hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 group"
                      aria-label="Send prompt"
                    >
                      <ArrowRight
                        size={18}
                        className="text-slate-400 group-hover:text-white transition-colors duration-200"
                      />
                    </button>
                  </div>
                </div>

                {/* Auto-Suggestions Dropdown (below composer) */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-[136px] z-30 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200"
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
                          <span className="text-base flex-shrink-0">
                            {CATEGORY_ICONS[item.category] || "💡"}
                          </span>
                          <span className="flex-1 truncate">
                            {highlightMatch(item.text, composerValue)}
                          </span>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/80 flex items-center gap-3 text-[10px] text-slate-400">
                      <span>
                        <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-500">↑↓</kbd>{" "}
                        navigate
                      </span>
                      <span>
                        <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-500">Enter</kbd>{" "}
                        select
                      </span>
                      <span>
                        <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-500">Esc</kbd>{" "}
                        close
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Chips */}
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

              {/* Suggested Prompts */}
              <div className="w-full max-w-[720px]">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={14} className="text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Suggested Prompts</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.slice(0, 6).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedPromptClick(prompt)}
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
            /* ── With Messages: Conversation Thread + Bottom Input ── */
            <div className="flex flex-col h-full">
              {/* Conversation Thread */}
              <div className="flex-1 min-h-0 bg-gray-50">
                <RevenueConversationThread
                  messages={messages}
                  onClarifierResolve={handleClarifierResolve}
                  isLoading={isLoading}
                  zoneOptions={zoneOptions}
                  districtOptions={districtOptions}
                />
              </div>

              {/* Bottom Chat Input */}
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

                      {/* Auto-Suggestions (bottom input — drops UP from input since input is at page bottom) */}
                      {showSuggestions && suggestions.length > 0 && messages.length > 0 && (
                        <div className="absolute left-0 right-0 bottom-[44px] z-30 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                          <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50/80">
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                              Suggestions
                            </span>
                          </div>
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
                                <span className="text-base flex-shrink-0">
                                  {CATEGORY_ICONS[item.category] || "💡"}
                                </span>
                                <span className="flex-1 truncate">
                                  {highlightMatch(item.text, composerValue)}
                                </span>
                                <span className="text-[10px] text-slate-400 flex-shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {item.category}
                                </span>
                              </button>
                            ))}
                          </div>
                          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/80 flex items-center gap-3 text-[10px] text-slate-400">
                            <span>
                              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-500">
                                ↑↓
                              </kbd>{" "}
                              navigate
                            </span>
                            <span>
                              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-500">
                                Enter
                              </kbd>{" "}
                              select
                            </span>
                            <span>
                              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-500">
                                Esc
                              </kbd>{" "}
                              close
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSendClick}
                      disabled={isLoading || !composerValue.trim()}
                      className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed hover:scale-110 transition-all duration-200 ease-out active:scale-95"
                      aria-label="Send message"
                    >
                      <ArrowRight size={20} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>
    </RevenueLeakageShell>
  );
}

// ── Highlight Match ─────────────────────────────────────────────────

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

// ── Circular Button ────────────────────────────────────────────────

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
