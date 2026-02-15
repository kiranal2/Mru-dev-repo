"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  MessageSquarePlus,
  Bot,
  User,
} from "lucide-react";
import { useChatSessions } from "@/hooks/data/use-common";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const QUICK_CHIPS = [
  "Leakage Summary",
  "Top Billing Errors",
  "Pricing Discrepancies",
  "Contract Violations",
  "Discount Abuse",
  "Recovery Status",
  "High Risk Accounts",
];

const CHIP_PROMPTS: Record<string, string> = {
  "Leakage Summary": "Show me the overall enterprise revenue leakage summary for this quarter",
  "Top Billing Errors": "What are the top 10 billing errors by dollar amount this month?",
  "Pricing Discrepancies": "List all active pricing discrepancy cases with impact above $50,000",
  "Contract Violations": "Show contract compliance violations across enterprise accounts",
  "Discount Abuse": "Show accounts with discount rates exceeding contractual thresholds",
  "Recovery Status": "What is the current recovery status across all active cases?",
  "High Risk Accounts": "Which enterprise accounts have the highest leakage risk scores?",
};

const SUGGESTED_PROMPTS = [
  "Show enterprise accounts with leakage above $100K this quarter",
  "Which contracts have the lowest billing compliance scores?",
  "List all unresolved pricing discrepancy cases",
  "What is the total recovered revenue this month?",
  "Show subscription renewal rate mismatches for Mid-Market tier",
  "Find accounts with promotional pricing beyond contract period",
];

function generateResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("summary") || q.includes("overview")) {
    return `**Enterprise Revenue Leakage Summary - Q1 2026**

Based on the current detection engine analysis:

- **Total Leakage Detected:** $4.8M across 127 active cases
- **Recovered to Date:** $2.1M (43.8% recovery rate)
- **Active Investigations:** 42 cases in progress
- **Top Category:** Pricing discrepancies account for 38% of total leakage
- **Highest Impact Account:** Apex Financial Corp with $680K in billing errors

**Key Trends:**
- Billing errors increased 12% month-over-month
- Contract compliance improved to 94.2% from 91.8%
- Average case resolution time decreased to 14.3 days

Recommend prioritizing the 8 Critical-severity cases currently in the pipeline.`;
  }

  if (q.includes("billing") || q.includes("error")) {
    return `**Top Billing Errors by Impact**

| Case # | Customer | Error Type | Amount | Status |
|--------|----------|-----------|--------|--------|
| RA-2026-0042 | Apex Financial | Rate override | $340,200 | Investigating |
| RA-2026-0089 | TechCore Inc | Usage metering gap | $285,000 | Confirmed |
| RA-2026-0103 | Global Mfg Co | Duplicate charge | $198,500 | Open |
| RA-2026-0067 | Summit Health | Wrong SKU | $165,300 | Investigating |
| RA-2026-0112 | DataStream LLC | Pro-ration error | $142,000 | Open |

Total impact of top 5 billing errors: **$1.13M**

These cases primarily stem from system integration gaps between the CRM and billing platform. The rate override issue at Apex Financial is the most urgent given the account relationship value.`;
  }

  if (q.includes("pricing") || q.includes("discrepan")) {
    return `**Active Pricing Discrepancy Cases**

Found **23 active cases** with pricing discrepancies above $50,000:

- **Enterprise Tier:** 9 cases totaling $1.8M
  - Volume discount miscalculation (4 cases)
  - List price vs. contracted rate mismatch (3 cases)
  - Currency conversion errors (2 cases)

- **Mid-Market Tier:** 11 cases totaling $890K
  - Renewal rate mismatch (5 cases)
  - Promotional pricing overrun (4 cases)
  - Bundle pricing errors (2 cases)

- **SMB Tier:** 3 cases totaling $210K

**Root Cause Analysis:** 65% of pricing discrepancies trace to stale price book entries not synchronized with the latest MSA amendments.`;
  }

  if (q.includes("contract") || q.includes("compliance") || q.includes("violation")) {
    return `**Contract Compliance Analysis**

Current compliance metrics across the portfolio:

- **Average Compliance Score:** 92.4%
- **Contracts Below 80%:** 14 (high attention needed)
- **SLA Credit Gaps:** 5 customers owed $340K in un-applied credits
- **Term Violations:** 8 contracts with billing frequency mismatches

**Critical Issues:**
1. 3 enterprise contracts have discount rates applied above authorized limits
2. 2 contracts are being billed beyond their end date without renewal
3. 7 multi-year agreements have un-updated annual escalation rates

Recommend running a full contract audit for the 14 sub-80% compliance contracts.`;
  }

  if (q.includes("discount") || q.includes("abuse")) {
    return `**Discount Threshold Analysis**

Found **15 accounts** with discount rates exceeding contractual thresholds:

| Customer | Contracted Max | Applied Rate | Overage |
|----------|---------------|-------------|---------|
| Apex Financial | 25% | 32% | 7% |
| TechCore Inc | 20% | 28% | 8% |
| Summit Health | 15% | 22% | 7% |
| DataStream LLC | 30% | 35% | 5% |

**Estimated annual revenue impact:** $1.1M from over-discounting

Most overages stem from manual discount overrides by sales representatives that bypassed approval workflows. 4.2-month average overrun on promotional periods.`;
  }

  if (q.includes("recover") || q.includes("status")) {
    return `**Recovery Status Dashboard**

| Status | Count | Value |
|--------|-------|-------|
| Open | 34 | $1.9M |
| Investigating | 42 | $1.4M |
| Confirmed | 28 | $890K |
| Recovered | 18 | $2.1M |
| Closed | 5 | $320K |

**Recovery rate:** 43.8% of total detected leakage
**Average resolution time:** 14.3 days
**Fastest resolution:** 2 days (duplicate billing auto-detection)
**Longest open case:** 45 days (multi-element revenue allocation)`;
  }

  if (q.includes("risk") || q.includes("high risk") || q.includes("account")) {
    return `**Highest Risk Enterprise Accounts**

| Customer | Risk Score | Active Cases | Total Leakage |
|----------|-----------|-------------|---------------|
| Apex Financial Corp | 87/100 | 8 | $680,000 |
| TechCore Industries | 82/100 | 6 | $520,000 |
| Global Manufacturing | 76/100 | 5 | $410,000 |
| Summit Healthcare | 71/100 | 4 | $380,000 |
| DataStream LLC | 68/100 | 3 | $290,000 |

**Risk Factors:**
- Apex Financial: Complex multi-product bundle with 12 pricing tiers
- TechCore: High-volume consumption billing with metering gaps
- Global Manufacturing: Legacy contract with manual billing processes`;
  }

  return `Thank you for your query. Based on the current revenue assurance data:

The enterprise revenue leakage detection system is monitoring **$48.2M** in annual contract value across **156 active customer accounts**. Current analysis shows:

- **127 active leakage cases** across 7 categories
- **$4.8M total leakage detected** this quarter
- **43.8% recovery rate** ($2.1M recovered)
- **Pricing and Billing** categories represent 62% of all cases

For more specific analysis, try asking about:
- Specific leakage categories (pricing, billing, contract, etc.)
- Individual customer accounts or tiers
- Recovery status and trends
- Contract compliance metrics`;
}

export default function RevenueAssuranceAIChatPage() {
  // Data layer connection for chat sessions
  const { loading: sessionsLoading } = useChatSessions();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content: generateResponse(text),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue("");
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {messages.length === 0 ? (
        /* Empty State */
        <div
          className="flex-1 flex flex-col items-center justify-center px-4"
          style={{ transform: "translateY(-5vh)" }}
        >
          <div className="text-center mb-8">
            <div className="text-[24px] text-slate-900 leading-tight">
              Revenue Intelligence
            </div>
            <div className="text-[24px] text-slate-900 leading-tight">
              What would you like to <span className="text-blue-600">analyze today?</span>
            </div>
          </div>

          {/* Composer */}
          <div className="w-full max-w-[720px] mb-4 relative">
            <div className="h-[120px] border border-slate-200 bg-white rounded-xl p-4 relative hover:border-blue-400 hover:shadow-lg transition-all duration-300 focus-within:border-blue-400 focus-within:shadow-lg focus-within:ring-2 focus-within:ring-blue-400/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={12} className="text-slate-400" />
                <span className="text-[13px] text-slate-400">
                  Ask about billing errors, pricing discrepancies, or contract compliance...
                </span>
              </div>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(inputValue);
                  }
                }}
                className="w-full resize-none border-none outline-none text-slate-900 text-sm"
                style={{ height: "calc(100% - 60px)" }}
                placeholder=""
              />
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={() => handleSend(inputValue)}
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-blue-500 hover:bg-blue-500 hover:scale-110 hover:shadow-md transition-all duration-200 group"
                >
                  <ArrowRight
                    size={18}
                    className="text-slate-400 group-hover:text-white transition-colors"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSend(CHIP_PROMPTS[chip] || chip)}
                className="h-8 px-3.5 border rounded-full text-sm bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md hover:scale-105 transition-all duration-200"
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
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors duration-150 flex items-center gap-2 group"
                >
                  <ChevronRight
                    size={12}
                    className="text-slate-300 group-hover:text-blue-500 transition-colors"
                  />
                  <span className="group-hover:text-slate-900 transition-colors">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* With Messages */
        <div className="flex flex-col h-full">
          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-4 py-6">
            <div className="max-w-[960px] mx-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 text-slate-800"
                    }`}
                  >
                    <div
                      className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "assistant" ? "prose prose-sm max-w-none" : ""
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p
                      className={`text-[10px] mt-2 ${
                        msg.role === "user" ? "text-blue-200" : "text-slate-400"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                      <div
                        className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Input */}
          <div className="bg-white border-t border-slate-200 px-4 py-3">
            <div className="max-w-[960px] mx-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNewChat}
                  className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 hover:scale-110 transition-all duration-200"
                  title="New Chat"
                >
                  <MessageSquarePlus size={18} className="text-slate-500" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(inputValue);
                      }
                    }}
                    placeholder="Ask a follow-up question..."
                    className="w-full resize-none border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={isLoading || !inputValue.trim()}
                  className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed hover:scale-110 transition-all duration-200"
                >
                  <ArrowRight size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
