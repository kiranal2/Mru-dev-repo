"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  greeting: string;
  periodLabel: string;
  onToggleAI: () => void;
  aiActive?: boolean;
}

export function DashboardHeader({ greeting, periodLabel, onToggleAI, aiActive }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{greeting}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{periodLabel}</p>
      </div>
      <button
        onClick={onToggleAI}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          aiActive
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-slate-500 hover:text-primary hover:bg-slate-100"
        )}
      >
        <Sparkles className={cn("w-3.5 h-3.5", aiActive && "animate-pulse")} />
        Ask AI
      </button>
    </div>
  );
}
