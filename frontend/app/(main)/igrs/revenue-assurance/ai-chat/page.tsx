"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatSessions } from "@/hooks/data/use-common";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hello! I am the IGRS Revenue Assurance AI assistant. I can help you analyze cases, understand revenue gaps, review detection rules, and explore patterns in registration data. What would you like to know?",
    timestamp: new Date(),
  },
];

const MOCK_RESPONSES: Record<string, string> = {
  default:
    "I have analyzed the available data. Could you provide more specific details about what you would like to explore? For example, you can ask about high-risk cases, revenue gaps by district, or rule performance metrics.",
  cases:
    "Based on the current dataset, there are several high-risk cases concentrated in the Hyderabad and Rangareddy districts. The most common leakage signal is RevenueGap, followed by MarketValueRisk. Would you like me to drill down into a specific district or signal type?",
  rules:
    "The detection engine currently has rules across 6 categories: Valuation, StampDuty, Exemption, Compliance, Operational, and Systemic. The Valuation rules have the highest hit rate, while Exemption rules tend to identify the largest individual gaps. Shall I provide details on any specific category?",
  gap: "The total revenue gap across all active cases is significant. The primary contributors are stamp duty underpayments and market value deviations. Offices in urban districts show higher absolute gaps, while rural offices have higher gap-to-payable ratios on average.",
  trends:
    "Monthly trend analysis shows a seasonal uptick in registrations during Q4 (October-December), which also correlates with higher detection volumes. The average gap per case has been trending upward over the last 3 months, suggesting emerging patterns that warrant attention.",
};

function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("case") || lower.includes("risk"))
    return MOCK_RESPONSES.cases;
  if (lower.includes("rule") || lower.includes("detect"))
    return MOCK_RESPONSES.rules;
  if (lower.includes("gap") || lower.includes("revenue") || lower.includes("leakage"))
    return MOCK_RESPONSES.gap;
  if (lower.includes("trend") || lower.includes("pattern") || lower.includes("month"))
    return MOCK_RESPONSES.trends;
  return MOCK_RESPONSES.default;
}

export default function AIChatPage() {
  // Data layer connection for chat sessions
  const { loading: sessionsLoading } = useChatSessions();

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: getMockResponse(currentInput),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1500);
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-2xl font-semibold mb-4">AI Chat Assistant</h1>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base">IGRS Revenue Assurance Assistant</CardTitle>
          <p className="text-xs text-muted-foreground">
            Ask questions about cases, rules, revenue gaps, and trends. This is a mock
            interface for demonstration purposes.
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about cases, rules, gaps, trends..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isTyping}
            />
            <Button onClick={handleSend} disabled={isTyping || !input.trim()}>
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
