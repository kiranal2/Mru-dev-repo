"use client";

import { BarChart3, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewKey = "is" | "bs" | "cf";

interface StandardFluxTopNavProps {
  activeView: ViewKey;
  onViewChange: (view: ViewKey) => void;
  aiPanelOpen: boolean;
  onToggleAi: () => void;
  onOpenDrivers: () => void;
  onOpenAlerts: () => void;
  alertsCount: number;
}

const VIEWS: { key: ViewKey; label: string; short: string }[] = [
  { key: "is", label: "Income Statement", short: "IS" },
  { key: "bs", label: "Balance Sheet", short: "BS" },
  { key: "cf", label: "Cash Flow Bridge", short: "CF" },
];

export function StandardFluxTopNav({
  activeView,
  onViewChange,
  aiPanelOpen,
  onToggleAi,
  onOpenDrivers,
  onOpenAlerts,
  alertsCount,
}: StandardFluxTopNavProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-2">
      {/* Left: title + category tabs */}
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-sm font-semibold text-slate-900 shrink-0">Flux Intelligence</h1>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <nav className="flex items-center gap-1" role="tablist" aria-label="Statement view">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              role="tab"
              aria-selected={activeView === v.key}
              onClick={() => onViewChange(v.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                activeView === v.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              )}
            >
              <span className="hidden sm:inline">{v.label}</span>
              <span className="sm:hidden">{v.short}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Right: action icons */}
      <div className="flex items-center gap-1 shrink-0">
        {alertsCount > 0 && (
          <button
            type="button"
            onClick={onOpenAlerts}
            className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
            title="Alerts"
          >
            <ShieldAlert className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
              {alertsCount}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenDrivers}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
          title="Top Drivers"
        >
          <BarChart3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleAi}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            aiPanelOpen ? "text-primary bg-primary/5" : "text-slate-500 hover:bg-slate-100"
          )}
          title={aiPanelOpen ? "Collapse AI panel" : "Expand AI panel"}
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
