"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ColGroupDef,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
} from "ag-grid-community";
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
import {
  X,
  Download,
  Columns,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Breadcrumb from "@/components/layout/Breadcrumb";
import {
  getFinancialRowsForSubsidiaries,
  getPeriodStructure,
  getSubsidiaryStructure,
  getDefaultFilters,
  getWoltFinancialRows,
  type PeriodNode,
  type SubsidiaryNode,
  type FinancialRow,
} from "@/lib/balance-sheet-api";

// Load default data from API
const defaultFilters = getDefaultFilters();
const PERIOD_STRUCTURE = getPeriodStructure();
const SUBSIDIARY_STRUCTURE = getSubsidiaryStructure();
const DOORDASH_DATA = getFinancialRowsForSubsidiaries(["BetaFoods, Inc. (Consolidated)"]);
const WOLT_DATA = getWoltFinancialRows();

// Legacy MOCK_DATA - keeping for backward compatibility during transition
const MOCK_DATA: FinancialRow[] = [
  // Assets section
  {
    financialRow: "Assets",
    q1_2024: 8101.91,
    q2_2024: 16245.68,
    dollarDifference: 8143.77,
    differencePercent: 100.0,
    group: "assets",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Current assets",
    q1_2024: 5534.54,
    q2_2024: 13740.31,
    q3_2024: 14250.45,
    q4_2024: 15230.67,
    q1_2023: 4521.23,
    q2_2023: 4890.12,
    dollarDifference: 8205.77,
    differencePercent: 148.0,
    group: "assets",
    level: 1,
  },
  {
    financialRow: "Cash and cash equivalents",
    q1_2024: 3456.78,
    q2_2024: 9234.56,
    q3_2024: 9845.23,
    q4_2024: 10567.89,
    q1_2023: 2890.45,
    q2_2023: 3123.67,
    dollarDifference: 5777.78,
    differencePercent: 167.2,
    group: "assets",
    level: 2,
  },
  {
    financialRow: "Short-term investments",
    q1_2024: 1234.56,
    q2_2024: 2789.45,
    q3_2024: 2890.12,
    q4_2024: 3056.78,
    q1_2023: 987.34,
    q2_2023: 1123.45,
    dollarDifference: 1554.89,
    differencePercent: 125.9,
    group: "assets",
    level: 2,
  },
  {
    financialRow: "Accounts receivable",
    q1_2024: 543.21,
    q2_2024: 1023.45,
    q3_2024: 1089.67,
    q4_2024: 1156.89,
    q1_2023: 456.78,
    q2_2023: 523.45,
    dollarDifference: 480.24,
    differencePercent: 88.4,
    group: "assets",
    level: 2,
  },
  {
    financialRow: "Inventory",
    q1_2024: 298.99,
    q2_2024: 692.85,
    q3_2024: 725.43,
    q4_2024: 449.11,
    q1_2023: 186.66,
    q2_2023: 219.55,
    dollarDifference: 393.86,
    differencePercent: 131.6,
    group: "assets",
    level: 2,
  },
  {
    financialRow: "Long-term restricted cash",
    q1_2024: 0.21,
    q2_2024: 0.21,
    dollarDifference: 0.0,
    differencePercent: 0.0,
    group: "assets",
    level: 1,
  },
  {
    financialRow: "Long-term marketable securities",
    q1_2024: 646.27,
    q2_2024: 668.68,
    dollarDifference: 22.41,
    differencePercent: 3.0,
    group: "assets",
    level: 1,
  },
  {
    financialRow: "Operating lease right-of-use assets",
    q1_2024: 370.56,
    q2_2024: 303.52,
    dollarDifference: -67.05,
    differencePercent: -18.0,
    group: "assets",
    level: 1,
  },
  {
    financialRow: "Property and equipment, net",
    q1_2024: 650.29,
    q2_2024: 640.91,
    dollarDifference: -9.38,
    differencePercent: -1.0,
    group: "assets",
    level: 1,
  },
  {
    financialRow: "Intangible assets, net",
    q1_2024: 55.51,
    q2_2024: 51.48,
    dollarDifference: -4.03,
    differencePercent: -7.0,
    group: "assets",
    level: 1,
  },
  {
    financialRow: "Goodwill",
    q1_2024: 376.17,
    q2_2024: 376.17,
    dollarDifference: 0.0,
    differencePercent: 0.0,
    group: "assets",
    level: 1,
  },
  {
    financialRow: "Non-marketable equity securities",
    q1_2024: 45.67,
    q2_2024: 41.67,
    dollarDifference: -4.0,
    differencePercent: -8.0,
    group: "assets",
    level: 1,
  },
  {
    financialRow: "Other assets",
    q1_2024: 422.7,
    q2_2024: 422.74,
    dollarDifference: 0.04,
    differencePercent: 0.0,
    group: "assets",
    level: 1,
  },
  // Liabilities section
  {
    financialRow: "Liabilities, Redeemable Non-controlling Interests and...",
    q1_2024: 8101.91,
    q2_2024: 17114.62,
    dollarDifference: 9012.71,
    differencePercent: 111.0,
    group: "liabilities",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Current liabilities",
    q1_2024: 3353.61,
    q2_2024: 12377.87,
    q3_2024: 13145.23,
    q4_2024: 14230.56,
    q1_2023: 2890.45,
    q2_2023: 3123.67,
    dollarDifference: 9024.26,
    differencePercent: 269.0,
    group: "liabilities",
    level: 1,
  },
  {
    financialRow: "Accounts payable",
    q1_2024: 1256.78,
    q2_2024: 4567.89,
    q3_2024: 4890.12,
    q4_2024: 5234.56,
    q1_2023: 1089.23,
    q2_2023: 1234.56,
    dollarDifference: 3311.11,
    differencePercent: 263.5,
    group: "liabilities",
    level: 2,
  },
  {
    financialRow: "Accrued expenses",
    q1_2024: 987.65,
    q2_2024: 3456.78,
    q3_2024: 3678.9,
    q4_2024: 3890.12,
    q1_2023: 856.78,
    q2_2023: 923.45,
    dollarDifference: 2469.13,
    differencePercent: 250.2,
    group: "liabilities",
    level: 2,
  },
  {
    financialRow: "Short-term debt",
    q1_2024: 567.89,
    q2_2024: 2134.56,
    q3_2024: 2234.67,
    q4_2024: 2345.78,
    q1_2023: 456.78,
    q2_2023: 489.12,
    dollarDifference: 1566.67,
    differencePercent: 275.9,
    group: "liabilities",
    level: 2,
  },
  {
    financialRow: "Deferred revenue",
    q1_2024: 541.29,
    q2_2024: 2218.64,
    q3_2024: 2341.54,
    q4_2024: 2760.1,
    q1_2023: 488.66,
    q2_2023: 476.54,
    dollarDifference: 1677.35,
    differencePercent: 309.8,
    group: "liabilities",
    level: 2,
  },
  {
    financialRow: "Operating lease liabilities NCL",
    q1_2024: 409.24,
    q2_2024: 409.24,
    q3_2024: 398.56,
    q4_2024: 387.89,
    q1_2023: 412.45,
    q2_2023: 415.67,
    dollarDifference: 0.0,
    differencePercent: 0.0,
    group: "liabilities",
    level: 1,
  },
  {
    financialRow: "Long-term debt",
    q1_2024: 3456.78,
    q2_2024: 3456.78,
    q3_2024: 3234.56,
    q4_2024: 3012.34,
    q1_2023: 3567.89,
    q2_2023: 3523.45,
    dollarDifference: 0.0,
    differencePercent: 0.0,
    group: "liabilities",
    level: 1,
  },
  {
    financialRow: "Other long-term liabilities",
    q1_2024: 234.56,
    q2_2024: 456.78,
    q3_2024: 489.12,
    q4_2024: 512.34,
    q1_2023: 198.76,
    q2_2023: 223.45,
    dollarDifference: 222.22,
    differencePercent: 94.8,
    group: "liabilities",
    level: 1,
  },
  // Equity section
  {
    financialRow: "Stockholders' Equity",
    q1_2024: 0.0,
    q2_2024: 1130.94,
    q3_2024: 1105.22,
    q4_2024: 1014.11,
    q1_2023: 5211.91,
    q2_2023: 4972.34,
    dollarDifference: 1130.94,
    differencePercent: 100.0,
    group: "equity",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Common stock",
    q1_2024: 123.45,
    q2_2024: 123.45,
    q3_2024: 123.45,
    q4_2024: 123.45,
    q1_2023: 123.45,
    q2_2023: 123.45,
    dollarDifference: 0.0,
    differencePercent: 0.0,
    group: "equity",
    level: 1,
  },
  {
    financialRow: "Additional paid-in capital",
    q1_2024: 12345.67,
    q2_2024: 12345.67,
    q3_2024: 12456.78,
    q4_2024: 12567.89,
    q1_2023: 12234.56,
    q2_2023: 12234.56,
    dollarDifference: 0.0,
    differencePercent: 0.0,
    group: "equity",
    level: 1,
  },
  {
    financialRow: "Retained earnings (accumulated deficit)",
    q1_2024: -12345.67,
    q2_2024: -11214.73,
    q3_2024: -11475.01,
    q4_2024: -12477.23,
    q1_2023: -1234.56,
    q2_2023: -385.67,
    dollarDifference: 1130.94,
    differencePercent: -9.2,
    group: "equity",
    level: 1,
  },
  {
    financialRow: "Accumulated other comprehensive income (loss)",
    q1_2024: 123.45,
    q2_2024: 123.45,
    q3_2024: 0.0,
    q4_2024: -200.0,
    q1_2023: 87.46,
    q2_2023: -0.0,
    dollarDifference: 0.0,
    differencePercent: 0.0,
    group: "equity",
    level: 1,
  },
];

// Note: Legacy hardcoded MOCK_DATA above is kept for backward compatibility
// WOLT_DATA is now loaded from API via getWoltFinancialRows() above
// PERIOD_STRUCTURE and SUBSIDIARY_STRUCTURE are now loaded from API
// via getPeriodStructure() and getSubsidiaryStructure() above

// Helper to get all leaf nodes (selectable items)
const getLeafNodes = (
  nodes: PeriodNode[] | SubsidiaryNode[],
  type: "period" | "subsidiary"
): string[] => {
  const leaves: string[] = [];
  nodes.forEach((node) => {
    if (!node.children || node.children.length === 0) {
      leaves.push(type === "period" ? (node as PeriodNode).label : (node as SubsidiaryNode).label);
    } else {
      leaves.push(...getLeafNodes(node.children, type));
    }
  });
  return leaves;
};

export default function BalanceSheetPage() {
  const gridRef = useRef<AgGridReact>(null);
  // Use default filters from API
  const [view, setView] = useState<"consolidated" | "comparative" | "trended">(
    defaultFilters.defaultView
  );
  const [asOfPeriods, setAsOfPeriods] = useState<string[]>(defaultFilters.defaultPeriods);
  const [subsidiaries, setSubsidiaries] = useState<string[]>(defaultFilters.defaultSubsidiaries);
  const [displayMode, setDisplayMode] = useState<"millions" | "full">(
    defaultFilters.defaultDisplayMode
  );

  // Pending filter states (before clicking Go)
  const [pendingPeriods, setPendingPeriods] = useState<string[]>(defaultFilters.defaultPeriods);
  const [pendingSubsidiaries, setPendingSubsidiaries] = useState<string[]>(
    defaultFilters.defaultSubsidiaries
  );
  const [pendingView, setPendingView] = useState<"consolidated" | "comparative" | "trended">(
    defaultFilters.defaultView
  );
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
          return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
        }
        // Convert from millions to full amount
        const valueInFull = value * 1000000;
        return `$${valueInFull.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    [displayMode]
  );

  const formatPercent = useMemo(
    () =>
      (value: number | undefined): string => {
        if (value === undefined || value === null) return "-";
        return `${value.toFixed(2)}%`;
      },
    []
  );

  const getRowClass = (params: any) => {
    if (params.data.level === 0) {
      return "bg-blue-50 font-bold";
    }
    return "";
  };

  const financialRowRenderer = (params: ICellRendererParams) => {
    const level = params.data.level || 0;
    const indent = level * 20;
    const isParent = level === 0;

    return (
      <div className="flex items-center gap-2 h-full" style={{ paddingLeft: `${indent}px` }}>
        {isParent && <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />}
        {!isParent && level > 0 && <div className="w-4 flex-shrink-0" />}
        <span
          className={cn(
            isParent ? "font-bold" : "font-normal",
            isParent ? "text-gray-900" : "text-gray-700"
          )}
        >
          {params.value}
        </span>
      </div>
    );
  };

  const columnDefs: (ColDef | ColGroupDef)[] = useMemo(() => {
    const cols: (ColDef | ColGroupDef)[] = [
      {
        field: "financialRow",
        headerName: "Financial Row",
        pinned: "left",
        width: 400,
        suppressSizeToFit: true,
        cellRenderer: financialRowRenderer,
        cellStyle: { display: "flex", alignItems: "center" },
      },
    ];

    // Helper function to map period (month/quarter/year) to field name
    const getPeriodField = (period: string): string => {
      // Parse quarter format: "Q1 2024" -> "q1_2024"
      const quarterMatch = period.match(/Q(\d)\s+(\d{4})/);
      if (quarterMatch) {
        const [, quarter, year] = quarterMatch;
        return `q${quarter}_${year}`;
      }

      // Parse month format: "Jan 2024" -> "q1_2024" (map to quarter)
      const monthMatch = period.match(
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/
      );
      if (monthMatch) {
        const [, month, year] = monthMatch;
        const monthToQuarter: { [key: string]: string } = {
          Jan: "1",
          Feb: "1",
          Mar: "1",
          Apr: "2",
          May: "2",
          Jun: "2",
          Jul: "3",
          Aug: "3",
          Sep: "3",
          Oct: "4",
          Nov: "4",
          Dec: "4",
        };
        const quarter = monthToQuarter[month] || "4";
        return `q${quarter}_${year}`;
      }

      // Parse year format: "FY 2024" -> "q4_2024" (map to Q4)
      const yearMatch = period.match(/FY\s+(\d{4})/);
      if (yearMatch) {
        const [, year] = yearMatch;
        return `q4_${year}`;
      }

      return "";
    };

    // Helper function to get Averra period field name (same mapping)
    const getWoltPeriodField = (period: string): string => {
      return getPeriodField(period);
    };

    // Create grouped columns for each subsidiary
    subsidiaries.forEach((subsidiary) => {
      const isDoorDash = subsidiary === "BetaFoods, Inc. (Consolidated)";
      const isWolt = subsidiary === "Averra Oy (Consolidated)";
      const isLuxBite = subsidiary === "LuxBite, Inc. (Consolidated)";

      if (!isDoorDash && !isWolt && !isLuxBite) return;

      const childrenCols: ColDef[] = [];

      // Add period columns
      asOfPeriods.forEach((period) => {
        childrenCols.push({
          headerName: period,
          width: 188,
          suppressSizeToFit: true,
          field: isWolt ? `wolt_${getWoltPeriodField(period)}` : getPeriodField(period),
          cellRenderer: (params: ICellRendererParams) => {
            if (isWolt) {
              const woltData = WOLT_DATA.find((d) => d.financialRow === params.data.financialRow);
              const field = getWoltPeriodField(period);
              const value = woltData?.[field as keyof FinancialRow] as number | undefined;
              return <div className="text-right">{formatCurrency(value)}</div>;
            } else {
              return <div className="text-right">{formatCurrency(params.value)}</div>;
            }
          },
          cellStyle: { textAlign: "right" },
        });
      });

      // Add difference columns if multiple periods are selected
      if (asOfPeriods.length >= 2) {
        childrenCols.push(
          {
            headerName: "$ Difference",
            width: 188,
            suppressSizeToFit: true,
            field: isWolt ? "wolt_dollarDifference" : "dollarDifference",
            cellRenderer: (params: ICellRendererParams) => {
              if (isWolt) {
                const woltData = WOLT_DATA.find((d) => d.financialRow === params.data.financialRow);
                const value = woltData?.dollarDifference;
                if (value === undefined || value === null) return "-";
                const isNegative = value < 0;
                return (
                  <div className={cn("text-right", isNegative && "text-red-600")}>
                    {formatCurrency(value)}
                  </div>
                );
              } else {
                const value = params.value;
                if (value === undefined || value === null) return "-";
                const isNegative = value < 0;
                return (
                  <div className={cn("text-right", isNegative && "text-red-600")}>
                    {formatCurrency(value)}
                  </div>
                );
              }
            },
            cellStyle: { textAlign: "right" },
          },
          {
            headerName: "Difference %",
            width: 188,
            suppressSizeToFit: true,
            field: isWolt ? "wolt_differencePercent" : "differencePercent",
            cellRenderer: (params: ICellRendererParams) => {
              if (isWolt) {
                const woltData = WOLT_DATA.find((d) => d.financialRow === params.data.financialRow);
                const value = woltData?.differencePercent;
                if (value === undefined || value === null) return "-";
                const isNegative = value < 0;
                return (
                  <div className={cn("text-right", isNegative && "text-red-600")}>
                    {formatPercent(value)}
                  </div>
                );
              } else {
                const value = params.value;
                if (value === undefined || value === null) return "-";
                const isNegative = value < 0;
                return (
                  <div className={cn("text-right", isNegative && "text-red-600")}>
                    {formatPercent(value)}
                  </div>
                );
              }
            },
            cellStyle: { textAlign: "right" },
          }
        );
      }

      // Add parent column group with subsidiary name
      if (childrenCols.length > 0) {
        cols.push({
          headerName: subsidiary,
          children: childrenCols,
          headerClass: "ag-header-group-cell text-center",
          headerStyle: { textAlign: "center", justifyContent: "center" },
        } as ColGroupDef);
      }
    });

    return cols;
  }, [subsidiaries, asOfPeriods, formatCurrency, formatPercent]);

  const handleRemovePeriod = (period: string) => {
    setPendingPeriods((prev) => prev.filter((p) => p !== period));
  };

  const handleRemoveSubsidiary = (subsidiary: string) => {
    setPendingSubsidiaries((prev) => prev.filter((s) => s !== subsidiary));
  };

  const togglePeriodExpanded = (id: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSubsidiaryExpanded = (id: string) => {
    setExpandedSubsidiaries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePeriodToggle = (period: string, checked: boolean) => {
    if (checked) {
      // Determine max selections based on view mode
      const maxSelections = pendingView === "consolidated" ? 1 : 2; // Comparative and Trended both allow 2

      // Check if we've reached the limit
      if (pendingPeriods.length >= maxSelections) {
        // For consolidated, replace the existing selection
        if (pendingView === "consolidated") {
          setPendingPeriods([period]);
          return;
        }
        // For comparative and trended, don't allow more than 2
        if (
          (pendingView === "comparative" || pendingView === "trended") &&
          pendingPeriods.length >= 2
        ) {
          return;
        }
      }

      setPendingPeriods((prev) => {
        // Prevent duplicates
        if (prev.includes(period)) {
          return prev;
        }
        return [...prev, period];
      });
    } else {
      setPendingPeriods((prev) => prev.filter((p) => p !== period));
    }
  };

  const handleSubsidiaryToggle = (subsidiary: string, checked: boolean) => {
    if (checked) {
      setPendingSubsidiaries((prev) => [...prev, subsidiary]);
    } else {
      setPendingSubsidiaries((prev) => prev.filter((s) => s !== subsidiary));
    }
  };

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

  // Render hierarchical period tree
  const renderPeriodTree = (nodes: PeriodNode[], level = 0): JSX.Element[] => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedPeriods.has(node.id);
      const isSelected = pendingPeriods.includes(node.label);
      const isLeafNode = !hasChildren;

      // Determine max selections based on view mode
      const maxSelections = pendingView === "consolidated" ? 1 : 2; // Comparative and Trended both allow 2
      const isLimitReached = pendingPeriods.length >= maxSelections;

      // Consolidated: only leaf nodes (months) can be selected
      // Comparative and Trended: all nodes (years, quarters, months) can be selected
      const canSelect =
        pendingView === "consolidated"
          ? isLeafNode && (!isLimitReached || isSelected)
          : !isLimitReached || isSelected;

      return (
        <div key={node.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded",
              level > 0 && "ml-4",
              pendingView === "comparative" || pendingView === "trended" || isLeafNode
                ? "hover:bg-gray-100 cursor-pointer"
                : "cursor-pointer",
              !canSelect &&
                (pendingView === "comparative" || pendingView === "trended" || isLeafNode) &&
                "opacity-50"
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
            {/* Consolidated view: only show checkboxes for leaf nodes (months) */}
            {/* Comparative and Trended views: show checkboxes for all nodes (years, quarters, months) */}
            {pendingView === "comparative" || pendingView === "trended" || isLeafNode ? (
              <label
                className={cn(
                  "flex items-center gap-2 flex-1",
                  canSelect ? "cursor-pointer" : "cursor-not-allowed"
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!canSelect}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (canSelect) {
                      handlePeriodToggle(node.label, e.target.checked);
                    }
                  }}
                  onClick={(e) => {
                    if (!canSelect) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                    e.stopPropagation();
                  }}
                  className={cn(
                    "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500",
                    !canSelect && "opacity-50 cursor-not-allowed"
                  )}
                />
                <span className={cn("text-sm", !canSelect && "opacity-50")}>{node.label}</span>
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

  const handleApplyFilters = () => {
    setAsOfPeriods([...pendingPeriods]);
    setSubsidiaries([...pendingSubsidiaries]);
    setView(pendingView);
    setPeriodPopoverOpen(false);
    setSubsidiaryPopoverOpen(false);
  };

  // Filter the data based on selected filters (View, As Of, Subsidiary)
  const filteredData = useMemo(() => {
    let dataSource: FinancialRow[] = [];

    // Determine which data source to use based on subsidiary selection
    if (subsidiaries.length === 0) {
      // No subsidiary selected, show empty or default
      return [];
    }

    // Use API data instead of hardcoded MOCK_DATA
    // If only BetaFoods is selected, use DOORDASH_DATA from API
    if (
      subsidiaries.includes("BetaFoods, Inc. (Consolidated)") &&
      !subsidiaries.includes("Averra Oy (Consolidated)")
    ) {
      dataSource = [...DOORDASH_DATA];
    }
    // If only Averra is selected, use WOLT_DATA from API
    else if (
      subsidiaries.includes("Averra Oy (Consolidated)") &&
      !subsidiaries.includes("BetaFoods, Inc. (Consolidated)")
    ) {
      dataSource = [...WOLT_DATA];
    }
    // If both are selected (comparative view), use DOORDASH_DATA as primary
    // Averra data will be rendered in separate columns via column definitions
    else {
      dataSource = [...DOORDASH_DATA];
    }

    // Filter based on As Of periods - if only one period is selected, filter the data
    // (This would affect which columns show, but we'll keep all rows)
    // For now, we'll return all data and let columnDefs handle period filtering

    return dataSource;
  }, [subsidiaries, asOfPeriods]);

  // Sync pending states when applied filters change
  useEffect(() => {
    setPendingPeriods([...asOfPeriods]);
    setPendingSubsidiaries([...subsidiaries]);
    setPendingView(view);
  }, [asOfPeriods, subsidiaries, view]);

  // Adjust period selections when view mode changes
  useEffect(() => {
    const maxSelections = pendingView === "consolidated" ? 1 : 2; // Comparative and Trended both allow 2
    if (pendingPeriods.length > maxSelections) {
      // If consolidated, keep only the first selection
      if (pendingView === "consolidated") {
        setPendingPeriods((prev) => prev.slice(0, 1));
      }
      // If comparative or trended, keep only the first two selections
      else if (pendingView === "comparative" || pendingView === "trended") {
        setPendingPeriods((prev) => prev.slice(0, 2));
      }
    }
  }, [pendingView, pendingPeriods.length]);

  // Update grid when filtered data changes
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("rowData", filteredData);
    }
  }, [filteredData]);

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="reports/sec/balance-sheet" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">Balance Sheet</h1>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      {/* Global Filter Bar */}
      <div className="bg-slate-100 border-b px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">View:</label>
              <Select
                value={pendingView}
                onValueChange={(value: string) =>
                  setPendingView(value as "consolidated" | "comparative" | "trended")
                }
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

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                Period:
              </label>
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
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
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
              rowData={filteredData}
              columnDefs={columnDefs}
              getRowClass={getRowClass}
              defaultColDef={{
                resizable: true,
                sortable: true,
                filter: true,
              }}
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
                console.log("Row count:", params.api.getDisplayedRowCount());
                console.log("Data length:", filteredData.length);
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
