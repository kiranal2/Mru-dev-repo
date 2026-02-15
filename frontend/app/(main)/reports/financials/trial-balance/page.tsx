"use client";

import { useState, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

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
import { X, Download, Columns, ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Breadcrumb from "@/components/layout/breadcrumb";
import {
  getPeriodStructure,
  getSubsidiaryStructure,
  getDefaultFilters,
  type PeriodNode,
  type SubsidiaryNode,
} from "@/lib/balance-sheet-api";
import { useTrialBalance } from "@/hooks/data";
import type { TrialBalanceAccount } from "@/lib/data/types";

interface TrialBalanceRow {
  account: string;
  debit?: number;
  credit?: number;
  total: number;
}

// Transform TrialBalanceAccount[] from the data layer into TrialBalanceRow[] for the grid
function transformTrialBalanceAccounts(accounts: TrialBalanceAccount[]): TrialBalanceRow[] {
  return accounts.map((acct) => ({
    account: `${acct.accountNumber} - ${acct.accountName}`,
    debit: acct.debit,
    credit: acct.credit,
    total: acct.netBalance,
  }));
}

// Load period and subsidiary structure from API
const PERIOD_STRUCTURE = getPeriodStructure();
const SUBSIDIARY_STRUCTURE = getSubsidiaryStructure();
const defaultFilters = getDefaultFilters();

export default function TrialBalancePage() {
  // Fetch data from the new data layer
  const { data: trialBalanceAccounts, loading: dataLoading, error: dataError } = useTrialBalance();

  // Transform data-layer accounts into grid-compatible rows
  const rowData: TrialBalanceRow[] = useMemo(() => {
    if (trialBalanceAccounts.length > 0) {
      return transformTrialBalanceAccounts(trialBalanceAccounts);
    }
    return [];
  }, [trialBalanceAccounts]);
  const gridRef = useRef<AgGridReact>(null);
  const [asOfPeriods, setAsOfPeriods] = useState<string[]>(["Oct 2024"]);
  const [subsidiaries, setSubsidiaries] = useState<string[]>([
    "BetaFoods Consolidated (Incl. Averra)",
  ]);
  const [currency, setCurrency] = useState<"USD" | "Functional">("USD");
  const [displayMode, setDisplayMode] = useState<"millions" | "full">("millions");

  // Pending filter states (before clicking Go)
  const [pendingPeriods, setPendingPeriods] = useState<string[]>(["Oct 2024"]);
  const [pendingSubsidiaries, setPendingSubsidiaries] = useState<string[]>([
    "BetaFoods Consolidated (Incl. Averra)",
  ]);
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const [subsidiaryPopoverOpen, setSubsidiaryPopoverOpen] = useState(false);

  // Hierarchical filter states
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(["FY-2024"]));
  const [expandedSubsidiaries, setExpandedSubsidiaries] = useState<Set<string>>(
    new Set(["betaFoods-consolidated"])
  );
  const [periodSearch, setPeriodSearch] = useState("");
  const [subsidiarySearch, setSubsidiarySearch] = useState("");

  const formatCurrency = useMemo(
    () =>
      (value: number | undefined): string => {
        if (value === undefined || value === null) return "-";
        if (displayMode === "millions") {
          const absValue = Math.abs(value);
          const sign = value < 0 ? "-" : "";
          return `${sign}$${absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
        }
        // Convert from millions to full amount
        const valueInFull = value * 1000000;
        const absValue = Math.abs(valueInFull);
        const sign = valueInFull < 0 ? "-" : "";
        return `${sign}$${absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    [displayMode]
  );

  // Filter period nodes based on search
  const filterPeriodNodes = (nodes: PeriodNode[], search: string): PeriodNode[] => {
    if (!search) return nodes;
    const lowerSearch = search.toLowerCase();
    const filtered: PeriodNode[] = [];
    nodes.forEach((node) => {
      const matches = node.label.toLowerCase().includes(lowerSearch);
      const children = node.children ? filterPeriodNodes(node.children, search) : [];
      if (matches || children.length > 0) {
        filtered.push({ ...node, children: children.length > 0 ? children : node.children });
      }
    });
    return filtered;
  };

  // Filter subsidiary nodes based on search
  const filterSubsidiaryNodes = (nodes: SubsidiaryNode[], search: string): SubsidiaryNode[] => {
    if (!search) return nodes;
    const lowerSearch = search.toLowerCase();
    const filtered: SubsidiaryNode[] = [];
    nodes.forEach((node) => {
      const matches = node.label.toLowerCase().includes(lowerSearch);
      const children = node.children ? filterSubsidiaryNodes(node.children, search) : [];
      if (matches || children.length > 0) {
        filtered.push({ ...node, children: children.length > 0 ? children : node.children });
      }
    });
    return filtered;
  };

  const togglePeriodExpanded = (id: string) => {
    setExpandedPeriods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSubsidiaryExpanded = (id: string) => {
    setExpandedSubsidiaries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handlePeriodToggle = (label: string, checked: boolean) => {
    setPendingPeriods((prev) => {
      if (checked) {
        // For trial balance, only allow one period selection
        return [label];
      } else {
        return prev.filter((p) => p !== label);
      }
    });
  };

  const handleSubsidiaryToggle = (label: string, checked: boolean) => {
    setPendingSubsidiaries((prev) => {
      if (checked) {
        // For trial balance, only allow one subsidiary selection
        return [label];
      } else {
        return prev.filter((s) => s !== label);
      }
    });
  };

  const handleRemovePeriod = (period: string) => {
    setPendingPeriods((prev) => prev.filter((p) => p !== period));
  };

  const handleRemoveSubsidiary = (sub: string) => {
    setPendingSubsidiaries((prev) => prev.filter((s) => s !== sub));
  };

  // Render hierarchical period tree
  const renderPeriodTree = (nodes: PeriodNode[], level = 0): JSX.Element[] => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedPeriods.has(node.id);
      const isSelected = pendingPeriods.includes(node.label);
      const isLeafNode = !hasChildren;

      return (
        <div key={node.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded",
              level > 0 && "ml-4",
              isLeafNode ? "hover:bg-gray-100 cursor-pointer" : "cursor-pointer"
            )}
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
            {isLeafNode ? (
              <label className="flex items-center gap-2 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    handlePeriodToggle(node.label, e.target.checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm">{node.label}</span>
              </label>
            ) : (
              <span className="text-sm flex-1">{node.label}</span>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-2">{renderPeriodTree(node.children!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  // Render hierarchical subsidiary tree
  const renderSubsidiaryTree = (nodes: SubsidiaryNode[], level = 0): JSX.Element[] => {
    return nodes.map((node) => {
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
            <div className="ml-2">{renderSubsidiaryTree(node.children!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const filteredPeriodNodes = useMemo(
    () => filterPeriodNodes(PERIOD_STRUCTURE, periodSearch),
    [periodSearch]
  );
  const filteredSubsidiaryNodes = useMemo(
    () => filterSubsidiaryNodes(SUBSIDIARY_STRUCTURE, subsidiarySearch),
    [subsidiarySearch]
  );

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "account",
        headerName: "Account",
        flex: 3,
        minWidth: 400,
        pinned: "left",
        sortable: true,
        filter: true,
        cellStyle: { textAlign: "left" },
        headerClass: "ag-header-cell-filtered",
      },
      {
        field: "debit",
        headerName: "Debit",
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: true,
        valueFormatter: (params) => {
          if (params.value === undefined || params.value === null) return "-";
          return formatCurrency(params.value);
        },
        cellStyle: { textAlign: "right" },
        headerComponentParams: {
          menuIcon: "faColumns",
        },
      },
      {
        field: "credit",
        headerName: "Credit",
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: true,
        valueFormatter: (params) => {
          if (params.value === undefined || params.value === null) return "-";
          return formatCurrency(params.value);
        },
        cellStyle: { textAlign: "right" },
        headerComponentParams: {
          menuIcon: "faColumns",
        },
      },
      {
        field: "total",
        headerName: "Total",
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: true,
        valueFormatter: (params) => formatCurrency(params.value),
        cellStyle: (params) => {
          const value = params.value as number;
          return {
            textAlign: "right",
            fontWeight: value < 0 ? "normal" : "normal",
          };
        },
      },
    ],
    [formatCurrency]
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  const handleApplyFilters = () => {
    setAsOfPeriods([...pendingPeriods]);
    setSubsidiaries([...pendingSubsidiaries]);
    setPeriodPopoverOpen(false);
    setSubsidiaryPopoverOpen(false);
  };

  const handleExportCSV = () => {
    if (gridRef.current?.api) {
      const periodStr = asOfPeriods[0]?.replace(" ", "-").toLowerCase() || "trial-balance";
      gridRef.current.api.exportDataAsCsv({
        fileName: `trial-balance-${periodStr}.csv`,
      });
    }
  };

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="reports/financials/trial-balance" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">Trial Balance</h1>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      {/* Global Filter Bar */}
      <div className="bg-slate-100 border-b px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">As Of:</label>
              <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 min-w-[200px] h-9 justify-start bg-white hover:bg-slate-50"
                  >
                    {pendingPeriods.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        {pendingPeriods.map((period) => (
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
                      renderPeriodTree(filteredPeriodNodes)
                    ) : (
                      <div className="px-2 py-4 text-sm text-gray-500 text-center">
                        No periods found
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

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
                      renderSubsidiaryTree(filteredSubsidiaryNodes)
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
          <div className="flex items-center gap-3">
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

      {/* AG Grid */}
      <div className="flex-1 p-6 overflow-auto" style={{ minHeight: 0 }}>
        {dataLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">Loading trial balance data...</div>
          </div>
        )}
        {dataError && (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-red-500">Error: {dataError}</div>
          </div>
        )}
        <div className="mb-2 text-sm font-medium text-slate-700">
          {subsidiaries[0] || "No subsidiary selected"}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden mt-2">
          <div
            className="ag-theme-alpine w-full overflow-x-auto"
            style={{
              height: "calc(100vh - 320px)",
              width: "100%",
              minHeight: "300px",
            }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              suppressRowClickSelection={true}
              enableCellTextSelection={true}
              ensureDomOrder={true}
              animateRows={true}
              rowHeight={52}
              headerHeight={48}
              enableRangeSelection={false}
              suppressMenuHide={true}
              suppressCellFocus={true}
              suppressHorizontalScroll={false}
              domLayout="normal"
              className="ag-theme-alpine"
              getRowStyle={(params) => {
                const rowIndex = params.node.rowIndex;
                if (rowIndex !== null && rowIndex !== undefined && rowIndex % 2 === 0) {
                  return { backgroundColor: "#fafafa" };
                }
                return { backgroundColor: "#ffffff" };
              }}
              onGridReady={(params) => {
                console.log("AG Grid Ready!");
              }}
              onFirstDataRendered={(params) => {
                // Size columns to fit the full width of the table
                setTimeout(() => {
                  params.api.sizeColumnsToFit();
                }, 100);
              }}
              onGridSizeChanged={(params) => {
                // Resize columns when grid size changes
                params.api.sizeColumnsToFit();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
