"use client";

import { cn } from "@/lib/utils";
import { BarChart2, CalendarRange, LineChart, Target } from "lucide-react";

interface ComparisonItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}

const COMPARISONS: ComparisonItem[] = [
  { key: "QoQ", label: "Quarter over Quarter", icon: CalendarRange, hint: "QoQ" },
  { key: "YoY", label: "Year over Year", icon: BarChart2, hint: "YoY" },
  { key: "vs Plan", label: "vs Plan", icon: Target, hint: "Plan" },
  { key: "vs Forecast", label: "vs Forecast", icon: LineChart, hint: "Forecast" },
];

interface StandardFluxLeftNavProps {
  comparisonMode: string;
  onComparisonChange: (mode: string) => void;
}

export function StandardFluxLeftNav({
  comparisonMode,
  onComparisonChange,
}: StandardFluxLeftNavProps) {
  return (
    <aside
      className="hidden xl:flex w-[180px] shrink-0 flex-col border-r border-slate-200 bg-white"
      aria-label="Comparison mode"
    >
      <div className="px-3 py-2 border-b border-slate-100">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Compare
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {COMPARISONS.map((c) => {
          const Icon = c.icon;
          const active = comparisonMode === c.key;
          return (
            <button
              key={c.key}
              onClick={() => onComparisonChange(c.key)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "text-slate-400")} />
              <span className="flex-1 truncate">{c.label}</span>
              {c.hint && (
                <span
                  className={cn(
                    "text-[9px] font-semibold rounded px-1.5 py-0.5",
                    active
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {c.hint}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
