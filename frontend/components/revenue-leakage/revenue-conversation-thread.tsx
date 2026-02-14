"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/components/conversation/chat-message";
import { RevenueClarifierBar } from "./revenue-clarifier-bar";
import { RevenueResultCard } from "./revenue-result-card";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

interface RevenueConversationThreadProps {
  messages: Message[];
  onClarifierResolve?: (slots: Record<string, any>) => void;
  isLoading?: boolean;
  zoneOptions?: string[];
  districtOptions?: string[];
}

export function RevenueConversationThread({
  messages,
  onClarifierResolve,
  isLoading,
  zoneOptions,
  districtOptions,
}: RevenueConversationThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [loadingStage, setLoadingStage] = useState<"typing" | "analyzing" | "skeleton">("typing");

  // Smooth-scroll to the bottom whenever messages change or loading stage advances
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has painted before scrolling
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, loadingStage, isLoading]);

  // Multi-stage loading progression
  useEffect(() => {
    if (!isLoading) {
      setLoadingStage("typing");
      return;
    }

    setLoadingStage("typing");

    const t1 = setTimeout(() => setLoadingStage("analyzing"), 800);
    const t2 = setTimeout(() => setLoadingStage("skeleton"), 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLoading]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-6 py-4 space-y-4">
      {messages.map((message, idx) => {
        const metadata = message.metadata || {};
        const isLastMessage = idx === messages.length - 1;

        return (
          <div key={message.id}>
            <ChatMessage
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />

            {/* Clarifier Bar — only on the last assistant message */}
            {message.role === "assistant" && metadata.stage === "clarifier" && isLastMessage && (
              <RevenueClarifierBar
                missing={metadata.clarifier?.missing || []}
                suggestions={metadata.clarifier?.suggestions}
                onResolve={onClarifierResolve || (() => {})}
                busy={isLoading}
                zoneOptions={zoneOptions}
                districtOptions={districtOptions}
              />
            )}

            {/* Result Card — on every result message */}
            {message.role === "assistant" &&
              metadata.stage === "result" &&
              metadata.presentation && (
                <div className="animate-fade-slide-up">
                  <RevenueResultCard
                    summary={metadata.presentation.summary}
                    meta={metadata.presentation.meta}
                    rows={metadata.presentation.rows}
                    filters={metadata.presentation.filters}
                  />
                </div>
              )}
          </div>
        );
      })}

      {/* Multi-stage loading indicator */}
      {isLoading && (
        <div className="space-y-3">
          {/* Stage 1: Typing indicator */}
          {loadingStage === "typing" && (
            <div className="flex gap-3 mb-4 animate-fade-slide-up">
              <Avatar className="h-10 w-10 bg-white border border-gray-200">
                <AvatarFallback className="bg-white">
                  <Sparkles className="h-5 w-5 text-red-500" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl px-5 py-3 bg-white border border-gray-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-1" />
                <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-2" />
                <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-3" />
              </div>
            </div>
          )}

          {/* Stage 2: Analyzing with progress text */}
          {loadingStage === "analyzing" && (
            <div className="flex gap-3 mb-4 animate-fade-slide-up">
              <Avatar className="h-10 w-10 bg-white border border-gray-200">
                <AvatarFallback className="bg-white">
                  <Sparkles className="h-5 w-5 text-red-500" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl px-4 py-2.5 bg-white border border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-[#6B7EF3] animate-spin" />
                  <span className="text-sm text-slate-600">Querying revenue records...</span>
                </div>
              </div>
            </div>
          )}

          {/* Stage 3: Shimmer skeleton of result card */}
          {loadingStage === "skeleton" && (
            <div className="space-y-3 animate-fade-slide-up">
              {/* Text response skeleton */}
              <div className="flex gap-3 mb-2">
                <Avatar className="h-10 w-10 bg-white border border-gray-200">
                  <AvatarFallback className="bg-white">
                    <Sparkles className="h-5 w-5 text-red-500" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-2.5 bg-white border border-gray-200 max-w-[70%]">
                  <div className="space-y-2">
                    <div className="h-3.5 w-64 rounded shimmer" />
                    <div className="h-3.5 w-48 rounded shimmer" />
                  </div>
                </div>
              </div>

              {/* Result card skeleton */}
              <ResultCardSkeleton />
            </div>
          )}
        </div>
      )}

      {/* Scroll sentinel — always at the bottom for smooth auto-scroll */}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}

// ── Shimmer Skeleton for Result Card ──────────────────────────────

function ResultCardSkeleton() {
  return (
    <Card className="mx-4 mb-4 overflow-hidden border-slate-200">
      {/* Summary Tiles Skeleton */}
      <div className="grid grid-cols-6 gap-0 border-b border-slate-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-r border-slate-100 last:border-r-0">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-3.5 w-3.5 rounded shimmer" />
              <div className="h-2.5 w-16 rounded shimmer" />
            </div>
            <div className="h-4 rounded shimmer" style={{ width: `${50 + Math.random() * 30}%` }} />
          </div>
        ))}
      </div>

      {/* Action Bar Skeleton */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <div className="h-3 w-24 rounded shimmer" />
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-20 rounded-md shimmer" />
          ))}
        </div>
      </div>

      {/* Table Header Skeleton */}
      <div className="overflow-hidden">
        <div className="bg-slate-50 px-4 py-2.5 flex items-center gap-4 border-b border-slate-100">
          <div className="w-[40px]" />
          <div className="h-3 w-14 rounded shimmer" />
          <div className="h-3 w-16 rounded shimmer" />
          <div className="h-3 w-14 rounded shimmer" />
          <div className="h-3 w-16 rounded shimmer" />
          <div className="h-3 w-14 rounded shimmer" />
          <div className="h-3 w-12 rounded shimmer" />
          <div className="h-3 w-10 rounded shimmer" />
          <div className="h-3 w-10 rounded shimmer" />
          <div className="h-3 w-16 rounded shimmer" />
          <div className="h-3 w-14 rounded shimmer" />
        </div>

        {/* Table Rows Skeleton */}
        {Array.from({ length: 5 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="px-4 py-3 flex items-center gap-4 border-b border-slate-50"
            style={{
              opacity: 0,
              animation: `row-reveal 0.3s ease-out ${rowIdx * 0.1}s forwards`,
            }}
          >
            <div className="w-[40px] flex items-center">
              <div className="h-3.5 w-3.5 rounded shimmer" />
            </div>
            <div className="h-3.5 rounded shimmer" style={{ width: `${60 + rowIdx * 5}px` }} />
            <div className="flex flex-col gap-1">
              <div className="h-3 rounded shimmer" style={{ width: `${50 + rowIdx * 8}px` }} />
              <div className="h-2 w-20 rounded shimmer" />
            </div>
            <div className="h-3.5 rounded shimmer" style={{ width: `${70 + rowIdx * 3}px` }} />
            <div className="h-3.5 w-16 rounded shimmer" />
            <div className="h-3.5 w-14 rounded shimmer" />
            <div className="h-3.5 w-12 rounded shimmer" />
            <div className="h-3.5 w-12 rounded shimmer" />
            <div className="h-5 w-12 rounded-full shimmer" />
            <div className="flex gap-1">
              <div className="h-4 w-16 rounded-full shimmer" />
              <div className="h-4 w-14 rounded-full shimmer" />
            </div>
            <div className="h-5 w-14 rounded-full shimmer" />
          </div>
        ))}
      </div>
    </Card>
  );
}
