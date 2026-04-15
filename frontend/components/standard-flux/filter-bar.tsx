"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MaterialityMode } from "@/lib/data/types/flux-analysis";
import { MATERIALITY_OPTIONS } from "@/app/(main)/reports/analysis/flux-analysis/constants";

interface FilterBarProps {
  activeCard: "variance" | "drivers" | "progress" | "attention" | null;
  expanded: boolean;
  onToggle: () => void;
  // Variance card filters
  comparisonMode: string;
  onComparisonModeChange: (mode: string) => void;
  materiality: MaterialityMode;
  onMaterialityChange: (value: MaterialityMode) => void;
  excludeNoise: boolean;
  onExcludeNoiseChange: (value: boolean) => void;
  // Progress card filters
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  ownerOptions: string[];
  statusOptions: string[];
  // Quick filter (for attention card)
  quickFilter: string;
  onQuickFilterChange: (filter: string) => void;
}

const COMPARISON_MODES = ["QoQ", "YoY", "vs Plan", "vs Forecast"];
const DRIVER_CATEGORIES = ["All", "PV/M", "Operational", "FX", "Timing", "One-time"];
const ATTENTION_FILTERS = [
  { key: "missing-evidence", label: "Missing Evidence" },
  { key: "high-impact", label: "High Impact" },
  { key: "open", label: "Unresolved" },
];

export function FilterBar({
  activeCard,
  expanded,
  onToggle,
  comparisonMode,
  onComparisonModeChange,
  materiality,
  onMaterialityChange,
  excludeNoise,
  onExcludeNoiseChange,
  ownerFilter,
  onOwnerFilterChange,
  statusFilter,
  onStatusFilterChange,
  ownerOptions,
  statusOptions,
  quickFilter,
  onQuickFilterChange,
}: FilterBarProps) {
  if (!activeCard) return null;

  const activeFilterCount = [
    ownerFilter !== "all",
    statusFilter !== "all",
    excludeNoise,
    quickFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="mx-5 mb-2">
      {/* Collapse/expand toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors mb-1"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[9px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Expanded filter content */}
      {expanded && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Variance card → Comparison, Materiality, Noise */}
          {activeCard === "variance" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">Compare:</span>
                <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5">
                  {COMPARISON_MODES.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => onComparisonModeChange(mode)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium rounded transition-colors",
                        comparisonMode === mode
                          ? "bg-primary text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">Materiality:</span>
                <Select value={materiality} onValueChange={(v) => onMaterialityChange(v as MaterialityMode)}>
                  <SelectTrigger className="h-7 w-[140px] text-[11px] border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALITY_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="fb-noise"
                  checked={excludeNoise}
                  onCheckedChange={(checked) => onExcludeNoiseChange(Boolean(checked))}
                />
                <Label htmlFor="fb-noise" className="text-[11px] text-slate-600">Exclude noise</Label>
              </div>
            </div>
          )}

          {/* Drivers card → Driver category */}
          {activeCard === "drivers" && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-medium text-slate-500">Driver category:</span>
              <div className="flex items-center gap-1">
                {DRIVER_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progress card → Status, Owner */}
          {activeCard === "progress" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">Status:</span>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="h-7 w-[120px] text-[11px] border-slate-200">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">Owner:</span>
                <Select value={ownerFilter} onValueChange={onOwnerFilterChange}>
                  <SelectTrigger className="h-7 w-[140px] text-[11px] border-slate-200">
                    <SelectValue placeholder="All Owners" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    {ownerOptions.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Attention card → Quick filters */}
          {activeCard === "attention" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">Show:</span>
              {ATTENTION_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => onQuickFilterChange(quickFilter === f.key ? "all" : f.key)}
                  className={cn(
                    "px-3 py-1 text-[11px] font-medium rounded-md transition-colors",
                    quickFilter === f.key
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
