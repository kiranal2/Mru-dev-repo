"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Download, Columns, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { ViewMode, DisplayMode, PeriodNode, SubsidiaryNode } from "../types";
import { PeriodTreeSelect } from "./PeriodTreeSelect";
import { SubsidiaryTreeSelect } from "./SubsidiaryTreeSelect";

interface FilterBarProps {
  // View
  pendingView: ViewMode;
  setPendingView: (view: ViewMode) => void;
  // Periods
  pendingPeriods: string[];
  periodPopoverOpen: boolean;
  setPeriodPopoverOpen: (open: boolean) => void;
  handleRemovePeriod: (period: string) => void;
  periodSearch: string;
  setPeriodSearch: (search: string) => void;
  filteredPeriodNodes: PeriodNode[];
  expandedPeriods: Set<string>;
  togglePeriodExpanded: (id: string) => void;
  handlePeriodToggle: (period: string, checked: boolean) => void;
  // Subsidiaries
  pendingSubsidiaries: string[];
  subsidiaryPopoverOpen: boolean;
  setSubsidiaryPopoverOpen: (open: boolean) => void;
  handleRemoveSubsidiary: (subsidiary: string) => void;
  subsidiarySearch: string;
  setSubsidiarySearch: (search: string) => void;
  filteredSubsidiaryNodes: SubsidiaryNode[];
  expandedSubsidiaries: Set<string>;
  toggleSubsidiaryExpanded: (id: string) => void;
  handleSubsidiaryToggle: (subsidiary: string, checked: boolean) => void;
  // Actions
  handleApplyFilters: () => void;
  // Display
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
}

export function FilterBar({
  pendingView,
  setPendingView,
  pendingPeriods,
  periodPopoverOpen,
  setPeriodPopoverOpen,
  handleRemovePeriod,
  periodSearch,
  setPeriodSearch,
  filteredPeriodNodes,
  expandedPeriods,
  togglePeriodExpanded,
  handlePeriodToggle,
  pendingSubsidiaries,
  subsidiaryPopoverOpen,
  setSubsidiaryPopoverOpen,
  handleRemoveSubsidiary,
  subsidiarySearch,
  setSubsidiarySearch,
  filteredSubsidiaryNodes,
  expandedSubsidiaries,
  toggleSubsidiaryExpanded,
  handleSubsidiaryToggle,
  handleApplyFilters,
  displayMode,
  setDisplayMode,
}: FilterBarProps) {
  return (
    <div className="bg-slate-100 border-b px-6 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          {/* View Select */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">View:</label>
            <Select
              value={pendingView}
              onValueChange={(value: string) => setPendingView(value as ViewMode)}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consolidated">Consolidated</SelectItem>
                <SelectItem value="comparative">Comparative</SelectItem>
                <SelectItem value="trended">Trended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period Popover */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Period:</label>
            <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 min-w-[200px] h-9 justify-start bg-white hover:bg-slate-50"
                >
                  {pendingPeriods.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      {pendingPeriods.slice(0, 2).map((period) => (
                        <Badge
                          key={period}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePeriod(period);
                          }}
                        >
                          {period}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                      {pendingPeriods.length > 2 && (
                        <Badge variant="secondary" className="flex items-center gap-1 pr-1">
                          +{pendingPeriods.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm flex-1">Select a period</span>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Type to Search..."
                      value={periodSearch}
                      onChange={(e) => setPeriodSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-2">
                  {filteredPeriodNodes.length > 0 ? (
                    <PeriodTreeSelect
                      nodes={filteredPeriodNodes}
                      pendingView={pendingView}
                      pendingPeriods={pendingPeriods}
                      expandedPeriods={expandedPeriods}
                      togglePeriodExpanded={togglePeriodExpanded}
                      handlePeriodToggle={handlePeriodToggle}
                    />
                  ) : (
                    <div className="px-2 py-4 text-sm text-gray-500 text-center">
                      No periods found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Subsidiary Popover */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Subsidiary:
            </label>
            <Popover open={subsidiaryPopoverOpen} onOpenChange={setSubsidiaryPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 min-w-[300px] h-9 justify-start bg-white hover:bg-slate-50"
                >
                  {pendingSubsidiaries.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      {pendingSubsidiaries.slice(0, 1).map((sub) => (
                        <Badge
                          key={sub}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSubsidiary(sub);
                          }}
                        >
                          {sub}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                      {pendingSubsidiaries.length > 1 && (
                        <Badge variant="secondary" className="flex items-center gap-1 pr-1">
                          +{pendingSubsidiaries.length - 1}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm flex-1">Select a subsidiary</span>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Type to Search..."
                      value={subsidiarySearch}
                      onChange={(e) => setSubsidiarySearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-2">
                  {filteredSubsidiaryNodes.length > 0 ? (
                    <SubsidiaryTreeSelect
                      nodes={filteredSubsidiaryNodes}
                      pendingSubsidiaries={pendingSubsidiaries}
                      expandedSubsidiaries={expandedSubsidiaries}
                      toggleSubsidiaryExpanded={toggleSubsidiaryExpanded}
                      handleSubsidiaryToggle={handleSubsidiaryToggle}
                    />
                  ) : (
                    <div className="px-2 py-4 text-sm text-gray-500 text-center">
                      No subsidiaries found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button className="h-9 px-6" onClick={handleApplyFilters}>
            Go
          </Button>
        </div>

        {/* Right side: display mode + actions */}
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={displayMode}
            onValueChange={(value: string | undefined) =>
              value && setDisplayMode(value as DisplayMode)
            }
            className="inline-flex border border-slate-200 rounded-md bg-white p-0.5 gap-0 shadow-sm"
          >
            <ToggleGroupItem
              value="millions"
              aria-label="Millions"
              className={cn(
                "px-4 py-2 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-900 data-[state=on]:font-medium border-0 hover:bg-slate-50 transition-colors",
                displayMode === "millions" && "bg-slate-100"
              )}
            >
              Millions
            </ToggleGroupItem>
            <ToggleGroupItem
              value="full"
              aria-label="Full Amount"
              className={cn(
                "px-4 py-2 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-900 data-[state=on]:font-medium border-0 hover:bg-slate-50 transition-colors",
                displayMode === "full" && "bg-slate-100"
              )}
            >
              Full Amount
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="outline"
            size="sm"
            className="h-9 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
          >
            <Columns className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
