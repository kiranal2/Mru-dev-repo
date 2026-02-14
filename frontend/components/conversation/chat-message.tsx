"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 mb-4", isUser ? "justify-start" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-10 w-10 bg-white border border-gray-200">
          <AvatarFallback className="bg-white">
            <Sparkles className="h-5 w-5 text-red-500" />
          </AvatarFallback>
        </Avatar>
      )}

      {isUser && (
        <Avatar className="h-10 w-10 bg-gray-800 border border-gray-700">
          <AvatarFallback className="bg-gray-800 text-white font-medium text-sm">ML</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col max-w-[70%]")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap",
            isUser ? "bg-gray-100 text-gray-900" : "bg-white border border-gray-200 text-gray-900"
          )}
        >
          {content}
        </div>
        {timestamp && (
          <span className="text-xs text-gray-500 mt-1 ml-2">
            {new Date(timestamp).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        )}
      </div>
    </div>
  );
}
