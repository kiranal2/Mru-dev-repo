"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Download, ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { PeriodNode, SubsidiaryNode } from "@/lib/balance-sheet-api";

interface FilterBarProps {
  // Pending filter values
  pendingStartPeriod: string;
  setPendingStartPeriod: (value: string) => void;
  pendingEndPeriod: string;
  setPendingEndPeriod: (value: string) => void;
  pendingGlAccount: string;
  setPendingGlAccount: (value: string) => void;
  pendingSubsidiaries: string[];

  // Popover states
  periodPopoverOpen: boolean;
  setPeriodPopoverOpen: (open: boolean) => void;
  subsidiaryPopoverOpen: boolean;
  setSubsidiaryPopoverOpen: (open: boolean) => void;
  glAccountPopoverOpen: boolean;
  setGlAccountPopoverOpen: (open: boolean) => void;

  // Search states
  periodSearch: string;
  setPeriodSearch: (value: string) => void;
  subsidiarySearch: string;
  setSubsidiarySearch: (value: string) => void;
  glAccountSearch: string;
  setGlAccountSearch: (value: string) => void;

  // Expanded states
  expandedPeriods: Set<string>;
  expandedSubsidiaries: Set<string>;

  // Filtered data
  filteredPeriodNodes: PeriodNode[];
  filteredSubsidiaryNodes: SubsidiaryNode[];
  filteredGlAccounts: string[];

  // Toggle values
  currency: "USD" | "Functional";
  setCurrency: (value: "USD" | "Functional") => void;
  displayMode: "millions" | "full";
  setDisplayMode: (value: "millions" | "full") => void;

  // Handlers
  togglePeriodExpanded: (id: string) => void;
  toggleSubsidiaryExpanded: (id: string) => void;
  handleSubsidiaryToggle: (label: string, checked: boolean) => void;
  handleRemoveSubsidiary: (sub: string) => void;
  handleApplyFilters: () => void;
  handleExportCSV: () => void;
}

// Render hierarchical period tree
function PeriodTree({
  nodes,
  level = 0,
  onSelect,
  expandedPeriods,
  togglePeriodExpanded,
}: {
  nodes: PeriodNode[];
  level?: number;
  onSelect: (label: string) => void;
  expandedPeriods: Set<string>;
  togglePeriodExpanded: (id: string) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedPeriods.has(node.id);
        const isLeafNode = !hasChildren;

        return (
          <div key={node.id}>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded",
                level > 0 && "ml-4",
                isLeafNode ? "hover:bg-gray-100 cursor-pointer" : "cursor-pointer"
              )}
              onClick={() => {
                if (isLeafNode) {
                  onSelect(node.label);
                }
              }}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePeriodExpanded(node.id);
                  }}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-4" />
              )}
              <span className="text-sm flex-1">{node.label}</span>
            </div>
            {hasChildren && isExpanded && (
              <div className="ml-2">
                <PeriodTree
                  nodes={node.children!}
                  level={level + 1}
                  onSelect={onSelect}
                  expandedPeriods={expandedPeriods}
                  togglePeriodExpanded={togglePeriodExpanded}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// Render hierarchical subsidiary tree
function SubsidiaryTree({
  nodes,
  level = 0,
  expandedSubsidiaries,
  toggleSubsidiaryExpanded,
  pendingSubsidiaries,
  handleSubsidiaryToggle,
}: {
  nodes: SubsidiaryNode[];
  level?: number;
  expandedSubsidiaries: Set<string>;
  toggleSubsidiaryExpanded: (id: string) => void;
  pendingSubsidiaries: string[];
  handleSubsidiaryToggle: (label: string, checked: boolean) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedSubsidiaries.has(node.id);
        const isSelected = pendingSubsidiaries.includes(node.label);

        return (
          <div key={node.id}>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer",
                level > 0 && "ml-4"
              )}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubsidiaryExpanded(node.id);
                  }}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-4" />
              )}
              <label className="flex items-center gap-2 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSubsidiaryToggle(node.label, e.target.checked);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm">{node.label}</span>
              </label>
            </div>
            {hasChildren && isExpanded && (
              <div className="ml-2">
                <SubsidiaryTree
                  nodes={node.children!}
                  level={level + 1}
                  expandedSubsidiaries={expandedSubsidiaries}
                  toggleSubsidiaryExpanded={toggleSubsidiaryExpanded}
                  pendingSubsidiaries={pendingSubsidiaries}
                  handleSubsidiaryToggle={handleSubsidiaryToggle}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default function FilterBar(props: FilterBarProps) {
  const {
    pendingStartPeriod,
    setPendingStartPeriod,
    pendingEndPeriod,
    setPendingEndPeriod,
    pendingGlAccount,
    setPendingGlAccount,
    pendingSubsidiaries,
    periodPopoverOpen,
    setPeriodPopoverOpen,
    subsidiaryPopoverOpen,
    setSubsidiaryPopoverOpen,
    glAccountPopoverOpen,
    setGlAccountPopoverOpen,
    periodSearch,
    setPeriodSearch,
    subsidiarySearch,
    setSubsidiarySearch,
    glAccountSearch,
    setGlAccountSearch,
    expandedPeriods,
    expandedSubsidiaries,
    filteredPeriodNodes,
    filteredSubsidiaryNodes,
    filteredGlAccounts,
    currency,
    setCurrency,
    displayMode,
    setDisplayMode,
    togglePeriodExpanded,
    toggleSubsidiaryExpanded,
    handleSubsidiaryToggle,
    handleRemoveSubsidiary,
    handleApplyFilters,
    handleExportCSV,
  } = props;

  return (
    <div className="bg-slate-100 border-b px-4 py-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Start Period */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-700 whitespace-nowrap">
              Start Period:
            </label>
            <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 min-w-[140px] h-9 justify-between bg-white hover:bg-slate-50"
                >
                  <span className="text-sm">{pendingStartPeriod}</span>
                  <X
                    className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingStartPeriod("");
                    }}
                  />
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
                    <PeriodTree
                      nodes={filteredPeriodNodes}
                      onSelect={(label) => {
                        setPendingStartPeriod(label);
                        setPeriodPopoverOpen(false);
                      }}
                      expandedPeriods={expandedPeriods}
                      togglePeriodExpanded={togglePeriodExpanded}
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

          {/* End Period */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
              End Period:
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 min-w-[140px] h-9 justify-between bg-white hover:bg-slate-50"
                >
                  <span className="text-sm">{pendingEndPeriod}</span>
                  <X
                    className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingEndPeriod("");
                    }}
                  />
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
                    <PeriodTree
                      nodes={filteredPeriodNodes}
                      onSelect={(label) => {
                        setPendingEndPeriod(label);
                      }}
                      expandedPeriods={expandedPeriods}
                      togglePeriodExpanded={togglePeriodExpanded}
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

          {/* GL Account */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
              GL Account:
            </label>
            <Popover open={glAccountPopoverOpen} onOpenChange={setGlAccountPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 min-w-[200px] h-9 justify-between bg-white hover:bg-slate-50"
                >
                  <span className="text-sm">{pendingGlAccount}</span>
                  <X
                    className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingGlAccount("");
                    }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Type to Search..."
                      value={glAccountSearch}
                      onChange={(e) => setGlAccountSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-2">
                  {filteredGlAccounts.length > 0 ? (
                    filteredGlAccounts.map((account) => (
                      <div
                        key={account}
                        className="px-3 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                        onClick={() => {
                          setPendingGlAccount(account);
                          setGlAccountPopoverOpen(false);
                        }}
                      >
                        {account}
                      </div>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-sm text-gray-500 text-center">
                      No accounts found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Subsidiary */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
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
                      {pendingSubsidiaries.map((sub) => (
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
                    <SubsidiaryTree
                      nodes={filteredSubsidiaryNodes}
                      expandedSubsidiaries={expandedSubsidiaries}
                      toggleSubsidiaryExpanded={toggleSubsidiaryExpanded}
                      pendingSubsidiaries={pendingSubsidiaries}
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
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={currency}
            onValueChange={(value: string | undefined) =>
              value && setCurrency(value as "USD" | "Functional")
            }
            className="inline-flex border border-slate-200 rounded-md bg-white p-0.5 gap-0 shadow-sm"
          >
            <ToggleGroupItem
              value="USD"
              aria-label="USD"
              className={cn(
                "px-4 py-2 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-900 data-[state=on]:font-medium border-0 hover:bg-slate-50 transition-colors",
                currency === "USD" && "bg-slate-100"
              )}
            >
              USD
            </ToggleGroupItem>
            <ToggleGroupItem
              value="Functional"
              aria-label="Functional"
              className={cn(
                "px-4 py-2 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-900 data-[state=on]:font-medium border-0 hover:bg-slate-50 transition-colors",
                currency === "Functional" && "bg-slate-100"
              )}
            >
              Functional
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={displayMode}
            onValueChange={(value: string | undefined) =>
              value && setDisplayMode(value as "millions" | "full")
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
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
