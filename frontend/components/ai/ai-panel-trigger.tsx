"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiPanelTriggerProps {
  onClick: () => void;
  isActive?: boolean;
  theme?: "light" | "dark";
  className?: string;
}

export function AiPanelTrigger({
  onClick,
  isActive = false,
  theme = "light",
  className,
}: AiPanelTriggerProps) {
  const isDark = theme === "dark";

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all",
        isActive
          ? isDark
            ? "bg-amber-500/20 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.15)]"
            : "bg-primary/10 text-primary shadow-sm"
          : isDark
            ? "text-slate-400 hover:text-amber-400 hover:bg-white/5"
            : "text-slate-500 hover:text-primary hover:bg-slate-50",
        className
      )}
    >
      <Sparkles className={cn("w-3.5 h-3.5", isActive && "animate-pulse")} />
      <span>Ask AI</span>
    </button>
  );
}
