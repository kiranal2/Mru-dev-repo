"use client";

import { Download, ListFilter, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MaterialityMode } from "@/lib/data/types/flux-analysis";
import {
  MATERIALITY_OPTIONS,
  CONSOLIDATION_OPTIONS,
  CURRENCY_OPTIONS,
} from "@/app/(main)/reports/analysis/flux-analysis/constants";

interface ViewKpi {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

const COMPARISON_MODES = ["QoQ", "YoY", "vs Plan", "vs Forecast"];

interface StandardFluxToolbarProps {
  activeView: "is" | "bs" | "cf";
  onViewChange: (view: "is" | "bs" | "cf") => void;
  comparisonMode: string;
  onComparisonModeChange: (mode: string) => void;
  consolidation: string;
  onConsolidationChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  materiality: MaterialityMode;
  onMaterialityChange: (value: MaterialityMode) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  excludeNoise: boolean;
  onExcludeNoiseChange: (value: boolean) => void;
  ownerOptions: string[];
  statusOptions: string[];
  viewKpis: ViewKpi[];
  onExport: () => void;
  onOpenWatch: () => void;
}

export function StandardFluxToolbar({
  activeView,
  onViewChange,
  comparisonMode,
  onComparisonModeChange,
  consolidation,
  onConsolidationChange,
  currency,
  onCurrencyChange,
  materiality,
  onMaterialityChange,
  ownerFilter,
  onOwnerFilterChange,
  statusFilter,
  onStatusFilterChange,
  excludeNoise,
  onExcludeNoiseChange,
  ownerOptions,
  statusOptions,
  viewKpis,
  onExport,
  onOpenWatch,
}: StandardFluxToolbarProps) {
  const activeFilterCount = [
    ownerFilter !== "all",
    statusFilter !== "all",
    excludeNoise,
  ].filter(Boolean).length;

  return (
    <div className="px-5 py-2 bg-slate-50 space-y-2">
      {/* Row 1: Comparison Mode */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500 mr-1">Compare:</span>
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          {COMPARISON_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => onComparisonModeChange(mode)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
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

      {/* Row 2: View tabs + controls + KPI chips */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(["is", "bs", "cf"] as const).map((view) => {
            const labels = { is: "Income Statement", bs: "Balance Sheet", cf: "Cash Flow Bridge" };
            return (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                  activeView === view
                    ? "bg-white text-primary shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                {labels[view]}
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <Select defaultValue="q3-current">
            <SelectTrigger className="h-7 w-[150px] rounded-md border-slate-200 bg-white text-xs">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q3-current">Q3 2025 (Current)</SelectItem>
              <SelectItem value="q2">Q2 2025</SelectItem>
              <SelectItem value="q1">Q1 2025</SelectItem>
              <SelectItem value="q4-2024">Q4 2024</SelectItem>
            </SelectContent>
          </Select>

          <Select value={consolidation} onValueChange={onConsolidationChange}>
            <SelectTrigger className="h-7 w-[120px] rounded-md border-slate-200 bg-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONSOLIDATION_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger className="h-7 w-[80px] rounded-md border-slate-200 bg-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((curr) => (
                <SelectItem key={curr} value={curr}>{curr}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filters Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <ListFilter className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-3 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Materiality</label>
                <Select value={materiality} onValueChange={(v) => onMaterialityChange(v as MaterialityMode)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MATERIALITY_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Owner</label>
                <Select value={ownerFilter} onValueChange={onOwnerFilterChange}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Owners" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    {ownerOptions.map((owner) => (
                      <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Status</label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="sf-exclude-noise"
                  checked={excludeNoise}
                  onCheckedChange={(checked) => onExcludeNoiseChange(Boolean(checked))}
                />
                <Label htmlFor="sf-exclude-noise" className="text-xs text-slate-600">Exclude noise</Label>
              </div>
            </PopoverContent>
          </Popover>

          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            onClick={onOpenWatch}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Watch
          </button>
        </div>

        {/* Right: KPI chips */}
        <div className="flex items-center gap-1.5">
          {viewKpis.map((kpi) => (
            <div key={kpi.label} className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1">
              <span className="text-[11px] text-slate-500">{kpi.label}</span>
              <span className="text-[11px] font-bold text-slate-900">{kpi.value}</span>
              {kpi.change && (
                <span className={cn("text-[10px] font-medium", kpi.positive ? "text-emerald-600" : "text-red-600")}>{kpi.change}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
