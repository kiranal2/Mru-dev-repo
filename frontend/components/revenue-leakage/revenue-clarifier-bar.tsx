"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Play, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LeakageSignal } from "@/lib/revenue-leakage/types";

const SIGNAL_OPTIONS: { value: LeakageSignal; label: string }[] = [
  { value: "RevenueGap", label: "Revenue Gap" },
  { value: "ChallanDelay", label: "Challan Delay" },
  { value: "ExemptionRisk", label: "Exemption Risk" },
  { value: "MarketValueRisk", label: "Market Value" },
  { value: "ProhibitedLand", label: "Prohibited Land" },
  { value: "DataIntegrity", label: "Data Integrity" },
  { value: "HolidayFee", label: "Holiday Fee" },
];

interface RevenueClarifierBarProps {
  missing: string[];
  suggestions?: Record<string, string>;
  onResolve: (slots: Record<string, any>) => void;
  busy?: boolean;
  zoneOptions?: string[];
  districtOptions?: string[];
}

export function RevenueClarifierBar({
  missing,
  suggestions,
  onResolve,
  busy,
  zoneOptions = [],
  districtOptions = [],
}: RevenueClarifierBarProps) {
  const [zone, setZone] = useState(suggestions?.zone || "");
  const [district, setDistrict] = useState(suggestions?.district || "");
  const [riskLevel, setRiskLevel] = useState(suggestions?.risk_level || "");
  const [signalType, setSignalType] = useState(suggestions?.signal_type || "");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [minGap, setMinGap] = useState(suggestions?.min_gap || "");

  const canRun = missing.every((field) => {
    switch (field) {
      case "zone":
        return !!zone;
      case "district":
        return !!district;
      case "risk_level":
        return !!riskLevel;
      case "signal_type":
        return !!signalType;
      case "date_range":
        return !!dateFrom && !!dateTo;
      case "min_gap":
        return !!minGap;
      default:
        return true;
    }
  });

  const handleRun = () => {
    const slots: Record<string, any> = {};
    if (zone) slots.zone = zone;
    if (district) slots.district = district;
    if (riskLevel) slots.risk_level = riskLevel;
    if (signalType) slots.signal_type = signalType;
    if (dateFrom) slots.date_from = format(dateFrom, "yyyy-MM-dd");
    if (dateTo) slots.date_to = format(dateTo, "yyyy-MM-dd");
    if (minGap) slots.min_gap = minGap;
    onResolve(slots);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && canRun && !busy) {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg p-4 mx-4 mb-4 shadow-sm"
      onKeyDown={handleKeyDown}
    >
      <p className="text-xs text-slate-500 mb-3 font-medium">Narrow down your query:</p>
      <div className="flex flex-wrap items-end gap-3">
        {/* Zone */}
        {missing.includes("zone") && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Zone</label>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {zoneOptions.length > 0 ? (
                  zoneOptions.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="Coastal">Coastal</SelectItem>
                    <SelectItem value="Rayalaseema">Rayalaseema</SelectItem>
                    <SelectItem value="North">North</SelectItem>
                    <SelectItem value="South">South</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* District */}
        {missing.includes("district") && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">District</label>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {districtOptions.length > 0 ? (
                  districtOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="Visakhapatnam">Visakhapatnam</SelectItem>
                    <SelectItem value="Srikakulam">Srikakulam</SelectItem>
                    <SelectItem value="Krishna">Krishna</SelectItem>
                    <SelectItem value="Guntur">Guntur</SelectItem>
                    <SelectItem value="Kurnool">Kurnool</SelectItem>
                    <SelectItem value="Chittoor">Chittoor</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Risk Level */}
        {missing.includes("risk_level") && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Risk Level</label>
            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="Risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Signal Type */}
        {missing.includes("signal_type") && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Signal Type</label>
            <Select value={signalType} onValueChange={setSignalType}>
              <SelectTrigger className="w-[170px] h-9 text-sm">
                <SelectValue placeholder="Signal type" />
              </SelectTrigger>
              <SelectContent>
                {SIGNAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range */}
        {missing.includes("date_range") && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] h-9 text-sm justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] h-9 text-sm justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        {/* Min Gap */}
        {missing.includes("min_gap") && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Min Gap (₹)</label>
            <Input
              type="number"
              value={minGap}
              onChange={(e) => setMinGap(e.target.value)}
              placeholder="e.g. 50000"
              className="w-[140px] h-9 text-sm"
            />
          </div>
        )}

        {/* Run Button */}
        <Button
          size="sm"
          onClick={handleRun}
          disabled={!canRun || busy}
          className="h-9 px-4 bg-primary hover:bg-primary/90"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Run
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
