"use client";

import { Download, ListFilter, Plus, Settings2 } from "lucide-react";
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
  /** Only used in mobile toolbar (desktop uses left-nav) */
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

  /* Shared filter popover content */
  const filterPopoverBody = (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Materiality</label>
        <Select value={materiality} onValueChange={(v) => onMaterialityChange(v as MaterialityMode)}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
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
          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Owners" /></SelectTrigger>
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
          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
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
    </>
  );

  return (
    <>
      {/* ── Mobile/Tablet toolbar (< xl) ── */}
      <div className="xl:hidden px-4 py-1.5 space-y-1.5 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {/* Compare pills (mobile/tablet only — desktop uses left-nav) */}
          <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 shrink-0">
            {COMPARISON_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => onComparisonModeChange(mode)}
                className={cn(
                  "px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap",
                  comparisonMode === mode ? "bg-primary text-white" : "text-slate-400"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Tablet: inline period/consolidation/currency selects (md+) */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <Select defaultValue="q3-current">
              <SelectTrigger className="h-7 w-[140px] rounded-md border-slate-200 bg-white text-[11px]">
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
              <SelectTrigger className="h-7 w-[110px] rounded-md border-slate-200 bg-white text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSOLIDATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="h-7 w-[70px] rounded-md border-slate-200 bg-white text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((curr) => (
                  <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone: period popover (< md) */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="md:hidden rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 shrink-0">
                <Settings2 className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Period</label>
                <Select defaultValue="q3-current">
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="q3-current">Q3 2025 (Current)</SelectItem>
                    <SelectItem value="q2">Q2 2025</SelectItem>
                    <SelectItem value="q1">Q1 2025</SelectItem>
                    <SelectItem value="q4-2024">Q4 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Consolidation</label>
                <Select value={consolidation} onValueChange={onConsolidationChange}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONSOLIDATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Currency</label>
                <Select value={currency} onValueChange={onCurrencyChange}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((curr) => (
                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-500 hover:bg-slate-50 shrink-0">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[11px] font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3 space-y-3">
              {filterPopoverBody}
            </PopoverContent>
          </Popover>

          {/* Export */}
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-500 hover:bg-slate-50 shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-[11px] font-medium">Export</span>
          </button>

          {/* Watch */}
          <button
            onClick={onOpenWatch}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-white hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-[11px] font-medium">Watch</span>
          </button>
        </div>
      </div>

      {/* ── Desktop: compact toolbar (xl+) ── */}
      <div className="hidden xl:block px-5 py-2 bg-slate-50 space-y-1.5 min-w-0 border-b border-slate-200">
        {/* Row 1: Period/Consolidation/Currency + filters/export/watch */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Select defaultValue="q3-current">
            <SelectTrigger className="h-7 w-[150px] rounded-md border-slate-200 bg-white text-xs shrink-0">
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
            <SelectTrigger className="h-7 w-[120px] rounded-md border-slate-200 bg-white text-xs shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONSOLIDATION_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger className="h-7 w-[80px] rounded-md border-slate-200 bg-white text-xs shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((curr) => (
                <SelectItem key={curr} value={curr}>{curr}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="h-4 w-px bg-slate-200 shrink-0" />

          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0">
                <ListFilter className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-white">{activeFilterCount}</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-3 space-y-3">
              {filterPopoverBody}
            </PopoverContent>
          </Popover>

          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            onClick={onOpenWatch}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Watch
          </button>

          {/* KPI chips (right-aligned) */}
          <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 ml-auto">
            {viewKpis.map((kpi) => (
              <div key={kpi.label} className="flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 shrink-0">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{kpi.label}</span>
                <span className="text-[10px] font-bold text-slate-900 whitespace-nowrap">{kpi.value}</span>
                {kpi.change && (
                  <span className={cn("text-[10px] font-medium whitespace-nowrap", kpi.positive ? "text-emerald-600" : "text-red-600")}>{kpi.change}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
